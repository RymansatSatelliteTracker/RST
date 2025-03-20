import App from "@/renderer/App.vue";
import router from "@/renderer/router/router";
import AppRendererLogger from "@/renderer/util/AppRendererLogger";
import { createApp } from "vue";

import { LangType } from "@/common/types/types";
import { useStoreDispLang } from "@/renderer/store/useStoreDispLang";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import { aliases, mdi } from "vuetify/iconsets/mdi-svg";
import "vuetify/styles";

import AppConfigService from "@/renderer/service/AppConfigService";
import { createPinia } from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";

// 全体SCSSの適用
import Constant from "@/common/Constant";
import I18nMsgs from "@/common/I18nMsgs";
import I18nUtil from "@/renderer/common/util/I18nUtil";
import emitter from "@/renderer/util/EventBus";
import "./components/styles/global.scss";

// レンダラ側全体の例外処理
setupGlobalErrorHandlers();

// Vuetifyのカスタムテーマ
const customTheme = {
  dark: true,
  colors: {
    error: "#F06292",
  },
};

const vuetify = createVuetify({
  components,
  directives,
  icons: {
    defaultSet: "mdi",
    aliases,
    sets: {
      mdi,
    },
  },
  theme: {
    defaultTheme: "customTheme",
    themes: {
      customTheme,
    },
  },
});

// Pinia
const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

// App
const app = createApp(App);
app.use(pinia);
app.use(router);
app.use(vuetify);
app.mount("#app");

// 表示言語ストアのフック
const dispLangStore = useStoreDispLang();

// 起動時の処理
startUp();

/**
 * 起動時の処理
 */
async function startUp() {
  AppRendererLogger.debug("起動します");

  // アプリ設定の表示言語をストアに設定
  const appConfigService = new AppConfigService();
  const appConfig = await appConfigService.getConfig();
  dispLangStore.setLang(appConfig.lang as LangType);

  // 言語設定の変更イベントを受信したら、ストアに設定する
  window.rstApi.onDispLangChange(function (lang: LangType) {
    dispLangStore.setLang(lang);
  });
}

/**
 * レンダラ側全体の例外処理
 */
function setupGlobalErrorHandlers() {
  // 同期エラーのキャッチ
  window.onerror = (message, source, lineno, colno, error) => {
    AppRendererLogger.error(`Message: ${message} Source: ${source} Line: ${lineno}, Column: ${colno}`);
    emitter.emit(Constant.GlobalEvent.NOTICE_ERR, I18nUtil.getMsg(I18nMsgs.SYSTEM_UNEXPECTED_ERROR) + "\n" + message);
  };

  // 非同期エラーのキャッチ
  window.addEventListener("unhandledrejection", (event) => {
    // イベント伝播は中止
    event.preventDefault();

    AppRendererLogger.error(event.reason, event);
    emitter.emit(
      Constant.GlobalEvent.NOTICE_ERR,
      I18nUtil.getMsg(I18nMsgs.SYSTEM_UNEXPECTED_ERROR) + "\n" + event.reason
    );
  });
}
