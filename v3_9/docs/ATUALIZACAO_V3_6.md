# A Jornada do Guardião N1 — revisão visual v3.6

## Implementado

- Arte pixel original local em um atlas com três ambientes: central bancária, arquivo e cofre; seleção por capítulo na abertura/batalha/confronto, com sprites originais preservados.
- Nova apresentação de painéis, tipografia, respostas, feedbacks, indicadores e botões. Perguntas longas podem rolar em desktop; telas pequenas usam rolagem vertical normal.
- Herói e inimigos com escala responsiva, contorno, plataformas e sombras; chefes com moldura, selo de capítulo e número do confronto.
- Bolsa/loja com prévias maiores, posse/equipamento destacados; eventos com escolha e resultado claros; resultado com nota em destaque; caderno com agrupamento legível.
- Redução de movimento, teclado, som opcional e pixel art sem fontes/serviços externos mantidos.

## Bugs corrigidos

1. HUD não refletia a resposta até a pergunta seguinte. Agora HP, corações, XP, nível, ouro, combo, total respondido e barra superior são sincronizados imediatamente.
2. Painéis de herói/inimigo se sobrepunham em 390×844. Larguras responsivas e nomes visualmente truncados preservam os dois painéis; o texto completo permanece no DOM e no título.
3. Recarregar evento saudável mostrava falha de save. A retomada agora confirma o estado carregado sem aplicar a recompensa novamente. Falhas reais continuam visíveis.
4. LMS recusando session_time podia fazer finish retornar sucesso. O término passa a considerar tempo, commit e finish e mantém o primeiro diagnóstico, ainda tentando encerrar.
5. Na integração visual, a legenda de território ficava parcialmente sob o HUD. O posicionamento agora mede a maior altura dos painéis e mantém intervalo de 12px, inclusive ao redimensionar.

## Validação

Jornada completa mista repetida depois do último ajuste:135 questões, 102 acertos, 75% passed, três capítulos, nove chefes, nove checkpoints,18eventos e caderno com33 erros. Também concluídas jornadas de135 acertos e135 erros com100% passed e0% failed. As jornadas usam cliques na interface, com recargas, compras/equipamentos e escolhas; contadores/notas não foram injetados.

Testes:21 de progressão,19 de eventos,27 de SCORM/save,19 de integração,31 de funcionalidades,7 de regressões,3 de foco,10 de bugs,8 de textos longos e12 combinações de posicionamento/resize aprovados. Maior save observado nas três jornadas:991 caracteres, abaixo de 4.096.

Mantidos byte a byte:135 questões, alternativas, ordem, gabaritos, feedbacks e referências. Aprovação em 70%, independente dos recursos de RPG. Saves v2 válidos e histórico da v3.5 compatíveis. O embaralhamento de alternativas segue como melhoria futura, sem implementação nesta versão.

Validação em Chromium real automatizado e API SCORM simulada em iframe. Homologação no Engage real permanece pendente; não houve certificação ADL. As notas dos testes não medem eficácia pedagógica ou diversão percebida.
