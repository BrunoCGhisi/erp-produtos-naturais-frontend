import { Routes, Route } from 'react-router-dom'
import Dashboard from '../pages/Dashboard/Dashboard'
import ProdutoListPage from '../pages/Produtos/ProdutoListPage'
import SkuListPage from '../pages/Skus/SkuListPage'
import EstoqueListPage from '../pages/Estoque/EstoqueListPage'
import TransacaoListPage from '../pages/Transacoes/TransacaoListPage'
import CategoriaListPage from '../pages/Categorias/CategoriaListPage'
import UnidadeMedidaListPage from '../pages/UnidadesMedida/UnidadeMedidaListPage'
import LojaListPage from '../pages/Lojas/LojaListPage'
import FornecedorListPage from '../pages/Fornecedores/FornecedorListPage'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/produtos" element={<ProdutoListPage />} />
      <Route path="/skus" element={<SkuListPage />} />
      <Route path="/estoque" element={<EstoqueListPage />} />
      <Route path="/transacoes" element={<TransacaoListPage />} />
      <Route path="/categorias" element={<CategoriaListPage />} />
      <Route path="/unidades-medida" element={<UnidadeMedidaListPage />} />
      <Route path="/lojas" element={<LojaListPage />} />
      <Route path="/fornecedores" element={<FornecedorListPage />} />
    </Routes>
  )
}
