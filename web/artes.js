/* Ilustrações originais do Avanço Licitações, uma por tela.
   Para trocar por uma foto real: no app.js, a função arte(chave) devolve o desenho;
   basta devolver '<img src="fotos/sua-foto.jpg" alt="...">' no lugar. */
(function () {
  const quadro = (corpo) =>
    `<svg viewBox="0 0 320 180" aria-hidden="true" focusable="false"><ellipse cx="162" cy="98" rx="140" ry="76" class="fs"/>${corpo}</svg>`;

  window.ARTES = {
    /* Quem somos: prédio público, proposta e carimbo */
    quemsomos: quadro(`
      <path d="M64 74L130 38l66 36z" class="x fs"/>
      <rect x="68" y="74" width="124" height="10" class="x fg"/>
      <rect x="78" y="84" width="12" height="46" class="x fp"/><rect x="102" y="84" width="12" height="46" class="x fp"/><rect x="126" y="84" width="12" height="46" class="x fp"/><rect x="150" y="84" width="12" height="46" class="x fp"/><rect x="174" y="84" width="12" height="46" class="x fp"/>
      <rect x="62" y="130" width="136" height="9" class="x fs"/><rect x="54" y="139" width="152" height="10" class="x fy"/>
      <path d="M130 38V16" class="x" style="stroke-width:3"/><path d="M130 16l22 6-22 8z" class="x fr"/>
      <path d="M204 104h14" class="x" style="stroke-width:3"/><path d="M214 98l8 6-8 6" class="x" style="stroke-width:3"/>
      <rect x="226" y="62" width="62" height="82" rx="5" class="x fp"/>
      <path d="M236 78h42M236 90h42M236 102h26" class="x"/>
      <g transform="rotate(-12 268 130)"><circle cx="268" cy="130" r="17" class="x sr fp" style="stroke-width:3"/><path d="M260 130l6 6 11-12" class="x sr" style="stroke-width:3.4"/></g>`),

    /* Painel: calendário de prazos, relatório e carimbo */
    painel: quadro(`
      <rect x="62" y="30" width="112" height="134" rx="6" class="x fp"/>
      <path d="M78 52h56M78 66h80M78 80h64" class="x"/>
      <rect x="80" y="112" width="14" height="30" class="x fs"/><rect x="100" y="98" width="14" height="44" class="x fg"/><rect x="120" y="120" width="14" height="22" class="x fs"/><rect x="140" y="88" width="14" height="54" class="x fy"/>
      <rect x="150" y="48" width="108" height="96" rx="6" class="x fp"/>
      <path d="M150 54a6 6 0 0 1 6-6h96a6 6 0 0 1 6 6v20H150z" class="x fg"/>
      <path d="M176 42v12M232 42v12" class="x"/>
      <path d="M166 90h12M190 90h12M214 90h12M238 90h6M166 112h12M190 112h12M214 112h12" class="x"/>
      <rect x="186" y="80" width="24" height="20" rx="4" class="x fy"/>
      <g transform="rotate(-14 98 138)"><circle cx="98" cy="138" r="27" class="x sr fp" style="stroke-width:3.4"/><path d="M85 138l9 9 17-19" class="x sr" style="stroke-width:4"/></g>`),

    /* Radar: mapa com alcance e alfinetes */
    radar: quadro(`
      <rect x="48" y="24" width="224" height="134" rx="10" class="x fp"/>
      <path d="M104 24v134M160 24v134M216 24v134M48 69h224M48 113h224" class="sl x" style="stroke-width:1.5;stroke:var(--line)"/>
      <circle cx="160" cy="91" r="52" class="x"/><circle cx="160" cy="91" r="33" class="x"/><circle cx="160" cy="91" r="15" class="x"/>
      <path d="M160 91L212 91A52 52 0 0 0 197 54Z" class="fg" style="opacity:.4"/>
      <path d="M160 91L197 54" class="x" style="stroke-width:3"/><circle cx="160" cy="91" r="5" class="fk"/>
      <g transform="translate(112 66)"><path d="M0 0L-9 -15A11 11 0 1 1 9 -15Z" class="x fy"/><circle cx="0" cy="-22" r="4" class="fp"/></g>
      <g transform="translate(222 122)"><path d="M0 0L-9 -15A11 11 0 1 1 9 -15Z" class="x fr"/><circle cx="0" cy="-22" r="4" class="fp"/></g>
      <g transform="translate(128 140)"><path d="M0 0L-9 -15A11 11 0 1 1 9 -15Z" class="x fg"/><circle cx="0" cy="-22" r="4" class="fp"/></g>`),

    /* Pesquisa: lupa sobre cadeira, resma de papel e caixa */
    pesquisa: quadro(`
      <rect x="64" y="58" width="10" height="56" rx="4" class="x fg"/>
      <rect x="64" y="110" width="48" height="9" rx="3" class="x fy"/>
      <path d="M70 119v28M106 119v28" class="x" style="stroke-width:3.4"/>
      <rect x="132" y="104" width="62" height="44" rx="3" class="x fp"/>
      <rect x="132" y="118" width="62" height="14" class="x fy"/>
      <rect x="206" y="92" width="58" height="56" rx="3" class="x fs"/>
      <path d="M206 108h58M235 92v16" class="x"/>
      <circle cx="196" cy="80" r="36" class="x" style="fill:#fff;fill-opacity:.55;stroke-width:4"/>
      <path d="M180 66a22 22 0 0 1 14-8" class="x sw" style="stroke-width:4"/>
      <path d="M222 108l32 34" class="x" style="stroke-width:9"/>
      <text x="184" y="92" font-size="30" class="fg">R$</text>`),

    /* Minhas oportunidades: quadro com colunas e cartões */
    acompanhar: quadro(`
      <rect x="44" y="30" width="232" height="126" rx="8" class="x fp"/>
      <path d="M121 30v126M198 30v126" class="x" style="stroke-width:1.5;stroke:var(--line)"/>
      <rect x="54" y="40" width="58" height="9" rx="3" class="x fy"/><rect x="131" y="40" width="58" height="9" rx="3" class="x fs"/><rect x="208" y="40" width="58" height="9" rx="3" class="x fg"/>
      <rect x="54" y="58" width="58" height="30" rx="4" class="x fs"/><path d="M60 68h40M60 78h26" class="x"/>
      <rect x="54" y="96" width="58" height="30" rx="4" class="x fs"/><path d="M60 106h40M60 116h20" class="x"/>
      <rect x="131" y="58" width="58" height="30" rx="4" class="x fp"/><path d="M137 68h40M137 78h30" class="x"/>
      <rect x="208" y="58" width="58" height="30" rx="4" class="x fp"/><circle cx="222" cy="73" r="7" class="x fg"/><path d="M219 73l3 3 5-6" class="x sw" style="stroke-width:2.2"/><path d="M234 70h24M234 78h16" class="x"/>
      <path d="M244 16v36l11-9 11 9V16z" class="x fr"/>`),

    /* Relatórios: folha com gráficos */
    relatorios: quadro(`
      <rect x="92" y="20" width="136" height="148" rx="6" class="x fp"/>
      <path d="M108 40h60M108 52h92" class="x"/>
      <path d="M108 130h104" class="x"/>
      <rect x="112" y="104" width="18" height="26" class="x fs"/><rect x="136" y="86" width="18" height="44" class="x fg"/><rect x="160" y="110" width="18" height="20" class="x fs"/><rect x="184" y="72" width="18" height="58" class="x fy"/>
      <circle cx="234" cy="136" r="27" class="x fp"/>
      <path d="M234 136V109A27 27 0 0 1 258 148Z" class="x fg"/><path d="M234 136L258 148A27 27 0 0 1 222 162Z" class="x fy"/>
      <path d="M214 14v26a6 6 0 0 0 12 0V18" class="x"/>`),

    /* Planos: degraus com bandeira (avanço) */
    planos: quadro(`
      <rect x="56" y="118" width="64" height="38" class="x fs"/>
      <rect x="120" y="92" width="64" height="64" class="x fg"/>
      <rect x="184" y="66" width="64" height="90" class="x fy"/>
      <path d="M44 156h220" class="x" style="stroke-width:3"/>
      <path d="M216 66V30" class="x" style="stroke-width:3"/>
<path d="M216 30l32 9-32 11z" class="x fr"/>
      <path d="M152 118l8 8 14-16" class="x sw" style="stroke-width:3.4"/>
      <circle cx="88" cy="137" r="9" class="x fy"/>`),

    /* Ajuda: conversa com pergunta e resposta */
    ajuda: quadro(`
      <path d="M68 40h104a12 12 0 0 1 12 12v44a12 12 0 0 1-12 12H100l-20 20v-20H68a12 12 0 0 1-12-12V52a12 12 0 0 1 12-12z" class="x fp"/>
      <text x="104" y="92" font-size="52" class="fg">?</text>
      <path d="M144 96h104a12 12 0 0 1 12 12v32a12 12 0 0 1-12 12h-14v18l-20-18H144a12 12 0 0 1-12-12v-32a12 12 0 0 1 12-12z" class="x fg"/>
      <path d="M170 124l11 11 24-24" class="x sw" style="stroke-width:5"/>
      <circle cx="244" cy="50" r="9" class="x fy"/>`),

    /* Minha conta: crachá da empresa */
    conta: quadro(`
      <rect x="84" y="36" width="152" height="114" rx="10" class="x fp"/>
      <rect x="146" y="26" width="28" height="14" rx="7" class="x fs"/>
      <circle cx="122" cy="84" r="17" class="x fs"/>
      <path d="M96 124c2-18 46-18 48 0z" class="x fg"/>
      <path d="M164 74h58M164 88h44M164 102h52" class="x"/>
      <path d="M84 124h152v16a10 10 0 0 1-10 10H94a10 10 0 0 1-10-10z" class="x fy"/>
      <path d="M100 137h30" class="x"/>`)
  };
})();
