import CommonUtil from "@/common/CommonUtil";
import Constant from "@/common/Constant";
import { TleItemMap, TleJsonModel } from "@/common/model/TleModel";
import { StringMap } from "@/common/types/types";
import WebClient from "@/common/WebClient";
import { AppConfigUtil } from "@/main/util/AppConfigUtil";
import AppMainLogger from "@/main/util/AppMainLogger";
import FileUtil from "@/main/util/FileUtil";
import TleUtil from "@/main/util/TleUtil";
import type { TleStrings } from "@/renderer/types/satellite-type";

/**
 * TLEサービス
 */
export default class TleService {
  // キャッシュ取得時のtle.json更新日時
  private static tleFileUpdateDate: number = 0;
  // tle.jsonデータのキャッシュ
  private static cachedTleJsonModel: TleJsonModel | null = null;
  // NoradIDからTleStringsを引くためのキャッシュ
  private static cachedTleStringMap: StringMap<TleStrings> = {};

  private readTleJson(): TleJsonModel {
    const savePath = AppConfigUtil.getTlePath();
    if (!FileUtil.exists(savePath)) {
      return new TleJsonModel();
    }

    const tleJsonModel: TleJsonModel = FileUtil.readJson(savePath);
    return tleJsonModel;
  }

  /**
   * TLEを取得し、ファイルに保存する
   * @returns 取得したTLE
   *          取得されなかった場合はブランクを返す
   */
  public async getTleAndSave(): Promise<void> {
    const savePath = AppConfigUtil.getTlePath();

    // TLE取得
    const tlesText = await this.getTleText();
    if (CommonUtil.isEmpty(tlesText)) {
      return;
    }

    // 現在の tle.jsonの内容を取得する
    const tlesData: TleJsonModel = this.readTleJson();
    const tleItemMap: TleItemMap = tlesData.tleItemMap;

    // TLEテキストを元に既存のTleItemMapに追加、更新を行う
    const newTleItemMap = this.createTleData(tlesText, tleItemMap);

    // TleItemMapをファイルに保存する
    const data: TleJsonModel = { tleItemMap: newTleItemMap };
    FileUtil.wirteText(savePath, JSON.stringify(data, null, 2));

    // TLE最終取得日時を更新する
    AppConfigUtil.saveTleLastRetrievedDate(Date.now());
  }

  /**
   * TLEの取得を行う
   * @returns 取得したTLE
   *          取得されなかった場合はブランクを返す
   */
  private async getTleText(): Promise<string> {
    const savePath = AppConfigUtil.getTlePath();
    const tleFileExists = FileUtil.exists(savePath);

    // TLEファイルが存在し、且つTLE取得可能でない場合は、処理なし
    if (tleFileExists && !this.canTakeTle()) {
      return "";
    }

    const webClient = new WebClient();
    const config = AppConfigUtil.getConfig();
    const tleTexts: string[] = [];

    // TLEのURLリストで回して、全てのTLEを取得する
    for (const tleUrl of config.tle.urls) {
      // 無効URLは無視する
      if (!tleUrl.enable) {
        continue;
      }

      const res = await webClient.get(tleUrl.url);
      if (res.status !== 200) {
        AppMainLogger.warn(`指定のURLでTLEが取得できませんでした。 ${res.status} ${tleUrl} `);
        continue;
      }

      if (!CommonUtil.isEmpty(res.data.trim())) {
        // 取得できたTLEデータを結合する
        tleTexts.push(res.data.trim());
      }
    }

    return tleTexts.join("\r\n");
  }

  private async getTleTextByUrl(url: string): Promise<string> {
    const webClient = new WebClient();
    const res = await webClient.get(url);
    if (res.status !== 200) {
      AppMainLogger.warn(`指定のURLでTLEが取得できませんでした。 ${res.status} ${url} `);
      return "";
    }
    if (!CommonUtil.isEmpty(res.data.trim())) {
      return res.data.trim();
    } else {
      return "";
    }
  }

  /**
   * TLEが取得可能か判定する
   * @returns true: 取得可能
   *          false: 取得不可
   */
  private canTakeTle(): boolean {
    // 最終取得日時からTLE_GET_INTERVAL_MS経過しているか
    // memo: celestrak.orgに連続アクセスすると403を返すため、以下時間をおいて取得を行う
    const param = AppConfigUtil.getConfig();
    if (Date.now() - param.tle.lastRetrievedDate > Constant.Tle.TLE_GET_INTERVAL_MS) {
      return true;
    }

    return false;
  }

  /**
   * TLEテキストをTleDataに変換する
   * ベースとするTleItemMapに対して、NoradIDをキーにして追加、更新を行う
   * 更新はエポック日時が新しい場合に更新する
   * @param {string} tlesText TLEテキスト
   * @param {TleItemMap} baseTleItemMap ベースとするTleItemMap
   * @returns {TleItemData[]} TLEオブジェクトのリスト
   */
  private createTleData(tlesText: string, baseTleItemMap: TleItemMap): TleItemMap {
    // 引数のbaseTleItemMapからコピーして、返却用のTleItemMapを作成
    const tleItemMap: TleItemMap = { ...JSON.parse(JSON.stringify(baseTleItemMap)) };

    // 既存のフラグは一旦落とす
    Object.values(tleItemMap).forEach((tleItem) => {
      tleItem.isInLatestTLE = false;
    });

    // TLEがブランクの場合
    if (CommonUtil.isEmpty(tlesText)) {
      return tleItemMap;
    }

    // 各OSの改行コードを想定してスプリットする
    const lines = tlesText.split(/\r\n|\r|\n/).filter((line) => !CommonUtil.isEmpty(line.trim()));
    for (let ii = 0; ii < lines.length; ii += 3) {
      // TLEの2行目が「1 」、3行目が「2 」で始まる行を探す
      while (ii < lines.length) {
        if (
          lines[ii + 1] &&
          lines[ii + 1].substring(0, 2) === "1 " &&
          lines[ii + 2] &&
          lines[ii + 2].substring(0, 2) === "2 "
        ) {
          break;
        }
        ii++;
      }
      // 行きすぎたらループを抜ける
      if (lines.length <= ii + 2) break;

      // ここまできたら取得可能なTLEの行数なので、TLEを取得する
      const id = TleUtil.getNoradId(lines[ii + 1]);
      const epoch = TleUtil.getEpochDate(lines[ii + 1]);
      const name = TleUtil.getName(lines[ii]);
      const line1 = lines[ii + 1];
      const line2 = lines[ii + 2];
      const isInLatestTLE = true;

      // 新規TLEを追加、または重複したTLEよりもエポック日時が新しいTLEを上書きする
      if (!tleItemMap[id] || tleItemMap[id].epoch < epoch) {
        tleItemMap[id] = { id, name, epoch, line1, line2, isInLatestTLE };
      }

      // TLEが存在する場合はフラグを上げる
      tleItemMap[id].isInLatestTLE = isInLatestTLE;
    }

    return tleItemMap;
  }

  /**
   * 指定のNorad IDのTLEを取得する
   * @param {string} noradIds Norad ID
   * @returns {Promise<TleStrings[]>} TLE文字列
   */
  public async getTlesByNoradIds(noradIds: string): Promise<TleStrings[]> {
    // TLE JSONファイルの内容を取得する
    const tlesData: TleJsonModel = this.readTleJson();
    const tleItemMap: TleItemMap = tlesData.tleItemMap;

    // noradIdsをパースして配列に変換する
    const noradIdArray: string[] = JSON.parse(noradIds);

    const results: TleStrings[] = [];
    for (let ii = 0; ii < noradIdArray.length; ii++) {
      const noradId = noradIdArray[ii];

      // NoraｄIDからTleStringを取得する
      const tleStrings = this.findTleByNoradId(tleItemMap, noradId);

      // 見つからなかったNorad IDを警告ログに出力する
      if (!tleStrings) {
        AppMainLogger.warn(`The following Norad ID were not found: ${noradId}`);
        continue;
      }

      results.push(tleStrings);
    }

    return results;
  }

  /**
   * 指定のNorad IDのTLEを取得する
   * @param {string} noradId Norad ID
   * @returns {Promise<TleStrings>} TLE文字列
   */
  public getTlesByNoradId(noradId: string): TleStrings | null {
    // TLE JSONをロード
    const savePath = AppConfigUtil.getTlePath();

    // TLEファイルの読み込み
    const tleJsonModel: TleJsonModel | null = this.readTleMapOrGetCache(savePath);
    if (!tleJsonModel) {
      return null;
    }

    // 指定のNorad IDのTLEを探索
    return this.findTleByNoradId(tleJsonModel.tleItemMap, noradId);
  }

  /**
   * 指定のNorad IDのTLEを取得する
   */
  private findTleByNoradId(tleItemMap: TleItemMap, noradId: string): TleStrings | null {
    // キャッシュにあればそれを返す
    if (noradId in TleService.cachedTleStringMap) {
      return TleService.cachedTleStringMap[noradId];
    }

    // 見つからなかったNorad IDを警告ログに出力する
    if (!(noradId in tleItemMap)) {
      AppMainLogger.warn(`The following Norad ID were not found: ${noradId}`);
      return null;
    }

    const tleItemData = tleItemMap[noradId];
    const tleStrings = {
      id: tleItemData.id,
      satelliteName: tleItemData.name,
      tleLine1: tleItemData.line1,
      tleLine2: tleItemData.line2,
    };

    // キャッシュに保存
    TleService.cachedTleStringMap[noradId] = tleStrings;

    return tleStrings;
  }

  /**
   * TLEファイルを読み込む。キャッシュがあればそれを返す
   */
  private readTleMapOrGetCache(tleFilePath: string): TleJsonModel | null {
    // memo: 初期起動時など、TLEファイルが存在しない場合があるため、存在しない場合はnullを返す
    if (!FileUtil.exists(tleFilePath)) {
      return null;
    }

    let tleJsonModel = TleService.cachedTleJsonModel;
    const updateAt = FileUtil.updateAt(tleFilePath).getTime();

    // キャッシュあり、ファイル更新日時が同じ場合はキャッシュ値を返す
    if (tleJsonModel && TleService.tleFileUpdateDate === updateAt) {
      return tleJsonModel;
    }

    // ファイルからTLEを読み込む
    tleJsonModel = this.readTleJson();
    TleService.cachedTleJsonModel = tleJsonModel;
    TleService.tleFileUpdateDate = updateAt;

    // TleStringMapをクリア
    TleService.cachedTleStringMap = {};

    return tleJsonModel;
  }

  public async canGetValidTle(url: string): Promise<boolean> {
    // URLからTLEを取得する
    const tleText = await this.getTleTextByUrl(url);
    // TLEがブランクの場合
    if (CommonUtil.isEmpty(tleText)) {
      return false;
    }

    // 各OSの改行コードを想定してスプリットする
    const lines = tleText.split(/\r\n|\r|\n/).filter((line) => !CommonUtil.isEmpty(line.trim()));
    // TLEの2行目が「1 」、3行目が「2 」で始まる行を探す
    // 一つでも見つけたらOK
    let i = 0;
    while (i < lines.length) {
      if (
        lines[i + 1] &&
        lines[i + 1].substring(0, 2) === "1 " &&
        lines[i + 2] &&
        lines[i + 2].substring(0, 2) === "2 "
      ) {
        return true;
      }
      i++;
    }
    return false;
  }
}
