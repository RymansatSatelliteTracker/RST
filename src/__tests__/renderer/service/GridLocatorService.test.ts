import GridLocatorService from "@/renderer/service/GridLocatorService";

describe("GridLocatorService - fromGridLocator", () => {
  const gridLocatorService = new GridLocatorService();

  /**
   * [正常系]
   * グリッドロケーターから緯度・経度に変換できる
   */
  test("fromGridLocator", () => {
    const gridLocator = "PM95TJ";

    const result = gridLocatorService.fromGridLocator(gridLocator);

    expect(result).toEqual({ lat: 35.375, lon: 139.58333333333331 });
  });

  /**
   * [異常系]
   * 6文字以外のグリッドロケーターの場合、エラーが発生する
   */
  test.each([["PM95T"], ["PM95TZA"]])("fromGridLocator - locator results in NaN latitude or longitude", (locator) => {
    expect(() => {
      gridLocatorService.fromGridLocator(locator);
    }).toThrow("Invalid Maidenhead locator format");
  });

  /**
   * [異常系]
   * フィールドパートが無効な文字を含む場合、エラーが発生する（先頭2文字はA-Rまでの英字であること）
   */
  test.each([["P195TJ"], ["1X95TJ"], ["1195TJ"], ["YZ95TJ"], ["ST95TJ"], ["UV95TJ"]])(
    "fromGridLocator - locator results in field part contains invalid characters",
    (locator) => {
      expect(() => {
        gridLocatorService.fromGridLocator(locator);
      }).toThrow("Invalid grid locator format: field part contains invalid characters");
    }
  );

  /**
   * [異常系]
   * スクエアパートが無効な文字を含む場合、エラーが発生する（3, 4文字目は数字であること）
   */
  test.each([["PMA5TJ"], ["PM9BTJ"], ["PMABTJ"]])(
    "fromGridLocator - square part contains invalid characters",
    (locator) => {
      expect(() => {
        gridLocatorService.fromGridLocator(locator);
      }).toThrow("Invalid grid locator format: square part contains invalid characters");
    }
  );

  /**
   * [異常系]
   * サブスクエアパートが無効な文字を含む場合、エラーが発生する（5, 6文字目はA-Xまでの英字であること）
   */
  test.each([["PM951J"], ["PM95T2"], ["PM9512"], ["PM95YZ"]])(
    "fromGridLocator - sub-square part contains invalid characters",
    (locator) => {
      expect(() => {
        gridLocatorService.fromGridLocator(locator);
      }).toThrow("Invalid grid locator format: sub-square part contains invalid characters");
    }
  );
});
