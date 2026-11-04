# Handoff para o agente planejador — Vila Verde

Data: 04/11/2026. Repositório: [BrunoCGhisi/erp-produtos-naturais-frontend](https://github.com/BrunoCGhisi/erp-produtos-naturais-frontend), branch `feat/catalog`. Este documento acompanha o refactor Tailwind posterior à implementação inicial `1a4f0d2`.

## Resultado e aderência ao plano

O MVP do catálogo está implementado. O frontend foi validado localmente com APIs interceptadas nos testes. **A integração ponta a ponta com o backend real ainda não foi validada**, e não há confirmação de CI verde para este refactor neste handoff.

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
| Lockfile                 | Ainda não versionado: arquivo local preexistente contém URLs de registro privado                                                      |
| Smoke real               | Script local pronto; execução contra backend descartável pendente                                                                     |

Listas usam dados reais em produção; fixtures estão nos testes. Não há cascata de exclusão na interface. Os preços mostram todos os registros e respectivas validades, sem escolher um preço vigente nem estabelecer precedência para sobreposições. Vínculos/preços retornados pela API são filtrados explicitamente pelos IDs selecionados. SKUs são consultados por `idProduto`.

Autenticação, fornecedores, clientes, vendas, compras, estoque, dashboards, usuários e hospedagem permanecem fora do MVP de demonstração interna.

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
| Backend real        | Não executado com sucesso; permanece pendente                                                                                                                                              |

As capturas incluem listagens, forms, diálogos de categoria/loja/SKU/preço/exclusão, tabs, hover, validação, drawer móvel, vazio, erro e ausência de pré-requisitos. Os artefatos são temporários em `/tmp/vila-tailwind-visual/`; não foram adicionados ao repositório nem são fixtures de regressão permanentes. Pequenas diferenças de rasterização/texto não foram apresentadas como igualdade absoluta de pixels.

O build usou uma cópia isolada em `/tmp/vila-tailwind-build.htFiAF` com as mesmas fontes e dependências instaladas, para não interromper o servidor de desenvolvimento existente na porta 3000. A última edição posterior ao build foi em testes; o código da aplicação é o mesmo validado pelo build. Os avisos locais sobre a configuração futura do Vite e as variáveis de cor do runner não impediram os testes.

### Problemas dos testes corrigidos

A instalação completa das dependências tornou visíveis três erros de TypeScript em `JSON.parse(config.data)`: o payload do transporte é `unknown`. O teste agora valida que o corpo é uma string antes de decodificá-lo.

A execução dos testes de browser revelou seletores ambíguos já presentes na suíte: `SKU` também correspondia ao diálogo/tabpanel, `Vincular loja` correspondia a `Desvincular Loja Centro`, e o primeiro botão de retry era o de categorias. Os seletores foram restringidos ao elemento/recurso correto. O fluxo completo também aguardava a gravação, mas recarregava antes de confirmar a navegação; agora espera a URL de detalhe antes do reload e tem timeout próprio de 60 segundos. Não foi necessário mudar o comportamento da aplicação para contornar esses problemas.

A [CI anterior de `1a4f0d2`](https://github.com/BrunoCGhisi/erp-produtos-naturais-frontend/actions/runs/41849929867) falhou nos três erros de tipos do teste de catálogo. Essas causas estão corrigidas aqui; conferir a nova execução após o push antes de declarar CI verde.

## Pendências para o próximo planejamento

1. **Concluir o smoke real.** Subir o backend do commit indicado com PostgreSQL descartável, configurar o frontend para a origem local e executar `npm run test:live`. Depois, percorrer o fluxo pelo navegador e conferir persistência após reload. A tentativa inicial de build do backend falhou em modo offline pela ausência do parent Spring Boot 4.1.1; o smoke não chegou a rodar. As antigas limitações de rede, porta e escrita Git não são mais o bloqueio atual. Não usar o Render compartilhado para mutações.
2. **Versionar um lockfile portável.** O `package-lock.json` local já existia antes deste refactor e foi preservado sem alteração. Ele corresponde às dependências do manifesto, mas contém 235 resoluções no registro privado `nexus3.betha.com.br` e várias entradas sem metadados completos de resolução/integridade. Não foi incluído neste commit. Preparar um lock apropriado ao repositório, validar `npm ci` em checkout limpo e então substituir `npm install` por `npm ci` na CI. Não considerar a reprodutibilidade encerrada somente porque o arquivo existe localmente.
3. **Conferir a CI do commit enviado.** Os checks locais passaram, mas o workflow remoto ainda precisa confirmar o resultado com uma instalação própria. O workflow atual usa `npm install` e instala Chromium antes do Playwright.

## Mapa para retomar

- [README](../README.md): startup, configuração e backend descartável.
- [catalog.ts](../lib/catalog.ts): campos, schemas por recurso e despacho para clientes gerados.
- [validation.ts](../lib/validation.ts): enums, moeda, datas e payloads.
- [queries.ts](../lib/queries.ts): invalidação das queries afetadas após gravações.
- [record-form.tsx](../components/record-form.tsx): forms compartilhados com React Hook Form e validação Zod.
- [product-detail.tsx](../components/product-detail.tsx): abas e relacionamentos; preservar filtros explícitos por IDs.
- [e2e/catalog.spec.ts](../e2e/catalog.spec.ts): fluxo completo e exceções com API interceptada.
- [smoke-live.mjs](../scripts/smoke-live.mjs): mutações e limpeza em ordem inversa, limitado à origem loopback.

Não existem alterações de backend, deploy público ou nova autenticação nesta entrega. A continuidade deve partir de `feat/catalog`, preservando o commit de integração do SDK e as separações produto/SKU/vínculo/preço.
