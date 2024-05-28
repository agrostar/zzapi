import jp from "jsonpath";

import { getStringIfNotScalar, isDict } from "./utils/typeUtils";

import { Tests, ResponseData, TestResult, Assertion } from "./models";
import { mergePrefixBasedTests } from "./mergeData";

export function runAllTests(
  tests: Tests,
  responseData: ResponseData,
  stopOnFailure: boolean
): TestResult[] {
  const results: TestResult[] = [];
  if (!tests) return results;

  if (tests.status) {
    const expected = tests.status;
    const received = responseData.status;
    const statusResults = runTest("status", expected, received);
    results.push(...statusResults);

    if (stopOnFailure && statusResults.some((r) => !r.pass)) return results;
  }

  for (const spec in tests.headers) {
    const expected = tests.headers[spec];
    const received = responseData.headers ? responseData.headers[spec] : "";
    const headerResults = runTest(spec, expected, received);
    results.push(...headerResults);
  }

  for (const spec in tests.json) {
    const expected = tests.json[spec];
    const received = getValueForJSONTests(responseData.json, spec);
    const jsonResults = runTest(spec, expected, received);
    results.push(...jsonResults);
  }

  if (tests.body) {
    const expected = tests.body;
    const received = responseData.body;
    const bodyResults = runTest("body", expected, received);
    results.push(...bodyResults);
  }

  return results;
}

function runTest(spec: string, expected: Assertion, received: any): TestResult[] {
  let results: TestResult[] = [];
  // typeof null is also 'object'
  if (typeof expected !== "object" || expected == null) {
    expected = getStringIfNotScalar(expected);
    received = getStringIfNotScalar(received);
    const pass = expected === received;
    results.push({ pass, expected, received, spec, op: ":" });
  } else {
    results = runObjectTests(expected, received, spec);
  }
  return results;
}

function getValueForJSONTests(responseContent: object, key: string): any {
  try {
    return jp.value(responseContent, key);
  } catch (err: any) {
    if (err !== undefined && err.description !== undefined) {
      return err.description;
    }
    return undefined;
  }
}

function runObjectTests(
  opVals: { [key: string]: any },
  receivedObject: any,
  spec: string
): TestResult[] {
  let results: TestResult[] = [];

  for (const op in opVals) {
    let expected = getStringIfNotScalar(opVals[op]);
    let received = getStringIfNotScalar(receivedObject);

    let pass = false;
    let message = "";
    if (op === "$eq") {
      pass = received === expected;
    } else if (op == "$ne") {
      pass = received !== expected;
    } else if (op === "$lt") {
      pass = received < expected;
    } else if (op === "$gt") {
      pass = receivedObject > expected;
    } else if (op === "$lte") {
      pass = receivedObject <= expected;
    } else if (op === "$gte") {
      pass = receivedObject >= expected;
    } else if (op === "$size") {
      let receivedLen: number | undefined = undefined;
      if (typeof receivedObject === "object") {
        receivedLen = Object.keys(receivedObject).length;
      } else if (typeof receivedObject === "string" || Array.isArray(receivedObject)) {
        receivedLen = receivedObject.length;
      }
      if (typeof expected === "number") {
        pass = receivedLen === expected;
      } else {
        try {
          expected = JSON.parse(expected);
          results.push(...runObjectTests(expected, receivedLen, spec));
          continue;
        } catch (err: any) {
          pass = false;
          message = `$size val is not num or valid JSON`;
        }
      }
    } else if (op === "$exists") {
      const exists = received != undefined;
      pass = exists === expected;
    } else if (op === "$type") {
      const receivedType = getType(receivedObject);
      pass = expected === receivedType;
      received = `${received} (type ${receivedType})`;
    } else if (op === "$regex") {
      const options = opVals["$options"];
      const regex = new RegExp(expected, options);
      try {
        pass = typeof received === "string" && regex.test(received);
      } catch (err: any) {
        message = err.message;
      }
    } else if (op === "$sw") {
      pass = typeof received === "string" && received.startsWith(expected);
    } else if (op === "$ew") {
      pass = typeof received === "string" && received.endsWith(expected);
    } else if (op === "$co") {
      pass = typeof received === "string" && received.includes(expected);
    } else if (op === "$options") {
      continue; // do nothing. $regex will address it.
    } else if (op === "$test") {
      const originalExpected = opVals[op],
        originalReceived = receivedObject;
      if (!isDict(originalExpected)) {
        pass = false;
        message = "recursive tests must be dicts";
      } else {
        mergePrefixBasedTests(originalExpected);
        const res = runAllTests(originalExpected, originalReceived, false);
        results.push(...res);
        continue;
      }
    } else {
      results.push({
        pass: false,
        expected: "one of $eq, $ne etc.",
        received: op,
        op: "",
        spec,
        message: "To compare objects, use $eq",
      });
      continue;
    }
    results.push({ pass, expected, received, spec, op, message });
  }

  return results;
}

function getType(data: any): string {
  if (data === null) {
    return "null";
  } else if (Array.isArray(data)) {
    return "array";
  } else {
    return typeof data;
  }
}
