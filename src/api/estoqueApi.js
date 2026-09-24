import apiClient from './apiClient'

const RESOURCE = '/estoque'

export const estoqueApi = {
  listar: () => apiClient.get(RESOURCE).then((r) => r.data),
  historicoPorProduto: (idProduto) => apiClient.get(`${RESOURCE}/produto/${idProduto}`).then((r) => r.data),
  saldo: (idProduto, idLoja) =>
    apiClient.get(`${RESOURCE}/saldo`, { params: { idProduto, idLoja } }).then((r) => r.data),
  registrarMovimentacao: (dados) => apiClient.post(`${RESOURCE}/movimentacao`, dados).then((r) => r.data)
}
