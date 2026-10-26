# Entrega executada — v4.0 / Fase 3

## Resultado e preservação

A Fase 3 foi implementada após os dois aceites: expansão do bestiário e produção dos seis cosméticos aprovados. Não é necessário repetir essas aprovações. Não houve início da Fase 4 ou 5.

Foram renovados os **47 comuns e cinco raros restantes**, totalizando **52 novas criaturas**. As seis criaturas renovadas anteriormente e as quatro do piloto foram preservadas, assim como os nove chefes. O catálogo mantém 56 comuns, seis raros e nove chefes; todos os 62 comuns/raros possuem tiles de 96×96. Nomes, famílias, probabilidades, perguntas e recompensas não foram alterados.

`js/questions.js` permanece byte a byte igual, SHA-256 `083d744d0b064cef98ab731b386663f971105eaccd285b0a10b8df8f9fdcb5c4`. Preservados Game Over, HP 100, dano 10/15, meta 39/45 e passScore 70, saves v2, migração, isolamento, histórico, antifarming, missões, eventos e revisão. A personalização das três classes conserva seus 42 frames e 324 aparências. A Fase 2 e o piloto da Fase 3, suas fontes e ZIPs, permanecem intactos.

## Artes e cosméticos

Nove folhas originais de monstros e uma folha original de cosméticos foram geradas e preparadas no build. Fontes, prompts, recortes e arquivos editáveis estão fora do SCO. O processo usa alpha binário, redução por vizinho mais próximo e até 32 cores opacas; não é geração nativa em 96 pixels nem conversão sem perda do bruto. As 52 novas criaturas têm quatro frames de 240 ms, loop de 960 ms e bob0,-1,0,+1: três imagens distintas, não quatro poses desenhadas. As durações e artes dos dez monstros já aprovados não foram normalizadas ou recriadas.

Chapéu32×32, capa/moldura64×64 com janela transparente54×54, e quatro emblemas20×20 receberam desenhos próprios. Chapéu usa pivôs por classe/pose/frame; a moldura não é anunciada como uma capa corporal animada. Os seis IDs e nomes permanecem, com preço de 50 ouro, compra única e um slot equipado. Quem já possui um item não paga novamente. PNGs locais substituem a apresentação principal dos glyphs; o fallback decorativo preserva acesso à avaliação se uma imagem falhar.

## Testes e limites da cobertura

| Frente | Resultado | Método |
|---|---:|---|
| Novos GIFs | 52 criaturas / 208 frames | Decodificação nativa, paleta, alpha, margens, round-trip e hashes |
| Bestiário completo | 868/868 | 62 criaturas × seis viewports × dois modos =744 casos com Investigador, mais124 encontros com as outras classes |
| Cosméticos/personalização | 213/213 | Chromium, fixtures, compras/equipamento, recargas, falhas/retry e layouts |
| Heróis recompostos | 4.536/4.536 paridades | 324 aparências ×14 frames, RGBA Canvas versus referência Python; exclui overlays CSS |
| Geometria dos cosméticos | 27.216/27.216 composições | 324 aparências ×14 frames ×6 itens; PNGs e corpos Canvas projetados pelas posições reais do DOM |
| Falha/recovery dos PNGs | 18/18 cenários | Seis itens ×três classes; requisição bloqueada, avatar preservado, resposta pela UI e recuperação após recarga |
| Módulos/SCORM | 295/295 | Dez suítes Node/VM, regras ativas e contratos legados isolados |
| ZIP extraído | 22/22 | Encontros dirigidos e novos personagens/edição/bolsa, desktop e celular |

Os viewports foram 1100×600, 1280×720, 1366×650, 1366×768, 1920×1080 e 390×844. A matriz de equipamentos usa uma aparência declarada por cenário; não é inspeção visual exaustiva de todas as aparências × todos os itens × todos os frames × todos os tamanhos. As comparações de pixels dos heróis não incluem a sobreposição dos cosméticos, que foi verificada separadamente na interface. Revisões visuais amostrais são identificadas nos relatórios, sem afirmar inspeção humana de cada composição.

A auditoria de geometria leu o corpo Canvas e o PNG do item, usando os deslocamentos obtidos do markup/CSS real em uma prancha nativa de96×96. Foram 27.216 composições, zero falhas de limites/transparência e zero avisos de pixels opacos dos óculos cobertos pelo chapéu. Não é comparação pixel a pixel de screenshots nem inspeção humana exaustiva. O probe anterior de 504 casos (42 frames × 6 itens × 2 penteados com óculos) fica registrado separadamente; não é somado como uma nova matriz de interface. A galeria seleciona capturas representativas para leitura; o pacote de evidências conserva todas as capturas registradas.

Fixtures e seeds dirigidas alcançam encontros raros e estados específicos. Elas são separadas da jornada real abaixo. Não houve aparelho físico, leitor de tela, auditoria WCAG completa, turma piloto ou Engage real.

## Bug confirmado, correção e reteste

**A capa podia ocultar o personagem quando seu PNG não carregava.** Reprodução: equipar `capa_guardiao` e bloquear a requisição de `assets/cosmetics/capa_guardiao.png` no navegador. O fallback compartilhado ocupava toda a camada, com fundo opaco `rgb(16,36,49)` e nível de sobreposição3; como a moldura mede120% do retrato, esse bloco cobria o Canvas do herói. O esperado era preservar o personagem e continuar a avaliação. O impacto confirmado foi visual no cenário de falha de asset; nota, respostas e propriedade do item não foram alteradas.

A correção mantém os nomes/ícones pequenos no HUD e catálogo, omite o preenchimento dos overlays que falham e usa somente um contorno violeta simplificado para a moldura. O CSS do curso foi corrigido antes da rodada e da jornada finais. As execuções anteriores permanecem identificadas nas pastas históricas das evidências e não são apresentadas como validação da versão entregue.

O reteste provocou18 falhas de PNG (três classes ×seis itens). Conferiu fallback sem painel opaco, pixels RGBA do avatar iguais à referência com a camada decorativa ocultada, resposta correta pela interface e recuperação da imagem após desbloqueio/recarga. Posse, equipamento, aparência e progresso foram preservados. As18 respostas dessas fixtures não são contadas como parte da jornada nova de135 perguntas. O cenário anterior está documentado em `antes_fix_fallback/frame_png_failure_visual_probe.json`, e o resultado final em `browser/cosmetic_png_failures.json`.

## Jornada final pela interface

Uma jornada nova respondeu **135 perguntas**, com **117 acertos e 18 erros**, 39/45 por capítulo. Nota enviada **86%**, status **passed**. Seed natural `689017`, sem injetar seed, progresso, recursos, inventário ou nota. Foram percorridos três capítulos, nove chefes, 3 missões, 17 escolhas de eventos e 1 evento(s) ignorado(s), 3 compras, 3 equipamentos, 14 recargas e 3 edições do perfil.

A seed natural produziu 53 IDs distintos de monstros comuns/raros e 11 encontros raros. Os demais encontros foram verificados nas fixtures do bestiário; não se afirma que as 62 criaturas apareceram naturalmente nesta jornada. Foram registradas 136 verificações das novas imagens decorativas durante bolsa, equipamentos, batalhas e resultado.

O caderno correspondeu exatamente aos 18 erros, com feedbacks e referências originais. As 18 marcações da revisão persistiram. A arte nova de cosméticos foi conferida durante a jornada, e as trocas de classe/aparência não alteraram recursos ou nota. Não houve erro JavaScript, HTTP de recursos do curso ou violação da API simulada. Os hashes do runtime e manifesto permaneceram iguais durante a jornada e coincidem com o ZIP.

Maior save observado na jornada: **1.309 caracteres**. O orçamento dirigido atual executou 13.824 amostras nos módulos reais, com máximo observado de **1.398 caracteres**, separadamente da jornada; isso não é prova de máximo absoluto. O curso mantém a guarda de 4.096 caracteres. Nenhuma imagem, base64, cache ou texto completo de questão é salvo no SCORM; os IDs e o campo compacto `ap` permanecem.

## Custos reais

| Item | Medida |
|---|---:|
| 52 GIFs novos | 766.752 B |
| 52 GIFs anteriores | 108.863 B |
| Acréscimo dos GIFs | 657.889 B |
| Seis PNGs de cosméticos | 5.686 B |
| js/cosmetics.js | 4.717 B |
| css/cosmetics.css | 3.235 B |
| ZIP SCORM | 3.328.045 B |

Esses são pesos reais dos arquivos. O cache e o compositor dos heróis continuam os da Fase 2; métricas de composição registradas nesta rodada ficam em `browser/composition_matrix.json`. Tempos do host Chromium não são garantia de latência no Engage ou celular físico, e buffers de pixels não representam heap ou memória total do processo.

## Regressões por suíte

| Suíte | Aprovados | Falhas |
|---|---:|---:|
| test-bosses.cjs | 35 | 0 |
| test-events.cjs | 19 | 0 |
| test-guided-review.cjs | 18 | 0 |
| test-missions.cjs | 20 | 0 |
| test-progression.cjs | 21 | 0 |
| test-scorm-extensions.cjs | 14 | 0 |
| test-scorm-save.cjs | 27 | 0 |
| test_history.cjs | 48 | 0 |
| test_rules.cjs | 42 | 0 |
| test_save.cjs | 51 | 0 |

Os contratos herdados mantêm seus modos originais de carregamento e não substituem a integração. As regras ativas, recusas de gravação/commit, histórico e compatibilidade têm fixtures próprias. Consulte os JSONs e hashes no pacote de evidências.

## Pacote, limitações e próxima etapa

O curso contém 202 arquivos, 201 referências locais únicas e `imsmanifest.xml` na raiz. CRC, extração e correspondência com a fonte testada foram aprovados. Scripts, fontes de geração, capturas e logs ficam nos arquivos externos. A galeria incorpora as imagens e foi testada offline com teclado em desktop/celular.

SHA-256 do curso: `f299a6951531ccffa99cb2a2cfc78d1e4127cbd7f4c73ab7f0e4b81076ae9bef`. Consulte `SHA256SUMS.txt` para todos os artefatos, `ARQUIVOS_ALTERADOS_FASE3.csv` para o diff e `ASSETS_BESTIARIO.csv` para os 62 monstros e seus hashes.

Esta entrega conclui somente a Fase 3. O catálogo de cosméticos aprovado foi implementado; não é mais uma proposta pendente. A homologação no Engage continua pendente e não se promete ausência absoluta de bugs. A Fase 4 pode avaliar otimização do cenário e consolidação técnica conforme o pedido original, mediante nova autorização; não foi executada nesta entrega. Não houve publicação no GitHub.
