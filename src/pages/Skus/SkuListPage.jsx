import { useEffect, useState } from 'react'
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  IconButton,
  Paper,
  Grid,
  MenuItem,
  Chip
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import EditIcon from '@mui/icons-material/EditOutlined'
import DeleteIcon from '@mui/icons-material/DeleteOutline'
import { useSnackbar } from 'notistack'
import PageHeader from '../../components/PageHeader'
import ConfirmDialog from '../../components/ConfirmDialog'
import { produtoSkuApi } from '../../api/produtoSkuApi'
import { produtoApi } from '../../api/produtoApi'
import { lojaApi } from '../../api/lojaApi'

const vazio = { idProduto: '', idLoja: '', preco: '', sku: '', ean13: '', dun14: '', status: 'ATIVO' }

export default function SkuListPage() {
  const { enqueueSnackbar } = useSnackbar()
  const [linhas, setLinhas] = useState([])
  const [produtos, setProdutos] = useState([])
  const [lojas, setLojas] = useState([])
  const [carregando, setCarregando] = useState(false)
  const [dialogAberto, setDialogAberto] = useState(false)
  const [form, setForm] = useState(vazio)
  const [editandoId, setEditandoId] = useState(null)
  const [exclusao, setExclusao] = useState(null)

  const carregar = () => {
    setCarregando(true)
    produtoSkuApi
      .listar()
      .then(setLinhas)
      .catch((e) => enqueueSnackbar(e.message, { variant: 'error' }))
      .finally(() => setCarregando(false))
  }

  useEffect(() => {
    carregar()
    produtoApi.listar().then(setProdutos).catch(() => {})
    lojaApi.listar().then(setLojas).catch(() => {})
  }, [])

  const abrirNovo = () => {
    setForm(vazio)
    setEditandoId(null)
    setDialogAberto(true)
  }

  const abrirEdicao = (item) => {
    setForm({
      idProduto: item.idProduto,
      idLoja: item.idLoja,
      preco: item.preco,
      sku: item.sku,
      ean13: item.ean13 || '',
      dun14: item.dun14 || '',
      status: item.status
    })
    setEditandoId(item.id)
    setDialogAberto(true)
  }

  const salvar = () => {
    const dados = { ...form, preco: Number(form.preco) }
    const acao = editandoId ? produtoSkuApi.atualizar(editandoId, dados) : produtoSkuApi.criar(dados)
    acao
      .then(() => {
        enqueueSnackbar('SKU salvo com sucesso', { variant: 'success' })
        setDialogAberto(false)
        carregar()
      })
      .catch((e) => enqueueSnackbar(e.message, { variant: 'error' }))
  }

  const confirmarExclusao = () => {
    produtoSkuApi
      .excluir(exclusao.id)
      .then(() => {
        enqueueSnackbar('SKU excluído', { variant: 'success' })
        setExclusao(null)
        carregar()
      })
      .catch((e) => enqueueSnackbar(e.message, { variant: 'error' }))
  }

  const colunas = [
    { field: 'sku', headerName: 'SKU', width: 140 },
    { field: 'nomeProduto', headerName: 'Produto', flex: 1 },
    { field: 'nomeLoja', headerName: 'Loja', width: 160 },
    {
      field: 'preco',
      headerName: 'Preço (R$)',
      width: 120,
      valueFormatter: (params) => Number(params.value).toFixed(2)
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 110,
      renderCell: (params) => (
        <Chip label={params.value} size="small" color={params.value === 'ATIVO' ? 'success' : 'default'} variant="outlined" />
      )
    },
    {
      field: 'acoes',
      headerName: 'Ações',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <>
          <IconButton size="small" onClick={() => abrirEdicao(params.row)}>
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => setExclusao(params.row)}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </>
      )
    }
  ]

  return (
    <Box>
      <PageHeader
        title="SKUs"
        subtitle="Controle de produto por loja: preço, código de barras e status de venda"
        actionLabel="Novo SKU"
        onAction={abrirNovo}
      />

      <Paper variant="outlined" sx={{ height: 520 }}>
        <DataGrid
          rows={linhas}
          columns={colunas}
          loading={carregando}
          disableRowSelectionOnClick
          pageSizeOptions={[10, 25, 50]}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
        />
      </Paper>

      <Dialog open={dialogAberto} onClose={() => setDialogAberto(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editandoId ? 'Editar SKU' : 'Novo SKU'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Produto"
                value={form.idProduto}
                onChange={(e) => setForm({ ...form, idProduto: e.target.value })}
              >
                {produtos.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.nome}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Loja"
                value={form.idLoja}
                onChange={(e) => setForm({ ...form, idLoja: e.target.value })}
              >
                {lojas.map((l) => (
                  <MenuItem key={l.id} value={l.id}>
                    {l.nomeFantasia}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={6} sm={4}>
              <TextField fullWidth label="SKU" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
            </Grid>
            <Grid item xs={6} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="Preço (R$)"
                value={form.preco}
                onChange={(e) => setForm({ ...form, preco: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                select
                fullWidth
                label="Status"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <MenuItem value="ATIVO">ATIVO</MenuItem>
                <MenuItem value="INATIVO">INATIVO</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="EAN-13"
                value={form.ean13}
                onChange={(e) => setForm({ ...form, ean13: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="DUN-14"
                value={form.dun14}
                onChange={(e) => setForm({ ...form, dun14: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogAberto(false)}>Cancelar</Button>
          <Button variant="contained" onClick={salvar}>
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!exclusao}
        title="Excluir SKU"
        description={`Deseja realmente excluir o SKU "${exclusao?.sku}"?`}
        onCancel={() => setExclusao(null)}
        onConfirm={confirmarExclusao}
      />
    </Box>
  )
}
