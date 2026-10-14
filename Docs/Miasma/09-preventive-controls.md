# 09 — Controles preventivos e limitações

## Controles

| Controle | Por quê |
| --- | --- |
| Bloquear/monitorar Docker.sock em runners | Impede sudoers + kill harden-runner |
| StepSecurity / egress allowlist | Limita exfil e download Bun inesperado |
| `id-token` / OIDC publish com aprovação e environment protection | Reduz abuso Sigstore/npm OIDC |
| Secret scanning + push protection | Markers e keys em commits |
| Alertar creation de repos públicos com description Hades / naming | Exfil channel |
| Hardening de agentes de IA (hooks SessionStart) | Persistência local |
| Separar PATs de CI; least privilege; short-lived tokens | Reduz blast radius |
| EDR nos paths listados em `securityToolPathIndicators` | Payload reduz agressividade — não depende só disso |
| Pin + provenance attestation de Actions e deps | Detecta mutação de tarball/release |

## Limitações desta análise

- Baseada no **código desofuscado e fatiado**; símbolos foram renomeados — nomes de classes são analíticos, não necessariamente os do bundle ofuscado.
- Domínio C2 efetivo pode ser **dinâmico** (commit assinado); `api.anthropic.com` no default está com `noop: true`.
- Chaves RSA públicas embutidas (`signedDomainPublicKey`, envelope pubkey) existem no bundle — extrair fingerprints em follow-up de IR se necessário.
- Comportamento varia por env (`GITHUB_ACTIONS`, `SKIP_DOMAIN`, docker.sock, EDR).
- Este pack **não** descreve como remontar ou executar o malware.

← [IR](./08-incident-response.md) · [Índice](./README.md) · [Referências →](./10-references.md)
