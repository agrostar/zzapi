import { ExtensionContext, languages, commands /*Disposable*/ } from "vscode";
import * as vscode from "vscode";
import {
    CodelensProviderForAllReq,
    CodelensProviderForIndReq,
} from "./CodeLensProviders";

import { registerRunRequest, registerRunAllRequests } from "./registerRequests";

// let disposables: Disposable[] = [];

let currentEnvironment: string;

const environments = [
    { label: "x", description: "Environment X" },
    { label: "y", description: "Environment Y" },
    { label: "z", description: "Environment Z" },
];

export function activate(context: ExtensionContext) {
    const statusBar = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Left
    );
    initialiseStatusBar(statusBar, context);
    createEnvironmentSelector(statusBar, context);

    languages.registerCodeLensProvider("*", new CodelensProviderForIndReq());
    languages.registerCodeLensProvider("*", new CodelensProviderForAllReq());

    commands.registerCommand("extension.runRequest", async (name) => {
        await registerRunRequest(name);
    });

    commands.registerCommand("extension.runAllRequests", async () => {
        await registerRunAllRequests();
    });
}

function initialiseStatusBar(statusBar: vscode.StatusBarItem, context: ExtensionContext){
    statusBar.text = "zzAPI: Set Environment";
    statusBar.command = "extension.clickEnvSelector";
    statusBar.show();
    context.subscriptions.push(statusBar);
}

function createEnvironmentSelector(statusBar: vscode.StatusBarItem, context: ExtensionContext){
    const statusClick = vscode.commands.registerCommand(
        "extension.clickEnvSelector",
        () => {
            showEnvironmentOptions();
        }
    );
    context.subscriptions.push(statusClick);

    const showEnvironmentOptions = () => {
        vscode.window
            .showQuickPick(environments, {
                placeHolder: "Select an environment",
                matchOnDetail: true,
                matchOnDescription: true,
            })
            .then((selectedEnvironment) => {
                if (selectedEnvironment) {
                    setEnvironment(statusBar, selectedEnvironment.label);
                }
            });
    };
}

function setEnvironment(statusBar: vscode.StatusBarItem, environment: string) {
    currentEnvironment = environment;
    statusBar.text = `Current Environment: ${currentEnvironment}`;
}

// export function deactivate() {
//     if (disposables) {
//         disposables.forEach((item) => item.dispose());
//     }
//     disposables = [];
// }
