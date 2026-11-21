/* Anti-moldura: a página só aparece se estiver aberta sozinha na aba (não dentro de outro site). */
(function () {
  try {
    if (window.top === window.self) {
      var e = document.getElementById("antiframe");
      if (e) e.remove();
    } else {
      window.top.location = window.self.location;
    }
  } catch (err) {
    /* dentro de uma moldura de outro site o acesso é negado: a tela continua escondida */
  }
})();
