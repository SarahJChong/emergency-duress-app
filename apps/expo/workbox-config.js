module.exports = {
  globDirectory: "dist/",
  globPatterns: ["**/*.{css,js,html,ttf,ico}"],
  swDest: "dist/sw.js",
  ignoreURLParametersMatching: [/^utm_/, /^fbclid$/],
};
