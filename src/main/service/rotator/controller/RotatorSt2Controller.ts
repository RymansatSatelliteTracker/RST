import CommonUtil from "@/common/CommonUtil";
import I18nMsgs from "@/common/I18nMsgs";
import { AntennaPositionModel } from "@/common/model/AntennaPositionModel";
import { AppConfigRotator } from "@/common/model/AppConfigModel";
import { ApiResponse } from "@/common/types/types";
import RotatorSerialControllerBase from "@/main/service/rotator/controller/RotatorSerialControllerBase";
import RotatorSerialHelper from "@/main/service/rotator/RotatorSerialHelper";
import AppMainLogger from "@/main/util/AppMainLogger";

// 受信タイムアウト（秒）
const RECV_TIEOUT_SEC = 5;

/**
 * ローテータ／Fox Delta ST-2のコントローラ
 */
export default class RotatorSt2Controller extends RotatorSerialControllerBase {
  // アンテナ位置取得用タイマー（setInterval向け）
  private timer: NodeJS.Timeout | null = null;

  // 受信タイムアウト制御用
  private startSec = 0;
  private isReceived = false;

  public constructor(rotatorConfig: AppConfigRotator) {
    super(rotatorConfig);
  }

  /**
   * アンテナ位置の取得を開始する
   */
  public override async start(): Promise<ApiResponse<void>> {
    await this.openSerial();

    // タイムアウト制御用
    this.startSec = new Date().getTime() / 1000;
    this.isReceived = false;

    // 一定間隔でアンテナ位置の取得コマンドを送信する
    this.timer = setInterval(async () => {
      await this.sendGetAzElCommand();
    }, 1000);

    return new ApiResponse(true);
  }

  /**
   * デバイスの切断などを行う
   */
  public override async stop(): Promise<void> {
    this.unsetCallback();

    await super.stop();

    // 定期コマンド送信を停止
    this.cancelTimer();
  }

  /**
   * アンテナ位置を変更する
   */
  public override async doSetPosition(pos: AntennaPositionModel): Promise<void> {
    // "AZ000.0 EL000.0"形式の文字列を生成
    const az = pos.azimuth.toFixed(1);
    const el = pos.elevation.toFixed(1);
    const ascii = `AZ${az} EL${el}`;

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
   * 受信データのパース
   */
  private parseRecvData(recvData: string): AntennaPositionModel | null {
    // ブランクの場合
    if (CommonUtil.isEmpty(recvData)) {
      return null;
    }

    // "+0000+0000"形式以外の場合
    const cols = recvData.split("+");
    if (cols.length !== 3) {
      return null;
    }

    try {
      const az = parseFloat(cols[1]);
      const el = parseFloat(cols[2]);

      return new AntennaPositionModel(az, el);
    } catch (error) {
      return null;
    }
  }

  /**
   * AZ,ELを取得するコマンドを送信
   */
  private async sendGetAzElCommand(): Promise<void> {
    if (!this.checkRecvTimeout()) {
      return;
    }

    if (!this.serial) {
      return;
    }

    await super.sendSerial("C2");
  }

  private cancelTimer() {
    // 定期コマンド送信を停止
    if (this.timer) {
      clearInterval(this.timer);
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

    // タイムアウト前の場合はOK
    const nowSec = new Date().getTime() / 1000;
    if (this.startSec + RECV_TIEOUT_SEC > nowSec) {
      return true;
    }

    // タイムアウト
    AppMainLogger.warn(
      `アンテナ位置の取得開始から${RECV_TIEOUT_SEC}秒経過しましたが、ローテータから応答がないため、アンテナ位置の取得を停止します。`
    );

    // ローテータ接続なしをコールバック
    RotatorSerialHelper.fireSerialDisConnect();

    // タイマーを停止
    this.cancelTimer();

    // コールバック呼び出し
    if (this.callback) {
      const res = new ApiResponse(false, I18nMsgs.SYSTEM_ROTATOR_SERIAL_RECV_TIMEOUT);
      this.callback(res);
    }

    return false;
  }
}
