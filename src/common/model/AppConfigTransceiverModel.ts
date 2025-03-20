/**
 * アプリケーション設定／無線機定義のモデル
 */
export class AppConfigTransceiverModel {
  // 無線機リスト
  public transceivers: AppConfigTransceiver[] = [];
}

/**
 *
 */
export class AppConfigTransceiver {
  // 無線機メーカーID
  public makerId = "";
  // 無線機メーカー名
  public makerName = "";
  // 無線機機種リスト
  public devices: AppConfigTransceiverDevice[] = [];
}

/**
 * 無線機機種
 */
export class AppConfigTransceiverDevice {
  // 無線機ID
  public transceiverId = "";
  // 無線機機種名
  public deviceName = "";
  // 無線機のCI-Vアドレス(icom無線機のみ必須)
  public civAddress = "";
}
