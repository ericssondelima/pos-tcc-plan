# 01 — Overview

Documento **defensivo**. Não execute o sample.

## Identidade

| Campo | Valor |
| --- | --- |
| Família / campanha | Shai-Hulud / Miasma |
| Artefato principal | Payload JS associado a Azure DurableTask (`durabletask-setup.js` / bundle) |
| Runtime alvo | Node.js / Bun (baixa em `bun-v1.3.13` / `1.3.14`) |
| Vetor | Supply-chain (npm / RubyGems / GitHub Actions / persistência em repos e agentes de IA) |
| Fonte analítica | Módulos `00-runtime` … `12-orchestration` + `original-payload.infected.zip` |
| Classificação | Malware — coleta de segredos, exfiltração, worm de pacotes e persistência CI/CD |
| Código no workspace | `~/tcc/miasma-azure-durabletask-main/` |

## Resumo executivo

O Miasma é um payload JavaScript de **supply-chain worm** otimizado para ambientes de desenvolvedor e CI (especialmente GitHub Actions). Após o preflight, ele:

1. Detecta sandboxes/honeypots e sai cedo se achar decoys.
2. Coleta segredos locais, tokens GitHub/npm/Ruby e memória do runner.
3. Amplia a coleta para AWS, Azure, GCP, Kubernetes, Vault e password managers.
4. Exfiltra envelopes criptografados (AES-256-GCM + RSA-OAEP) via domínio C2 configurável e/ou **repositórios públicos GitHub** (“Hades”).
5. Propaga infecção: republish de pacotes npm/RubyGems, compromisso de Actions/releases, persistência em branches/PRs, hooks de agentes de IA, monitores systemd/LaunchAgent e propagação SSH.

O desenho mistura **evasão de sandbox**, **abuso de serviços legítimos** (GitHub API, Sigstore/Fulcio/Rekor, Bun releases) e **marcadores de commit** para C2/configuração dinâmica.

## Metadados deste pack

| | |
| --- | --- |
| Versão | 1.0 |
| Data | 2026-09-03 |
| Tipo | Defensivo — IOCs / TTPs / MITRE ATT&CK |
| Idioma | PT-BR |

*Attribution do material de origem (README do dump): Kirk / Derp.ca — CC0.*

← [Índice](./README.md) · [Arquitetura →](./02-architecture-and-flow.md)
