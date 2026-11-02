import Constant from "@/common/Constant.js";
import I18nMsgs from "@/common/I18nMsgs.js";
import type { AppConfigTransceiver } from "@/common/model/AppConfigModel.js";
import { MessageModel } from "@/common/model/MessageModel.js";
import { ApiResponse } from "@/common/types/types.js";
import SerialComm from "@/main/common/SerialComm.js";
import { fireIpcEvent } from "@/main/main.js";
import TransceiverControllerBase from "@/main/service/transceiver/controller/TransceiverControllerBase.js";
import I18nUtil4Main from "@/main/util/I18nUtil4Main.js";

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
   * @param stopBits ストップビット
   */
  protected async openSerial(stopBits: 1 | 2 = 1): Promise<boolean> {
    if (this.serial && this.serial.isOpen()) {
      return true;
    }

    this.serial = new SerialComm(
      this.transceiverConfig.port,
      parseInt(this.transceiverConfig.baudrateBps),
      false,
      this.onRecv.bind(this),
      null,
      { stopBits }
    );
    return await this.serial.open();
  }

  /**
   * データ受信
   */
  protected onRecv(_data: Buffer): Promise<void> {
    // console.log(`受信データ: ${_data.toString()}`);
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

  /**
   * シリアル未接続メッセージをレンダラ側へ通知する
   */
  protected fireSerialNotConnectedMsg(): void {
    const msg = I18nUtil4Main.getMsg(I18nMsgs.SERIAL_NOT_CONNECTED_TRANSCEIVER);
    fireIpcEvent("onNoticeMessage", new MessageModel(Constant.GlobalEvent.NOTICE_ERR, msg));
  }
}
