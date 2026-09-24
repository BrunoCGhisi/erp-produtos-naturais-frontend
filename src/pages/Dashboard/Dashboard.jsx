import { useEffect, useState } from 'react'
import { Grid, Card, CardContent, Typography, Box, Stack, Alert } from '@mui/material'
import Inventory2Icon from '@mui/icons-material/Inventory2Outlined'
import StoreIcon from '@mui/icons-material/StorefrontOutlined'
import LocalShippingIcon from '@mui/icons-material/LocalShippingOutlined'
import SwapVertIcon from '@mui/icons-material/SwapVertOutlined'
import PageHeader from '../../components/PageHeader'
import { produtoApi } from '../../api/produtoApi'
import { lojaApi } from '../../api/lojaApi'
import { fornecedorApi } from '../../api/fornecedorApi'
import { estoqueApi } from '../../api/estoqueApi'

function CardIndicador({ titulo, valor, icone, cor }) {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: cor + '1A',
              color: cor
            }}
          >
            {icone}
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={700}>
              {valor}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {titulo}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  )
}

export default function Dashboard() {
  const [dados, setDados] = useState({ produtos: 0, lojas: 0, fornecedores: 0, movimentacoes: 0 })
  const [erro, setErro] = useState(null)

  useEffect(() => {
    Promise.all([produtoApi.listar(), lojaApi.listar(), fornecedorApi.listar(), estoqueApi.listar()])
      .then(([produtos, lojas, fornecedores, movimentacoes]) => {
        setDados({
          produtos: produtos.length,
          lojas: lojas.length,
          fornecedores: fornecedores.length,
          movimentacoes: movimentacoes.length
        })
      })
      .catch((e) => setErro(e.message))
  }, [])

  return (
    <Box>
      <PageHeader title="Visão geral" subtitle="Resumo do sistema de gerenciamento de estoque" />

      {erro && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Não foi possível carregar os dados do backend ({erro}). Verifique se a API está rodando em
          http://localhost:8080.
        </Alert>
      )}

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <CardIndicador titulo="Produtos cadastrados" valor={dados.produtos} icone={<Inventory2Icon />} cor="#2E7D32" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <CardIndicador titulo="Lojas" valor={dados.lojas} icone={<StoreIcon />} cor="#1565C0" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <CardIndicador titulo="Fornecedores" valor={dados.fornecedores} icone={<LocalShippingIcon />} cor="#8D6E63" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <CardIndicador titulo="Movimentações de estoque" valor={dados.movimentacoes} icone={<SwapVertIcon />} cor="#EF6C00" />
        </Grid>
      </Grid>
    </Box>
  )
}
