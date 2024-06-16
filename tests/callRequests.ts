import * as path from "path";

import { RequestSpec, Variables } from "../src/index";
import { getAllRequestSpecs, getRequestSpec } from "../src/index";
import { loadVariables } from "../src/index";

import { RawRequest } from "./utils/requestUtils";
import { getVarFileContents } from "./utils/varUtils";

import { runRequestTests } from "./getResponses";

async function runRequestSpecs(
  requests: { [name: string]: RequestSpec },
  rawRequest: RawRequest,
): Promise<void> {
  for (const name in requests) {
    const request = requests[name];

    const autoHeaders: { [key: string]: string } = { "user-agent": "zzAPI-cli/" + CLI_VERSION };
    if (request.httpRequest.body && typeof request.httpRequest.body == "object")
      autoHeaders["content-type"] = "application/json";

    request.httpRequest.headers = Object.assign(autoHeaders, request.httpRequest.headers);
  }

  await runRequestTests(requests, rawRequest);
}

export async function callRequests(request: RawRequest): Promise<void> {
  try {
    // load the variables
    const env = request.envName;
    const loadedVariables: Variables = loadVariables(
      env,
      request.bundle.bundleContents,
      getVarFileContents(path.dirname(request.bundle.bundlePath)),
    );
    if (env && Object.keys(loadedVariables).length < 1)
      console.log(`warning: no variables added from env: ${env}`);
    request.variables.setLoadedVariables(loadedVariables);
  } catch (err: any) {
    throw err;
  }

  // create the request specs
  const name = request.requestName,
    content = request.bundle.bundleContents;

  let allRequests: { [name: string]: RequestSpec };
  try {
    allRequests = name ? { [name]: getRequestSpec(content, name) } : getAllRequestSpecs(content);
  } catch (err: any) {
    throw err;
  }

  // finally, run the request specs
  await runRequestSpecs(allRequests, request);
}
