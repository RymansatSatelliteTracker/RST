import { AppConfigSatellite } from "@/common/model/AppConfigModel";
import EditSatelliteInfoForm from "@/renderer/components/organisms/setting/SatelliteSetting/DisplaySatellite/EditSatelliteInfo/EditSatelliteInfoForm";
/**
 * 衛星情報編集画面関係のフック
 */
export default function useEditSatelliteInfo() {
  /**
   * 画面フォームの構造に変換する
   * @param targetForm
   * @param srcObj
   */
  function transformToForm(targetForm: EditSatelliteInfoForm, srcObj: any) {
    targetForm.satelliteId = srcObj.satelliteId;
    // 参照用はここでは設定しない
    // デフォルト衛星の場合はsatelliteName
    targetForm.editSatelliteName = srcObj.userRegisteredSatelliteName ?? srcObj.satelliteName;
    targetForm.noradId = srcObj.noradId;
    targetForm.autoModeUplinkFreq = (srcObj.autoModeUplinkFreq ?? 1).toString();
    targetForm.uplink1Mhz = srcObj.uplink1.uplinkMhz;
    targetForm.uplink1Mode = srcObj.uplink1.uplinkMode;
    targetForm.uplink2Mhz = srcObj.uplink2.uplinkMhz;
    targetForm.uplink2Mode = srcObj.uplink2.uplinkMode;
    targetForm.autoModeDownlinkFreq = (srcObj.autoModeDownlinkFreq ?? 1).toString();
    targetForm.downlink1Mhz = srcObj.downlink1.downlinkMhz;
    targetForm.downlink1Mode = srcObj.downlink1.downlinkMode;
    targetForm.downlink2Mhz = srcObj.downlink2.downlinkMhz;
    targetForm.downlink2Mode = srcObj.downlink2.downlinkMode;
    targetForm.toneMhz = srcObj.toneMhz;
    targetForm.outline = srcObj.outline;
  }
  /**
   * アプリケーション設定の構造に変換する
   * @param targetAppConfig
   * @param srcForm
   */
  function transformToAppConfig(targetAppConfig: AppConfigSatellite, srcForm: EditSatelliteInfoForm) {
    targetAppConfig.satelliteId = srcForm.satelliteId;
    targetAppConfig.userRegisteredSatelliteName = srcForm.editSatelliteName;
    targetAppConfig.noradId = srcForm.noradId;
    targetAppConfig.autoModeUplinkFreq = parseInt(srcForm.autoModeUplinkFreq);
    targetAppConfig.uplink1.uplinkMhz = srcForm.uplink1Mhz ? srcForm.uplink1Mhz : null;
    targetAppConfig.uplink1.uplinkMode = srcForm.uplink1Mode;
    targetAppConfig.uplink2.uplinkMhz = srcForm.uplink2Mhz ? srcForm.uplink2Mhz : null;
    targetAppConfig.uplink2.uplinkMode = srcForm.uplink2Mode;
    targetAppConfig.autoModeDownlinkFreq = parseInt(srcForm.autoModeDownlinkFreq);
    targetAppConfig.downlink1.downlinkMhz = srcForm.downlink1Mhz ? srcForm.downlink1Mhz : null;
    targetAppConfig.downlink1.downlinkMode = srcForm.downlink1Mode;
    targetAppConfig.downlink2.downlinkMhz = srcForm.downlink2Mhz ? srcForm.downlink2Mhz : null;
    targetAppConfig.downlink2.downlinkMode = srcForm.downlink2Mode;
    targetAppConfig.toneMhz = srcForm.toneMhz ? srcForm.toneMhz : null;
    targetAppConfig.outline = srcForm.outline;
  }

  return { transformToForm, transformToAppConfig };
}
