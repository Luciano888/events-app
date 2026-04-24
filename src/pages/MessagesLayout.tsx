import { useMemo, useEffect, useCallback } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
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
  IconButton,
  Tooltip,
  useMediaQuery,
} from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import ImageIcon from '@mui/icons-material/Image';
import RefreshIcon from '@mui/icons-material/Refresh';
import { alpha } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { useEventChatThreads } from '../hooks/useEventChatThreads';
import { getProfilesByIds } from '../services/profileService';
import { useState } from 'react';
import type { Profile } from '../models/Profile';
import { isSupabaseConfigured } from '../lib/supabase';
import { isEventThreadUnread } from '../utils/messagesInboxReadState';

const THREAD_POLL_MS = 45_000;
/** Active thread id from URL (excludes `/messages` index). */
const MESSAGE_THREAD_PATH = /^\/messages\/([^/]+)\/?$/;

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

export type MessagesOutletContext = {
  refetchThreads: () => void;
  bumpInboxReadVisual?: () => void;
};

/** Desktop placeholder when no thread is selected (`/messages`). */
export function MessagesIndexPanel() {
  const { t } = useTranslation();
  const isMdUp = useMediaQuery((theme) => theme.breakpoints.up('md'));
  if (!isMdUp) return null;
  return (
    <Box
      sx={{
        height: '100%',
        minHeight: 240,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: { md: 4 },
        borderRadius: 2,
        bgcolor: (theme) =>
          theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(25, 118, 210, 0.06)',
      }}
    >
      <Stack alignItems="center" spacing={2} sx={{ maxWidth: 360, textAlign: 'center' }}>
        <ForumOutlinedIcon sx={{ fontSize: 56, color: 'primary.main', opacity: 0.85 }} aria-hidden />
        <Typography variant="h6" component="p" sx={{ fontWeight: 600, color: 'text.primary' }}>
          {t('messages.selectConversation')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('messages.selectConversationHint')}
        </Typography>
      </Stack>
    </Box>
  );
}

export function MessagesLayout() {
  const { t } = useTranslation();
  const isMdUp = useMediaQuery((theme) => theme.breakpoints.up('md'));
  const { pathname } = useLocation();
  const { user } = useAuth();
  const { threads, loading, error, refetch } = useEventChatThreads(user?.id ?? null);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [, setReadEpoch] = useState(0);
  const bumpInboxReadVisual = useCallback(() => {
    setReadEpoch((n) => n + 1);
  }, []);

  const activeEventId = useMemo(() => {
    const m = MESSAGE_THREAD_PATH.exec(pathname);
    return m?.[1] ?? null;
  }, [pathname]);
  const isThreadOpen = Boolean(activeEventId);

  const refetchThreads = useCallback(() => {
    void refetch();
  }, [refetch]);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') void refetch();
    }, THREAD_POLL_MS);
    return () => window.clearInterval(id);
  }, [refetch]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'visible') void refetch();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [refetch]);

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
    <Box
      sx={{
        flex: 1,
        width: '100%',
        minHeight: 0,
        height: '100%',
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        alignItems: 'stretch',
        borderRadius: { xs: 0, md: 2 },
        overflow: 'visible',
        bgcolor: 'background.paper',
        boxShadow: {
          md: (theme) =>
            theme.palette.mode === 'dark' ? '0 2px 12px rgba(0,0,0,0.35)' : '0 2px 12px rgba(0,0,0,0.06)',
        },
      }}
    >
      <Box
        component="aside"
        aria-label={t('messages.chatsListAria')}
        sx={{
          width: { md: 'clamp(272px, 30vw, 380px)' },
          flexShrink: 0,
          flex: { xs: '0 0 auto', md: 'none' },
          // md: grid fixes listWrap height 0 (logs: flex column + flex:1 child stayed clientHeight 0)
          display: { xs: isThreadOpen ? 'none' : 'flex', md: 'grid' },
          flexDirection: { xs: 'column' },
          gridTemplateColumns: { md: 'minmax(0, 1fr)' },
          gridTemplateRows: { md: 'auto minmax(0, 1fr)' },
          height: { md: '100%' },
          minHeight: 0,
          alignSelf: 'stretch',
          minWidth: 0,
          bgcolor: (theme) =>
            theme.palette.mode === 'dark' ? 'grey.900' : '#ffffff',
          borderRight: {
            md: (theme) =>
              theme.palette.mode === 'dark'
                ? `1px solid ${alpha(theme.palette.divider, 0.2)}`
                : '1px solid rgba(0, 0, 0, 1)',
          },
          boxShadow: 'none',
          p: 2,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', flexShrink: 0 }}>
            <Typography variant="h5" fontWeight={700} sx={{ flex: '1 1 auto', minWidth: 0, letterSpacing: -0.02 }}>
              {t('messages.title')}
            </Typography>
            <Tooltip title={t('messages.refreshInbox')}>
              <span>
                <IconButton
                  size="small"
                  onClick={() => void refetch()}
                  disabled={loading}
                  aria-label={t('messages.refreshInbox')}
                  sx={{
                    bgcolor: (theme) => alpha(theme.palette.action.hover, theme.palette.mode === 'dark' ? 0.15 : 0.5),
                  }}
                >
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 1.5, flexShrink: 0 }}>
            {t('messages.subtitle')}
          </Typography>
          <Box
            sx={{
              height: 1,
              mb: 1.5,
              flexShrink: 0,
              borderRadius: 1,
              bgcolor: (theme) => alpha(theme.palette.divider, theme.palette.mode === 'dark' ? 0.2 : 0.12),
            }}
          />

          {error && (
            <Alert severity="error" sx={{ mb: 2, flexShrink: 0 }} action={<Button onClick={() => void refetch()}>{t('events.retry')}</Button>}>
              {error}
            </Alert>
          )}
        </Box>

        <Box
          sx={{
            flex: { xs: '1 1 auto', md: 'none' },
            minHeight: 0,
            minWidth: 0,
            maxHeight: { xs: 'min(72dvh, calc(100dvh - 240px))', md: 'none' },
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            color: 'text.primary',
          }}
        >
          {loading ? (
            <Stack spacing={1} sx={{ flex: '1 0 0%', minHeight: 0, overflow: 'auto' }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} variant="rounded" height={76} />
              ))}
            </Stack>
          ) : threads.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4, px: 1, flex: '1 1 auto', overflow: 'auto' }}>
              <ChatIcon sx={{ fontSize: 44, color: 'primary.main', opacity: 0.5, mb: 1.5 }} />
              <Typography color="text.primary" fontWeight={600} gutterBottom>
                {t('messages.empty')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('messages.emptyHint')}
              </Typography>
            </Box>
          ) : (
            <List
              disablePadding
              aria-label={t('messages.threadListAria')}
              sx={{
                flex: '1 0 0%',
                minHeight: 0,
                overflow: 'auto',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                '&::-webkit-scrollbar': { display: 'none' },
                width: '100%',
                bgcolor: 'background.paper',
                borderRadius: 2,
                border: (theme) =>
                  `1px solid ${alpha(theme.palette.divider, theme.palette.mode === 'dark' ? 0.2 : 0.14)}`,
                boxShadow: (theme) =>
                  theme.palette.mode === 'dark'
                    ? '0 1px 0 rgba(255,255,255,0.06) inset'
                    : '0 1px 3px rgba(0,0,0,0.06)',
              }}
            >
              {threads.map(({ event, lastMessage }) => {
                const author = lastMessage ? profiles[lastMessage.user_id] : null;
                const secondary = lastMessage
                  ? previewBody(t, lastMessage.body, !!lastMessage.image_cloudinary_public_id)
                  : t('messages.noMessagesYet');
                const selected = event.id === activeEventId;
                const unread = user ? isEventThreadUnread(event.id, lastMessage, user.id) : false;
                return (
                  <ListItemButton
                    key={event.id}
                    component={Link}
                    to={`/messages/${event.id}`}
                    selected={selected}
                    alignItems="flex-start"
                    sx={{
                      py: 1.5,
                      px: 1.5,
                      color: 'text.primary',
                      '&:not(:last-of-type)': {
                        borderBottom: (theme) =>
                          `1px solid ${alpha(theme.palette.divider, theme.palette.mode === 'dark' ? 0.12 : 0.08)}`,
                      },
                      '&.Mui-selected': {
                        bgcolor: (theme) =>
                          theme.palette.mode === 'dark'
                            ? 'rgba(25, 118, 210, 0.16)'
                            : 'rgba(25, 118, 210, 0.08)',
                      },
                    }}
                  >
                    <ListItemAvatar sx={{ minWidth: 48 }}>
                      <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.main' }}>
                        <ChatIcon sx={{ color: 'primary.contrastText', fontSize: 20 }} />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
                          <Typography component="span" variant="subtitle2" fontWeight={600} noWrap sx={{ flex: 1, minWidth: 0 }}>
                            {event.name}
                          </Typography>
                          {unread ? (
                            <Box
                              component="span"
                              aria-label={t('messages.unread')}
                              title={t('messages.unread')}
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                bgcolor: 'primary.main',
                                flexShrink: 0,
                                boxShadow: (theme) => `0 0 0 2px ${theme.palette.background.paper}`,
                              }}
                            />
                          ) : null}
                        </Box>
                      }
                      primaryTypographyProps={{ component: 'div' }}
                      secondary={
                        <Typography component="span" variant="body2" color="text.secondary" noWrap sx={{ mt: 0.25 }}>
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
                      }
                      secondaryTypographyProps={{ component: 'div' }}
                    />
                  </ListItemButton>
                );
              })}
            </List>
          )}
        </Box>
      </Box>

      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          minHeight: 0,
          // Let row cross-axis stretch set height; height:100% stayed content-sized (~369px).
          alignSelf: 'stretch',
          display: { xs: isThreadOpen ? 'flex' : 'none', md: 'flex' },
          flexDirection: 'column',
          bgcolor: 'background.paper',
          p: { xs: 0, md: 2 },
        }}
      >
        {(isMdUp || isThreadOpen) && (
          <Outlet context={{ refetchThreads, bumpInboxReadVisual } as MessagesOutletContext} />
        )}
      </Box>
    </Box>
  );
}
