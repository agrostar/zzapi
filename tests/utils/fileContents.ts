import * as fs from "fs";
import * as path from "path";

export function replaceFileContents<T>(body: T, bundlePath: string): T {
  if (typeof body !== "string") return body;

  /*
  finds all file:// instances with atleast 1 succeeding word character
  matches the file-name referred to by this instance
  */
  const fileRegex = /file:\/\/([^\s]+)/g;
  return body.replace(fileRegex, (match, givenFilePath) => {
    if (match !== body) return match; // we only perform a replacement if file:// is the ENTIRE body

    const filePath = path.resolve(path.dirname(bundlePath), givenFilePath);
    return fs.readFileSync(filePath, "utf-8");
  }) as T & string;
}
