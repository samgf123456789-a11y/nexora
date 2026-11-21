"""Classificação de objetos de compra em categorias Avanço Licitações.

A classificação é por palavras-chave sobre o texto do objeto (sem acentos,
minúsculo). É propositalmente simples e transparente: cada categoria tem
grupos de termos e a lista pode ser ajustada sem mexer no coletor.

Regras dos padrões (expressões regulares):
- todo padrão só casa a partir do INÍCIO de uma palavra ("moveis" não casa em "automoveis");
- palavras curtas devem trazer \\b no começo e no fim (\\bcamas?\\b), senão casam dentro de
  outras palavras ("cama" em "camara").
A ordem das categorias desempata quando duas pontuam igual.

IMPORTANTE: o id de cada categoria precisa existir também em web/app.js (CATEGORIAS).
O teste test_categorias_existem_no_site garante isso.
"""
from __future__ import annotations

import re
import unicodedata

CATEGORIAS = {
    "escritorio_papelaria": {
        "nome": "Escritório e papelaria",
        "subcategorias": {
            "papel": [r"papel a4", r"papel sulfite", r"papel para impressao", r"\bresmas?\b", r"papel oficio"],
            "papelaria": [r"\bcanetas?\b", r"\blapis\b", r"grampeador", r"\bgrampos?\b", r"\bclips\b", r"\bclipes?\b",
                          r"pasta suspensa", r"pasta arquivo", r"\benvelopes?\b", r"post-?it", r"bloco de notas",
                          r"\bcadernos?\b", r"\bborrachas?\b", r"apontador", r"fita adesiva", r"cola branca",
                          r"marca texto", r"marcador de texto", r"\btesouras?\b", r"estilete", r"\breguas?\b",
                          r"perfurador", r"etiqueta adesiva", r"\btoner", r"\bcartuchos? (de )?(tinta|toner)",
                          r"quadro branco", r"pincel atomico"],
            "material_expediente": [r"material de expediente", r"material de escritorio",
                                    r"suprimentos? de escritorio", r"material de papelaria", r"artigos? de papelaria"],
        },
    },
    "mobiliario": {
        "nome": "Mobiliário",
        "subcategorias": {
            "cadeiras": [r"cadeira", r"poltrona", r"longarina", r"banqueta", r"\bsofas?\b"],
            "mesas": [r"\bmesas?\b", r"escrivaninha", r"bancada", r"balcao", r"estacao de trabalho"],
            "armazenamento": [r"armario", r"estante", r"arquivo de aco", r"gaveteiro", r"roupeiro",
                              r"guarda-?volumes", r"prateleira", r"fichario"],
            "geral": [r"mobiliario", r"\bmoveis\b", r"\bmovel\b", r"mobilia"],
        },
    },
    "informatica_impressao": {
        "nome": "Informática e impressão",
        "subcategorias": {
            "impressao": [r"impressora", r"multifuncional", r"outsourcing de impressao"],
            "equipamentos": [r"computador", r"notebook", r"\bmonitores?\b", r"teclado", r"\bmouse", r"nobreak",
                             r"estabilizador", r"\btablets?\b", r"servidor de (rede|dados)", r"switch de rede",
                             r"roteador", r"\bhd\b", r"\bssd\b", r"memoria ram"],
        },
    },
    "tecnologia_software": {
        "nome": "Software e serviços de TI",
        "subcategorias": {
            "software": [r"\bsoftware", r"licenca de uso", r"licencas? de", r"sistema de gestao", r"solucao informatizada",
                         r"aplicativo", r"\berp\b", r"antivirus", r"certificado digital"],
            "servicos_ti": [r"desenvolvimento de (sistema|software)", r"hospedagem", r"\bnuvem\b", r"\bcloud\b",
                            r"suporte tecnico de ti", r"seguranca da informacao", r"digitalizacao", r"inteligencia artificial"],
            "conectividade": [r"link de internet", r"\binternet\b", r"fibra optica", r"banda larga", r"telecomunicac"],
        },
    },
    "limpeza_higiene": {
        "nome": "Limpeza e higiene",
        "subcategorias": {
            "limpeza": [r"detergente", r"desinfetante", r"\bsabao", r"agua sanitaria", r"hipoclorito",
                        r"material de limpeza", r"produtos? de limpeza", r"\bvassouras?\b", r"\brodos?\b",
                        r"\besponjas?\b", r"pano de chao", r"\bflanelas?\b", r"saco(s)? (de|para) lixo", r"\blixeiras?\b"],
            "higiene": [r"papel higienico", r"papel toalha", r"\bsabonetes?\b", r"alcool (em gel|70|etilico)",
                        r"higiene pessoal", r"produtos? de higiene", r"copos? descartaveis?", r"descartaveis",
                        r"\bfraldas?\b", r"absorvente"],
        },
    },
    "alimentos_bebidas": {
        "nome": "Alimentos e bebidas",
        "subcategorias": {
            "generos": [r"generos? alimenticios?", r"alimentacao escolar", r"\bmerenda", r"cesta basica", r"hortifruti",
                        r"\bcarnes?\b", r"\bfrango\b", r"\bleite\b", r"\bcafe\b", r"\bacucar\b", r"\barroz\b",
                        r"\bfeijao\b", r"\bfarinha", r"biscoito", r"\bpao\b", r"\bfrutas?\b", r"\bverduras?\b"],
            "bebidas": [r"agua mineral", r"galao de agua", r"\bsucos?\b", r"refrigerante"],
            "refeicoes": [r"\brefeic", r"quentinha", r"marmit", r"coffee break", r"\bbuffet\b", r"fornecimento de alimentacao",
                          r"panificacao", r"\blanches?\b"],
        },
    },
    "saude_medicamentos": {
        "nome": "Saúde e medicamentos",
        "subcategorias": {
            "medicamentos": [r"medicament", r"\bfarmaco", r"\bvacinas?\b", r"\binsulina", r"soro fisiologico"],
            "hospitalar": [r"material medico", r"medico-?hospitalar", r"hospitalar", r"\bseringas?\b", r"\bagulhas?\b",
                           r"luvas? (cirurgica|de procedimento)", r"mascaras? (cirurgica|n95|descartavel)",
                           r"\bgaze\b", r"curativo", r"oxigenio", r"teste rapido", r"\breagentes?\b",
                           r"exames? laboratoria", r"hemodialise", r"\buti\b"],
            "equipamentos": [r"equipamentos? medico", r"odontolog", r"cadeira de rodas", r"cadeira odontologica",
                             r"cadeira de banho", r"mesa cirurgica", r"mesa de exame", r"\bmacas?\b", r"desfibrilador",
                             r"esfigmomanometro", r"termometro", r"\borteses?\b", r"\bproteses?\b"],
        },
    },
    "construcao_obras": {
        "nome": "Construção e obras",
        "subcategorias": {
            "obras": [r"\bobras?\b", r"\breforma", r"construcao de", r"pavimentacao", r"asfalto", r"recapeamento",
                      r"drenagem", r"terraplenagem", r"servicos? de engenharia", r"edificacao", r"demolicao",
                      r"saneamento", r"calcamento", r"meio-?fio", r"sinalizacao viaria", r"projeto executivo"],
            "materiais": [r"material de construcao", r"\bcimento\b", r"\bareia\b", r"\bbrita\b", r"\btijolos?\b",
                          r"\bconcreto\b", r"tubos? (de )?pvc", r"ferragens", r"\btintas?\b", r"\bpaver\b"],
        },
    },
    "veiculos_combustiveis": {
        "nome": "Veículos e combustíveis",
        "subcategorias": {
            "veiculos": [r"\bveiculos?\b", r"\bautomoveis\b", r"\bautomovel\b", r"\bcaminh(ao|oes)\b", r"\bonibus\b",
                         r"\bambulancias?\b", r"motocicleta", r"\bvans?\b", r"\bpicape"],
            "combustiveis": [r"combustiv", r"gasolina", r"\bdiesel\b", r"\betanol\b", r"oleo lubrificante",
                             r"abastecimento de (frota|veiculos)", r"\bgnv\b"],
            "pecas_manutencao": [r"\bpneus?\b", r"pecas automotivas", r"manutencao de (veiculos|frota)",
                                 r"locacao de veiculos", r"lavagem de veiculos", r"bateria automotiva"],
        },
    },
    "uniformes_vestuario": {
        "nome": "Uniformes e EPI",
        "subcategorias": {
            "uniformes": [r"\buniformes?\b", r"fardamento", r"vestuario", r"\bcamisetas?\b", r"\bcalcas?\b", r"\bjalecos?\b",
                          r"\bavental", r"\bjaquetas?\b", r"\btecidos?\b"],
            "epi": [r"\bepis?\b", r"equipamentos? de protecao individual", r"\bcapacetes?\b", r"\bcolete", r"\bbotas?\b",
                    r"\bcalcados?\b", r"\bsapatos?\b", r"\bluvas? de (seguranca|raspa)"],
        },
    },
    "educacao_esporte": {
        "nome": "Educação e esporte",
        "subcategorias": {
            "escolar": [r"material escolar", r"material didatico", r"\blivros?\b", r"kit escolar", r"\bmochilas?\b",
                        r"\blousa", r"jogos pedagogicos", r"\bbrinquedos?\b", r"\bplayground", r"parque infantil"],
            "esporte": [r"material esportivo", r"\bbolas?\b", r"instrumentos? musica", r"equipamentos? esportivo"],
        },
    },
    "eletrico_telecom": {
        "nome": "Elétrica e telecomunicações",
        "subcategorias": {
            "eletrico": [r"material eletrico", r"\blampadas?\b", r"luminaria", r"iluminacao publica", r"\bcabos?\b",
                         r"fiacao", r"disjuntor", r"\bgeradores?\b", r"fotovoltaic", r"painel solar", r"\bventiladores?\b"],
            "climatizacao_seguranca": [r"ar[- ]condicionado", r"\bcameras? de seguranca", r"\bcftv\b", r"\balarmes?\b"],
            "telecom": [r"telefonia", r"\btelefones?\b", r"radio ?comunicacao", r"\bantenas?\b", r"\bradios?\b"],
        },
    },
    "ferramentas_agro": {
        "nome": "Ferramentas, máquinas e agro",
        "subcategorias": {
            "ferramentas": [r"\bferramentas?\b", r"\bmaquinas?\b", r"rocadeira", r"motosserra", r"compressor", r"furadeira",
                            r"equipamentos? industria", r"motobomba", r"bomba d.?agua"],
            "agro": [r"equipamentos? agricola", r"irrigacao", r"\bsementes?\b", r"\badubos?\b", r"fertilizante", r"\bracao\b",
                     r"insumos? agricola", r"\btratores?\b", r"veterinari"],
        },
    },
    "casa_utensilios": {
        "nome": "Casa, copa e eletrodomésticos",
        "subcategorias": {
            "eletrodomesticos": [r"eletrodomestic", r"geladeira", r"refrigerador", r"\bfreezer", r"\bfogao", r"microondas",
                                 r"bebedouro", r"purificador", r"liquidificador"],
            "utensilios": [r"utensilios", r"\bpanelas?\b", r"\bpratos?\b", r"\btalheres?\b", r"\bcopos?\b", r"\blouca",
                           r"\bcolchao", r"\bcolchoes\b", r"\btravesseiros?\b", r"\bcamas?\b", r"\blencois?\b",
                           r"\bcobertores?\b", r"toalhas? de (banho|mesa|rosto)"],
        },
    },
    "servicos_gerais": {
        "nome": "Serviços gerais e terceirizados",
        "subcategorias": {
            "terceirizados": [r"vigilancia", r"seguranca patrimonial", r"\bportaria\b", r"conservacao e limpeza",
                              r"limpeza e conservacao", r"jardinagem", r"mao de obra", r"terceirizacao", r"copeiragem",
                              r"recepcionista", r"dedetizacao", r"desinsetizacao", r"lavanderia"],
            "manutencao_eventos": [r"manutencao predial", r"transporte escolar", r"fretamento", r"organizacao de eventos",
                                   r"\beventos?\b", r"\bpalco\b"],
            "profissionais": [r"consultoria", r"assessoria", r"treinamento", r"capacitacao", r"publicidade", r"servicos? graficos?",
                              r"impressao grafica"],
        },
    },
}

# Falsos positivos conhecidos, removidos do texto só ao avaliar a categoria indicada.
EXCLUSOES = {
    "mobiliario": [r"cadeira de rodas", r"cadeira odontologica", r"cadeira de banho", r"mesa cirurgica",
                   r"mesa de exame", r"mesa de som", r"mesa de sinuca", r"mesa de ping"],
    "escritorio_papelaria": [r"cartucho de gas", r"cartucho de tinta de tatuagem"],
}


def normalizar(texto: str | None) -> str:
    """Minúsculas, sem acentos, espaços compactados."""
    if not texto:
        return ""
    t = unicodedata.normalize("NFKD", texto)
    t = "".join(c for c in t if not unicodedata.combining(c))
    return re.sub(r"\s+", " ", t.lower()).strip()


def _procurar(padrao: str, texto: str):
    # início de palavra obrigatório, a menos que o padrão já traga \b
    return re.search(padrao if padrao.startswith("\\b") else r"(?<![a-z0-9])" + padrao, texto)


def classificar(objeto: str | None, complemento: str | None = None) -> dict:
    """Retorna {'categoria', 'subcategorias', 'palavras'}.

    Se nada casar, categoria = 'outros'.
    """
    texto_base = normalizar(f"{objeto or ''} {complemento or ''}")

    pontos: dict[str, int] = {}
    subs: dict[str, set[str]] = {}
    palavras: dict[str, set[str]] = {}

    for cat, cfg in CATEGORIAS.items():
        texto = texto_base
        for exc in EXCLUSOES.get(cat, []):
            texto = re.sub(exc, " ", texto)
        for sub, padroes in cfg["subcategorias"].items():
            for p in padroes:
                m = _procurar(p, texto)
                if m:
                    pontos[cat] = pontos.get(cat, 0) + 1
                    subs.setdefault(cat, set()).add(sub)
                    palavras.setdefault(cat, set()).add(m.group(0).strip())

    if not pontos:
        return {"categoria": "outros", "subcategorias": [], "palavras": []}

    # max() devolve o primeiro em caso de empate, ou seja, a ordem de CATEGORIAS desempata
    melhor = max(pontos, key=lambda c: pontos[c])
    return {
        "categoria": melhor,
        "subcategorias": sorted(subs[melhor]),
        "palavras": sorted(palavras[melhor]),
    }


# ---------------------------------------------------------------- tipo da contratação
# O PNCP não informa se a compra é de produtos, serviços ou obras na lista de contratações
# (isso só existe por item). Aqui o tipo é INFERIDO do texto, então pode errar em objetos mistos.
# "fornecimento de" só indica compra quando está no começo do objeto; no meio do texto costuma ser
# "com fornecimento de mão de obra e materiais", que é parte de uma obra.
TIPO_COMPRA = [r"aquisicao", r"\bcompras? de\b", r"^.{0,40}\bfornecimento de\b"]
TIPO_OBRAS = [r"\bobras?\b", r"servicos? de engenharia", r"\breforma", r"construcao de", r"pavimentacao", r"recapeamento",
              r"terraplenagem", r"edificacao", r"demolicao", r"drenagem", r"calcamento", r"restauro", r"\bampliacao d"]
TIPO_SERVICOS = [r"prestacao de servicos?", r"contratacao de empresa", r"\bservicos? (de|tecnicos?|especializados?)\b",
                 r"\blocacao\b", r"\bmanutencao\b", r"\bassessoria", r"\bconsultoria", r"vigilancia", r"\btreinamento",
                 r"capacitacao", r"\bseguro\b", r"\beventos?\b", r"fretamento", r"\bhospedagem\b", r"\boutsourcing\b"]


def _alguma(padroes: list[str], texto: str) -> bool:
    return any(_procurar(p, texto) for p in padroes)


def classificar_tipo(objeto: str | None, categoria: str = "outros", subcategorias=()) -> str:
    """Retorna 'obras', 'servicos' ou 'produtos' (inferido do texto do objeto)."""
    t = normalizar(objeto)
    compra = _alguma(TIPO_COMPRA, t)
    if _alguma(TIPO_OBRAS, t) and not compra:
        return "obras"
    if compra:
        return "produtos"
    if _alguma(TIPO_SERVICOS, t) or categoria == "servicos_gerais":
        return "servicos"
    if categoria == "construcao_obras" and "obras" in subcategorias:
        return "obras"
    return "produtos"


def relevante(objeto: str | None, complemento: str | None = None) -> bool:
    return classificar(objeto, complemento)["categoria"] != "outros"
