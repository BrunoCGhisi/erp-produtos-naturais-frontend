import { useEffect, useState } from 'react'
import { Box, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, IconButton, Paper, Grid } from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import EditIcon from '@mui/icons-material/EditOutlined'
import DeleteIcon from '@mui/icons-material/DeleteOutline'
import { useSnackbar } from 'notistack'
import PageHeader from '../../components/PageHeader'
import ConfirmDialog from '../../components/ConfirmDialog'
import { fornecedorApi } from '../../api/fornecedorApi'

const vazio = {
  nomeFantasia: '',
  razaoSocial: '',
  cnpj: '',
  cpf: '',
  estado: '',
  cidade: '',
  bairro: '',
  complemento: ''
}

export default function FornecedorListPage() {
  const { enqueueSnackbar } = useSnackbar()
  const [linhas, setLinhas] = useState([])
  const [carregando, setCarregando] = useState(false)
  const [dialogAberto, setDialogAberto] = useState(false)
  const [form, setForm] = useState(vazio)
  const [editandoId, setEditandoId] = useState(null)
  const [exclusao, setExclusao] = useState(null)

  const carregar = () => {
    setCarregando(true)
    fornecedorApi
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

  const abrirEdicao = (fornecedor) => {
    setForm({ ...vazio, ...fornecedor })
    setEditandoId(fornecedor.id)
    setDialogAberto(true)
  }

  const salvar = () => {
    const acao = editandoId ? fornecedorApi.atualizar(editandoId, form) : fornecedorApi.criar(form)
    acao
      .then(() => {
        enqueueSnackbar('Fornecedor salvo com sucesso', { variant: 'success' })
        setDialogAberto(false)
        carregar()
      })
      .catch((e) => enqueueSnackbar(e.message, { variant: 'error' }))
  }

  const confirmarExclusao = () => {
    fornecedorApi
      .excluir(exclusao.id)
      .then(() => {
        enqueueSnackbar('Fornecedor excluído', { variant: 'success' })
        setExclusao(null)
        carregar()
      })
      .catch((e) => enqueueSnackbar(e.message, { variant: 'error' }))
  }

  const colunas = [
    { field: 'nomeFantasia', headerName: 'Nome Fantasia', flex: 1 },
    { field: 'cnpj', headerName: 'CNPJ', width: 160 },
    { field: 'cidade', headerName: 'Cidade', width: 140 },
    { field: 'estado', headerName: 'UF', width: 80 },
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
        title="Fornecedores"
        subtitle="Fornecedores utilizados nas entradas de estoque"
        actionLabel="Novo fornecedor"
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

      <Dialog open={dialogAberto} onClose={() => setDialogAberto(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editandoId ? 'Editar fornecedor' : 'Novo fornecedor'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nome Fantasia"
                value={form.nomeFantasia}
                onChange={(e) => setForm({ ...form, nomeFantasia: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Razão Social"
                value={form.razaoSocial}
                onChange={(e) => setForm({ ...form, razaoSocial: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="CNPJ" value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="CPF" value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                fullWidth
                label="Estado"
                value={form.estado}
                onChange={(e) => setForm({ ...form, estado: e.target.value })}
              />
            </Grid>
            <Grid item xs={6} sm={4}>
              <TextField
                fullWidth
                label="Cidade"
                value={form.cidade}
                onChange={(e) => setForm({ ...form, cidade: e.target.value })}
              />
            </Grid>
            <Grid item xs={6} sm={5}>
              <TextField
                fullWidth
                label="Bairro"
                value={form.bairro}
                onChange={(e) => setForm({ ...form, bairro: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Complemento"
                value={form.complemento}
                onChange={(e) => setForm({ ...form, complemento: e.target.value })}
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
        title="Excluir fornecedor"
        description={`Deseja realmente excluir "${exclusao?.nomeFantasia}"?`}
        onCancel={() => setExclusao(null)}
        onConfirm={confirmarExclusao}
      />
    </Box>
  )
}
