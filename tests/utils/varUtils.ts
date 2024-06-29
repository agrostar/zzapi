import * as fs from "fs";
import path from "path";

const VARFILE_EXTENSION = ".zzv";

function getVarFilePaths(dirPath: string): string[] {
  const dirContents = fs.readdirSync(dirPath, { recursive: false, encoding: "utf-8" });
  const varFiles = dirContents.filter((file) => path.extname(file) == VARFILE_EXTENSION);
  const varFilePaths = varFiles.map((file) => path.join(dirPath, file));

  return varFilePaths;
}

export function getVarFileContents(dirPath: string): string[] {
  if (!dirPath) return [];

  const varFilePaths = getVarFilePaths(dirPath);
  const fileContents: string[] = [];
  varFilePaths.forEach((varFilePath) => {
    const fileData = fs.readFileSync(varFilePath, "utf-8");
    fileContents.push(fileData);
  });

  return fileContents;
}
