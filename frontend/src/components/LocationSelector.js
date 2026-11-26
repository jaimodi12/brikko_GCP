import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Autocomplete,
  Box,
  CircularProgress,
  Grid,
  TextField,
  Typography,
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { getOptions } from '../api/project';
import CitySelect from './CitySelect';

export const PINCODE_REGEX = /^[1-9]\d{5}$/;

export default function LocationSelector({
  states = [],
  cities = [],
  state = '',
  city = '',
  pincode = '',
  locality = '',
  cityValueMode = 'code',
  onLocationChange,
  onCityDirectoryUpdate,
  cityHelperText = '',
  required = true,
}) {
  const [localityAreas, setLocalityAreas] = useState([]);
  const [pinLoading, setPinLoading] = useState(false);
  const [pinStatus, setPinStatus] = useState('');
  const [correctionNotice, setCorrectionNotice] = useState('');

  const hydratedPinRef = useRef(pincode || '');
  const userEditedPinRef = useRef(false);
  const lastResolvedRef = useRef({ pincode: '', state: '', cityCode: '', cityLabel: '' });

  const latestStateRef = useRef(state || '');
  const latestCityRef = useRef(city || '');
  const latestLocalityRef = useRef(locality || '');
  const latestModeRef = useRef(cityValueMode);
  const onLocationChangeRef = useRef(onLocationChange);
  const onCityDirectoryUpdateRef = useRef(onCityDirectoryUpdate);

  latestStateRef.current = state || '';
  latestCityRef.current = city || '';
  latestLocalityRef.current = locality || '';
  latestModeRef.current = cityValueMode;
  onLocationChangeRef.current = onLocationChange;
  onCityDirectoryUpdateRef.current = onCityDirectoryUpdate;

  const stateNames = useMemo(
    () => (Array.isArray(states) ? states.map((s) => s.label || s.value).filter(Boolean) : []),
    [states]
  );

  const stateValue = useMemo(() => {
    const clean = String(state || '').trim().toLowerCase();
    if (!clean) return null;
    return stateNames.find((s) => s.toLowerCase() === clean) || null;
  }, [stateNames, state]);

  const citiesInState = useMemo(() => {
    const safeCities = Array.isArray(cities) ? cities : [];
    if (!state) return [];
    return safeCities.filter(
      (c) => String(c.state || '').toLowerCase() === String(state).toLowerCase()
    );
  }, [cities, state]);

  useEffect(() => {
    const cleanPin = String(pincode || '').trim();
    if (!PINCODE_REGEX.test(cleanPin)) {
      setLocalityAreas([]);
      setPinStatus('');
      setPinLoading(false);
      if (!cleanPin) {
        setCorrectionNotice('');
      }
      return;
    }

    let cancelled = false;
    setPinLoading(true);
    setPinStatus('Looking up area...');

    getOptions
      .lookupPincode(cleanPin)
      .then((res) => {
        if (cancelled) return;
        const data = res.data || {};
        const areas = Array.isArray(data.areas) ? data.areas : [];
        const primary = data.primaryLocality || areas[0] || '';
        const resolvedState = String(data.resolvedState || data.state || '').trim();
        const resolvedCity = data.resolvedCity || null;

        setLocalityAreas(areas);

        if (areas.length > 1) {
          setPinStatus(`${areas.length} areas found for ${cleanPin}`);
        } else if (areas.length === 1) {
          setPinStatus(`Area resolved for ${cleanPin}`);
        } else {
          setPinStatus('Area not listed · enter locality manually');
        }

        if (resolvedCity) {
          onCityDirectoryUpdateRef.current?.(resolvedCity, resolvedState);
        }

        lastResolvedRef.current = {
          pincode: cleanPin,
          state: resolvedState,
          cityCode: String(resolvedCity?.value || ''),
          cityLabel: String(resolvedCity?.label || ''),
        };

        const curStateLower = String(latestStateRef.current || '').trim().toLowerCase();
        const curCityLower = String(latestCityRef.current || '').trim().toLowerCase();

        const stateMismatch =
          Boolean(resolvedState) && curStateLower !== resolvedState.toLowerCase();
        const cityMismatch =
          Boolean(resolvedCity) &&
          curCityLower !== String(resolvedCity.value || '').toLowerCase() &&
          curCityLower !== String(resolvedCity.label || '').toLowerCase();

        const patch = {};
        if (resolvedState && stateMismatch) {
          patch.state = resolvedState;
        }
        if (resolvedCity && (cityMismatch || stateMismatch)) {
          patch.city =
            latestModeRef.current === 'name' ? resolvedCity.label : resolvedCity.value;
        }

        const shouldAutoFillLocality =
          userEditedPinRef.current ||
          cleanPin !== hydratedPinRef.current ||
          stateMismatch ||
          cityMismatch ||
          !String(latestLocalityRef.current || '').trim();

        if (shouldAutoFillLocality && primary) {
          patch.locality = primary;
        }

        if (Object.keys(patch).length > 0) {
          onLocationChangeRef.current?.(patch);
        }

        if ((stateMismatch || cityMismatch) && (resolvedCity || resolvedState)) {
          const changedLabel =
            stateMismatch && cityMismatch
              ? 'State & City'
              : stateMismatch
              ? 'State'
              : 'City';
          const cityText = resolvedCity?.label || data.district || '';
          const locText = [cityText, resolvedState].filter(Boolean).join(', ');
          const tierNote = data.cityAutoRegistered ? ' (added as Tier 3 city)' : '';
          setCorrectionNotice(
            `Updated ${changedLabel} to ${locText} to match pincode ${cleanPin}${tierNote}.`
          );
        } else {
          setCorrectionNotice('');
        }

        hydratedPinRef.current = cleanPin;
        userEditedPinRef.current = false;
      })
      .catch(() => {
        if (cancelled) return;
        setLocalityAreas([]);
        setPinStatus('Lookup unavailable · enter locality manually');
      })
      .finally(() => {
        if (!cancelled) setPinLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [pincode]);

  const cleanPin = String(pincode || '').trim();
  const pincodeValid = PINCODE_REGEX.test(cleanPin);
  const showPincodeError = cleanPin.length > 0 && !pincodeValid;

  return (
    <Box>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Autocomplete
            options={stateNames}
            value={stateValue}
            disableClearable={Boolean(stateValue)}
            isOptionEqualToValue={(option, val) =>
              String(option || '').toLowerCase() === String(val || '').toLowerCase()
            }
            autoHighlight
            openOnFocus
            onChange={(_e, nextState) => {
              const pickedState = nextState || '';
              const nextCities = (Array.isArray(cities) ? cities : []).filter(
                (c) => String(c.state || '').toLowerCase() === pickedState.toLowerCase()
              );
              const autoCity =
                nextCities.length === 1
                  ? cityValueMode === 'name'
                    ? nextCities[0].label
                    : nextCities[0].value
                  : '';

              const patch = {
                state: pickedState,
                city: autoCity,
              };

              if (
                lastResolvedRef.current.pincode === cleanPin &&
                lastResolvedRef.current.state &&
                lastResolvedRef.current.state.toLowerCase() !== pickedState.toLowerCase()
              ) {
                patch.pincode = '';
                patch.locality = '';
                setCorrectionNotice('');
              }

              onLocationChange?.(patch);
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="State / Union Territory"
                required={required}
                placeholder="Select state first..."
                helperText="Auto-updates if pincode is in another state"
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <CitySelect
            label="City"
            cities={citiesInState}
            value={city}
            valueMode={cityValueMode}
            required={required}
            disabled={!state}
            placeholder={state ? `Search city in ${state}...` : 'Select a state first...'}
            helperText={
              cityHelperText ||
              (state
                ? `${citiesInState.length} ${citiesInState.length === 1 ? 'city' : 'cities'} in ${state}`
                : 'Choose a state to unlock cities')
            }
            onChange={(nextCity) => {
              const patch = { city: nextCity };
              const nextLower = String(nextCity || '').trim().toLowerCase();
              if (
                lastResolvedRef.current.pincode === cleanPin &&
                lastResolvedRef.current.cityCode &&
                nextLower !== lastResolvedRef.current.cityCode.toLowerCase() &&
                nextLower !== lastResolvedRef.current.cityLabel.toLowerCase()
              ) {
                patch.pincode = '';
                patch.locality = '';
                setCorrectionNotice('');
              }
              onLocationChange?.(patch);
            }}
          />
        </Grid>

        <Grid item xs={12} sm={5}>
          <TextField
            label="Pincode"
            value={pincode}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, '').slice(0, 6);
              userEditedPinRef.current = true;
              onLocationChange?.({ pincode: digits });
            }}
            fullWidth
            required={required}
            placeholder="411038"
            error={showPincodeError}
            helperText={
              showPincodeError
                ? 'Enter a valid 6-digit Indian pincode'
                : 'Enter 6-digit pincode to sync city, state & locality'
            }
            inputProps={{ maxLength: 6, inputMode: 'numeric' }}
          />
        </Grid>

        <Grid item xs={12} sm={7}>
          <Autocomplete
            freeSolo
            options={localityAreas}
            value={locality ? locality : null}
            inputValue={locality || ''}
            loading={pinLoading}
            getOptionLabel={(option) => (typeof option === 'string' ? option : '')}
            isOptionEqualToValue={(option, val) => String(option) === String(val)}
            onChange={(_e, newValue) => {
              onLocationChange?.({ locality: typeof newValue === 'string' ? newValue : '' });
            }}
            onInputChange={(_e, newInputValue, reason) => {
              if (reason === 'input' || reason === 'clear') {
                onLocationChange?.({ locality: newInputValue || '' });
              }
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Locality / Area"
                required={required}
                placeholder={
                  pincodeValid ? 'Select or enter locality...' : 'Auto-fills after 6-digit pincode'
                }
                helperText={pinStatus || 'Auto-filled from pincode area directory'}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {pinLoading ? (
                        <CircularProgress color="inherit" size={16} sx={{ mr: 1 }} />
                      ) : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />
        </Grid>
      </Grid>

      {correctionNotice && (
        <Box
          sx={{
            mt: 1.5,
            px: 1.5,
            py: 1,
            bgcolor: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: 1.5,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <InfoOutlinedIcon sx={{ fontSize: 18, color: '#1d4ed8', flexShrink: 0 }} />
          <Typography variant="caption" sx={{ color: '#1e3a8a', fontWeight: 500 }}>
            {correctionNotice}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
