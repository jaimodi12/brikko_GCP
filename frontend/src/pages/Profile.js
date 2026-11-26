import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import { getProfile, updateProfile } from '../api/user';
import { getOptions } from '../api/project';
import { useAuth } from '../context/AuthContext';
import LocationSelector, { PINCODE_REGEX } from '../components/LocationSelector';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [cities, setCities] = useState([]);
  const [states, setStates] = useState([]);
  const [form, setForm] = useState({
    name: '',
    email: '',
    role: '',
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isContractor = user?.role === 'CONTRACTOR';

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    Promise.all([getProfile(), getOptions.cities(), getOptions.states()])
      .then(([profileRes, citiesRes, statesRes]) => {
        if (!active) return;
        const p = profileRes.data;
        const citiesList = Array.isArray(citiesRes.data) ? citiesRes.data : [];
        const statesList = Array.isArray(statesRes.data) ? statesRes.data : [];
        setCities(citiesList);
        setStates(statesList);

        const matchedCity = citiesList.find(
          (c) =>
            String(c.label).toLowerCase() === String(p.city || '').toLowerCase() ||
            String(c.value).toUpperCase() === String(p.city || '').toUpperCase()
        );

        setForm({
          name: p.name || '',
          email: p.email || '',
          role: p.role || '',
          phone: p.phone || '',
          state: matchedCity?.state || p.state || 'Maharashtra',
          city: matchedCity ? matchedCity.label : p.city || 'Pune',
          pincode: p.pincode || '',
          locality: p.locality || '',
          companyName: p.companyName || '',
          description: p.description || '',
          experienceYears: p.experienceYears != null ? String(p.experienceYears) : '',
          specialization: p.specialization || '',
          minBudget: p.minBudget != null ? String(p.minBudget) : '',
          maxBudget: p.maxBudget != null ? String(p.maxBudget) : '',
        });
      })
      .catch((err) => {
        if (!active) return;
        setError(err.response?.data?.error || 'Unable to load profile.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
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
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        name: form.name,
        phone: form.phone,
        state: form.state,
        city: form.city,
        pincode: form.pincode.trim(),
        locality: form.locality.trim(),
        companyName: form.companyName || null,
        description: form.description || null,
        experienceYears: form.experienceYears !== '' ? parseInt(form.experienceYears, 10) : null,
        specialization: form.specialization || null,
        minBudget: form.minBudget !== '' ? parseInt(form.minBudget, 10) : null,
        maxBudget: form.maxBudget !== '' ? parseInt(form.maxBudget, 10) : null,
      };
      const res = await updateProfile(payload);
      const updated = res.data;
      updateUser(updated);
      setForm((prev) => ({
        ...prev,
        state: updated.state || prev.state,
        city: updated.city || prev.city,
        pincode: updated.pincode || prev.pincode,
        locality: updated.locality || prev.locality,
      }));
      setSuccess('Profile settings saved to Supabase.');
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 820 }}>
      <Typography variant="h4" sx={{ mb: 0.5 }}>
        Account Settings
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Manage your contact details, state, city, pincode, locality, and contractor directory preferences.
      </Typography>

      <Card>
        <CardContent sx={{ p: { xs: 2.5, sm: 4 } }}>
          {error && <Alert severity="error" sx={{ mb: 2.5 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2.5 }}>{success}</Alert>}

          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                <TextField label="Full Name" name="name" value={form.name} onChange={handleChange} required fullWidth />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Verified Google Email" name="email" value={form.email} fullWidth disabled />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Account Role" name="role" value={form.role} fullWidth disabled />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Mobile Number"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  required
                  fullWidth
                  inputProps={{ maxLength: 10 }}
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
                  onLocationChange={(patch) => {
                    setForm((prev) => ({ ...prev, ...patch }));
                    setError('');
                    setSuccess('');
                  }}
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

              {isContractor && (
                <>
                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="subtitle1" fontWeight={700} mt={1.5}>
                      Contractor Business Details
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Company Name"
                      name="companyName"
                      value={form.companyName}
                      onChange={handleChange}
                      fullWidth
                      required
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
                      inputProps={{ min: 0 }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Specialization"
                      name="specialization"
                      value={form.specialization}
                      onChange={handleChange}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="About / Scope"
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                      multiline
                      rows={3}
                      fullWidth
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

            <Button type="submit" variant="contained" size="large" sx={{ mt: 3, px: 3 }} disabled={saving}>
              {saving ? <CircularProgress size={20} color="inherit" /> : 'Save Changes'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
