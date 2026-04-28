import Constant from "@/common/Constant";
import I18nMsgs from "@/common/I18nMsgs";
import { FrequencyModel } from "@/common/model/FrequencyModel";
import { ApiResponse } from "@/common/types/types";
import FrequencyValidator from "@/main/validator/FrequencyValidator";
import fs from "fs";
import path from "path";

/**
 * リポジトリ登録用のFrequencyサービス
 */
export default class RepoFrequencyService {
  /**
   * 保存済み周波数設定情報を取得する
   */
  public getRepoFrequency(): FrequencyModel {
    const savePath = this.getRepoFrequencyPath();
    if (!fs.existsSync(savePath)) {
      return new FrequencyModel();
    }

    const fileContent = fs.readFileSync(savePath, "utf-8");
    return Object.assign(new FrequencyModel(), JSON.parse(fileContent));
  }

  /**
   * 周波数設定情報を保存する
   */
  public storeRepoFrequency(frequencyModel: FrequencyModel): ApiResponse<void> {
    const storeTarget = structuredClone(frequencyModel);
    // リポジトリ登録用のfrequency.jsonにはsatelliteIdを保存しない
    storeTarget.frequency.satellites = storeTarget.frequency.satellites.map((sat) => {
      const { satelliteId, noradId, ...rest } = sat;
      return {
        noradId,
        ...rest,
      } as typeof sat;
    });
    storeTarget.frequency.lastUpdateTime = Date.now();

    const validater = new FrequencyValidator();
    const results = validater.exec(storeTarget);
    if (results.length !== 0) {
      return new ApiResponse(false, I18nMsgs.CHK_ERR_FREQUENCY_INVALID_ITEM);
    }

    const savePath = this.getRepoFrequencyPath();
    fs.writeFileSync(savePath, JSON.stringify(storeTarget, null, 2));
    return new ApiResponse(true);
  }

  /**
   * 周波数設定ファイルパスを返す
   */
  private getRepoFrequencyPath(): string {
    return path.join(process.cwd(), "satellite_data", Constant.Config.FREQUENCY_FILENAME);
  }
}
