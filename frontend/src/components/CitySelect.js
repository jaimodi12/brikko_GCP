import React, { useMemo } from 'react';
import {
  Autocomplete,
  Box,
  TextField,
  Typography,
  InputAdornment,
} from '@mui/material';
import LocationCityIcon from '@mui/icons-material/LocationCity';

const TIER_LABELS = {
  1: 'Tier 1 · Metro (+15%)',
  2: 'Tier 2 · Regional Hub (+5%)',
  3: 'Tier 3 · Developing (Base)',
};

function formatIndexLabel(multiplier) {
  const pct = Math.round((Number(multiplier || 1) - 1) * 100);
  return pct > 0 ? `+${pct}%` : 'Base';
}

export default function CitySelect({
  cities = [],
  value = '',
  onChange,
  valueMode = 'code',
  includeAllOption = false,
  allOptionLabel = 'All Cities',
  label = 'City',
  placeholder = 'Search city or state...',
  required = false,
  size = 'medium',
  helperText = '',
  loading = false,
  disabled = false,
  sx = {},
}) {
  const safeCities = useMemo(() => (Array.isArray(cities) ? cities : []), [cities]);

  const options = useMemo(() => {
    const sorted = [...safeCities].sort((a, b) => {
      const tierDiff = Number(a.tier || 3) - Number(b.tier || 3);
      if (tierDiff !== 0) return tierDiff;
      return String(a.label || '').localeCompare(String(b.label || ''));
    });
    if (includeAllOption) {
      return [{ value: 'ALL', label: allOptionLabel, state: '', tier: 0, costMultiplier: 1 }, ...sorted];
    }
    return sorted;
  }, [safeCities, includeAllOption, allOptionLabel]);

  const selectedOption = useMemo(() => {
    if (includeAllOption && (!value || String(value).toUpperCase() === 'ALL')) {
      return options[0] || null;
    }
    const clean = String(value || '').trim();
    if (!clean) return null;
    return (
      options.find(
        (opt) =>
          String(opt.value).toUpperCase() === clean.toUpperCase() ||
          String(opt.label).toLowerCase() === clean.toLowerCase()
      ) || null
    );
  }, [options, value, includeAllOption]);

  return (
    <Autocomplete
      options={options}
      value={selectedOption}
      loading={loading}
      disabled={disabled}
      disableClearable={includeAllOption || required}
      autoHighlight
      openOnFocus
      size={size}
      sx={sx}
      groupBy={(option) => (option.value === 'ALL' ? '' : TIER_LABELS[option.tier] || `Tier ${option.tier}`)}
      getOptionLabel={(option) => {
        if (!option) return '';
        if (option.value === 'ALL') return option.label;
        return option.label || '';
      }}
      isOptionEqualToValue={(option, val) =>
        String(option?.value).toUpperCase() === String(val?.value).toUpperCase()
      }
      filterOptions={(opts, { inputValue }) => {
        const q = inputValue.trim().toLowerCase();
        if (!q) return opts;
        return opts.filter((opt) => {
          if (opt.value === 'ALL') return opt.label.toLowerCase().includes(q);
          const cityMatch = String(opt.label || '').toLowerCase().includes(q);
          const stateMatch = String(opt.state || '').toLowerCase().includes(q);
          const tierMatch = `tier ${opt.tier}`.includes(q);
          return cityMatch || stateMatch || tierMatch;
        });
      }}
      onChange={(_event, newValue) => {
        if (!newValue) {
          onChange?.(includeAllOption ? 'ALL' : '', null);
          return;
        }
        if (newValue.value === 'ALL') {
          onChange?.('ALL', newValue);
          return;
        }
        const nextVal = valueMode === 'name' ? newValue.label : newValue.value;
        onChange?.(nextVal, newValue);
      }}
      renderGroup={(params) => {
        if (!params.group) {
          return (
            <Box component="li" key={params.key} sx={{ listStyle: 'none' }}>
              <Box component="ul" sx={{ p: 0, m: 0 }}>
                {params.children}
              </Box>
            </Box>
          );
        }
        return (
          <Box component="li" key={params.key} sx={{ listStyle: 'none' }}>
            <Box
              sx={{
                position: 'sticky',
                top: -8,
                zIndex: 1,
                px: 2,
                py: 0.75,
                bgcolor: '#f8fafc',
                borderTop: '1px solid #e2e8f0',
                borderBottom: '1px solid #e2e8f0',
              }}
            >
              <Typography
                variant="caption"
                fontWeight={700}
                sx={{ color: '#475569', letterSpacing: '0.02em' }}
              >
                {params.group}
              </Typography>
            </Box>
            <Box component="ul" sx={{ p: 0, m: 0 }}>
              {params.children}
            </Box>
          </Box>
        );
      }}
      renderOption={(props, option) => {
        const { key, ...rest } = props;
        if (option.value === 'ALL') {
          return (
            <Box
              component="li"
              key={key}
              {...rest}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                py: 1,
                px: 2,
              }}
            >
              <Typography variant="body2" fontWeight={600} sx={{ color: '#0f172a' }}>
                {option.label}
              </Typography>
            </Box>
          );
        }
        return (
          <Box
            component="li"
            key={key}
            {...rest}
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 2,
              py: 1,
              px: 2,
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" fontWeight={600} noWrap sx={{ color: '#0f172a' }}>
                {option.label}
              </Typography>
              {option.state && (
                <Typography variant="caption" color="text.secondary" noWrap display="block">
                  {option.state}
                </Typography>
              )}
            </Box>
            <Typography
              variant="caption"
              fontWeight={600}
              className="tabular-nums"
              sx={{ color: option.tier === 1 ? '#1d4ed8' : '#64748b', flexShrink: 0 }}
            >
              {formatIndexLabel(option.costMultiplier)}
            </Typography>
          </Box>
        );
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          required={required}
          helperText={helperText}
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <>
                <InputAdornment position="start" sx={{ pl: 0.5 }}>
                  <LocationCityIcon fontSize="small" sx={{ color: '#64748b' }} />
                </InputAdornment>
                {params.InputProps.startAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );
}
