import { useEffect, useState } from 'react'
import { Box, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, IconButton, Paper } from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import EditIcon from '@mui/icons-material/EditOutlined'
import DeleteIcon from '@mui/icons-material/DeleteOutline'
import { useSnackbar } from 'notistack'
import PageHeader from '../../components/PageHeader'
import ConfirmDialog from '../../components/ConfirmDialog'
import { categoriaApi } from '../../api/categoriaApi'

const vazio = { nome: '' }

export default function CategoriaListPage() {
  const { enqueueSnackbar } = useSnackbar()
  const [linhas, setLinhas] = useState([])
  const [carregando, setCarregando] = useState(false)
  const [dialogAberto, setDialogAberto] = useState(false)
  const [form, setForm] = useState(vazio)
  const [editandoId, setEditandoId] = useState(null)
  const [exclusao, setExclusao] = useState(null)

  const carregar = () => {
    setCarregando(true)
    categoriaApi
      .listar()
      .then(setLinhas)
      .catch((e) => enqueueSnackbar(e.message, { variant: 'error' }))
      .finally(() => setCarregando(false))
  }

  useEffect(carregar, [])

  const abrirNovo = () => {
    setForm(vazio)
    setEditandoId(null)
    setDialogAberto(true)
  }

  const abrirEdicao = (categoria) => {
    setForm({ nome: categoria.nome })
    setEditandoId(categoria.id)
    setDialogAberto(true)
  }

  const salvar = () => {
    const acao = editandoId ? categoriaApi.atualizar(editandoId, form) : categoriaApi.criar(form)
    acao
      .then(() => {
        enqueueSnackbar('Categoria salva com sucesso', { variant: 'success' })
        setDialogAberto(false)
        carregar()
      })
      .catch((e) => enqueueSnackbar(e.message, { variant: 'error' }))
  }

  const confirmarExclusao = () => {
    categoriaApi
      .excluir(exclusao.id)
      .then(() => {
        enqueueSnackbar('Categoria excluída', { variant: 'success' })
        setExclusao(null)
        carregar()
      })
      .catch((e) => enqueueSnackbar(e.message, { variant: 'error' }))
  }

  const colunas = [
    { field: 'nome', headerName: 'Nome', flex: 1 },
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
      <PageHeader title="Categorias" subtitle="Classificação dos produtos" actionLabel="Nova categoria" onAction={abrirNovo} />

      <Paper variant="outlined" sx={{ height: 480 }}>
        <DataGrid
          rows={linhas}
          columns={colunas}
          loading={carregando}
          disableRowSelectionOnClick
          pageSizeOptions={[10, 25, 50]}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
        />
      </Paper>

      <Dialog open={dialogAberto} onClose={() => setDialogAberto(false)} fullWidth maxWidth="xs">
        <DialogTitle>{editandoId ? 'Editar categoria' : 'Nova categoria'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            margin="dense"
            label="Nome"
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
          />
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
        title="Excluir categoria"
        description={`Deseja realmente excluir "${exclusao?.nome}"?`}
        onCancel={() => setExclusao(null)}
        onConfirm={confirmarExclusao}
      />
    </Box>
  )
}
