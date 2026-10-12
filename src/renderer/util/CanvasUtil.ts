import CommonUtil from "@/common/CommonUtil.js";
import I18nMsgs from "@/common/I18nMsgs.js";
import I18nUtil from "@/renderer/common/util/I18nUtil.js";
import type { SatAzEl } from "@/renderer/types/satellite-type.js";

type CanvasStyle = {
  strokeStyle: string;
  lineWidth: number;
};

/**
 * 中心位置
 */
export type CenterPosition = {
  x: number;
  y: number;
};

/**
 * 描画関係のユーティリティ
 * @class CanvasUtil
 */
class CanvasUtil {
  /**
   * レーダー向けの極座標系のAzimuth, Elevationを直行座標系に変換する
   * レーダーのTrackingViewに描画する目的の関数であるため、通常の座標系とは異なるので注意
   * @param radius レーダーの半径
   */
  public static polar2Cartesian(azimuth: number, elevation: number, radius: number) {
    const radian = (azimuth - 90) * (Math.PI / 180);
    const r = radius - (elevation / 90) * radius;
    const x = r * Math.cos(radian);
    const y = r * Math.sin(radian);
    return { x, y };
  }

  public static drawLineToTrackingCanvas(
    context: CanvasRenderingContext2D,
    center: CenterPosition,
    radius: number,
    start: SatAzEl,
    end: SatAzEl,
    style: CanvasStyle
  ) {
    context.beginPath();
    const startCartesian = this.polar2Cartesian(start.az, start.el, radius);
    const endCartesian = this.polar2Cartesian(end.az, end.el, radius);

    context.moveTo(center.x + startCartesian.x, center.y + startCartesian.y);
    context.lineTo(center.x + endCartesian.x, center.y + endCartesian.y);
    context.strokeStyle = style.strokeStyle;
    context.lineWidth = style.lineWidth;
    context.stroke();
  }

  /**
   * 人工衛星の色コードを取得する
   * @param {number} index ユニークID(0～9)
   * @returns {string} 色コード
   */
  public static getSatelliteColorCode = (index: number): string => {
    // 人工衛星の色コードの配列
    const colorCodes = [
      "#00FF00", // 緑
      "#0077ff", // 青
      "#FFA500", // オレンジ
      "#FF0000", // 赤
      "#800080", // 紫
      "#A52A2A", // 茶色
      "#FF80C0", // ピンク
      "#808080", // 灰色
      "#FFFF00", // 黄
      "#00FFFF", // 水色
    ];

    // 0～9の範囲に対応する色コードを返却する
    return colorCodes[index % 10];
  };

  /**
   * 角度を単位付き文字列に変換する
   * @param {number} angle 角度
   * @returns {string} 角度の文字列
   */
  public static formatAngle(angle: number | undefined): string {
    return angle ? angle.toFixed(1) + "°" : I18nUtil.getMsg(I18nMsgs.GCOM_NA);
  }

  /**
   * 文字列がブランクの場合に"―"を返却する
   * @param {string | null | undefined} value 文字列
   * @returns {string} 文字列
   */
  public static formatNullValue(value: string | null | undefined): string {
    if (!CommonUtil.isEmpty(value)) {
      return value as string;
    } else {
      return I18nUtil.getMsg(I18nMsgs.GCOM_NA);
    }
  }

  /**
   * 人工衛星の日照状態の文字列を取得する
   * @param {number | null | undefined} aosShadowFraction AOS時の日照状態
   * @param {number | null | undefined} losShadowFraction LOS時の日照状態
   * @returns {string} 文字列
   */
  public static getIlluminationState = (
    aosShadowFraction: number | null | undefined,
    losShadowFraction: number | null | undefined
  ): string => {
    if (aosShadowFraction == null || losShadowFraction == null) {
      return I18nUtil.getMsg(I18nMsgs.GCOM_NA);
    }

    const sunlit = I18nUtil.getMsg(I18nMsgs.G31_ILLUMINATION_SUNLIT);
    const umbra = I18nUtil.getMsg(I18nMsgs.G31_ILLUMINATION_UMBRA);

    // 0: 人工衛星が完全に日光を受けている状態
    // 0以外: 人工衛星が地球の影に入っている状態
    const aosState = aosShadowFraction === 0 ? sunlit : umbra;
    const losState = losShadowFraction === 0 ? sunlit : umbra;

    if (aosState === losState) {
      return aosState;
    }

    return `${aosState} -> ${losState}`;
  };
}

export default CanvasUtil;
