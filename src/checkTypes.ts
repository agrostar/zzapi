import { isArrayOrDict, isDict, getDescriptiveType, getStrictStringValue } from "./utils/typeUtils";

function checkKey(
  obj: any,
  item: string,
  key: string,
  expectedTypes: string[],
  optional: boolean
): string | undefined {
  if (!optional && !obj.hasOwnProperty(key)) {
    return `${key} key must be present in each ${item} item`;
  } else if (obj.hasOwnProperty(key)) {
    if (
      !expectedTypes.some((type) => (type === "null" && obj[key] === null) || typeof obj[key] === type)
    ) {
      return `${key} of ${item} must have one of ${expectedTypes} value, found ${typeof obj[key]}`;
    }
  }
  return undefined;
}

function checkObjIsDict(obj: any, item: string): string | undefined {
  if (!isDict(obj)) {
    return `${item} item must be a dict: found ${getDescriptiveType(obj)}`;
  } else {
    return undefined;
  }
}

function checkHeaderItem(obj: any): string | undefined {
  let ret = checkObjIsDict(obj, "header");
  if (ret !== undefined) return ret;

  ret = checkKey(obj, "header", "name", ["string"], false);
  if (ret !== undefined) return ret;
  ret = checkKey(obj, "header", "value", ["string", "number", "boolean", "null"], false);
  if (ret !== undefined) return ret;

  return undefined;
}

function checkParamItem(obj: any): string | undefined {
  let ret = checkObjIsDict(obj, "param");
  if (ret !== undefined) return ret;

  ret = checkKey(obj, "param", "name", ["string"], true);
  if (ret !== undefined) return ret;
  // value need not exist, but if it does, it can be anything so I do not bother checking

  return undefined;
}

function checkHeadersParamsOptionsTestsCaptures(obj: any): string | undefined {
  if (obj.hasOwnProperty("headers")) {
    const headers = obj.headers;
    if (!isArrayOrDict(headers)) {
      return `Headers must be an array or a dictionary: found ${typeof headers}`;
    }
    if (Array.isArray(headers)) {
      for (const header of headers) {
        const headerError = checkHeaderItem(header);
        if (headerError !== undefined) {
          return `error in header item ${getStrictStringValue(header)}: ${headerError}`;
        }
      }
    } else {
      // headers are a dictionary
      for (const header in headers) {
        const headerError = checkHeaderItem({ name: header, value: headers[header] });
        if (headerError !== undefined) {
          return `error in header item ${getStrictStringValue(header)}: ${headerError}`;
        }
      }
    }
  }
  if (obj.hasOwnProperty("params")) {
    const params = obj.params;
    if (!isArrayOrDict(params)) {
      return `Params must be an array or a dictionary: found ${typeof params}`;
    }
    if (Array.isArray(params)) {
      for (const param of params) {
        const paramError = checkParamItem(param);
        if (paramError !== undefined) {
          return `error in param item ${getStrictStringValue(param)}: ${paramError}`;
        }
      }
    }
  }
  if (obj.hasOwnProperty("options")) {
    const optionsError = checkOptions(obj.options);
    if (optionsError !== undefined) return `error in options: ${optionsError}`;
  }
  if (obj.hasOwnProperty("tests")) {
    const testsError = checkTests(obj.tests);
    if (testsError !== undefined) return `error in tests: ${testsError}`;
  }
  if (obj.hasOwnProperty("capture")) {
    const capturesError = checkCaptures(obj.capture);
    if (capturesError !== undefined) return `error in captures: ${capturesError}`;
  }

  return undefined;
}

function checkTests(obj: any): string | undefined {
  let ret = checkObjIsDict(obj, "tests");
  if (ret !== undefined) return ret;

  if (obj.hasOwnProperty("json")) {
    ret = checkObjIsDict(obj.json, "JSON tests");
    if (ret !== undefined) return ret;
  }
  if (obj.hasOwnProperty("body") && !(isDict(obj.body) || typeof obj.body === "string")) {
    return `body tests item must be a dict or string: found ${getDescriptiveType(obj.body)}`;
  }
  if (obj.hasOwnProperty("status") && !(isDict(obj.status) || typeof obj.status === "number")) {
    return `status tests item must be a dict or number: found ${getDescriptiveType(obj.status)}`;
  }
  if (obj.hasOwnProperty("headers")) {
    ret = checkObjIsDict(obj.headers, "header tests");
    if (ret !== undefined) return ret;
  }

  return undefined;
}

function checkCaptures(obj: any): string | undefined {
  let ret = checkObjIsDict(obj, "captures");
  if (ret !== undefined) return ret;

  if (obj.hasOwnProperty("json")) {
    ret = checkObjIsDict(obj.json, "JSON captures");
    return ret;
  }

  ret = checkKey(obj, "captures", "body", ["string"], true);
  if (ret !== undefined) return ret;
  ret = checkKey(obj, "captures", "status", ["string"], true);
  if (ret !== undefined) return ret;

  if (obj.hasOwnProperty("headers")) {
    ret = checkObjIsDict(obj.headers, "header captures");
    if (ret !== undefined) return ret;
  }

  return undefined;
}

const VALID_OPTIONS: { [type: string]: boolean } = {
  follow: true,
  verifySSL: true,
  keepRawJSON: true,
  showHeaders: true,
  rawParams: true,
  stopOnFailure: true,
};
function checkOptions(obj: any): string | undefined {
  let ret = checkObjIsDict(obj, "options");
  if (ret !== undefined) return ret;

  for (const key in obj) {
    if (VALID_OPTIONS[key]) {
      ret = checkKey(obj, "options", key, ["boolean"], true);
      if (ret !== undefined) return ret;
    } else {
      return `options must be among ${Object.keys(VALID_OPTIONS)}: found ${key}`;
    }
  }

  return undefined;
}

export function checkCommonType(obj: any): string | undefined {
  let ret = checkObjIsDict(obj, "common");
  if (ret !== undefined) return ret;

  ret = checkKey(obj, "common", "baseUrl", ["string"], true);
  if (ret !== undefined) return ret;

  ret = checkHeadersParamsOptionsTestsCaptures(obj);
  if (ret !== undefined) return ret;

  return undefined;
}

// creating it as an object for faster access
const VALID_METHODS: { [type: string]: boolean } = {
  options: true,
  get: true,
  post: true,
  put: true,
  patch: true,
  head: true,
  delete: true,
  trace: true,
};
export function validateRawRequest(obj: any): string | undefined {
  let ret = checkObjIsDict(obj, "request");
  if (ret !== undefined) return ret;

  ret = checkHeadersParamsOptionsTestsCaptures(obj);
  if (ret !== undefined) return ret;

  ret = checkKey(obj, "request", "url", ["string"], false);
  if (ret !== undefined) return ret;

  if (!obj.hasOwnProperty("method")) {
    return `method key must be present in each request item`;
  } else {
    if (typeof obj.method !== "string") {
      return `value of method key must be a string`;
    } else {
      const methodToPass = obj.method.toLowerCase();
      if (!VALID_METHODS[methodToPass])
        return `method key must have value among ${Object.keys(VALID_METHODS)}: found ${methodToPass}`;
    }
  }

  if (obj.hasOwnProperty("formValues") && obj.hasOwnProperty("body")) {
    return `both body and formValues can't be present in the same request.`;
  }

  if (obj.hasOwnProperty("method") && obj["method"] == "GET" && obj.hasOwnProperty("formValues")) {
    return `formValues can't be used with method GET`;
  }

  if (obj.hasOwnProperty("method") && obj["method"] == "GET" && obj.hasOwnProperty("body")) {
    return `body can't be used with method GET`;
  }

  return undefined;
}

export function checkVariables(obj: any): string | undefined {
  let ret = checkObjIsDict(obj, "variables");
  if (ret !== undefined) return ret;

  for (const key in obj) {
    if (typeof key !== "string") return `Environment names must be a string: ${key} is not a string`;

    const variables = obj[key];
    ret = checkObjIsDict(obj, `variables environment ${key}`);
    if (ret !== undefined) return ret;

    for (const varName in variables) {
      if (typeof varName !== "string") {
        return `variable name ${varName} in env ${key} is not a string`;
      }
    }
  }

  return undefined;
}
