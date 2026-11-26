import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  TextField,
  InputAdornment,
  Skeleton,
  Alert,
  Divider,
  Autocomplete,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import HomeWorkOutlinedIcon from '@mui/icons-material/HomeWorkOutlined';
import { useNavigate } from 'react-router-dom';
import { getMyProjects, getOptions } from '../api/project';
import { useAuth } from '../context/AuthContext';
import CitySelect from '../components/CitySelect';

function formatINR(amount) {
  if (amount == null) return '—';
  return `₹${Number(amount).toLocaleString('en-IN')}`;
}

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [cities, setCities] = useState([]);
  const [states, setStates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('ALL');
  const [cityFilter, setCityFilter] = useState('ALL');

  useEffect(() => {
    if (!user) return;
    if (user.role === 'CONTRACTOR') {
      navigate('/contractor-dashboard', { replace: true });
      return;
    }
    setLoading(true);
    setError('');
    Promise.all([
      getMyProjects(),
      getOptions.cities().catch(() => ({ data: [] })),
      getOptions.states().catch(() => ({ data: [] })),
    ])
      .then(([projRes, citiesRes, statesRes]) => {
        if (Array.isArray(projRes.data)) {
          setProjects(projRes.data);
        } else {
          setProjects([]);
          setError('Unexpected response while loading projects.');
        }
        setCities(Array.isArray(citiesRes.data) ? citiesRes.data : []);
        setStates(Array.isArray(statesRes.data) ? statesRes.data : []);
      })
      .catch((err) => setError(err.response?.data?.error || err.message || 'Failed to load projects.'))
      .finally(() => setLoading(false));
  }, [user, navigate]);

  const safeProjects = useMemo(() => (Array.isArray(projects) ? projects : []), [projects]);

  const stateOptions = useMemo(
    () => ['ALL', ...states.map((s) => s.label || s.value).filter(Boolean)],
    [states]
  );

  const citiesForFilter = useMemo(() => {
    if (!stateFilter || stateFilter === 'ALL') return cities;
    return cities.filter(
      (c) => String(c.state || '').toLowerCase() === String(stateFilter).toLowerCase()
    );
  }, [cities, stateFilter]);

  const filteredProjects = useMemo(() => {
    const q = search.trim().toLowerCase();
    const stateNorm = String(stateFilter || 'ALL').toLowerCase();
    const cityNorm = String(cityFilter || 'ALL').toUpperCase();
    return safeProjects.filter((p) => {
      const matchesState =
        stateNorm === 'all' || String(p.state || '').toLowerCase() === stateNorm;
      const pCityCode = String(p.city || '').toUpperCase();
      const pCityName = String(p.cityName || p.city || '').toUpperCase();
      const matchesCity =
        cityNorm === 'ALL' || pCityCode === cityNorm || pCityName === cityNorm;
      const matchesSearch =
        !q ||
        (p.projectName || '').toLowerCase().includes(q) ||
        String(p.locality || '').toLowerCase().includes(q) ||
        String(p.cityName || p.city || '').toLowerCase().includes(q) ||
        String(p.state || '').toLowerCase().includes(q) ||
        String(p.pincode || '').toLowerCase().includes(q);
      return matchesState && matchesCity && matchesSearch;
    });
  }, [safeProjects, search, stateFilter, cityFilter]);

  const stats = useMemo(() => {
    const totalValue = safeProjects.reduce((sum, p) => sum + Number(p.totalEstimatedCost || 0), 0);
    const totalArea = safeProjects.reduce(
      (sum, p) => sum + Number(p.plotAreaSqFt || 0) * Number(p.numberOfFloors || 1),
      0
    );
    const avgRate = totalArea > 0 ? Math.round(totalValue / totalArea) : 0;
    return {
      count: safeProjects.length,
      totalValue,
      avgRate,
    };
  }, [safeProjects]);

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ color: '#0f172a', mb: 0.5 }}>
            My Construction Projects
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage saved cost estimates and compare contractor bids across Tier 1, Tier 2, and Tier 3 cities in India.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/new-project')}
          sx={{ whiteSpace: 'nowrap' }}
        >
          New Estimate
        </Button>
      </Box>

      {/* KPI Summary Strip */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Total Projects', value: String(stats.count) },
          { label: 'Cumulative Estimate', value: formatINR(stats.totalValue) },
          {
            label: 'Blended Built-Up Rate',
            value: stats.avgRate > 0 ? `${formatINR(stats.avgRate)} / sq ft` : '—',
          },
        ].map((kpi) => (
          <Grid item xs={12} sm={4} key={kpi.label}>
            <Card>
              <CardContent sx={{ py: 2.25, px: 2.5 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={0.5}>
                  {kpi.label}
                </Typography>
                <Typography variant="h5" fontWeight={700} className="tabular-nums" sx={{ color: '#0f172a' }}>
                  {kpi.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Search & Cascading State -> City Filter Toolbar */}
      <Grid container spacing={2} sx={{ mb: 3 }} alignItems="center">
        <Grid item xs={12} md={4}>
          <TextField
            size="small"
            fullWidth
            placeholder="Search name, locality, pincode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ bgcolor: '#ffffff' }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Autocomplete
            size="small"
            options={stateOptions}
            value={stateOptions.includes(stateFilter) ? stateFilter : 'ALL'}
            disableClearable
            isOptionEqualToValue={(opt, val) => String(opt) === String(val)}
            getOptionLabel={(opt) => (opt === 'ALL' ? 'All States' : opt)}
            onChange={(_e, nextState) => {
              const picked = nextState || 'ALL';
              setStateFilter(picked);
              if (picked === 'ALL') {
                setCityFilter('ALL');
              } else {
                const matchInNewState = cities.some(
                  (c) =>
                    String(c.state || '').toLowerCase() === picked.toLowerCase() &&
                    (String(c.value).toUpperCase() === String(cityFilter).toUpperCase() ||
                      String(c.label).toLowerCase() === String(cityFilter).toLowerCase())
                );
                if (!matchInNewState) {
                  setCityFilter('ALL');
                }
              }
            }}
            sx={{ bgcolor: '#ffffff' }}
            renderInput={(params) => <TextField {...params} label="State" />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <CitySelect
            size="small"
            label="City"
            cities={citiesForFilter}
            value={cityFilter}
            valueMode="code"
            includeAllOption
            allOptionLabel={stateFilter === 'ALL' ? 'All Cities' : `All Cities in ${stateFilter}`}
            placeholder="All Cities"
            onChange={(nextVal, cityObj) => {
              setCityFilter(nextVal || 'ALL');
              if (nextVal !== 'ALL' && cityObj?.state && stateFilter === 'ALL') {
                setStateFilter(cityObj.state);
              }
            }}
            sx={{ bgcolor: '#ffffff' }}
          />
        </Grid>
      </Grid>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {loading ? (
        <Grid container spacing={2.5}>
          {[1, 2, 3].map((n) => (
            <Grid item xs={12} sm={6} lg={4} key={n}>
              <Card>
                <CardContent>
                  <Skeleton variant="text" width="70%" height={28} />
                  <Skeleton variant="text" width="50%" height={20} sx={{ mb: 2 }} />
                  <Skeleton variant="rectangular" height={40} sx={{ borderRadius: 1 }} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : safeProjects.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 7, px: 3 }}>
          <HomeWorkOutlinedIcon sx={{ fontSize: 48, color: '#94a3b8', mb: 1.5 }} />
          <Typography variant="h6" fontWeight={700} mb={0.5}>
            No construction estimates yet
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Configure state, city, pincode, and material finishes to generate your first estimate.
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/new-project')}>
            Create First Estimate
          </Button>
        </Card>
      ) : filteredProjects.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 6, px: 3 }}>
          <Typography variant="subtitle1" fontWeight={600} mb={1}>
            No matching projects
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Try clearing your search query or resetting the state and city filters.
          </Typography>
          <Button
            variant="outlined"
            size="small"
            onClick={() => {
              setSearch('');
              setStateFilter('ALL');
              setCityFilter('ALL');
            }}
          >
            Reset Filters
          </Button>
        </Card>
      ) : (
        <Grid container spacing={2.5}>
          {filteredProjects.map((p) => {
            const cityState = [p.cityName || p.city, p.state || null].filter(Boolean).join(', ');
            const fullLocation = [p.locality || null, cityState || null].filter(Boolean).join(' · ');
            return (
              <Grid item xs={12} sm={6} lg={4} key={p.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'border-color 150ms ease',
                    '&:hover': { borderColor: '#94a3b8' },
                  }}
                >
                  <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
                    <Typography variant="h6" fontWeight={700} noWrap mb={0.5} sx={{ color: '#0f172a' }}>
                      {p.projectName || `Project #${p.id}`}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mb={2} className="tabular-nums">
                      {fullLocation}
                      {p.pincode ? ` · ${p.pincode}` : ''} · Project #{p.id}
                    </Typography>

                    <Typography variant="h5" fontWeight={700} className="tabular-nums" sx={{ color: '#1d4ed8', mb: 1.5 }}>
                      {formatINR(p.totalEstimatedCost)}
                    </Typography>

                    <Divider sx={{ my: 1.5, borderColor: '#f1f5f9' }} />

                    <Typography variant="caption" color="text.secondary" display="block" className="tabular-nums">
                      {p.plotAreaSqFt} sq ft · {p.numberOfFloors} {p.numberOfFloors === 1 ? 'Floor' : 'Floors'} · {p.numberOfRooms} Rooms
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                      Created {new Date(p.createdAt).toLocaleDateString('en-IN')}
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ px: 2.5, pb: 2.5, pt: 0, gap: 1 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => navigate(`/cost-result/${p.id}`)}
                      sx={{ whiteSpace: 'nowrap' }}
                    >
                      Breakdown
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => navigate(`/contractors/${p.id}`)}
                      sx={{ whiteSpace: 'nowrap' }}
                    >
                      Find Contractors
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
}
