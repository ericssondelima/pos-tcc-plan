# NIST SP 800-161r1-upd1 — Excertos pertinentes ao TCC (EN / PT)

Análise seletiva: **páginas do documento** (numeração impressa da SP), trecho em inglês, tradução/paráfrase em português, e **ligação à Pesquisa A/B** (supply chain + caso Miasma + CTI/mitigações).

**PDF:** [NIST.SP.800-161r1-upd1.pdf](./NIST.SP.800-161r1-upd1.pdf)  
**DOI:** https://doi.org/10.6028/NIST.SP.800-161r1-upd1  
**Nota:** “p. X” = página impressa no rodapé/cabeçalho da SP (não o número do leitor PDF). Appendix F no PDF local é um **ponteiro** para o portal EO 14028.

Resumo geral: [pt-BR](./NIST-800-161-resumo-pt-BR.md) · [en](./NIST-800-161-resumo-en.md)

---

## Como usar no artigo

```text
Afirmação sobre supply chain
    → citar NIST (p. X)
    → interpretar no contexto Miasma / ataques a pacotes
    → (depois) evidência técnica / CTI / mitigação
```

Não cite a 800-161 como se descrevesse o Miasma; cite-a como **framework de risco e governação** da cadeia.

---

## 1. Abstract — risco de funcionalidade maliciosa e falta de visibilidade

| | |
| --- | --- |
| **Página** | Abstract (frente do documento; PDF ~p. 5 do ficheiro) |
| **Secção** | Abstract |

**EN (trecho):**

> Organizations are concerned about the risks associated with products and services that may potentially contain malicious functionality, are counterfeit, or are vulnerable due to poor manufacturing and development practices within the supply chain. These risks are associated with an enterprise’s decreased visibility into and understanding of how the technology they acquire is developed, integrated, and deployed […]

**PT:**

> As organizações preocupam-se com riscos de produtos e serviços que possam conter funcionalidade maliciosa, ser contrafeitos ou ser vulneráveis por más práticas de fabrico/desenvolvimento na cadeia. Esses riscos ligam-se à **menor visibilidade e compreensão** de como a tecnologia adquirida é desenvolvida, integrada e implantada.

**Pertinência ao TCC:** enunciado direto do problema que o artigo trata — confiança cega em artefactos da cadeia. No caso Miasma, o “produto” (pacote npm / Action) pode carregar funcionalidade maliciosa no *install*, explorando exatamente essa opacidade.

---

## 2. p. 1 — Ecossistema e definição de supply chain

| | |
| --- | --- |
| **Página** | 1 |
| **Secção** | 1. Introduction |

**EN (trecho):**

> Information and communications technology (ICT) and operational technology (OT) rely on a complex, globally distributed, extensive, and interconnected supply chain ecosystem […] composed of public and private sector entities (e.g., acquirers, suppliers, developers, system integrators, external system service providers […]).

> In this document, the term *supply chain* refers to the linked set of resources and processes between and among multiple levels of an enterprise, each of which is an acquirer that begins with the sourcing of products and services and extends through the product and service life cycle.

> […] *cybersecurity risks throughout the supply chain* refers to the potential for harm or compromise that may arise from suppliers, their supply chains, their products, or their services.

**PT:**

> ICT/OT dependem de um ecossistema de cadeia global, distribuído e com vários níveis de *outsourcing*, com adquirentes, fornecedores, **desenvolvedores**, integradores e provedores externos.

> *Supply chain* = conjunto ligado de recursos e processos, em vários níveis, desde a obtenção de produtos/serviços até ao ciclo de vida completo.

> *Riscos de cibersegurança ao longo da cadeia* = potencial de dano/comprometimento vindo de fornecedores, das cadeias deles, dos produtos ou dos serviços.

**Pertinência ao TCC:** base para o diagrama Developer → Git → deps → CI/CD → artifact → registry → consumer. O Miasma atua em elos “developer / package / CI”, que a NIST inclui no ecossistema.

---

## 3. p. 2 — COTS, open source e opacidade de componentes

| | |
| --- | --- |
| **Página** | 2 |
| **Secção** | 1. Introduction (continuação) |

**EN (trecho):**

> […] deployed software is typically a commercial off-the-shelf (COTS) product, which includes smaller COTS or open source software components developed or sourced at multiple tiers. […] Software users may be unable to detect the smaller known vulnerable components in larger COTS software (e.g., lack of transparency, insufficient vulnerability management).

**PT:**

> Software implantado é tipicamente COTS e inclui componentes COTS/open source de **vários níveis**. Utilizadores podem **não conseguir detetar** componentes vulneráveis menores (falta de transparência, gestão de vulnerabilidades insuficiente).

**Pertinência ao TCC:** justifica SBOM, pin de dependências e o risco de *transitive trust*. Campanhas tipo Shai-Hulud/Miasma abusam dessa estrutura multinível (pacote “legítimo” com *payload* no lifecycle).

---

## 4. p. 11 — Visibilidade e controlo; produto genérico vs requisitos do cliente

| | |
| --- | --- |
| **Página** | 11 |
| **Secção** | Fig. 2 e texto associado |

**EN (trecho):**

> Fig. 2. An enterprise’s visibility, understanding, and control of its supply chain

> […] commercial ICT/OT developed by suppliers are typically designed for general purposes for a global market and are not tailored to an individual customer’s specific operational or threat environments. Enterprises should perform due diligence and research regarding their specific C-SCRM requirements […]

**PT:**

> A Fig. 2 ilustra a **visibilidade, compreensão e controlo** da empresa sobre a sua cadeia.

> Produtos comerciais ICT/OT são em geral pensados para o **mercado global**, não para o ambiente de ameaça de um cliente. Cabe à empresa fazer **due diligence** e definir requisitos C-SCRM.

**Pertinência ao TCC:** argumenta por que *npm install* de um pacote “famoso” não implica adequação de segurança ao consumidor. Relação de confiança ≠ garantia de integridade.

---

## 5. p. 21 — Exemplos de ameaças adversarial (malware na cadeia)

| | |
| --- | --- |
| **Página** | 21 |
| **Secção** | Exemplos de riscos + Fig. 4 |

**EN (trecho):**

> • A proxy working on behalf of a nation-state inserts malicious software into supplier-provided product components used in systems sold to government agencies. […]  
> • A system integrator working on behalf of an agency reuses vulnerable code, leading to a breach […]  
> • An organized criminal enterprise introduces counterfeit products onto the market […]

> Fig. 4. Cybersecurity risks throughout the supply chain  
> Adversarial: E.g., insertion of malware, counterfeits, industrial espionage, supply disruption […]

**PT:**

> Exemplos NIST incluem: inserção de software malicioso em componentes fornecidos; reutilização de código vulnerável por integrador; produtos contrafeitos.

> Fig. 4: riscos = ameaças × vulnerabilidades; ameaças adversariais incluem **inserção de malware**, contrafação, espionagem, disrupção, etc.

**Pertinência ao TCC:** enquadra o Miasma na categoria “inserção de malware / compromisso de componente na cadeia”, sem precisar atribuir *nation-state* (no artigo: hipótese / Almirantado). Útil na fundamentação de *Software Supply Chain Attacks*.

---

## 6. p. 38–41 — Aquisição, SDLC e proteção contra inserção maliciosa

| | |
| --- | --- |
| **Páginas** | 38, 41 |
| **Secção** | 3.1 Acquisition / papel da C-SCRM no processo de aquisição |

**EN (trecho, p. 38):**

> Establishing C-SCRM controls applicable throughout the supply chain and the SDLC will aid the enterprise in establishing a common lexicon and set of expectations with suppliers and sub-suppliers […]

**EN (trecho, p. 41):**

> Tools, techniques, and practices may provide protections against unauthorized production, theft, tampering, insertion of counterfeits, **insertion of malicious software or backdoors**, and poor development practices throughout the system development life cycle.

> Prior to purchase, enterprises should identify and assess the quality of the product or system components, vulnerability(s) authenticity, and other relevant cybersecurity-supply chain risk factors and complete this risk assessment prior to deployment.

> Once the contract is executed, the enterprise should monitor for changes that alter its exposure to cybersecurity risks throughout the supply chain. Such changes may include […] product updates […]

**PT:**

> Controlos C-SCRM ao longo da cadeia e do **SDLC** alinham expectativas com fornecedores e subfornecedores.

> Ferramentas/práticas protegem contra produção não autorizada, furto, adulteração, contrafação, **inserção de software malicioso ou backdoors** e más práticas de desenvolvimento.

> Antes da compra: avaliar qualidade, vulnerabilidades, **autenticidade** e fatores de risco. Após contrato: **monitorizar mudanças** (incluindo updates de produto) que alterem a exposição.

**Pertinência ao TCC:** liga aquisição/SDLC a mitigações do artigo (pin, provenance, review de publish, monitorização de versões npm). O worm Miasma republica updates — exatamente o tipo de “product update” que a NIST diz para vigiar.

---

## 7. p. 48 — Práticas de sustentação (monitorização contínua de fornecedores)

| | |
| --- | --- |
| **Página** | 48 |
| **Secção** | 3.4.2 Sustaining Practices |

**EN (trecho):**

> • Establish formal processes and intervals for continuous monitoring and reassessment of suppliers, supplied products and services, and the supply chain itself for potential changes to the risk profile.  
> • Use confidence-building mechanisms, such as third-party assessment surveys, on-site visits, and formal certifications […]  
> • Establish and collaborate with a threat-informed security program.

**PT:**

> Monitorização e reavaliação contínua de fornecedores, produtos/serviços e da própria cadeia; mecanismos de confiança (avaliações, certificações); programa de segurança **informado por ameaças**.

**Pertinência ao TCC:** ponte para Detection Engineering / hunting (Fase D da lista de leitura) e para “trabalhos futuros” (honeypot/intel) — sem misturar no escopo obrigatório.

---

## 8. p. 247 — Appendix F (software supply chain / EO 14028)

| | |
| --- | --- |
| **Página** | 247 |
| **Secção** | Appendix F |

**EN (trecho completo do PDF local):**

> Departments and agencies seeking to implement Cybersecurity Supply Chain Risk Management in accordance with Executive Order (EO) 14028 […] should reference NIST’s dedicated EO 14028 web-based portal at https://www.nist.gov/itl/executive-order-improving-nations-cybersecurity. This guidance has been moved online in order to: co-locate it with related EO guidance […]; enable updates […] without directly impacting SP 800-161, Rev. 1; and provide traceability […]

**PT:**

> O Appendix F **não traz** no PDF o guia completo de software; remete para o **portal EO 14028** do NIST, para a orientação de segurança de software na supply chain poder atualizar-se sem republicar a SP 800-161.

**Pertinência ao TCC:** ao falar SBOM / critical software / práticas de software, citar também o portal EO + NTIA SBOM (já referenciado na SP, p. 60 refs) e, se possível, **NIST SSDF SP 800-218**. Não inventar conteúdo do Appendix F que não está neste PDF.

---

## 9. Mapa rápido: excerto → capítulo do artigo

| Excerto (p.) | Capítulo típico (Pesquisa A/B) |
| --- | --- |
| Abstract, p. 1–2 | §2.1 Software Supply Chain |
| p. 11, p. 21 | §2.2 Supply Chain Attacks / confiança |
| p. 38–41, p. 48 | § Mitigações / DevSecOps |
| p. 247 + portal EO | § Mitigações (SBOM / software) + metodologia de fontes |
| — | § Malware / CTI / Diamond: **não** basear só na 800-161 |

---

## 10. Sugestão de citação (provisória)

**ABNT (exemplo):**

BOYENS, J. et al. *Cybersecurity Supply Chain Risk Management Practices for Systems and Organizations*. Gaithersburg: NIST, 2022. NIST SP 800-161r1-upd1 (atualização 1 nov. 2024). Disponível em: https://doi.org/10.6028/NIST.SP.800-161r1-upd1. Acesso em: …

**APA (exemplo):**

Boyens, J., Smith, A., Bartol, N., Winkler, K., Holbrook, A., & Fallon, M. (2022). *Cybersecurity supply chain risk management practices for systems and organizations* (NIST SP 800-161r1-upd1). National Institute of Standards and Technology. https://doi.org/10.6028/NIST.SP.800-161r1-upd1

(Confirmar norma final com orientadores — dupla titulação.)

---

← [Resumo pt-BR](./NIST-800-161-resumo-pt-BR.md) · [Summary en](./NIST-800-161-resumo-en.md) · [README fase 01](./README.md) · [Leitura](../../TCC-leitura-referencias.md)
