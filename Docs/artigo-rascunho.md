<style>
.ieee {
  font-family: "Times New Roman", Times, serif;
  font-size: 11pt;
  line-height: 1.15;
  text-align: justify;
  max-width: 42em;
  color: #111;
}
.ieee h1 {
  font-size: 15pt;
  font-weight: 700;
  text-align: center;
  line-height: 1.2;
  margin: 0 0 1.1em;
}
.ieee h2 {
  font-size: 11pt;
  font-weight: 700;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin: 1.15em 0 0.55em;
}
.ieee p {
  margin: 0 0 0.15em;
  text-indent: 1.25em;
}
.ieee p.noindent,
.ieee .abs,
.ieee .kw {
  text-indent: 0;
}
.ieee .abs,
.ieee .kw {
  margin: 0 0 0.65em;
}
.ieee .lbl {
  font-weight: 700;
  font-style: italic;
}
.ieee ul {
  margin: 0.15em 0 0.35em;
  padding-left: 1.4em;
}
.ieee li {
  margin: 0.05em 0;
  text-align: justify;
}
.ieee .rq {
  text-indent: 0;
  margin: 0.45em 0 0.1em;
}
.ieee ol.beats {
  margin: 0 0 0.75em;
  padding-left: 1.5em;
}
.ieee ol.beats li {
  text-indent: 0;
  margin: 0.2em 0;
}
.ieee .cue {
  font-style: italic;
}
</style>

<div class="ieee">

<h1>Ataques à Cadeia de Suprimentos de Software: uma análise de Cyber Threat Intelligence da campanha Miasma</h1>

<p class="abs"><span class="lbl">Resumo—</span> <span class="cue">Um parágrafo, cinco frases, nesta ordem. Não antecipar a introdução.</span></p>
<ol class="beats">
<li><span class="cue">Problema.</span> Por que a cadeia de código aberto é alvo: dependência, superfície e o fim do atacante (código que o consumidor descarrega e executa). Ainda sem nomear a campanha.</li>
<li><span class="cue">Objeto.</span> O que este trabalho faz: análise de inteligência de ameaças da campanha Miasma. Uma frase. Sem método e sem resultado.</li>
<li><span class="cue">Forma e cobertura.</span> Em que formato o resultado aparece e o que ele cobre: vetor na taxonomia, comportamento do artefato, Diamond, ATT&amp;CK, detecção. Número só quando já existir (fontes, técnicas, indicadores).</li>
<li><span class="cue">Exame.</span> Com o que isso se sustenta: fontes abertas e o artefato, sem execução. O que esse exame permite afirmar.</li>
<li><span class="cue">Limite.</span> O que fica qualificado e o que não se fecha: atribuição como hipótese; detecções ligadas ao comportamento observado.</li>
</ol>

<p class="kw"><span class="lbl">Palavras-chave—</span> <span class="cue">Quatro ou cinco termos, do geral ao específico: código aberto; segurança; cadeia de suprimentos de software; malware; inteligência de ameaças.</span></p>

<h2>I. Introdução</h2>

<p class="noindent">Ataques à cadeia de suprimentos de software têm por fim injetar código malicioso em componentes que serão descarregados e executados por usuários a jusante. O alcance fica visível em incidentes como o comprometimento da plataforma Orion, da SolarWinds, obtido por cerca de 18 mil clientes, entre os quais agências governamentais e operadores de infraestrutura crítica (Ladisa et al., 2023). A literatura recente trata esse tipo de ataque como ameaça prioritária do cenário atual (Ladisa et al., 2023).</p>

<p>Este trabalho trata da instância específica desses ataques sobre cadeias de software de código aberto. O artefato que chega à produção é montado: um mantenedor publica código, um gerenciador de pacotes resolve dependências diretas e transitivas, um pipeline de integração contínua produz o binário ou o pacote, e um registro o entrega a consumidores que não inspecionaram o que instalaram. Cada elo existe porque o seguinte confia no anterior. Atacantes abusam dessas relações de confiança entre os participantes da cadeia (Ladisa et al., 2023). Não é necessário escrever o sistema da vítima; basta inserir o código no caminho já reservado ao software legítimo.</p>

<p>Indústria e academia têm descrito como essa inserção ocorre. O NIST organiza a gestão de risco da cadeia (SP 800-161) e as práticas de desenvolvimento seguro (SSDF, SP 800-218). A OpenSSF propõe o SLSA para integridade de build e proveniência. Ladisa et al. (2023) oferecem uma taxonomia independente de linguagem e de ecossistema, em forma de árvore de ataque, com 107 vetores ligados a 94 incidentes e a 33 salvaguardas. O foco dessa taxonomia é o modo como o código malicioso entra no artefato, não o que o malware faz depois de executado. Relatos de fornecedores sobre a campanha Miasma — também referida como Shai-Hulud — documentam o comprometimento de pacotes npm, a propagação por registros e pipelines e a coleta de segredos em ambientes de desenvolvimento. Falta, ainda, uma caracterização da campanha como inteligência: o vetor usado, o comportamento do artefato, a relação entre adversário, capacidade, infraestrutura e vítima, e o grau de confiança de qualquer hipótese de atribuição.</p>

<p>Uma análise que una a taxonomia de ataques, a evidência do artefato e modelos de inteligência seria útil para treino, avaliação de risco e detecção. Com esse fim, procuramos responder às seguintes questões:</p>

<p class="rq">QP1 – Caracterização da campanha na cadeia de código aberto</p>
<ul>
<li>QP1.1 – Em que vetores da taxonomia de ataques a cadeias de código aberto a campanha Miasma se encaixa?</li>
<li>QP1.2 – Quais comportamentos do artefato sustentam essa classificação?</li>
</ul>

<p class="rq">QP2 – Inteligência e atribuição</p>
<ul>
<li>QP2.1 – Que relações entre adversário, capacidade, infraestrutura e vítima as evidências públicas e o artefato permitem reconstruir?</li>
<li>QP2.2 – Até que ponto essas evidências sustentam a associação da campanha a um ator ou cluster de atividade, em particular o TeamPCP?</li>
</ul>

<p class="rq">QP3 – Detecção</p>
<ul>
<li>QP3.1 – Que detecções decorrem dos comportamentos observados?</li>
</ul>

<p>Para responder a essas questões, primeiro situamos a cadeia de código aberto e a taxonomia de vetores que descreve a inserção de código malicioso. Em seguida reconstruímos a campanha a partir de fontes abertas e do artefato JavaScript associado ao Miasma, sem executá-lo, e mapeamos os comportamentos observados para o MITRE ATT&CK. Por fim correlacionamos adversário, capacidade, infraestrutura e vítima com o Diamond Model, graduamos as fontes pelo Código do Almirantado e derivamos oportunidades de detecção. A semelhança de código, de malware ou de técnica, isolada, não encerra a atribuição; esta depende da correlação de evidências graduadas.</p>

<p>As contribuições pretendidas deste trabalho são as seguintes:</p>
<ul>
<li>O enquadramento da campanha Miasma na taxonomia de ataques a cadeias de suprimentos de código aberto, com os vetores efetivamente usados.</li>
<li>Uma reconstrução da operação pelo Diamond Model e pelo MITRE ATT&CK, ancorada no artefato e nas fontes abertas.</li>
<li>Uma avaliação explícita da confiança da hipótese de atribuição.</li>
<li>Um conjunto de oportunidades de detecção ligadas aos comportamentos observados.</li>
</ul>

<p>O restante do artigo está organizado como segue. A Seção II apresenta a cadeia de suprimentos de software, os ataques a essa cadeia, a inteligência de ameaças e os modelos usados na análise. A Seção III descreve as fontes, a coleta e os critérios de confiança. A Seção IV reconstrói a campanha Miasma. A Seção V analisa o artefato. A Seção VI correlaciona as evidências. A Seção VII discute hipóteses sobre o ator. A Seção VIII avalia as fontes e a atribuição. A Seção IX trata da detecção. A Seção X discute os resultados. A Seção XI registra as limitações. A Seção XII conclui.</p>

</div>
