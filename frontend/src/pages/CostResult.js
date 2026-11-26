import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Divider,
  Button,
  CircularProgress,
  Alert,
  LinearProgress,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import GroupsIcon from '@mui/icons-material/Groups';
import { useParams, useNavigate } from 'react-router-dom';
import { getProjectBreakdown } from '../api/project';

function formatINR(v) {
  return `₹${Number(v || 0).toLocaleString('en-IN')}`;
}

function CostRow({ label, value, total }) {
  const pct = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
  return (
    <Box sx={{ mb: 2.25 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
        <Typography variant="body2" fontWeight={500} sx={{ color: '#0f172a' }}>
          {label}
        </Typography>
        <Typography variant="body2" fontWeight={600} className="tabular-nums" sx={{ color: '#0f172a' }}>
          {formatINR(value)} ({pct}%)
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={pct}
        sx={{
          height: 6,
          borderRadius: 3,
          bgcolor: '#f1f5f9',
          '& .MuiLinearProgress-bar': { bgcolor: '#1d4ed8', borderRadius: 3 },
        }}
      />
    </Box>
  );
}

export default function CostResult() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [breakdown, setBreakdown] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    getProjectBreakdown(projectId)
      .then((res) => setBreakdown(res.data))
      .catch((err) => setError(err.response?.data?.error || 'Failed to load cost breakdown.'))
      .finally(() => setLoading(false));
  }, [projectId]);

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
  if (!breakdown) {
    return <Alert severity="warning">Project cost breakdown is unavailable.</Alert>;
  }

  const totalForPct = breakdown.totalCost || 1;
  const tierPct = Math.round((Number(breakdown.costMultiplier || 1) - 1) * 100);
  const cityState = [breakdown.city, breakdown.state].filter(Boolean).join(', ');
  const locationSummary = [breakdown.locality, cityState].filter(Boolean).join(' · ');

  return (
    <Box>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/')} sx={{ mb: 2 }}>
        Back to Projects
      </Button>

      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ mb: 0.5 }}>
          {breakdown.projectName}
        </Typography>
        <Typography variant="body2" color="text.secondary" className="tabular-nums">
          {locationSummary}
          {breakdown.pincode ? ` · ${breakdown.pincode}` : ''} · Project #{breakdown.projectId} · {breakdown.plotAreaSqFt} sq ft × {breakdown.numberOfFloors} Floors
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  pb: 2.5,
                  mb: 3,
                  borderBottom: '1px solid #e2e8f0',
                }}
              >
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">
                    TOTAL ESTIMATED COST
                  </Typography>
                  <Typography variant="h4" fontWeight={800} className="tabular-nums" sx={{ color: '#1d4ed8' }}>
                    {formatINR(breakdown.totalCost)}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" className="tabular-nums">
                  {breakdown.plotAreaSqFt * breakdown.numberOfFloors > 0
                    ? `${formatINR(Math.round(breakdown.totalCost / (breakdown.plotAreaSqFt * breakdown.numberOfFloors)))} / sq ft`
                    : '—'}
                </Typography>
              </Box>

              <CostRow label="Structure (Cement & Labour)" value={breakdown.structureCost} total={totalForPct} />
              {breakdown.brickWork && (
                <CostRow label="Brick Masonry Work" value={breakdown.brickWorkCost} total={totalForPct} />
              )}
              <CostRow label="Roof Finishing" value={breakdown.roofCost} total={totalForPct} />
              <CostRow label="Paint & Wall Finishes" value={breakdown.paintCost} total={totalForPct} />
              <CostRow label="Windows & Framing" value={breakdown.windowCost} total={totalForPct} />
              {breakdown.cityPremium > 0 && (
                <CostRow
                  label={`${breakdown.city} Tier ${breakdown.cityTier || 1} Index (+${tierPct}%)`}
                  value={breakdown.cityPremium}
                  total={totalForPct}
                />
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          <Card sx={{ mb: 2.5 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} mb={2}>
                Project Specifications
              </Typography>
              {[
                ...(breakdown.state ? [['State', breakdown.state]] : []),
                ['City', `${breakdown.city}${breakdown.cityTier ? ` (Tier ${breakdown.cityTier})` : ''}`],
                ...(breakdown.pincode ? [['Pincode', breakdown.pincode]] : []),
                ...(breakdown.locality ? [['Locality', breakdown.locality]] : []),
                ['Plot Area', `${breakdown.plotAreaSqFt} sq ft`],
                ['Floors', `G+${breakdown.numberOfFloors - 1} (${breakdown.numberOfFloors} total)`],
                ['Roof Area', `${breakdown.roofAreaSqFt} sq ft`],
                ['Rooms', breakdown.numberOfRooms],
                ['Cement Grade', breakdown.cementType],
                ['Brick Work', breakdown.brickWork ? 'Included' : 'Excluded'],
                ['Paint', breakdown.paintType],
                ['Windows', `${breakdown.numberOfWindows} × ${breakdown.windowType}`],
              ].map(([label, value], i, arr) => (
                <React.Fragment key={label}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                    <Typography variant="body2" color="text.secondary">{label}</Typography>
                    <Typography variant="body2" fontWeight={600} className="tabular-nums">{value}</Typography>
                  </Box>
                  {i < arr.length - 1 && <Divider sx={{ borderColor: '#f1f5f9' }} />}
                </React.Fragment>
              ))}
            </CardContent>
          </Card>

          <Button
            variant="contained"
            size="large"
            fullWidth
            startIcon={<GroupsIcon />}
            onClick={() => navigate(`/contractors/${projectId}`)}
            sx={{ py: 1.4 }}
          >
            Find Available Contractors
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
}
