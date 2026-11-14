# 改修プラン：無線機制御「受信固定」「送信固定」対応

## 概要

無線機の周波数制御パネルにある「Dopplerモード」セレクトボックス（`DopplerShiftModeSelect.vue`）は、現状「衛星固定」以外の選択肢（「受信固定」「送信固定」）が非活性化されている。
調査の結果、ドップラーシフト補正の適用/非適用を切り替える中核ロジック（`useTransceiverCtrl.ts` の `updateDopplerShiftCorrectionFlags()`）は、**既に「受信固定」「送信固定」の挙動に対応済み**であることが判明した。そのため本改修は、

1. セレクトボックスの非活性化解除（UI変更）
2. 上記ロジックの単体テスト追加（既存はゼロ件のため、テスト容易性のための軽微なリファクタを含む）
3. 設計ドキュメントの更新

が中心となる。ロジック自体の新規実装は不要。

## 現状ロジックの分析（変更不要部分の根拠）

### ドップラーシフトモード定義

`src/common/Constant.ts:253-259`

```ts
public static readonly DopplerShiftMode = class {
  static readonly FIXED_SAT = "FIXED_SAT"; // 衛星固定
  static readonly FIXED_RX = "FIXED_RX";   // 受信固定
  static readonly FIXED_TX = "FIXED_TX";   // 送信固定
};
```

### 補正適用/非適用フラグの算出（既存実装・要求を満たしている）

`src/renderer/components/organisms/TransceiverCtrl/useTransceiverCtrl.ts:476-483`

```ts
function updateDopplerShiftCorrectionFlags() {
  execTxDopplerShiftCorrection.value =
    dopplerShiftMode.value === Constant.Transceiver.DopplerShiftMode.FIXED_SAT ||
    dopplerShiftMode.value === Constant.Transceiver.DopplerShiftMode.FIXED_RX;
  execRxDopplerShiftCorrection.value =
    dopplerShiftMode.value === Constant.Transceiver.DopplerShiftMode.FIXED_SAT ||
    dopplerShiftMode.value === Constant.Transceiver.DopplerShiftMode.FIXED_TX;
}
```

- **受信固定 (FIXED_RX)**：`execTx=true` / `execRx=false` → Tx側のみドップラー補正（要求「送信周波数はドップラーシフトの変更を適用する（衛星固定と同一の挙動）」を満たす）。Rx側は補正されないため、Auto開始時に設定された値のまま固定される（要求「受信周波数はドップラーシフトの変更を適用しない」を満たす）。
- **送信固定 (FIXED_TX)**：`execTx=false` / `execRx=true` → Rx側のみドップラー補正。Tx側は固定。
- **衛星固定 (FIXED_SAT)**：両方補正（既存動作、変更なし）。

このフラグは `updateFreq()`（`useTransceiverCtrl.ts:449-471`）が Auto 中に周期実行するたびに再計算され、`applyDopplerShiftCorrections()`（`useTransceiverCtrl.ts:488-499`）内でフラグに応じて `freqCoordinator.updateRxFreqWithDopplerShift` / `updateTxFreqByInvertingHeterodyne` の呼び出しを分岐している。

### Auto ON時の初期周波数設定（既存実装・要求を満たしている）

`TransceiverModeCoordinator.startAutoMode()`（`coordinators/TransceiverModeCoordinator.ts:135-188`）は、`dopplerShiftMode` の値に関わらず、Auto開始時に `setFreqAndOpeModeInModeStart()` → `TransceiverModeSettingResolver.resolveAutoModeSetting()`（`resolvers/TransceiverModeSettingResolver.ts:133-163`）を呼び出し、**Tx/Rx双方**をアクティブ衛星の生周波数（uplinkHz/downlinkHz、ドップラーシフト未適用）に設定する。

- 受信固定時：この時点でRx周波数は選択中衛星の受信周波数に設定される（要求を満たす）。以降 `execRxDopplerShiftCorrection=false` のため更新されず、この値のまま固定され続ける。
- 送信固定時：同様にTx周波数が選択中衛星の送信周波数に設定され、以降固定される。

→ モード別の分岐を追加しなくても、「Auto ON時に対象周波数を衛星の周波数に設定し、以降ドップラー補正しない」という要求を、既存の「Auto開始時は生周波数をセットし、次回以降のインターバル処理でモードに応じた補正のみ適用する」という設計がそのまま満たしている。

### 衛星切替時の挙動（既存実装・変更不要）

`onChangeSatGrp()`（`useTransceiverCtrl.ts:180-192`）は、Auto中にアクティブ衛星が変わった場合 `startAutoMode()` を再実行する。これによりモードに関わらず一貫して「新しい衛星の周波数で再初期化」される。受信固定/送信固定固有の特別処理は不要。

## 変更内容

### 1. UI変更：セレクトボックスの活性化

`src/renderer/components/molecules/DopplerShiftModeSelect/DopplerShiftModeSelect.vue`

- `dopplerShiftModeRange` 内の `props: { disabled: mode !== DopplerShiftMode.FIXED_SAT }` を削除し、`props` ごと削除する（TODOコメントの指示通り）。

```ts
// 変更前
const dopplerShiftModeRange = ref(
  Object.values(DopplerShiftMode).map((mode: string) => ({
    value: mode,
    title: dopplerShiftModeLabel[mode],
    // TODO: 受信固定、送信固定に対応するまでは衛星固定のみを有効化
    //       対応後は、以下のpropsは削除して良い
    props: { disabled: mode !== DopplerShiftMode.FIXED_SAT },
  }))
);

// 変更後
const dopplerShiftModeRange = ref(
  Object.values(DopplerShiftMode).map((mode: string) => ({
    value: mode,
    title: dopplerShiftModeLabel[mode],
  }))
);
```

### 2. テスト容易性のためのリファクタ＋単体テスト追加

`updateDopplerShiftCorrectionFlags()` は `useTransceiverCtrl.ts` 内のクロージャとして実装されており、現状このファイルに対するテストは1件も存在しない。本プロジェクトは同種のモード判定・解決ロジックを `resolvers/` 配下のクラス（`TransceiverModeSettingResolver` 等）に切り出し、`ClassName_methodName.test.ts` の命名規則で単体テストを書く方針が徹底されている（`TransceiverModeSettingResolver_resolveOnModeStart.test.ts` 等）。この規約に合わせ、フラグ算出ロジックのみを最小限のクラスへ切り出す。

**新規ファイル**: `src/renderer/components/organisms/TransceiverCtrl/resolvers/TransceiverDopplerModeResolver.ts`

```ts
import Constant from "@/common/Constant.js";

export interface DopplerShiftCorrectionFlags {
  execTxDopplerShiftCorrection: boolean;
  execRxDopplerShiftCorrection: boolean;
}

/**
 * ドップラーシフトモード（衛星固定/受信固定/送信固定）から、Tx/Rxそれぞれの
 * ドップラーシフト補正要否を解決する
 */
export default class TransceiverDopplerModeResolver {
  public resolveCorrectionFlags(dopplerShiftMode: string): DopplerShiftCorrectionFlags {
    return {
      execTxDopplerShiftCorrection:
        dopplerShiftMode === Constant.Transceiver.DopplerShiftMode.FIXED_SAT ||
        dopplerShiftMode === Constant.Transceiver.DopplerShiftMode.FIXED_RX,
      execRxDopplerShiftCorrection:
        dopplerShiftMode === Constant.Transceiver.DopplerShiftMode.FIXED_SAT ||
        dopplerShiftMode === Constant.Transceiver.DopplerShiftMode.FIXED_TX,
    };
  }
}
```

**修正ファイル**: `src/renderer/components/organisms/TransceiverCtrl/useTransceiverCtrl.ts`

- `TransceiverDopplerModeResolver` をインポートし、他のresolver同様にインスタンス化する。
- `updateDopplerShiftCorrectionFlags()` の中身を、resolver呼び出し＋Refへの反映に置き換える（関数名・呼び出し箇所・振る舞いは変更しない）。

```ts
const dopplerModeResolver = new TransceiverDopplerModeResolver();

function updateDopplerShiftCorrectionFlags() {
  const flags = dopplerModeResolver.resolveCorrectionFlags(dopplerShiftMode.value);
  execTxDopplerShiftCorrection.value = flags.execTxDopplerShiftCorrection;
  execRxDopplerShiftCorrection.value = flags.execRxDopplerShiftCorrection;
}
```

**新規テストファイル**: `src/__tests__/renderer/components/organisms/TransceiverCtrl/resolvers/TransceiverDopplerModeResolver_resolveCorrectionFlags.test.ts`

- ケース1：`FIXED_SAT` → `{ execTxDopplerShiftCorrection: true, execRxDopplerShiftCorrection: true }`
- ケース2：`FIXED_RX` → `{ execTxDopplerShiftCorrection: true, execRxDopplerShiftCorrection: false }`
- ケース3：`FIXED_TX` → `{ execTxDopplerShiftCorrection: false, execRxDopplerShiftCorrection: true }`

### 3. UI（.vue）側の変更確認

`DopplerShiftModeSelect.vue` の disabled解除自体は、プロジェクト内に molecules配下の `.vue` を直接マウントするテスト前例が無い（既存テストは全て `use*.ts` composable/util 単位）ため、新規のマウントテストは追加せず、`npm run app:dev` での目視確認で担保する。

## ドキュメント更新

`doc/30_画面設計/G2_メイン.md` の「2.3 無線機制御パネル主要項目」に新規セクション「2.3.2 Dopplerモード」を追加する（`DopplerShiftModeSelect` はテンプレート上でAutoボタンの直後、Rx周波数の前に配置されているため、Auto の次に挿入し、既存の2.3.2〜2.3.12は2.3.3〜2.3.13へ繰り下げる）。

追加内容（イメージ）：

```
### 2.3.2 Dopplerモード

| 項目       | 内容                                                     |
| ---------- | -------------------------------------------------------- |
| ①説明      | ドップラーシフト補正の基準（衛星固定/受信固定/送信固定）を選択する。 |
| ②種別      | セレクトボックス                                           |
| ③表示/入力 | 入力                                                       |
| ④表示条件  | 常時                                                       |

⑤制御条件

- 衛星固定：Auto ON時にRx/Tx周波数を選択中衛星の周波数に設定し、以降Rx/Tx双方にドップラーシフト補正を適用する。
- 受信固定：Auto ON時にRx周波数を選択中衛星の受信周波数に設定し、以降Rxにはドップラーシフト補正を適用しない（固定）。Txには適用する（衛星固定と同様）。
- 送信固定：Auto ON時にTx周波数を選択中衛星の送信周波数に設定し、以降Txにはドップラーシフト補正を適用しない（固定）。Rxには適用する（衛星固定と同様）。
```

既存の見出し番号（2.3.2 Rx周波数 〜 2.3.12 Date Time）は1つずつ繰り下げ、本文中の相互参照があれば合わせて修正する。

## 影響範囲・リスク

- `updateDopplerShiftCorrectionFlags()` のロジック自体は移動のみで、判定条件・呼び出しタイミングは変更しない。既存の「衛星固定」の動作（現在利用可能な唯一のモード）に影響はない。
- `DopplerShiftModeSelect.vue` の変更はUIの非活性制御を外すのみで、値の選択肢自体（`FIXED_SAT`/`FIXED_RX`/`FIXED_TX`）やラベルは変更しない。
- 無線機の実機（またはシミュレータ）での動作確認が必要（Rx/Tx周波数が固定モードで実際にドップラー追従しないこと、Auto ON直後に選択中衛星の周波数が設定されること）。本タスクリストの最終確認は `npm run app:dev` による手動確認で行う。
