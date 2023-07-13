import got from "got";
import { window, ProgressLocation } from "vscode";
import { openEditor } from "./showInEditor";

export async function getResponse(commonData: any, requestData: any) {
    const allData = getMergedData(commonData, requestData);
    let [reqCancelled, responseData] = await requestWithProgress(allData);
    if (!reqCancelled) {
        await openEditor(responseData, requestData.name);
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
            title: "Running Request, click to cancel",
        },

        async (progress, token) => {
            const interval = setInterval(() => {
                progress.report({ message: `${++seconds} sec` });
            }, 1000);

            const httpRequest = got.get(
                `https://jsonplaceholder.typicode.com/posts/1`
            );
            let response: any;
            let cancelled = false;
            token.onCancellationRequested(() => {
                window.showInformationMessage("Request was cancelled");
                httpRequest.cancel();
                cancelled = true;
            });

            const startTime = new Date().getTime();
            const [isError, httpResponse] = await executeHttpRequest(
                httpRequest
            );
            const executionTime = new Date().getTime() - startTime;

            clearInterval(interval);
            if (!cancelled && !isError) {
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

async function executeHttpRequest(
    httpRequest: any
): Promise<[isError: boolean, responseData: any]> {
    try {
        return [false, await httpRequest];
    } catch (e: any) {
        const res = e.response;
        if (res) {
            return [true, res];
        }

        const message = e.name === "CancelError" ? "Cancelled" : e.message;
        return [true, { name: e.name, message: message }];
    }
}

function getMergedData(commonData: any, requestData: any): any {
    return {
        ...commonData,
        ...requestData,
    };
}
