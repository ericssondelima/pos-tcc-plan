# 02 — Arquitetura e fluxo

## Layout do código desofuscado

| Pasta | Função |
| --- | --- |
| `00-runtime/` | Constantes, locale/CI guards, detecção de EDR, wrappers AES/ROT |
| `01-github-api/` | Cliente HTTP GitHub, retries, validação de tokens/scopes |
| `02-string-cipher/` | Cipher de strings do payload original |
| `03-tar-runtime/` | Runtime tar/minipass/zlib para mutar tarballs |
| `04-npm-compromise/` | Enumeração, injeção e publish de pacotes npm |
| `05-rubygems-compromise/` | Idem para RubyGems |
| `06-github-actions/` | Compromisso de Actions/releases, payloads embutidos (Python/Bash/Node) |
| `07-repo-persistence/` | Persistência em repo, branches, PRs, SSH, infection jobs |
| `08-oidc-sigstore/` | Abuso OIDC GHA + Fulcio/Rekor para provenance “legítima” |
| `09-sandbox-bypass/` | Decoy detection, Docker/sudo, poison `/etc/hosts`, daemonize, lock |
| `10-secret-providers/` | Providers de segredos (multi-cloud + local + vaults) |
| `11-exfil/` | Envelopes, domain sender, GitHub repo sender, commit markers |
| `12-orchestration/` | Entrypoint: preflight → collect → exfil → infection jobs |

## Fluxo de orquestração

Entrypoint: `12-orchestration/00-main-entrypoint.js` → `mainPayloadEntry()`.

```
mainPayloadEntry()
  ├─ preflightAndDaemonize()
  │    ├─ exit se sandbox/decoy
  │    ├─ fast-path OIDC npm (WORKFLOW_ID / REPO_ID_SUFFIX)
  │    ├─ exit se locale russo (ru*)
  │    ├─ daemonize se NÃO-CI
  │    └─ process lock em tmp
  ├─ collectInitialProviderResults()
  │    ├─ LocalSecretFileProvider
  │    ├─ GitHubEnvironmentProvider (gh auth token + env)
  │    └─ NpmAndRubyTokenProvider (incl. dump Runner.Worker)
  ├─ buildExfilSenders() + ResultBuffer (flush ~100 KiB)
  ├─ buildFollowOnProviders()  → cloud/K8s/Vault/password mgrs (+ GHA secrets se PAT)
  ├─ buildFollowOnInfectionJobs() / buildFallbackPersistenceTasks()
  └─ executeInfectionJobs() → exitAfterCleanup()
```

## Providers

### Iniciais (`collectInitialProviderResults`)

- `LocalSecretFileProvider`
- `GitHubEnvironmentProvider`
- `NpmAndRubyTokenProvider`

### Follow-on (`buildFollowOnProviders`)

- AWS: `AwsParameterStoreProvider`, `AwsSecretsManagerProvider`, `AwsStsIdentityProvider`
- Azure: `AzureKeyVaultProvider`, `AzureSecretProvider`
- GCP: `GcpSecretManagerProvider`, `GcpMetadataProvider`
- `KubernetesSecretProvider`, `VaultSecretProvider`, `PasswordManagerSecretProvider`
- Se PAT com scope `repo` / `public_repo`: `GitHubActionsTokenProvider`

## Constantes de runtime relevantes

Definidas em `00-runtime/01-environment-and-wrapper-runtime.js`:

| Constante | Valor |
| --- | --- |
| `payloadFileName` | `index.js` |
| `githubCommitTokenMarker` | `IfYouYankThisTokenItWillNukeTheComputerOfTheOwnerFully` |
| `domainExfilPath` | `v1/api` |
| `primaryExfilDomain` | `api.anthropic.com` |
| Process lock | `tmp.0144018410.lock` |

← [Overview](./01-overview.md) · [Índice](./README.md) · [TTPs →](./03-ttps-killchain.md)
