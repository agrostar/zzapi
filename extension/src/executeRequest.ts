import got from "got";
import { window, ProgressLocation } from "vscode";

import {
    openEditorForIndividualReq,
    openEditorForAllRequests,
} from "./showInEditor";

import {
    getParamsForUrl,
    getMergedDataExceptParams,
    getBody,
    getHeadersAsJSON,
    getHeadersAsString,
} from "./getRequestData";

import { loadVariables } from "./variableReplacement";

export async function getIndividualResponse(
    commonData: any,
    requestData: any,
    name: string
) {
    loadVariables();
    requestData["name"] = name;
    const allData = getMergedDataExceptParams(commonData, requestData);
    const params = getParamsForUrl(commonData.params, requestData.params);

    let [reqCancelled, responseData] = await requestWithProgress(
        allData,
        params
    );
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

    loadVariables();
    for (const name in allRequests) {
        if (allRequests.hasOwnProperty(name)) {
            let request = allRequests[name];
            request["name"] = name;
            const allData = getMergedDataExceptParams(commonData, request);
            const paramsForUrl = getParamsForUrl(
                commonData.params,
                request.params
            );
            let [reqCancelled, responseData] = await requestWithProgress(
                allData,
                paramsForUrl
            );
            if (!reqCancelled) {
                responses.push({ response: responseData, name: request.name });
                atleastOneExecuted = true;
            }
        }
    }

    if (atleastOneExecuted) {
        openEditorForAllRequests(responses);
    } else {
        window.showInformationMessage("ALL REQUESTS WERE CANCELLED");
    }
}

async function requestWithProgress(
    requestData: any,
    paramsForUrl: string
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

            const httpRequest = constructRequest(requestData, paramsForUrl);

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
                    // statusText: httpResponse.statusMessage,
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

function constructRequest(allData: any, paramsForUrl: string) {
    let completeUrl = getURL(allData, paramsForUrl);

    let options = {
        body: getBody(allData.body),
        headers: getHeadersAsJSON(allData.headers),
        followRedirect: allData.options.follow,

        https: {
            rejectUnauthorized: allData.options.verifySSL,
        },
    };

    if (allData.method === "POST") {
        return got.post(completeUrl, options);
    } else if (allData.method === "HEAD") {
        return got.head(completeUrl, options);
    } else if (allData.method === "PUT") {
        return got.put(completeUrl, options);
    } else if (allData.method === "DELETE") {
        return got.delete(completeUrl, options);
    } else if (allData.method === "PATCH") {
        return got.patch(completeUrl, options);
    } else {
        return got.get(completeUrl, options);
    }
}

function getURL(allData: any, paramsForUrl: string) {
    let completeUrl = "";
    if (allData.baseUrl !== undefined) {
        completeUrl += allData.baseUrl;
    }
    if (allData.url !== undefined) {
        if (allData.url !== "" && allData.url[0] !== "/") {
            return allData.url + paramsForUrl;
        } else {
            completeUrl += allData.url;
        }
    }

    return completeUrl + paramsForUrl;
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
        return { statusCode: e.name, body: message as string };
    }
}
