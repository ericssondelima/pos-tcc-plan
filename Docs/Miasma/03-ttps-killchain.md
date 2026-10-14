# 03 — Kill chain e TTPs

Narrativa defensiva dos procedimentos observados no código desofuscado.

## 3.1 Initial Access — supply-chain

- Pacote npm/RubyGems ou Action comprometida executa o bootstrap (ROT + AES-GCM + download do Bun).
- Em CI, hooks / `setup.js` / workflows implantados reexecutam o payload.
- **MITRE:** T1195, T1195.001, T1195.002.

## 3.2 Execution

- Node/Bun avalia wrappers ofuscados (`eval` + ROT de letras + AES-GCM).
- Scripts embutidos: Python (monitor/commit C2), Bash (installers), PowerShell (mem dump Windows).
- Download de Bun oficial: `https://github.com/oven-sh/bun/releases/download/bun-v1.3.13/...`
- **MITRE:** T1059, T1059.007, T1059.004, T1059.006, T1105.

## 3.3 Persistence

| Mecanismo | Evidência no código | MITRE |
| --- | --- | --- |
| Hooks `SessionStart` em settings de agentes | Claude, Codex, Gemini, Copilot, Kiro, OpenCode → `settings.json` | T1546, T1554 |
| Arquivo `~/.config/index.js` + `bun run` | `LocalAgentSettingsPersistenceInstaller` | T1037 / T1546 |
| `.github/setup.js` no repositório | `repoPayloadPath` | T1195 / T1543 (via CI) |
| systemd user `update-monitor` / `gh-token-monitor` | `~/.config/systemd/user/*.service` | T1543.002 |
| LaunchAgent macOS `com.user.gh-token-monitor` | `~/Library/LaunchAgents/...` | T1543.001 |
| Branches/PRs com payload | `CurrentRepoBranchPersistenceInjector`, `PullRequestBranchPersistenceInjector` | T1195 / T1606 |
| Propagação via SSH known_hosts | `SshKnownHostsPropagator` | T1021.004 |
| Republish de pacotes npm/RubyGems | `NpmTokenPackageCompromiser`, `RubyGemsTokenPackageCompromiser` | T1195.001 |
| Compromisso de Action releases / OIDC workflows | `GitHubActionReleaseCompromiser`, `NpmOidcWorkflowCompromiser` | T1195.002, T1550 |

## 3.4 Privilege Escalation / Defense Evasion

- Abuso de `/var/run/docker.sock`: mata containers StepSecurity (`harden-runner`, `step-security`); cria container Alpine privilegiado para escrever `NOPASSWD` em `/etc/sudoers.d`.
- Com sudo: reescreve `/etc/resolv.conf` (8.8.8.8 / 1.1.1.1) e **poison** `/etc/hosts` apontando hosts StepSecurity para `127.0.0.1` / `::1`.
- Daemonize (`__IS_DAEMON=1`), ignora SIGINT/SIGTERM, lock `tmp.0144018410.lock`.
- Sai se detectar honeypot/sandbox (tokens decoy, repo demo, paths `/tmp/npm-safe/`, `/opt/hscan-supplychain-dynamic`, AWS credentials com `FAKE`).
- Sai se locale `ru*` (auto-proteção geográfica do autor).
- Pula scan agressivo de disco se detectar EDR (CrowdStrike, SentinelOne, MDE, Carbon Black, etc.).
- User-Agent GitHub: `python-requests/2.31.0` (mascaramento).
- **MITRE:** T1562, T1562.001, T1562.004, T1036, T1070, T1622, T1497, T1610, T1068.

## 3.5 Credential Access

**Providers iniciais**

- Arquivos locais (globs Linux/macOS/Windows): SSH, `.npmrc`, `.env*`, cloud CLIs, Docker, kubeconfig, wallets, históricos, Claude configs, etc.
- `gh auth token` + dump completo de `process.env`.
- Memória do processo `Runner.Worker` (Linux): regex `ghs_…` JWT e clássico; script Python de mem dump; no Windows, payload C# `MemDump`.

**Providers follow-on**

- AWS: STS identity, Secrets Manager, SSM Parameter Store.
- Azure: identidade + Key Vault (ARM discovery).
- GCP: metadata + Secret Manager.
- Kubernetes secrets.
- HashiCorp Vault (`VAULT_ADDR`, tokens env/files, AWS/K8s auth).
- Password managers: CLI `op` (1Password) e `bw` (Bitwarden).
- GitHub Actions secrets via token com scope `repo` / `public_repo`.

Filtro de “dirty” secrets (exemplos AWS / FAKE / decoy / honeypot) para reduzir lixo de lab.

**MITRE:** T1552, T1552.001, T1552.004, T1555, T1555.005, T1003, T1528, T1550, T1649.

## 3.6 Discovery

- Enumera pacotes npm/RubyGems publicáveis, repos/orgs GitHub, vaults Azure, secrets GCP/AWS, branches (ignora `dependabot/` e `copilot/`).
- Valida tokens GitHub (scopes, orgs, rate limit).
- **MITRE:** T1082, T1083, T1613, T1526, T1580.

## 3.7 Lateral Movement / Propagation

- Injeta payload em tarballs e republica.
- Compromete releases de Actions e workflows OIDC.
- Propaga via SSH known hosts.
- Instala monitores que observam commits GitHub (C2 leve).
- **MITRE:** T1021.004, T1534, T1195.*.

## 3.8 Collection & Exfiltration

- `ResultBuffer` agrega resultados e faz flush ~102400 bytes.
- Envelope: JSON → gzip → AES-256-GCM (nonce 12B) → chave AES envelopada com RSA-OAEP-SHA256 → Base64.
- Canais:
  1. **Domain sender** — HTTPS POST; health-check espera HTTP 400/404; config dinâmica via commit assinado.
  2. **GitHub repo sender** — repo público “Hades”, path `results/results-<ts>-<n>.json`.
- Commit marker de token: `IfYouYankThisTokenItWillNukeTheComputerOfTheOwnerFully:<double-base64>`.
- Marker de domínio: `thebeautifulmarchoftime `; genérico `thebeautifulsnadsoftime <b64>.<sig>`.
- Domínio primário hardcoded: `api.anthropic.com` / `v1/api` com `noop: true` no default (C2 real via signed commit quando domain sender ativo).
- Em alguns casos instala token-monitor com handler destrutivo (`rm -rf ~/…`).

**MITRE:** T1005, T1213, T1530, T1567, T1567.002, T1041, T1020, T1573.001, T1573.002.

## 3.9 Impact (secundário)

- Worm de pacotes (integridade do ecossistema).
- Poison de resolução DNS / hosts (quebra hardening StepSecurity).
- Handler destrutivo no token monitor (potencial wipe de home).
- **MITRE:** T1490, T1565, T1485.

← [Arquitetura](./02-architecture-and-flow.md) · [Índice](./README.md) · [MITRE →](./04-mitre-attack.md)
