import got from 'got';
import { window } from 'vscode';
import { openEditor } from '../openEditor/openEditor';

export function getResponse(allRequestData: any, requestIndex: number){
	const getData = async () => {
		try {
            let res : object;
			res = await got.get(`https://jsonplaceholder.typcode.com/posts/${requestIndex}`).json();
			openEditor(res);
		} catch (err) {
			window.showInformationMessage(JSON.stringify(err));
            let errArg : object;
			errArg = JSON.parse(JSON.stringify(err));
			openEditor(errArg);
		}
	};

	getData();
}