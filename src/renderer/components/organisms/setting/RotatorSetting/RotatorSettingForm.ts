/**
 * ローテーター設定／機器設定フォーム
 */
class RotatorConnForm {
  public port = "";
  public makerId = "";
  public rotatorId = "";
  public borate = "";
  public testAz = "";
  public testEl = "";
  public ipAddress = "";
  public ipPort = "";
}

/**
 * ローテーター設定／動作設定フォーム
 */
class RotatorBehaviorForm {
  public basePositionDegree = "";
  public rangeAzMin = "";
  public rangeAzMax = "";
  public moveMode = "";
  public startAgoMinute = "";
}

/**
 * ローテーター設定フォーム
 * memo: TSは多重継承できないので、RotatorBehaviorFormの項目をベタ書きする
 */
class RotatorSettingForm extends RotatorConnForm {
  public basePositionDegree = "";
  public rangeAzMin = "";
  public rangeAzMax = "";
  public moveMode = "";
  public startAgoMinute = "";
}

export { RotatorBehaviorForm, RotatorConnForm, RotatorSettingForm };
