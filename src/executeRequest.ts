import got, { Method, OptionsOfTextResponseBody } from "got";

import { getStringValueIfDefined, hasFile, isFilePath } from "./utils/typeUtils";

import { GotRequest, Param, RequestSpec } from "./models";
import { fileFromPathSync } from "formdata-node/file-from-path";

import { FormDataEncoder } from "form-data-encoder";
import { FormData } from "formdata-node";
import { Readable } from "stream";
import * as path from "path";

export function constructGotRequest(allData: RequestSpec): GotRequest {
  const completeUrl: string = getURL(
    allData.httpRequest.baseUrl,
    allData.httpRequest.url,
    getParamsForUrl(allData.httpRequest.params, allData.options.rawParams)
  );

  const options: OptionsOfTextResponseBody = {
    method: allData.httpRequest.method.toLowerCase() as Method,
    body: getBody(allData),
    headers: allData.httpRequest.headers,
    followRedirect: allData.options.follow,
    https: { rejectUnauthorized: allData.options.verifySSL },
    retry: { limit: 0 },
  };

  return got(completeUrl, options);
}

function replaceFilePath(filePath: string) {
  /*
  finds all file:// instances with atleast 1 succeeding word character
  matches the file-name referred to by this instance
  */

  filePath = path.resolve(filePath.slice(7));
  const fileName = path.basename(filePath);
  return fileFromPathSync(filePath, fileName);
}

function constructFormData(request: RequestSpec, body: any) {
  const multipart = new FormData();
  for (const key in body) {
    if (Array.isArray(body[key])) {
      for (const element of body[key]) {
        if (isFilePath(element)) {
          multipart.append(key, replaceFilePath(element));
        } else {
          multipart.append(key, element);
        }
      }
    } else {
      if (isFilePath(body[key])) {
        multipart.append(key, replaceFilePath(body[key]));
      } else {
        multipart.append(key, body[key]);
      }
    }
  }
  const fde = new FormDataEncoder(multipart);

  request.httpRequest.headers["content-type"] = fde.contentType; //FormDataEncoder builds the actual content-type header.
  return Readable.from(fde);
}

export function getBody(request: RequestSpec) {
  const body = request.httpRequest.body;
  if (request.httpRequest.headers["content-type"] == "multipart/form-data" || hasFile(body)) {
    return constructFormData(request, body);
  }

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
      size = res.body ? Buffer.byteLength(res.body) : 0;
    } else {
      responseObject = {};
      if (e.code === "ERR_INVALID_URL") {
        error = `Invalid URL: ${e.input}`;
      } else if (e.name === "CancelError") {
        error = "Cancelled";
      } else {
        error = e.message || e.code;
      }
    }
  }
  const executionTime = new Date().getTime() - startTime;
  return { response: responseObject, executionTime: executionTime, byteLength: size, error: error };
}

export function getParamsForUrl(params: Param[] | undefined, rawParams: boolean): string {
  if (!params || params.length < 1) return "";

  let paramArray: string[] = [];
  params.forEach((param) => {
    const key = param.name;
    let value = param.value;
    if (value == undefined) {
      paramArray.push(key);
    } else if (rawParams) {
      paramArray.push(`${key}=${getStringValueIfDefined(value)}`);
    } else {
      paramArray.push(`${key}=${encodeURIComponent(getStringValueIfDefined(value))}`);
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
