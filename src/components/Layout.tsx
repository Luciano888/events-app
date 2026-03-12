import { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  useTheme,
  Tooltip,
  Menu,
  MenuItem,
  Fab,
} from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import AddIcon from '@mui/icons-material/Add';
import PersonIcon from '@mui/icons-material/Person';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LoginIcon from '@mui/icons-material/Login';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../hooks/useAuth';
import { signOut } from '../services/authService';
import { SetupBanner } from './SetupBanner';

const iconStyle = { color: 'white' };

export function Layout() {
  const { user } = useAuth();
  const location = useLocation();
  const theme = useTheme();
  const [accountAnchor, setAccountAnchor] = useState<null | HTMLElement>(null);

  const isEvents = location.pathname === '/';
  const isProfile = location.pathname.startsWith('/profile');

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <SetupBanner />
      <AppBar position="static">
        <Toolbar sx={{ justifyContent: 'center', gap: 0 }}>
          <Box sx={{ flex: 1, minWidth: 0 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Tooltip title="Events">
              <IconButton
                component={NavLink}
                to="/"
                aria-label="Events"
                sx={{
                  ...iconStyle,
                  ...(isEvents ? { bgcolor: 'rgba(255,255,255,0.2)' } : {}),
                }}
              >
                <EventIcon />
              </IconButton>
            </Tooltip>
            {user ? (
              <>
                <Tooltip title="Profile">
                  <IconButton
                    component={NavLink}
                    to="/profile/me"
                    aria-label="Profile"
                    sx={{
                      ...iconStyle,
                      ...(isProfile ? { bgcolor: 'rgba(255,255,255,0.2)' } : {}),
                    }}
                  >
                    <PersonIcon />
                  </IconButton>
                </Tooltip>
              </>
            ) : null}
          </Box>
          <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end', minWidth: 0 }}>
          {user ? (
            <>
              <Tooltip title="Account">
                <IconButton
                  aria-label="Account"
                  onClick={(e) => setAccountAnchor(e.currentTarget)}
                  sx={iconStyle}
                >
                  <AccountCircleIcon />
                </IconButton>
              </Tooltip>
              <Menu
                anchorEl={accountAnchor}
                open={Boolean(accountAnchor)}
                onClose={() => setAccountAnchor(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              >
                <MenuItem disabled>
                  <Typography variant="body2" color="text.secondary">{user?.email}</Typography>
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    setAccountAnchor(null);
                    signOut();
                  }}
                >
                  <LogoutIcon sx={{ mr: 1, fontSize: 20 }} /> Sign out
                </MenuItem>
              </Menu>
            </>
          ) : (
            <>
              <Tooltip title="Log in">
                <IconButton
                  component={NavLink}
                  to="/login"
                  aria-label="Log in"
                  sx={{ ...iconStyle, ...(location.pathname === '/login' ? { bgcolor: 'rgba(255,255,255,0.2)' } : {}) }}
                >
                  <LoginIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Sign up">
                <IconButton
                  component={NavLink}
                  to="/signup"
                  aria-label="Sign up"
                  sx={{ ...iconStyle, ...(location.pathname === '/signup' ? { bgcolor: 'rgba(255,255,255,0.2)' } : {}) }}
                >
                  <PersonAddIcon />
                </IconButton>
              </Tooltip>
            </>
          )}
          </Box>
        </Toolbar>
      </AppBar>
      <Box component="main" sx={{ flex: 1, p: 2 }}>
        <Box sx={{ maxWidth: theme.layout.contentMaxWidth, mx: 'auto', width: '100%' }}>
          <Outlet />
        </Box>
      </Box>
      {user && (
        <Tooltip title="Create event">
          <Fab
            color="primary"
            aria-label="Create event"
            component={NavLink}
            to="/create"
            sx={{
              position: 'fixed',
              bottom: 16,
              right: 16,
              zIndex: theme.zIndex.speedDial,
            }}
          >
            <AddIcon />
          </Fab>
        </Tooltip>
      )}
    </Box>
  );
}
