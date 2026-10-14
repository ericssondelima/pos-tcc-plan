/*
 * Basic and organization-aware GitHub token validation helpers.
 */

async function validateGitHubTokenBasic(basicGithubToken) {
  try {
    let basicGithubUserResponse = await githubFetch(basicGithubToken, "/user");
    if (!basicGithubUserResponse.ok)
      throw Error(basicGithubUserResponse.statusText);
    let basicGithubScopes =
        basicGithubUserResponse.headers.get("x-oauth-scopes")?.split(",\x20") ??
        [],
      basicGithubUser = await basicGithubUserResponse.json();
    return {
      valid: true,
      scopes: basicGithubScopes,
      user: basicGithubUser.login,
      hasRepoScope:
        basicGithubScopes.includes("repo") ||
        basicGithubScopes.includes("public_repo"),
      hasWorkflowScope: basicGithubScopes.includes("workflow"),
      rateRemaining: parseInt(
        basicGithubUserResponse.headers.get("x-ratelimit-remaining") ?? "0",
        10,
      ),
    };
  } catch {
    return {
      valid: false,
      scopes: [],
      hasRepoScope: false,
      hasWorkflowScope: false,
    };
  }
}
async function validateGitHubTokenWithOrgs(orgGithubToken) {
  try {
    let orgGithubUserResponse = await githubFetch(orgGithubToken, "/user");
    if (!orgGithubUserResponse.ok)
      return { valid: false, scopes: [], orgs: [] };
    let orgGithubScopes =
        orgGithubUserResponse.headers.get("x-oauth-scopes")?.split(",\x20") ??
        [],
      orgGithubTokenExpiry =
        orgGithubUserResponse.headers.get(
          "github-authentication-token-expiration",
        ) ?? void 0,
      orgGithubUser = await orgGithubUserResponse.json(),
      orgGithubLogins = [];
    if (!orgGithubToken.startsWith("github_pat_"))
      try {
        let orgGithubOrgsResponse = await githubFetch(
          orgGithubToken,
          "/user/orgs",
        );
        if (orgGithubOrgsResponse.ok)
          orgGithubLogins = (await orgGithubOrgsResponse.json()).map(
            (githubOrgRecord) => githubOrgRecord.login,
          );
      } catch {}
    return {
      valid: true,
      user: orgGithubUser.login,
      scopes: orgGithubScopes,
      expiry: orgGithubTokenExpiry,
      orgs: orgGithubLogins,
    };
  } catch {
    return { valid: false, scopes: [], orgs: [] };
  }
}
