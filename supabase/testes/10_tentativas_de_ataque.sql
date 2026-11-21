\set ON_ERROR_STOP off
\pset format unaligned
\pset tuples_only on
-- dados de preparação (como administrador)
insert into auth.users(id,email) values ('aaaaaaaa-0000-0000-0000-00000000000a','a@teste'),('bbbbbbbb-0000-0000-0000-00000000000b','b@teste');
insert into oportunidades(numero_controle_pncp,objeto,uf) values ('op-1','cadeira','SP');
insert into favoritos(usuario_id,numero_controle_pncp) values ('bbbbbbbb-0000-0000-0000-00000000000b','op-1');
insert into buscas_salvas(usuario_id,nome,filtros) values ('bbbbbbbb-0000-0000-0000-00000000000b','busca do B','{}');

\echo === ANÔNIMO (visitante sem login)
set role anon; select set_config('request.jwt.claim.sub','',false);
\echo [esperado: 1] ler oportunidades:
select count(*) from oportunidades;
\echo [esperado: ERRO] inserir oportunidade falsa:
insert into oportunidades(numero_controle_pncp,objeto) values ('falsa','x');
\echo [esperado: ERRO] apagar oportunidades:
delete from oportunidades;
\echo [esperado: ERRO] atualizar oportunidades:
update oportunidades set objeto='hackeado';
\echo [esperado: 0] ver perfis:
select count(*) from perfis;
\echo [esperado: ERRO] criar perfil:
insert into perfis(id) values ('aaaaaaaa-0000-0000-0000-00000000000a');
\echo [esperado: 1] ver resumo (visão pública):
select count(*)>=0 from resumo_geral;
reset role;

\echo === USUÁRIO A (logado)
set role authenticated; select set_config('request.jwt.claim.sub','aaaaaaaa-0000-0000-0000-00000000000a',false);
\echo [esperado: 1] ver o próprio perfil:
select count(*) from perfis;
\echo [esperado: UPDATE 1] mudar o próprio perfil (tipo, razão):
update perfis set tipo='empresa', razao_social='Minha Loja' where id=auth.uid();
\echo [esperado: ERRO] SE DAR O PLANO PAGO (update):
update perfis set plano='premium' where id=auth.uid();
\echo [esperado: ERRO] SE DAR O PLANO PAGO (insert/upsert):
insert into perfis(id,plano) values (auth.uid(),'premium') on conflict (id) do update set plano=excluded.plano;
\echo [esperado: ok] upsert como o site faz (merge-duplicates, com id na lista):
insert into perfis(id,tipo,razao_social,cnpj,ufs_interesse,categorias_interesse,palavras_chave,valor_min,valor_max)
 values (auth.uid(),'empresa','Loja A','12345678000199','{SP}','{mobiliario}','{cadeira}',null,null)
 on conflict (id) do update set id=excluded.id,tipo=excluded.tipo,razao_social=excluded.razao_social,cnpj=excluded.cnpj,ufs_interesse=excluded.ufs_interesse,categorias_interesse=excluded.categorias_interesse,palavras_chave=excluded.palavras_chave,valor_min=excluded.valor_min,valor_max=excluded.valor_max;
\echo [esperado: ERRO] roubar a linha de B (mudar id para o de B):
update perfis set id='bbbbbbbb-0000-0000-0000-00000000000b' where id=auth.uid();
\echo [esperado: ERRO] criar perfil em nome de B:
insert into perfis(id) values ('bbbbbbbb-0000-0000-0000-00000000000b');
\echo [esperado: UPDATE 0] alterar perfil de B:
update perfis set razao_social='invadido' where id='bbbbbbbb-0000-0000-0000-00000000000b';
\echo [esperado: DELETE 0] apagar perfil de B:
delete from perfis where id='bbbbbbbb-0000-0000-0000-00000000000b';
\echo [esperado: 0] ver favoritos de B:
select count(*) from favoritos;
\echo [esperado: 0] ver buscas salvas de B:
select count(*) from buscas_salvas;
\echo [esperado: ERRO] gravar favorito em nome de B:
insert into favoritos(usuario_id,numero_controle_pncp) values ('bbbbbbbb-0000-0000-0000-00000000000b','op-1');
\echo [esperado: ERRO] apagar oportunidades:
delete from oportunidades;
\echo [esperado: ERRO] inserir oportunidade:
insert into oportunidades(numero_controle_pncp,objeto) values ('falsa2','x');
\echo [esperado: ERRO] razão social gigante (201+ caracteres):
update perfis set razao_social=repeat('x',500) where id=auth.uid();
\echo [esperado: ERRO] busca salva com nome gigante:
insert into buscas_salvas(usuario_id,nome,filtros) values (auth.uid(),repeat('x',300),'{}');
\echo [esperado: ERRO] busca salva com filtros gigantes:
insert into buscas_salvas(usuario_id,nome,filtros) values (auth.uid(),'ok',jsonb_build_object('x',repeat('y',9000)));
\echo [esperado: ok] busca salva normal:
insert into buscas_salvas(usuario_id,nome,filtros) values (auth.uid(),'minha busca','{"uf":"SP"}');
\echo [esperado: ERRO] ler a tabela de usuários do sistema (auth.users):
select count(*) from auth.users;
reset role;

\echo === CONFERÊNCIA FINAL (como administrador): plano de A e B continuam 'gratis'?
select id, plano, razao_social from perfis order by id;
\echo === EXTRA: CNPJ
set role authenticated; select set_config('request.jwt.claim.sub','aaaaaaaa-0000-0000-0000-00000000000a',false);
\echo [esperado: ERRO] CNPJ com letras/formato errado:
update perfis set cnpj='<script>alert(1)</script>' where id=auth.uid();
\echo [esperado: UPDATE 1] CNPJ só dígitos:
update perfis set cnpj='12345678000199' where id=auth.uid();
reset role;
