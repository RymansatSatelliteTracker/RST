/**
 * OMM JSONモデル
 */
export class OmmJsonModel {
  public ommItemMap: OmmItemMap = {};
}

/**
 * OMMデータマップ
 */
export type OmmItemMap = { [key: string]: OmmItem };

/**
 * OMMモデル
 * Celestrak GP data (OMM) のキーワードに対応する
 */
export class OmmItem {
  // 人工衛星名(OBJECT_NAME)
  public objectName = "";
  // 国際識別符号(OBJECT_ID)
  public objectId = "";
  // NORAD ID(NORAD_CAT_ID)
  public noradCatId = "";
  // 元期(EPOCH) ISO8601(UTC)文字列
  public epoch = "";
  // 平均運動(MEAN_MOTION)[単位:Rev/Day]
  public meanMotion = 0;
  // 離心率(ECCENTRICITY)
  public eccentricity = 0;
  // 軌道傾斜角(INCLINATION)[単位:度]
  public inclination = 0;
  // 昇交点赤経(RA_OF_ASC_NODE)[単位:度]
  public raOfAscNode = 0;
  // 近地点引数(ARG_OF_PERICENTER)[単位:度]
  public argOfPericenter = 0;
  // 平均近点角(MEAN_ANOMALY)[単位:度]
  public meanAnomaly = 0;
  // B*抗力項(BSTAR)
  public bstar = 0;
  // 平均運動の1次微分(MEAN_MOTION_DOT)
  public meanMotionDot = 0;
  // 平均運動の2次微分(MEAN_MOTION_DDOT)
  public meanMotionDdot = 0;
  // 軌道モデル種別(EPHEMERIS_TYPE)
  public ephemerisType = 0;
  // 機密区分(CLASSIFICATION_TYPE)
  public classificationType = "U";
  // element setの番号(ELEMENT_SET_NO)
  public elementSetNo = 999;
  // 元期での周回数(REV_AT_EPOCH)
  public revAtEpoch = 0;
  // 最新のOMMデータか
  public isInLatestOmm = true;
}
