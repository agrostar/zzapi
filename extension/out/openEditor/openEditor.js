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
exports.openEditor = void 0;
const vscode = __importStar(require("vscode"));
const yaml = __importStar(require("yaml"));
function openEditor(jsonData) {
    const dataToDisplay = yaml.stringify(jsonData);
    // const dataToDisplay = JSON.stringify(jsonData);
    const language = 'yaml';
    const activeEditor = vscode.window.activeTextEditor;
    const nextColumn = activeEditor && (activeEditor.viewColumn !== undefined) ? activeEditor.viewColumn + 1 : vscode.ViewColumn.Beside;
    vscode.workspace.openTextDocument({ content: dataToDisplay, language }).then((document) => {
        vscode.window.showTextDocument(document, nextColumn, true);
    });
}
exports.openEditor = openEditor;
//# sourceMappingURL=openEditor.js.map