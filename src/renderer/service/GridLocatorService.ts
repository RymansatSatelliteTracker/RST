/**
 * グリッドロケーターサービス
 */
class GridLocatorService {
  private readonly UPPERCASE_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWX";
  private readonly FIELD_REGEX = /^[A-Ra-r]{2}$/;
  private readonly SQUARE_REGEX = /^[0-9]{2}$/;
  private readonly SUBSQUARE_REGEX = /^[A-Xa-x]{2}$/;

  /**
   * グリッドロケーターを緯度・経度に変換
   */
  public fromGridLocator(locator: string): { lat: number; lon: number } {
    this.validGridLocatorFormat(locator);

    const fieldLon = this.UPPERCASE_LETTERS.indexOf(locator[0].toUpperCase());
    const fieldLat = this.UPPERCASE_LETTERS.indexOf(locator[1].toUpperCase());

    const squareLon = parseInt(locator[2], 10);
    const squareLat = parseInt(locator[3], 10);

    const subSquareLon = this.UPPERCASE_LETTERS.indexOf(locator[4].toUpperCase());
    const subSquareLat = this.UPPERCASE_LETTERS.indexOf(locator[5].toUpperCase());

    const lon = fieldLon * 20 + squareLon * 2 + subSquareLon / 12 - 180;
    const lat = fieldLat * 10 + squareLat + subSquareLat / 24 - 90;

    return { lat, lon };
  }

  /**
   * グリッドロケーターのバリデーション
   */
  private validGridLocatorFormat(locator: string) {
    // 文字数のチェック(6文字であること)
    if (locator.length !== 6) throw new Error("Invalid Maidenhead locator format");

    this.validFieldPart(locator.substring(0, 2));
    this.validSquarePart(locator.substring(2, 4));
    this.validSubSquarePart(locator.substring(4, 6));
  }

  /**
   * フィールドパートのバリデーション（A-Rまでの英字であること）
   */
  private validFieldPart(field: string) {
    if (!this.FIELD_REGEX.test(field)) {
      throw new Error("Invalid grid locator format: field part contains invalid characters");
    }
  }

  /**
   * スクエアパートのバリデーション（数字であること）
   */
  private validSquarePart(square: string) {
    if (!this.SQUARE_REGEX.test(square)) {
      throw new Error("Invalid grid locator format: square part contains invalid characters");
    }
  }

  /**
   * サブスクエアパートのバリデーション（A-Xまでの英字であること）
   */
  private validSubSquarePart(subSquare: string) {
    if (!this.SUBSQUARE_REGEX.test(subSquare)) {
      throw new Error("Invalid grid locator format: sub-square part contains invalid characters");
    }
  }
}

export default GridLocatorService;
