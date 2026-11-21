# Segurança do Supabase: o que fazer antes de ligar o login

O Supabase ainda não está ativado. Quando for, siga esta lista na ordem. Os nomes dos menus podem mudar um pouco
com o tempo; se algo não estiver onde está escrito, procure pelo nome da opção.

## 1. Criar o projeto e carregar o banco
1. Crie o projeto no Supabase e guarde a senha do banco em um gerenciador de senhas (não em arquivo no computador).
2. No **SQL Editor**, execute `supabase/schema.sql` inteiro.
3. **Teste as proteções no projeto real** (o teste do repositório foi feito em um banco simulado):
   crie dois usuários de teste e repita as tentativas de `supabase/testes/10_tentativas_de_ataque.sql`
   (usando o papel `authenticated` com o `sub` de cada usuário). Confira que ninguém altera o próprio `plano`
   e que um usuário não vê os dados do outro.

## 2. Chaves
- A chave **anon (public)** vai em `web/config.js`. Ela pode ser pública: quem protege os dados são as regras do banco.
- A chave **service_role** nunca vai no site, nem no repositório, nem em print. Só nos **Secrets** do GitHub
  (`SUPABASE_SERVICE_KEY`). A publicação do site é bloqueada automaticamente se uma chave service_role aparecer no site.
- Se uma chave vazar por qualquer motivo: Settings > API > gere uma nova (rotacione), atualize o Secret e avise quem usa.

## 3. Autenticação (Authentication > Settings/Providers)
- **Confirmação de e-mail**: ligada (só entra quem provou ser dono do e-mail).
- **Tamanho mínimo da senha**: 10 ou mais. Ative a proteção contra senhas vazadas, se o seu plano tiver.
- **Validade do link de redefinição de senha e do link de confirmação**: o mínimo útil (por exemplo, 1 hora ou menos).
- **Login anônimo**: desligado, a não ser que seja usado.
- **Site URL e Redirect URLs**: somente o endereço real do site. Nenhum curinga.
- **Limites de requisição (rate limits)**: reduza os de login, cadastro e envio de e-mail ao necessário.
- **CAPTCHA** no cadastro e no login (hCaptcha ou Cloudflare Turnstile): ative quando houver cadastros reais.
- **Verificação em duas etapas (MFA)**: ofereça para os clientes e exija para a sua própria conta.
- **Duração do token de acesso (JWT)**: mantenha curta (o padrão de 1 hora é razoável).

## 4. Banco de dados
- Nunca desligue o **Row Level Security** em nenhuma tabela.
- Toda tabela nova precisa de política própria e de `revoke`/`grant` explícitos: no Supabase, tabelas novas já nascem
  acessíveis a `anon` e `authenticated`.
- Ative os **backups** (e a recuperação a qualquer momento, se o plano permitir) e teste uma restauração.
- Limite os endereços que podem se conectar direto ao banco (Network Restrictions), se disponível.
- Veja os **logs** de autenticação e de API de vez em quando; procure muitos logins falhos ou acessos de outros países.

## 5. CORS
Pelo que sei, a API do Supabase aceita qualquer origem por padrão e não permite restringir. Isso não é uma falha:
a proteção é o token de login e o acesso por linha. Se um dia houver um servidor próprio (por exemplo, para pagamentos),
configure o CORS dele para aceitar **somente o domínio do site**.

## 6. Pagamentos (quando existirem)
- Use uma página de pagamento hospedada pelo provedor (Mercado Pago, Stripe, Pagar.me, etc.). Dados de cartão nunca
  passam pelo nosso site nem pelo nosso banco.
- O **preço e o plano são decididos no servidor**. Nunca aceite o valor vindo do navegador.
- O plano do cliente só muda quando o provedor avisa (webhook) e o servidor **confere a assinatura** do aviso.
  Trate avisos repetidos como o mesmo pagamento (idempotência).
- Só o servidor, com a chave service_role, altera a coluna `plano`. O usuário não consegue (testado).
- Guarde o registro de cada pagamento e de cada mudança de plano.

## 7. E-mails de alerta
- Configure **SPF, DKIM e DMARC** no domínio de envio, para o e-mail não cair em spam nem ser imitado.
- Todo e-mail precisa de link para **cancelar o aviso**. O cliente só recebe alertas se tiver aceitado (LGPD).
