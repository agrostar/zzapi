import { getStringValueIfDefined, hasFile, isFilePath } from "./utils/typeUtils";
import { RequestSpec } from "./models";
import { getParamsForUrl, getURL } from "./executeRequest";
import path from "path";

function replaceSingleQuotes<T>(value: T): T {
  if (typeof value !== "string") return value;
  return value.replace(/'/g, "%27") as T & string;
}

function formatCurlFormField(key: string, value: string): string {
  if (isFilePath(value)) {
    return ` --form ${key}=@"${path.resolve(value.slice(7))}"`;
  }
  return ` --form '${key}="${encodeURIComponent(value)}"'`;
}

function getFormDataUrlEncoded(request: RequestSpec): string {
  const formValues = request.httpRequest.formValues;
  if (!formValues) return "";
  let result = "";

  formValues.forEach((formValue: any) => {
    result += ` --data "${formValue.name}=${encodeURIComponent(formValue.value)}"`;
  });

  return result;
}

function getFormDataCurlRequest(request: RequestSpec): string {
  const formValues = request.httpRequest.formValues;
  if (!formValues) return "";
  let result = "";
  for (const { name, value } of formValues) {
    result += formatCurlFormField(name, value);
  }
  return result;
}

export function getCurlRequest(request: RequestSpec): string {
  let curl: string = "curl";

  if (
    request.httpRequest.headers["content-type"] == "multipart/form-data" ||
    hasFile(request.httpRequest.formValues)
  ) {
    curl += getFormDataCurlRequest(request);
    curl += ` '${replaceSingleQuotes(
      getURL(
        request.httpRequest.baseUrl,
        request.httpRequest.url,
        getParamsForUrl(request.httpRequest.params, request.options.rawParams),
      ),
    )}'`;
    return curl;
  } else if (
    request.httpRequest.headers["content-type"] == "application/x-www-form-urlencoded" ||
    request.httpRequest.formValues
  ) {
    curl += getFormDataUrlEncoded(request);
    curl += ` '${replaceSingleQuotes(
      getURL(
        request.httpRequest.baseUrl,
        request.httpRequest.url,
        getParamsForUrl(request.httpRequest.params, request.options.rawParams),
      ),
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
      getParamsForUrl(request.httpRequest.params, request.options.rawParams),
    ),
  )}'`;

  return curl;
}
