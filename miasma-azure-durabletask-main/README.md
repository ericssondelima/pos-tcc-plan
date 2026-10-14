# Shai-Hulud: Miasma (Azure:Durabletask) Open Source

This repository contains a normalized, deobfuscated copy of the Azure DurableTask JavaScript payload associated with Shai-Hulud: Miasma.

This is malware. Handle it accordingly. The purpose of this repo is defensive research, incident response, detection engineering, and supply-chain security review.

## Repository Layout

| Path | Contents |
| --- | --- |
| `original-payload.infected.zip` | Password-protected copy of the original obfuscated `durabletask-setup.js` payload. Password: `infected`. |
| `00-runtime/` | Runtime helpers, platform checks, environment guards, and wrapper logic. |
| `01-github-api/` | GitHub API clients, request helpers, retry handling, and token validation. |
| `02-string-cipher/` | Decoded custom string-cipher implementation and helpers. |
| `03-tar-runtime/` | Bundled tar/minipass/zlib runtime used for archive mutation. |
| `04-npm-compromise/` | npm package discovery, tarball mutation, and publish paths. |
| `05-rubygems-compromise/` | RubyGems package discovery, archive mutation, and publish paths. |
| `06-github-actions/` | GitHub Actions metadata parsing, workflow payloads, and action-release compromise logic. |
| `07-repo-persistence/` | Repository persistence, branch/ref manipulation, commit construction, and follow-on infection jobs. |
| `08-oidc-sigstore/` | OIDC, Sigstore/Fulcio/Rekor provenance, and npm OIDC package compromise paths. |
| `09-sandbox-bypass/` | Sandbox, decoy, Docker, sudo, resolver, daemonization, and preflight logic. |
| `10-secret-providers/` | Secret discovery providers for GitHub, AWS, Azure, GCP, local files, runner memory, Kubernetes, password managers, and Vault. |
| `11-exfil/` | Exfiltration envelope construction, domain exfiltration, GitHub repo exfiltration, and sender selection. |
| `12-orchestration/` | Main entrypoint and high-level orchestration. |

## Handling

Treat every file in this repository as live malware source code.

- Review in an isolated environment.
- Keep analysis static unless you have a dedicated malware lab.
- Use it for detections, YARA/Sigma rules, incident response, and education.

## License

Released under CC0 1.0 Universal. Attribution is not required, but appreciated:
Kirk from Derp.ca.
