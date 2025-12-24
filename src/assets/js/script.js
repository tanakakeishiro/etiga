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
const backgroundFix = (bool) => {
  const scrollingElement = () =>
    "scrollingElement" in document
      ? document.scrollingElement
      : document.documentElement;

  const scrollY = bool
    ? scrollingElement().scrollTop
    : parseInt(document.body.style.top || "0");

  if (bool) {
    Object.assign(document.body.style, {
      height: "100vh",
      position: "fixed",
      top: `${scrollY * -1}px`,
      left: "0",
      width: "100vw",
    });
  } else {
    Object.assign(document.body.style, {
      height: "",
      position: "",
      top: "",
      left: "",
      width: "",
    });
    window.scrollTo(0, scrollY * -1);
  }
};

const CLASS = "is-checked";
let flg = false;
const $hamburger = jQuery("#js-drawer-button");
const $menu = jQuery("#js-drawer-content");
const $focusTrap = jQuery("#js-focus-trap");
const $firstLink = jQuery(".header__link").first();

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
  flg = false;
};

const openMenu = () => {
  $hamburger
    .addClass(CLASS)
    .attr("aria-expanded", "true")
    .removeAttr("aria-haspopup");
  $menu.addClass(CLASS);
  backgroundFix(true);
  flg = true;
  setTimeout(() => $firstLink.length && $firstLink.focus(), 100);
};

$hamburger.on("click", function (e) {
  e.preventDefault();
  flg ? closeMenu() : openMenu();
});

jQuery(window).on("keydown", (e) => {
  if (e.key === "Escape" && flg) closeMenu();
});

$focusTrap.on("focus", () => {
  $hamburger.focus();
});

jQuery('#js-drawer-content a[href^="#"]').on("click", closeMenu);

$("#js-drawer-button").click(function () {
  $(".drawer-icon__bar").toggleClass("drawer-icon__color");
});

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
$(function () {
  const $pagination = $(".js-pagination");
  const $newsList = $(".js-news-list");
  if (!$pagination.length || !$newsList.length) return;

  const ACTIVE_CLASS = "pagination__item--active";
  const DISABLED_CLASS = "pagination__item--disabled";
  const ITEMS_PER_PAGE = 5; // 1ページあたりの表示件数
  let currentPage = 1;

  // ニュースアイテムの総数を取得
  const totalItems = $newsList.find("[data-item-index]").length;
  // 総ページ数を計算（ニュースアイテムの数から自動計算）
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  // URLパラメータから現在のページを取得
  const urlParams = new URLSearchParams(window.location.search);
  const pageParam = urlParams.get("page");
  if (pageParam) {
    currentPage = parseInt(pageParam, 10) || 1;
    // 有効なページ範囲内に収める
    if (currentPage < 1) currentPage = 1;
    if (currentPage > totalPages) currentPage = totalPages;
  }

  // ページネーションのHTMLを生成する関数
  const generatePaginationHTML = () => {
    let html = "";

    // 前のページボタンのSVG
    const prevSvg = `<svg width="16" height="12" viewBox="0 0 16 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M14.2903 0.75L7.29034 5.75L14.2903 10.75" stroke="#828282" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M8.29034 0.75L1.29034 5.75L8.29034 10.75" stroke="#828282" stroke-width="1.5" stroke-linecap="round"/>
    </svg>`;

    // 次のページボタンのSVG
    const nextSvg = `<svg width="16" height="12" viewBox="0 0 16 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M0.750061 0.75L7.75006 5.75L0.750061 10.75" stroke="#828282" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M6.75006 0.75L13.7501 5.75L6.75006 10.75" stroke="#828282" stroke-width="1.5" stroke-linecap="round"/>
    </svg>`;

    // 前のページボタン
    const prevDisabled = currentPage === 1;
    const prevClass = prevDisabled ? DISABLED_CLASS : "";
    const prevSvgColor = prevDisabled ? "#c0c0c0" : "#828282";
    const prevSvgDisabled = `<svg width="16" height="12" viewBox="0 0 16 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M14.2903 0.75L7.29034 5.75L14.2903 10.75" stroke="${prevSvgColor}" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M8.29034 0.75L1.29034 5.75L8.29034 10.75" stroke="${prevSvgColor}" stroke-width="1.5" stroke-linecap="round"/>
    </svg>`;
    html += `<li class="pagination__item ${prevClass}">`;
    if (prevDisabled) {
      html += `<span class="pagination__link js-pagination-prev" aria-label="前のページへ（現在1ページ目）" aria-disabled="true" tabindex="-1" role="link">`;
      html += prevSvgDisabled;
      html += "</span>";
    } else {
      html += `<a class="pagination__link js-pagination-prev" href="#" aria-label="前のページへ（${currentPage - 1}ページ目）" aria-disabled="false">`;
      html += prevSvg;
      html += "</a>";
    }
    html += "</li>";

    // ページ番号を生成
    for (let i = 1; i <= totalPages; i++) {
      if (i === currentPage) {
        // 現在のページはspanで表示し、aria-current="page"を追加
        html += `<li class="pagination__item ${ACTIVE_CLASS} isActive" data-page="${i}">`;
        html += `<span class="pagination__number" aria-current="page" aria-label="現在のページ、${i}ページ目">${i}</span>`;
        html += "</li>";
      } else {
        // 他のページはリンクで表示
        html += `<li class="pagination__item" data-page="${i}">`;
        html += `<a class="pagination__link js-pagination-link" href="#" data-page="${i}" aria-label="${i}ページ目へ移動">`;
        html += `<span class="pagination__number">${i}</span>`;
        html += "</a>";
        html += "</li>";
      }
    }

    // 次のページボタン
    const nextDisabled = currentPage === totalPages;
    const nextClass = nextDisabled ? DISABLED_CLASS : "";
    const nextSvgColor = nextDisabled ? "#c0c0c0" : "#828282";
    const nextSvgDisabled = `<svg width="16" height="12" viewBox="0 0 16 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M0.750061 0.75L7.75006 5.75L0.750061 10.75" stroke="${nextSvgColor}" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M6.75006 0.75L13.7501 5.75L6.75006 10.75" stroke="${nextSvgColor}" stroke-width="1.5" stroke-linecap="round"/>
    </svg>`;
    html += `<li class="pagination__item ${nextClass}">`;
    if (nextDisabled) {
      html += `<span class="pagination__link js-pagination-next" aria-label="次のページへ（現在${totalPages}ページ目）" aria-disabled="true" tabindex="-1" role="link">`;
      html += nextSvgDisabled;
      html += "</span>";
    } else {
      html += `<a class="pagination__link js-pagination-next" href="#" aria-label="次のページへ（${currentPage + 1}ページ目）" aria-disabled="false">`;
      html += nextSvg;
      html += "</a>";
    }
    html += "</li>";

    return html;
  };

  // ページネーションのHTMLを生成
  $pagination.html(generatePaginationHTML()).attr("aria-busy", "false");

  // ニュースアイテムの表示/非表示を制御する関数
  const updateNewsItems = (page) => {
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE - 1;

    $newsList.find("[data-item-index]").each(function () {
      const itemIndex = parseInt($(this).attr("data-item-index"), 10);
      if (itemIndex >= startIndex && itemIndex <= endIndex) {
        $(this).show();
      } else {
        $(this).hide();
      }
    });
  };

  // ページを更新する関数
  const updatePagination = (page) => {
    if (page < 1 || page > totalPages) return;

    currentPage = page;

    // ニュースアイテムの表示/非表示を更新
    updateNewsItems(page);

    // ページネーションのHTMLを再生成（前/次のボタンの状態も含む）
    $pagination.html(generatePaginationHTML()).attr("aria-busy", "false");

    // URLを更新（履歴に追加しない）
    const newUrl = new URL(window.location);
    if (page === 1) {
      newUrl.searchParams.delete("page");
    } else {
      newUrl.searchParams.set("page", page);
    }
    window.history.replaceState({}, "", newUrl);
  };

  // イベントハンドラを設定（委譲イベントなので動的に追加された要素にも機能する）
  $(document).on("click", ".js-pagination-link", function (e) {
    e.preventDefault();
    const page = parseInt($(this).attr("data-page"), 10);
    if (page && page !== currentPage) {
      updatePagination(page);
      // フォーカス管理：ページ切り替え後に最初のニュースアイテムにフォーカスを移動
      const $firstVisibleItem = $newsList
        .find("[data-item-index]")
        .filter(":visible")
        .first();
      if ($firstVisibleItem.length) {
        $firstVisibleItem.find("a").focus();
      }
    }
  });

  // 前のページボタンのクリック処理
  $(document).on("click", ".js-pagination-prev", function (e) {
    e.preventDefault();
    if (currentPage > 1 && !$(this).attr("aria-disabled")) {
      updatePagination(currentPage - 1);
      // フォーカス管理
      const $firstVisibleItem = $newsList
        .find("[data-item-index]")
        .filter(":visible")
        .first();
      if ($firstVisibleItem.length) {
        $firstVisibleItem.find("a").focus();
      }
    }
  });

  // 次のページボタンのクリック処理
  $(document).on("click", ".js-pagination-next", function (e) {
    e.preventDefault();
    if (currentPage < totalPages && !$(this).attr("aria-disabled")) {
      updatePagination(currentPage + 1);
      // フォーカス管理
      const $firstVisibleItem = $newsList
        .find("[data-item-index]")
        .filter(":visible")
        .first();
      if ($firstVisibleItem.length) {
        $firstVisibleItem.find("a").focus();
      }
    }
  });

  // キーボードナビゲーションのサポート（AUIGガイドラインに準拠）
  $(document).on(
    "keydown",
    ".js-pagination-link, .js-pagination-prev, .js-pagination-next",
    function (e) {
      // EnterキーとSpaceキーでクリックと同じ動作
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (!$(this).attr("aria-disabled")) {
          $(this).click();
        }
      }
    }
  );

  // 初期化
  // 最初にニュースアイテムを非表示にしてから、現在のページのアイテムを表示
  $newsList.find("[data-item-index]").hide();
  updatePagination(currentPage);
});
