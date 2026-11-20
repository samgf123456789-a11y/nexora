# NEXORA Intelligence

Plataforma de inteligência comercial em compras públicas.

Duas portas de entrada:
- **Empresas:** radar de oportunidades abertas, filtros, compatibilidade com o perfil, relatórios.
- **Quem ainda não tem empresa:** a aba **Pesquisar produtos** mostra quanto o governo compra de um produto, onde e quem compra, sem login.

## Categorias cobertas (15)

Escritório e papelaria · Mobiliário · Informática e impressão · Software e serviços de TI · Limpeza e higiene · Alimentos e bebidas · Saúde e medicamentos · Construção e obras · Veículos e combustíveis · Uniformes e EPI · Educação e esporte · Elétrica e telecomunicações · Ferramentas, máquinas e agro · Casa, copa e eletrodomésticos · Serviços gerais e terceirizados.

No perfil da empresa há 12 **tipos de empresa** (papelaria, móveis, TI, saúde, construção…) que marcam as categorias sugeridas.

## Como usar no Windows (sem programar)

1. Instale o Python (python.org/downloads, marcando "Add python.exe to PATH") e extraia esta pasta.
2. **Coletar dados reais:** dê dois cliques em `coletar_abertas.bat`. Leva de 10 a 30 minutos para o Brasil todo.
3. **Somar histórico (opcional):** `coletar_historico.bat` acrescenta as compras publicadas nos últimos 30 dias, para a pesquisa de produtos ter mais referência.
4. **Ver o site:** em um terminal aberto nesta pasta, rode `cd web` e depois `python -m http.server 8000`, e abra http://localhost:8000. Aperte Ctrl+F5 depois de cada coleta.

Para coletar só alguns estados ou modalidades:
```
python collector/pncp_collector.py --modo abertas --ufs SP,MG,RJ --modalidades 6,8
```

Opções do coletor: `--ufs`, `--modalidades`, `--modo abertas|publicacao`, `--dias`, `--acrescentar` (soma ao arquivo existente), `--incluir-outros` (guarda também compras que não caem em nenhuma categoria; a base fica bem maior), `--limite-paginas` (para testes), `--memoria` (usa o JSON existente: marca o que é novo e, em coleta leve ou com falhas, não perde dados).

**Reclassificar sem coletar de novo** (leva segundos, não usa internet): depois de mudar as palavras em `collector/categorias.py`, ou ao atualizar de uma versão antiga que não tinha o campo `tipo`, rode:
```
python collector/pncp_collector.py --reclassificar
```

## Ajuda, acompanhamento e planos

- **Central de ajuda** (`#ajuda`): 25 perguntas e respostas com busca. Os textos ficam em `web/conteudo.js` e podem ser editados sem mexer no código (texto puro; linha em branco separa parágrafos).
- **Minhas oportunidades** (`#acompanhar`): botão "Acompanhar" em cada oportunidade; situação (interesse, preparando, enviada, ganhei, não ganhei) e anotações. **Fica salvo só no navegador**; versão na nuvem depende do login. A segurança de um plano pago não pode ficar só no site: a liberação por plano precisa de login e banco (Supabase) para valer.
- **Planos** (`#planos`): mostra o que já funciona e o que ainda não, com selos. Sem preços, porque ainda não foram validados. Para ativar os botões "Enviar uma dúvida" e "Quero ser avisado", preencha `CONTATO_EMAIL` em `web/config.js`.

## No Radar

Cada oportunidade mostra o **tipo** (compra de produtos, serviços ou obras), o botão **Ver edital** (PNCP), o botão **Enviar proposta** (sistema onde a disputa acontece, quando o órgão informou) e o guia **O que você precisa para participar** (documentos comuns e passo a passo). O guia é genérico e não substitui o edital.

O tipo é **inferido do texto** do objeto, porque o PNCP só informa isso por item. Objetos que misturam compra e serviço podem cair no tipo errado.

## O que já foi comprovado e o que não foi

| Parte | Estado |
|---|---|
| Interface (painel, radar, pesquisa, relatórios, conta) | Testada no navegador, inclusive no celular |
| Classificador de categorias e de tipo | 23 testes automáticos passando; revisão com dados reais feita por amostragem, sem medir a taxa de erro |
| Coletor, modo `abertas` | **Testado com a API real** (Brasil todo: 30.834 compras lidas, 19.301 guardadas em 18/11/2026) |
| Coletor, modos `publicacao` e coleta nacional completa | **Ainda não testados** |
| Supabase (login e banco) | Escrito, não executado |
| Coleta diária (GitHub Actions) | Executada com sucesso 2 vezes (~50 min cada) |
| Coleta de hora em hora, marca "Nova", memória entre execuções | Lógica coberta por testes automáticos e interface testada; **a rotina horária no GitHub ainda não foi executada** |

## Automatizar a coleta

**Opção A: no seu computador (rápida, mas só roda com o PC ligado).** Abra o Prompt de Comando e rode, trocando o caminho pelo da sua pasta e a hora por um horário em que o computador costuma estar ligado:
```
schtasks /create /tn "NEXORA coleta diaria" /tr "\"C:\Users\SEU_USUARIO\Downloads\nexora_v3\nexora\coletar_agendado.bat\"" /sc daily /st 08:00
```
Cada execução registra o resultado em `coleta_log.txt`. Para testar na hora: `schtasks /run /tn "NEXORA coleta diaria"`. Para remover: `schtasks /delete /tn "NEXORA coleta diaria" /f`. O site local ainda precisa do servidor ligado (`python -m http.server`).

**Opção B: na internet (recomendada, não depende do seu computador).** O arquivo `.github/workflows/publicar.yml` publica o site no GitHub Pages, com link público, e o mantém atualizado: **coleta completa todo dia às 6h** (leva ~50 min) e **coleta leve de hora em hora** (só o que foi publicado nas últimas 24h, somado ao que já se sabe). Passo a passo:
1. Crie uma conta gratuita em github.com e um repositório **público** chamado `nexora`.
2. Envie o conteúdo desta pasta para o repositório (na página do repositório: "Add file" > "Upload files", arrastando as pastas `.github`, `collector`, `supabase` e `web`, mais o `README.md`). Se a pasta `.github` não for aceita pelo arrastar, crie o arquivo `.github/workflows/publicar.yml` pelo botão "Create new file" e cole o conteúdo.
3. Em **Settings > Pages**, escolha **Source: GitHub Actions**.
4. Em **Actions > Coletar e publicar o site > Run workflow**, rode uma vez. O link do site aparece no final.
5. Depois disso ele roda sozinho. Compras que apareceram nas últimas 24h ganham a marca **Nova** no Radar (e há o filtro "Só as novas"). A hora de atualização aparece na tela; se alguma consulta ao PNCP falhar, o site mostra o aviso "Atualização incompleta" e nada que já estava na base é perdido.
6. Para forçar uma coleta completa na hora: Actions > Run workflow, marcando "Forçar a coleta completa".

**Como funciona a memória:** o resultado de cada execução fica no cache do GitHub (não no repositório). O cache some se ficar 7 dias sem uso; nesse caso a próxima execução faz a coleta completa sozinha. O GitHub pode atrasar execuções agendadas em horários de pico, então "de hora em hora" é aproximado. Em repositório público, agendamentos são pausados após 60 dias sem atividade no repositório.

**Parcialmente testado:** o GitHub roda nos EUA, e eu não sei se o PNCP aceita acessos de fora do Brasil. Se a coleta falhar lá, o site é publicado com os dados que já estiverem no repositório (suba o seu `web/data/oportunidades.json` junto para ter uma base inicial) e aparece um aviso na aba Actions. Nesse caso, use a Opção A.

Com o site público, quem acessar vê todos os dados e tudo o que está no repositório. Para a versão paga, a hospedagem e o login terão de mudar.

## Ativando login e banco (Supabase)

1. Crie um projeto em supabase.com e execute `supabase/schema.sql` no SQL Editor.
2. Em `web/config.js`, preencha `SUPABASE_URL` e `SUPABASE_ANON_KEY` (a chave **anon**).
3. No GitHub, em Settings > Secrets, crie `SUPABASE_URL` e `SUPABASE_SERVICE_KEY`. A chave **service_role nunca vai no site**.

Sem Supabase, tudo funciona com o arquivo JSON e o perfil fica salvo só no navegador. Com a base nacional grande, o Supabase passa a ser a melhor opção (o JSON do site guarda o objeto resumido em 600 caracteres; o Supabase guarda inteiro).

## Limites conhecidos

- A pesquisa mostra **o valor total estimado de cada compra**, não o preço por item. A tela avisa isso.
- **Preço por item é possível, mas ainda não está feito.** O Compras.gov.br tem uma API de preços praticados (`modulo-pesquisa-preco/1_consultarMaterial`, até 500 registros por página), mas ela exige o **código CATMAT** do item e não aceita busca por texto. Falta descobrir como buscar o código a partir do nome do produto. É o melhor candidato para a próxima fase.
- A classificação é por palavras-chave e vai errar nos dois sentidos. Ajuste as listas em `collector/categorias.py`. Se criar uma categoria nova, inclua o mesmo id em `web/app.js` (um teste avisa se esquecer).
- Por padrão o coletor descarta compras que não caem em nenhuma categoria. A pesquisa só encontra o que estiver na base.
- Planos pagos, cobrança e alertas por e-mail estão previstos no schema, mas ainda não têm tela nem envio.
- Antes de cobrar, valide o preço com empresas reais e confira os termos de uso dos dados do PNCP.

## Estrutura

```
coletar_abertas.bat / coletar_historico.bat   atalhos para Windows
collector/   coletor Python (só biblioteca padrão) e classificador
supabase/    schema.sql
web/         site estático (HTML, CSS e JS puros)
.github/     automação diária
```
