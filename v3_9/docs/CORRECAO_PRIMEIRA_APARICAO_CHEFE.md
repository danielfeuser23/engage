# Correção — primeira aparição do chefe

## Problema encontrado
Na tela de introdução do chefe, a camada visual `.bossFog` ocupava toda a área da tela. Como ela não tinha `pointer-events: none`, podia ficar acima da região clicável e impedir o botão **ENFRENTAR** de receber o clique dentro de alguns players/navegadores SCORM, incluindo o comportamento relatado no Engage.

## Correções aplicadas
- `.bossFog` agora usa `pointer-events: none` e z-index controlado.
- botão **ENFRENTAR** recebeu z-index superior e `pointer-events: auto`.
- a tela de chefe foi compactada para caber melhor em players de pouca altura.
- adicionado fallback: clicar em qualquer lugar da tela de apresentação também inicia a batalha.
- adicionado fallback por teclado: ENTER ou ESPAÇO iniciam a batalha.
- foco é enviado automaticamente ao botão ENFRENTAR.
- foi adicionada proteção contra duplo disparo da transição.
- o estado é salvo com commit forçado antes de entrar na batalha do chefe.

## Verificações
- `game.js` passou em `node --check`.
- `imsmanifest.xml` continua bem-formado e na raiz do SCORM.
- banco das 135 questões não foi alterado.
- ZIP SCORM testado quanto à integridade.
