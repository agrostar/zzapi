import { getStrictStringValue, isArrayOrDict } from "./utils/typeUtils";

import { RequestSpec } from "./models";
import { Variables } from "./variables";

function replaceVariablesInArray(
  data: any[],
  variables: Variables,
): { data: any[]; undefinedVars: string[] } {
  let newData: any[] = [];
  let undefs: string[] = [];

  data.forEach((item) => {
    const { data: newItem, undefinedVars: newUndefs } = replaceVariables(item, variables);

    newData.push(newItem);
    undefs.push(...newUndefs);
  });

  return { data: newData, undefinedVars: undefs };
}

function replaceVariablesInDict(
  obj: { [key: string]: any },
  variables: Variables,
): { data: { [key: string]: any }; undefinedVars: string[] } {
  let newData: { [key: string]: any } = {};
  let undefs: string[] = [];

  for (const key in obj) {
    const { data: newItem, undefinedVars: newUndefs } = replaceVariables(obj[key], variables);

    newData[key] = newItem;
    undefs.push(...newUndefs);
  }

  return { data: newData, undefinedVars: undefs };
}

function replaceVariablesInObject(
  data: { [key: string]: any } | any[],
  variables: Variables,
): { data: any; undefinedVars: string[] } {
  if (Array.isArray(data)) {
    return replaceVariablesInArray(data, variables);
  } else {
    return replaceVariablesInDict(data, variables);
  }
}

/**
 * (?<!\\) -> negative lookbehind assertion - ensures the $( is not preceded by a backslash
 * \$\( -> matches the sequence \$\( which acts as the opening sequence
 * ([_a-zA-Z]\w*) -> capturing group for the variable name.
 *    [_a-zA-Z] -> matches any underscore or letter as starting character,
 *        as the variable name must not start with a number
 *    \w* -> matches any combination of word characters (letters, digits, underscore)
 * /) -> matches the closing parentheses
 * g -> global option, regex should be tested against all possible matches in the string
 *
 * Thus, it is used to match all $(variableName)
 */
const VAR_REGEX_WITH_BRACES = /(?<!\\)\$\(([_a-zA-Z]\w*)\)/g;

/**
 * (?<!\\) -> negative lookbehind assertion - ensures the $( is not preceded by a backslash
 * \$ -> matches the dollar sign
 * ([_a-zA-Z]\w*) -> capturing group of the variable name
 *    [_a-zA-Z] -> matches any underscore or letter as starting character
 *        as the variable name must not start with a number
 *    \w* -> matches any combination of word characters (letters, digits, underscore)
 * (?=\W|$) -> Positive lookahead assertion. Ensures the match is followed by a non-word character
 *    (\W) or the end of a line (represented by $).
 * g -> global option, regex should be tested against all possible matches in the string
 *
 * Thus, it is used to match all $variableName
 */
const VAR_REGEX_WITHOUT_BRACES = /(?<!\\)\$([_a-zA-Z]\w*)(?=\W|$)/g;

function replaceVariablesInString(
  text: string,
  variables: Variables,
): { data: any; undefinedVars: string[] } {
  // maintaining a separate boolean instead of initially setting valueInNativeType to, say, undefined,
  //  because valueInNativeType may actually end up being undefined.
  let valueInNativeType: any;
  let variableIsFullText: boolean = false;
  const undefs: string[] = [];

  function replaceVar(match: string, varName: any): string {
    if (typeof varName === "string") {
      if (variables.hasOwnProperty(varName)) {
        const varVal = variables[varName];
        if (text === match) {
          variableIsFullText = true;
          valueInNativeType = varVal;
        }
        return getStrictStringValue(varVal);
      } else {
        undefs.push(varName);
      }
    }
    return match; // if varName is not defined well (not string), or is not a valid variable
  }

  // todo: make a complete match regex and return native type immediately.
  const outputText = text
    .replace(VAR_REGEX_WITH_BRACES, (match, varName) => {
      return replaceVar(match, varName);
    })
    .replace(VAR_REGEX_WITHOUT_BRACES, (match) => {
      if (match.length <= 1) return match; // this would lead to an invalid slice
      const varName = match.slice(1);

      return replaceVar(match, varName);
    });

  if (variableIsFullText) {
    return { data: valueInNativeType, undefinedVars: undefs };
  } else {
    return { data: outputText, undefinedVars: undefs };
  }
}

function replaceVariables(data: any, variables: Variables): { data: any; undefinedVars: string[] } {
  if (isArrayOrDict(data)) {
    return replaceVariablesInObject(data, variables);
  } else if (typeof data === "string") {
    return replaceVariablesInString(data, variables);
  } else {
    return { data: data, undefinedVars: [] };
  }
}

export function replaceVariablesInRequest(request: RequestSpec, variables: Variables): string[] {
  const undefs: string[] = [];

  type keyOfHttp = Exclude<keyof typeof request.httpRequest, "method">;
  const httpPropertiesToReplace: string[] = ["baseUrl", "url", "params", "headers", "body"];
  httpPropertiesToReplace.forEach((prop) => {
    const httpKey = prop as keyOfHttp;
    const replacedData = replaceVariables(request.httpRequest[httpKey], variables);
    request.httpRequest[httpKey] = replacedData.data;
    undefs.push(...replacedData.undefinedVars);
  });

  const replacedData = replaceVariables(request.tests, variables);
  request.tests = replacedData.data;
  undefs.push(...replacedData.undefinedVars);

  return undefs;
}
