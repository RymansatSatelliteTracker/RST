import RotatorSim from "@/renderer/components/pages/dev/RotatorSim/RotatorSim.vue";
import Home from "@/renderer/components/pages/Home/Home.vue";
import { createRouter, createWebHistory } from "vue-router";

const routes = [
  {
    // メインページ、初期表示時のページ
    path: "/",
    name: "Home",
    component: Home,
  },
  {
    // ローテーターのシミュレータ
    path: "/dev/rotator-sim",
    name: "RotatorSim",
    component: RotatorSim,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
