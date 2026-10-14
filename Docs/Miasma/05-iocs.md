# 05 — Indicadores de compromisso (IOCs)

## 5.1 Strings / marcadores de alta fidelidade

| Tipo | Valor | Uso |
| --- | --- | --- |
| Commit token marker | `IfYouYankThisTokenItWillNukeTheComputerOfTheOwnerFully` | Commit message + recovery via `/search/commits` |
| Signed domain query | `thebeautifulmarchoftime ` | Busca commits para domínio C2 |
| Signed marker regex | `thebeautifulsnadsoftime <b64>.<sig>` | Verificação RSA de config |
| Repo description | `Hades - The End for the Damned` | Repos de exfil públicos |
| Lock file | `tmp.0144018410.lock` (em `os.tmpdir()`) | Mutex de processo |
| Env daemon | `__IS_DAEMON=1` | Processo daemonizado |
| Env skip | `SKIP_DOMAIN=true` | Força exfil só via GitHub |
| Payload path | `.github/setup.js` | Persistência em repo |
| Agent hook | `node .github/setup.js` / `bun run …/index.js` | SessionStart |
| Service names | `update-monitor`, `gh-token-monitor` | Persistência host |
| LaunchAgent | `com.user.gh-token-monitor` | macOS |
| Install dirs | `~/.local/share/updater`, `~/.local/bin/gh-token-monitor.sh`, `~/.config/gh-token-monitor/` | Artefatos host |
| Bun marker | temp `.bun_ran` | One-shot bootstrap |
| Decoy prefixes | `ghp_decoyGitHubToken`, `npm_F4k3NPMToken`, `sk-ant-api03-fake`, `fake_circle`, `AKIAFAKE` | Ambiente honeypot (autor sai) |
| Sandbox repo | `actions-security-demo/compromised-packages` | Exit early |
| Paths sandbox | `/tmp/npm-safe/`, `/opt/hscan-supplychain-dynamic` | Exit early |

## 5.2 Naming de repositórios de exfil (“Hades”)

Padrão: `<adjective>-<noun>-<0..99999>`

**Adjetivos:** `stygian`, `tartarean`, `erebean`, `infernal`, `chthonic`, `acheronian`, `lethean`, `plutonian`, `abyssal`, `charonian`, `thanatic`, `funereal`, `nekyian`, `sepulchral`, `tenebrous`, `cimmerian`

**Substantivos:** `cerberus`, `charon`, `tartarus`, `erebus`, `asphodel`, `acheron`, `styx`, `lethe`, `cocytus`, `phlegethon`, `shade`, `eidolon`, `wraith`, `thanatos`, `hecate`, `persephone`

Arquivos: `results/results-<epoch_ms>-<counter>.json` (ou partes `.partN`).

## 5.3 Rede / endpoints

| Destino | Papel | Nota |
| --- | --- | --- |
| `api.github.com` | API REST + GraphQL | Cliente principal; UA spoof |
| `api.github.com/graphql` | Mutations/commits | Persistência em branches |
| `https://github.com/<user>` | Validação de perfil | Antes de criar repo Hades |
| `fulcio.sigstore.dev` | Cert signing | `/api/v2/signingCert` |
| `rekor.sigstore.dev` | Transparency log | `/api/v1/log/entries` |
| `api.anthropic.com/v1/api` | Domain exfil default | Hardcoded; `noop: true` no default builder |
| `github.com/oven-sh/bun/releases/download/bun-v1.3.13/*` | Tooling | Bootstrap Bun |
| `bun.sh/install` | Install script | Persistência agentes |
| StepSecurity hosts | `agent/api/app/www.stepsecurity.io`, `stepsecurity.io` | Poison em `/etc/hosts` |
| Cloud APIs | AWS / `vault.azure.net` / `secretmanager.googleapis.com` / `oauth2.googleapis.com` | Uso abusivo pós-credencial |
| Vault default | `http://127.0.0.1:8200` | Se `VAULT_ADDR` ausente |

## 5.4 HTTP / protocolo

- Headers GitHub: `Accept: application/vnd.github+json`, `Authorization: Bearer …`, `X-GitHub-Api-Version: 2022-11-28`, **User-Agent: `python-requests/2.31.0`**.
- Exfil domain: `POST` JSON, `Content-Type: application/json`; health GET espera **400 ou 404**.
- Envelope JSON típico: campos `envelope` (b64 nonce‖ciphertext‖tag) + `key` (b64 RSA-OAEP).
- Flush threshold: **102400** bytes.
- Chunk upload GitHub Contents API: máx **31457280** bytes por parte.
- Retries commit search: delays **10s / 30s / 90s**.

## 5.5 Host / filesystem

| Path / artefato | Plataforma |
| --- | --- |
| `$TMPDIR/tmp.0144018410.lock` | All |
| `$TMPDIR/b/bun` ou `b.zip` / `b-*` | Bootstrap Bun |
| `~/.config/index.js` | Persistência agente |
| `~/.config/systemd/user/update-monitor.service` | Linux |
| `~/.config/systemd/user/gh-token-monitor.service` | Linux |
| `~/Library/LaunchAgents/com.user.gh-token-monitor.plist` | macOS |
| `~/.local/share/updater/update.py` | Linux/macOS |
| `~/.local/bin/gh-token-monitor.sh` | Linux/macOS |
| `~/.config/gh-token-monitor/{token,handler,started_at}` | Linux/macOS |
| `.github/setup.js` | Repo |
| `/etc/hosts` entries StepSecurity → 127.0.0.1 | Linux CI |
| `/etc/resolv.conf` → 8.8.8.8 / 1.1.1.1 | Linux CI |
| `/etc/sudoers.d` via bind Docker | Linux CI |

## 5.6 Processos / comandos (hunt)

- `bun run` sobre `index.js` / payload em temp.
- `gh auth token`.
- Acesso a `/var/run/docker.sock` (list/kill/create containers).
- `sudo -n true`, `sudo tee /etc/resolv.conf`, append `/etc/hosts`.
- Leitura de `/proc/*/cmdline` procurando `Runner.Worker`.
- CLIs: `op …`, `bw unlock|list items`.
- `curl`/`unzip` para Bun zip; `pip install requests`.

## 5.7 Regex úteis

```text
IfYouYankThisTokenItWillNukeTheComputerOfTheOwnerFully:[A-Za-z0-9+/=]+
thebeautiful(march|snads)oftime
Hades - The End for the Damned
tmp\.0144018410\.lock
results-\d+-\d+(?:\.part\d+)?\.json
ghs_\d+_[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+
```

Repo name (aproximado):

```text
(?i)^(stygian|tartarean|erebean|infernal|chthonic|acheronian|lethean|plutonian|abyssal|charonian|thanatic|funereal|nekyian|sepulchral|tenebrous|cimmerian)-(cerberus|charon|tartarus|erebus|asphodel|acheron|styx|lethe|cocytus|phlegethon|shade|eidolon|wraith|thanatos|hecate|persephone)-\d{1,5}$
```

← [MITRE](./04-mitre-attack.md) · [Índice](./README.md) · [Módulos →](./06-modules-detail.md)
