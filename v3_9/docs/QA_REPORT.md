# Relatório de QA — Mobilize Banco N1 RPG Pixel

Resultado automatizado: 15 testes passaram; 0 falharam.

| Status | Teste | Resultado |
|---|---|---|
| PASSOU | Fidelidade das 135 questões | Texto, alternativas, resposta correta, feedback, referência e dificuldade idênticos ao SCORM-base. |
| PASSOU | Estrutura das questões | 135/135 possuem exatamente 4 alternativas e índice de resposta válida. |
| PASSOU | Ordem e duplicidade | Nenhuma questão foi criada, removida, reordenada ou duplicada pelo novo código. |
| PASSOU | Bestiário | 56 comuns, 6 raros e 9 chefes; todos os sprites existem. |
| PASSOU | Chefes | Questões 15, 30 e 45 em cada um dos 3 capítulos. |
| PASSOU | Personagens | 3 classes × 6 estados animados = 18 spritesheets presentes. |
| PASSOU | Assets visuais e sonoros | 16 fundos/mapa, 9 efeitos sonoros e 10 ícones locais. |
| PASSOU | SCORM 1.2 | Funções e campos solicitados estão implementados. |
| PASSOU | Corte de aprovação | 70% exige pelo menos 95 acertos em 135; 94 acertos permanece 69%. |
| PASSOU | Tamanho do progresso | Estado extremo estimado em 805 bytes (< 4096 bytes de referência para SCORM 1.2). |
| PASSOU | Funcionamento offline | Nenhum HTML/CSS/JS depende de URL externa, CDN ou API. |
| PASSOU | Sintaxe JavaScript | 8 arquivos verificados com node --check. |
| PASSOU | Eventos/checkpoints/chefes | Eventos a cada 5 questões, checkpoints após chefes e introdução especial de chefe detectados no engine. |
| PASSOU | Manifesto XML | Manifesto bem-formado com 134 arquivos de runtime enumerados. |
| PASSOU | Integridade do ZIP SCORM | ZIP íntegro, imsmanifest.xml na raiz, 139 arquivos. |

## Observação
Os testes cobrem fidelidade das questões, estrutura, bestiário, assets, sintaxe JavaScript, checkpoints, chefes, cálculo de aprovação, tamanho do suspend_data, manifesto, funcionamento offline e integridade do ZIP.
A validação final de tracking deve ser feita também dentro do Engage, porque o comportamento de lançamento e cache pode variar entre LMSs.