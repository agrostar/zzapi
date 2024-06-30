import { RawRequest } from "./utils/requestUtils";

import { callRequests } from "./callRequests";

test("execute auto-tests.zzb in default env", async () => {
  const rawReq = new RawRequest("./tests/bundles/auto-tests.zzb", "default");
  expect(await callRequests(rawReq)).toBe(0);
});

test("execute auto-negative-schema.zzb in default env", async () => {
  const rawReq = new RawRequest("./tests/bundles/auto-negative-schema.zzb", "default");
  expect(await callRequests(rawReq)).toBe(0);
});
