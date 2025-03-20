/**
 * アプリケーション設定／ローテーター定義のモデル
 */
export class AppConfigRotatorModel {
  // ローテーターリスト
  public rotators: AppConfigRotator[] = [];
}

/**
 * ローテーターメーカー
 */
export class AppConfigRotator {
  // ローテータメーカーID
  public makerId = "";
  // ローテータメーカー名
  public makerName = "";
  // ローテータ機種リスト
  public devices: AppConfigRotatorDevice[] = [];
}

/**
 * ローテータ機種
 */
export class AppConfigRotatorDevice {
  // ローテータID
  public rotatorId = "";
  // ローテータ機種名
  public deviceName = "";
  // コマンドタイプ
  public commnadType = "";
}
