export default class BufferUtil {
  /**
   * Create a new Uint8Array based on two Uint8Array
   *
   * @private
   * @param {Uint8Array} a The first buffer
   * @param {Uint8Array} b The second buffer
   * @return {Uint8Array} The new ArrayBuffer
   */
  public static concatBuffer(a: Uint8Array, b: Uint8Array) {
    const result = new Uint8Array(a.length + b.length);
    result.set(a, 0);
    result.set(b, a.length);
    return result;
  }

  public static splitByLength(str: string, length: number) {
    const resultArr: string[] = [];
    if (!str || !length || length < 1) {
      return resultArr;
    }
    let index = 0;
    let start = index;
    let end = start + length;
    while (start < str.length) {
      resultArr[index] = str.substring(start, end);
      index++;
      start = end;
      end = start + length;
    }
    return resultArr;
  }

  public static hexStrToBuffer(value: string) {
    const hexStrList = BufferUtil.splitByLength(value, 2);
    const decBytes = hexStrList.map((hexStr) => parseInt(hexStr, 16));
    return Uint8Array.from(decBytes);
  }

  public static decimalToBytes(value: number, byteLength: number) {
    const result = new Uint8Array(byteLength);
    for (let idx = 0; idx < byteLength; idx++) {
      result[byteLength - 1 - idx] = (value >> (idx * 8)) & 0xff;
    }
    return result;
  }

  public static strToBytes(value: string) {
    const buf = Buffer.from(value);
    return Uint8Array.from(buf);
  }

  // 前パディング
  public static pad(val: string, padStr: string, len: number) {
    return (Array(len).join(padStr) + val).slice(-len);
  }

  public static zpad2(val: string) {
    return BufferUtil.pad(val, "0", 2);
  }

  public static byteArrayToHexStr(bytes: Uint8Array) {
    const hexList: string[] = [];
    bytes.forEach((byte) => {
      hexList.push(BufferUtil.zpad2(byte.toString(16).toUpperCase()));
    });

    return hexList.join("");
  }

  public static base64StrToBuffer(value: string) {
    const raw = Buffer.from(value, "base64").toString("binary");
    const bytes = new Uint8Array(new ArrayBuffer(raw.length));
    for (let i = 0; i < raw.length; i++) {
      bytes[i] = raw.charCodeAt(i);
    }
    return bytes;
  }

  /**
   * 指定のバイト配列を10進で返す
   * @param {Uint8Array} value バイト配列
   * @return {number} 変換結果
   */
  public static byteArrayToDec(value: Uint8Array) {
    const buf = Buffer.from(value);
    return buf.readUIntBE(0, buf.length);
  }

  /**
   * 指定のバイト配列を符号付き10進で返す
   * @param {Uint8Array} value バイト配列
   * @return {number} 変換結果
   */
  public static byteArrayToSignedDec(value: Uint8Array) {
    const buf = Buffer.from(value);
    return buf.readIntBE(0, buf.length);
  }

  /**
   * 指定のバイト配列をAscii文字列で返す
   * @param {Uint8Array} value バイト配列
   * @return {string} 変換結果
   */
  public static byteArrayToAsciiStr(value: Uint8Array) {
    const buf = Buffer.from(value);
    return buf.toString("ascii");
  }
}
