"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode_1 = require("vscode");
const CodelensProviderForIndividualRequests_1 = require("./CodelensProviderForIndividualRequests");
const CodelensProviderForAllReq_1 = require("./CodelensProviderForAllReq");
const YAML = require("yaml");
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
    vscode_1.commands.registerCommand("extension.runRequest", (name) => {
        const activeEditor = vscode_1.window.activeTextEditor;
        if (activeEditor) {
            const text = activeEditor.document.getText();
            const parsedData = YAML.parse(text);
            const reqName = YAML.parse(name).name;
            let allReq = parsedData.requests;
            for (let i = 0; i < allReq.length; i++) {
                if (YAML.stringify(allReq[i].name) === YAML.stringify(reqName)) {
                    vscode_1.window.showInformationMessage(YAML.stringify(allReq[i]));
                    break;
                }
            }
        }
    });
    vscode_1.commands.registerCommand("extension.runAllRequests", (args) => {
        const activeEditor = vscode_1.window.activeTextEditor;
        if (activeEditor) {
            const text = activeEditor.document.getText();
            const parsedData = YAML.parse(text);
            let allReq = parsedData.requests;
            for (let i = 0; i < allReq.length; i++) {
                vscode_1.window.showInformationMessage(YAML.stringify(allReq[i]));
            }
        }
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