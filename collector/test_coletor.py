"""Testes offline: classificação e normalização (sem acesso à internet).

Rodar:  python3 -m unittest collector/test_coletor.py -v
"""
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from categorias import classificar, normalizar  # noqa: E402
from pncp_collector import normalizar_registro  # noqa: E402

REGISTRO_EXEMPLO = {
    "numeroControlePNCP": "13915632000127-1-000207/2026",
    "numeroCompra": "45/2026",
    "anoCompra": 2026,
    "sequencialCompra": 207,
    "processo": "123/2026",
    "modalidadeId": 6,
    "modalidadeNome": "Pregão - Eletrônico",
    "situacaoCompraNome": "Divulgada no PNCP",
    "objetoCompra": "Registro de preços para aquisição de cadeiras giratórias, mesas de escritório e armários de aço.",
    "informacaoComplementar": None,
    "srp": True,
    "valorTotalEstimado": 184500.5,
    "valorTotalHomologado": None,
    "dataAberturaProposta": "2026-11-20T08:00:00",
    "dataEncerramentoProposta": "2026-12-02T09:00:00",
    "dataPublicacaoPncp": "2026-11-17T10:12:44",
    "dataAtualizacao": "2026-11-17T10:12:44",
    "orgaoEntidade": {"cnpj": "13915632000127", "razaosocial": "MUNICIPIO DE EXEMPLO", "esferaId": "M"},
    "unidadeOrgao": {"codigoIbge": 3550308, "municipioNome": "São Paulo", "ufSigla": "SP"},
    "linkSistemaOrigem": "https://exemplo.gov.br/compras/207",
}


class TestClassificacao(unittest.TestCase):
    def test_normalizar_remove_acentos(self):
        self.assertEqual(normalizar("  Pregão   ELETRÔNICO "), "pregao eletronico")

    def test_mobiliario(self):
        r = classificar("Aquisição de cadeira giratória e mesa para escritório")
        self.assertEqual(r["categoria"], "mobiliario")
        self.assertIn("cadeiras", r["subcategorias"])
        self.assertIn("mesas", r["subcategorias"])

    def test_papelaria(self):
        r = classificar("Aquisição de papel A4, canetas e grampeadores")
        self.assertEqual(r["categoria"], "escritorio_papelaria")

    def test_impressao(self):
        r = classificar("Locação de impressora multifuncional")
        self.assertEqual(r["categoria"], "informatica_impressao")

    def test_cadeira_de_rodas_e_saude_nao_mobiliario(self):
        self.assertEqual(classificar("Aquisição de cadeira de rodas e mesa cirúrgica")["categoria"], "saude_medicamentos")

    def test_monitoramento_nao_e_monitor(self):
        txt = "Contratação de empresa para locação de sistema de radiocomunicação e monitoramento por GPS"
        self.assertNotEqual(classificar(txt)["categoria"], "informatica_impressao")

    def test_monitor_de_computador_continua_valendo(self):
        self.assertEqual(classificar("Aquisição de monitores LED 24 polegadas")["categoria"], "informatica_impressao")

    def test_automoveis_nao_e_moveis(self):
        self.assertNotEqual(classificar("Manutenção de automóveis da frota municipal")["categoria"], "mobiliario")

    def test_cama_nao_casa_em_camara(self):
        self.assertEqual(classificar("Sessão solene da Câmara Municipal")["categoria"], "outros")

    def test_novas_categorias(self):
        casos = {
            "Aquisição de medicamentos e insumos hospitalares": "saude_medicamentos",
            "Fornecimento de gêneros alimentícios para a merenda escolar": "alimentos_bebidas",
            "Aquisição de combustível diesel S10 para a frota": "veiculos_combustiveis",
            "Aquisição de uniformes escolares e fardamento": "uniformes_vestuario",
            "Contratação de obra de pavimentação asfáltica": "construcao_obras",
            "Aquisição de detergente, desinfetante e material de limpeza": "limpeza_higiene",
            "Licença de uso de software de gestão": "tecnologia_software",
            "Contratação de serviços de vigilância patrimonial": "servicos_gerais",
            "Aquisição de aparelhos de ar-condicionado": "eletrico_telecom",
            "Aquisição de geladeiras, fogões e bebedouros": "casa_utensilios",
        }
        for texto, esperado in casos.items():
            with self.subTest(texto=texto):
                self.assertEqual(classificar(texto)["categoria"], esperado)

    def test_categorias_existem_no_site(self):
        """Todo id de categoria do coletor precisa existir em web/app.js, senão o site mostra o id cru."""
        from categorias import CATEGORIAS
        js = (Path(__file__).resolve().parent.parent / "web" / "app.js").read_text(encoding="utf-8")
        for cat in CATEGORIAS:
            self.assertRegex(js, rf"\b{cat}:\s*\"", f"{cat} falta em CATEGORIAS de app.js")

    def test_fora_do_escopo(self):
        self.assertEqual(classificar("Concessão de uso de espaço público para exploração de quiosque")["categoria"], "outros")


class TestNormalizacao(unittest.TestCase):
    def test_registro_completo(self):
        linha = normalizar_registro(REGISTRO_EXEMPLO)
        self.assertEqual(linha["numero_controle_pncp"], "13915632000127-1-000207/2026")
        self.assertEqual(linha["uf"], "SP")
        self.assertEqual(linha["codigo_ibge"], "3550308")
        self.assertEqual(linha["categoria"], "mobiliario")
        self.assertEqual(linha["data_publicacao"], "2026-11-17")
        self.assertEqual(linha["link_pncp"], "https://pncp.gov.br/app/editais/13915632000127/2026/207")
        self.assertEqual(linha["valor_estimado"], 184500.5)

    def test_nome_do_orgao_aceita_as_duas_grafias(self):
        for chave in ("razaoSocial", "razaosocial"):
            r = dict(REGISTRO_EXEMPLO, orgaoEntidade={"cnpj": "1", chave: "PREFEITURA X", "esferaId": "M"})
            self.assertEqual(normalizar_registro(r)["orgao_nome"], "PREFEITURA X")

    def test_descarta_fora_das_categorias(self):
        r = dict(REGISTRO_EXEMPLO, objetoCompra="Concessão de uso de espaço público para exploração de quiosque")
        self.assertIsNone(normalizar_registro(r))

    def test_incluir_outros_guarda_tudo(self):
        r = dict(REGISTRO_EXEMPLO, objetoCompra="Concessão de uso de espaço público para exploração de quiosque")
        linha = normalizar_registro(r, incluir_outros=True)
        self.assertEqual(linha["categoria"], "outros")

    def test_campos_ausentes_nao_quebram(self):
        r = {"numeroControlePNCP": "x", "objetoCompra": "Aquisição de papel sulfite"}
        linha = normalizar_registro(r)
        self.assertIsNotNone(linha)
        self.assertIsNone(linha["link_pncp"])
        self.assertIsNone(linha["uf"])


if __name__ == "__main__":
    unittest.main()
