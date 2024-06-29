import { VarStore } from "../../src/index";

import { Bundle } from "./bundleUtils";

export class RawRequest {
  public requestName: string | undefined = undefined;
  public envName: string | undefined = undefined;
  public bundle: Bundle;
  public variables: VarStore;

  constructor(relPath: string, envName: string | undefined, reqName?: string) {
    try {
      this.bundle = new Bundle(relPath);
      this.requestName = reqName;
      this.envName = envName;
      this.variables = new VarStore();
    } catch (e) {
      throw e;
    }
  }
}
