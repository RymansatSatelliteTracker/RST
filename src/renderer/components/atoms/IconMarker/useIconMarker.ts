import { computed } from "vue";

type Props = {
  iconSize: number;
};

/**
 * カスタムフック
 * @param props
 * @returns
 */
export const useIconMarker = (props: Props) => {
  const imOptions = computed(() => {
    return {
      dynamicSize: [props.iconSize, props.iconSize] as [number, number],
      dynamicAnchor: [props.iconSize / 2.0, props.iconSize / 2.0] as [number, number],
    };
  });

  return { imOptions };
};
