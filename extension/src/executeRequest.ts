import got from "got";
import { window } from "vscode";
import { openEditor } from "./showInEditor";

import * as vscode from "vscode";

export async function getResponse(commonData: any, requestData: any) {
    const allData = getMergedData(commonData, requestData);
    openEditor(await requestWithProgress(allData));
}

async function requestWithProgress(requestData: any){
    let seconds = 0;

    const response: any = await window.withProgress({
        location: vscode.ProgressLocation.Window,
        cancellable: true,
        title: "Running Request, click to cancel"
    }, async (progress, token) => {
        const interval = setInterval(() => {
            progress.report({message: `${++seconds} sec`});
        }, 1000);

        const httpRequest = got.get(`https://jsonplceholder.typicode.com/posts/1`).json();
        let response: any;
        let cancelled = false;
        token.onCancellationRequested(() => {
            response = {"cancelRequested": "TRUE"};
            cancelled = true;
        });
        
        const startTime = new Date().getTime();
        const httpResponse = await executeHttpRequest(httpRequest);
        const executionTime = new Date().getTime() - startTime;

        clearInterval(interval);

        if(!cancelled){
            response = {
                "executionTime": executionTime,
                "httpResponse": httpResponse,
            };
        }

        return response;
    });

    return response;
}

async function executeHttpRequest(httpRequest: any){
    try {
        const res = await httpRequest;
        return res;
    } catch(e: any){
        const res = e.response;

        if(res){
            return res;
        }

        const err2 = e;
        const message = e.name === "CancelError" ? "Request Cancelled" : err2.message;
        return {"name": e.name, "message": message };
    }
}

function getMergedData(commonData: any, requestData: any): any {
    return {
        ...commonData,
        ...requestData
    };
}