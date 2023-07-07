"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getResponse = void 0;
const got_1 = __importDefault(require("got"));
const vscode_1 = require("vscode");
const openEditor_1 = require("../openEditor/openEditor");
function getResponse(allRequestData, requestIndex) {
    const getData = async () => {
        try {
            let res;
            res = await got_1.default.get('https://jsonplaceholder.typicode.com/posts/1').json();
            (0, openEditor_1.openEditor)(res);
        }
        catch (err) {
            vscode_1.window.showInformationMessage(JSON.stringify(err));
            return err;
        }
    };
    getData();
}
exports.getResponse = getResponse;
//# sourceMappingURL=getResponse.js.map