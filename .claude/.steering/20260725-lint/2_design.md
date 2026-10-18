# 改修プラン

## 要求の変更

要求が「lint警告への対応」から「lintエラー、警告への対応」に拡大された。
これに伴い、対象範囲を再調査し、本ドキュメントを全面的に更新する。

## 全体像

`npm run lint` を実行すると `668件（619 error / 49 warning）` が報告されるが、このうち **76件は `src/__tests__` 配下のテストファイルが `tsconfig.json` の対象外であることによるパースエラー**であり、当該ファイルはパースに失敗した時点でそれ以外のルールチェックがスキップされている。

テストファイルも型情報付きでチェックできるよう設定を是正した上で再計測した結果、真の対象件数は以下の通り。

**665件（608 error / 57 warning）、対象144ファイル**

### ルール別内訳（上位）

| ルール | 件数 | 種別 |
|---|---|---|
| `@typescript-eslint/no-unsafe-member-access` | 99 | error |
| `@typescript-eslint/no-unsafe-assignment` | 69 | error |
| `@typescript-eslint/no-explicit-any` | 69 | error |
| `@typescript-eslint/require-await` | 68 | error |
| `@typescript-eslint/no-unsafe-call` | 65 | error |
| `@typescript-eslint/no-unused-vars` | 52 | warning |
| `@typescript-eslint/no-floating-promises` | 45 | error |
| `@typescript-eslint/no-unsafe-function-type` | 42 | error |
| `@typescript-eslint/no-unsafe-return` | 41 | error |
| `@typescript-eslint/no-unsafe-argument` | 33 | error |
| `@typescript-eslint/no-misused-promises` | 28 | error |
| `@typescript-eslint/await-thenable` | 11 | error |
| `@typescript-eslint/unbound-method` | 7 | error |
| `@typescript-eslint/no-redundant-type-constituents` | 5 | error |
| `vue/require-prop-types` | 4 | warning |
| `@typescript-eslint/prefer-promise-reject-errors` | 4 | error |
| `eqeqeq` / `no-fallthrough` | 各3 | error |
| `@typescript-eslint/no-base-to-string` / `restrict-template-expressions` | 各3 | error |
| `no-useless-escape` / `no-empty-object-type` | 各2 | error |
| その他（`ban-types`, `no-irregular-whitespace`, `no-async-promise-executor`, `no-prototype-builtins`, `consistent-type-imports`, `no-empty-pattern`, `restrict-plus-operands`） | 各1 | - |

## 対応方針（ユーザー確認済み）

規模が大きいため、以下の方針で合意した。

1. **型安全性系ルール（`no-explicit-any`, `no-unsafe-*` 系, 計430件）は今回の対象外とし、別タスクとして切り出す。**
   理由: IPC通信・シリアル通信・zodスキーマなど外部境界の型定義を新たに設計する必要があり、単純な機械的修正では対応できないため。
2. **残りの機械的に対応可能な235件（tsconfig/eslint設定の是正を含む）を、フェーズに分けて段階的に修正・確認する。**

対象外とするルール一覧（430件、次回以降の別タスク）:
`no-unsafe-member-access`(99) / `no-unsafe-assignment`(69) / `no-explicit-any`(69) / `no-unsafe-call`(65) / `no-unsafe-function-type`(42) / `no-unsafe-return`(41) / `no-unsafe-argument`(33) / `no-redundant-type-constituents`(5) / `no-base-to-string`(3) / `restrict-template-expressions`(3) / `restrict-plus-operands`(1)

## フェーズ構成（今回対応する235件）

### Phase 0. lint設定の是正（テストファイルのパースエラー76件を解消）

`tsconfig.json` は `src/__tests__/**/*` を明示的に除外している（Vitestが直接トランスパイルするため）が、`eslint.config.js` の `parserOptions.project` は `./tsconfig.json` を直接参照しており、型情報を要求するルールを評価する際にテストファイルが対象外エラーとなっている。

**対応**:
- `tsconfig.eslint.json` を新規作成し、`tsconfig.json` を継承した上で `exclude` を空にしてテストファイルも含める（ESLint専用、`tsc`によるビルドには影響しない）。
- `eslint.config.js` の `parserOptions.project` を `./tsconfig.eslint.json` に変更する。

これにより、テストファイルも型情報付きでチェックされるようになり、隠れていた警告・エラーが可視化される（Phase 1, 2 の件数に反映済み）。

### Phase 1. Promise関連ルール（164件、71ファイル）

対象ルール: `no-floating-promises`(45) / `require-await`(68) / `no-misused-promises`(28) / `await-thenable`(11) / `unbound-method`(7) / `prefer-promise-reject-errors`(4) / `no-async-promise-executor`(1)

**修正方針**:
- `no-floating-promises`: 呼び捨てにされているPromiseに対し、文脈に応じて `await` を付与する。結果を待つ必要がない場合は `void` 演算子で意図的な破棄を明示し、エラーハンドリングが必要な箇所は `.catch()` を追加する。
- `require-await`: `async` 宣言されているが内部で `await` を使用していない関数。実装上非同期処理が不要であれば `async` を除去する。呼び出し元のインターフェース（基底クラス実装など）の都合で `async` を維持する必要がある場合は、そのまま残し個別に判断する。
- `no-misused-promises`: `void` を期待する箇所（イベントハンドラ等）にPromiseを返す関数を渡している。`void` 演算子でラップするか、同期関数でラップして内部で非同期処理を呼び出す形に変更する。
- `await-thenable`: Promiseではない値に `await` を付けている。不要な `await` を削除する。
- `unbound-method`: クラスメソッドをコールバックとして渡す際に `this` 参照が失われる可能性がある。アロー関数でラップするか、必要に応じてメソッド定義側に対応する。
- `prefer-promise-reject-errors`: `reject()` に `Error` 以外の値を渡している。`new Error(...)` でラップする。
- `no-async-promise-executor`: `new Promise(async (resolve, reject) => {...})` の形式。`async` executorをやめ、通常の同期executor内で非同期処理を`.then()`チェーンに書き換えるか、別関数に切り出す。

主な対象ファイル（上位）: `useRotatorCtrl.ts`(20), `SerialComm.ts`(12), `TransceiverSerivice.ts`(8), `initializeIpcEvent.ts`(7), `TransceiverIcomController.ts`(5), `menu.ts`(5) ほか。

### Phase 2. 未使用変数・Vue prop型・軽微な構文ルール（71件、36ファイル）

対象ルール: `no-unused-vars`(52) / `vue/require-prop-types`(4) / `consistent-type-imports`(1) / `eqeqeq`(3) / `no-fallthrough`(3) / `no-useless-escape`(2) / `no-empty-object-type`(2) / `ban-types`(1) / `no-irregular-whitespace`(1) / `no-prototype-builtins`(1) / `no-empty-pattern`(1)

**修正方針**:
- `no-unused-vars`（関数引数）: `eslint.config.js` の `argsIgnorePattern: "^_"` を利用し `_` プレフィックスを付与する。
- `no-unused-vars`（catch節の変数）: optional catch binding化（`catch (error)` → `catch`）。
- `no-unused-vars`（変数・定数・分割代入・import）: 完全に未使用なものは削除する。ただし `RepoFrequencyService.ts` のようにrest構文で意図的にプロパティを除外しているケースは、`eslint.config.js` の `@typescript-eslint/no-unused-vars` に `ignoreRestSiblings: true` を追加して対応する。
- `vue/require-prop-types`: `defineModel(...)` にジェネリック型引数を明示する（実際の使用箇所から型を特定）。
- `consistent-type-imports`: 型のみを利用しているimportを `import type` に変更する。
- `eqeqeq`: `==`/`!=` を `===`/`!==` に変更する（`null`との比較のみ許容のため対象外を判別）。
- `no-fallthrough`: switch文のcase処理漏れ。意図的なfallthroughであれば `// falls through` コメントを付与、そうでなければ `break` を追加する。
- `no-useless-escape`: 不要なバックスラッシュエスケープを削除する。
- `no-irregular-whitespace`: 不正な空白文字を通常の半角スペースに置換する。
- `no-prototype-builtins`: `obj.hasOwnProperty(x)` を `Object.prototype.hasOwnProperty.call(obj, x)` に置換する。
- `no-empty-pattern`: 空の分割代入パターンを実装意図に応じて修正する。
- `ban-types` / `no-empty-object-type`（`src/renderer/env.d.ts`）: 廃止された `@typescript-eslint/ban-types` を参照している `eslint-disable-next-line` コメントを、現行ルール名 `@typescript-eslint/no-empty-object-type` に修正する。

主な対象ファイル（上位）: `initializeIpcEvent.ts`(18), `FileTransaction.test.ts`(6), `TransceiverIcomController.ts`(4), `env.d.ts`(3), `preload.ts`(3), `GroundStationSetting.vue`(3) ほか。

## 影響確認

- すべて未使用コードの削除・リネーム、Promiseハンドリングの明示化、設定ファイルの是正であり、実行時の正常系の挙動は変更しない想定。ただし `no-floating-promises` / `no-misused-promises` の対応でエラーハンドリング（`.catch()`）を新規追加する箇所は、例外発生時の挙動が「未処理の例外」から「捕捉してログ出力等」に変わるため、既存のエラーハンドリング方針（`emitter.emit(Constant.GlobalEvent.NOTICE_ERR, ...)` 等）に合わせる。
- 各フェーズ実施後に `npm run test` と `npm run lint` を実行し、対象フェーズのルールに該当する件数が0件になっていること、テストが引き続き成功することを確認する。
- Phase 0 の設定変更は `npm run app:build` / `npm run ts` のビルド挙動に影響しないことを確認する（`tsconfig.eslint.json` はESLint専用であり、`tsconfig.json` 自体は変更しない）。

## 対象外（次回以降の別タスク）

型安全性系ルール（`no-explicit-any`, `no-unsafe-*` 等 計430件）は、IPC・シリアル通信・zodスキーマ等の境界の型定義整備を伴う大規模な改修となるため、別の `.claude/.steering` タスクとして切り出すことを推奨する。
