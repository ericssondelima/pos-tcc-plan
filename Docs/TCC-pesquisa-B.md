# TCC — Pesquisa B — Ataques à Cadeia de Suprimentos de Software
#  Repo Miasma: https{:}//github.com/edxeth/Shai-Hulud-Open-Source

## Estudo de caso: Campanha Miasma sob CTI com análise de malware mais completa

**Pesquisa:** B (alternativa à Pesquisa A).  
**Plano espelho de:** [TCC-pesquisa-A.md](./TCC-pesquisa-A.md) — mesma lógica e norte; diferença no **peso e profundidade da Malware Analysis**.

| | Pesquisa A | Pesquisa B (este documento) |
| --- | --- | --- |
| Objeto | Software Supply Chain Attacks | Igual |
| Caso | Miasma | Igual |
| Malware Analysis | Leve — valida e complementa CTI | **Pilar técnico reforçado** — análise mais completa do artefato |
| Norte da pesquisa | Supply chain → CTI → detecção | Igual, com evidência de código mais densa |

Ativação: só com acordo explícito dos orientadores. Até lá, a Pesquisa A permanece o plano vigente.

---

## 1. Visão geral

Este documento define o plano de desenvolvimento do Trabalho de Conclusão de Curso e do artigo científico na **Pesquisa B**.

O tema central da pesquisa será **ataques à cadeia de suprimentos de software (Software Supply Chain Attacks)**.

A campanha **Miasma** será utilizada como estudo de caso contemporâneo para investigar como um comprometimento da cadeia de suprimentos pode ser realizado, quais técnicas são utilizadas pelo adversário, **como o malware opera em detalhe técnico**, quais evidências permitem caracterizar o ator ou cluster de atividade e como os conhecimentos obtidos podem ser transformados em mecanismos de detecção.

O objetivo **não** será produzir apenas uma monografia de reverse engineering do Miasma.

O Miasma será utilizado como uma fonte real de evidências para estudar:

* Software Supply Chain Attacks;
* Cyber Threat Intelligence (CTI);
* Threat Actors e Activity Clusters;
* **Malware Analysis (aprofundada)**;
* MITRE ATT&CK;
* Diamond Model of Intrusion Analysis;
* Código do Almirantado;
* Attribution;
* Detection Engineering.

A Pesquisa B **aumenta** a contribuição própria via análise do código desofuscado (`miasma-azure-durabletask-main/` + docs em `Miasma/`), para que CTI e detecção não dependam só de relatórios de terceiros.

---

## 2. Tema central

**Ataques à cadeia de suprimentos de software analisados sob a perspectiva de Cyber Threat Intelligence e de análise técnica de malware, utilizando a campanha Miasma como estudo de caso.**

O principal objeto da pesquisa será o **ataque à cadeia de suprimentos**.

A campanha Miasma funcionará como estudo de caso para compreender o fenômeno na prática.

A análise de malware funcionará como **pilar de evidência técnica de primeira mão**.

---

## 3. Título provisório

### Opção principal

**Ataques à Cadeia de Suprimentos de Software: análise de Cyber Threat Intelligence e de malware da campanha Miasma**

### Variação

**Comprometimento da cadeia de suprimentos via malware: CTI e análise técnica da campanha Miasma (Shai-Hulud)**

Outras variações poderão ser avaliadas posteriormente conforme os resultados da pesquisa.

---

## 4. Princípio da pesquisa

A pesquisa deverá seguir a mesma cadeia lógica da Pesquisa A, com **Malware Analysis** tratada como etapa substantiva (não residual):

```text
Software Supply Chain
        ↓
Superfície de ataque
        ↓
Supply Chain Attack
        ↓
Campanha Miasma
        ↓
Coleta de evidências
        ↓
Cyber Threat Intelligence
        ↓
Malware Analysis (aprofundada)
        ↓
TTPs
        ↓
MITRE ATT&CK
        ↓
Análise do Threat Actor
        ↓
Avaliação das fontes
        ↓
Attribution / Confidence Assessment
        ↓
Detection Engineering
        ↓
Detecção e mitigação
        ↓
Resultados
```

Essa sequência não representa necessariamente a ordem dos capítulos do artigo.

Ela representa a **lógica da investigação**.

---

## 5. Questão central

A pesquisa deverá responder principalmente:

> Como ataques modernos à cadeia de suprimentos de software podem ser caracterizados por meio de Cyber Threat Intelligence e análise técnica aprofundada de malware, utilizando a campanha Miasma para identificar comportamentos, IOCs, TTPs, capabilities, infraestrutura, possíveis atores de ameaça e oportunidades de detecção?

Uma questão secundária importante será:

> Até que ponto as evidências públicas e técnicas disponíveis permitem relacionar a campanha Miasma ao TeamPCP ou a um cluster de atividade associado?

A pesquisa não deverá assumir previamente que determinado ator realizou a campanha.

A atribuição será tratada como uma **hipótese analítica**.

---

## 6. Hipótese inicial

Ataques modernos à cadeia de suprimentos permitem que adversários explorem relações de confiança existentes entre desenvolvedores, fornecedores, repositórios, pipelines, artefatos e consumidores de software.

A campanha Miasma demonstra como esse modelo pode ser utilizado para comprometer ecossistemas de desenvolvimento e obter acesso indireto a múltiplos ambientes.

A análise mais completa do artefato permite **validar, refinar e, quando for o caso, corrigir** afirmações presentes em fontes abertas, fortalecendo a CTI e a detecção.

Existe ainda a hipótese de que características técnicas, infraestrutura, código e TTPs possam permitir associação da campanha a determinado cluster de atividade.

Entretanto:

```text
Código semelhante
      ≠
Mesmo atacante

Malware semelhante
      ≠
Mesmo atacante

TTP semelhante
      ≠
Atribuição definitiva

Análise completa
      ≠
Atribuição definitiva
```

A atribuição deverá resultar da correlação de múltiplas evidências.

---

## 7. Objetivo geral

Analisar ataques à cadeia de suprimentos de software utilizando a campanha Miasma como estudo de caso, aplicando conceitos e metodologias de Cyber Threat Intelligence, **Malware Analysis aprofundada**, MITRE ATT&CK, Diamond Model e avaliação estruturada de fontes para compreender a operação, o comportamento do malware, seus possíveis atores e mecanismos de detecção.

---

## 8. Objetivos específicos

1. Explicar o funcionamento de uma cadeia moderna de desenvolvimento e distribuição de software.

2. Identificar os principais pontos de comprometimento existentes em uma software supply chain.

3. Caracterizar diferentes formas de Software Supply Chain Attack.

4. Reconstruir cronologicamente a campanha Miasma.

5. Identificar organizações, pacotes, repositórios e ecossistemas afetados.

6. Consolidar informações provenientes de diferentes fontes de Cyber Threat Intelligence.

7. Analisar artefatos e código relacionados ao Miasma **com profundidade técnica definida** (módulos, fluxos, ofuscação).

8. Documentar a **cadeia de execução** (lifecycle install → ofuscação → Bun → orquestração).

9. Identificar comportamentos relevantes do malware (credenciais, exfil/C2, worm, persistência, evasão).

10. Extrair IOCs com **evidência no código** (path/módulo/hash).

11. Mapear comportamentos observados para MITRE ATT&CK.

12. Identificar infraestrutura, capabilities, vítimas e possíveis adversários.

13. Aplicar o Diamond Model para reconstrução da operação.

14. Avaliar a confiabilidade das fontes e a credibilidade das informações utilizando o Código do Almirantado.

15. Investigar a possível associação da campanha com TeamPCP ou outros clusters de atividade.

16. Definir um nível de confiança para as conclusões de atribuição.

17. Transformar os conhecimentos obtidos — **incluindo achados próprios da análise** — em mecanismos de Detection Engineering.

18. Desenvolver e avaliar detecções baseadas em indicadores, assinaturas e comportamento.

19. Apresentar recomendações de mitigação para ataques à cadeia de suprimentos **ligadas aos vetores observados no malware**.

---

## 9. ETAPA 1 — Fundamentação sobre Software Supply Chain

Antes de analisar Miasma será necessário explicar o objeto principal da pesquisa.

Uma cadeia simplificada será considerada:

```text
Developer
    ↓
Source Code
    ↓
Git Repository
    ↓
Dependencies
    ↓
CI/CD
    ↓
Build System
    ↓
Artifact
    ↓
Package Registry
    ↓
Deployment
    ↓
Consumer
```

Cada elemento representa uma possível superfície de ataque.

Deverão ser estudados:

* comprometimento de contas de desenvolvedores;
* roubo de credenciais;
* comprometimento de repositórios;
* dependências maliciosas;
* dependency confusion;
* typosquatting;
* comprometimento de CI/CD;
* comprometimento do build;
* manipulação de artefatos;
* comprometimento de registries;
* abuso de tokens de publicação;
* comprometimento de mecanismos de atualização;
* assinatura e provenance;
* relações de confiança.

Também deverão ser estudados:

* NIST Cybersecurity Supply Chain Risk Management;
* Secure Software Development Framework;
* SLSA;
* SBOM;
* assinatura de artefatos;
* provenance;
* segurança de CI/CD.

Materiais: [refs/01-supply-chain/](./refs/01-supply-chain/).

---

## 10. ETAPA 2 — Threat Actors e Supply Chain

A pesquisa deverá explicar por que ataques de supply chain são estrategicamente interessantes para adversários.

Em um ataque convencional:

```text
Attacker
   ↓
Victim
```

Em um ataque de supply chain:

```text
                  Supplier
                     ↓
                 Compromise
                     ↓
          ┌──────────┼──────────┐
          ↓          ↓          ↓
       Victim A   Victim B   Victim C
          ↓          ↓          ↓
       Systems    Systems    Systems
```

O comprometimento de uma única relação de confiança pode produzir múltiplas vítimas.

Deverão ser investigados:

* objetivos do adversário;
* motivação;
* espionagem;
* obtenção de acesso;
* credential theft;
* propagação;
* persistência;
* exfiltração;
* impacto;
* reutilização da confiança existente.

---

## 11. ETAPA 3 — Construção do corpus Miasma

Será criado um conjunto estruturado de fontes sobre a campanha.

Exemplos:

```text
Red Hat
Microsoft
JFrog
Wiz
Socket
Pluto
GitHub
npm
PyPI
pesquisadores independentes
papers
relatórios técnicos
análise própria do artefato (Pesquisa B)
```

Para cada informação importante deverá ser registrado:

```text
evidence_id
date
event
source
artifact
package
repository
hash
domain
ip
victim
behavior
ATT&CK
confidence
notes
code_ref          ← Pesquisa B: path/módulo quando a evidência for do sample
```

Nenhuma conclusão importante deverá depender de apenas uma fonte quando houver possibilidade de corroboração.

Na Pesquisa B, relatórios de vendors e **achados do código** devem ser cruzados de forma explícita.

Materiais de caso: [refs/04-caso-miasma/](./refs/04-caso-miasma/) · [Miasma/](./Miasma/).

---

## 12. ETAPA 4 — Timeline da campanha Miasma

Será construída uma timeline detalhada.

Formato esperado:

```text
DATA
 │
 ├── Evento
 ├── Organização
 ├── Pacote/repositório
 ├── Artefato
 ├── Variante
 ├── IOC
 ├── Fonte
 └── Evidência
```

A timeline deverá permitir identificar:

* início conhecido da campanha;
* possíveis atividades preparatórias;
* comprometimentos;
* publicação de pacotes;
* propagação;
* evolução do malware;
* aparecimento de variantes;
* divulgação de código;
* mudanças de infraestrutura;
* resposta das organizações;
* novos ataques relacionados.

---

## 13. ETAPA 5 — Malware Analysis (núcleo reforçado da Pesquisa B)

A análise de malware será utilizada para **validar, complementar e aprofundar** a inteligência existente — com escopo técnico **maior** que na Pesquisa A.

Não será necessário reproduzir integralmente todos os estudos já publicados, nem reverter o artefato linha a linha.

Serão selecionados artefatos relevantes (principalmente o dump desofuscado e o payload ofuscado documentado).

### Escopo mínimo Pesquisa B

```text
5.a Identidade do sample e handling
5.b Cadeia de execução e ofuscação (ROT / AES / Bun)
5.c Arquitetura modular (mapa 00–12)
5.d Credential access e discovery
5.e Exfiltração, C2 e dead-drop (domínio / Hades / markers)
5.f Propagação (npm, RubyGems, Actions, OIDC) e persistência
5.g Evasão (sandbox/decoy, StepSecurity) — se couber no teto de páginas
5.h Catálogo de IOCs e comportamentos com evidência no código
```

### Static Analysis

* hashes;
* strings;
* estrutura do código e módulos;
* dependências;
* imports;
* URLs;
* domínios;
* IPs;
* funções e classes relevantes (nomes analíticos do dump);
* obfuscação (wrappers, cipher);
* mecanismos de execução (preinstall, Bun, entrypoint);
* fluxos de orquestração (`12-orchestration`).

### Dynamic / Behavioral Analysis

Quando aplicável e realizado em laboratório isolado:

* criação de processos;
* execução de comandos;
* filesystem;
* comunicação de rede;
* credential access;
* discovery;
* persistence;
* exfiltration;
* propagation.

Preferência da Pesquisa B: **estático primeiro**; dinâmico só com lab dedicado, sem credenciais reais e com egress controlado.

### Relação metodológica

```text
Artefato
   ↓
Observação
   ↓
Evidência (path / módulo / hash)
   ↓
Interpretação
   ↓
TTP / IOC / input para CTI e Detection
```

### Fora do escopo (mesmo na B)

* reverse assembly completo;
* cobertura exaustiva de todos os infection jobs;
* execução contra alvos reais;
* republicação ou operação de C2/worm;
* honeypot operacional como entrega do TCC.

Base já existente: [Miasma/](./Miasma/) · `miasma-azure-durabletask-main/`.

---

## 14. ETAPA 6 — Cyber Threat Intelligence

As informações coletadas serão transformadas em inteligência estruturada.

Serão correlacionados:

```text
Hashes
Domains
IPs
URLs
Packages
Repositories
Accounts
Infrastructure
Malware
Tools
Victims
TTPs
Threat Actors
Achados da análise própria (Pesquisa B)
```

O objetivo será identificar relações que não são evidentes quando cada IOC é observado isoladamente — e **confrontar** claims públicas com o código.

---

## 15. ETAPA 7 — MITRE ATT&CK

Os comportamentos encontrados deverão ser mapeados para técnicas e subtécnicas do MITRE ATT&CK quando houver evidência suficiente.

Fluxo:

```text
Comportamento observado
          ↓
       Evidência (código e/ou fonte CTI)
          ↓
     ATT&CK Technique
          ↓
         TTP
```

Na Pesquisa B, a matriz ATT&CK deverá priorizar técnicas com **ancoragem no artefato**.

O ATT&CK permitirá padronizar a descrição de como o adversário opera.

Também será utilizado posteriormente na Engenharia de Detecção.

Esboço já disponível: [Miasma/04-mitre-attack.md](./Miasma/04-mitre-attack.md).

---

## 16. ETAPA 8 — Diamond Model

A campanha será reconstruída utilizando o Diamond Model of Intrusion Analysis.

Os quatro elementos principais serão:

```text
                   ADVERSARY
                       ▲
                      / \
                     /   \
                    /     \
                   /       \
          CAPABILITY ─── INFRASTRUCTURE
                   \       /
                    \     /
                     \   /
                      \ /
                       ▼
                     VICTIM
```

### Adversary

Quem pode estar conduzindo a operação?

### Capability

Quais recursos foram utilizados?

Exemplos:

* Miasma / payload DurableTask;
* variantes Shai-Hulud;
* credential stealers / providers;
* scripts embutidos;
* técnicas de propagação npm/Actions;
* monitores e persistência.

Na Pesquisa B, **Capability** deve ser preenchida de forma mais rica a partir da Etapa 5.

### Infrastructure

Quais recursos permitiram a operação?

Exemplos:

* GitHub (API, repos Hades, commits markers);
* registries (npm, RubyGems; PyPI em ondas relacionadas);
* domínios C2 dinâmicos;
* serviços cloud abusados pós-credencial;
* Bun releases como tooling.

### Victim

Quem ou o que foi comprometido?

Além dos diamantes individuais, deverão ser observadas relações entre eventos para identificar possíveis **activity threads e activity clusters**.

---

## 17. ETAPA 9 — Código do Almirantado

Informações provenientes de fontes públicas não serão tratadas automaticamente como fatos.

Para informações relevantes serão avaliadas duas dimensões:

```text
Confiabilidade da fonte
          +
Credibilidade da informação
          ↓
Avaliação da evidência
```

Isso será particularmente importante para afirmações relacionadas à atribuição.

Na Pesquisa B, também se avalia:

```text
Claim em relatório público
        ↓
Confirmado / parcialmente confirmado / não observado no código?
        ↓
Impacto na credibilidade da informação
```

Exemplo:

```text
"Miasma está associado ao ator X"
              ↓
Quem afirma?
              ↓
Qual evidência apresenta?
              ↓
Existe confirmação independente?
              ↓
Nossa análise encontrou evidência compatível?
              ↓
Qual a classificação?
```

---

## 18. ETAPA 10 — Threat Actor e Attribution

Após a coleta e avaliação das evidências será investigado o possível ator ou cluster de atividade.

A investigação poderá considerar:

* código;
* infraestrutura;
* TTPs;
* ferramentas;
* vítimas;
* temporalidade;
* linguagem;
* contas;
* histórico de campanhas;
* relações entre artefatos;
* sobreposição de infraestrutura;
* sobreposição comportamental.

Especial atenção será dada à possível relação:

```text
Miasma
   ↕
Mini Shai-Hulud
   ↕
TeamPCP?
   ↕
Outros clusters?
```

O `?` deverá permanecer até que as evidências sejam analisadas.

O trabalho deverá diferenciar:

**associação técnica**

de

**atribuição de responsabilidade.**

A maior profundidade de malware **não** autoriza, por si só, atribuição definitiva.

---

## 19. ETAPA 11 — Confidence Assessment

A conclusão sobre atribuição não deverá ser binária.

Poderá utilizar níveis como:

```text
Low Confidence
Moderate Confidence
High Confidence
```

Cada conclusão deverá indicar:

* evidências favoráveis;
* evidências contrárias;
* lacunas;
* hipóteses alternativas;
* nível de confiança.

---

## 20. ETAPA 12 — Detection Engineering

Depois de compreender o comportamento do adversário será realizada a transformação de inteligência em detecção.

O princípio será:

```text
Intelligence
     ↓
Behavior (incl. análise própria)
     ↓
TTP
     ↓
Telemetry
     ↓
Detection
```

Serão estudadas três categorias principais.

### IOC-based Detection

Exemplos:

* hash;
* IP;
* domínio;
* URL;
* markers de commit;
* strings de campanha (Hades / Miasma).

### Signature-based Detection

Principalmente:

* YARA;
* YARA-X.

Na Pesquisa B, assinaturas devem refletir padrões observados no artefato (wrappers, markers, estruturas).

### Behavioral Detection

Baseada em:

* comportamento;
* processos;
* acesso a credenciais;
* comunicação;
* filesystem;
* sequências de eventos (ex.: npm install → download Bun → publish);
* TTPs.

Sigma poderá ser utilizado para representar regras comportamentais portáveis.

Base: [Miasma/07-detection-hunting.md](./Miasma/07-detection-hunting.md).

---

## 21. ETAPA 13 — Validação das detecções

Quando tecnicamente possível, as regras produzidas deverão ser testadas.

O objetivo não será apenas escrever regras.

O ciclo deverá ser:

```text
Hipótese de detecção
        ↓
Regra
        ↓
Teste
        ↓
Resultado
        ↓
False Positive?
        ↓
Tuning
        ↓
Novo teste
```

Será particularmente interessante comparar:

```text
IOC / Hash Detection
          VS
Behavioral Detection
```

e discutir qual abordagem apresenta maior resistência a pequenas alterações no malware — com base na análise da Pesquisa B.

---

## 22. ETAPA 14 — Mitigações de Supply Chain

Após compreender o ataque serão discutidos controles capazes de reduzir o risco.

Entre eles:

* proteção de identidades;
* MFA;
* proteção de tokens;
* least privilege;
* branch protection;
* CI/CD hardening;
* secrets management;
* dependency monitoring;
* SBOM;
* artifact signing;
* provenance;
* SLSA;
* monitoramento de registries;
* análise de dependências;
* restrição de lifecycle scripts em CI;
* detecção comportamental;
* monitoramento de ambientes de desenvolvimento.

A mitigação deverá estar relacionada aos ataques observados (incluindo comportamentos confirmados no código) e não ser apenas uma lista genérica de boas práticas.

Base: [Miasma/09-preventive-controls.md](./Miasma/09-preventive-controls.md).

---

## 23. Estrutura provisória do artigo

### 1. Introdução

Contextualização, problema, justificativa, objetivos e contribuições (incluir a contribuição da análise técnica própria).

### 2. Fundamentação Teórica

#### 2.1 Software Supply Chain

#### 2.2 Software Supply Chain Attacks

#### 2.3 Cyber Threat Intelligence

#### 2.4 Threat Actors e Attribution

#### 2.5 Malware Analysis

#### 2.6 MITRE ATT&CK

#### 2.7 Diamond Model

#### 2.8 Código do Almirantado

#### 2.9 Detection Engineering

### 3. Metodologia

Definição das fontes, coleta de evidências, **protocolo de malware analysis** (estático/dinâmico, lab, ética, limites), avaliação das fontes, critérios de confidence assessment.

### 4. Estudo de Caso — Campanha Miasma

Contexto, timeline, supply-chain compromise, vítimas, artefatos e evolução da campanha.

### 5. Análise Técnica de Malware *(expandido — Pesquisa B)*

#### 5.1 Escopo, lab, artefato e limites

#### 5.2 Identidade do sample e handling

#### 5.3 Cadeia de execução e ofuscação

#### 5.4 Arquitetura modular (00–12)

#### 5.5 Credential access e discovery

#### 5.6 Exfiltração, C2 e dead-drop

#### 5.7 Propagação e persistência

#### 5.8 Evasão (se couber no teto)

#### 5.9 IOCs e comportamentos

#### 5.10 Mapeamento MITRE ATT&CK

### 6. Análise de Cyber Threat Intelligence

Correlação das evidências (públicas + próprias) e construção do Diamond Model.

### 7. Análise do Ator de Ameaça

Clusters, hipóteses, TeamPCP, evidências favoráveis e alternativas.

### 8. Avaliação das Fontes e Atribuição

Código do Almirantado e nível de confiança das conclusões.

### 9. Engenharia de Detecção

IOCs, YARA/YARA-X, Sigma e detecções comportamentais derivadas da análise.

### 10. Resultados e Discussão

Resultados técnicos e implicações para segurança de software supply chain.

### 11. Limitações

Limitações de amostras, fontes abertas, atribuição, profundidade do reverse e experimentação.

### 12. Conclusão

Resposta à questão de pesquisa, principais descobertas e trabalhos futuros (honeypot/intel pós-TCC, se aplicável).

---

## 24. Ordem prática de execução

A ordem real do trabalho deverá ser:

```text
[01] Definir problema e objetivos (ativar Pesquisa B formalmente)
             ↓
[02] Revisar literatura de Supply Chain
             ↓
[03] Revisar literatura de CTI
             ↓
[04] Estudar Diamond / Admiralty / ATT&CK
             ↓
[05] Construir corpus Miasma
             ↓
[06] Construir timeline
             ↓
[07] Identificar eventos e artefatos
             ↓
[08] Executar Malware Analysis aprofundada     ← bloco maior que na A
             ↓
[09] Extrair IOCs e comportamentos (com code_ref)
             ↓
[10] Mapear ATT&CK
             ↓
[11] Correlacionar CTI (vendor × código)
             ↓
[12] Construir Diamond Models
             ↓
[13] Investigar Threat Actor / clusters
             ↓
[14] Aplicar Código do Almirantado
             ↓
[15] Avaliar hipóteses de Attribution
             ↓
[16] Definir Confidence Level
             ↓
[17] Criar Detection Engineering
             ↓
[18] Testar e ajustar detecções
             ↓
[19] Analisar mitigações de Supply Chain
             ↓
[20] Consolidar resultados
             ↓
[21] Escrever discussão
             ↓
[22] Escrever conclusão
             ↓
[23] Revisar artigo
```

Calendário sugerido: ver ajustes em [TCC-plano-estudo.md](./TCC-plano-estudo.md) (esticar fase malware ~semanas 9–13).

---

## 25. Resultado esperado

Ao final, o trabalho deverá conseguir contar uma história completa:

> **Como funciona uma cadeia de suprimentos de software?**

↓

> **Como um adversário consegue comprometê-la?**

↓

> **Como isso ocorreu no caso Miasma?**

↓

> **O que o malware realizou — com evidência técnica própria?**

↓

> **Quais TTPs foram utilizadas?**

↓

> **Quais relações existem entre adversário, capability, infraestrutura e vítimas?**

↓

> **Quão confiáveis são as informações disponíveis?**

↓

> **É possível associar a operação a um determinado ator ou cluster? Com qual nível de confiança?**

↓

> **Como detectar comportamentos semelhantes?**

↓

> **Como organizações podem reduzir o risco de novos ataques de supply chain?**

Essa deverá ser a linha narrativa principal do artigo.

---

## 26. Princípio fundamental

**Miasma é o estudo de caso.**

**Software Supply Chain Attacks são o objeto central da pesquisa.**

**Malware Analysis (aprofundada) é pilar técnico reforçado** — fornece evidências de primeira mão.

Cyber Threat Intelligence transforma evidências em inteligência.

MITRE ATT&CK padroniza os comportamentos.

Diamond Model relaciona adversário, capability, infraestrutura e vítima.

Código do Almirantado auxilia na avaliação das informações.

Attribution avalia possíveis responsáveis ou clusters de atividade.

Detection Engineering transforma o conhecimento adquirido em capacidade defensiva.

Todos esses elementos deverão convergir para responder à questão principal sobre **ataques modernos à cadeia de suprimentos de software**.

---

## 27. Decisão e relação com a Pesquisa A

| Campo | Valor |
| --- | --- |
| Pesquisa A | [TCC-pesquisa-A.md](./TCC-pesquisa-A.md) — vigente por defeito |
| Pesquisa B | Este documento — norte paralelo com malware mais completo |
| Ativada? | **Não**, até acordo explícito |

Quando B for ativada: atualizar o README da raiz e o calendário de estudo.

---

## Materiais deste repositório

| Recurso | Caminho |
| --- | --- |
| Pesquisa A (plano oficial) | [TCC-pesquisa-A.md](./TCC-pesquisa-A.md) |
| Lista de leitura | [TCC-leitura-referencias.md](./TCC-leitura-referencias.md) |
| Plano de estudo | [TCC-plano-estudo.md](./TCC-plano-estudo.md) |
| Refs por fase | [refs/](./refs/) |
| Docs técnicos Miasma | [Miasma/README.md](./Miasma/README.md) |
| Ideia pós-TCC (honeypot/intel) | [Miasma/12-post-tcc-honeypot-intel.md](./Miasma/12-post-tcc-honeypot-intel.md) |
| README raiz | [../README.md](../README.md) |
