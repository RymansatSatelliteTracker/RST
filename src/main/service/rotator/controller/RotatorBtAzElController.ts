import CommonUtil from "@/common/CommonUtil";
import I18nMsgs from "@/common/I18nMsgs";
import { AntennaPositionModel } from "@/common/model/AntennaPositionModel";
import { AppConfigRotator } from "@/common/model/AppConfigModel";
import { ApiResponse } from "@/common/types/types";
import RotatorSerialControllerBase from "@/main/service/rotator/controller/RotatorSerialControllerBase";
import AppMainLogger from "@/main/util/AppMainLogger";

// 受信タイムアウト（ミリ秒）
const RECV_TIEOUT_MSEC = 10 * 1000;

/**
 * ローテータ／Bluetooth AZ/EL Rotatorのコントローラ
 */
export default class RotatorBtAzElController extends RotatorSerialControllerBase {
  // 受信タイムアウト制御用
  private isReceived = false;

  public constructor(rotatorConfig: AppConfigRotator) {
    super(rotatorConfig);
  }

  /**
   * アンテナ位置の取得を開始する
   */
  public override async start(): Promise<ApiResponse<void>> {
    await super.openSerial();

    // タイムアウト制御用
    this.isReceived = false;

    // タイムアウトチェック（初回だけやっておく）
    setTimeout(() => {
      this.checkRecvTimeout();
    }, RECV_TIEOUT_MSEC);

    // モニタモードを設定し、現在のAL、ELを取得開始する
    return await super.sendSerial("m\r");
  }

  /**
   * デバイスの切断などを行う
   */
  public override async stop(): Promise<void> {
    this.unsetCallback();

    await super.stop();
  }

  /**
   * アンテナ位置を変更する
   */
  public override async setPosition(pos: AntennaPositionModel): Promise<void> {
    // "000.0 000.0"形式の文字列を生成
    const az = pos.azimuth.toFixed(1);
    const el = pos.elevation.toFixed(1);
    const ascii = `${az} ${el}\r`;
    // AppMainLogger.info(`Serial データを送信 ASCII=${ascii}`);

    await super.sendSerial(ascii);
  }

  /**
   * シリアルデータの受信
   */
  protected override onRecv = (data: Buffer) => {
    if (!this.callback) {
      return;
    }

    // 受信済みとする
    this.isReceived = true;

    // 受信データのパース
    const recvData = data.toString("ascii");
    // AppMainLogger.debug(`Serial 受信データ：${recvData}`);
    const pos = this.parseRecvData(recvData);
    if (!pos) {
      return;
    }

    // コールバック呼び出し
    const res = new ApiResponse(true);
    res.data = pos;
    this.callback(res);
  };

  /**
   * 受信したモニタデータをパースする
   */
  private parseRecvData(recvData: string): AntennaPositionModel | null {
    // ブランクの場合は0,0を返す
    if (CommonUtil.isEmpty(recvData)) {
      return null;
    }

    // パース
    const cols = recvData.split(",");
    if (cols.length !== 8) {
      return null;
    }

    try {
      // 1列目：AZ、2列目：EL
      const az = parseFloat(cols[0]);
      const el = parseFloat(cols[1]);

      return new AntennaPositionModel(az, el);
    } catch (error) {
      return null;
    }
  }

  /**
   * データ受信タイムアウトチェック
   */
  private checkRecvTimeout(): boolean {
    // 既にデータ受信済みであればOK
    if (this.isReceived) {
      return true;
    }

    // タイムアウト
    AppMainLogger.warn(
      `アンテナ位置の取得開始から${RECV_TIEOUT_MSEC}秒経過しましたが、ローテータから応答がないため、アンテナ位置の取得を停止します。`
    );

    // コールバック呼び出し
    if (this.callback) {
      const res = new ApiResponse(false, I18nMsgs.SYSTEM_ROTATOR_SERIAL_RECV_TIMEOUT);
      this.callback(res);
    }

    return false;
  }
}
