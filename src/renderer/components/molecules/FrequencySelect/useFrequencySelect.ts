import { computed, ref, type Ref } from "vue";

/**
 * 周波数コントローラー
 * @param {Ref<string>} frequency 周波数
 * @returns {*} 周波数コントローラー
 */
const useFrequencySelect = (frequency: Ref<string>) => {
  // 整数部分の桁を計算する
  const digits = computed(() =>
    frequency.value
      .split(".")[0]
      .split("")
      .map((char) => {
        const digit = Number(char);
        return isNaN(digit) ? 0 : digit;
      })
  );

  // 小数部分の桁を計算する
  const decimalDigits = computed(() =>
    frequency.value
      .split(".")[1]
      .split("")
      .map((char) => {
        const digit = Number(char);
        return isNaN(digit) ? 0 : digit;
      })
  );

  // マウスホバー中のインデックス
  const hoverIndex = ref<number | null>(null);

  // ホイールイベントの処理
  function onWheel(event: WheelEvent, index: number) {
    const newDigits = [...digits.value, ...decimalDigits.value];
    if (event.deltaY < 0) {
      // ホイールを上に回した場合
      newDigits[index] = (newDigits[index] + 1) % 10;
      for (let i = index; i > 0; i--) {
        if (newDigits[i] === 0) {
          // 繰り上がり処理
          newDigits[i - 1] = (newDigits[i - 1] + 1) % 10;
        } else {
          break;
        }
      }
    } else {
      // ホイールを下に回した場合
      const firstNonZeroIndex = newDigits.findIndex((digit) => digit !== 0);
      if (index < firstNonZeroIndex) {
        // 先頭の0の桁は変更不可とする
        return null;
      }
      newDigits[index] = (newDigits[index] + 9) % 10;
      for (let i = index; i > 0; i--) {
        if (newDigits[i] === 9) {
          // 繰り下がり処理
          newDigits[i - 1] = (newDigits[i - 1] + 9) % 10;
        } else {
          break;
        }
      }
    }
    if (newDigits.every((digit) => digit === 0)) {
      // 全ての桁が0となる場合は終了する
      return null;
    }
    return newDigits.slice(0, digits.value.length).join("") + "." + newDigits.slice(digits.value.length).join("");
  }

  // 右クリックイベントの処理
  function onRightClick(index: number) {
    // 最大桁の場合は終了する
    if (index === 0) return null;
    const newDigits = [...digits.value, ...decimalDigits.value];
    if (newDigits.slice(0, index).every((digit) => digit === 0)) {
      // 全て0となる場合は終了する
      return null;
    }

    // 右クリックされた桁を含めて以降を0にする
    for (let i = index; i < newDigits.length; i++) {
      newDigits[i] = 0;
    }
    return newDigits.slice(0, digits.value.length).join("") + "." + newDigits.slice(digits.value.length).join("");
  }

  // 左クリックイベントの処理
  function onClick(index: number) {
    const newDigits = [...digits.value, ...decimalDigits.value];
    // 左クリックされた桁を+1する
    newDigits[index] = (newDigits[index] + 1) % 10;
    for (let i = index; i > 0; i--) {
      if (newDigits[i] === 0) {
        newDigits[i - 1] = (newDigits[i - 1] + 1) % 10;
      } else {
        break;
      }
    }
    return newDigits.slice(0, digits.value.length).join("") + "." + newDigits.slice(digits.value.length).join("");
  }

  // 先頭の0の桁をグレーアウトする
  function isGrayed(index: number) {
    const newDigits = [...digits.value, ...decimalDigits.value];
    const firstNonZeroIndex = newDigits.findIndex((digit) => digit !== 0);
    return index < firstNonZeroIndex;
  }

  return {
    digits,
    decimalDigits,
    hoverIndex,
    onWheel,
    onRightClick,
    onClick,
    isGrayed,
  };
};

export default useFrequencySelect;
