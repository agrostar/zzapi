import got from 'got';
import { window } from 'vscode';
import { openEditor } from '../openEditor/openEditor';

export function getResponse(allRequestData: any, requestIndex: number){
	const getData = async () => {
		try {
            let res : object;
			res = await got.get('https://jsonplaceholder.typicode.com/posts/1').json();
			openEditor(res);
		} catch (err) {
			window.showInformationMessage(JSON.stringify(err));
            return err;
		}
	};

	getData();
}