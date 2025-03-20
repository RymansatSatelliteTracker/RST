import Constant from "@/common/Constant";
import ApiAntennaTracking from "@/renderer/api/ApiAntennaTracking";
import ApiAppConfig from "@/renderer/api/ApiAppConfig";
import ApiTransceiver from "@/renderer/api/ApiTransceiver";
import ActiveSatHelper from "@/renderer/common/util/ActiveSatHelper";
import I18nUtil from "@/renderer/common/util/I18nUtil";
import ActiveSatServiceHub from "@/renderer/service/ActiveSatServiceHub";
import type { TleStrings } from "@/renderer/types/satellite-type";
import emitter from "@/renderer/util/EventBus";
import { ref } from "vue";

/**
 * 人工衛星のTLE文字列配列を取得する
 * @returns {{ tleStrings; index; }} TLE文字列配列
 */
const useHome = () => {
  // TLE文字列配列
  const tleStrings = ref<TleStrings[]>([]);
  // アクティブなTLE文字列の添字
  const selectedAciveSatIndex = ref<number>(0);

  /**
   * 初期化処理
   */
  async function init() {
    // アクティブ衛星サービスハブを起動
    await ActiveSatServiceHub.getInstance().start();

    // 表示中の衛星グループが変更された場合のコールバックを設定
    ActiveSatServiceHub.getInstance().addOnChangeActiveSat(onChangeSatGrp);

    // 現在のアクティブ衛星IDを元にTLEリストを更新する
    refreshTles();

    // ローテータの監視を開始する
    const apiRotatorRes = await ApiAntennaTracking.startCtrl();
    if (!apiRotatorRes.status) {
      emitter.emit(Constant.GlobalEvent.NOTICE_ERR, I18nUtil.getMsg(apiRotatorRes.message));
    }
    // 無線機の監視を開始する
    const apiTransceiverRes = await ApiTransceiver.startCtrl();
    if (!apiTransceiverRes.status) {
      emitter.emit(Constant.GlobalEvent.NOTICE_ERR, I18nUtil.getMsg(apiTransceiverRes.message));
    }
  }

  /**
   * 表示中の衛星グループが変更された場合のイベントハンドラ
   */
  async function onChangeSatGrp() {
    // 現在のアクティブ衛星IDを元にTLEリストを更新する
    refreshTles();
  }

  /**
   * TLEリストを更新する
   */
  async function refreshTles() {
    // 現在のアクティブ衛星IDを取得する
    const appConfig = await ApiAppConfig.getAppConfig();
    const activeSatId = appConfig.mainDisplay.activeSatelliteId;

    // レンダラ全体で参照されるTLEリストを初期化する
    // 現在の衛星グループの衛星リストを取得する
    const sats = await ActiveSatHelper.fetchActiveSats();
    // 衛星リストのTLEをtleStringリストに追加する
    for (let ii = 0; ii < sats.length; ii++) {
      const sat = sats[ii];
      // TLEがない衛星はスキップ
      if (!sat.tle) {
        continue;
      }

      tleStrings.value.push(sat.tle);

      // TODO レンダラ全体が衛星IDで管理されるようになったら、削除する
      if (sat.satelliteId === activeSatId) {
        selectedAciveSatIndex.value = ii;
      }
    }
  }

  return { init, tleStrings, selectedAciveSatIndex };
};

export default useHome;
