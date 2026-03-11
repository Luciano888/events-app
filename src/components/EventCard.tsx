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
import type { Profile } from '../models/Profile';

interface EventCardProps {
  event: Event;
  attendanceCount?: number;
  /** If provided, attendee list is shown when event is public or user is creator. */
  currentUserId?: string | null;
}

export function EventCard({ event, attendanceCount = 0, currentUserId }: EventCardProps) {
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

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography
          variant="h6"
          component={Link}
          to={`/event/${event.id}`}
          gutterBottom
          sx={{ display: 'block', color: 'inherit', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
        >
          {event.name}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {event.getDisplayDate()} · {typeLabel}
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center', mt: 0.5 }}>
          <Chip size="small" label={`${event.latitude.toFixed(4)}, ${event.longitude.toFixed(4)}`} variant="outlined" />
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
