import React, { useState } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EngineeringIcon from '@mui/icons-material/Engineering';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import LogoutIcon from '@mui/icons-material/Logout';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SIDEBAR_WIDTH = 256;

const ROUTE_TITLES = [
  { match: /^\/$/, title: 'Projects Overview' },
  { match: /^\/new-project/, title: 'New Cost Estimate' },
  { match: /^\/cost-result/, title: 'Cost Breakdown' },
  { match: /^\/contractors/, title: 'Matched Contractors' },
  { match: /^\/contractor-dashboard/, title: 'Contractor Console' },
  { match: /^\/profile/, title: 'Account Settings' },
];

export default function Navbar({ children }) {
  const { firebaseUser, user, needsOnboarding, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const showWorkspaceChrome = Boolean(firebaseUser && user && !needsOnboarding);

  const currentTitle =
    ROUTE_TITLES.find((r) => r.match.test(location.pathname))?.title || 'Brikko';

  const handleSignOut = async () => {
    await logout();
    navigate('/login');
  };

  if (!showWorkspaceChrome) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            bgcolor: '#ffffff',
            color: '#0f172a',
            borderBottom: '1px solid #e2e8f0',
          }}
        >
          <Toolbar sx={{ maxWidth: 1200, width: '100%', mx: 'auto', px: { xs: 2, sm: 3 }, justifyContent: 'space-between', gap: 4 }}>
            <Box
              onClick={() => navigate('/login')}
              sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer', flexShrink: 0 }}
            >
              <img src="/logo.png" alt="Brikko" style={{ height: 32, width: 'auto' }} />
              <Typography variant="h6" fontWeight={800} sx={{ letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>
                Brikko
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
              {firebaseUser ? (
                <Button variant="outlined" size="small" onClick={handleSignOut} sx={{ whiteSpace: 'nowrap' }}>
                  Sign Out
                </Button>
              ) : (
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => navigate('/login')}
                  sx={{ whiteSpace: 'nowrap' }}
                >
                  Sign In
                </Button>
              )}
            </Box>
          </Toolbar>
        </AppBar>
        <Box component="main" sx={{ flexGrow: 1 }}>
          {children}
        </Box>
      </Box>
    );
  }

  const navItems =
    user.role === 'CONTRACTOR'
      ? [
          { label: 'Bidding Console', path: '/contractor-dashboard', icon: <EngineeringIcon fontSize="small" /> },
          { label: 'Account Settings', path: '/profile', icon: <PersonOutlineIcon fontSize="small" /> },
        ]
      : [
          { label: 'Projects', path: '/', icon: <FolderOpenIcon fontSize="small" /> },
          { label: 'New Estimate', path: '/new-project', icon: <AddCircleOutlineIcon fontSize="small" /> },
          { label: 'Account Settings', path: '/profile', icon: <PersonOutlineIcon fontSize="small" /> },
        ];

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#ffffff' }}>
      <Box
        onClick={() => {
          navigate(user.role === 'CONTRACTOR' ? '/contractor-dashboard' : '/');
          setMobileOpen(false);
        }}
        sx={{
          height: 64,
          px: 2.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          borderBottom: '1px solid #e2e8f0',
          cursor: 'pointer',
        }}
      >
        <img src="/logo.png" alt="Brikko" style={{ height: 30, width: 'auto' }} />
        <Typography variant="h6" fontWeight={800} sx={{ letterSpacing: '-0.02em', color: '#0f172a' }}>
          Brikko
        </Typography>
      </Box>

      <List sx={{ px: 1.5, py: 2, flexGrow: 1 }}>
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <ListItemButton
              key={item.path}
              selected={active}
              onClick={() => {
                navigate(item.path);
                setMobileOpen(false);
              }}
              sx={{
                borderRadius: 1.5,
                mb: 0.5,
                py: 1.1,
                color: active ? '#1d4ed8' : '#475569',
                bgcolor: active ? '#eff6ff !important' : 'transparent',
                '&:hover': { bgcolor: '#f1f5f9', color: '#0f172a' },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36, color: active ? '#1d4ed8' : '#64748b' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontSize: 14,
                  fontWeight: active ? 600 : 500,
                  noWrap: true,
                }}
              />
            </ListItemButton>
          );
        })}
      </List>

      <Divider sx={{ borderColor: '#e2e8f0' }} />
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
          <Avatar sx={{ width: 36, height: 36, bgcolor: '#0f172a', fontSize: 14, fontWeight: 700 }}>
            {user.name?.charAt(0)?.toUpperCase() || 'U'}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" fontWeight={600} noWrap sx={{ color: '#0f172a' }}>
              {user.name}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap display="block">
              {user.role === 'CONTRACTOR' ? 'Contractor' : 'Homeowner'} · {user.city || 'India'}
            </Typography>
          </Box>
        </Box>
        <Button
          fullWidth
          variant="outlined"
          size="small"
          startIcon={<LogoutIcon fontSize="small" />}
          onClick={handleSignOut}
          sx={{
            justifyContent: 'flex-start',
            color: '#475569',
            borderColor: '#e2e8f0',
            '&:hover': { borderColor: '#cbd5e1', bgcolor: '#f8fafc' },
          }}
        >
          Sign Out
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f8fafc' }}>
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { width: SIDEBAR_WIDTH, borderRight: '1px solid #e2e8f0' },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop Fixed Sidebar */}
      <Box
        component="aside"
        sx={{
          width: { md: SIDEBAR_WIDTH },
          flexShrink: 0,
          display: { xs: 'none', md: 'block' },
          borderRight: '1px solid #e2e8f0',
          bgcolor: '#ffffff',
        }}
      >
        <Box sx={{ position: 'sticky', top: 0, height: '100vh' }}>{drawerContent}</Box>
      </Box>

      {/* Main Content Area */}
      <Box sx={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            bgcolor: '#ffffff',
            color: '#0f172a',
            borderBottom: '1px solid #e2e8f0',
          }}
        >
          <Toolbar sx={{ height: 64, px: { xs: 2, sm: 3 }, justifyContent: 'space-between', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
              <IconButton
                edge="start"
                onClick={() => setMobileOpen(true)}
                sx={{ display: { md: 'none' }, color: '#0f172a' }}
                aria-label="Open navigation"
              >
                <MenuIcon />
              </IconButton>
              <Typography variant="subtitle1" fontWeight={700} noWrap sx={{ color: '#0f172a' }}>
                {currentTitle}
              </Typography>
            </Box>

            <Box sx={{ flexShrink: 0 }}>
              {user.role === 'USER' && location.pathname !== '/new-project' && (
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<AddCircleOutlineIcon />}
                  onClick={() => navigate('/new-project')}
                  sx={{ whiteSpace: 'nowrap', px: 2, py: 0.9 }}
                >
                  New Estimate
                </Button>
              )}
            </Box>
          </Toolbar>
        </AppBar>

        <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, sm: 3, lg: 4 }, maxWidth: 1200, width: '100%', mx: 'auto' }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
