module.exports = {
  plugins: [
    require("postcss-preset-env")({
      stage: 0,
      browsers: [
        "> 0.5%",
        "last 3 versions",
        "not dead",
        "not ie <= 11",
        "not op_mini all",
        "iOS >= 12",
        "Safari >= 14",
      ],
      features: {
        clamp: true,
        min: true,
        max: true,
      },
    }),
  ],
};
