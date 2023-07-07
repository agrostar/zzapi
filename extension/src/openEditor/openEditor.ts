import * as vscode from 'vscode';
import * as yaml from 'yaml';

export function openEditor(jsonData: object) {
    const yamlData = yaml.stringify(jsonData);
    const language = 'yaml';

    const activeEditor = vscode.window.activeTextEditor;
    const nextColumn = activeEditor && (activeEditor.viewColumn !== undefined) ? activeEditor.viewColumn + 1 : vscode.ViewColumn.Beside;

    vscode.workspace.openTextDocument({content: yamlData, language}).then((document) => {
        vscode.window.showTextDocument(document, nextColumn, false);
    });
}