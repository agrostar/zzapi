import got from 'got';
import {window} from 'vscode';

export function getResponse(parsedRequest: any) {
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