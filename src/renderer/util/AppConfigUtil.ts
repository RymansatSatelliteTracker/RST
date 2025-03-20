import CommonUtil from "@/common/CommonUtil";
import { AppConfigRotatorDevice } from "@/common/model/AppConfigRotatorModel";
import ApiAppConfig from "@/renderer/api/ApiAppConfig";

// 設定ファイル（JSON）のルートのキー名
const CONFIG_ROOT_KEY = "param";

/**
 * レンダラ向け
 * アプリケーション設定のユーティリティ
 */
export class AppConfigUtil {
  /**
   * 設定ファイルで設定されている、現在のローテーターの機器定義を返す
   */
  public static async getCurrentRotatorDevice(): Promise<AppConfigRotatorDevice | null> {
    const appConfig = await ApiAppConfig.getAppConfig();
    const configRotator = appConfig.rotator;

    // ローテータが未設定の場合
    if (CommonUtil.isEmpty(configRotator.rotatorId)) {
      return null;
    }

    return AppConfigUtil.findRotatorDeviceById(configRotator.rotatorId);
  }

  /**
   * 指定のローテーターIDのローテーター機器定義を返す
   * @throws {Error} 指定のローテーターIDのローテーター機器がローテーター定義ファイルに存在しない場合
   */
  public static async findRotatorDeviceById(rotatorId: string): Promise<AppConfigRotatorDevice> {
    const rotatorConfig = await ApiAppConfig.getRotatorConfig();
    const rotators = rotatorConfig.rotators;

    // ローテーターで回して
    for (let ii = 0; ii < rotators.length; ii++) {
      const rotator = rotators[ii];

      // デバイスで回してIDが一致するデバイスを返す
      for (let jj = 0; jj < rotator.devices.length; jj++) {
        const device = rotator.devices[jj];
        if (device.rotatorId === rotatorId) {
          return device;
        }
      }
    }

    // 定義ファイルが改変されていない場合は、ここに到達しないはず
    throw new Error(
      `指定のローテーターIDのローテーター機器がローテーター定義ファイルに存在しません。rotatorId=${rotatorId}`
    );
  }
}
