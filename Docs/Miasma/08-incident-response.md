# 08 — Resposta a incidente

Checklist defensivo (não inclui execução do sample).

1. **Isolar** runner/host; não reiniciar até coletar volatilidade se mem dump for relevante.
2. **Preservar** `tmp.0144018410.lock`, serviços user systemd/LaunchAgents, `~/.config/index.js`, `.github/setup.js`, settings de agentes.
3. **Rotacionar** todos os tokens potencialmente tocados: GitHub PAT/ghs, npm, RubyGems, AWS/Azure/GCP, Vault, K8s, 1Password/Bitwarden session, SSH keys.
4. **Auditar GitHub:** repos Hades; commits com markers; Actions modificadas; packages npm/Ruby publicados no período; OIDC publishes.
5. **Verificar** `/etc/hosts` e `/etc/resolv.conf` em runners; reaplicar harden-runner/StepSecurity.
6. **Revogar** releases/tags de Actions alteradas; yank/unpublish pacotes infectados se política permitir.
7. **Caçar lateral:** known_hosts SSH, outros hosts com mesmos serviços/monitor scripts.
8. **Não** testar o sample em rede corporativa; lab air-gapped apenas se dinâmica for necessária e autorizada.

Artefatos e IOCs: [05-iocs.md](./05-iocs.md). Controles: [09-preventive-controls.md](./09-preventive-controls.md).

← [Detecção](./07-detection-hunting.md) · [Índice](./README.md) · [Controles →](./09-preventive-controls.md)
