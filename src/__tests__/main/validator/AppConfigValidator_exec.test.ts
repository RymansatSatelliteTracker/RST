import I18nMsgs from "@/common/I18nMsgs";
import FileUtil from "@/main/util/FileUtil";
import AppConfigValidator from "@/main/validator/AppConfigValidator";
import * as path from "path";

/**
 * エラー
 * データが空
 */
test("empty", () => {
  // 実行
  const validator = new AppConfigValidator();
  const results = validator.exec({});

  // 検証
  expect(results.length).toBe(1);
  expect(results[0].errItemName).toBe("param");
  expect(results[0].errMsgItem).toBe(I18nMsgs.CHK_ERR_APPCONFIG_INVALID_ITEM);
});

/**
 * エラー
 * param配下に定義なし
 */
test("param_only", () => {
  // テストデータ
  const dataPath = path.resolve(__dirname, "data_AppConfigValidator_exec", "param_only.json");
  const text = FileUtil.readText(dataPath);
  const appConfig = JSON.parse(text);

  // 実行
  const validator = new AppConfigValidator();
  const results = validator.exec(appConfig);

  // 検証
  expect(results.length).toBe(11);
  expect(results[0].errItemName).toBe("param/appVersion");
  expect(results[0].errMsgItem).toBe(I18nMsgs.CHK_ERR_APPCONFIG_INVALID_ITEM);
  expect(results[1].errItemName).toBe("param/lang");
  expect(results[1].errMsgItem).toBe(I18nMsgs.CHK_ERR_APPCONFIG_INVALID_ITEM);
  expect(results[2].errItemName).toBe("param/tle");
  expect(results[2].errMsgItem).toBe(I18nMsgs.CHK_ERR_APPCONFIG_INVALID_ITEM);
  expect(results[3].errItemName).toBe("param/satellites");
  expect(results[3].errMsgItem).toBe(I18nMsgs.CHK_ERR_APPCONFIG_INVALID_ITEM);
  expect(results[4].errItemName).toBe("param/satelliteGroups");
  expect(results[4].errMsgItem).toBe(I18nMsgs.CHK_ERR_APPCONFIG_INVALID_ITEM);
  expect(results[5].errItemName).toBe("param/satelliteSetting");
  expect(results[5].errMsgItem).toBe(I18nMsgs.CHK_ERR_APPCONFIG_INVALID_ITEM);
  expect(results[6].errItemName).toBe("param/transceiver");
  expect(results[6].errMsgItem).toBe(I18nMsgs.CHK_ERR_APPCONFIG_INVALID_ITEM);
  expect(results[7].errItemName).toBe("param/rotator");
  expect(results[7].errMsgItem).toBe(I18nMsgs.CHK_ERR_APPCONFIG_INVALID_ITEM);
  expect(results[8].errItemName).toBe("param/groundStation");
  expect(results[8].errMsgItem).toBe(I18nMsgs.CHK_ERR_APPCONFIG_INVALID_ITEM);
  expect(results[9].errItemName).toBe("param/groundStation2");
  expect(results[9].errMsgItem).toBe(I18nMsgs.CHK_ERR_APPCONFIG_INVALID_ITEM);
  expect(results[10].errItemName).toBe("param/mainDisplay");
  expect(results[10].errMsgItem).toBe(I18nMsgs.CHK_ERR_APPCONFIG_INVALID_ITEM);
});

/**
 * エラー
 * appVersionが数値
 */
test("appVersion_num", () => {
  // テストデータ
  const dataPath = path.resolve(__dirname, "data_AppConfigValidator_exec", "appVersion_num.json");
  const text = FileUtil.readText(dataPath);
  const appConfig = JSON.parse(text);

  // 実行
  const validator = new AppConfigValidator();
  const results = validator.exec(appConfig);

  // 検証
  expect(results.length).toBe(1);
  expect(results[0].errItemName).toBe("param/appVersion");
  expect(results[0].errMsgItem).toBe(I18nMsgs.CHK_ERR_APPCONFIG_INVALID_ITEM);
});

/**
 * 正常
 * 衛星設定あり
 */
test("app_config", () => {
  // テストデータ
  const dataPath = path.resolve(__dirname, "data_AppConfigValidator_exec", "app_config.json");
  const text = FileUtil.readText(dataPath);
  const appConfig = JSON.parse(text);

  // 実行
  const validator = new AppConfigValidator();
  const results = validator.exec(appConfig);

  // 検証
  expect(results.length).toBe(0);
});

// TODO: 設定ファイルは今後変動が予想されるため、確定後にその他のテストを記載する
