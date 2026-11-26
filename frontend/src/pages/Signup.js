import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  ToggleButton,
  ToggleButtonGroup,
  Divider,
  Grid,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import EngineeringIcon from '@mui/icons-material/Engineering';
import GoogleIcon from '@mui/icons-material/Google';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getOptions } from '../api/project';
import LocationSelector, { PINCODE_REGEX } from '../components/LocationSelector';

export default function Signup() {
  const {
    firebaseUser,
    user,
    needsOnboarding,
    loading,
    signingIn,
    authError,
    clearAuthError,
    signInWithGoogle,
    completeOnboarding,
  } = useAuth();
  const navigate = useNavigate();

  const [cities, setCities] = useState([]);
  const [states, setStates] = useState([]);
  const [role, setRole] = useState('USER');
  const [form, setForm] = useState({
    name: '',
    phone: '',
    state: 'Maharashtra',
    city: 'Pune',
    pincode: '',
    locality: '',
    companyName: '',
    description: '',
    experienceYears: '',
    specialization: '',
    minBudget: '',
    maxBudget: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([getOptions.cities(), getOptions.states()])
      .then(([cRes, sRes]) => {
        setCities(Array.isArray(cRes.data) ? cRes.data : []);
        setStates(Array.isArray(sRes.data) ? sRes.data : []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (firebaseUser?.displayName) {
      setForm((prev) => ({ ...prev, name: prev.name || firebaseUser.displayName }));
    }
  }, [firebaseUser]);

  useEffect(() => {
    if (!loading && firebaseUser && user && !needsOnboarding) {
      navigate(user.role === 'CONTRACTOR' ? '/contractor-dashboard' : '/', { replace: true });
    }
  }, [loading, firebaseUser, user, needsOnboarding, navigate]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.state || !form.city) {
      setError('Please select both state and city.');
      return;
    }
    if (!PINCODE_REGEX.test(form.pincode.trim())) {
      setError('Enter a valid 6-digit Indian pincode.');
      return;
    }
    if (!form.locality.trim()) {
      setError('Please select or enter your locality.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        pincode: form.pincode.trim(),
        locality: form.locality.trim(),
        role,
        experienceYears: form.experienceYears !== '' ? parseInt(form.experienceYears, 10) : 0,
        minBudget: form.minBudget !== '' ? parseInt(form.minBudget, 10) : null,
        maxBudget: form.maxBudget !== '' ? parseInt(form.maxBudget, 10) : null,
      };
      const created = await completeOnboarding(payload);
      navigate(created.role === 'CONTRACTOR' ? '/contractor-dashboard' : '/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Could not complete onboarding. Please check your inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  if (!firebaseUser) {
    return (
      <Box sx={{ maxWidth: 460, mx: 'auto', px: 2, py: 8 }}>
        <Card>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h5" fontWeight={700} mb={1}>
              Sign in to get started
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Connect your Google account first, then select whether you are a homeowner or contractor.
            </Typography>
            {authError && (
              <Alert severity="error" sx={{ mb: 2.5, textAlign: 'left' }}>
                {authError}
              </Alert>
            )}
            <Button
              variant="contained"
              size="large"
              fullWidth
              disabled={signingIn}
              startIcon={signingIn ? <CircularProgress size={18} color="inherit" /> : <GoogleIcon />}
              onClick={() => {
                clearAuthError();
                signInWithGoogle().catch(() => {});
              }}
            >
              {signingIn ? 'Signing in...' : 'Continue with Google'}
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 680, mx: 'auto', px: 2, py: { xs: 3, md: 5 } }}>
      <Card>
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Typography variant="h5" fontWeight={700} mb={0.5}>
            Complete Your Profile
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Signed in as <strong>{firebaseUser.email}</strong> · Choose your account type to continue.
          </Typography>

          <Box sx={{ mb: 3 }}>
            <ToggleButtonGroup
              value={role}
              exclusive
              onChange={(_, v) => v && setRole(v)}
              fullWidth
              size="small"
            >
              <ToggleButton value="USER" sx={{ py: 1.1 }}>
                <PersonIcon fontSize="small" sx={{ mr: 1 }} /> I'm a Homeowner
              </ToggleButton>
              <ToggleButton value="CONTRACTOR" sx={{ py: 1.1 }}>
                <EngineeringIcon fontSize="small" sx={{ mr: 1 }} /> I'm a Contractor
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2.5 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Full Name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Mobile Number"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  required
                  fullWidth
                  placeholder="9876543210"
                  inputProps={{ maxLength: 10 }}
                  helperText="10-digit Indian mobile number"
                />
              </Grid>

              <Grid item xs={12}>
                <LocationSelector
                  states={states}
                  cities={cities}
                  state={form.state}
                  city={form.city}
                  pincode={form.pincode}
                  locality={form.locality}
                  cityValueMode="name"
                  onLocationChange={(patch) => setForm((prev) => ({ ...prev, ...patch }))}
                  onCityDirectoryUpdate={(newCity, resolvedState) => {
                    setCities((prev) =>
                      prev.some((c) => String(c.value).toUpperCase() === String(newCity.value).toUpperCase())
                        ? prev
                        : [...prev, newCity]
                    );
                    if (resolvedState) {
                      setStates((prev) =>
                        prev.some((s) => String(s.value || s.label).toLowerCase() === resolvedState.toLowerCase())
                          ? prev
                          : [...prev, { value: resolvedState, label: resolvedState }].sort((a, b) =>
                              a.label.localeCompare(b.label)
                            )
                      );
                    }
                  }}
                />
              </Grid>

              {role === 'CONTRACTOR' && (
                <>
                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Company & Budget Profile
                      </Typography>
                    </Divider>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Company Name"
                      name="companyName"
                      value={form.companyName}
                      onChange={handleChange}
                      required
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Company Description"
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                      fullWidth
                      multiline
                      rows={2}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Experience (Years)"
                      name="experienceYears"
                      type="number"
                      value={form.experienceYears}
                      onChange={handleChange}
                      fullWidth
                      inputProps={{ min: 0, max: 60 }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Specialization"
                      name="specialization"
                      value={form.specialization}
                      onChange={handleChange}
                      fullWidth
                      placeholder="e.g. Residential, Turnkey RCC"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Min Budget (₹)"
                      name="minBudget"
                      type="number"
                      value={form.minBudget}
                      onChange={handleChange}
                      fullWidth
                      inputProps={{ min: 0 }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Max Budget (₹)"
                      name="maxBudget"
                      type="number"
                      value={form.maxBudget}
                      onChange={handleChange}
                      fullWidth
                      inputProps={{ min: 0 }}
                    />
                  </Grid>
                </>
              )}
            </Grid>

            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={submitting}
              sx={{ mt: 3, py: 1.4 }}
            >
              {submitting ? <CircularProgress size={22} color="inherit" /> : 'Save & Continue'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
