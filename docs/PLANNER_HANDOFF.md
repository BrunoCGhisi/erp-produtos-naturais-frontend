# Handoff para o agente planejador — Vila Verde

Data: 04/11/2026. Repositório: [BrunoCGhisi/erp-produtos-naturais-frontend](https://github.com/BrunoCGhisi/erp-produtos-naturais-frontend), branch `feat/catalog`. Este documento acompanha o refactor Tailwind posterior à implementação inicial `1a4f0d2`.

## Resultado e aderência ao plano

O MVP do catálogo está implementado e o fluxo foi validado contra PostgreSQL 16 e backend real descartáveis, além dos testes com fixtures. A CI da base `187f565` passou na [execução 41900348828](https://github.com/BrunoCGhisi/erp-produtos-naturais-frontend/actions/runs/41900348828). A seção de fechamento abaixo registra a nova entrega.

O fluxo implementado é: categorias/unidades → produtos → SKUs → vínculos com lojas → preços por produto/loja. A interface é em português, com branding Vila Verde, sidebar, breadcrumbs e navegação móvel. A raiz redireciona para `/produtos`.

| Área planejada           | Implementação                                                                                                                         |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| Base técnica             | Next.js 16.1.6 App Router, React 19, TypeScript, Tailwind CSS 4, npm e Node 24                                                        |
| Produtos                 | Listagem, busca, filtros de categoria/status, ordenação, paginação local de 20 linhas, criação, edição, detalhe e exclusão confirmada |
| Cadastros de apoio       | CRUD de categorias, unidades e lojas em modais; loja usa os campos reais do DTO do backend                                            |
| Relacionamentos          | Abas de SKUs globais, vínculos e preços, com operações e erros independentes                                                          |
| Contratos                | Clientes Axios, DTOs e hooks TanStack Query do SDK completo, inclusive `.kubb`, sem editar arquivos gerados                           |
| Transporte               | Proxy de mesma origem `/api`, limitado aos sete recursos do catálogo; mantém query string, status, JSON e 204 e desativa cache        |
| Validação                | Enums exatos, DTO completo em PUT, moeda brasileira não negativa, datas ISO com `Z`, fim igual ou posterior ao início                 |
| Estados e acessibilidade | Loading, vazio, erro/retry, registro ausente, confirmação, preservação de formulário, envio bloqueado durante gravação, labels e foco |
| Testes e CI              | Vitest/Testing Library, Playwright desktop/mobile e workflow de lint, tipos, testes e build                                           |
| Lockfile                 | Lock público versionado; instalação limpa com `npm ci` validada |
| Smoke real               | Smoke e Playwright real desktop/mobile passaram com PostgreSQL 16 descartável |

Listas usam dados reais em produção; fixtures estão nos testes. Não há cascata de exclusão na interface. Os preços mostram todos os registros e respectivas validades, sem escolher um preço vigente nem estabelecer precedência para sobreposições. Vínculos/preços retornados pela API são filtrados explicitamente pelos IDs selecionados. SKUs são consultados por `idProduto`.

Autenticação, fornecedores, clientes, vendas, compras, ajustes/transferências de estoque, dashboards, usuários e hospedagem permanecem fora do MVP de demonstração interna.

## Origem e particularidades da integração

- Backend real: [Zayma1/erp-produtos-naturais-backend](https://github.com/Zayma1/erp-produtos-naturais-backend), branch `novaVersao`, commit `e0f312e611d56ab73a4a8e3d5832f8b8874ff362`. O remoto foi reconferido nesta entrega e continua nesse commit. `main` não é a referência de integração.
- SDK: 307 arquivos copiados integralmente de `generated/sdk`, incluindo os helpers ocultos. Os arquivos continuam inalterados em relação ao commit de origem. Consulte [PROVENANCE.md](../generated/PROVENANCE.md).
- As URLs geradas já incluem `/api`. [providers.tsx](../components/providers.tsx) sobrescreve a origem padrão Render com `baseURL: ''`. Usar `baseURL: '/api'` duplicaria o prefixo.
- [route.ts](../app/api/[...path]/route.ts) e [proxy.ts](../lib/proxy.ts) usam `BACKEND_API_URL` somente no servidor, com padrão `http://localhost:8080`. Não são necessárias alterações de CORS no backend.
- SKUs não recebem loja ou preço. Vínculos não têm PUT. Cada gravação é separada para preservar sucessos parciais e permitir novas tentativas.
- O backend usa `ApiError` com `message` e `detalhes`; a normalização também cobre os demais formatos de erro tratados pela UI.

## Correção de direção: estilos em Tailwind

A primeira implementação concentrou quase todo o estilo em `globals.css`, apesar do plano pedir Tailwind. O usuário pediu a correção mantendo a UI atual. O refactor removeu as regras de layout/componentes do CSS global e passou a usar classes Tailwind nos componentes.

[globals.css](../app/globals.css) agora tem 26 linhas: importação Tailwind, tokens de tema, variantes responsivas e defaults compartilhados de foco/cursor/disabled. Não há classes CSS próprias de componentes nem um mapa central que apenas renomeie o CSS antigo.

Os componentes em [components/ui](../components/ui) concentram utilitários reutilizáveis para botões, inputs/selects/textareas, tabelas, painéis, badges, avisos, ações de formulário, diálogos e tabs. O restante do layout usa utilitários diretamente no JSX. As variantes `mobile`, `compact` e `wide` mantêm os limites originais de 720, 1050 e 1600 px.

## Evidências de validação

| Verificação         | Resultado local                                                                                                                                                                            |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `npm run lint`      | Passou, sem erros ou avisos de ESLint                                                                                                                                                      |
| `npm run typecheck` | Passou                                                                                                                                                                                     |
| `npm test`          | 39 testes passaram em 6 arquivos, com Vitest 4.1.12 e Node 24                                                                                                                              |
| Playwright          | 16 cenários passaram na suíte completa; após corrigir a espera pela navegação, os 2 fluxos completos passaram na execução direcionada. Os 18 cenários estão cobertos entre essas execuções |
| `npm run build`     | Passou, incluindo compilação, tipos e geração de páginas                                                                                                                                   |
| Comparação visual   | 55 capturas em 1440, 960 e 390 px: zero diferenças de geometria; 49 capturas idênticas em pixels; diferenças residuais até 96 pixels nos outros 6 casos                                    |
| Limites responsivos | Conferidos em 390, 720, 721, 1050, 1051 e 1600 px                                                                                                                                          |
| Backend real        | Concluído no fechamento abaixo; smoke e dois projetos Chromium passaram                                                                                                                                              |

As capturas incluem listagens, forms, diálogos de categoria/loja/SKU/preço/exclusão, tabs, hover, validação, drawer móvel, vazio, erro e ausência de pré-requisitos. Os artefatos são temporários em `/tmp/vila-tailwind-visual/`; não foram adicionados ao repositório nem são fixtures de regressão permanentes. Pequenas diferenças de rasterização/texto não foram apresentadas como igualdade absoluta de pixels.

O build usou uma cópia isolada em `/tmp/vila-tailwind-build.htFiAF` com as mesmas fontes e dependências instaladas, para não interromper o servidor de desenvolvimento existente na porta 3000. A última edição posterior ao build foi em testes; o código da aplicação é o mesmo validado pelo build. Os avisos locais sobre a configuração futura do Vite e as variáveis de cor do runner não impediram os testes.

As evidências da tabela acima descrevem o refactor original; a instalação limpa e a integração real posteriores estão registradas no fechamento abaixo.

### Problemas dos testes corrigidos

A instalação completa das dependências tornou visíveis três erros de TypeScript em `JSON.parse(config.data)`: o payload do transporte é `unknown`. O teste agora valida que o corpo é uma string antes de decodificá-lo.

A execução dos testes de browser revelou seletores ambíguos já presentes na suíte: `SKU` também correspondia ao diálogo/tabpanel, `Vincular loja` correspondia a `Desvincular Loja Centro`, e o primeiro botão de retry era o de categorias. Os seletores foram restringidos ao elemento/recurso correto. O fluxo completo também aguardava a gravação, mas recarregava antes de confirmar a navegação; agora espera a URL de detalhe antes do reload e tem timeout próprio de 60 segundos. Não foi necessário mudar o comportamento da aplicação para contornar esses problemas.

A [CI anterior de `1a4f0d2`](https://github.com/BrunoCGhisi/erp-produtos-naturais-frontend/actions/runs/41849929867) falhou nos três erros de tipos do teste de catálogo. Essas causas foram corrigidas em `187f565`, cuja CI passou na [execução 41900348828](https://github.com/BrunoCGhisi/erp-produtos-naturais-frontend/actions/runs/41900348828).

## Fechamento da validação completa

Frontend: `67dadeee33174661481724fd60fb70c49ee09698` (base `187f565`, branch `feat/catalog`). Backend: `e0f312e611d56ab73a4a8e3d5832f8b8874ff362`, sem alterações. O checkout de backend existente e seu `application.properties` modificado foram preservados.

- Lock gerado em diretório temporário sem `node_modules`, exclusivamente pelo registro `https://registry.npmjs.org`. As 592 dependências resolvidas separadamente têm URL pública e `integrity`; seis entradas opcionais `inBundle` recebem integridade pelo pacote que as contém. O lock antigo foi preservado em `/tmp/catalog-lock.zqH8QI/original-package-lock.json` nesta máquina.
- `npm ci` passou sem configuração de registro privado em uma cópia limpa. Lint, tipos e 39 testes unitários passaram nessa instalação. Os 18 testes Playwright com fixtures passaram também nessa cópia, com configuração temporária na porta 3200 e servidor próprio para preservar o desenvolvimento na porta 3000. O build de produção, smoke real e dois projetos Chromium reais passaram.
- A suíte real cria categoria, unidade, loja, produto, SKU, vínculo e preço pelo UI; verifica edição, `1.234,56` e `14,50`, datas locais, reload de produto e relacionamentos, duplicidades e bloqueios de exclusão por referência. As gravações de vínculo e preço continuam após falhas independentes. Não houve defeito de integração no código da aplicação que exigisse correção.
- Todos os registros criados são removidos por API em ordem de dependência; falhas de limpeza reprovam o teste. Ao final o orquestrador encerra os processos próprios e remove o PostgreSQL, sem volumes persistentes.
- Verificações negativas passaram: o smoke recusa ausência de `CATALOG_DISPOSABLE=1` antes de acessar a API; uma porta 3100 ocupada faz a integração falhar preservando o servidor existente. SIGTERM durante a inicialização também retornou falha e removeu o container, deixando as portas 8081/3100 livres.
- CI: [execução 41906754976](https://github.com/BrunoCGhisi/erp-produtos-naturais-frontend/actions/runs/41906754976) concluída com sucesso para `67dadeee33174661481724fd60fb70c49ee09698`, com os jobs `validate` e `integration` verdes. O workflow mantém os checks anteriores e adiciona um job de integração com Node 24, Java 21, Docker e Chromium. Em falhas publica logs com senha temporária removida, relatório e traces.

Comandos exatos:

```bash
nvm use
npm ci
npm run lint
npm run typecheck
npm test
npx playwright install --with-deps chromium
npm run test:e2e
npm run build
npm run test:integration
```

`test:integration` já inclui um build isolado. Para o smoke de baixo nível, somente depois de confirmar que **o banco upstream** é descartável: `CATALOG_DISPOSABLE=1 SMOKE_BASE_URL=http://127.0.0.1:3100 npm run test:live`. Uma URL loopback do frontend não garante isso.

Limitações: dados sobrevivem a reload do navegador, mas não precisam sobreviver ao restart do backend (`ddl-auto=create`). O fluxo exige internet para obter o commit fixado, imagem PostgreSQL e dependências Maven. SIGKILL e queda da máquina impedem limpeza automática; remova eventual container `vila-integration-*` restante. O lock conserva as declarações de dependências existentes; a auditoria npm da instalação reportou 11 avisos (8 moderados, 2 altos, 1 crítico), sem atualização de versões neste escopo. Autenticação, deploy e merge permanecem fora da entrega.

## Mapa para retomar

- [README](../README.md): startup, configuração e backend descartável.
- [catalog.ts](../lib/catalog.ts): campos, schemas por recurso e despacho para clientes gerados.
- [validation.ts](../lib/validation.ts): enums, moeda, datas e payloads.
- [queries.ts](../lib/queries.ts): invalidação das queries afetadas após gravações.
- [record-form.tsx](../components/record-form.tsx): forms compartilhados com React Hook Form e validação Zod.
- [product-detail.tsx](../components/product-detail.tsx): abas e relacionamentos; preservar filtros explícitos por IDs.
- [e2e/catalog.spec.ts](../e2e/catalog.spec.ts): fluxo completo e exceções com API interceptada.
- [smoke-live.mjs](../scripts/smoke-live.mjs): smoke de baixo nível com opt-in explícito e origem loopback.
- [integration.mjs](../scripts/integration.mjs): backend fixado, PostgreSQL e frontend descartáveis, prontidão e limpeza.
- [playwright.live.config.ts](../playwright.live.config.ts) e [e2e-live/catalog.spec.ts](../e2e-live/catalog.spec.ts): Chromium real desktop/mobile, sem interceptação.

Não existem alterações de backend, deploy público ou nova autenticação nesta entrega. A continuidade deve partir de `feat/catalog`, preservando o commit de integração do SDK e as separações produto/SKU/vínculo/preço.


## Etapa 2 — visibilidade de estoque

Implementadas `/estoque` e `/estoque/movimentacoes`, com hooks/tipos gerados intactos, filtros locais e enviados à API, URL restaurável, ordenação, paginação de 20 linhas, consulta exata independente, atualização manual, estados de carregamento/vazio/erro e data da última consulta bem-sucedida. O catálogo conecta-se aos saldos pelo produto; sidebar e menu móvel incluem Estoque, com breadcrumbs.

Quantidades usam três casas decimais e separadores brasileiros; movimentos preservam o valor retornado. Datas com offset são convertidas para `America/Sao_Paulo`; filtros comparam dias nesse fuso e incluem ambas as extremidades. Não há combinações artificiais, totais entre unidades ou cálculo de saldo histórico. O diálogo é somente leitura e omite referências ausentes. Consultas de lookup usam as mesmas chaves geradas do catálogo; na ausência de nomes, registros continuam visíveis pelos IDs.

`lib/proxy.ts` permite somente GET nos dois recursos de estoque, por coleção/UUID, e trata `estoques/saldo` antes da validação de UUID do caminho, exigindo os dois parâmetros válidos e únicos. Permissões do catálogo permanecem iguais.

`e2e/inventory.spec.ts`, `tests/inventory*.test.*` e os novos casos de proxy cobrem precisão, datas, filtros individuais, persistência na URL, fallback, ausência versus zero, refresh, erros independentes e navegação. `scripts/inventory-seed.mjs` é importado somente pelo runner descartável, sem SQL em rotas de aplicação. Insere dados conhecidos no container próprio após criar catálogo por API e remove estoque antes de limpar o catálogo, inclusive em falhas. `e2e-live/inventory.spec.ts` consome IDs da fixture via variável de ambiente, sem interceptar chamadas. A CI existente descobre as novas suítes em ambos os projetos de cada configuração e reprova em qualquer falha.

Os parâmetros de filtros usam `history.replaceState` integrado ao Next para manter a UI/URL sincronizadas sem navegação de servidor; cada alteração parte da URL atual, evitando perder alterações rápidas. Seletores têm rótulos explícitos. O teste real antigo de loja passou a procurar campos dentro do diálogo para evitar colisão com botões de registros já existentes.

Comandos de validação desta etapa: `npm run lint`, `npm run typecheck`, `npm test`, `npx playwright test`, `npm run test:integration` (inclui build, smoke e Playwright real desktop/mobile). Evidências locais em 04/11/2026 (Node 24):

- `npm run lint`, `npm run typecheck` e `npm test`: passaram; 57 testes em 8 arquivos.
- `npx playwright test`: 28 cenários passaram, em desktop/mobile. Após ampliar as asserções de quantidade, ordenação, parâmetros enviados e refresh com valores alterados, `npx playwright test e2e/inventory.spec.ts` passou novamente nos 10 cenários de estoque.
- `npm run test:integration`: passou com o backend fixado e PostgreSQL 16 próprio. Incluiu build de produção, smoke e 4 cenários reais (catálogo + estoque em `live-desktop` e `live-mobile`), sem interceptações.
- Limpeza confirmada: 5 movimentos e 3 saldos removidos em transação antes dos pré-requisitos do catálogo; container removido; runner terminou com código 0. Logs em `integration-artifacts/` (ignorados pelo Git).
- `git diff --check`: passou. SDK e dependências não foram alterados. O workflow continua exigindo as duas suítes de navegador e os checks anteriores; esta etapa não foi enviada ao remoto nem executada na CI nesta sessão.

A execução inicial revelou seletores imprecisos e perda de filtros em navegações rápidas; foram corrigidos antes das execuções verdes acima. O runner foi ajustado para conservar o backend durante o recebimento de sinal até finalizar a limpeza das fixtures. O build da execução verde contém o código final da aplicação; as edições posteriores ampliaram testes e documentação.
