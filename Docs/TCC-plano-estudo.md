# Plano de estudo por etapa — artigo / TCC (dupla titulação)

Documento operacional: **o que estudar**, **o que produzir** e **quanto tempo** em cada etapa do artigo.

Leitura de base: [TCC-leitura-referencias.md](./TCC-leitura-referencias.md) · Plano: [TCC-pesquisa-A.md](./TCC-pesquisa-A.md)

---

## 0. Dupla titulação: padrão brasileiro ou português?

**Idioma do texto:** português (comum às duas instituições).  
**Norma de formatação/citação:** **não misturar ABNT e APA no mesmo trabalho** — escolher **uma** e confirmar por escrito com **os dois orientadores**.

| Aspecto | Brasil (típico) | Portugal (típico) | Recomendação prática |
| --- | --- | --- | --- |
| Citação / referências | **ABNT** (NBR 10520 + NBR 6023) | Muitas vezes **APA 7** ou manual da universidade | Perguntar já; se divergir, o **acordo de dupla titulação / template oficial** manda |
| Ortografia | Acordo Ortográfico (variante BR) | Variante PT (mesmo acordo, hábitos diferentes: *fato/facto*, *seção/secção*) | Combinar **uma** variante; revisão final nessa variante |
| Estrutura TCC/monografia | Capítulos ABNT / template da IES | Regulamento + template da IES | Usar o template exigido na **defesa principal**; anexar o que a outra IES pedir |
| Artigo científico | Norma da **revista** (APA, IEEE, Elsevier…) | Idem | Artigo ≠ monografia: a revista manda no estilo do paper |
| Resumos | Português (+ inglês se pedido) | PT + muitas vezes EN | Preparar **resumo PT + abstract EN**; se a IES parceira pedir, mais um resumo |

### Checklist (fazer na Semana 0)

- [ ] Qual instituição recebe a **defesa principal**?
- [ ] Template oficial (capa com **duas** instituições, se cotutela)?
- [ ] Estilo de citação obrigatório: ABNT / APA / outro?
- [ ] Variante ortográfica: BR ou PT?
- [ ] O “artigo” é capítulo do TCC, paper separado, ou ambos?
- [ ] Limite de páginas / palavras?

**Ferramenta:** Zotero (ou similar) desde o dia 1 — dá para exportar ABNT **ou** APA sem reescrever a bibliografia.

**Enquanto não responderem:** escreve o **conteúdo** em português claro; marca citações como `(Autor, Ano)` provisório; normaliza o estilo só depois da confirmação.

---

## Visão geral do calendário (16 semanas sugeridas)

Ajuste o ritmo; o importante é a **ordem**.

| Semanas | Fase | Foco |
| --- | --- | --- |
| 0 | Setup | Normas dupla titulação + Zotero + pastas |
| 1–3 | Fundamentação | Supply chain + ataques |
| 4–5 | Método CTI | Diamond, Almirantado, ATT&CK, atribuição |
| 6–8 | Caso Miasma | Corpus, timeline, estudo de caso |
| 9–10 | Malware (leve) | Análise técnica limitada |
| 11–12 | CTI + ator | Diamond, hipóteses, confiança |
| 13–14 | Detecção + mitigação | Regras + controles |
| 15–16 | Fechamento | Resultados, intro, conclusão, revisão |

---

## Semana 0 — Setup (antes de escrever)

| Estudar | Produzir |
| --- | --- |
| Acordo / e-mail aos orientadores (normas) | Pasta `refs/` + Zotero collection “TCC-SupplyChain” |
| Template da IES (se existir) | Este checklist preenchido |
| [TCC-leitura-referencias.md](./TCC-leitura-referencias.md) (só o mapa) | Decisão: artigo único vs monografia+artigo |

**Entregável:** 1 página “Regras do jogo” (citação, idioma, entregáveis).

---

## Etapa 1 — Software Supply Chain (Semanas 1–2)

**Capítulo do artigo:** Fundamentação §2.1  

| Estudar (leitura) | Produzir (escrita / artefato) |
| --- | --- |
| NIST SP 800-161 (intro + software) | Diagrama da cadeia: Dev → Git → deps → CI/CD → artifact → registry → consumer |
| NIST SSDF 800-218 (visão geral) | Lista de “pontos de confiança” (1 parágrafo cada) |
| SLSA + noção de SBOM | Quadro: o que cada elo protege |

**Meta:** 4–8 páginas rascunho (ou 1500–3000 palavras).  
**Critério de pronto:** alguém leigo em segurança entende a cadeia e onde pode quebrar.

---

## Etapa 2 — Supply Chain Attacks (Semana 3)

**Capítulo:** §2.2  

| Estudar | Produzir |
| --- | --- |
| **Ladisa et al. SoK 2023** (taxonomia) — prioridade máxima | Tabela: vetor Ladisa × exemplo real × mitigação |
| Journey… / Hammi & Zeadally (opcional) | Parágrafo: ataque convencional vs supply chain (1→N vítimas) |

**Meta:** taxonomia citada corretamente + 1 figura de ataque em árvore (simplificada).  
**Critério de pronto:** você sabe classificar o Miasma **antes** de falar dele em detalhe.

---

## Etapa 3 — CTI, ATT&CK, Diamond, Almirantado (Semanas 4–5)

**Capítulos:** §2.3–2.8 + Metodologia (§3)  

| Estudar | Produzir |
| --- | --- |
| Roberts — CTI (ciclo de intel) | Seção metodologia: fontes, critérios, lab |
| Diamond Model paper (2013) | Figura do diamante vazia (campos a preencher depois) |
| SANS Admiralty / STANAG (conceito) | Escala A–F / 1–6 em ½ página explicada |
| ATT&CK (site + guia de uso) | Como você vai mapear comportamento → técnica |
| Steffens — Attribution (capítulos de método) | Definição: associação técnica ≠ atribuição |

**Meta:** metodologia fechada **antes** do estudo de caso.  
**Critério de pronto:** dá para avaliar uma fonte JFrog com Almirantado em 5 minutos.

---

## Etapa 4 — Corpus + Timeline Miasma (Semanas 6–8)

**Capítulo:** Estudo de caso (§4)  

| Estudar | Produzir |
| --- | --- |
| Relatórios: JFrog, + 2–4 vendors (Socket/Wiz/MS/RH/GitHub) | Planilha/tabela `evidence_id` (campos do plano §11) |
| Seus `Docs/Miasma/*` | Timeline DAT A → evento → fonte → confiança |
| Pacotes/versões afetadas (IOCs públicos) | Lista vítimas/ecossistemas (npm, Actions, etc.) |

**Ritmo sugerido:**  
- Semana 6: 5 fontes fichadas  
- Semana 7: timeline v1  
- Semana 8: narrativa do caso (rascunho §4)

**Critério de pronto:** nenhuma afirmação forte do caso sem `source` + `confidence`.

---

## Etapa 5 — Malware Analysis (leve) (Semanas 9–10)

**Capítulo:** Análise técnica (§5)  

| Estudar | Produzir |
| --- | --- |
| Sikorski caps. estáticos básicos **ou** Mohanta (só o necessário) | Escopo escrito: o que **não** vai reverter |
| Código em `miasma-azure-durabletask-main/` + docs 01–06 | Comportamentos: install → steal → exfil → worm |
| Lab: **estático primeiro**; dinâmico só se isolado e autorizado | Tabela IOC + evidência no código (path/módulo) |

**Meta:** 5–10 comportamentos bem documentados (não 100 páginas de reverse).  
**Critério de pronto:** cada comportamento tem artefato + interpretação.

---

## Etapa 6 — ATT&CK + CTI correlacionada (Semana 11)

**Capítulos:** §5 (TTP) + §6  

| Estudar | Produzir |
| --- | --- |
| ATT&CK das técnicas já vistas no pack `04-mitre-attack.md` | Matriz final ATT&CK (só com evidência) |
| Releitura Diamond | Diamante preenchido: Adversary / Capability / Infra / Victim |

**Critério de pronto:** diamante citável no artigo (uma figura + 1 página de texto).

---

## Etapa 7 — Threat Actor / Attribution / Confidence (Semana 12)

**Capítulos:** §7–§8  

| Estudar | Produzir |
| --- | --- |
| Steffens (hipóteses, false flags) | Hipótese TeamPCP / clusters: a favor / contra / lacunas |
| Almirantado nas claims de atribuição de terceiros | Nível: Low / Moderate / High + justificativa |

**Regra:** o `?` permanece se a evidência for fraca — isso é **resultado válido**.

---

## Etapa 8 — Detection Engineering + validação (Semanas 13–14)

**Capítulos:** §9 (+ parte de resultados)  

| Estudar | Produzir |
| --- | --- |
| YARA / Sigma (docs + 1 tutorial) | 1 regra IOC, 1 YARA (conceito/protótipo), 1 Sigma (conceito) |
| `07-detection-hunting.md`, `09-preventive-controls.md` | Tabela: TTP → telemetria → detecção |
| Se possível: teste em lab / dados públicos | Nota de FP/FN e tuning |

**Critério de pronto:** mostra o caminho Intelligence → Detection (não só lista de hashes).

---

## Etapa 9 — Mitigações supply chain (Semana 14, em paralelo)

**Capítulo:** mitigações (dentro de §10 ou seção própria)  

| Estudar | Produzir |
| --- | --- |
| SLSA, SSDF, pin de deps, tokens, CI hardening | Controles **ligados** aos vetores do Miasma (não lista genérica) |

---

## Etapa 10 — Fechamento do artigo (Semanas 15–16)

| Ordem de escrita | Conteúdo |
| --- | --- |
| 1º | Resultados e discussão (§10) |
| 2º | Limitações (§11) |
| 3º | Conclusão (§12) |
| 4º | Introdução (§1) — por último |
| 5º | Resumo / Abstract |
| 6º | Revisão norma (ABNT ou APA) + ortografia BR/PT |
| 7º | Checklist anti-plágio e citações |

**Trabalhos futuros:** honeypot/intel pós-TCC (`Miasma/12-post-tcc-honeypot-intel.md`) — **uma** menção curta.

---

## Rotina semanal sugerida (carga média)

| Dia | Atividade |
| --- | --- |
| Seg–Ter | Leitura (2–3 h) + fichamento Zotero |
| Qua–Qui | Escrita / tabelas / figuras (2–3 h) |
| Sex | Revisar o “critério de pronto” da etapa |
| Fim de semana (opcional) | 1 bloco longo (4 h) se atrasar |

**Regra:** não avançar de etapa sem o **entregável** da anterior (mesmo rascunho feio).

---

## Mapa rápido: etapa do plano → seção do artigo

| Etapas do plano (pesquisa) | Seção do artigo |
| --- | --- |
| 1–2 Supply chain + actors | §2.1–2.2 |
| 3–4 Corpus + timeline | §4 |
| 5 Malware | §5 |
| 6–7 CTI + ATT&CK | §5–6 |
| 8 Diamond | §6 |
| 9–11 Almirantado + atribuição + confidence | §7–8 |
| 12–13 Detection + validação | §9 |
| 14 Mitigações | §10 |
| — | §1 Intro e §12 Conclusão no fim |

---

## Próximo passo imediato (você)

1. Mandar o checklist da Semana 0 aos orientadores (principalmente: **ABNT vs APA** e **ortografia BR vs PT**).  
2. Começar Etapa 1 com NIST + diagrama da cadeia.  
3. Na Semana 3, atacar o **Ladisa SoK** sem pular.

Quando tiver a resposta dos orientadores sobre a norma, atualizamos este arquivo com a decisão oficial.
