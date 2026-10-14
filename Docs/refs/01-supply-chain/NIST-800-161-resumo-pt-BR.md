# NIST SP 800-161r1-upd1 — Resumo detalhado por capítulo (pt-BR)

**Fonte:** Boyens et al. (2022; atual. 1 nov. 2024). *Cybersecurity Supply Chain Risk Management Practices for Systems and Organizations*. NIST SP 800-161 Rev. 1 Update 1.  
**DOI:** https://doi.org/10.6028/NIST.SP.800-161r1-upd1  
**PDF (~325 págs):** [NIST.SP.800-161r1-upd1.pdf](./NIST.SP.800-161r1-upd1.pdf)  
**EN:** [NIST-800-161-resumo-en.md](./NIST-800-161-resumo-en.md)  
**Citações página a página:** [NIST-800-161-excertos-TCC.md](./NIST-800-161-excertos-TCC.md)

**Como usar este ficheiro:** é o teu **guia de estudo**. Lê isto primeiro; abre o PDF só quando fores **citar** (página/trecho) ou quando um ponto daqui não chegar. Não precisas ler as 300 páginas de ponta a ponta.

---

## Visão geral do documento

A SP 800-161 é o guia federal dos EUA para **C-SCRM** — gestão de riscos de **cibersegurança** que entram pela **cadeia de suprimentos**. Não é um manual de malware analysis nem uma taxonomia de ataques; é **governação + processo de risco + acquisition + controlos**.

Estrutura real do PDF:

| Parte | Págs. (aprox.) | Peso |
| --- | --- | --- |
| Cap. 1–3 (corpo narrativo) | 1–62 | O que tens de entender de verdade |
| Apêndice A (controlos 800-53) | 63–163 | Consulta / compliance |
| Apêndices B–E, G–K | resto | Tabelas, templates, glossário, risco detalhado |
| Apêndice F | 247 | Só ponteiro web (EO 14028) |

---

# Capítulo 1 — Introduction (p. 1–17)

## 1.1 Contexto e problema

ICT e OT dependem de um ecossistema de supply chain **global, distribuído e com vários níveis de outsourcing**. Participam adquirentes (*acquirers*), fornecedores, **desenvolvedores**, integradores de sistemas, provedores de serviços externos e outros prestadores ICT/OT. Eles pesquisam, desenvolvem, fabricam, adquirem, entregam, integram, operam, mantêm e descartam produtos e serviços — sob leis, políticas e práticas diversas.

Esse ecossistema trouxe soluções reutilizáveis e baratas. O lado negro: **mais complexidade, diversidade e interdependência**. A organização deixa de “fabricar tudo” e passa a **confiar** em terceiros — e muitas vezes **não vê** como a tecnologia foi feita.

O Abstract (frente do doc) resume o medo central: produtos/serviços com **funcionalidade maliciosa**, **falsificados**, ou vulneráveis por más práticas; e a **falta de visibilidade** sobre desenvolvimento, integração e implantação.

## 1.2 Definições que o TCC deve usar

**Supply chain (neste documento):** conjunto ligado de recursos e processos entre vários níveis da empresa; cada nível é também um adquirente; começa no sourcing e vai até o ciclo de vida do produto/serviço.

**Cybersecurity risks throughout the supply chain:** potencial de dano ou compromisso que pode vir de:

- fornecedores,
- das cadeias *deles*,
- dos produtos,
- ou dos serviços.

São riscos de ameaças que exploram vulnerabilidades **no que atravessa a cadeia** ou **na própria cadeia**.

A NIST abandonou o termo estreito “ICT supply chain” (versão 2015): risco cibernético pode existir em cadeias de produto/serviço em geral (ICT e não-tech).

**C-SCRM** = cruzamento de SCRM tradicional + Information Security. A publicação **não** cobre muitos aspetos não-cibernéticos do SCRM.

## 1.3 Exemplos de risco (p. 1–2)

1. Roubo de material de design noutro país → perda de IP e market share.  
2. Ransomware num fornecedor **três tiers abaixo** → disrupção de componentes críticos.  
3. Breach ligado a vendor HVAC com acesso ao portal de dados da rede de lojas.

Benefícios da cadeia (custo, interoperabilidade, inovação, variedade) são os **mesmos fatores** que aumentam o risco. Software implantado costuma ser COTS com **componentes COTS/open source de vários níveis**; updates muitas vezes **não** atualizam esses componentes menores; o utilizador pode **não detetar** vulnerabilidades conhecidas dentro do pacote maior (**falta de transparência**).

## 1.4 Dimensões da C-SCRM (Fig. 1, ~p. 8–9)

Não é só “o fornecedor tem firewall”. A Fig. 1 agrupa dimensões como:

- **Culture & Awareness** — valores e formação para a C-SCRM importar de verdade  
- **Security** — CIA da informação *sobre* a cadeia, *que atravessa* a cadeia, e *sobre* os participantes  
- **Suitability / Safety / Reliability / Usability / Quality / Efficiency / Maintainability**  
- **Integrity** — guardar produtos/componentes contra alteração indevida  

Isto ajuda o artigo a dizer: supply chain security ≠ só patch management.

## 1.5 Visibilidade (Fig. 2, ~p. 11)

A empresa vê e controla melhor relações **próximas** (ex.: integrador sob contrato detalhado). Produtos comerciais genéricos para mercado global **não** são feitos sob medida para o teu threat model → precisa de **due diligence** e requisitos C-SCRM. Empurrar requisitos “para montante” na cadeia só faz sentido se for **viável e custo-efetivo**.

## 1.6 Público e âmbito

Leitores: AO, CIO/CISO, privacy, desenvolvimento/engenharia, acquisition, risco. Há perfis de leitura (quem é de procurement lê certas secções; quem é SDLC lê outras). Cloud: FedRAMP primeiro, 800-161 no que o FedRAMP não cobre.

**Propósito do Cap. 1 no TCC:** fundamentar o objeto “software supply chain” e o problema da confiança/opacidade — antes de Ladisa (ataques) e Miasma (caso).

---

# Capítulo 2 — Integration of C-SCRM Into Enterprise-Wide Risk Management (p. 18–36)

## 2.1 Ideia central

C-SCRM **não** é um projeto à parte: entra no processo enterprise-wide de risco da SP 800-39:

1. **Frame** — contexto e estado atual da ICT/cadeia  
2. **Assess** — criticalidade, ameaça, vulnerabilidade, likelihood, impacto  
3. **Respond** — selecionar/adaptar/implementar controlos  
4. **Monitor** — exposição e eficácia no tempo, com feedback  

Exige **mudança cultural** e equipas multidisciplinares (security, procurement, ERM, engineering, software, IT, legal, HR). Atividades C-SCRM embutidas em **aquisição**, **SDLC** e ERM: criticalidade das funções, dependência de produtos/serviços, requisitos de segurança, monitorização.

## 2.2 Business case (por que investir)

- Reduz likelihood de compromisso na cadeia e melhora detecção/resposta/recuperação  
- Eficiência (estrutura, priorização, menos processos duplicados)  
- Mais confiança em qualidade, autenticidade, fiabilidade, resiliência, segurança dos produtos  
- Mais confiança em fornecedores/prestadores  

## 2.3 Riscos ao longo da cadeia (Fig. 4, ~p. 21)

Riscos materializam-se quando **ameaças** exploram **vulnerabilidades**.

Exemplos adversariais no texto: inserção de malware em componentes; reutilização de código vulnerável por integrador; contrafação; relabeling de componentes de fonte não vetted.

Fig. 4 tipifica:

- Ameaças **adversariais** (malware, contrafação, espionagem, disrupção, FOCI…)  
- **Não adversariais** (desastre, má qualidade, guerra, sanções…)  
- Vulnerabilidades **externas** (interdependências, higiene fraca de entidades da cadeia)  
- **Internas** (sistemas sem patch, controlos ineficazes, falta de awareness)

Ponto importante para o artigo: vulnerabilidades na cadeia podem demorar **anos** a ser exploradas ou descobertas; às vezes é difícil provar que o incidente “veio da supply chain”.

## 2.4 Os três níveis (o coração do Cap. 2)

### Nível 1 — Enterprise (~p. 27–30)

Compromisso de **senior leadership**. Responsabilidade executiva clara (indivíduo, office ou risk board). Papéis C-SCRM definidos para líderes de acquisition, security, IT, legal, PM, logistics.

**Entregáveis típicos:** C-SCRM **Strategy**, **Policy**, High-level **Implementation Plan**, governação, allocation de recursos. Define o tom; o Level 1 **molda e restringe** o que Level 2 e 3 fazem. Accountability última pelo risco na cadeia fica no nível enterprise.

### Nível 2 — Mission and Business Process (~p. 30–32)

Adapta estratégia/política do Level 1 a **cada missão/linha de negócio**. Define requisitos de programa (custo, schedule, performance, security + non-functional: reliability, safety, quality…). Roles: program managers, R&D, acquisitions. Pode haver strategies/policies/procedures **tailored** por mission area.

### Nível 3 — Operational (~p. 33–)

Quem executa: system owners, contracting officers, architects, engineers, security specialists, integrators, **developers**. Atua no **SDLC** (R&D → design → manufacture → delivery → integration → O&M → disposal).

Produz **C-SCRM plans** do sistema: gestão, assurance, monitorização de controlos (incluindo externos/contratados). Controlos = herdados (L1/L2) + específicos do sistema. Reporting tático (eficácia, exposição). RMF (SP 800-37) no operacional. PMO C-SCRM pode centralizar assessments de produto.

## 2.5 Documentos e PMO

Há relação entre Strategy / Policy / Plan / métricas (Figs. 6–7 no doc). O **C-SCRM PMO** (quando existe) coordena multidisciplinaridade e serviços partilhados (ex.: product risk assessments).

**Propósito do Cap. 2 no TCC:** explicar *como* uma org séria governa risco de supply chain — depois mostrar (com Miasma) o que acontece quando acquisition/SDLC/monitorização falham.

---

# Capítulo 3 — Critical Success Factors (p. 37–62)

## 3.0 Mensagem do capítulo

Sucesso exige processos internos múltiplos, comunicação entre níveis/missões, e cada pessoa entender o seu papel. Não basta “ter um controlo no papel”.

## 3.1 Acquisition — onde a C-SCRM encontra o dinheiro (p. 38–42)

### 3.1.1 Aquisição na Strategy & Implementation Plan

A estratégia deve dizer **como** o risco é gerido ao longo do processo de aquisição. Riscos vêm do enterprise do fornecedor, dos produtos/serviços, e da **cadeia do fornecedor**. Controlos alinhados a 800-53 / CSF; aplicam-se à empresa, primes e subcontractors; no SDLC **fluem para baixo** (flow-down). Lexicon comum com suppliers/sub-suppliers.

### 3.1.2 Papel da C-SCRM no processo de aquisição

Equipa de aquisição / IPT: program, technical, security, supply, procurement. Contexto (criticalidade, sensibilidade de dados, ambiente operacional) define **tolerance** e quais controlos 800-161/800-53 entram no requisito/contrato.

**Evitar LPTA** (“lowest price, technically acceptable”) em compras ICT/OT — segurança é fator crítico.

Ciclo (alinhado a IR 7622): plan procurement → define requirements → market analysis → complete procurement → compliance → **monitor performance** por mudanças no risco C-SCRM (também charge cards).

Na fase de planeamento: necessidade + criticalidade (quanto risco se tolera, quem entra no planeamento).

Due diligence / market analysis: RFI, SSN, questionários; **não** tratar a primeira assessment como exaustiva. Antes da compra: qualidade, vulnerabilidades, **autenticidade**, fatores de risco — assessment **antes** do deploy.

Pós-contrato: monitorizar mudanças (internas, no fornecedor, updates de produto, geopolítica/ambiente). Contratos com grounds for termination se o risco não for mitigável. Lições aprendidas voltam ao ciclo.

Ferramentas/técnicas: obscure end use, blind/filtered buys, tamper-evident packaging, trusted distribution, etc., guiadas pela risk assessment.

Proteções explícitas no texto: unauthorized production, theft, tampering, counterfeits, **insertion of malicious software or backdoors**, poor development practices no SDLC.

Contratos devem incluir, entre outros: security requirements como condição de award; **flow-down** a subcontractors; revalidação periódica; reporting de vulns/incidentes/disrupções; papéis gov/supplier/terceiros na resposta.

**Para o TCC / Miasma:** o worm republica *updates* e abusa de tokens de publish — exatamente o tipo de mudança pós-aquisição / lifecycle que a NIST diz para monitorizar. Pacote “barato/rápido” sem due diligence = anti-padrão LPTA mental.

## 3.2–3.3 Pessoas, papéis, colaboração

Exemplos de papéis no texto: Legal (linguagem contratual C-SCRM), Acquisition (assurance no processo), Engineering (requisitos open source), **Software developers** (achar/corrigir weaknesses cedo), Shipping (tamper en route), PMs (C-SCRM no plano), e **todos os end users**.

Sem papéis explícitos + recursos + checks and balances, a política não chega ao SDLC.

## 3.4 Práticas por maturidade

### Foundational (p. 46–47) — base sem a qual o resto não segura

Exemplos do documento:

- PMO / equipa multidisciplinar dedicada a C-SCRM  
- Apoio senior leadership  
- Hierarquia e processo de risco (800-39 / 800-30)  
- Governação + C-SCRM nas políticas enterprise  
- Processo para medir **criticalidade** de suppliers/products/services  
- Awareness do que é C-SCRM e por que importa  
- Integrar C-SCRM em políticas/procedimentos de **acquisition** (e purchase cards)  
- Processos FIPS 199 impact levels  
- Supplier risk-assessment priorizado (criticality + threat + vulnerability)  
- Programa quality & reliability  
- Roles/accountabilities explícitos (Legal, Risk, HR, Finance, IT, Eng, Infosec, Acquisition, Logistics…)  
- Recursos adequados; cleared personnel quando necessário  
- Baseline de controlos 800-53 tailored  
- Checks internos de compliance  
- Supplier management program (ex.: OEMs qualificáveis)  
- C-SCRM no incident management  

### Sustaining (p. 48) — depois da base estar padronizada

- Programa de segurança **threat-informed**  
- Confidence-building: surveys, site visits, certs (ISO 27001, IEC 62443-4-1…) em suppliers críticos  
- **Continuous monitoring** e reassessment de suppliers, produtos/serviços e da cadeia  
- Risk appetite / tolerances formais alinhados à missão  
- Information sharing (ISACs, FASC, agências)  
- Elevar top risks C-SCRM ao comité de risco sénior  
- Treino C-SCRM nos currículos dos roles relevantes  
- Métricas C-SCRM para leadership  

### Enhancing (p. 49) — preditivo / adaptativo

- Automatizar processos C-SCRM  
- Análise quantitativa / probabilística (ex. Bayesian)  
- Métricas *leading* para estratégias preditivas  
- Community of practice / Centers of Excellence  

Table 3 no doc dá um modelo de implementação por faixa.

## 3.5 Métricas (p. 52+)

Processo de desenvolvimento de métricas (Fig. 8, alinhado a SP 800-55): stakeholder interest → goals → measures → etc. Reportar C-SCRM via ERM ao board. Benefícios: accountability, eficácia, compliance demonstrável, input para resource allocation, cost avoidance.

**Propósito do Cap. 3 no TCC:** mitigações concretas e discurso DevSecOps (procurement + SDLC + monitor de updates + threat-informed).

---

# Apêndice A — C-SCRM Security Controls (p. 63–~163)

## O que é

~**100 páginas** — o volume maior do PDF. É um **overlay** do catálogo SP **800-53 Rev. 5**: controlos com *Supplemental C-SCRM Guidance*, indicação de **Level(s) 1/2/3**, e notas de flow-down quando aplicável.

Organizado pelas famílias 800-53 (Access Control, Awareness & Training, Audit, Assessment, Configuration, Contingency, Identification & Authentication, Incident Response, Maintenance, Media, Physical, Planning, Personnel, PII Processing, Risk Assessment, System & Services Acquisition, System & Communications Protection, System & Information Integrity, …) e a família **Supply Chain Risk Management**.

## Como estudar (sem ler 100 págs)

1. Entender a **lógica**: C-SCRM vira controlos **auditáveis**.  
2. Folhear o índice de famílias.  
3. Abrir controlos relevantes ao teu argumento (ex.: acquisition, integrity de software/firmware, supply chain risk management family).  
4. No artigo: “conforme NIST SP 800-161 Apêndice A / overlay 800-53…” — cita 1–3 controlos, não a lista.

**Exemplo de guidance útil a software (família SI):** mecanismos de autenticação de código (ex. digital signatures) para integridade de software/firmware/informação — Level 3.

**Para o TCC:** apoio a mitigações “control-based”; não é capítulo narrativo para ler de cabo a rabo.

---

# Apêndice B — Control Summary (p. 164+)

Tabelas que mapeiam controlos C-SCRM ↔ 800-53, baselines, flow-down. **Mapa de consulta**, não prosa.

---

# Apêndice C — Risk exposure / scenarios (~p. 176+)

Dá um **Sample risk exposure framework** (threat scenario, threat event, outcome…) e vários **cenários** trabalhados (Tables 8–13 no TOC). Serve para aprender a **escrever** um cenário de risco na cadeia.

**Para o TCC:** podes espelhar a estrutura com Miasma (ameaça: hijack de pacote; evento: preinstall malicioso; outcome: roubo de tokens + worm).

---

# Apêndice D — Templates (p. 196+)

Modelos oficiais:

- **D.1** C-SCRM Strategy & Implementation Plan (Level 1)  
- **D.2** Policy  
- **D.3** Plan (sistema; categorização, roles, life cycle…)  
- **D.4** Assessment / information gathering  

**Para o TCC:** mencionar na metodologia se falares de “artefactos de governação”; não precisas preencher templates a menos que o trabalho peça um exercício aplicado.

---

# Apêndice E — Contexto institucional

Material de apoio sobre relações com estruturas/guias federais EUA (ex. FASC / acquisition security council no contexto da lei). Menos crítico para artigo académico fora do governo US; cita só se entrares em política federal.

---

# Apêndice F — Software / EO 14028 (p. 247)

**Atenção:** no PDF local **não há** o guia longo de software supply chain. Só um parágrafo a mandar para:

https://www.nist.gov/itl/executive-order-improving-nations-cybersecurity

Motivos: colocalizar com outro guidance EO; atualizar SBOM/critical software sem republicar a 800-161; ligação a assets web NIST.

**Para o TCC:** SBOM / critical software / práticas de software → portal EO + NTIA SBOM (referenciado na SP) + **NIST SSDF SP 800-218**. Não finjas que o Appendix F deste PDF contém o texto completo.

---

# Apêndice G — Activities in the Risk Management Process (p. 248–~291)

Aprofunda o ciclo do Cap. 2 com inputs/outputs e tabelas longas.

### Frame (~p. 251+)
Contexto C-SCRM nos 3 níveis: estrutura da cadeia, estratégias, sistemas. Dados do Frame alimentam Assess. Feedback bidirecional (outputs L3 atualizam assumptions L1/L2).

### Assess (~p. 272+)
Criticalidade, appetite/tolerance, threats, vulnerability analysis, stakeholder knowledge, policy, constraints → likelihood e impacto de compromisso. Atualiza assumptions de framing com variações near-term.

### Respond (~p. 281+)
Controlos C-SCRM selecionados/avaliados/tailored; consequências de aceitar ou não mitigações; desenvolvimento/implementação do **C-SCRM plan**; requisitos a suppliers/providers no SDLC e nos 3 níveis.

### Monitor (~p. 287+)
(1) verificar compliance, (2) eficácia contínua das respostas, (3) mudanças na cadeia/fornecedor/produto/ambiente.

Há tabelas de threat sources/agents, threat considerations, vulnerability considerations, consequence/impact, likelihood, constraints, risk appetite/tolerance, exemplos de vulnerabilidades por nível enterprise.

**Para o TCC:** melhor secção para “metodologia de análise de risco de supply chain” com cara académica NIST — depois ligas a CTI/Diamond/ATT&CK no caso Miasma.

---

# Apêndices H–K (p. 292+)

| Apêndice | Conteúdo | Uso |
| --- | --- | --- |
| **H** Glossary | acquirer, acquisition, acceptable risk, … | Definições citáveis |
| **I** Acronyms | C-SCRM, SCRM, … | Consulta |
| **J** Resources | Outras NIST, leis, SAFECode, NTIA SBOM, SSDF… | Bibliografia cruzada |
| **K** Revision history | Incl. updates 11/1/2024 | Datagem da versão |

---

# Mapa rápido: capítulo → secção do teu artigo

| NIST | Pesquisa A/B |
| --- | --- |
| Cap. 1 | §2.1 Software Supply Chain |
| Cap. 2 + Ap. G | § Metodologia / governação de risco |
| Cap. 3 | § Mitigações / DevSecOps |
| Cap. 1 exemplos + Fig. 4 | Ponte para §2.2 Attacks (depois Ladisa + Miasma) |
| Ap. A (pontual) | Controlo específico na mitigação |
| Ap. F + SSDF | SBOM / software secure development |
| — | Malware/CTI/Diamond: **não** saem da 800-161 |

---

# Ordem de estudo (reduzir 300 → o essencial)

```text
1. Este resumo (inteiro)
2. Cap. 1 no PDF (p. 1–12) se fores citar definições
3. Cap. 2 níveis (p. 27–33)
4. Cap. 3.1 + 3.4 (p. 38–49)
5. Folhear Ap. G tabelas se precisares de metodologia de risco
6. Ap. A só sob demanda
7. Ap. F → portal EO + baixar SSDF 800-218
```

Quando precisares de citação exacta: [NIST-800-161-excertos-TCC.md](./NIST-800-161-excertos-TCC.md) + PDF.

← [README](./README.md) · [EN](./NIST-800-161-resumo-en.md) · [Leitura](../../TCC-leitura-referencias.md)
