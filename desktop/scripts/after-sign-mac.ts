/**
 * afterSign hook: sign Mach-O under Contents/Resources/bin, then re-sign the .app.
 */
import { join } from "node:path";
import {
  resolveSignIdentity,
  signMacEmbeddings,
} from "./sign-mac-embeddings.ts";

interface AfterSignContext {
  electronPlatformName: string;
  appOutDir: string;
  packager: {
    appInfo: { productFilename: string };
    projectDir: string;
  };
}

export default async function afterSign(context: AfterSignContext): Promise<void> {
  if (context.electronPlatformName !== "darwin") {
    return;
  }

  const appPath = join(context.appOutDir, `${context.packager.appInfo.productFilename}.app`);
  const identity = resolveSignIdentity(appPath);
  const adhoc = identity === "-";
  const hardenedEnv = process.env.DOCUGIT_MAC_HARDENED_RUNTIME?.trim();
  const hardenedRuntime =
    hardenedEnv === "1" || hardenedEnv === "true"
      ? true
      : hardenedEnv === "0" || hardenedEnv === "false"
        ? false
        : !adhoc;

  signMacEmbeddings(appPath, {
    projectDir: context.packager.projectDir,
    identity,
    hardenedRuntime,
  });
}
