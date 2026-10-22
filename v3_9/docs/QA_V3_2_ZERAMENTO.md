# QA v3.2 — Navegação e zeramento completo

Data do teste: 19/10/2026

## Problemas encontrados e corrigidos

1. Overlay da primeira aparição do chefe
   - Já corrigido na v3.1 com `pointer-events: none` na névoa e prioridade de clique do botão ENFRENTAR.

2. Botões de telas de transição abaixo da dobra no player do Engage
   - Em uma janela útil de 1366×650, o botão ENTRAR do mapa ficava abaixo da área visível.
   - A mesma classe de problema poderia atingir chefe, evento, checkpoint, resultado de capítulo e tela final.
   - Corrigido com um layout compacto específico para desktop com altura <= 760px.

3. Toast de conquista podia bloquear o botão CONTINUAR
   - Após uma conquista, a notificação fixa aparecia no canto inferior direito e podia ficar sobre o botão CONTINUAR.
   - Corrigido com `pointer-events: none` na notificação.

## Zeramento da interface

O jogo foi percorrido em navegador Chromium real usando hit-testing (`elementFromPoint`) em todos os controles antes da ativação. As 135 questões foram carregadas e respondidas através da interface do jogo.

- Questões testadas: 135 / 135
- Questões sem scroll da página durante batalha: 135 / 135
- Chefes atravessados: 9 / 9
- Checkpoints atravessados: 9 / 9
- Capítulos concluídos: 3 / 3
- Todos os 6 tipos de evento encontrados: camp, chest, item, merchant, potion, scroll
- Jogo zerado: SIM
- Respostas contabilizadas: 135 / 135
- Acertos da execução: 122 / 135
- Nota SCORM antes do reinício: 90%
- Status SCORM antes do reinício: `passed`
- Chefes contabilizados: 9 / 9
- Melhor combo: x21
- Bloqueios de clique detectados após as correções: 0
- Erros JavaScript detectados: 0
- Nova Jornada zerou respostas: 0

## Teste da primeira aparição de chefe

Todos os nove botões ENFRENTAR foram verificados por hit-testing. Em 1366×650, o botão ficou dentro da viewport e foi o elemento atingido no centro do clique em todos os chefes.

## Integridade do conteúdo

SHA-256 de `js/questions.js` antes e depois das correções:

`083d744d0b064cef98ab731b386663f971105eaccd285b0a10b8df8f9fdcb5c4`

As questões não foram alteradas.

## Verificações estáticas

- JavaScript: PASSOU
- `imsmanifest.xml`: PASSOU
- Dependências externas adicionadas: NÃO

## Observação sobre tempo do QA

As questões 1–15 foram executadas com o tempo normal de feedback/animação. Após o primeiro chefe, o próprio controle visível “Reduzir animações” foi ativado para acelerar o restante do percurso sem pular questões nem manipular o contador interno. O fluxo de 135 questões continuou sendo executado pela interface.
