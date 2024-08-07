import { RequestSpec, SpecResult, TestResult } from "../src/index";
import { Tests } from "../src/index";

function convertToString(item: any): string {
  if (item === null) return "null";
  if (item === undefined) return "undefined";
  if (typeof item === "object") return JSON.stringify(item);
  return item.toString();
}

function formatTestResult(res: TestResult, spec: string | null, skip?: boolean): string {
  const status =
    (skip || res.pass ? "✓ " : "✗ ") +
    ("test " + spec + " ") +
    (res.op === ":" ? "$eq" : res.op) +
    " " +
    convertToString(res.expected);
  if (res.pass) return status;
  if (skip) return status + " (skipped)";

  return status + " | actual " + res.received + (res.message ? `[${res.message}]` : "");
}

// pass, skipped, total
function getResultData(res: SpecResult): [number, number, number] {
  let passed = 0,
    skipped = 0,
    total = 0;

  const rootResults = res.results;
  if (res.skipped) skipped = rootResults.length;
  else passed = rootResults.filter((r) => r.pass).length;
  total = rootResults.length;

  for (const s of res.subResults) {
    if (res.skipped && !s.skipped)
      throw new Error("root result skipped but sub result not marked as skipped");

    const [subPassed, subSkipped, subTotal] = getResultData(s);
    passed += subPassed;
    skipped += subSkipped;
    total += subTotal;
  }

  return [passed, skipped, total];
}

function allNegative(res: SpecResult, numTests: number): string[] {
  const errors: string[] = [];

  const [passed, _skipped, all] = getResultData(res);
  if (all !== numTests) errors.push(`expected ${numTests} tests, got ${all}\n`);

  if (passed === 0) return errors;

  function getPassingTests(res: SpecResult, spec: string): string[] {
    const passingTests: string[] = [];
    if (res.skipped) return passingTests;

    const rootPassing = res.results.filter((r) => r.pass);
    passingTests.push(...rootPassing.map((r) => formatTestResult(r, spec, false)));

    for (const s of res.subResults) passingTests.push(...getPassingTests(s, spec + " > " + s.spec));

    return passingTests;
  }

  errors.push(...getPassingTests(res, res.spec ?? ""));
  return errors;
}

function allSkipped(res: SpecResult, numTests: number): string[] {
  const errors: string[] = [];
  const [_passed, skipped, all] = getResultData(res);
  if (all !== numTests) errors.push(`expected ${numTests} tests, got ${all}\n`);
  if (skipped === all) return errors;

  function getRanTests(res: SpecResult, spec: string): string[] {
    const nonSkippedTests: string[] = [];
    if (res.skipped) return nonSkippedTests;

    nonSkippedTests.push(...res.results.map((r) => formatTestResult(r, spec, res.skipped)));
    for (const s of res.subResults) nonSkippedTests.push(...getRanTests(s, spec + " > " + s.spec));

    return nonSkippedTests;
  }

  errors.push(...getRanTests(res, res.spec ?? ""));
  return errors;
}

function allPositive(res: SpecResult, numTests: number): string[] {
  const errors: string[] = [];

  const [passed, _skipped, all] = getResultData(res);
  if (all !== numTests) errors.push(`expected ${numTests} tests, got ${all}`);

  if (passed === all) return errors;

  function getFailingTests(res: SpecResult, spec: string | null): string[] {
    const failingTests: string[] = [];
    if (res.skipped) return failingTests;

    const rootFailing = res.results.filter((r) => !r.pass);
    failingTests.push(...rootFailing.map((r) => formatTestResult(r, spec, false)));

    for (const s of res.subResults) failingTests.push(...getFailingTests(s, spec + " > " + s.spec));

    return failingTests;
  }

  errors.push(...getFailingTests(res, res.spec ?? ""));
  return errors;
}

const SKIP_CLAUSE = "$skip";
const TEST_CLAUSE = "$tests";
const NON_TEST_KEYS = ["$options", "$multi", TEST_CLAUSE, SKIP_CLAUSE];

function getNumTests(tests: Tests) {
  let numTests = 0;
  if (tests.body) numTests += 1;
  if (tests.status) numTests += 1;
  if (tests.headers) numTests += Object.keys(tests.headers).length;

  function getNumJSON(json: { [key: string]: any }): number {
    let count = 0;
    for (const key in json) {
      const assertion = json[key];
      if (assertion === null || typeof assertion !== "object") {
        count += 1;
        continue;
      }

      const testKeys = Object.keys(assertion);
      if (testKeys.includes(TEST_CLAUSE)) count += getNumTests(assertion[TEST_CLAUSE]);
      count += testKeys.filter((k) => !NON_TEST_KEYS.includes(k)).length;
    }

    return count;
  }

  if (tests.json) numTests += getNumJSON(tests.json);

  return numTests;
}

export function compareReqAndResp(req: RequestSpec, res: SpecResult) {
  const numTests = getNumTests(req.tests);
  if (req.name.includes("negative")) return allNegative(res, numTests);
  if (req.name.includes("skip")) return allSkipped(res, numTests);
  return allPositive(res, numTests);
}
