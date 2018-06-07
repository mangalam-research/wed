module.exports = {
  extends: "lddubeau-base",
  parserOptions: {
    sourceType: "module"
  },
  env: {
    node: true,
  },
  rules: {
    "import/no-extraneous-dependencies": "off",
  }
};
