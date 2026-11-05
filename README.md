# Vila Verde · Catálogo e estoque

Frontend administrativo em português para o catálogo e a consulta de estoque de produtos naturais. Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, componentes no padrão shadcn/ui com Radix, Lucide, React Hook Form, Zod, Axios e TanStack Query.

## Estado da implementação

Catálogo e consulta de estoque implementados, com estilos em utilitários Tailwind e componentes reutilizáveis. O resumo para continuidade está em [docs/PLANNER_HANDOFF.md](docs/PLANNER_HANDOFF.md).

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

O navegador chama o mesmo domínio em `/api`. O Route Handler encaminha os recursos de catálogo `produtos`, `categorias`, `unidades-medida`, `lojas`, `produtos-sku`, `produtos-loja` e `produtos-precos-loja`. No catálogo, permite GET/POST de coleções e GET/PUT/DELETE por UUID; vínculos não aceitam PUT. Estoque permite somente GET em `estoques`, `estoques/{uuid}`, `estoques/saldo`, `movimentacoes-estoque` e `movimentacoes-estoque/{uuid}`. O saldo exige `idProduto` e `idLoja` UUIDs válidos; escritas de estoque retornam 405. Mantém parâmetros, códigos HTTP, JSON de erro e respostas vazias 204; desativa cache e limita a espera pelo backend a 15 segundos. Não encaminha credenciais ou cookies.

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

Sem autenticação nesta primeira versão, destinada a desenvolvimento/demonstração interna. Fornecedores, clientes, vendas, compras, ajustes/transferências de estoque, dashboards, usuários e hospedagem estão fora do escopo.

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
