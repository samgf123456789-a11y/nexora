#!/usr/bin/env python3
"""Coletor Avanço Licitações — consulta a API pública do PNCP e grava oportunidades.

Usa apenas a biblioteca padrão do Python (sem pip install).

Fontes (API oficial de consulta, sem login):
  GET https://pncp.gov.br/api/consulta/v1/contratacoes/proposta
      -> contratações com recebimento de propostas em aberto
  GET https://pncp.gov.br/api/consulta/v1/contratacoes/publicacao
      -> contratações por data de publicação

Saídas:
  --saida json       grava web/data/oportunidades.json (padrão, não precisa de conta)
  --saida supabase   faz upsert na tabela `oportunidades` (SUPABASE_URL + SUPABASE_SERVICE_KEY)
  --saida ambos

Exemplos:
  python collector/pncp_collector.py --modo abertas --ufs SP,MG,RJ
  python collector/pncp_collector.py --modo publicacao --dias 7 --saida ambos
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from categorias import classificar, classificar_tipo  # noqa: E402

BASE = "https://pncp.gov.br/api/consulta/v1"
PORTAL = "https://pncp.gov.br/app/editais"
# 4 Concorrência eletrônica, 5 Concorrência presencial, 6 Pregão eletrônico,
# 7 Pregão presencial, 8 Dispensa de licitação, 12 Credenciamento
MODALIDADES_PADRAO = [4, 5, 6, 7, 8, 12]
OBJETO_MAX_JSON = 600  # o JSON do site guarda o objeto resumido; o Supabase guarda inteiro
TAMANHO_PAGINA = 50
UA = "AvancoLicitacoes/0.1 (coletor de dados abertos do PNCP)"


# ---------------------------------------------------------------- HTTP
def http_get_json(url: str, tentativas: int = 5, pausa: float = 1.5):
    """GET com retentativa. Retorna None em 204 (sem resultados)."""
    ultimo_erro = None
    for i in range(tentativas):
        req = urllib.request.Request(url, headers={"Accept": "application/json", "User-Agent": UA})
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                if resp.status == 204:
                    return None
                corpo = resp.read().decode("utf-8")
                return json.loads(corpo) if corpo.strip() else None
        except urllib.error.HTTPError as e:
            ultimo_erro = e
            if e.code in (429, 500, 502, 503, 504):
                time.sleep(pausa * (2 ** i))
                continue
            if e.code == 404:
                return None
            raise
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as e:
            ultimo_erro = e
            time.sleep(pausa * (2 ** i))
    raise RuntimeError(f"Falha ao consultar {url}: {ultimo_erro}")


def paginar(endpoint: str, params: dict, limite_paginas: int | None = None):
    """Itera todos os registros de um endpoint paginado."""
    pagina = 1
    while True:
        q = dict(params, pagina=pagina, tamanhoPagina=TAMANHO_PAGINA)
        url = f"{BASE}/{endpoint}?{urllib.parse.urlencode(q)}"
        dados = http_get_json(url)
        if not dados:
            return
        registros = dados.get("data", []) if isinstance(dados, dict) else dados
        if not registros:
            return
        yield from registros
        total_paginas = dados.get("totalPaginas") if isinstance(dados, dict) else None
        if total_paginas is not None and pagina >= int(total_paginas):
            return
        if limite_paginas and pagina >= limite_paginas:
            return
        if total_paginas is None and len(registros) < TAMANHO_PAGINA:
            return
        pagina += 1
        time.sleep(0.4)  # gentileza com o servidor público


# ---------------------------------------------------------------- normalização
def _data(valor):
    if not valor:
        return None
    for fmt in ("%Y-%m-%dT%H:%M:%S", "%Y-%m-%dT%H:%M:%S.%f", "%Y-%m-%d"):
        try:
            return datetime.strptime(valor[:26] if "." in valor else valor[:19], fmt).isoformat()
        except ValueError:
            continue
    return valor


def normalizar_registro(r: dict, incluir_outros: bool = False) -> dict | None:
    """Converte um registro do PNCP para a linha da tabela `oportunidades`.

    Retorna None quando o objeto não cai em nenhuma categoria conhecida
    (a menos que incluir_outros=True, que guarda tudo como categoria 'outros').
    """
    objeto = (r.get("objetoCompra") or "").strip()
    cls = classificar(objeto, r.get("informacaoComplementar"))
    if cls["categoria"] == "outros" and not incluir_outros:
        return None

    org = r.get("orgaoEntidade") or {}
    uni = r.get("unidadeOrgao") or {}
    cnpj = org.get("cnpj")
    ano = r.get("anoCompra")
    seq = r.get("sequencialCompra")
    link = f"{PORTAL}/{cnpj}/{ano}/{seq}" if cnpj and ano and seq else None
    publicacao = _data(r.get("dataPublicacaoPncp"))

    return {
        "numero_controle_pncp": r.get("numeroControlePNCP"),
        "numero_compra": r.get("numeroCompra"),
        "ano_compra": ano,
        "processo": r.get("processo"),
        "modalidade_id": r.get("modalidadeId"),
        "modalidade_nome": r.get("modalidadeNome"),
        "situacao_nome": r.get("situacaoCompraNome"),
        "objeto": objeto,
        "informacao_complementar": r.get("informacaoComplementar"),
        "srp": r.get("srp"),
        "valor_estimado": r.get("valorTotalEstimado"),
        "valor_homologado": r.get("valorTotalHomologado"),
        "data_abertura_proposta": _data(r.get("dataAberturaProposta")),
        "data_encerramento_proposta": _data(r.get("dataEncerramentoProposta")),
        "data_publicacao": publicacao[:10] if publicacao else None,
        "data_atualizacao": _data(r.get("dataAtualizacao")),
        "orgao_cnpj": cnpj,
        "orgao_nome": org.get("razaoSocial") or org.get("razaosocial") or org.get("razao_social")
                      or uni.get("nomeUnidade"),
        "esfera": org.get("esferaId"),
        "uf": uni.get("ufSigla"),
        "municipio": uni.get("municipioNome"),
        "codigo_ibge": str(uni.get("codigoIbge")) if uni.get("codigoIbge") is not None else None,
        "categoria": cls["categoria"],
        "subcategorias": cls["subcategorias"],
        "palavras_encontradas": cls["palavras"],
        "tipo": classificar_tipo(objeto, cls["categoria"], cls["subcategorias"]),
        "link_pncp": link,
        "link_origem": r.get("linkSistemaOrigem"),
    }


# ---------------------------------------------------------------- coleta
def coletar(modo: str, ufs: list[str | None], modalidades: list[int], dias: int,
            limite_paginas: int | None, verboso: bool = True, incluir_outros: bool = False,
            erros: list[str] | None = None) -> list[dict]:
    """Coleta no PNCP. Se `erros` for passada, recebe uma frase por consulta que falhou."""
    hoje = date.today()
    vistos: dict[str, dict] = {}
    total_lidos = 0

    for uf in ufs:
        for mod in modalidades:
            params: dict = {"codigoModalidadeContratacao": mod}
            if uf:
                params["uf"] = uf
            if modo == "abertas":
                endpoint = "contratacoes/proposta"
                params["dataFinal"] = (hoje + timedelta(days=180)).strftime("%Y%m%d")
            else:
                endpoint = "contratacoes/publicacao"
                params["dataInicial"] = (hoje - timedelta(days=dias)).strftime("%Y%m%d")
                params["dataFinal"] = hoje.strftime("%Y%m%d")

            lidos = aceitos = 0
            try:
                for reg in paginar(endpoint, params, limite_paginas):
                    lidos += 1
                    if verboso and lidos % 500 == 0:
                        print(f"    ... {lidos} lidos ({uf or 'BR'}, modalidade {mod})", flush=True)
                    linha = normalizar_registro(reg, incluir_outros)
                    if linha and linha["numero_controle_pncp"]:
                        vistos[linha["numero_controle_pncp"]] = linha
                        aceitos += 1
            except Exception as e:  # uma UF/modalidade com erro não derruba a coleta toda
                print(f"  ! {uf or 'BR'} modalidade {mod}: {e}", file=sys.stderr)
                if erros is not None:
                    erros.append(f"{uf or 'BR'}/modalidade {mod}: {str(e)[:120]}")
            total_lidos += lidos
            if verboso:
                print(f"  {uf or 'BR':>2} | modalidade {mod:>2} | lidos {lidos:>5} | relevantes {aceitos:>4}")

    if verboso:
        print(f"Total lido: {total_lidos} | oportunidades relevantes únicas: {len(vistos)}")
    return list(vistos.values())


# ---------------------------------------------------------------- saídas
def _agora_utc() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def _ler_oportunidades(caminho: Path) -> tuple[list[dict], dict]:
    try:
        pacote = json.loads(caminho.read_text(encoding="utf-8"))
        return pacote.get("oportunidades", []), pacote.get("coleta") or {}
    except (ValueError, OSError):
        return [], {}


def salvar_json(linhas: list[dict], caminho: Path, acrescentar: bool = False,
                memoria: bool = False, modo: str = "abertas", erros: list[str] | None = None) -> None:
    """Grava o JSON do site.

    acrescentar: junta ao arquivo existente (o mais novo vence).
    memoria: usa o arquivo existente como lembrança da última coleta para
      - marcar `primeiro_visto` (só o que realmente apareceu agora é "novo");
      - não perder dados: na coleta leve (modo publicacao) ou quando alguma consulta falhou,
        o que já estava no arquivo é mantido e só atualizado/acrescido.
    """
    caminho.parent.mkdir(parents=True, exist_ok=True)
    agora = _agora_utc()
    erros = erros or []
    antigas, meta_antiga = ([], {})
    if (acrescentar or memoria) and caminho.exists():
        antigas, meta_antiga = _ler_oportunidades(caminho)
    por_id_antigo = {o["numero_controle_pncp"]: o for o in antigas if o.get("numero_controle_pncp")}

    juntar = acrescentar or (memoria and (modo == "publicacao" or bool(erros)))
    if juntar:
        por_id = dict(por_id_antigo)
        por_id.update({o["numero_controle_pncp"]: o for o in linhas})  # o mais novo vence
        linhas = list(por_id.values())

    if memoria and por_id_antigo:  # na primeira vez não há "antes": nada é marcado como novo
        # Só é "novo" o que foi publicado há pouco: se uma coleta anterior falhou e deixou de ver
        # compras antigas, elas aparecem depois como desconhecidas, mas não são novidade.
        limite_pub = (date.today() - timedelta(days=2)).isoformat()
        for o in linhas:
            antigo = por_id_antigo.get(o["numero_controle_pncp"])
            recente = (o.get("data_publicacao") or "") >= limite_pub
            o["primeiro_visto"] = (antigo or {}).get("primeiro_visto") or (agora if (not antigo and recente) else None)
    linhas = [dict(o, objeto=(o["objeto"][:OBJETO_MAX_JSON] + "…") if len(o.get("objeto") or "") > OBJETO_MAX_JSON else o.get("objeto"),
                   informacao_complementar=None) for o in linhas]

    completa = modo == "abertas" and not erros
    coleta = {
        "modo": modo,
        "erros": erros[:30],
        "n_erros": len(erros),
        "parcial": bool(erros),
        "ultima_completa_em": agora if completa else meta_antiga.get("ultima_completa_em"),
    }
    pacote = {
        "gerado_em": agora,
        "fonte": "PNCP — API de consulta (dados abertos)",
        "total": len(linhas),
        "coleta": coleta,
        "oportunidades": sorted(linhas, key=lambda x: x.get("data_encerramento_proposta") or "9999"),
    }
    caminho.write_text(json.dumps(pacote, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    novas = sum(1 for o in linhas if o.get("primeiro_visto") == agora)
    print(f"JSON gravado em {caminho} ({len(linhas)} oportunidades, {novas} novas, {len(erros)} consultas com erro)")


def reclassificar(caminho: Path, incluir_outros: bool = False) -> int:
    """Reaplica categorias e tipo ao JSON que já existe, SEM acessar a internet.

    Útil depois de ajustar as listas de palavras em categorias.py: o resultado sai em segundos
    em vez de uma nova coleta de 30 minutos.
    """
    if not caminho.exists():
        raise SystemExit(f"Arquivo não encontrado: {caminho}. Rode a coleta antes.")
    antigas = json.loads(caminho.read_text(encoding="utf-8")).get("oportunidades", [])
    novas, descartadas = [], 0
    for o in antigas:
        cls = classificar(o.get("objeto"))
        if cls["categoria"] == "outros" and not incluir_outros:
            descartadas += 1
            continue
        o = dict(o, categoria=cls["categoria"], subcategorias=cls["subcategorias"],
                 palavras_encontradas=cls["palavras"],
                 tipo=classificar_tipo(o.get("objeto"), cls["categoria"], cls["subcategorias"]))
        novas.append(o)
    salvar_json(novas, caminho)
    print(f"Reclassificadas {len(novas)} oportunidades ({descartadas} saíram por não caber em nenhuma categoria).")
    return len(novas)


def validar_url_supabase(url: str) -> str:
    """A chave de serviço dá poder total sobre o banco: só é enviada a um endereço https do Supabase.
    Isso evita vazar a chave por engano (variável de ambiente errada ou trocada)."""
    p = urllib.parse.urlparse((url or "").strip())
    host = (p.hostname or "").lower()
    if p.scheme != "https" or not (host.endswith(".supabase.co") or host.endswith(".supabase.in")) or p.username or p.password:
        raise SystemExit("SUPABASE_URL precisa ser um endereço https://...supabase.co. A chave de serviço não foi enviada.")
    return f"https://{host}"


def enviar_supabase(linhas: list[dict]) -> None:
    url = os.environ.get("SUPABASE_URL")
    chave = os.environ.get("SUPABASE_SERVICE_KEY")
    if not url or not chave:
        raise SystemExit("Defina SUPABASE_URL e SUPABASE_SERVICE_KEY para usar --saida supabase.")
    url = validar_url_supabase(url)
    endpoint = f"{url.rstrip('/')}/rest/v1/oportunidades?on_conflict=numero_controle_pncp"
    for i in range(0, len(linhas), 200):
        lote = linhas[i:i + 200]
        req = urllib.request.Request(
            endpoint,
            data=json.dumps(lote).encode("utf-8"),
            method="POST",
            headers={
                "apikey": chave,
                "Authorization": f"Bearer {chave}",
                "Content-Type": "application/json",
                "Prefer": "resolution=merge-duplicates,return=minimal",
            },
        )
        try:
            urllib.request.urlopen(req, timeout=60).read()
        except urllib.error.HTTPError as e:
            raise SystemExit(f"Supabase recusou o lote {i // 200 + 1}: {e.code} {e.read().decode()[:300]}")
    print(f"Supabase: {len(linhas)} oportunidades gravadas/atualizadas")


# ---------------------------------------------------------------- CLI
def main(argv=None) -> int:
    p = argparse.ArgumentParser(description="Coletor de oportunidades do PNCP — Avanço Licitações")
    p.add_argument("--modo", choices=["abertas", "publicacao"], default="abertas",
                   help="abertas = propostas em aberto; publicacao = publicadas nos últimos --dias")
    p.add_argument("--ufs", default="", help="siglas separadas por vírgula (vazio = Brasil todo)")
    p.add_argument("--modalidades", default=",".join(map(str, MODALIDADES_PADRAO)),
                   help="códigos PNCP de modalidade (4, 6 e 8 por padrão)")
    p.add_argument("--dias", type=int, default=3, help="janela de publicação (modo publicacao)")
    p.add_argument("--limite-paginas", type=int, default=None, help="teto de páginas por consulta (testes)")
    p.add_argument("--incluir-outros", action="store_true",
                   help="guarda também compras que não caem em nenhuma categoria (base bem maior)")
    p.add_argument("--acrescentar", action="store_true",
                   help="junta ao arquivo JSON existente em vez de sobrescrever (útil para somar o histórico)")
    p.add_argument("--memoria", action="store_true",
                   help="usa o JSON existente como memória: marca o que é novo e não perde dados em coleta leve ou com falhas")
    p.add_argument("--reclassificar", action="store_true",
                   help="não coleta nada: reaplica categorias e tipo ao JSON existente (rápido, sem internet)")
    p.add_argument("--saida", choices=["json", "supabase", "ambos"], default="json")
    p.add_argument("--arquivo", default=str(Path(__file__).resolve().parent.parent / "web" / "data" / "oportunidades.json"))
    a = p.parse_args(argv)

    if a.reclassificar:
        reclassificar(Path(a.arquivo), a.incluir_outros)
        return 0

    ufs = [u.strip().upper() for u in a.ufs.split(",") if u.strip()] or [None]
    mods = [int(m) for m in a.modalidades.split(",") if m.strip()]

    print(f"Avanço Licitações coletor | modo={a.modo} | UFs={ufs} | modalidades={mods}")
    erros: list[str] = []
    linhas = coletar(a.modo, ufs, mods, a.dias, a.limite_paginas, incluir_outros=a.incluir_outros, erros=erros)
    if erros:
        print(f"ATENÇÃO: {len(erros)} consulta(s) falharam; a coleta ficou parcial.", file=sys.stderr)

    if a.saida in ("json", "ambos"):
        salvar_json(linhas, Path(a.arquivo), a.acrescentar, a.memoria, a.modo, erros)
    if a.saida in ("supabase", "ambos"):
        enviar_supabase(linhas)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
