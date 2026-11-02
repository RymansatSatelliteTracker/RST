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
  // シリアル通信のストップビット（省略時は1）
  // memo: 無線機定義ファイルはJSONを型変換するだけでインスタンス化されないため、使用側で既定値（?? 1）を補うこと
  public stopBits?: 1 | 2;
  // 使用できる運用モード（RSTのモード名）。省略時は全モード（DVを除く）
  public supportedModes?: string[];
  // 運用モードの表示ラベル（キー：RSTのモード名、値：選択肢に表示する文字列）。省略したモードはモード名をそのまま表示
  public modeLabels?: Record<string, string>;
}
