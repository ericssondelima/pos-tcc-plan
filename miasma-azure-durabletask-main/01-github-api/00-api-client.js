/*
 * GitHub REST API base URL, headers, retry, JSON fetch, and rate-limit handling.
 */

function isGitHubRateLimitStatus(githubStatusCode) {
  return githubStatusCode === 429 || githubStatusCode === 403;
}
function githubRetryDelayMs(githubRetryHeaders, githubRetryAttemptIndex) {
  let githubRetryAfterHeader = githubRetryHeaders.get("Retry-After");
  if (githubRetryAfterHeader) {
    let githubRetryAfterSeconds = parseInt(githubRetryAfterHeader, 10);
    if (
      !isNaN(githubRetryAfterSeconds) &&
      githubRetryAfterSeconds > 0 &&
      githubRetryAfterSeconds <= 3600
    )
      return githubRetryAfterSeconds * 1000;
  }
  return (githubRetryDelaySeconds[githubRetryAttemptIndex] ?? 90) * 1000;
}
function githubHeaders(githubBearerToken) {
  let githubRequestHeaders = {
    Accept: "application/vnd.github+json",
    "User-Agent": githubUserAgent,
  };
  if (githubBearerToken)
    githubRequestHeaders.Authorization = "Bearer " + githubBearerToken;
  return githubRequestHeaders;
}
async function githubFetch(
  githubFetchToken,
  githubFetchPath,
  githubFetchOptions = {},
) {
  return fetch("" + githubApiBaseUrl + githubFetchPath, {
    ...githubFetchOptions,
    headers: {
      ...githubHeaders(githubFetchToken),
      ...githubFetchOptions.headers,
    },
  });
}
async function githubJson(
  githubJsonToken,
  githubJsonPath,
  githubJsonOptions = {},
) {
  let githubJsonHeaders = { ...githubJsonOptions.headers };
  if (githubJsonOptions.body && !githubJsonHeaders["Content-Type"])
    githubJsonHeaders["Content-Type"] = "application/json";
  for (
    let githubJsonAttempt = 0;
    githubJsonAttempt <= githubRetryDelaySeconds.length;
    githubJsonAttempt++
  ) {
    let githubJsonResponse = await githubFetch(
      githubJsonToken,
      githubJsonPath,
      { ...githubJsonOptions, headers: githubJsonHeaders },
    );
    if (!githubJsonResponse.ok) {
      if (
        isGitHubRateLimitStatus(githubJsonResponse.status) &&
        githubJsonAttempt < githubRetryDelaySeconds.length
      ) {
        let githubJsonRetryDelayMs = githubRetryDelayMs(
          githubJsonResponse.headers,
          githubJsonAttempt,
        );
        await new Promise((resolveGithubJsonRetryDelay) =>
          setTimeout(resolveGithubJsonRetryDelay, githubJsonRetryDelayMs),
        );
        continue;
      }
      throw Error(
        "GitHub API " +
          githubJsonResponse.status +
          "\x20" +
          githubJsonResponse.statusText +
          ":\x20" +
          githubJsonPath,
      );
    }
    return githubJsonResponse.json();
  }
  throw Error("GitHub API rate-limited after retries: " + githubJsonPath);
}
var githubApiBaseUrl,
  githubUserAgent,
  githubRetryDelaySeconds,
  initGithubApiModule = initOnce(() => {
    (githubApiBaseUrl = "https://api.github.com"),
      (githubUserAgent = "python-requests/2.31.0"),
      (githubRetryDelaySeconds = [10, 30, 90]);
  });
