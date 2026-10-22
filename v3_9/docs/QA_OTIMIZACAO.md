# QA — RPG Pixel Otimizado

Resultado: 10 passaram / 0 falharam.

| Status | Teste | Resultado |
|---|---|---|
| PASSOU | Fidelidade das 135 questões | Questões e respostas permanecem idênticas à versão anterior. |
| PASSOU | Estrutura das questões | Todas possuem 4 alternativas e resposta válida. |
| PASSOU | Monstros redesenhados | 56 comuns + 6 raros em 64x64; 9 chefes em 96x96; todos animados. |
| PASSOU | Personagens animados | 18 GIFs válidos: 3 classes × 6 estados, todos com pelo menos 2 frames. |
| PASSOU | Layout desktop sem descer para responder | Campo de batalha e questão lado a lado dentro da altura do player. |
| PASSOU | Layout para janela baixa | Compactação específica para o tamanho de janela semelhante ao screenshot do Engage. |
| PASSOU | Otimização SCORM | Commits intermediários limitados; respostas e marcos continuam forçando persistência. |
| PASSOU | Renderização otimizada | Scanline pesada removida; sprites visuais usam GIFs pequenos com <img>. |
| PASSOU | Sintaxe JavaScript | 8 arquivos passaram no node --check. |
| PASSOU | Offline | Sem CDN, API ou recursos externos. |

## Correções específicas após o teste no Engage
- Os monstros antigos estavam pequenos e, em alguns momentos, praticamente invisíveis na arena. Agora comuns/raros usam 64x64 e chefes 96x96, ampliados com `image-rendering: pixelated`.
- A arena deixou de ocupar toda a largura e empurrar a prova para baixo. Em desktop, a arena fica à esquerda e as perguntas à direita.
- O botão ATACAR permanece visível na mesma tela para a altura de player observada no screenshot.
- O jogo reduz automaticamente tamanhos quando a janela possui até 760px de altura.
- O efeito de scanline foi removido e o número de elementos animados simultaneamente foi reduzido.
- A frequência de `LMSCommit` foi reduzida para melhorar a resposta dentro do Engage.

## Observação
A dimensão exata do iframe é controlada pelo Engage. Caso a empresa use um player ainda menor que o screenshot enviado, o layout possui fallback responsivo para tablet/telas estreitas.