module.exports = {
  extends: [
    "lddubeau-base/es5",
    "../.eslintrc-common.js",
  ],
  env: {
    amd: true,
  },
  rules: {
    "prefer-destructuring": "off"
  }
};
