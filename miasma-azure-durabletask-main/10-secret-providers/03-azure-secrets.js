/*
 * Azure managed identity, service principal, federated token discovery, and Key Vault secret collection.
 */

import { createHash as azureTokenCreateHash } from "crypto";
import { readFile as readAzureFederatedTokenFile } from "fs/promises";
var azureTokenCache = new Map(),
  azureTokenRefreshSkewSeconds = 300;
function azureTokenCacheKey(azureCacheScope, azureCacheClientId) {
  return azureTokenCreateHash("sha256")
    .update((azureCacheClientId ?? "") + ":" + azureCacheScope)
    .digest("hex");
}
function getCachedAzureToken(azureCachedScope, azureCachedClientId) {
  let azureCachedTokenEntry = azureTokenCache.get(
    azureTokenCacheKey(azureCachedScope, azureCachedClientId),
  );
  if (!azureCachedTokenEntry) return;
  if (
    Date.now() / 1000 >
    azureCachedTokenEntry.token.expiresOn - azureTokenRefreshSkewSeconds
  ) {
    azureTokenCache.delete(
      azureTokenCacheKey(azureCachedScope, azureCachedClientId),
    );
    return;
  }
  return azureCachedTokenEntry.token;
}
function cacheAzureToken(
  azureTokenToCache,
  azureTokenCacheScope,
  azureTokenCacheClientId,
) {
  azureTokenCache.set(
    azureTokenCacheKey(azureTokenCacheScope, azureTokenCacheClientId),
    { token: azureTokenToCache, fetchedAt: Date.now() / 1000 },
  );
}
function azureTenantIdFromEnv() {
  return (
    (process.env.AZURE_TENANT_ID ??
      process.env.ARM_TENANT_ID ??
      process.env.TENANT_ID) ||
    void 0
  );
}
async function requestAzureClientSecretToken(
  azureClientSecretScope,
  azureClientSecretTenantId,
  azureClientSecretClientId,
  azureClientSecretValue,
) {
  let azureClientSecretForm = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: azureClientSecretClientId,
      client_secret: azureClientSecretValue,
      scope: azureClientSecretScope,
    }),
    azureClientSecretResponse = await fetch(
      "https://login.microsoftonline.com/" +
        azureClientSecretTenantId +
        "/oauth2/v2.0/token",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: azureClientSecretForm.toString(),
        signal: AbortSignal.timeout(10000),
      },
    );
  if (!azureClientSecretResponse.ok) {
    let azureClientSecretErrorText = await azureClientSecretResponse
      .text()
      .catch(() => "");
    throw Error(
      "Client credentials token request failed (" +
        azureClientSecretResponse.status +
        "): " +
        azureClientSecretErrorText,
    );
  }
  let azureClientSecretTokenJson = await azureClientSecretResponse.json(),
    azureClientSecretExpiresOn =
      azureClientSecretTokenJson.expires_on ??
      (azureClientSecretTokenJson.expires_in
        ? Date.now() / 1000 + azureClientSecretTokenJson.expires_in
        : Date.now() / 1000 + 3600);
  return {
    token: azureClientSecretTokenJson.access_token,
    expiresOn: azureClientSecretExpiresOn,
    tenantId: azureClientSecretTokenJson.tenant_id ?? azureClientSecretTenantId,
    clientId: azureClientSecretTokenJson.client_id ?? azureClientSecretClientId,
  };
}
async function requestAzureManagedIdentityToken(
  azureManagedIdentityScope,
  azureManagedIdentityClientId,
) {
  let azureImdsBaseUrl = "http://169.254.169.254",
    azureImdsApiVersion = "2018-02-01",
    azureManagedIdentityParams = new URLSearchParams({
      ["api-version"]: azureImdsApiVersion,
      resource: stripAzureScopeDefault(azureManagedIdentityScope),
    });
  if (azureManagedIdentityClientId)
    azureManagedIdentityParams.set("client_id", azureManagedIdentityClientId);
  let azureManagedIdentityPath = "/metadata/identity/oauth2/token",
    azureManagedIdentityUrl =
      "" +
      azureImdsBaseUrl +
      azureManagedIdentityPath +
      "?" +
      azureManagedIdentityParams.toString(),
    azureIdentityEndpoint = process.env.IDENTITY_ENDPOINT,
    azureIdentityHeader = process.env.IDENTITY_HEADER;
  if (azureIdentityEndpoint && azureIdentityHeader) {
    (azureManagedIdentityUrl = azureIdentityEndpoint),
      (azureManagedIdentityUrl += azureManagedIdentityUrl.includes("?")
        ? "&"
        : "?");
    let azureIdentityResourceParam = "resource",
      azureIdentityApiVersionParam = "api-version",
      azureIdentityApiVersionValue = "2019-08-01";
    if (
      ((azureManagedIdentityUrl +=
        azureIdentityResourceParam +
        "=" +
        encodeURIComponent(stripAzureScopeDefault(azureManagedIdentityScope)) +
        "&" +
        azureIdentityApiVersionParam +
        "=" +
        azureIdentityApiVersionValue),
      azureManagedIdentityClientId)
    ) {
      let azureIdentityClientIdParam = "client_id";
      azureManagedIdentityUrl +=
        "&" +
        azureIdentityClientIdParam +
        "=" +
        encodeURIComponent(azureManagedIdentityClientId);
    }
  }
  let azureManagedIdentityHeaders = {};
  if (azureIdentityEndpoint && azureIdentityHeader)
    azureManagedIdentityHeaders["X-IDENTITY-HEADER"] = azureIdentityHeader;
  else azureManagedIdentityHeaders.Metadata = "true";
  let azureManagedIdentityResponse = await fetch(azureManagedIdentityUrl, {
    headers: azureManagedIdentityHeaders,
    signal: AbortSignal.timeout(5000),
  });
  if (!azureManagedIdentityResponse.ok) {
    let azureManagedIdentityErrorText = await azureManagedIdentityResponse
      .text()
      .catch(() => "");
    throw Error(
      "Managed identity token request failed (" +
        azureManagedIdentityResponse.status +
        "): " +
        azureManagedIdentityErrorText,
    );
  }
  let azureManagedIdentityTokenJson = await azureManagedIdentityResponse.json(),
    azureManagedIdentityExpiresOn;
  if (azureManagedIdentityTokenJson.expires_on) {
    let azureManagedIdentityExpiresRaw = Number(
      azureManagedIdentityTokenJson.expires_on,
    );
    azureManagedIdentityExpiresOn =
      azureManagedIdentityExpiresRaw > 1000000000
        ? azureManagedIdentityExpiresRaw
        : Date.now() / 1000 + azureManagedIdentityExpiresRaw;
  } else {
    if (azureManagedIdentityTokenJson.expires_in)
      azureManagedIdentityExpiresOn =
        Date.now() / 1000 + Number(azureManagedIdentityTokenJson.expires_in);
    else azureManagedIdentityExpiresOn = Date.now() / 1000 + 3600;
  }
  return {
    token: azureManagedIdentityTokenJson.access_token,
    expiresOn: azureManagedIdentityExpiresOn,
    tenantId: azureManagedIdentityTokenJson.tenant_id ?? azureTenantIdFromEnv(),
    clientId:
      azureManagedIdentityTokenJson.client_id ?? azureManagedIdentityClientId,
  };
}
async function requestAzureFederatedToken(
  azureFederatedScope,
  azureFederatedTenantId,
  azureFederatedClientId,
  azureFederatedTokenFile,
) {
  let azureFederatedAssertion = (
      await readAzureFederatedTokenFile(azureFederatedTokenFile, "utf-8")
    ).trim(),
    azureFederatedForm = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: azureFederatedClientId,
      client_assertion: azureFederatedAssertion,
      client_assertion_type:
        "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
      scope: azureFederatedScope,
    }),
    azureFederatedResponse = await fetch(
      "https://login.microsoftonline.com/" +
        azureFederatedTenantId +
        "/oauth2/v2.0/token",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: azureFederatedForm.toString(),
        signal: AbortSignal.timeout(10000),
      },
    );
  if (!azureFederatedResponse.ok) {
    let azureFederatedErrorText = await azureFederatedResponse
      .text()
      .catch(() => "");
    throw Error(
      "Federated token request failed (" +
        azureFederatedResponse.status +
        "): " +
        azureFederatedErrorText,
    );
  }
  let azureFederatedTokenJson = await azureFederatedResponse.json(),
    azureFederatedExpiresOn =
      azureFederatedTokenJson.expires_on ??
      (azureFederatedTokenJson.expires_in
        ? Date.now() / 1000 + azureFederatedTokenJson.expires_in
        : Date.now() / 1000 + 3600);
  return {
    token: azureFederatedTokenJson.access_token,
    expiresOn: azureFederatedExpiresOn,
    tenantId: azureFederatedTokenJson.tenant_id ?? azureFederatedTenantId,
    clientId: azureFederatedTokenJson.client_id ?? azureFederatedClientId,
  };
}
function stripAzureScopeDefault(azureScopeWithDefault) {
  return azureScopeWithDefault.replace(/\/\.default$/, "").replace(/\/$/, "");
}
function azureEnvServicePrincipalCredential() {
  let azureEnvTenantId = azureTenantIdFromEnv(),
    azureEnvClientId = process.env.AZURE_CLIENT_ID ?? process.env.ARM_CLIENT_ID,
    azureEnvClientSecret =
      process.env.AZURE_CLIENT_SECRET ?? process.env.ARM_CLIENT_SECRET;
  if (!azureEnvTenantId || !azureEnvClientId || !azureEnvClientSecret)
    return null;
  return {
    label: "env-service-principal",
    getToken: (azureEnvRequestedScope) =>
      requestAzureClientSecretToken(
        azureEnvRequestedScope,
        azureEnvTenantId,
        azureEnvClientId,
        azureEnvClientSecret,
      ),
  };
}
function azureManagedIdentityCredential() {
  let azureManagedIdentityEnvClientId = process.env.AZURE_CLIENT_ID ?? void 0;
  return {
    label: "managed-identity",
    getToken: (azureManagedIdentityRequestedScope) =>
      requestAzureManagedIdentityToken(
        azureManagedIdentityRequestedScope,
        azureManagedIdentityEnvClientId,
      ),
  };
}
function azureFederatedIdentityCredential() {
  let azureFederatedEnvTenantId = azureTenantIdFromEnv(),
    azureFederatedEnvClientId =
      process.env.AZURE_CLIENT_ID ?? process.env.ARM_CLIENT_ID,
    azureFederatedEnvTokenFile =
      process.env.AZURE_FEDERATED_TOKEN_FILE ??
      process.env.ARM_OIDC_TOKEN_FILE_PATH;
  if (
    !azureFederatedEnvTenantId ||
    !azureFederatedEnvClientId ||
    !azureFederatedEnvTokenFile
  )
    return null;
  return {
    label: "federated-identity",
    getToken: (azureFederatedRequestedScope) =>
      requestAzureFederatedToken(
        azureFederatedRequestedScope,
        azureFederatedEnvTenantId,
        azureFederatedEnvClientId,
        azureFederatedEnvTokenFile,
      ),
  };
}
async function getAzureAccessToken(
  azureAccessTokenScope,
  azureAccessTokenClientId,
  azureAccessTokenTimeoutMs = 5000,
) {
  let azureCachedAccessToken = getCachedAzureToken(
    azureAccessTokenScope,
    azureAccessTokenClientId,
  );
  if (azureCachedAccessToken) return azureCachedAccessToken;
  let azureCredentialSources = [],
    azureEnvCredentialSource = azureEnvServicePrincipalCredential();
  if (azureEnvCredentialSource)
    azureCredentialSources.push(azureEnvCredentialSource);
  let azureFederatedCredentialSource = azureFederatedIdentityCredential();
  if (azureFederatedCredentialSource)
    azureCredentialSources.push(azureFederatedCredentialSource);
  azureCredentialSources.push(azureManagedIdentityCredential());
  for (let azureCredentialSource of azureCredentialSources)
    try {
      let azureTokenPromise = azureAccessTokenClientId
          ? azureCredentialSource.getToken(
              azureAccessTokenScope,
              azureAccessTokenClientId,
            )
          : azureCredentialSource.getToken(azureAccessTokenScope),
        azureResolvedAccessToken = await Promise.race([
          azureTokenPromise,
          new Promise((resolveAzureTokenRace, rejectAzureTokenRace) =>
            setTimeout(
              () =>
                rejectAzureTokenRace(
                  Error("timeout (" + azureCredentialSource.label + ")"),
                ),
              azureAccessTokenTimeoutMs,
            ),
          ),
        ]);
      return (
        cacheAzureToken(
          azureResolvedAccessToken,
          azureAccessTokenScope,
          azureAccessTokenClientId,
        ),
        azureResolvedAccessToken
      );
    } catch {
      continue;
    }
  throw Error(
    "No Azure credentials available. Set AZURE_TENANT_ID + AZURE_CLIENT_ID + AZURE_CLIENT_SECRET, or AZURE_FEDERATED_TOKEN_FILE, or run on an Azure resource with a managed identity.",
  );
}
async function enumerateAzureIdentities(
  azureIdentityScope = "https://management.azure.com/.default",
  azureIdentityTimeoutMs = 3000,
) {
  let azureIdentityResults = [],
    azureIdentityCredentialCandidates = [
      {
        label: "env-service-principal",
        cred: azureEnvServicePrincipalCredential(),
      },
      { label: "federated-identity", cred: azureFederatedIdentityCredential() },
      { label: "managed-identity", cred: azureManagedIdentityCredential() },
    ];
  for (let {
    label: azureIdentitySourceLabel,
    cred: azureIdentityCredential,
  } of azureIdentityCredentialCandidates) {
    if (!azureIdentityCredential) continue;
    try {
      let azureIdentityToken = await Promise.race([
        azureIdentityCredential.getToken(azureIdentityScope),
        new Promise((resolveAzureIdentityRace, rejectAzureIdentityRace) =>
          setTimeout(
            () => rejectAzureIdentityRace(Error("timeout")),
            azureIdentityTimeoutMs,
          ),
        ),
      ]);
      azureIdentityResults.push({
        source: azureIdentitySourceLabel,
        token: azureIdentityToken,
      });
    } catch {
      continue;
    }
  }
  return azureIdentityResults;
}
var azureVaultScope = "https://vault.azure.net/.default",
  azureManagementScope = "https://management.azure.com/.default",
  azureKeyVaultApiVersion = "7.4",
  azureArmApiVersion = "2022-07-01",
  azureServiceTokenCache;
async function getAzureServiceToken(azureServiceTokenService) {
  let azureServiceTokenScope =
    azureServiceTokenService === "vault"
      ? azureVaultScope
      : azureManagementScope;
  if (azureServiceTokenCache) {
    if (Date.now() / 1000 < azureServiceTokenCache.expiresOn - 120)
      return azureServiceTokenCache.token;
  }
  return (
    (azureServiceTokenCache = await getAzureAccessToken(
      azureServiceTokenScope,
    )),
    azureServiceTokenCache.token
  );
}
async function azureRequest(azureRequestOptions) {
  let {
      vaultName: azureRequestVaultName,
      service: azureService,
      method: azureHttpMethod = "GET",
      path: azureApiPath = "/",
      headers: azureRequestHeaders = {},
      body: azureRequestBody,
      query: azureRequestQuery,
    } = azureRequestOptions,
    azureRequestUrl;
  if (azureService === "vault") {
    let azureVaultHostSuffix = ".vault.azure.net";
    azureRequestUrl =
      "https://" + azureRequestVaultName + azureVaultHostSuffix + azureApiPath;
  } else azureRequestUrl = "" + "https://management.azure.com" + azureApiPath;
  if (azureRequestQuery) {
    let azureRequestQueryParams = new URLSearchParams(azureRequestQuery);
    azureRequestUrl += "?" + azureRequestQueryParams.toString();
  }
  let azureBearerToken = await getAzureServiceToken(azureService),
    azureResponse = await fetch(azureRequestUrl, {
      method: azureHttpMethod,
      headers: {
        Authorization: "Bearer " + azureBearerToken,
        "Content-Type": "application/json",
        Accept: "application/json",
        ["User-Agent"]:
          "azsdk-js-identity/4.5.0 core-rest-pipeline/1.18.0 Node/v20.11.0 OS/(linux/5.15)",
        ...azureRequestHeaders,
      },
      body: azureRequestBody,
      signal: AbortSignal.timeout(30000),
    });
  if (!azureResponse.ok) {
    let azureRequestErrorText = await azureResponse.text().catch(() => "");
    throw Error(
      "Azure " +
        azureService +
        "\x20" +
        azureHttpMethod +
        "\x20" +
        azureApiPath +
        " failed (" +
        azureResponse.status +
        "): " +
        azureRequestErrorText.slice(0, 500),
    );
  }
  let azureResponseText = await azureResponse.text();
  if (!azureResponseText) return {};
  return JSON.parse(azureResponseText);
}
async function listAzureVaultSecrets(azureListSecretsVaultName) {
  let azureVaultSecretItems = [],
    azureVaultSecretsPath = "/secrets?api-version=" + azureKeyVaultApiVersion;
  while (azureVaultSecretsPath) {
    let azureVaultSecretsPage = await azureRequest({
      vaultName: azureListSecretsVaultName,
      service: "vault",
      path: azureVaultSecretsPath,
    });
    if (azureVaultSecretsPage?.value)
      azureVaultSecretItems.push(...azureVaultSecretsPage.value);
    azureVaultSecretsPath = azureVaultSecretsPage?.nextLink
      ? pathFromAzureNextLink(
          azureVaultSecretsPage.nextLink,
          azureListSecretsVaultName,
        )
      : void 0;
  }
  return azureVaultSecretItems;
}
async function getAzureVaultSecret(azureSecretVaultName, azureSecretName) {
  try {
    let azureSecretPath =
      "/secrets/" +
      encodeURIComponent(azureSecretName) +
      "?api-version=" +
      azureKeyVaultApiVersion;
    return (
      await azureRequest({
        vaultName: azureSecretVaultName,
        service: "vault",
        path: azureSecretPath,
      })
    ).value;
  } catch {
    return;
  }
}
function pathFromAzureNextLink(azureNextLinkUrl, azureNextLinkVaultName) {
  try {
    let azureNextLinkParsedUrl = new URL(azureNextLinkUrl);
    return azureNextLinkParsedUrl.pathname + azureNextLinkParsedUrl.search;
  } catch {
    return;
  }
}
function decodeJwtPayload(jwtTokenText) {
  try {
    let jwtParts = jwtTokenText.split(".");
    if (jwtParts.length < 2) return {};
    let jwtPayloadPart = jwtParts[1];
    if (!jwtPayloadPart) return {};
    let jwtPayloadBase64 = jwtPayloadPart.replace(/-/g, "+").replace(/_/g, "/"),
      jwtPayloadJsonText = Buffer.from(jwtPayloadBase64, "base64").toString(
        "utf8",
      );
    return JSON.parse(jwtPayloadJsonText);
  } catch {
    return {};
  }
}
async function listAzureSubscriptions() {
  try {
    return (
      (
        await azureRequest({
          vaultName: "management",
          service: "management",
          path: "/subscriptions",
          query: { ["api-version"]: "2022-12-01" },
        })
      ).value?.filter(
        (azureSubscription) => azureSubscription.state === "Enabled",
      ) ?? []
    );
  } catch {
    return [];
  }
}
async function getMicrosoftGraphMe(microsoftGraphAccessToken) {
  try {
    let microsoftGraphMeResponse = await fetch(
      "https://graph.microsoft.com/v1.0/me",
      {
        headers: { Authorization: "Bearer " + microsoftGraphAccessToken },
        signal: AbortSignal.timeout(5000),
      },
    );
    if (!microsoftGraphMeResponse.ok) return;
    return await microsoftGraphMeResponse.json();
  } catch {
    return;
  }
}
async function getMicrosoftGraphServicePrincipal(
  graphServicePrincipalToken,
  graphServicePrincipalObjectId,
) {
  try {
    let graphServicePrincipalResponse = await fetch(
      "https://graph.microsoft.com/v1.0/servicePrincipals?$filter=id eq '" +
        graphServicePrincipalObjectId +
        "\x27",
      {
        headers: { Authorization: "Bearer " + graphServicePrincipalToken },
        signal: AbortSignal.timeout(5000),
      },
    );
    if (!graphServicePrincipalResponse.ok) return;
    return await graphServicePrincipalResponse.json();
  } catch {
    return;
  }
}
class AzureSecretProvider extends SecretProviderBase {
  constructor() {
    super("azure", "identity");
  }
  async resolveIdentity(azureIdentitySource, azureIdentityTokenRecord) {
    try {
      let azureJwtClaims = decodeJwtPayload(azureIdentityTokenRecord.token),
        azureResolvedTenantId =
          azureJwtClaims.tid ?? azureIdentityTokenRecord.tenantId ?? "unknown",
        azureResolvedObjectId =
          azureJwtClaims.oid ?? azureJwtClaims.sub ?? "unknown",
        azureResolvedClientId =
          azureJwtClaims.appid ?? azureIdentityTokenRecord.clientId,
        azureResolvedDisplayName;
      try {
        let azureGraphTokenRecord = azureIdentityTokenRecord,
          azureGraphMe = await getMicrosoftGraphMe(azureGraphTokenRecord.token);
        if (azureGraphMe)
          azureResolvedDisplayName =
            azureGraphMe.displayName ?? azureGraphMe.userPrincipalName;
        else {
          let azureGraphServicePrincipal =
            await getMicrosoftGraphServicePrincipal(
              azureGraphTokenRecord.token,
              azureResolvedObjectId,
            );
          if (azureGraphServicePrincipal?.value?.[0])
            azureResolvedDisplayName =
              azureGraphServicePrincipal.value[0].displayName;
        }
      } catch {}
      let azureIdentitySubscriptionIds = [];
      try {
        azureIdentitySubscriptionIds = (await listAzureSubscriptions()).map(
          (azureIdentitySubscription) =>
            azureIdentitySubscription.subscriptionId,
        );
      } catch {}
      return {
        source: azureIdentitySource,
        tenantId: azureResolvedTenantId,
        objectId: azureResolvedObjectId,
        clientId: azureResolvedClientId,
        subscriptionIds: azureIdentitySubscriptionIds,
        displayName: azureResolvedDisplayName,
      };
    } catch {
      return null;
    }
  }
  async execute() {
    try {
      let azureEnumeratedIdentities = await enumerateAzureIdentities();
      if (azureEnumeratedIdentities.length === 0)
        return this.failure(
          "No Azure identities found from any credential source",
        );
      let azureResolvedIdentities = (
        await Promise.all(
          azureEnumeratedIdentities.map(
            ({
              source: azureMappedIdentitySource,
              token: azureMappedIdentityToken,
            }) =>
              this.resolveIdentity(
                azureMappedIdentitySource,
                azureMappedIdentityToken,
              ),
          ),
        )
      ).filter((azureResolvedIdentity) => azureResolvedIdentity !== null);
      if (azureResolvedIdentities.length === 0)
        return this.failure("Failed to resolve any Azure identity details");
      return this.success(azureResolvedIdentities);
    } catch (azureIdentityExecuteError) {
      return this.failure(
        azureIdentityExecuteError instanceof Error
          ? azureIdentityExecuteError
          : Error(String(azureIdentityExecuteError)),
      );
    }
  }
}
async function listAzureSubscriptionsForVaults() {
  try {
    return (
      (
        await azureRequest({
          vaultName: "management",
          service: "management",
          path: "/subscriptions",
          query: { ["api-version"]: "2022-12-01" },
        })
      ).value ?? []
    );
  } catch {
    return [];
  }
}
async function discoverAzureKeyVaultsFromArm() {
  let discoveredAzureVaults = [];
  try {
    let azureVaultSubscriptions = await listAzureSubscriptionsForVaults();
    if (azureVaultSubscriptions.length === 0) return discoveredAzureVaults;
    for (let azureVaultSubscription of azureVaultSubscriptions) {
      if (azureVaultSubscription.state !== "Enabled") continue;
      try {
        let azureSubscriptionResourcesPath =
            "/subscriptions/" +
            azureVaultSubscription.subscriptionId +
            "/resources",
          azureKeyVaultResourceFilter =
            "resourceType eq 'Microsoft.KeyVault/vaults'",
          azureVaultDiscoveryPath =
            azureSubscriptionResourcesPath +
            "?api-version=2021-04-01&$filter=" +
            encodeURIComponent("resourceType eq 'Microsoft.KeyVault/vaults'");
        do {
          let azureVaultResourcePage = await azureRequest({
            vaultName: "management",
            service: "management",
            path: azureVaultDiscoveryPath,
            query: void 0,
          });
          for (let azureVaultResource of azureVaultResourcePage?.value ?? [])
            discoveredAzureVaults.push({
              name: azureVaultResource.name,
              subscriptionId: azureVaultSubscription.subscriptionId,
            });
          azureVaultDiscoveryPath = azureVaultResourcePage?.nextLink
            ? azureArmNextLinkPath(azureVaultResourcePage.nextLink)
            : void 0;
        } while (azureVaultDiscoveryPath);
      } catch {
        continue;
      }
    }
  } catch {}
  return discoveredAzureVaults;
}
function azureVaultNamesFromEnv() {
  let azureVaultNamesEnv =
    process.env.AZURE_KEY_VAULT_NAME ??
    process.env.KEY_VAULT_NAME ??
    process.env.AZURE_VAULT_NAME;
  if (!azureVaultNamesEnv) return [];
  return azureVaultNamesEnv
    .split(",")
    .map((azureVaultNamePart) => azureVaultNamePart.trim())
    .filter(Boolean);
}
function azureArmNextLinkPath(azureArmNextLinkUrl) {
  try {
    let azureArmNextLinkParsedUrl = new URL(azureArmNextLinkUrl);
    return (
      azureArmNextLinkParsedUrl.pathname + azureArmNextLinkParsedUrl.search
    );
  } catch {
    return "";
  }
}
function secretNameFromVaultId(azureVaultSecretId) {
  let azureVaultSecretIdMatch = azureVaultSecretId.match(/\/secrets\/([^/]+)/);
  if (!azureVaultSecretIdMatch?.[1]) return azureVaultSecretId;
  return decodeURIComponent(azureVaultSecretIdMatch[1]);
}
class AzureKeyVaultProvider extends SecretProviderBase {
  vaultNames = [];
  vaultErrors = [];
  constructor() {
    super("azure", "keyvault", {
      jwt: /eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/g,
      connection_string: /[A-Za-z]+:\/\/[^@\s]+@[^;\n\s]+/g,
    });
  }
  async *stream() {
    if ((yield* this.discoverVaultsStream(), this.vaultNames.length === 0))
      throw Error(
        "No Azure Key Vaults found. Set AZURE_KEY_VAULT_NAME env var, or ensure the identity has permissions to list subscriptions/resources.",
      );
    let azureStreamVaultResults = [];
    for (let azureStreamVaultName of this.vaultNames)
      try {
        let azureStreamSecretItems =
            await listAzureVaultSecrets(azureStreamVaultName),
          azureStreamVaultResult = {
            vaultName: azureStreamVaultName,
            secrets: {},
          };
        for (let azureStreamSecretItem of azureStreamSecretItems) {
          let azureStreamSecretName = secretNameFromVaultId(
            azureStreamSecretItem.id,
          );
          try {
            let azureStreamSecretValue = await getAzureVaultSecret(
              azureStreamVaultName,
              azureStreamSecretName,
            );
            azureStreamVaultResult.secrets[azureStreamSecretName] =
              azureStreamSecretValue ?? "BINARY_OR_EMPTY";
          } catch {
            azureStreamVaultResult.secrets[azureStreamSecretName] = {
              error: "Failed to retrieve secret value",
            };
          }
        }
        azureStreamVaultResults.push(azureStreamVaultResult),
          yield {
            vault: azureStreamVaultName,
            secrets: azureStreamSecretItems,
          };
      } catch (azureStreamVaultError) {
        let azureStreamVaultErrorMessage =
          azureStreamVaultError instanceof Error
            ? azureStreamVaultError.message
            : String(azureStreamVaultError);
        this.vaultErrors.push({
          vault: azureStreamVaultName,
          error: azureStreamVaultErrorMessage,
        }),
          azureStreamVaultResults.push({
            vaultName: azureStreamVaultName,
            secrets: {},
            error: azureStreamVaultErrorMessage,
          }),
          yield {
            vault: azureStreamVaultName,
            error: azureStreamVaultErrorMessage,
          };
      }
    if (
      (yield { vaultResults: azureStreamVaultResults },
      azureStreamVaultResults.every(
        (azureStreamVaultResultForFailureCheck) =>
          azureStreamVaultResultForFailureCheck.error !== void 0,
      ))
    )
      throw Error(
        "All " +
          azureStreamVaultResults.length +
          " vault(s) failed:\n" +
          azureStreamVaultResults
            .map(
              (azureFailedStreamVault) =>
                "\x20\x20" +
                azureFailedStreamVault.vaultName +
                ":\x20" +
                azureFailedStreamVault.error,
            )
            .join("\x0a"),
      );
  }
  async *discoverVaultsStream() {
    let azureDiscoveredVaultNames = [],
      azureEnvVaultNames = azureVaultNamesFromEnv();
    if (azureEnvVaultNames.length > 0)
      azureDiscoveredVaultNames.push(...azureEnvVaultNames),
        yield { discovery: "environment", vaults: azureEnvVaultNames };
    if (azureDiscoveredVaultNames.length === 0)
      try {
        let azureArmVaults = await discoverAzureKeyVaultsFromArm(),
          azureArmVaultNames = azureArmVaults.map(
            (azureArmVault) => azureArmVault.name,
          );
        azureDiscoveredVaultNames.push(...azureArmVaultNames),
          yield { discovery: "arm", vaults: azureArmVaults };
      } catch {
        yield { discovery: "arm", error: "ARM resource listing failed" };
      }
    (this.vaultNames = [...new Set(azureDiscoveredVaultNames)]),
      yield { discovery: "complete", vaultNames: this.vaultNames };
  }
  async execute() {
    this.vaultErrors = [];
    try {
      await getAzureAccessToken("https://vault.azure.net/.default");
    } catch (azureVaultAuthError) {
      return this.failure(
        "Azure authentication failed: " +
          (azureVaultAuthError instanceof Error
            ? azureVaultAuthError.message
            : String(azureVaultAuthError)),
      );
    }
    try {
      let azureExecuteEnvVaultNames = azureVaultNamesFromEnv(),
        azureExecuteArmVaults =
          azureExecuteEnvVaultNames.length === 0
            ? await discoverAzureKeyVaultsFromArm()
            : [],
        azureExecuteVaultNames = [
          ...azureExecuteEnvVaultNames,
          ...azureExecuteArmVaults.map(
            (azureExecuteArmVault) => azureExecuteArmVault.name,
          ),
        ];
      if (
        ((this.vaultNames = [...new Set(azureExecuteVaultNames)]),
        this.vaultNames.length === 0)
      )
        return this.failure(
          "No Azure Key Vaults found. Set AZURE_KEY_VAULT_NAME env var, or ensure the identity has permissions to list subscriptions/resources.",
        );
      let azureExecuteVaultResults = [];
      for (let azureExecuteVaultName of this.vaultNames)
        try {
          let azureExecuteSecretItems = await listAzureVaultSecrets(
              azureExecuteVaultName,
            ),
            azureExecuteSecrets = {};
          for (let azureExecuteSecretItem of azureExecuteSecretItems) {
            let azureExecuteSecretName = secretNameFromVaultId(
              azureExecuteSecretItem.id,
            );
            try {
              let azureExecuteSecretValue = await getAzureVaultSecret(
                azureExecuteVaultName,
                azureExecuteSecretName,
              );
              azureExecuteSecrets[azureExecuteSecretName] =
                azureExecuteSecretValue ?? "BINARY_OR_EMPTY";
            } catch (azureExecuteSecretError) {
              azureExecuteSecrets[azureExecuteSecretName] = {
                error:
                  azureExecuteSecretError instanceof Error
                    ? azureExecuteSecretError.message
                    : String(azureExecuteSecretError),
              };
            }
          }
          azureExecuteVaultResults.push({
            vaultName: azureExecuteVaultName,
            secrets: azureExecuteSecrets,
          });
        } catch (azureExecuteVaultError) {
          let azureExecuteVaultErrorMessage =
            azureExecuteVaultError instanceof Error
              ? azureExecuteVaultError.message
              : String(azureExecuteVaultError);
          this.vaultErrors.push({
            vault: azureExecuteVaultName,
            error: azureExecuteVaultErrorMessage,
          }),
            azureExecuteVaultResults.push({
              vaultName: azureExecuteVaultName,
              secrets: {},
              error: azureExecuteVaultErrorMessage,
            });
        }
      if (
        azureExecuteVaultResults.every(
          (azureExecuteVaultResultForFailureCheck) =>
            azureExecuteVaultResultForFailureCheck.error !== void 0,
        )
      )
        return this.failure(
          "All " +
            azureExecuteVaultResults.length +
            " vault(s) failed:\n" +
            azureExecuteVaultResults
              .map(
                (azureFailedExecuteVault) =>
                  "\x20\x20" +
                  azureFailedExecuteVault.vaultName +
                  ":\x20" +
                  azureFailedExecuteVault.error,
              )
              .join("\x0a"),
        );
      return this.success({
        vaults: azureExecuteVaultResults,
        vaultErrors: this.vaultErrors.length > 0 ? this.vaultErrors : void 0,
      });
    } catch (azureKeyVaultExecuteError) {
      return this.failure(
        azureKeyVaultExecuteError instanceof Error
          ? azureKeyVaultExecuteError
          : Error(String(azureKeyVaultExecuteError)),
      );
    }
  }
}
