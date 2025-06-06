import { TleItemMap } from "@/common/model/TleModel";
import { DefaultSatelliteType, SatelliteIdentiferType } from "@/common/types/satelliteSettingTypes";
import { createDefaultSatellite, initializeDefaultSatellites, normalizeData } from "@/common/util/DefaultSatelliteUtil";

/**
 * アプリケーション内で管理しておく対象衛星のデフォルト情報
 */
export class DefaultSatelliteModel {
  // 対象衛星のデフォルト情報
  private defaultSatellites: DefaultSatelliteType[] = [];
  // 採番した衛星IDの最大値
  private maxSatelliteId: number = -1;
  // 登録済みのnoradIdリスト
  private registeredNoradIds: string[] = [];

  /**
   * デフォルト衛星定義をファイル保存用のJSON形式の文字列で返却する
   * @returns JSONデータ
   */
  public getJsonString(): string {
    return JSON.stringify(
      {
        defaultSatellite: {
          defaultSatellites: this.defaultSatellites,
          maxSatelliteId: this.maxSatelliteId,
          registeredNoradIds: this.registeredNoradIds,
        },
      },
      null,
      2
    );
  }

  /**
   * デフォルト衛星定義のファイルデータからモデルを初期化して生成する
   * @param data
   * @returns
   */
  public static getInitializedModelFromData(data: any): DefaultSatelliteModel {
    if (data.defaultSatellites && data.registeredNoradIds && data.maxSatelliteId) {
      return Object.assign(new DefaultSatelliteModel(), {
        defaultSatellites: initializeDefaultSatellites(data.defaultSatellites),
        maxSatelliteId: data.maxSatelliteId,
        registeredNoradIds: data.registeredNoradIds,
      });
    } else {
      return new DefaultSatelliteModel();
    }
  }

  /**
   * TLEが存在するデフォルト衛星情報を衛星識別情報に変換して返却する
   * @param tleItemMap TLE情報
   * @returns 衛星識別情報
   */
  public getSatelliteIdentifer(tleItemMap: TleItemMap): SatelliteIdentiferType[] {
    // TLEに存在するNORADIDを取得する
    const noradIds = this.registeredNoradIds.reduce((direcotry: { [key: string]: number }, value, index) => {
      direcotry[value] = index;
      return direcotry;
    }, {});
    // TLEに一致するデフォルト衛星情報を取得する
    const satIdTypes: SatelliteIdentiferType[] = [];
    Object.values(tleItemMap).forEach((tleItem) => {
      const index: number = noradIds[tleItem.id];
      const defsat = this.defaultSatellites[index];
      satIdTypes.push({
        satelliteId: defsat.satelliteId,
        satelliteName: defsat.satelliteName,
        userRegistered: false,
      });
    });
    return satIdTypes;
  }

  /**
   * 衛星IDに一致するデフォルト衛星情報を返却する
   * @param satelliteId
   * @returns (一致する場合)デフォルト衛星情報/(一致しない場合)null
   */
  public getDefaultSatelliteBySatelliteId(satelliteId: number): DefaultSatelliteType | null {
    const ret =
      this.defaultSatellites.find((data) => {
        if (data.satelliteId === satelliteId) {
          return data;
        }
      }) ?? null;
    return ret;
  }

  /**
   * 対象衛星を追加する
   * 　衛星が新規追加の場合のみ追加する
   * 　衛星追加時は衛星IDを採番する
   *   noradId指定がない場合は仮のIDを採番する
   * 　追加した衛星は登録済みNORAIDのリストに追加する
   * @param satelliteName
   * @param noradId
   * @returns number 追加:追加時の衛星ID、更新:-1
   */
  public addSatellite(satelliteName: string, noradId?: string): number {
    if (noradId && this.isNoradidRegisted(noradId)) {
      // NORADIDが登録済み
      return -1;
    }

    // 衛星IDを採番
    const newSatId: number = this.generateSatelliteId();

    let noradIdLocal = "";
    if (!noradId) {
      // noradId指定なしなので仮IDを採番する
      // 降順でソートして1件目を取得
      const nowNoradId: number = parseInt(this.registeredNoradIds.slice().sort((a, b) => Number(b) - Number(a))[0]);
      // 仮のnoradIdは99000が番号体系なのでこれより小さい場合は仮番号とする
      if (nowNoradId < 99000) {
        noradIdLocal = "99000";
      } else {
        noradIdLocal = String(nowNoradId + 1);
      }
    } else {
      // noradId指定あり
      noradIdLocal = noradId;
    }
    // 登録済みNORADIDのリストに追加
    this.registeredNoradIds.push(noradIdLocal);

    // デフォルト衛星情報を作成
    const defSat: DefaultSatelliteType = createDefaultSatellite(newSatId, satelliteName, noradIdLocal);

    // デフォルト衛星情報のリストに追加
    this.defaultSatellites.push(defSat);

    return newSatId;
  }

  /**
   * 次の衛星IDを採番する
   * @returns 次の衛星ID
   */
  private generateSatelliteId(): number {
    return ++this.maxSatelliteId;
  }

  /**
   * NORADIDが登録済みか
   * @param noradId
   * @returns
   */
  private isNoradidRegisted(noradId: string): boolean {
    return this.registeredNoradIds.includes(noradId);
  }

  /**
   * 渡された衛星情報で上書きする
   * @param satellites
   */
  public updateSatellites(satellites: DefaultSatelliteType[]) {
    satellites.forEach((sat) => {
      this.defaultSatellites.forEach((defsat) => {
        if (defsat.noradId === sat.noradId) {
          Object.assign(defsat, normalizeData(sat, defsat));
        }
      });
    });
  }

  /**
   * デフォルト衛星定義モデルをリフレッシュする
   * ユーザ定義されたものがある場合は保持する
   * @param apSat
   */
  public refreshDefaultSatelliteModel(satelliteIds: number[] = []): void {
    const keepDefSats = this.defaultSatellites.filter((defSat) =>
      satelliteIds.some((satId) => satId === defSat.satelliteId)
    );
    this.defaultSatellites = [];
    this.maxSatelliteId = -1;
    this.registeredNoradIds = [];
    if (keepDefSats) {
      keepDefSats.forEach((defSat) => {
        this.defaultSatellites.push(defSat);
        this.maxSatelliteId = this.maxSatelliteId > defSat.satelliteId ? this.maxSatelliteId : defSat.satelliteId;
        this.registeredNoradIds.push(defSat.noradId);
      });
    }
  }
}
