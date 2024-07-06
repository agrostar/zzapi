import * as fs from "fs";
import util from "util";
import { exec } from "child_process";

import { getCurlRequest, getRequestSpec } from "../src/index";

const execPromise = util.promisify(exec);

async function runCurlRequest(
  bundlePath: string,
  requestName: string,
): Promise<{ stdout: string; stderr: string }> {
  const content = fs.readFileSync(bundlePath, "utf-8");
  const request = getRequestSpec(content, requestName);

  const curlReq = getCurlRequest(request);

  return await execPromise(curlReq);
}

test("execute simple-get cURL", async () => {
  const { stdout, stderr } = await runCurlRequest(
    "./tests/bundles/auto-tests.zzb",
    "simple-get-positive",
  );

  const response = JSON.parse(stdout);
  expect(response.url).toBe("https://postman-echo.com/get");
});

test("execute post-header-merge cURL", async () => {
  const { stdout, stderr } = await runCurlRequest(
    "./tests/bundles/auto-tests.zzb",
    "post-header-merge-positive",
  );

  const response = JSON.parse(stdout);
  expect(response.url).toBe("https://postman-echo.com/post");
  expect(response.headers["x-custom-header"]).toBe("Custom Value");
  expect(response.json["foo1"]).toBe("bar1");
});
