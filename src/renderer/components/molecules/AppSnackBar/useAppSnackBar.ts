import Constant from "@/common/Constant";
import emitter from "@/renderer/util/EventBus";
import { onMounted, ref } from "vue";

/**
 * スナックバーのフック
 */
export const useAppSnackBar = () => {
  // 表示する／しない
  const isSnackBarActive = ref(false);
  // 背景色、文字色
  const color = ref("");
  // メッセージ
  const text = ref("");

  onMounted(() => {
    // Infoメッセージのイベント受信時
    emitter.on(Constant.GlobalEvent.NOTICE_INFO, (msg) => {
      color.value = "blue-darken-3";
      text.value = msg;
      isSnackBarActive.value = true;
    });

    // Errorメッセージのイベント受信時
    emitter.on(Constant.GlobalEvent.NOTICE_ERR, (msg) => {
      color.value = "red-lighten-1";
      text.value = msg;
      isSnackBarActive.value = true;
    });
  });

  /**
   * クローズ
   */
  function close() {
    isSnackBarActive.value = false;
  }

  return {
    isShow: isSnackBarActive,
    close,
    color,
    text,
  };
};
