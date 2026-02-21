import TransceiverConnForm from "@/renderer/components/organisms/setting/TransceiverSetting/TransceiverConn/TransceiverConnForm";

/**
 * 無線機設定フォーム
 * memo: TSは多重継承できないので、RotatorBehaviorFormの項目をベタ書きする
 */
export default class TransceiverSettingForm extends TransceiverConnForm {
  // 周波数設定インターバル (秒)
  public autoTrackingIntervalSec = "";
  // 自動追尾準備・終了時間 (分)
  public autoTrackingStartEndTime = "";
  // 無線機操作後ドップラーシフト再開時間 (秒)
  public dopplerResumeDelaySec = "";
}
