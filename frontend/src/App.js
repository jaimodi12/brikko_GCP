import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

import Login from './pages/Login';
import Signup from './pages/Signup';
import Home from './pages/Home';
import NewProject from './pages/NewProject';
import CostResult from './pages/CostResult';
import ContractorsList from './pages/ContractorsList';
import ContractorDashboard from './pages/ContractorDashboard';
import Profile from './pages/Profile';

const theme = createTheme({
  palette: {
    primary: { main: '#1d4ed8', dark: '#1e40af', light: '#eff6ff' },
    secondary: { main: '#d97706' },
    success: { main: '#16a34a' },
    background: { default: '#f8fafc', paper: '#ffffff' },
    text: { primary: '#0f172a', secondary: '#475569' },
    divider: '#e2e8f0',
  },
  typography: {
    fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
    h4: { fontWeight: 700, letterSpacing: '-0.02em' },
    h5: { fontWeight: 700, letterSpacing: '-0.015em' },
    h6: { fontWeight: 600, letterSpacing: '-0.01em' },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        'html, body, button, input, select, textarea': {
          fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          border: '1px solid #e2e8f0',
          borderRadius: 10,
        },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
    },
  },
});

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <BrowserRouter>
          <Navbar>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
              <Route path="/new-project" element={<ProtectedRoute roles={['USER']}><NewProject /></ProtectedRoute>} />
              <Route path="/cost-result/:projectId" element={<ProtectedRoute><CostResult /></ProtectedRoute>} />
              <Route path="/contractors/:projectId" element={<ProtectedRoute><ContractorsList /></ProtectedRoute>} />
              <Route path="/contractor-dashboard" element={<ProtectedRoute roles={['CONTRACTOR']}><ContractorDashboard /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Navbar>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
