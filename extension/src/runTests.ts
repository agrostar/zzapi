import jp from "jsonpath";
import * as YAML from "yaml";
import { getOutputChannel } from "./extension";
import { OutputChannel } from "vscode";

let outputChannel: OutputChannel;
const spaceBetweenTestAndStatus = "\t";
const fail = "❌FAILED";
const pass = "✅PASSED";

export async function runAllTests(name: string, tests: any, responseData: any) {
    if (tests === undefined) {
        return;
    }

    outputChannel = getOutputChannel();
    outputChannel.appendLine("--------------------------------------");
    outputChannel.appendLine(`Running Request '${name}'\n`);
    for (const test in tests) {
        if (tests.hasOwnProperty(test)) {
            if (test === "json") {
                runJSONTests(tests.json, JSON.parse(responseData.body));
            } else if (test === "headers") {
                const headers = YAML.parse(responseData.headers);

                outputChannel.appendLine("Headers");
                const headerTests = tests[test];
                for (const headerTest in headerTests) {
                    if (headerTests.hasOwnProperty(headerTest)) {
                        let required = headerTests[headerTest];
                        let received = headers[headerTest];

                        if (typeof required !== "object") {
                            if (received === required) {
                                outputChannel.appendLine(
                                    `\t${pass} ${spaceBetweenTestAndStatus} ${headerTest} : ${required}`
                                );
                            } else {
                                outputChannel.appendLine(
                                    `\t${fail} ${spaceBetweenTestAndStatus} ${headerTest} : ${required} \t Received ${received}`
                                );
                            }
                        } else {
                            runObjectTests(required, received, test);
                        }
                    }
                }
            } else {
                const required = tests[test];
                const received = responseData[test];

                if (typeof required !== "object") {
                    if (received === required) {
                        outputChannel.appendLine(
                            `${pass} ${spaceBetweenTestAndStatus} ${test} : ${required}`
                        );
                    } else {
                        outputChannel.appendLine(
                            `${fail} ${spaceBetweenTestAndStatus} ${test} : ${required} \t Received ${received}`
                        );
                    }
                } else {
                    runObjectTests(required, received, test);
                }
            }
        }
    }

    outputChannel.appendLine("--------------------------------------");
    outputChannel.show();
}

function runJSONTests(jsonTests: any, responseContent: object) {
    let testResult = "";
    outputChannel.appendLine("JSON:");
    for (const key in jsonTests) {
        if (jsonTests.hasOwnProperty(key)) {
            const required = jsonTests[key];

            let received = jp.value(responseContent, key);

            if (typeof required !== "object") {
                if (received === required) {
                    outputChannel.appendLine(
                        `\t${pass} ${spaceBetweenTestAndStatus} ${key} : ${required}`
                    );
                } else {
                    outputChannel.appendLine(
                        `\t${fail} ${spaceBetweenTestAndStatus} ${key} : ${required} \t Received ${received}`
                    );
                }
            } else {
                runObjectTests(required, received, key);
            }
        }
    }

    return testResult;
}

//if RHS is an object
function runObjectTests(required: any, received: any, keyName: string) {
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
                    outputChannel.appendLine(
                        `\t${pass} ${spaceBetweenTestAndStatus} ${keyName} == ${compareTo} `
                    );
                } else {
                    outputChannel.appendLine(
                        `\t${fail} ${spaceBetweenTestAndStatus} ${keyName} == ${compareTo} \t Received ${received}`
                    );
                }
            } else if (key === "$ne") {
                if (Array.isArray(compareTo)) {
                    compareTo = compareTo.toString();
                } else if (typeof compareTo === "object") {
                    compareTo = JSON.stringify(compareTo);
                }

                if (received !== compareTo) {
                    outputChannel.appendLine(
                        `\t${pass} ${spaceBetweenTestAndStatus} ${keyName} != ${compareTo} `
                    );
                } else {
                    outputChannel.appendLine(
                        `\t${fail} ${spaceBetweenTestAndStatus} ${keyName} != ${compareTo} \t Received ${received}`
                    );
                }
            } else if (key === "$lt") {
                if (
                    canBeNumber(received) &&
                    canBeNumber(compareTo) &&
                    parseFloat(received) < parseFloat(compareTo)
                ) {
                    outputChannel.appendLine(
                        `\t${pass} ${spaceBetweenTestAndStatus} ${keyName} < ${compareTo} `
                    );
                } else {
                    outputChannel.appendLine(
                        `\t${fail} ${spaceBetweenTestAndStatus} ${keyName} < ${compareTo} \t Received ${received}`
                    );
                }
            } else if (key === "$gt") {
                if (
                    canBeNumber(received) &&
                    canBeNumber(compareTo) &&
                    parseFloat(received) > parseFloat(compareTo)
                ) {
                    outputChannel.appendLine(
                        `\t${pass} ${spaceBetweenTestAndStatus} ${keyName} > ${compareTo}  `
                    );
                } else {
                    outputChannel.appendLine(
                        `\t${fail} ${spaceBetweenTestAndStatus} ${keyName} > ${compareTo} \t Received ${received}`
                    );
                }
            } else if (key === "$lte") {
                if (
                    canBeNumber(received) &&
                    canBeNumber(compareTo) &&
                    parseFloat(received) <= parseFloat(compareTo)
                ) {
                    outputChannel.appendLine(
                        `\t${pass} ${spaceBetweenTestAndStatus} ${keyName} <= ${compareTo}  `
                    );
                } else {
                    outputChannel.appendLine(
                        `\t${fail} ${spaceBetweenTestAndStatus} ${keyName} <= ${compareTo} \t Received ${received}`
                    );
                }
            } else if (key === "$gte") {
                if (
                    canBeNumber(received) &&
                    canBeNumber(compareTo) &&
                    parseFloat(received) >= parseFloat(compareTo)
                ) {
                    outputChannel.appendLine(
                        `\t${pass} ${spaceBetweenTestAndStatus} ${keyName} >= ${compareTo} `
                    );
                } else {
                    outputChannel.appendLine(
                        `\t${fail} ${spaceBetweenTestAndStatus} ${keyName} >= ${compareTo} \t Received ${received}`
                    );
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
                    outputChannel.appendLine(
                        `\t${pass} ${spaceBetweenTestAndStatus} size of ${keyName} == ${compareTo} `
                    );
                } else {
                    outputChannel.appendLine(
                        `\t${fail} ${spaceBetweenTestAndStatus} size of ${keyName} == ${compareTo} \t Received ${received} of size ${receivedLen}`
                    );
                }
            } else if (key === "$exists") {
                if (received !== undefined) {
                    outputChannel.appendLine(
                        `\t${pass} ${spaceBetweenTestAndStatus} ${keyName} exists ${compareTo}  `
                    );
                } else {
                    outputChannel.appendLine(
                        `\t${fail} ${spaceBetweenTestAndStatus} ${keyName} exists ${compareTo}  `
                    );
                }
            } else if (key === "$type") {
                if (typeof received === compareTo) {
                    outputChannel.appendLine(
                        `\t${pass} ${spaceBetweenTestAndStatus} type of ${keyName} is ${compareTo}  `
                    );
                } else {
                    outputChannel.appendLine(
                        `\t${fail} ${spaceBetweenTestAndStatus} type of ${keyName} is ${compareTo} \t Received ${received} of type ${typeof received}`
                    );
                }
            }
        }
    }
}

function canBeNumber(input: any): boolean {
    if (Array.isArray(input)) {
        return false;
    } else if (typeof input === "object") {
        return false;
    }

    return /^[+-]?\d+(\.\d+)?$/.test(input);
}
