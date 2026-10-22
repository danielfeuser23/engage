# Reproduzir a validação do Guardião N1 v3.9

O curso é HTML/CSS/JavaScript estático em `v3_9/`. Os scripts desta pasta são ferramentas de desenvolvimento e **não entram no ZIP SCORM**. Não há serviço, login ou biblioteca de QA carregada pelo aluno.

## Preparar o ambiente

Requisitos: Python 3.10 ou superior, Node.js 18 ou superior e Chromium. Instale as dependências de desenvolvimento:

```sh
python -m pip install -r qa_v3_9/requirements.txt
```

O runner procura `chromium` ou `chromium-browser` no PATH. Se necessário, indique um executável com `N1_CHROMIUM=/caminho/para/chromium` (por exemplo, `/usr/bin/chromium`). A criação de imagens também utilizou outras ferramentas; elas não são necessárias para executar esta validação.

## Executar

Na raiz do repositório:

```sh
python qa_v3_9/run_checks.py --suite quick
python qa_v3_9/run_checks.py --suite all
```

`quick` executa as sete suítes Node, a auditoria estática dos 36 assets e a integração SCORM de navegador. `all` acrescenta a matriz artística, regressões de interface, missões/chefes/revisão e **uma jornada completa de 135 perguntas**. O runner usa uma porta local efêmera, confirma a fonte servida e fecha seu servidor ao terminar. Não utiliza o player Engage.

Grupos individuais:

```sh
python qa_v3_9/run_checks.py --suite unit
python qa_v3_9/run_checks.py --suite scorm
python qa_v3_9/run_checks.py --suite ui
python qa_v3_9/run_checks.py --suite art
python qa_v3_9/run_checks.py --suite media
python qa_v3_9/run_checks.py --suite expansion
python qa_v3_9/run_checks.py --suite mechanics
python qa_v3_9/run_checks.py --suite journey
```

Logs, JSONs e capturas são gravados em `evidencias_v3_9/`, ignorado pelo Git. O resumo de cada grupo fica em `evidencias_v3_9/portable_runs/`. O runner verifica que os hashes de fontes e mídias não mudaram durante o teste. Uma falha ou timeout retorna código de saída diferente de zero; examine o log da suíte afetada antes de atribuir o problema ao produto.

Para usar um servidor já existente, defina `N1_QA_BASE_URL`, apontando para a raiz deste repositório. Para executar um script individual de navegador sem o runner, o padrão é `http://127.0.0.1:8779`:

```sh
python -m http.server 8779 --bind 127.0.0.1
# Em outro terminal, na mesma raiz:
python qa_v3_9/jornada_v39.py --mode mista
```

Não utilize uma URL de produção ou um LMS real com estes harnesses. Os dados de aluno e API dos harnesses são sintéticos.

## O que cada grupo cobre

| Grupo | Conteúdo |
|---|---|
| `unit` | Progressão/economia/equipamento/histórico, eventos, SCORM/save, extensões, revisão, missões e catálogo de chefes. |
| `scorm` | Inicialização, nota/status, invariância dos recursos de RPG, fronteira 94/135–95/135, isolamento, saves legados, armazenamento bloqueado, recusas do LMS e encerramento. |
| `ui` | Bolsa/loja/caderno/eventos, persistência, foco, HUD, texto longo, navegação, feedback, poses após recarga e releitura das missões. |
| `media` | Decodificação de todas as 119 imagens e nove WAV, controles de som/mute, dimensões/transparência/paleta dos 36 exports e três confrontos mobile. |
| `art` | Inclui `media`; 36 arquivos de arte, 18 poses, três classes, nove chefes, três NPCs, seis comuns, seis cosméticos, três resoluções e movimento normal/reduzido. |
| `expansion` | Todas as escolhas das três missões, nove chefes com acerto/erro e movimento normal/reduzido, revisão vazia/completa/parcial e falhas de gravação. |
| `mechanics` | 57 casos dirigidos de eventos, coleção/equipamentos, classes/nomes, combate/combos/níveis/conquistas/raros/saída; oito fronteiras de rank/nota e 12 casos de clareza/HP baixo/histórico legado. |
| `journey` | Novo personagem, 135 respostas, três capítulos, nove chefes, missões, escolhas de eventos, compras/equipamentos, recargas, resultado e comparação exata do caderno/revisão. |

Há sobreposição entre suítes. Uma soma dos casos não representa bugs distintos. Os enunciados, opções, gabaritos, feedbacks e referências permanecem no banco original; o teste lê o gabarito para produzir acertos e erros deliberados.

## Jornada e estados dirigidos

Somente `jornada_v39.py` comprova uma jornada completa pela interface. Ele não injeta seed, progresso, contadores, inventário ou nota. A execução mista responde corretamente a três de cada quatro perguntas e erra a quarta, resultando em 102 acertos, 33 erros e 75%. O caderno é comparado exatamente contra os erros dessa tentativa, incluindo feedbacks e referências originais; as marcações de consulta são ações de QA, não leitura humana do treinamento.

Para cobrir os seis comuns renovados, o runner cria personagens novos e lê seus seeds gerados naturalmente. Uma cópia local das funções prevê os encontros; são descartadas somente tentativas com zero respostas. A tentativa selecionada é jogada no mesmo contexto. Isso seleciona cobertura sem alterar o estado do jogo e não garante os seis inimigos em qualquer partida normal. O preflight e os 135 encontros reais são registrados em JSON.

Os demais testes usam saves sintéticos válidos ou trocam somente imagens no DOM para alcançar condições específicas. São **fixtures**, não jornadas concluídas. A auditoria de arte utiliza `fixtures/asset_changes_v39.json`: hashes finais e antigos dos 36 exports verificados na entrega, sem exigir a mídia completa da v3.8. Ela não afirma uma nova comparação contra arquivos antigos ausentes.

## Limitações

As verificações utilizam Chromium real automatizado e API SCORM local simulada. Os eventos de saída/bfcache incluem simulação e não demonstram todas as políticas de cache do navegador. Não há homologação real no Engage, aparelho físico, leitor de tela, turma piloto, avaliação auditiva humana ou medição de aprendizagem/diversão. Controle de som e decodificação de áudio não equivalem a escuta humana.

O máximo observado de `cmi.suspend_data` é registrado em cada execução; não é um limite matemático. O SCORM 1.2 continua limitado a 4.096 caracteres. Não se promete ausência absoluta de bugs.

Depois de qualquer correção no produto, repita o teste afetado e conclua uma nova jornada após a última alteração. Refaça o ZIP com manifesto na raiz, confira correspondência byte a byte com a fonte e teste a extração antes de publicar. Alterar apenas esta documentação não requer refazer a jornada.
