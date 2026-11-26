import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider,
  Tabs,
  Tab,
  Autocomplete,
  InputAdornment,
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import SearchIcon from '@mui/icons-material/Search';
import { getMyBids, submitBid } from '../api/contractor';
import { getOpenProjects, getOptions } from '../api/project';
import { useAuth } from '../context/AuthContext';
import CitySelect from '../components/CitySelect';

function formatINR(v) {
  return `₹${Number(v || 0).toLocaleString('en-IN')}`;
}

export default function ContractorDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState(0);
  const [bids, setBids] = useState([]);
  const [openProjects, setOpenProjects] = useState([]);
  const [cities, setCities] = useState([]);
  const [states, setStates] = useState([]);
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('ALL');
  const [cityFilter, setCityFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bidDialog, setBidDialog] = useState(false);
  const [bidForm, setBidForm] = useState({ projectId: '', bidAmount: '', description: '', estimatedDays: '' });
  const [bidError, setBidError] = useState('');
  const [bidLoading, setBidLoading] = useState(false);

  const loadData = () => {
    setLoading(true);
    setError('');
    Promise.all([
      getMyBids(),
      getOpenProjects(),
      getOptions.cities().catch(() => ({ data: [] })),
      getOptions.states().catch(() => ({ data: [] })),
    ])
      .then(([bidsRes, projRes, citiesRes, statesRes]) => {
        setBids(Array.isArray(bidsRes.data) ? bidsRes.data : []);
        setOpenProjects(Array.isArray(projRes.data) ? projRes.data : []);
        setCities(Array.isArray(citiesRes.data) ? citiesRes.data : []);
        setStates(Array.isArray(statesRes.data) ? statesRes.data : []);
      })
      .catch((err) => setError(err.response?.data?.error || err.message || 'Failed to load contractor workspace.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

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

  const filteredOpenProjects = useMemo(() => {
    const safeOpen = Array.isArray(openProjects) ? openProjects : [];
    const q = search.trim().toLowerCase();
    const stateNorm = String(stateFilter || 'ALL').toLowerCase();
    const cityNorm = String(cityFilter || 'ALL').toUpperCase();
    return safeOpen.filter((p) => {
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
  }, [openProjects, search, stateFilter, cityFilter]);

  const stats = useMemo(() => {
    const safeBids = Array.isArray(bids) ? bids : [];
    const safeOpen = Array.isArray(openProjects) ? openProjects : [];
    const total = safeBids.reduce((sum, b) => sum + Number(b.bidAmount || 0), 0);
    const avg = safeBids.length ? Math.round(total / safeBids.length) : 0;
    return { count: safeBids.length, total, avg, openCount: safeOpen.length };
  }, [bids, openProjects]);

  const openBidForProject = (project) => {
    setBidError('');
    setBidForm({
      projectId: String(project.id),
      bidAmount: project.totalEstimatedCost ? String(project.totalEstimatedCost) : '',
      description: '',
      estimatedDays: '180',
    });
    setBidDialog(true);
  };

  const handleBidSubmit = async () => {
    setBidError('');
    setBidLoading(true);
    try {
      await submitBid({
        projectId: parseInt(bidForm.projectId, 10),
        bidAmount: parseInt(bidForm.bidAmount, 10),
        description: bidForm.description,
        estimatedDays: parseInt(bidForm.estimatedDays, 10),
      });
      setBidDialog(false);
      setBidForm({ projectId: '', bidAmount: '', description: '', estimatedDays: '' });
      loadData();
      setTab(1);
    } catch (err) {
      setBidError(err.response?.data?.error || 'Failed to submit bid.');
    } finally {
      setBidLoading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ mb: 0.5 }}>
            Contractor Bidding Console
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {user?.companyName || user?.name} · {[user?.locality, user?.city, user?.state].filter(Boolean).join(', ') || 'India'}
            {user?.pincode ? ` · ${user.pincode}` : ''}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddCircleOutlineIcon />}
          onClick={() => {
            setBidError('');
            setBidForm({ projectId: '', bidAmount: '', description: '', estimatedDays: '' });
            setBidDialog(true);
          }}
        >
          Submit Bid
        </Button>
      </Box>

      {/* KPI Strip */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Open Homeowner Projects', value: String(stats.openCount) },
          { label: 'Submitted Bids', value: String(stats.count) },
          { label: 'Total Bid Value', value: formatINR(stats.total) },
          { label: 'Average Quote', value: stats.count ? formatINR(stats.avg) : '—' },
        ].map((stat) => (
          <Grid item xs={12} sm={6} lg={3} key={stat.label}>
            <Card>
              <CardContent sx={{ py: 2.25, px: 2.5 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={0.5}>
                  {stat.label}
                </Typography>
                <Typography variant="h5" fontWeight={700} className="tabular-nums" sx={{ color: '#0f172a' }}>
                  {stat.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ borderBottom: '1px solid #e2e8f0', mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label={`Open Projects (${filteredOpenProjects.length})`} />
          <Tab label={`My Bids (${bids.length})`} />
        </Tabs>
      </Box>

      {tab === 0 && (
        <Grid container spacing={2} sx={{ mb: 3 }} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              size="small"
              fullWidth
              placeholder="Search project, locality, pincode..."
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
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
          <CircularProgress size={32} />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : tab === 0 ? (
        filteredOpenProjects.length === 0 ? (
          <Card sx={{ textAlign: 'center', py: 7, px: 3 }}>
            <Typography variant="h6" fontWeight={700} mb={0.5}>
              No matching open projects
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Homeowner estimates matching your filters will appear here automatically.
            </Typography>
            {(search || stateFilter !== 'ALL' || cityFilter !== 'ALL') && (
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
            )}
          </Card>
        ) : (
          <Grid container spacing={2.5}>
            {filteredOpenProjects.map((p) => {
              const cityState = [p.cityName || p.city, p.state].filter(Boolean).join(', ');
              const loc = [p.locality, cityState].filter(Boolean).join(' · ');
              return (
                <Grid item xs={12} sm={6} key={p.id}>
                  <Card>
                    <CardContent sx={{ p: 2.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 0.5 }}>
                        <Typography variant="h6" fontWeight={700} noWrap>
                          {p.projectName || `Project #${p.id}`}
                        </Typography>
                        <Typography variant="h6" fontWeight={700} className="tabular-nums" sx={{ color: '#1d4ed8' }}>
                          {formatINR(p.totalEstimatedCost)}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary" display="block" mb={2} className="tabular-nums">
                        Project #{p.id} · {loc}
                        {p.pincode ? ` (${p.pincode})` : ''} · {p.plotAreaSqFt} sq ft · {p.numberOfFloors} Floors · {p.numberOfRooms} Rooms
                      </Typography>
                      <Divider sx={{ mb: 2, borderColor: '#f1f5f9' }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" color="text.secondary">
                          Owner: {p.ownerName || 'Homeowner'}
                        </Typography>
                        <Button size="small" variant="contained" onClick={() => openBidForProject(p)}>
                          Place Bid
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )
      ) : bids.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 7, px: 3 }}>
          <Typography variant="h6" fontWeight={700} mb={0.5}>
            No bids submitted yet
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Browse the Open Projects tab or submit a bid directly by Project ID.
          </Typography>
          <Button variant="contained" startIcon={<AddCircleOutlineIcon />} onClick={() => setTab(0)}>
            Browse Open Projects
          </Button>
        </Card>
      ) : (
        <Grid container spacing={2.5}>
          {bids.map((bid) => {
            const projLoc = [bid.projectLocality, bid.projectCity, bid.projectState]
              .filter(Boolean)
              .join(', ');
            const contractorLoc = [bid.contractorLocality, bid.contractorCity, bid.contractorState]
              .filter(Boolean)
              .join(', ');
            return (
              <Grid item xs={12} sm={6} key={bid.id}>
                <Card>
                  <CardContent sx={{ p: 2.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 0.75 }}>
                      <Typography fontWeight={700}>
                        {bid.projectName || `Project #${bid.projectId}`}
                      </Typography>
                      <Typography variant="h6" fontWeight={700} className="tabular-nums" sx={{ color: '#1d4ed8' }}>
                        {formatINR(bid.bidAmount)}
                      </Typography>
                    </Box>
                    {projLoc && (
                      <Typography variant="caption" color="text.secondary" display="block" mb={1} className="tabular-nums">
                        Site: {projLoc}{bid.projectPincode ? ` · ${bid.projectPincode}` : ''}
                      </Typography>
                    )}
                    <Typography variant="body2" color="text.secondary" mb={1.5}>
                      {bid.description}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" className="tabular-nums">
                      Project #{bid.projectId} · {bid.estimatedDays} days
                      {contractorLoc ? ` · From ${contractorLoc}` : ''}
                      {bid.contractorPincode ? ` (${bid.contractorPincode})` : ''} · Submitted{' '}
                      {new Date(bid.createdAt).toLocaleDateString('en-IN')}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      <Dialog open={bidDialog} onClose={() => setBidDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>Submit Contractor Bid</DialogTitle>
        <DialogContent>
          {bidError && <Alert severity="error" sx={{ mb: 2 }}>{bidError}</Alert>}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Project ID"
              type="number"
              value={bidForm.projectId}
              onChange={(e) => setBidForm({ ...bidForm, projectId: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Bid Amount (₹)"
              type="number"
              value={bidForm.bidAmount}
              onChange={(e) => setBidForm({ ...bidForm, bidAmount: e.target.value })}
              fullWidth
              required
              inputProps={{ min: 10000 }}
            />
            <TextField
              label="Scope of Work & Inclusions"
              multiline
              rows={3}
              value={bidForm.description}
              onChange={(e) => setBidForm({ ...bidForm, description: e.target.value })}
              fullWidth
              required
              helperText="Minimum 20 characters detailing materials and milestones"
            />
            <TextField
              label="Estimated Completion (Days)"
              type="number"
              value={bidForm.estimatedDays}
              onChange={(e) => setBidForm({ ...bidForm, estimatedDays: e.target.value })}
              fullWidth
              required
              inputProps={{ min: 1, max: 3650 }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setBidDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleBidSubmit}
            disabled={bidLoading || !bidForm.projectId || !bidForm.bidAmount || !bidForm.description || !bidForm.estimatedDays}
          >
            {bidLoading ? <CircularProgress size={18} color="inherit" /> : 'Submit Bid'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
