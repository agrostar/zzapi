"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodelensProviderForAllReq = void 0;
const vscode = require("vscode");
/**
 * CodelensProvider
 */
class CodelensProviderForAllReq {
    constructor() {
        this.codeLenses = [];
        this._onDidChangeCodeLenses = new vscode.EventEmitter();
        this.onDidChangeCodeLenses = this._onDidChangeCodeLenses.event;
        vscode.workspace.onDidChangeConfiguration((_) => {
            this._onDidChangeCodeLenses.fire();
        });
    }
    provideCodeLenses(document, token) {
        if (vscode.workspace.getConfiguration("extension").get("enableAPIrunner", true)) {
            this.codeLenses = [];
            const position = new vscode.Position(0, 0);
            const range = document.getWordRangeAtPosition(position);
            if (range) {
                this.codeLenses.push(new vscode.CodeLens(range));
            }
            return this.codeLenses;
        }
        return [];
    }
    resolveCodeLens(codeLens, token) {
        if (vscode.workspace.getConfiguration("extension").get("enableAPIrunner", true)) {
            codeLens.command = {
                title: "Run All Requests",
                tooltip: "Click to run all request",
                command: "extension.runAllRequests",
                arguments: ["Argument 1", false]
            };
            return codeLens;
        }
        return null;
    }
}
exports.CodelensProviderForAllReq = CodelensProviderForAllReq;
//# sourceMappingURL=CodeLensProviderForAllReq.js.map