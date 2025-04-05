import TransceiverConnForm from "@/renderer/components/organisms/setting/TransceiverSetting/TransceiverConn/TransceiverConnForm";

/**
 * 無線機設定フォーム
 * memo: TSは多重継承できないので、RotatorBehaviorFormの項目をベタ書きする
 */
export default class TransceiverSettingForm extends TransceiverConnForm {
  public autoTrackingIntervalSec = "";
}
