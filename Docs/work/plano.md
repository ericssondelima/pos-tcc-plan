Professor, pensei em estruturar o trabalho partindo da evolução dos processos modernos de desenvolvimento de software até chegar à análise de malware e à engenharia de detecção.

A ideia inicial é contextualizar brevemente DevOps, DevSecOps e Application Security (AppSec), demonstrando como desenvolvimento, operações e segurança passaram a fazer parte de um processo cada vez mais integrado e automatizado.

A partir dessa contextualização, pretendo abordar os processos de CI/CD e a automação utilizada durante o ciclo de desenvolvimento e entrega de software. O objetivo é demonstrar que uma aplicação moderna não depende somente do código desenvolvido internamente, mas também de bibliotecas, dependências, repositórios, ferramentas de build, pipelines, imagens, artefatos e outros componentes internos ou de terceiros.

Com isso, introduzo o conceito de Software Supply Chain e as relações de confiança existentes entre os diferentes componentes dessa cadeia. Em seguida, pretendo abordar os riscos associados a essa estrutura e como o comprometimento de um de seus elementos pode ser utilizado para atingir outros sistemas que confiam naquele componente, chegando ao conceito de Software Supply Chain Attack.

A partir dos ataques à cadeia de suprimentos, o trabalho será direcionado para a utilização desse tipo de comprometimento como mecanismo para inserção ou distribuição de código malicioso. Nesse ponto, entro no foco técnico do trabalho: a análise de malware.

A proposta é realizar a análise de uma campanha/amostra selecionada, utilizando técnicas de análise estática e dinâmica para identificar seus principais comportamentos e extrair indicadores de comprometimento (IOCs) e Táticas, Técnicas e Procedimentos (TTPs).

Os resultados técnicos obtidos durante a análise serão relacionados a conceitos, buscando contextualizar os indicadores e comportamentos identificados e realizar o mapeamento das técnicas observadas utilizando frameworks como o MITRE ATT&CK.

Por fim, pretendo utilizar os resultados da análise para trabalhar conceitos de engenharia de detecção, transformando os IOCs, comportamentos e TTPs encontrados em possíveis mecanismos de identificação da ameaça, considerando tanto detecções baseadas em indicadores e assinaturas quanto detecções baseadas em comportamento.

Dessa forma, a linha lógica proposta para o trabalho seria:

DevOps / DevSecOps / AppSec → CI/CD → Software Supply Chain → riscos da cadeia → Supply Chain Attack → distribuição de malware → Malware Analysis → IOCs e TTPs → CTI / MITRE ATT&CK → Engenharia de Detecção.