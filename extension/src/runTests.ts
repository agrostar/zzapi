import jp from "jsonpath";
import * as vscode from "vscode";
import * as YAML from "yaml";

export async function runAllTests(tests: any, responseData: any) {
    if (tests === undefined) {
        return;
    }

    let results = "";
    for (const test in tests) {
        if (tests.hasOwnProperty(test)) {
            if (test === "json") {
                results += runJSONTests(
                    tests.json,
                    JSON.parse(responseData.body)
                );
            } else if (test === "headers") {
                const headers = YAML.parse(responseData.headers);

                const headerTests = tests[test];
                for (const headerTest in headerTests) {
                    if (headerTests.hasOwnProperty(headerTest)) {
                        let required = headerTests[headerTest];
                        let received = headers[headerTest];

                        if (typeof required !== "object") {
                            if (received === required) {
                                results += `${test} : ${required} test PASSED\n`;
                            } else {
                                results += `${test} : ${required} test FAILED received ${received}\n`;
                            }
                        } else {
                            results += runObjectTests(required, received, test);
                        }
                    }
                }
            } else {
                const required = tests[test];
                const received = responseData[test];

                if (typeof required !== "object") {
                    if (received === required) {
                        results += `${test} : ${required} test PASSED\n`;
                    } else {
                        results += `${test} : ${required} test FAILED received ${received}\n`;
                    }
                } else {
                    results += runObjectTests(required, received, test);
                }
            }
        }
    }

    vscode.commands.executeCommand("workbench.action.newGroupBelow");
    await openDocument(results);
}

function runJSONTests(jsonTests: any, responseContent: object) {
    let testResult = "";
    for (const key in jsonTests) {
        if (jsonTests.hasOwnProperty(key)) {
            const required = jsonTests[key];

            let received = jp.value(responseContent, key);

            if (typeof required !== "object") {
                if (received === required) {
                    testResult += `${key} : ${required} test PASSED\n`;
                } else {
                    testResult += `${key} : ${required} test FAILED received ${received}\n`;
                }
            } else {
                testResult += runObjectTests(required, received, key);
            }
        }
    }

    return testResult;
}

//if RHS is an object
function runObjectTests(required: any, received: any, keyName: string) {
    let testResult = "";
    for (const key in required) {
        if (required.hasOwnProperty(key)) {
            let compareTo = required[key];
            if (key === "$eq") {
                if (Array.isArray(compareTo)) {
                    compareTo = compareTo.toString();
                } else if (typeof compareTo === "object") {
                    compareTo = JSON.stringify(compareTo);
                }

                if (received === compareTo) {
                    testResult += `${keyName} $eq ${compareTo} test PASSED\n`;
                } else {
                    testResult += `${keyName} $eq ${compareTo} test FAILED received ${received}\n`;
                }
            } else if (key === "$ne") {
                if (Array.isArray(compareTo)) {
                    compareTo = compareTo.toString();
                } else if (typeof compareTo === "object") {
                    compareTo = JSON.stringify(compareTo);
                }

                if (received !== compareTo) {
                    testResult += `${keyName} $ne ${compareTo} test PASSED\n`;
                } else {
                    testResult += `${keyName} $ne ${compareTo} test FAILED received ${received}\n`;
                }
            } else if (key === "$lt") {
                if (
                    canBeNumber(received) &&
                    canBeNumber(compareTo) &&
                    parseFloat(received) < parseFloat(compareTo)
                ) {
                    testResult += `${keyName} $lt ${compareTo} test PASSED\n`;
                } else {
                    testResult += `${keyName} $lt ${compareTo} test FAILED received ${received}\n`;
                }
            } else if (key === "$gt") {
                if (
                    canBeNumber(received) &&
                    canBeNumber(compareTo) &&
                    parseFloat(received) > parseFloat(compareTo)
                ) {
                    testResult += `${keyName} $gt ${compareTo} test PASSED\n`;
                } else {
                    testResult += `${keyName} $gt ${compareTo} test FAILED received ${received}\n`;
                }
            } else if (key === "$lte") {
                if (
                    canBeNumber(received) &&
                    canBeNumber(compareTo) &&
                    parseFloat(received) <= parseFloat(compareTo)
                ) {
                    testResult += `${keyName} $lte ${compareTo} test PASSED\n`;
                } else {
                    testResult += `${keyName} $lte ${compareTo} test FAILED received ${received}\n`;
                }
            } else if (key === "$gte") {
                if (
                    canBeNumber(received) &&
                    canBeNumber(compareTo) &&
                    parseFloat(received) >= parseFloat(compareTo)
                ) {
                    testResult += `${keyName} $gte ${compareTo} test PASSED\n`;
                } else {
                    testResult += `${keyName} $gte ${compareTo} test FAILED received ${received}\n`;
                }
            } else if (key === "$size") {
                let receivedLen: number;
                if (typeof received === "object") {
                    receivedLen = Object.keys(received).length;
                } else if (
                    typeof received === "string" ||
                    Array.isArray(received)
                ) {
                    receivedLen = received.length;
                } else {
                    receivedLen = 0;
                }

                if (
                    canBeNumber(required) &&
                    receivedLen === parseInt(compareTo)
                ) {
                    testResult += `${keyName} $size ${compareTo} test PASSED\n`;
                } else {
                    testResult += `${keyName} $size ${compareTo} test FAILED received ${received}\n`;
                }
            } else if (key === "$exists") {
                if (received !== undefined) {
                    testResult += `${keyName} $exists ${compareTo} test PASSED\n`;
                } else {
                    testResult += `${keyName} $exists ${compareTo} test FAILED received ${received}\n`;
                }
            } else if (key === "$type") {
                if (typeof received === compareTo) {
                    testResult += `${keyName} $type ${compareTo} test PASSED\n`;
                } else {
                    testResult += `${keyName} $type ${compareTo} test FAILED received ${received}\n`;
                }
            }
        }
    }

    return testResult;
}

function canBeNumber(input: any): boolean {
    if (Array.isArray(input)) {
        return false;
    } else if (typeof input === "object") {
        return false;
    }

    return /^[+-]?\d+(\.\d+)?$/.test(input);
}

async function openDocument(content: string) {
    await vscode.workspace
        .openTextDocument({ content: content })
        .then((document) => {
            vscode.window.showTextDocument(document, {
                preserveFocus: false,
            });
        });
}

// commands.executeCommand("workbench.action.newGroupBelow");
