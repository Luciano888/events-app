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
import { fetchEventById } from '../services/eventService';
import { Event } from '../models/Event';
import { EVENT_TYPE_LABELS, VISIBILITY_LABELS } from '../models/enums';
import { useAuth } from '../hooks/useAuth';
import { useEventAttendance } from '../hooks/useEventAttendance';
import { getAttendeeUserIds } from '../services/attendanceService';
import { getProfilesByIds } from '../services/profileService';
import { useEventPosts } from '../hooks/useEventPosts';
import { useEventMessages } from '../hooks/useEventMessages';
import { useEventPostAttachments } from '../hooks/useEventPostAttachments';
import { createEventPost, createEventPostWithAttachments } from '../services/eventPostService';
import { uploadImage, getThumbnailUrl, isUploadConfigured, getMaxPhotosPerPost } from '../services/cloudinaryService';
import { buildImageUrl, buildVideoUrl } from '../lib/cloudinary';
import type { Profile } from '../models/Profile';
import type { EventPostType } from '../models/EventPost';
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

export function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attendees, setAttendees] = useState<Profile[]>([]);
  const [attendeesLoading, setAttendeesLoading] = useState(false);
  const [tab, setTab] = useState(0);
  const [lightboxAttachment, setLightboxAttachment] = useState<{ url: string; mediumUrl?: string; thumbUrl?: string; type: 'image' | 'video' } | null>(null);
  const [lightboxImageError, setLightboxImageError] = useState(false);
  const [lightboxMediumFailed, setLightboxMediumFailed] = useState(false);

  const { count, isGoing, loading: attendanceLoading, updating, setGoing, attendanceError, clearError } = useEventAttendance(id ?? undefined, user?.id ?? null);

  const isCreator = useMemo(() => event && user && event.userId === user.id, [event, user]);
  const canAccessWallAndChat = isGoing || isCreator;

  const { posts, loading: postsLoading, error: postsError, refetch: refetchPosts } = useEventPosts(canAccessWallAndChat ? id ?? null : null);
  const postIds = useMemo(() => posts.map((p) => p.id), [posts]);
  const { attachmentsByPost } = useEventPostAttachments(postIds);
  const { messages, loading: messagesLoading, sending, error: messagesError, send: sendMessage, chatOpen } = useEventMessages(
    canAccessWallAndChat ? id ?? null : null,
    event?.dateTime ?? null,
    user?.id ?? null
  );

  const [postContent, setPostContent] = useState('');
  const [postType, setPostType] = useState<EventPostType>('post');
  const [posting, setPosting] = useState(false);
  const [postImageFiles, setPostImageFiles] = useState<File[]>([]);
  const [postUploadError, setPostUploadError] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');

  const authorIds = useMemo(() => {
    const fromPosts = posts.map((p) => p.user_id);
    const fromMessages = messages.map((m) => m.user_id);
    return [...new Set([...fromPosts, ...fromMessages])];
  }, [posts, messages]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});

  useEffect(() => {
    if (authorIds.length === 0) {
      setProfiles({});
      return;
    }
    getProfilesByIds(authorIds)
      .then((list) => {
        const map: Record<string, Profile> = {};
        list.forEach((p) => { map[p.id] = p; });
        setProfiles(map);
      })
      .catch(() => setProfiles({}));
  }, [authorIds.join(',')]);

  useEffect(() => {
    if (!id || !isCreator) {
      setAttendees([]);
      return;
    }
    setAttendeesLoading(true);
    getAttendeeUserIds(id)
      .then((ids) => (ids.length === 0 ? [] : getProfilesByIds(ids)))
      .then(setAttendees)
      .catch(() => setAttendees([]))
      .finally(() => setAttendeesLoading(false));
  }, [id, isCreator]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    fetchEventById(id)
      .then(setEvent)
      .catch((e) => setError(e.message ?? 'Failed to load event'))
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
      setPostUploadError(e instanceof Error ? e.message : 'Failed to post');
    } finally {
      setPosting(false);
    }
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
    if (!chatInput.trim()) return;
    try {
      await sendMessage(chatInput.trim());
      setChatInput('');
    } catch {
      // error already in hook
    }
  };

  if (loading) return <Skeleton variant="rounded" height={300} />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!event) return <Typography>Event not found.</Typography>;

  const typeLabel = EVENT_TYPE_LABELS[event.eventType] ?? event.eventType;
  const visibilityLabel = VISIBILITY_LABELS[event.visibility];

  const infoPanel = (
    <>
      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>{event.name}</Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
            <Chip label={typeLabel} size="small" />
            <Chip label={visibilityLabel} size="small" variant="outlined" />
            {!attendanceLoading && (
              <Chip icon={<PeopleIcon />} label={`${count} going`} size="small" variant="outlined" />
            )}
          </Box>
          <Typography variant="body2" color="text.secondary">Date & time: {event.getDisplayDate()}</Typography>
          <Typography variant="body2" color="text.secondary">Location: {event.latitude.toFixed(4)}, {event.longitude.toFixed(4)}</Typography>

          <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap', gap: 1 }}>
            <Button variant="outlined" size="small" startIcon={<ShareIcon />} onClick={handleShare}>Share</Button>
            <Button variant="outlined" size="small" startIcon={<EventIcon />} href={buildGoogleCalendarUrl(event)} target="_blank" rel="noopener noreferrer">Add to calendar</Button>
            <Button variant="outlined" size="small" startIcon={<DirectionsIcon />} href={buildMapsDirectionsUrl(event.latitude, event.longitude)} target="_blank" rel="noopener noreferrer">Get directions</Button>
          </Stack>

          {isCreator && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>Attendees (only you see this list)</Typography>
              {attendeesLoading ? (
                <Skeleton variant="rounded" height={40} />
              ) : attendees.length === 0 ? (
                <Typography variant="body2" color="text.secondary">No one has marked &quot;I&apos;m going&quot; yet.</Typography>
              ) : (
                <List dense disablePadding>
                  {attendees.map((p) => (
                    <ListItem key={p.id} component={Link} to={`/profile/${p.id}`} sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar src={p.avatar_url ?? undefined} sx={{ width: 32, height: 32 }}>
                          {(p.display_name ?? p.id)?.[0]?.toUpperCase() ?? '?'}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText primary={p.display_name ?? 'User'} />
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
              <Typography variant="subtitle2" gutterBottom>Are you going?</Typography>
              <ButtonGroup size="small">
                <Button variant={isGoing ? 'contained' : 'outlined'} startIcon={<CheckCircleIcon />} onClick={() => setGoing(true)} disabled={updating}>I&apos;m going</Button>
                <Button variant={!isGoing ? 'contained' : 'outlined'} color="secondary" startIcon={<CancelIcon />} onClick={() => setGoing(false)} disabled={updating}>I&apos;m not going</Button>
              </ButtonGroup>
            </Box>
          )}
        </CardContent>
      </Card>
      <Typography variant="subtitle2" gutterBottom>Map</Typography>
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
    <Alert severity="info">Mark &quot;I&apos;m going&quot; to see the wall and post.</Alert>
  ) : (
    <Stack spacing={2}>
      {user && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle2" gutterBottom>New post</Typography>
          <TextField
            fullWidth
            multiline
            minRows={2}
            placeholder="Share an update, question, or coordination..."
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
                    Add photos (max {getMaxPhotosPerPost()})
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
                Add photos: set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET in .env and restart the dev server (npm run dev).
              </Typography>
            )}
          </Box>
          {postUploadError && <Alert severity="error" sx={{ mb: 1 }} onClose={() => setPostUploadError(null)}>{postUploadError}</Alert>}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
            <Chip label="Post" size="small" variant={postType === 'post' ? 'filled' : 'outlined'} onClick={() => setPostType('post')} />
            <Chip label="Question" size="small" variant={postType === 'question' ? 'filled' : 'outlined'} onClick={() => setPostType('question')} />
            {isCreator && (
              <Chip label="Announcement" size="small" variant={postType === 'announcement' ? 'filled' : 'outlined'} color="primary" onClick={() => setPostType('announcement')} />
            )}
            <Button
              variant="contained"
              size="small"
              onClick={handleAddPost}
              disabled={posting || (!postContent.trim() && postImageFiles.length === 0)}
            >
              Post
            </Button>
          </Box>
        </Paper>
      )}
      {postsError && <Alert severity="error">{postsError}</Alert>}
      {postsLoading ? (
        <Skeleton variant="rounded" height={120} />
      ) : posts.length === 0 ? (
        <Typography color="text.secondary">No posts yet. Start the conversation!</Typography>
      ) : (
        posts.map((p) => (
          <Card key={p.id} variant="outlined" sx={{ overflow: 'visible' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <Avatar src={profiles[p.user_id]?.avatar_url ?? undefined} sx={{ width: 40, height: 40 }}>
                  {(profiles[p.user_id]?.display_name ?? p.user_id)?.[0]?.toUpperCase() ?? '?'}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                    <Typography component={Link} to={`/profile/${p.user_id}`} variant="subtitle2" sx={{ fontWeight: 600, color: 'inherit', textDecoration: 'none' }}>
                      {profiles[p.user_id]?.display_name ?? 'User'}
                    </Typography>
                    <Chip label={p.type} size="small" variant="outlined" sx={{ textTransform: 'capitalize' }} />
                    {p.pinned && <PushPinIcon sx={{ fontSize: 14 }} color="action" />}
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                    {p.created_at ? new Date(p.created_at).toLocaleString() : ''}
                  </Typography>
                  {p.content && <Typography variant="body1" sx={{ mt: 0.5 }}>{p.content}</Typography>}
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
        slotProps={{ root: { sx: { zIndex: 9999 } } }}
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
                  Image could not be loaded.
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
    <Alert severity="info">Mark &quot;I&apos;m going&quot; to see the chat.</Alert>
  ) : (
    <Stack spacing={1} sx={{ height: 400 }}>
      {!chatOpen && (
        <Alert severity="info">
          Chat closed (opens 24h before, closes 24h after the event). Read-only below. Check the wall for memories.
        </Alert>
      )}
      {messagesError && <Alert severity="error">{messagesError}</Alert>}
      <Paper variant="outlined" sx={{ flex: 1, overflow: 'auto', p: 1 }}>
        {messagesLoading ? (
          <Skeleton variant="rounded" height={200} />
        ) : messages.length === 0 ? (
          <Typography color="text.secondary">{chatOpen ? 'No messages yet. Say hi!' : 'No messages.'}</Typography>
        ) : (
          messages.map((m) => (
            <Box key={m.id} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'flex-start' }}>
              <Avatar src={profiles[m.user_id]?.avatar_url ?? undefined} sx={{ width: 28, height: 28 }}>
                {(profiles[m.user_id]?.display_name ?? m.user_id)?.[0]?.toUpperCase() ?? '?'}
              </Avatar>
              <Box>
                <Typography component={Link} to={`/profile/${m.user_id}`} variant="caption" sx={{ fontWeight: 600, color: 'inherit', textDecoration: 'none' }}>
                  {profiles[m.user_id]?.display_name ?? 'User'}
                </Typography>
                <Typography variant="body2" display="block">{m.body}</Typography>
                <Typography variant="caption" color="text.secondary">{m.created_at ? new Date(m.created_at).toLocaleTimeString() : ''}</Typography>
              </Box>
            </Box>
          ))
        )}
      </Paper>
      {chatOpen && (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Message..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
          />
          <IconButton color="primary" onClick={handleSendMessage} disabled={sending || !chatInput.trim()}>
            <SendIcon />
          </IconButton>
        </Box>
      )}
    </Stack>
  );

  return (
    <Box>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>Back</Button>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Info" icon={<InfoIcon />} iconPosition="start" />
        <Tab label="Wall" icon={<ArticleIcon />} iconPosition="start" />
        <Tab label="Chat" icon={<ChatIcon />} iconPosition="start" />
      </Tabs>
      {tab === 0 && infoPanel}
      {tab === 1 && wallPanel}
      {tab === 2 && chatPanel}
    </Box>
  );
}
