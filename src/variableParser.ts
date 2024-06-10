import * as YAML from "yaml";

import { isDict } from "./utils/typeUtils";

import { checkVariables } from "./checkTypes";
import { Variables } from "./variables";

// we may pass an empty string if the document is not actually a bundle
export function getBundleVariables(doc: string | undefined): Variables {
  let parsedData = doc ? YAML.parse(doc) : {};
  if (!isDict(parsedData)) {
    throw new Error("Bundle could not be parsed. Is your bundle a valid YAML document?");
  }

  const variables = parsedData.variables;
  if (variables !== undefined) {
    const error = checkVariables(variables);
    if (error !== undefined) throw new Error(`error in variables: ${error}`);

    return variables;
  } else {
    return {};
  }
}

export function getEnvironments(bundleContent: string | undefined, varFileContents: string[]): string[] {
  const bundleEnvNames = Object.keys(getBundleVariables(bundleContent));

  const fileEnvNames: string[] = [];
  varFileContents.forEach((fileContent) => {
    const envs = YAML.parse(fileContent);
    if (isDict(envs)) {
      fileEnvNames.push(...Object.keys(envs));
    }
  });

  const uniqueNames = new Set([...bundleEnvNames, ...fileEnvNames]);
  return [...uniqueNames];
}

function replaceEnvironmentVariables(vars: Variables): {
  replacedVars: Variables;
  undefinedVars: string[];
} {
  const PREFIX = "$env.";

  const undefinedVars: string[] = [];
  const getVal = (val: any): any => {
    if (typeof val !== "string" || !val.startsWith(PREFIX)) return val;

    const envVarName = val.slice(PREFIX.length);
    if (envVarName in process.env) return process.env[envVarName];

    undefinedVars.push(val);
    return val;
  };

  const replacedVars: Variables = {};
  for (const key in vars) replacedVars[key] = getVal(vars[key]);

  return { replacedVars, undefinedVars };
}

export function loadVariables(
  envName: string | undefined,
  bundleContent: string | undefined,
  varFileContents: string[],
): { vars: Variables; undefinedVars: string[] } {
  if (!envName) return { vars: {}, undefinedVars: [] };

  const allBundleVariables = getBundleVariables(bundleContent);
  const bundleVars: Variables = allBundleVariables[envName] ?? {};

  const envVars: Variables = {};
  varFileContents.forEach((fileContents) => {
    const parsedData = YAML.parse(fileContents);
    if (parsedData && isDict(parsedData[envName])) Object.assign(envVars, parsedData[envName]);
  });

  const basicVars = Object.assign({}, envVars, bundleVars);
  const { replacedVars: vars, undefinedVars } = replaceEnvironmentVariables(basicVars);

  return { vars, undefinedVars };
}
