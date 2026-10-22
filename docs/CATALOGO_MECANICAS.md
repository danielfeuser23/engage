# Catálogo e cobertura de mecânicas — revisão para publicação

Read-only source and test-definition inspection. No suite/journey executed by this catalog agent; fresh execution belongs to parent and sibling validation agents.

A inspeção não modificou o produto e não executou suítes. A aprovação atual deve vir dos JSONs novos das outras frentes.

## Contagem e regras

- 3 classes visuais;135 questões em3 capítulos de 45; aprovação 70%, nota floor(acertos/135×100).
- 9 chefes nas questões 15/30/45 de cada capítulo; uma resposta encerra o encontro, inclusive errada.
- 56 comuns de 17famílias,6 raros e 15fundos no catálogoMD. Rareza:hash%100<7 fora dos chefes.
- 18 eventos opcionais e 9checkpoints. Eventos em múltiplos de 5, exceto chefes.
- XP por acerto:100 normal/220 boss,+80 raro; multiplicadores1 / 1,10 a 5 / 1,25 a 10. Ouro:10 normal/35 boss,+40 raro.
- Erro:+20 XP, combo 0 e dano 15normal/raro ou 25boss. Queda restaura 100 HP e cobra min(25,saldo), sem repetir questão. Fim de capítulo restaura 100 HP.
- 9 níveis:0,500,1200,2200,3500,5000,7000,9300,12000XP.
- 7 conquistas:primeiro acerto,5/10 seguidos,3 chefes concluídos,capítulo II,jornada final,100%num capítulo.
- 5 ranks finais:95/85/70/60 e abaixo de 60.
- 6 cosméticos a 50 ouro,1 equipamento; bolsa mapa/checkpoint e loja checkpoint.
- 3 missões com 2 escolhas e+15 ouro uma vez; liberadas após 15 questões do capítulo; leitura final sem novo prêmio.
- Caderno/revisão apenas no final:wr e rc com 34 hex, rs para prefixo sem histórico, consulta declarada não domínio.
- Save v2/fv35,ms 3 flags,nome 24 caracteres,suspend 4096; LMS canônico isola estudante/tentativa.

## Mapa de testes

| Mecânica | Scripts | Natureza |
|---|---|---|
| 135 responses, chapters, bosses, optional systems and exact error review | `jornada_v39.py` | new natural UI journey owned by root |
| six events with both choices, duplicate click/reload, skip, legacy event, failed commit | `ui_tests/qa_features.py`, `test-events.cjs` | 12 normal UI choice branches plus edge cases;19domaincases |
| all six event full-collection choices, skip each, unavailable rewards | `qa_mechanics_publicacao.py` | parent complementary directed browser fixtures |
| inventory6, price50, equip/unequip, no gold, duplicate and reload | `test-progression.cjs`, `ui_tests/qa_features.py`, `qa_navigation.py` | 21domaincases and GUI cases |
| three optional missions all6branches, skip/reread, unique gold, failure/retry | `test-missions.cjs`, `qa_expansion_ui.py` | 20domaincases;9integratedmissioncases |
| nine bosses, correct/wrong, normal/reduced, exactlyoneanswer | `test-bosses.cjs`, `qa_expansion_ui.py` | 35domaincases;36UIbossconditions |
| review no/few/all errors, partiallegacy, consult/unconsult, no grade mutation | `test-guided-review.cjs`, `test-progression.cjs`, `qa_expansion_ui.py`, `qa_navigation.py` | 18reviewdomaincases;9integratedreviewcases |
| threshold70, resource-grade invariance, isolation, localstorage/LMS failures,4096limit | `scorm_grade_invariance.py`, `scorm_recovery_compat.py`, `scorm_new_features.py`, `integracao.py`, `test-scorm-save.cjs`, `test-scorm-extensions.cjs`, `ui_tests/qa_regressions.py` | fresh executions owned by SCORM sibling |
| art18hero poses,ninebosses,threeNPC,sixupdatedcommon,sixcosmetics acrosssizes | `qa_art_assets.py`, `qa_art_browser.py` | 117case/864image-condition matrix owned by visual sibling |
| longtext, keyboard/focus, no selection, attack-race, dynamicHUD, saved pose, references | `run_art_ui_regressions.py`, `qa_pose_resume.py`, `qa_bugfixes.py`, `qa_navigation.py` | fresh UI suites owned by visual sibling |
| preciseXP/gold/combo/level,7achievements,all6rare,sound/nativeplay,nameboundary,rankthresholds | `qa_mechanics_publicacao.py` | parent complementary directed browser fixtures |

## Limitações da leitura e lacunas anteriores

- Catalog maps definitions, not proof that suites have passed in this run. Read fresh result JSONs before claiming coverage.
- Rank thresholds95/85/70/60 and all seven achievements were not individually named in inherited standard UI suites; complementary fixtures recommended.
- All56common assets and family selection exist; actual naturally encountered subset depends on seed. Directed/catalog tests do not prove all56 appeared in final journey.
- Audio controls/decoding/playback can be tested technically; audible quality requires human listening.
- Synthetic pagehide/bfcache tests do not prove all actual browser/LMS navigation policies.
- No Engage real access or physical mobile/audit of screen reader.

Nenhum bug funcional foi confirmado somente por esta inspeção. Os complementos recomendados devem ser executados no navegador antes de afirmar cobertura.
