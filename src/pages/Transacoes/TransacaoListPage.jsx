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
  Chip,
  Alert
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import EditIcon from '@mui/icons-material/EditOutlined'
import DeleteIcon from '@mui/icons-material/DeleteOutline'
import { useSnackbar } from 'notistack'
import PageHeader from '../../components/PageHeader'
import ConfirmDialog from '../../components/ConfirmDialog'
import { transacaoApi } from '../../api/transacaoApi'

const TIPOS = ['ENTRADA', 'SAIDA', 'AJUSTE']
const vazio = { sigla: '', nome: '', tipo: 'ENTRADA' }

const corTipo = { ENTRADA: 'success', SAIDA: 'error', AJUSTE: 'warning' }

export default function TransacaoListPage() {
  const { enqueueSnackbar } = useSnackbar()
  const [linhas, setLinhas] = useState([])
  const [carregando, setCarregando] = useState(false)
  const [dialogAberto, setDialogAberto] = useState(false)
  const [form, setForm] = useState(vazio)
  const [editandoId, setEditandoId] = useState(null)
  const [exclusao, setExclusao] = useState(null)

  const carregar = () => {
    setCarregando(true)
    transacaoApi
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
    setForm({ sigla: item.sigla, nome: item.nome, tipo: item.tipo })
    setEditandoId(item.id)
    setDialogAberto(true)
  }

  const salvar = () => {
    const acao = editandoId ? transacaoApi.atualizar(editandoId, form) : transacaoApi.criar(form)
    acao
      .then(() => {
        enqueueSnackbar('Tipo de movimentação salvo com sucesso', { variant: 'success' })
        setDialogAberto(false)
        carregar()
      })
      .catch((e) => enqueueSnackbar(e.message, { variant: 'error' }))
  }

  const confirmarExclusao = () => {
    transacaoApi
      .excluir(exclusao.id)
      .then(() => {
        enqueueSnackbar('Tipo de movimentação excluído', { variant: 'success' })
        setExclusao(null)
        carregar()
      })
      .catch((e) => enqueueSnackbar(e.message, { variant: 'error' }))
  }

  const colunas = [
    { field: 'sigla', headerName: 'Sigla', width: 100 },
    { field: 'nome', headerName: 'Nome', flex: 1 },
    {
      field: 'tipo',
      headerName: 'Tipo',
      width: 140,
      renderCell: (params) => <Chip label={params.value} size="small" color={corTipo[params.value]} variant="outlined" />
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
        title="Tipos de Movimentação"
        subtitle="Cadastre os tipos de transação usados nas movimentações de estoque"
        actionLabel="Novo tipo"
        onAction={abrirNovo}
      />

      {linhas.length === 0 && !carregando && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Cadastre ao menos 3 tipos antes de usar a tela de Estoque, por exemplo: sigla <b>ENT</b> / nome "Entrada" /
          tipo <b>ENTRADA</b>; sigla <b>SAI</b> / nome "Saída" / tipo <b>SAIDA</b>; sigla <b>AJU</b> / nome "Ajuste" /
          tipo <b>AJUSTE</b>.
        </Alert>
      )}

      <Paper variant="outlined" sx={{ height: 420 }}>
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
        <DialogTitle>{editandoId ? 'Editar tipo de movimentação' : 'Novo tipo de movimentação'}</DialogTitle>
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
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Tipo"
                value={form.tipo}
                onChange={(e) => setForm({ ...form, tipo: e.target.value })}
              >
                {TIPOS.map((t) => (
                  <MenuItem key={t} value={t}>
                    {t}
                  </MenuItem>
                ))}
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
        title="Excluir tipo de movimentação"
        description={`Deseja realmente excluir "${exclusao?.nome}"?`}
        onCancel={() => setExclusao(null)}
        onConfirm={confirmarExclusao}
      />
    </Box>
  )
}
