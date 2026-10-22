# engage

A Jornada do Guardião N1 — RPG pixel educacional para avaliação de operadores do Banco N1. A versão 3.9 possui 135 questões, três capítulos, nove chefes, missões opcionais, bolsa/loja, equipamentos e revisão guiada.

## Importar no LMS

Importe [dist/Mobilize_Banco_N1_RPG_Pixel_v3_9_SCORM_1_2.zip](dist/Mobilize_Banco_N1_RPG_Pixel_v3_9_SCORM_1_2.zip). O arquivo contém `imsmanifest.xml` na raiz e usa SCORM 1.2.

SHA-256: `4e80f2a554194f9f900da65448b15f5dd205e7da78b84303d329ac494c56ee5d`.

Os arquivos em [v3_9/](v3_9/) correspondem exatamente ao ZIP. A nota depende somente das respostas, com aprovação em 70%. Recursos de RPG e escolhas cosméticas não alteram a aprovação.

## Executar localmente

Na raiz do repositório:

```sh
python -m http.server 8779 --bind 127.0.0.1
```

Abra `http://127.0.0.1:8779/v3_9/index.html`. Fora de um LMS o jogo usa o modo local; isso não valida os relatórios do Engage.

Não há instalação de dependências para executar o curso: HTML, CSS, JavaScript e assets locais. Os controles de som e redução de movimento ficam na barra superior. As três classes são escolhas visuais.

## Testes e escopo

Veja [o relatório de validação](docs/VALIDACAO_PUBLICACAO_V3_9.md) e [como reproduzir os testes](docs/REPRODUZIR_TESTES.md). Fixtures cobrem condições dirigidas; a jornada completa responde às 135 questões pela interface, sem injetar progresso.

A arte v3.9 renova três heróis (18 poses), nove chefes, três NPCs e seis inimigos comuns. Os outros 50 comuns e seis raros conservam a arte anterior. Brutos de geração e grandes pacotes de evidências não são incluídos no histórico Git.

Os ensaios usam Chromium e API SCORM simulada. A importação, as tentativas, a retomada entre sessões/dispositivos e nota/status ainda precisam de homologação no Engage real. Não se promete ausência absoluta de bugs.
