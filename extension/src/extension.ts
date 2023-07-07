// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { ExtensionContext, languages, commands, Disposable, workspace, window } from 'vscode';
import { CodelensProviderForIndReq } from './CodelensProviderForIndividualRequests';
import { CodelensProviderForAllReq } from './CodelensProviderForAllReq';

import got from 'got';
import * as YAML from 'yaml';

function getResponse(parsedRequest: any) {
	const getData = async () => {
		try {
			const res = await got.get('https://jsonplaceholder.typicode.com/posts/1').json();
			window.showInformationMessage(JSON.stringify(res));
		} catch (err) {
			window.showInformationMessage(JSON.stringify(err));
		}
	};

	getData();
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
let disposables: Disposable[] = [];

export function activate(context: ExtensionContext) {
	const codelensProviderForIndReq = new CodelensProviderForIndReq();
	const codelensProviderForAllReq = new CodelensProviderForAllReq();

	languages.registerCodeLensProvider("*", codelensProviderForIndReq);
	languages.registerCodeLensProvider("*", codelensProviderForAllReq);

	commands.registerCommand("extension.enableAPIrunner", () => {
		workspace.getConfiguration("extension").update("enableAPIrunner", true, true);
	});

	commands.registerCommand("extension.disableAPIrunner", () => {
		workspace.getConfiguration("extension").update("enableAPIrunner", false, true);
	});

	commands.registerCommand("extension.runRequest", (name) => {
		const activeEditor = window.activeTextEditor;
		if(activeEditor){
			const text = activeEditor.document.getText();
			const parsedData = YAML.parse(text);		
			
			const reqName = YAML.parse(name).name;
			let allReq = parsedData.requests;
			for(let i = 0; i < allReq.length; i++){
				if(YAML.stringify(allReq[i].name) === YAML.stringify(reqName)) {
					getResponse(1);
					break;
				}
			}
		}
	});

	commands.registerCommand("extension.runAllRequests", (args: any) => {
		const activeEditor = window.activeTextEditor;
		if(activeEditor){
			const text = activeEditor.document.getText();
			const parsedData = YAML.parse(text);		
			
			let allReq = parsedData.requests;
			for(let i = 0; i < allReq.length; i++) {
				getResponse(1);
			}
		}
	});
}

// this method is called when your extension is deactivated
export function deactivate() {
	if (disposables) {
		disposables.forEach(item => item.dispose());
	}
	disposables = [];
}