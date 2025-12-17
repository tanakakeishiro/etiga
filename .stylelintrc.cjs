module.exports = {
  extends: ["stylelint-config-standard-scss"],
  ignoreFiles: ["**/node_modules/**"],
  syntax: "scss", // SCSS構文を使用する
  rules: {
    "no-descending-specificity": null, // このルールを無効にする
    // ベンダープレフィックの修正はしない
    "property-no-vendor-prefix": null,
    // コメントの整形はさせる
    "comment-empty-line-before": "always",
    // メディアクエリの演算子を禁止する（いまはとりあえず）
    "media-feature-range-notation": "prefix",
    // BEM 記法を許可
    "selector-class-pattern": "^[a-z0-9\\-_]+$",
    "at-rule-empty-line-before": null, // このルールを無効にする
    "custom-property-empty-line-before": null, // このルールを無効にする
    "scss/no-global-function-names": null,
  },
};
