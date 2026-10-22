# A Jornada do Guardião N1 — atualização v3.7

## Implementado

- Classe escolhida com estado acessível e foco no enunciado ao continuar para outra pergunta. Feedback recebe foco e fica visível após responder.
- Feedback com referência original do treinamento e indicação do próximo evento/checkpoint, sem revelar perguntas futuras.
- Custo da recuperação de HP informado. O campo existente rw.gold guarda o delta negativo nas novas quedas; saves antigos sem esse detalhe mostram a regra de até 25 ouro, limitada ao saldo, sem inventar o custo passado.
- Contador de chefes identificado como confrontos concluídos, coerente com a continuidade após uma resposta incorreta.
- Caderno com filtro por tema e controles de abrir/recolher. Consulta não altera respostas, save ou nota.
- Acabamento local em css/refinements.css, sem imagens ou dependências novas. Atlas e 125 mídias da v3.6 preservados.

## Validação

Três cenários de jornada completa em Chromium automatizado por interface: mista (102/135, 75%, passed), todos os acertos (100%, passed) e todos os erros (0%, failed). Cada jornada percorreu 135 perguntas, três capítulos, nove chefes, nove checkpoints e 18 eventos. A jornada mista foi repetida depois do último ajuste textual, com 3 compras, 3 equipamentos e cinco recargas intermediárias. Cadernos conferidos exatamente com os erros registrados. Não foram injetados contadores ou progresso nessas jornadas.

Maior save nas três jornadas de referência: 993/4.096 caracteres. Testes adicionais dirigidos cobrem falhas, fronteira de aprovação, isolamento, formato v2, seis cosméticos, eventos, teclado e telas pequenas. Relatórios detalhados acompanham a entrega separadamente. Não houve validação no Engage real.

## Preservado

As 135 questões, ordem, alternativas, gabaritos, feedbacks e referências estão byte a byte iguais à v3.6. Aprovação em 70%, independente dos recursos de RPG. Formato v2 e compatibilidade de saves válidos mantidos; nenhuma chave nova foi adicionada para os ajustes desta versão. Sem serviços externos, login ou biblioteca nova. O padrão das alternativas não foi embaralhado.
