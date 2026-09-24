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
import { produtoApi } from '../../api/produtoApi'
import { categoriaApi } from '../../api/categoriaApi'
import { unidadeMedidaApi } from '../../api/unidadeMedidaApi'

const vazio = { nome: '', idCategoria: '', idUnidadeMedida: '', status: 'ATIVO' }

export default function ProdutoListPage() {
  const { enqueueSnackbar } = useSnackbar()
  const [linhas, setLinhas] = useState([])
  const [categorias, setCategorias] = useState([])
  const [unidades, setUnidades] = useState([])
  const [carregando, setCarregando] = useState(false)
  const [dialogAberto, setDialogAberto] = useState(false)
  const [form, setForm] = useState(vazio)
  const [editandoId, setEditandoId] = useState(null)
  const [exclusao, setExclusao] = useState(null)

  const carregar = () => {
    setCarregando(true)
    produtoApi
      .listar()
      .then(setLinhas)
      .catch((e) => enqueueSnackbar(e.message, { variant: 'error' }))
      .finally(() => setCarregando(false))
  }

  useEffect(() => {
    carregar()
    categoriaApi.listar().then(setCategorias).catch(() => {})
    unidadeMedidaApi.listar().then(setUnidades).catch(() => {})
  }, [])

  const abrirNovo = () => {
    setForm(vazio)
    setEditandoId(null)
    setDialogAberto(true)
  }

  const abrirEdicao = (produto) => {
    setForm({
      nome: produto.nome,
      idCategoria: produto.idCategoria,
      idUnidadeMedida: produto.idUnidadeMedida,
      status: produto.status
    })
    setEditandoId(produto.id)
    setDialogAberto(true)
  }

  const salvar = () => {
    const acao = editandoId ? produtoApi.atualizar(editandoId, form) : produtoApi.criar(form)
    acao
      .then(() => {
        enqueueSnackbar('Produto salvo com sucesso', { variant: 'success' })
        setDialogAberto(false)
        carregar()
      })
      .catch((e) => enqueueSnackbar(e.message, { variant: 'error' }))
  }

  const confirmarExclusao = () => {
    produtoApi
      .excluir(exclusao.id)
      .then(() => {
        enqueueSnackbar('Produto excluído', { variant: 'success' })
        setExclusao(null)
        carregar()
      })
      .catch((e) => enqueueSnackbar(e.message, { variant: 'error' }))
  }

  const colunas = [
    { field: 'nome', headerName: 'Nome do Produto', flex: 1 },
    { field: 'nomeCategoria', headerName: 'Categoria', width: 180 },
    { field: 'siglaUnidadeMedida', headerName: 'Unidade', width: 100 },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
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
        title="Produtos"
        subtitle="Cadastro geral dos produtos comercializados pela Vila Verde"
        actionLabel="Novo produto"
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
        <DialogTitle>{editandoId ? 'Editar produto' : 'Novo produto'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nome do produto"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Categoria"
                value={form.idCategoria}
                onChange={(e) => setForm({ ...form, idCategoria: e.target.value })}
              >
                {categorias.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.nome}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Unidade de medida"
                value={form.idUnidadeMedida}
                onChange={(e) => setForm({ ...form, idUnidadeMedida: e.target.value })}
              >
                {unidades.map((u) => (
                  <MenuItem key={u.id} value={u.id}>
                    {u.sigla} - {u.nome}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
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
        title="Excluir produto"
        description={`Deseja realmente excluir "${exclusao?.nome}"?`}
        onCancel={() => setExclusao(null)}
        onConfirm={confirmarExclusao}
      />
    </Box>
  )
}
