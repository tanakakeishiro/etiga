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

jQuery("#js-drawer-button").on("click", function (e) {
  e.preventDefault();
  jQuery("#js-drawer-button").toggleClass("is-checked");
  jQuery("#js-drawer-content").toggleClass("is-checked");
});

// sp表示のときにドロワーメニューが開いている状態でリンクをクリックしたときに、ドロワーメニューを閉じるようにするためのコードです。
jQuery('#js-drawer-content a[href^="#"]').on("click", function (e) {
  jQuery("#js-drawer-icon").removeClass("is-checked");
  jQuery("#js-drawer-content").removeClass("is-checked");
});

$("#js-drawer-button").click(function () {
  $(".drawer-icon__bar").toggleClass("drawer-icon__color");
});

const swiper = new Swiper("#js-work-swiper", {
  // Optional parameters
  loop: true,
  // slidesPerView: "auto"に上書きされるから消した。
  // slidesPerView: 1.25,
  spaceBetween: 18,
  //画面幅を変えることができる。
  slidesPerView: "auto",

  // If we need pagination
  pagination: {
    el: "#js-work-pagination",
  },

  // Navigation arrows
  navigation: {
    nextEl: "#js-work-next",
    prevEl: "#js-work-prev",
  },
});

$(function () {
  $(".js-content:first-of-type").css("display", "block");
  $(".js-tab").on("click", function () {
    $(".current").removeClass("current");
    $(this).addClass("current");
    const index = $(this).index();
    $(".js-content").hide().eq(index).fadeIn(300);
  });
});

$(function () {
  $(".js-accordion").click(function () {
    //クリックされた質問の子要素のspan以外からはopenというクラスを外す
    $(".js-accordion").not(this).children("span").removeClass("open");
    //クリックされた質問部分に対する回答以外は全て閉じる
    $(".js-accordion").not(this).next().slideUp(400);

    //クリックされた質問の子要素のspanにopenクラスが付与されいなければ付与し、付与されていれば外す
    $(this).children("span").toggleClass("open");
    //クリックされた質問に対する回答を表示する
    $(this).next().slideToggle(400);
  });
});
