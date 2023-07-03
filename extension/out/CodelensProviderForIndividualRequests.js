"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodelensProviderForIndReq = void 0;
const vscode = require("vscode");
/**
 * CodelensProvider
 */
class CodelensProviderForIndReq {
    constructor() {
        this.codeLenses = [];
        this._onDidChangeCodeLenses = new vscode.EventEmitter();
        this.onDidChangeCodeLenses = this._onDidChangeCodeLenses.event;
        this.regex = /\bname:/g;
        vscode.workspace.onDidChangeConfiguration((_) => {
            this._onDidChangeCodeLenses.fire();
        });
    }
    provideCodeLenses(document, token) {
        if (vscode.workspace.getConfiguration("extension").get("enableAPIrunner", true)) {
            this.codeLenses = [];
            const regex = new RegExp(this.regex);
            const text = document.getText();
            let matches;
            while ((matches = regex.exec(text)) !== null) {
                const line = document.lineAt(document.positionAt(matches.index).line);
                const indexOf = line.text.indexOf(matches[0]);
                const position = new vscode.Position(line.lineNumber, indexOf);
                const range = document.getWordRangeAtPosition(position, new RegExp(this.regex));
                if (range) {
                    this.codeLenses.push(new vscode.CodeLens(range));
                }
            }
            return this.codeLenses;
        }
        return [];
    }
    resolveCodeLens(codeLens, token) {
        if (vscode.workspace.getConfiguration("extension").get("enableAPIrunner", true)) {
            const activeEditor = vscode.window.activeTextEditor;
            if (activeEditor) {
                let lineNum = codeLens.range.start.line;
                let lineData = activeEditor.document.lineAt(lineNum);
                const startPos = codeLens.range.start.character;
                const endPos = lineData.range.end.character;
                const nameData = lineData.text.substring(startPos, endPos);
                codeLens.command = {
                    title: "Run Request",
                    tooltip: "Click to run the request",
                    command: "extension.runRequest",
                    arguments: [nameData]
                };
                return codeLens;
            }
        }
        return null;
    }
}
exports.CodelensProviderForIndReq = CodelensProviderForIndReq;
//# sourceMappingURL=CodelensProviderForIndividualRequests.js.map