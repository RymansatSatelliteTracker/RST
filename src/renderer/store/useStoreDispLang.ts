import { LangType } from "@/common/types/types";
import { defineStore } from "pinia";
import { ref } from "vue";

/**
 * 表示言語のストア
 */
export const useStoreDispLang = defineStore(
  "dispLang",
  () => {
    const _lang = ref<LangType>("ja");

    /**
     * rendererプロセスで保持する言語設定を変更する
     */
    function setLang(lang: LangType) {
      _lang.value = lang;
    }

    /**
     * rendererプロセスで保持している言語設定を返す
     */
    function getLang(): LangType {
      return _lang.value;
    }

    return { setLang, getLang };
  },
  {
    persist: true,
  }
);
