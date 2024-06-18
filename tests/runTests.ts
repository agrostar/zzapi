import { RequestSpec, SpecResult, TestResult } from "../src/index";
import { Tests } from "../src/index";

function formatTestResult(res: TestResult, spec: string, skip?: boolean): string {
  const status =
    (skip || res.pass ? "✓ " : "✗ ") +
    ("test " + spec + " ") +
    (res.op === ":" ? "$eq" : res.op) +
    " " +
    res.expected;
    if (res.pass) return status;
    if (skip) return status + " (skipped)";
    
    return status + " | actual " + res.received;
}

function getResultData(res: SpecResult): [number, number] {
  if (res.skipped) return [0, 0];

  const rootResults = res.results;
  let passed = rootResults.filter((r) => r.pass).length;
  let all = rootResults.length;

  for (const s of res.subResults) {
    const [subPassed, subAll] = getResultData(s);
    passed += subPassed;
    all += subAll;
  }

  return [passed, all];
}

function allNegative(res: SpecResult, numTests: number): string[] {
    const errors: string[] = [];
    
    const [passed, all] = getResultData(res);
    if (all !== numTests) errors.push(`expected ${numTests} tests, got ${all}\n`);
    
    if (passed === 0) return errors;
    
    function getPassingTests(res: SpecResult, spec: string): string[] {
        const passingTests: string[] = [];
        if (res.skipped) return passingTests;
    
        const rootPassing = res.results.filter((r) => r.pass);
        passingTests.push(...rootPassing.map((r) => formatTestResult(r, spec, false)));
    
        spec += " > " + res.spec ?? "";
        for (const s of res.subResults) 
        passingTests.push(...getPassingTests(s, spec));
    
        return passingTests;    
    }
    
    errors.push(...getPassingTests(res, res.spec ?? ""));
    return errors;
}

function allPositive(res: SpecResult, numTests: number): string[] {
  const errors: string[] = [];

  const [passed, all] = getResultData(res);
  if (all !== numTests) errors.push(`expected ${numTests} tests, got ${all}`);

  if (passed === all) return errors;

  function getFailingTests(res: SpecResult, spec: string): string[] {
    const failingTests: string[] = [];
    if (res.skipped) return failingTests;

    const rootFailing = res.results.filter((r) => !r.pass);
    failingTests.push(...rootFailing.map((r) => formatTestResult(r, spec, false)));

    spec += " > " + res.spec ?? "";
    for (const s of res.subResults) 
      failingTests.push(...getFailingTests(s, spec));

    return failingTests;    
  }

  errors.push(...getFailingTests(res, res.spec ?? ""));
  return errors;
}

function getNumTests(tests: Tests) {
    let numTests = 0;
    if (tests.body) numTests += 1;
    if(tests.status) numTests += 1;
    if (tests.headers) 
        numTests += Object.keys(tests.headers).length;
    if (tests.json) numTests += Object.keys(tests.json).length;

    return numTests;
    
}

export function compareReqAndResp(req: RequestSpec, res: SpecResult) {
    const numTests = getNumTests(req.tests);
    if (req.name.includes("positive"))
        return allPositive(res, numTests);
    else if (req.name.includes("negative"))
        return allNegative(res, numTests);

    return ["not a valid test type for automated tests"];
}
