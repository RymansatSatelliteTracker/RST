import { RotatorAzEl } from "@/renderer/types/satellite-type";
import { CenterPosition } from "@/renderer/util/CanvasUtil";
import { Ref, watch } from "vue";

/**
 * 現在のアンテナ位置をレーダ部に描画する
 * @param canvasCtx canvas
 * @param radarCenter レーダ部の中心
 * @param radarRadius レーダ部の半径
 * @param azimuth 方位
 * @param elevation 仰角
 */
function drawArcToTrackingCanvas(
  canvasCtx: CanvasRenderingContext2D,
  radarCenter: CenterPosition,
  radarRadius: number,
  azimuth: number,
  elevation: number
) {
  canvasCtx.clearRect(0, 0, 300, 300);
  canvasCtx.beginPath();
  canvasCtx.moveTo(radarCenter.x, radarCenter.y);

  const r = radarRadius - (elevation / 90) * radarRadius;
  if (r > 0) {
    canvasCtx.arc(
      radarCenter.x,
      radarCenter.y,
      radarRadius - (elevation / 90) * radarRadius,
      ((azimuth - 90 - 5) * Math.PI) / 180,
      ((azimuth - 90 + 5) * Math.PI) / 180,
      false
    );
  } else {
    // rが負の値になる場合は仰角が90度以上であるため、
    // 1. rの絶対値をとる(Elevation=160の場合、「-40 = 90 - 160」 -> 40)
    // 2. Elevationが裏向きになるため、Azimuthを180度足す
    canvasCtx.arc(
      radarCenter.x,
      radarCenter.y,
      Math.abs(radarRadius - (elevation / 90) * radarRadius),
      ((azimuth - 90 - 5 + 180) * Math.PI) / 180,
      ((azimuth - 90 + 5 + 180) * Math.PI) / 180,
      false
    );
  }

  canvasCtx.fillStyle = "rgba(242,242,242,0.4)";
  canvasCtx.fill();
}

/**
 * アンテナ位置を監視し、レーダ部に描画する
 * @param canvasRef 描画先のcanvas
 * @param radarRadius レーダ部の半径
 * @param radarCenter レーダ部の中心
 * @param position アンテナ位置
 * @returns
 */
function useDrawAntennaPosition(
  canvasRef: Ref<HTMLCanvasElement | null>,
  radarRadius: number,
  radarCenter: CenterPosition,
  position: Ref<RotatorAzEl | undefined>
) {
  watch(position, () => {
    const canvasElem = canvasRef.value;
    const context = canvasElem ? canvasElem.getContext("2d") : null;
    if (!context || !position.value) return;

    const { az, el } = position.value;
    drawArcToTrackingCanvas(context, radarCenter, radarRadius, az, el);
  });
}

export default useDrawAntennaPosition;
