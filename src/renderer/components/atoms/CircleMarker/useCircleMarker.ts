import { computed } from "vue";

type Props = {
  position: number[];
  radius: number;
  fill: boolean;
  fillColor?: string;
  color: string;
  weight?: number;
  interactive: boolean;
  pane?: string;
};

/**
 * カスタムフック
 * @param props
 * @returns
 */
export const useCircleMarker = (props: Props) => {
  const cmOptions = computed(() => {
    return {
      position: [props.position[0], props.position[1]] as [number, number],
      markerOptions: {
        radius: props.radius,
        fill: props.fill,
        fillOpacity: props.fill ? 1.0 : 0.0,
        fillColor: props.fillColor ?? props.color,
        color: props.color,
        weight: props.weight ?? 3.0,
        interactive: props.interactive,
        pane: props.pane,
      },
    };
  });

  return { cmOptions };
};
