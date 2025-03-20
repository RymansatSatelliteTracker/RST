import ApiActiveSat from "@/renderer/api/ApiActiveSat";
import SatelliteService from "@/renderer/service/SatelliteService";

/**
 * 衛星サービスファクトリ
 */
export default class SatelliteServiceFactory {
  /**
   * アクティブ衛星のSatelliteServiceを生成する
   * @returns アクティブ衛星が存在しない場合はnullを返す
   */
  public static async createByActiveSat(): Promise<SatelliteService | null> {
    const satGrp = await ApiActiveSat.getActiveSatelliteGroup();
    if (!satGrp || !satGrp.mainSattelliteTle) {
      return null;
    }

    return new SatelliteService(satGrp.mainSattelliteTle);
  }

  /**
   * 衛星グループのSatelliteServiceリストを生成する
   * @param withActiveSat アクティブ衛星を含むかどうか
   */
  public static async createBySatGroup(withActiveSat: boolean = true): Promise<SatelliteService[]> {
    // 更新された衛星グループ情報を取得
    const satGrp = await ApiActiveSat.getActiveSatelliteGroup();
    if (!satGrp || !satGrp.mainSattelliteTle) {
      return [];
    }

    // 衛星グループ内の衛星のTLEを元に人工衛星クラスを生成する
    const satServices: SatelliteService[] = [];
    for (let ii = 0; ii < satGrp.activeSatellites.length; ii++) {
      const activeSat = satGrp.activeSatellites[ii];
      if (!activeSat.tle) {
        continue;
      }

      // アクティブ衛星を除外する場合
      if (!withActiveSat && satGrp.mainSatelliteId === activeSat.satelliteId) {
        continue;
      }

      satServices.push(new SatelliteService(activeSat.tle));
    }

    return satServices;
  }
}
