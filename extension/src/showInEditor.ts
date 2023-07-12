import { window, workspace, ViewColumn } from "vscode";

export function openEditor(jsonData: object) {
    const dataToDisplay = getJsonDataOnSeparateLines(jsonData);
    const language = "yaml";

    const activeEditor = window.activeTextEditor;
    const nextColumn =
        activeEditor && activeEditor.viewColumn !== undefined
            ? activeEditor.viewColumn + 1
            : ViewColumn.Beside;

    workspace
        .openTextDocument({ content: dataToDisplay, language })
        .then((document) => {
            window.showTextDocument(document, nextColumn, true);
        });
}

export function getJsonDataOnSeparateLines(jsonData: any) {
    let formattedString = "";

    for (const key in jsonData) {
        if (jsonData.hasOwnProperty(key)) {
            let value = jsonData[key];
            if (key === "headers") {
                value = `\n\t${value}`;
            }
            formattedString += `${key}: ${value}\n`;
        }
    }

    return formattedString.trim();
}
