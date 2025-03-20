import Constant from "@/common/Constant";
import { FrequencyModel } from "@/common/model/FrequencyModel";
import WebClient from "@/common/WebClient";
import AppMainLogger from "@/main/util/AppMainLogger";
import ElectronUtil from "@/main/util/ElectronUtil";
import FrequencyValidator from "@/main/validator/FrequencyValidator";
import fs from "fs";
import path from "path";
/**
 * Frequencyサービス
 */
export default class FrequencyService {
  /**
   * 周波数設定情報を指定のURLから取得し更新する
   * @returns ファイルを更新したらtrue
   *          ファイルを更新しなかったらfalse
   */
  public async saveFrequency(): Promise<boolean> {
    // 指定のURLからファイル取得
    const webClient = new WebClient();
    const freqUrl = Constant.SatSetting.FREQUENCY_URL;
    let res = null;
    try {
      res = await webClient.get(freqUrl);
      if (res.status !== 200) {
        throw new Error(`指定のURLで周波数設定が取得できませんでした。 ${res.status} ${freqUrl} `);
      }
    } catch (e) {
      AppMainLogger.warn(e);
      return false;
    }

    // 項目チェック
    const validater = new FrequencyValidator();
    const results = validater.exec(res.data);

    if (results.length !== 0) {
      AppMainLogger.warn(results);
      return false;
    }

    // 日付が更新されているか確認する
    const newFreqModel = new FrequencyModel();
    Object.assign(newFreqModel, res.data);

    // 保存済みの衛星周波数設定定義を取得する
    let oldFreqModel = new FrequencyModel();
    const savePath = path.join(ElectronUtil.getUserDir(), Constant.Config.FREQUENCY_FILENAME);
    if (fs.existsSync(savePath)) {
      const fileContent = fs.readFileSync(savePath, "utf-8");
      oldFreqModel = JSON.parse(fileContent);
    }

    const isNew: boolean = oldFreqModel.frequency.lastUpdateTime < 0;
    const isUpdate: boolean = oldFreqModel.frequency.lastUpdateTime < newFreqModel.frequency.lastUpdateTime;

    if (!(isNew || isUpdate)) return false;

    fs.writeFileSync(savePath, JSON.stringify(newFreqModel, null, 2));
    return true;
  }
}
