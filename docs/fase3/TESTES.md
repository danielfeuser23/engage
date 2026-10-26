# Validação da v4.0 — Fase 3

O runtime foi publicado sem alterações em relação à entrega validada. O manifesto e os201 hashes registrados durante a jornada coincidem com os202 arquivos do ZIP; confira [o snapshot](../evidencias/fase3/runtime_hashes.json) e [a síntese](../evidencias/fase3/resumo_validacao.json).

Execute na raiz do repositório:

```sh
python qa_v4_0_fase3/verify_package.py
```

O verificador usa somente a biblioteca padrão Python. Confere SHA-256, CRC, paths seguros, manifesto, cada arquivo ZIP/fonte e os hashes do snapshot. Isso verifica integridade; não é uma nova execução das135 perguntas nem uma homologação no LMS.

A rodada final registrada usou Chromium real automatizado e API SCORM1.2 simulada. A jornada respondeu135 questões pela interface,117 corretas e18 incorretas,39/45 por capítulo, nota86 e `passed`; percorreu3 missões,9 chefes, eventos, compras, equipamentos, trocas de classe/aparência e14 recargas. Caderno, feedbacks/referências e18 consultas foram conferidos. Maior save natural:1.309 caracteres; amostragem dirigida separada observou1.398, sem afirmar máximo absoluto.

Resultados registrados:868/868 cenários do bestiário,213/213 de cosméticos,295/295 contratos Node/VM e22/22 verificações de navegador no ZIP extraído. A paridade Canvas/Python de4.536 composições de heróis exclui overlays;27.216 verificações geométricas de cosméticos são uma cobertura separada. Fixtures, inspeção visual amostral e a jornada real são métodos distintos. Os detalhes estão no [relatório](RELATORIO_FASE3.md).

O fallback da capa foi corrigido para não ocultar o herói quando seu PNG falha;18 cenários de falha/recuperação e a jornada foram repetidos depois da correção.

Os scripts, harnesses, capturas e logs completos são fornecidos no pacote externo `Testes_e_Evidencias_Guardiao_N1_v4_0_FASE_3.zip`, separado do histórico Git comum; seu SHA e os das evidências de origem constam na síntese. O arquivo externo de artes/fontes de geração também tem SHA registrado. Não há URL pública presumida para esses arquivos. O QA v3.9 preservado tem seu próprio escopo e não deve ser apresentado como uma repetição da Fase3.

Pendente: Engage real, aparelhos físicos, turma piloto e auditoria completa de acessibilidade. As Fases4/5/6 ainda não estão incluídas nesta publicação.
