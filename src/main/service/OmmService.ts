import CommonUtil from "@/common/CommonUtil.js";
import Constant from "@/common/Constant.js";
import type { OmmItem, OmmItemMap } from "@/common/model/OmmModel.js";
import { OmmJsonModel } from "@/common/model/OmmModel.js";
import type { TleJsonModel } from "@/common/model/TleModel.js";
import type { StringMap } from "@/common/types/types.js";
import WebClient from "@/common/WebClient.js";
import { AppConfigUtil } from "@/main/util/AppConfigUtil.js";
import AppMainLogger from "@/main/util/AppMainLogger.js";
import FileUtil from "@/main/util/FileUtil.js";
import OmmUtil from "@/main/util/OmmUtil.js";
import type { TleStrings } from "@/renderer/types/satellite-type.js";

/**
 * OMM(Orbit Mean-elements Message)サービス
 * 軌道要素データの取得・保存・取得を行う(TleServiceの置き換え)
 */
export default class OmmService {
  // キャッシュ取得時のomm.json更新日時
  private static ommFileUpdateDate: number = 0;
  // omm.jsonデータのキャッシュ
  private static cachedOmmJsonModel: OmmJsonModel | null = null;
  // NoradIDからTleStringsを引くためのキャッシュ
  private static cachedTleStringMap: StringMap<TleStrings> = {};

  private readOmmJson(): OmmJsonModel {
    const savePath = AppConfigUtil.getOmmPath();
    if (!FileUtil.exists(savePath)) {
      return new OmmJsonModel();
    }

    return FileUtil.readJson(savePath) as OmmJsonModel;
  }

  /**
   * 軌道要素データを取得し、ファイルに保存する
   */
  public async getOmmAndSave(): Promise<void> {
    const savePath = AppConfigUtil.getOmmPath();

    // 各URLから軌道要素データを取得し、形式判別・OmmItem化する
    const ommItemsPerUrl = await this.getOmmItemsFromUrls();
    if (ommItemsPerUrl.length === 0) {
      return;
    }

    // 現在のomm.jsonの内容を取得する
    const ommData: OmmJsonModel = this.readOmmJson();

    // 取得したOmmItemを元に既存のOmmItemMapに追加、更新を行う
    const newOmmItemMap = this.mergeOmmData(ommItemsPerUrl, ommData.ommItemMap);

    // OmmItemMapをファイルに保存する
    const data: OmmJsonModel = { ommItemMap: newOmmItemMap };
    FileUtil.writeText(savePath, JSON.stringify(data, null, 2));

    // 最終取得日時を更新する
    AppConfigUtil.saveTleLastRetrievedDate(Date.now());
  }

  /**
   * 設定されている各URLから軌道要素データを取得し、OmmItemのリストに変換する
   * @returns URL毎のOmmItem[](1件も取得できなかった場合は空配列)
   */
  private async getOmmItemsFromUrls(): Promise<OmmItem[][]> {
    const savePath = AppConfigUtil.getOmmPath();
    const ommFileExists = FileUtil.exists(savePath);

    // OMMファイルが存在し、且つ取得可能でない場合は、処理なし
    if (ommFileExists && !this.canTakeOmm()) {
      return [];
    }

    const webClient = new WebClient();
    const config = AppConfigUtil.getConfigTransaction();
    const results: OmmItem[][] = [];

    for (const tleUrl of config.tle.urls) {
      // 無効URLは無視する
      if (!tleUrl.enable) {
        continue;
      }

      const text = await this.getTextByUrl(tleUrl.url, webClient);
      if (CommonUtil.isEmpty(text)) {
        continue;
      }

      const items = OmmUtil.parseToOmmItems(text);
      if (items.length > 0) {
        results.push(items);
      }
    }

    return results;
  }

  /**
   * 指定のURLから軌道要素データのテキストを取得する
   */
  private async getTextByUrl(url: string, webClient: WebClient): Promise<string> {
    let res;
    try {
      res = await webClient.get(url);
    } catch {
      throw new Error(`Could not access the URL: ${url}`);
    }

    if (res.status !== 200) {
      AppMainLogger.warn(`指定のURLで軌道要素データが取得できませんでした: ${res.status} ${url} `);
      return "";
    }

    // memo: サーバのレスポンスがContent-Type: application/jsonの場合、axiosが自動的にJSONをオブジェクトへパースするため、
    //       res.dataが文字列でない場合はテキストに戻す
    const text = typeof res.data === "string" ? res.data : JSON.stringify(res.data);
    if (CommonUtil.isEmpty(text.trim())) {
      return "";
    }

    return text.trim();
  }

  /**
   * 軌道要素データが取得可能か判定する
   * @returns true: 取得可能
   *          false: 取得不可
   */
  private canTakeOmm(): boolean {
    // 最終取得日時からTLE_GET_INTERVAL_MS経過しているか
    // memo: celestrak.orgに連続アクセスすると403を返すため、以下時間をおいて取得を行う
    const param = AppConfigUtil.getConfig();
    if (Date.now() - param.tle.lastRetrievedDate > Constant.Tle.TLE_GET_INTERVAL_MS) {
      return true;
    }

    return false;
  }

  /**
   * URL毎に取得したOmmItemを、ベースとするOmmItemMapに対してNoradIDをキーにして追加、更新を行う
   * 更新はエポック日時が新しい場合に更新する
   * @param {OmmItem[][]} ommItemsPerUrl URL毎のOmmItem[]
   * @param {OmmItemMap} baseOmmItemMap ベースとするOmmItemMap
   * @returns {OmmItemMap} マージ後のOmmItemMap
   */
  private mergeOmmData(ommItemsPerUrl: OmmItem[][], baseOmmItemMap: OmmItemMap): OmmItemMap {
    // 引数のbaseOmmItemMapからコピーして、返却用のOmmItemMapを作成
    const ommItemMap: OmmItemMap = { ...JSON.parse(JSON.stringify(baseOmmItemMap)) };

    // 既存のフラグは一旦落とす
    Object.values(ommItemMap).forEach((ommItem) => {
      ommItem.isInLatestOmm = false;
    });

    for (const items of ommItemsPerUrl) {
      for (const item of items) {
        const id = item.noradCatId;
        if (CommonUtil.isEmpty(id)) {
          continue;
        }

        item.isInLatestOmm = true;

        // 新規、またはエポック日時が新しい場合は上書きする
        if (!ommItemMap[id] || this.isNewerEpoch(item.epoch, ommItemMap[id].epoch)) {
          ommItemMap[id] = item;
          continue;
        }

        // 既存データが残る場合もフラグは立てる
        ommItemMap[id].isInLatestOmm = true;
      }
    }

    return ommItemMap;
  }

  /**
   * 新しいエポック日時か判定する
   */
  private isNewerEpoch(newEpoch: string, oldEpoch: string): boolean {
    return OmmUtil.epochToDate(newEpoch).getTime() > OmmUtil.epochToDate(oldEpoch).getTime();
  }

  /**
   * 指定のNorad IDの軌道要素データをTLE文字列で取得する
   * @param {string} noradIds Norad ID(JSON配列の文字列)
   * @returns {Promise<TleStrings[]>} TLE文字列
   */
  public getOmmsByNoradIds(noradIds: string): Promise<TleStrings[]> {
    // OMM JSONファイルの内容を取得する
    const ommData: OmmJsonModel = this.readOmmJson();
    const ommItemMap: OmmItemMap = ommData.ommItemMap;

    // noradIdsをパースして配列に変換する
    const noradIdArray: string[] = JSON.parse(noradIds) as string[];

    const results: TleStrings[] = [];
    for (let ii = 0; ii < noradIdArray.length; ii++) {
      const noradId = noradIdArray[ii];

      // NoradIDからTleStringを取得する
      const tleStrings = this.findOmmByNoradId(ommItemMap, noradId);

      // 見つからなかったNorad IDを警告ログに出力する
      if (!tleStrings) {
        // AppMainLogger.warn(`The following Norad ID were not found: ${noradId}`);
        continue;
      }

      results.push(tleStrings);
    }

    return results;
  }

  /**
   * 指定のNorad IDの軌道要素データをTLE文字列で取得する
   * @param {string} noradId Norad ID
   * @returns {TleStrings} TLE文字列
   */
  public getOmmByNoradId(noradId: string): TleStrings | null {
    // OMM JSONをロード
    const savePath = AppConfigUtil.getOmmPath();

    // OMMファイルの読み込み
    const ommJsonModel: OmmJsonModel | null = this.readOmmMapOrGetCache(savePath);
    if (!ommJsonModel) {
      return null;
    }

    // 指定のNorad IDのOMMを探索
    return this.findOmmByNoradId(ommJsonModel.ommItemMap, noradId);
  }

  /**
   * 指定のNorad IDの軌道要素データをTLE文字列で取得する
   */
  private findOmmByNoradId(ommItemMap: OmmItemMap, noradId: string): TleStrings | null {
    // キャッシュにあればそれを返す
    if (noradId in OmmService.cachedTleStringMap) {
      return OmmService.cachedTleStringMap[noradId];
    }

    // 見つからなかったNorad IDを警告ログに出力する
    if (!(noradId in ommItemMap)) {
      // AppMainLogger.warn(`The following Norad ID were not found: ${noradId}`);
      return null;
    }

    const tleStrings = OmmUtil.ommItemToTleStrings(ommItemMap[noradId]);

    // キャッシュに保存
    OmmService.cachedTleStringMap[noradId] = tleStrings;

    return tleStrings;
  }

  /**
   * OMMファイルを読み込む。キャッシュがあればそれを返す
   */
  private readOmmMapOrGetCache(ommFilePath: string): OmmJsonModel | null {
    // memo: 初期起動時など、OMMファイルが存在しない場合があるため、存在しない場合はnullを返す
    if (!FileUtil.exists(ommFilePath)) {
      return null;
    }

    let ommJsonModel = OmmService.cachedOmmJsonModel;
    const updateAt = FileUtil.updateAt(ommFilePath).getTime();

    // キャッシュあり、ファイル更新日時が同じ場合はキャッシュ値を返す
    if (ommJsonModel && OmmService.ommFileUpdateDate === updateAt) {
      return ommJsonModel;
    }

    // ファイルからOMMを読み込む
    ommJsonModel = this.readOmmJson();
    OmmService.cachedOmmJsonModel = ommJsonModel;
    OmmService.ommFileUpdateDate = updateAt;

    // TleStringMapをクリア
    OmmService.cachedTleStringMap = {};

    return ommJsonModel;
  }

  /**
   * URLから読み込み可能な軌道要素データが取得できるか確認する
   */
  public async canGetValidOmm(url: string, webClient: WebClient): Promise<boolean> {
    const text = await this.getTextByUrl(url, webClient);
    if (CommonUtil.isEmpty(text)) {
      return false;
    }

    if (OmmUtil.detectFormat(text) === "UNKNOWN") {
      return false;
    }

    return OmmUtil.parseToOmmItems(text).length > 0;
  }

  /**
   * tle.jsonが存在し、omm.jsonが存在しない場合に、tle.jsonをomm.json形式に変換して保存する(一度限りの移行処理)
   */
  public migrateFromTleJsonIfNeeded(): void {
    const ommPath = AppConfigUtil.getOmmPath();
    const tlePath = AppConfigUtil.getTlePath();

    if (FileUtil.exists(ommPath) || !FileUtil.exists(tlePath)) {
      return;
    }

    const tleJsonModel = FileUtil.readJson(tlePath) as TleJsonModel;
    const ommItemMap: OmmItemMap = {};

    Object.values(tleJsonModel.tleItemMap).forEach((tleItem) => {
      const text = `${tleItem.name}\n${tleItem.line1}\n${tleItem.line2}`;
      const items = OmmUtil.parseToOmmItems(text);
      if (items.length === 0) {
        return;
      }

      const ommItem = items[0];
      ommItem.isInLatestOmm = tleItem.isInLatestTLE;
      ommItemMap[ommItem.noradCatId] = ommItem;
    });

    const data: OmmJsonModel = { ommItemMap };
    FileUtil.writeText(ommPath, JSON.stringify(data, null, 2));

    AppMainLogger.info(`tle.jsonからomm.jsonへの移行を行いました。 ${ommPath}`);
  }
}
