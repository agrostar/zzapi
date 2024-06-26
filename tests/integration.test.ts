import { RawRequest } from "./utils/requestUtils";

import { callRequests } from "./callRequests";

// test("execute simple-get GOT request", async () => {
//   const response = await executeGotRequest(got("https://postman-echo.com/get", { method: "GET" }));
//   expect(response.byteLength).toBeGreaterThan(0);
//   expect(response.executionTime).toBeGreaterThan(0);
//   expect(response.error.length).toBeLessThan(1);
// });

test("execute auto-tests.zzb in default env", async () => {
  const rawReq = new RawRequest("./tests/bundles/auto-tests.zzb", "default");
  expect(await callRequests(rawReq)).toBe(0);
});
