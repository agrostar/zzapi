import * as vscode from 'vscode';
import * as yaml from 'yaml';

export function openEditor(jsonData: object) {
    const dataToDisplay = yaml.stringify(jsonData);
    // const dataToDisplay = JSON.stringify(jsonData);
    const language = 'yaml';

    const activeEditor = vscode.window.activeTextEditor;
    const nextColumn = activeEditor && (activeEditor.viewColumn !== undefined) ? activeEditor.viewColumn + 1 : vscode.ViewColumn.Beside;

    vscode.workspace.openTextDocument({content: dataToDisplay, language}).then((document) => {
        vscode.window.showTextDocument(document, nextColumn, true);
    });
}