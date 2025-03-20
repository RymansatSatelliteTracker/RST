import CommonUtil from "@/common/CommonUtil";
import Constant from "@/common/Constant";
import I18nMsgs from "@/common/I18nMsgs";
import { AppConfigTransceiver } from "@/common/model/AppConfigModel";
import { DownlinkType, UplinkType } from "@/common/types/satelliteSettingTypes";
import { ApiResponse } from "@/common/types/types";
import TransceiverSerialControllerBase from "@/main/service/transceiver/controller/TransceiverSerialControllerBase";
import AppMainLogger from "@/main/util/AppMainLogger";

// 受信タイムアウト（秒）
const RECV_TIEOUT_SEC = 10;

/**
 * ICOM無線機のコントローラ
 */
export default class TransceiverIcomController extends TransceiverSerialControllerBase {
  // 無線機の周波数取得用タイマー（setInterval向け）
  private frequencyTimer: NodeJS.Timeout | null = null;
  // 無線機の運用モード取得用タイマー（setInterval向け）
  private opeModeTimer: NodeJS.Timeout | null = null;

  // ICOM無線機のCI-Vアドレス
  private civAddress: number = 0;
  // 無線機周波数のMAINバンド設定フラグ
  private isMainFrequency = true;
  // 無線機運用ノードのSUBバンド設定フラグ
  private isMainMode = true;
  // サテライトモード設定フラグ
  private isSatelliteMode = false;
  // 無線機から受信したデータ
  private recvData = "";

  // 受信タイムアウト制御用
  private startSec = 0;
  private isReceived = false;

  public constructor(transceiverConfig: AppConfigTransceiver) {
    super(transceiverConfig);
    this.civAddress = parseInt(transceiverConfig.civAddress.toLowerCase(), 16);
  }

  /**
   * デバイスの接続を開始する
   */
  public override async start(): Promise<ApiResponse<void>> {
    await this.openSerial();

    // タイムアウト制御用
    this.startSec = new Date().getTime() / 1000;
    this.isReceived = false;

    // 一定間隔で無線機の周波数取得コマンドを送信する
    this.frequencyTimer = setInterval(async () => {
      await this.sendGetFrequencyCommand();
    }, Constant.Transceiver.GET_FREQUENCY_INTERVAL_MS);
    // 一定間隔で無線機のモード取得コマンドを送信する
    this.opeModeTimer = setInterval(async () => {
      await this.sendGetModeCommand();
    }, Constant.Transceiver.GET_OPEMODE_INTERVAL_MS);

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
   * 無線機をメインバンドに切り替える
   */
  private async switchToMainBand(): Promise<void> {
    // シリアル送信のデータ作成
    const array = new Uint8Array(8);
    array[0] = Constant.Transceiver.CivCommand.PREAMBLE;
    array[1] = Constant.Transceiver.CivCommand.PREAMBLE;
    array[2] = this.civAddress;
    array[3] = Constant.Transceiver.CivCommand.PC_ADDRESS;
    array[4] = Constant.Transceiver.CivCommand.SWITCH_BAND;
    array[5] = Constant.Transceiver.CivCommand.MAIN_BAND;
    array[6] = Constant.Transceiver.CivCommand.POSTAMBLE;
    array[7] = Constant.Transceiver.CivCommand.PADDING; // 後続コマンドとの結合を回避するためのパディング

    // データ送信
    await super.sendSerial(array);
  }

  /**
   * 無線機をサブバンドに切り替える
   */
  private async switchToSubBand(): Promise<void> {
    // シリアル送信のデータ作成
    const array = new Uint8Array(8);
    array[0] = Constant.Transceiver.CivCommand.PREAMBLE;
    array[1] = Constant.Transceiver.CivCommand.PREAMBLE;
    array[2] = this.civAddress;
    array[3] = Constant.Transceiver.CivCommand.PC_ADDRESS;
    array[4] = Constant.Transceiver.CivCommand.SWITCH_BAND;
    array[5] = Constant.Transceiver.CivCommand.SUB_BAND;
    array[6] = Constant.Transceiver.CivCommand.POSTAMBLE;
    array[7] = Constant.Transceiver.CivCommand.PADDING; // 後続コマンドとの結合を回避するためのパディング

    // データ送信
    await super.sendSerial(array);
  }

  /**
   * 無線機に周波数を設定するコマンドを送信する
   * @param {(UplinkType | DownlinkType)} frequencyModel 周波数設定
   */
  public override async sendFrequencyCommand(frequencyModel: UplinkType | DownlinkType): Promise<void> {
    // シリアル未接続の場合は処理終了
    if (!this.serial?.isOpen) {
      AppMainLogger.warn("シリアル未接続のため、処理を終了します。");
      return;
    }

    let frequency = "";
    if ("uplinkHz" in frequencyModel && frequencyModel.uplinkHz) {
      // アップリンク周波数を取得する
      frequency = Math.floor(frequencyModel.uplinkHz).toString();

      // MAINバンドに切り替える
      await this.switchToMainBand();
    } else if ("downlinkHz" in frequencyModel && frequencyModel.downlinkHz) {
      // ダウンリンク周波数を取得する
      frequency = Math.floor(frequencyModel.downlinkHz).toString();

      if (this.isSatelliteMode) {
        // サテライトモードがONの場合はSUBバンドに切り替える
        await this.switchToSubBand();
      }
    }

    if (CommonUtil.isEmpty(frequency)) {
      // 周波数が未設定の場合は処理終了する
      return;
    }

    // 周波数を10桁の文字列に変換
    const frequencyArray = frequency.padStart(10, "0").split("");
    // シリアル送信用のデータを作成する
    const array = new Uint8Array(12);
    array[0] = Constant.Transceiver.CivCommand.PREAMBLE;
    array[1] = Constant.Transceiver.CivCommand.PREAMBLE;
    array[2] = this.civAddress;
    array[3] = Constant.Transceiver.CivCommand.PC_ADDRESS;
    array[4] = Constant.Transceiver.CivCommand.SET_FREQUENCY;
    array[5] = parseInt(frequencyArray[8] + frequencyArray[9], 16);
    array[6] = parseInt(frequencyArray[6] + frequencyArray[7], 16);
    array[7] = parseInt(frequencyArray[4] + frequencyArray[5], 16);
    array[8] = parseInt(frequencyArray[2] + frequencyArray[3], 16);
    array[9] = parseInt(frequencyArray[0] + frequencyArray[1], 16);
    array[10] = Constant.Transceiver.CivCommand.POSTAMBLE;
    array[11] = Constant.Transceiver.CivCommand.PADDING; // 後続コマンドとの結合を回避するためのパディング

    // データ送信
    await super.sendSerial(array);
  }

  /**
   * 無線機に運用モードを設定するコマンドを送信する
   * @param {(UplinkType | DownlinkType)} modeModel 運用モード設定
   */
  public override async sendModeCommand(modeModel: UplinkType | DownlinkType): Promise<void> {
    // シリアル未接続の場合は処理終了
    if (!this.serial?.isOpen) {
      AppMainLogger.warn("シリアル未接続のため、処理を終了します。");
      return;
    }

    let mode = "";
    if ("uplinkMode" in modeModel) {
      // アップリンクモードを取得する
      mode = modeModel.uplinkMode;

      // MAINバンドに切り替える
      await this.switchToMainBand();
    } else if ("downlinkMode" in modeModel) {
      // ダウンリンクモードを取得する
      mode = modeModel.downlinkMode;

      if (this.isSatelliteMode) {
        // サテライトモードがONの場合はSUBバンドに切り替える
        await this.switchToSubBand();
      }
    }

    // 運用モードの値を取得
    const modeValue = this.getValueFromOpeMode(mode);
    if (modeValue === null) {
      // 運用モードの値が取得できない場合は処理終了
      return;
    }

    // シリアル送信用のデータを作成する
    const array = new Uint8Array(8);
    array[0] = Constant.Transceiver.CivCommand.PREAMBLE;
    array[1] = Constant.Transceiver.CivCommand.PREAMBLE;
    array[2] = this.civAddress;
    array[3] = Constant.Transceiver.CivCommand.PC_ADDRESS;
    array[4] = Constant.Transceiver.CivCommand.SET_MODE;
    array[5] = parseInt(modeValue, 16);
    array[6] = Constant.Transceiver.CivCommand.POSTAMBLE;
    array[7] = Constant.Transceiver.CivCommand.PADDING; // 後続コマンドとの結合を回避するためのパディング

    // データ送信
    await super.sendSerial(array);
  }

  /**
   * 運用モードの値を取得する
   * @param {string} opeMode 運用モード
   * @returns {(string | null)} 運用モードの値
   */
  private getValueFromOpeMode(opeMode: string): string | null {
    switch (opeMode) {
      case "LSB":
        return "00";
      case "USB":
        return "01";
      case "AM":
        return "02";
      case "CW":
        return "03";
      case "FM":
        return "05";
      case "DV":
        return "17";
      default:
        return null;
    }
  }

  /**
   * サテライトモードを設定するコマンドを送信する
   * @param {boolean} isSatelliteMode サテライトモード設定
   */
  public override async sendSatelliteModeCommand(isSatelliteMode: boolean): Promise<void> {
    // シリアル未接続の場合は処理終了
    if (!this.serial?.isOpen) {
      AppMainLogger.warn("シリアル未接続のため、処理を終了します。");
      return;
    }

    // シリアル送信用のデータを作成する
    const array = new Uint8Array(9);
    array[0] = Constant.Transceiver.CivCommand.PREAMBLE;
    array[1] = Constant.Transceiver.CivCommand.PREAMBLE;
    array[2] = this.civAddress;
    array[3] = Constant.Transceiver.CivCommand.PC_ADDRESS;
    array[4] = parseInt("16", 16);
    array[5] = parseInt("5a", 16);
    array[6] = isSatelliteMode ? parseInt("01", 16) : parseInt("00", 16);
    array[7] = Constant.Transceiver.CivCommand.POSTAMBLE;
    array[8] = Constant.Transceiver.CivCommand.PADDING; // 後続コマンドとの結合を回避するためのパディング

    // データ送信
    await super.sendSerial(array);

    // サテライトモードの設定を保持する
    this.isSatelliteMode = isSatelliteMode;
  }

  /**
   * シリアルデータの受信
   * @param {Buffer} data シリアルデータ
   */
  protected override onRecv = (data: Buffer) => {
    if (!this.frequencyCallback || !this.modeCallback) {
      return;
    }

    // 受信済みとする
    this.isReceived = true;

    // 受信データを16進数文字列に変換する
    for (let i = 0; i < data.length; i++) {
      this.recvData += data[i].toString(16).padStart(2, "0").toLowerCase();
      if (this.recvData.endsWith("fd")) {
        // AppMainLogger.debug(`Serial 受信データ：${this.recvData}`);

        // 無線機から受信したCI-Vコマンドを解析する
        this.handleCivCommand(this.recvData);
        this.recvData = "";
      }
    }
  };

  /**
   * 無線機から受信したCI-Vコマンドを処理する
   * @param {string} recvData 受信データ
   */
  private handleCivCommand(recvData: string) {
    switch (recvData.substring(8, 10)) {
      case "00":
      case "03":
        if (recvData.length === 22) {
          // 無線機から受信した周波数データを処理する
          this.receiveFrequencyData(recvData);
        }
        break;
      case "01":
      case "04":
        if (recvData.length === 16) {
          // 無線機から受信した運用モードデータを処理する
          this.receiveModeData(recvData);
        }
        break;
    }
  }

  /**
   * 無線機から受信した周波数データを処理する
   * @param {string} recvData 受信データ
   */
  private receiveFrequencyData(recvData: string) {
    if (!this.frequencyCallback) {
      return;
    }

    const res = new ApiResponse(true);
    if (this.isSatelliteMode) {
      // サテライトモードがONの場合
      if (this.isMainFrequency) {
        // 周波数のMAINバンド設定フラグがTRUEの場合は受信データをアップリンク周波数とする
        res.data = {
          uplinkHz: this.getFrequencyFromRecvData(recvData),
          uplinkMode: "",
        } as UplinkType;
      } else {
        // 周波数のMAINバンド設定フラグがFALSEの場合は受信データをダウンリンク周波数とする
        res.data = {
          downlinkHz: this.getFrequencyFromRecvData(recvData),
          downlinkMode: "",
        } as DownlinkType;
      }
    } else {
      // サテライトモードがOFFの場合で、周波数のMAINバンド設定フラグがTRUEの場合は受信データをアップリンク周波数とする
      res.data = {
        uplinkHz: this.getFrequencyFromRecvData(recvData),
        uplinkMode: "",
      } as UplinkType;
    }

    // 周波数のコールバック呼び出し
    this.frequencyCallback(res);

    if (this.isSatelliteMode) {
      // サテライトモードがONの場合はMAINバンド設定フラグを切り替える
      this.isMainFrequency = !this.isMainFrequency;
    } else {
      // サテライトモードがOFFの場合はMAINバンドに固定する
      this.isMainFrequency = true;
    }
  }

  /**
   * 無線機から受信した運用モードデータを処理する
   * @param {string} recvData 受信データ
   */
  private receiveModeData(recvData: string) {
    if (!this.modeCallback) {
      return;
    }

    const res = new ApiResponse(true);
    // 無線機から受信したデータから運用モードを取得する
    const recvMode = this.getModeFromRecvData(recvData);
    if (!recvMode) {
      // 運用モードが取得できない場合は処理を中断する
      return;
    }

    if (this.isSatelliteMode) {
      // サテライトモードがONの場合
      if (this.isMainMode) {
        // 運用モードのMAINバンド設定フラグがTRUEの場合は受信データをアップリンクの運用モードとする
        res.data = {
          uplinkHz: null,
          uplinkMode: recvMode,
        } as UplinkType;
      } else {
        // 運用モードのMAINバンド設定フラグがFALSEの場合は受信データをダウンリンクの運用モードとする
        res.data = {
          downlinkHz: null,
          downlinkMode: recvMode,
        } as DownlinkType;
      }
    } else {
      // サテライトモードがOFFの場合で、運用モードのMAINバンド設定フラグがTRUEの場合は受信データをアップリンクの運用モードとする
      res.data = {
        uplinkHz: null,
        uplinkMode: recvMode,
      } as UplinkType;
    }

    // 運用モードのコールバック呼び出し
    this.modeCallback(res);

    if (this.isSatelliteMode) {
      // サテライトモードがONの場合はMAINバンド設定フラグを切り替える
      this.isMainMode = !this.isMainMode;
    } else {
      // サテライトモードがOFFの場合はMAINバンドに固定する
      this.isMainMode = true;
    }
  }

  /**
   * 無線機から受信したデータから周波数を取得する
   * @param {string} recvData 受信データ
   */
  private getFrequencyFromRecvData(recvData: string): number {
    // 受信データから周波数部分を取得する
    const dataArea = recvData.substring(10, 20);
    const dataAreaArray = dataArea.split("");
    const recvFrequencyStr =
      dataAreaArray[8] +
      dataAreaArray[9] +
      dataAreaArray[6] +
      dataAreaArray[7] +
      dataAreaArray[4] +
      dataAreaArray[5] +
      dataAreaArray[2] +
      dataAreaArray[3] +
      dataAreaArray[0] +
      dataAreaArray[1];

    // 受信した周波数をGHzの数値に変換する
    return parseInt(recvFrequencyStr);
  }

  /**
   * 無線機から受信したデータから運用モードを取得する
   * @param {string} recvData 受信データ
   * @returns {string | null} 運用モード
   */
  private getModeFromRecvData(recvData: string): string | null {
    // 受信データから運用モードを取得する
    const recvMode = recvData.substring(10, 12);
    switch (recvMode) {
      case "00":
        return Constant.Transceiver.OpeMode.LSB;
      case "01":
        return Constant.Transceiver.OpeMode.USB;
      case "02":
        return Constant.Transceiver.OpeMode.AM;
      case "03":
        return Constant.Transceiver.OpeMode.CW;
      case "05":
        return Constant.Transceiver.OpeMode.FM;
      case "17":
        return Constant.Transceiver.OpeMode.DV;
      default:
        return null;
    }
  }

  /**
   * 無線機から現在の周波数を読み取るコマンドを送信する
   */
  private async sendGetFrequencyCommand(): Promise<void> {
    if (!this.checkRecvTimeout()) {
      return;
    }

    if (!this.serial) {
      return;
    }

    if (this.isSatelliteMode) {
      // サテライトモードがONの場合
      if (this.isMainFrequency) {
        // 周波数のMAINバンド設定フラグがTRUEの場合はMAINバンドに切り替える
        this.switchToMainBand();
      } else {
        // 周波数のMAINバンド設定フラグがFALSEの場合はSUBバンドに切り替える
        this.switchToSubBand();
      }
    } else {
      // サテライトモードがOFFの場合はMAINバンドに固定する
      this.switchToMainBand();
    }

    // シリアル送信用のデータを作成する
    const array = new Uint8Array(7);
    array[0] = Constant.Transceiver.CivCommand.PREAMBLE;
    array[1] = Constant.Transceiver.CivCommand.PREAMBLE;
    array[2] = this.civAddress;
    array[3] = Constant.Transceiver.CivCommand.PC_ADDRESS;
    array[4] = Constant.Transceiver.CivCommand.GET_FREQUENCY;
    array[5] = Constant.Transceiver.CivCommand.POSTAMBLE;
    array[6] = Constant.Transceiver.CivCommand.PADDING; // 後続コマンドとの結合を回避するためのパディング

    // データ送信
    await super.sendSerial(array);
  }

  /**
   * 無線機から現在のモードを読み取るコマンドを送信する
   */
  private async sendGetModeCommand(): Promise<void> {
    if (!this.checkRecvTimeout()) {
      return;
    }

    if (!this.serial) {
      return;
    }

    if (this.isSatelliteMode) {
      // サテライトモードがONの場合
      if (this.isMainMode) {
        // 運用モードのMAINバンド設定フラグがTRUEの場合はMAINバンドに切り替える
        this.switchToMainBand();
      } else {
        // 運用モードのMAINバンド設定フラグがFALSEの場合はSUBバンドに切り替える
        this.switchToSubBand();
      }
    } else {
      // サテライトモードがOFFの場合はMAINバンドに固定する
      this.switchToMainBand();
    }

    // シリアル送信用のデータを作成する
    const array = new Uint8Array(7);
    array[0] = Constant.Transceiver.CivCommand.PREAMBLE;
    array[1] = Constant.Transceiver.CivCommand.PREAMBLE;
    array[2] = this.civAddress;
    array[3] = Constant.Transceiver.CivCommand.PC_ADDRESS;
    array[4] = Constant.Transceiver.CivCommand.GET_MODE;
    array[5] = Constant.Transceiver.CivCommand.POSTAMBLE;
    array[6] = Constant.Transceiver.CivCommand.PADDING; // 後続コマンドとの結合を回避するためのパディング

    // データ送信
    await super.sendSerial(array);
  }

  private cancelTimer() {
    // 定期コマンド送信を停止
    if (this.frequencyTimer) {
      clearInterval(this.frequencyTimer);
    }
    if (this.opeModeTimer) {
      clearInterval(this.opeModeTimer);
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
      `無線機のモード取得開始から${RECV_TIEOUT_SEC}秒経過しましたが、無線機から応答がないため、無線機のモードの取得を停止します。`
    );

    // タイマーを停止
    this.cancelTimer();

    // コールバック呼び出し
    if (this.frequencyCallback) {
      const res = new ApiResponse(false, I18nMsgs.SYSTEM_TRANSCEIVER_SERIAL_RECV_TIMEOUT);
      this.frequencyCallback(res);
    }
    if (this.modeCallback) {
      const res = new ApiResponse(false, I18nMsgs.SYSTEM_TRANSCEIVER_SERIAL_RECV_TIMEOUT);
      this.modeCallback(res);
    }

    return false;
  }
}
