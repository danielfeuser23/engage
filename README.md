# engage

A Jornada do Guardião N1 — RPG pixel educacional de avaliação para operadores do Banco N1.

## Versão atual: v4.0 — Fase 3

Importe [o ZIP SCORM 1.2](dist/Mobilize_Banco_N1_RPG_Pixel_v4_0_FASE_3_SCORM_1_2.zip) no LMS, sem descompactar. `imsmanifest.xml` fica na raiz. A [fonte estática](v4_0_fase3/) corresponde byte a byte ao ZIP; não exige instalação nem dependências de rede.

SHA-256: `f299a6951531ccffa99cb2a2cfc78d1e4127cbd7f4c73ab7f0e4b81076ae9bef`.

Na raiz do repositório, execute `python -m http.server 8779 --bind 127.0.0.1` e abra `http://127.0.0.1:8779/v4_0_fase3/index.html`. Python é somente ferramenta local, não dependência do curso.

O jogo conserva 135 questões, três capítulos, nove chefes, missões, eventos, bolsa/loja e revisão guiada. As três classes têm 324 aparências; os 62 monstros comuns/raros estão renovados. Os seis cosméticos custam 50 ouro, têm compra única e um slot equipado.

Na regra nova, cada capítulo exige `ceil(45 × 0,85) = 39` acertos. HP zero leva a Game Over depois do feedback. Dano comum/chefe: 10/15. A aprovação global `passScore=70` permanece separada, mas três capítulos válidos novos produzem no mínimo 117/135, nota inteira86. Recursos de RPG, classe e aparência não entram na fórmula da nota. Conclusões e capítulos legados válidos são preservados conforme a migração; a política nova não é equivalente à v3.9.

Saves SCORM v2, isolamento entre alunos/tentativas e limite de4.096 caracteres permanecem. O modo local desta entrega usa `mobilize_n1_fase3_completa_v4`, separado das entregas anteriores. Som começa mudo e há movimento reduzido e navegação por teclado.

Veja [o relatório](docs/fase3/RELATORIO_FASE3.md), [testes e limites](docs/fase3/TESTES.md) e [verificação reproduzível](qa_v4_0_fase3/verify_package.py). A jornada final percorreu135 perguntas pela interface, sem injeção:117 acertos,18 erros,86%, `passed`. Os testes usaram Chromium e API SCORM simulada; a homologação no Engage real está pendente. Não se promete ausência absoluta de bugs. Esta entrega conclui somente a Fase3.

## Versão anterior preservada

A [fonte v3.9](v3_9/), [ZIP v3.9](dist/Mobilize_Banco_N1_RPG_Pixel_v3_9_SCORM_1_2.zip), [relatório anterior](docs/VALIDACAO_PUBLICACAO_V3_9.md) e [QA v3.9](docs/REPRODUZIR_TESTES.md) permanecem disponíveis. Os resultados dessas suítes anteriores não substituem a validação da Fase3.
