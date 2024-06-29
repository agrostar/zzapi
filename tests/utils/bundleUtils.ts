import path from "path";
import * as fs from "fs";

export class Bundle {
  public bundlePath: string = __dirname;
  public bundleContents: string = "";

  constructor(relPath: string) {
    try {
      this.setBundlePath(relPath);
      this.readContents();
    } catch (e) {
      throw e;
    }
  }

  setBundlePath(relPath: string) {
    this.bundlePath = path.resolve(relPath);
    if (!fs.existsSync(this.bundlePath)) throw `error: ${this.bundlePath} does not exist`;
    if (!fs.lstatSync(this.bundlePath).isFile()) throw `error: ${this.bundlePath} is not a file`;
  }

  readContents() {
    this.bundleContents = fs.readFileSync(this.bundlePath, "utf-8");
  }
}
