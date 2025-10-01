import CommonUtil from "@/common/CommonUtil";
import { AntennaPositionModel } from "@/common/model/AntennaPositionModel";
import { ApiResponse } from "@/common/types/types";
import SerialComm from "@/main/common/SerialComm";
import RotatorControllerBase from "@/main/service/rotator/controller/RotatorControllerBase";
import RspUsbAntennaIoConverter from "@/main/service/rotator/controller/RspUsbAntennaIoConverter";
import AppMainLogger from "@/main/util/AppMainLogger";

// アンテナを動かす間隔（ミリ秒）
const ANTENNA_MOVE_INTERVAL = 2000;

// 自動追尾状態
const ANTENNA_TRACKING_MODE_AUTO = "auto";
const ANTENNA_TRACKING_MODE_MANUAL = "manual";

// アンテナ角度の誤差許容値
const TOLERANCE = 0.2;

// ローテータへ送信するデータテンプレ
const ANTENNA_NEUTRAL: number = 0b00000000;
const ANTENNA_AZIMATH_UP_ON: number = 0b00001000;
const ANTENNA_AZIMATH_VALID: number = 0b00000100;
const ANTENNA_ELEVETION_UP_ON: number = 0b00000010;
const ANTENNA_ELEVETION_VALID: number = 0b00000001;

/**
 * RspAntennaIOアダプタ
 */
export default class RotatorRspUsbIoController extends RotatorControllerBase {
  private serial: SerialComm | null = null;

  // キャリブレーション定義を元に、電圧値と角度の相互変換を行うコンバータ
  // TODO: パスは暫定
  private converter = new RspUsbAntennaIoConverter("src/data/rotator/calibration/rsp_antenna_io.yml");

  // 送受信ワーカーの停止要求
  private reqWorkerKill = false;
  // アンテナ移動中か
  private isRunning = false;

  // 自動追尾状態
  private antennaControlMode = ANTENNA_TRACKING_MODE_MANUAL;

  // 方位角・仰角の目標値（電圧）
  private targetAziVolt = 0.0;
  private targetElevVolt = 0.0;

  // 方位角・仰角の目標値（角度）
  private targetAzi = 0.0;
  private targetElev = 0.0;

  // 現在の方位角・仰角
  private nowAzi = 0.0;
  private nowElev = 0.0;
  private nowAziVolt = 0.0;
  private nowElevVolt = 0.0;

  // 目標角度
  private nextTargetAzi = 0;
  private nextTargetElev = 0;

  // 目標電圧
  private nextTargetAziVolt = 0;
  private nextTargetElevVolt = 0;

  /**
   * アンテナ位置の取得を開始する
   */
  public override async start(): Promise<ApiResponse<void>> {
    return new ApiResponse();
  }

  /**
   * アンテナ位置の変化を呼び出し側に伝播させるためのコールバックを設定する
   */
  public override setCallback(callback: Function): void {
    this.callback = callback;
  }

  /**
   * コールバックを解除する
   */
  public override unsetCallback(): void {
    this.callback = null;
  }

  /**
   * アンテナ位置を変更する
   */
  public override doSetPosition(pos: AntennaPositionModel): void {
    if (this.antennaControlMode === ANTENNA_TRACKING_MODE_AUTO) {
      return;
    }
    // 目標角度を保持
    this.nextTargetAzi = pos.azimuth;
    this.nextTargetElev = pos.elevation;

    // 目標電圧を算出
    this.nextTargetAziVolt = this.converter.convAzi2volt(pos.azimuth);
    this.nextTargetElevVolt = this.converter.convElev2volt(pos.elevation);

    // 未実行状態の場合は、送信ワーカーを起動する
    if (!this.isRunning) {
      this.manualSendWorker();
    }
  }

  /**
   * デバイスの切断などを行う
   */
  public override async stop(): Promise<void> {
    this.unsetCallback();

    if (!this.serial) {
      return;
    }
    await this.serial.close();
    this.serial = null;
  }

  /**
   * シリアルをオープンする
   */
  public async openSerial(comName: string, baudRate: number): Promise<boolean> {
    this.serial = new SerialComm(comName, baudRate, true, this.onRecv);
    return await this.serial.open();
  }

  /**
   * シリアルデータの受信
   */
  private onRecv = (data: Buffer) => {
    if (!this.callback) {
      return;
    }

    // 受信データのパース
    const recvData = data.toString("ascii");
    const cols = recvData.split(",");

    // 電圧値
    const el = parseFloat(cols[0]);
    const az = parseFloat(cols[1]);

    // 電圧から角度に変換
    const elDeg = this.converter.convVolt2elev(el);
    const azDeg = this.converter.convVolt2azi(az);
    const pos = new AntennaPositionModel(azDeg, elDeg);

    // コールバック呼び出し
    this.callback(pos);
  };

  /**
   * Antenna IOにデータを送信する
   * @param self
   * @param data
   */
  private sendAntennaControl(data: number) {
    this.sendSerial(data);
    AppMainLogger.info(
      `Antenna IO にデータを送信：` +
        ` 現在値, ${this.nowAzi.toFixed(1)}°, ${this.nowAziVolt.toFixed(3)}v,` +
        ` ${this.nowElev.toFixed(1)}°, ${this.nowElevVolt.toFixed(3)}v,` +
        ` 目標値, ${this.targetAzi.toFixed(1)}°, ${this.targetAziVolt.toFixed(3)}v,` +
        ` ${this.targetElev.toFixed(1)}°, ${this.targetElevVolt.toFixed(3)}v, data=${data.toString(2)}`
    );
  }

  /**
   * Arduinoへの送信（手動）
   */
  private async manualSendWorker() {
    AppMainLogger.info(
      `アンテナ駆動開始：目標電圧値=,${this.targetAziVolt.toFixed(3)}v, ${this.targetElevVolt.toFixed(3)}v`
    );

    // 2秒ループごとの基準時刻
    let baseDt = 0;

    while (true) {
      // シリアル未接続の場合は処理終了
      if (!this.serial?.isOpen) {
        AppMainLogger.warn("シリアル未接続のため、処理を終了します。");
        this.isRunning = false;
        return;
      }

      this.isRunning = true;
      baseDt = Date.now();

      // 目標値を設定する
      this.targetSetting();

      AppMainLogger.info(
        `************** 目標値, ${this.targetAzi.toFixed(1)}°, ${this.targetAziVolt.toFixed(3)}v,` +
          ` ${this.targetElev.toFixed(1)}°, ${this.targetElevVolt.toFixed(3)}v`
      );

      // 停止が指示された場合は処理を強制終了する
      if (this.reqWorkerKill) {
        AppMainLogger.info("停止が指示されたため、現在の送信（手動）を終了します");
        this.isRunning = false;
        break;
      }

      // Arduinoに送信するデータを作成する
      const data = this.buildSendData();

      // 方位角、仰角ともに有効化されていなければ、目標に達しているので処理終了
      if (
        (data & ANTENNA_AZIMATH_VALID) != ANTENNA_AZIMATH_VALID &&
        (data & ANTENNA_ELEVETION_VALID) != ANTENNA_ELEVETION_VALID
      ) {
        // UP/DOWNのフラグをOff状態にする
        this.sendAntennaControl(ANTENNA_NEUTRAL);
        AppMainLogger.info("目標に到達したため、現在の送信（手動）を終了します");
        this.isRunning = false;
        break;
      }

      // アンテナ移動
      this.sendAntennaControl(data);

      // 現在のループ基準時刻に20ミリ秒を足した時刻まで待つ（トータルで20ミリ秒周期にする）
      const sleepMs = baseDt + ANTENNA_MOVE_INTERVAL - Date.now();
      await CommonUtil.sleep(sleepMs);
    }
  }

  /**
   * 目標値を設定する
   */
  private targetSetting() {
    this.targetAzi = this.nextTargetAzi;
    this.targetElev = this.nextTargetElev;
    this.targetAziVolt = this.nextTargetAziVolt;
    this.targetElevVolt = this.nextTargetElevVolt;
  }

  /**
   * Arduinoに送信するデータを作成する
   */
  private buildSendData(): number {
    this.nowAzi = this.converter.convVolt2azi(this.nowAziVolt);
    this.nowElev = this.converter.convVolt2elev(this.nowElevVolt);

    // # ニュートラルにしておいて、以降の処理で各ビットをONにしていく
    let data = ANTENNA_NEUTRAL;

    // 方位角が目標に達していない場合、方位角操作を有効化
    if (Math.abs(this.nowAzi - this.targetAzi) > TOLERANCE) {
      data = data | ANTENNA_AZIMATH_VALID;
    }

    // 現在の方位角が目標より大きい場合は角度を増加方向へ旋回ON（それ以外は減少方向へ旋回）
    if (this.nowAzi > this.targetAzi) {
      data = data | ANTENNA_AZIMATH_UP_ON;
    }

    // 仰角が目標に達していない場合、仰角操作を有効化
    if (Math.abs(this.nowElev - this.targetElev) > TOLERANCE) {
      data = data | ANTENNA_ELEVETION_VALID;
    }

    // 現在の仰角が目標より小さい場合は上旋回（それ以外は下旋回）
    if (this.nowElev < this.targetElev) {
      data = data | ANTENNA_ELEVETION_UP_ON;
    }

    return data;
  }

  /**
   * シリアル送信を行う
   */
  private sendSerial(data: number) {
    // while True:
    //     if self.ser.out_waiting == 0:
    //         break

    const byteData = Buffer.from([data]);

    this.serial?.send(byteData);
    // this.serial.flush()
  }
}
