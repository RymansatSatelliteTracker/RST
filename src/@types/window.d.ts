import { apiHandler } from "../main/preload";

declare global {
  interface Window {
    // preload.ts でcontextBridgeに設定したAPIが以下の記載で呼び出し可能となる
    // ※VsCodeなどでインテリセンスでAPIを補完可能とするための定義
    // 例）await window.rstApi.xxx();
    rstApi: apiHandler;
  }
}
