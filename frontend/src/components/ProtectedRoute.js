import React from 'react';
import { Navigate } from 'react-router-dom';
import { Box, CircularProgress, Alert, Button, Typography, Paper } from '@mui/material';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, roles }) {
  const { firebaseUser, user, needsOnboarding, dbError, loading, refreshProfile, logout } = useAuth();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  if (!firebaseUser) {
    return <Navigate to="/login" replace />;
  }

  if (needsOnboarding) {
    return <Navigate to="/signup" replace />;
  }

  if (dbError && !user) {
    return (
      <Box sx={{ maxWidth: 540, mx: 'auto', mt: 8, px: 2 }}>
        <Paper variant="outlined" sx={{ p: 4, borderColor: '#e2e8f0', borderRadius: 2 }}>
          <Typography variant="h6" fontWeight={700} mb={1}>
            Database Connection Required
          </Typography>
          <Alert severity="warning" sx={{ mb: 3 }}>
            {dbError}
          </Alert>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Configure your Supabase PostgreSQL connection string as <strong>DATABASE_URL</strong> in environment secrets, then retry.
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button variant="contained" onClick={refreshProfile}>
              Retry Connection
            </Button>
            <Button variant="outlined" onClick={logout}>
              Sign Out
            </Button>
          </Box>
        </Paper>
      </Box>
    );
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to={user.role === 'CONTRACTOR' ? '/contractor-dashboard' : '/'} replace />;
  }

  return children;
}
