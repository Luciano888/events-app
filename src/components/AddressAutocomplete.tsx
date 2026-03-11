import { useState, useEffect, useRef, useCallback } from 'react';
import { TextField, Popper, Paper, List, ListItemButton, ListItemText, CircularProgress, InputAdornment } from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { fetchPhotonSuggestions, type PhotonResult } from '../services/photonService';

const DEBOUNCE_MS = 400;

export interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (lat: number, lon: number, displayName: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
}

export function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  label = 'Address',
  placeholder = 'Start typing an address...',
  disabled = false,
}: AddressAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<PhotonResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    try {
      const results = await fetchPhotonSuggestions(query, 6);
      setSuggestions(results);
      setOpen(results.length > 0);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (inputValue.trim().length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(() => fetchSuggestions(inputValue), DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [inputValue, fetchSuggestions]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    onChange(e.target.value);
  };

  const handleSelect = (item: PhotonResult) => {
    setInputValue(item.displayName);
    onChange(item.displayName);
    onSelect(item.lat, item.lon, item.displayName);
    setOpen(false);
    setSuggestions([]);
  };

  const handleBlur = () => {
    setTimeout(() => setOpen(false), 200);
  };

  return (
    <div ref={anchorRef}>
      <TextField
        fullWidth
        label={label}
        placeholder={placeholder}
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => setOpen(suggestions.length > 0)}
        onBlur={handleBlur}
        disabled={disabled}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <LocationOnIcon color="action" />
            </InputAdornment>
          ),
          endAdornment: loading ? <CircularProgress size={20} /> : null,
        }}
      />
      <Popper open={open && suggestions.length > 0} anchorEl={anchorRef.current} placement="bottom-start" style={{ zIndex: 1300, width: anchorRef.current?.offsetWidth ?? undefined }}>
        <Paper elevation={8} sx={{ maxHeight: 320, overflow: 'auto' }}>
          <List dense>
            {suggestions.map((item, idx) => (
              <ListItemButton key={idx} onMouseDown={() => handleSelect(item)}>
                <ListItemText primary={item.displayName} secondary={`${item.lat.toFixed(4)}, ${item.lon.toFixed(4)}`} />
              </ListItemButton>
            ))}
          </List>
        </Paper>
      </Popper>
    </div>
  );
}
