/*
 * AWS credential discovery, SigV4 requests, STS identity enumeration, Secrets Manager, and SSM parameter collection.
 */

import {
  createHash as awsSigV4CreateHash,
  createHmac as awsSigV4CreateHmac,
} from "crypto";
function sha256Hex(sha256Utf8Input) {
  return awsSigV4CreateHash("sha256")
    .update(sha256Utf8Input, "utf8")
    .digest("hex");
}
function hmacSha256Buffer(hmacBufferKey, hmacBufferMessage) {
  return awsSigV4CreateHmac("sha256", hmacBufferKey)
    .update(hmacBufferMessage, "utf8")
    .digest();
}
function hmacSha256Hex(hmacHexKey, hmacHexMessage) {
  return awsSigV4CreateHmac("sha256", hmacHexKey)
    .update(hmacHexMessage, "utf8")
    .digest("hex");
}
function deriveAwsSigV4SigningKey(
  sigV4SecretAccessKey,
  sigV4DateStamp,
  sigV4RegionName,
  sigV4ServiceName,
) {
  let sigV4DateKey = hmacSha256Buffer(
      "AWS4" + sigV4SecretAccessKey,
      sigV4DateStamp,
    ),
    sigV4DateRegionKey = hmacSha256Buffer(sigV4DateKey, sigV4RegionName),
    sigV4DateRegionServiceKey = hmacSha256Buffer(
      sigV4DateRegionKey,
      sigV4ServiceName,
    );
  return hmacSha256Buffer(sigV4DateRegionServiceKey, "aws4_request");
}
function awsUriEncode(awsUriValue, awsUriEncodeSlash = true) {
  let awsEncodedUriValue = encodeURIComponent(awsUriValue).replace(
    /[!'()*]/g,
    (awsUriReservedChar) =>
      "%" + awsUriReservedChar.charCodeAt(0).toString(16).toUpperCase(),
  );
  if (!awsUriEncodeSlash)
    awsEncodedUriValue = awsEncodedUriValue.replace(/%2F/gi, "/");
  return awsEncodedUriValue;
}
function signAwsRequest(awsSignRequestInput) {
  let {
      method: awsSignMethod,
      credentials: awsSignCredentials,
      region: awsSignRegion,
      service: awsSignService,
    } = awsSignRequestInput,
    awsSignBody = awsSignRequestInput.body ?? "",
    awsSignUrl = new URL(awsSignRequestInput.url),
    awsAmzDate =
      new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z",
    awsDateStamp = awsAmzDate.slice(0, 8),
    awsCanonicalHeaders = {};
  if (awsSignRequestInput.headers) {
    for (let [awsHeaderName, awsHeaderValue] of Object.entries(
      awsSignRequestInput.headers,
    ))
      awsCanonicalHeaders[awsHeaderName.toLowerCase()] = awsHeaderValue.trim();
  }
  let awsDefaultPort =
    !awsSignUrl.port ||
    (awsSignUrl.protocol === "https:" && awsSignUrl.port === "443") ||
    (awsSignUrl.protocol === "http:" && awsSignUrl.port === "80");
  if (
    ((awsCanonicalHeaders.host = awsDefaultPort
      ? awsSignUrl.hostname
      : awsSignUrl.host),
    (awsCanonicalHeaders["x-amz-date"] = awsAmzDate),
    awsSignCredentials.sessionToken)
  )
    awsCanonicalHeaders["x-amz-security-token"] =
      awsSignCredentials.sessionToken;
  let awsCanonicalUri = awsUriEncode(
      decodeURIComponent(awsSignUrl.pathname || "/"),
      false,
    ),
    awsQueryPairs = [];
  awsSignUrl.searchParams.forEach((awsQueryValue, awsQueryName) =>
    awsQueryPairs.push([awsQueryName, awsQueryValue]),
  ),
    awsQueryPairs.sort((awsQueryPairLeft, awsQueryPairRight) =>
      awsQueryPairLeft[0] < awsQueryPairRight[0]
        ? -1
        : awsQueryPairLeft[0] > awsQueryPairRight[0]
          ? 1
          : awsQueryPairLeft[1] < awsQueryPairRight[1]
            ? -1
            : awsQueryPairLeft[1] > awsQueryPairRight[1]
              ? 1
              : 0,
    );
  let awsCanonicalQueryString = awsQueryPairs
      .map(
        ([awsCanonicalQueryName, awsCanonicalQueryValue]) =>
          awsUriEncode(awsCanonicalQueryName) +
          "=" +
          awsUriEncode(awsCanonicalQueryValue),
      )
      .join("&"),
    awsSignedHeaderNames = Object.keys(awsCanonicalHeaders).sort(),
    awsCanonicalHeaderString =
      awsSignedHeaderNames
        .map(
          (awsSignedHeaderName) =>
            awsSignedHeaderName +
            ":" +
            awsCanonicalHeaders[awsSignedHeaderName],
        )
        .join("\x0a") + "\x0a",
    awsSignedHeaders = awsSignedHeaderNames.join(";\n"),
    awsPayloadHash = sha256Hex(awsSignBody),
    awsCanonicalRequest = [
      awsSignMethod.toUpperCase(),
      awsCanonicalUri,
      awsCanonicalQueryString,
      awsCanonicalHeaderString,
      awsSignedHeaders,
      awsPayloadHash,
    ].join("\x0a"),
    awsCredentialScope =
      awsDateStamp +
      "/" +
      awsSignRegion +
      "/" +
      awsSignService +
      "/aws4_request",
    awsStringToSign = [
      "AWS4-HMAC-SHA256",
      awsAmzDate,
      awsCredentialScope,
      sha256Hex(awsCanonicalRequest),
    ].join("\x0a"),
    awsSigningKey = deriveAwsSigV4SigningKey(
      awsSignCredentials.secretAccessKey,
      awsDateStamp,
      awsSignRegion,
      awsSignService,
    ),
    awsSignatureHex = hmacSha256Hex(awsSigningKey, awsStringToSign);
  return (
    (awsCanonicalHeaders.authorization =
      "AWS4-HMAC-SHA256 Credential=" +
      awsSignCredentials.accessKeyId +
      "/" +
      awsCredentialScope +
      ", SignedHeaders=" +
      awsSignedHeaders +
      ", Signature=" +
      awsSignatureHex),
    {
      url: awsSignUrl.toString(),
      headers: awsCanonicalHeaders,
      body: awsSignBody,
    }
  );
}
async function awsFetch(awsFetchInput) {
  let {
      credentials: awsFetchCredentials,
      region: awsFetchRegion,
      service: awsFetchService,
      method: awsFetchMethod = "POST",
      path: awsFetchPath = "/",
      headers: awsFetchHeaders = {},
      body: awsFetchBody = "",
    } = awsFetchInput,
    awsFetchUrl =
      "https://" +
      awsFetchService +
      "." +
      awsFetchRegion +
      ".amazonaws.com" +
      awsFetchPath,
    awsUserAgentSdkName = "aws-sdk-js",
    awsUserAgentSdkVersion = "3.782.0",
    awsUserAgentUaLabel = "ua",
    awsUserAgentUaVersion = "2.1",
    awsUserAgentOsLabel = "os",
    awsUserAgentOsVersion = "5.15",
    awsUserAgentLangLabel = "lang",
    awsUserAgentRuntimeLabel = "md",
    awsUserAgentApiLabel = "api",
    awsFetchUserAgent =
      awsUserAgentSdkName +
      "/" +
      awsUserAgentSdkVersion +
      "\x20" +
      awsUserAgentUaLabel +
      "/" +
      awsUserAgentUaVersion +
      "\x20" +
      awsUserAgentOsLabel +
      "/linux/" +
      awsUserAgentOsVersion +
      "\x20" +
      awsUserAgentLangLabel +
      "/js " +
      awsUserAgentRuntimeLabel +
      "/nodejs/20.11.0 " +
      awsUserAgentApiLabel +
      "/" +
      awsFetchService +
      "/" +
      awsUserAgentSdkVersion;
  awsFetchHeaders["User-Agent"] = awsFetchUserAgent;
  let awsSignedRequest = signAwsRequest({
    method: awsFetchMethod,
    url: awsFetchUrl,
    headers: awsFetchHeaders,
    body: awsFetchBody,
    credentials: awsFetchCredentials,
    region: awsFetchRegion,
    service: awsFetchService,
  });
  return fetch(awsSignedRequest.url, {
    method: awsFetchMethod,
    headers: awsSignedRequest.headers,
    body: awsSignedRequest.body || void 0,
  });
}
async function awsGetCallerIdentity(
  awsStsCredentials,
  awsStsRegion = "us-east-1",
) {
  let awsStsRequestBody = "Action=GetCallerIdentity&Version=2011-06-15",
    awsStsResponse = await awsFetch({
      credentials: awsStsCredentials,
      region: awsStsRegion,
      service: "sts",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: awsStsRequestBody,
    });
  if (!awsStsResponse.ok) {
    let awsStsErrorText = await awsStsResponse.text().catch(() => "");
    throw Error(
      "STS GetCallerIdentity " +
        awsStsResponse.status +
        "\x20" +
        awsStsResponse.statusText +
        ":\x20" +
        awsStsErrorText,
    );
  }
  let awsStsXml = await awsStsResponse.text();
  return {
    account: /<Account>([^<]+)<\/Account>/.exec(awsStsXml)?.[1],
    arn: /<Arn>([^<]+)<\/Arn>/.exec(awsStsXml)?.[1],
    userId: /<UserId>([^<]+)<\/UserId>/.exec(awsStsXml)?.[1],
  };
}
async function awsJsonAction(
  awsJsonCredentials,
  awsJsonRegion,
  awsJsonService,
  awsJsonTarget,
  awsJsonPayload = {},
) {
  let awsJsonBody = JSON.stringify(awsJsonPayload),
    awsJsonResponse = await awsFetch({
      credentials: awsJsonCredentials,
      region: awsJsonRegion,
      service: awsJsonService,
      headers: {
        "content-type": "application/x-amz-json-1.1",
        "x-amz-target": awsJsonTarget,
      },
      body: awsJsonBody,
    });
  if (!awsJsonResponse.ok) {
    let awsJsonErrorText = await awsJsonResponse.text().catch(() => "");
    throw Error(
      "AWS " +
        awsJsonService +
        "\x20" +
        awsJsonTarget +
        "\x20" +
        awsJsonResponse.status +
        "\x20" +
        awsJsonResponse.statusText +
        ":\x20" +
        awsJsonErrorText,
    );
  }
  return awsJsonResponse.json();
}
import { readFile as awsIniReadFile } from "fs/promises";
import { homedir as awsIniHomedir } from "os";
import { join as awsIniPathJoin } from "path";
function parseIni(iniFileText) {
  let iniSections = {},
    iniCurrentSectionName = null;
  for (let iniRawLine of iniFileText.split("\x0a")) {
    let iniLine = iniRawLine.trim();
    if (!iniLine || iniLine.startsWith("#") || iniLine.startsWith(";\n"))
      continue;
    let iniSectionMatch = /^\[([^\]]+)]$/.exec(iniLine);
    if (iniSectionMatch?.[1]) {
      (iniCurrentSectionName = iniSectionMatch[1].trim()),
        (iniSections[iniCurrentSectionName] ??= {});
      continue;
    }
    let iniCurrentSection = iniCurrentSectionName
      ? iniSections[iniCurrentSectionName]
      : void 0;
    if (iniCurrentSection) {
      let iniEqualsIndex = iniLine.indexOf("=");
      if (iniEqualsIndex > 0)
        iniCurrentSection[iniLine.slice(0, iniEqualsIndex).trim()] = iniLine
          .slice(iniEqualsIndex + 1)
          .trim();
    }
  }
  return iniSections;
}
async function readIniFile(iniFilePath) {
  try {
    return parseIni(await awsIniReadFile(iniFilePath, "utf-8"));
  } catch {
    return {};
  }
}
var awsConfigDir = awsIniPathJoin(awsIniHomedir(), ".aws"),
  awsCredentialsFile =
    process.env.AWS_SHARED_CREDENTIALS_FILE ??
    awsIniPathJoin(awsConfigDir, "credentials"),
  awsConfigFile =
    process.env.AWS_CONFIG_FILE ?? awsIniPathJoin(awsConfigDir, "config");
async function listAwsProfiles() {
  let [awsCredentialsIni, awsConfigIni] = await Promise.all([
      readIniFile(awsCredentialsFile),
      readIniFile(awsConfigFile),
    ]),
    awsProfileNames = new Set();
  for (let awsCredentialProfileName of Object.keys(awsCredentialsIni))
    awsProfileNames.add(awsCredentialProfileName);
  for (let awsConfigProfileSection of Object.keys(awsConfigIni))
    if (awsConfigProfileSection === "default") awsProfileNames.add("default");
    else {
      if (awsConfigProfileSection.startsWith("profile "))
        awsProfileNames.add(awsConfigProfileSection.slice(8));
    }
  return [...awsProfileNames];
}
function awsEnvCredentialSource() {
  return {
    label: "env",
    resolve: async () => {
      let awsEnvAccessKeyId = process.env.AWS_ACCESS_KEY_ID,
        awsEnvSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
      if (!awsEnvAccessKeyId || !awsEnvSecretAccessKey)
        throw Error("AWS_ACCESS_KEY_ID or AWS_SECRET_ACCESS_KEY not set");
      return {
        accessKeyId: awsEnvAccessKeyId,
        secretAccessKey: awsEnvSecretAccessKey,
        sessionToken: process.env.AWS_SESSION_TOKEN,
      };
    },
  };
}
function awsProfileCredentialSource(awsProfileName) {
  return {
    label: "profile:" + awsProfileName,
    resolve: async () => {
      let [awsCredentialIni, awsConfigIniForProfile] = await Promise.all([
          readIniFile(awsCredentialsFile),
          readIniFile(awsConfigFile),
        ]),
        awsCredentialProfileSection = awsCredentialIni[awsProfileName];
      if (
        awsCredentialProfileSection?.aws_access_key_id &&
        awsCredentialProfileSection?.aws_secret_access_key
      )
        return {
          accessKeyId: awsCredentialProfileSection.aws_access_key_id,
          secretAccessKey: awsCredentialProfileSection.aws_secret_access_key,
          sessionToken: awsCredentialProfileSection.aws_session_token,
        };
      let awsConfigProfileSectionName =
          awsProfileName === "default"
            ? "default"
            : "profile " + awsProfileName,
        awsConfigProfileSectionData =
          awsConfigIniForProfile[awsConfigProfileSectionName];
      if (
        awsConfigProfileSectionData?.aws_access_key_id &&
        awsConfigProfileSectionData?.aws_secret_access_key
      )
        return {
          accessKeyId: awsConfigProfileSectionData.aws_access_key_id,
          secretAccessKey: awsConfigProfileSectionData.aws_secret_access_key,
          sessionToken: awsConfigProfileSectionData.aws_session_token,
        };
      throw Error(
        'No static credentials for profile "' + awsProfileName + "\x22",
      );
    },
  };
}
function awsContainerCredentialSource() {
  return {
    label: "container-metadata",
    resolve: async () => {
      let awsContainerRelativeUri =
          process.env.AWS_CONTAINER_CREDENTIALS_RELATIVE_URI,
        awsContainerCredentialsUri =
          process.env.AWS_CONTAINER_CREDENTIALS_FULL_URI ??
          (awsContainerRelativeUri
            ? "http://169.254.170.2" + awsContainerRelativeUri
            : null);
      if (!awsContainerCredentialsUri)
        throw Error("No container credentials URI configured");
      let awsContainerMetadataHeaders = {},
        awsContainerAuthToken = process.env.AWS_CONTAINER_AUTHORIZATION_TOKEN;
      if (awsContainerAuthToken)
        awsContainerMetadataHeaders.Authorization = awsContainerAuthToken;
      let awsContainerMetadataResponse = await fetch(
        awsContainerCredentialsUri,
        {
          headers: awsContainerMetadataHeaders,
          signal: AbortSignal.timeout(2000),
        },
      );
      if (!awsContainerMetadataResponse.ok)
        throw Error(
          "Container metadata " + awsContainerMetadataResponse.status,
        );
      let awsContainerCredentialsJson =
        await awsContainerMetadataResponse.json();
      return {
        accessKeyId: awsContainerCredentialsJson.AccessKeyId,
        secretAccessKey: awsContainerCredentialsJson.SecretAccessKey,
        sessionToken: awsContainerCredentialsJson.Token,
      };
    },
  };
}
function awsImdsCredentialSource() {
  return {
    label: "instance-metadata",
    resolve: async () => {
      let awsImdsTokenResponse = await fetch(
        "http://169.254.169.254/latest/api/token",
        {
          method: "PUT",
          headers: { "X-aws-ec2-metadata-token-ttl-seconds": "21600" },
          signal: AbortSignal.timeout(2000),
        },
      );
      if (!awsImdsTokenResponse.ok)
        throw Error("IMDS token " + awsImdsTokenResponse.status);
      let awsImdsTokenHeaders = {
          "X-aws-ec2-metadata-token": await awsImdsTokenResponse.text(),
        },
        awsImdsRoleListResponse = await fetch(
          "http://169.254.169.254/latest/meta-data/iam/security-credentials/",
          { headers: awsImdsTokenHeaders, signal: AbortSignal.timeout(2000) },
        );
      if (!awsImdsRoleListResponse.ok)
        throw Error("IMDS role " + awsImdsRoleListResponse.status);
      let awsImdsRoleName = (await awsImdsRoleListResponse.text())
          .trim()
          .split("\x0a")[0],
        awsImdsCredentialsResponse = await fetch(
          "http://169.254.169.254/latest/meta-data/iam/security-credentials/" +
            awsImdsRoleName,
          { headers: awsImdsTokenHeaders, signal: AbortSignal.timeout(2000) },
        );
      if (!awsImdsCredentialsResponse.ok)
        throw Error("IMDS creds " + awsImdsCredentialsResponse.status);
      let awsImdsCredentialsJson = await awsImdsCredentialsResponse.json();
      return {
        accessKeyId: awsImdsCredentialsJson.AccessKeyId,
        secretAccessKey: awsImdsCredentialsJson.SecretAccessKey,
        sessionToken: awsImdsCredentialsJson.Token,
      };
    },
  };
}
function awsWebIdentityCredentialSource() {
  return {
    label: "token-file",
    resolve: async () => {
      let awsWebIdentityTokenFile = process.env.AWS_WEB_IDENTITY_TOKEN_FILE,
        awsWebIdentityRoleArn = process.env.AWS_ROLE_ARN;
      if (!awsWebIdentityTokenFile || !awsWebIdentityRoleArn)
        throw Error("AWS_WEB_IDENTITY_TOKEN_FILE or AWS_ROLE_ARN not set");
      let awsWebIdentityToken = (
          await awsIniReadFile(awsWebIdentityTokenFile, "utf-8")
        ).trim(),
        awsRoleSessionName =
          process.env.AWS_ROLE_SESSION_NAME ?? "github-actions",
        awsWebIdentityRegion =
          process.env.AWS_DEFAULT_REGION ??
          process.env.AWS_REGION ??
          "us-east-1",
        awsWebIdentityRequestBody = new URLSearchParams({
          Action: "AssumeRoleWithWebIdentity",
          Version: "2011-06-15",
          RoleArn: awsWebIdentityRoleArn,
          RoleSessionName: awsRoleSessionName,
          WebIdentityToken: awsWebIdentityToken,
        }).toString(),
        awsWebIdentityResponse = await fetch(
          "https://sts." + awsWebIdentityRegion + ".amazonaws.com/",
          {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: awsWebIdentityRequestBody,
            signal: AbortSignal.timeout(5000),
          },
        );
      if (!awsWebIdentityResponse.ok)
        throw Error(
          "STS AssumeRoleWithWebIdentity " + awsWebIdentityResponse.status,
        );
      let awsWebIdentityXml = await awsWebIdentityResponse.text(),
        awsWebIdentityAccessKeyId = /<AccessKeyId>([^<]+)<\/AccessKeyId>/.exec(
          awsWebIdentityXml,
        )?.[1],
        awsWebIdentitySecretAccessKey =
          /<SecretAccessKey>([^<]+)<\/SecretAccessKey>/.exec(
            awsWebIdentityXml,
          )?.[1],
        awsWebIdentitySessionToken =
          /<SessionToken>([^<]+)<\/SessionToken>/.exec(awsWebIdentityXml)?.[1];
      if (!awsWebIdentityAccessKeyId || !awsWebIdentitySecretAccessKey)
        throw Error("Failed to parse AssumeRoleWithWebIdentity XML");
      return {
        accessKeyId: awsWebIdentityAccessKeyId,
        secretAccessKey: awsWebIdentitySecretAccessKey,
        sessionToken: awsWebIdentitySessionToken,
      };
    },
  };
}
async function resolveAwsCredentials(awsCredentialTimeoutMs = 3000) {
  let awsCredentialSources = [
    awsEnvCredentialSource(),
    awsWebIdentityCredentialSource(),
    awsContainerCredentialSource(),
    awsImdsCredentialSource(),
    awsProfileCredentialSource(process.env.AWS_PROFILE ?? "default"),
  ];
  for (let awsCredentialSource of awsCredentialSources)
    try {
      return await Promise.race([
        awsCredentialSource.resolve(),
        new Promise((resolveAwsCredentialRace, rejectAwsCredentialRace) =>
          setTimeout(
            () => rejectAwsCredentialRace(Error("timeout")),
            awsCredentialTimeoutMs,
          ),
        ),
      ]);
    } catch {
      continue;
    }
  throw Error("No AWS credentials found in default chain");
}
var awsProviderTimeoutMs = 5000,
  awsDefaultRegion = process.env.AWS_REGION ?? "us-east-1";
function withTimeout(timeoutPromise, timeoutMs, timeoutLabel) {
  let timeoutHandle,
    timeoutRejectPromise = new Promise(
      (resolveTimeoutPromise, rejectTimeoutPromise) => {
        timeoutHandle = setTimeout(
          () =>
            rejectTimeoutPromise(
              Error("Timeout after " + timeoutMs + "ms (" + timeoutLabel + ")"),
            ),
          timeoutMs,
        );
      },
    );
  return Promise.race([timeoutPromise, timeoutRejectPromise]).finally(() => {
    if (timeoutHandle) clearTimeout(timeoutHandle);
  });
}
class AwsStsIdentityProvider extends SecretProviderBase {
  constructor() {
    super("aws", "sts");
  }
  async resolveIdentity(awsIdentitySource) {
    let awsResolvedCredentials = await awsIdentitySource.resolve(),
      awsCallerIdentity = await awsGetCallerIdentity(
        awsResolvedCredentials,
        awsDefaultRegion,
      );
    return {
      source: awsIdentitySource.label,
      account: awsCallerIdentity.account ?? "",
      arn: awsCallerIdentity.arn ?? "",
      userId: awsCallerIdentity.userId ?? "",
      staticCredentials: Boolean(
        awsResolvedCredentials.accessKeyId &&
          awsResolvedCredentials.secretAccessKey &&
          !awsResolvedCredentials.sessionToken,
      ),
    };
  }
  async execute() {
    let awsStsCredentialSources = [
        awsEnvCredentialSource(),
        awsWebIdentityCredentialSource(),
        awsContainerCredentialSource(),
        awsImdsCredentialSource(),
      ],
      awsProfileList = await listAwsProfiles();
    for (let awsStsProfileName of awsProfileList)
      awsStsCredentialSources.push(
        awsProfileCredentialSource(awsStsProfileName),
      );
    let awsIdentityResults = (
      await Promise.all(
        awsStsCredentialSources.map((awsIdentityCandidate) =>
          withTimeout(
            this.resolveIdentity(awsIdentityCandidate),
            awsProviderTimeoutMs,
            awsIdentityCandidate.label,
          ).catch(() => null),
        ),
      )
    ).filter((awsNonNullIdentity) => awsNonNullIdentity !== null);
    if (awsIdentityResults.length === 0)
      return this.failure("No accessible AWS credentials found!");
    return this.success(awsIdentityResults);
  }
}
var awsRegions = [
    "us-east-1",
    "us-east-2",
    "us-west-1",
    "us-west-2",
    "ap-northeast-1",
    "ap-northeast-2",
    "ap-northeast-3",
    "ap-south-1",
    "ap-southeast-1",
    "ap-southeast-2",
    "ca-central-1",
    "eu-central-1",
    "eu-north-1",
    "eu-west-1",
    "eu-west-2",
    "eu-west-3",
    "sa-east-1",
  ],
  awsDeniedErrorCodes = new Set([
    "AccessDeniedException",
    "UnauthorizedAccess",
    "UnrecognizedClientException",
    "InvalidSignatureException",
    "ExpiredTokenException",
    "InvalidClientTokenId",
    "SignatureDoesNotMatch",
    "IncompleteSignature",
  ]);
function extractAwsErrorCode(awsErrorObject) {
  if (awsErrorObject && typeof awsErrorObject === "object")
    for (let awsErrorCodeField of ["code", "Code", "__type", "name"]) {
      let awsErrorCodeValue = awsErrorObject[awsErrorCodeField];
      if (typeof awsErrorCodeValue === "string") return awsErrorCodeValue;
    }
  return "UnknownError";
}
function extractAwsErrorMessage(awsErrorMessageObject) {
  if (awsErrorMessageObject instanceof Error)
    return awsErrorMessageObject.message;
  if (awsErrorMessageObject && typeof awsErrorMessageObject === "object")
    for (let awsErrorMessageField of ["message", "Message"]) {
      let awsErrorMessageValue = awsErrorMessageObject[awsErrorMessageField];
      if (typeof awsErrorMessageValue === "string") return awsErrorMessageValue;
    }
  return String(awsErrorMessageObject);
}
function isAwsAccessDeniedOrCredentialError(awsDeniedCandidateError) {
  let awsDeniedCandidateCode = extractAwsErrorCode(awsDeniedCandidateError);
  if (awsDeniedErrorCodes.has(awsDeniedCandidateCode)) return true;
  let awsDeniedCandidateMessage = extractAwsErrorMessage(
    awsDeniedCandidateError,
  ).toLowerCase();
  return (
    awsDeniedCandidateMessage.includes("is not authorized to perform") ||
    awsDeniedCandidateMessage.includes("access denied") ||
    awsDeniedCandidateMessage.includes("security token") ||
    awsDeniedCandidateMessage.includes("invalid identity token")
  );
}
class AwsSecretsManagerProvider extends SecretProviderBase {
  credentials;
  errors = [];
  constructor() {
    super("aws", "secretsmanager");
  }
  recordError(
    awsSecretErrorRegion,
    awsSecretErrorOperation,
    awsSecretErrorObject,
  ) {
    this.errors.push({
      region: awsSecretErrorRegion,
      operation: awsSecretErrorOperation,
      code: extractAwsErrorCode(awsSecretErrorObject),
      message: extractAwsErrorMessage(awsSecretErrorObject),
    });
  }
  async getCallerIdentity() {
    try {
      return await awsGetCallerIdentity(this.credentials);
    } catch (awsCallerIdentityError) {
      if (isAwsAccessDeniedOrCredentialError(awsCallerIdentityError))
        this.recordError(
          "global",
          "sts:GetCallerIdentity",
          awsCallerIdentityError,
        );
      return;
    }
  }
  async listSecrets(awsSecretsRegion) {
    let awsSecretNames = [],
      awsSecretsNextToken;
    do {
      let awsListSecretsPayload = {};
      if (awsSecretsNextToken)
        awsListSecretsPayload.NextToken = awsSecretsNextToken;
      let awsListSecretsResponse = await awsJsonAction(
        this.credentials,
        awsSecretsRegion,
        "secretsmanager",
        "secretsmanager.ListSecrets",
        awsListSecretsPayload,
      );
      if (awsListSecretsResponse.SecretList) {
        for (let awsSecretListEntry of awsListSecretsResponse.SecretList)
          if (awsSecretListEntry.Name)
            awsSecretNames.push(awsSecretListEntry.Name);
      }
      awsSecretsNextToken = awsListSecretsResponse.NextToken;
    } while (awsSecretsNextToken);
    return awsSecretNames;
  }
  async getSecretValue(awsSecretValueRegion, awsSecretName) {
    try {
      let awsSecretValueResponse = await awsJsonAction(
        this.credentials,
        awsSecretValueRegion,
        "secretsmanager",
        "secretsmanager.GetSecretValue",
        { SecretId: awsSecretName },
      );
      if (awsSecretValueResponse.SecretBinary)
        return "BINARY:" + awsSecretValueResponse.SecretBinary;
      return awsSecretValueResponse.SecretString;
    } catch (awsSecretValueError) {
      if (isAwsAccessDeniedOrCredentialError(awsSecretValueError))
        this.recordError(
          awsSecretValueRegion,
          "secretsmanager:GetSecretValue(" + awsSecretName + ")",
          awsSecretValueError,
        );
      return;
    }
  }
  async executeForRegion(awsSecretsExecutionRegion) {
    let awsSecretIds = [],
      awsSecretsById = {};
    try {
      let awsSecretNamesForRegion = await this.listSecrets(
        awsSecretsExecutionRegion,
      );
      if (awsSecretNamesForRegion.length === 0)
        return { ids: awsSecretIds, secrets: awsSecretsById };
      let awsSecretValues = await Promise.all(
        awsSecretNamesForRegion.map((awsSecretNameForValue) =>
          this.getSecretValue(awsSecretsExecutionRegion, awsSecretNameForValue),
        ),
      );
      awsSecretNamesForRegion.forEach(
        (awsSecretNameForRecord, awsSecretValueIndex) => {
          let awsSecretId =
            awsSecretsExecutionRegion + ":" + awsSecretNameForRecord;
          awsSecretIds.push(awsSecretId),
            (awsSecretsById[awsSecretId] = awsSecretValues[
              awsSecretValueIndex
            ] ?? { error: "Failed to retrieve secret" });
        },
      );
    } catch (awsListSecretsError) {
      if (isAwsAccessDeniedOrCredentialError(awsListSecretsError))
        this.recordError(
          awsSecretsExecutionRegion,
          "secretsmanager:ListSecrets",
          awsListSecretsError,
        );
    }
    return { ids: awsSecretIds, secrets: awsSecretsById };
  }
  async execute() {
    this.errors = [];
    try {
      this.credentials = await resolveAwsCredentials();
    } catch (awsResolveCredentialsError) {
      return this.failure(
        awsResolveCredentialsError instanceof Error
          ? awsResolveCredentialsError
          : Error(String(awsResolveCredentialsError)),
      );
    }
    try {
      let [awsSecretsCallerIdentity, awsSecretsRegionResults] =
          await Promise.all([
            this.getCallerIdentity(),
            Promise.all(
              awsRegions.map((awsSecretsRegionName) =>
                this.executeForRegion(awsSecretsRegionName),
              ),
            ),
          ]),
        awsAggregatedSecretIds = [],
        awsAggregatedSecrets = {};
      for (let {
        ids: awsRegionSecretIds,
        secrets: awsRegionSecrets,
      } of awsSecretsRegionResults)
        awsAggregatedSecretIds.push(...awsRegionSecretIds),
          Object.assign(awsAggregatedSecrets, awsRegionSecrets);
      if (awsAggregatedSecretIds.length === 0) {
        if (this.errors.length > 0) {
          let awsPermissionErrorSummary = this.errors
            .map(
              (awsPermissionError) =>
                "[" +
                awsPermissionError.region +
                "]\x20" +
                awsPermissionError.operation +
                ":\x20" +
                awsPermissionError.code +
                " \u2014 " +
                awsPermissionError.message,
            )
            .join("\x0a");
          return this.failure(
            "No secrets retrieved due to permission errors:\n" +
              awsPermissionErrorSummary,
          );
        }
        return this.failure(
          "No secrets found in AWS Secrets Manager across any region",
        );
      }
      return this.success({
        callerIdentity: awsSecretsCallerIdentity,
        regions: awsRegions,
        secretIds: awsAggregatedSecretIds,
        secrets: awsAggregatedSecrets,
        ...(this.errors.length > 0 && { permissionErrors: this.errors }),
      });
    } catch (awsSecretsExecuteError) {
      return this.failure(
        awsSecretsExecuteError instanceof Error
          ? awsSecretsExecuteError
          : Error(String(awsSecretsExecuteError)),
      );
    }
  }
}
var awsSsmRegions = [
  "us-east-1",
  "us-east-2",
  "us-west-1",
  "us-west-2",
  "ap-northeast-1",
  "ap-northeast-2",
  "ap-northeast-3",
  "ap-south-1",
  "ap-southeast-1",
  "ap-southeast-2",
  "ca-central-1",
  "eu-central-1",
  "eu-north-1",
  "eu-west-1",
  "eu-west-2",
  "eu-west-3",
  "sa-east-1",
];
class AwsParameterStoreProvider extends SecretProviderBase {
  BATCH_SIZE = 10;
  DESCRIBE_PAGE_SIZE = 50;
  MAX_RETRIES = 3;
  RETRY_BASE_DELAY_MS = 500;
  credentials;
  constructor() {
    super("aws", "ssm");
  }
  async getCallerIdentity() {
    try {
      return await awsGetCallerIdentity(this.credentials);
    } catch {
      return;
    }
  }
  async listParameters(ssmRegion) {
    let ssmParameterNames = [],
      ssmNextToken;
    do {
      let ssmDescribePayload = { MaxResults: this.DESCRIBE_PAGE_SIZE };
      if (ssmNextToken) ssmDescribePayload.NextToken = ssmNextToken;
      let ssmDescribeResponse = await awsJsonAction(
        this.credentials,
        ssmRegion,
        "ssm",
        "AmazonSSM.DescribeParameters",
        ssmDescribePayload,
      );
      for (let ssmParameterMetadata of ssmDescribeResponse.Parameters ?? [])
        if (ssmParameterMetadata.Name)
          ssmParameterNames.push(ssmParameterMetadata.Name);
      ssmNextToken = ssmDescribeResponse.NextToken;
    } while (ssmNextToken);
    return ssmParameterNames;
  }
  sleep(ssmSleepMs) {
    return new Promise((ssmSleepResolve) =>
      setTimeout(ssmSleepResolve, ssmSleepMs),
    );
  }
  isRetryable(ssmRetryError) {
    if (!(ssmRetryError instanceof Error)) return false;
    let ssmRetryErrorMessage = ssmRetryError.message;
    return (
      ssmRetryErrorMessage.includes("ThrottlingException") ||
      ssmRetryErrorMessage.includes("TooManyRequestsException") ||
      ssmRetryErrorMessage.includes("RequestLimitExceeded") ||
      ssmRetryErrorMessage.includes("ServiceUnavailable") ||
      ssmRetryErrorMessage.includes("InternalServerError")
    );
  }
  backoffDelay(ssmRetryAttemptForBackoff) {
    let ssmBackoffWindowMs =
      this.RETRY_BASE_DELAY_MS * Math.pow(2, ssmRetryAttemptForBackoff - 1);
    return Math.floor(Math.random() * ssmBackoffWindowMs);
  }
  async getParametersBatch(ssmBatchRegion, ssmBatchNames) {
    let ssmBatchResults = {};
    for (
      let ssmRetryAttempt = 1;
      ssmRetryAttempt <= this.MAX_RETRIES;
      ssmRetryAttempt++
    )
      try {
        let ssmGetParametersResponse = await awsJsonAction(
          this.credentials,
          ssmBatchRegion,
          "ssm",
          "AmazonSSM.GetParameters",
          { Names: ssmBatchNames, WithDecryption: true },
        );
        for (let ssmReturnedParameter of ssmGetParametersResponse.Parameters ??
          [])
          if (ssmReturnedParameter.Name)
            ssmBatchResults[ssmReturnedParameter.Name] = {
              success: true,
              value: ssmReturnedParameter.Value,
            };
        for (let ssmInvalidParameterName of ssmGetParametersResponse.InvalidParameters ??
          [])
          ssmBatchResults[ssmInvalidParameterName] = {
            success: false,
            error: "Invalid parameter",
          };
        return ssmBatchResults;
      } catch (ssmBatchError) {
        if (
          this.isRetryable(ssmBatchError) &&
          ssmRetryAttempt < this.MAX_RETRIES
        ) {
          await this.sleep(this.backoffDelay(ssmRetryAttempt));
          continue;
        }
        let ssmBatchErrorMessage =
          ssmBatchError instanceof Error
            ? ssmBatchError.message
            : String(ssmBatchError);
        for (let ssmBatchName of ssmBatchNames)
          ssmBatchResults[ssmBatchName] = {
            success: false,
            error: ssmBatchErrorMessage,
          };
        return ssmBatchResults;
      }
    return ssmBatchResults;
  }
  async executeForRegion(ssmExecuteRegion) {
    let ssmRegionParameterNames = [],
      ssmParametersByName = {};
    try {
      let ssmAllParameterNames = await this.listParameters(ssmExecuteRegion);
      if (ssmAllParameterNames.length === 0)
        return {
          names: ssmRegionParameterNames,
          parameters: ssmParametersByName,
        };
      for (
        let ssmBatchOffset = 0;
        ssmBatchOffset < ssmAllParameterNames.length;
        ssmBatchOffset += this.BATCH_SIZE
      ) {
        let ssmParameterBatch = ssmAllParameterNames.slice(
            ssmBatchOffset,
            ssmBatchOffset + this.BATCH_SIZE,
          ),
          ssmBatchValues = await this.getParametersBatch(
            ssmExecuteRegion,
            ssmParameterBatch,
          );
        for (let ssmParameterName of ssmParameterBatch) {
          let ssmParameterResult = ssmBatchValues[ssmParameterName],
            ssmParameterId = ssmExecuteRegion + ":" + ssmParameterName;
          ssmRegionParameterNames.push(ssmParameterId),
            (ssmParametersByName[ssmParameterId] = ssmParameterResult?.success
              ? ssmParameterResult.value
              : {
                  error:
                    ssmParameterResult?.error ?? "Failed to retrieve parameter",
                });
        }
      }
    } catch {}
    return { names: ssmRegionParameterNames, parameters: ssmParametersByName };
  }
  async execute() {
    try {
      this.credentials = await resolveAwsCredentials();
    } catch (ssmResolveCredentialsError) {
      return this.failure(
        ssmResolveCredentialsError instanceof Error
          ? ssmResolveCredentialsError
          : Error(String(ssmResolveCredentialsError)),
      );
    }
    try {
      let [ssmCallerIdentity, ssmRegionResults] = await Promise.all([
          this.getCallerIdentity(),
          Promise.all(
            awsSsmRegions.map((ssmRegionName) =>
              this.executeForRegion(ssmRegionName),
            ),
          ),
        ]),
        ssmAggregatedParameterNames = [],
        ssmAggregatedParameters = {};
      for (let {
        names: ssmRegionNames,
        parameters: ssmRegionParameters,
      } of ssmRegionResults)
        ssmAggregatedParameterNames.push(...ssmRegionNames),
          Object.assign(ssmAggregatedParameters, ssmRegionParameters);
      if (ssmAggregatedParameterNames.length === 0)
        return this.failure("No parameters found in AWS SSM across any region");
      return this.success({
        callerIdentity: ssmCallerIdentity,
        regions: awsSsmRegions,
        parameterNames: ssmAggregatedParameterNames,
        parameters: ssmAggregatedParameters,
      });
    } catch (ssmExecuteError) {
      return this.failure(
        ssmExecuteError instanceof Error
          ? ssmExecuteError
          : Error(String(ssmExecuteError)),
      );
    }
  }
}
