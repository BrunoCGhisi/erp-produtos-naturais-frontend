import { useEffect, useState } from 'react'
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Paper,
  Grid,
  MenuItem,
  Chip,
  Alert
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import { useSnackbar } from 'notistack'
import PageHeader from '../../components/PageHeader'
import { estoqueApi } from '../../api/estoqueApi'
import { produtoApi } from '../../api/produtoApi'
import { lojaApi } from '../../api/lojaApi'
import { fornecedorApi } from '../../api/fornecedorApi'
import { transacaoApi } from '../../api/transacaoApi'

const vazio = { idProduto: '', idLoja: '', idFornecedor: '', idTransacao: '', quantidade: '', motivo: '' }

const corTipo = { ENTRADA: 'success', SAIDA: 'error', AJUSTE: 'warning' }

export default function EstoqueListPage() {
  const { enqueueSnackbar } = useSnackbar()
  const [linhas, setLinhas] = useState([])
  const [produtos, setProdutos] = useState([])
  const [lojas, setLojas] = useState([])
  const [fornecedores, setFornecedores] = useState([])
  const [transacoes, setTransacoes] = useState([])
  const [carregando, setCarregando] = useState(false)
  const [dialogAberto, setDialogAberto] = useState(false)
  const [form, setForm] = useState(vazio)

  const carregar = () => {
    setCarregando(true)
    estoqueApi
      .listar()
      .then((dados) => setLinhas(dados.map((d) => ({ ...d, id: d.id }))))
      .catch((e) => enqueueSnackbar(e.message, { variant: 'error' }))
      .finally(() => setCarregando(false))
  }

  useEffect(() => {
    carregar()
    produtoApi.listar().then(setProdutos).catch(() => {})
    lojaApi.listar().then(setLojas).catch(() => {})
    fornecedorApi.listar().then(setFornecedores).catch(() => {})
    transacaoApi.listar().then(setTransacoes).catch(() => {})
  }, [])

  const tipoSelecionado = transacoes.find((t) => t.id === form.idTransacao)?.tipo

  const abrirNovo = () => {
    setForm(vazio)
    setDialogAberto(true)
  }

  const registrar = () => {
    if (!form.idProduto || !form.idLoja || !form.idTransacao || !form.quantidade) {
      enqueueSnackbar('Preencha produto, loja, tipo de movimentação e quantidade', { variant: 'warning' })
      return
    }
    const dados = { ...form, quantidade: Number(form.quantidade), idFornecedor: form.idFornecedor || null }
    estoqueApi
      .registrarMovimentacao(dados)
      .then(() => {
        enqueueSnackbar('Movimentação registrada com sucesso', { variant: 'success' })
        setDialogAberto(false)
        carregar()
      })
      .catch((e) => enqueueSnackbar(e.message, { variant: 'error' }))
  }

  const colunas = [
    { field: 'nomeProduto', headerName: 'Produto', flex: 1 },
    { field: 'nomeLoja', headerName: 'Loja', width: 150 },
    {
      field: 'tipoTransacao',
      headerName: 'Tipo',
      width: 120,
      renderCell: (params) => <Chip label={params.value} size="small" color={corTipo[params.value]} variant="outlined" />
    },
    { field: 'quantidadeAnterior', headerName: 'Qtd. Anterior', width: 130 },
    { field: 'quantidadeRecebida', headerName: 'Qtd. Movimentada', width: 150 },
    { field: 'quantidadeAtual', headerName: 'Qtd. Atual', width: 120 },
    { field: 'nomeFornecedor', headerName: 'Fornecedor', width: 160 },
    {
      field: 'dataMovimentacao',
      headerName: 'Data',
      width: 170,
      valueFormatter: (params) => (params.value ? new Date(params.value).toLocaleString('pt-BR') : '')
    }
  ]

  return (
    <Box>
      <PageHeader
        title="Estoque"
        subtitle="Histórico de movimentações (entradas, saídas e ajustes)"
        actionLabel="Nova movimentação"
        onAction={abrirNovo}
      />

      <Paper variant="outlined" sx={{ height: 560 }}>
        <DataGrid
          rows={linhas}
          columns={colunas}
          loading={carregando}
          disableRowSelectionOnClick
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
            sorting: { sortModel: [{ field: 'dataMovimentacao', sort: 'desc' }] }
          }}
        />
      </Paper>

      <Dialog open={dialogAberto} onClose={() => setDialogAberto(false)} fullWidth maxWidth="sm">
        <DialogTitle>Nova movimentação de estoque</DialogTitle>
        <DialogContent>
          {transacoes.length === 0 && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Nenhum tipo de movimentação cadastrado. Cadastre em "Tipos de Movimentação" antes de continuar.
            </Alert>
          )}
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
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Tipo de movimentação"
                value={form.idTransacao}
                onChange={(e) => setForm({ ...form, idTransacao: e.target.value })}
              >
                {transacoes.map((t) => (
                  <MenuItem key={t.id} value={t.id}>
                    {t.nome} ({t.tipo})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label={tipoSelecionado === 'AJUSTE' ? 'Quantidade final (ajuste)' : 'Quantidade'}
                value={form.quantidade}
                onChange={(e) => setForm({ ...form, quantidade: e.target.value })}
              />
            </Grid>
            {tipoSelecionado === 'ENTRADA' && (
              <Grid item xs={12}>
                <TextField
                  select
                  fullWidth
                  label="Fornecedor"
                  value={form.idFornecedor}
                  onChange={(e) => setForm({ ...form, idFornecedor: e.target.value })}
                >
                  {fornecedores.map((f) => (
                    <MenuItem key={f.id} value={f.id}>
                      {f.nomeFantasia}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            )}
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                minRows={2}
                label="Motivo / observação"
                value={form.motivo}
                onChange={(e) => setForm({ ...form, motivo: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogAberto(false)}>Cancelar</Button>
          <Button variant="contained" onClick={registrar}>
            Registrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
