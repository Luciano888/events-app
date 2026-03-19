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
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { useEvents } from '../hooks/useEvents';
import { useAttendanceCounts } from '../hooks/useAttendanceCounts';
import { EventCard } from '../components/EventCard';
import { getProfilesByIds } from '../services/profileService';
import { isSupabaseConfigured } from '../lib/supabase';
import { EventType, EVENT_TYPE_LABELS } from '../models/enums';
import type { Profile } from '../models/Profile';

type SortOption = 'day' | 'week' | 'month' | 'year';
type TimeFilter = 'upcoming' | 'past' | 'all';

export function HomePage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { events, loading, error, refetch } = useEvents();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<EventType | 'all'>('all');
  const [sort, setSort] = useState<SortOption>('month');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('upcoming');

  const filteredAndSorted = useMemo(() => {
    const now = Date.now();
    const today = new Date();
    const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const endToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999).getTime();
    const endOfWeekWindow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7, 23, 59, 59, 999).getTime();
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
    const endOfYear = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999).getTime();

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

    if (sort === 'day') {
      list = list.filter((e) => {
        const t = new Date(e.dateTime).getTime();
        return t >= startToday && t <= endToday;
      });
      list.sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
    } else if (sort === 'week') {
      list = list.filter((e) => {
        const t = new Date(e.dateTime).getTime();
        return t > endToday && t <= endOfWeekWindow;
      });
      list.sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
    } else if (sort === 'month') {
      list = list.filter((e) => {
        const t = new Date(e.dateTime).getTime();
        return t >= startToday && t <= endOfMonth;
      });
      list.sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
    } else if (sort === 'year') {
      list = list.filter((e) => {
        const t = new Date(e.dateTime).getTime();
        return t >= startToday && t <= endOfYear;
      });
      list.sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
    }

    return list;
  }, [events, search, filterType, sort, timeFilter]);

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
        <Typography variant="h5" gutterBottom>{t('events.title')}</Typography>
        <Typography color="text.secondary">{t('events.configureSupabase')}</Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ maxWidth: 720, mx: 'auto', px: 2 }}>
        <Typography variant="h5" gutterBottom>{t('events.title')}</Typography>
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
        <Typography variant="h5" gutterBottom>{t('events.title')}</Typography>
        <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => refetch?.()}>{t('events.retry')}</Button>}>
          {error}
        </Alert>
      </Box>
    );
  }

  const emptyMessage =
    timeFilter === 'upcoming'
      ? t('events.emptyUpcoming')
      : timeFilter === 'past'
        ? t('events.emptyPast')
        : t('events.emptyFiltered');

  return (
    <Box>
      <Typography variant="h5" fontWeight={600} gutterBottom>{t('events.title')}</Typography>

      <Tabs value={timeFilter} onChange={(_, v) => setTimeFilter(v as TimeFilter)} sx={{ mb: 2 }}>
        <Tab label={t('events.upcoming')} value="upcoming" />
        <Tab label={t('events.past')} value="past" />
        <Tab label={t('events.all')} value="all" />
      </Tabs>

      <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <TextField
            size="small"
            placeholder={t('events.searchByName')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
            sx={{ minWidth: 200 }}
          />
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>{t('events.type')}</InputLabel>
            <Select value={filterType} label={t('events.type')} onChange={(e) => setFilterType(e.target.value as EventType | 'all')}>
              <MenuItem value="all">{t('events.allTypes')}</MenuItem>
              {(Object.keys(EVENT_TYPE_LABELS) as EventType[]).map((eventType) => (
                <MenuItem key={eventType} value={eventType}>{t(`enums.eventType.${eventType}`)}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>{t('events.sortBy')}</InputLabel>
            <Select value={sort} label={t('events.sortBy')} onChange={(e) => setSort(e.target.value as SortOption)}>
              <MenuItem value="day">{t('events.sortDay')}</MenuItem>
              <MenuItem value="week">{t('events.sortWeek')}</MenuItem>
              <MenuItem value="month">{t('events.sortMonth')}</MenuItem>
              <MenuItem value="year">{t('events.sortYear')}</MenuItem>
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
