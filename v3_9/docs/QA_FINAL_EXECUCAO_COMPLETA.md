# QA FINAL — MOBILIZE BANCO N1 — A JORNADA DO GUARDIÃO N1

Data do teste: 19/10/2026

## Resultado executivo

- Questões testadas pela interface: 135 / 135
- Questões aprovadas no checklist de UI/lógica: 135 / 135
- Chefes testados: 9 / 9
- Capítulos concluídos: 3 / 3
- Tela final alcançada: SIM
- Jogo zerado: SIM
- Nota da partida principal: 82% (112 acertos / 135)
- Status SCORM final: passed
- Melhor combo: x10
- Mortes/recuperações testadas: 2
- Erros JavaScript bloqueadores encontrados: 0

A execução real com os tempos normais de feedback/animação foi percorrida em três launches de 45 questões, retomando pelo próprio estado salvo do jogo. Isso foi necessário por limite de duração de uma execução do ambiente de QA; não houve alteração direta do estado para pular questões. A soma do tempo automatizado desses três trechos foi de aproximadamente 86.9 s.

## Integridade das questões

- O hash/estrutura do banco foi comparado antes e depois.
- Enunciados, alternativas, resposta correta, feedback, referência e dificuldade permaneceram iguais.
- Nenhuma questão foi criada, removida, duplicada ou reordenada pelo QA.

## Chefes testados

- Q15: Mestre dos Contratos — sprite carregado: SIM
- Q30: Lorde dos Boletos — sprite carregado: SIM
- Q45: Espectro Supremo do Serasa — sprite carregado: SIM
- Q60: Hidra dos Seguros — sprite carregado: SIM
- Q75: Arquimago da Reorganização — sprite carregado: SIM
- Q90: Dragão do Leasing — sprite carregado: SIM
- Q105: Rei Cessionário — sprite carregado: SIM
- Q120: Colosso da Garantia — sprite carregado: SIM
- Q135: Guardião do Cofre N1 — sprite carregado: SIM

## Monstros raros — seed forçado apenas para QA

- Slime Dourado dos Juros: seed 54 — nome/sprite/recompensa/feedback: PASSOU
- Mímico de Ouro: seed 2 — nome/sprite/recompensa/feedback: PASSOU
- Bug Lendário do FRONT: seed 111 — nome/sprite/recompensa/feedback: PASSOU
- Fada do Protocolo: seed 70 — nome/sprite/recompensa/feedback: PASSOU
- Corvo Dourado da Wiki: seed 60 — nome/sprite/recompensa/feedback: PASSOU
- Orbe Mobilize: seed 17 — nome/sprite/recompensa/feedback: PASSOU

## Eventos testados

- Tipos observados na partida principal: camp, chest, item, merchant, potion, scroll
- Também foi testado o Mercador sem ouro suficiente em uma execução específica; a compra ficou bloqueada corretamente.

## Checkpoints

- Após Q15: estado q=15, total respondido=15
- Após Q30: estado q=30, total respondido=30
- Após Q45: estado q=45, total respondido=45
- Após Q60: estado q=15, total respondido=60
- Após Q75: estado q=30, total respondido=75
- Após Q90: estado q=45, total respondido=90
- Após Q105: estado q=15, total respondido=105
- Após Q120: estado q=30, total respondido=120
- Após Q135: estado q=45, total respondido=135

## Save / Resume

- Retomada antes da Q37: PASSOU
- Retomada em tela de feedback: PASSOU
- Retomada em evento: PASSOU
- Retomada em checkpoint: PASSOU
- Retomada após chefe/checkpoint: PASSOU
- Retomada no início do Capítulo 2: PASSOU
- A própria execução real foi retomada após Q45 e Q90 sem duplicar respostas, XP, ouro ou chefes.

## SCORM 1.2

- LMSInitialize: PASSOU
- LMSSetValue: PASSOU
- LMSCommit: PASSOU
- LMSFinish: PASSOU
- cmi.core.lesson_status: PASSOU
- cmi.core.score.raw/min/max: PASSOU
- cmi.core.lesson_location: PASSOU
- cmi.suspend_data: PASSOU
- cmi.core.exit: PASSOU
- cmi.core.session_time: PASSOU
- LMSFinish observado ao encerrar a sessão final: SIM
- session_time gravado na sessão final: 0000:00:29.00

## Testes de nota

- 0/135 = 0%
- 50/135 = 37%
- 94/135 = 69%
- 95/135 = 70%
- 100/135 = 74%
- 135/135 = 100%
- 94 acertos não aprovam; 95 acertos atingem 70%.
- HP, XP, ouro, combo, classe, monstros e itens não participam do cálculo da nota.

## Layout / responsividade

- 1366x768: PASSOU
- 1280x720: PASSOU
- 1920x1080: PASSOU
- 1366x650: PASSOU
- 1100x600: PASSOU
- Na partida completa em 1366x768, 135 / 135 telas de questão não exigiram rolagem da página para responder.

## Performance

- Q30: heap 1.37 MB; DOM 113 nós; partículas pendentes 0; toasts 0
- Q60: heap 1.32 MB; DOM 113 nós; partículas pendentes 0; toasts 0
- Q90: heap 1.42 MB; DOM 114 nós; partículas pendentes 0; toasts 1
- Q120: heap 1.36 MB; DOM 113 nós; partículas pendentes 0; toasts 0
- Q135: heap 1.42 MB; DOM 73 nós; partículas pendentes 0; toasts 1
- Variação do heap entre checkpoints: 1.32–1.42 MB.
- Não foi observado crescimento progressivo de DOM nem acúmulo de partículas.

## Som e acessibilidade

- O jogo inicia no mudo: PASSOU
- Alternância som/mudo: PASSOU
- Chamadas para attack, correct, wrong, boss, victory, chest, coin, xp e levelup: PASSARAM no mock headless.
- Reduzir animações ligado/desligado: PASSOU.
- Uma execução completa adicional com reduzir animações foi concluída no QA automatizado.

## Reinício

- Respostas após Nova Jornada: [0, 0, 0]
- XP: 0; ouro: 0; HP: 100; chefes: 0; combo: 0
- lesson_status após reinício: incomplete

## Erros encontrados

- Nenhum erro bloqueador foi encontrado na versão otimizada submetida a este QA.
- Nenhum erro JavaScript foi registrado nas execuções principais.

## Correções realizadas neste ciclo

- Como o pacote otimizado passou nos testes, não foi necessário alterar a lógica nem o conteúdo durante este ciclo de QA.
- Foi apenas anexado este relatório ao projeto/artefato validado.

## Tempo aproximado para zerar

- Automação real de interface, sem tempo humano de leitura: ~86.9 s no total dos 3 trechos.
- Estimativa para um aluno lendo e pensando nas 135 questões: aproximadamente 35–55 minutos, variando conforme conhecimento e ritmo.

## Checklist das 135 questões

| Q | Resultado | Monstro | Resp. usada | HP | XP | Ouro | Combo | Sem scroll |
|---:|---|---|---|---:|---:|---:|---:|---|
| 1 | PASSOU | Oráculo do Portal | Correta | 100 | 100 | 10 | 1 | SIM |
| 2 | PASSOU | Escriba do Contrato | Correta | 100 | 200 | 20 | 2 | SIM |
| 3 | PASSOU | Oráculo do Portal | Correta | 100 | 300 | 30 | 3 | SIM |
| 4 | PASSOU | Sentinela do Atendimento | Correta | 100 | 400 | 40 | 4 | SIM |
| 5 | PASSOU | Guardião do Arrendamento | Correta | 100 | 510 | 50 | 5 | SIM |
| 6 | PASSOU | Cavaleiro do Leasing | Correta | 100 | 620 | 110 | 6 | SIM |
| 7 | PASSOU | Slime do Cadastro | Correta | 100 | 730 | 120 | 7 | SIM |
| 8 | PASSOU | Oráculo do Portal | Correta | 100 | 840 | 130 | 8 | SIM |
| 9 | PASSOU | Escriba do Contrato | Correta | 100 | 950 | 140 | 9 | SIM |
| 10 | PASSOU | Espectro SNG | Correta | 100 | 1075 | 150 | 10 | SIM |
| 11 | PASSOU | Oráculo NOVAR | Errada | 85 | 1095 | 150 | 0 | SIM |
| 12 | PASSOU | Pixie LEVY | Errada | 70 | 1115 | 150 | 0 | SIM |
| 13 | PASSOU | Bug do FRONT | Errada | 55 | 1135 | 150 | 0 | SIM |
| 14 | PASSOU | Mímico do CRV | Errada | 40 | 1155 | 150 | 0 | SIM |
| 15 | PASSOU | Mestre dos Contratos | Errada | 15 | 1175 | 150 | 0 | SIM |
| 16 | PASSOU | Corvo Dourado da Wiki | Errada | 100 | 1195 | 125 | 0 | SIM |
| 17 | PASSOU | Golem do Gravame | Correta | 100 | 1295 | 135 | 1 | SIM |
| 18 | PASSOU | Golem do Gravame | Correta | 100 | 1395 | 145 | 2 | SIM |
| 19 | PASSOU | Golem do Gravame | Correta | 100 | 1495 | 155 | 3 | SIM |
| 20 | PASSOU | Corrente Alienada | Correta | 100 | 1595 | 165 | 4 | SIM |
| 21 | PASSOU | Corrente Alienada | Correta | 100 | 1765 | 175 | 5 | SIM |
| 22 | PASSOU | Goblin do Vencimento | Correta | 100 | 1875 | 185 | 6 | SIM |
| 23 | PASSOU | Slime dos Juros | Correta | 100 | 1985 | 195 | 7 | SIM |
| 24 | PASSOU | Slime dos Juros | Errada | 85 | 2005 | 195 | 0 | SIM |
| 25 | PASSOU | Slime dos Juros | Correta | 85 | 2105 | 205 | 1 | SIM |
| 26 | PASSOU | Slime dos Juros | Correta | 85 | 2205 | 265 | 2 | SIM |
| 27 | PASSOU | Mímico de Ouro | Correta | 85 | 2385 | 315 | 3 | SIM |
| 28 | PASSOU | Devorador de Parcelas | Correta | 85 | 2485 | 325 | 4 | SIM |
| 29 | PASSOU | Devorador de Parcelas | Correta | 85 | 2595 | 335 | 5 | SIM |
| 30 | PASSOU | Lorde dos Boletos | Correta | 85 | 2837 | 370 | 6 | SIM |
| 31 | PASSOU | Fantasma da Duplicidade | Correta | 85 | 2947 | 380 | 7 | SIM |
| 32 | PASSOU | Colecionador de Comprovantes | Correta | 85 | 3057 | 390 | 8 | SIM |
| 33 | PASSOU | Slime da Baixa | Errada | 70 | 3077 | 390 | 0 | SIM |
| 34 | PASSOU | Colecionador de Comprovantes | Correta | 70 | 3177 | 400 | 1 | SIM |
| 35 | PASSOU | Fantasma da Duplicidade | Correta | 70 | 3277 | 410 | 2 | SIM |
| 36 | PASSOU | Cavaleiro da Parcela Invertida | Correta | 90 | 3377 | 420 | 3 | SIM |
| 37 | PASSOU | Fantasma da Duplicidade | Correta | 90 | 3477 | 430 | 4 | SIM |
| 38 | PASSOU | Slime Dourado dos Juros | Correta | 90 | 3675 | 480 | 5 | SIM |
| 39 | PASSOU | Imp do IOF | Correta | 90 | 3785 | 490 | 6 | SIM |
| 40 | PASSOU | Imp do IOF | Correta | 90 | 3895 | 500 | 7 | SIM |
| 41 | PASSOU | Imp do IOF | Correta | 90 | 4005 | 460 | 8 | SIM |
| 42 | PASSOU | Sentinela do Atendimento | Errada | 75 | 4025 | 460 | 0 | SIM |
| 43 | PASSOU | Carrasco dos Juros | Correta | 75 | 4125 | 470 | 1 | SIM |
| 44 | PASSOU | Coletor Sombrio | Correta | 75 | 4225 | 480 | 2 | SIM |
| 45 | PASSOU | Espectro Supremo do Serasa | Correta | 75 | 4445 | 515 | 3 | SIM |
| 46 | PASSOU | Guardião da Restrição | Correta | 100 | 4545 | 525 | 4 | SIM |
| 47 | PASSOU | Espectro do Serasa | Correta | 100 | 4655 | 535 | 5 | SIM |
| 48 | PASSOU | Carrasco dos Juros | Correta | 100 | 4765 | 545 | 6 | SIM |
| 49 | PASSOU | Carrasco dos Juros | Correta | 100 | 4875 | 555 | 7 | SIM |
| 50 | PASSOU | Quimera Tranquilidade | Correta | 100 | 4985 | 565 | 8 | SIM |
| 51 | PASSOU | Quimera Tranquilidade | Errada | 85 | 5005 | 515 | 0 | SIM |
| 52 | PASSOU | Quimera Tranquilidade | Correta | 85 | 5105 | 525 | 1 | SIM |
| 53 | PASSOU | Quimera Tranquilidade | Correta | 85 | 5205 | 535 | 2 | SIM |
| 54 | PASSOU | Slime Dourado dos Juros | Correta | 85 | 5385 | 585 | 3 | SIM |
| 55 | PASSOU | Espírito da Proteção | Errada | 70 | 5405 | 585 | 0 | SIM |
| 56 | PASSOU | Espírito da Proteção | Correta | 70 | 5505 | 645 | 1 | SIM |
| 57 | PASSOU | Espírito da Proteção | Correta | 70 | 5605 | 655 | 2 | SIM |
| 58 | PASSOU | Guardião SPF | Correta | 70 | 5705 | 665 | 3 | SIM |
| 59 | PASSOU | Espectro do Serasa | Correta | 70 | 5805 | 675 | 4 | SIM |
| 60 | PASSOU | Hidra dos Seguros | Errada | 45 | 5825 | 675 | 0 | SIM |
| 61 | PASSOU | Espectro da Franquia | Correta | 45 | 5925 | 685 | 1 | SIM |
| 62 | PASSOU | Mercador da Renegociação | Correta | 45 | 6025 | 695 | 2 | SIM |
| 63 | PASSOU | Mercador da Renegociação | Correta | 45 | 6125 | 705 | 3 | SIM |
| 64 | PASSOU | Oráculo da Parcela Balão | Correta | 45 | 6225 | 715 | 4 | SIM |
| 65 | PASSOU | Mercador da Renegociação | Correta | 45 | 6335 | 725 | 5 | SIM |
| 66 | PASSOU | Mago da Reorganização | Correta | 45 | 6445 | 785 | 6 | SIM |
| 67 | PASSOU | Mercador da Renegociação | Correta | 45 | 6555 | 795 | 7 | SIM |
| 68 | PASSOU | Mago da Reorganização | Correta | 45 | 6665 | 805 | 8 | SIM |
| 69 | PASSOU | Oráculo da Parcela Balão | Errada | 30 | 6685 | 805 | 0 | SIM |
| 70 | PASSOU | Cronomante do CET | Correta | 30 | 6785 | 815 | 1 | SIM |
| 71 | PASSOU | Espectro do Serasa | Correta | 30 | 6945 | 825 | 2 | SIM |
| 72 | PASSOU | Guardião da Restrição | Correta | 30 | 7045 | 835 | 3 | SIM |
| 73 | PASSOU | Coletor Sombrio | Correta | 30 | 7145 | 845 | 4 | SIM |
| 74 | PASSOU | Carrasco dos Juros | Correta | 30 | 7255 | 855 | 5 | SIM |
| 75 | PASSOU | Arquimago da Reorganização | Correta | 30 | 7497 | 890 | 6 | SIM |
| 76 | PASSOU | Mercador da Renegociação | Errada | 15 | 7517 | 890 | 0 | SIM |
| 77 | PASSOU | Oráculo do Portal | Correta | 15 | 7617 | 900 | 1 | SIM |
| 78 | PASSOU | Oráculo da Parcela Balão | Errada | 100 | 7637 | 875 | 0 | SIM |
| 79 | PASSOU | Cronomante do CET | Correta | 100 | 7737 | 885 | 1 | SIM |
| 80 | PASSOU | Cavaleiro do Leasing | Correta | 100 | 7837 | 895 | 2 | SIM |
| 81 | PASSOU | Espectro do VRG | Correta | 100 | 7937 | 905 | 3 | SIM |
| 82 | PASSOU | Espectro do VRG | Correta | 100 | 8037 | 915 | 4 | SIM |
| 83 | PASSOU | Espectro do VRG | Correta | 100 | 8147 | 925 | 5 | SIM |
| 84 | PASSOU | Guardião do Arrendamento | Correta | 100 | 8257 | 935 | 6 | SIM |
| 85 | PASSOU | Guardião do Arrendamento | Correta | 100 | 8367 | 945 | 7 | SIM |
| 86 | PASSOU | Guardião do Arrendamento | Correta | 100 | 8477 | 955 | 8 | SIM |
| 87 | PASSOU | Guardião do Arrendamento | Errada | 85 | 8497 | 955 | 0 | SIM |
| 88 | PASSOU | Devorador da Rescisão | Correta | 85 | 8597 | 965 | 1 | SIM |
| 89 | PASSOU | Devorador da Rescisão | Correta | 85 | 8697 | 975 | 2 | SIM |
| 90 | PASSOU | Dragão do Leasing | Correta | 85 | 8917 | 1010 | 3 | SIM |
| 91 | PASSOU | Guardião do Contrato | Correta | 100 | 9017 | 1020 | 4 | SIM |
| 92 | PASSOU | Arauto da Cessão | Correta | 100 | 9127 | 1030 | 5 | SIM |
| 93 | PASSOU | Arauto da Cessão | Correta | 100 | 9237 | 1040 | 6 | SIM |
| 94 | PASSOU | Arauto da Cessão | Correta | 100 | 9347 | 1050 | 7 | SIM |
| 95 | PASSOU | Arauto da Cessão | Correta | 100 | 9457 | 1060 | 8 | SIM |
| 96 | PASSOU | Cavaleiro Cedente | Errada | 85 | 9477 | 1110 | 0 | SIM |
| 97 | PASSOU | Arauto da Cessão | Correta | 85 | 9577 | 1120 | 1 | SIM |
| 98 | PASSOU | Cavaleiro Cedente | Correta | 85 | 9677 | 1130 | 2 | SIM |
| 99 | PASSOU | Arauto da Cessão | Correta | 85 | 9777 | 1140 | 3 | SIM |
| 100 | PASSOU | Espectro Cessionário | Correta | 85 | 9877 | 1150 | 4 | SIM |
| 101 | PASSOU | Guardião do Contrato | Errada | 70 | 9957 | 1150 | 0 | SIM |
| 102 | PASSOU | Espectro Cessionário | Correta | 70 | 10057 | 1160 | 1 | SIM |
| 103 | PASSOU | Cavaleiro Cedente | Correta | 70 | 10157 | 1170 | 2 | SIM |
| 104 | PASSOU | Arauto da Cessão | Correta | 70 | 10257 | 1180 | 3 | SIM |
| 105 | PASSOU | Rei Cessionário | Errada | 45 | 10277 | 1180 | 0 | SIM |
| 106 | PASSOU | Corvo Dourado da Wiki | Correta | 45 | 10457 | 1230 | 1 | SIM |
| 107 | PASSOU | Fera da Vistoria | Correta | 45 | 10557 | 1240 | 2 | SIM |
| 108 | PASSOU | Guardião do Chassi | Correta | 45 | 10657 | 1250 | 3 | SIM |
| 109 | PASSOU | Fera da Vistoria | Correta | 45 | 10757 | 1260 | 4 | SIM |
| 110 | PASSOU | Guardião do Chassi | Correta | 45 | 10867 | 1270 | 5 | SIM |
| 111 | PASSOU | Golem da Garantia | Correta | 100 | 10977 | 1280 | 6 | SIM |
| 112 | PASSOU | Guardião do Chassi | Correta | 100 | 11087 | 1290 | 7 | SIM |
| 113 | PASSOU | Guardião do Chassi | Correta | 100 | 11197 | 1300 | 8 | SIM |
| 114 | PASSOU | Guardião do Chassi | Errada | 85 | 11217 | 1300 | 0 | SIM |
| 115 | PASSOU | Golem da Garantia | Correta | 85 | 11317 | 1310 | 1 | SIM |
| 116 | PASSOU | Golem da Garantia | Correta | 85 | 11417 | 1320 | 2 | SIM |
| 117 | PASSOU | Golem da Garantia | Correta | 85 | 11517 | 1330 | 3 | SIM |
| 118 | PASSOU | Corvo Dourado da Wiki | Correta | 85 | 11697 | 1380 | 4 | SIM |
| 119 | PASSOU | Fera da Vistoria | Correta | 85 | 11807 | 1390 | 5 | SIM |
| 120 | PASSOU | Colosso da Garantia | Correta | 85 | 12049 | 1425 | 6 | SIM |
| 121 | PASSOU | Fera da Vistoria | Correta | 85 | 12159 | 1435 | 7 | SIM |
| 122 | PASSOU | Sentinela FIPE | Correta | 85 | 12269 | 1445 | 8 | SIM |
| 123 | PASSOU | Sentinela FIPE | Errada | 70 | 12289 | 1445 | 0 | SIM |
| 124 | PASSOU | Olho Mecânico | Correta | 70 | 12389 | 1455 | 1 | SIM |
| 125 | PASSOU | Olho Mecânico | Correta | 70 | 12489 | 1465 | 2 | SIM |
| 126 | PASSOU | Escriba Sombrio | Correta | 70 | 12589 | 1475 | 3 | SIM |
| 127 | PASSOU | Escriba Sombrio | Correta | 70 | 12689 | 1485 | 4 | SIM |
| 128 | PASSOU | Escriba Sombrio | Correta | 70 | 12799 | 1495 | 5 | SIM |
| 129 | PASSOU | Guardião da Procuração | Correta | 70 | 12909 | 1505 | 6 | SIM |
| 130 | PASSOU | Espírito da Revisão | Correta | 70 | 13019 | 1515 | 7 | SIM |
| 131 | PASSOU | Orbe Mobilize | Correta | 70 | 13217 | 1515 | 8 | SIM |
| 132 | PASSOU | Espírito da Revisão | Errada | 55 | 13237 | 1515 | 0 | SIM |
| 133 | PASSOU | Espírito da Revisão | Correta | 55 | 13337 | 1525 | 1 | SIM |
| 134 | PASSOU | Duende Move Brasil | Errada | 40 | 13357 | 1525 | 0 | SIM |
| 135 | PASSOU | Guardião do Cofre N1 | Correta | 40 | 13577 | 1560 | 1 | SIM |