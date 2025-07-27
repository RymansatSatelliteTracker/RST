import Constant from "@/common/Constant";
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
    targetForm.uplink1Mhz = srcObj.uplink1.uplinkHz ? srcObj.uplink1.uplinkHz / Constant.Unit.Mega : null;
    targetForm.uplink1Mode = srcObj.uplink1.uplinkMode;
    targetForm.uplink2Mhz = srcObj.uplink2.uplinkHz ? srcObj.uplink2.uplinkHz / Constant.Unit.Mega : null;
    targetForm.uplink2Mode = srcObj.uplink2.uplinkMode;
    targetForm.uplink3Mhz = srcObj.uplink3.uplinkHz ? srcObj.uplink3.uplinkHz / Constant.Unit.Mega : null;
    targetForm.uplink3Mode = srcObj.uplink3.uplinkMode;
    targetForm.downlink1Mhz = srcObj.downlink1.downlinkHz ? srcObj.downlink1.downlinkHz / Constant.Unit.Mega : null;
    targetForm.downlink1Mode = srcObj.downlink1.downlinkMode;
    targetForm.downlink2Mhz = srcObj.downlink2.downlinkHz ? srcObj.downlink2.downlinkHz / Constant.Unit.Mega : null;
    targetForm.downlink2Mode = srcObj.downlink2.downlinkMode;
    targetForm.downlink3Mhz = srcObj.downlink3.downlinkHz ? srcObj.downlink3.downlinkHz / Constant.Unit.Mega : null;
    targetForm.downlink3Mode = srcObj.downlink3.downlinkMode;
    targetForm.beaconMhz = srcObj.beacon.beaconHz ? srcObj.beacon.beaconHz / Constant.Unit.Mega : null;
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
    targetAppConfig.uplink1.uplinkHz = srcForm.uplink1Mhz ? srcForm.uplink1Mhz * Constant.Unit.Mega : null;
    targetAppConfig.uplink1.uplinkMode = srcForm.uplink1Mode;
    targetAppConfig.uplink2.uplinkHz = srcForm.uplink2Mhz ? srcForm.uplink2Mhz * Constant.Unit.Mega : null;
    targetAppConfig.uplink2.uplinkMode = srcForm.uplink2Mode;
    targetAppConfig.uplink3.uplinkHz = srcForm.uplink3Mhz ? srcForm.uplink3Mhz * Constant.Unit.Mega : null;
    targetAppConfig.uplink3.uplinkMode = srcForm.uplink3Mode;
    targetAppConfig.autoModeDownlinkFreq = parseInt(srcForm.autoModeDownlinkFreq);
    targetAppConfig.downlink1.downlinkHz = srcForm.downlink1Mhz ? srcForm.downlink1Mhz * Constant.Unit.Mega : null;
    targetAppConfig.downlink1.downlinkMode = srcForm.downlink1Mode;
    targetAppConfig.downlink2.downlinkHz = srcForm.downlink2Mhz ? srcForm.downlink2Mhz * Constant.Unit.Mega : null;
    targetAppConfig.downlink2.downlinkMode = srcForm.downlink2Mode;
    targetAppConfig.downlink3.downlinkHz = srcForm.downlink3Mhz ? srcForm.downlink3Mhz * Constant.Unit.Mega : null;
    targetAppConfig.downlink3.downlinkMode = srcForm.downlink3Mode;
    targetAppConfig.downlink3.downlinkHz = srcForm.downlink3Mhz ? srcForm.downlink3Mhz * Constant.Unit.Mega : null;
    targetAppConfig.downlink3.downlinkMode = srcForm.downlink3Mode;
    targetAppConfig.beacon.beaconHz = srcForm.beaconMhz ? srcForm.beaconMhz * Constant.Unit.Mega : null;
    targetAppConfig.beacon.beaconMode = srcForm.beaconMode;
    targetAppConfig.enableSatelliteMode = srcForm.enableSatelliteMode;
    targetAppConfig.satelliteMode = srcForm.satelliteMode;
    targetAppConfig.toneHz = srcForm.toneHz ? srcForm.toneHz : null;
    targetAppConfig.outline = srcForm.outline;
  }

  return { transformAppConfigToForm, transformDefSatToForm, transformFormToAppConfig };
}
