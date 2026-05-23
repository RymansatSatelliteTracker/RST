import js from "@eslint/js";
import vue from "eslint-plugin-vue";
import tseslint from "typescript-eslint";
import vueParser from "vue-eslint-parser";
import prettier from "eslint-config-prettier";

export default [
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...vue.configs["flat/recommended"],

  {
    files: ["src/**/*.{ts,vue}"],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tseslint.parser,
        ecmaVersion: "es2023",
        sourceType: "module",
        project: "./tsconfig.json",
      },
    },
    rules: {
      // 基本ルール
      "no-console": "off", // console.logを許可
      "no-debugger": "warn", // debuggerは警告

      // TypeScriptルール
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }], // _で始まる引数は無視
      "@typescript-eslint/consistent-type-imports": "warn", // type import推奨
      "@typescript-eslint/no-unnecessary-type-assertion": "off", // 不必要な型アサーションを許可

      // Vueルール
      "vue/multi-word-component-names": "off", // コンポーネント名制約OFF
      "vue/no-v-html": "off", // v-html許可
      "vue/html-self-closing": [
        "warn",
        {
          html: {
            void: "always", // <img /> OK
            normal: "never", // <div /> NG
            component: "always", // <MyComp /> OK
          },
        },
      ],

      // コーディング規約
      eqeqeq: ["error", "smart"], // ===(厳密等価) を基本強制（nullチェックのみ == 許可）
      curly: ["error", "all"], // 波括弧必須
    },
  },
  {
    // Lint対象外ファイル
    ignores: ["dist", "public", "node_modules", "release", "coverage"],
  },
  // Prettierの競合回避
  prettier,
];
