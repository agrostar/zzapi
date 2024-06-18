import got from "got";

import { executeGotRequest } from "../src";
import { RawRequest } from "./utils/requestUtils";
import { callRequests } from "./callRequests";
import { getStatusCode } from "./utils/errors";

// test("execute simple-get GOT request", async () => {
//   const response = await executeGotRequest(got("https://postman-echo.com/get", { method: "GET" }));
//   expect(response.byteLength).toBeGreaterThan(0);
//   expect(response.executionTime).toBeGreaterThan(0);
//   expect(response.error.length).toBeLessThan(1);
// });

test("execute tests-bundle.zzb run", async () => {
  const rawReq = new RawRequest("./examples/auto-tests.zzb", "default");
  await callRequests(rawReq);
  expect(getStatusCode()).toBe(0);
});
