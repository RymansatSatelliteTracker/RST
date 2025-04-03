import RotatorConnForm from "@/renderer/components/organisms/setting/RotatorSetting/RotatorConn/RotatorConnForm";

/**
 * ローテーター設定フォーム
 * memo: TSは多重継承できないので、RotatorBehaviorFormの項目をベタ書きする
 */
export default class RotatorSettingForm extends RotatorConnForm {
  public basePositionDegree = "";
  public rangeAzMin = "";
  public rangeAzMax = "";
  public moveMode = "";
  public startAgoMinute = "";
  public parkPosAz = "";
  public parkPosEl = "";
}
