import { useNavigate, useLocation } from 'react-router-dom'
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Box,
  Typography,
  Divider
} from '@mui/material'
import DashboardIcon from '@mui/icons-material/DashboardOutlined'
import Inventory2Icon from '@mui/icons-material/Inventory2Outlined'
import CategoryIcon from '@mui/icons-material/CategoryOutlined'
import StraightenIcon from '@mui/icons-material/StraightenOutlined'
import StoreIcon from '@mui/icons-material/StorefrontOutlined'
import LocalShippingIcon from '@mui/icons-material/LocalShippingOutlined'
import SwapVertIcon from '@mui/icons-material/SwapVertOutlined'
import QrCodeIcon from '@mui/icons-material/QrCode2Outlined'
import RuleIcon from '@mui/icons-material/RuleOutlined'
import EnergySavingsLeafIcon from '@mui/icons-material/EnergySavingsLeafOutlined'

export const DRAWER_WIDTH = 260

const itens = [
  { label: 'Dashboard', path: '/', icon: <DashboardIcon /> },
  { label: 'Produtos', path: '/produtos', icon: <Inventory2Icon /> },
  { label: 'SKUs', path: '/skus', icon: <QrCodeIcon /> },
  { label: 'Estoque', path: '/estoque', icon: <SwapVertIcon /> },
  { label: 'Tipos de Movimentação', path: '/transacoes', icon: <RuleIcon /> },
  { label: 'Categorias', path: '/categorias', icon: <CategoryIcon /> },
  { label: 'Unidades de Medida', path: '/unidades-medida', icon: <StraightenIcon /> },
  { label: 'Lojas', path: '/lojas', icon: <StoreIcon /> },
  { label: 'Fornecedores', path: '/fornecedores', icon: <LocalShippingIcon /> }
]

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { width: DRAWER_WIDTH, boxSizing: 'border-box', border: 'none' }
      }}
    >
      <Toolbar sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 2 }}>
        <EnergySavingsLeafIcon color="primary" fontSize="large" />
        <Box>
          <Typography variant="h6" color="primary.dark" lineHeight={1}>
            Vila Verde
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Gestão de Estoque
          </Typography>
        </Box>
      </Toolbar>
      <Divider />
      <List sx={{ px: 1, pt: 1 }}>
        {itens.map((item) => (
          <ListItemButton
            key={item.path}
            selected={location.pathname === item.path}
            onClick={() => navigate(item.path)}
            sx={{ borderRadius: 2, mb: 0.5 }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
    </Drawer>
  )
}
