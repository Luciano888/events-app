import { useEffect, useMemo, useState, useCallback } from 'react';
import { Link, useOutletContext, useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  IconButton,
  Modal,
  Skeleton,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { useEventAttendance } from '../hooks/useEventAttendance';
import { useEventMessages } from '../hooks/useEventMessages';
import { fetchEventById } from '../services/eventService';
import { getProfilesByIds } from '../services/profileService';
import type { Event } from '../models/Event';
import type { Profile } from '../models/Profile';
import { EventChatTrayPanel } from '../components/EventChatTrayPanel';
import { isSupabaseConfigured } from '../lib/supabase';
import type { MessagesOutletContext } from './MessagesLayout';
import { markEventThreadRead } from '../utils/messagesInboxReadState';

export function EventMessagesThreadPage() {
  const { t, i18n } = useTranslation();
  const { refetchThreads, bumpInboxReadVisual } = useOutletContext<MessagesOutletContext | null>() ?? {};
  const { eventId } = useParams<{ eventId: string }>();
  const { user, loading: authLoading } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [eventLoadError, setEventLoadError] = useState<string | null>(null);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [lightboxAttachment, setLightboxAttachment] = useState<{
    url: string;
    mediumUrl?: string;
    thumbUrl?: string;
    type: 'image' | 'video';
  } | null>(null);
  const [lightboxImageError, setLightboxImageError] = useState(false);
  const [lightboxMediumFailed, setLightboxMediumFailed] = useState(false);

  useEffect(() => {
    if (!eventId) return;
    setLoadingEvent(true);
    setEventLoadError(null);
    fetchEventById(eventId)
      .then(setEvent)
      .catch((e) => setEventLoadError(e.message ?? t('events.failedToLoadEvent')))
      .finally(() => setLoadingEvent(false));
  }, [eventId, t]);

  const { isGoing, loading: attendanceLoading } = useEventAttendance(
    eventId ?? undefined,
    user?.id ?? null,
    authLoading
  );
  const isCreator = useMemo(() => Boolean(event && user && event.userId === user.id), [event, user]);
  const canAccessWallAndChat = Boolean(isGoing) || isCreator;

  const { messages, loading: messagesLoading, sending, error: messagesError, send: sendMessage, chatOpen } =
    useEventMessages(canAccessWallAndChat && eventId ? eventId : null, event?.dateTime ?? null, user?.id ?? null);

  const latestMessageIso = useMemo(() => {
    if (messages.length === 0) return null;
    return messages.reduce<string>((best, m) => {
      const t = new Date(m.created_at ?? 0).getTime();
      return t > new Date(best).getTime() ? (m.created_at as string) : best;
    }, messages[0].created_at as string);
  }, [messages]);

  const bumpRead = useCallback(() => {
    bumpInboxReadVisual?.();
  }, [bumpInboxReadVisual]);

  useEffect(() => {
    if (!eventId || !user?.id || !canAccessWallAndChat) return;
    if (latestMessageIso) {
      markEventThreadRead(eventId, latestMessageIso);
    } else {
      markEventThreadRead(eventId, new Date().toISOString());
    }
    bumpRead();
  }, [eventId, user?.id, canAccessWallAndChat, latestMessageIso, bumpRead]);

  const authorIds = useMemo(() => {
    const ids = new Set(messages.map((m) => m.user_id));
    if (event?.userId) ids.add(event.userId);
    return Array.from(ids);
  }, [messages, event?.userId]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});

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
      <Alert severity="info" sx={{ mb: 2 }}>
        {t('messages.loginRequired')}
      </Alert>
    );
  }

  if (!eventId) {
    return <Alert severity="error">{t('messages.threadMissingId')}</Alert>;
  }

  if (loadingEvent || attendanceLoading) {
    return <Skeleton variant="rounded" height={320} />;
  }

  if (eventLoadError) {
    return (
      <Box>
        <Button startIcon={<ArrowBackIcon />} component={Link} to="/messages" sx={{ mb: 2 }}>
          {t('messages.backToInbox')}
        </Button>
        <Alert severity="error">{eventLoadError}</Alert>
      </Box>
    );
  }

  if (!event) {
    return (
      <Box>
        <Button startIcon={<ArrowBackIcon />} component={Link} to="/messages" sx={{ mb: 2 }}>
          {t('messages.backToInbox')}
        </Button>
        <Typography>{t('events.eventNotFound')}</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        flex: '1 0 0%',
        minHeight: { xs: 'min(560px, calc(100dvh - 120px))', md: 0 },
        maxHeight: { xs: 'calc(100dvh - 120px)', md: 'none' },
        px: { xs: 1, md: 0 },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          flexShrink: 0,
          flexWrap: 'wrap',
          pb: 1.25,
          mb: 1,
          boxShadow: (theme) =>
            `inset 0 -1px 0 ${alpha(theme.palette.divider, theme.palette.mode === 'dark' ? 0.14 : 0.1)}`,
        }}
      >
        <IconButton
          component={Link}
          to="/messages"
          aria-label={t('messages.backToInbox')}
          edge="start"
          size="small"
          sx={{ display: { xs: 'inline-flex', md: 'none' } }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography
          variant="h6"
          component="h1"
          sx={{ flex: '1 1 auto', minWidth: 0, fontWeight: 700, letterSpacing: -0.02 }}
          noWrap
        >
          {event.name}
        </Typography>
        <Button component={Link} to={`/event/${eventId}`} size="small" variant="outlined" sx={{ flexShrink: 0, borderRadius: 2 }}>
          {t('messages.eventDetails')}
        </Button>
      </Box>

      <Box sx={{ flex: '1 0 0%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <EventChatTrayPanel
          canAccessWallAndChat={canAccessWallAndChat}
          chatTimeOpen={chatOpen}
          messages={messages}
          messagesLoading={messagesLoading}
          messagesError={messagesError}
          sending={sending}
          sendMessage={sendMessage}
          profiles={profiles}
          currentUserId={user.id}
          locale={i18n.language}
          lockedSlot={
            <>
              <Alert severity="info">{t('events.chatLocked')}</Alert>
              <Button variant="contained" component={Link} to={`/event/${eventId}#event-rsvp-section`}>
                {t('events.goToRsvp')}
              </Button>
            </>
          }
          onImageClick={(payload) => {
            setLightboxImageError(false);
            setLightboxMediumFailed(false);
            setLightboxAttachment(payload);
          }}
          onMessageSent={() => {
            void refetchThreads?.();
          }}
        />
      </Box>

      <Modal
        open={lightboxAttachment !== null}
        onClose={() => {
          setLightboxAttachment(null);
          setLightboxImageError(false);
          setLightboxMediumFailed(false);
        }}
        sx={{
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2,
        }}
        BackdropProps={{ sx: { bgcolor: 'rgba(0,0,0,0.92)', zIndex: 9998 } }}
      >
        <Box
          onClick={() => {
            setLightboxAttachment(null);
            setLightboxImageError(false);
            setLightboxMediumFailed(false);
          }}
          sx={{
            position: 'relative',
            zIndex: 10000,
            maxWidth: '90vw',
            maxHeight: '90vh',
            minWidth: 280,
            minHeight: 200,
            outline: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              setLightboxAttachment(null);
              setLightboxImageError(false);
              setLightboxMediumFailed(false);
            }}
            sx={{ position: 'absolute', top: 8, right: 8, color: 'white', bgcolor: 'rgba(0,0,0,0.6)', zIndex: 2, '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' } }}
            size="small"
          >
            <CloseIcon />
          </IconButton>
          {lightboxAttachment?.type === 'image' ? (
            lightboxImageError ? (
              lightboxAttachment.mediumUrl && !lightboxMediumFailed ? (
                <Box
                  component="img"
                  src={lightboxAttachment.mediumUrl}
                  alt=""
                  onError={() => setLightboxMediumFailed(true)}
                  onClick={(e) => e.stopPropagation()}
                  sx={{ maxWidth: '90vw', maxHeight: '90vh', width: 'auto', height: 'auto', objectFit: 'contain', display: 'block' }}
                />
              ) : lightboxAttachment.thumbUrl ? (
                <Box
                  component="img"
                  src={lightboxAttachment.thumbUrl}
                  alt=""
                  onClick={(e) => e.stopPropagation()}
                  sx={{ maxWidth: '90vw', maxHeight: '90vh', width: 'auto', height: 'auto', objectFit: 'contain', display: 'block' }}
                />
              ) : (
                <Typography onClick={(e) => e.stopPropagation()} sx={{ color: 'white' }}>
                  {t('events.imageLoadError')}
                </Typography>
              )
            ) : (
              <Box
                component="img"
                src={lightboxAttachment?.url}
                alt=""
                onError={() => setLightboxImageError(true)}
                onClick={(e) => e.stopPropagation()}
                sx={{ maxWidth: '90vw', maxHeight: '90vh', width: 'auto', height: 'auto', objectFit: 'contain', display: 'block' }}
              />
            )
          ) : (
            <Box
              component="video"
              src={lightboxAttachment?.url ?? ''}
              controls
              onClick={(e) => e.stopPropagation()}
              sx={{ maxWidth: '90vw', maxHeight: '90vh', display: 'block' }}
            />
          )}
        </Box>
      </Modal>
    </Box>
  );
}
