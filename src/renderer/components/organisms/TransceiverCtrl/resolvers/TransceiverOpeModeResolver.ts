import Constant from "@/common/Constant.js";
import { DownlinkType, UplinkType } from "@/common/types/satelliteSettingTypes.js";
import { ApiResponse } from "@/common/types/types.js";
import I18nUtil from "@/renderer/common/util/I18nUtil.js";
import emitter from "@/renderer/util/EventBus.js";
import { Ref } from "vue";

/**
 * 運用モード反映で利用する画面状態
 */
export interface OpeModeResolverState {
  /** アップリンク運用モード */
  txOpeMode: Ref<string>;
  /** ダウンリンク運用モード */
  rxOpeMode: Ref<string>;
}

/**
 * 無線機から受信した運用モードを画面状態へ反映するクラス
 */
export default class TransceiverOpeModeResolver {
  /**
   * @param state - 画面状態のRef群
   */
  public constructor(private state: OpeModeResolverState) {}

  /**
   * 無線機から受信した運用モードを反映する
   */
  public applyFromTransceiver(res: ApiResponse<UplinkType | DownlinkType>): void {
    if (!res.status) {
      emitter.emit(Constant.GlobalEvent.NOTICE_ERR, I18nUtil.getMsg(res.message));
      this.resetToUnset();
      return;
    }

    const opeMode = res.data;
    if (!opeMode) {
      this.resetToUnset();
      return;
    }

    // アップリンク運用モードを更新する
    if ("uplinkMode" in opeMode && opeMode.uplinkMode) {
      this.state.txOpeMode.value = opeMode.uplinkMode;
      return;
    }

    // ダウンリンク運用モードを更新する
    if ("downlinkMode" in opeMode && opeMode.downlinkMode) {
      this.state.rxOpeMode.value = opeMode.downlinkMode;
    }
  }

  /**
   * Tx/Rx運用モードをUNSETへ戻す
   */
  private resetToUnset(): void {
    this.state.txOpeMode.value = Constant.Transceiver.OpeMode.UNSET;
    this.state.rxOpeMode.value = Constant.Transceiver.OpeMode.UNSET;
  }
}
