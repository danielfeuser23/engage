# Correções v3.4

## Implementado

- Preferências não recriam a tela: criação e seleção da resposta são preservadas.
- Resposta permanece travada até o feedback; callbacks antigos conferem tela/questão; continuar exige fase de feedback.
- Mercador não cobra cosmético já possuído nem uma compra já concluída.
- Caminho absoluto calculado a partir da página corrige os fundos dos chefes em variáveis CSS.
- Falhas de armazenamento local não deixam tela vazia; checkpoints não prometem salvar quando a operação falhou.
- No LMS, `cmi.suspend_data` é a fonte canônica por aluno/tentativa. Nenhuma cópia compartilhada local é importada ou alterada.
- Erro de leitura/JSON canônico inválido bloqueia a avaliação e a sobrescrita; existe ação para tentar retomar.
- Limite de 4.096 caracteres é verificado sem truncamento. Estado v2 válido é preservado.
- Busca de API visita cada janela uma vez; erro de initialize/get/set/commit é tratado; encerramento é idempotente.
- Saída efetiva força commit e encerra sessão; ocultação força commit; restauração bfcache mantém sessão.
- Falha de envio da nota/status final aparece ao jogador e oferece nova tentativa de salvamento.
- Se o LMS recusar reinício, a jornada concluída e o resultado são preservados; uma mensagem explica a recusa.
- Redução de movimento congela GIFs em quadros PNG em memória, respeitando preferência inicial do sistema.
- Silenciar pausa/rebobina o áudio atual; foco de teclado, ARIA e feedback de acerto/erro foram melhorados.
- Painéis de transição permitem rolagem em viewports muito baixas.

## Evidências

- Jornadas completas por cliques na UI: 135/135 → 100% passed; 0/135 → 0% failed; 102/135 → 75% passed.
- Três capítulos, nove chefes, nove checkpoints e 18 eventos em cada jornada; retomadas após recarga e final persistido.
- 23 testes unitários SCORM/save, 19 de integração, 17 de regressão e 9 de UI/áudio aprovados.
- Fronteira dirigida: 94/135 → 69% failed; 95/135 → 70% passed.
- Testes de layout: 1366×768, 1100×600, 1024×500, 800×600, 390×844, além de transições em 1100×360.
- Maior suspend_data real observado nas três jornadas finais: 504 caracteres. Ensaio sintético ampliado: 757; limite exato e excesso testados.

Os testes usam Chromium real automatizado e API SCORM simulada. Não houve acesso ao Engage nem certificação ADL. As jornadas de teste não medem duração humana ou eficácia pedagógica. Conteúdo bancário foi preservado, sem validação por material externo de negócio.
