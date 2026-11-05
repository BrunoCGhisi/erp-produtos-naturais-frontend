# Vila Verde · Catálogo, estoque e compras

Frontend administrativo em português para catálogo, consulta de estoque, fornecedores e rascunhos de compras de produtos naturais. Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, componentes no padrão shadcn/ui com Radix, Lucide, React Hook Form, Zod, Axios e TanStack Query.

## Estado da implementação

Catálogo, consulta de estoque, fornecedores e rascunhos de compras implementados, com estilos em utilitários Tailwind e componentes reutilizáveis. O resumo para continuidade está em [docs/PLANNER_HANDOFF.md](docs/PLANNER_HANDOFF.md). As limitações verificadas do backend estão em [docs/BACKEND_GAPS.md](docs/BACKEND_GAPS.md).

Validação anterior do catálogo em 04/11/2026, com Node 24 (a evidência da etapa 2 está no handoff):

- ESLint e TypeScript passaram.
- Vitest: 39 testes passaram, incluindo Testing Library e atualização de queries.
- Playwright: os 18 cenários desktop/mobile passaram; os dois fluxos completos passaram em uma execução direcionada após correções nos seletores e na espera pela navegação dos testes.
- Build de produção passou em uma cópia isolada do projeto para preservar o servidor de desenvolvimento aberto.
- Comparação visual: 55 capturas antes/depois do refactor, sem diferenças de geometria; 49 idênticas em pixels. Os seis casos restantes tiveram diferenças pequenas de rasterização/texto (até 96 pixels por captura). Os limites responsivos também foram conferidos em 390, 720, 721, 1050, 1051 e 1600 px.

Instalação limpa pelo registro público, smoke da API e Playwright real desktop/mobile passaram contra o backend fixado abaixo e PostgreSQL 16 descartável. A [CI de `67dadee`](https://github.com/BrunoCGhisi/erp-produtos-naturais-frontend/actions/runs/41906754976) passou nos jobs `validate` e `integration`. Consulte o handoff para os commits, comandos e limitações.

Validação local da etapa 2 (04/11/2026): lint, tipos, 57 testes unitários/de componentes, 28 cenários de navegador e integração descartável completos passaram. A integração inclui build, smoke e 4 cenários reais de catálogo/estoque em desktop e mobile. Os 10 cenários de estoque também passaram após ampliar as asserções. SDK e dependências permanecem inalterados; a evidência atual é local, sem nova execução de CI nesta sessão.

## Executar

Use Node.js 24 (`nvm use`) e npm:

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Abra http://localhost:3000. A raiz redireciona para `/produtos`. O lockfile versionado usa `https://registry.npmjs.org`; use `npm ci` nas instalações e na CI.

`BACKEND_API_URL=http://localhost:8080` é uma variável **somente do servidor** e deve conter a origem do backend. Reinicie o Next.js após alterá-la. Não use `NEXT_PUBLIC_` nem aponte para Render ao testar mutações.

O navegador chama o mesmo domínio em `/api`. O Route Handler encaminha os recursos de catálogo `produtos`, `categorias`, `unidades-medida`, `lojas`, `produtos-sku`, `produtos-loja` e `produtos-precos-loja`. No catálogo, permite GET/POST de coleções e GET/PUT/DELETE por UUID; vínculos não aceitam PUT. Estoque permite somente GET em `estoques`, `estoques/{uuid}`, `estoques/saldo`, `movimentacoes-estoque` e `movimentacoes-estoque/{uuid}`. O saldo exige `idProduto` e `idLoja` UUIDs válidos; escritas de estoque retornam 405. Mantém parâmetros, códigos HTTP, JSON de erro e respostas vazias 204; desativa cache e limita a espera pelo backend a 15 segundos. Não encaminha credenciais ou cookies. Fornecedores permitem GET/POST de coleção e GET/PUT/DELETE por UUID; compras permitem GET/POST de coleção e GET/PUT por UUID. Exclusão, transições e recebimentos de compra não são encaminhados.

## Backend e SDK

Integração de referência: [`Zayma1/erp-produtos-naturais-backend`](https://github.com/Zayma1/erp-produtos-naturais-backend), branch **`novaVersao`**, commit **`e0f312e611d56ab73a4a8e3d5832f8b8874ff362`**. A branch `main` não tem a API usada aqui. A origem do SDK completo, incluindo `.kubb`, está documentada em [generated/PROVENANCE.md](generated/PROVENANCE.md).

O SDK não foi alterado. `components/providers.tsx` sobrescreve sua origem padrão antes dos componentes consumidores. Como as URLs geradas já começam em `/api`, `baseURL` deve ser vazio para chamadas de mesma origem. Não importe clientes em novos pontos sem usar essa configuração.

A referência remota `novaVersao` foi conferida em 04/11/2026 e continua no commit de integração. Para conferir novamente:

```bash
git ls-remote https://github.com/Zayma1/erp-produtos-naturais-backend.git refs/heads/novaVersao
```

## Integração descartável

Pré-requisitos: Node.js 24, Java 21, Docker em execução, Git e acesso à internet (GitHub, Docker Hub e Maven Central). Instale as dependências e o Chromium:

```bash
npm ci
npx playwright install --with-deps chromium
npm run test:integration
```

O comando busca o backend no commit exato acima em um diretório temporário, inicia um PostgreSQL 16 sem volume persistente com credenciais aleatórias e datasource substituído por variáveis de ambiente. Resolve o Maven online, aguarda a API, faz um build isolado do frontend e executa o smoke da API seguido do Playwright real, serial, em Chromium desktop e mobile. Não altera o checkout existente do backend nem depende de `.env.local`.

As portas loopback **8081** (backend) e **3100** (frontend de produção) precisam estar livres; o comando falha se estiverem ocupadas e nunca reutiliza servidores. A porta do PostgreSQL é escolhida pelo Docker. Os processos e o banco pertencentes à execução são removidos ao terminar, inclusive em falhas e sinais SIGINT/SIGTERM. SIGKILL ou queda da máquina não permitem executar limpeza; nesse caso remova o container `vila-integration-*` restante com Docker.

Logs sem a senha temporária ficam em `integration-artifacts/`; relatório e traces de falha ficam em `playwright-live-report/` e `test-results/live/`. A CI possui um job separado com esses mesmos pré-requisitos e publica os artefatos em falhas.

O backend usa `ddl-auto=create`: os dados precisam sobreviver à recarga do navegador, mas persistência após reiniciar o backend está fora deste marco.

## Fluxo

1. Crie categorias e unidades de medida. Sem elas, o formulário de produto fica desabilitado com links para os cadastros.
2. Crie um produto (`ATIVO` e `UNIDADE` por padrão; também aceita `INATIVO` e `PESO`). A edição envia o DTO completo.
3. Na página do produto salvo, cadastre SKUs globais, com EAN-13, DUN-14 e apresentação opcionais.
4. Cadastre lojas com nome fantasia, razão social, CNPJ, estado, cidade, bairro, número e complemento; vincule o produto a elas.
5. Cadastre preços por produto/loja com início e fim opcionais. Use `12,90` ou `1.234,56`. Valores negativos, casas extras e fim anterior ao início são rejeitados. Datas locais são convertidas para o mesmo instante em ISO UTC com `Z`.

As abas fazem operações independentes: uma falha não apaga o que já foi salvo. A lista mostra **todos os registros de preço e suas validades**, sem escolher preço vigente nem resolver sobreposições. Relacionamentos retornados pela API são filtrados explicitamente pelo produto e, quando selecionada, pela loja. SKUs são consultados somente por `idProduto`.

Busca, ordenação e paginação (20 registros) são locais porque a API retorna arrays. Os controles ficam nos parâmetros da URL; produtos também têm filtros de categoria e status. Cadastros de apoio usam modais, e produtos usam páginas completas. Exclusões exigem confirmação e nunca fazem cascata. Erros de integridade permanecem visíveis; formulários mantêm o conteúdo após falhas e bloqueiam novo envio enquanto salvam.

Sem autenticação, destinada a desenvolvimento/demonstração interna. Clientes, vendas, recebimentos, transições de compra, ajustes/transferências de estoque, dashboards, usuários e hospedagem estão fora do escopo.

## Consulta de estoque (etapa 2)

- `/estoque`: saldos existentes por produto/loja, unidade, quantidade e última atualização; busca por nome, seletores de produto/loja, filtro de quantidade, ordenação e páginas locais de 20 registros.
- Ao selecionar produto e loja, o painel consulta o saldo exato separadamente. Zero retornado pelo endpoint é mostrado mesmo quando a listagem não tem registro, com a indicação “Sem registro de estoque”. Erros nunca são convertidos em saldo zero.
- `/estoque/movimentacoes`: tipo, quantidade original e observação; filtros de produto/loja/tipo e datas inclusivas em `America/Sao_Paulo`, ordenação e paginação. O diálogo mostra observação completa e referências presentes, somente para consulta.
- Filtros, ordenação e página ficam na URL e sobrevivem ao reload. Alterar filtros reinicia a página. “Atualizar” recarrega as consultas de estoque atuais; sucessos independentes e dados anteriores continuam visíveis em falhas.
- Produtos levam ao catálogo; “Consultar estoque” nos detalhes retorna aos saldos filtrados. A navegação desktop/mobile oferece Saldos e Movimentações.

A API recebe filtros de produto/loja; a interface também os aplica localmente. Não cria combinações inexistentes nem soma unidades incompatíveis. Quantidades usam até três casas decimais brasileiras. Consultas de catálogo resolvem nomes/unidades e mantêm compatibilidade com a invalidação existente; IDs servem de fallback. Não há movimentações de escrita, saldo por SKU ou saldo histórico calculado.

O runner de integração cria os pré-requisitos por API após a prontidão do backend e insere saldos/movimentações conhecidos exclusivamente no PostgreSQL que ele próprio iniciou (`scripts/inventory-seed.mjs`). Inclui zero, negativo, frações, dois produtos/lojas e limites de datas. A limpeza remove primeiro movimentos e saldos por SQL, depois o catálogo pela API. Nenhuma rota da aplicação executa SQL.

## Verificação

```bash
npm run lint
npm run typecheck
npm test
npx playwright install chromium
npm run test:e2e
npm run build
```

Os testes unitários cobrem schemas, enums, moeda, datas, mensagens reais `ApiError`, transporte dos clientes gerados, atualização de listas/detalhes/relacionamentos e a lista permitida do proxy. O Playwright intercepta a API com fixtures **apenas nos testes** e cobre desktop/mobile, fluxo completo, edição/exclusão, recarga, duplicidades, filtros, erros de backend, pré-requisitos vazios e foco por teclado. A CI em `.github/workflows/ci.yml` executa essas verificações com `npm ci`, além do job separado de integração real.

Com backend **descartável** e frontend rodando localmente:

```bash
CATALOG_DISPOSABLE=1 npm run test:live
```

O script chama o proxy, cria e relê categoria, unidade, loja, produto, SKU, vínculo e preço, edita o produto e limpa os registros em ordem inversa. Aceita apenas origem loopback, por padrão `http://127.0.0.1:3000`. Use `SMOKE_BASE_URL` para mudar a porta local. A variável `CATALOG_DISPOSABLE=1` é obrigatória e declara que o backend e seu banco são descartáveis. **Uma URL frontend loopback sozinha não garante que o banco upstream seja descartável.** Prefira `npm run test:integration`, que cria e controla os serviços e fornece essa opção ao smoke. A suíte `e2e-live/` não intercepta requests e verifica cadastros pelo UI, edições, duplicidades, bloqueios por referência, saves independentes, moeda brasileira, datas e persistência após reload. Sua limpeza por API segue a ordem de dependências e falhas de limpeza reprovam o teste.

## Repositório de destino

Destino solicitado: [`BrunoCGhisi/erp-produtos-naturais-frontend`](https://github.com/BrunoCGhisi/erp-produtos-naturais-frontend). A branch de entrega é `feat/catalog`, preparada pelo usuário a partir do estado de `master`; a base local inspecionada é `657257d` (`Initial commit`). A implementação inicial foi enviada no commit `1a4f0d2`. O refactor Tailwind e este handoff são a continuação dessa entrega. A instalação reproduzível e o ambiente descartável estão automatizados; consulte o handoff para os resultados de execução. Não use force push.

## Fornecedores e rascunhos de compras (etapa 3)

- `/fornecedores`: busca, ordem, paginação de 20 registros e CRUD com confirmação de exclusão. Campos reais do DTO: nome fantasia, razão social, UF, cidade, bairro (obrigatórios), complemento, CNPJ e CPF (opcionais). UF é normalizada para duas letras maiúsculas. “Ver compras” abre os pedidos filtrados.
- `/compras`: fornecedor, loja, data em São Paulo, todos os status retornados e total salvo. Filtros de fornecedor/loja/status/datas, ordenação e páginas de 20 linhas ficam na URL. Ordem inicial: data mais recente.
- `/compras/nova`, `/compras/[id]` e `/compras/[id]/editar`: criação, consulta e edição restrita a RASCUNHO. Cabeçalho com fornecedor/loja obrigatórios, data opcional e observação. Sem data na criação, o backend usa seu padrão. Os horários usam America/Sao_Paulo e são enviados com offset ISO.
- Cada compra precisa de pelo menos um item do catálogo: quantidade positiva com até três casas, custo não negativo com até quatro e desconto monetário não negativo com até duas. Não há seleção de usuário, preço de venda automático nem restrição nova de produto por loja/fornecedor.
- Prévia usa inteiros escalados e HALF_UP por item antes da soma; limites de numeric(14,s) e desconto superior ao bruto são rejeitados. Depois de salvar, os totais retornados pelo backend são autoritativos. Custos exibem até quatro casas.
- Formulários preservam valores em falhas e exigem consultas de pré-requisitos bem-sucedidas. Se o servidor rejeitar edição por mudança de status, a interface confirma o status salvo e bloqueia novo envio. Falhas de confirmação aparecem separadamente, com retry.
- **Salvar rascunho não altera estoque.** Quantidades recebidas aparecem apenas no detalhe. Não há exclusão, aprovação, cancelamento, recebimento ou transição de status na UI.

`npm run test:integration` também exercita fornecedores/compras com backend e PostgreSQL descartáveis, valida totais persistidos, substituição de itens e estoque inalterado, e reproduz [BG-005](docs/BACKEND_GAPS.md#bg-005). A limpeza remove itens de compra por SQL exclusivamente no container de teste, depois cabeçalhos/fornecedores por API, antes dos pré-requisitos do catálogo. Não há SQL nem exclusão em cascata de compras na aplicação.

Validação local da etapa 3: lint, tipos, 82 testes unitários/de componentes, 42 cenários desktop/mobile, build de produção e seis cenários reais passaram. Os 14 cenários de compras passaram novamente após os ajustes finais. Evidências e detalhes de entrega estão no [handoff](docs/PLANNER_HANDOFF.md#etapa-3--fornecedores-e-rascunhos-de-compras). SDK, backend de referência e dependências permanecem iguais.

### Etapa 4: clientes e vendas abertas

`/clientes` oferece cadastro, busca, ordenação, paginação, edição e exclusão confirmada, com CPF/nascimento opcionais. Nascimento é data civil, sem conversão de fuso. “Ver vendas” abre o filtro por cliente.

`/vendas` lista registros em todos os status com filtros restauráveis na URL (cliente, loja, status e intervalo inclusivo de datas em São Paulo), ordenação e 20 registros por página. `/vendas/nova` exige cliente, loja, operador já existente e itens do catálogo. A seleção de operador registra responsabilidade na demonstração; não autentica ninguém. Sem operadores, a gravação fica bloqueada; a aplicação não oferece gestão de usuários.

Preços são informados manualmente, com até duas casas; quantidades têm até três. Descontos monetários não podem exceder o bruto. A prévia usa inteiros escalados e HALF_UP, arredondando a soma dos brutos antes de descontar; pode diferir da soma das prévias dos itens. Nenhum preço de validade, vínculo com loja ou saldo é escolhido como restrição automática.

Salvar cria ABERTA e abre `/vendas/[id]`, somente leitura, com totais autoritativos do backend. Não conclui checkout ou baixa estoque. Não há edição, cancelamento ou exclusão de vendas. A unidade exibida vem do catálogo atual; a API não devolve o snapshot nem o total persistido dos itens. Não existe campo de observação porque a API não o retorna. Limitações: [BG-008, BG-009 e BG-015 a BG-020](docs/BACKEND_GAPS.md).

A integração descartável agora cria um operador temporário diretamente na API upstream e cria cliente/venda pelo navegador em desktop/mobile, verificando arredondamento agregado, status, reload e estoque inalterado. Probes de falhas e mutações upstream ficam exclusivamente em `scripts/sales-seed.mjs`; vendas são limpas antes de clientes/operadores e do catálogo. `npm run test:integration` executa build isolado, smoke e todas as suítes reais. As suítes novas são descobertas automaticamente pelos jobs existentes de CI.

Validação local final da etapa 4 (05/11/2026): lint, tipos, 119 testes unitários/componentes, 50 cenários Playwright e integração real (build, smoke e 8 cenários desktop/mobile) passaram. Evidências e situação da CI remota no [handoff](docs/PLANNER_HANDOFF.md#etapa-4--clientes-e-vendas-abertas).
