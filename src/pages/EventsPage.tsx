import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Box, Tabs, Tab, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material';
import ListIcon from '@mui/icons-material/List';
import MapIcon from '@mui/icons-material/Map';
import { useTranslation } from 'react-i18next';
import { HomePage } from './HomePage';
import { MapPage } from './MapPage';

const EVENTS_ONBOARDING_KEY = 'imgoing_events_onboarding_v1';

type ViewTab = 'list' | 'map';

export function EventsPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const view = (searchParams.get('view') as ViewTab) || 'list';
  const validView = view === 'map' ? 'map' : 'list';
  const [onboardingOpen, setOnboardingOpen] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(EVENTS_ONBOARDING_KEY)) {
        setOnboardingOpen(true);
      }
    } catch {
      setOnboardingOpen(true);
    }
  }, []);

  const dismissOnboarding = () => {
    try {
      localStorage.setItem(EVENTS_ONBOARDING_KEY, '1');
    } catch {
      /* ignore */
    }
    setOnboardingOpen(false);
  };

  const handleTabChange = (_: React.SyntheticEvent, value: ViewTab) => {
    setSearchParams(value === 'list' ? {} : { view: 'map' });
  };

  return (
    <Box>
      <Dialog open={onboardingOpen} onClose={dismissOnboarding} aria-labelledby="events-onboarding-title">
        <DialogTitle id="events-onboarding-title">{t('events.onboardingTitle')}</DialogTitle>
        <DialogContent>
          <DialogContentText component="div">{t('events.onboardingBody')}</DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={dismissOnboarding} variant="contained" color="primary">
            {t('events.onboardingGotIt')}
          </Button>
        </DialogActions>
      </Dialog>
      <Tabs
        value={validView}
        onChange={handleTabChange}
        sx={{
          mb: 2,
          '& .MuiTab-root': { minHeight: { xs: 48, sm: 48 } },
          '& .MuiTab-label': { display: { xs: 'none', sm: 'inline' } },
          '& .MuiTab-iconWrapper': { marginRight: { xs: 0, sm: 1 } },
        }}
      >
        <Tab value="list" icon={<ListIcon />} iconPosition="start" label={t('events.list')} aria-label={t('events.list')} />
        <Tab value="map" icon={<MapIcon />} iconPosition="start" label={t('events.map')} aria-label={t('events.map')} />
      </Tabs>
      {validView === 'list' && <HomePage />}
      {validView === 'map' && <MapPage />}
    </Box>
  );
}
