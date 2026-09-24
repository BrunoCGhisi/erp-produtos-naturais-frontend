# ERP Produtos Naturais - Frontend

Interface web em **React + Vite + Material UI** para o sistema de gerenciamento de estoque
da **Vila Verde**.

Escopo desta etapa (MVP): **Produto + Estoque** (sem autenticação).

## Stack
- React 18 + Vite
- Material UI (MUI) + MUI X Data Grid
- React Router DOM
- Axios
- Notistack (notificações)

## Pré-requisitos
- Node.js 18+
- Backend rodando em `http://localhost:8080` (veja o projeto `erp-produtos-naturais-backend`)

## Instalação e execução

```bash
npm install
npm run dev
```

A aplicação sobe em `http://localhost:5173`.

> A URL da API está fixa em `src/api/apiClient.js` (`http://localhost:8080/api`). Ajuste ali
> caso o backend rode em outro endereço.

## Estrutura

```
src/
├── api/            # chamadas HTTP (um arquivo por recurso)
├── layout/         # Sidebar, Topbar, MainLayout
├── components/      # componentes reutilizáveis (PageHeader, ConfirmDialog)
├── routes/          # definição das rotas
├── pages/
│   ├── Dashboard/
│   ├── Produtos/
│   ├── Skus/
│   ├── Estoque/
│   ├── Transacoes/   # tipos de movimentação (entrada/saída/ajuste)
│   ├── Categorias/
│   ├── UnidadesMedida/
│   ├── Lojas/
│   └── Fornecedores/
```

## Ordem sugerida de uso (dados de apoio antes do fluxo principal)

1. **Categorias** e **Unidades de Medida** → necessárias para cadastrar um Produto
2. **Lojas** → necessária para SKUs e movimentações de estoque
3. **Fornecedores** → necessário para movimentações de entrada
4. **Tipos de Movimentação** → cadastre ao menos ENTRADA, SAIDA e AJUSTE
5. **Produtos** → cadastro geral do produto
6. **SKUs** → vincula o produto a uma loja com preço e código de barras
7. **Estoque** → registra as movimentações e mostra o histórico com saldo calculado

## Próximos passos sugeridos
- Tela de login (quando a autenticação for implementada no backend)
- Módulo de Vendas
- Dashboard com gráficos de movimentação por período
