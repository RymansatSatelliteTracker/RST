import I18nMsgs from "@/common/I18nMsgs";
import { AppConfigTransceiver } from "@/common/model/AppConfigModel";
import { ApiResponse } from "@/common/types/types";
import SerialComm from "@/main/common/SerialComm";
import TransceiverControllerBase from "@/main/service/transceiver/controller/TransceiverControllerBase";

/**
 * 無線機コントローラの親クラス
 */
export default abstract class TransceiverSerialControllerBase extends TransceiverControllerBase {
  protected transceiverConfig: AppConfigTransceiver;
  protected serial: SerialComm | null = null;

  public constructor(transceiverConfig: AppConfigTransceiver) {
    super();
    this.serial = null;
    this.transceiverConfig = transceiverConfig;
  }

  /**
   * シリアル接続を開始する
   */
  protected async openSerial(): Promise<boolean> {
    if (this.serial && this.serial.isOpen()) {
      return true;
    }

    this.serial = new SerialComm(
      this.transceiverConfig.port,
      parseInt(this.transceiverConfig.baudrateBps),
      false,
      this.onRecv
    );
    return await this.serial.open();
  }

  /**
   * データ受信
   */
  protected onRecv(data: Buffer): Promise<void> {
    // console.log(`受信データ: ${data.toString()}`);
    return Promise.resolve();
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
  protected async sendSerial(bytes: Uint8Array): Promise<ApiResponse<void>> {
    if (!this.serial || !this.serial.isOpen()) {
      return new ApiResponse(false, I18nMsgs.SERIAL_NOT_CONNECTED_TRANSCEIVER);
    }

    const byteData = Buffer.from(bytes);
    const result = await this.serial.send(byteData);
    // AppMainLogger.debug(`Serial 送信データ：${byteData.toString("hex")}`);

    return new ApiResponse(result);
  }
}
