<template>
  <v-list border elevation="2" bg-color="#121212">
    <v-virtual-scroll :height="height" :items="items">
      <template v-slot:default="{ item, index }">
        <span v-if="index === items.length - 1" v-intersect.once="onIntersect"></span>
        <v-list-item
          :key="item[itemKey]"
          @click="selectItem(index)"
          @dblclick="emitItemDblClick(item)"
          :class="{ 'v-list-item--active': isSelected(index) }"
          class="listitem"
          density="compact"
          ref="listItemRef"
          >{{ item[itemName] }}
        </v-list-item>
      </template>
    </v-virtual-scroll>
  </v-list>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";

// コンポーネントに渡された源泉のアイテム
const srcItems = defineModel<any[]>("items", { default: [] });
// 表示対象のアイテム
const items = ref<any[]>([]);
const itemName = defineModel<string>("itemName", { default: "" });
const itemKey = defineModel<string>("itemKey", { default: "" });
const height = defineModel<number>("height", { default: 0 });
type SelectionMode = "exclusive" | "inclusive";
const selectMode = defineModel<SelectionMode>("selectMode", { default: "exclusive" });

const selectedItemIndexes = ref<number[]>([]);
// スクロールした際に読み込む行数
const maxNumberOfOnceLoad: number = 200;
// 現在のページ数
let currentPage: number = 0;

const emits = defineEmits(["itemDblClick"]);
function emitItemDblClick(item: any) {
  emits("itemDblClick", item);
}

/**
 * コンポーネントに渡されるアイテム数が変化した時に
 * 指定の行数だけ画面表示用にロードする
 */
watch(
  () => [...srcItems.value],
  () => {
    currentPage = 0;
    loadItems();
  },
  { deep: true }
);

/**
 * ユーザーがスクロールしたときに新しいアイテムをロード
 */
function onIntersect(_entries: IntersectionObserverEntry[], _observer: IntersectionObserver, isIntersecting: boolean) {
  if (isIntersecting) {
    loadItems();
  }
}

/**
 * 現在読み込む範囲を指定してロードする
 * 最終行の場合はデータの最大数までロードする
 */
function loadItems() {
  let lastItemNumber = maxNumberOfOnceLoad * (currentPage + 1);
  if (lastItemNumber > srcItems.value.length) {
    lastItemNumber = srcItems.value.length;
  } else {
    currentPage += 1;
  }
  items.value = srcItems.value.slice(0, lastItemNumber);
}

/**
 * アイテムを選択
 * 同じアイテムだったら選択状態を解除する
 * selectModeがexclusive: 一つ選択すると他を非選択
 * selectModeがinclusive: 選択を保持し続ける
 */
function selectItem(index: number) {
  if (selectMode.value === "inclusive") {
    const inIndex = selectedItemIndexes.value.indexOf(index);
    if (inIndex > -1) {
      selectedItemIndexes.value.splice(inIndex, 1);
    } else {
      selectedItemIndexes.value.unshift(index);
    }
  } else {
    const inIndex = selectedItemIndexes.value.indexOf(index);
    selectedItemIndexes.value = [];
    // アイテムがなければ追加
    if (inIndex === -1) {
      selectedItemIndexes.value.push(index);
    }
  }
}

/**
 * アイテムが選択されているかどうかチェック
 */
function isSelected(index: number) {
  return selectedItemIndexes.value.includes(index);
}

/**
 * アイテムの選択をクリア
 */
function clearSelect() {
  selectedItemIndexes.value = [];
}

/**
 * アイテムを上に移動
 */
function moveItemUp() {
  const index = selectedItemIndexes.value[0];
  if (index !== null) {
    const item = srcItems.value.splice(index, 1)[0];
    srcItems.value.splice(index - 1, 0, item);
    selectedItemIndexes.value[0] = index - 1;
  }
}

/**
 * アイテムを下に移動
 */
function moveItemDown() {
  const index = selectedItemIndexes.value[0];
  if (index !== null) {
    const item = srcItems.value.splice(index, 1)[0];
    srcItems.value.splice(index + 1, 0, item);
    selectedItemIndexes.value[0] = index + 1;
  }
}

/**
 * アイテムを削除
 */
function deleteItem() {
  if (selectedItemIndexes.value[0] !== null) {
    srcItems.value.splice(selectedItemIndexes.value[0], 1);
    selectedItemIndexes.value.splice(0, 1);
  }
}

/**
 * 選択したアイテムが上に移動可能かどうかを判断
 */
const canMoveUp = computed(() => {
  if (selectedItemIndexes.value.length !== 1) return false;
  return selectedItemIndexes.value[0] > 0;
});

/**
 * 選択したアイテムが下に移動可能かどうかを判断
 */
const canMoveDown = computed(() => {
  if (selectedItemIndexes.value.length !== 1) return false;
  return selectedItemIndexes.value[0] > -1 && selectedItemIndexes.value[0] < srcItems.value.length - 1;
});

/**
 * 選択したアイテムが削除可能かどうかを判断
 */
const canDelete = computed(() => {
  return selectedItemIndexes.value.length === 1;
});

/**
 * 選択したアイテム
 */
const selectedItems = computed(() => {
  return srcItems.value.filter((item, index) => selectedItemIndexes.value.includes(index));
});

// 外部に公開する
defineExpose({
  moveItemUp,
  moveItemDown,
  deleteItem,
  clearSelect,
  canMoveUp,
  canMoveDown,
  canDelete,
  selectedItems,
  selectedItemIndexes,
});
</script>

<style scoped lang="scss">
@import "./VirtualScrollList.scss";
</style>
