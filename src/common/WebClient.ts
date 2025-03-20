import Axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import querystring, { ParsedUrlQueryInput } from "querystring";

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
  public async get(
    url: string,
    query?: ParsedUrlQueryInput,
    config?: AxiosRequestConfig | undefined
  ): Promise<AppHttpResponse> {
    try {
      const queryStr = querystring.stringify(query);
      const response = await this.axios.get(`${url}?${queryStr}`, config);
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
  public async post(url: string, data?: any, config?: AxiosRequestConfig | undefined) {
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
