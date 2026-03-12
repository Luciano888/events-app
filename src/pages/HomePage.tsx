import { useMemo, useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Button,
  Skeleton,
  Stack,
  Paper,
  Tabs,
  Tab,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useAuth } from '../hooks/useAuth';
import { useEvents } from '../hooks/useEvents';
import { useAttendanceCounts } from '../hooks/useAttendanceCounts';
import { EventCard } from '../components/EventCard';
import { getProfilesByIds } from '../services/profileService';
import { isSupabaseConfigured } from '../lib/supabase';
import { EventType, EVENT_TYPE_LABELS } from '../models/enums';
import { useGeolocation } from '../hooks/useGeolocation';
import { distanceKm } from '../utils/distance';
import type { Profile } from '../models/Profile';

type SortOption = 'date_asc' | 'date_desc' | 'distance' | 'type';
type TimeFilter = 'upcoming' | 'past' | 'all';

export function HomePage() {
  const { user } = useAuth();
  const { events, loading, error, refetch } = useEvents();
  const { latitude: userLat, longitude: userLng } = useGeolocation();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<EventType | 'all'>('all');
  const [sort, setSort] = useState<SortOption>('date_asc');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('upcoming');

  const filteredAndSorted = useMemo(() => {
    const now = Date.now();
    let list = [...events];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((e) => e.name.toLowerCase().includes(q));
    }
    if (filterType !== 'all') {
      list = list.filter((e) => e.eventType === filterType);
    }
    if (timeFilter === 'upcoming') {
      list = list.filter((e) => new Date(e.dateTime).getTime() >= now);
    } else if (timeFilter === 'past') {
      list = list.filter((e) => new Date(e.dateTime).getTime() < now);
    }
    if (sort === 'date_asc') list.sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
    else if (sort === 'date_desc') list.sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
    else if (sort === 'type') list.sort((a, b) => a.eventType.localeCompare(b.eventType));
    else if (sort === 'distance' && (userLat !== 0 || userLng !== 0)) {
      list.sort((a, b) => distanceKm(userLat, userLng, a.latitude, a.longitude) - distanceKm(userLat, userLng, b.latitude, b.longitude));
    }
    return list;
  }, [events, search, filterType, sort, timeFilter, userLat, userLng]);

  const eventIds = useMemo(() => filteredAndSorted.map((e) => e.id), [filteredAndSorted]);
  const attendanceCounts = useAttendanceCounts(eventIds);

  const creatorIds = useMemo(() => [...new Set(filteredAndSorted.map((e) => e.userId))], [filteredAndSorted]);
  const [creatorProfiles, setCreatorProfiles] = useState<Record<string, Profile>>({});
  useEffect(() => {
    if (creatorIds.length === 0) {
      setCreatorProfiles({});
      return;
    }
    getProfilesByIds(creatorIds)
      .then((list) => {
        const map: Record<string, Profile> = {};
        list.forEach((p) => { map[p.id] = p; });
        setCreatorProfiles(map);
      })
      .catch(() => setCreatorProfiles({}));
  }, [creatorIds.join(',')]);

  if (!isSupabaseConfigured) {
    return (
      <Box sx={{ maxWidth: 720, mx: 'auto', px: 2 }}>
        <Typography variant="h5" gutterBottom>Events</Typography>
        <Typography color="text.secondary">Configure Supabase in <code>.env</code> (see the banner above) to load and create events.</Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ maxWidth: 720, mx: 'auto', px: 2 }}>
        <Typography variant="h5" gutterBottom>Events</Typography>
        <Stack spacing={2}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rounded" height={180} />
          ))}
        </Stack>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ maxWidth: 720, mx: 'auto', px: 2 }}>
        <Typography variant="h5" gutterBottom>Events</Typography>
        <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => refetch?.()}>Retry</Button>}>
          {error}
        </Alert>
      </Box>
    );
  }

  const emptyMessage =
    timeFilter === 'upcoming'
      ? 'No upcoming events.'
      : timeFilter === 'past'
        ? 'No past events.'
        : 'No events match your filters.';

  return (
    <Box>
      <Typography variant="h5" fontWeight={600} gutterBottom>Events</Typography>

      <Tabs value={timeFilter} onChange={(_, v) => setTimeFilter(v as TimeFilter)} sx={{ mb: 2 }}>
        <Tab label="Upcoming" value="upcoming" />
        <Tab label="Past" value="past" />
        <Tab label="All" value="all" />
      </Tabs>

      <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <TextField
            size="small"
            placeholder="Search by name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
            sx={{ minWidth: 200 }}
          />
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Type</InputLabel>
            <Select value={filterType} label="Type" onChange={(e) => setFilterType(e.target.value as EventType | 'all')}>
              <MenuItem value="all">All types</MenuItem>
              {(Object.keys(EVENT_TYPE_LABELS) as EventType[]).map((t) => (
                <MenuItem key={t} value={t}>{EVENT_TYPE_LABELS[t]}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Sort by</InputLabel>
            <Select value={sort} label="Sort by" onChange={(e) => setSort(e.target.value as SortOption)}>
              <MenuItem value="date_asc">Date (earliest)</MenuItem>
              <MenuItem value="date_desc">Date (latest)</MenuItem>
              <MenuItem value="distance">Distance</MenuItem>
              <MenuItem value="type">Type</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {filteredAndSorted.length === 0 ? (
        <Typography color="text.secondary" textAlign="center" py={4}>{emptyMessage}</Typography>
      ) : (
        <Stack spacing={2}>
          {filteredAndSorted.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              attendanceCount={attendanceCounts[event.id]}
              currentUserId={user?.id ?? null}
              creatorProfile={creatorProfiles[event.userId]}
            />
          ))}
        </Stack>
      )}
    </Box>
  );
}
