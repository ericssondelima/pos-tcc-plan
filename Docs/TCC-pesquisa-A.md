# TCC — Pesquisa A — Ataques à Cadeia de Suprimentos de Software

## Estudo de caso: Campanha Miasma sob a perspectiva de Cyber Threat Intelligence

**Pesquisa:** A (vigente por defeito).  
**Alternativa:** [TCC-pesquisa-B.md](./TCC-pesquisa-B.md) — mesmo norte, malware mais completo.

## 1. Visão geral

Este documento define o plano de desenvolvimento do Trabalho de Conclusão de Curso e do artigo científico.

O tema central da pesquisa será **ataques à cadeia de suprimentos de software (Software Supply Chain Attacks)**.

A campanha **Miasma** será utilizada como estudo de caso contemporâneo para investigar como um comprometimento da cadeia de suprimentos pode ser realizado, quais técnicas são utilizadas pelo adversário, como o malware participa da operação, quais evidências permitem caracterizar o ator ou cluster de atividade e como os conhecimentos obtidos podem ser transformados em mecanismos de detecção.

O objetivo não será produzir apenas mais uma análise técnica do Miasma.

O Miasma será utilizado como uma fonte real de evidências para estudar:

* Software Supply Chain Attacks;
* Cyber Threat Intelligence (CTI);
* Threat Actors e Activity Clusters;
* Malware Analysis;
* MITRE ATT&CK;
* Diamond Model of Intrusion Analysis;
* Código do Almirantado;
* Attribution;
* Detection Engineering.

---

## 2. Tema central

**Ataques à cadeia de suprimentos de software analisados sob a perspectiva de Cyber Threat Intelligence, utilizando a campanha Miasma como estudo de caso.**

O principal objeto da pesquisa será o **ataque à cadeia de suprimentos**.

A campanha Miasma funcionará como estudo de caso para compreender o fenômeno na prática.

---

## 3. Título provisório

### Opção principal

**Ataques à Cadeia de Suprimentos de Software: uma análise de Cyber Threat Intelligence da campanha Miasma**

Outras variações poderão ser avaliadas posteriormente conforme os resultados da pesquisa.

---

## 4. Princípio da pesquisa

A pesquisa deverá seguir uma cadeia lógica:

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
Malware Analysis
        ↓
TTPs
        ↓
MITRE ATT&CK
        ↓
Diamond Model
        ↓
Análise do Threat Actor
        ↓
Avaliação das fontes
        ↓
Código do Almirantado
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

> Como ataques modernos à cadeia de suprimentos de software podem ser caracterizados por meio de Cyber Threat Intelligence e análise técnica, utilizando a campanha Miasma para identificar TTPs, capabilities, infraestrutura, possíveis atores de ameaça e oportunidades de detecção?

Uma questão secundária importante será:

> Até que ponto as evidências públicas e técnicas disponíveis permitem relacionar a campanha Miasma ao TeamPCP ou a um cluster de atividade associado?

A pesquisa não deverá assumir previamente que determinado ator realizou a campanha.

A atribuição será tratada como uma **hipótese analítica**.

---

## 6. Hipótese inicial

Ataques modernos à cadeia de suprimentos permitem que adversários explorem relações de confiança existentes entre desenvolvedores, fornecedores, repositórios, pipelines, artefatos e consumidores de software.

A campanha Miasma demonstra como esse modelo pode ser utilizado para comprometer ecossistemas de desenvolvimento e obter acesso indireto a múltiplos ambientes.

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
```

A atribuição deverá resultar da correlação de múltiplas evidências.

---

## 7. Objetivo geral

Analisar ataques à cadeia de suprimentos de software utilizando a campanha Miasma como estudo de caso, aplicando conceitos e metodologias de Cyber Threat Intelligence, Malware Analysis, MITRE ATT&CK, Diamond Model e avaliação estruturada de fontes para compreender a operação, seus possíveis atores e mecanismos de detecção.

---

## 8. Objetivos específicos

1. Explicar o funcionamento de uma cadeia moderna de desenvolvimento e distribuição de software.

2. Identificar os principais pontos de comprometimento existentes em uma software supply chain.

3. Caracterizar diferentes formas de Software Supply Chain Attack.

4. Reconstruir cronologicamente a campanha Miasma.

5. Identificar organizações, pacotes, repositórios e ecossistemas afetados.

6. Consolidar informações provenientes de diferentes fontes de Cyber Threat Intelligence.

7. Analisar artefatos e código relacionados ao Miasma.

8. Identificar comportamentos relevantes do malware.

9. Mapear comportamentos observados para MITRE ATT&CK.

10. Identificar infraestrutura, capabilities, vítimas e possíveis adversários.

11. Aplicar o Diamond Model para reconstrução da operação.

12. Avaliar a confiabilidade das fontes e a credibilidade das informações utilizando o Código do Almirantado.

13. Investigar a possível associação da campanha com TeamPCP ou outros clusters de atividade.

14. Definir um nível de confiança para as conclusões de atribuição.

15. Transformar os conhecimentos obtidos em mecanismos de Detection Engineering.

16. Desenvolver e avaliar detecções baseadas em indicadores, assinaturas e comportamento.

17. Apresentar recomendações de mitigação para ataques à cadeia de suprimentos.

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
```

Nenhuma conclusão importante deverá depender de apenas uma fonte quando houver possibilidade de corroboração.

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

## 13. ETAPA 5 — Malware Analysis

A análise de malware será utilizada para **validar e complementar a inteligência existente**.

Não será necessário reproduzir integralmente todos os estudos já publicados.

Serão selecionados artefatos relevantes.

A análise poderá envolver:

### Static Analysis

* hashes;
* strings;
* estrutura do código;
* dependências;
* imports;
* URLs;
* domínios;
* IPs;
* funções relevantes;
* obfuscação;
* mecanismos de execução.

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

A metodologia deverá preservar a relação:

```text
Artefato
   ↓
Observação
   ↓
Evidência
   ↓
Interpretação
```

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
```

O objetivo será identificar relações que não são evidentes quando cada IOC é observado isoladamente.

---

## 15. ETAPA 7 — MITRE ATT&CK

Os comportamentos encontrados deverão ser mapeados para técnicas e subtécnicas do MITRE ATT&CK quando houver evidência suficiente.

Fluxo:

```text
Comportamento observado
          ↓
       Evidência
          ↓
     ATT&CK Technique
          ↓
         TTP
```

O ATT&CK permitirá padronizar a descrição de como o adversário opera.

Também será utilizado posteriormente na Engenharia de Detecção.

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

* Miasma;
* variantes;
* credential stealers;
* scripts;
* ferramentas;
* técnicas de propagação.

### Infrastructure

Quais recursos permitiram a operação?

Exemplos:

* GitHub;
* registries;
* domínios;
* IPs;
* C2;
* serviços cloud;
* repositórios.

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
Behavior
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
* URL.

### Signature-based Detection

Principalmente:

* YARA;
* YARA-X.

### Behavioral Detection

Baseada em:

* comportamento;
* processos;
* acesso a credenciais;
* comunicação;
* filesystem;
* sequências de eventos;
* TTPs.

Sigma poderá ser utilizado para representar regras comportamentais portáveis.

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

e discutir qual abordagem apresenta maior resistência a pequenas alterações no malware.

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
* detecção comportamental;
* monitoramento de ambientes de desenvolvimento.

A mitigação deverá estar relacionada aos ataques observados e não ser apenas uma lista genérica de boas práticas.

---

## 23. Estrutura provisória do artigo

### 1. Introdução

Contextualização, problema, justificativa, objetivos e contribuições.

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

Definição das fontes, coleta de evidências, metodologia de análise, avaliação das fontes, laboratório e critérios de confidence assessment.

### 4. Estudo de Caso — Campanha Miasma

Contexto, timeline, supply-chain compromise, vítimas, artefatos e evolução da campanha.

### 5. Análise Técnica

Malware, comportamentos, IOCs e TTPs.

### 6. Análise de Cyber Threat Intelligence

Correlação das evidências e construção do Diamond Model.

### 7. Análise do Ator de Ameaça

Clusters, hipóteses, TeamPCP, evidências favoráveis e alternativas.

### 8. Avaliação das Fontes e Atribuição

Código do Almirantado e nível de confiança das conclusões.

### 9. Engenharia de Detecção

IOCs, YARA/YARA-X, Sigma e detecções comportamentais.

### 10. Resultados e Discussão

Resultados técnicos e implicações para segurança de software supply chain.

### 11. Limitações

Limitações de amostras, fontes abertas, atribuição e experimentação.

### 12. Conclusão

Resposta à questão de pesquisa, principais descobertas e trabalhos futuros.

---

## 24. Ordem prática de execução

A ordem real do trabalho deverá ser:

```text
[01] Definir problema e objetivos
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
[08] Executar Malware Analysis
             ↓
[09] Extrair IOCs e comportamentos
             ↓
[10] Mapear ATT&CK
             ↓
[11] Correlacionar CTI
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

---

## 25. Resultado esperado

Ao final, o trabalho deverá conseguir contar uma história completa:

> **Como funciona uma cadeia de suprimentos de software?**

↓

> **Como um adversário consegue comprometê-la?**

↓

> **Como isso ocorreu no caso Miasma?**

↓

> **O que o malware realizou?**

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

Malware Analysis fornece evidências técnicas.

Cyber Threat Intelligence transforma evidências em inteligência.

MITRE ATT&CK padroniza os comportamentos.

Diamond Model relaciona adversário, capability, infraestrutura e vítima.

Código do Almirantado auxilia na avaliação das informações.

Attribution avalia possíveis responsáveis ou clusters de atividade.

Detection Engineering transforma o conhecimento adquirido em capacidade defensiva.

Todos esses elementos deverão convergir para responder à questão principal sobre **ataques modernos à cadeia de suprimentos de software**.

---

## Materiais deste repositório

| Recurso | Caminho |
| --- | --- |
| README (resumo) | [../README.md](../README.md) |
| **Pesquisa B** (mesmo norte, malware mais completo) | [TCC-pesquisa-B.md](./TCC-pesquisa-B.md) |
| Docs técnicos Miasma | [Miasma/README.md](./Miasma/README.md) |
| Ideia pós-TCC (honeypot/intel) | [Miasma/12-post-tcc-honeypot-intel.md](./Miasma/12-post-tcc-honeypot-intel.md) |
