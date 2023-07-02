"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode_1 = require("vscode");
const CodelensProviderForIndividualRequests_1 = require("./CodelensProviderForIndividualRequests");
const CodelensProviderForAllReq_1 = require("./CodelensProviderForAllReq");
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
let disposables = [];
function activate(context) {
    const codelensProviderForIndReq = new CodelensProviderForIndividualRequests_1.CodelensProviderForIndReq();
    const codelensProviderForAllReq = new CodelensProviderForAllReq_1.CodelensProviderForAllReq();
    vscode_1.languages.registerCodeLensProvider("*", codelensProviderForIndReq);
    vscode_1.languages.registerCodeLensProvider("*", codelensProviderForAllReq);
    vscode_1.commands.registerCommand("extension.enableAPIrunner", () => {
        vscode_1.workspace.getConfiguration("extension").update("enableAPIrunner", true, true);
    });
    vscode_1.commands.registerCommand("extension.disableAPIrunner", () => {
        vscode_1.workspace.getConfiguration("extension").update("enableAPIrunner", false, true);
    });
    vscode_1.commands.registerCommand("extension.runRequest", (args) => {
        vscode_1.window.showInformationMessage("Request run");
    });
    vscode_1.commands.registerCommand("extension.runAllRequests", (args) => {
        vscode_1.window.showInformationMessage("All requests have been run");
    });
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() {
    if (disposables) {
        disposables.forEach(item => item.dispose());
    }
    disposables = [];
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map