# 11 — Cenários de contágio e hipóteses de infecção

Lista **defensiva** de formas pelas quais um desenvolvedor ou pipeline pode se contaminar com Miasma / Shai-Hulud **sem intenção**, e hipóteses de como o pacote/app fica infectado até “subir” (npm e/ou Git).

Base: código desofuscado + relatos públicos (ex. onda `@redhat-cloud-services`).  
Não é guia de ataque.

## 11.1 Como alguém se infecta sem querer

| # | Cenário (simples) | O que o dev/CI faz de bobo | Hipótese do que dispara o malware |
| --- | --- | --- | --- |
| H1 | Dependência npm hijacked | `npm install` / `npm ci` / update do lock | Versão no registry tem `preinstall` / `install` ou `binding.gyp` que roda o loader |
| H2 | Range frouxo no `package.json` | `"lib": "^1.2.3"` pega patch `1.2.4` má | Worm republicou bump de patch no mesmo nome do pacote |
| H3 | CI GitHub Actions | Workflow faz install em runner | Mesmo tarball má; ainda pior se houver tokens `GITHUB_TOKEN` / npm / OIDC |
| H4 | Action / release comprometida | `uses: org/action@vX` ou tag movida | Action JS virada composite / payload no release |
| H5 | Clone + setup do repo | Abre repo com `.github/setup.js` / workflow plantado | Persistência deixada por infecção anterior no Git |
| H6 | Agente de IA / editor | Abre sessão Claude/Codex/Copilot/etc. | Hook `SessionStart` ou task VS Code reexecuta `~/.config/index.js` / Bun |
| H7 | RubyGems (mesma família) | `bundle install` / gem com token publish | Espelho do worm npm no ecossistema Ruby |
| H8 | Máquina já suja + novo projeto | Dev só “trabalha normal” | Persistência local (systemd / LaunchAgent / monitor) reativa o payload |
| H9 | Propagação SSH | Dev tem hosts em `known_hosts` | Hipótese: cópia lateral para outros hosts acessíveis via SSH |
| H10 | PyPI / variante Hades (onda posterior) | `pip install` de pacote da onda | Hipótese de campanha expandida (ver refs JFrog); mesmo espírito supply-chain |

## 11.2 Como a contaminação “sobe” (pacote / Git)

| # | Canal | Hipótese do mecanismo | O que aparece pra quem olha depois |
| --- | --- | --- | --- |
| C1 | **npm publish** | Token npm (ou OIDC em Actions) na vítima → malware baixa tarball limpo, injeta payload, bump patch, publica | Nova versão no registry; `package.json` com script de install + deps Bun |
| C2 | **RubyGems publish** | Idem com credencial Ruby | Gem republicada infectada |
| C3 | **Push GitHub (repo da vítima)** | PAT/`ghs_` com `repo` → injeta em branch/PR ou `.github/` | Diff suspeito: setup.js, workflows, tags de Action |
| C4 | **Release de Action** | Compromete release/tag de action JS | Downstream `uses:` puxa artefato má |
| C5 | **Trusted publishing (OIDC)** | Runner GHA pede token npm via OIDC e publica “com provenance” | Pacote parece buildado no CI legítimo — CI já estava infectado |
| C6 | **Repo Hades (exfil, não worm)** | Cria repo público + sobe `results/*.json` | Description tipo Miasma/Hades; não é o app da vítima, é canal de roubo |

## 11.3 Cadeia bobinha (hipótese ponta a ponta)

```
Dev A infectado (H1/H3)
    → rouba token npm/GitHub
    → C1: publica lib@1.2.4 infectada
    → Dev B faz npm install (H1/H2)
    → Dev B infectado
    → se B tem token → repete
```

Paralelo Git:

```
Máquina/CI com PAT
    → C3/C4: push / Action infectada
    → outro time faz checkout + CI
    → H3/H5
```

## 11.4 Hipóteses de “por que o app no Git ficou sujo”

| Hipótese | Explicação curta | Confiança (analítica) |
| --- | --- | --- |
| P1 — Publish npm, Git limpo | Só o registry foi contaminado; o repo fonte no GitHub pode ainda estar limpo | Alta (caminho principal do worm) |
| P2 — Repo e npm sujos | Mesma sessão infectou e deu push em branch/workflow **e** publish | Média–alta (jobs de persistência no código) |
| P3 — Só Action/tag suja | Código-fonte “ok”, mas release/tag usada pelo `uses:` foi trocada | Média–alta |
| P4 — Contágio só local | Hooks/agentes/systemd; Git remoto ainda limpo até alguém commitar sem perceber | Média |
| P5 — Namespace legítimo hijacked | Conta/token de maintainer (ex. org conhecida) publicou versão má — não foi typosquat | Alta (caso Red Hat Cloud Services na literatura) |

## 11.5 Sinais bobos pra suspeitar (hipótese → checagem)

| Se você suspeita de… | Olhe de forma simples |
| --- | --- |
| H1/H2 | `package.json` da dependência: scripts `preinstall`/`install` em pacote “só types”; `binding.gyp` estranho |
| C1 | Versão nova no npm sem release notes; diff do tarball vs versão anterior |
| C3/C4 | Commits/workflows que você não fez; Action virando composite com Bun |
| C6 | Repos públicos novos com description Miasma/Hades e pasta `results/` |
| H6 | `settings.json` de agentes com `SessionStart`; `~/.config/index.js` |

## 11.6 O que estas hipóteses **não** dizem

- Não afirmam atribuição (quem criou a campanha).
- Não exigem Azure DevOps: o nome DurableTask é do **arquivo-sample**.
- Contágio principal observado na família: **npm + GitHub**, não “clicar em e-mail”.

← [Referências](./10-references.md) · [Índice](./README.md) · [Pós-TCC (honeypot/intel) →](./12-post-tcc-honeypot-intel.md)
