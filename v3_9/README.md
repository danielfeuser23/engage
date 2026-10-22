# Versão atual: v3.9

Atualização artística: veja [docs/ATUALIZACAO_ARTISTICA_V3_9.md](docs/ATUALIZACAO_ARTISTICA_V3_9.md). O texto anterior abaixo foi preservado como histórico.

---

# A Jornada do Guardião N1 — v3.8

Importe Mobilize_Banco_N1_RPG_Pixel_v3_8_SCORM_1_2.zip como SCORM 1.2; imsmanifest.xml e index.html estão na raiz.

Esta versão acrescenta três missões opcionais de atendimento nos checkpoints, identidade narrativa/visual para os nove chefes e revisão guiada no caderno final com marcações compactas e persistentes. Todas reutilizam conteúdo e arte locais.

As 135 questões e aprovação em 70% foram preservadas. Mecânicas de RPG e marcações de consulta não alteram a nota. Saves v2 válidos permanecem compatíveis com defaults para ms/rc. Validação local em Chromium e API SCORM simulada; homologação no Engage real pendente.

Detalhes em docs/ATUALIZACAO_V3_8.md. As seções seguintes são histórico das versões anteriores.

---

# A Jornada do Guardião N1 — v3.7

Importe Mobilize_Banco_N1_RPG_Pixel_v3_7_SCORM_1_2.zip como SCORM 1.2. imsmanifest.xml e index.html estão na raiz.

Revisão de usabilidade: classe com estado acessível, foco contínuo pelo teclado, feedback com referência e próximo marco, custo da recuperação informado e caderno filtrável por tema. Rótulos dos confrontos estão coerentes com as regras da avaliação. A arte da v3.6 e as funcionalidades anteriores foram preservadas.

As 135 questões e a aprovação em 70% continuam iguais. Saves v2 válidos permanecem compatíveis. Validação em navegador Chromium e API SCORM simulada; homologação no Engage real pendente.

Veja docs/ATUALIZACAO_V3_7.md. As seções seguintes são histórico das versões anteriores.

---

# A Jornada do Guardião N1 — v3.6

Importe `Mobilize_Banco_N1_RPG_Pixel_v3_6_SCORM_1_2.zip` diretamente como SCORM 1.2. `imsmanifest.xml` e `index.html` ficam na raiz.

Esta revisão traz três ambientes pixel art originais, novo acabamento de interface, HUD numérico atualizado, chefes com apresentação destacada e melhorias visuais na bolsa, loja, eventos, resultado e caderno. A base v3.5 foi preservada e suas funcionalidades continuam disponíveis.

As 135 questões, alternativas, ordem, gabaritos, feedbacks e referências estão idênticos à base; aprovação em 70% preservada. HP, XP, ouro, itens e escolhas não alteram a nota. Saves anteriores válidos continuam compatíveis.

Quatro bugs herdados foram corrigidos: HUD desatualizado, sobreposição dos painéis no celular, aviso falso de save ao retomar evento e confirmação incorreta de término quando o LMS recusa tempo de sessão. Uma sobreposição de legenda identificada na integração também foi corrigida.

Validação local: jornadas completas com 75%, 100% e 0%, mais testes de domínio, SCORM, interface, textos longos, teclado e retomada. Maior save observado:991/4.096 caracteres. SCORM testado com simulador em iframe; Engage real ainda precisa ser homologado.

Detalhes em `docs/ATUALIZACAO_V3_6.md`. Textos e relatórios de versões anteriores abaixo são históricos.

---

# A Jornada do Guardião N1 — v3.5

Pacote: `Mobilize_Banco_N1_RPG_Pixel_v3_5_SCORM_1_2.zip`.
Importe diretamente como SCORM 1.2. `imsmanifest.xml` e `index.html` estão na raiz.

## Funcionalidades desta versão

- **Bolsa do Guardião:** no mapa e nos checkpoints; seis itens com prévia no herói, descrição, posse, equipamento e remoção. Um acessório por vez, visível no retrato/HUD.
- **Mercador dos checkpoints:** catálogo opcional com preços de 50 ouro; posse, saldo, compras e equipamento persistem. Itens já possuídos não são cobrados novamente.
- **Caderno do Guardião:** somente após concluir; questões erradas agrupadas por tema com resposta correta, feedback e referência originais. Histórico novo ocupa um bitmap de 34 caracteres. Saves antigos mostram a limitação do histórico anterior sem inventar erros.
- **Eventos com escolhas:** seis tipos com duas opções, podendo seguir sem prêmio. Escolha, recompensa e ticket de consumo persistem; recarga não reaplica o prêmio. Mudam apenas HP, ouro ou coleção. Eventos antigos já recompensados permanecem concluídos.

As 135 questões, alternativas, gabaritos e feedbacks estão idênticos aos da v3.4. Aprovação em 70% e padrão de alternativas foram mantidos. Recursos de RPG não alteram a nota. As correções da v3.4 e o formato de save v2 foram preservados; campos extras identificam as funcionalidades da v3.5.

Não há login novo, serviço externo ou dependência adicional no jogo. Som opcional, redução de movimento e navegação por teclado continuam disponíveis.

Validação: três jornadas completas por interface (100%, 0% e 75%) em Chromium real automatizado, mais testes de domínio, migração, SCORM, compras, escolhas, falhas, layouts e foco. A API SCORM foi simulada em iframe. A homologação no Engage real permanece pendente.

Veja `docs/ATUALIZACAO_V3_5.md`. Os relatórios de versões anteriores abaixo são históricos.

---

# Mobilize Banco N1 — A Jornada do Guardião N1 — v3.4 corrigida

Pacote: `Mobilize_Banco_N1_RPG_Pixel_v3_4_CORRIGIDO_SCORM_1_2.zip`.
Importe o ZIP diretamente como SCORM 1.2; `imsmanifest.xml` fica na raiz.

Esta revisão corrige navegação durante ataques, perda do rascunho de criação, compra repetida de cosméticos, fundos de chefes, armazenamento e integração SCORM. Reduzir animações agora congela os GIFs; silenciar interrompe sons em andamento. Controles têm melhorias de foco e identificação acessível. Não foram acrescentadas novas mecânicas, perguntas ou serviços externos.

As 135 questões, alternativas, gabaritos e feedbacks estão byte a byte iguais ao original; aprovação permanece em 70%. Vida, XP, ouro, itens e sorte continuam independentes da nota. Saves v2 válidos são mantidos. No LMS, a retomada usa exclusivamente os dados da tentativa fornecidos pelo player; dados locais compartilhados não são importados para outra tentativa/aluno.

Validação desta revisão: três jornadas completas em Chromium via Playwright (135/135 acertos, 0/135 e 102/135), nove chefes e três capítulos por jornada, mais testes dirigidos de falhas, salvamento, retomada e interface. SCORM foi validado com API simulada em iframe. A importação e a persistência no Engage real ainda precisam ser confirmadas na plataforma.

Veja `docs/CORRECOES_V3_4.md`. Relatórios e QA das versões anteriores abaixo são históricos.

---

## Versão v3.3 — Ajuste final de navegação

- O modo compacto das telas de transição agora também é ativado em alturas de até 820px.
- Corrige botões ENTRAR do mapa que podiam ficar abaixo da dobra em 1366×768.
- Nenhuma questão, resposta, feedback ou regra foi alterada.

## Versão v3.2 — Fix de navegação no Engage

Esta versão adiciona correções de viewport e bloqueio de clique após um zeramento completo da interface. Veja `docs/QA_V3_2_ZERAMENTO.md`.

# MOBILIZE BANCO N1 — A JORNADA DO GUARDIÃO N1
## Versão Pixel RPG Otimizada • SCORM 1.2

Esta versão foi reconstruída a partir do jogo anterior e mantém as mesmas 135 questões, alternativas, respostas corretas e feedbacks.

### Melhorias desta versão
- Batalha redesenhada para desktop: campo de batalha à esquerda e questão à direita.
- No player do Engage, o aluno não precisa mais descer a página para encontrar as alternativas e o botão ATACAR.
- Interface se adapta automaticamente a janelas de pouca altura.
- 56 monstros comuns redesenhados em 64x64.
- 6 criaturas raras redesenhadas.
- 9 chefes redesenhados em 96x96.
- Sprites animados em GIF pixel art, mais visíveis e com menor custo de layout.
- Personagem continua com estados de idle, ataque, dano, vitória, derrota e XP.
- Cenários reconstruídos com mais profundidade visual.
- Remoção do efeito de scanline pesado da batalha.
- Menos partículas simultâneas.
- `LMSCommit` reduzido durante renders intermediários para melhorar a resposta no Engage.
- Progresso continua salvo após respostas e checkpoints.
- Som continua iniciando no mudo.
- Modo Reduzir Animações mantido.
- SCORM 1.2 e aprovação em 70% preservados.

### Estrutura
- `index.html`
- `css/game.css`
- `js/questions.js`
- `js/monsters.js`
- `js/scorm.js`
- `js/save.js`
- `js/audio.js`
- `js/events.js`
- `js/ui.js`
- `js/game.js`
- `assets/sprites/`
- `assets/backgrounds/`
- `assets/audio/`
- `assets/ui/`

### Importação
Envie `Mobilize_Banco_N1_RPG_Pixel_Optimizado_SCORM_1_2.zip` diretamente para o Engage como SCORM 1.2.
Não descompacte antes de enviar.


## QA Final 19/10/2026
- 135/135 questões executadas pela interface.
- 9/9 chefes.
- 3/3 capítulos.
- Jornada mista, 0/135 e 135/135 concluídas.
- Save/Resume, SCORM, reinício, eventos, raros e responsividade testados.
- Correção aplicada ao contador de chefes para refletir todos os confrontos superados.
- Relatório: `docs/Relatorio_QA_Mobilize_Banco_N1_RPG.md`.


## Correção v3.1
- Corrigido bloqueio na primeira aparição de chefe: o overlay visual `bossFog` interceptava o clique do botão **ENFRENTAR** em alguns navegadores/players SCORM.
- O overlay agora ignora eventos do mouse e o botão fica explicitamente acima das camadas visuais.
- A tela de apresentação do chefe também foi compactada para caber melhor no player do Engage.
