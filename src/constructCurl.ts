import { getStringValueIfDefined, hasFile, isFilePath } from "./utils/typeUtils";
import { fileURLToPath } from "url";
import { RequestSpec } from "./models";
import { getParamsForUrl, getURL } from "./executeRequest";

function replaceSingleQuotes<T>(value: T): T {
  if (typeof value !== "string") return value;
  return value.replace(/'/g, "%27") as T & string;
}

function formatCurlFormField(key: string, value: string): string {
  if (isFilePath(value)) {
    return ` --form ${key}=@"${fileURLToPath(value)}"`;
  }
  return ` --form '${key}="${value}"'`;
}

function getFormDataCurlRequest(request: RequestSpec): string {
  const body = request.httpRequest.body;
  let result = "";
  for (const key in body) {
    if (Array.isArray(body[key])) {
      body[key].forEach((element: string) => {
        result += formatCurlFormField(key, element);
      });
    } else {
      result += formatCurlFormField(key, body[key]);
    }
  }
  return result;
}

export function getCurlRequest(request: RequestSpec): string {
  let curl: string = "curl";

  if (
    request.httpRequest.headers["content-type"] == "multipart/form-data" ||
    hasFile(request.httpRequest.body)
  ) {
    curl += getFormDataCurlRequest(request);
    curl += ` '${replaceSingleQuotes(
      getURL(
        request.httpRequest.baseUrl,
        request.httpRequest.url,
        getParamsForUrl(request.httpRequest.params, request.options.rawParams)
      )
    )}'`;
    return curl;
  }

  // method
  curl += ` -X ${request.httpRequest.method.toUpperCase()}`;

  // headers
  if (request.httpRequest.headers !== undefined) {
    for (const header in request.httpRequest.headers) {
      curl += ` -H '${replaceSingleQuotes(`${header}: ${request.httpRequest.headers[header]}`)}'`;
    }
  }

  // body
  if (request.httpRequest.body !== undefined) {
    curl += ` -d '${replaceSingleQuotes(getStringValueIfDefined(request.httpRequest.body))}'`;
  }

  // options.follow
  if (request.options.follow) curl += " -L";

  // options.verifySSL
  if (!request.options.verifySSL) curl += " -k";

  // options.showHeaders
  if (request.options.showHeaders) curl += " -i";

  // url w/ params
  curl += ` '${replaceSingleQuotes(
    getURL(
      request.httpRequest.baseUrl,
      request.httpRequest.url,
      getParamsForUrl(request.httpRequest.params, request.options.rawParams)
    )
  )}'`;

  return curl;
}
