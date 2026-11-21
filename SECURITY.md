# Política de segurança

## Encontrou um problema de segurança?

Não abra uma "issue" pública com os detalhes. Use o botão **Report a vulnerability** na aba **Security** deste repositório
(denúncia privada do GitHub) ou escreva para o e-mail de contato do site. Responderemos o mais rápido possível.

## O que este projeto faz para se proteger

- O site é estático: não há servidor próprio nem banco de dados exposto na versão atual.
- Todo texto vindo do PNCP é tratado como não confiável e escapado antes de aparecer na tela.
- A Política de Segurança de Conteúdo (CSP) só deixa o navegador executar scripts do próprio site.
- Só links `http` e `https` são aceitos; links externos abrem com `noopener noreferrer`.
- A coleta de dados roda sem permissão de escrita no repositório; a publicação é uma etapa separada.
- Nenhuma senha ou chave fica no repositório. Chaves ficam apenas em "Secrets" do GitHub.
- No banco (Supabase), cada usuário só enxerga os próprios dados (Row Level Security), e o campo do plano
  só pode ser alterado pelo servidor.

## O que ainda não está pronto

Login, pagamento, e-mails e banco ainda não estão no ar. Essa parte terá nova revisão de segurança antes de ser lançada.
