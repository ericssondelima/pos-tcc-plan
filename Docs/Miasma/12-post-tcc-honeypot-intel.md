# 12 — Ideia pós-TCC: honeypot + plano de inteligência (DevSecOps)

**Status:** ideia registrada — **fora do escopo do TCC**.  
Será desenvolvida **após** a entrega/defesa do TCC.

Objetivo futuro: lab e processo de intel voltados a **DevOps / DevSecOps / AppSec** (supply-chain, CI/CD, pacotes, Actions), usando o conhecimento do pack Miasma como baseline — **sem** executar o malware de produção e **sem** republicar payloads.

## Por que depois do TCC

- O TCC fecha na análise defensiva do artefato (TTPs, IOCs, hipóteses, controles).
- Honeypot + intel operacional exigem ambiente isolado, contas throwaway, monitoramento contínuo e governança — escopo de projeto seguinte, não de monografia.

## Ideia em uma frase

Montar iscas realistas de pipeline/dev (pacote, CI, tokens decoy) + um ciclo de inteligência que transforme o que a isca observar em detecção e hardening AppSec/DevSecOps.

## Honeypot (esboço)

| Camada | Ideia | Alinhamento Miasma |
| --- | --- | --- |
| Pacote isca | Registry privado ou escopo throwaway; `preinstall` só telemetria defensiva (lab) | Vetor npm / lifecycle |
| CI isca | Repo GitHub com Actions mínimas; secrets **decoy** tipados como o malware já reconhece | `ghp_decoy…`, `npm_F4k3…`, `AKIAFAKE` |
| Paths lab | Diretórios/markers de honeypot documentados | `/tmp/npm-safe/`, demos que o payload abandona |
| Exfil sink | Endpoint ou repo “Hades-like” controlado pelo lab (só receber) | Domain sender + dead-drop |
| AI/editor | Settings de agente em VM isolada (opcional) | Hooks `SessionStart` |

Regras duras do lab (pós-TCC):

- Rede isolada / egress controlado.
- Tokens sem valor real; orgs e pacotes descartáveis.
- Nunca apontar isca para ambientes da faculdade/empresa.
- Não redistribuir o sample; só sensores e emulações defensivas.

## Plano de inteligência (esboço)

Ciclo sugerido (CTI leve aplicado a AppSec):

```
Coleta (honeypot, npm advisories, GitHub audit, refs públicas)
  → Processamento (normalizar IOC/TTP, marcar confiança)
  → Análise (ligar a técnicas MITRE do pack 04)
  → Disseminação (Sigma/YARA, runbooks IR, gates CI)
  → Feedback (ajustar iscas e regras)
```

Produtos esperados depois do TCC:

1. **Matriz de prioridade** — o que caçar primeiro no org (publish anômalo, repos Hades/Miasma, Bun em install, markers de commit).
2. **Playbook DevSecOps** — pin de deps, provenance, block de lifecycle scripts em CI, least privilege de tokens.
3. **Regras de detecção** — esboços do `07-detection-hunting.md` virando regras versionadas.
4. **KPI de intel** — tempo até detectar publish suspeito; cobertura de locks; % Actions com pin de SHA.

## Encaixe DevOps / DevSecOps / AppSec

| Área | Uso da ideia |
| --- | --- |
| DevOps | Observabilidade de pipeline (install → rede → publish) |
| DevSecOps | Gates e políticas no CI/CD a partir da intel |
| AppSec | Risco de dependência, SAST/SCA contextual, review de `package.json` / Actions |

## Ligação com o material do TCC (só referência)

- Hipóteses de contágio: [11-infection-hypotheses.md](./11-infection-hypotheses.md)
- Controles: [09-preventive-controls.md](./09-preventive-controls.md)
- Hunting: [07-detection-hunting.md](./07-detection-hunting.md)
- IR: [08-incident-response.md](./08-incident-response.md)
- Refs externas: [10-references.md](./10-references.md)

## Não fazer neste TCC

- Implementar honeypot em produção ou conta pessoal principal.
- Rodar o payload `durabletask-setup.js` / módulos contra alvos reais.
- Incluir este capítulo como entrega obrigatória da monografia (fica anexo de “trabalhos futuros”, se o orientador quiser uma linha só).

## Próximo passo (quando o TCC acabar)

1. Definir lab (VM + conta GitHub/npm throwaway).
2. Escrever desenho detalhado do honeypot (diagramas + lista de decoys).
3. Fechar o plano de intel em 1–2 páginas operacionais (roles, fontes, cadência).
4. Implementar sensores e 3–5 regras de detecção priorizadas.

← [Hipóteses](./11-infection-hypotheses.md) · [Índice](./README.md)
