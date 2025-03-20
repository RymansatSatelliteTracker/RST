import I18nMsgs from "@/common/I18nMsgs";
import { AppConfigRotator } from "@/common/model/AppConfigModel";
import { ApiResponse } from "@/common/types/types";
import SerialComm from "@/main/common/SerialComm";
import RotatorControllerBase from "@/main/service/rotator/controller/RotatorControllerBase";
import RotatorSerialHelper from "@/main/service/rotator/RotatorSerialHelper";

/**
 * ローテータ／シリアル接続系コントローラの親クラス
 */
export default abstract class RotatorSerialControllerBase extends RotatorControllerBase {
  protected rotatorConfig: AppConfigRotator;
  protected serial: SerialComm | null = null;

  public constructor(rotatorConfig: AppConfigRotator) {
    super();
    this.serial = null;
    this.rotatorConfig = rotatorConfig;
  }

  /**
   * シリアル接続を開始する
   */
  protected async openSerial(): Promise<boolean> {
    if (this.serial && this.serial.isOpen()) {
      return true;
    }

    this.serial = new SerialComm(
      this.rotatorConfig.port,
      parseInt(this.rotatorConfig.baudrateBps),
      true,
      this.onRecv,
      this.onSerialClose
    );
    return await this.serial.open();
  }

  /**
   * データ受信
   */
  protected onRecv(data: Buffer): void {}

  /**
   * シリアル切断イベント
   */
  protected onSerialClose(): void {
    RotatorSerialHelper.fireSerialDisConnect();
  }

  /**
   * デバイスの切断などを行う
   */
  public override async stop(): Promise<void> {
    if (!this.serial) {
      return;
    }
    await this.serial.close();
    this.serial = null;
  }

  /**
   * シリアル送信を行う
   */
  protected async sendSerial(asciiData: string): Promise<ApiResponse<void>> {
    if (!this.serial || !this.serial.isOpen()) {
      return new ApiResponse(false, I18nMsgs.SERIAL_NOT_CONNECTED_ROTATOR);
    }

    // AppMainLogger.debug(`Serial データを送信 ${asciiData}`);
    const asciiCr = `${asciiData}\n`;

    // ASCIIをバイトに変換
    const bytes = asciiCr.split("").map(function (c) {
      return c.charCodeAt(0);
    });

    const byteData = Buffer.from(bytes);
    const result = await this.serial.send(byteData);

    return new ApiResponse(result);
  }
}
