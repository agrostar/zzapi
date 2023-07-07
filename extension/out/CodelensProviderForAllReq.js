"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodelensProviderForAllReq = void 0;
const vscode = __importStar(require("vscode"));
/**
 * CodelensProvider
 */
class CodelensProviderForAllReq {
    constructor() {
        this.codeLenses = [];
        this._onDidChangeCodeLenses = new vscode.EventEmitter();
        this.onDidChangeCodeLenses = this._onDidChangeCodeLenses.event;
        this.regex = /\brequests:/g;
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
//# sourceMappingURL=CodelensProviderForAllReq.js.map