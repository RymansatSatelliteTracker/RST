import { AppConfigSatellite } from "@/common/model/AppConfigModel";
import { DefaultSatelliteType } from "@/common/types/satelliteSettingTypes";
import EditSatelliteInfoForm from "@/renderer/components/organisms/setting/SatelliteSetting/DisplaySatellite/EditSatelliteInfo/EditSatelliteInfoForm";
/**
 * 衛星情報編集画面関係のフック
 */
export default function useEditSatelliteInfo() {
  /**
   * 画面フォームの構造に変換する(共通部分)
   * @param targetForm
   * @param srcObj
   */
  function transformToForm(targetForm: EditSatelliteInfoForm, srcObj: AppConfigSatellite | DefaultSatelliteType) {
    // 共通
    targetForm.satelliteId = srcObj.satelliteId;
    // 参照用はここでは設定しない
    targetForm.noradId = srcObj.noradId;
    targetForm.uplink1Hz = srcObj.uplink1.uplinkHz;
    targetForm.uplink1Mode = srcObj.uplink1.uplinkMode;
    targetForm.uplink2Hz = srcObj.uplink2.uplinkHz;
    targetForm.uplink2Mode = srcObj.uplink2.uplinkMode;
    targetForm.uplink3Hz = srcObj.uplink3.uplinkHz;
    targetForm.uplink3Mode = srcObj.uplink3.uplinkMode;
    targetForm.downlink1Hz = srcObj.downlink1.downlinkHz;
    targetForm.downlink1Mode = srcObj.downlink1.downlinkMode;
    targetForm.downlink2Hz = srcObj.downlink2.downlinkHz;
    targetForm.downlink2Mode = srcObj.downlink2.downlinkMode;
    targetForm.downlink3Hz = srcObj.downlink3.downlinkHz;
    targetForm.downlink3Mode = srcObj.downlink3.downlinkMode;
    targetForm.beaconHz = srcObj.beacon.beaconHz;
    targetForm.beaconMode = srcObj.beacon.beaconMode;
    targetForm.toneHz = srcObj.toneHz;
    targetForm.enableSatelliteMode = srcObj.enableSatelliteMode;
    targetForm.satelliteMode = srcObj.satelliteMode;
    targetForm.outline = srcObj.outline;
  }
  /**
   * 画面フォームの構造に変換する(アプリケーション設定用)
   * @param targetForm
   * @param srcObj
   */
  function transformAppConfigToForm(targetForm: EditSatelliteInfoForm, srcObj: AppConfigSatellite) {
    transformToForm(targetForm, srcObj);
    targetForm.editSatelliteName = srcObj.userRegisteredSatelliteName;
    targetForm.autoModeUplinkFreq = (srcObj.autoModeUplinkFreq ?? 1).toString();
    targetForm.autoModeDownlinkFreq = (srcObj.autoModeDownlinkFreq ?? 1).toString();
  }
  /**
   * 画面フォームの構造に変換する(デフォルト衛星定義用)
   * @param targetForm
   * @param srcObj
   */
  function transformDefSatToForm(targetForm: EditSatelliteInfoForm, srcObj: DefaultSatelliteType) {
    transformToForm(targetForm, srcObj);
    targetForm.editSatelliteName = srcObj.satelliteName;
    targetForm.autoModeUplinkFreq = "1";
    targetForm.autoModeDownlinkFreq = "1";
  }
  /**
   * アプリケーション設定の構造に変換する
   * @param targetAppConfig
   * @param srcForm
   */
  function transformFormToAppConfig(targetAppConfig: AppConfigSatellite, srcForm: EditSatelliteInfoForm) {
    targetAppConfig.satelliteId = srcForm.satelliteId;
    targetAppConfig.userRegisteredSatelliteName = srcForm.editSatelliteName;
    targetAppConfig.noradId = srcForm.noradId;
    targetAppConfig.autoModeUplinkFreq = parseInt(srcForm.autoModeUplinkFreq);
    targetAppConfig.uplink1.uplinkHz = srcForm.uplink1Hz ? srcForm.uplink1Hz : null;
    targetAppConfig.uplink1.uplinkMode = srcForm.uplink1Mode;
    targetAppConfig.uplink2.uplinkHz = srcForm.uplink2Hz ? srcForm.uplink2Hz : null;
    targetAppConfig.uplink2.uplinkMode = srcForm.uplink2Mode;
    targetAppConfig.uplink3.uplinkHz = srcForm.uplink3Hz ? srcForm.uplink3Hz : null;
    targetAppConfig.uplink3.uplinkMode = srcForm.uplink3Mode;
    targetAppConfig.autoModeDownlinkFreq = parseInt(srcForm.autoModeDownlinkFreq);
    targetAppConfig.downlink1.downlinkHz = srcForm.downlink1Hz ? srcForm.downlink1Hz : null;
    targetAppConfig.downlink1.downlinkMode = srcForm.downlink1Mode;
    targetAppConfig.downlink2.downlinkHz = srcForm.downlink2Hz ? srcForm.downlink2Hz : null;
    targetAppConfig.downlink2.downlinkMode = srcForm.downlink2Mode;
    targetAppConfig.downlink3.downlinkHz = srcForm.downlink3Hz ? srcForm.downlink3Hz : null;
    targetAppConfig.downlink3.downlinkMode = srcForm.downlink3Mode;
    targetAppConfig.downlink3.downlinkHz = srcForm.downlink3Hz ? srcForm.downlink3Hz : null;
    targetAppConfig.downlink3.downlinkMode = srcForm.downlink3Mode;
    targetAppConfig.beacon.beaconHz = srcForm.beaconHz ? srcForm.beaconHz : null;
    targetAppConfig.beacon.beaconMode = srcForm.beaconMode;
    targetAppConfig.enableSatelliteMode = srcForm.enableSatelliteMode;
    targetAppConfig.satelliteMode = srcForm.satelliteMode;
    targetAppConfig.toneHz = srcForm.toneHz ? srcForm.toneHz : null;
    targetAppConfig.outline = srcForm.outline;
  }

  return { transformAppConfigToForm, transformDefSatToForm, transformFormToAppConfig };
}
