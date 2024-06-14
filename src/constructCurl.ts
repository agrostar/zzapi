import { getStringValueIfDefined } from "./utils/typeUtils";

import { getParamsForUrl, getURL } from "./executeRequest";
import { RequestSpec } from "./models";

export function getCurlRequest(request: RequestSpec): string {
  let curl: string = "curl";

  // method
  curl += ` -X ${request.httpRequest.method.toUpperCase()}`;

  // headers
  if (request.httpRequest.headers !== undefined) {
    for (const header in request.httpRequest.headers) {
      if (header === "user-agent") continue;
      curl += ` -H '${header}: ${request.httpRequest.headers[header]}'`;
    }
  }

  // body
  if (request.httpRequest.body !== undefined)
    curl += ` -d '${getStringValueIfDefined(request.httpRequest.body)}'`;

  // options.follow
  if (request.options.follow) curl += " -L";

  // options.verifySSL
  if (!request.options.verifySSL) curl += " -k";

  // options.showHeaders
  if (request.options.showHeaders) curl += " -i";

  // url w/ params
  curl += ` '${getURL(
    request.httpRequest.baseUrl,
    request.httpRequest.url,
    getParamsForUrl(request.httpRequest.params, request.options.rawParams),
  )}'`;

  return curl;
}
