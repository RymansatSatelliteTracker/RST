import { onMounted, Ref } from "vue";

/**
 * 位置情報（センター）
 */
type CenterPosition = {
  x: number;
  y: number;
};

/**
 * レーダ部を描画するフック
 * @param canvasRef コンポーネントのCanvas要素（のref）
 * @param radiusPx レーダの半径（px）
 * @param centerPos レーダの中心位置
 */
export default function useDrawRadar(
  canvasRef: Ref<HTMLCanvasElement | null>,
  radiusPx: number,
  centerPos: CenterPosition
) {
  onMounted(async () => {
    const element = canvasRef.value;
    const context = element ? element.getContext("2d") : null;
    if (!context) return;

    // レーダ描画
    drawViewLayout(context, centerPos, radiusPx);
  });
}

/**
 * レーダを描画する
 */
function drawViewLayout(context: CanvasRenderingContext2D, center: CenterPosition, radius: number) {
  const backgroundColor = "rgba(24, 52, 68, 0.6)";
  const lineColor = "rgba(255, 255, 255, 1)";

  context.beginPath();
  context.clearRect(0, 0, 300, 300);
  context.fillStyle = backgroundColor;
  context.arc(center.x, center.y, radius, 0, Math.PI * 2);
  context.fill();
  context.stroke();

  // Elevation 60度
  context.beginPath();
  context.arc(center.x, center.y, (radius * 1) / 3, 0, Math.PI * 2);
  context.strokeStyle = lineColor;
  context.stroke();

  // Elevation 30度
  context.beginPath();
  context.arc(center.x, center.y, (radius * 2) / 3, 0, Math.PI * 2);
  context.strokeStyle = lineColor;
  context.stroke();

  // Elevation 0度
  // Memo: (半径-1)として、canvasのview外になることを防ぐ
  context.beginPath();
  context.arc(center.x, center.y, radius - 1, 0, Math.PI * 2);
  context.strokeStyle = lineColor;
  context.stroke();

  // Horizonal Line
  context.beginPath();
  context.moveTo(0, center.y);
  context.lineTo(radius * 2, center.y);
  context.strokeStyle = lineColor;
  context.stroke();

  // Vertical Line
  context.beginPath();
  context.moveTo(center.x, 0);
  context.lineTo(center.x, radius * 2);
  context.strokeStyle = lineColor;
  context.stroke();
}
