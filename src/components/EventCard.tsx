import { useState, useCallback } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Chip,
  Box,
  Collapse,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Skeleton,
  Avatar,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { Link } from 'react-router-dom';
import { Event } from '../models/Event';
import { EVENT_TYPE_LABELS, Visibility } from '../models/enums';
import { getAttendeeUserIds } from '../services/attendanceService';
import { getProfilesByIds } from '../services/profileService';
import { buildImageUrl } from '../lib/cloudinary';
import { useResolvedLocation } from '../hooks/useResolvedLocation';
import type { Profile } from '../models/Profile';

interface EventCardProps {
  event: Event;
  attendanceCount?: number;
  /** If provided, attendee list is shown when event is public or user is creator. */
  currentUserId?: string | null;
  /** Creator profile for "who published" header. */
  creatorProfile?: Profile | null;
}

export function EventCard({ event, attendanceCount = 0, currentUserId, creatorProfile }: EventCardProps) {
  const typeLabel = EVENT_TYPE_LABELS[event.eventType] ?? event.eventType;
  const [expanded, setExpanded] = useState(false);
  const [attendees, setAttendees] = useState<Profile[] | null>(null);
  const [attendeesLoading, setAttendeesLoading] = useState(false);

  const canShowAttendees =
    (event.visibility === Visibility.Public || event.userId === currentUserId) &&
    (attendanceCount ?? 0) > 0;

  const loadAttendees = useCallback(async () => {
    setAttendeesLoading(true);
    try {
      const ids = await getAttendeeUserIds(event.id);
      const profiles = ids.length > 0 ? await getProfilesByIds(ids) : [];
      setAttendees(profiles);
    } catch {
      setAttendees([]);
    } finally {
      setAttendeesLoading(false);
    }
  }, [event.id]);

  const handleToggleAttendees = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!canShowAttendees) return;
    if (!expanded && attendees === null) loadAttendees();
    setExpanded((prev) => !prev);
  };

  const locationLabel = useResolvedLocation(event.latitude, event.longitude, event.address);
  const creatorName = creatorProfile?.display_name ?? 'User';
  const coverPublicId = event.coverCloudinaryPublicId;
  // TODO: improve – optimize list cover (e.g. fixed width for layout, fallback if original fails to load)
  const coverSrc = coverPublicId ? buildImageUrl(coverPublicId) : '';

  return (
    <Card
      variant="outlined"
      sx={{
        overflow: 'hidden',
        borderRadius: 2,
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      }}
    >
      <CardContent sx={{ pb: 0, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <Avatar
            component={Link}
            to={`/profile/${event.userId}`}
            src={creatorProfile?.avatar_url ?? undefined}
            sx={{ width: 40, height: 40, textDecoration: 'none' }}
          >
            {(creatorName ?? event.userId)?.[0]?.toUpperCase() ?? '?'}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              component={Link}
              to={`/profile/${event.userId}`}
              variant="subtitle2"
              fontWeight={600}
              sx={{ display: 'block', color: 'inherit', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
            >
              {creatorName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Event
            </Typography>
          </Box>
        </Box>

        <Typography
          variant="h6"
          component={Link}
          to={`/event/${event.id}`}
          gutterBottom
          sx={{
            display: 'block',
            color: 'inherit',
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '1.15rem',
            '&:hover': { textDecoration: 'underline' },
          }}
        >
          {event.name}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {event.getDisplayDate()} · {typeLabel}
        </Typography>
      </CardContent>
      {coverSrc && (
        <Box
          component={Link}
          to={`/event/${event.id}`}
          sx={{ display: 'block', textDecoration: 'none', color: 'inherit' }}
        >
          <Box
            component="img"
            src={coverSrc}
            alt=""
            loading="lazy"
            sx={{ width: '100%', height: 'auto', display: 'block', verticalAlign: 'middle' }}
          />
        </Box>
      )}
      <CardContent sx={{ pt: 1.5, pb: 2 }}>
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
          <Chip size="small" label={locationLabel} variant="outlined" sx={{ maxWidth: '100%' }} />
          {(attendanceCount ?? 0) > 0 && (
            <Chip
              size="small"
              icon={canShowAttendees ? (expanded ? <ExpandLessIcon sx={{ fontSize: 14 }} /> : <ExpandMoreIcon sx={{ fontSize: 14 }} />) : <PeopleIcon sx={{ fontSize: 14 }} />}
              label={`${attendanceCount} going`}
              variant="outlined"
              onClick={canShowAttendees ? handleToggleAttendees : undefined}
              sx={canShowAttendees ? { cursor: 'pointer' } : undefined}
            />
          )}
        </Box>

        <Collapse in={expanded}>
          <Box sx={{ mt: 1.5, pl: 0.5, borderLeft: 1, borderColor: 'divider' }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
              Attendees
            </Typography>
            {attendeesLoading ? (
              <Skeleton variant="rounded" height={40} />
            ) : attendees && attendees.length > 0 ? (
              <List dense disablePadding sx={{ py: 0 }}>
                {attendees.map((p) => (
                  <ListItem key={p.id} component={Link} to={`/profile/${p.id}`} sx={{ px: 0, py: 0.25 }} alignItems="flex-start">
                    <ListItemAvatar sx={{ minWidth: 36 }}>
                      <Avatar src={p.avatar_url ?? undefined} sx={{ width: 28, height: 28 }}>
                        {(p.display_name ?? p.id)?.[0]?.toUpperCase() ?? '?'}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText primary={p.display_name ?? 'User'} primaryTypographyProps={{ variant: 'body2' }} />
                  </ListItem>
                ))}
              </List>
            ) : attendees && attendees.length === 0 ? (
              <Typography variant="body2" color="text.secondary">No attendees.</Typography>
            ) : null}
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
}
