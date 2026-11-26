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
  Avatar,
  Rating,
  Divider,
  TextField,
  InputAdornment,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VerifiedIcon from '@mui/icons-material/Verified';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import SearchIcon from '@mui/icons-material/Search';
import { useParams, useNavigate } from 'react-router-dom';
import { matchContractors, getBidsForProject } from '../api/contractor';
import { getProjectBreakdown } from '../api/project';

function formatINR(v) {
  return `₹${Number(v || 0).toLocaleString('en-IN')}`;
}

export default function ContractorsList() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [contractors, setContractors] = useState([]);
  const [bids, setBids] = useState([]);
  const [breakdown, setBreakdown] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    Promise.all([getProjectBreakdown(projectId), getBidsForProject(projectId)])
      .then(([bdRes, bidsRes]) => {
        const bd = bdRes.data;
        setBreakdown(bd);
        setBids(Array.isArray(bidsRes.data) ? bidsRes.data : []);
        return matchContractors(bd.city, bd.totalCost);
      })
      .then((res) => setContractors(Array.isArray(res.data) ? res.data : []))
      .catch((err) => setError(err.response?.data?.error || err.message || 'Failed to load contractors.'))
      .finally(() => setLoading(false));
  }, [projectId]);

  const filteredContractors = useMemo(() => {
    const list = Array.isArray(contractors) ? contractors : [];
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (c) =>
        (c.companyName || '').toLowerCase().includes(q) ||
        (c.specialization || '').toLowerCase().includes(q) ||
        (c.name || '').toLowerCase().includes(q)
    );
  }, [contractors, search]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
        <CircularProgress size={32} />
      </Box>
    );
  }
  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(`/cost-result/${projectId}`)} sx={{ mb: 2 }}>
        Back to Estimate
      </Button>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ mb: 0.5 }}>
            Contractors & Project Bids
          </Typography>
          <Typography variant="body2" color="text.secondary" className="tabular-nums">
            {breakdown?.projectName} · {[breakdown?.locality, breakdown?.city, breakdown?.state].filter(Boolean).join(', ')} · Estimated {formatINR(breakdown?.totalCost)}
          </Typography>
        </Box>
        <TextField
          size="small"
          placeholder="Filter contractors by name or specialty..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: { xs: '100%', sm: 280 }, bgcolor: '#ffffff' }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" color="action" />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {bids.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" fontWeight={700} mb={2}>
            Submitted Bids ({bids.length})
          </Typography>
          <Grid container spacing={2}>
            {bids.map((bid) => (
              <Grid item xs={12} sm={6} key={bid.id}>
                <Card sx={{ borderColor: '#1d4ed8' }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 1 }}>
                      <Typography fontWeight={700}>{bid.companyName}</Typography>
                      <Typography variant="h6" fontWeight={700} className="tabular-nums" sx={{ color: '#1d4ed8' }}>
                        {formatINR(bid.bidAmount)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                      <Rating value={bid.contractorRating || 0} readOnly size="small" />
                      <Typography variant="caption" color="text.secondary" className="tabular-nums">
                        {bid.estimatedDays} days · {bid.experienceYears}y exp
                      </Typography>
                    </Box>
                    {(bid.contractorCity || bid.contractorLocality || bid.contractorState) && (
                      <Typography variant="caption" color="text.secondary" display="block" mb={1} className="tabular-nums">
                        {[bid.contractorLocality, bid.contractorCity, bid.contractorState].filter(Boolean).join(', ')}
                        {bid.contractorPincode ? ` · ${bid.contractorPincode}` : ''}
                      </Typography>
                    )}
                    <Typography variant="body2" color="text.secondary">
                      {bid.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          <Divider sx={{ my: 3.5 }} />
        </Box>
      )}

      <Typography variant="h6" fontWeight={700} mb={2}>
        Budget-Matched Contractors ({filteredContractors.length})
      </Typography>

      {filteredContractors.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 7, px: 3 }}>
          <WorkOutlineIcon sx={{ fontSize: 48, color: '#94a3b8', mb: 1.5 }} />
          <Typography variant="h6" fontWeight={700} mb={0.5}>
            No matching contractors found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Contractors registered in {breakdown?.city} whose budget range covers {formatINR(breakdown?.totalCost)} will appear here.
          </Typography>
        </Card>
      ) : (
        <Grid container spacing={2.5}>
          {filteredContractors.map((c) => (
            <Grid item xs={12} sm={6} key={c.id}>
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
                    <Avatar sx={{ bgcolor: '#0f172a', width: 44, height: 44, fontWeight: 700 }}>
                      {c.companyName?.charAt(0)}
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <Typography fontWeight={700} noWrap>{c.companyName}</Typography>
                        {c.isVerified && <VerifiedIcon sx={{ color: '#16a34a', fontSize: 18 }} />}
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {c.name} · {c.experienceYears}y exp · {[c.locality, c.city, c.state].filter(Boolean).join(', ')}
                        {c.pincode ? ` · ${c.pincode}` : ''}
                        {c.specialization ? ` · ${c.specialization}` : ''}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <Rating value={c.rating || 0} readOnly size="small" precision={0.5} />
                    {c.isVerified && (
                      <Typography variant="caption" fontWeight={600} sx={{ color: '#16a34a' }}>
                        Verified
                      </Typography>
                    )}
                  </Box>

                  {c.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {c.description}
                    </Typography>
                  )}

                  <Divider sx={{ my: 1.5, borderColor: '#f1f5f9' }} />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                    <Typography variant="caption" color="text.secondary" className="tabular-nums">
                      Budget: <strong style={{ color: '#0f172a' }}>{formatINR(c.minBudget)} – {formatINR(c.maxBudget)}</strong>
                    </Typography>
                    <Typography variant="caption" color="text.secondary" className="tabular-nums">
                      {c.phone}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
