import CommonUtil from "@/common/CommonUtil";
import { AppConfigTleUrl } from "@/common/model/AppConfigModel";
import WebClient from "@/common/WebClient";
import AppRendererLogger from "@/renderer/util/AppRendererLogger";

export function isUpdated(oldValue: AppConfigTleUrl[], newValue: AppConfigTleUrl[]) {
  return JSON.stringify(oldValue) !== JSON.stringify(newValue);
}

export async function validateURLContents(oldValue: AppConfigTleUrl[], newValue: AppConfigTleUrl[]) {
  if (!isUpdated(oldValue, newValue)) {
    return true;
  }
  const newlyEnabledUrls: AppConfigTleUrl[] = getNewlyEnabledUrls(oldValue, newValue);
  if (newlyEnabledUrls.length === 0) {
    return true;
  }

  for (const item of newlyEnabledUrls) {
    const tle = await getTleText(item.url);
    if (!isValidTle(tle)) {
      AppRendererLogger.warn(`指定のURLでTLEが取得できませんでした。 ${item.url} `);
      return false;
    }
  }
  return true;
}

function getNewlyEnabledUrls(oldValue: AppConfigTleUrl[], newValue: AppConfigTleUrl[]): AppConfigTleUrl[] {
  // 有効なURLのリストを取得
  const oldUrls = oldValue.filter((item) => item.enable).map((item) => item.url);
  // 新しいURLのリストを取得
  return newValue.filter((item) => item.enable).filter((item) => !oldUrls.includes(item.url));
}

function isValidTle(tlesText: string): boolean {
  // TLEがブランクの場合
  if (CommonUtil.isEmpty(tlesText)) {
    return false;
  }

  // 各OSの改行コードを想定してスプリットする
  const lines = tlesText.split(/\r\n|\r|\n/).filter((line) => !CommonUtil.isEmpty(line.trim()));
  // TLEの2行目が「1 」、3行目が「2 」で始まる行を探す
  // 一つでも見つけたらOK
  let i = 0;
  while (i < lines.length) {
    if (
      lines[i + 1] &&
      lines[i + 1].substring(0, 2) === "1 " &&
      lines[i + 2] &&
      lines[i + 2].substring(0, 2) === "2 "
    ) {
      return true;
    }
    i++;
  }
  return false;
}

/**
 * TLEの取得を行う
 * @returns 取得したTLE
 *          取得されなかった場合はブランクを返す
 */
async function getTleText(url: string): Promise<string> {
  const webClient = new WebClient();
  const tleText: string = "";

  const res = await webClient.get(url);
  if (res.status !== 200) {
    AppRendererLogger.warn(`指定のURLでTLEが取得できませんでした。 ${res.status} ${url} `);
    return "";
  }
  if (!CommonUtil.isEmpty(res.data.trim())) {
    return res.data.trim();
  } else {
    return "";
  }
}
