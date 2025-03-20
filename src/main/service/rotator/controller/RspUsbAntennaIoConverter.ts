import { RspAntennaIoCalibConfigModel, RspAntennaIoDegVoltMap } from "@/common/model/RspAntennaIoCalibConfigModel";
import AppMainLogger from "@/main/util/AppMainLogger";
import FileUtil from "@/main/util/FileUtil";

type CalcParam = { a: number; b: number };
type KeyValue = { [key: number]: CalcParam };
type KeyCalcParam = { [key: string]: KeyValue };

/**
 * RSP Antenna IO のコンバータ
 * キャリブレーション定義を元に、電圧値と角度の相互変換を行う
 */
export default class RspUsbAntennaIoConverter {
  private convA2vTbl: KeyCalcParam = {};
  private convV2aTbl: KeyCalcParam = {};

  /**
   * コンストラクタ
   * キャリブレーション設定ファイルから、角度・電圧変換テーブルを生成する
   */
  public constructor(configYmlFilePath: string) {
    const calibConfig = this.getCalibration(configYmlFilePath);
    this.createConvertTbl(calibConfig);

    AppMainLogger.info(`角度 to 電圧変換テーブル：${JSON.stringify(this.convA2vTbl)}`);
    AppMainLogger.info(`電圧 to 角度変換テーブル：${JSON.stringify(this.convV2aTbl)}`);
  }

  /**
   * キャリブレーション設定を返す
   */
  private getCalibration(configYmlFilePath: string): RspAntennaIoCalibConfigModel {
    return FileUtil.readYaml(configYmlFilePath) as RspAntennaIoCalibConfigModel;
  }

  /**
   * キャリブレーション設定ファイルから、角度・電圧変換テーブルを生成する
   */
  private createConvertTbl(config: RspAntennaIoCalibConfigModel) {
    [this.convA2vTbl["azimath"], this.convV2aTbl["azimath"]] = this.createAngle2voltTbl(config.azimathVolt);
    [this.convA2vTbl["elevation"], this.convV2aTbl["elevation"]] = this.createAngle2voltTbl(config.elevationVolt);
  }

  /**
   * キャリブレーション設定から、以下のテーブルを生成する
   * ・角度から電圧値を算出するためのテーブル
   *     y = ax + b
   * ・電圧から角度を算出するためのテーブル
   *     x = (y - b) / a
   * y: 電圧、a: 傾き、x: 角度、b: 切片
   * @returns
   *   [0]: a2v_tbl:角度から電圧の変換テーブル
   *   [1]: v2a_tbl:電圧から角度の変換テーブル
   */
  private createAngle2voltTbl(calibMap: RspAntennaIoDegVoltMap): [KeyValue, KeyValue] {
    const a2vTbl: KeyValue = {};
    const v2aTbl: KeyValue = {};

    let prevAngle = -999;
    let prevVolt = -999;

    for (const angleStr in calibMap) {
      const angle = parseFloat(angleStr);
      const volt = calibMap[angleStr];

      if (!prevAngle) {
        prevAngle = angle;
        prevVolt = volt;
        continue;
      }

      // y = ax + b のaとbを算出
      // a = yの増加量 / xの増加量
      const a = (volt - prevVolt) / (angle - prevAngle);

      // b = y - ax
      const b = prevVolt - a * prevAngle;

      // aとbの値を保管
      a2vTbl[angle] = { a: a, b: b };
      v2aTbl[volt] = { a: a, b: b };

      prevAngle = angle;
      prevVolt = volt;
    }

    return [a2vTbl, v2aTbl];
  }

  /**
   * 変換テーブルを元に、方位角から電圧値を算出する
   * @param target_angle 目標の方位角
   * @returns 電圧値
   */
  public convAzi2volt(targetAngle: number): number {
    const val = this.convAngle2volt(targetAngle, this.convA2vTbl["azimath"]);
    if (val) {
      return val;
    }

    throw new Error(
      `変換テーブルに定義がないため、方位角から電圧値を算出できませんでした。 targetAngle=${targetAngle}`
    );
  }

  /**
   * 変換テーブルを元に、仰角から電圧値を算出する
   * @param targetAngle 目標の仰角
   * @returns 電圧値
   */
  public convElev2volt(targetAngle: number): number {
    const val = this.convAngle2volt(targetAngle, this.convA2vTbl["elevation"]);
    if (val) {
      return val;
    }

    throw new Error(`変換テーブルに定義がないため、仰角から電圧値を算出できませんでした。 targetAngle=${targetAngle}`);
  }

  /**
   * 変換テーブルを元に、角度から電圧値を算出する
   * @param targetAngle 目標角度
   * @param convTbl 変換テーブル
   * @returns 電圧値
   */
  private convAngle2volt(targetAngle: number, convTbl: KeyValue): number | null {
    for (const angleStr in convTbl) {
      const angle = parseFloat(angleStr);
      if (angle > targetAngle) {
        // memo: y = ax + b
        const a = convTbl[angle]["a"];
        const b = convTbl[angle]["b"];

        return a * targetAngle + b;
      }
    }

    return null;
  }

  /**
   * 変換テーブルを元に、電圧値から方位角を算出する
   * @param targetVolt: 目標電圧値
   * @returns 変換した方位角
   */
  public convVolt2azi(targetVolt: number): number {
    const val = this.convVolt2angle(targetVolt, this.convV2aTbl["azimath"]);
    if (val) {
      return val;
    }

    throw new Error(`変換テーブルに定義がないため、電圧値から方位角を算出できませんでした。 targetVolt=${targetVolt}`);
  }

  /**
   * 変換テーブルを元に、電圧値から仰角を算出する
   * @param targetVolt: 目標電圧値
   * @returns 変換した仰角
   */
  public convVolt2elev(targetVolt: number) {
    const val = this.convVolt2angle(targetVolt, this.convV2aTbl["elevation"]);
    if (val) {
      return val;
    }

    throw new Error(`変換テーブルに定義がないため、電圧値から仰角を算出できませんでした。  targetVolt=${targetVolt}`);
  }

  /**
   * 変換テーブルを元に、電圧値から角度を算出する
   * @param targetVolt: 目標電圧値
   * @param convTbl: 変換テーブル
   * @returns変換した角度
   */
  private convVolt2angle(targetVolt: number, convTbl: KeyValue): number | null {
    for (const voltStr in convTbl) {
      const volt = parseFloat(voltStr);
      if (volt >= targetVolt) {
        // memo: x = (y - b) / a
        const a = convTbl[volt].a;
        const b = convTbl[volt].b;

        return (targetVolt - b) / a;
      }
    }

    return null;
  }
}
