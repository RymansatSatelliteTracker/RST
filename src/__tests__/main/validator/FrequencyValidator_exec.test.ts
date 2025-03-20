import I18nMsgs from "@/common/I18nMsgs";
import FileUtil from "@/main/util/FileUtil";
import FrequencyValidator from "@/main/validator/FrequencyValidator";
import * as path from "path";

/**
 * 正常データ
 */
test("正常データ", () => {
  // テストデータ
  const dataPath = path.resolve(__dirname, "data_FrequencyValidator_exec", "success.json");
  const text = FileUtil.readText(dataPath);
  const freqData = JSON.parse(text);

  // 実行
  const validator = new FrequencyValidator();
  const results = validator.exec(freqData);

  // 検証
  expect(results.length).toBe(0);
});

/**
 * 異常系
 * 周波数が文字列
 */
test("異常系：周波数が文字列", () => {
  // テストデータ
  const dataPath = path.resolve(__dirname, "data_FrequencyValidator_exec", "frequency_is_string.json");
  const text = FileUtil.readText(dataPath);
  const freqData = JSON.parse(text);

  // 実行
  const validator = new FrequencyValidator();
  const results = validator.exec(freqData);

  // 検証
  expect(results.length).toBe(5);
  expect(results[0].errItemName).toBe("frequency/satellites/0/uplink1/uplinkMhz");
  expect(results[0].errMsgItem).toBe(I18nMsgs.CHK_ERR_FREQUENCY_INVALID_ITEM);
  expect(results[1].errItemName).toBe("frequency/satellites/0/uplink2/uplinkMhz");
  expect(results[1].errMsgItem).toBe(I18nMsgs.CHK_ERR_FREQUENCY_INVALID_ITEM);
  expect(results[2].errItemName).toBe("frequency/satellites/0/downlink1/downlinkMhz");
  expect(results[2].errMsgItem).toBe(I18nMsgs.CHK_ERR_FREQUENCY_INVALID_ITEM);
  expect(results[3].errItemName).toBe("frequency/satellites/0/downlink2/downlinkMhz");
  expect(results[3].errMsgItem).toBe(I18nMsgs.CHK_ERR_FREQUENCY_INVALID_ITEM);
  expect(results[4].errItemName).toBe("frequency/satellites/0/toneMhz");
  expect(results[4].errMsgItem).toBe(I18nMsgs.CHK_ERR_FREQUENCY_INVALID_ITEM);
});

/**
 * 異常系
 * 周波数定義の1がなくて2だけ設定
 */
test("異常系：周波数定義の1がなくて2だけ設定", () => {
  // テストデータ
  const dataPath = path.resolve(__dirname, "data_FrequencyValidator_exec", "only_2.json");
  const text = FileUtil.readText(dataPath);
  const freqData = JSON.parse(text);

  // 実行
  const validator = new FrequencyValidator();
  const results = validator.exec(freqData);

  // 検証
  expect(results.length).toBe(2);
  expect(results[0].errItemName).toBe("uplink2");
  expect(results[0].errMsgItem).toBe(I18nMsgs.CHK_ERR_FREQUENCY_INVALID_ITEM);
  expect(results[1].errItemName).toBe("downlink2");
  expect(results[1].errMsgItem).toBe(I18nMsgs.CHK_ERR_FREQUENCY_INVALID_ITEM);
});

/**
 * 異常系
 * 周波数とモード片方のみ定義
 */
test("異常系：周波数とモード片方のみ定義", () => {
  // テストデータ
  const dataPath = path.resolve(__dirname, "data_FrequencyValidator_exec", "frequency_or_mode.json");
  const text = FileUtil.readText(dataPath);
  const freqData = JSON.parse(text);

  // 実行
  const validator = new FrequencyValidator();
  const results = validator.exec(freqData);

  // 検証
  expect(results.length).toBe(4);
  expect(results[0].errItemName).toBe("uplink1");
  expect(results[0].errMsgItem).toBe(I18nMsgs.CHK_ERR_FREQUENCY_INVALID_ITEM);
  expect(results[1].errItemName).toBe("uplink2");
  expect(results[1].errMsgItem).toBe(I18nMsgs.CHK_ERR_FREQUENCY_INVALID_ITEM);
  expect(results[2].errItemName).toBe("downlink1");
  expect(results[2].errMsgItem).toBe(I18nMsgs.CHK_ERR_FREQUENCY_INVALID_ITEM);
  expect(results[3].errItemName).toBe("downlink2");
  expect(results[3].errMsgItem).toBe(I18nMsgs.CHK_ERR_FREQUENCY_INVALID_ITEM);
});
