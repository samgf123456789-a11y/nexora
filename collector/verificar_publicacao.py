#!/usr/bin/env python3
"""Confere a pasta do site ANTES de publicar (roda na automação do GitHub).

1. Arquivos que não deveriam ficar públicos (cópias como "app (1).js", backups, .env, .py, .sql, .pyc...)
   são REMOVIDOS da cópia que vai ao ar e geram um aviso. O repositório em si não é alterado.
2. Se aparecer uma chave secreta (chave de serviço do Supabase, token do GitHub, chave privada...),
   a publicação é BLOQUEADA com erro.

Uso: python collector/verificar_publicacao.py web
"""
from __future__ import annotations

import base64
import json
import re
import sys
from pathlib import Path

EXTENSOES_OK = {".html", ".css", ".js", ".json", ".svg", ".png", ".jpg", ".jpeg", ".webp", ".gif", ".ico", ".woff2", ".txt", ".webmanifest"}
NOME_SUSPEITO = re.compile(r"[ ()~]|copy|c[óo]pia|backup|\.bak|\.old|\.orig|\.tmp|^\.", re.I)
SEGREDOS = [
    ("chave secreta do Supabase", re.compile(r"sb_secret_[A-Za-z0-9_-]{10,}")),
    ("token de acesso do Supabase", re.compile(r"sbp_[a-z0-9]{20,}")),
    ("token do GitHub", re.compile(r"(ghp|gho|ghs|ghu)_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{20,}")),
    ("chave privada", re.compile(r"-----BEGIN [A-Z ]*PRIVATE KEY-----")),
    ("chave da AWS", re.compile(r"AKIA[0-9A-Z]{16}")),
    ("chave de API (sk-)", re.compile(r"\bsk-[A-Za-z0-9]{24,}")),
]
JWT = re.compile(r"eyJ[A-Za-z0-9_-]{10,}\.([A-Za-z0-9_-]{10,})\.[A-Za-z0-9_-]{10,}")


def _jwt_role(payload_b64: str) -> str:
    try:
        dados = base64.urlsafe_b64decode(payload_b64 + "=" * (-len(payload_b64) % 4))
        return str(json.loads(dados).get("role", ""))
    except (ValueError, TypeError):
        return ""


def achar_segredos(texto: str) -> list[str]:
    achados = [nome for nome, rx in SEGREDOS if rx.search(texto)]
    for m in JWT.finditer(texto):
        if _jwt_role(m.group(1)) == "service_role":   # a chave "anon" é pública por natureza; a service_role nunca
            achados.append("chave service_role do Supabase")
    return achados


def verificar(raiz: Path, remover: bool = True) -> tuple[list[str], list[str]]:
    """Devolve (arquivos removidos, segredos encontrados)."""
    removidos: list[str] = []
    segredos: list[str] = []
    for f in sorted(raiz.rglob("*")):
        if not f.is_file():
            continue
        rel = f.relative_to(raiz)
        if f.suffix.lower() not in EXTENSOES_OK or any(NOME_SUSPEITO.search(parte) for parte in rel.parts):
            removidos.append(str(rel))
            if remover:
                f.unlink()
            continue
        if rel.parts[0] == "data" or f.suffix.lower() in {".png", ".jpg", ".jpeg", ".webp", ".gif", ".ico", ".woff2"}:
            continue  # dados do PNCP e imagens não são texto de código
        try:
            texto = f.read_text(encoding="utf-8", errors="ignore")
        except OSError:
            continue
        segredos += [f"{rel}: {nome}" for nome in achar_segredos(texto)]
    return removidos, segredos


def main(argv: list[str]) -> int:
    raiz = Path(argv[1] if len(argv) > 1 else "web")
    if not raiz.is_dir():
        print(f"::error::Pasta {raiz} não encontrada.")
        return 2
    removidos, segredos = verificar(raiz)
    for r in removidos:
        print(f"::warning::Arquivo fora do padrão NÃO foi publicado: {r}. Apague-o do repositório.")
    for s in segredos:
        print(f"::error::Possível segredo no site: {s}")
    if segredos:
        print("Publicação bloqueada. Troque a chave (ela deve ser considerada vazada) e remova-a do repositório.")
        return 1
    print(f"Conferência da publicação: ok ({len(removidos)} arquivo(s) fora do padrão removido(s) da cópia pública).")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
