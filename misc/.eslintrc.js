module.exports = {
  extends: "lddubeau-base",
  parserOptions: {
    sourceType: "script"
  },
  env: {
    node: true,
    commonjs: true,
  },
  rules: {
    "import/no-extraneous-dependencies": "off",
    "indent" : ["error", 2, {
      "ArrayExpression": "first"
    }],
  }
};
