import * as vscode from "vscode";
// import * as YAML from "yaml";

export function openEditor(jsonData: object) {
    // const dataToDisplay = YAML.stringify(jsonData);
    const dataToDisplay = getJsonDataOnSeparateLines(jsonData);
    const language = "yaml";

    const activeEditor = vscode.window.activeTextEditor;
    const nextColumn =
        activeEditor && activeEditor.viewColumn !== undefined
            ? activeEditor.viewColumn + 1
            : vscode.ViewColumn.Beside;

    vscode.workspace
        .openTextDocument({ content: dataToDisplay, language })
        .then((document) => {
            vscode.window.showTextDocument(document, nextColumn, true);
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