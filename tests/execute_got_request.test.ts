import got from "got";

import { executeGotRequest } from "../src";

test("execute simple-get GOT request", async () => {
  const response = await executeGotRequest(got("https://postman-echo.com/get", { method: "GET" }));
  expect(response.byteLength).toBeGreaterThan(0);
  expect(response.executionTime).toBeGreaterThan(0);
  expect(response.error.length).toBeLessThan(1);
});
