# 04 — MITRE ATT&CK

## Matriz consolidada

| Tactic | Technique ID | Nome | Evidência Miasma |
| --- | --- | --- | --- |
| Initial Access | T1195 / .001 / .002 | Supply Chain Compromise | npm, RubyGems, Actions |
| Execution | T1059 / .004 / .006 / .007 | Scripting | JS/Bun, Bash, Python, PS |
| Execution | T1105 | Ingress Tool Transfer | Download Bun releases |
| Persistence | T1543.001 / .002 | Create or Modify System Process | LaunchAgent / systemd user |
| Persistence | T1546 | Event Triggered Execution | Agent `SessionStart` hooks |
| Persistence | T1037 | Boot or Logon Init Scripts | `~/.config/index.js` + bun |
| Privilege Esc. | T1610 | Deploy Container | Alpine privilegiado via docker.sock |
| Defense Evasion | T1562.001 / .004 | Impair Defenses | Kill harden-runner; poison hosts/DNS |
| Defense Evasion | T1036 | Masquerading | UA `python-requests/2.31.0` |
| Defense Evasion | T1497 / T1622 | Sandbox Evasion | Decoy tokens, paths, FAKE AWS |
| Credential Access | T1552.* | Unsecured Credentials | Globs de arquivos |
| Credential Access | T1555 / .005 | Password Stores | `op`, `bw` |
| Credential Access | T1003 | OS Credential Dumping | Runner.Worker memory |
| Credential Access | T1528 | Steal App Access Token | GITHUB_TOKEN, PATs, cloud |
| Discovery | T1083 / T1526 / T1580 | File / Cloud Discovery | Providers multi-cloud |
| Lateral Movement | T1021.004 | SSH | Known hosts propagator |
| Collection | T1005 / T1213 / T1530 | Local / Repos / Cloud | Buffer de resultados |
| Command & Control | T1071.001 | Web Protocols | HTTPS API GitHub / domain |
| Command & Control | T1102 | Web Service | GitHub search/commits como C2 config |
| Exfiltration | T1567 / T1041 / T1573 | Web Service / C2 / Encrypted | Envelope AES+RSA; Hades repos |
| Impact | T1565 / T1485 | Data Manipulation / Destruction | hosts poison; rm handler |

## Classes / jobs → MITRE

| Componente | MITRE principal |
| --- | --- |
| `preflightAndDaemonize` | T1497, T1562, T1036 |
| `LocalSecretFileProvider` | T1552.001 |
| `GitHubEnvironmentProvider` | T1528, T1082 |
| `NpmAndRubyTokenProvider` | T1003, T1528 |
| `Aws* / Azure* / Gcp*` providers | T1552, T1526, T1530 |
| `KubernetesSecretProvider` | T1552, T1613 |
| `VaultSecretProvider` | T1552, T1606 |
| `PasswordManagerSecretProvider` | T1555.005 |
| `DomainExfilSender` / `GitHubRepoExfilSender` | T1567, T1573, T1041 |
| `NpmTokenPackageCompromiser` | T1195.001 |
| `RubyGemsTokenPackageCompromiser` | T1195.001 |
| `GitHubActionReleaseCompromiser` | T1195.002 |
| `NpmOidcPackageCompromiser` / Workflow | T1195, T1550, T1649 |
| `*PersistenceInjector` | T1195, T1546 |
| `LocalAgentSettingsPersistenceInstaller` | T1546 |
| `GitHubCommitC2MonitorInstaller` | T1543, T1102 |
| `SshKnownHostsPropagator` | T1021.004 |
| `GitHubTokenMonitorInstaller` | T1543, T1485 (handler) |

← [TTPs](./03-ttps-killchain.md) · [Índice](./README.md) · [IOCs →](./05-iocs.md)
