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

  // 定数定義
  const CONFIG = {
    ITEMS_PER_PAGE: 5,
    ACTIVE_CLASS: "pagination__item--active",
    DISABLED_CLASS: "pagination__item--disabled",
    VISIBLE_CLASS: "on",
    SVG_COLORS: {
      DEFAULT: "#828282",
      DISABLED: "#c0c0c0",
    },
  };

  // SVGパス定義
  const SVG_PATHS = {
    PREV: [
      "M14.2903 0.75L7.29034 5.75L14.2903 10.75",
      "M8.29034 0.75L1.29034 5.75L8.29034 10.75",
    ],
    NEXT: [
      "M0.750061 0.75L7.75006 5.75L0.750061 10.75",
      "M6.75006 0.75L13.7501 5.75L6.75006 10.75",
    ],
  };

  // 状態管理
  let currentPage = 1;
  const $newsItems = $newsList.find("[data-item-index]");
  const totalItems = $newsItems.length;
  const totalPages = Math.ceil(totalItems / CONFIG.ITEMS_PER_PAGE);

  // 初期ページの取得（URLパラメータから）
  const getInitialPage = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const pageParam = urlParams.get("page");
    if (!pageParam) return 1;

    const page = parseInt(pageParam, 10);
    if (isNaN(page) || page < 1) return 1;
    if (page > totalPages) return totalPages;
    return page;
  };

  currentPage = getInitialPage();

  // SVGアイコン生成関数
  const createSvgIcon = (paths, color = CONFIG.SVG_COLORS.DEFAULT) => {
    const pathElements = paths
      .map(
        (path) =>
          `<path d="${path}" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/>`
      )
      .join("");
    return `<svg width="16" height="12" viewBox="0 0 16 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${pathElements}</svg>`;
  };

  // ナビゲーションボタン生成関数
  const createNavButton = (type, disabled, targetPage) => {
    const isPrev = type === "prev";
    const paths = isPrev ? SVG_PATHS.PREV : SVG_PATHS.NEXT;
    const svgColor = disabled
      ? CONFIG.SVG_COLORS.DISABLED
      : CONFIG.SVG_COLORS.DEFAULT;
    const svg = createSvgIcon(paths, svgColor);
    const classNames = [
      "pagination__item",
      disabled ? CONFIG.DISABLED_CLASS : "",
    ]
      .filter(Boolean)
      .join(" ");

    let buttonHtml = "";
    if (disabled) {
      const label = isPrev
        ? `前のページへ（現在1ページ目）`
        : `次のページへ（現在${totalPages}ページ目）`;
      buttonHtml = `<li class="${classNames}">
        <span class="pagination__link js-pagination-${type}" 
              aria-label="${label}" 
              aria-disabled="true" 
              tabindex="-1" 
              role="link">${svg}</span>
      </li>`;
    } else {
      const label = isPrev
        ? `前のページへ（${targetPage}ページ目）`
        : `次のページへ（${targetPage}ページ目）`;
      buttonHtml = `<li class="${classNames}">
        <a class="pagination__link js-pagination-${type}" 
           href="#" 
           aria-label="${label}" 
           aria-disabled="false">${svg}</a>
      </li>`;
    }
    return buttonHtml;
  };

  // ページ番号生成関数
  const createPageNumbers = () => {
    let html = "";
    for (let i = 1; i <= totalPages; i++) {
      const isActive = i === currentPage;
      const classNames = [
        "pagination__item",
        isActive ? `${CONFIG.ACTIVE_CLASS} isActive` : "",
      ]
        .filter(Boolean)
        .join(" ");

      if (isActive) {
        html += `<li class="${classNames}" data-page="${i}">
          <span class="pagination__number" 
                aria-current="page" 
                aria-label="現在のページ、${i}ページ目">${i}</span>
        </li>`;
      } else {
        html += `<li class="${classNames}" data-page="${i}">
          <a class="pagination__link js-pagination-link" 
             href="#" 
             data-page="${i}" 
             aria-label="${i}ページ目へ移動">
            <span class="pagination__number">${i}</span>
          </a>
        </li>`;
      }
    }
    return html;
  };

  // ページネーションHTML生成関数
  const generatePaginationHTML = () => {
    const prevButton = createNavButton(
      "prev",
      currentPage === 1,
      currentPage - 1
    );
    const nextButton = createNavButton(
      "next",
      currentPage === totalPages,
      currentPage + 1
    );
    const pageNumbers = createPageNumbers();

    return prevButton + pageNumbers + nextButton;
  };

  // ニュースアイテムの表示/非表示制御
  const updateNewsItems = (page) => {
    const startIndex = (page - 1) * CONFIG.ITEMS_PER_PAGE;
    const endIndex = startIndex + CONFIG.ITEMS_PER_PAGE;

    $newsItems.each(function () {
      const $item = $(this);
      const itemIndex = parseInt($item.attr("data-item-index"), 10);
      const shouldShow = itemIndex >= startIndex && itemIndex < endIndex;

      $item.toggleClass(CONFIG.VISIBLE_CLASS, shouldShow);
    });
  };

  // URL更新関数
  const updateURL = (page) => {
    const newUrl = new URL(window.location);
    if (page === 1) {
      newUrl.searchParams.delete("page");
    } else {
      newUrl.searchParams.set("page", page);
    }
    window.history.replaceState({}, "", newUrl);
  };

  // フォーカス管理関数
  const focusFirstVisibleItem = () => {
    const $firstVisible = $newsItems.filter(`.${CONFIG.VISIBLE_CLASS}`).first();
    const $link = $firstVisible.find("a");
    if ($link.length) {
      $link[0].focus();
    }
  };

  // ページ更新関数
  const updatePagination = (page) => {
    if (page < 1 || page > totalPages || page === currentPage) return;

    currentPage = page;
    updateNewsItems(page);
    $pagination.html(generatePaginationHTML()).attr("aria-busy", "false");
    updateURL(page);
    focusFirstVisibleItem();
  };

  // イベントハンドラー
  const handlePaginationClick = (e, getTargetPage) => {
    e.preventDefault();
    const $target = $(e.currentTarget);
    if ($target.attr("aria-disabled") === "true") return;

    const targetPage = getTargetPage();
    if (targetPage && targetPage !== currentPage) {
      updatePagination(targetPage);
    }
  };

  // イベントリスナー設定
  $(document).on("click", ".js-pagination-link", function (e) {
    handlePaginationClick(e, () => {
      return parseInt($(this).attr("data-page"), 10);
    });
  });

  $(document).on("click", ".js-pagination-prev", function (e) {
    handlePaginationClick(e, () => currentPage > 1 && currentPage - 1);
  });

  $(document).on("click", ".js-pagination-next", function (e) {
    handlePaginationClick(e, () => currentPage < totalPages && currentPage + 1);
  });

  // キーボードナビゲーション
  $(document).on(
    "keydown",
    ".js-pagination-link, .js-pagination-prev, .js-pagination-next",
    function (e) {
      if (
        (e.key === "Enter" || e.key === " ") &&
        !$(this).attr("aria-disabled")
      ) {
        e.preventDefault();
        $(this).click();
      }
    }
  );

  // 初期化
  $pagination.html(generatePaginationHTML()).attr("aria-busy", "false");
  updateNewsItems(currentPage);
});
