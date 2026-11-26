import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Stepper,
  Step,
  StepLabel,
  TextField,
  Switch,
  Grid,
  CircularProgress,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
  Divider,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ConstructionIcon from '@mui/icons-material/Construction';
import FormatPaintIcon from '@mui/icons-material/FormatPaint';
import WindowIcon from '@mui/icons-material/Window';
import { useNavigate } from 'react-router-dom';
import { createAndEstimate, getOptions } from '../api/project';
import { useAuth } from '../context/AuthContext';
import LocationSelector, { PINCODE_REGEX } from '../components/LocationSelector';

const STEPS = ['Location', 'Plot Details', 'Structure', 'Finishes', 'Review'];

const RATES = {
  cement: { OPC: 2000, PPC: 1800, PSC: 1600 },
  paint: { BASIC: 50, PREMIUM: 100, LUXURY: 200 },
  window: { STANDARD: 8000, ALUMINUM: 12000, UPVC: 15000 },
};

const INIT = {
  projectName: '',
  state: 'Maharashtra',
  city: 'PUNE',
  pincode: '',
  locality: '',
  plotAreaSqFt: '1200',
  numberOfFloors: '2',
  roofAreaSqFt: '1000',
  cementType: 'OPC',
  brickWork: true,
  paintType: 'PREMIUM',
  windowType: 'UPVC',
  numberOfWindows: '8',
  numberOfRooms: '4',
};

function formatINR(v) {
  return `₹${Number(v || 0).toLocaleString('en-IN')}`;
}

export default function NewProject() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(INIT);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState({
    cities: [],
    states: [],
    cementTypes: [],
    paintTypes: [],
    windowTypes: [],
  });
  const [optLoading, setOptLoading] = useState(true);
  const hydratedUserRef = React.useRef(false);

  useEffect(() => {
    Promise.all([
      getOptions.cities(),
      getOptions.states(),
      getOptions.cementTypes(),
      getOptions.paintTypes(),
      getOptions.windowTypes(),
    ])
      .then(([c, st, ce, p, w]) => {
        const citiesList = Array.isArray(c.data) ? c.data : [];
        const statesList = Array.isArray(st.data) ? st.data : [];
        setOptions({
          cities: citiesList,
          states: statesList,
          cementTypes: Array.isArray(ce.data) ? ce.data : [],
          paintTypes: Array.isArray(p.data) ? p.data : [],
          windowTypes: Array.isArray(w.data) ? w.data : [],
        });

        if (!hydratedUserRef.current && user?.city && citiesList.length > 0) {
          hydratedUserRef.current = true;
          const matched = citiesList.find(
            (item) =>
              String(item.value).toUpperCase() === String(user.city).toUpperCase() ||
              String(item.label).toLowerCase() === String(user.city).toLowerCase()
          );
          if (matched) {
            setForm((prev) => ({
              ...prev,
              state: matched.state || prev.state,
              city: matched.value,
              pincode: user.pincode || prev.pincode,
              locality: user.locality || prev.locality,
            }));
          }
        }
      })
      .catch(() => setError('Failed to load estimation options from server.'))
      .finally(() => setOptLoading(false));
  }, [user]);

  const onChange = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const selectedCityObj = useMemo(() => {
    return (
      options.cities.find(
        (c) =>
          String(c.value).toUpperCase() === String(form.city).toUpperCase() ||
          String(c.label).toLowerCase() === String(form.city).toLowerCase()
      ) || null
    );
  }, [options.cities, form.city]);

  const liveEstimate = useMemo(() => {
    const plot = Math.max(0, parseFloat(form.plotAreaSqFt) || 0);
    const floors = Math.max(1, parseInt(form.numberOfFloors, 10) || 1);
    const roof = Math.max(0, parseFloat(form.roofAreaSqFt) || 0);
    const windows = Math.max(0, parseInt(form.numberOfWindows, 10) || 0);
    const builtUp = plot * floors;

    const structureCost = Math.trunc(builtUp * (RATES.cement[form.cementType] || 0));
    const brickWorkCost = form.brickWork ? Math.trunc(builtUp * 300) : 0;
    const roofCost = Math.trunc(roof * 500);
    const paintCost = Math.trunc(builtUp * (RATES.paint[form.paintType] || 0));
    const windowCost = Math.trunc((RATES.window[form.windowType] || 0) * windows);
    const subtotal = structureCost + brickWorkCost + roofCost + paintCost + windowCost;
    const multiplier = Number(selectedCityObj?.costMultiplier ?? 1.0);
    const tier = Number(selectedCityObj?.tier ?? 3);
    const cityPremium = Math.trunc(subtotal * Math.max(0, multiplier - 1.0));
    return {
      builtUp,
      structureCost,
      brickWorkCost,
      roofCost,
      paintCost,
      windowCost,
      cityPremium,
      multiplier,
      tier,
      totalCost: subtotal + cityPremium,
    };
  }, [form, selectedCityObj]);

  const canProceed = () => {
    if (step === 0) {
      return (
        form.projectName.trim().length > 0 &&
        Boolean(form.state.trim()) &&
        Boolean(selectedCityObj) &&
        PINCODE_REGEX.test(form.pincode.trim()) &&
        form.locality.trim().length > 0
      );
    }
    if (step === 1) {
      return (
        Number(form.plotAreaSqFt) >= 100 &&
        form.roofAreaSqFt !== '' &&
        Number(form.roofAreaSqFt) >= 0 &&
        Number(form.numberOfRooms) >= 1
      );
    }
    if (step === 2) return Boolean(form.cementType);
    if (step === 3) return Boolean(form.paintType) && Boolean(form.windowType) && Number(form.numberOfWindows) >= 1;
    return true;
  };

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      const payload = {
        projectName: form.projectName.trim(),
        city: form.city,
        state: form.state.trim(),
        pincode: form.pincode.trim(),
        locality: form.locality.trim(),
        plotAreaSqFt: parseFloat(form.plotAreaSqFt),
        numberOfFloors: parseInt(form.numberOfFloors, 10),
        roofAreaSqFt: parseFloat(form.roofAreaSqFt),
        cementType: form.cementType,
        brickWork: form.brickWork,
        paintType: form.paintType,
        windowType: form.windowType,
        numberOfWindows: parseInt(form.numberOfWindows, 10),
        numberOfRooms: parseInt(form.numberOfRooms, 10),
      };
      const res = await createAndEstimate(payload);
      navigate(`/cost-result/${res.data.projectId}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save estimate. Please try again.');
      setLoading(false);
    }
  };

  if (optLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  const cityLabel = selectedCityObj?.label || form.city || '—';
  const cementLabel = options.cementTypes.find((c) => c.value === form.cementType)?.label || form.cementType;
  const paintLabel = options.paintTypes.find((p) => p.value === form.paintType)?.label || form.paintType;
  const windowLabel = options.windowTypes.find((w) => w.value === form.windowType)?.label || form.windowType;
  const tierPct = Math.round((liveEstimate.multiplier - 1) * 100);

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 0.5 }}>
        New Construction Estimate
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Select state and city, enter pincode to load locality, and configure materials for an itemized INR estimate.
      </Typography>

      <Stepper activeStep={step} alternativeLabel sx={{ mb: 4 }}>
        {STEPS.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Grid container spacing={3} alignItems="flex-start">
        <Grid item xs={12} lg={7}>
          <Card>
            <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
              <Typography variant="h6" fontWeight={700} mb={2.5}>
                {STEPS[step]}
              </Typography>

              {error && <Alert severity="error" sx={{ mb: 2.5 }}>{error}</Alert>}

              {step === 0 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  <TextField
                    label="Project Name"
                    value={form.projectName}
                    onChange={(e) => onChange('projectName', e.target.value)}
                    fullWidth
                    placeholder="e.g. Kothrud Duplex Residence"
                    required
                  />

                  <LocationSelector
                    states={options.states}
                    cities={options.cities}
                    state={form.state}
                    city={form.city}
                    pincode={form.pincode}
                    locality={form.locality}
                    cityValueMode="code"
                    onLocationChange={(patch) => setForm((prev) => ({ ...prev, ...patch }))}
                    onCityDirectoryUpdate={(newCity, resolvedState) => {
                      setOptions((prev) => {
                        const hasCity = prev.cities.some(
                          (c) => String(c.value).toUpperCase() === String(newCity.value).toUpperCase()
                        );
                        const hasState =
                          !resolvedState ||
                          prev.states.some(
                            (s) => String(s.value || s.label).toLowerCase() === resolvedState.toLowerCase()
                          );
                        if (hasCity && hasState) return prev;
                        return {
                          ...prev,
                          cities: hasCity ? prev.cities : [...prev.cities, newCity],
                          states: hasState
                            ? prev.states
                            : [
                                ...prev.states,
                                { value: resolvedState, label: resolvedState },
                              ].sort((a, b) => a.label.localeCompare(b.label)),
                        };
                      });
                    }}
                  />

                  {selectedCityObj && (
                    <Box
                      sx={{
                        p: 2,
                        bgcolor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: 2,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 1,
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        {[form.locality, selectedCityObj.label, selectedCityObj.state]
                          .filter(Boolean)
                          .join(', ')} · Tier {selectedCityObj.tier} City
                      </Typography>
                      <Typography variant="body2" fontWeight={700} className="tabular-nums" sx={{ color: '#0f172a' }}>
                        {tierPct > 0 ? `+${tierPct}% Regional Cost Index` : 'Base Cost Index (1.00×)'}
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}

              {step === 1 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <TextField
                    label="Plot Area (sq ft)"
                    type="number"
                    value={form.plotAreaSqFt}
                    onChange={(e) => onChange('plotAreaSqFt', e.target.value)}
                    fullWidth
                    required
                    inputProps={{ min: 100 }}
                    helperText="Minimum 100 sq ft ground footprint"
                  />
                  <Box>
                    <Typography variant="subtitle2" mb={1} color="text.secondary">
                      Number of Floors
                    </Typography>
                    <ToggleButtonGroup
                      value={form.numberOfFloors}
                      exclusive
                      onChange={(_, v) => v && onChange('numberOfFloors', v)}
                      sx={{ flexWrap: 'wrap', gap: 1 }}
                    >
                      {['1', '2', '3', '4', '5', '6'].map((f) => (
                        <ToggleButton key={f} value={f} sx={{ px: 2.5 }}>
                          G+{parseInt(f, 10) - 1}
                        </ToggleButton>
                      ))}
                    </ToggleButtonGroup>
                  </Box>
                  <TextField
                    label="Roof / Terrace Area (sq ft)"
                    type="number"
                    value={form.roofAreaSqFt}
                    onChange={(e) => onChange('roofAreaSqFt', e.target.value)}
                    fullWidth
                    required
                    inputProps={{ min: 0 }}
                  />
                  <TextField
                    label="Number of Rooms"
                    type="number"
                    value={form.numberOfRooms}
                    onChange={(e) => onChange('numberOfRooms', e.target.value)}
                    fullWidth
                    required
                    inputProps={{ min: 1, max: 50 }}
                  />
                </Box>
              )}

              {step === 2 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Box>
                    <Typography variant="subtitle2" mb={1.5} color="text.secondary">
                      Cement Grade
                    </Typography>
                    <Grid container spacing={2}>
                      {options.cementTypes.map((ct) => {
                        const selected = form.cementType === ct.value;
                        const [code, desc] = ct.label.split(' - ');
                        return (
                          <Grid item xs={12} sm={4} key={ct.value}>
                            <Card
                              onClick={() => onChange('cementType', ct.value)}
                              sx={{
                                cursor: 'pointer',
                                borderColor: selected ? '#1d4ed8' : '#e2e8f0',
                                bgcolor: selected ? '#eff6ff' : '#ffffff',
                                height: '100%',
                                '&:hover': { borderColor: '#1d4ed8' },
                              }}
                            >
                              <CardContent sx={{ textAlign: 'center', py: 2.25 }}>
                                <ConstructionIcon sx={{ color: selected ? '#1d4ed8' : '#94a3b8', mb: 0.5 }} />
                                <Typography variant="body2" fontWeight={700}>{code}</Typography>
                                <Typography variant="caption" color="text.secondary" display="block">
                                  {desc}
                                </Typography>
                                <Typography variant="caption" fontWeight={600} className="tabular-nums" display="block" mt={0.5}>
                                  {formatINR(RATES.cement[ct.value])}/sq ft
                                </Typography>
                              </CardContent>
                            </Card>
                          </Grid>
                        );
                      })}
                    </Grid>
                  </Box>

                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 2,
                      border: '1px solid #e2e8f0',
                      borderRadius: 2,
                    }}
                  >
                    <Box>
                      <Typography fontWeight={600}>Include Brick Masonry Work</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Adds ₹300 / sq ft across built-up area
                      </Typography>
                    </Box>
                    <Switch
                      checked={form.brickWork}
                      onChange={(e) => onChange('brickWork', e.target.checked)}
                      color="primary"
                    />
                  </Box>
                </Box>
              )}

              {step === 3 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Box>
                    <Typography variant="subtitle2" mb={1.5} color="text.secondary">
                      Paint Specification
                    </Typography>
                    <Grid container spacing={2}>
                      {options.paintTypes.map((pt) => {
                        const selected = form.paintType === pt.value;
                        return (
                          <Grid item xs={12} sm={4} key={pt.value}>
                            <Card
                              onClick={() => onChange('paintType', pt.value)}
                              sx={{
                                cursor: 'pointer',
                                borderColor: selected ? '#1d4ed8' : '#e2e8f0',
                                bgcolor: selected ? '#eff6ff' : '#ffffff',
                                height: '100%',
                              }}
                            >
                              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                                <FormatPaintIcon sx={{ color: selected ? '#1d4ed8' : '#94a3b8' }} />
                                <Typography variant="body2" fontWeight={600} mt={0.5}>
                                  {pt.label}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" className="tabular-nums">
                                  {formatINR(RATES.paint[pt.value])}/sq ft
                                </Typography>
                              </CardContent>
                            </Card>
                          </Grid>
                        );
                      })}
                    </Grid>
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" mb={1.5} color="text.secondary">
                      Window Framing
                    </Typography>
                    <Grid container spacing={2}>
                      {options.windowTypes.map((wt) => {
                        const selected = form.windowType === wt.value;
                        return (
                          <Grid item xs={12} sm={4} key={wt.value}>
                            <Card
                              onClick={() => onChange('windowType', wt.value)}
                              sx={{
                                cursor: 'pointer',
                                borderColor: selected ? '#1d4ed8' : '#e2e8f0',
                                bgcolor: selected ? '#eff6ff' : '#ffffff',
                                height: '100%',
                              }}
                            >
                              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                                <WindowIcon sx={{ color: selected ? '#1d4ed8' : '#94a3b8' }} />
                                <Typography variant="body2" fontWeight={600} mt={0.5}>
                                  {wt.label}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" className="tabular-nums">
                                  {formatINR(RATES.window[wt.value])}/unit
                                </Typography>
                              </CardContent>
                            </Card>
                          </Grid>
                        );
                      })}
                    </Grid>
                  </Box>

                  <TextField
                    label="Number of Windows"
                    type="number"
                    value={form.numberOfWindows}
                    onChange={(e) => onChange('numberOfWindows', e.target.value)}
                    fullWidth
                    inputProps={{ min: 1, max: 100 }}
                  />
                </Box>
              )}

              {step === 4 && (
                <Box>
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    Review specifications before saving this estimate to Supabase.
                  </Typography>
                  {[
                    ['Project Name', form.projectName],
                    ['State', form.state],
                    ['City', `${cityLabel} (Tier ${liveEstimate.tier})`],
                    ['Pincode', form.pincode],
                    ['Locality', form.locality],
                    ['Plot Area', `${form.plotAreaSqFt} sq ft`],
                    ['Floors', `G+${parseInt(form.numberOfFloors, 10) - 1} (${form.numberOfFloors} floors)`],
                    ['Roof Area', `${form.roofAreaSqFt} sq ft`],
                    ['Rooms', form.numberOfRooms],
                    ['Cement Grade', cementLabel],
                    ['Brick Masonry', form.brickWork ? 'Included' : 'Excluded'],
                    ['Paint Type', paintLabel],
                    ['Windows', `${form.numberOfWindows} × ${windowLabel}`],
                  ].map(([label, value], idx, arr) => (
                    <React.Fragment key={label}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1.1 }}>
                        <Typography variant="body2" color="text.secondary">{label}</Typography>
                        <Typography variant="body2" fontWeight={600} className="tabular-nums">{value}</Typography>
                      </Box>
                      {idx < arr.length - 1 && <Divider sx={{ borderColor: '#f1f5f9' }} />}
                    </React.Fragment>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2.5 }}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => (step === 0 ? navigate('/') : setStep(step - 1))}
              variant="outlined"
            >
              {step === 0 ? 'Cancel' : 'Back'}
            </Button>

            {step < STEPS.length - 1 ? (
              <Button
                variant="contained"
                endIcon={<ArrowForwardIcon />}
                onClick={() => {
                  setError('');
                  setStep(step + 1);
                }}
                disabled={!canProceed()}
              >
                Next
              </Button>
            ) : (
              <Button
                variant="contained"
                size="large"
                onClick={handleSubmit}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <CheckCircleIcon />}
              >
                Save & Generate Estimate
              </Button>
            )}
          </Box>
        </Grid>

        {/* Live Running Estimate Panel */}
        <Grid item xs={12} lg={5}>
          <Card sx={{ position: { lg: 'sticky' }, top: { lg: 88 } }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle2" fontWeight={700} color="text.secondary" mb={0.5}>
                LIVE ESTIMATE PREVIEW
              </Typography>
              <Typography variant="h4" fontWeight={800} className="tabular-nums" sx={{ color: '#0f172a', mb: 0.5 }}>
                {formatINR(liveEstimate.totalCost)}
              </Typography>
              <Typography variant="caption" color="text.secondary" className="tabular-nums" display="block" mb={2.5}>
                Built-up area: {liveEstimate.builtUp.toLocaleString('en-IN')} sq ft ·{' '}
                {[form.locality, cityLabel, form.state].filter(Boolean).join(', ')}
                {form.pincode ? ` · ${form.pincode}` : ''}
              </Typography>

              <Divider sx={{ mb: 2, borderColor: '#f1f5f9' }} />

              {[
                ['Structure & Cement', liveEstimate.structureCost],
                ['Brick Masonry', liveEstimate.brickWorkCost],
                ['Roof Finishing', liveEstimate.roofCost],
                ['Paint & Finishes', liveEstimate.paintCost],
                ['Windows', liveEstimate.windowCost],
                ...(liveEstimate.cityPremium > 0
                  ? [[`${cityLabel} Tier ${liveEstimate.tier} (+${tierPct}%)`, liveEstimate.cityPremium]]
                  : []),
              ].map(([label, amount]) => (
                <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.9 }}>
                  <Typography variant="body2" color="text.secondary">{label}</Typography>
                  <Typography variant="body2" fontWeight={600} className="tabular-nums">
                    {formatINR(amount)}
                  </Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
