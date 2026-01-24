//375px 未満は JS で viewport を固定する
// =============================
(function () {
  // <meta name="viewport"> タグを取得（ビューポートの設定を変更するため）
  const viewport = document.querySelector('meta[name="viewport"]');

  // 画面幅に応じて viewport の content 属性を切り替える関数
  function switchViewport() {
    // 読み取り操作を先に実行（リフローを最小化）
    // window.innerWidthを使用（outerWidthよりリフローを引き起こしにくい）
    const innerWidth = window.innerWidth;
    
    // requestAnimationFrameで書き込み操作をバッチ化
    requestAnimationFrame(() => {
      const value =
        innerWidth > 375
          ? // 375px より広い場合は、通常のレスポンシブ表示（端末幅に合わせる）
            "width=device-width,initial-scale=1"
          : // 375px 以下の狭い画面では、幅を固定（375px に強制）
            "width=375";

      // すでに設定されている content と異なる場合のみ変更を加える
      if (viewport.getAttribute("content") !== value) {
        viewport.setAttribute("content", value);
      }
    });
  }

  // ウィンドウサイズが変更されたときに switchViewport を実行する
  // リサイズイベントは頻繁に発生するため、throttleを適用
  let resizeTimer;
  addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(switchViewport, 100);
  }, false);

  // 初回読み込み時にも現在の幅に応じて viewport を設定する
  switchViewport();
})();

// =============================
// ハンバーガーメニュー
// =============================
// メニューを開いている時、背景が動かないように固定する

const CLASS = "is-checked";
let savedScrollY = 0; // スクロール位置を保存

// 背景を固定/解除する関数
const backgroundFix = (isOpen) => {
  const scrollingElement =
    "scrollingElement" in document
      ? document.scrollingElement
      : document.documentElement;

  if (isOpen) {
    // 現在のスクロール位置を保存
    savedScrollY = scrollingElement.scrollTop;
    // CSS変数にスクロール位置を設定（マイナス値）
    document.body.style.setProperty("--scroll-y", `${savedScrollY * -1}px`);
    document.body.classList.add("is-menu-open");
  } else {
    document.body.classList.remove("is-menu-open");
    // スクロール位置を元に戻す
    window.scrollTo(0, savedScrollY);
    document.body.style.removeProperty("--scroll-y");
  }
};

const $hamburger = jQuery("#js-drawer-button");
const $menu = jQuery("#js-drawer-content");
const $focusTrap = jQuery("#js-focus-trap");
const $firstLink = jQuery(".js-header-link").first();
const $logoSecondary = jQuery(".header__logo-secondary a");

const closeMenu = () => {
  // 読み取り操作を先に実行（リフローを最小化）
  const hamburgerEl = $hamburger[0];
  
  // 書き込み操作をrequestAnimationFrameでバッチ化
  requestAnimationFrame(() => {
    $hamburger
      .removeClass(CLASS)
      .attr({
        "aria-expanded": "false",
        "aria-haspopup": "menu",
      });
    $menu.removeClass(CLASS);
    backgroundFix(false);
    
    // フォーカス操作は最後に実行
    requestAnimationFrame(() => {
      hamburgerEl.focus();
    });
  });
};

const openMenu = () => {
  // 読み取り操作を先に実行
  const logoSecondaryEl = $logoSecondary.length ? $logoSecondary[0] : null;
  const hamburgerEl = $hamburger[0];
  
  // 書き込み操作をrequestAnimationFrameでバッチ化
  requestAnimationFrame(() => {
    $hamburger
      .addClass(CLASS)
      .attr("aria-expanded", "true")
      .removeAttr("aria-haspopup");
    $menu.addClass(CLASS);
    backgroundFix(true);
    
    // フォーカス操作は最後に実行
    requestAnimationFrame(() => {
      if (logoSecondaryEl) {
        logoSecondaryEl.focus();
      } else {
        hamburgerEl.focus();
      }
    });
  });
};

$hamburger.on("click", function (e) {
  e.preventDefault();
  // 読み取り操作を先に実行
  const isOpen = $hamburger.hasClass(CLASS);
  // 書き込み操作はrequestAnimationFrameで実行
  requestAnimationFrame(() => {
    isOpen ? closeMenu() : openMenu();
  });
});

jQuery(window).on("keydown", (e) => {
  // 読み取り操作を先に実行
  const isOpen = $hamburger.hasClass(CLASS);
  if (e.key === "Escape" && isOpen) {
    // 書き込み操作はrequestAnimationFrameで実行
    requestAnimationFrame(() => {
      closeMenu();
    });
  }
});

// フォーカストラップ：メニュー内でキーボード操作を閉じ込める
$focusTrap.on("focus", () => {
  $hamburger.focus();
});

// ページ内リンクをクリックした時にメニューを閉じる
jQuery('#js-drawer-content a[href^="#"]').on("click", closeMenu);

// =============================
// ページネーション
// =============================
// 【このセクション全体の役割】
// ニュース一覧のページネーション機能を実装しています。
// 以下の機能を提供します：
// - ページ番号ボタンの生成と表示
// - 前/次ボタンによるページ移動
// - URLパラメータによるページ指定（?page=2など）
// - キーボード操作によるアクセシビリティ対応
// - ページ切り替え時のフォーカス管理
//
// jQueryの$(function() {})は、DOMが読み込まれた後に実行される関数
// ページが完全に読み込まれる前に実行されることを防ぐ
$(function () {
  // =============================
  // DOM要素の取得
  // =============================
  // セレクタ: ".js-pagination" - ページネーションのコンテナ要素（ul要素）を取得
  // $()はjQueryオブジェクトを返す。変数名の$はjQueryオブジェクトであることを示す
  const $pagination = $(".js-pagination");

  // セレクタ: ".js-news-list" - ニュースリストのコンテナ要素（ul要素）を取得
  const $newsList = $(".js-news-list");

  // .lengthプロパティ: jQueryオブジェクトに含まれる要素の数を返す
  // 要素が存在しない場合（0件の場合）、早期リターンで処理を終了
  // これにより、ページネーションが存在しないページでエラーが発生することを防ぐ
  if (!$pagination.length || !$newsList.length) return;

  // =============================
  // 定数定義（CONFIGオブジェクト）
  // =============================
  // オブジェクト: 関連する設定値をまとめて管理するためのデータ構造
  // プロパティ: オブジェクト内の値（キーと値のペア）
  const CONFIG = {
    // ITEMS_PER_PAGE: 1ページあたりに表示するニュースアイテムの数
    ITEMS_PER_PAGE: 5,

    // ACTIVE_CLASS: 現在のページを示すCSSクラス名（文字列）
    // このクラスが付与された要素は、現在選択されているページを視覚的に示す
    ACTIVE_CLASS: "is-pagination--active",

    // VISIBLE_CLASS: 表示するニュースアイテムに付与するCSSクラス名（文字列）
    // このクラスが付与された要素だけが表示される（CSSで制御）
    VISIBLE_CLASS: "is-on",
  };

  // =============================
  // ニュースデータ（遅延レンダリング用）
  // =============================
  // HTMLには最初の5件だけ含まれ、残りはJavaScriptで動的に生成
  // 全25件のニュースデータを定義
  const newsData = [
    { date: "2022-12-15", title: "年末年始について" },
    { date: "2022-12-10", title: "チームマーケティングプランでフル活用。マーケティング部長に聞いた e-toraの活用方法とは。チームマーケティングプランでフル活用。マーケティング部長に聞いたe-toraの活用方法とは。" },
    { date: "2022-09-01", title: "商談効率アップ！セミナーを開催します。" },
    { date: "2022-08-01", title: "営業時間の変更について" },
    { date: "2022-06-01", title: "e-tiga出張無料体験会を実施致します。" },
    { date: "2022-12-15", title: "年末年始について" },
    { date: "2022-12-15", title: "年末年始について" },
    { date: "2022-12-15", title: "年末年始について" },
    { date: "2022-12-15", title: "年末年始について" },
    { date: "2022-12-15", title: "年末年始について" },
    { date: "2022-08-01", title: "営業時間の変更について" },
    { date: "2022-08-01", title: "営業時間の変更について" },
    { date: "2022-08-01", title: "営業時間の変更について" },
    { date: "2022-08-01", title: "営業時間の変更について" },
    { date: "2022-08-01", title: "営業時間の変更について" },
    { date: "2022-09-01", title: "商談効率アップ！セミナーを開催します。" },
    { date: "2022-09-01", title: "商談効率アップ！セミナーを開催します。" },
    { date: "2022-09-01", title: "商談効率アップ！セミナーを開催します。" },
    { date: "2022-09-01", title: "商談効率アップ！セミナーを開催します。" },
    { date: "2022-09-01", title: "商談効率アップ！セミナーを開催します。" },
    { date: "2022-06-01", title: "e-tiga出張無料体験会を実施致します。" },
    { date: "2022-06-01", title: "e-tiga出張無料体験会を実施致します。" },
    { date: "2022-06-01", title: "e-tiga出張無料体験会を実施致します。" },
    { date: "2022-06-01", title: "e-tiga出張無料体験会を実施致します。" },
    { date: "2022-06-01", title: "e-tiga出張無料体験会を実施致します。" },
  ];

  // =============================
  // 状態管理（変数の定義）
  // =============================
  // let: 再代入可能な変数宣言
  // currentPage: 現在表示しているページ番号（数値）
  // 初期値は1（最初のページ）
  let currentPage = 1;

  // ニュースアイテムの総数（データ配列の長さ）
  const totalItems = newsData.length;

  // Math.ceil()メソッド: 数値を切り上げる（例: 24件 ÷ 5件 = 4.8 → 5ページ）
  // 総ページ数 = ニュースアイテムの総数 ÷ 1ページあたりの表示件数（切り上げ）
  const totalPages = Math.ceil(totalItems / CONFIG.ITEMS_PER_PAGE);

  // =============================
  // 関数: getInitialPage()
  // =============================
  // 【この関数の役割】
  // URLパラメータ（?page=2など）から初期ページ番号を取得します。
  // ページ読み込み時に、URLにページ番号が含まれている場合はそのページから表示し、
  // 含まれていない場合や無効な値の場合は1ページ目から表示します。
  //
  // 引数: なし
  // 戻り値: ページ番号（数値）
  //
  // 【アロー関数の構文について】
  // const getInitialPage = () => { ... }
  //   ↑              ↑   ↑  ↑
  //   │              │   │  └─ 関数の本体（処理内容）を囲む波括弧
  //   │              │   └─ アロー関数を表す記号（=>）
  //   │              └─ 引数を囲む丸括弧（引数がない場合は空の()）
  //   └─ 定数変数として関数を定義（再代入不可）
  //
  // 通常の関数宣言との違い:
  //   通常: function getInitialPage() { ... }
  //   アロー: const getInitialPage = () => { ... }
  // どちらも同じように使えるが、アロー関数はより簡潔に書ける
  const getInitialPage = () => {
    // window.location.search: 現在のページのURLの「?」以降の部分（クエリ文字列）を取得
    // 例: URLが "https://example.com/news?page=2&sort=date" の場合
    //     window.location.search は "?page=2&sort=date" という文字列を返す
    // new URLSearchParams(): クエリ文字列を解析して、パラメータを簡単に取得・操作できるオブジェクトを作成
    // 例: new URLSearchParams("?page=2&sort=date") で作成すると、
    //     urlParams.get("page") で "2" を取得できる
    //     urlParams.get("sort") で "date" を取得できる
    const urlParams = new URLSearchParams(window.location.search);

    // .get()メソッド: 指定したキー（"page"）の値を取得
    // 存在しない場合はnullを返す
    const pageParam = urlParams.get("page");

    // ページパラメータが存在しない場合、1ページ目を返す
    if (!pageParam) return 1;

    // parseInt()関数: 文字列を整数に変換
    // 第1引数: 変換する文字列
    // 第2引数: 基数（10進数）
    const page = parseInt(pageParam, 10);

    // isNaN()関数: 値が数値でない場合にtrueを返す
    // 無効な値（数値以外、0未満、総ページ数を超える値）の場合は1を返す
    if (isNaN(page) || page < 1) return 1;
    if (page > totalPages) return totalPages;

    // 有効なページ番号を返す
    return page;
  };

  // 初期ページ番号を取得してcurrentPage変数に代入
  //
  // 【このコードの役割】
  // 1. getInitialPage()関数を呼び出す
  //    → URLパラメータ（?page=2など）からページ番号を取得する
  //    → パラメータがない場合や無効な場合は1を返す
  // 2. 取得したページ番号をcurrentPage変数に代入する
  //    → これにより、URLに?page=2が含まれている場合は2ページ目から表示される
  //    → パラメータがない場合は、初期値の1ページ目がそのまま使われる
  //
  // 例: URLが "https://example.com/news?page=3" の場合
  //     getInitialPage() は 3 を返す
  //     currentPage = 3 となり、3ページ目から表示される
  currentPage = getInitialPage();

  // =============================
  // 関数: createPageNumber()
  // =============================
  // 【この関数の役割】
  // ページ番号のHTML要素（li要素）を生成します。
  // 現在のページの場合は特別なスタイル（ACTIVE_CLASS）を付けた要素を生成し、
  // 他のページの場合はクリック可能なリンク（aタグ）を含む要素を生成します。
  //
  // 引数:
  //   - pageNum: ページ番号（数値）
  //   - isActive: 現在のページかどうか（真偽値）
  // 戻り値: 生成されたjQueryオブジェクト（li要素）
  //
  // 【引数（pageNum, isActive）の出所について】
  // この関数は375行目で呼び出されます:
  //   createPageNumber(i, i === currentPage)
  //     ↑           ↑
  //     │           └─ isActive: ループ変数iが現在のページ(currentPage)と等しいかどうか
  //     │                         等しい場合はtrue、違う場合はfalse
  //     └─ pageNum: forループの変数i（1, 2, 3, ... と順番に増えるページ番号）
  //
  // 【isActiveの出所をもっと詳しく】
  //
  // 1. currentPage変数: 現在表示しているページ番号が入っている（例: 3）
  //    この値は218行目で定義され、286行目でURLパラメータから取得した値が代入される
  //
  // 2. forループの変数i: 1から総ページ数まで順番に増える（1, 2, 3, 4, ...）
  //
  // 3. i === currentPage: これは「比較演算子」で、2つの値が等しいかどうかを判定する
  //    - 等しい場合: true（真偽値）を返す
  //    - 等しくない場合: false（真偽値）を返す
  //
  // 4. この比較結果（true または false）が isActive として関数に渡される
  //
  // 【具体例: 現在3ページ目を表示している場合（currentPage = 3）】
  //
  // ループ1回目: i = 1
  //   i === currentPage  →  1 === 3  →  false（1と3は違う）
  //   createPageNumber(1, false)  ← isActive = false（1ページ目は現在のページではない）
  //
  // ループ2回目: i = 2
  //   i === currentPage  →  2 === 3  →  false（2と3は違う）
  //   createPageNumber(2, false)  ← isActive = false（2ページ目は現在のページではない）
  //
  // ループ3回目: i = 3
  //   i === currentPage  →  3 === 3  →  true（3と3は同じ！）
  //   createPageNumber(3, true)  ← isActive = true（3ページ目は現在のページ！）
  //
  // ループ4回目: i = 4
  //   i === currentPage  →  4 === 3  →  false（4と3は違う）
  //   createPageNumber(4, false)  ← isActive = false（4ページ目は現在のページではない）
  //
  // つまり、isActiveは「今ループで処理しているページ番号(i)が、現在表示中のページ(currentPage)と
  // 同じかどうか」を判定した結果（true/false）です。
  const createPageNumber = (pageNum, isActive) => {
    // 現在のページの場合
    if (isActive) {
      // $()関数: HTML文字列からjQueryオブジェクトを生成
      // テンプレートリテラル（バッククォート）: 変数を文字列に埋め込む
      // ${}: 変数や式の値を文字列に展開
      // tabindex="-1": キーボード操作でフォーカスが当たらないようにする（現在のページをスキップ）
      return $(`
        <li class="pagination__item ${CONFIG.ACTIVE_CLASS}" data-page="${pageNum}">
          <a class="pagination__number" href="?page=${pageNum}" aria-current="page" tabindex="-1">${pageNum}</a>
        </li>
      `);
    } else {
      // 他のページの場合（クリック可能なリンクとして生成）
      return $(`
        <li class="pagination__item" data-page="${pageNum}">
          <a class="pagination__link js-pagination-link" href="#" data-page="${pageNum}" aria-label="${pageNum}ページ目へ移動">
            <span class="pagination__number">${pageNum}</span>
          </a>
        </li>
      `);
    }
  };

  // =============================
  // 関数: createFirstButton()
  // =============================
  // 【この関数の役割】
  // 「一番最初に戻るボタン」のHTML要素を生成します。
  //
  // 引数: なし
  // 戻り値: 生成されたjQueryオブジェクト（li要素）
  const createFirstButton = () => {
    return $(`
      <li class="pagination__item">
        <a
          class="pagination__link js-pagination-first"
          href="#"
          aria-label="一番最初のページへ"
        >
          <svg
            width="16"
            height="12"
            viewBox="0 0 16 12"
            fill="none"
            stroke="#828282"
            stroke-width="1.5"
            stroke-linecap="round"
          >
            <defs>
              <path
                id="arrow"
                d="M8.29034 0.75L1.29034 5.75L8.29034 10.75"
              />
            </defs>
            <use href="#arrow" />
            <use href="#arrow" transform="translate(6 0)" />
          </svg>
        </a>
      </li>
    `);
  };

  // =============================
  // 関数: createPrevButton()
  // =============================
  // 【この関数の役割】
  // 「前のページボタン」のHTML要素を生成します。
  //
  // 引数: なし
  // 戻り値: 生成されたjQueryオブジェクト（li要素）
  const createPrevButton = () => {
    return $(`
      <li class="pagination__item">
        <a
          class="pagination__link js-pagination-prev"
          href="#"
          aria-label="前のページへ（${currentPage - 1}ページ目）"
        >
          <svg
            width="10"
            height="12"
            viewBox="0 0 10 12"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M8.29034 0.75L1.29034 5.75L8.29034 10.75"
              stroke="#828282"
              stroke-width="1.5"
              stroke-linecap="round"
            />
          </svg>
        </a>
      </li>
    `);
  };

  // =============================
  // 関数: updatePageNumbers()
  // =============================
  // 【この関数の役割】
  // ページ番号の要素を更新します（既存の要素を削除して再生成）。
  // 総ページ数分のページ番号ボタンを生成し、「次へボタン」の直前に順番に挿入します。
  // 現在のページには特別なスタイルが適用されます。
  //
  // 引数: なし
  // 戻り値: なし
  const updatePageNumbers = () => {
    // ".js-pagination-next": 次のページボタンの要素を取得
    // $nextButton: 次のページボタンの親要素（li要素）のjQueryオブジェクト
    const $nextButton = $pagination.find(".js-pagination-next").closest("li");

    // セレクタ: "li[data-page]" - data-page属性を持つli要素をすべて取得
    // .remove()メソッド: 要素をDOMから削除
    // 既存のページ番号要素を削除（前/次ボタン以外）
    $pagination.find("li[data-page]").remove();

    // DocumentFragmentを使用して複数の要素を一度に追加（リフローを最小化）
    const fragment = document.createDocumentFragment();
    const pageNumbers = [];

    // forループ: 1から総ページ数まで繰り返し処理
    // let i = 1: ループ変数iを1で初期化
    // i <= totalPages: iが総ページ数以下の間、ループを継続
    // i++: ループの最後にiを1増やす
    for (let i = 1; i <= totalPages; i++) {
      // createPageNumber()関数を呼び出してページ番号要素を生成
      // 引数: i（ページ番号）、i === currentPage（現在のページかどうか）
      //
      // 【このコードの役割】
      // 1. createPageNumber()関数を呼び出す
      //    - 第1引数: i（ループ変数、1, 2, 3, ... と順番に増えるページ番号）
      //    - 第2引数: i === currentPage（現在のページかどうかの判定結果）
      //               → iがcurrentPageと等しい場合はtrue、違う場合はfalse
      // 2. 関数の戻り値（生成されたHTML要素のjQueryオブジェクト）を$pageNum変数に格納
      //    - 現在のページの場合: 特別なスタイル（ACTIVE_CLASS）が付いたli要素
      //    - 他のページの場合: クリック可能なリンク（aタグ）を含むli要素
      //
      // 例: 現在3ページ目を表示している場合（currentPage = 3）、総ページ数が5の場合
      //   - 1回目: createPageNumber(1, false) → 1ページ目のli要素を生成
      //   - 2回目: createPageNumber(2, false) → 2ページ目のli要素を生成
      //   - 3回目: createPageNumber(3, true)  → 3ページ目のli要素を生成（現在のページ）
      //   - 4回目: createPageNumber(4, false) → 4ページ目のli要素を生成
      //   - 5回目: createPageNumber(5, false) → 5ページ目のli要素を生成
      const $pageNum = createPageNumber(i, i === currentPage);
      
      // 配列に追加（後で一括追加）
      pageNumbers.push($pageNum[0]); // jQueryオブジェクトからDOM要素を取得
    }

    // すべての要素をDocumentFragmentに追加
    pageNumbers.forEach(pageNum => fragment.appendChild(pageNum));

    // 次へボタンの直前に一度に挿入（リフローを最小化）
    if ($nextButton.length) {
      $nextButton[0].parentNode.insertBefore(fragment, $nextButton[0]);
    }
  };

  // =============================
  // 関数: updateNavButtons()
  // =============================
  // 【この関数の役割】
  // 4つのナビゲーションボタン（最初、前、次、最後）の状態（有効/無効）を更新します。
  // 1ページ目の場合は「最初」「前」ボタンを削除し、1ページ目以外の場合は追加します。
  // 最後のページの場合は「次」「最後」ボタンを無効にします。
  //
  // 引数: なし
  // 戻り値: なし
  const updateNavButtons = () => {
    // 一番最初に戻るボタンと前のページボタンの要素を取得（存在する場合）
    const $firstItem = $pagination.find(".js-pagination-first").closest("li");
    const $prevItem = $pagination.find(".js-pagination-prev").closest("li");

    // 次のページボタンと最後のページボタンの親要素（li要素）を取得
    const $nextItem = $pagination.find(".js-pagination-next").closest("li");
    const $lastItem = $pagination.find(".js-pagination-last").closest("li");

    // =============================
    // 一番最初に戻るボタンと前のページボタンの処理
    // =============================
    // 1ページ目の場合は削除、1ページ目以外の場合は追加
    const isFirstPage = currentPage === 1;

    if (isFirstPage) {
      // 1ページ目の場合: ボタンを削除
      $firstItem.length && $firstItem.remove();
      $prevItem.length && $prevItem.remove();
    } else {
      // 1ページ目以外の場合: ボタンを追加または更新
      // ページ番号の最初の要素を取得（挿入位置の基準）
      const $firstPageNumber = $pagination.find("li[data-page]").first();

      // 一番最初に戻るボタンの処理
      if (!$firstItem.length) {
        // ボタンが存在しない場合は追加
        const $firstButton = createFirstButton();
        // ページ番号の前に挿入、ページ番号がない場合は次へボタンの前に挿入
        if ($firstPageNumber.length) {
          $firstPageNumber.before($firstButton);
        } else {
          $nextItem.before($firstButton);
        }
      } else {
        // ボタンが存在する場合はaria-labelを更新
        $firstItem
          .find(".js-pagination-first")
          .attr("aria-label", "一番最初のページへ");
      }

      // 前のページボタンの処理
      if (!$prevItem.length) {
        // ボタンが存在しない場合は追加
        const $prevButton = createPrevButton();
        // 一番最初に戻るボタンの後、またはページ番号の前に挿入
        if ($firstItem.length) {
          $firstItem.after($prevButton);
        } else if ($firstPageNumber.length) {
          $firstPageNumber.before($prevButton);
        } else {
          $nextItem.before($prevButton);
        }
      } else {
        // ボタンが存在する場合はaria-labelを更新
        $prevItem
          .find(".js-pagination-prev")
          .attr("aria-label", `前のページへ（${currentPage - 1}ページ目）`);
      }
    }

    // =============================
    // 次のページボタンと最後のページボタンの処理
    // =============================
    // 現在のページが最後のページの場合、ボタンは無効
    const isLastPage = currentPage === totalPages;

    // 次のページボタンの状態を更新
    $nextItem.toggle(!isLastPage);
    if (!isLastPage) {
      $nextItem.find(".js-pagination-next").attr("aria-disabled", "false");
    }

    // 最後のページボタンの状態を更新
    $lastItem.toggle(!isLastPage);
    if (!isLastPage) {
      $lastItem.find(".js-pagination-last").attr("aria-disabled", "false");
    }
  };

  // =============================
  // 関数: createNewsItem()
  // =============================
  // 【この関数の役割】
  // ニュースアイテムのHTML要素を生成します（遅延レンダリング用）
  //
  // 引数:
  //   - index: アイテムのインデックス（数値）
  //   - data: ニュースデータオブジェクト（date, title）
  // 戻り値: 生成されたjQueryオブジェクト（li要素）
  const createNewsItem = (index, data) => {
    // 日付を日本語形式に変換（YYYY-MM-DD → YYYY年MM月DD日）
    const dateStr = data.date.replace(/(\d{4})-(\d{2})-(\d{2})/, "$1年$2月$3日");
    
    return $(`
      <li class="news__item" data-item-index="${index}">
        <a href="#" class="news__link">
          <time class="news__date" datetime="${data.date}">
            ${dateStr}
          </time>
          <h3 class="news__title">${data.title}</h3>
        </a>
      </li>
    `);
  };

  // =============================
  // 関数: ensureNewsItems()
  // =============================
  // 【この関数の役割】
  // 指定した範囲のニュースアイテムが存在することを保証します。
  // 存在しない場合は動的に生成してDOMに追加します（遅延レンダリング）
  //
  // 引数:
  //   - startIndex: 開始インデックス（数値）
  //   - endIndex: 終了インデックス（数値）
  // 戻り値: なし
  const ensureNewsItems = (startIndex, endIndex) => {
    // 現在存在するニュースアイテムを取得
    const $existingItems = $newsList.find("[data-item-index]");
    
    // 追加する要素をまとめて生成（DocumentFragmentを使用してリフローを最小化）
    const fragment = document.createDocumentFragment();
    const itemsToAdd = [];
    
    // 必要な範囲のアイテムを生成
    for (let i = startIndex; i < endIndex && i < totalItems; i++) {
      // 既に存在するかチェック
      const $existingItem = $existingItems.filter(`[data-item-index="${i}"]`);
      
      if ($existingItem.length === 0) {
        // アイテムが存在しない場合は生成して配列に追加
        const $newItem = createNewsItem(i, newsData[i]);
        itemsToAdd.push($newItem[0]); // jQueryオブジェクトからDOM要素を取得
      }
    }
    
    // すべての要素を一度に追加（リフローを最小化）
    if (itemsToAdd.length > 0) {
      itemsToAdd.forEach(item => fragment.appendChild(item));
      $newsList[0].appendChild(fragment); // jQueryオブジェクトからDOM要素を取得
    }
  };

  // =============================
  // 関数: updateNewsItems()
  // =============================
  // 【この関数の役割】
  // 指定したページに表示するニュースアイテムを制御します。
  // 必要なアイテムが存在しない場合は動的に生成し、
  // ページ番号に応じて、表示するアイテムにVISIBLE_CLASS（"on"）を追加し、
  // 表示しないアイテムからはVISIBLE_CLASSを削除します。
  // CSSでVISIBLE_CLASSが付いた要素だけが表示されるようになっています。
  //
  // 引数:
  //   - page: 表示するページ番号（数値）
  // 戻り値: なし
  const updateNewsItems = (page) => {
    // 表示する最初のアイテムのインデックスを計算
    // 例: 2ページ目の場合、(2 - 1) × 5 = 5（6番目のアイテムから表示）
    const startIndex = (page - 1) * CONFIG.ITEMS_PER_PAGE;

    // 表示する最後のアイテムのインデックスを計算
    // 例: 2ページ目の場合、5 + 5 = 10（10番目のアイテムまで表示）
    const endIndex = startIndex + CONFIG.ITEMS_PER_PAGE;

    // 必要なアイテムが存在することを保証（遅延レンダリング）
    ensureNewsItems(startIndex, endIndex);

    // すべてのニュースアイテムを再取得（新しく追加されたアイテムも含む）
    const $allNewsItems = $newsList.find("[data-item-index]");

    // DOM変更をバッチ化するため、まずすべての変更を準備
    const itemsToShow = [];
    const itemsToHide = [];

    // .each()メソッド: 各要素に対して繰り返し処理を実行
    $allNewsItems.each(function () {
      // 現在処理中のニュースアイテム要素をjQueryオブジェクトとして取得
      const $item = $(this);

      // .attr()メソッド: 属性の値を取得
      // "data-item-index": データ属性の名前
      // parseInt()関数: 文字列を整数に変換（10進数）
      const itemIndex = parseInt($item.attr("data-item-index"), 10);

      // このアイテムを表示するかどうかを判定
      // itemIndexがstartIndex以上かつendIndex未満の場合、表示する
      // 例: itemIndexが5, 6, 7, 8, 9の場合、2ページ目として表示される
      const shouldShow = itemIndex >= startIndex && itemIndex < endIndex;

      // DOM変更を配列に分類（後で一括実行）
      if (shouldShow) {
        itemsToShow.push($item[0]); // jQueryオブジェクトからDOM要素を取得
      } else {
        itemsToHide.push($item[0]); // jQueryオブジェクトからDOM要素を取得
      }
    });

    // DOM変更を一括実行（リフローを最小化）
    // 表示する要素にクラスを追加
    itemsToShow.forEach(item => {
      item.classList.add(CONFIG.VISIBLE_CLASS);
    });
    
    // 非表示にする要素からクラスを削除
    itemsToHide.forEach(item => {
      item.classList.remove(CONFIG.VISIBLE_CLASS);
    });
  };

  // =============================
  // 関数: updateURL()
  // =============================
  // 【この関数の役割】
  // URLのクエリパラメータを更新します。
  // ページ番号に応じてURLに?page=2などのパラメータを追加し、
  // 1ページ目の場合はパラメータを削除してシンプルなURLにします。
  // これにより、ブックマークや共有時に特定のページを直接開けるようになります。
  //
  // 引数:
  //   - page: 表示するページ番号（数値）
  // 戻り値: なし
  const updateURL = (page) => {
    // URLオブジェクト: URLを操作するためのオブジェクト
    // window.location: 現在のページのURL情報
    const newUrl = new URL(window.location);

    // 1ページ目の場合は、URLパラメータを削除（シンプルなURLにする）
    if (page === 1) {
      // .searchParams.delete()メソッド: クエリパラメータを削除
      newUrl.searchParams.delete("page");
    } else {
      // 2ページ目以降の場合は、URLパラメータを設定
      // .searchParams.set()メソッド: クエリパラメータを設定
      // 例: ?page=2
      newUrl.searchParams.set("page", page);
    }

    // window.history.replaceState()メソッド: ブラウザの履歴を更新する
    // 第1引数: 状態オブジェクト（今回は空）
    // 第2引数: タイトル（使用しないため空文字列）
    // 第3引数: 新しいURL
    // replaceStateは履歴に追加せず、現在の履歴を置き換える（戻るボタンで前のページに戻らない）
    window.history.replaceState({}, "", newUrl);
  };

  // =============================
  // 関数: focusFirstVisibleItem()
  // =============================
  // 【この関数の役割】
  // ページ切り替え後、最初に表示されたニュースアイテムにフォーカスを移動します。
  // キーボードユーザーがページ切り替え後、どこにいるか分かるようにするための
  // アクセシビリティ機能です。
  //
  // 引数: なし
  // 戻り値: なし
  const focusFirstVisibleItem = () => {
    // 現在存在するすべてのニュースアイテムを取得（動的に追加されたアイテムも含む）
    const $allNewsItems = $newsList.find("[data-item-index]");
    
    // .filter()メソッド: 条件に一致する要素だけを抽出
    // `.${CONFIG.VISIBLE_CLASS}`: VISIBLE_CLASS（"on"）が付与された要素を抽出
    // .first()メソッド: 最初の要素を取得
    const $firstVisible = $allNewsItems.filter(`.${CONFIG.VISIBLE_CLASS}`).first();

    // .find()メソッド: 指定した要素の「中にある」すべての子孫要素（子要素・孫要素・その下の要素）から、
    //                  指定したセレクタに一致する要素を検索する
    // この場合、$firstVisible要素の内部にあるaタグを検索
    const $link = $firstVisible.find("a");

    // リンクが存在する場合のみ、フォーカスを移動
    if ($link.length) {
      // [0]: jQueryオブジェクトからDOM要素を取得
      // .focus()メソッド: 要素にフォーカスを移動（ネイティブDOMメソッド）
      $link[0].focus();
    }
  };

  // =============================
  // 関数: updatePagination()
  // =============================
  // 【この関数の役割】
  // ページネーション全体を更新するメインの更新関数です。
  // ページ番号が変更されたときに、以下の処理を順番に実行します：
  // 1. ニュースアイテムの表示/非表示を更新
  // 2. ページ番号の要素を更新
  // 3. 前/次ボタンの状態を更新
  // 4. URLを更新
  // 5. フォーカスを適切に処理（マウスクリック: フォーカスを外す、キーボード操作: ニュースアイテムにフォーカス）
  //
  // 引数:
  //   - page: 表示するページ番号（数値）
  //   - focusTarget: フォーカスを移動する先（文字列、"blur" または "newsItem"、デフォルト: "newsItem"）
  //                 "blur": フォーカスを外す（マウスクリック時）
  //                 "newsItem": 最初のニュースアイテムにフォーカス（キーボード操作時）
  // 戻り値: なし
  const updatePagination = (page, focusTarget = "newsItem") => {
    // 無効なページ番号、または現在のページと同じ場合は処理を終了
    // return: 関数の実行を終了する
    if (page < 1 || page > totalPages || page === currentPage) return;

    // 現在のページ番号を更新
    currentPage = page;

    // DOM操作をrequestAnimationFrameでバッチ化してリフローを最小化
    requestAnimationFrame(() => {
      // ニュースアイテムの表示/非表示を更新
      updateNewsItems(page);

      // ページ番号の要素を更新
      updatePageNumbers();

      // 前/次ボタンの状態を更新
      updateNavButtons();

      // URLを更新
      updateURL(page);

      // フォーカスを適切に処理（次のフレームで実行）
      requestAnimationFrame(() => {
        if (focusTarget === "blur") {
          // 現在フォーカスされている要素からフォーカスを外す
          if (document.activeElement && document.activeElement.blur) {
            document.activeElement.blur();
          }
        } else if (focusTarget === "newsItem") {
          focusFirstVisibleItem();
        }
      });
    });
  };

  // =============================
  // 関数: handlePaginationClick()
  // =============================
  // 【この関数の役割】
  // ページネーションのクリックイベントを処理する共通関数です。
  // ページ番号リンク、前へボタン、次へボタンのクリックを統一的に処理します。
  // 無効なボタンがクリックされた場合は処理をスキップし、
  // 有効な場合は移動先のページ番号を取得してupdatePagination()を呼び出します。
  // マウスクリックの場合はフォーカスを外し、キーボード操作の場合は最初のニュースアイテムにフォーカスを移動します。
  //
  // 引数:
  //   - e: イベントオブジェクト（クリックイベントの情報が含まれる）
  //   - getTargetPage: 関数（クリックされた要素から移動先のページ番号を取得する関数）
  // 戻り値: なし
  const handlePaginationClick = (e, getTargetPage) => {
    // .preventDefault()メソッド: デフォルトの動作をキャンセル
    // aタグの場合は、ページ遷移を防ぐ
    e.preventDefault();

    // 読み取り操作を先に実行（リフローを最小化）
    const target = e.currentTarget;
    const isDisabled = target.getAttribute("aria-disabled") === "true";
    
    // aria-disabled属性が"true"の場合（無効状態）、処理を終了
    if (isDisabled) return;

    // getTargetPage()関数を実行して、移動先のページ番号を取得
    // この関数は、クリックされた要素の種類（ページ番号/前/次）によって異なる
    const targetPage = getTargetPage();

    // 移動先のページ番号が有効で、かつ現在のページと異なる場合のみ更新
    if (targetPage && targetPage !== currentPage) {
      // e.detail: イベントの詳細情報
      // e.detail === 0: キーボード操作（EnterキーやSpaceキーなど）
      // e.detail > 0: マウスクリック（クリック回数）
      // マウスクリックの場合はフォーカスを外し、キーボード操作の場合は最初のニュースアイテムにフォーカスを移動
      const isKeyboardOperation = e.detail === 0;
      const focusTarget = isKeyboardOperation ? "newsItem" : "blur";
      updatePagination(targetPage, focusTarget);
    }
  };

  // =============================
  // イベントリスナーの設定
  // =============================
  // 【このセクションの役割】
  // ページネーションの各要素（ページ番号リンク、前へボタン、次へボタン）に
  // クリックイベントとキーボードイベントを設定します。
  // イベント委譲を使用しているため、動的に追加された要素にもイベントが適用されます。
  //
  // $(document).on()メソッド: イベント委譲を使用してイベントリスナーを設定
  // イベント委譲: 動的に追加された要素にもイベントが適用される仕組み
  // 第1引数: イベントタイプ（"click"）
  // 第2引数: セレクタ（".js-pagination-link"）
  // 第3引数: イベントが発生したときに実行される関数（コールバック関数）

  // ページ番号リンクのクリックイベント
  $(document).on("click", ".js-pagination-link", function (e) {
    // 読み取り操作を先に実行（リフローを最小化）
    const dataPage = this.getAttribute("data-page");
    const pageNumber = dataPage ? parseInt(dataPage, 10) : null;
    
    // handlePaginationClick()関数を呼び出し
    handlePaginationClick(e, () => pageNumber);
  });

  // 前のページボタンのクリックイベント
  $(document).on("click", ".js-pagination-prev", function (e) {
    // 現在のページが1より大きい場合のみ、前のページ番号を返す
    // &&演算子: 左側がtrueの場合、右側の値を返す（短絡評価）
    // 例: currentPageが3の場合、3 > 1はtrueなので、3 - 1 = 2を返す
    handlePaginationClick(e, () => currentPage > 1 && currentPage - 1);
  });

  // 次のページボタンのクリックイベント
  $(document).on("click", ".js-pagination-next", function (e) {
    // 現在のページが最後のページより小さい場合のみ、次のページ番号を返す
    handlePaginationClick(e, () => currentPage < totalPages && currentPage + 1);
  });

  // 一番最初に戻るボタンのクリックイベント
  $(document).on("click", ".js-pagination-first", function (e) {
    // 現在のページが1より大きい場合のみ、1ページ目を返す
    handlePaginationClick(e, () => currentPage > 1 && 1);
  });

  // 一番最後に飛ぶボタンのクリックイベント
  $(document).on("click", ".js-pagination-last", function (e) {
    // 現在のページが最後のページより小さい場合のみ、最後のページ番号を返す
    handlePaginationClick(e, () => currentPage < totalPages && totalPages);
  });

  // pagination__itemをクリックした時に、その中のpagination__linkのクリックイベントをトリガー
  $(document).on("click", ".pagination__item", function (e) {
    // クリックされた要素がpagination__linkまたはpagination__numberの場合は処理しない（既にイベントが設定されているため）
    if ($(e.target).closest(".pagination__link, .pagination__number").length) {
      return;
    }

    // pagination__item内のpagination__linkまたはpagination__numberを探す
    const $link = $(this)
      .find(".pagination__link, .pagination__number")
      .first();

    // リンクが見つかり、無効状態でない場合のみクリックイベントをトリガー
    if ($link.length && $link.attr("aria-disabled") !== "true") {
      // 現在のページのリンク（aria-current="page"）の場合は処理しない
      if ($link.attr("aria-current") !== "page") {
        // 元のイベントのdetail（キーボード操作かどうか）を保持するため、カスタムイベントを作成
        const customEvent = new MouseEvent("click", {
          bubbles: true,
          cancelable: true,
          detail: e.detail, // 元のイベントのdetailを保持（キーボード操作: 0、マウスクリック: 1以上）
        });
        $link[0].dispatchEvent(customEvent);
      }
    }
  });

  // 現在のページのリンクのクリックイベント（無効化）
  $(document).on(
    "click",
    ".pagination__number[aria-current='page']",
    function (e) {
      // 現在のページのリンクがクリックされた場合は、デフォルトの動作をキャンセル
      e.preventDefault();
      e.stopPropagation();
    }
  );

  // =============================
  // 初期化処理
  // =============================
  // 【この処理の役割】
  // ページ読み込み時に、ページネーションを初期状態に設定します。
  // 以下の処理を順番に実行して、ページネーションを表示可能な状態にします：
  // 1. ページ番号の要素を生成
  // 2. 前/次ボタンの状態を更新
  // 3. 現在のページのニュースアイテムを表示
  // setTimeoutで分割して長時間タスクを回避（50ms以下に分割）

  // 最初のタスク: ページ番号の要素を生成
  requestAnimationFrame(() => {
    updatePageNumbers();
    
    // 2番目のタスク: 前/次ボタンの状態を更新（次のフレームで実行）
    setTimeout(() => {
      requestAnimationFrame(() => {
        updateNavButtons();
        
        // 3番目のタスク: 現在のページのニュースアイテムを表示（次のフレームで実行）
        setTimeout(() => {
          requestAnimationFrame(() => {
            updateNewsItems(currentPage);
          });
        }, 0);
      });
    }, 0);
  });
});

// =============================
// Swiper遅延読み込み（使用していないJavaScript削減対策）
// =============================
// WORKセクションがビューポートに入るまでSwiperを読み込まない
// これにより、初期ページ読み込み時のJavaScriptサイズを約28 KiB削減
let swiperLoaded = false;
let swiperInstance = null;

// Swiperスクリプトを動的に読み込む関数
const loadSwiperScript = () => {
  return new Promise((resolve, reject) => {
    // 既に読み込まれている場合は即座に解決
    if (typeof Swiper !== 'undefined') {
      resolve();
      return;
    }

    // スクリプトタグを作成
    const script = document.createElement('script');
    script.src = './js/lib/swiper-bundle.min.min.js';
    script.async = true;
    
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Swiper script failed to load'));
    
    // スクリプトを追加
    document.head.appendChild(script);
  });
};

// Swiperを初期化する関数
const initSwiper = () => {
  // 既に初期化されている場合はスキップ
  if (swiperInstance) return;

  // requestAnimationFrameでラップして強制リフローを最小化
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      swiperInstance = new Swiper("#js-work-swiper", {
        loop: false,
        spaceBetween: 18,
        speed: 1000,
        allowTouchMove: false, // スワイプ無効
        slidesPerView: "auto",

        pagination: {
          el: ".swiper-pagination",
          clickable: true,
        },

        navigation: {
          nextEl: "#js-work-next",
          prevEl: "#js-work-prev",
        },
      });
    });
  });
};

// Intersection ObserverでWORKセクションを監視
$(function () {
  const workSection = document.getElementById('work');
  if (!workSection) return;

  // Intersection Observerのオプション
  const observerOptions = {
    root: null, // ビューポートを基準にする
    rootMargin: '50px', // 50px手前で読み込み開始（ユーザー体験向上）
    threshold: 0.1, // 10%が見えたら発火
  };

  // Intersection Observerのコールバック
  const observerCallback = (entries) => {
    entries.forEach((entry) => {
      // WORKセクションがビューポートに入ったら
      if (entry.isIntersecting && !swiperLoaded) {
        swiperLoaded = true;
        
        // Swiperスクリプトを読み込んでから初期化
        loadSwiperScript()
          .then(() => {
            initSwiper();
          })
          .catch((error) => {
            console.error('Failed to load Swiper:', error);
          });

        // 一度読み込んだら監視を停止
        observer.unobserve(workSection);
      }
    });
  };

  // Intersection Observerを作成
  const observer = new IntersectionObserver(observerCallback, observerOptions);
  
  // WORKセクションを監視開始
  observer.observe(workSection);
});

// ============================================
// タブ機能（ARIA属性ベース・アクセシビリティ対応）
// ============================================
document.addEventListener("DOMContentLoaded", function () {
  const tabList = document.querySelector(".company-tab[role='tablist']");
  if (!tabList) return;

  const tabs = Array.from(tabList.querySelectorAll(".js-tab[role='tab']"));
  
  // W3C標準に準拠: 各タブのaria-controlsから個別に取得して配列に格納
  const tabPanels = [];
  for (let i = 0; i < tabs.length; i += 1) {
    const tab = tabs[i];
    const tabpanel = document.getElementById(tab.getAttribute('aria-controls'));
    if (tabpanel) {
      tabPanels.push(tabpanel);
    }
  }

  // タブを切り替える関数
  // setFocus: フォーカスを移動するかどうか（デフォルト: true）
  function switchTab(selectedTab, setFocus) {
    // setFocusが未指定の場合はtrue（デフォルト）
    if (typeof setFocus !== 'boolean') {
      setFocus = true;
    }

    // 選択されたタブのインデックスを取得
    const selectedIndex = tabs.indexOf(selectedTab);

    // すべてのタブの選択を解除
    tabs.forEach(function (tab, index) {
      const isSelected = tab === selectedTab;
      tab.setAttribute("aria-selected", isSelected ? "true" : "false");
      
      // W3C標準に準拠: 選択されたタブのみTabキーでアクセス可能
      if (isSelected) {
        // 選択されたタブ: tabindexを削除（デフォルトの0になる）
        tab.removeAttribute("tabindex");
      } else {
        // 未選択のタブ: tabindex="-1"（Tabキーでアクセス不可、矢印キーでアクセス可能）
        tab.setAttribute("tabindex", "-1");
      }

      // 対応するタブパネルを表示/非表示（W3C標準に準拠: 配列のインデックスを使用）
      const panel = tabPanels[index];
      if (panel) {
        if (isSelected) {
          // 選択されたタブパネルを表示（CSSクラスとaria-hidden属性の両方を使用）
          panel.setAttribute("aria-hidden", "false");
          panel.classList.remove("is-hidden");
          panel.setAttribute("tabindex", "0");
        } else {
          // 非選択のタブパネルを非表示（CSSクラスとaria-hidden属性の両方を使用）
          panel.setAttribute("aria-hidden", "true");
          panel.classList.add("is-hidden");
          panel.setAttribute("tabindex", "-1");
        }
      }
    });

    // setFocusがtrueの場合のみフォーカスを移動（W3C標準に準拠）
    if (setFocus) {
      selectedTab.focus();
    }
  }

  // クリックイベント
  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      switchTab(this);
    });
  });

  // キーボード操作（矢印キー）のサポート（W3C標準に準拠: 左/右矢印キーのみ）
  tabs.forEach(function (tab, index) {
    tab.addEventListener("keydown", function (e) {
      let targetIndex = -1;

      // 左矢印キー: 前のタブに移動
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        targetIndex = index > 0 ? index - 1 : tabs.length - 1;
      }
      // 右矢印キー: 次のタブに移動
      else if (e.key === "ArrowRight") {
        e.preventDefault();
        targetIndex = index < tabs.length - 1 ? index + 1 : 0;
      }
      // Homeキー: 最初のタブに移動
      else if (e.key === "Home") {
        e.preventDefault();
        targetIndex = 0;
      }
      // Endキー: 最後のタブに移動
      else if (e.key === "End") {
        e.preventDefault();
        targetIndex = tabs.length - 1;
      }

      if (targetIndex !== -1) {
        switchTab(tabs[targetIndex]);
      }
    });
  });

  // 初期状態の設定：非表示のタブパネルにis-hiddenクラスを追加
  tabPanels.forEach(function (panel) {
    if (panel.getAttribute("aria-hidden") === "true") {
      panel.classList.add("is-hidden");
    }
  });

  // 初期状態の設定：最初に選択されているタブを設定（フォーカスは移動しない）
  const initialTab = tabs.find(function (tab) {
    return tab.getAttribute("aria-selected") === "true";
  });
  if (initialTab) {
    // 初期化時はフォーカスを移動しない（setFocus = false）
    switchTab(initialTab, false);
  }
});

// ============================================
// アコーディオン機能
// ============================================
// FAQセクションのアコーディオン（開閉可能な質問と回答）を実装します。
// クリックでスムーズに開閉するアニメーションを提供します。

// DOMContentLoadedイベント: HTMLの読み込みが完了したときに発生するイベント
// このタイミングで実行することで、HTML要素が確実に存在する状態で処理を開始できます
// addEventListenerメソッド: 要素やドキュメントにイベントリスナーを登録する
// - 第1引数: イベント名（"DOMContentLoaded"）
// - 第2引数: イベント発生時に実行する関数（アロー関数）
document.addEventListener("DOMContentLoaded", () => {
  setUpAccordion();
});

/**
 * 既存のtransitionendイベントリスナーをクリーンアップする関数
 *
 * なぜ必要か: 連続でクリックされた場合、前回のtransitionendイベントリスナーが
 * 残っている可能性があります。これを削除して、イベントリスナーの重複登録を防ぎます。
 *
 * @param {HTMLElement} content - コンテンツ要素（開閉される回答部分の要素）
 *
 * @paramについて:
 * - @param: JSDocのタグ（関数のパラメータを説明するための記号）
 *   関数の引数（パラメータ）について説明する際に使用します
 *
 * - {HTMLElement}: 型注釈（このパラメータがどんな型のデータかを示す）
 *   HTML要素を表すオブジェクトの型です
 *   JavaScriptでは型が明示されませんが、このコメントで型を示すことで、
 *   コードの可読性が向上し、開発ツール（IDE）での補完やエラーチェックに役立ちます
 *   - HTMLElement: HTML要素全般を表す型
 *   - 例: <div>、<span>、<p>などの要素がこれに該当します
 *
 * - content: パラメータ名（関数の引数の名前）
 *   この関数を呼び出すときに渡す引数の名前です
 *   関数内では「content」という名前でこの引数にアクセスできます
 *
 * 具体例:
 *   cleanupTransitionHandler(contentElement);
 *   ↑この「contentElement」が「content」パラメータとして渡されます
 *
 * 処理の流れ:
 * 1. content._transitionHandler: 独自のプロパティとして保存したハンドラー関数への参照を取得
 *    （このプロパティはsetupTransitionHandler関数で設定されます）
 * 2. 既存のハンドラーがあれば、removeEventListenerメソッドで削除
 * 3. _transitionHandlerプロパティをnullに設定してクリア
 */
const cleanupTransitionHandler = (content) => {
  // _transitionHandler: 要素に独自に追加したプロパティ（後で削除するために保存しておく参照）
  const existingHandler = content._transitionHandler;
  if (existingHandler) {
    // removeEventListenerメソッド: 登録したイベントリスナーを削除する
    // - 第1引数: イベント名（"transitionend"）
    // - 第2引数: 削除するハンドラー関数（登録した時と同じ関数を指定する必要がある）
    content.removeEventListener("transitionend", existingHandler);
    // プロパティをnullに設定してクリア
    content._transitionHandler = null;
  }
};

/**
 * アニメーションを開始する関数（リフローとrequestAnimationFrameの処理）
 *
 * この関数は、CSSのtransitionアニメーションを確実に動作させるために必要な処理を行います。
 *
 * @param {HTMLElement} content - コンテンツ要素（アニメーション対象の要素）
 *
 * @paramについて:
 * - @param: JSDocのタグ（関数のパラメータを説明するための記号）
 * - {HTMLElement}: 型注釈（このパラメータがHTMLElement型のオブジェクトであることを示す）
 *   HTML要素（<div>、<span>など）を表す型です
 * - content: パラメータ名（この関数内で使用する引数の名前）
 *
 * @param {Function} callback - アニメーション開始時に実行するコールバック関数
 *                              （この中でstyle.heightなどを変更してアニメーションを開始します）
 *
 * @paramについて（2つ目のパラメータ）:
 * - @param: JSDocのタグ
 * - {Function}: 型注釈（このパラメータがFunction型、つまり関数であることを示す）
 *   実行可能な関数を渡すことを意味します
 * - callback: パラメータ名（コールバック関数を表す一般的な名前）
 *   この関数内で呼び出される関数です
 *
 * 具体例:
 *   startAnimation(contentElement, () => {
 *     contentElement.style.height = "100px";
 *   });
 *   ↑「contentElement」が「content」パラメータ、「() => {...}」が「callback」パラメータとして渡されます
 *
 * 処理の流れ:
 * 1. リフロー（再レンダリング）を強制的に発生させる
 * 2. requestAnimationFrameを二重ネストで実行して、ブラウザの描画タイミングを待つ
 * 3. コールバック関数を実行してアニメーションを開始
 *
 * なぜリフローが必要か:
 * - ブラウザは複数のスタイル変更をまとめて処理するため、
 *   直前のstyle.heightの変更が認識されない場合があります
 * - offsetHeightプロパティにアクセスすると、ブラウザが要素のレイアウトを再計算します
 * - これにより、直前のスタイル変更が確実にブラウザに認識されます
 *
 * なぜrequestAnimationFrameを二重ネストするか:
 * - 1回だけでは、スタイル変更とアニメーション開始が同じフレームで処理される可能性があります
 * - 二重ネストすることで、ブラウザの描画サイクルを確実に待ちます
 * - これにより、アニメーションが正常に動作します
 */
const startAnimation = (content, callback) => {
  // requestAnimationFrameメソッド: ブラウザの次の描画タイミングで関数を実行する
  // アニメーションを滑らかに実行するために使用されます
  requestAnimationFrame(() => {
    // offsetHeightプロパティ: 要素の高さ（padding、borderを含む）を取得するプロパティ
    // void演算子: 戻り値を無視する（ここでは意図的にリフローを発生させるため）
    // このプロパティにアクセスすることで、ブラウザが要素のレイアウトを再計算します
    // requestAnimationFrame内で実行することで、リフローを最小化
    void content.offsetHeight; // リフロー（再レンダリング）を強制的に発生させる

    // 二重ネストすることで、ブラウザの描画サイクルを確実に待つ
    requestAnimationFrame(() => {
      // コールバック関数を実行（この中でstyle.heightなどを変更してアニメーション開始）
      callback();
    });
  });
};

/**
 * transitionendイベントハンドラーを設定する関数
 *
 * CSSのtransitionアニメーションが完了したときに実行される処理を設定します。
 * アニメーション完了後の後処理（クリーンアップ）を行うために使用されます。
 *
 * @param {HTMLElement} content - コンテンツ要素（アニメーション対象の要素）
 *
 * @paramについて:
 * - @param: JSDocのタグ（関数のパラメータを説明するための記号）
 * - {HTMLElement}: 型注釈（このパラメータがHTMLElement型のオブジェクトであることを示す）
 *   HTML要素を表す型です
 * - content: パラメータ名（この関数内で使用する引数の名前）
 *
 * @param {Function} onComplete - アニメーション完了時に実行するコールバック関数
 *                                （インラインスタイルの削除などを行う）
 *
 * @paramについて（2つ目のパラメータ）:
 * - @param: JSDocのタグ
 * - {Function}: 型注釈（このパラメータがFunction型、つまり関数であることを示す）
 * - onComplete: パラメータ名（完了時に実行される関数であることを示す名前）
 *   "on"は「〜のときに」、"Complete"は「完了」を意味し、「完了時に実行される関数」という意味になります
 *
 * 具体例:
 *   setupTransitionHandler(contentElement, () => {
 *     contentElement.style.height = "auto";
 *   });
 *   ↑「contentElement」が「content」パラメータ、「() => {...}」が「onComplete」パラメータとして渡されます
 *
 * 処理の流れ:
 * 1. transitionendイベントが発生したときに実行されるハンドラー関数を作成
 * 2. イベントがcontent要素のheightプロパティの変化によるものか確認
 * 3. 条件が一致したら、onCompleteコールバックを実行
 * 4. イベントリスナーを削除してメモリリークを防止
 * 5. ハンドラー関数への参照をcontent._transitionHandlerに保存（後で削除できるように）
 */
const setupTransitionHandler = (content, onComplete) => {
  // transitionendイベントハンドラー: CSSトランジション（アニメーション）が完了したときに実行される関数
  const handler = (e) => {
    // e.target: イベントが発生した要素
    // e.propertyName: アニメーションが完了したプロパティ名（"height"、"opacity"など）
    // 複数のプロパティがアニメーションしている場合、すべてのtransitionendイベントが発生するため、
    // 対象の要素とプロパティをチェックして、適切なタイミングでのみ処理を実行します
    if (e.target === content && e.propertyName === "height") {
      // アニメーション完了後の処理を実行（コールバック関数）
      onComplete();

      // イベントリスナーを削除（メモリリーク防止）
      content.removeEventListener("transitionend", handler);
      // 独自プロパティをクリア
      content._transitionHandler = null;
    }
  };

  // addEventListenerメソッド: 要素にイベントリスナーを登録
  // - 第1引数: イベント名（"transitionend"）
  // - 第2引数: イベント発生時に実行する関数（handler）
  content.addEventListener("transitionend", handler);

  // 後で削除できるように、ハンドラー関数への参照を保存
  // _transitionHandler: 独自のプロパティとして保存（cleanupTransitionHandler関数で使用）
  content._transitionHandler = handler;
};

/**
 * アコーディオン機能の初期設定を行う関数
 *
 * 処理の流れ:
 * 1. ページ内のすべてのFAQアイテムを取得
 * 2. 各アイテムにクリックイベントを設定
 * 3. 最初のアイテムを初期状態で開いた状態にする（HTMLのopen属性がある場合）
 * 4. クリック時に開閉を切り替え、スムーズなアニメーションを実現
 */
const setUpAccordion = () => {
  // querySelectorAllメソッド: 指定したCSSセレクタに一致するすべての要素を取得する
  // - document: HTMLドキュメント全体を表すオブジェクト
  // - ".faq__item": CSSクラス名faq__itemを持つすべての要素
  // - 戻り値: NodeList（配列のようなオブジェクト）で、見つかったすべての要素が含まれる
  const details = document.querySelectorAll(".faq__item");

  // CSSクラス名の定数定義
  // 定数として定義することで、クラス名を変更する際に1箇所修正するだけで済みます
  const IS_OPENED_CLASS = "is-opened"; // アコーディオンが開いている状態を示すクラス（親要素に適用）
  const IS_OPEN_CLASS = "is-open"; // 質問テキストが開いている状態を示すクラス（質問テキストに適用）

  // forEachメソッド: 配列やNodeListの各要素に対して順番に処理を実行する
  // - element: 現在処理中の要素（この場合は1つ1つの.faq__item要素）
  //   配列やNodeListの中の各要素が順番に代入されます
  //   例: 1回目のループでは1つ目の.faq__item、2回目では2つ目の.faq__item...
  // - index: 現在処理中の要素のインデックス（番号）
  //   配列やNodeListの中での位置を示す数値（0から始まる）
  //   例: 1つ目の要素なら0、2つ目の要素なら1、3つ目の要素なら2...
  //   用途: 最初の要素（index === 0）だけを初期表示で開く処理などに使用
  details.forEach((element, index) => {
    // querySelectorメソッド: 指定した要素の子孫要素の中から、CSSセレクタに一致する最初の1つの要素を取得する
    // - element: 親要素（現在処理中の.faq__item要素）
    // - ".faq__question": CSSクラス名faq__questionを持つ要素を検索
    // - 戻り値: 見つかった要素（見つからない場合はnull）
    // - 重要: 複数存在する場合は、最初の1つだけを返す
    const summary = element.querySelector(".faq__question"); // クリック可能な質問部分
    const content = element.querySelector(".faq__answer"); // 開閉される回答部分
    const questionText = element.querySelector(".faq__question-text"); // 質問のテキスト部分（スタイル変更用）

    // 必要な要素が存在しない場合は処理をスキップ（エラー防止）
    // return文: 関数の実行を途中で終了する
    // この場合、forEeachのループから抜けて次の要素の処理に進みます
    if (!summary || !content || !questionText) return;

    // ============================================
    // 初期状態の設定
    // ============================================
    // 最初のアコーディオン（index === 0）で、HTMLにopen属性がある場合のみ
    // 初期表示時に開いた状態にします
    //
    // hasAttributeメソッド: HTML要素が指定した属性を持っているか確認する
    // - 第1引数: 属性名（"open"）
    // - 戻り値: 属性があればtrue、なければfalse
    if (index === 0 && element.hasAttribute("open")) {
      // classListプロパティ: HTML要素のclass属性（CSSクラス）を操作するためのオブジェクト
      // - どこから来たのか: element（HTML要素オブジェクト）の標準プロパティ
      //   JavaScriptでHTML要素を操作する際に自動的に使える機能です
      //   elementはdetails.forEach()の第1パラメータで、.faq__item要素です
      //
      // classList.add()メソッド: 指定したクラス名を要素に追加する
      // - 第1引数: 追加するクラス名（文字列）
      // - 既に同じクラスが付いている場合は何も起こらない（重複はしない）
      //
      // 具体例:
      // HTML: <div class="faq__item">...</div>
      // element.classList.add("is-opened")
      // 結果: <div class="faq__item is-opened">...</div>
      //
      // これにより、CSSで.is-openedクラスが付いた要素に対するスタイルを適用できます
      element.classList.add(IS_OPENED_CLASS);
      questionText.classList.add(IS_OPEN_CLASS);

      // styleプロパティ: 要素のインラインスタイル（HTMLのstyle属性）を操作するオブジェクト
      // - style.height: 要素の高さを設定
      //   "auto" → 内容に応じた高さで表示（コンテンツの高さに合わせて自動調整）
      // - style.opacity: 要素の透明度を設定
      //   "1" → 完全に不透明（見える状態）、"0" → 完全に透明（見えない状態）
      content.style.height = "auto";
      content.style.opacity = "1";
    }

    // ============================================
    // クリックイベントの設定
    // ============================================
    // addEventListenerメソッド: 要素にイベントリスナー（イベントが発生したときに実行する関数）を追加する
    // - 第1引数: イベント名（"click" → マウスクリックまたはタッチ時のイベント）
    // - 第2引数: イベント発生時に実行する関数（アロー関数）
    //   event: イベントオブジェクト（イベントに関する情報が含まれる）
    summary.addEventListener("click", (event) => {
      // preventDefaultメソッド: デフォルトの動作をキャンセルする
      // <details>要素の場合、デフォルトで開閉動作があるため、それを無効化して
      // 独自のアニメーション処理を実行できるようにします
      event.preventDefault();

      // クリック後にフォーカスを解除してホバースタイルが残り続けるのを防ぐ
      // blurメソッド: 要素からフォーカスを外す
      // setTimeoutで少し遅延させることで、クリック処理が完了してからフォーカスを解除
      setTimeout(() => {
        summary.blur();
      }, 0);

      // 既存のtransitionendイベントリスナーをクリーンアップ（重複防止）
      cleanupTransitionHandler(content);

      // classList.containsメソッド: 要素が指定したクラスを持っているか確認する
      // - 第1引数: 確認するクラス名
      // - 戻り値: クラスがあればtrue、なければfalse
      // isOpen: アコーディオンが開いているかどうかの状態
      const isOpen = element.classList.contains(IS_OPENED_CLASS);

      if (isOpen) {
        // ============================================
        // 閉じる処理
        // ============================================
        // 読み取り操作を先に実行（リフローを最小化）
        // DOM変更前にscrollHeightを取得
        const contentHeight = content.scrollHeight;
        
        // requestAnimationFrameで書き込み操作をバッチ化
        requestAnimationFrame(() => {
          // classList.removeメソッド: 指定したクラス名を要素から削除する
          // - 第1引数: 削除するクラス名
          element.classList.remove(IS_OPENED_CLASS);
          questionText.classList.remove(IS_OPEN_CLASS);

          // アニメーション開始前の準備
          // 現在の高さを明示的に設定することで、高さの初期値として確実に認識させます
          // これにより、「現在の高さ → 0」というアニメーションが可能になります
          content.style.height = contentHeight + "px";

          // startAnimation関数: リフローとrequestAnimationFrameの処理を行い、アニメーションを開始する
          // コールバック関数内で、高さを0に、透明度を0に変更して閉じるアニメーションを実行
          startAnimation(content, () => {
            content.style.height = "0"; // 高さを0に変更（CSSのtransitionでスムーズに変化）
            content.style.opacity = "0"; // 透明度を0に変更（フェードアウト効果）
          });

          // setupTransitionHandler関数: transitionendイベントハンドラーを設定する
          // アニメーション完了後（閉じる処理が完了した後）に実行される処理
          setupTransitionHandler(content, () => {
            // removeAttributeメソッド: HTML要素から指定した属性を削除する
            // - 第1引数: 削除する属性名（"open"）
            element.removeAttribute("open");

            // インラインスタイルを削除（CSSの初期値に戻す）
            // 空文字を代入することで、インラインスタイルを削除できます
            // これにより、CSSのスタイルが適用されるようになります
            content.style.height = "";
            content.style.opacity = "";
          });
        });
      } else {
        // ============================================
        // 開く処理
        // ============================================
        // requestAnimationFrameで書き込み操作をバッチ化（強制リフローを最小化）
        requestAnimationFrame(() => {
          // 開いている状態のクラスを追加
          element.classList.add(IS_OPENED_CLASS);
          questionText.classList.add(IS_OPEN_CLASS);

          // setAttributeメソッド: HTML要素に指定した属性を追加または変更する
          // - 第1引数: 属性名（"open"）
          // - 第2引数: 属性値（"true"）
          element.setAttribute("open", "true");

          // アニメーション開始前の準備
          // 高さを0に設定してから、実際の高さを取得します
          // これにより、「0から実際の高さへ」という明確なアニメーションが可能になります
          content.style.height = "0";
          // 透明度は先に1（不透明）に設定（高さのアニメーションと同時にフェードイン）
          content.style.opacity = "1";

          // 現在のコンテンツの実際の高さを取得
          // この時点でheightが0なので、scrollHeightは要素の本来の高さを返します
          // requestAnimationFrame内で読み取ることで、強制リフローを最小化
          const contentHeight = content.scrollHeight;

          // startAnimation関数: リフローとrequestAnimationFrameの処理を行い、アニメーションを開始する
          // コールバック関数内で、高さを実際の高さに変更して開くアニメーションを実行
          startAnimation(content, () => {
            // 高さを実際の高さに変更（CSSのtransitionでスムーズに展開）
            // これにより、0からcontentHeightまでスムーズに展開するアニメーションが実行されます
            content.style.height = contentHeight + "px";
          });

          // setupTransitionHandler関数: transitionendイベントハンドラーを設定する
          // アニメーション完了後（開く処理が完了した後）に実行される処理
          setupTransitionHandler(content, () => {
            // 高さを"auto"に変更
            // 理由: 固定のpx値だと、ウィンドウサイズ変更やコンテンツ追加に対応できないため
            // "auto"にすることで、内容に応じた柔軟な高さになります
            content.style.height = "auto";
          });
        });
      }
    });
  });
};
