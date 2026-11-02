import type { AppConfigTransceiverDevice } from "@/common/model/AppConfigTransceiverModel.js";
import ApiAppConfig from "@/renderer/api/ApiAppConfig.js";
import AppRendererLogger from "@/renderer/util/AppRendererLogger.js";
import { onMounted, ref } from "vue";

// 現在選択中の無線機の機種定義（無線機が未設定の場合はnull）
// memo: 画面内の全ての運用モードの選択（OpeModeSelect）で共有する。
const currentDevice = ref<AppConfigTransceiverDevice | null>(null);
// 読み込み済みか
let isLoaded = false;
// 読み込み中の処理（複数のOpeModeSelectが同時に読み込みを要求した場合に、1回にまとめる）
let loading: Promise<void> | null = null;

/**
 * 現在選択中の無線機の機種定義を、AppConfigと無線機定義ファイルから読み込む
 * 無線機の設定を変更した場合は、本関数を呼び出して、再読み込みする。
 */
export async function refreshCurrentTransceiverDevice(): Promise<void> {
  if (loading) {
    return await loading;
  }

  loading = (async () => {
    try {
      const appConfig = await ApiAppConfig.getAppConfig();
      const { makerId, transceiverId } = appConfig.transceiver;
      const transceiverConfig = await ApiAppConfig.getTransceiverConfig();
      const maker = transceiverConfig.transceivers.find((m) => m.makerId === makerId);
      currentDevice.value = maker?.devices.find((d) => d.transceiverId === transceiverId) ?? null;
    } catch (e) {
      // 機種定義を取得できない場合は、全ての運用モードを選択できる状態（従来どおり）とする
      AppRendererLogger.warn(`無線機の機種定義の取得に失敗しました。${String(e)}`);
      currentDevice.value = null;
    } finally {
      isLoaded = true;
      loading = null;
    }
  })();

  return await loading;
}

/**
 * 現在選択中の無線機の機種定義を返すフック
 * 初回の利用時に、機種定義を読み込む。
 */
export default function useCurrentTransceiverDevice() {
  onMounted(() => {
    if (!isLoaded) {
      void refreshCurrentTransceiverDevice();
    }
  });

  return { currentDevice };
}
