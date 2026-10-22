# Relatório Final de QA — Mobilize Banco N1 — A Jornada do Guardião N1

Data do QA: 19/10/2026
Versão: Pixel RPG Otimizada — SCORM 1.2 — QA Final

## Resultado executivo

- Questões efetivamente percorridas pelo fluxo da interface: 135 / 135
- Chefes efetivamente enfrentados: 9 / 9
- Capítulos concluídos: 3 / 3
- Jogo zerado: SIM
- Tela final alcançada: SIM
- Reinício/Nova Jornada testado: SIM
- Save/Resume testado: SIM
- SCORM 1.2 testado com mock de LMS: SIM
- Erros JavaScript bloqueadores: 0
- Assets quebrados durante a execução: 0
- Testes principais: 214 passaram / 0 falharam
- Testes adicionais de monstros raros: 8 passaram / 0 falharam
- Hash das 135 questões antes/depois: `e2d705fef8618cd64dc1c52553c04a2e85bcf402e5f70c86df2ceb7050fc9063` — idêntico

A execução principal misturou respostas corretas e incorretas. Resultado: 112/135 acertos, nota 82%, status SCORM `passed`. Também foi feita uma segunda jornada com 0/135 para validar `failed`, e uma terceira com 135/135 para validar 100%, `passed`, 9/9 chefes e a conquista PERFECCIONISTA.

## Como o teste foi executado

O jogo foi aberto em Chromium e operado pela própria interface: seleção de classe, criação do personagem, clique em alternativas, botão ATACAR, feedback, eventos, checkpoints, mapa, chefes, final e Nova Jornada. O estado de conclusão não foi manipulado diretamente.

Para o ciclo exaustivo de 135 questões, após validar separadamente as animações no tempo real, o harness de QA removeu somente a espera visual de 620 ms entre ataque e feedback. Isso acelerou o teste sem pular perguntas, sem alterar respostas e sem marcar progresso artificialmente.

## Erro de jogo encontrado e corrigido

### Contador de chefes

Problema: o contador `bd` aumentava apenas quando a pergunta do chefe era respondida corretamente. Porém, mesmo após um erro, o jogo permitia seguir para o próximo trecho. Assim, era possível zerar a jornada tendo enfrentado todos os 9 chefes, mas a tela final exibir, por exemplo, 6/9 chefes derrotados.

Correção aplicada: cada confronto de chefe agora é contabilizado uma única vez após o turno de avaliação, independentemente de acerto ou erro. O erro continua causando dano e não concede a recompensa de acerto; a nota continua dependente somente das questões. Na retestagem, a partida mista concluiu com 9/9 chefes.

## Partida completa principal

- Personagem: Daniel
- Classe: Guardião N1
- Questões: 135 / 135
- Acertos: 112
- Erros intencionais: 23
- Nota: 82%
- Status: `passed`
- Melhor combo: 10
- Morte/recuperação de HP: testada e aprovada
- Eventos encontrados: camp, chest, item, merchant, potion, scroll
- Monstros distintos encontrados na jornada: 61
- Famílias comuns cobertas: 17/17
- Divergências tema × família de monstro: 0

## Chefes testados

1. Mestre dos Contratos
2. Lorde dos Boletos
3. Espectro Supremo do Serasa
4. Hidra dos Seguros
5. Arquimago da Reorganização
6. Dragão do Leasing
7. Rei Cessionário
8. Colosso da Garantia
9. Guardião do Cofre N1

Todos apresentaram introdução, nome/subtítulo, sprite carregado e combate acessível.

## Monstros raros

Os 6 raros foram forçados por seed somente para QA, sem alterar a lógica de respostas:

- Slime Dourado dos Juros
- Mímico de Ouro
- Bug Lendário do FRONT
- Fada do Protocolo
- Corvo Dourado da Wiki
- Orbe Mobilize

Todos carregaram sprite, badge RARO, feedback de encontro raro e combate. Os GIFs raros também foram verificados como 64×64 com múltiplos frames.

## Save / Resume

Pontos testados:

- checkpoint30: OK, before37: OK, feedback38: OK, event40: OK, checkpoint45: OK, chapter2start: OK

Em todos os casos, o retorno preservou pergunta/estado, XP e contagem de respostas. Não houve duplicação de XP, ouro, resposta ou chefe.

## Eventos

Foram testados no fluxo completo:

- BAÚ ENCONTRADO
- FOGUEIRA DA EQUIPE
- POÇÃO DE CAFÉ
- PERGAMINHO
- ITEM COSMÉTICO
- MERCADOR

O mercador foi testado com ouro suficiente e com ouro insuficiente. Com saldo insuficiente, o botão de compra ficou bloqueado. Itens não interferiram na nota.

## Layout / responsividade

Dimensões testadas no navegador:

- 1366×768 — passou
- 1280×720 — passou
- 1920×1080 — passou
- 1366×650 — passou
- 1100×600 — passou

Em todas elas, HP, jogador, monstro, pergunta, quatro alternativas e botão ATACAR permaneceram dentro da mesma viewport, sem necessidade de rolagem da página para responder.

Screenshots do QA estão incluídos no projeto editável em `docs/screenshots_qa/`.

## Textos mais longos

Foram testados especificamente:

- maior enunciado: questão 18
- maior alternativa: questão 81
- maior feedback: questão 20

Resultado: PASSOU. Não houve corte horizontal; os conteúdos permaneceram dentro dos painéis previstos.

## Performance

Medições nos marcos 30, 60, 90, 120 e 135:

- Heap após coleta: [1.42, 1.62, 1.76, 1.88, 1.93] MB
- Nós ativos no documento: [113, 114, 114, 114, 73]
- Partículas remanescentes: 0 nos marcos
- Toasts ativos: no máximo 1

O heap permaneceu abaixo de 2 MB após coleta e o DOM ativo ficou estável durante as batalhas. Não foi observado crescimento progressivo de elementos ativos nem travamento ao chegar às questões finais.

## SCORM 1.2

Chamadas observadas no mock de LMS:

- LMSInitialize
- LMSGetValue
- LMSSetValue
- LMSCommit
- LMSFinish

Campos efetivamente gravados:

- `cmi.core.exit`
- `cmi.core.lesson_location`
- `cmi.core.lesson_status`
- `cmi.core.score.max`
- `cmi.core.score.min`
- `cmi.core.score.raw`
- `cmi.core.session_time`
- `cmi.suspend_data`

Resultado do teste completo SCORM perfeito:

- `cmi.core.lesson_status = passed`
- `cmi.core.score.raw = 100`
- `cmi.core.score.min = 0`
- `cmi.core.score.max = 100`
- `cmi.core.lesson_location = final|2|45|q`
- `cmi.core.exit = ""`
- `cmi.core.session_time = 0000:00:01.00`
- LMSInitialize: 1 vez
- LMSFinish: 1 vez
- LMSCommit: 167 chamadas no teste completo

Também foi validado `failed` em uma jornada 0/135.

## Limite de aprovação

- 0/135 = 0%
- 50/135 = 37%
- 94/135 = 69% — reprovado
- 95/135 = 70% — aprovado
- 100/135 = 74%
- 135/135 = 100%

HP, XP, ouro, classe, itens, combo e monstros não participam do cálculo da nota.

## Som e acessibilidade

Foram acionadas as rotas de som de ataque, acerto, erro, moeda, XP, level up, chefe, vitória e baú. O jogo inicia no mudo. No ambiente headless, a saída física de áudio foi substituída por um stub apenas para evitar dependência de dispositivo ALSA; as chamadas reais do motor foram registradas.

O modo REDUZIR ANIMAÇÕES foi ativado e jornadas completas foram concluídas com ele, sem bloquear respostas, feedback ou avanço.

## Nova Jornada / encerramento

Após uma partida perfeita, Nova Jornada foi acionada e confirmou:

- respostas zeradas
- XP = 0
- ouro = 0
- HP = 100
- chefes = 0
- combo = 0
- capítulos reiniciados
- `lesson_status = incomplete`

No fechamento foi disparado `beforeunload`, com `LMSFinish` e `cmi.core.session_time` registrados.

## Tempo

- Execução automatizada exaustiva, com espera visual removida após validação das animações: ~1.64 s para a jornada principal.
- A animação normal foi testada separadamente no tempo real.
- Estimativa real para um aluno, considerando leitura e raciocínio de aproximadamente 15–25 s por questão e as telas intermediárias: cerca de 40–65 minutos.

## Erros remanescentes

Nenhum erro bloqueador permaneceu nos testes realizados.

Observação: a validação foi feita em Chromium com mock SCORM 1.2 e dimensões equivalentes ao player mostrado. O Engage controla o iframe, cache e políticas do LMS; portanto, a última validação operacional recomendada é subir o ZIP final no ambiente Engage e executar uma tentativa piloto.
