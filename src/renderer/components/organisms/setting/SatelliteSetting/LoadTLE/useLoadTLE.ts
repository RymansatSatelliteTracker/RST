import { AppConfigTleUrl } from "@/common/model/AppConfigModel";
import ApiTle from "@/renderer/api/ApiTle";
import AppRendererLogger from "@/renderer/util/AppRendererLogger";
export function isUpdated(oldValue: AppConfigTleUrl[], newValue: AppConfigTleUrl[]) {
  return JSON.stringify(oldValue) !== JSON.stringify(newValue);
}

export async function getUrlofInvalidContents(
  oldValue: AppConfigTleUrl[],
  newValue: AppConfigTleUrl[]
): Promise<AppConfigTleUrl[]> {
  if (!isUpdated(oldValue, newValue)) {
    return [];
  }
  const newlyEnabledUrls: AppConfigTleUrl[] = getNewlyEnabledUrls(oldValue, newValue);
  if (newlyEnabledUrls.length === 0) {
    return [];
  }
  const invalidUrls: AppConfigTleUrl[] = [];
  for await (const item of newlyEnabledUrls) {
    const canGet = await ApiTle.canGetValidTle(item.url);
    if (!canGet) {
      AppRendererLogger.warn(`指定のURLでTLEが取得できませんでした。 ${item.url} `);
      invalidUrls.push(item);
    }
  }
  return invalidUrls;
}

function getNewlyEnabledUrls(oldValue: AppConfigTleUrl[], newValue: AppConfigTleUrl[]): AppConfigTleUrl[] {
  // 有効なURLのリストを取得
  const oldUrls = oldValue.filter((item) => item.enable).map((item) => item.url);
  // 新しいURLのリストを取得
  return newValue.filter((item) => item.enable).filter((item) => !oldUrls.includes(item.url));
}
