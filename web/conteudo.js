/* Textos editáveis da NEXORA: Central de ajuda e página de Planos.
   Pode editar à vontade, sem mexer no app.js. Regras:
   - use só texto puro (sem HTML);
   - uma linha em branco dentro da resposta ("\n\n") vira um novo parágrafo;
   - mantenha as respostas honestas: onde a regra varia por edital, diga isso. */
window.NEXORA_CONTEUDO = {
  faq: [
    {
      grupo: "Começando",
      itens: [
        { p: "O que é a NEXORA?",
          r: "A NEXORA reúne compras públicas que estão aceitando propostas, organiza por categoria, estado, tipo, valor e prazo, e leva você ao edital oficial.\n\nNão somos um órgão do governo e não participamos das licitações por você. Mostramos onde estão as oportunidades." },
        { p: "Preciso ter empresa para usar?",
          r: "Não. A pesquisa de produtos é aberta a qualquer pessoa. Para participar de uma licitação, porém, é preciso ter CNPJ." },
        { p: "De onde vêm os dados?",
          r: "Do PNCP (Portal Nacional de Contratações Públicas), por meio da consulta pública que ele oferece. Confira sempre as informações no edital original, que é o documento válido." },
        { p: "Com que frequência os dados são atualizados?",
          r: "Depende de quando a coleta é executada. A data da última atualização aparece na tela de pesquisa. A atualização diária automática está nos planos, mas ainda não está no ar." },
        { p: "A NEXORA mostra todas as licitações do Brasil?",
          r: "Não. Mostramos compras com proposta em aberto, nas modalidades que coletamos e que se encaixam nas nossas categorias. Compras fora delas ficam de fora.\n\nAlém disso, nem toda compra pública é publicada no PNCP. Por isso, use a NEXORA como um ponto de partida, não como lista completa." },
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
          r: "É uma classificação que a NEXORA faz lendo o texto do objeto da compra, porque a lista do PNCP não informa isso. Pode errar em objetos que misturam compra e serviço. Confirme no edital." },
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
        { p: "Quando terei alertas por e-mail?",
          r: "Estão planejados para o plano pago e ainda não estão disponíveis. Veja a página Planos para acompanhar o que já existe e o que está em desenvolvimento." },
        { p: "A NEXORA garante que vou ganhar licitações?",
          r: "Não. Oferecemos informação e organização. Participar e ganhar depende da sua empresa, do preço, dos documentos e das regras de cada edital." },
      ],
    },
  ],

  // status: agora | parcial | andamento | planejado
  planos: {
    gratis: [
      { t: "Pesquisa de produtos: onde e quanto o governo compra", s: "agora" },
      { t: "Radar com filtros por estado, categoria, tipo, valor e prazo", s: "agora" },
      { t: "Guia “O que você precisa para participar” em cada oportunidade", s: "agora" },
      { t: "Exportar a lista em CSV", s: "agora" },
      { t: "Central de ajuda", s: "agora" },
    ],
    pago: [
      { t: "Acompanhamento das oportunidades (interesse, proposta, resultado)", s: "parcial",
        d: "Funciona hoje, salvo no navegador. A versão na nuvem, em qualquer aparelho, depende do login." },
      { t: "Alertas por e-mail com o que combina com o perfil da empresa", s: "planejado" },
      { t: "Atualização diária automática de todo o Brasil", s: "andamento",
        d: "A coleta já existe; falta publicar o site e agendar." },
      { t: "Relatórios personalizados em PDF", s: "parcial",
        d: "Hoje é possível imprimir ou salvar em PDF pelo navegador." },
      { t: "Preço de referência por item: quanto o governo pagou", s: "planejado",
        d: "Depende de uma fonte de dados que ainda estamos testando." },
      { t: "Vencedores e valores de compras parecidas", s: "planejado" },
      { t: "Resumo do edital em linguagem simples", s: "planejado" },
    ],
  },
};
