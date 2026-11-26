import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Grid,
  Divider,
} from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { checkHealth } from '../api/auth';

const BENCHMARK_RATES = [
  ['OPC Structure Rate', '₹2,000 / sq ft'],
  ['PPC Structure Rate', '₹1,800 / sq ft'],
  ['PSC Structure Rate', '₹1,600 / sq ft'],
  ['Brick Masonry Add-on', '+₹300 / sq ft'],
  ['Tier 1 Cities Index', '+15% regional'],
  ['Tier 2 Cities Index', '+5% regional'],
];

export default function Login() {
  const { firebaseUser, user, needsOnboarding, signInWithGoogle, loading } = useAuth();
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState('');
  const [dbNotice, setDbNotice] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    checkHealth()
      .then((res) => {
        if (!res.data?.dbConnected) {
          setDbNotice(res.data?.dbMessage || 'Supabase DATABASE_URL is not configured yet.');
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (loading) return;
    if (firebaseUser && needsOnboarding) {
      navigate('/signup', { replace: true });
    } else if (firebaseUser && user) {
      navigate(user.role === 'CONTRACTOR' ? '/contractor-dashboard' : '/', { replace: true });
    }
  }, [firebaseUser, user, needsOnboarding, loading, navigate]);

  const handleGoogleSignIn = async () => {
    setError('');
    setSigningIn(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        setError('Google sign-in popup was closed before completing sign-in.');
      } else if (err?.code === 'auth/popup-blocked') {
        setError('Sign-in popup was blocked by the browser. Please allow popups for this site.');
      } else {
        setError(err?.message || 'Google sign-in failed. Please try again.');
      }
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <Box
      sx={{
        maxWidth: 1120,
        mx: 'auto',
        px: { xs: 2, sm: 3 },
        py: { xs: 4, md: 8 },
      }}
    >
      {dbNotice && (
        <Alert severity="info" sx={{ mb: 3, border: '1px solid #bae6fd' }}>
          Database status: {dbNotice} Configure <strong>DATABASE_URL</strong> in environment secrets for Supabase PostgreSQL persistence.
        </Alert>
      )}

      <Grid container spacing={5} alignItems="stretch">
        <Grid item xs={12} md={7} sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Typography
            variant="h3"
            fontWeight={800}
            sx={{
              fontSize: { xs: '2rem', md: '2.75rem' },
              lineHeight: 1.15,
              letterSpacing: '-0.025em',
              color: '#0f172a',
              textWrap: 'balance',
              mb: 2,
            }}
          >
            Residential construction estimates across Tier 1, 2, and 3 cities in India.
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 560, mb: 4, lineHeight: 1.65 }}>
            Model structure, masonry, roofing, paint, and window quantities in minutes, then connect directly with verified regional contractors and compare itemized bids.
          </Typography>

          <Card sx={{ bgcolor: '#ffffff' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2, color: '#0f172a' }}>
                Standard Material & Regional Rates
              </Typography>
              <Grid container spacing={2}>
                {BENCHMARK_RATES.map(([label, rate]) => (
                  <Grid item xs={12} sm={6} key={label}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        py: 1,
                        borderBottom: '1px solid #f1f5f9',
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        {label}
                      </Typography>
                      <Typography variant="body2" fontWeight={600} className="tabular-nums" sx={{ color: '#0f172a' }}>
                        {rate}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={5} sx={{ display: 'flex', alignItems: 'center' }}>
          <Card sx={{ width: '100%', bgcolor: '#ffffff' }}>
            <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
              <Typography variant="h5" fontWeight={700} mb={1} sx={{ color: '#0f172a' }}>
                Sign in to Brikko
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                Authenticate with your Google account to create cost estimates or submit contractor bids.
              </Typography>

              {error && (
                <Alert severity="error" sx={{ mb: 2.5 }}>
                  {error}
                </Alert>
              )}

              <Button
                variant="contained"
                size="large"
                fullWidth
                startIcon={signingIn ? <CircularProgress size={18} color="inherit" /> : <GoogleIcon />}
                onClick={handleGoogleSignIn}
                disabled={signingIn || loading}
                sx={{ py: 1.4, fontSize: 15 }}
              >
                {signingIn ? 'Signing in...' : 'Continue with Google'}
              </Button>

              <Divider sx={{ my: 3 }} />

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body2" fontWeight={600} sx={{ color: '#0f172a' }}>
                  First time on Brikko?
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  After signing in with Google, you can choose either a Homeowner or Contractor account profile.
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
