import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Skeleton,
  Alert,
  Button,
  Stack,
} from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import ImageIcon from '@mui/icons-material/Image';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { useEventChatThreads } from '../hooks/useEventChatThreads';
import { getProfilesByIds } from '../services/profileService';
import { useState, useEffect } from 'react';
import type { Profile } from '../models/Profile';
import { isSupabaseConfigured } from '../lib/supabase';

function previewBody(
  t: (k: string) => string,
  body: string,
  hasImage: boolean
): string {
  const trimmed = body?.trim() ?? '';
  if (trimmed) return trimmed.length > 80 ? `${trimmed.slice(0, 80)}…` : trimmed;
  if (hasImage) return t('messages.previewPhoto');
  return t('messages.noPreview');
}

export function MessagesPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { threads, loading, error, refetch } = useEventChatThreads(user?.id ?? null);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});

  const authorIds = useMemo(() => {
    const ids = new Set<string>();
    threads.forEach((th) => {
      if (th.lastMessage?.user_id) ids.add(th.lastMessage.user_id);
    });
    return Array.from(ids);
  }, [threads]);

  useEffect(() => {
    if (authorIds.length === 0) {
      setProfiles({});
      return;
    }
    getProfilesByIds(authorIds)
      .then((list) => {
        const map: Record<string, Profile> = {};
        list.forEach((p) => {
          map[p.id] = p;
        });
        setProfiles(map);
      })
      .catch(() => setProfiles({}));
  }, [authorIds.join(',')]);

  if (!isSupabaseConfigured) {
    return (
      <Box>
        <Typography variant="h5" gutterBottom>{t('messages.title')}</Typography>
        <Typography color="text.secondary">{t('events.configureSupabase')}</Typography>
      </Box>
    );
  }

  if (!user) {
    return (
      <Box>
        <Typography variant="h5" gutterBottom>{t('messages.title')}</Typography>
        <Alert severity="info" sx={{ mb: 2 }}>{t('messages.loginRequired')}</Alert>
        <Button component={Link} to="/login" state={{ from: { pathname: '/messages', search: '' } }} variant="contained">
          {t('nav.login')}
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        {t('messages.title')}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t('messages.subtitle')}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} action={<Button onClick={() => refetch()}>{t('events.retry')}</Button>}>
          {error}
        </Alert>
      )}

      {loading ? (
        <StackSkeleton />
      ) : threads.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <ChatIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography color="text.secondary" gutterBottom>{t('messages.empty')}</Typography>
          <Typography variant="body2" color="text.secondary">{t('messages.emptyHint')}</Typography>
        </Box>
      ) : (
        <List disablePadding sx={{ bgcolor: 'background.paper', borderRadius: 2, border: 1, borderColor: 'divider' }}>
          {threads.map(({ event, lastMessage }) => {
            const author = lastMessage ? profiles[lastMessage.user_id] : null;
            const secondary = lastMessage
              ? previewBody(t, lastMessage.body, !!lastMessage.image_cloudinary_public_id)
              : t('messages.noMessagesYet');
            const time =
              lastMessage?.created_at
                ? new Date(lastMessage.created_at).toLocaleString(i18n.language, {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  })
                : '';
            return (
              <ListItemButton
                key={event.id}
                component={Link}
                to={`/event/${event.id}?chat=1`}
                alignItems="flex-start"
                sx={{ py: 1.5, borderBottom: 1, borderColor: 'divider', '&:last-of-type': { borderBottom: 0 } }}
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <ChatIcon sx={{ color: 'primary.contrastText' }} />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={event.name}
                  primaryTypographyProps={{ fontWeight: 600, noWrap: true }}
                  secondary={
                    <Box component="span" sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                      <Typography component="span" variant="body2" color="text.secondary" noWrap>
                        {lastMessage?.image_cloudinary_public_id && !lastMessage.body?.trim() ? (
                          <>
                            <ImageIcon sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
                            {secondary}
                          </>
                        ) : (
                          <>
                            {author?.display_name ? `${author.display_name}: ` : ''}
                            {secondary}
                          </>
                        )}
                      </Typography>
                      <Typography component="span" variant="caption" color="text.disabled">
                        {event.getDisplayDate(i18n.language)}
                        {time ? ` · ${time}` : ''}
                      </Typography>
                    </Box>
                  }
                  secondaryTypographyProps={{ component: 'div' }}
                />
              </ListItemButton>
            );
          })}
        </List>
      )}
    </Box>
  );
}

function StackSkeleton() {
  return (
    <Stack spacing={1}>
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} variant="rounded" height={72} />
      ))}
    </Stack>
  );
}
