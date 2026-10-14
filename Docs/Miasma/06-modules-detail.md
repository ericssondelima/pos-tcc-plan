# 06 — TTPs por módulo

## 6.1 `09-sandbox-bypass` — Preflight

**Procedimento:** Antes de qualquer coleta, classifica o ambiente.

1. Decoy tokens em env → exit.
2. Repo honeypot / path de scanner → exit.
3. AWS credentials contendo `FAKE` → exit.
4. Se `WORKFLOW_ID` / `REPO_ID_SUFFIX` casam com o workflow atual → fast-path `NpmOidcPackageCompromiser` e exit.
5. Locale `ru*` → exit.
6. Fora de CI → spawn daemon detached e exit do pai.
7. Instala handlers vazios SIGINT/SIGTERM; adquire lock; senão exit.
8. Tenta neutralizar StepSecurity (Docker kill / sudoers / hosts / resolv).

**Detecção:** lock file; escrita em `/etc/hosts` com FQDNs stepsecurity; containers Alpine com bind `/etc/sudoers.d`; processo Node/Bun com env `__IS_DAEMON`.

## 6.2 `10-secret-providers` — Credential harvest

**Inicial:** filesystem globs + shell env/`gh` + runner memory/npm/ruby tokens.  
**Follow-on:** AWS ×3, Azure ×2, GCP ×2, K8s, Vault, password managers; se PAT com `repo` → `GitHubActionsTokenProvider`.

**Detecção:** rajada de leituras em `~/.ssh`, `~/.npmrc`, `~/.aws`, `~/.azure`, `~/.config/gcloud`, `~/.kube`; read de `/proc/<pid>/mem` de `Runner.Worker`; chamadas STS/`GetSecretValue`/`ListSecrets` anômalas a partir de runner.

## 6.3 `11-exfil` — Canais de saída

Monta senders; prefere domain (se não noop/healthy) senão GitHub; pode recuperar PAT de commits com o marker; cria repo Hades; sobe JSON em `results/`.

**Detecção (GitHub):**

- `POST /user/repos` com description Hades + naming mitológico.
- `PUT .../contents/results/results-*.json`
- Commits cuja message começa com o token marker.
- Search API: `q=IfYouYankThisToken…` ou `thebeautifulmarchoftime`.

**Detecção (rede):** POST JSON com campos `envelope`+`key` base64; UA misto (fetch nativo vs `python-requests` no GitHub).

## 6.4 `04-npm` / `05-rubygems` — Worm de pacotes

Lista pacotes onde o token permite publish; muta tarball (wrapper ROT+AES + bootstrap Bun); republica.

**Detecção:** publish inesperado; tarball com `eval`+charCodes+ROT; download de Bun durante install; hash diferente vs release anterior legítima.

## 6.5 `06-github-actions` / `08-oidc-sigstore`

Compromete releases de Actions; gera provenance SLSA via OIDC → Fulcio → Rekor; workflows/payloads de monitor.

**Detecção:** tags de Action alteradas sem release notes; workflows com download Bun; Fulcio/Rekor inesperado; `id-token: write` suspeito.

## 6.6 `07-repo-persistence` — Infection jobs

| Job | Função |
| --- | --- |
| `CurrentRepoBranchPersistenceInjector` | Injeta payload em branches (tokens `ghs_old` / `ghs_jwt`) |
| `PullRequestBranchPersistenceInjector` | Persistência via branches de PR |
| `GitHubActionReleaseCompromiser` | Compromete releases de Actions |
| `NpmOidcWorkflowCompromiser` | Workflows OIDC para publish npm |
| `LocalAgentSettingsPersistenceInstaller` | Hooks em settings de agentes de IA |
| `GitHubCommitC2MonitorInstaller` | Monitor de commits (C2) |
| `SshKnownHostsPropagator` | Lateral via SSH |
| Fallback | Sempre agenda LocalAgent + CommitC2 + SSH |

Agentes alvo do installer local: `claude`, `codex`, `gemini`, `copilot`, `kiro`, `opencode` (`settings.json` + hook `SessionStart`).

← [IOCs](./05-iocs.md) · [Índice](./README.md) · [Detecção →](./07-detection-hunting.md)
