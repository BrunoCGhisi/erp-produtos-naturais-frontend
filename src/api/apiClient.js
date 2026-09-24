import axios from 'axios'

const apiClient = axios.create({
  baseURL: 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const mensagem =
      error.response?.data?.message ||
      error.response?.data?.error ||
      'Erro de comunicação com o servidor'
    return Promise.reject(new Error(mensagem))
  }
)

export default apiClient
