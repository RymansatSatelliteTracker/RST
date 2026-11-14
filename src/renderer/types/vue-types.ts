/**
 * v-selectのitemに渡すデータ
 */
export type SelectOption = {
  title: string | number | object;
  value: string | number;
  props?: { disabled?: boolean };
};
