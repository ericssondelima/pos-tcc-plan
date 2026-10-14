# 07 — Detecção e hunting

## Alta prioridade (alta fidelidade)

1. Repos públicos novos com description **Hades - The End for the Damned** ou naming mitológico.
2. Commit messages com `IfYouYankThisTokenItWillNukeTheComputerOfTheOwnerFully:`.
3. Arquivo `tmp.0144018410.lock` em runners/devs.
4. Serviços `update-monitor` / `gh-token-monitor` / LaunchAgent `com.user.gh-token-monitor`.
5. User-Agent `python-requests/2.31.0` em tráfego GitHub API a partir de Node/Bun (mismatch de stack).
6. Poison de `/etc/hosts` com FQDNs StepSecurity.

## Média prioridade

- Download de `bun-v1.3.13` / `1.3.14` em jobs CI sem necessidade de Bun.
- Escrita de `.github/setup.js` + hook SessionStart em `settings.json` de Claude/Codex/Gemini/Copilot/Kiro/OpenCode.
- Docker.sock: kill de containers `harden-runner` / `step-security`.
- GraphQL `createCommitOnBranch` em massa em várias branches.

## Esboços de regras

**Sigma (conceito):** ProcessCreation onde `CommandLine` contém `tmp.0144018410` **ou** Image Bun e Parent npm/yarn **e** rede para `api.github.com` seguida de `PUT .../contents/results/`.

**YARA (conceito):** strings do marker + `Hades - The End for the Damned` + `thebeautifulmarchoftime` + padrões `eval(function(s,n){return s.replace(/[a-zA-Z]/g` no bundle.

**GitHub Audit Log:** `repo.create` + `git.push` com paths `results/results-` em conta pessoal logo após uso de PAT em Actions.

IOCs e regex prontos: ver [05-iocs.md](./05-iocs.md).

← [Módulos](./06-modules-detail.md) · [Índice](./README.md) · [IR →](./08-incident-response.md)
