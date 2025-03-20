import { StringMap } from "@/common/types/types";
import ApiActiveSat from "@/renderer/api/ApiActiveSat";
import ActiveSatServiceHub from "@/renderer/service/ActiveSatServiceHub";
import CanvasUtil from "@/renderer/util/CanvasUtil";
import { LPolyline } from "@vue-leaflet/vue-leaflet";
import "leaflet-arrowheads";
import { onMounted, onUnmounted, ref, watch, type Ref } from "vue";

// 矢印のサイズ定義
const arrowSizeMap: StringMap<string> = {
  0: "5px",
  1: "8px",
  2: "8px",
  3: "10px",
  4: "10px",
  5: "10px",
  6: "12px",
  7: "12px",
  8: "12px",
};

// 矢印の表示間隔定義
const arrowFreqMap: StringMap<string> = {
  0: "endonly",
  1: "endonly",
  2: "200px",
  3: "300px",
  4: "400px",
  5: "400px",
  6: "500px",
  7: "600px",
  8: "600px",
};

// 軌道の更新間隔
const ORBIT_UPDATE_INTERVAL = 10000;

/**
 * 人工衛星の軌道を取得する
 * @param {Ref<Date>} currentDate 現在日時
 * @param {Ref<string>} colorCode 軌道の色
 * @returns {*} 人工衛星の軌道
 */
export default function useOrbitLineList(
  currentDate: Ref<Date>,
  colorCode: Ref<string>,
  refPolylineNormal: Ref<typeof LPolyline | undefined>,
  refPolylineDash: Ref<typeof LPolyline | undefined>,
  zoomLevel: Ref<number>
) {
  const orbitLineList = ref<[number, number][][]>([[]]);
  const orbitDashLineList = ref<[number, number][][]>([[]]);
  // アクティブ衛星のNoradID
  const activeSatNoradId = ref("");

  // 制御系
  // 軌道更新中か？
  let updating = false;
  let intervalId: number;

  /**
   * 表示中の衛星グループが変更された場合のイベントハンドラ
   */
  async function onChangeSatGrp() {
    // 更新された衛星グループ情報を取得
    const satGrp = await ApiActiveSat.getActiveSatelliteGroup();
    if (!satGrp || !satGrp.mainSattelliteTle) {
      orbitLineList.value = [[]];
      orbitDashLineList.value = [[]];
      return;
    }

    // アクティブ衛星のインデックスを更新
    const activeSatIndex = ActiveSatServiceHub.getInstance().getActiveSatIndex();

    // 軌道の色
    // memo: このタイミング（軌道の更新前）に行わないと、１回前の古い衛星Indexの色で描画されてしまう
    colorCode.value = CanvasUtil.getSatelliteColorCode(activeSatIndex);
    // さらに強制的にstyle指定を行わないと色が反映されないことがある
    refPolylineNormal.value!.leafletObject.setStyle({ color: colorCode.value });
    refPolylineDash.value!.leafletObject.setStyle({ color: colorCode.value });

    // 軌道を更新
    await updateOrbit();
  }

  /**
   * 軌道を更新する
   */
  async function updateOrbit() {
    const satelliteService = ActiveSatServiceHub.getInstance().getSatService();
    const orbitLineService = ActiveSatServiceHub.getInstance().getOrbitLineService();
    if (!satelliteService || !orbitLineService) {
      orbitLineList.value = [[]];
      orbitDashLineList.value = [[]];
      return;
    }

    // アクティブ衛星のNoradIDを取得する
    activeSatNoradId.value = satelliteService.getNoradId();

    // 人工衛星の軌道配列を取得する
    const tempOrbitLineList = await orbitLineService.getOrbitLineListAsync(currentDate.value);
    if (
      !tempOrbitLineList ||
      (tempOrbitLineList.resultOrbitLine.length === 0 && tempOrbitLineList.resultOrbitDashLine.length === 0)
    ) {
      orbitLineList.value = [[]];
      orbitDashLineList.value = [[]];
      return;
    }

    orbitLineList.value = tempOrbitLineList.resultOrbitLine;
    orbitDashLineList.value = tempOrbitLineList.resultOrbitDashLine;

    // 矢印を有効化する
    applyArrow(refPolylineNormal.value);
    applyArrow(refPolylineDash.value);
  }

  /**
   * 軌道の向きを示す矢印を有効化する
   * @param targetEef LPolylineのref
   *                  leafletObjectの参照で ts-plugin(2339) が発生するため、anyとしている。。
   */
  function applyArrow(targetEef: any) {
    if (!targetEef || !targetEef.leafletObject) {
      return;
    }

    targetEef.leafletObject.arrowheads({
      // ズームレベルによって矢印のサイズ、表示間隔を変動させる
      size: getArrowSize(zoomLevel.value),
      frequency: getArrowFreq(zoomLevel.value),
      fill: true,
    });
  }

  /**
   * ズームレベルに応じた矢印のサイズを返す
   */
  function getArrowSize(zoomLevel: number) {
    if (zoomLevel in arrowSizeMap) {
      return arrowSizeMap[zoomLevel];
    }

    // arrowSizeMapに定義がない場合は固定値を返す
    return "10px";
  }

  /**
   * ズームレベルに応じた矢印の表示間隔を返す
   */
  function getArrowFreq(zoomLevel: number) {
    if (zoomLevel in arrowFreqMap) {
      return arrowFreqMap[zoomLevel];
    }

    // arrowFreqMapに定義がない場合は固定値を返す
    return "400px";
  }

  onMounted(async () => {
    // 初期表示時の衛星グループで画面を更新
    await onChangeSatGrp();

    // 表示中の衛星グループが変更された場合のコールバックを設定
    ActiveSatServiceHub.getInstance().addOnChangeActiveSat(onChangeSatGrp);

    // 10秒ごとに軌道を更新する
    intervalId = window.setInterval(() => {
      updateOrbit();
    }, ORBIT_UPDATE_INTERVAL) as number;
  });

  /**
   * ズームレベルが変更された場合は矢印の間隔を制御するため、軌道を更新する
   */
  watch(
    () => zoomLevel.value,
    async () => {
      await updateOrbit();
    }
  );

  // currentDateの変更を監視して1500ms以上増減した場合は軌道配列を更新する
  let lastDate = currentDate.value.getTime();
  watch(currentDate, async () => {
    // イベント送信中の場合は処理終了
    // memo: 軌道更新中に再度日時更新のイベントが発生した場合に、非同期で複数の軌道更新処理が発生して落ちるため、更新中は処理をスキップする。
    //       最終的な日時（currentDate）で軌道計算されるため、スキップしても最終イベントの日時で処理されるので、問題はない。
    if (updating) {
      return;
    }

    setTimeout(async () => {
      // 前回の日時とcurrentDateを比較し、1500ms以上経過している場合は軌道配列を更新する
      const newTime = currentDate.value.getTime();
      if (Math.abs(newTime - lastDate) > 1500) {
        await updateOrbit();
      }
      lastDate = newTime;

      updating = false;
    }, 100);

    updating = true;
  });

  // コンポーネントのアンマウント時にタイマーを破棄する
  onUnmounted(() => {
    if (intervalId) {
      clearInterval(intervalId);
    }
  });

  return { orbitLineList, orbitDashLineList, activeSatNoradId };
}
