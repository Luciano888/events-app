import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  Skeleton,
  Avatar,
  Stack,
  Card,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Tabs,
  Tab,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import PersonIcon from '@mui/icons-material/Person';
import SendIcon from '@mui/icons-material/Send';
import GroupIcon from '@mui/icons-material/Group';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  getPendingReceived,
  getPendingSent,
  getFriends,
  acceptFriendRequest,
  rejectFriendRequest,
  cancelSentRequest,
} from '../services/friendService';
import { getProfile } from '../services/profileService';
import { useSnackbar } from '../contexts/SnackbarContext';
import type { FriendRequestRow } from '../models/FriendRequest';
import type { Profile } from '../models/Profile';

type TabValue = 'received' | 'sent' | 'connections';

export function FriendRequestsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<TabValue>('received');
  const [received, setReceived] = useState<(FriendRequestRow & { profile?: Profile | null })[]>([]);
  const [sent, setSent] = useState<(FriendRequestRow & { profile?: Profile | null })[]>([]);
  const [friends, setFriends] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showMessage } = useSnackbar();

  const loadReceived = useCallback(async () => {
    if (!user) return [];
    const list = await getPendingReceived(user.id);
    return Promise.all(
      list.map(async (r) => {
        const profile = await getProfile(r.from_user_id);
        return { ...r, profile };
      })
    );
  }, [user?.id]);

  const loadSent = useCallback(async () => {
    if (!user) return [];
    const list = await getPendingSent(user.id);
    return Promise.all(
      list.map(async (r) => {
        const profile = await getProfile(r.to_user_id);
        return { ...r, profile };
      })
    );
  }, [user?.id]);

  const loadFriends = useCallback(async () => {
    if (!user) return [];
    return getFriends(user.id);
  }, [user?.id]);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const [receivedList, sentList, friendsList] = await Promise.all([
        loadReceived(),
        loadSent(),
        loadFriends(),
      ]);
      setReceived(receivedList);
      setSent(sentList);
      setFriends(friendsList);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [user?.id, loadReceived, loadSent, loadFriends]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAccept(requestId: string) {
    if (!user) return;
    try {
      await acceptFriendRequest(requestId, user.id);
      setReceived((prev) => prev.filter((r) => r.id !== requestId));
      setFriends((prev) => [...prev]); // could refetch to add new friend
      load(); // refresh friends count
      showMessage('Request accepted', 'success');
    } catch (e) {
      showMessage(e instanceof Error ? e.message : 'Failed to accept', 'error');
    }
  }

  async function handleReject(requestId: string) {
    if (!user) return;
    try {
      await rejectFriendRequest(requestId, user.id);
      setReceived((prev) => prev.filter((r) => r.id !== requestId));
      showMessage('Request rejected', 'info');
    } catch (e) {
      showMessage(e instanceof Error ? e.message : 'Failed to reject', 'error');
    }
  }

  async function handleCancelSent(requestId: string) {
    if (!user) return;
    try {
      await cancelSentRequest(requestId, user.id);
      setSent((prev) => prev.filter((r) => r.id !== requestId));
      showMessage('Request cancelled', 'info');
    } catch (e) {
      showMessage(e instanceof Error ? e.message : 'Failed to cancel', 'error');
    }
  }

  if (!user) {
    return (
      <Box>
        <Typography variant="h5" gutterBottom>Friends</Typography>
        <Alert severity="info">Sign in to see connection requests and your connections.</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Friends</Typography>
      <Tabs value={tab} onChange={(_, v) => setTab(v as TabValue)} sx={{ mb: 2 }}>
        <Tab label="Received" value="received" icon={<PersonIcon />} iconPosition="start" />
        <Tab label="Sent" value="sent" icon={<SendIcon />} iconPosition="start" />
        <Tab label="Connections" value="connections" icon={<GroupIcon />} iconPosition="start" />
      </Tabs>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Stack spacing={1}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rounded" height={72} />
          ))}
        </Stack>
      ) : tab === 'received' ? (
        received.length === 0 ? (
          <Typography color="text.secondary">No pending requests.</Typography>
        ) : (
          <List>
            {received.map((r) => (
              <Card key={r.id} variant="outlined" sx={{ mb: 1 }}>
                <ListItem
                  component={Link}
                  to={`/profile/${r.from_user_id}`}
                  sx={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <ListItemAvatar>
                    <Avatar src={r.profile?.avatar_url ?? undefined}>
                      {(r.profile?.display_name ?? r.from_user_id)?.[0]?.toUpperCase() ?? '?'}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={r.profile?.display_name ?? 'User'}
                    secondary="Wants to connect"
                  />
                  <ListItemSecondaryAction onClick={(e) => e.stopPropagation()} sx={{ right: 8 }}>
                    <Button size="small" startIcon={<CheckCircleIcon />} color="primary" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleAccept(r.id); }}>
                      Accept
                    </Button>
                    <Button size="small" startIcon={<CancelIcon />} onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleReject(r.id); }}>
                      Reject
                    </Button>
                  </ListItemSecondaryAction>
                </ListItem>
              </Card>
            ))}
          </List>
        )
      ) : tab === 'sent' ? (
        sent.length === 0 ? (
          <Typography color="text.secondary">No pending sent requests.</Typography>
        ) : (
          <List>
            {sent.map((r) => (
              <Card key={r.id} variant="outlined" sx={{ mb: 1 }}>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar
                      component={Link}
                      to={`/profile/${r.to_user_id}`}
                      src={r.profile?.avatar_url ?? undefined}
                      sx={{ textDecoration: 'none' }}
                    >
                      {(r.profile?.display_name ?? r.to_user_id)?.[0]?.toUpperCase() ?? '?'}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography component={Link} to={`/profile/${r.to_user_id}`} color="inherit" sx={{ textDecoration: 'none', fontWeight: 500 }}>
                        {r.profile?.display_name ?? 'User'}
                      </Typography>
                    }
                    secondary="Request sent"
                  />
                  <ListItemSecondaryAction>
                    <Button size="small" startIcon={<CancelIcon />} onClick={() => handleCancelSent(r.id)}>
                      Cancel
                    </Button>
                  </ListItemSecondaryAction>
                </ListItem>
              </Card>
            ))}
          </List>
        )
      ) : (
        friends.length === 0 ? (
          <Typography color="text.secondary">No connections yet. Send or accept requests to connect.</Typography>
        ) : (
          <List>
            {friends.map((p) => (
              <Card key={p.id} variant="outlined" sx={{ mb: 1 }}>
                <ListItem component={Link} to={`/profile/${p.id}`} sx={{ textDecoration: 'none', color: 'inherit' }}>
                  <ListItemAvatar>
                    <Avatar src={p.avatar_url ?? undefined}>
                      {(p.display_name ?? p.id)?.[0]?.toUpperCase() ?? '?'}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText primary={p.display_name ?? 'User'} secondary="Connected" />
                </ListItem>
              </Card>
            ))}
          </List>
        )
      )}
    </Box>
  );
}
