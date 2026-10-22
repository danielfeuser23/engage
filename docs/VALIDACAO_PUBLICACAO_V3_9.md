# Validação para publicação — Guardião N1 v3.9

Validação nova em 22/10/2026, realizada sobre cópia isolada da v3.9 preservada. **Os critérios técnicos de publicação foram atendidos nos cenários executados.** Nenhum novo bug do jogo foi confirmado; não houve alteração do runtime, do banco ou da versão do curso. Publicação de branch e abertura de PR são etapas separadas deste relatório; a main não deve receber push direto ou merge automático.

## Artefato e integridade

Curso: `Mobilize_Banco_N1_RPG_Pixel_v3_9_SCORM_1_2.zip`, SCORM 1.2, 180 arquivos, `imsmanifest.xml` na raiz e 3.626.829 bytes. SHA-256:

`4e80f2a554194f9f900da65448b15f5dd205e7da78b84303d329ac494c56ee5d`

A fonte em `v3_9/`, o ZIP em `dist/`, a extração e a cópia usada nos testes são byte a byte iguais. Os 150 hashes do runtime da jornada coincidem com os arquivos destinados ao Git. O [manifesto completo](evidencias/manifesto_curso.json) registra os 180 arquivos. As 135 questões, ordem, alternativas, gabaritos, feedbacks e referências foram preservadas integralmente. Aprovação em 70%, independente de HP, XP, ouro, itens, sorte ou velocidade.

## Jornada concluída pela interface

Foi criado um personagem novo e respondidas 135 questões em Chromium real, automatizado por cliques. O script leu o gabarito para escolher deliberadamente acertos e erros. Não injetou progresso, seed, contadores, nota ou inventário na tentativa concluída.

| Resultado | Valor |
|---|---:|
| Questões / acertos / erros | 135 / 102 / 33 |
| Nota / status enviado à API simulada | 75% / `passed` |
| Capítulos / chefes / missões | 3 / 9 / 3 |
| Checkpoints / eventos | 9 / 18 |
| Escolhas de evento / ignorados | 17 / 1 |
| Compras / equipamentos | 3 / 3 |
| Quedas com recuperação / recargas | 3 / 8 |
| Encontros raros naturais | 5 |
| Erros conferidos / etapas de revisão marcadas | 33 / 33 |
| Maior suspend_data observado | 1.023 / 4.096 caracteres |

Todos os seis tipos de evento ocorreram naturalmente: fogueira, baú, poção, mercador, item e pergaminho. Foram usados bolsa, loja, equipamentos, missões e revisão; o caderno foi comparado exatamente com os erros da tentativa, incluindo feedbacks e referências. As marcações e a nota persistiram após recarga. Marcar consulta foi ação de QA, não comprovação de leitura externa ou domínio do conteúdo.

Para cobrir os seis comuns com arte nova, o runner escolheu uma tentativa com seed natural `841251`, criada normalmente pela interface, após três candidatos. As duas tentativas descartadas tinham zero respostas. A previsão dos encontros foi somente de leitura em uma cópia local das funções; o seed não foi alterado. Os 135 encontros reais foram registrados e os seis comuns renovados apareceram. Isso seleciona uma tentativa para cobertura e não garante o mesmo elenco em qualquer jornada comum.

Recargas cobriram seleção, feedback, checkpoint, eventos, missões e revisão. Não houve erro JavaScript, HTTP ou violação do simulador SCORM. A jornada usou movimento reduzido; movimento normal foi exercitado nos testes dirigidos de poses e confrontos.

Capturas: [feedback da questão 135](capturas/pergunta135_feedback.png), [missão de Ravi](capturas/missao_ravi.png), [revisão dos 33 erros](capturas/revisao33.png) e [resultado completo](capturas/resultado_retomado.png). A última imagem retoma o save real fora do iframe, em modo local, para enquadrar todo o resultado: não é uma segunda jornada.

## Cobertura nova

| Conjunto | Resultado |
|---|---:|
| Domínio/SCORM e integração em navegador | 194/194 verificações; 12 JS com sintaxe válida |
| Interface: funcionalidades, regressões, foco, HUD, texto longo, referências e navegação | 86/86 |
| Retomada de poses, feedback longo dos chefes e releitura das missões | 2/2 + 6/6 + 3/3 |
| Arte: poses/equipamentos/elenco em três tamanhos e dois modos | 117/117 casos; 864 condições |
| Assets / restrições nativas | 36/36 + 36/36 |
| Mídias decodificadas / conjuntos de controle de som | 119 imagens + 9 WAVs / 2 aprovados |
| Missões, chefes e revisão integrados | 54/54 |
| Mecânicas adicionais | 57/57 |
| Fronteiras dos ranks finais | 8/8 |
| Recuperação, ouro baixo, marcos e caderno completo | 12/12 |
| ZIP extraído | 17 verificações aprovadas |

Os conjuntos se sobrepõem; a tabela não é uma contagem de bugs distintos. Fixtures testam condições dirigidas e não substituem a jornada. O [catálogo de mecânicas e cobertura](CATALOGO_MECANICAS.md) e o [resumo estruturado](evidencias/resumo_validacao.json) detalham o escopo.

As condições adicionais abrangem duas opções dos seis eventos em coleção vazia/completa (24 ramos), seis skips, recompensas já possuídas/indisponíveis, mercador sem ouro, HP completo, combos 1/5/10, evolução, sete conquistas, seis raros, três classes com nomes longos, ataque sem seleção, cliques repetidos, recarga e revisão sem/poucos/muitos erros ou histórico legado. Os ranks foram testados nas fronteiras de 129/128, 115/114, 95/94 e 81/80 acertos.

As telas foram verificadas em 1366×768, 1100×600 e 390×844. Arte, transparência, recortes, leitura, rolagem, foco, teclado, som opcional e movimento reduzido foram exercitados. As três classes têm seis poses; os nove chefes, três NPCs, seis comuns renovados e seis cosméticos foram conferidos. As outras 50 artes comuns e seis raras permanecem na versão anterior, como previsto no escopo artístico.

## Saves e SCORM

Foram retestados saves v2, histórico incompleto sem invenção de erros, isolamento entre alunos/tentativas, armazenamento bloqueado, recusa de suspend_data/commit, retry sem nova cobrança ou recompensa, inicialização, nota/status, session_time e encerramento. O dado canônico do LMS simulado prevaleceu na retomada.

Fronteira de aprovação: 94/135 → 69% `failed`; 95/135 → 70% `passed`. Exatamente 4.096 caracteres foram aceitos e 4.097 recusados sem truncamento. O stress dirigido observou 1.012 caracteres e esta jornada 1.023; são máximos observados, não um teto matemático de qualquer entrada possível.

O ZIP foi extraído e testado com NPC novo, compra/equipamento, missão/prêmio único, erro/HUD, pose após recarga, chefe e revisão. A API simulada registrou initialize, score/status, commit e finish. Eventos sintéticos de pagehide/bfcache não homologam todas as políticas reais de cache ou LMS.

## Problemas e retestes

Nenhum novo bug foi confirmado no produto. Duas expectativas de QA foram corrigidas: nome de 24 caracteres terminando em espaço é corretamente salvo com trim(), e o botão ATACAR permanece corretamente desabilitado antes da seleção. O teste de nome foi repetido nas três classes e depois no conjunto completo de 57 casos; o auxiliar mobile passou após selecionar uma alternativa antes de verificar foco. Logs iniciais e finais foram preservados no pacote local de evidências. Nenhuma dessas correções alterou o jogo.

A regressão visual antiga de hurt/defeat após recarga e o alinhamento do chapéu, já corrigidos na v3.9, passaram novamente. Não se promete ausência absoluta de bugs.

## Reprodução e publicação

Veja [REPRODUZIR_TESTES.md](REPRODUZIR_TESTES.md). O QA publicado usa raiz relativa, servidor efêmero e fixtures compactas de hashes; não depende de uma cópia da v3.8 ou de caminhos absolutos do ambiente. Sete suites Node, o audit de assets e a integração foram exercitados novamente pelo runner portável; os testes de mídia também passaram. As dependências de QA não são dependências do curso.

O repositório recebe somente a fonte, assets locais, ZIP importável, documentação, quatro capturas selecionadas e testes. Brutos de geração e grandes pacotes de evidências permanecem fora do histórico Git. Não foram acrescentados login, serviços externos ou bibliotecas ao jogo. A revisão não encontrou credenciais nos arquivos destinados ao commit; dados de aluno usados nos testes são mocks. Os endereços institucionais funcionais do banco de questões original foram preservados como conteúdo da avaliação.

## Limitações

**Sem acesso ao Engage real.** Importação, área útil do player, tentativas, retomada entre dispositivos/sessões e nota/status nos relatórios ainda precisam de homologação no LMS. Os ensaios usaram Chromium headless; não houve aparelho físico, outros motores de navegador, auditoria completa com leitor de tela ou turma piloto. WAVs e controles foram verificados, sem audição humana. Não se mediu tempo humano, aprendizagem ou diversão.
