"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getResponse = void 0;
const got_1 = __importDefault(require("got"));
const vscode_1 = require("vscode");
function getResponse(parsedRequest) {
    const getData = async () => {
        try {
            const res = await got_1.default.get('https://jsonplaceholder.typicode.com/posts/1').json();
            vscode_1.window.showInformationMessage(JSON.stringify(res));
        }
        catch (err) {
            vscode_1.window.showInformationMessage(JSON.stringify(err));
        }
    };
    getData();
}
exports.getResponse = getResponse;
//# sourceMappingURL=getResponse.js.map