# Vila Verde · Catálogo

Frontend administrativo em português para o catálogo de produtos naturais. Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, componentes no padrão shadcn/ui com Radix, Lucide, React Hook Form, Zod, Axios e TanStack Query.

## Estado da entrega local

O código e as suítes estão implementados. **Esta entrega ainda não está validada integralmente.** Durante a implementação, o ambiente não resolveu GitHub/npm, proibiu escrita no diretório `.git` e não permitiu abrir a porta do servidor local (`listen EPERM`). Não havia conteúdo de aplicação no destino antes da criação dos arquivos.

- ESLint: passou, sem erros ou avisos.
- 32 testes de validação, conversão, erros, clientes gerados e proxy: passaram com Node 24 e Vitest 3.2.7 disponível no cache. O manifesto solicita Vitest 4; a instalação completa não pôde ser concluída.
- Playwright: 18 cenários descobertos (9 por viewport). Execução bloqueada ao iniciar o servidor local.
- Testing Library e atualização de queries: testes escritos, execução pendente por dependências indisponíveis.
- TypeScript e build: tentados; bloqueados pelos pacotes ausentes. A checagem parcial não substitui uma compilação completa.
- Backend descartável: extraído de `e0f312e` em `/tmp`; o Maven offline falhou porque o parent Spring Boot 4.1.1 não estava no cache. Smoke real pendente.
- **`package-lock.json` pendente:** a tentativa de gerar o lock falhou sem acesso ao registro npm. Gere e versione o arquivo numa máquina conectada antes de considerar esta versão pronta. Não foi criado um lock parcial ou fictício.

## Executar

Use Node.js 24 (`nvm use`) e npm. Após restabelecer acesso ao registro:

```bash
npm install
cp .env.example .env.local
npm run dev
```

Abra http://localhost:3000. A raiz redireciona para `/produtos`. Após gerar o primeiro lock, use `npm ci` em instalações reproduzíveis e substitua `npm install` por `npm ci` na CI. Dependências copiadas do cache durante a implementação não representam uma instalação completa do manifesto; execute `npm install` antes de iniciar.

`BACKEND_API_URL=http://localhost:8080` é uma variável **somente do servidor** e deve conter a origem do backend. Reinicie o Next.js após alterá-la. Não use `NEXT_PUBLIC_` nem aponte para Render ao testar mutações.

O navegador chama o mesmo domínio em `/api`. O Route Handler encaminha apenas `produtos`, `categorias`, `unidades-medida`, `lojas`, `produtos-sku`, `produtos-loja` e `produtos-precos-loja`. Permite GET/POST de coleções e GET/PUT/DELETE por UUID; vínculos não aceitam PUT. Mantém parâmetros, códigos HTTP, JSON de erro e respostas vazias 204; desativa cache e limita a espera pelo backend a 15 segundos. Não encaminha credenciais ou cookies.

## Backend e SDK

Integração de referência: [`Zayma1/erp-produtos-naturais-backend`](https://github.com/Zayma1/erp-produtos-naturais-backend), branch **`novaVersao`**, commit **`e0f312e611d56ab73a4a8e3d5832f8b8874ff362`**. A branch `main` não tem a API usada aqui. A origem do SDK completo, incluindo `.kubb`, está documentada em [generated/PROVENANCE.md](generated/PROVENANCE.md).

O SDK não foi alterado. `components/providers.tsx` sobrescreve sua origem padrão antes dos componentes consumidores. Como as URLs geradas já começam em `/api`, `baseURL` deve ser vazio para chamadas de mesma origem. Não importe clientes em novos pontos sem usar essa configuração.

Verifique a referência remota quando houver conectividade:

```bash
git ls-remote https://github.com/Zayma1/erp-produtos-naturais-backend.git refs/heads/novaVersao
```

Para um backend descartável, use Java 21, Maven e PostgreSQL local. Em outro diretório:

```bash
git clone --branch novaVersao https://github.com/Zayma1/erp-produtos-naturais-backend.git backend-demo
cd backend-demo
git checkout e0f312e611d56ab73a4a8e3d5832f8b8874ff362
docker run --rm --name vila-verde-demo-db -p 127.0.0.1:5433:5432 \
  -e POSTGRES_DB=vila_verde -e POSTGRES_USER=vila -e POSTGRES_PASSWORD=vila postgres:16
```

Em outro terminal, na pasta `backend-demo`:

```bash
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5433/vila_verde \
SPRING_DATASOURCE_USERNAME=vila SPRING_DATASOURCE_PASSWORD=vila \
./mvnw spring-boot:run
```

Isso substitui o datasource H2 indicado no `application.properties` da referência, que inclui o driver PostgreSQL no POM. Não há alterações necessárias no código da API. `ddl-auto=create` recria os dados quando o **backend** reinicia; recarregar o navegador deve preservar os dados durante a sessão do backend. Use apenas um banco descartável.

## Fluxo

1. Crie categorias e unidades de medida. Sem elas, o formulário de produto fica desabilitado com links para os cadastros.
2. Crie um produto (`ATIVO` e `UNIDADE` por padrão; também aceita `INATIVO` e `PESO`). A edição envia o DTO completo.
3. Na página do produto salvo, cadastre SKUs globais, com EAN-13, DUN-14 e apresentação opcionais.
4. Cadastre lojas com nome fantasia, razão social, CNPJ, estado, cidade, bairro, número e complemento; vincule o produto a elas.
5. Cadastre preços por produto/loja com início e fim opcionais. Use `12,90` ou `1.234,56`. Valores negativos, casas extras e fim anterior ao início são rejeitados. Datas locais são convertidas para o mesmo instante em ISO UTC com `Z`.

As abas fazem operações independentes: uma falha não apaga o que já foi salvo. A lista mostra **todos os registros de preço e suas validades**, sem escolher preço vigente nem resolver sobreposições. Relacionamentos retornados pela API são filtrados explicitamente pelo produto e, quando selecionada, pela loja. SKUs são consultados somente por `idProduto`.

Busca, ordenação e paginação (20 registros) são locais porque a API retorna arrays. Os controles ficam nos parâmetros da URL; produtos também têm filtros de categoria e status. Cadastros de apoio usam modais, e produtos usam páginas completas. Exclusões exigem confirmação e nunca fazem cascata. Erros de integridade permanecem visíveis; formulários mantêm o conteúdo após falhas e bloqueiam novo envio enquanto salvam.

Sem autenticação nesta primeira versão, destinada a desenvolvimento/demonstração interna. Fornecedores, clientes, vendas, compras, estoque, dashboards, usuários e hospedagem estão fora do escopo.

## Verificação

```bash
npm run lint
npm run typecheck
npm test
npx playwright install chromium
npm run test:e2e
npm run build
```

Os testes unitários cobrem schemas, enums, moeda, datas, mensagens reais `ApiError`, transporte dos clientes gerados, atualização de listas/detalhes/relacionamentos e a lista permitida do proxy. O Playwright intercepta a API com fixtures **apenas nos testes** e cobre desktop/mobile, fluxo completo, edição/exclusão, recarga, duplicidades, filtros, erros de backend, pré-requisitos vazios e foco por teclado. A CI em `.github/workflows/ci.yml` executa essas verificações; usa `npm install` até que o lock seja gerado e versionado.

Com backend **descartável** e frontend rodando localmente:

```bash
npm run test:live
```

O script chama o proxy, cria e relê categoria, unidade, loja, produto, SKU, vínculo e preço, edita o produto e limpa os registros em ordem inversa. Aceita apenas origem loopback, por padrão `http://127.0.0.1:3000`. Use `SMOKE_BASE_URL` para mudar a porta local. A releitura da API complementa o teste de recarga do navegador; o smoke não substitui a verificação visual real.

## Repositório de destino

Destino solicitado: [`BrunoCGhisi/erp-produtos-naturais-frontend`](https://github.com/BrunoCGhisi/erp-produtos-naturais-frontend). A branch de entrega é `feat/catalog`, preparada pelo usuário a partir do estado de `master`; a base local inspecionada é `657257d` (`Initial commit`). O remoto permaneceu inacessível por DNS na sessão de entrega, e `.git` permaneceu protegido contra escrita. Gere/versione o lock e conclua os checks em um ambiente conectado. Não use force push.
