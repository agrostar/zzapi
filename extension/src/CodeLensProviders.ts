import * as vscode from "vscode";
import { getRequestPositions } from "./parseBundle";

const requiredFileEnd = ".zz-bundle.yaml";

export class CodelensProviderForAllReq implements vscode.CodeLensProvider {
    private codeLenses: vscode.CodeLens[] = [];
    private regex: RegExp;
    private _onDidChangeCodeLenses: vscode.EventEmitter<void> =
        new vscode.EventEmitter<void>();
    public readonly onDidChangeCodeLenses: vscode.Event<void> =
        this._onDidChangeCodeLenses.event;

    constructor() {
        this.regex = /requests:/g;

        vscode.workspace.onDidChangeConfiguration((_) => {
            this._onDidChangeCodeLenses.fire();
        });
    }

    public provideCodeLenses(
        document: vscode.TextDocument,
        token: vscode.CancellationToken
    ): vscode.CodeLens[] | Thenable<vscode.CodeLens[]> {
        if (!document.uri.fsPath.endsWith(requiredFileEnd)) {
            return [];
        }

        this.codeLenses = [];
        const regex = new RegExp(this.regex);
        const text = document.getText();
        let matches;
        while ((matches = regex.exec(text)) !== null) {
            const line = document.lineAt(
                document.positionAt(matches.index).line
            );
            const indexOf = line.text.indexOf(matches[0]);
            const position = new vscode.Position(line.lineNumber, indexOf);
            const range = new vscode.Range(position, position);

            if (range) {
                let newCodeLens = new vscode.CodeLens(range);
                newCodeLens.command = {
                    title: "↪ Run all requests",
                    tooltip: "Click to run all requests",
                    command: "extension.runAllRequests",
                };
                this.codeLenses.push(newCodeLens);
            }
        }

        return this.codeLenses;
    }

    public resolveCodeLens(
        codeLens: vscode.CodeLens,
        token: vscode.CancellationToken
    ) {
        return null;
    }
}

export class CodelensProviderForIndReq implements vscode.CodeLensProvider {
    private codeLenses: vscode.CodeLens[] = [];
    private regex: RegExp;
    private _onDidChangeCodeLenses: vscode.EventEmitter<void> =
        new vscode.EventEmitter<void>();
    public readonly onDidChangeCodeLenses: vscode.Event<void> =
        this._onDidChangeCodeLenses.event;

    constructor() {
        this.regex = /-\sname:\s(.+)/g;

        vscode.workspace.onDidChangeConfiguration((_) => {
            this._onDidChangeCodeLenses.fire();
        });
    }

    public provideCodeLenses(
        document: vscode.TextDocument,
        token: vscode.CancellationToken
    ): vscode.CodeLens[] | Thenable<vscode.CodeLens[]> {
        if (!document.uri.fsPath.endsWith(requiredFileEnd)) {
            return [];
        }

        this.codeLenses = [];
        const regex = new RegExp(this.regex);
        const text = document.getText();
        let matches;
        while ((matches = regex.exec(text)) !== null) {
            const line = document.lineAt(
                document.positionAt(matches.index).line
            );
            const indexOf = line.text.indexOf(matches[0]);
            const position = new vscode.Position(line.lineNumber, indexOf);
            const range = new vscode.Range(position, position);

            if (range) {
                let newCodeLens = new vscode.CodeLens(range);

                const startPos = range.start.character;
                const endPos = line.range.end.character;

                /*
                "name: requestName" is [startPos, endPos),
                    +8 is to account for -\sname:\s, to get requestName
                */
                const name = line.text.substring(startPos + 8, endPos);

                newCodeLens.command = {
                    title: `▶ Run '${name}'`,
                    tooltip: `Click to run '${name}'`,
                    command: "extension.runRequest",
                    arguments: [name],
                };
                this.codeLenses.push(newCodeLens);
            }
        }

        return this.codeLenses;
    }

    public resolveCodeLens(
        codeLens: vscode.CodeLens,
        token: vscode.CancellationToken
    ) {
        return null;
    }
}

export class CodeLensProvider implements vscode.CodeLensProvider {
    private codeLenses: vscode.CodeLens[] = [];
    private _onDidChangeCodeLenses: vscode.EventEmitter<void> =
        new vscode.EventEmitter<void>();
    public readonly onDidChangeCodeLenses: vscode.Event<void> =
        this._onDidChangeCodeLenses.event;

    constructor() {
        vscode.workspace.onDidChangeConfiguration((_) => {
            this._onDidChangeCodeLenses.fire();
        });
    }

    public provideCodeLenses(
        document: vscode.TextDocument,
        token: vscode.CancellationToken
    ): vscode.CodeLens[] | Thenable<vscode.CodeLens[]> {
        if (!document.uri.fsPath.endsWith(requiredFileEnd)) {
            return [];
        }

        this.codeLenses = [];
        const text = document.getText();
        const positions = getRequestPositions(text);
        positions.forEach(p => {
            const range = new vscode.Range(
                new vscode.Position(p.start.line-1, p.start.col-1),
                new vscode.Position(p.end.line-1, p.end.col-1),
            );
            if (p.name) {
                const cl = new vscode.CodeLens(range, {
                    title: `▶ Run '${p.name}'`,
                    tooltip: `Click to run '${p.name}'`,
                    command: "extension.runRequest",
                    arguments: [p.name],  
                });
                this.codeLenses.push(cl);
            } else {
                const cl = new vscode.CodeLens(range, {
                    title: "↪ Run All Requests",
                    tooltip: "Click to run all requests",
                    command: "extension.runAllRequests",
                });
                this.codeLenses.push(cl);
            }
        });
        return this.codeLenses;
    }

    public resolveCodeLens(
        codeLens: vscode.CodeLens,
        token: vscode.CancellationToken
    ) {
        return null;
    }
}
