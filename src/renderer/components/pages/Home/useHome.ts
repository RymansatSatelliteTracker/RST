import Constant from "@/common/Constant.js";
import type { OmmItem } from "@/common/model/OmmModel.js";
import ApiAntennaTracking from "@/renderer/api/ApiAntennaTracking.js";
import ApiAppConfig from "@/renderer/api/ApiAppConfig.js";
import ApiTransceiver from "@/renderer/api/ApiTransceiver.js";
import ActiveSatHelper from "@/renderer/common/util/ActiveSatHelper.js";
import I18nUtil from "@/renderer/common/util/I18nUtil.js";
import ActiveSatServiceHub from "@/renderer/service/ActiveSatServiceHub.js";
import emitter from "@/renderer/util/EventBus.js";
import { ref } from "vue";

/**
 * 人工衛星のOMM配列を取得する
 * @returns {{ ommItems; index; }} OMM配列
 */
const useHome = () => {
  // OMM配列
  const ommItems = ref<OmmItem[]>([]);
  // アクティブなOMMの添字
  const selectedAciveSatIndex = ref<number>(0);

  /**
   * 初期化処理
   */
  async function init() {
    // アクティブ衛星サービスハブを起動
    await ActiveSatServiceHub.getInstance().start();

    // 表示中の衛星グループが変更された場合のコールバックを設定
    ActiveSatServiceHub.getInstance().addOnChangeActiveSat(onChangeSatGrp);

    // 現在のアクティブ衛星IDを元にOMMリストを更新する
    await refreshOmms();

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
    // 現在のアクティブ衛星IDを元にOMMリストを更新する
    await refreshOmms();
  }

  /**
   * OMMリストを更新する
   */
  async function refreshOmms() {
    // 現在のアクティブ衛星IDを取得する
    const appConfig = await ApiAppConfig.getAppConfig();
    const activeSatId = appConfig.mainDisplay.activeSatelliteId;

    // レンダラ全体で参照されるOMMリストを初期化する
    // 現在の衛星グループの衛星リストを取得する
    const sats = await ActiveSatHelper.fetchActiveSats();
    // 衛星リストのOMMをommItemsリストに追加する
    for (let ii = 0; ii < sats.length; ii++) {
      const sat = sats[ii];
      // OMMがない衛星はスキップ
      if (!sat.omm) {
        continue;
      }

      ommItems.value.push(sat.omm);

      // TODO レンダラ全体が衛星IDで管理されるようになったら、削除する
      if (sat.satelliteId === activeSatId) {
        selectedAciveSatIndex.value = ii;
      }
    }
  }

  return { init, ommItems, selectedAciveSatIndex };
};

export default useHome;
