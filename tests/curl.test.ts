import * as fs from "fs";
import util from "util";
import { exec } from "child_process";

import { getCurlRequest, getRequestSpec } from "../src/index";

const execPromise = util.promisify(exec);

test("execute simple-get cURL", async () => {
  const content = fs.readFileSync("./tests/bundles/auto-tests.zzb", "utf-8");
  const requestName = "simple-get-positive";
  const request = getRequestSpec(content, requestName);

  const curlReq = getCurlRequest(request);

  const { stdout, stderr } = await execPromise(curlReq);

  const response = JSON.parse(stdout);
  expect(response.url).toBe("https://postman-echo.com/get");
});

test("execute post-header-merge cURL", async () => {
  const content = fs.readFileSync("./tests/bundles/auto-tests.zzb", "utf-8");
  const requestName = "post-header-merge-positive";
  const request = getRequestSpec(content, requestName);

  const curlReq = getCurlRequest(request);

  const { stdout, stderr } = await execPromise(curlReq);

  const response = JSON.parse(stdout);
  expect(response.url).toBe("https://postman-echo.com/post");
  expect(response.headers["x-custom-header"]).toBe("Custom Value");
  expect(response.json["foo1"]).toBe("bar1");
});
