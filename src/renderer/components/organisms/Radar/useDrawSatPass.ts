import Constant from "@/common/Constant";
import { ActiveSatelliteGroupModel } from "@/common/model/ActiveSatModel";
import ApiActiveSat from "@/renderer/api/ApiActiveSat";
import ApiAppConfig from "@/renderer/api/ApiAppConfig";
import AutoTrackingHelper from "@/renderer/common/util/AutoTrackingHelper";
import GroundStationHelper from "@/renderer/common/util/GroundStationHelper";
import ActiveSatServiceHub from "@/renderer/service/ActiveSatServiceHub";
import { SatAzEl } from "@/renderer/types/satellite-type";
import CanvasUtil from "@/renderer/util/CanvasUtil";
import { onMounted, Ref, watch } from "vue";

type CenterPosition = {
  x: number;
  y: number;
};

// 線の描画間隔（秒）
const DRAW_INTERVAL_SEC = 20;

/**
 * 衛星のパスの描画フック
 * @param canvasRef 画面のCanvas要素（のref）
 * @param radiusPx レーダの半径（px）
 * @param center レーダの中心
 * @param tracking トラッキングデータ
 */
export default function useDrawSatPass(
  canvasRef: Ref<HTMLCanvasElement | null>,
  radiusPx: number,
  center: CenterPosition,
  currentDate: Ref<Date>
) {
  // 現在描画中のAOS日時
  let currentAosDate = new Date(0);
  // 現在描画中の衛星グループ
  let currentSatGrpId = -1;
  // 現在描画中の衛星
  let currentActiveSatIndex = -1;

  // 最終更新日時（レーダー更新頻度の間引き用）
  let lastUpdateDate = new Date(0);

  onMounted(async () => {
    // 初期表示時のアクティブ衛星でパスを更新
    await onChangeSatGrp();

    // 表示中の衛星グループが変更された場合のコールバックを設定
    ActiveSatServiceHub.getInstance().addOnChangeActiveSat(onChangeSatGrp);
  });

  // currentDateが変更された場合は軌道を更新
  watch(currentDate, async () => {
    // 前回実行から１秒経過している場合に処理を実行する
    // MEMO: currentDateは0.1秒間隔で更新されるため、本コンポーネントでは間引き処理を行う
    const now = currentDate.value;
    if (now.getTime() - lastUpdateDate.getTime() < 1000) {
      return;
    }
    lastUpdateDate = now;

    // レーダ内の軌道予測の線を更新
    await updatePass();
  });

  /**
   * 表示中の衛星グループが変更された場合のイベントハンドラ
   */
  async function onChangeSatGrp() {
    await updatePass();
  }

  /**
   * レーダ内の軌道予測の線を更新する
   */
  async function updatePass() {
    const element = canvasRef.value;
    if (!element) {
      return;
    }
    const context = element.getContext("2d");
    if (!context) {
      return;
    }

    // 次の（または現在の）AOS/LOSを取得
    const groundStationService = ActiveSatServiceHub.getInstance().getGroundStationService();
    if (!groundStationService) {
      return;
    }

    // 現在の基準日時を元に、追尾開始・終了時間を加味した基準日時を取得する
    // memo: 素の基準日時を渡すと、LOS後に次のパスが取れてしまうため（余白的な追尾が出来ないため）
    //       追尾開始・終了時間を加味した基準日時を元にパスを取得する
    const appConfig = await ApiAppConfig.getAppConfig();
    const baseDate = AutoTrackingHelper.getOffsetBaseDate(appConfig, currentDate.value);

    // 人工衛星のAOSリストを取得する
    const passes = await groundStationService.getOrbitPassListAsync(
      baseDate,
      new Date(currentDate.value.getTime() + Constant.Time.MILLISECONDS_IN_DAY)
    );
    if (!passes || passes.length === 0) {
      clearPass();
      return;
    }

    // 直近のAOSを対象とする
    const pass = passes[0];
    if (!pass.aos || !pass.los) {
      clearPass();
      return;
    }

    // レーダーの更新が必要か判定する
    // 現在の衛星グループとアクティブ衛星
    const satGrp = await ApiActiveSat.getActiveSatelliteGroup();
    const activeSatIndex = ActiveSatServiceHub.getInstance().getActiveSatIndex();
    if (!(await needRefresh(currentAosDate, pass.aos.date, satGrp, activeSatIndex))) {
      return;
    }

    // 現在の軌道をクリア
    clearPass();

    // サービスの取得
    const satService = ActiveSatServiceHub.getInstance().getSatService();
    if (!satService) {
      return;
    }
    const groundStationLocation = await GroundStationHelper.getEcefLocation();

    // 軌道の色
    const lineColor = getSatColor();

    // 可視期間の秒数を取得
    const secRange = Math.trunc((pass.los.date.getTime() - pass.aos.date.getTime()) / 1000);

    // 可視期間の秒数で回す
    for (let ii = 0; ii < secRange; ii += DRAW_INTERVAL_SEC) {
      // 描画間隔（秒）の頭とお尻の衛星位置を取得
      const baseDate = pass.aos.date.getTime() + ii * 1000;
      const startDate = new Date(baseDate);
      const endDate = new Date(baseDate + DRAW_INTERVAL_SEC * 1000);

      const start: SatAzEl = {
        az: satService.getSatelliteAzimuthAngle(startDate, groundStationLocation) ?? 0,
        el: satService.getSatelliteElevationAngle(startDate, groundStationLocation) ?? 0,
      };
      const end: SatAzEl = {
        az: satService.getSatelliteAzimuthAngle(endDate, groundStationLocation) ?? 0,
        el: satService.getSatelliteElevationAngle(endDate, groundStationLocation) ?? 0,
      };

      // レーダからはみ出す0度未満の場合は描画しない
      if (start.el < 0 || end.el < 0) {
        continue;
      }

      // 描画
      CanvasUtil.drawLineToTrackingCanvas(context, center, radiusPx, start, end, {
        strokeStyle: lineColor,
        lineWidth: 2,
      });
    }

    // 描画した際のAOS日時、衛星グループなどを保持
    currentAosDate = pass.aos.date;
    currentSatGrpId = satGrp.activeSatelliteGroupId;
    currentActiveSatIndex = activeSatIndex;
  }

  /**
   * レーダーの更新が必要か判定する
   * @returns: 以下条件に合致する場合にtrueを返す
   *  ・表示中のAOS日時と引数のAOS日時が異なる場合
   *  ・衛星グループが変更されている場合
   *  ・アクティブ衛星が変更されている場合
   */
  async function needRefresh(
    currentAosDate: Date,
    aosDate: Date,
    satGrp: ActiveSatelliteGroupModel,
    activeSatIndex: number
  ): Promise<boolean> {
    // 表示中のAOS日時と引数のAOS日時が異なる場合は更新要
    const tmpCurTime = Math.trunc(currentAosDate.getTime() / 1000);
    const tmpAosTime = Math.trunc(aosDate.getTime() / 1000);
    if (tmpCurTime !== tmpAosTime) {
      return true;
    }

    // 衛星グループが変更されている場合は更新要
    if (currentSatGrpId !== satGrp.activeSatelliteGroupId) {
      return true;
    }

    // アクティブ衛星が変更されている場合は更新要
    if (currentActiveSatIndex !== activeSatIndex) {
      return true;
    }

    return false;
  }

  /**
   * レーダ内の軌道予測の線をクリアする
   */
  function clearPass() {
    const element = canvasRef.value;
    const context = element ? element.getContext("2d") : null;
    if (!context) return;
    context.clearRect(0, 0, 300, 300);
  }

  /**
   * 衛星の色を取得する
   */
  function getSatColor() {
    const activeSatIndex = ActiveSatServiceHub.getInstance().getActiveSatIndex();
    return CanvasUtil.getSatelliteColorCode(activeSatIndex) + "80";
  }

  return {};
}
