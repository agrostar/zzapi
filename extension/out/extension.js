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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode_1 = require("vscode");
const CodelensProviderForIndividualRequests_1 = require("./CodelensProviderForIndividualRequests");
const CodelensProviderForAllReq_1 = require("./CodelensProviderForAllReq");
const got_1 = __importDefault(require("got"));
const YAML = __importStar(require("yaml"));
function getResponse(parsedRequest) {
    const getData = async () => {
        try {
            const res = await got_1.default.get('https://jsonplaceholder.typicode.com/posts/1').json();
            vscode_1.window.showInformationMessage(JSON.stringify(res));
        }
        catch (err) {
            vscode_1.window.showInformationMessage(JSON.stringify(err));
        }
    };
    getData();
}
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
                    getResponse(1);
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
                getResponse(1);
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