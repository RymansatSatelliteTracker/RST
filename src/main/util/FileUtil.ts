import * as fs from "fs";
import YAML from "yaml";

/**
 * ファイル関係のユーティリティ
 */
export default class FileUtil {
  /**
   * 指定のパスにフォルダ、ファイルが存在するか判定する
   */
  public static exists(filePath: string): boolean {
    return fs.existsSync(filePath);
  }

  /**
   * テキストを保存する
   */
  public static writeText(filePath: string, text: string) {
    fs.writeFileSync(filePath, text);
  }

  /**
   * テキストで読み込む
   */
  public static readText(filePath: string) {
    return fs.readFileSync(filePath, { encoding: "utf-8", flag: "r" });
  }

  /**
   * ファイルを削除する
   * @param filePath
   */
  public static deleteFile(filePath: string) {
    fs.unlinkSync(filePath);
  }

  /**
   * ファイルをコピーする
   * destがすでに存在する場合は上書きする
   */
  public static copyFile(src: string, dest: string) {
    fs.copyFileSync(src, dest);
  }

  /**
   * yamlファイルを読み込みオブジェクトで返す
   */
  public static readYaml(filepath: string) {
    const text = FileUtil.readText(filepath);
    return YAML.parse(text);
  }

  /**
   * JSONファイルを読み込みオブジェクトで返す
   */
  public static readJson(filepath: string) {
    const text = this.readText(filepath);
    return JSON.parse(text);
  }

  /**
   * ファイルの更新日時を返す
   */
  public static updateAt(filepath: string): Date {
    const stats = fs.statSync(filepath);
    return stats.mtime;
  }
}
