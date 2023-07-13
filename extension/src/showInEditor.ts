import { window, ViewColumn } from "vscode";
import * as vscode from "vscode";

// let currentColumnIncrement = 1;

export async function openEditor(jsonData: object, name: string) {
    let contentData: string;
    contentData = `NAME: ${name}\n\n` + getJsonDataOnSeparateLines(jsonData);

    const activeEditor = window.activeTextEditor;
    
    let targetColumn: number;
    targetColumn =
        activeEditor && activeEditor.viewColumn !== undefined
            ? activeEditor.viewColumn + 1
            : ViewColumn.Beside;

    // insert a new group to the right, insert the content
    vscode.commands.executeCommand("workbench.action.newGroupRight");
    await openDocument("content");

    // insert a new group below, insert the content
    vscode.commands.executeCommand("workbench.action.newGroupBelow");
    await openDocument("headers");

    if(activeEditor){
        vscode.window.showTextDocument(activeEditor.document);
    }
    
}

async function openDocument(content: string){
    await vscode.workspace
        .openTextDocument({ content: content })
        .then((document) => {
            vscode.window.showTextDocument(document, {
                preserveFocus: false,
            });
        });
}

export function getJsonDataOnSeparateLines(jsonData: any) {
    let formattedString = "";

    for (const key in jsonData) {
        if (jsonData.hasOwnProperty(key)) {
            let value = jsonData[key];
            formattedString += `${key}: ${value}\n`;
        }
    }

    return formattedString.trim();
}
