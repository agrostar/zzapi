import got from "got";
import { window, ProgressLocation } from "vscode";
import {
    openEditorForIndividualReq,
    openEditorForAllRequests,
} from "./showInEditor";

export async function getIndividualResponse(commonData: any, requestData: any) {
    const allData = getMergedData(commonData, requestData);
    let [reqCancelled, responseData] = await requestWithProgress(allData);
    if (!reqCancelled) {
        await openEditorForIndividualReq(responseData, allData.name);
    }
}

export async function getAllResponses(
    commonData: any,
    allRequests: Array<any>
) {
    let responses = [];
    let atleastOneExecuted = false;

    const n = allRequests.length;
    for (let i = 0; i < n; i++) {
        let request = allRequests[i];
        const allData = getMergedData(commonData, request);
        let [reqCancelled, responseData] = await requestWithProgress(allData);
        if (!reqCancelled) {
            responses.push({ response: responseData, name: request.name });
            atleastOneExecuted = true;
        }
    }

    if (atleastOneExecuted) {
        openEditorForAllRequests(responses);
    } else {
        window.showInformationMessage("ALL REQUESTS WERE CANCELLED");
    }
}

async function requestWithProgress(
    requestData: any
): Promise<[boolean, object]> {
    let seconds = 0;

    const [cancelled, response]: any = await window.withProgress(
        {
            location: ProgressLocation.Window,
            cancellable: true,
            title: `Running ${requestData.name}, click to cancel`,
        },
        async (progress, token) => {
            const interval = setInterval(() => {
                progress.report({ message: `${++seconds} sec` });
            }, 1000);

            const httpRequest = constructRequest(requestData);

            let response: any;
            let cancelled = false;

            token.onCancellationRequested(() => {
                window.showInformationMessage(
                    `Request ${requestData.name} was cancelled`
                );
                httpRequest.cancel();
                cancelled = true;
            });

            const startTime = new Date().getTime();
            const httpResponse = await executeHttpRequest(httpRequest);
            const executionTime = new Date().getTime() - startTime;

            clearInterval(interval);
            if (!cancelled) {
                response = {
                    executionTime: executionTime,
                    status: httpResponse.statusCode,
                    // statusText: httpResponse.statusMessage!,
                    content: httpResponse.body as string,
                    headers: getHeadersAsString(httpResponse.headers),
                    // rawHeaders: httpResponse.rawHeaders,
                    // httpVersion: httpResponse.httpVersion,
                };

                return [false, response];
            }

            return [cancelled, httpResponse];
        }
    );

    return [cancelled, response];
}

function constructRequest(allData: any) {
    let completeUrl = allData.baseUrl + allData.url;

    let options = {
        body: getBody(allData.body),
        searchParams: getObjectSetAsJSON(allData.params),
        headers: getObjectSetAsJSON(allData.headers),
        followRedirect: allData.options.follow,
    };

    if (allData.method === "GET") {
        return got.get(completeUrl, options);
    } else {
        return got.post(completeUrl, options);
    }
}

function getBody(body: any) {
    if (body === undefined) {
        return undefined;
    }
    if (typeof body === "object") {
        return JSON.stringify(body);
    }

    return body;
}

function getObjectSetAsJSON(
    objectSet: Array<{ name: any; value: any; encode: boolean }>
) {
    if (objectSet === undefined) {
        return undefined;
    }
    if (!Array.isArray(objectSet)) {
        return objectSet;
    }

    let finalObject: { [key: string]: any } = {};

    const n = objectSet.length;
    for (let i = 0; i < n; i++) {
        const currObj: { name: string; value: any; encode: boolean } =
            objectSet[i];

        const key = currObj.name;
        let value = currObj.value;
        // if(currObj.encode === undefined || currObj.encode === true){
        //     value = encodeURIComponent(value);
        // }

        finalObject[key] = value;
    }

    return finalObject;
}

function getHeadersAsString(headersObj: any) {
    let formattedString = "\n";

    for (const key in headersObj) {
        if (headersObj.hasOwnProperty(key)) {
            const value = headersObj[key];
            formattedString += `\t${key}: ${value}\n`;
        }
    }

    formattedString = formattedString.trim();
    return `\n\t${formattedString}`;
}

async function executeHttpRequest(httpRequest: any) {
    try {
        return await httpRequest;
    } catch (e: any) {
        const res = e.response;
        if (res) {
            return res;
        }

        const message = e.name === "CancelError" ? "Cancelled" : e.message;
        return { name: e.name, message: message };
    }
}

function getMergedData(commonData: any, requestData: any): any {
    let mergedData = Object.assign({}, commonData, requestData);

    for (const key in requestData) {
        if (requestData.hasOwnProperty(key)) {
            if (
                commonData.hasOwnProperty(key) &&
                Array.isArray(requestData[key])
            ) {
                let finalKeyData: { [key: string]: any } = {};

                let currProp: any;
                let n: number;

                if (Array.isArray(commonData[key])) {
                    currProp = commonData[key];
                    n = currProp.length;

                    for (let i = 0; i < n; i++) {
                        const key = currProp[i].name;
                        let value = currProp[i].value;
                        // if(currProp[i].encode === undefined || currProp[i].encode === true){
                        //     value = encodeURIComponent(value);
                        // }
                        finalKeyData[key] = value;
                    }
                }

                currProp = requestData[key];
                n = currProp.length;
                for (let i = 0; i < n; i++) {
                    const key = currProp[i].name;
                    let value = currProp[i].value;
                    // if(currProp[i].encode === undefined || currProp[i].encode === true){
                    //     value = encodeURIComponent(value);
                    // }
                    finalKeyData[key] = value;
                }

                mergedData[key] = finalKeyData;
            }
        }
    }

    return mergedData;
}
