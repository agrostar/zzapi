import { getStringValueIfDefined } from "./utils/typeUtils";

import { RequestSpec } from "./models";
import { getParamsForUrl, getURL, handleMultiPart } from "./executeRequest";

function replaceSingleQuotes<T>(value: T): T {
  if (typeof value !== "string") return value;
  return value.replace(/'/g, "%27") as T & string;
}

export function getCurlRequest(request: RequestSpec): string {
  let curl: string = "curl";
  const body = request.httpRequest.body
  handleMultiPart(body,request,true);   //if any file:// found , changes content-type to multipart
  // method
  curl += ` -X ${request.httpRequest.method.toUpperCase()}`;

  // headers
  if (request.httpRequest.headers !== undefined) {
    for (const header in request.httpRequest.headers) {
      if(header == 'content-type' && request.httpRequest.headers['content-type'] == 'multipart'){
        continue;
      }
      curl += ` -H '${replaceSingleQuotes(`${header}: ${request.httpRequest.headers[header]}`)}'`;
    }
  }

  // body
  if (request.httpRequest.body !== undefined){
    if(request.httpRequest.headers['content-type'] == 'multipart'){
      for (const key in body) {
        if (Object.prototype.hasOwnProperty.call(body, key)) {
          if(Array.isArray(body[key])){
            for (const element of body[key]) {
              curl += ` -F "${key}=${element}"`;
            }
          }else{
            curl += ` -F "${key}=${body[key]}"`;
          }
        }
      }
    }
    else{
      curl += ` -d '${replaceSingleQuotes(getStringValueIfDefined(request.httpRequest.body))}'`;
    }
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
