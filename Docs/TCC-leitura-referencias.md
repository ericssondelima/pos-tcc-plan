# Lista de leitura / referências — TCC (único ficheiro)

**Um só ficheiro** para Pesquisa A e Pesquisa B.  
Não criar outra lista de leitura.

**Objetivo:** material para fundamentação, citação e escrita.  
**Ordem:** ler na sequência das fases (não tentar ler tudo de uma vez).  
**PDFs baixados:** [refs/](./refs/) (por tema/fase).

| Pesquisa | Plano norte | Como usar **este** ficheiro |
| --- | --- | --- |
| **A** (malware leve) | [TCC-pesquisa-A.md](./TCC-pesquisa-A.md) | Fases A → B → C → análise leve → D |
| **B** (malware mais completo) | [TCC-pesquisa-B.md](./TCC-pesquisa-B.md) | Fases A → B → C → **M** → D |

```text
objeto  = supply chain attacks
caso    = Miasma
malware = apoio (A)  |  pilar técnico reforçado (B)
```

---

## Fase A — Software Supply Chain

PDFs: [refs/01-supply-chain/](./refs/01-supply-chain/) · ataques: [refs/02-supply-chain-attacks/](./refs/02-supply-chain-attacks/)

### A1. O que é software supply chain

| Tipo | Referência | Por quê |
| --- | --- | --- |
| Padrão | [NIST SP 800-161 Rev. 1](https://csrc.nist.gov/pubs/sp/800/161/r1/upd1/final) — *Cybersecurity Supply Chain Risk Management* | C-SCRM; base institucional *(já em refs/01)* · [resumo pt-BR](./refs/01-supply-chain/NIST-800-161-resumo-pt-BR.md) · [summary en](./refs/01-supply-chain/NIST-800-161-resumo-en.md) · [excertos TCC](./refs/01-supply-chain/NIST-800-161-excertos-TCC.md) |
| Padrão | [NIST SP 800-218](https://doi.org/10.6028/nist.sp.800-218) — *SSDF v1.1* | Desenvolvimento seguro + deps |
| Framework | [SLSA](https://slsa.dev/) — Supply-chain Levels for Software Artifacts | Provenance / build integrity |
| Conceito | CISA/NTIA **SBOM** | Transparência de componentes |

**Extrair:** diagrama Dev → Git → deps → CI/CD → artifact → registry → consumer; pontos de confiança.

### A2. Ataques à supply chain (obrigatório)

| Tipo | Referência | Link |
| --- | --- | --- |
| **Artigo-chave (SoK)** | Ladisa et al. — *SoK: Taxonomy of Attacks on Open-Source Software Supply Chains* (IEEE S&P 2023) | [PDF local](./refs/02-supply-chain-attacks/Ladisa-2023-SoK-OSS-Supply-Chain.pdf) · [DOI](https://doi.org/10.1109/sp46215.2023.10179304) · [arXiv](https://arxiv.org/abs/2204.04008) |
| Survey | *Journey to the Center of Software Supply Chain Attacks* | [arXiv](https://arxiv.org/html/2304.05200v1) |
| SoK defesa | *SoK: A Defense-Oriented Evaluation of Software Supply Chain Security* | [arXiv](https://arxiv.org/html/2405.14993v2) |
| Artigo curto | Hammi & Zeadally — *Software Supply-Chain Security: Issues and Countermeasures* (IEEE Computer, 2023) | DOI: 10.1109/mc.2023.3273491 |

**Extrair:** taxonomia; onde o Miasma se encaixa (hijack + lifecycle + worm de publish).

### A3. DevOps, DevSecOps e AppSec

Fases do software até o usuário e segurança no pipeline. Complementa A1 (não substitui NIST 800-161, SSDF nem Ladisa).

Um livro por conceito, mais os padrões e artigos que ligam o pipeline ao caso. O resto da prateleira fica abaixo, como contexto.

#### Para citar

| Tema | Referência | Por quê |
| --- | --- | --- |
| DevOps | Len Bass, Ingo Weber e Liming Zhu (2015) — *DevOps: A Software Architect's Perspective*. Addison-Wesley | Fases até o usuário: build, teste, deploy, operação. Fonte do SEI |
| DevOps | Gene Kim, Jez Humble, Patrick Debois, John Willis e Nicole Forsgren (2021) — *The DevOps Handbook*. 2. ed. IT Revolution | Definição de prática do fluxo de entrega. Um dos dois livros de DevOps basta no texto |
| DevSecOps | Julien Vehent (2018) — *Securing DevOps*. Manning | Segurança no CI/CD: segredos, build e artefato |
| DevSecOps | Laura Bell, Michael Brunton-Spall, Rich Smith e Jim Bird (2017) — *Agile Application Security*. O’Reilly | AppSec dentro do ciclo ágil e do pipeline |
| DevSecOps | Myrbakken e Colomo-Palacios (2017) — *DevSecOps: A Multivocal Literature Review* | Definição de DevSecOps · [DOI](https://doi.org/10.1007/978-3-319-67383-7_2) |
| DevSecOps | Rajapakse, Zahedi, Babar e Shen (2022) — *Challenges and solutions when adopting DevSecOps: A systematic review*, *Information and Software Technology*, 141, 106700 | *Shift-left* e avaliação contínua · [DOI](https://doi.org/10.1016/j.infsof.2021.106700) · [arXiv](https://arxiv.org/abs/2103.08266) |
| AppSec | Tanya Janca (2020) — *Alice and Bob Learn Application Security*. Wiley | O que é segurança de aplicação no ciclo de vida: requisitos, desenho, teste, programa |
| Cadeia | Cassie Crossley (2024) — *Software Supply Chain Security*. O’Reilly | Código, build, SBOM e terceiros, de ponta a ponta |
| Cadeia | Chandramouli, Kautz e Torres-Arias — [NIST SP 800-204D](https://doi.org/10.6028/NIST.SP.800-204D) (2024) | CI/CD como cadeia de suprimentos · [PDF](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-204D.pdf) |
| Caso | Krivelevich e Gil (2022) — [OWASP Top 10 CI/CD Security Risks](https://owasp.org/www-project-top-10-ci-cd-security-risks/) | CICD-SEC-3, SEC-4 e SEC-6: dependências, pipeline e credenciais no Miasma |

**No texto, citar um livro por tema:** Bass *ou* o *Handbook* (DevOps); Vehent (DevSecOps); Janca (AppSec). Bell e os dois artigos entram se a seção precisar de mais do que a definição.

**Extrair:** uma frase de definição para cada tema; diagrama das fases; 3 riscos OWASP CI/CD ligados ao caso.

#### Best-sellers e prateleira (contexto; não prioritários para o caso)

| Tipo | Referência | Por quê está na lista |
| --- | --- | --- |
| Livro | Gene Kim, Kevin Behr e George Spafford (2013; ed. ampliada 2018) — *The Phoenix Project*. IT Revolution | Best-seller de DevOps (>500 mil). Ficção; cultura de entrega, não a cadeia |
| Livro | Gene Kim (2019) — *The Unicorn Project*. IT Revolution | Best-seller do *Wall Street Journal*. Sequência do Phoenix |
| Livro | Nicole Forsgren, Jez Humble e Gene Kim (2018) — *Accelerate*. IT Revolution | Pesquisa de desempenho de entrega (prêmio Shingo). Não fundamenta o ataque |
| Livro | Jez Humble e David Farley (2010) — *Continuous Delivery*. Addison-Wesley | Origem do *deployment pipeline* (prêmio Jolt) |
| Livro | Heather Adkins, Betsy Beyer, Paul Blankinship, Piotr Lewandowski, Ana Oprea e Adam Stubblefield (2020) — *Building Secure and Reliable Systems*. O’Reilly | Deploy e dependências de terceiros · [HTML](https://google.github.io/building-secure-and-reliable-systems/) |
| Livro | Glenn Wilson (2020) — *DevSecOps*. Rethink Press | Segurança no fluxo sem travar a entrega; mais gestão |
| Livro | Jim Bird (2016) — *DevOpsSec*. O’Reilly | Panorama curto, dos primeiros com o nome |
| Livro | Sean D. Mack (2024) — *The DevSecOps Playbook*. Wiley | Playbook recente de liderança; alcance ainda menor |
| Livro | Steve Suehring (2024) — *Learning DevSecOps*. O’Reilly | Introdução recente a cultura e toolchain |
| Livro | Dafydd Stuttard e Marcus Pinto (2011) — *The Web Application Hacker's Handbook*. 2. ed. Wiley | Best-seller de AppSec (pentest web). Objeto diferente do Miasma |
| Livro | Tanya Janca (2025) — *Alice and Bob Learn Secure Coding*. Wiley | Código seguro (Python, Java, JavaScript). A definição de AppSec fica no livro de 2020, na tabela de cima |
| Livro | Adam Shostack (2014) — *Threat Modeling: Designing for Security*. Wiley | Modelagem de ameaças. 2ª ed. anunciada para 2027 |
| Livro | Dan Bergh Johnsson, Daniel Deogun e Daniel Sawano (2019) — *Secure by Design*. Manning | Desenho de código seguro, não cadeia de pacotes |

**Fora da definição dos três temas:** *Phoenix*, *Unicorn* e *Accelerate* descrevem cultura e velocidade de entrega. *WAHH*, *Secure Coding* e *Secure by Design* descrevem falha ou código da aplicação. O Miasma entra por pacote, token e CI, não por esses livros.

---

## Fase B — CTI, modelos e atribuição

PDFs: [refs/03-cti-modelos/](./refs/03-cti-modelos/)

### B1. Livros

| Prioridade A | Prioridade B | Livro | Uso |
| --- | --- | --- | --- |
| Alta | Alta | **Timo Steffens** — *Attribution of Advanced Persistent Threats* (Springer, 2020) | Atribuição, false flags, confiança |
| Alta | Alta | **Aaron Roberts** — *Cyber Threat Intelligence…* (Apress, 2021) | Ciclo de intel, Diamond, STIX, ATT&CK |
| Média | **Alta** | **Mohanta & Saldanha** — *Malware Analysis and Detection Engineering* (Apress) | Método malware + ponte detecção |
| Baixa (só caps.) | **Alta** (só caps.) | **Sikorski & Honig** — *Practical Malware Analysis* (No Starch) | Lab / static / dynamic basics — **não** precisa do livro inteiro |

### B2. Modelos (originais)

| Modelo | Referência | Link |
| --- | --- | --- |
| Diamond Model | Caltagirone, Pendergast, Betz (2013) | [PDF](https://www.activeresponse.org/wp-content/uploads/2013/07/diamond.pdf) · DTIC ADA586960 |
| MITRE ATT&CK | Framework oficial | https://attack.mitre.org/ |
| Código do Almirantado | SANS — Admiralty System | [SANS](https://www.sans.org/blog/enhance-your-cyber-threat-intelligence-with-the-admiralty-system) |

**Extrair:** Almirantado; diamante; “TTP ≠ atribuição”. Na B: cruzar claim de vendor com evidência no código.

---

## Fase C — Caso Miasma / Shai-Hulud (corpus)

PDFs: [refs/04-caso-miasma/](./refs/04-caso-miasma/)

| Fonte | Tema |
| --- | --- |
| [JFrog — Miasma / Red Hat npm](https://research.jfrog.com/post/shai-hulud-miasma-redhat-cloud-services/) | Pack [Miasma/10-references.md](./Miasma/10-references.md) |
| Socket, Wiz, Microsoft, Red Hat, GitHub (“Shai-Hulud” / “Miasma”) | Timeline e vítimas |
| Dump + [Miasma/](./Miasma/) | Evidência técnica própria |

Ficha: `evidence_id, date, source, artifact, behavior, ATT&CK, confidence` (+ `code_ref` na Pesquisa B).

---

## Fase M — Malware Analysis

PDFs/livros: [refs/05-malware-analysis/](./refs/05-malware-analysis/)  
Artefato: `miasma-azure-durabletask-main/` · docs: [Miasma/](./Miasma/)

| | Pesquisa A | Pesquisa B |
| --- | --- | --- |
| Peso | **Leve** — validar CTI (poucos comportamentos) | **Completa** — §5 expandido do plano B |
| Livros | Caps. básicos bastam | Sikorski/Mohanta sobem de prioridade (tabela B1) |
| Produto | IOCs + TTPs essenciais | Diagrama execução + módulo→TTP + IOC com `code_ref` |

### M1. Método (antes de abrir o sample)

| Material | Uso |
| --- | --- |
| Sikorski — lab VM, static/dynamic basics, behavior | Protocolo |
| Mohanta & Saldanha — análise + detection | Método + detecção |
| YARA / YARA-X (overview) | Preparar Fase D |

### M2. Material do caso no repo

| Doc / pasta | Extrair |
| --- | --- |
| [Miasma/01-overview.md](./Miasma/01-overview.md) | Identidade do sample |
| [Miasma/02-architecture-and-flow.md](./Miasma/02-architecture-and-flow.md) | Mapa 00–12 |
| [Miasma/03-ttps-killchain.md](./Miasma/03-ttps-killchain.md) | Kill chain |
| [Miasma/04-mitre-attack.md](./Miasma/04-mitre-attack.md) | Esboço ATT&CK |
| [Miasma/05-iocs.md](./Miasma/05-iocs.md) | IOCs / markers |
| [Miasma/06-modules-detail.md](./Miasma/06-modules-detail.md) | TTPs por módulo |
| Módulos `00`–`12` | Evidência por comportamento |
| `original-payload.infected.zip` | Metadados (**não executar**) |

### M3. Ordem no artefato (Pesquisa B; na A parar mais cedo)

```text
1. Overview + handling
2. Arquitetura / entrypoint (12) + runtime (00)
3. Ofuscação / cipher (02)
4. Secrets (10)
5. Exfil / C2 (11)
6. Worm npm/Actions (04, 05, 06, 08)
7. Persistência / evasão (07, 09) — se couber
8. Fechar IOCs + ATT&CK com âncora no código
```

---

## Fase D — Detection Engineering e mitigação

PDFs: [refs/06-detection-mitigacao/](./refs/06-detection-mitigacao/)

| Recurso | Uso |
| --- | --- |
| YARA / YARA-X docs | Assinaturas |
| Sigma HQ / spec | Comportamento portável |
| ATT&CK → telemetria → regra | Ligação explícita |
| [Miasma/07-detection-hunting.md](./Miasma/07-detection-hunting.md) | Hunt |
| [Miasma/09-preventive-controls.md](./Miasma/09-preventive-controls.md) | Mitigações ligadas ao caso |

Na **B**, regras devem sair da Fase M (não só de relatórios).

---

## Como conduzir a escrita

### Pesquisa A

```text
1. Fase A  →  § Supply Chain + Ataques
2. Fase B  →  § CTI / Diamond / Almirantado / ATT&CK
3. Fase C  →  § Estudo de caso
4. Fase M (leve)  →  § Análise técnica curta
5. Correlacionar  →  Diamond + hipóteses de ator
6. Fase D  →  Detecção + mitigações
7. Intro / Conclusão por último
```

### Pesquisa B

```text
1. Fase A  →  § Supply Chain + Ataques
2. Fase B  →  § CTI / modelos / método malware
3. Fase C  →  § Estudo de caso
4. Fase M (completa)  →  §5 expandido (5.1–5.10 do plano B)
5. Correlacionar  →  Diamond + hipóteses de ator
6. Fase D  →  Detecção derivada da M + mitigações
7. Intro / Conclusão por último
```

### Regra de ouro

```text
Afirmação → evidência (citação ou code_ref) → interpretação → limite/confiança
```

### Produtos intermediários

| # | Produto | A | B |
| --- | --- | --- | --- |
| 1 | Mapa Ladisa × Miasma | sim | sim |
| 2 | Timeline | sim | sim |
| 3 | Diagrama de execução | opcional | **sim** |
| 4 | Tabela módulo → TTP | leve | **sim** |
| 5 | Matriz ATT&CK | sim | com âncora no código |
| 6 | 1 Diamond preenchido | sim | Capability mais rica |
| 7 | IOC + YARA + Sigma | conceito | derivados da Fase M |

### Não fazer no início

- Sample antes da Fase A (+ método M1 na B)  
- Reverse sem teto de páginas  
- Atribuição antes do corpus + Almirantado  
- Intro longa sem fundamentação  
- Honeypot pós-TCC como entrega obrigatória  

---

## Pacote mínimo

### Pesquisa A (7)

1. NIST 800-161  
2. NIST SSDF 800-218  
3. **Ladisa SoK 2023**  
4. Diamond Model (2013)  
5. Steffens — Attribution (método)  
6. ATT&CK (técnicas mapeadas)  
7. 2–3 relatórios Miasma/Shai-Hulud + [Miasma/](./Miasma/)

### Pesquisa B (10) — os 7 acima +

8. Roberts — CTI (visão geral)  
9. Sikorski **ou** Mohanta (caps. de método)  
10. Dump desofuscado + trabalho próprio na Fase M  

---

## Bibliografia / norma de citação

Lista de **leitura** (este ficheiro) ≠ lista final de **Referências** do artigo.

- Norma do artigo/TCC: **ABNT ou APA** — uma só (dupla titulação: confirmar com orientadores).  
- Guardar PDFs em [refs/](./refs/) + Zotero.  
- No texto: citar só o que foi usado; este MD é o mapa de estudo.

---

## Ligação com o plano

| Doc | Papel |
| --- | --- |
| [TCC-pesquisa-A.md](./TCC-pesquisa-A.md) | Pesquisa A |
| [TCC-pesquisa-B.md](./TCC-pesquisa-B.md) | Pesquisa B |
| [TCC-plano-estudo.md](./TCC-plano-estudo.md) | Calendário |
| [refs/README.md](./refs/README.md) | Pastas de PDFs |
| [Miasma/README.md](./Miasma/README.md) | Docs técnicos do caso |
