/**
 * 角度と電圧のマッピング
 */
export type RspAntennaIoDegVoltMap = { [key: string]: number };

/**
 * 角度と電圧のマッピングを方位、仰角ごとにまとめたもの
 */
export type RspAntennaIoCalibConfigModel = {
  azimathVolt: RspAntennaIoDegVoltMap;
  elevationVolt: RspAntennaIoDegVoltMap;
};
