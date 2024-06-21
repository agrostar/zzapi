import jp from "jsonpath";

import { getStringIfNotScalar, isDict } from "./utils/typeUtils";

import { Tests, ResponseData, Assertion, SpecResult, TestResult } from "./models";
import { mergePrefixBasedTests } from "./mergeData";

function hasFailure(res: SpecResult): boolean {
  return res.results.some((r) => !r.pass) || res.subResults.some(hasFailure);
}

export function runAllTests(
  tests: Tests,
  responseData: ResponseData,
  stopOnFailure: boolean,
  rootSpec: string | null = null,
  skip?: boolean,
): SpecResult {
  const res: SpecResult = { spec: rootSpec, results: [], subResults: [] };
  if (!tests) return res;

  if (tests.status) {
    const expected = tests.status;
    const received = responseData.status;
    const statusResults = runTest("status", expected, received, skip);

    res.subResults.push(statusResults);
  }
  if (stopOnFailure && hasFailure(res)) return res;

  for (const spec in tests.headers) {
    const expected = tests.headers[spec];
    const received = responseData.headers ? responseData.headers[spec] : "";
    const headerResults = runTest(spec, expected, received, skip);

    res.subResults.push(headerResults);
  }

  for (const spec in tests.json) {
    let expected = tests.json[spec],
      received;
    try {
      received = getValueForJSONTests(responseData.json, spec);
    } catch (err: any) {
      res.subResults.push({
        spec,
        skipped: skip || (typeof expected === "object" && expected !== null && expected["$skip"]),
        results: [{ pass: false, expected, received: "", op: spec, message: err }],
        subResults: [],
      });
      continue;
    }

    const jsonResults = runTest(spec, expected, received, skip);
    res.subResults.push(jsonResults);
  }

  if (tests.body) {
    const expected = tests.body;
    const received = responseData.body;
    const bodyResults = runTest("body", expected, received, skip);

    res.subResults.push(bodyResults);
  }

  return res;
}

function runTest(spec: string, expected: Assertion, received: any, skip?: boolean): SpecResult {
  // typeof null is also 'object'
  if (expected !== null && typeof expected === "object")
    return runObjectTests(expected, received, spec, skip);

  expected = getStringIfNotScalar(expected);
  received = getStringIfNotScalar(received);
  const pass = expected === received;

  return { spec, skipped: skip, results: [{ pass, expected, received, op: ":" }], subResults: [] };
}

function getValueForJSONTests(responseContent: object, key: string): any {
  try {
    return jp.value(responseContent, key);
  } catch (err: any) {
    throw new Error(`Error while evaluating JSONPath ${key}: ${err.description || err.message || err}`);
  }
}

const SKIP_CLAUSE = "$skip",
  OPTIONS_CLAUSE = "$options";

function runObjectTests(
  opVals: { [key: string]: any },
  receivedObject: any,
  spec: string,
  skip?: boolean,
): SpecResult {
  let objRes: SpecResult = { spec, results: [], subResults: [] };
  if (skip || opVals[SKIP_CLAUSE]) objRes.skipped = true;

  for (const op in opVals) {
    let expected: Exclude<any, object> = getStringIfNotScalar(opVals[op]);
    let received: Exclude<any, object> = getStringIfNotScalar(receivedObject);

    let pass = false;
    let message = "";
    if (op === "$eq") {
      pass = received === expected;
    } else if (op === "$ne") {
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
      const res: SpecResult = testSize(opVals[op], receivedObject, spec, op);
      objRes.results.push(...res.results);
      objRes.subResults.push(...res.subResults);
      continue;
    } else if (op === "$exists") {
      const exists = received !== undefined;
      pass = exists === expected;
    } else if (op === "$type") {
      const receivedType = getType(receivedObject);
      pass = expected === receivedType;
      received = `${received} (type ${receivedType})`;
    } else if (op === "$regex") {
      const options = opVals[OPTIONS_CLAUSE];
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
    } else if (op === OPTIONS_CLAUSE) {
      continue; // do nothing. $regex will address it.
    } else if (op === "$tests") {
      const res: SpecResult = testRecursiveTests(
        opVals[op],
        receivedObject,
        spec,
        op,
        objRes.skipped ?? false,
      );
      objRes.results.push(...res.results);
      objRes.subResults.push(...res.subResults);
      continue;
    } else if (op === SKIP_CLAUSE) {
      continue; // do nothing. If it wasn't already addressed, that means the test is not to be skipped.
    } else {
      objRes.results.push({
        pass: false,
        expected: "one of $eq, $ne etc.",
        received: op,
        op: "",
        message: "To compare objects, use $eq",
      });
      continue;
    }
    objRes.results.push({ pass, expected, received, op, message });
  }

  return objRes;
}

function testSize(expectedObject: any, receivedObject: any, spec: string, op: string): SpecResult {
  const res: SpecResult = { spec, results: [], subResults: [] };

  const receivedLen: number | undefined =
    typeof receivedObject === "object" && receivedObject !== null
      ? Object.keys(receivedObject).length
      : typeof receivedObject === "string" || Array.isArray(receivedObject)
        ? receivedObject.length
        : undefined;

  const received: Exclude<any, object> = getStringIfNotScalar(receivedObject);
  const expected: Exclude<any, object> = getStringIfNotScalar(expectedObject);

  if (typeof expectedObject === "number") {
    const compResult: TestResult = {
      pass: expected === receivedLen,
      op: op,
      expected: expected,
      received: received,
    };
    res.results.push(compResult);

    return res;
  }

  if (isDict(expectedObject)) {
    // the spec remains the same, so we add it to the current layer
    const compRes: SpecResult = runObjectTests(expectedObject, receivedLen, spec);
    res.results.push(...compRes.results);
    res.subResults.push(...compRes.subResults);

    return res;
  }

  const compResult: TestResult = {
    pass: false,
    op: op,
    expected: expected,
    received: received,
    message: "value for $size is not a number or valid JSON",
  };
  res.results.push(compResult);

  return res;
}

function testRecursiveTests(
  expectedObject: any,
  receivedObject: any,
  spec: string,
  op: string,
  skip: boolean,
): SpecResult {
  const res: SpecResult = { spec, results: [], subResults: [] };

  const expected: Exclude<any, object> = getStringIfNotScalar(expectedObject);
  const received: Exclude<any, object> = getStringIfNotScalar(receivedObject);

  const recursiveTests = expectedObject;
  if (!isDict(recursiveTests)) {
    const compResult: TestResult = {
      pass: false,
      op: op,
      expected: expected,
      received: received,
      message: "recursive tests must be dicts",
    };
    res.results.push(compResult);

    return res;
  }

  mergePrefixBasedTests(recursiveTests);

  // the spec remains the same, so we add it to the current layer
  const compRes = runObjectTests(recursiveTests.json, receivedObject, spec, skip);
  res.results.push(...compRes.results);
  res.subResults.push(...compRes.subResults);

  return res;
}

function getType(data: any): string {
  if (data === null) return "null";
  if (Array.isArray(data)) return "array";
  return typeof data;
}
