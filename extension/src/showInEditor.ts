import { window, ViewColumn, commands, workspace } from "vscode";

let keysInContent = ["executionTime", "status", "content"];

export async function openEditorForIndividualReq(jsonData: object, name: string) {
    let [contentData, headersData] = getDataOfIndReqAsString(jsonData, name);

    const activeEditor = window.activeTextEditor;

    let targetColumn: number;
    targetColumn =
        activeEditor && activeEditor.viewColumn !== undefined
            ? activeEditor.viewColumn + 1
            : ViewColumn.Beside;

    // insert a new group to the right, insert the content
    commands.executeCommand("workbench.action.newGroupRight");
    await openDocument(contentData);

    // insert a new group below, insert the content
    commands.executeCommand("workbench.action.newGroupBelow");
    await openDocument(headersData);

    if (activeEditor) {
        window.showTextDocument(activeEditor.document);
    }
}

export async function openEditorForAllRequests(responses: Array<{response: object, name: string}>){
    const n = responses.length;
    let formattedContent = "";
    let formattedHeaders = "";

    for(let i = 0; i < n; i++){
        let responseObj = responses[i];
        let [contentData, headersData] = getDataOfIndReqAsString(responseObj["response"], responseObj["name"]);
        formattedContent += contentData + "\n-------\n";
        formattedHeaders += headersData + "\n-------\n";   
    }
    
    const activeEditor = window.activeTextEditor;

    let targetColumn: number;
    targetColumn =
        activeEditor && activeEditor.viewColumn !== undefined
            ? activeEditor.viewColumn + 1
            : ViewColumn.Beside;

    // insert a new group to the right, insert the content
    commands.executeCommand("workbench.action.newGroupRight");
    await openDocument(formattedContent);

    // insert a new group below, insert the content
    commands.executeCommand("workbench.action.newGroupBelow");
    await openDocument(formattedHeaders);

    if (activeEditor) {
        window.showTextDocument(activeEditor.document);
    }    
}

function getDataOfIndReqAsString(
    jsonData: any,
    name: string
): [contentData: string, headersData: string] {
    let contentData = `${name} content\n\n` + getContent(jsonData);
    let headersData = `${name} headers\n\n` + getRemainingContent(jsonData);

    return [contentData, headersData];
}

function getContent(jsonData: any): string {
    let formattedString = "";

    for (const key in jsonData) {
        if (keysInContent.includes(key) && jsonData.hasOwnProperty(key)) {
            let value = jsonData[key];
            formattedString += `${key}: ${value}\n`;
        }
    }

    return formattedString.trim();
}

function getRemainingContent(jsonData: any): string {
    let formattedString = "";

    for (const key in jsonData) {
        if (!keysInContent.includes(key) && jsonData.hasOwnProperty(key)) {
            let value = jsonData[key];
            formattedString += `${key}: ${value}\n`;
        }
    }

    return formattedString.trim();
}

async function openDocument(content: string) {
    await workspace.openTextDocument({ content: content }).then((document) => {
        window.showTextDocument(document, {
            preserveFocus: false,
        });
    });
}
