import { ExtensionContext, languages, commands, Disposable } from "vscode";

import {
    CodelensProviderForAllReq,
    CodelensProviderForIndReq,
} from "./CodeLensProviders";

import { registerRunRequest, registerRunAllRequests } from "./registerRequests";

let disposables: Disposable[] = [];

export function activate(context: ExtensionContext) {
    languages.registerCodeLensProvider("*", new CodelensProviderForIndReq());
    languages.registerCodeLensProvider("*", new CodelensProviderForAllReq());

    commands.registerCommand("extension.runRequest", async (name) => {
        await registerRunRequest(name);
    });

    commands.registerCommand("extension.runAllRequests", async () => {
        await registerRunAllRequests();
    });
}

export function deactivate() {
    if (disposables) {
        disposables.forEach((item) => item.dispose());
    }
    disposables = [];
}
