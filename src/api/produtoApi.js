import apiClient from './apiClient'

const RESOURCE = '/produtos'

export const produtoApi = {
  listar: () => apiClient.get(RESOURCE).then((r) => r.data),
  buscar: (id) => apiClient.get(`${RESOURCE}/${id}`).then((r) => r.data),
  criar: (dados) => apiClient.post(RESOURCE, dados).then((r) => r.data),
  atualizar: (id, dados) => apiClient.put(`${RESOURCE}/${id}`, dados).then((r) => r.data),
  excluir: (id) => apiClient.delete(`${RESOURCE}/${id}`)
}
