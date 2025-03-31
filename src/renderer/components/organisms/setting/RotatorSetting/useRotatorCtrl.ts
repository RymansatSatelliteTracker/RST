import CommonUtil from "@/common/CommonUtil";
import { AppConfigRotator } from "@/common/model/AppConfigModel";
import ApiAntennaTracking from "@/renderer/api/ApiAntennaTracking";
import ApiSirial from "@/renderer/api/ApiSirial";
import RotatorSettingForm from "@/renderer/components/organisms/setting/RotatorSetting/RotatorSettingForm";
import { Ref } from "vue";

/**
 * ローテーター制御関係のフック
 */
export default function useRotatorCtrl(form: Ref<RotatorSettingForm>) {
  /**
   * シリアル接続
   */
  async function startNewConnect() {
    // 接続テストでシリアルが接続状態になっている場合があるので、一度クローズする
    await ApiSirial.close();

    // 一旦、古い監視を終了させてから、新しい監視を開始する
    await ApiAntennaTracking.stopCtrl();

    // ローテータが指定されている場合は、ローテーターの監視を開始する
    const rotConfig = createRotatorConfig();
    if (!CommonUtil.isEmpty(rotConfig.rotatorId)) {
      await ApiAntennaTracking.startCtrl(rotConfig);
    }
  }

  /**
   * AppConfigRotatorを生成する
   */
  function createRotatorConfig() {
    const rotatorConfig = new AppConfigRotator();
    rotatorConfig.port = form.value.port;
    rotatorConfig.baudrateBps = form.value.borate;
    rotatorConfig.makerId = form.value.makerId;
    rotatorConfig.rotatorId = form.value.rotatorId;
    rotatorConfig.ipAddress = form.value.ipAddress;
    rotatorConfig.ipPort = form.value.ipPort;
    return rotatorConfig;
  }

  return { startNewConnect };
}
