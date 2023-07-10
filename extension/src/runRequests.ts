import * as YAML from "yaml";
import { getResponse } from "./executeRequest";

export async function runIndividualRequest(text: string, name: string) {
    const parsedData = YAML.parse(text);

    let allReq = parsedData.requests;
    for (let i = 0; i < allReq.length; i++) {
        if (allReq[i].name === name) {
            await getResponse(parsedData.common, allReq[i]);
            break;
        }
    }
}

export async function runAllRequests(text: string) {
    const parsedData = YAML.parse(text);

    let allReq = parsedData.requests;
    for (let i = 0; i < allReq.length; i++) {
        await getResponse(parsedData.common, allReq[i]);
    }
}