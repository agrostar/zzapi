import * as YAML from 'yaml';

export async function runIndividualRequest(text: string, name: string) {
    const parsedData = YAML.parse(text);		

    let allReq = parsedData.requests;
    for(let i = 0; i < allReq.length; i++){
        if(allReq[i].name === name) {
            await getResponse(parsedData.common, allReq[i]);
            break;
        }
    }
}

export async function runAllRequests(text: string) {
    const parsedData = YAML.parse(text);		
        
    let allReq = parsedData.requests;
    for(let i = 0; i < allReq.length; i++) {
        await getResponse(parsedData.common, allReq[i]);
    }
}

import got from 'got';
import { window } from 'vscode';
import { openEditor } from './showInEditor';

export async function getResponse(commonData: any, requestData: any){
    const allData = getMergedData(commonData, requestData);
	try {
		let res : object;
		res = await got.get(`https://jsonplaceholder.typicode.com/posts/1`).json();
		openEditor(res);
	} catch (err) {
		window.showInformationMessage(`Error in running request ${allData.name}`);
		let errArg : object;
		errArg = JSON.parse(JSON.stringify(err));
		openEditor(errArg);
	}
}

function getMergedData(commonData: any, requestData: any): any {
    return {
        ...commonData,
        ...requestData
    };
}