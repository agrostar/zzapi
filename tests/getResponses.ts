import path from "path";

import {
  RequestSpec,
  ResponseData,
  captureVariables,
  constructGotRequest,
  executeGotRequest,
  replaceVariablesInRequest,
  runAllTests,
} from "../src/index";

import { RawRequest } from "./utils/requestUtils";
import { replaceFileContents } from "./utils/fileContents";

function getStatusCode(): number {
  return process.exitCode ?? 0;
}

function attemptParse(response: ResponseData, expectJson?: boolean): string | undefined {
  if (!expectJson || !response.status) return undefined;
  if (!response.body) return "No response body";

  try {
    response.json = JSON.parse(response.body);
  } catch (err) {
    if (err instanceof Error && err.message) {
      return err.message;
    } else {
      return `Error parsing the response body: ${err}`;
    }
  }

  return undefined;
}

function getStrictStringValue(value: any): string {
  if (value === undefined) return "undefined";
  if (typeof value === "object") return JSON.stringify(value);
  return value.toString();
}

function getHeadersAsString(rawHeaders: string[] | undefined): string {
  let formattedString = "\n";
  if (rawHeaders === undefined) return formattedString;

  const maxPairInd = rawHeaders.length - 1;
  for (let i = 0; i < maxPairInd; i += 2)
    formattedString += `  ${rawHeaders[i]} : ${getStrictStringValue(rawHeaders[i + 1])}\n`;

  return `\n  ${formattedString.trim()}`;
}

export async function runRequestTests(
  requests: { [name: string]: RequestSpec },
  rawReq: RawRequest,
): Promise<void> {
  const bundlePath = rawReq.bundle.bundlePath;
  const bundleName = bundlePath.substring(bundlePath.lastIndexOf(path.sep) + 1);

  console.log(`running ${bundleName}`);

  for (const name in requests) {
    const req: RequestSpec = requests[name];
    req.httpRequest.body = replaceFileContents(req.httpRequest.body, bundlePath);

    const undefs = replaceVariablesInRequest(req, rawReq.variables.getAllVariables());

    const httpRequest = constructGotRequest(req);
    const {
      response: httpResponse,
      executionTime,
      byteLength: size,
      error,
    } = await executeGotRequest(httpRequest);

    if (error) {
      // fail
      process.exitCode = getStatusCode() + 1;
      continue;
    }

    const response: ResponseData = {
      executionTime: `${executionTime} ms`,
      status: httpResponse.statusCode,
      body: httpResponse.body,
      rawHeaders: getHeadersAsString(httpResponse.rawHeaders),
      headers: httpResponse.headers,
      json: null,
    };

    const parseError = attemptParse(response, req.expectJson);
    if (parseError) {
      // fail
      process.exitCode = getStatusCode() + 1;
      continue;
    }

    const results = runAllTests(req.tests, response, req.options.stopOnFailure);
    // compare the given tests with the results

    const { capturedVars, captureErrors } = captureVariables(req, response);
    if (captureErrors) {
      // warn
    }
    if (undefs.length > 0) {
      // warn
    }

    // write final message
  }
}
