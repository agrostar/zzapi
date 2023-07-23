import * as vscode from "vscode";
import * as YAML from 'yaml';

const requiredFileEnd = ".zz-bundle.yaml";

/**
 * Uses parseDocument to build Position items that define where codelenses
 * are defined, and returns the names of the requests to define the pass to 
 * the commands. 
 */
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
        const allRequestPositions = getRequestPositions(text);

        allRequestPositions.forEach((requestPosition) => {
            if (requestPosition.name === undefined) {
                const startPos = new vscode.Position(
                    requestPosition.start.line - 1,
                    requestPosition.start.col
                );
                const endPos = new vscode.Position(
                    requestPosition.end.line - 1,
                    requestPosition.end.col
                );
                const range = new vscode.Range(startPos, endPos);

                if (range) {
                    let newCodeLens = new vscode.CodeLens(range);
                    newCodeLens.command = {
                        title: "↪ Run All Requests",
                        tooltip: "Click to run all requests",
                        command: "extension.runAllRequests",
                    };
                    this.codeLenses.push(newCodeLens);
                }
            } else {
                const name = requestPosition.name;
                const startPos = new vscode.Position(
                    requestPosition.start.line - 1,
                    requestPosition.start.col
                );
                const endPos = new vscode.Position(
                    requestPosition.end.line - 1,
                    requestPosition.end.col
                );
                const range = new vscode.Range(startPos, endPos);

                if (range) {
                    let newCodeLens = new vscode.CodeLens(range);
                    newCodeLens.command = {
                        title: `▶ Run '${name}'`,
                        tooltip: `Click to run '${name}'`,
                        command: "extension.runRequest",
                        arguments: [name],
                    };
                    this.codeLenses.push(newCodeLens);
                }
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

export interface RequestPosition {
    name?: string;
    start: { line: number; col: number };
    end: { line: number; col: number };
}

/*
 * Returns an array of requestPosition objects. If the name of a
 * requestPosition is null or undefined, it is the "all requests" position.
 * All other requestPositions will have a name and a position.
 */
export function getRequestPositions(document: string): Array<RequestPosition> {
    let positions: Array<RequestPosition> = [];

    const lineCounter = new YAML.LineCounter();
    let doc = YAML.parseDocument(document, { lineCounter });

    if (!YAML.isMap(doc.contents)) {
        return positions;
    }
    let contents = doc.contents as YAML.YAMLMap;

    contents.items.forEach((topLevelItem) => {
        if (!YAML.isMap(topLevelItem.value)) {
            return;
        }
        let key = topLevelItem.key as YAML.Scalar;
        if (key.value !== "requests") {
            return;
        }

        const start = key.range?.[0] as number;
        const end = key.range?.[1] as number;
        const all: RequestPosition = {
            start: lineCounter.linePos(start),
            end: lineCounter.linePos(end),
        };
        positions.push(all);

        let requests = topLevelItem.value as YAML.YAMLMap;
        requests.items.forEach((request) => {
            if (!YAML.isMap(request.value)) {
                return;
            }
            let key = request.key as YAML.Scalar;
            const name = key.value as string;
            const start = key.range?.[0] as number;
            const end = key.range?.[1] as number;
            const each: RequestPosition = {
                name: name,
                start: lineCounter.linePos(start),
                end: lineCounter.linePos(end),
            };
            positions.push(each);
        });
    });

    return positions;
}
