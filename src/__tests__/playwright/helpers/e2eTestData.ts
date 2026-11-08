import Constant from "@/common/Constant.js";
import { AppConfigModel } from "@/common/model/AppConfigModel.js";
import { OmmItem } from "@/common/model/OmmModel.js";

/**
 * E2Eテストで共通に使用するテストデータ
 */

/**
 * テスト用のアプリケーション設定の基本形を返す
 * - 軌道要素をネットワークから取得しない
 * - 地上局を設定済みにする（東京）
 */
export const makeBaseAppConfig = (): AppConfigModel => {
  const config = new AppConfigModel();
  config.appVersion = Constant.appVersion;

  // 軌道要素をネットワークから取得しないようにする
  config.tle.urls = [];
  config.tle.lastRetrievedDate = Date.now();

  // 地上局（東京）
  config.groundStation.lat = 35.68;
  config.groundStation.lon = 139.76;
  config.groundStation.height = 0;

  return config;
};

/**
 * TLEの行末のチェックサムを算出する（数字の合計＋マイナス記号の数 の1の位）
 */
const tleChecksum = (line: string): number => {
  let sum = 0;
  for (const ch of line) {
    if (ch >= "0" && ch <= "9") {
      sum += Number(ch);
    } else if (ch === "-") {
      sum += 1;
    }
  }
  return sum % 10;
};

/**
 * テスト用のTLE（2行）を生成する
 * MEMO: 大気抵抗（B*）と平均運動の変化率を0にして、エポックから時間が経っても軌道計算が破綻しないようにする
 * @param noradId NORAD ID
 * @param inclination 軌道傾斜角（度）
 */
export const makeTle = (noradId: number, inclination: number = 51.6416): string => {
  const id = String(noradId).padStart(5, "0");
  const inc = inclination.toFixed(4).padStart(8, " ");
  const line1 = `1 ${id}U 26001A   26312.50000000  .00000000  00000-0  00000-0 0  999`;
  const line2 = `2 ${id} ${inc} 247.4627 0006703 130.5360 325.0288 15.49815350    1`;
  return `${line1}${tleChecksum(line1)}\n${line2}${tleChecksum(line2)}`;
};

/**
 * テスト用の軌道要素（OMM）を返す
 * MEMO: 大気抵抗（B*）と平均運動の変化率を0にして、エポックから時間が経っても軌道計算が破綻しないようにする
 * @param noradId NORAD ID
 * @param name 衛星名
 */
export const makeOmmItem = (noradId: number, name: string): OmmItem => {
  const item = new OmmItem();
  item.objectName = name;
  item.objectId = "2026-001A";
  item.noradCatId = String(noradId);
  item.epoch = "2026-11-08T12:00:00.000Z";
  item.meanMotion = 15.4981535;
  item.eccentricity = 0.0006703;
  item.inclination = 51.6416;
  item.raOfAscNode = 247.4627;
  item.argOfPericenter = 130.536;
  item.meanAnomaly = 325.0288;
  item.isInLatestOmm = true;
  return item;
};
