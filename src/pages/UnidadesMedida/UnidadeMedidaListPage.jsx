import { useEffect, useState } from 'react'
import { Box, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, IconButton, Paper, Grid } from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import EditIcon from '@mui/icons-material/EditOutlined'
import DeleteIcon from '@mui/icons-material/DeleteOutline'
import { useSnackbar } from 'notistack'
import PageHeader from '../../components/PageHeader'
import ConfirmDialog from '../../components/ConfirmDialog'
import { unidadeMedidaApi } from '../../api/unidadeMedidaApi'

const vazio = { sigla: '', nome: '' }

export default function UnidadeMedidaListPage() {
  const { enqueueSnackbar } = useSnackbar()
  const [linhas, setLinhas] = useState([])
  const [carregando, setCarregando] = useState(false)
  const [dialogAberto, setDialogAberto] = useState(false)
  const [form, setForm] = useState(vazio)
  const [editandoId, setEditandoId] = useState(null)
  const [exclusao, setExclusao] = useState(null)

  const carregar = () => {
    setCarregando(true)
    unidadeMedidaApi
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

  const abrirEdicao = (item) => {
    setForm({ sigla: item.sigla, nome: item.nome })
    setEditandoId(item.id)
    setDialogAberto(true)
  }

  const salvar = () => {
    const acao = editandoId ? unidadeMedidaApi.atualizar(editandoId, form) : unidadeMedidaApi.criar(form)
    acao
      .then(() => {
        enqueueSnackbar('Unidade de medida salva com sucesso', { variant: 'success' })
        setDialogAberto(false)
        carregar()
      })
      .catch((e) => enqueueSnackbar(e.message, { variant: 'error' }))
  }

  const confirmarExclusao = () => {
    unidadeMedidaApi
      .excluir(exclusao.id)
      .then(() => {
        enqueueSnackbar('Unidade de medida excluída', { variant: 'success' })
        setExclusao(null)
        carregar()
      })
      .catch((e) => enqueueSnackbar(e.message, { variant: 'error' }))
  }

  const colunas = [
    { field: 'sigla', headerName: 'Sigla', width: 120 },
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
      <PageHeader
        title="Unidades de Medida"
        subtitle="Unidades utilizadas nos produtos (ex: UN, KG, CX)"
        actionLabel="Nova unidade"
        onAction={abrirNovo}
      />

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
        <DialogTitle>{editandoId ? 'Editar unidade' : 'Nova unidade'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={4}>
              <TextField
                fullWidth
                label="Sigla"
                value={form.sigla}
                onChange={(e) => setForm({ ...form, sigla: e.target.value })}
              />
            </Grid>
            <Grid item xs={8}>
              <TextField
                fullWidth
                label="Nome"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
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
        title="Excluir unidade de medida"
        description={`Deseja realmente excluir "${exclusao?.nome}"?`}
        onCancel={() => setExclusao(null)}
        onConfirm={confirmarExclusao}
      />
    </Box>
  )
}
