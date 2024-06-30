import jp from "jsonpath";

import { getStringIfNotScalar, isDict } from "./utils/typeUtils";

import { Tests, ResponseData, Assertion, SpecResult, TestResult } from "./models";
import { mergePrefixBasedTests } from "./mergeData";

const SKIP_CLAUSE = "skip",
  OPTIONS_CLAUSE = "options",
  MULTI_CLAUSE = "multi";

function hasFailure(res: SpecResult): boolean {
  return res.results.some((r) => !r.pass) || res.subResults.some(hasFailure);
}

export function runAllTests(
  tests: Tests,
  responseData: ResponseData,
  stopOnFailure: boolean,
  rootSpec: string | null = null,
  skip?: boolean
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

  res.subResults.push(...runJsonTests(tests.json, responseData.json, skip));

  if (tests.body) {
    const expected = tests.body;
    const received = responseData.body;
    const bodyResults = runTest("body", expected, received, skip);

    res.subResults.push(bodyResults);
  }

  return res;
}

function runJsonTests(tests: { [key: string]: Assertion }, jsonData: any, skip?: boolean): SpecResult[] {
  const results: SpecResult[] = [];

  for (const spec in tests) {
    const expected = tests[spec];
    let received;
    try {
      received = getValueForJSONTests(
        jsonData,
        spec,
        typeof expected === "object" && expected !== null && expected[MULTI_CLAUSE]
      );
    } catch (err: any) {
      results.push({
        spec,
        skipped: skip || (typeof expected === "object" && expected !== null && expected[SKIP_CLAUSE]),
        results: [{ pass: false, expected, received: "", op: spec, message: err }],
        subResults: [],
      });
      continue;
    }

    const jsonResults = runTest(spec, expected, received, skip);
    results.push(jsonResults);
  }

  return results;
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

function getValueForJSONTests(responseContent: object, key: string, multi?: boolean): any {
  try {
    return multi ? jp.query(responseContent, key) : jp.value(responseContent, key);
  } catch (err: any) {
    throw new Error(`Error while evaluating JSONPath ${key}: ${err.description || err.message || err}`);
  }
}

function getType(data: any): string {
  if (data === null) return "null";
  if (Array.isArray(data)) return "array";
  return typeof data;
}

const tests: {
  [name: string]: (
    expectedObj: any,
    receivedObj: any,
    spec: string,
    op: string,
    options: { [key: string]: any }
  ) => SpecResult;
} = {
  $eq: function (expectedObj, receivedObj, spec, op, options): SpecResult {
    const received: Exclude<any, object> = getStringIfNotScalar(receivedObj),
      expected: Exclude<any, object> = getStringIfNotScalar(expectedObj);
    return {
      spec,
      subResults: [],
      results: [{ pass: received === expected, expected, received, op }],
    };
  },
  $ne: function (expectedObj, receivedObj, spec, op, options): SpecResult {
    const received: Exclude<any, object> = getStringIfNotScalar(receivedObj),
      expected: Exclude<any, object> = getStringIfNotScalar(expectedObj);
    return {
      spec,
      subResults: [],
      results: [{ pass: received !== expected, expected, received, op }],
    };
  },
  $gt: function (expectedObj, receivedObj, spec, op, options): SpecResult {
    const received: Exclude<any, object> = getStringIfNotScalar(receivedObj),
      expected: Exclude<any, object> = getStringIfNotScalar(expectedObj);
    return {
      spec,
      subResults: [],
      results: [{ pass: received > expected, expected, received, op }],
    };
  },
  $lt: function (expectedObj, receivedObj, spec, op, options): SpecResult {
    const received: Exclude<any, object> = getStringIfNotScalar(receivedObj),
      expected: Exclude<any, object> = getStringIfNotScalar(expectedObj);
    return {
      spec,
      subResults: [],
      results: [{ pass: received < expected, expected, received, op }],
    };
  },
  $lte: function (expectedObj, receivedObj, spec, op, options): SpecResult {
    const received: Exclude<any, object> = getStringIfNotScalar(receivedObj),
      expected: Exclude<any, object> = getStringIfNotScalar(expectedObj);
    return {
      spec,
      subResults: [],
      results: [{ pass: received <= expected, expected, received, op }],
    };
  },
  $gte: function (expectedObj, receivedObj, spec, op, options): SpecResult {
    const received: Exclude<any, object> = getStringIfNotScalar(receivedObj),
      expected: Exclude<any, object> = getStringIfNotScalar(expectedObj);
    return {
      spec,
      subResults: [],
      results: [{ pass: received >= expected, expected, received, op }],
    };
  },
  $size: function (expectedObj, receivedObj, spec, op, options): SpecResult {
    const res: SpecResult = { spec, results: [], subResults: [] };

    const receivedLen: number | undefined =
      typeof receivedObj === "object" && receivedObj !== null
        ? Object.keys(receivedObj).length
        : typeof receivedObj === "string" || Array.isArray(receivedObj)
        ? receivedObj.length
        : undefined;

    const received: Exclude<any, object> = getStringIfNotScalar(receivedObj);
    const expected: Exclude<any, object> = getStringIfNotScalar(expectedObj);

    if (typeof expectedObj === "number") {
      const compResult: TestResult = {
        pass: expected === receivedLen,
        op: op,
        expected: expected,
        received: `(length: ${receivedLen}) -> ${received}`,
      };
      res.results.push(compResult);

      return res;
    }

    if (isDict(expectedObj)) {
      // the spec remains the same, so we add it to the current layer
      const compRes: SpecResult = runObjectTests(expectedObj, receivedLen, spec);
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
  },
  $exists: function (expectedObj, receivedObj, spec, op, options): SpecResult {
    const received: Exclude<any, object> = getStringIfNotScalar(receivedObj),
      expected: Exclude<any, object> = getStringIfNotScalar(expectedObj);
    const exists = received !== undefined;
    return {
      spec,
      subResults: [],
      results: [{ pass: exists === expected, expected, received, op }],
    };
  },
  $type: function (expectedObj, receivedObj, spec, op, options): SpecResult {
    const receivedType = getType(receivedObj);
    const receivedStr: string = `${getStringIfNotScalar(receivedObj)} (type ${receivedType})`;
    const expected: Exclude<any, object> = getStringIfNotScalar(expectedObj);
    return {
      spec,
      subResults: [],
      results: [{ pass: expected === receivedType, expected, received: receivedStr, op }],
    };
  },
  $regex: function (expectedObj, receivedObj, spec, op, options): SpecResult {
    const received: Exclude<any, object> = getStringIfNotScalar(receivedObj),
      expected: Exclude<any, object> = getStringIfNotScalar(expectedObj);

    const regexOpts = options[OPTIONS_CLAUSE];
    const regex = new RegExp(expected, regexOpts);
    let pass: boolean = false,
      message: string = "";
    try {
      pass = typeof received === "string" && regex.test(received);
    } catch (err: any) {
      message = err.message;
    }

    return {
      spec,
      subResults: [],
      results: [{ pass, expected, received, op, message }],
    };
  },
  $sw: function (expectedObj, receivedObj, spec, op, options): SpecResult {
    const received: Exclude<any, object> = getStringIfNotScalar(receivedObj),
      expected: Exclude<any, object> = getStringIfNotScalar(expectedObj);
    return {
      spec,
      subResults: [],
      results: [
        { pass: typeof received === "string" && received.startsWith(expected), expected, received, op },
      ],
    };
  },
  $ew: function (expectedObj, receivedObj, spec, op, options): SpecResult {
    const received: Exclude<any, object> = getStringIfNotScalar(receivedObj),
      expected: Exclude<any, object> = getStringIfNotScalar(expectedObj);
    return {
      spec,
      subResults: [],
      results: [
        { pass: typeof received === "string" && received.endsWith(expected), expected, received, op },
      ],
    };
  },
  $co: function (expectedObj, receivedObj, spec, op, options): SpecResult {
    const received: Exclude<any, object> = getStringIfNotScalar(receivedObj),
      expected: Exclude<any, object> = getStringIfNotScalar(expectedObj);
    return {
      spec,
      subResults: [],
      results: [
        { pass: typeof received === "string" && received.includes(expected), expected, received, op },
      ],
    };
  },
  [OPTIONS_CLAUSE]: function (expectedObj, receivedObj, spec, op, options): SpecResult {
    return {
      spec,
      subResults: [],
      results: [],
    };
  },
  [SKIP_CLAUSE]: function (expectedObj, receivedObj, spec, op, options): SpecResult {
    return {
      spec,
      subResults: [],
      results: [],
    };
  },
  [MULTI_CLAUSE]: function (expectedObj, receivedObj, spec, op, options): SpecResult {
    return {
      spec,
      subResults: [],
      results: [],
    };
  },
  $tests: function (expectedObj, receivedObj, spec, op, options): SpecResult {
    const res: SpecResult = { spec, results: [], subResults: [] };

    const expected: Exclude<any, object> = getStringIfNotScalar(expectedObj);
    const received: Exclude<any, object> = getStringIfNotScalar(receivedObj);

    const recursiveTests = expectedObj;
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
    const compRes = runJsonTests(recursiveTests.json, receivedObj, options[SKIP_CLAUSE]);
    res.subResults.push(...compRes);

    return res;
  },
};

export function runObjectTests(
  opVals: { [key: string]: any },
  receivedObject: any,
  spec: string,
  skip?: boolean
): SpecResult {
  const objRes: SpecResult = {
    spec,
    results: [],
    subResults: [],
    skipped: skip || opVals[SKIP_CLAUSE],
  };

  const options: { [key: string]: any } = {
    [OPTIONS_CLAUSE]: opVals[OPTIONS_CLAUSE],
    [SKIP_CLAUSE]: objRes.skipped,
  };

  const testNames = Object.keys(tests);
  for (const op in opVals) {
    if (testNames.includes(op)) {
      const res: SpecResult = tests[op](opVals[op], receivedObject, spec, op, options);
      objRes.results.push(...res.results);
      objRes.subResults.push(...res.subResults);
    } else {
      objRes.results.push({
        pass: false,
        expected: `one of ${testNames.join(", ")}`,
        received: op,
        op: "",
        message: "Note: use $eq to compare objects",
      });
    }
  }

  return objRes;
}
