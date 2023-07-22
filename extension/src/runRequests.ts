import * as YAML from "yaml";
import { getIndividualResponse, getAllResponses } from "./executeRequest";

export async function runIndividualRequest(text: string, name: string) {
    const parsedData = YAML.parse(text);

    let allReq = parsedData.requests;
    for (let i = 0; i < allReq.length; i++) {
        if (allReq[i].name === name) {
            await getIndividualResponse(parsedData.common, allReq[i]);
            break;
        }
    }
}

export async function runAllRequests(text: string) {
    const parsedData = YAML.parse(text);

    let allReq = parsedData.requests;
    await getAllResponses(parsedData.common, allReq);
}
