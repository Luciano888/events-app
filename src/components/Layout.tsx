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
import TranslateIcon from '@mui/icons-material/Translate';
import ChatIcon from '@mui/icons-material/Chat';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { signOut } from '../services/authService';
import { SetupBanner } from './SetupBanner';

const iconStyle = { color: 'white' };

export function Layout() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const location = useLocation();
  const theme = useTheme();
  const [accountAnchor, setAccountAnchor] = useState<null | HTMLElement>(null);

  const isEvents = location.pathname === '/';
  const isProfile = location.pathname.startsWith('/profile');
  const isMessages =
    location.pathname === '/messages' || location.pathname.startsWith('/messages/');

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <SetupBanner />
      <AppBar position="static">
        <Toolbar sx={{ justifyContent: 'center', gap: 0 }}>
          <Box sx={{ flex: 1, minWidth: 0 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Tooltip title={t('nav.events')}>
              <IconButton
                component={NavLink}
                to="/"
                aria-label={t('nav.events')}
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
                <Tooltip title={t('nav.messages')}>
                  <IconButton
                    component={NavLink}
                    to="/messages"
                    aria-label={t('nav.messages')}
                    sx={{
                      ...iconStyle,
                      ...(isMessages ? { bgcolor: 'rgba(255,255,255,0.2)' } : {}),
                    }}
                  >
                    <ChatIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title={t('nav.profile')}>
                  <IconButton
                    component={NavLink}
                    to="/profile/me"
                    aria-label={t('nav.profile')}
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
          <Tooltip title={`${t('nav.language')}: ${i18n.language?.startsWith('es') ? t('nav.english') : t('nav.spanish')}`}>
            <IconButton
              aria-label={t('nav.language')}
              onClick={() => void i18n.changeLanguage(i18n.language?.startsWith('es') ? 'en' : 'es')}
              sx={iconStyle}
            >
              <TranslateIcon />
            </IconButton>
          </Tooltip>
          {user ? (
            <>
              <Tooltip title={t('nav.account')}>
                <IconButton
                  aria-label={t('nav.account')}
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
                  <LogoutIcon sx={{ mr: 1, fontSize: 20 }} /> {t('nav.logout')}
                </MenuItem>
              </Menu>
            </>
          ) : (
            <>
              <Tooltip title={t('nav.login')}>
                <IconButton
                  component={NavLink}
                  to="/login"
                  aria-label={t('nav.login')}
                  sx={{ ...iconStyle, ...(location.pathname === '/login' ? { bgcolor: 'rgba(255,255,255,0.2)' } : {}) }}
                >
                  <LoginIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title={t('nav.signup')}>
                <IconButton
                  component={NavLink}
                  to="/signup"
                  aria-label={t('nav.signup')}
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
      <Box
        component="main"
        sx={{
          flex: 1,
          py: 2,
          px: isMessages ? { xs: 1, sm: 2 } : 2,
          display: isMessages ? 'flex' : 'block',
          flexDirection: isMessages ? 'column' : undefined,
          minHeight: isMessages
            ? { xs: 'calc(100dvh - 56px)', sm: 'calc(100dvh - 64px)' }
            : undefined,
        }}
      >
        <Box
          sx={{
            maxWidth: isMessages ? theme.layout.messagesMaxWidth : theme.layout.contentMaxWidth,
            mx: 'auto',
            width: '100%',
            flex: isMessages ? 1 : undefined,
            minHeight: isMessages ? 0 : undefined,
            height: isMessages ? '100%' : undefined,
            display: isMessages ? 'flex' : undefined,
            flexDirection: isMessages ? 'column' : undefined,
          }}
        >
          <Outlet />
        </Box>
      </Box>
      {user && (
        <Tooltip title={t('nav.createEvent')}>
          <Fab
            color="primary"
            aria-label={t('nav.createEvent')}
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
