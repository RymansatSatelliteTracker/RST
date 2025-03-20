import { AppConfigModel, AppConfigSatellite } from "@/common/model/AppConfigModel";
import TleUtil from "@/main/util/TleUtil";
import ApiAppConfigSatellite from "@/renderer/api/ApiAppConfigSatellite";
import ApiDefaultSatellite from "@/renderer/api/ApiDefaultSatellite";
import RegistSatelliteForm from "@/renderer/components/organisms/setting/SatelliteSetting/DisplaySatellite/RegistSatellite/RegistSatelliteForm";
import { parseTle, tleToOrbitalElements } from "./useValidateTle";

/**
 * アプリケーション設定を画面に反映する
 * @param targetForm
 * @param srcObject
 */
export function setForm(targetForm: RegistSatelliteForm, srcObject: AppConfigSatellite) {
  // 画面反映
  if (srcObject && srcObject.userRegistered) {
    targetForm.satelliteId = srcObject.satelliteId;
    targetForm.satelliteName = srcObject.userRegisteredSatelliteName;
    targetForm.tle = srcObject.userRegisteredTle;
    const lines = srcObject.userRegisteredTle.split("\n");
    if (lines.length === 2) {
      const orb = tleToOrbitalElements(lines[0], lines[1]);
      targetForm.epochUtcDate = orb.epoch;
      targetForm.semiMajorAxisKm = orb.semiMejarAxis.toFixed(3);
      targetForm.raanDeg = orb.raan.toFixed(4);
      targetForm.eccentricity = orb.eccentricity.toFixed(7);
      targetForm.argumentOfPerigeeDeg = orb.argumentOfPerigee.toFixed(4);
      targetForm.inclinationDeg = orb.inclination.toFixed(4);
      targetForm.meanAnomalyDeg = orb.meanAnomaly.toFixed(4);
    }
  }
}

/**
 * 画面の設定内容をアプリケーション設定に反映する
 * @param targetAppConfig
 * @param srcFrom
 * @returns
 */
export async function setAppConfig(targetAppConfig: AppConfigModel, srcFrom: RegistSatelliteForm): Promise<boolean> {
  // 新規追加フラグ
  const isNewItem = srcFrom.satelliteId === -1;
  // 衛星ID
  let satelliteId = srcFrom.satelliteId;
  if (isNewItem) {
    // 新規の場合衛星IDを採番
    satelliteId = await ApiDefaultSatellite.addDefaultSatellite(srcFrom.satelliteName);
  }
  const apiSat = await ApiAppConfigSatellite.getUserRegisteredAppConfigSatellite(satelliteId);

  // 画面入力項目を反映
  apiSat.userRegistered = true;
  apiSat.userRegisteredSatelliteName = srcFrom.satelliteName;
  // TLE入力の場合は軌道6要素が入っててもTLEを優先する
  let tle = srcFrom.tle;
  if (!tle) {
    // データ登録するのはTLEなので軌道6要素入力の場合はTLEに変換する
    // 軌道要素からTLEを生成
    const TleStrings = TleUtil.orbitElementsToTLE({
      noradId: apiSat.noradId,
      satelliteName: srcFrom.satelliteName,
      epochUtcDate: getUTCDate(srcFrom.epochUtcDate),
      semiMajorAxisKm: parseInt(srcFrom.semiMajorAxisKm),
      inclinationDeg: parseFloat(srcFrom.inclinationDeg),
      raanDeg: parseFloat(srcFrom.raanDeg),
      argumentOfPerigeeDeg: parseFloat(srcFrom.argumentOfPerigeeDeg),
      eccentricity: parseFloat(srcFrom.eccentricity),
      meanAnomalyDeg: parseFloat(srcFrom.meanAnomalyDeg),
      bStar: 0, // 入力項目がないので0固定
    });
    tle = `${TleStrings.tleLine1}\n${TleStrings.tleLine2}`;
  }
  apiSat.userRegisteredTle = tle;

  // TLEからNORADIDを取得して設定
  const lines = tle.split("\n");
  const parsedTle = parseTle(lines[0], lines[1]);
  apiSat.noradId = parsedTle.line1.satNum;

  if (isNewItem) {
    // 新規登録の場合ユーザ登録のリストとグループへの追加をする
    targetAppConfig.satellites.push(apiSat);
  } else {
    // 更新の場合、衛星設定を反映する
    targetAppConfig.satellites.forEach((sat) => {
      if (sat.satelliteId === apiSat.satelliteId) {
        Object.assign(sat, apiSat);
      }
    });
  }

  return isNewItem;
}
export function getUTCDate(inputStr: string): Date {
  const [date, time] = inputStr.split(" ");
  const [yy, mm, dd] = date.split("/");
  return new Date(`${yy}-${mm}-${dd}T${time}:00Z`);
}
