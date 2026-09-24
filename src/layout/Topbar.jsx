import { AppBar, Toolbar, Typography, Chip } from '@mui/material'
import { DRAWER_WIDTH } from './Sidebar'

export default function Topbar() {
  return (
    <AppBar
      position="fixed"
      color="inherit"
      elevation={0}
      sx={{
        width: `calc(100% - ${DRAWER_WIDTH}px)`,
        ml: `${DRAWER_WIDTH}px`,
        borderBottom: '1px solid #E0E0E0'
      }}
    >
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="h6" color="text.primary">
          Sistema de Gerenciamento de Estoque
        </Typography>
        <Chip label="MVP · Produto + Estoque" color="primary" variant="outlined" size="small" />
      </Toolbar>
    </AppBar>
  )
}
