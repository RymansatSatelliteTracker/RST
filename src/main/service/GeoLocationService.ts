import CommonUtil from "@/common/CommonUtil";
import WebClient from "@/common/WebClient";
import AppMainLogger from "@/main/util/AppMainLogger";

/**
 * GeoLocationサービス
 */
export default class GeoLocationService {
  /**
   * GeoLocationの取得を行う
   * @returns 取得できた緯度/経度
   *          取得できなかった場合はnullを返却する
   */
  public async getGeoLocation(): Promise<{ latitude: string; longitude: string } | null> {
    // GeoLocationを取得する
    const webClient = new WebClient();
    const res = await webClient.get("https://freegeoip.app/json/");
    if (res.status !== 200) {
      AppMainLogger.warn(`GeoLocationが取得できませんでした。 ${res.status}`);
      return null;
    }

    // 取得したGeoLocationから緯度/経度を取得する
    const { latitude, longitude } = JSON.parse(JSON.stringify(res.data));

    if (CommonUtil.isEmpty(latitude) || CommonUtil.isEmpty(longitude)) {
      // 緯度/経度が取得できなかった場合はnullを返却する
      return null;
    }

    return {
      latitude: latitude,
      longitude: longitude,
    };
  }
}
