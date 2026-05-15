import Constant from "@/common/Constant";
import I18nMsgs from "@/common/I18nMsgs";
import { I18nMsgItem } from "@/common/types/types";
import TransceiverUtil from "@/common/util/TransceiverUtil";

/** アップリンク設定の必要最低限の形 */
interface UplinkSettingLike {
  uplinkHz?: number | null;
  uplinkMode: string | null;
}

/** ダウンリンク設定の必要最低限の形 */
interface DownlinkSettingLike {
  downlinkHz?: number | null;
  downlinkMode: string | null;
}

/** ビーコン設定の必要最低限の形 */
interface BeaconSettingLike {
  beaconHz?: number | null;
  beaconMode: string | null;
}

/**
 * モード解決に必要な無線機設定の最低限のインターフェース
 * ActiveSatTransceiverSettingの完全な型に依存せず、解決に必要な項目のみを定義する
 */
export interface TransceiverSettingLike {
  uplink?: UplinkSettingLike | null;
  downlink?: DownlinkSettingLike | null;
  beacon?: BeaconSettingLike | null;
}

/**
 * モード解決結果を表す型
 * applyResolvedModeState で画面状態への反映に使用する
 */
export interface ModeResolvedState {
  /** 反映するアップリンク周波数（設定不要の場合はundefined） */
  txFreq?: string;
  /** 反映するダウンリンク周波数（設定不要の場合はundefined） */
  rxFreq?: string;
  /** 反映するTx運用モード（設定不要の場合はundefined） */
  txOpeMode?: string;
  /** 反映するRx運用モード（設定不要の場合はundefined） */
  rxOpeMode?: string;
  /** 表示する通知メッセージキーの配列（通知不要の場合は空配列） */
  noticeMessageKeys: I18nMsgItem[];
}

/**
 * モード状態（Auto/Beacon）から周波数・運用モード反映内容を決定する
 */
export default class TransceiverModeSettingResolver {
  /**
   * ビーコンモードを利用できるか判定する
   */
  public canUseBeaconMode(transceiverSetting: TransceiverSettingLike): boolean {
    // ビーコン周波数とビーコン運用モードの両方が設定済みの場合のみ利用可能とする
    return !!(transceiverSetting.beacon?.beaconHz && transceiverSetting.beacon?.beaconMode);
  }

  /**
   * Auto/Beacon開始時の周波数・運用モードを解決する
   */
  public resolveOnModeStart(isBeaconMode: boolean, transceiverSetting: TransceiverSettingLike): ModeResolvedState {
    // BeaconモードがONの場合はビーコン設定を、OFFの場合はAuto設定を優先して解決する
    if (isBeaconMode) {
      return this.resolveBeaconModeSetting(transceiverSetting);
    }

    return this.resolveAutoModeSetting(transceiverSetting);
  }

  /**
   * Autoモード中にBeacon OFFへ戻したときの周波数・運用モードを解決する
   */
  public resolveWhenBeaconOffInAuto(transceiverSetting: TransceiverSettingLike): ModeResolvedState {
    const resolved: ModeResolvedState = {
      noticeMessageKeys: [],
    };

    // Tx周波数/運用モードを指定の設定値で保持する（未設定の場合は変更せず通知のみ）
    if (transceiverSetting.uplink?.uplinkHz) {
      resolved.txFreq = TransceiverUtil.formatWithDot(transceiverSetting.uplink.uplinkHz);
      resolved.txOpeMode = transceiverSetting.uplink.uplinkMode ?? Constant.Transceiver.OpeMode.UNSET;
    }

    // ダウンリンク周波数/運用モードを指定の設定値で保持する（未設定の場合は変更せず通知のみ）
    if (transceiverSetting.downlink?.downlinkHz) {
      resolved.rxFreq = TransceiverUtil.formatWithDot(transceiverSetting.downlink.downlinkHz);
      resolved.rxOpeMode = transceiverSetting.downlink.downlinkMode ?? Constant.Transceiver.OpeMode.UNSET;
    }

    return resolved;
  }

  /**
   * Beaconモード開始時の周波数・運用モードを解決する
   * @param transceiverSetting アクティブ衛星の無線機設定
   * @returns モード解決結果（ビーコン設定未入力の場合は通知メッセージを含む）
   */
  private resolveBeaconModeSetting(transceiverSetting: TransceiverSettingLike): ModeResolvedState {
    // ビーコン周波数または運用モードが未設定の場合はエラー通知のみ返す
    if (!(transceiverSetting.beacon?.beaconHz && transceiverSetting.beacon?.beaconMode)) {
      return {
        noticeMessageKeys: [I18nMsgs.CHK_ERR_NO_BEACON_FREQ],
      };
    }

    // ビーコン設定をダウンリンクに反映する（アップリンクはビーコンモードでは変更しない）
    return {
      rxFreq: TransceiverUtil.formatWithDot(transceiverSetting.beacon.beaconHz),
      rxOpeMode: transceiverSetting.beacon.beaconMode,
      noticeMessageKeys: [],
    };
  }

  /**
   * Autoモード開始時の周波数・運用モードを解決する
   * @param transceiverSetting アクティブ衛星の無線機設定
   * @returns モード解決結果（設定未入力の場合は通知メッセージを含む）
   */
  private resolveAutoModeSetting(transceiverSetting: TransceiverSettingLike): ModeResolvedState {
    const resolved: ModeResolvedState = {
      noticeMessageKeys: [],
    };

    // アップリンクもダウンリンクも設定がない場合はエラー通知のみ返す
    if (!transceiverSetting.uplink?.uplinkHz && !transceiverSetting.downlink?.downlinkHz) {
      resolved.noticeMessageKeys.push(I18nMsgs.CHK_ERR_NO_FREQ);
      return resolved;
    }

    // アップリンク周波数/運用モードを解決する（未設定の場合は通知）
    if (transceiverSetting.uplink?.uplinkHz) {
      resolved.txFreq = TransceiverUtil.formatWithDot(transceiverSetting.uplink.uplinkHz);
      // uplinkModeがnullの場合はUNSETとして扱う
      resolved.txOpeMode = transceiverSetting.uplink.uplinkMode ?? Constant.Transceiver.OpeMode.UNSET;
    } else {
      resolved.noticeMessageKeys.push(I18nMsgs.CHK_ERR_NO_UPLINK_FREQ);
    }

    // ダウンリンク周波数/運用モードを解決する（未設定の場合は通知）
    if (transceiverSetting.downlink?.downlinkHz) {
      resolved.rxFreq = TransceiverUtil.formatWithDot(transceiverSetting.downlink.downlinkHz);
      // downlinkModeがnullの場合はUNSETとして扱う
      resolved.rxOpeMode = transceiverSetting.downlink.downlinkMode ?? Constant.Transceiver.OpeMode.UNSET;
    } else {
      resolved.noticeMessageKeys.push(I18nMsgs.CHK_ERR_NO_DOWNLINK_FREQ);
    }

    return resolved;
  }
}
