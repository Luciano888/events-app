import { Box } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';

const URL_REGEX = /(https?:\/\/[^\s]+)/g;

const DEFAULT_LINK_SX: SxProps<Theme> = {
  color: 'primary.main',
  wordBreak: 'break-all',
};

/**
 * Splits text on URLs and renders links. Pass linkSx for contrast on colored bubbles.
 */
export function renderTextWithLinks(text: string, linkSx?: SxProps<Theme>) {
  const parts = text.split(URL_REGEX);
  const sx = linkSx ?? DEFAULT_LINK_SX;
  return parts.map((part, idx) => {
    if (part.startsWith('http://') || part.startsWith('https://')) {
      return (
        <Box
          component="a"
          key={`${part}-${idx}`}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          sx={sx}
        >
          {part}
        </Box>
      );
    }
    return <span key={`${part}-${idx}`}>{part}</span>;
  });
}
