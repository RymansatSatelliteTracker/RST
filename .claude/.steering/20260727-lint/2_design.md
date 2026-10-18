# 改修プラン

## 概要

`npm run lint` の実行結果、48件のエラー（警告0件）が検出された。
全て `src/__tests__/` 配下のテストファイルにおける TypeScript ESLint の型安全性ルール違反であり、
`any` 型の使用に起因するもの。

対象ルール:
- `@typescript-eslint/no-explicit-any`（明示的な `any` 型指定）
- `@typescript-eslint/no-unsafe-assignment`（`any` 値の代入）
- `@typescript-eslint/no-unsafe-return`（`any` 値の返却）
- `@typescript-eslint/no-unsafe-call`（`any` 型の呼び出し）
- `@typescript-eslint/no-unsafe-member-access`（`any` 型からのメンバアクセス）
- `@typescript-eslint/no-unsafe-argument`（`any` 値の引数渡し）

## 対象ファイル一覧

| No | ファイル | 件数 |
|---|---|---|
| 1 | src/__tests__/common/model/DefaultSatelliteModel.test.ts | 2 |
| 2 | src/__tests__/main/service/AppConfigSatelliteService.test.ts | 2 |
| 3 | src/__tests__/main/service/DefaultSatelliteService.test.ts | 1 |
| 4 | src/__tests__/main/service/OmmService_migrateFromTleJsonIfNeeded.test.ts | 4 |
| 5 | src/__tests__/main/util/AppConfigUtil.test.ts | 9 |
| 6 | src/__tests__/main/validator/AppConfigValidator_exec.test.ts | 3 |
| 7 | src/__tests__/main/validator/FrequencyValidator_exec.test.ts | 4 |
| 8 | src/__tests__/renderer/components/organisms/TransceiverCtrl/calculators/TransceiverDopplerCalc_calcBaseFreqByShiftedRxFreq.test.ts | 2 |
| 9 | src/__tests__/renderer/components/organisms/TransceiverCtrl/calculators/TransceiverDopplerCalc_calcBaseFreqByShiftedTxFreq.test.ts | 2 |
| 10 | src/__tests__/renderer/components/organisms/TransceiverCtrl/calculators/TransceiverDopplerCalc_calcNewRxFreqWithDoppler.test.ts | 2 |
| 11 | src/__tests__/renderer/components/organisms/TransceiverCtrl/calculators/TransceiverDopplerCalc_calcNewTxFreqWithDoppler.test.ts | 4 |
| 12 | src/__tests__/renderer/components/organisms/TransceiverCtrl/resolvers/TransceiverOpeModeResolver_applyFromTransceiver.test.ts | 6 |
| 13 | src/__tests__/renderer/components/organisms/TransceiverCtrl/resolvers/TransceiverRecvFreqResolver_applyFromTransceiver.test.ts | 6 |
| 14 | src/__tests__/renderer/service/FrequencyTrackService.test.ts | 1 |

合計: 48件

## 対応方針

いずれも本番コードではなくテストコードでの発生であり、根本原因はテスト内で以下のようなパターンが `any` を生んでいること。

1. `JSON.parse(...)` や `readFileSync` の戻り値をそのまま変数に代入・使用している（型注釈がなく `any` 推論される）
2. モックオブジェクトを `any` として明示的にキャストしている（例: `as any`）
3. サードパーティ/内部関数の戻り値の型が解決できていない、またはインデックスアクセスで型が失われている

対応方針は以下の通り、ケースバイケースで「型を明示する」ことを優先し、テストの意図が壊れない範囲で `any` を除去する。

- **JSON.parse / ファイル読込結果**: 対象の型（インターフェース）が既存であればその型でキャスト（`as SomeType`）、無ければ `unknown` を経由して必要なプロパティのみアクセスする、または既存の型定義を利用する。
- **モックの `any` キャスト**: 可能な限り実際の型（またはその型の `Partial<T>` やモック生成ヘルパー）を使う。困難な場合は `unknown as T` の二段キャストで安全性を明示する。
- **インデックスアクセスで型が失われるケース**（`OmmService_migrateFromTleJsonIfNeeded.test.ts` の `["25544"]` など）: 型注釈を付与し、直接プロパティアクセスできるようにする。
- **`ApiResponse<any>` を `ApiResponse<UplinkType | DownlinkType>` に渡している箇所**: ジェネリクスの型引数を明示することで解消する。

## 影響範囲

- 修正はテストコードのみで、プロダクションコード（`src/main`, `src/renderer`, `src/common` の実装部分）には影響しない。
- テストの挙動（アサーション内容）は変更しない。型注釈の追加・キャスト方法の変更のみを行う。
- `/doc` 配下の設計ドキュメントへの影響はなし（実装仕様の変更を伴わないため）。

## リスク

- 型を厳密にする過程で、テストが本来検出すべきだった型不整合が顕在化し、コンパイルエラーになる可能性がある。その場合はテスト対象のプロダクションコード側の型定義を確認し、必要であればテストデータを修正する。
