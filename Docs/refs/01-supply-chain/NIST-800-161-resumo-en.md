# NIST SP 800-161r1-upd1 — Detailed chapter-by-chapter summary (en)

**Source:** Boyens et al. (2022; upd. 1 Nov 2024). NIST SP 800-161 Rev. 1 Update 1.  
**DOI:** https://doi.org/10.6028/NIST.SP.800-161r1-upd1  
**PDF (~325 pages):** [NIST.SP.800-161r1-upd1.pdf](./NIST.SP.800-161r1-upd1.pdf)  
**pt-BR:** [NIST-800-161-resumo-pt-BR.md](./NIST-800-161-resumo-pt-BR.md)  
**Citable excerpts:** [NIST-800-161-excertos-TCC.md](./NIST-800-161-excertos-TCC.md)

**How to use:** this is your **study guide**. Read it first; open the PDF only to **cite** (page/quote) or when a point here is not enough. You do not need to read all ~300 pages cover to cover.

---

## Document overview

SP 800-161 is the U.S. federal guide for **C-SCRM** — managing **cybersecurity** risk that enters through the **supply chain**. It is governance + risk process + acquisition + controls — **not** malware analysis or an attack taxonomy.

| Part | Approx. pages | Weight |
| --- | --- | --- |
| Ch. 1–3 (narrative body) | 1–62 | What you must actually understand |
| Appendix A (800-53 controls) | 63–163 | Lookup / compliance |
| Appendices B–E, G–K | rest | Tables, templates, glossary, deep risk |
| Appendix F | 247 | Web pointer only (EO 14028) |

---

# Chapter 1 — Introduction (pp. 1–17)

## Problem

ICT/OT rely on a **global, multi-tier, outsourced** ecosystem of acquirers, suppliers, **developers**, integrators, and external service providers. That ecosystem delivers cheap, reusable solutions — and **opacity**: organizations often cannot see how acquired technology is developed, integrated, and maintained. The Abstract highlights risks of **malicious functionality**, **counterfeits**, and weak development practices, plus **decreased visibility**.

## Key definitions

**Supply chain:** linked resources and processes across enterprise levels (each level is also an acquirer), from sourcing through the product/service life cycle.

**Cybersecurity risks throughout the supply chain:** potential harm/compromise from suppliers, *their* supply chains, products, or services — threats exploiting vulnerabilities in what traverses the chain or in the chain itself.

NIST dropped the narrow “ICT supply chain” label (2015): cyber risk can arise in product/service chains generally.

**C-SCRM** = intersection of classic SCRM and information security. Non-cyber SCRM topics are largely out of scope.

## Examples (pp. 1–2)

IP theft abroad; ransomware at a supplier **three tiers down**; breach via HVAC vendor with portal access. The same factors that create COTS/open-source benefits (cost, innovation) increase risk. Deployed software usually embeds multi-tier COTS/OSS components; updates often miss them; users may **not detect** known vulnerable nested components (**lack of transparency**).

## C-SCRM dimensions (Fig. 1)

Culture & awareness; security (CIA of supply-chain information and goods); suitability; safety; reliability; usability; quality; efficiency; maintainability; **integrity** — supply-chain security is broader than patching.

## Visibility (Fig. 2)

Near relationships (e.g., contracted integrators) are more controllable. Global commercial products are **not** tailored to your threat environment → due diligence and C-SCRM requirements. Upstream flow-down must stay feasible and cost-effective.

## Audience

AO, CIO/CISO, privacy, engineering/SDLC, acquisition, risk. Reader profiles point different roles to different sections. Cloud: FedRAMP first, then 800-161 for gaps.

**Thesis use:** foundation for Software Supply Chain (trust/opacity) before attack taxonomies and Miasma.

---

# Chapter 2 — Integration into enterprise-wide risk management (pp. 18–36)

## Core idea

C-SCRM is embedded in SP 800-39’s cycle: **Frame → Assess → Respond → Monitor**. It needs cultural change and cross-discipline collaboration (security, procurement, ERM, engineering, software, IT, legal, HR). Activities sit inside **acquisition**, **SDLC**, and ERM: criticality, dependency on products/services, security requirements, monitoring.

## Business case

Lower likelihood of supply-chain compromise; better detect/respond/recover; operational efficiency; greater assurance of authentic, reliable, secure products and trustworthy suppliers.

## Risks throughout the chain (Fig. 4, ~p. 21)

Threats × vulnerabilities. Adversarial examples include malware insertion into components, reused vulnerable code, counterfeits, unvetted relabeled parts. Fig. 4 splits adversarial vs non-adversarial threats and internal vs external vulnerabilities. Supply-chain vulns may take **years** to exploit/discover; attribution to the chain can be hard.

## Three levels

### Level 1 — Enterprise
Executive ownership (individual/office/risk board). C-SCRM **Strategy**, **Policy**, high-level **Implementation Plan**, governance, resource prioritization. Sets tone and constraints for Levels 2–3.

### Level 2 — Mission / Business Process
Tailors Level-1 strategy to each mission/business line. Program requirements (cost, schedule, performance, security + non-functionals). Roles: PMs, R&D, acquisitions.

### Level 3 — Operational
System owners, contracting officers, architects, engineers, security specialists, integrators, **developers**. SDLC end-to-end. Produces system **C-SCRM plans**; inherited controls (L1/L2) + system-specific; RMF (SP 800-37); tactical reporting. C-SCRM PMO may centralize product assessments.

## Documents & PMO

Strategy / Policy / Plan / metrics relate across levels. PMO coordinates multidisciplinary work when established.

**Thesis use:** how serious orgs govern supply-chain cyber risk — then contrast with Miasma failures in acquisition/SDLC/monitoring.

---

# Chapter 3 — Critical success factors (pp. 37–62)

## 3.1 Acquisition (pp. 38–42)

### Strategy
Strategy must state how risk is managed through acquisition. Risks arise from the supplier’s enterprise, products/services, and the supplier’s own chain. Controls align to 800-53/CSF; apply to primes/subs; flow down the SDLC.

### Acquisition process
Cross-functional acquisition/IPT teams. Context (criticality, data sensitivity, environment) drives risk tolerance and which controls enter requirements/contracts. **Avoid LPTA** for ICT/OT.

Lifecycle (per IR 7622): plan → requirements → market analysis → procure → compliance → **monitor** risk-changing performance (including charge cards).

Due diligence: RFI/SSN/questionnaires; first assessment is **not** exhaustive. Pre-purchase: quality, vulnerabilities, **authenticity**, risk factors — assess **before** deploy. Post-award: monitor enterprise/supplier/product/geopolitical changes; termination grounds if risk cannot be mitigated; feed lessons back.

Protective aims include tampering, counterfeits, **malicious software/backdoors**, poor SDLC practices. Contracts: security as award condition; subcontractor flow-down; periodic revalidation; vuln/incident reporting; response roles.

**Thesis / Miasma:** worm-driven **product updates** and publish-token abuse are exactly the post-acquisition/lifecycle changes NIST says to monitor.

## 3.2–3.3 Roles

Legal, acquisition, engineering (open source), **developers** (find/fix weaknesses early), shipping, PMs, end users — shared responsibility. Explicit roles + resources + checks are required.

## 3.4 Practice bands

### Foundational
C-SCRM PMO/team; senior support; risk hierarchy (800-39/800-30); governance/policies; supplier/product/service criticality process; awareness; acquisition policy integration; FIPS 199 impact processes; prioritized supplier risk assessments; quality/reliability program; explicit multidisciplinary roles; dedicated resources; 800-53 baseline; compliance checks; supplier management (e.g., OEMs); C-SCRM in incident management.

### Sustaining
Threat-informed program; supplier assessments/certs (ISO 27001, IEC 62443-4-1, …); **continuous monitoring** of suppliers/products/chain; formal appetite/tolerances; ISAC/FASC sharing; elevate top risks to senior risk committee; role-based training; C-SCRM metrics.

### Enhancing
Automation; quantitative/probabilistic risk analysis; leading metrics for predictive strategy; communities of practice / centers of excellence.

Table 3 gives an implementation model by band.

## 3.5 Metrics (pp. 52+)

Metric development process (Fig. 8 / SP 800-55). Report via ERM to the board. Benefits: accountability, effectiveness, compliance evidence, resource decisions, cost avoidance.

**Thesis use:** mitigations / DevSecOps narrative.

---

# Appendix A — C-SCRM security controls (pp. 63–~163)

~**100 pages** — largest PDF block. SP **800-53 Rev. 5** overlay with C-SCRM supplemental guidance, level tags (1/2/3), flow-down notes. Families run through System & Services Acquisition, System & Information Integrity, and **Supply Chain Risk Management**.

**Study method:** learn the logic (assessable controls); skim family index; open only controls you will cite (e.g., acquisition, code authenticity/integrity). Do **not** dump the catalog in the thesis.

Example (SI family): code authentication mechanisms (e.g., digital signatures) for software/firmware/information integrity — Level 3.

---

# Appendix B — Control summary (p. 164+)

Tables mapping C-SCRM controls ↔ 800-53, baselines, flow-down. Lookup map, not narrative.

---

# Appendix C — Risk exposure / scenarios (~p. 176+)

Sample risk-exposure framework plus worked scenarios (Tables 8–13). Teaches how to **write** a supply-chain risk narrative — reusable for a Miasma-shaped scenario.

---

# Appendix D — Templates (p. 196+)

Official templates: Strategy & Implementation Plan; Policy; system Plan; assessment worksheets. Mention in methodology if discussing governance artifacts; fill only if the assignment requires it.

---

# Appendix E — Institutional context

Supporting U.S. federal relationship material (e.g., FASC context). Optional for non-U.S.-gov papers.

---

# Appendix F — Software / EO 14028 (p. 247)

**This PDF does not contain the full software guidance.** It only points to:

https://www.nist.gov/itl/executive-order-improving-nations-cybersecurity

so SBOM/critical-software guidance can evolve without republishing SP 800-161.

For thesis SBOM/software topics: EO portal + NTIA SBOM + **SSDF SP 800-218**.

---

# Appendix G — Risk-process activities (pp. 248–~291)

Deep dive of Chapter 2.

| Step | Focus |
| --- | --- |
| **Frame** (~251+) | Context across 3 levels; chain structure; strategies; systems; inputs to Assess; bidirectional feedback |
| **Assess** (~272+) | Criticality, threats, vulns, likelihood, impact, appetite → compromise risk |
| **Respond** (~281+) | Select/tailor controls; acceptance consequences; **C-SCRM plan**; supplier/SDLC requirements |
| **Monitor** (~287+) | Compliance; ongoing effectiveness; change detection |

Long tables: threat sources, vulnerability considerations, impact, likelihood, constraints, appetite/tolerance, vulns by enterprise level.

**Thesis use:** strongest NIST block for academic “how to analyze supply-chain cyber risk” before ATT&CK/malware.

---

# Appendices H–K (p. 292+)

| Appendix | Content | Use |
| --- | --- | --- |
| **H** Glossary | acquirer, acquisition, acceptable risk, … | Citable definitions |
| **I** Acronyms | C-SCRM, … | Lookup |
| **J** Resources | Other NIST, law, SAFECode, NTIA SBOM, SSDF… | Cross-bibliography |
| **K** Revision history | Incl. 2024 updates | Version dating |

---

# Chapter → thesis map

| NIST | Research A/B |
| --- | --- |
| Ch. 1 | § Software Supply Chain |
| Ch. 2 + App. G | § Methodology / risk governance |
| Ch. 3 | § Mitigations / DevSecOps |
| Ch. 1 examples + Fig. 4 | Bridge to § Attacks (then Ladisa + Miasma) |
| App. A (selective) | Specific control in mitigation |
| App. F + SSDF | SBOM / secure software development |
| — | Malware/CTI/Diamond do **not** come from 800-161 |

---

# Study order (300 pages → essentials)

```text
1. This summary (full)
2. PDF Ch. 1 (pp. 1–12) when citing definitions
3. PDF Ch. 2 levels (pp. 27–33)
4. PDF Ch. 3.1 + 3.4 (pp. 38–49)
5. Skim App. G tables if you need risk methodology
6. App. A on demand
7. App. F → EO portal + download SSDF 800-218
```

← [README](./README.md) · [pt-BR](./NIST-800-161-resumo-pt-BR.md) · [Reading list](../../TCC-leitura-referencias.md)
