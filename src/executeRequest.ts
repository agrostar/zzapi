import got, { Method } from "got";

import { getStringValueIfDefined } from "./utils/typeUtils";

import { GotRequest, Param, RequestSpec } from "./models";

export function constructGotRequest(allData: RequestSpec): GotRequest {
  const completeUrl = getURL(
    allData.httpRequest.baseUrl,
    allData.httpRequest.url,
    getParamsForUrl(allData.httpRequest.params, allData.options.raw)
  );

  const options = {
    method: allData.httpRequest.method.toLowerCase() as Method,
    body: getBody(allData.httpRequest.body),
    headers: allData.httpRequest.headers,
    followRedirect: allData.options?.follow,
    retry: { limit: 0 },

    https: {
      rejectUnauthorized: allData.options?.verifySSL,
    },
  };

  return got(completeUrl, options);
}

export function getBody(body: any): string | undefined {
  return getStringValueIfDefined(body);
}

export async function executeGotRequest(httpRequest: GotRequest): Promise<{
  response: { [key: string]: any };
  executionTime: number;
  byteLength: number;
  error: string;
}> {
  const startTime = new Date().getTime();
  let responseObject: { [key: string]: any };
  let size: number = 0;
  let error = "";

  try {
    responseObject = await httpRequest;
    size = Buffer.byteLength(responseObject.rawBody);
  } catch (e: any) {
    const res = e.response;
    if (res) {
      responseObject = res;
      if (res.body) {
        size = Buffer.byteLength(res.body);
      } else {
        size = 0;
      }
    } else {
      responseObject = {};
      if (e.code === "ERR_INVALID_URL") {
        error = `Invalid URL: ${e.input}`;
      } else if (e.name === "CancelError") {
        error = "Cancelled";
      } else {
        error = e.message;
      }
    }
  }
  const executionTime = new Date().getTime() - startTime;
  return { response: responseObject, executionTime: executionTime, byteLength: size, error: error };
}

export function getParamsForUrl(paramsArray: Param[] | undefined, raw: boolean): string {
  if (!paramsArray) return "";

  let params: Param[] = paramsArray;
  let paramArray: string[] = [];

  params.forEach((param) => {
    const key = param.name as string;
    let value = param.value;
    if (value == undefined) {
      paramArray.push(key);
    } else if (raw === true) {
      paramArray.push(`${key}=${getStringValueIfDefined(value) as string}`);
    } else {
      paramArray.push(`${key}=${encodeURIComponent(getStringValueIfDefined(value) as string)}`);
    }
  });

  const paramString = paramArray.join("&");
  return `?${paramString}`;
}

export function getURL(baseUrl: string | undefined, url: string, paramsForUrl: string): string {
  // base url not defined, or url does not start with /, then ignore base url
  if (!baseUrl || !url.startsWith("/")) return url + paramsForUrl;
  // otherwise, incorporate base url
  return baseUrl + url + paramsForUrl;
}
