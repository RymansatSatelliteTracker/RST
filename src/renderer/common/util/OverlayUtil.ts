/**
 * Vuetifyのオーバーレイ（ダイアログ、メニューなど）に関するユーティリティ
 */
export default class OverlayUtil {
  /**
   * キーイベントの発生元のオーバーレイが、最前面（最後に開かれたもの）かを返す
   * 子ダイアログやメニューが開いている場合は、ESCキーなどで親ダイアログを閉じないために用いる。
   * @param event キーイベント
   */
  public static isTopOverlay(event: KeyboardEvent): boolean {
    const self = (event.currentTarget as HTMLElement | null)?.closest(".v-overlay");
    const actives = document.querySelectorAll(".v-overlay--active");
    if (!self || actives.length === 0) {
      return true;
    }
    return actives[actives.length - 1] === self;
  }
}
