import Constant from "@/common/Constant.js";
import type { Ref } from "vue";

/**
 * 周波数・運用モード同期で利用する画面状態
 */
export interface SyncCoordinatorState {
  /** アップリンク周波数 */
  txFrequency: Ref<string>;
  /** ダウンリンク周波数 */
  rxFrequency: Ref<string>;
  /** アップリンク運用モード */
  txOpeMode: Ref<string>;
  /** ダウンリンク運用モード */
  rxOpeMode: Ref<string>;
}

/**
 * Tx/Rx周波数および運用モードの同期を管理するクラス
 */
export default class TransceiverSyncCoordinator {
  /**
   * @param state - 画面状態のRef群
   */
  public constructor(private state: SyncCoordinatorState) {}

  /**
   * Tx周波数変更時にRx周波数を同期する
   */
  public syncRxFrequency(newSatelliteMode: string, newTxFrequency: string): void {
    if (newSatelliteMode === Constant.Transceiver.SatelliteMode.SATELLITE) {
      return;
    }

    // 無限更新防止
    if (this.state.rxFrequency.value === newTxFrequency) {
      return;
    }

    this.state.rxFrequency.value = newTxFrequency;
  }

  /**
   * Rx周波数変更時にTx周波数を同期する
   */
  public syncTxFrequency(newSatelliteMode: string, newRxFrequency: string): void {
    if (newSatelliteMode === Constant.Transceiver.SatelliteMode.SATELLITE) {
      return;
    }

    // 無限更新防止
    if (this.state.txFrequency.value === newRxFrequency) {
      return;
    }

    this.state.txFrequency.value = newRxFrequency;
  }

  /**
   * Tx運用モード変更時にRx運用モードを同期する
   */
  public syncRxOpeMode(newSatelliteMode: string, newTxOpeMode: string): void {
    if (newSatelliteMode === Constant.Transceiver.SatelliteMode.SATELLITE) {
      return;
    }

    // 無限更新防止
    if (this.state.rxOpeMode.value === newTxOpeMode) {
      return;
    }

    this.state.rxOpeMode.value = newTxOpeMode;
  }

  /**
   * Rx運用モード変更時にTx運用モードを同期する
   */
  public syncTxOpeMode(newSatelliteMode: string, newRxOpeMode: string): void {
    if (newSatelliteMode === Constant.Transceiver.SatelliteMode.SATELLITE) {
      return;
    }

    // 無限更新防止
    if (this.state.txOpeMode.value === newRxOpeMode) {
      return;
    }

    this.state.txOpeMode.value = newRxOpeMode;
  }
}
