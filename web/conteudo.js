/* Textos editáveis do Avanço Licitações: Central de ajuda e página de Planos.
   Pode editar à vontade, sem mexer no app.js. Regras:
   - use só texto puro (sem HTML);
   - uma linha em branco dentro da resposta ("\n\n") vira um novo parágrafo;
   - mantenha as respostas honestas: onde a regra varia por edital, diga isso. */
window.NEXORA_CONTEUDO = {
  faq: [
    {
      grupo: "Começando",
      itens: [
        { p: "O que é o Avanço Licitações?",
          r: "O Avanço Licitações reúne compras públicas que estão aceitando propostas, organiza por categoria, estado, tipo, valor e prazo, e leva você ao edital oficial.\n\nNão somos um órgão do governo e não participamos das licitações por você. Mostramos onde estão as oportunidades." },
        { p: "Preciso ter empresa para usar?",
          r: "Não. A pesquisa de produtos é aberta a qualquer pessoa. Para participar de uma licitação, porém, é preciso ter CNPJ." },
        { p: "De onde vêm os dados?",
          r: "Do PNCP (Portal Nacional de Contratações Públicas), por meio da consulta pública que ele oferece. Confira sempre as informações no edital original, que é o documento válido." },
        { p: "Com que frequência os dados são atualizados?",
          r: "O site confere o PNCP de hora em hora e, uma vez por dia, faz uma conferência completa. A data e a hora da última atualização aparecem na tela. O que acabou de ser publicado ganha a marca “Nova” por 24 horas. O GitHub, que hospeda o site, às vezes atrasa uma conferência, então pode haver pequenas diferenças de horário." },
        { p: "O Avanço Licitações mostra todas as licitações do Brasil?",
          r: "Não. Mostramos compras com proposta em aberto, nas modalidades que coletamos e que se encaixam nas nossas categorias. Compras fora delas ficam de fora.\n\nAlém disso, nem toda compra pública é publicada no PNCP. Por isso, use o Avanço Licitações como um ponto de partida, não como lista completa." },
      ],
    },
    {
      grupo: "Entendendo as compras públicas",
      itens: [
        { p: "O que é pregão eletrônico?",
          r: "É a modalidade usada para comprar bens e serviços comuns. A disputa acontece por lances pela internet e, em regra, vence o menor preço, desde que a empresa cumpra as exigências do edital." },
        { p: "O que é concorrência?",
          r: "É uma modalidade usada em contratações maiores ou mais complexas, e também em obras de engenharia. Costuma pedir mais documentos de qualificação que o pregão." },
        { p: "O que é dispensa de licitação?",
          r: "É a compra feita sem a licitação tradicional, nos casos que a lei permite (por exemplo, valores baixos). Costuma ter prazo curto, mas ainda tem regras, e muitas vezes há disputa entre fornecedores em uma plataforma. Leia o aviso com atenção." },
        { p: "O que é credenciamento?",
          r: "A empresa se cadastra para ser chamada quando o órgão tiver demanda. As regras de como os fornecedores são escolhidos estão no edital." },
        { p: "O que é registro de preços?",
          r: "Os preços ficam registrados por um período e o órgão compra conforme a necessidade. O valor estimado é o máximo previsto, não uma garantia: o órgão pode comprar bem menos do que a quantidade registrada." },
        { p: "O valor mostrado é o que vou receber?",
          r: "Não. É o valor total estimado da compra inteira, com todos os itens somados. O preço de cada item está no edital, e a proposta vencedora pode ficar abaixo do estimado." },
        { p: "O que significa “Valor não informado”?",
          r: "Que o órgão não publicou o valor estimado ou que o orçamento é sigiloso. Não quer dizer que a compra vale zero." },
        { p: "O que são “Compra de produtos”, “Serviços” e “Obras”?",
          r: "É uma classificação que o Avanço Licitações faz lendo o texto do objeto da compra, porque a lista do PNCP não informa isso. Pode errar em objetos que misturam compra e serviço. Confirme no edital." },
      ],
    },
    {
      grupo: "Como participar",
      itens: [
        { p: "Como participo de uma licitação?",
          r: "1. Abra o edital (botão “Ver edital”) e leia o termo de referência.\n\n2. Cadastre-se na plataforma onde a disputa acontece (o botão “Enviar proposta” leva até ela, quando o órgão informou o link).\n\n3. Se tiver dúvida, peça esclarecimento por escrito no canal indicado no edital.\n\n4. Envie a proposta no sistema até o prazo.\n\n5. Se vencer, o órgão confere seus documentos e depois assina o contrato ou emite a nota de empenho." },
        { p: "Preciso de CNPJ? O MEI pode participar?",
          r: "Em geral é preciso ter CNPJ ativo, com atividade compatível com o que será vendido. MEI, ME e EPP podem participar e costumam ter vantagens previstas em lei, como preferência no desempate.\n\nSe você é MEI, confira se a sua atividade cobre o que o órgão quer comprar e se o valor não ultrapassa o seu limite de faturamento. Em caso de dúvida, consulte um contador." },
        { p: "Quais documentos costumam ser pedidos?",
          r: "Os mais comuns são: certidões de regularidade federal (Receita e PGFN), FGTS e trabalhista (CNDT), além da estadual e da municipal quando o edital exige. Obras e alguns serviços também pedem registro profissional e atestados de capacidade técnica.\n\nCada órgão define as próprias exigências. A lista que vale é a do edital." },
        { p: "Posso ligar ou escrever para o órgão para oferecer meu produto?",
          r: "Durante uma licitação em andamento, as dúvidas devem ir por escrito pelo canal oficial indicado no edital. A resposta fica pública para todos os concorrentes. Um contato privado para oferecer produto naquele processo não é o caminho.\n\nFora de um processo aberto, apresentar a empresa é possível, mas uma compra pública só acontece por licitação, dispensa ou outra via prevista em lei." },
        { p: "Posso participar de uma obra vendendo produtos?",
          r: "Em geral não. Obras de engenharia exigem registro da empresa e do responsável técnico no CREA ou CAU e comprovação de obras parecidas. Quem vende produtos costuma procurar o filtro “Compra de produtos”." },
        { p: "Não tenho cadastro na plataforma. E agora?",
          r: "Cada plataforma tem o próprio cadastro, e algumas pedem certificado digital ou conta gov.br com determinado nível. Os requisitos aparecem no edital e no site da plataforma. Faça o cadastro com antecedência, porque ele pode levar dias." },
        { p: "Onde posso aprender mais?",
          r: "O Sebrae costuma oferecer cursos e materiais sobre vender para o governo, e o próprio Portal Nacional de Contratações Públicas publica manuais. Para dúvidas jurídicas ou contábeis, procure um profissional." },
      ],
    },
    {
      grupo: "Conta, perfil e planos",
      itens: [
        { p: "Preciso criar conta?",
          r: "Não para pesquisar nem para usar o radar. O perfil da empresa e as oportunidades que você acompanha ficam salvos no seu navegador. O login, que guarda isso na nuvem, será ativado junto com os planos." },
        { p: "O que é “compatibilidade”?",
          r: "Uma nota de 0 a 100 que compara a oportunidade com o perfil da sua empresa: categorias, estados, palavras-chave e faixa de valor. Ela só aparece depois que você preenche o perfil em Minha conta." },
        { p: "Onde ficam meus dados de perfil e minhas oportunidades salvas?",
          r: "Neste navegador, no seu computador. Se você limpar os dados do navegador ou usar outro aparelho, eles não aparecem. A versão na nuvem faz parte do que estamos desenvolvendo." },
        { p: "Quanto custa o plano pago?",
          r: "O preço previsto é R$ 7,99 por mês. Hoje nada é cobrado: o plano pago só começa quando o login, o pagamento e os avisos por e-mail estiverem prontos. Pesquisar produtos, usar o radar e ler a Central de ajuda continuam gratuitos." },
        { p: "Quando terei alertas por e-mail?",
          r: "Estão planejados para o plano pago e ainda não estão disponíveis. Veja a página Planos para acompanhar o que já existe e o que está em desenvolvimento." },
        { p: "O Avanço Licitações garante que vou ganhar licitações?",
          r: "Não. Oferecemos informação e organização. Participar e ganhar depende da sua empresa, do preço, dos documentos e das regras de cada edital." },
      ],
    },
  ],

  // status: agora | parcial | andamento | planejado
  planos: {
    preco: { valor: "R$ 7,99", periodo: "por mês" },
    gratis: [
      { t: "Pesquisa de produtos: onde e quanto o governo compra", s: "agora" },
      { t: "Radar com filtros por estado, categoria, tipo, valor e prazo", s: "agora" },
      { t: "Compras novas de hora em hora, com a marca “Nova”", s: "agora",
        d: "O site confere o PNCP de hora em hora e destaca o que acabou de ser publicado." },
      { t: "Guia “O que você precisa para participar” em cada oportunidade", s: "agora" },
      { t: "Exportar a lista em CSV", s: "agora" },
      { t: "Central de ajuda", s: "agora" },
    ],
    pago: [
      { t: "Aviso por e-mail quando sair uma compra que combina com a sua empresa", s: "planejado",
        d: "Você escolhe o que vende e em quais estados atua. Quando aparece uma compra nova desse tipo, mandamos um e-mail, sem você precisar entrar no site. Depende do login, que ainda vamos construir." },
      { t: "Acompanhamento guardado na sua conta", s: "parcial",
        d: "Hoje você já marca as oportunidades de interesse e acompanha cada uma até o resultado, mas isso fica só neste navegador. No plano pago, ficará salvo na sua conta e aparecerá em qualquer aparelho." },
      { t: "Relatórios em PDF", s: "parcial",
        d: "Hoje dá para imprimir ou salvar em PDF pelo navegador. No plano pago, o relatório virá pronto, com o perfil da sua empresa." },
      { t: "Preço por item: quanto o governo pagou", s: "planejado",
        d: "Hoje mostramos o valor total estimado de cada compra. A ideia é mostrar também o preço de cada item (por exemplo, de uma cadeira), para você montar sua proposta. Depende de uma fonte de dados que ainda estamos testando." },
      { t: "Quem ganhou compras parecidas, e por quanto", s: "planejado",
        d: "Para você saber quem são os concorrentes e que preços costumam vencer." },
      { t: "Resumo do edital em linguagem simples", s: "planejado",
        d: "O edital costuma ter dezenas de páginas. A ideia é destacar o que importa: prazo, documentos, como enviar a proposta." },
    ],
  },

  /* Página "Quem somos". Edite à vontade: texto puro, uma linha em branco separa parágrafos. */
  quemsomos: {
    titulo: "O governo compra todos os dias. Nós ajudamos você a ver onde, a tempo de participar.",
    intro: "O Avanço Licitações reúne em um só lugar as compras públicas que estão aceitando propostas, organiza tudo por produto, estado, valor e prazo, e leva você ao edital oficial.",
    oque: {
      titulo: "O que é uma licitação, em poucas palavras",
      paragrafos: [
        "Prefeituras, governos estaduais e órgãos federais precisam comprar de tudo: papel, cadeiras, computadores, material de limpeza, merenda, obras. Por lei, essa compra é aberta. O órgão publica um edital e qualquer empresa que cumpra as regras pode mandar uma proposta. Isso é uma licitação (ou uma dispensa, quando a lei permite um processo mais simples).",
        "Para o pequeno empresário, o difícil quase nunca é vender bem. É descobrir a compra a tempo. Os avisos ficam espalhados e, quando você encontra, o prazo às vezes está acabando. É esse problema que o Avanço Licitações quer resolver.",
      ],
    },
    objetivo: {
      titulo: "Nosso objetivo",
      texto: "Fazer com que empresas pequenas e médias, e quem está pensando em abrir uma, encontrem as compras públicas certas a tempo de participar, sem precisar vasculhar dezenas de portais.",
    },
    passos: [
      { t: "Buscamos no PNCP", d: "O site confere o Portal Nacional de Contratações Públicas, a base oficial do governo, de hora em hora. O que acabou de ser publicado ganha a marca “Nova”." },
      { t: "Organizamos para você", d: "Separamos por categoria, estado, tipo (produtos, serviços ou obras), valor e prazo, para você ver só o que interessa." },
      { t: "Você escolhe o que importa", d: "Filtre pelo que a sua empresa vende, acompanhe as oportunidades de interesse e veja o que costuma ser exigido para participar." },
      { t: "Você envia a proposta", d: "Levamos você ao edital oficial e ao sistema onde a disputa acontece. A proposta é sua e é feita direto com o órgão." },
    ],
    publico: [
      { t: "Empresas que já vendem ao governo", d: "Encontre mais compras, mais cedo, e acompanhe cada uma até o resultado." },
      { t: "MEI e pequenas empresas que querem começar", d: "Veja quais órgãos compram o que você vende e quanto costumam gastar, antes de investir tempo em uma proposta." },
      { t: "Quem ainda não tem empresa", d: "Use a pesquisa de produtos, sem cadastro, para medir a demanda antes de abrir o negócio." },
    ],
    fazemos: [
      "Reunimos compras públicas de 15 categorias em um só lugar.",
      "Mostramos a data limite, o valor estimado e o órgão que está comprando.",
      "Indicamos se a compra é de produtos, serviços ou obras.",
      "Explicamos, em cada oportunidade, o que costuma ser pedido para participar.",
      "Deixamos qualquer pessoa pesquisar quanto o governo compra de um produto.",
    ],
    naoFazemos: [
      "Não somos um órgão do governo.",
      "Não participamos das licitações por você nem enviamos propostas em seu nome.",
      "Não garantimos que você vai ganhar.",
      "Não substituímos a leitura do edital: confirme sempre as regras no documento oficial.",
      "Não mostramos todas as compras do país, só as do PNCP, nas categorias que acompanhamos. A classificação é automática e pode errar.",
    ],
    fonte: "Todos os dados vêm do PNCP (pncp.gov.br), o portal oficial das compras públicas do Brasil, que publica dados abertos. Cada oportunidade tem link para o edital original.",
    principios: [
      { t: "Clareza", d: "Texto simples, sem juridiquês. Quando algo não é certo, a gente diz." },
      { t: "Honestidade sobre o que funciona", d: "A página de Planos mostra o que já existe e o que ainda está em construção." },
      { t: "Respeito pelos seus dados", d: "Hoje você usa o site sem cadastro, e o que você acompanha fica só no seu navegador. Quando houver conta, vamos explicar o que guardamos e por quê." },
    ],
    // Preencha para mostrar a seção "Quem está por trás": nome da empresa, quem são vocês, cidade, CNPJ etc.
    equipe: "",
  },
};
