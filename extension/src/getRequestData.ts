export function getBody(body: any) {
    if (body === undefined || !(typeof body === "object")) {
        return body;
    }

    return JSON.stringify(body);
}

export function getHeadersAsJSON(
    objectSet: Array<{ name: string; value: any }>
) {
    if (objectSet === undefined || !Array.isArray(objectSet)) {
        return objectSet;
    }

    return getObjectSetAsJSON(objectSet);
}

//converts an array of {name: , value: } objects into a JSON object
function getObjectSetAsJSON(objectSet: Array<{ name: string; value: any }>) {
    let finalObject: { [key: string]: any } = {};

    const numElements = objectSet.length;
    for (let i = 0; i < numElements; i++) {
        const currObj: { name: string; value: any } = objectSet[i];

        const key = currObj.name;
        const value = currObj.value;

        finalObject[key] = value;
    }

    return finalObject;
}

export function getHeadersAsString(headersObj: any) {
    let formattedString = "\n";

    for (const key in headersObj) {
        if (headersObj.hasOwnProperty(key)) {
            const value = headersObj[key];
            formattedString += `\t${key}: ${value}\n`;
        }
    }

    formattedString = formattedString.trim();
    return `\n\t${formattedString}`;
}

export function getMergedDataExceptParams(
    commonData: any,
    requestData: any
): any {
    let mergedData = Object.assign({}, commonData, requestData);
    delete mergedData.params;

    for (const key in requestData) {
        if (requestData.hasOwnProperty(key) && key !== "params") {
            if (
                commonData.hasOwnProperty(key) &&
                Array.isArray(requestData[key])
            ) {
                let finalKeyData: { [key: string]: any } = {};

                let currProp: any;
                let numElements: number;

                //idea: set value for each key for commonData, and then for requestData,
                //  thus, if there is a common key, then the requestData value will overwrite
                if (Array.isArray(commonData[key])) {
                    currProp = commonData[key];
                    numElements = currProp.length;

                    for (let i = 0; i < numElements; i++) {
                        const key = currProp[i].name;
                        const value = currProp[i].value;
                        finalKeyData[key] = value;
                    }
                }

                currProp = requestData[key];
                numElements = currProp.length;
                for (let i = 0; i < numElements; i++) {
                    const key = currProp[i].name;
                    const value = currProp[i].value;
                    finalKeyData[key] = value;
                }

                mergedData[key] = finalKeyData;
            }
        }
    }

    return mergedData;
}

export function getParamsForUrl(
    commonParams: Array<any>,
    requestParams: Array<any>
) {
    let params: Array<any>;

    if (commonParams === undefined || !Array.isArray(commonParams)) {
        params = requestParams;
    } else if (requestParams === undefined || !Array.isArray(requestParams)) {
        params = commonParams;
    } else {
        params = commonParams.concat(requestParams);
    }

    if (params === undefined || !Array.isArray(params)) {
        return "";
    }

    let paramString = "";
    let paramArray: Array<string> = [];

    const numParams = params.length;
    for (let i = 0; i < numParams; i++) {
        const param = params[i];

        const key = param.name as string;
        let value = param.value as string;
        if (param.encode !== undefined && param.encode === false) {
            paramArray.push(`${key}=${value}`);
        } else {
            paramArray.push(`${key}=${encodeURIComponent(value)}`);
        }
    }

    paramString = paramArray.join("&");
    return `?${paramString}`;
}
