# Atualização v3.5

## Uso

No mapa, abra BOLSA DO GUARDIÃO para ver os seis cosméticos. Nos checkpoints, VISITAR MERCADOR permite comprar por 50 ouro; a bolsa permite equipar/remover. O item equipado aparece no retrato e no campo de batalha. Voltar não avança a avaliação.

Eventos têm duas escolhas opcionais. Escolher aplica uma única recompensa em HP, ouro ou coleção; continuar sem escolher não concede prêmio. O resultado fica salvo e os botões ficam desabilitados após a decisão. Não há bônus de XP nesses novos eventos. Eventos antigos já recompensados continuam com o resultado antigo.

No final, CADERNO DO GUARDIÃO reúne as questões erradas acompanhadas por esta versão, agrupadas por tema. Mostra a resposta correta, feedback e referência do banco original. Não permite responder novamente ou mudar a nota. Para saves antigos, a interface identifica o trecho sem histórico individual; não reconstrói os erros a partir dos totais.

## Persistência e compatibilidade

O save mantém v:2 e a chave standalone anterior. Campos adicionais: fv:35, eq (item equipado), wr (bitmap hexadecimal de 34 caracteres), rs (respostas anteriores sem histórico individual) e et (último ticket de evento consumido). No LMS, cmi.suspend_data continua sendo a fonte canônica por aluno/tentativa; não se importa progresso local compartilhado.

Bolsa/loja/caderno são telas opcionais: sua abertura não muda scr/ph/q. Recarregar retorna à tela-base (mapa/checkpoint/resultado) e preserva alterações confirmadas. Falhas de salvamento são informadas; enquanto houver falha, dados em memória não equivalem a confirmação durável.

Nenhum texto de questão/feedback é copiado para o save. O limite de 4.096 caracteres continua protegido, sem truncamento.

## Validação desta entrega

- Três jornadas completas por cliques reais na UI: 135/135 →100% passed; 0/135 →0% failed; 102/135 →75% passed.
- Todas concluíram três capítulos, nove chefes, nove checkpoints e 18 eventos, com compras/equipamentos e recargas. O caderno coincidiu exatamente com os erros das jornadas.
- 21 testes de progressão, 19 de eventos e 23 de regressão SCORM/save aprovados.
- 31 testes de funcionalidades no navegador, 7 regressões de interface da v3.4, 19 integrações de SCORM e 3 testes finais de foco aprovados.
- Maior save observado nas jornadas finais, incluindo eventos: 1.006 caracteres.
- Layouts de bolsa, loja, caderno e eventos em 1366×768,1100×600 e390×844; rolagem vertical permitida em telas pequenas, sem rolagem horizontal.

Navegador: Chromium real headless via Playwright; SCORM: API simulada em janela pai com iframe. Sem acesso ao Engage real. Testes não medem duração humana ou eficácia pedagógica. O embaralhamento seguro da apresentação das alternativas fica para uma próxima atualização; nesta entrega o padrão original foi mantido.
