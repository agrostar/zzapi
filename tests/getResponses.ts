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
import { getStatusCode } from "./utils/errors";

import { compareReqAndResp } from "./runTests";

function parseBody(response: ResponseData, expectJson?: boolean): string | undefined {
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

const BULLET = "-->";

export async function runRequestTests(
  requests: { [name: string]: RequestSpec },
  rawReq: RawRequest,
): Promise<void> {
  const bundlePath = rawReq.bundle.bundlePath;
  for (const name in requests) {
    let fail: boolean = true;
    let message = `${name}: FAIL`;

    const req: RequestSpec = requests[name];
    const undefs = replaceVariablesInRequest(req, rawReq.variables.getAllVariables());

    const httpRequest = constructGotRequest(req);
    const {
      response: httpResponse,
      executionTime,
      byteLength: size,
      error,
    } = await executeGotRequest(httpRequest);

    if (error) {
      message += `\n${BULLET} error executing request: ${error}`;
      console.log(message + "\n");
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

    const parseError = parseBody(response, req.expectJson);
    if (parseError) {
      message += `\n${BULLET} unable to parse body: ${parseError}`;
      console.log(message + "\n");
      process.exitCode = getStatusCode() + 1;
      continue;
    }

    const results = runAllTests(req.tests, response, req.options.stopOnFailure);
    const errors = compareReqAndResp(req, results);
    if (errors.length > 0) {
      process.exitCode = getStatusCode() + errors.length;

      message = [message, ...errors].join(`\n${BULLET} `);
    } else {
      fail = false;
    }

    const { capturedVars, captureErrors } = captureVariables(req, response);
    rawReq.variables.mergeCapturedVariables(capturedVars);
    if (captureErrors) message = message + "\nWARNING: " + captureErrors;

    if (undefs.length > 0) message = message + "\nWARNING: undefined vars - " + undefs.join(",");

    if (fail) console.log(message + "\n");
  }
}
