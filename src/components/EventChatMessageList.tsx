import { useMemo, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  Avatar,
  Chip,
  Stack,
  LinearProgress,
} from '@mui/material';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { EventMessageRow } from '../models/EventMessage';
import type { Profile } from '../models/Profile';
import { getAvatarObjectPosition } from '../utils/avatarPosition';
import { renderTextWithLinks } from '../utils/renderTextWithLinks';
import { buildImageUrl } from '../lib/cloudinary';
import { getThumbnailUrl } from '../services/cloudinaryService';

const GROUP_GAP_MS = 5 * 60 * 1000;

function formatMessageTime(iso: string | undefined, locale: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
}

function formatDayLabel(date: Date, t: (k: string) => string, locale: string): string {
  const startOf = (x: Date) => {
    const y = new Date(x);
    y.setHours(0, 0, 0, 0);
    return y.getTime();
  };
  const today = startOf(new Date());
  const d0 = startOf(date);
  const diffDays = Math.round((today - d0) / 86400000);
  if (diffDays === 0) return t('events.chatToday');
  if (diffDays === 1) return t('events.chatYesterday');
  const nowY = new Date().getFullYear();
  const opts: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  };
  if (date.getFullYear() !== nowY) opts.year = 'numeric';
  return date.toLocaleDateString(locale, opts);
}

type Enriched = EventMessageRow & {
  showDaySeparator: boolean;
  dayLabel?: string;
  showAvatarRow: boolean;
  isOwn: boolean;
};

function enrichMessages(
  messages: EventMessageRow[],
  currentUserId: string | null,
  locale: string,
  t: (k: string) => string
): Enriched[] {
  return messages.map((m, i) => {
    const prev = messages[i - 1];
    const prevDate = prev?.created_at ? new Date(prev.created_at) : null;
    const currDate = m.created_at ? new Date(m.created_at) : new Date();
    const showDaySeparator =
      !prevDate || prevDate.toDateString() !== currDate.toDateString();

    const prevTime = prev?.created_at ? new Date(prev.created_at).getTime() : null;
    const currTime = m.created_at ? new Date(m.created_at).getTime() : Date.now();
    const sameSender = !!prev && prev.user_id === m.user_id;
    const gapOk = prevTime != null && currTime - prevTime <= GROUP_GAP_MS;
    const showAvatarRow = !sameSender || !gapOk || showDaySeparator;

    return {
      ...m,
      showDaySeparator,
      dayLabel: showDaySeparator ? formatDayLabel(currDate, t, locale) : undefined,
      showAvatarRow,
      isOwn: currentUserId != null && m.user_id === currentUserId,
    };
  });
}

export interface EventChatMessageListProps {
  messages: EventMessageRow[];
  profiles: Record<string, Profile>;
  currentUserId: string | null;
  locale: string;
  sending: boolean;
  onImageClick: (payload: {
    url: string;
    mediumUrl?: string;
    thumbUrl?: string;
    type: 'image' | 'video';
  }) => void;
}

export function EventChatMessageList({
  messages,
  profiles,
  currentUserId,
  locale,
  sending,
  onImageClick,
}: EventChatMessageListProps) {
  const { t } = useTranslation();
  const bottomRef = useRef<HTMLDivElement>(null);
  const enriched = useMemo(
    () => enrichMessages(messages, currentUserId, locale, (k) => t(k)),
    [messages, currentUserId, locale, t]
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, sending]);

  const hasText = (body: string) => body.trim().length > 0;

  return (
    <Box
      sx={{
        flex: '1 0 0%',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {sending && (
        <LinearProgress
          sx={{ height: 3, borderRadius: 0 }}
          aria-label={t('events.chatSending')}
        />
      )}
      <Box sx={{ flex: '1 0 0%', minHeight: 0, overflow: 'auto', px: 1.25, py: 1.5 }}>
        <Stack spacing={0.5}>
          {enriched.map((m) => (
            <Box key={m.id}>
              {m.showDaySeparator && m.dayLabel && (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 1.5 }}>
                  <Chip label={m.dayLabel} size="small" variant="outlined" sx={{ fontWeight: 500 }} />
                </Box>
              )}

              {m.isOwn ? (
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    mb: 0.25,
                    px: 0.5,
                  }}
                >
                  <Box
                    sx={{
                      maxWidth: '78%',
                      minWidth: 0,
                      position: 'relative',
                      px: 1.25,
                      py: hasText(m.body) ? 0.75 : 0.5,
                      pb: hasText(m.body) ? 2 : 1.75,
                      pt: m.image_cloudinary_public_id && !hasText(m.body) ? 0.5 : 0.75,
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                      borderRadius: 2,
                      borderTopRightRadius: 4,
                      boxShadow: (theme) =>
                        theme.palette.mode === 'dark'
                          ? '0 1px 4px rgba(0,0,0,0.35)'
                          : '0 1px 3px rgba(0,0,0,0.08)',
                    }}
                  >
                    {m.image_cloudinary_public_id && (
                      <Box
                        component="img"
                        src={m.image_thumbnail_url || getThumbnailUrl(m.image_cloudinary_public_id, 'image')}
                        alt=""
                        onClick={() =>
                          onImageClick({
                            url: buildImageUrl(m.image_cloudinary_public_id as string),
                            mediumUrl: buildImageUrl(m.image_cloudinary_public_id as string, { width: 1200 }),
                            thumbUrl: m.image_thumbnail_url || getThumbnailUrl(m.image_cloudinary_public_id as string, 'image'),
                            type: 'image',
                          })
                        }
                        sx={{
                          display: 'block',
                          maxWidth: '100%',
                          width: 220,
                          maxHeight: 220,
                          height: 'auto',
                          objectFit: 'cover',
                          borderRadius: 1.5,
                          cursor: 'pointer',
                          mb: hasText(m.body) ? 0.75 : 0,
                        }}
                      />
                    )}
                    {hasText(m.body) && (
                      <Typography variant="body2" sx={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                        {renderTextWithLinks(m.body, {
                          color: 'common.white',
                          textDecoration: 'underline',
                          opacity: 0.95,
                          wordBreak: 'break-all',
                        })}
                      </Typography>
                    )}
                    <Typography
                      variant="caption"
                      sx={{
                        position: 'absolute',
                        bottom: 4,
                        right: 8,
                        opacity: 0.85,
                        fontSize: '0.7rem',
                      }}
                    >
                      {formatMessageTime(m.created_at, locale)}
                    </Typography>
                  </Box>
                </Box>
              ) : (
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'flex-start',
                    alignItems: 'flex-end',
                    gap: 0.75,
                    mb: 0.25,
                    px: 0.5,
                  }}
                >
                  <Box
                    sx={{
                      width: 32,
                      flexShrink: 0,
                      display: 'flex',
                      justifyContent: 'center',
                      alignSelf: 'flex-end',
                      pb: 0.25,
                    }}
                  >
                    {m.showAvatarRow ? (
                      <Avatar
                        src={profiles[m.user_id]?.avatar_url ?? undefined}
                        sx={{
                          width: 30,
                          height: 30,
                          '& .MuiAvatar-img': { objectPosition: getAvatarObjectPosition(profiles[m.user_id]) },
                        }}
                      >
                        {(profiles[m.user_id]?.display_name ?? m.user_id)?.[0]?.toUpperCase() ?? '?'}
                      </Avatar>
                    ) : null}
                  </Box>
                  <Box sx={{ maxWidth: 'calc(78% - 32px)', minWidth: 0 }}>
                    {m.showAvatarRow && (
                      <Typography
                        component={Link}
                        to={`/profile/${m.user_id}`}
                        variant="caption"
                        sx={{
                          display: 'block',
                          fontWeight: 600,
                          color: 'text.secondary',
                          textDecoration: 'none',
                          mb: 0.25,
                          pl: 0.25,
                          '&:hover': { textDecoration: 'underline' },
                        }}
                      >
                        {profiles[m.user_id]?.display_name ?? t('events.user')}
                      </Typography>
                    )}
                    <Box
                      sx={{
                        position: 'relative',
                        px: 1.25,
                        py: hasText(m.body) ? 0.75 : 0.5,
                        pb: hasText(m.body) ? 2 : 1.75,
                        pt: m.image_cloudinary_public_id && !hasText(m.body) ? 0.5 : 0.75,
                        bgcolor: 'background.paper',
                        color: 'text.primary',
                        borderRadius: 2,
                        borderTopLeftRadius: 4,
                        boxShadow: (theme) =>
                          theme.palette.mode === 'dark'
                            ? '0 1px 4px rgba(0,0,0,0.4)'
                            : '0 1px 4px rgba(0,0,0,0.07)',
                      }}
                    >
                      {m.image_cloudinary_public_id && (
                        <Box
                          component="img"
                          src={m.image_thumbnail_url || getThumbnailUrl(m.image_cloudinary_public_id, 'image')}
                          alt=""
                          onClick={() =>
                            onImageClick({
                              url: buildImageUrl(m.image_cloudinary_public_id as string),
                              mediumUrl: buildImageUrl(m.image_cloudinary_public_id as string, { width: 1200 }),
                              thumbUrl: m.image_thumbnail_url || getThumbnailUrl(m.image_cloudinary_public_id as string, 'image'),
                              type: 'image',
                            })
                          }
                          sx={{
                            display: 'block',
                            maxWidth: '100%',
                            width: 220,
                            maxHeight: 220,
                            height: 'auto',
                            objectFit: 'cover',
                            borderRadius: 1.5,
                            cursor: 'pointer',
                            mb: hasText(m.body) ? 0.75 : 0,
                          }}
                        />
                      )}
                      {hasText(m.body) && (
                        <Typography variant="body2" sx={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                          {renderTextWithLinks(m.body)}
                        </Typography>
                      )}
                      <Typography
                        variant="caption"
                        sx={{
                          position: 'absolute',
                          bottom: 4,
                          right: 8,
                          color: 'text.secondary',
                          fontSize: '0.7rem',
                        }}
                      >
                        {formatMessageTime(m.created_at, locale)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              )}
            </Box>
          ))}
          <div ref={bottomRef} />
        </Stack>
      </Box>
    </Box>
  );
}
