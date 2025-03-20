import { computed, useCssModule } from "vue";

export type ButtonColorType = "primary" | "primary-transparent" | "secondary";

type Props = {
  styleType: ButtonColorType;
};

/**
 * カスタムフック
 * @param props
 * @returns
 */
export const useButton = (props: Props) => {
  /**
   * ボタンのスタイルを返す
   */
  const btnClass = computed(() => {
    const style = useCssModule();

    switch (props.styleType) {
      case "primary": {
        return style.buttonPrimary;
      }
      case "primary-transparent": {
        return style.buttonPrimaryTransparent;
      }
      case "secondary": {
        return style.buttonSecondary;
      }
      default: {
        const strangeValue = props.styleType as never;
        throw Error(`'color' is invalid. 'color':${strangeValue}`);
      }
    }
  });

  return { btnClass };
};
