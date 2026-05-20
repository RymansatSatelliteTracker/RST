import Constant from "@/common/Constant.js";
import { ModeState } from "@/renderer/components/organisms/TransceiverCtrl/useSatelliteModeStateManager.js";
import { useStoreAutoState } from "@/renderer/store/useStoreAutoState.js";
import { Ref } from "vue";

/**
 * モードにより保持する各種値
 */
export interface ModeStateResolverState {
  /** ダウンリンク周波数 */
  rxFrequency: Ref<string>;
  /** ダウンリンク運用モード */
  rxOpeMode: Ref<string>;
  /** アップリンク運用モード */
  txOpeMode: Ref<string>;
  /** サテライトモードのトラッキングモード（true=NORMAL） */
  isSatTrackingModeNormal: Ref<boolean>;
  /** サテライトモード判定 */
  isSatelliteMode: Ref<boolean>;
}

/**
 * サテライトモード遷移時の状態保存/復元を管理するクラス
 */
export default class TransceiverModeStateResolver {
  /**
   * @param state - 画面状態のRef群
   * @param autoStore - AutoモードのON/OFF管理ストア
   * @param save - モード状態保存関数
   * @param load - モード状態読込関数
   */
  public constructor(
    private state: ModeStateResolverState,
    private autoStore: ReturnType<typeof useStoreAutoState>,
    private save: (mode: string, partial: Partial<ModeState>) => void,
    private load: (mode: string) => ModeState
  ) {}

  /**
   * サテライトモード変更時の状態保存/復元とフラグ更新を行う
   * @param newMode 変更後モード
   * @param oldMode 変更前モード
   */
  public onSatelliteModeChanged(newMode: string, oldMode: string | undefined): void {
    if (oldMode === undefined) {
      return;
    }

    this.saveState(oldMode);

    // UNSETモードに遷移する場合は過去状態をロードする
    if (newMode === Constant.Transceiver.SatelliteMode.UNSET) {
      this.loadState(newMode);
    }

    this.state.isSatelliteMode.value = newMode === Constant.Transceiver.SatelliteMode.SATELLITE;
  }

  /**
   * モードごとの状態を保存する
   */
  private saveState(mode: string): void {
    // Autoモード中は状態を保存しない
    if (this.autoStore.tranceiverAuto) {
      return;
    }

    const state = {
      rxFrequency: this.state.rxFrequency.value,
      rxOpeMode: this.state.rxOpeMode.value,
      isSatTrackingModeNormal: this.state.isSatTrackingModeNormal.value,
    };
    this.save(mode, state);
  }

  /**
   * モードごとの状態を読み込む
   */
  private loadState(mode: string): void {
    // Autoモード中は状態を読み込まない
    if (this.autoStore.tranceiverAuto) {
      return;
    }

    const state = this.load(mode);
    this.state.rxFrequency.value = state.rxFrequency;
    this.state.rxOpeMode.value = state.rxOpeMode;

    switch (mode) {
      case Constant.Transceiver.SatelliteMode.SATELLITE:
        this.state.isSatTrackingModeNormal.value = state.isSatTrackingModeNormal;
        // このモード以外はtx/rxが同期している
        // モードを切り替えるとsatelliteにしたときにrx設定あり->rxが空欄という挙動になる
        // tx入力してるのにrxを空欄にしたいというケースはないので、txをrxに合わせる
        if (
          this.state.rxOpeMode.value === Constant.Transceiver.OpeMode.UNSET &&
          this.state.txOpeMode.value !== Constant.Transceiver.OpeMode.UNSET
        ) {
          this.state.rxOpeMode.value = this.state.txOpeMode.value;
        }
        break;
      case Constant.Transceiver.SatelliteMode.SPLIT:
        // SPLITモードではトラッキングモードは常にNORMAL
        this.state.isSatTrackingModeNormal.value = true;
        break;
      default:
        // その他のモードではトラッキングモードは無効
        this.state.isSatTrackingModeNormal.value = false;
        break;
    }
  }
}
