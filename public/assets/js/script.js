//375px 未満は JS で viewport を固定する
// =============================
(function () {
  // <meta name="viewport"> タグを取得（ビューポートの設定を変更するため）
  const viewport = document.querySelector('meta[name="viewport"]');

  // 画面幅に応じて viewport の content 属性を切り替える関数
  function switchViewport() {
    // 画面の外枠の幅（ブラウザのスクロールバーなどを含む）をチェック
    const value =
      window.outerWidth > 375
        ? // 375px より広い場合は、通常のレスポンシブ表示（端末幅に合わせる）
          "width=device-width,initial-scale=1"
        : // 375px 以下の狭い画面では、幅を固定（375px に強制）
          "width=375";

    // すでに設定されている content と異なる場合のみ変更を加える
    if (viewport.getAttribute("content") !== value) {
      viewport.setAttribute("content", value);
    }
  }

  // ウィンドウサイズが変更されたときに switchViewport を実行する
  addEventListener("resize", switchViewport, false);

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

const closeMenu = () => {
  $hamburger
    .removeClass(CLASS)
    .attr({
      "aria-expanded": "false",
      "aria-haspopup": "menu",
    })
    .focus();
  $menu.removeClass(CLASS);
  backgroundFix(false);
};

const openMenu = () => {
  $hamburger
    .addClass(CLASS)
    .attr("aria-expanded", "true")
    .removeAttr("aria-haspopup");
  $menu.addClass(CLASS);
  backgroundFix(true);
  // メニューが開いた後、最初のリンクにフォーカスを当てる
  setTimeout(() => $firstLink.length && $firstLink.focus(), 100);
};

$hamburger.on("click", function (e) {
  e.preventDefault();
  $hamburger.hasClass(CLASS) ? closeMenu() : openMenu();
});

jQuery(window).on("keydown", (e) => {
  if (e.key === "Escape" && $hamburger.hasClass(CLASS)) closeMenu();
});

// フォーカストラップ：メニュー内でキーボード操作を閉じ込める
$focusTrap.on("focus", () => {
  $hamburger.focus();
});

// ページ内リンクをクリックした時にメニューを閉じる
jQuery('#js-drawer-content a[href^="#"]').on("click", closeMenu);

// const swiper = new Swiper("#js-work-swiper", {
//   // Optional parameters
//   loop: true,
//   // slidesPerView: "auto"に上書きされるから消した。
//   // slidesPerView: 1.25,
//   spaceBetween: 18,
//   //画面幅を変えることができる。
//   slidesPerView: "auto",

//   // If we need pagination
//   pagination: {
//     el: "#js-work-pagination",
//   },

//   // Navigation arrows
//   navigation: {
//     nextEl: "#js-work-next",
//     prevEl: "#js-work-prev",
//   },
// });

// $(function () {
//   $(".js-content:first-of-type").css("display", "block");
//   $(".js-tab").on("click", function () {
//     $(".current").removeClass("current");
//     $(this).addClass("current");
//     const index = $(this).index();
//     $(".js-content").hide().eq(index).fadeIn(300);
//   });
// });

// $(function () {
//   $(".js-accordion").click(function () {
//     //クリックされた質問の子要素のspan以外からはopenというクラスを外す
//     $(".js-accordion").not(this).children("span").removeClass("open");
//     //クリックされた質問部分に対する回答以外は全て閉じる
//     $(".js-accordion").not(this).next().slideUp(400);

//     //クリックされた質問の子要素のspanにopenクラスが付与されいなければ付与し、付与されていれば外す
//     $(this).children("span").toggleClass("open");
//     //クリックされた質問に対する回答を表示する
//     $(this).next().slideToggle(400);
//   });
// });

$(function () {
  $(".js-content:not(:first-of-type)").hide();

  $(".js-tab").on("click", function () {
    $(".js-content").hide();
    $("#" + $(this).attr("aria-controls")).show();
    $(".js-tab-menu").removeClass("current");
    $(this).parent().addClass("current");
  });
});

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
    ACTIVE_CLASS: "pagination__item--active",

    // DISABLED_CLASS: 無効状態のボタンを示すCSSクラス名（文字列）
    // このクラスが付与された要素は、クリックできない状態を視覚的に示す
    DISABLED_CLASS: "pagination__item--disabled",

    // VISIBLE_CLASS: 表示するニュースアイテムに付与するCSSクラス名（文字列）
    // このクラスが付与された要素だけが表示される（CSSで制御）
    VISIBLE_CLASS: "on",
  };

  // =============================
  // 状態管理（変数の定義）
  // =============================
  // let: 再代入可能な変数宣言
  // currentPage: 現在表示しているページ番号（数値）
  // 初期値は1（最初のページ）
  let currentPage = 1;

  // セレクタ: "[data-item-index]" - data-item-index属性を持つ要素をすべて取得
  // .find()メソッド: 指定した要素の「中にある」すべての子孫要素（子要素・孫要素・その下の要素）から、
  //                  指定したセレクタに一致する要素を検索する
  // 例: $newsList.find("[data-item-index]") は、$newsList要素の内部にある
  //     data-item-index属性を持つすべての要素を探し出す
  // $newsItems: すべてのニュースアイテム（li要素）のjQueryオブジェクト
  const $newsItems = $newsList.find("[data-item-index]");

  // .lengthプロパティ: ニュースアイテムの総数を取得（数値）
  const totalItems = $newsItems.length;

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
      return $(`
        <li class="pagination__item ${CONFIG.ACTIVE_CLASS} isActive" data-page="${pageNum}">
          <a class="pagination__number" href="?page=${pageNum}" aria-current="page" onclick="return false;">${pageNum}</a>
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

      // .before()メソッド: 指定した要素の「直前に」新しい要素を挿入する
      // $nextButton.before($pageNum): 次へボタン（$nextButton）の直前にページ番号（$pageNum）を挿入
      //
      // 【.before()メソッドの動作】
      // 指定した要素（$nextButton）の「直前（前）」に新しい要素（$pageNum）を挿入します
      //
      // 【HTMLの構造変化の例】
      //
      // 挿入前:
      // <ul>
      //   <li>前へボタン</li>
      //   <li>次へボタン</li>  ← $nextButton
      // </ul>
      //
      // 1回目のループ（i=1）: $nextButton.before($pageNum) を実行
      // <ul>
      //   <li>前へボタン</li>
      //   <li>1ページ目</li>    ← 新しく挿入された要素
      //   <li>次へボタン</li>  ← $nextButton
      // </ul>
      //
      // 2回目のループ（i=2）: $nextButton.before($pageNum) を実行
      // <ul>
      //   <li>前へボタン</li>
      //   <li>1ページ目</li>
      //   <li>2ページ目</li>    ← 新しく挿入された要素
      //   <li>次へボタン</li>  ← $nextButton
      // </ul>
      //
      // 3回目のループ（i=3）: $nextButton.before($pageNum) を実行
      // <ul>
      //   <li>前へボタン</li>
      //   <li>1ページ目</li>
      //   <li>2ページ目</li>
      //   <li>3ページ目</li>    ← 新しく挿入された要素
      //   <li>次へボタン</li>  ← $nextButton
      // </ul>
      //
      // このように、ループが進むたびに「次へボタンの直前」に新しいページ番号が挿入されるため、
      // 結果として「1, 2, 3...」の順番で並ぶ
      $nextButton.before($pageNum);
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
        const $insertTarget = $firstItem.length
          ? $firstItem
          : $firstPageNumber.length
            ? $firstPageNumber
            : $nextItem;
        $insertTarget[$firstItem.length ? "after" : "before"]($prevButton);
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
    $nextItem
      .toggleClass(CONFIG.DISABLED_CLASS, isLastPage)
      .toggle(!isLastPage);

    // 最後のページボタンの状態を更新
    $lastItem
      .toggleClass(CONFIG.DISABLED_CLASS, isLastPage)
      .toggle(!isLastPage);
  };

  // =============================
  // 関数: updateNewsItems()
  // =============================
  // 【この関数の役割】
  // 指定したページに表示するニュースアイテムを制御します。
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

    // .each()メソッド: 各要素に対して繰り返し処理を実行
    // function() {}: 各要素に対して実行されるコールバック関数
    // $(this): 現在処理中の要素のjQueryオブジェクト
    $newsItems.each(function () {
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

      // .toggleClass()メソッド: クラスを追加/削除する
      // shouldShowがtrueの場合、VISIBLE_CLASS（"on"）を追加（表示）
      // shouldShowがfalseの場合、VISIBLE_CLASSを削除（非表示）
      $item.toggleClass(CONFIG.VISIBLE_CLASS, shouldShow);
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
    // .filter()メソッド: 条件に一致する要素だけを抽出
    // `.${CONFIG.VISIBLE_CLASS}`: VISIBLE_CLASS（"on"）が付与された要素を抽出
    // .first()メソッド: 最初の要素を取得
    const $firstVisible = $newsItems.filter(`.${CONFIG.VISIBLE_CLASS}`).first();

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
  // 5. 最初に表示されたニュースアイテムにフォーカスを移動
  //
  // 引数:
  //   - page: 表示するページ番号（数値）
  // 戻り値: なし
  const updatePagination = (page) => {
    // 無効なページ番号、または現在のページと同じ場合は処理を終了
    // return: 関数の実行を終了する
    if (page < 1 || page > totalPages || page === currentPage) return;

    // 現在のページ番号を更新
    currentPage = page;

    // ニュースアイテムの表示/非表示を更新
    updateNewsItems(page);

    // ページ番号の要素を更新
    updatePageNumbers();

    // 前/次ボタンの状態を更新
    updateNavButtons();

    // URLを更新
    updateURL(page);

    // 最初に表示されたニュースアイテムにフォーカスを移動
    focusFirstVisibleItem();
  };

  // =============================
  // 関数: handlePaginationClick()
  // =============================
  // 【この関数の役割】
  // ページネーションのクリックイベントを処理する共通関数です。
  // ページ番号リンク、前へボタン、次へボタンのクリックを統一的に処理します。
  // 無効なボタンがクリックされた場合は処理をスキップし、
  // 有効な場合は移動先のページ番号を取得してupdatePagination()を呼び出します。
  //
  // 引数:
  //   - e: イベントオブジェクト（クリックイベントの情報が含まれる）
  //   - getTargetPage: 関数（クリックされた要素から移動先のページ番号を取得する関数）
  // 戻り値: なし
  const handlePaginationClick = (e, getTargetPage) => {
    // .preventDefault()メソッド: デフォルトの動作をキャンセル
    // aタグの場合は、ページ遷移を防ぐ
    e.preventDefault();

    // $(e.currentTarget): イベントが発生した要素（クリックされた要素）を取得
    const $target = $(e.currentTarget);

    // aria-disabled属性が"true"の場合（無効状態）、処理を終了
    if ($target.attr("aria-disabled") === "true") return;

    // getTargetPage()関数を実行して、移動先のページ番号を取得
    // この関数は、クリックされた要素の種類（ページ番号/前/次）によって異なる
    const targetPage = getTargetPage();

    // 移動先のページ番号が有効で、かつ現在のページと異なる場合のみ更新
    if (targetPage && targetPage !== currentPage) {
      updatePagination(targetPage);
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
    // handlePaginationClick()関数を呼び出し
    // 第2引数: 無名関数（アロー関数）を渡す
    // () => {}: アロー関数の構文
    // $(this): クリックされた要素（ページ番号リンク）
    // .attr("data-page"): data-page属性の値を取得
    // parseInt(): 文字列を数値に変換
    handlePaginationClick(e, () => {
      return parseInt($(this).attr("data-page"), 10);
    });
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

  // ページ番号の要素を生成
  updatePageNumbers();

  // 前/次ボタンの状態を更新
  updateNavButtons();

  // 現在のページのニュースアイテムを表示
  updateNewsItems(currentPage);
});
