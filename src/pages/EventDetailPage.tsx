import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Skeleton,
  Alert,
  ButtonGroup,
  Stack,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Tabs,
  Tab,
  TextField,
  Paper,
  IconButton,
  Modal,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Link } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import ShareIcon from '@mui/icons-material/Share';
import EventIcon from '@mui/icons-material/Event';
import DirectionsIcon from '@mui/icons-material/Directions';
import PeopleIcon from '@mui/icons-material/People';
import InfoIcon from '@mui/icons-material/Info';
import ArticleIcon from '@mui/icons-material/Article';
import ChatIcon from '@mui/icons-material/Chat';
import PushPinIcon from '@mui/icons-material/PushPin';
import SendIcon from '@mui/icons-material/Send';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import CloseIcon from '@mui/icons-material/Close';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useTranslation } from 'react-i18next';
import { fetchEventById } from '../services/eventService';
import { Event, getCoverAspectRatioCss } from '../models/Event';
import { Visibility } from '../models/enums';
import { shortAddress } from '../utils/locationDisplay';
import { useAuth } from '../hooks/useAuth';
import { useEventAttendance } from '../hooks/useEventAttendance';
import { useResolvedLocation } from '../hooks/useResolvedLocation';
import { getAttendeeUserIds } from '../services/attendanceService';
import { getProfilesByIds } from '../services/profileService';
import { useEventPosts } from '../hooks/useEventPosts';
import { useEventMessages } from '../hooks/useEventMessages';
import { useEventPostAttachments } from '../hooks/useEventPostAttachments';
import { useEventPostReactions } from '../hooks/useEventPostReactions';
import { createEventPost, createEventPostWithAttachments, togglePostPinned, updateEventPost, deleteEventPost } from '../services/eventPostService';
import { uploadImage, getThumbnailUrl, isUploadConfigured, getMaxPhotosPerPost } from '../services/cloudinaryService';
import { buildImageUrl, buildVideoUrl } from '../lib/cloudinary';
import type { Profile } from '../models/Profile';
import type { EventPostType } from '../models/EventPost';
import { getAvatarObjectPosition } from '../utils/avatarPosition';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const markerIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const QUICK_REACTIONS = ['✅', '👏', '🔥', '💡', '🙌', '🎉'];

const URL_REGEX = /(https?:\/\/[^\s]+)/g;

function buildGoogleCalendarUrl(event: Event): string {
  const start = new Date(event.dateTime);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  const format = (d: Date) => d.toISOString().replace(/-|:|\.\d{3}/g, '');
  const title = encodeURIComponent(event.name);
  const location = encodeURIComponent(`${event.latitude},${event.longitude}`);
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${format(start)}/${format(end)}&location=${location}`;
}

function buildMapsDirectionsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

function renderTextWithLinks(text: string) {
  const parts = text.split(URL_REGEX);
  return parts.map((part, idx) => {
    if (part.startsWith('http://') || part.startsWith('https://')) {
      return (
        <a key={`${part}-${idx}`} href={part} target="_blank" rel="noopener noreferrer">
          {part}
        </a>
      );
    }
    return <span key={`${part}-${idx}`}>{part}</span>;
  });
}

export function EventDetailPage() {
  const { t, i18n } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attendees, setAttendees] = useState<Profile[]>([]);
  const [attendeesLoading, setAttendeesLoading] = useState(false);
  const [tab, setTab] = useState(0);
  const [lightboxAttachment, setLightboxAttachment] = useState<{ url: string; mediumUrl?: string; thumbUrl?: string; type: 'image' | 'video' } | null>(null);
  const [lightboxImageError, setLightboxImageError] = useState(false);
  const [lightboxMediumFailed, setLightboxMediumFailed] = useState(false);

  const { count, isGoing, loading: attendanceLoading, updating, setGoing, attendanceError, clearError } = useEventAttendance(
    id ?? undefined,
    user?.id ?? null,
    authLoading
  );
  const locationLabel = useResolvedLocation(event?.latitude ?? 0, event?.longitude ?? 0, event?.address);

  const isCreator = useMemo(() => event && user && event.userId === user.id, [event, user]);
  const canAccessWallAndChat = isGoing || isCreator;

  const { posts, loading: postsLoading, error: postsError, refetch: refetchPosts } = useEventPosts(canAccessWallAndChat ? id ?? null : null);
  const postIds = useMemo(() => posts.map((p) => p.id), [posts]);
  const { attachmentsByPost } = useEventPostAttachments(postIds);
  const {
    reactionsByPost,
    error: reactionsError,
    toggleReaction,
  } = useEventPostReactions(postIds, user?.id ?? null);
  const { messages, loading: messagesLoading, sending, error: messagesError, send: sendMessage, chatOpen } = useEventMessages(
    canAccessWallAndChat ? id ?? null : null,
    event?.dateTime ?? null,
    user?.id ?? null
  );

  const [postContent, setPostContent] = useState('');
  const [postType, setPostType] = useState<EventPostType>('post');
  const [wallFilter, setWallFilter] = useState<'all' | EventPostType>('all');
  const [posting, setPosting] = useState(false);
  const [postImageFiles, setPostImageFiles] = useState<File[]>([]);
  const [postUploadError, setPostUploadError] = useState<string | null>(null);
  const [postActionAnchor, setPostActionAnchor] = useState<null | HTMLElement>(null);
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editingPostContent, setEditingPostContent] = useState('');
  const [confirmDeletePostId, setConfirmDeletePostId] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [chatImageFile, setChatImageFile] = useState<File | null>(null);
  const [chatImagePreviewUrl, setChatImagePreviewUrl] = useState<string | null>(null);

  const filteredPosts = useMemo(
    () => (wallFilter === 'all' ? posts : posts.filter((p) => p.type === wallFilter)),
    [posts, wallFilter]
  );

  useEffect(() => {
    if (!chatImageFile) {
      setChatImagePreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(chatImageFile);
    setChatImagePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [chatImageFile]);

  const authorIds = useMemo(() => {
    const fromPosts = posts.map((p) => p.user_id);
    const fromMessages = messages.map((m) => m.user_id);
    return [...new Set([...fromPosts, ...fromMessages])];
  }, [posts, messages]);
  const profileIds = useMemo(() => {
    const ids = new Set(authorIds);
    if (event?.userId) ids.add(event.userId);
    return Array.from(ids);
  }, [authorIds, event?.userId]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});

  useEffect(() => {
    if (profileIds.length === 0) {
      setProfiles({});
      return;
    }
    getProfilesByIds(profileIds)
      .then((list) => {
        const map: Record<string, Profile> = {};
        list.forEach((p) => { map[p.id] = p; });
        setProfiles(map);
      })
      .catch(() => setProfiles({}));
  }, [profileIds.join(',')]);

  const canShowAttendees = event && (event.visibility === Visibility.Public || isCreator || isGoing) && (count ?? 0) > 0;

  useEffect(() => {
    if (!id || !canShowAttendees) {
      setAttendees([]);
      return;
    }
    setAttendeesLoading(true);
    getAttendeeUserIds(id)
      .then((ids) => (ids.length === 0 ? [] : getProfilesByIds(ids)))
      .then(setAttendees)
      .catch(() => setAttendees([]))
      .finally(() => setAttendeesLoading(false));
  }, [id, canShowAttendees]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    fetchEventById(id)
      .then(setEvent)
      .catch((e) => setError(e.message ?? t('events.failedToLoadEvent')))
      .finally(() => setLoading(false));
  }, [id]);

  const handleShare = async () => {
    if (!event) return;
    const url = window.location.href;
    const title = event.name;
    const text = `${event.name} — ${event.getDisplayDate()}`;
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') copyToClipboard(url);
      }
    } else {
      copyToClipboard(url);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {});
  };

  const handleAddPost = async () => {
    if (!id || !user) return;
    const hasContent = postContent.trim().length > 0;
    const hasImages = postImageFiles.length > 0;
    if (!hasContent && !hasImages) return;
    setPosting(true);
    setPostUploadError(null);
    try {
      if (hasImages && isUploadConfigured()) {
        const uploaded = await Promise.all(
          postImageFiles.map((file) => uploadImage(file))
        );
        await createEventPostWithAttachments(
          {
            event_id: id,
            user_id: user.id,
            content: postContent.trim() || null,
            type: postType,
          },
          uploaded.map((u, i) => ({
            type: 'image' as const,
            cloudinary_public_id: u.public_id,
            thumbnail_url: getThumbnailUrl(u.public_id, 'image'),
            order: i,
          }))
        );
        setPostImageFiles([]);
      } else {
        await createEventPost({
          event_id: id,
          user_id: user.id,
          content: postContent.trim() || null,
          type: postType,
        });
      }
      setPostContent('');
      refetchPosts();
    } catch (e) {
      setPostUploadError(e instanceof Error ? e.message : t('events.failedToPost'));
    } finally {
      setPosting(false);
    }
  };

  const openPostMenu = (e: React.MouseEvent<HTMLElement>, postId: string) => {
    setPostActionAnchor(e.currentTarget);
    setActivePostId(postId);
  };

  const closePostMenu = () => {
    setPostActionAnchor(null);
    setActivePostId(null);
  };

  const handleTogglePinned = async () => {
    if (!activePostId || !isCreator) return;
    try {
      await togglePostPinned(activePostId);
      refetchPosts();
    } finally {
      closePostMenu();
    }
  };

  const handleStartEditPost = () => {
    if (!activePostId || !user) return;
    const post = posts.find((p) => p.id === activePostId);
    if (!post || post.user_id !== user.id) return;
    setEditingPostId(post.id);
    setEditingPostContent(post.content ?? '');
    closePostMenu();
  };

  const handleSaveEditPost = async () => {
    if (!editingPostId) return;
    await updateEventPost(editingPostId, { content: editingPostContent });
    setEditingPostId(null);
    setEditingPostContent('');
    refetchPosts();
  };

  const handleRequestDeletePost = () => {
    if (!activePostId) return;
    setConfirmDeletePostId(activePostId);
    closePostMenu();
  };

  const handleConfirmDeletePost = async () => {
    if (!confirmDeletePostId) return;
    await deleteEventPost(confirmDeletePostId);
    setConfirmDeletePostId(null);
    refetchPosts();
  };

  const handlePostImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const max = getMaxPhotosPerPost();
    const images = files.filter((f) => f.type.startsWith('image/')).slice(0, max);
    setPostImageFiles((prev) => [...prev, ...images].slice(0, max));
    e.target.value = '';
  };

  const removePostImage = (index: number) => {
    setPostImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() && !chatImageFile) return;
    try {
      if (chatImageFile && isUploadConfigured()) {
        const uploaded = await uploadImage(chatImageFile);
        await sendMessage(chatInput.trim(), {
          imageCloudinaryPublicId: uploaded.public_id,
          imageThumbnailUrl: getThumbnailUrl(uploaded.public_id, 'image'),
        });
      } else {
        await sendMessage(chatInput.trim());
      }
      setChatInput('');
      setChatImageFile(null);
    } catch {
      // error already in hook
    }
  };

  if (loading) return <Skeleton variant="rounded" height={300} />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!event) return <Typography>{t('events.eventNotFound')}</Typography>;

  const typeLabel = t(`enums.eventType.${event.eventType}`);
  const visibilityLabel = t(`enums.visibility.${event.visibility}`);

  const infoPanel = (
    <>
      {event.coverCloudinaryPublicId && (
        <Box
          sx={{
            width: '100%',
            aspectRatio: getCoverAspectRatioCss(event.coverAspectRatio ?? '1:1'),
            overflow: 'hidden',
            borderRadius: 1,
            mb: 2,
            position: 'relative',
            backgroundColor: 'action.hover',
          }}
        >
          <Box
            component="img"
            src={buildImageUrl(event.coverCloudinaryPublicId)}
            alt=""
            sx={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: '50% 50%',
              display: 'block',
            }}
          />
        </Box>
      )}
      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>{event.name}</Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
            <Chip label={typeLabel} size="small" />
            <Chip label={visibilityLabel} size="small" variant="outlined" />
            {!attendanceLoading && (
              <Chip icon={<PeopleIcon />} label={t('events.goingCount', { count })} size="small" variant="outlined" />
            )}
          </Box>
          <Typography variant="body2" color="text.secondary">{t('events.dateTime', { value: event.getDisplayDate(i18n.language) })}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t('events.location', { value: shortAddress(locationLabel) })}
          </Typography>
          {event.description && (
            <Box sx={{ mt: 1.5 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>{t('events.about')}</Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{event.description}</Typography>
            </Box>
          )}
          {event.userId && (
            <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">{t('events.organizedBy')}</Typography>
              <Box component={Link} to={`/profile/${event.userId}`} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'inherit', textDecoration: 'none' }}>
                <Avatar src={profiles[event.userId]?.avatar_url ?? undefined} sx={{ width: 24, height: 24, '& .MuiAvatar-img': { objectPosition: getAvatarObjectPosition(profiles[event.userId]) } }}>
                  {(profiles[event.userId]?.display_name ?? event.userId)?.[0]?.toUpperCase() ?? '?'}
                </Avatar>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>{profiles[event.userId]?.display_name ?? t('events.user')}</Typography>
              </Box>
            </Box>
          )}

          <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap', gap: 1 }}>
            <Button variant="outlined" size="small" startIcon={<ShareIcon />} onClick={handleShare}>{t('events.share')}</Button>
            <Button variant="outlined" size="small" startIcon={<EventIcon />} href={buildGoogleCalendarUrl(event)} target="_blank" rel="noopener noreferrer">{t('events.addToCalendar')}</Button>
            <Button variant="outlined" size="small" startIcon={<DirectionsIcon />} href={buildMapsDirectionsUrl(event.latitude, event.longitude)} target="_blank" rel="noopener noreferrer">{t('events.getDirections')}</Button>
          </Stack>

          {canShowAttendees && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>{t('events.whoIsGoing')}</Typography>
              {attendeesLoading ? (
                <Skeleton variant="rounded" height={40} />
              ) : attendees.length === 0 ? (
                <Typography variant="body2" color="text.secondary">{t('events.noOneGoingYet')}</Typography>
              ) : (
                <List dense disablePadding>
                  {attendees.map((p) => (
                    <ListItem key={p.id} component={Link} to={`/profile/${p.id}`} sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar src={p.avatar_url ?? undefined} sx={{ width: 32, height: 32, '& .MuiAvatar-img': { objectPosition: getAvatarObjectPosition(p) } }}>
                          {(p.display_name ?? p.id)?.[0]?.toUpperCase() ?? '?'}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText primary={p.display_name ?? t('events.user')} />
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          )}

          {user && (
            <Box sx={{ mt: 2 }}>
              {attendanceError && (
                <Alert severity="error" sx={{ mb: 1 }} onClose={clearError}>{attendanceError}</Alert>
              )}
              <Typography variant="subtitle2" gutterBottom>{t('events.areYouGoing')}</Typography>
              <ButtonGroup size="small">
                <Button
                  variant={isGoing === true ? 'contained' : 'outlined'}
                  startIcon={<CheckCircleIcon />}
                  onClick={() => setGoing(true)}
                  disabled={updating || attendanceLoading}
                >
                  {t('events.imGoing')}
                </Button>
                <Button
                  variant={isGoing === false ? 'contained' : 'outlined'}
                  color="secondary"
                  startIcon={<CancelIcon />}
                  onClick={() => setGoing(false)}
                  disabled={updating || attendanceLoading}
                >
                  {t('events.imNotGoing')}
                </Button>
              </ButtonGroup>
            </Box>
          )}
        </CardContent>
      </Card>
      <Typography variant="subtitle2" gutterBottom>{t('events.map')}</Typography>
      <Box sx={{ height: 280, width: '100%', borderRadius: 1, overflow: 'hidden' }}>
        <MapContainer center={[event.latitude, event.longitude]} zoom={14} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
          <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={[event.latitude, event.longitude]} icon={markerIcon}>
            <Popup>{event.name}</Popup>
          </Marker>
        </MapContainer>
      </Box>
    </>
  );

  const wallPanel = !canAccessWallAndChat ? (
    <Alert severity="info">{t('events.wallLocked')}</Alert>
  ) : (
    <Stack spacing={2}>
      {user && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle2" gutterBottom>{t('events.newPost')}</Typography>
          <TextField
            fullWidth
            multiline
            minRows={2}
            placeholder={t('events.newPostPlaceholder')}
            value={postContent}
            onChange={(e) => setPostContent(e.target.value)}
            size="small"
            sx={{ mb: 1 }}
          />
          <Box sx={{ mb: 1 }}>
            {isUploadConfigured() ? (
              <>
                <input
                  accept="image/*"
                  type="file"
                  multiple
                  id="post-photos"
                  style={{ display: 'none' }}
                  onChange={handlePostImageSelect}
                />
                <label htmlFor="post-photos">
                  <Button component="span" size="small" startIcon={<PhotoLibraryIcon />}>
                    {t('events.addPhotos', { count: getMaxPhotosPerPost() })}
                  </Button>
                </label>
                {postImageFiles.length > 0 && (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                    {postImageFiles.map((file, i) => (
                      <Box key={i} sx={{ position: 'relative' }}>
                        <Box
                          component="img"
                          src={URL.createObjectURL(file)}
                          alt=""
                          sx={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 1 }}
                        />
                        <IconButton size="small" sx={{ position: 'absolute', top: -4, right: -4, bgcolor: 'background.paper' }} onClick={() => removePostImage(i)}>
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                )}
              </>
            ) : (
              <Typography variant="caption" color="text.secondary">
                {t('events.addPhotosSetup')}
              </Typography>
            )}
          </Box>
          {postUploadError && <Alert severity="error" sx={{ mb: 1 }} onClose={() => setPostUploadError(null)}>{postUploadError}</Alert>}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
            <Chip label={t('events.post')} size="small" variant={postType === 'post' ? 'filled' : 'outlined'} onClick={() => setPostType('post')} />
            <Chip label={t('events.question')} size="small" variant={postType === 'question' ? 'filled' : 'outlined'} onClick={() => setPostType('question')} />
            {isCreator && (
              <Chip label={t('events.announcement')} size="small" variant={postType === 'announcement' ? 'filled' : 'outlined'} color="primary" onClick={() => setPostType('announcement')} />
            )}
            <Button
              variant="contained"
              size="small"
              onClick={handleAddPost}
              disabled={posting || (!postContent.trim() && postImageFiles.length === 0)}
            >
              {t('events.publishAction')}
            </Button>
          </Box>
        </Paper>
      )}
      {postsError && <Alert severity="error">{postsError}</Alert>}
      {reactionsError && <Alert severity="error">{reactionsError}</Alert>}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
        <Chip label={t('events.filterAll')} size="small" variant={wallFilter === 'all' ? 'filled' : 'outlined'} onClick={() => setWallFilter('all')} />
        <Chip label={t('events.announcement')} size="small" variant={wallFilter === 'announcement' ? 'filled' : 'outlined'} onClick={() => setWallFilter('announcement')} />
        <Chip label={t('events.question')} size="small" variant={wallFilter === 'question' ? 'filled' : 'outlined'} onClick={() => setWallFilter('question')} />
        <Chip label={t('events.post')} size="small" variant={wallFilter === 'post' ? 'filled' : 'outlined'} onClick={() => setWallFilter('post')} />
      </Box>
      {postsLoading ? (
        <Skeleton variant="rounded" height={120} />
      ) : filteredPosts.length === 0 ? (
        <Typography color="text.secondary">{t('events.noPosts')}</Typography>
      ) : (
        filteredPosts.map((p) => (
          <Card key={p.id} variant="outlined" sx={{ overflow: 'visible' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <Avatar src={profiles[p.user_id]?.avatar_url ?? undefined} sx={{ width: 40, height: 40, '& .MuiAvatar-img': { objectPosition: getAvatarObjectPosition(profiles[p.user_id]) } }}>
                  {(profiles[p.user_id]?.display_name ?? p.user_id)?.[0]?.toUpperCase() ?? '?'}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                    <Typography component={Link} to={`/profile/${p.user_id}`} variant="subtitle2" sx={{ fontWeight: 600, color: 'inherit', textDecoration: 'none' }}>
                      {profiles[p.user_id]?.display_name ?? t('events.user')}
                    </Typography>
                    <Chip label={p.type} size="small" variant="outlined" sx={{ textTransform: 'capitalize' }} />
                    {p.pinned && <PushPinIcon sx={{ fontSize: 14 }} color="action" />}
                    {user && (user.id === p.user_id || isCreator) && (
                      <IconButton size="small" onClick={(e) => openPostMenu(e, p.id)}>
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                    {p.created_at ? new Date(p.created_at).toLocaleString() : ''}
                  </Typography>
                  {editingPostId === p.id ? (
                    <Box sx={{ mt: 0.5 }}>
                      <TextField
                        fullWidth
                        size="small"
                        multiline
                        minRows={2}
                        value={editingPostContent}
                        onChange={(e) => setEditingPostContent(e.target.value)}
                      />
                      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                        <Button size="small" variant="contained" onClick={() => { void handleSaveEditPost(); }}>
                          {t('events.saveEdit')}
                        </Button>
                        <Button size="small" onClick={() => { setEditingPostId(null); setEditingPostContent(''); }}>
                          {t('events.cancelEdit')}
                        </Button>
                      </Box>
                    </Box>
                  ) : (
                    p.content && <Typography variant="body1" sx={{ mt: 0.5 }}>{p.content}</Typography>
                  )}
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 1 }}>
                    {(reactionsByPost[p.id] ?? []).map((reaction) => (
                      <Chip
                        key={`${p.id}-${reaction.emoji}`}
                        size="small"
                        label={`${reaction.emoji} ${reaction.count}`}
                        variant={reaction.reactedByCurrentUser ? 'filled' : 'outlined'}
                        onClick={user ? () => { void toggleReaction(p.id, reaction.emoji); } : undefined}
                      />
                    ))}
                    {user && QUICK_REACTIONS
                      .filter((emoji) => !(reactionsByPost[p.id] ?? []).some((r) => r.emoji === emoji))
                      .map((emoji) => (
                        <Chip
                          key={`${p.id}-quick-${emoji}`}
                          size="small"
                          label={emoji}
                          variant="outlined"
                          onClick={() => { void toggleReaction(p.id, emoji); }}
                        />
                      ))}
                  </Box>
                  {attachmentsByPost[p.id] && attachmentsByPost[p.id].length > 0 && (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                      {attachmentsByPost[p.id].map((att) => {
                        const thumbUrl = att.thumbnail_url || getThumbnailUrl(att.cloudinary_public_id, att.type);
                        const highQualityUrl = att.type === 'image' ? buildImageUrl(att.cloudinary_public_id) : buildVideoUrl(att.cloudinary_public_id);
                        const mediumUrl = att.type === 'image' ? buildImageUrl(att.cloudinary_public_id, { width: 1200 }) : undefined;
                        return (
                          <Box
                            key={att.id}
                            onClick={() => {
                              setLightboxImageError(false);
                              setLightboxMediumFailed(false);
                              setLightboxAttachment({ url: highQualityUrl, mediumUrl, thumbUrl: att.type === 'image' ? thumbUrl : undefined, type: att.type });
                            }}
                            sx={{ display: 'block', cursor: 'pointer', position: 'relative' }}
                          >
                            {att.type === 'image' ? (
                              <>
                                <Box component="img" src={thumbUrl} alt="" sx={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 1 }} />
                                <Box component="img" src={highQualityUrl} alt="" aria-hidden sx={{ position: 'absolute', left: 0, top: 0, width: 0, height: 0, opacity: 0, pointerEvents: 'none' }} />
                              </>
                            ) : (
                              <Box component="img" src={thumbUrl} alt="Video" sx={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 1 }} />
                            )}
                          </Box>
                        );
                      })}
                    </Box>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))
      )}
      <Menu
        anchorEl={postActionAnchor}
        open={Boolean(postActionAnchor)}
        onClose={closePostMenu}
      >
        {isCreator && (
          <MenuItem onClick={() => { void handleTogglePinned(); }}>
            <PushPinIcon sx={{ mr: 1, fontSize: 18 }} />
            {t('events.pinToggle')}
          </MenuItem>
        )}
        {user && activePostId && posts.find((p) => p.id === activePostId)?.user_id === user.id && (
          <MenuItem onClick={handleStartEditPost}>
            <EditIcon sx={{ mr: 1, fontSize: 18 }} />
            {t('events.editPost')}
          </MenuItem>
        )}
        {user && activePostId && (isCreator || posts.find((p) => p.id === activePostId)?.user_id === user.id) && (
          <MenuItem onClick={handleRequestDeletePost}>
            <DeleteOutlineIcon sx={{ mr: 1, fontSize: 18 }} />
            {t('events.deletePost')}
          </MenuItem>
        )}
      </Menu>
      <Dialog open={confirmDeletePostId !== null} onClose={() => setConfirmDeletePostId(null)}>
        <DialogTitle>{t('events.confirmDeleteTitle')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2">{t('events.confirmDeleteBody')}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeletePostId(null)}>{t('events.cancelEdit')}</Button>
          <Button color="error" variant="contained" onClick={() => { void handleConfirmDeletePost(); }}>
            {t('events.deletePost')}
          </Button>
        </DialogActions>
      </Dialog>
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
    </Stack>
  );

  const chatPanel = !canAccessWallAndChat ? (
    <Alert severity="info">{t('events.chatLocked')}</Alert>
  ) : (
    <Stack spacing={1} sx={{ height: 400 }}>
      {!chatOpen && (
        <Alert severity="info">
          {t('events.chatClosed')}
        </Alert>
      )}
      {messagesError && <Alert severity="error">{messagesError}</Alert>}
      <Paper variant="outlined" sx={{ flex: 1, overflow: 'auto', p: 1 }}>
        {messagesLoading ? (
          <Skeleton variant="rounded" height={200} />
        ) : messages.length === 0 ? (
          <Typography color="text.secondary">{chatOpen ? t('events.noMessagesOpen') : t('events.noMessages')}</Typography>
        ) : (
          messages.map((m) => (
            <Box key={m.id} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'flex-start' }}>
              <Avatar src={profiles[m.user_id]?.avatar_url ?? undefined} sx={{ width: 28, height: 28, '& .MuiAvatar-img': { objectPosition: getAvatarObjectPosition(profiles[m.user_id]) } }}>
                {(profiles[m.user_id]?.display_name ?? m.user_id)?.[0]?.toUpperCase() ?? '?'}
              </Avatar>
              <Box>
                <Typography component={Link} to={`/profile/${m.user_id}`} variant="caption" sx={{ fontWeight: 600, color: 'inherit', textDecoration: 'none' }}>
                  {profiles[m.user_id]?.display_name ?? t('events.user')}
                </Typography>
                <Typography variant="body2" display="block">{renderTextWithLinks(m.body)}</Typography>
                {m.image_cloudinary_public_id && (
                  <Box
                    component="img"
                    src={m.image_thumbnail_url || getThumbnailUrl(m.image_cloudinary_public_id, 'image')}
                    alt=""
                    onClick={() => {
                      setLightboxImageError(false);
                      setLightboxMediumFailed(false);
                      setLightboxAttachment({
                        url: buildImageUrl(m.image_cloudinary_public_id as string),
                        mediumUrl: buildImageUrl(m.image_cloudinary_public_id as string, { width: 1200 }),
                        thumbUrl: m.image_thumbnail_url || getThumbnailUrl(m.image_cloudinary_public_id as string, 'image'),
                        type: 'image',
                      });
                    }}
                    sx={{ mt: 0.5, width: 120, height: 120, objectFit: 'cover', borderRadius: 1, cursor: 'pointer' }}
                  />
                )}
                <Typography variant="caption" color="text.secondary">{m.created_at ? new Date(m.created_at).toLocaleTimeString() : ''}</Typography>
              </Box>
            </Box>
          ))
        )}
      </Paper>
      {chatOpen && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {isUploadConfigured() && (
            <>
              <input
                accept="image/*"
                type="file"
                id="chat-photo"
                style={{ display: 'none' }}
                onChange={(e) => setChatImageFile(e.target.files?.[0] ?? null)}
              />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <label htmlFor="chat-photo">
                  <Button component="span" size="small" startIcon={<PhotoLibraryIcon />}>
                    {t('events.addImage')}
                  </Button>
                </label>
                {chatImageFile && chatImagePreviewUrl && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box component="img" src={chatImagePreviewUrl} alt="" sx={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 1 }} />
                    <IconButton size="small" onClick={() => setChatImageFile(null)}>
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Box>
                )}
              </Box>
            </>
          )}
          <Box sx={{ display: 'flex', gap: 0.5 }}>
          <TextField
            fullWidth
            size="small"
            placeholder={t('events.messagePlaceholder')}
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
          />
          <IconButton color="primary" onClick={handleSendMessage} disabled={sending || (!chatInput.trim() && !chatImageFile)}>
            <SendIcon />
          </IconButton>
          </Box>
        </Box>
      )}
    </Stack>
  );

  return (
    <Box>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>{t('events.back')}</Button>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label={t('events.info')} icon={<InfoIcon />} iconPosition="start" />
        <Tab label={t('events.wall')} icon={<ArticleIcon />} iconPosition="start" />
        <Tab label={t('events.chat')} icon={<ChatIcon />} iconPosition="start" />
      </Tabs>
      {tab === 0 && infoPanel}
      {tab === 1 && wallPanel}
      {tab === 2 && chatPanel}
    </Box>
  );
}
