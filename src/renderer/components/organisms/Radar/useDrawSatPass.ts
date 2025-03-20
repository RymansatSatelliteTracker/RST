import Constant from "@/common/Constant";
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

  onMounted(async () => {
    // 初期表示時のアクティブ衛星でパスを更新
    await onChangeSatGrp();

    // 表示中の衛星グループが変更された場合のコールバックを設定
    ActiveSatServiceHub.getInstance().addOnChangeActiveSat(onChangeSatGrp);
  });

  // currentDateが変更された場合は軌道を更新
  watch(currentDate, async () => {
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

    // 人工衛星のAOSリストを取得する
    const passes = await groundStationService.getOrbitPassListAsync(
      currentDate.value,
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

    // 現在表示中のAOSと同じ場合は再描画しない
    if (!needRefresh(currentAosDate, pass.aos.date)) {
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

    // 描画した際のAOS日時を保持
    currentAosDate = pass.aos.date;
  }

  /**
   * 表示中のAOS日時と引数のAOS日時が異なるか
   */
  function needRefresh(currentAosDate: Date, aosDate: Date) {
    const tmpCurTime = Math.trunc(currentAosDate.getTime() / 1000);
    const tmpAosTime = Math.trunc(aosDate.getTime() / 1000);

    return tmpCurTime !== tmpAosTime;
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
