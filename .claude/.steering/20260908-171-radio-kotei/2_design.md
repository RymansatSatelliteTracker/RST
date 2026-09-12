# 改修プラン：送信固定/受信固定モードにおけるダイヤル操作の反映方法の是正

## 経緯・要求の確定

[`1_requirements.md`](./1_requirements.md) の文面だけでは解釈に幅があったため、初版の設計では「ダイヤル操作は常にRx側として扱い、Tx側の通知は衛星固定モード以外では常に破棄する」という方針で設計した（GitHub Issue [#171](https://github.com/RymansatSatelliteTracker/RST/issues/171)のコメント履歴を根拠とした）。

これに対しユーザーから下記の訂正が入り、方針を確定した。

> 実際の利用方法としては、送信固定、受信固定の際の受信周波数のダイヤル操作となります。
> ただし、ダイヤル操作は送信周波数側も可能なため、送信周波数のダイヤル操作はRSTの送信周波数に反映、受信周波数のダイヤル操作はRSTの受信周波数に反映する。
> その際に基準周波数Sumは保つ。

すなわち、Tx側のダイヤル操作を一律で破棄するのではなく、**ダイヤル操作されたのがTxかRxかに関わらず、その側のRST表示に直接反映し、もう一方の基準周波数はSumを保つように再計算する**、というのが正しい方針である。この挙動はモード（衛星固定/受信固定/送信固定）によらず共通とする。

- 送信固定/受信固定を選んでいる間の主な利用シーンは受信周波数側のダイヤル操作だが、送信周波数側のダイヤル操作も禁止せず、そのまま送信周波数として反映する。
- この結果、無線機からの周波数通知（Tx/Rxどちらも）の受け入れ方は、衛星固定モードで既に行っている処理と全モードで共通になる。
- 直前の改修（[`20260804-171-radio-kotei`](../20260804-171-radio-kotei/2_design.md)）で追加した「固定側（送信固定ならTx、受信固定ならRx）の無線機通知を画面表示・基準周波数とも反映せず破棄する」というロジックは、本改修で撤回する。
- 一方、**周期処理による自動追尾（ドップラーシフト補正）の対象がモードによって片側に限定される**という直前の改修のもう一つの柱（`TransceiverDopplerModeResolver.resolveCorrectionFlags`によるexecフラグ制御）はそのまま維持する。送信固定ならTxは周期的な自動追尾の対象外（Rxのみ自動追尾）、受信固定ならRxは対象外（Txのみ自動追尾）、衛星固定は両方が対象、という区分に変更はない。

つまり、「固定」とは「ダイヤル操作を受け付けない」ことではなく、「時間経過に伴うドップラーシフトの自動追従を行わず、直近にRST側へ確定した値のまま止まっている」ことを意味する、という理解に是正する。ダイヤル操作（無線機からの明示的な周波数通知）は、固定側であっても常にその値をRST側の確定値として採用してよい。

## 現状分析（直前の改修による実装、撤回対象）

[`TransceiverRecvFreqResolver.applyTxFromTransceiver`/`applyRxFromTransceiver`](../../../src/renderer/components/organisms/TransceiverCtrl/resolvers/TransceiverRecvFreqResolver.ts#L91-L174) には、直前の改修で追加された以下の2つのロジックがあり、これらが今回の要求（Tx/Rxどちらのダイヤル操作もその側にそのまま反映する）に反する。

1. **先頭の破棄判定**：Auto ON中、自分の側が「固定側」（`DopplerShiftCorrectionFlags`のexecフラグがfalse）であれば、無線機からの通知を画面表示・基準周波数とも反映せず破棄する（`isTxFixedSide`/`isRxFixedSide`によるガード、[L91-96](../../../src/renderer/components/organisms/TransceiverCtrl/resolvers/TransceiverRecvFreqResolver.ts#L91-L96), [L135-140](../../../src/renderer/components/organisms/TransceiverCtrl/resolvers/TransceiverRecvFreqResolver.ts#L135-L140)）。
2. **もう一方の基準周波数の据え置き**：Sum維持のために再計算されたもう一方の基準周波数（`newTxBaseFreq`/`newRxBaseFreq`）について、もう一方が固定側の場合は採用せず、既存値（`plainTxBaseFreq`/`plainRxBaseFreq`）を維持する（[L124-126](../../../src/renderer/components/organisms/TransceiverCtrl/resolvers/TransceiverRecvFreqResolver.ts#L124-L126), [L168-170](../../../src/renderer/components/organisms/TransceiverCtrl/resolvers/TransceiverRecvFreqResolver.ts#L168-L170)）。

この2つを撤回すると、`applyTxFromTransceiver`/`applyRxFromTransceiver`は（AutoOn/AutoOff判定・同値スキップ判定などは残しつつ）実質的に衛星固定モードで現在動いているのと同じ「常に反映し、Sum維持の再計算結果を両方採用する」処理に統一される。

## ダイヤル操作終了後の無線機への再送信（既存機能・見直し）

[`useTransceiverCtrl.ts`の`resendFixedSideFreqToTransceiver()`](../../../src/renderer/components/organisms/TransceiverCtrl/useTransceiverCtrl.ts#L502-L516) は、ダイヤル待機（`dopplerWaitCoordinator.isWaiting`）解除直後に、周期処理では更新されない側（execフラグがfalseの側＝送信固定ならTx、受信固定ならRx）の周波数を無線機へ強制送信（`isForce: true`）する。これは直前の改修（Phase 5/7）で、無線機内部のサテライトモード追尾処理により固定側の周波数が物理的にズレてしまう問題への対策として実装され、実機検証済みである。

- 直前の改修時点では、固定側の基準周波数は（上記1・2の破棄・据え置きロジックにより）ダイヤル操作中も一切変化しなかったため、`resendFixedSideFreqToTransceiver()`は単に「変化していない既存値」を無線機へ再送信するだけで足りていた。
- 本改修で1・2を撤回すると、ダイヤル操作中に固定側（周期処理の対象外側）の基準周波数もSum維持のために更新され得るようになる（例：送信固定モードでRxがダイヤル操作された場合、Sumを保つためTxの基準周波数も再計算される）。しかし、周期処理（`applyDopplerShiftCorrections()`）はexecフラグがfalseの側を更新しないため、この新しい基準周波数は`txFrequency`/`rxFrequency`（実際に無線機へ送信される表示値）にはまだ反映されていない。
- そのため`resendFixedSideFreqToTransceiver()`は、**「既存値をそのまま再送信する」のではなく、「更新された基準周波数からドップラーシフト計算を1回実行して新しい値を算出したうえで、無線機へ強制送信する」**処理に変更する。これにより、「ダイヤル操作の終了後、基準周波数Sumを保ったまま無線機の送信（受信固定の場合は受信）周波数を更新する」という要求を満たす。
- 対象側の判定（execフラグ・`isSatelliteMode`ガード）や、衛星固定モードを対象外とする点、`isForce: true`で強制送信する点は、直前の改修の実装をそのまま踏襲する（無線機内部トラッキングによる物理ズレの上書き修正という目的自体は変わらないため）。

## 変更内容

### 1. `TransceiverRecvFreqResolver` の固定側判定・据え置きロジックを撤回する

[`src/renderer/components/organisms/TransceiverCtrl/resolvers/TransceiverRecvFreqResolver.ts`](../../../src/renderer/components/organisms/TransceiverCtrl/resolvers/TransceiverRecvFreqResolver.ts)

- `applyTxFromTransceiver`/`applyRxFromTransceiver`先頭の固定側破棄判定（`isTxFixedSide`/`isRxFixedSide`によるガードと`logDiscardFixedSide`呼び出し）を削除し、Auto ON中でも無条件に画面表示・基準周波数の更新処理へ進むようにする。
- 基準周波数の再計算後、もう一方の基準周波数を「固定側なら据え置く」分岐（`finalTxBaseFreq`/`finalRxBaseFreq`の三項演算子部分）を削除し、常にSum維持の計算結果（`newTxBaseFreq`/`newRxBaseFreq`）をそのまま`baseFreqMgr.setPlainBaseFreqs(...)`に渡す。
- 上記の結果、`isTxFixedSide`/`isRxFixedSide`ヘルパーメソッドと`logDiscardFixedSide`ログメソッドが不要になるため削除する。
- `getCorrectionFlags: () => DopplerShiftCorrectionFlags`と`isSatelliteMode: Ref<boolean>`のコンストラクタ引数は、上記削除により本クラス内で一切参照しなくなるため削除する。
- 呼び出し元（`useTransceiverCtrl.ts`の`new TransceiverRecvFreqResolver(...)`）から、削除した2引数（`() => dopplerModeResolver.resolveCorrectionFlags(...)`と`isSatelliteMode`）を除去する。

### 2. `resendFixedSideFreqToTransceiver()` を「再計算してから送信する」処理に変更する

[`src/renderer/components/organisms/TransceiverCtrl/useTransceiverCtrl.ts`](../../../src/renderer/components/organisms/TransceiverCtrl/useTransceiverCtrl.ts#L502-L516)

```ts
async function resendFixedSideFreqToTransceiver() {
  // 固定側(Tx)：周期処理では更新されないため、ダイヤル操作で更新された基準周波数から明示的に算出してから送信する
  if (!execTxDopplerShiftCorrection.value) {
    await freqCoordinator.updateTxFreqByInvertingHeterodyne(coordinator.autoTrackingIntervalMsec);
    AppRendererLogger.debug(`ダイヤル操作終了検知：固定側(Tx)の周波数を再送信します。 ${txFrequency.value}`);
    await freqCoordinator.sendTxFreq(TransceiverUtil.parseNumber(txFrequency.value), true);
    return;
  }

  // 固定側(Rx)：周期処理では更新されないため、ダイヤル操作で更新された基準周波数から明示的に算出してから送信する
  if (!execRxDopplerShiftCorrection.value && isSatelliteMode.value) {
    await freqCoordinator.updateRxFreqWithDopplerShift(coordinator.autoTrackingIntervalMsec);
    AppRendererLogger.debug(`ダイヤル操作終了検知：固定側(Rx)の周波数を再送信します。 ${rxFrequency.value}`);
    await freqCoordinator.sendRxFreq(TransceiverUtil.parseNumber(rxFrequency.value), true);
    return;
  }
}
```

- 分岐条件（`execTxDopplerShiftCorrection`/`execRxDopplerShiftCorrection`/`isSatelliteMode`）、衛星固定モードで何もしない点（両フラグtrueのためどちらの分岐にも入らない）、`isForce: true`で送信する点は既存のまま変更しない。
- 追加するのは、送信前に`freqCoordinator.updateTxFreqByInvertingHeterodyne(...)`/`updateRxFreqWithDopplerShift(...)`を呼び、`txFrequency`/`rxFrequency`を現在の基準周波数から再算出する1行のみ。
- `updateFreq()`本体（呼び出し順序・`wasDopplerWaiting`のハンドリング）は変更不要。`resendFixedSideFreqToTransceiver()`と`applyDopplerShiftCorrections()`は互いに反対側（周期処理の対象外側／対象側）を扱うため、呼び出し順序を入れ替える必要はない。

### 3. ドキュメント更新

[`doc/30_画面設計/G2_メイン.md`](../../../doc/30_画面設計/G2_メイン.md) の「2.3.2 Dopplerモード」（L161-187）を、以下の内容に書き直す。

- 受信固定・送信固定のいずれも、無線機側のダイヤル操作は「操作された側（Tx/Rxどちらでも）がそのままRST側の表示・基準周波数に反映される。もう一方の基準周波数はSumを保つように再計算される」という共通の説明に統一する。
- 「ダイヤル操作終了後、周期処理の対象外側（送信固定ならTx、受信固定ならRx）の周波数を、Sumを保った再計算結果に基づいて無線機へ送信し、現在のモードを継続する」という記載に統一する。
- サテライトモードOFF時の特記（Rx固定側という概念が意味を持たない旨）は、再送信処理の対象判定（`isSatelliteMode`ガード）にのみ関わる注記として残す。

## 単体テスト方針

[`src/__tests__/renderer/components/organisms/TransceiverCtrl/resolvers/TransceiverRecvFreqResolver_applyFromTransceiver.test.ts`](../../../src/__tests__/renderer/components/organisms/TransceiverCtrl/resolvers/TransceiverRecvFreqResolver_applyFromTransceiver.test.ts) の既存ケースを以下のとおり見直す。

- 「送信固定モードでTx周波数を受信した場合、画面表示・基準周波数のいずれも変化しないこと」→ **期待値を反転**：「Txが更新され、Sumを保ったままRx基準周波数も更新されること」に修正する。
- 「送信固定モードでRx周波数を受信した場合、Rxのみ更新されTx基準周波数は変化しないこと」→ **期待値を変更**：「Rxが更新され、Sumを保ったままTx基準周波数も更新されること」に修正する。
- 「受信固定モードでRx周波数を受信した場合、画面表示・基準周波数のいずれも変化しないこと」→ **期待値を反転**：「Rxが更新され、Sumを保ったままTx基準周波数も更新されること」に修正する。
- 「受信固定モードでTx周波数を受信した場合、Txのみ更新されRx基準周波数は変化しないこと」→ **期待値を変更**：「Txが更新され、Sumを保ったままRx基準周波数も更新されること」に修正する。
- 「受信固定モードでもサテライトモードOFF時はRx周波数受信を破棄せず画面表示を更新すること」→ 破棄判定自体が無くなり通常経路と同じになるため、削除するか「サテライトモードOFF時でも通常どおりRxが反映されること（回帰確認）」程度に簡略化する。
- 「Rx周波数受信かつAutoOn時（衛星固定相当）、基準周波数を算出すること」「Tx周波数受信かつAutoOff時、固定側判定を行わず画面周波数のみ更新すること」→ 変更なしで維持する（回帰確認）。
- コンストラクタ生成箇所から、削除した`getCorrectionFlags`/`isSatelliteMode`引数を除去する。

`useTransceiverCtrl.ts`の`resendFixedSideFreqToTransceiver()`本体は既存同様、composable内クロージャで直接テストしにくいため単体テストは追加せず、`npm run app:dev`および無線機（実機/シミュレータ）での動作確認で担保する（直前の改修と同方針）。

## 影響範囲・リスク

- 変更は`TransceiverRecvFreqResolver`とそのコンストラクタ呼び出し元（`useTransceiverCtrl.ts`）、および`useTransceiverCtrl.ts`の`resendFixedSideFreqToTransceiver()`に閉じる。メインプロセス側（`TransceiverIcomState`等の`isForce`貫通経路）は直前の改修で実装済みのため変更不要。
- 衛星固定モードのみを使っているユーザーへの影響はない（元々Tx/Rxとも無条件に反映・Sum維持再計算する挙動であり、今回の変更後も同じ）。
- Auto OFF時の無線機からの周波数反映（通常のマニュアル操作の追従）には影響しない。
- 無線機内部のサテライトモード追尾処理（リバーストランスポンダ等）により、ダイヤル操作していない側の周波数が意図せず物理的にドリフトした場合、そのドリフトも「無線機からの通知」として無条件に受け入れられるようになる（直前の改修が対策していたリスクが再度生じ得る）。[`1_requirements.md`](./1_requirements.md)およびユーザーからの訂正指示では、このケースへの対処は明示的に要求されていないため、本改修のスコープには含めない。今後、実機検証でこの副作用が問題になった場合は、別途対応を検討する。

## 確認事項（方針として採用したもの）

- ダイヤル操作の反映方法は、モード（衛星固定/受信固定/送信固定）によらず共通化する（Tx/Rxどちらのダイヤル操作もその側にそのまま反映し、もう一方はSumを保って再計算する）。直前の改修で導入した「固定側の通知破棄」「固定側の基準周波数据え置き」は本改修で撤回する。
- 周期処理による自動ドップラー追尾の対象を片側に限定する仕組み（`execTxDopplerShiftCorrection`/`execRxDopplerShiftCorrection`）は変更しない。「固定」は自動追尾を行わないことを意味し、ダイヤル操作の受け入れ可否とは無関係とする。
- ダイヤル操作終了後の無線機への再送信対象（周期処理の対象外側）・`isForce`による強制送信は直前の改修の実装を踏襲し、送信前に基準周波数から値を再算出する処理のみを追加する。

## 追加要求：Rxダイヤル操作に伴うTx側の自動変化（無線機内部の追尾動作）をRSTに取り込まない

[`1_requirements.md`](./1_requirements.md) に追記された要求により、上記で「影響範囲・リスク」として対応スコープ外としていた項目への対応が明確に求められた。

> 無線機の受信周波数がダイヤル操作された場合に、無線機の設定により（逆側の）送信周波数も自動で変更される場合がある。その逆側の周波数はRSTに取り込まないこと。（固定側の周波数は常にRST側を正とする）

この一文は送信固定・受信固定の両セクションに共通で記載されており、また要求全体を通じて「送信周波数側のダイヤル操作」自体には言及がなくなった（前回のユーザー訂正で触れられていた「Tx側のダイヤル操作もRSTのTx周波数に反映する」という文言は、今回の要求ファイルには含まれていない）。すなわち、ダイヤル操作の主対象は常にRxであり、それに伴って無線機が内部処理（サテライトモードの追尾機能等）で自動的に変化させるTx側の値は、無線機からの通知であってもRSTには一切取り込まず、RST自身が保持・算出した値を常に正とする、という方針に確定した。

### 変更内容

[`TransceiverRecvFreqResolver.ts`](../../../src/renderer/components/organisms/TransceiverCtrl/resolvers/TransceiverRecvFreqResolver.ts)の`applyTxFromTransceiver`に、衛星固定モード以外ではTx側の無線機通知を破棄する判定を再度追加する（`applyRxFromTransceiver`は変更しない。Rxは引き続きモードに関わらず常に受け付ける）。

- 送信固定・受信固定のどちらでも、AutoOn中はTx側の無線機通知を画面表示・基準周波数とも反映せず破棄する。衛星固定モードのみ、従来どおりTx側の通知も反映する（Tx/Rxとも常時ドップラー追従するモードであり、Rxダイヤル操作に伴う自動変化という概念自体が存在しないため）。
- 判定には、既存の`DopplerShiftCorrectionFlags`（`execTxDopplerShiftCorrection`/`execRxDopplerShiftCorrection`）を再利用する。衛星固定モードは両フラグがtrueになる唯一のモードであるため、`isFixedSatMode(flags) = flags.execTxDopplerShiftCorrection && flags.execRxDopplerShiftCorrection`という判定関数を`TransceiverRecvFreqResolver`に追加し、`!isFixedSatMode(...)`の場合にTx通知を破棄する。
- このため、直前の変更で削除した`getCorrectionFlags: () => DopplerShiftCorrectionFlags`のコンストラクタ引数を再度追加する（`isSatelliteMode`は不要のまま。Rx側の判定には使用しないため）。呼び出し元（`useTransceiverCtrl.ts`）の`new TransceiverRecvFreqResolver(...)`にも`() => dopplerModeResolver.resolveCorrectionFlags(dopplerShiftMode.value)`を再度渡す。
- `applyRxFromTransceiver`側のSum維持の再計算処理（`newTxBaseFreq`を採用してTx基準周波数を更新する処理）は変更しない。これはRST自身がRxの新しい値から算出した内部計算であり、無線機からのTx通知を受け入れることとは別物のため、「無線機側で自動変化したTxの値をRSTに取り込まない」という要求とは矛盾しない。
- ダイヤル操作終了後の再送信処理（`resendFixedSideFreqToTransceiver()`）も変更しない。送信固定モードでは周期処理でTxが更新されないため、この再送信処理（RST自身が算出したSum維持後のTx周波数を無線機へ強制送信する）が「無線機側でズレたTxの値をRST側の正しい値で上書きする」役割を果たしており、既にこの要求を満たしている。

### 単体テスト方針（追加分）

- 「送信固定モードでTx周波数を受信した場合」「受信固定モードでTx周波数を受信した場合」の2ケースを、前回の変更で反転させた期待値（Txが更新される）から、再度「画面表示・基準周波数のいずれも変化しないこと（Tx通知は破棄される）」に戻す。
- 「衛星固定モードでTx周波数を受信した場合、画面表示・基準周波数とも反映されること（Tx破棄されないこと）」のケースを新規追加し、`isFixedSatMode`判定の回帰を防ぐ。
- Rx側のテストケース（Rxは常に反映され、Sumを保ってTx基準周波数も更新される）は変更しない。
- コンストラクタ生成箇所に、再度追加した`getCorrectionFlags`引数を反映する。

### 影響範囲・リスクの更新

- 「無線機内部のサテライトモード追尾処理により、ダイヤル操作していない側の周波数が意図せず物理的にドリフトした場合、そのドリフトも無線機からの通知として無条件に受け入れられるようになる」という前述のリスクは、本追加対応により解消される（Tx側の通知は衛星固定モード以外では常に破棄されるため）。
- ドキュメント（[`doc/30_画面設計/G2_メイン.md`](../../../doc/30_画面設計/G2_メイン.md)）も、「送信固定・受信固定では、無線機側のダイヤル操作はRx側としてのみ受け付け、Tx側の無線機通知（ダイヤル操作に伴う自動変化を含む）は取り込まない」という記載に修正する。
