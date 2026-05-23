import type { AxiosInstance, AxiosRequestConfig } from "axios";
import Axios from "axios";
import type { ParsedUrlQueryInput } from "querystring";
import querystring from "querystring";

/**
 * HTTPレスポンス
 * AxiosResponseを詰め替えたもの
 */
export class AppHttpResponse {
  public status = -1;
  public statusText = "";
  public data = "";

  public constructor(status: number, statusText: string, data: string) {
    this.status = status;
    this.statusText = statusText;
    this.data = data;
  }
}

/**
 * Webアクセスのクライアント
 */
export default class WebClient {
  private axios: AxiosInstance;

  public constructor() {
    this.axios = Axios.create({
      baseURL: "/",
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * GET
   * @param url
   * @param query
   * @param config
   * @returns
   */
  public async get(url: string, query?: ParsedUrlQueryInput, config?: AxiosRequestConfig): Promise<AppHttpResponse> {
    try {
      if(query){
        // クエリパラメータをURLに追加
        const queryStr = querystring.stringify(query);
        url = `${url}?${queryStr}`;
      }
      const response = await this.axios.get(url, config);
      return new AppHttpResponse(response.status, response.statusText, response.data);
    } catch (e) {
      if (Axios.isAxiosError(e) && e.response) {
        const response = e.response;
        return new AppHttpResponse(response.status, response.statusText, response.data);
      }

      // Axios以外のエラーは再スロー
      throw e;
    }
  }

  /**
   * POST
   * @param url
   * @param data
   * @param config
   * @returns
   */
  public async post(url: string, data?: any, config?: AxiosRequestConfig) {
    try {
      const response = await this.axios.post(url, data, config);
      return new AppHttpResponse(response.status, response.statusText, response.data);
    } catch (e) {
      if (Axios.isAxiosError(e) && e.response) {
        const response = e.response;
        return new AppHttpResponse(response.status, response.statusText, response.data);
      }

      // Axios以外のエラーは再スロー
      throw e;
    }
  }
}
