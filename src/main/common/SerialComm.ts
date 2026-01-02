import CommonUtil from "@/common/CommonUtil";
import { synchronized } from "@/common/decorator/synchronized";
import AppMainLogger from "@/main/util/AppMainLogger";
import { ReadlineParser } from "@serialport/parser-readline";
import { SerialPort } from "serialport";

/**
 * シリアルポートクラス
 */
export default class SerialComm {
  private port: SerialPort | null = null;
  private recvCallback: Function | null = null;
  private closeCallback: Function | null = null;

  private active = false;

  /**
   * コンストラクタ
   * @param useReadlineParsar 受信単位が改行の場合、trueを指定する
   */
  constructor(
    comName: string,
    baudRate: number,
    useReadlineParsar: boolean = false,
    recvCallback: Function | null = null,
    closeCallback: Function | null = null
  ) {
    if (CommonUtil.isEmpty(comName)) {
      AppMainLogger.warn(`シリアルポートが未指定のため、接続は行いません。`);
      return;
    }

    AppMainLogger.info(`シリアル接続します ${comName}, ${baudRate}`);
    this.recvCallback = recvCallback;
    this.closeCallback = closeCallback;

    this.port = this.createSerialPort(comName, baudRate);

    // イベント設定
    this.port.on("close", async () => {
      this.onClose();
    });
    this.port.on("error", async (err: Error) => this.onError(err));

    // 受信単位が改行の場合
    if (useReadlineParsar) {
      const parser = this.port.pipe(new ReadlineParser({ delimiter: "\n" }));
      parser.on("data", async (data: Buffer) => this.onReceive(data));
      return;
    }

    // 上記以外
    this.port.on("data", async (data: Buffer) => this.onReceive(data));
  }

  /**
   * シリアルポートをオープンし、SerialPortのインスタンスを返す
   * @param comName ポート
   * @param baudRate ボーレート
   */
  private createSerialPort(comName: string, baudRate: number): SerialPort {
    return new SerialPort({
      path: comName,
      baudRate,
      dataBits: 8,
      parity: "none",
      stopBits: 1,
      autoOpen: false,
    });
  }

  /**
   * ポートのリストを返す
   * ※辞書順でソートして返す
   */
  static async getPortList() {
    const portInfos = await SerialPort.list();
    const ports = portInfos.map((portInfo) => portInfo.path);
    return ports.toSorted();
  }

  /**
   * シリアルポートをオープンする
   * @returns
   */
  public async open(): Promise<boolean> {
    this.active = false;

    // シリアルの操作はsynchronizedで行う
    return await this.doProcess(async () => {
      try {
        return await new Promise<boolean>((resolve) => {
          if (!this.port) {
            resolve(false);
            return;
          }

          this.port.open((err) => {
            err ? resolve(false) : resolve(true);
            if (err) {
              this.active = false;
              resolve(false);
            } else {
              this.active = true;
              resolve(true);
            }
          });
        });
      } catch (error) {
        // オープンに失敗した場合に例外が発生する場合もあるのでキャッチして処理を続行
        return false;
      }
    });
  }

  /**
   * シリアルポートがオープンしているか判定する
   */
  public isOpen(): boolean {
    if (!this.port) {
      return false;
    }

    if (!this.active) {
      return false;
    }

    return this.port.isOpen;
  }

  /**
   * シリアルポートをクローズする
   * @returns
   */
  public async close(): Promise<boolean> {
    if (!this.port) {
      return false;
    }

    if (!this.active) {
      return false;
    }

    if (!this.isOpen()) {
      return false;
    }

    // シリアルの操作はsynchronizedで行う
    return await this.doProcess(async () => {
      return new Promise<boolean>((resolve) => {
        if (!this.port) {
          resolve(false);
          return;
        }

        // 受信バッファをクリア
        this.port.flush();
        // 送信バッファを吐き出し
        // memo:送信バッファはコールバックで完了を待つべきだが、戻ってこない場合があるので呼ぶだけ呼んでおく
        this.port.drain(() => {});

        // クローズ
        this.port!.close((err) => {
          if (err) {
            AppMainLogger.error(`シリアル切断時にエラーが発生しました。 ${this.port?.path}`, err);
            resolve(false);
            return;
          }

          this.active = false;
          AppMainLogger.info(`シリアル切断しました。${this.port?.path}`);
          resolve(true);
        });
      });
    });
  }

  /**
   * データを送信する
   * @param data
   */
  public async send(data: Buffer): Promise<boolean> {
    // シリアルの操作はsynchronizedで行う
    return await this.doProcess(async () => {
      const result = await new Promise<boolean>((resolve, reject) => {
        if (!this.port || !this.isOpen()) {
          AppMainLogger.error(`シリアルポートがオープンされていません。`);
          reject(false);
          return;
        }

        const res = this.port.write(data, (err) => {
          if (err) {
            AppMainLogger.error(`シリアルポートへの書き込みに失敗しました。 ${this.port?.path}`, err);
            reject(false);
            return;
          }
        });
        if (!res) {
          AppMainLogger.error(`シリアルポートへの書き込みに失敗しました。 ${this.port?.path}`);
          reject(false);
          return;
        }

        // drainが不要な場合は、送信成功として処理終了
        if (!this.port.writableNeedDrain) {
          resolve(true);
          return;
        }

        this.port.drain((drainErr) => {
          if (drainErr) {
            AppMainLogger.error(`シリアルポートへの書き込み(drain)に失敗しました。 ${this.port?.path}`, drainErr);
            reject(false);
            return;
          }

          // sendの成功
          resolve(true);
        });
      });

      return result;
    });
  }

  /**
   * 指定のFunctionを排他的にsynchronizedで実行する
   */
  @synchronized()
  private async doProcess(taget: Function): Promise<any> {
    return await taget();
  }

  /**
   * `data` イベントのハンドラ
   * @param data 受信データ
   */
  private onReceive(data: Buffer) {
    // 受信コールバックが設定されていない場合は処理終了（読み捨て）
    if (!this.recvCallback) {
      return;
    }

    this.recvCallback(data);
  }

  /**
   * エラー発生時のイベントハンドラ
   */
  private onError(err: Error) {
    AppMainLogger.error(`シリアルポート関係でエラーが発生しました。 ${this.port?.path}`, err);
  }

  /**
   * クローズ時のイベントハンドラ
   */
  private onClose() {
    AppMainLogger.debug(`シリアル切断イベントを受信。 ${this.port?.path}`);
    this.port = null;
    this.active = false;

    if (!this.closeCallback) {
      return;
    }

    // コールバック
    this.closeCallback();
  }
}
