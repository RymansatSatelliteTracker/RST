import { createPinia } from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
import { createApp } from "vue";

import router from "@/renderer/router/router";
import App from "./AppRotatorSim.vue";

import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import "vuetify/styles";

// 全体SCSSの適用
import "@/renderer/components/styles/global.scss";

const vuetify = createVuetify({
  components,
  directives,
});

// Pinia
const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

const app = createApp(App);
app.use(pinia);
app.use(router);
app.use(vuetify);
app.mount("#app");
