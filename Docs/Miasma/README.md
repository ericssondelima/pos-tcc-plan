# Miasma (Shai-Hulud / Azure DurableTask) — Documentação defensiva

Diretório **exclusivo** do malware Miasma (pack do TCC em `~/tcc`).  
Conteúdo baseado no código desofuscado em `../miasma-azure-durabletask-main/`.

**Uso:** detecção, IR, threat hunting, YARA/Sigma, briefings.  
**Não execute** o payload. Trate os artefatos como malware vivo.

## Índice

| Doc | Conteúdo |
| --- | --- |
| [01-overview.md](./01-overview.md) | Identidade, resumo executivo, metadados |
| [02-architecture-and-flow.md](./02-architecture-and-flow.md) | Mapa de módulos e fluxo de orquestração |
| [03-ttps-killchain.md](./03-ttps-killchain.md) | Kill chain e TTPs narrados |
| [04-mitre-attack.md](./04-mitre-attack.md) | Matriz MITRE ATT&CK + classes → técnicas |
| [05-iocs.md](./05-iocs.md) | IOCs (strings, rede, host, regex, Hades) |
| [06-modules-detail.md](./06-modules-detail.md) | TTPs por módulo / infection jobs |
| [07-detection-hunting.md](./07-detection-hunting.md) | Prioridades de hunt e esboços de regras |
| [08-incident-response.md](./08-incident-response.md) | Checklist de IR |
| [09-preventive-controls.md](./09-preventive-controls.md) | Controles preventivos e limitações da análise |
| [10-references.md](./10-references.md) | Ponto de referência — links externos (JFrog etc.) |
| [11-infection-hypotheses.md](./11-infection-hypotheses.md) | Cenários de contágio e hipóteses de infecção |
| [12-post-tcc-honeypot-intel.md](./12-post-tcc-honeypot-intel.md) | Ideia **pós-TCC** — honeypot + plano de intel (DevSecOps) |

## Fonte analítica

| Campo | Valor |
| --- | --- |
| Família / campanha | Shai-Hulud / Miasma |
| Artefato | Payload JS Azure DurableTask |
| Runtime | Node.js / Bun (`bun-v1.3.13` / `1.3.14`) |
| Vetor | Supply-chain (npm, RubyGems, GitHub Actions, agentes de IA) |
| Idioma dos docs | PT-BR |
| Versão do pack | 1.0 — 2026-09-03 |
