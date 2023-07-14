import { window, commands, workspace } from "vscode";

let keysInContent = ["executionTime", "status", "content"];

export async function openEditorForIndividualReq(
    jsonData: object,
    name: string
) {
    let [contentData, headersData] = getDataOfIndReqAsString(jsonData, name);
    await showContent(contentData, headersData);
}

export async function openEditorForAllRequests(
    responses: Array<{ response: object; name: string }>
) {
    const n = responses.length;
    let formattedContent = "";
    let formattedHeaders = "";

    for (let i = 0; i < n; i++) {
        let responseObj = responses[i];
        let [contentData, headersData] = getDataOfIndReqAsString(
            responseObj["response"],
            responseObj["name"]
        );
        formattedContent += contentData + "\n-------\n";
        formattedHeaders += headersData + "\n-------\n";
    }

    await showContent(formattedContent, formattedHeaders);
}

function getDataOfIndReqAsString(
    jsonData: any,
    name: string
): [contentData: string, headersData: string] {
    let contentData = `${name} content\n\n`;
    let headersData = `${name} headers\n\n`;

    for (const key in jsonData) {
        if (jsonData.hasOwnProperty(key)) {
            let value = jsonData[key];
            if (keysInContent.includes(key)) {
                contentData += `${key}: ${value}\n`;
            } else {
                headersData += `${key}: ${value}\n`;
            }
        }
    }

    return [contentData, headersData];
}

async function openDocument(content: string) {
    await workspace.openTextDocument({ content: content }).then((document) => {
        window.showTextDocument(document, {
            preserveFocus: false,
        });
    });
}

async function showContent(bodyContent: string, headersContent: string) {
    const activeEditor = window.activeTextEditor;

    // insert a new group to the right, insert the content
    commands.executeCommand("workbench.action.newGroupRight");
    await openDocument(bodyContent);

    // insert a new group below, insert the content
    commands.executeCommand("workbench.action.newGroupBelow");
    await openDocument(headersContent);

    //reopen the initial editor
    if (activeEditor) {
        window.showTextDocument(activeEditor.document);
    }
}
