export function isArrayOrDict(obj: any) {
  return typeof obj == "object" && !(obj instanceof Date) && obj !== null;
}

export function isDict(obj: any) {
  return isArrayOrDict(obj) && !Array.isArray(obj);
}

export function getDescriptiveType(obj: any): string {
  if (obj === null) return "null";
  if (Array.isArray(obj)) return "array";
  if (obj instanceof Date) return "instanceof Date";
  if (typeof obj === "object") return "dict"; // if none of the above but object, it is map/dict
  return typeof obj;
}

export function getStringIfNotScalar(data: any): Exclude<any, object> {
  if (typeof data !== "object") return data;
  return JSON.stringify(data);
}

export function getStringValueIfDefined<
  T extends undefined | Exclude<any, undefined>,
  R = T extends undefined ? undefined : string,
>(value: T): R {
  if (typeof value === "undefined") return undefined as R;
  if (typeof value === "object") return JSON.stringify(value) as R; // handles dicts, arrays, null, date (all obj)
  return value.toString() as R; // handles scalars
}

export function getStrictStringValue(value: any): string {
  if (typeof value === "undefined") return "undefined";
  return getStringValueIfDefined(value);
}

export function isString(value: any): boolean {
  return typeof value === "string" || value instanceof String;
}

export function isFilePath(value: any): boolean {
  if (!isString(value)) {
    return false;
  }
  const fileRegex = /file:\/\/([^\s]+)/g;
  return fileRegex.test(value);
}

export function hasFile(formValues: any): boolean {
  if (!formValues) {
    return false;
  }
  for (const formValue of formValues) {
    if (isFilePath(formValue.value)) {
      return true;
    }
  }
  return false;
}
