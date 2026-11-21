-- Avanço Licitações — esquema do banco (PostgreSQL / Supabase)
-- Execute no SQL Editor do Supabase.

create extension if not exists unaccent;
create extension if not exists pg_trgm;

-- ---------------------------------------------------------------
-- Oportunidades coletadas do PNCP
-- ---------------------------------------------------------------
create table if not exists oportunidades (
  numero_controle_pncp   text primary key,
  numero_compra          text,
  ano_compra             int,
  processo               text,
  modalidade_id          int,
  modalidade_nome        text,
  situacao_nome          text,
  objeto                 text not null,
  informacao_complementar text,
  srp                    boolean,
  valor_estimado         numeric(18,2),
  valor_homologado       numeric(18,2),
  data_abertura_proposta timestamptz,
  data_encerramento_proposta timestamptz,
  data_publicacao        date,
  data_atualizacao       timestamptz,
  orgao_cnpj             text,
  orgao_nome             text,
  esfera                 text,           -- F, E, M, D
  uf                     char(2),
  municipio              text,
  codigo_ibge            text,
  categoria              text,           -- escritorio_papelaria, mobiliario, informatica_impressao, outros
  subcategorias          text[] default '{}',
  tipo                   text,           -- produtos, servicos, obras (inferido do texto)
  palavras_encontradas   text[] default '{}',
  link_pncp              text,
  link_origem            text,
  coletado_em            timestamptz default now()
);

create index if not exists idx_oport_uf        on oportunidades (uf);
create index if not exists idx_oport_categoria on oportunidades (categoria);
create index if not exists idx_oport_tipo      on oportunidades (tipo);
create index if not exists idx_oport_prazo     on oportunidades (data_encerramento_proposta);
create index if not exists idx_oport_valor     on oportunidades (valor_estimado);
create index if not exists idx_oport_objeto_trgm
  on oportunidades using gin (objeto gin_trgm_ops);

-- Se a tabela já existia antes desta versão, rode também:
--   alter table oportunidades add column if not exists tipo text;

-- ---------------------------------------------------------------
-- Perfis de empresa (área do cliente)
-- ---------------------------------------------------------------
create table if not exists perfis (
  id            uuid primary key references auth.users (id) on delete cascade,
  tipo          text not null default 'visitante' check (tipo in ('visitante','empresa')),
  razao_social  text,
  cnpj          text,
  ufs_interesse text[] default '{}',
  categorias_interesse text[] default '{}',
  palavras_chave text[] default '{}',
  valor_min     numeric(18,2),
  valor_max     numeric(18,2),
  plano         text not null default 'gratis' check (plano in ('gratis','starter','business','premium')),
  criado_em     timestamptz default now()
);

-- Cria o perfil automaticamente quando alguém se cadastra
create or replace function public.criar_perfil() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.perfis (id) values (new.id) on conflict do nothing;
  return new;
end $$;

drop trigger if exists ao_criar_usuario on auth.users;
create trigger ao_criar_usuario after insert on auth.users
  for each row execute function public.criar_perfil();

-- ---------------------------------------------------------------
-- Oportunidades salvas e alertas
-- ---------------------------------------------------------------
create table if not exists favoritos (
  usuario_id uuid references auth.users (id) on delete cascade,
  numero_controle_pncp text references oportunidades (numero_controle_pncp) on delete cascade,
  criado_em timestamptz default now(),
  primary key (usuario_id, numero_controle_pncp)
);

create table if not exists buscas_salvas (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid references auth.users (id) on delete cascade,
  nome text not null,
  filtros jsonb not null,
  alerta_email boolean default false,
  criado_em timestamptz default now()
);

-- ---------------------------------------------------------------
-- Segurança (Row Level Security)
-- ---------------------------------------------------------------
alter table oportunidades  enable row level security;
alter table perfis         enable row level security;
alter table favoritos      enable row level security;
alter table buscas_salvas  enable row level security;

-- Dados públicos do PNCP: qualquer pessoa pode ler (inclusive quem não tem empresa).
-- Somente o coletor, com a chave de serviço, escreve.
drop policy if exists "leitura publica" on oportunidades;
create policy "leitura publica" on oportunidades for select using (true);

drop policy if exists "perfil proprio" on perfis;
create policy "perfil proprio" on perfis for all
  using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "favoritos proprios" on favoritos;
create policy "favoritos proprios" on favoritos for all
  using (auth.uid() = usuario_id) with check (auth.uid() = usuario_id);

drop policy if exists "buscas proprias" on buscas_salvas;
create policy "buscas proprias" on buscas_salvas for all
  using (auth.uid() = usuario_id) with check (auth.uid() = usuario_id);

-- ---------------------------------------------------------------
-- Views para o dashboard
-- ---------------------------------------------------------------
create or replace view resumo_geral as
select
  count(*)                                            as total,
  count(*) filter (where data_encerramento_proposta > now()) as abertas,
  coalesce(sum(valor_estimado) filter (where data_encerramento_proposta > now()), 0) as valor_abertas,
  count(distinct uf)                                  as ufs,
  count(distinct codigo_ibge)                         as municipios
from oportunidades;

create or replace view resumo_por_uf as
select uf, count(*) as total, coalesce(sum(valor_estimado),0) as valor
from oportunidades
where data_encerramento_proposta > now()
group by uf order by total desc;

create or replace view resumo_por_categoria as
select categoria, count(*) as total, coalesce(sum(valor_estimado),0) as valor
from oportunidades
where data_encerramento_proposta > now()
group by categoria order by total desc;
