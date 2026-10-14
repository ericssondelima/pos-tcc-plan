# TCC — Ataques à cadeia de suprimentos de software (estudo de caso Miasma)

## Plano completo

- **Pesquisa A (atual):** [Docs/TCC-pesquisa-A.md](./Docs/TCC-pesquisa-A.md) — CTI + malware leve  
- **Pesquisa B (alternativa):** [Docs/TCC-pesquisa-B.md](./Docs/TCC-pesquisa-B.md) — CTI + malware mais completo  

Por defeito segue-se a **A** até decisão explícita.

## Ideia / proposta (resumo)

Pretendo desenvolver o TCC sobre ataques à cadeia de suprimentos de software, utilizando a campanha **Miasma** como estudo de caso. A proposta é explicar como esse tipo de ataque explora relações de confiança existentes no ecossistema de desenvolvimento e distribuição de software e, a partir do caso Miasma, realizar uma análise baseada em **Cyber Threat Intelligence** e **análise de malware**, identificando comportamentos, **IOCs** e **TTPs** por meio do **MITRE ATT&CK**. A investigação também utilizará o **Diamond Model** para relacionar adversário, capabilities, infraestrutura e vítimas, além do **Código do Almirantado** para avaliar a confiabilidade das fontes e apoiar a análise de atribuição do possível ator ou cluster responsável. Por fim, os resultados serão utilizados em uma etapa de **Engenharia de Detecção**, buscando demonstrar como a inteligência obtida pode ser convertida em mecanismos de detecção e recomendações para mitigação de ataques à cadeia de suprimentos.

## Escopo deste repositório

| Caminho | Conteúdo |
| --- | --- |
| [Docs/TCC-pesquisa-A.md](./Docs/TCC-pesquisa-A.md) | **Pesquisa A** — plano CTI + malware leve |
| [Docs/TCC-pesquisa-B.md](./Docs/TCC-pesquisa-B.md) | **Pesquisa B** — mesmo norte, malware mais completo |
| [Docs/TCC-leitura-referencias.md](./Docs/TCC-leitura-referencias.md) | Lista de leitura / refs (**único** — A e B) |
| [Docs/TCC-plano-estudo.md](./Docs/TCC-plano-estudo.md) | Plano de estudo por etapa + normas dupla titulação |
| [Docs/refs/](./Docs/refs/) | PDFs baixados por fase (ex.: `01-supply-chain`) |
| [Docs/Miasma/](./Docs/Miasma/) | Documentação defensiva do estudo de caso (overview, arquitetura, kill chain, MITRE, IOCs, hunting, IR, hipóteses, refs) |
| [miasma-azure-durabletask-main/](./miasma-azure-durabletask-main/) | Código desofuscado / artefato de pesquisa (tratar como malware) |

**Não execute** o payload. Uso apenas para análise estática, CTI, detecção e mitigação.

## Pilares metodológicos (TCC)

1. Supply-chain / confiança no ecossistema (npm, CI/CD, Actions, etc.)
2. Análise de malware + CTI (comportamentos, IOCs, TTPs)
3. MITRE ATT&CK
4. Diamond Model (adversário · capability · infraestrutura · vítima)
5. Código do Almirantado (confiabilidade de fontes / apoio à atribuição)
6. Engenharia de detecção e recomendações de mitigação

## Fora do escopo do TCC (trabalho futuro)

Honeypot + plano de inteligência operacional (DevOps / DevSecOps / AppSec): ver [Docs/Miasma/12-post-tcc-honeypot-intel.md](./Docs/Miasma/12-post-tcc-honeypot-intel.md).

## Índice da documentação Miasma

Ver [Docs/Miasma/README.md](./Docs/Miasma/README.md).
# pos-tcc-plan
