import { useSearchParams } from 'react-router-dom';
import { Box, Tabs, Tab } from '@mui/material';
import ListIcon from '@mui/icons-material/List';
import MapIcon from '@mui/icons-material/Map';
import { HomePage } from './HomePage';
import { MapPage } from './MapPage';

type ViewTab = 'list' | 'map';

export function EventsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const view = (searchParams.get('view') as ViewTab) || 'list';
  const validView = view === 'map' ? 'map' : 'list';

  const handleTabChange = (_: React.SyntheticEvent, value: ViewTab) => {
    setSearchParams(value === 'list' ? {} : { view: 'map' });
  };

  return (
    <Box>
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
        <Tab value="list" icon={<ListIcon />} iconPosition="start" label="List" aria-label="Event list" />
        <Tab value="map" icon={<MapIcon />} iconPosition="start" label="Map" aria-label="Event map" />
      </Tabs>
      {validView === 'list' && <HomePage />}
      {validView === 'map' && <MapPage />}
    </Box>
  );
}
