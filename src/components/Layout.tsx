import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { AppBar, Toolbar, Button, Typography, Box } from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import MapIcon from '@mui/icons-material/Map';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import PersonIcon from '@mui/icons-material/Person';
import GroupIcon from '@mui/icons-material/Group';
import LoginIcon from '@mui/icons-material/Login';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../hooks/useAuth';
import { signOut } from '../services/authService';
import { SetupBanner } from './SetupBanner';

const navLinkStyle = { color: 'white', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 0.5 };

export function Layout() {
  const { user } = useAuth();
  const location = useLocation();

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <SetupBanner />
      <AppBar position="static">
        <Toolbar sx={{ gap: 1, flexWrap: 'wrap' }}>
          <Button component={NavLink} to="/" startIcon={<EventIcon />} sx={navLinkStyle} variant={location.pathname === '/' ? 'outlined' : 'text'}>
            Events
          </Button>
          <Button component={NavLink} to="/map" startIcon={<MapIcon />} sx={navLinkStyle} variant={location.pathname.startsWith('/map') ? 'outlined' : 'text'}>
            Map
          </Button>
          {user ? (
            <>
              <Button component={NavLink} to="/create" startIcon={<AddCircleOutlineIcon />} sx={navLinkStyle} variant={location.pathname === '/create' ? 'outlined' : 'text'}>
                Create event
              </Button>
              <Button component={NavLink} to="/profile/me" startIcon={<PersonIcon />} sx={navLinkStyle} variant={location.pathname.startsWith('/profile') ? 'outlined' : 'text'}>
                Profile
              </Button>
              <Button component={NavLink} to="/friends" startIcon={<GroupIcon />} sx={navLinkStyle} variant={location.pathname === '/friends' ? 'outlined' : 'text'}>
                Friends
              </Button>
              <Typography variant="body2" sx={{ marginLeft: 'auto', opacity: 0.9 }}>{user.email}</Typography>
              <Button startIcon={<LogoutIcon />} onClick={() => signOut()} sx={navLinkStyle}>
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Button component={NavLink} to="/login" startIcon={<LoginIcon />} sx={{ ...navLinkStyle, marginLeft: 'auto' }} variant={location.pathname === '/login' ? 'outlined' : 'text'}>
                Log in
              </Button>
              <Button component={NavLink} to="/signup" startIcon={<PersonAddIcon />} sx={navLinkStyle} variant={location.pathname === '/signup' ? 'outlined' : 'text'}>
                Sign up
              </Button>
            </>
          )}
        </Toolbar>
      </AppBar>
      <Box component="main" sx={{ flex: 1, p: 2 }}>
        <Outlet />
      </Box>
    </Box>
  );
}
