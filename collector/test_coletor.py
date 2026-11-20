"""Testes offline: classificação e normalização (sem acesso à internet).

Rodar:  python3 -m unittest collector/test_coletor.py -v
"""
import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from categorias import classificar, classificar_tipo, normalizar  # noqa: E402
from pncp_collector import normalizar_registro, salvar_json  # noqa: E402

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


class TestTipo(unittest.TestCase):
    def _tipo(self, texto):
        c = classificar(texto)
        return classificar_tipo(texto, c["categoria"], c["subcategorias"])

    def test_obra_de_engenharia(self):
        # o caso real do print: quadra comunitária
        txt = ("Contratação de empresa especializada para execução de serviços de engenharia, execução de obra "
               "de engenharia destinada à construção de Espaço Esportivo Comunitário, com fornecimento de mão de obra, materiais")
        self.assertEqual(self._tipo(txt), "obras")

    def test_aquisicao_de_produtos(self):
        self.assertEqual(self._tipo("Registro de preços para aquisição de cadeiras giratórias e mesas"), "produtos")
        self.assertEqual(self._tipo("Registro de preços visando a aquisição de papel sulfite A4"), "produtos")

    def test_material_de_construcao_e_produto(self):
        self.assertEqual(self._tipo("Aquisição de cimento, areia e brita para manutenção de vias"), "produtos")

    def test_servicos(self):
        self.assertEqual(self._tipo("Contratação de empresa para prestação de serviços de vigilância patrimonial"), "servicos")
        self.assertEqual(self._tipo("Locação de impressoras com manutenção"), "servicos")

    def test_padrao_e_produtos(self):
        self.assertEqual(self._tipo("Papel sulfite A4 e canetas"), "produtos")


class TestReclassificar(unittest.TestCase):
    def test_reaplica_categoria_e_tipo_sem_internet(self):
        import json
        import tempfile
        from pncp_collector import reclassificar
        antigas = [
            {"numero_controle_pncp": "1", "objeto": "Aquisição de cadeiras", "categoria": "errada", "valor_estimado": 10},
            {"numero_controle_pncp": "2", "objeto": "Execução de obra de pavimentação", "categoria": "errada"},
            {"numero_controle_pncp": "3", "objeto": "Concessão de quiosque em praça", "categoria": "errada"},
        ]
        with tempfile.TemporaryDirectory() as d:
            f = Path(d) / "o.json"
            f.write_text(json.dumps({"oportunidades": antigas}), encoding="utf-8")
            n = reclassificar(f)
            saida = {o["numero_controle_pncp"]: o for o in json.loads(f.read_text(encoding="utf-8"))["oportunidades"]}
        self.assertEqual(n, 2)
        self.assertEqual(saida["1"]["categoria"], "mobiliario")
        self.assertEqual(saida["1"]["tipo"], "produtos")
        self.assertEqual(saida["2"]["tipo"], "obras")
        self.assertNotIn("3", saida)


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


class TestMemoria(unittest.TestCase):
    """Coleta leve + memória: marcar o que é novo sem perder o que já se sabia."""

    def _linha(self, id_, **extra):
        return dict({"numero_controle_pncp": id_, "objeto": "Aquisição de papel", "data_encerramento_proposta": "2026-12-01T10:00:00"}, **extra)

    def _ler(self, caminho):
        return json.loads(caminho.read_text(encoding="utf-8"))

    def test_primeira_vez_nao_marca_nada_como_novo(self):
        with tempfile.TemporaryDirectory() as d:
            c = Path(d) / "o.json"
            salvar_json([self._linha("a")], c, memoria=True)
            self.assertIsNone(self._ler(c)["oportunidades"][0].get("primeiro_visto"))

    def test_leve_soma_marca_nova_e_nao_perde(self):
        with tempfile.TemporaryDirectory() as d:
            c = Path(d) / "o.json"
            salvar_json([self._linha("a"), self._linha("b")], c, memoria=True)
            salvar_json([self._linha("b"), self._linha("c")], c, memoria=True, modo="publicacao")
            r = {o["numero_controle_pncp"]: o for o in self._ler(c)["oportunidades"]}
            self.assertEqual(set(r), {"a", "b", "c"})           # "a" não sumiu
            self.assertTrue(r["c"]["primeiro_visto"])           # só "c" é novo
            self.assertFalse(r["b"].get("primeiro_visto"))
            salvar_json([self._linha("c")], c, memoria=True, modo="publicacao")
            r2 = {o["numero_controle_pncp"]: o for o in self._ler(c)["oportunidades"]}
            self.assertEqual(r2["c"]["primeiro_visto"], r["c"]["primeiro_visto"])  # a marca é mantida

    def test_completa_sem_erro_substitui_e_com_erro_preserva(self):
        with tempfile.TemporaryDirectory() as d:
            c = Path(d) / "o.json"
            salvar_json([self._linha("a"), self._linha("b")], c, memoria=True)
            salvar_json([self._linha("b")], c, memoria=True)  # "a" foi encerrada
            self.assertEqual(self._ler(c)["total"], 1)
            salvar_json([self._linha("z")], c, memoria=True, erros=["SP/modalidade 6: timeout"])
            pacote = self._ler(c)
            self.assertEqual(pacote["total"], 2)                # nada perdido por causa da falha
            self.assertTrue(pacote["coleta"]["parcial"])
            self.assertEqual(pacote["coleta"]["n_erros"], 1)

    def test_gerado_em_em_utc(self):
        with tempfile.TemporaryDirectory() as d:
            c = Path(d) / "o.json"
            salvar_json([self._linha("a")], c)
            self.assertTrue(self._ler(c)["gerado_em"].endswith("Z"))


if __name__ == "__main__":
    unittest.main()
