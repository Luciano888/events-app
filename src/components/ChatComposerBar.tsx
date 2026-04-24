import { useCallback, useEffect, useId, useRef, useState, type ChangeEvent } from 'react';
import {
  Box,
  IconButton,
  Popover,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import AddPhotoAlternateOutlinedIcon from '@mui/icons-material/AddPhotoAlternateOutlined';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import SentimentSatisfiedAltOutlinedIcon from '@mui/icons-material/SentimentSatisfiedAltOutlined';
import { useTranslation } from 'react-i18next';

const QUICK_EMOJIS = [
  '😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😍',
  '🥰', '😘', '😋', '😛', '🤔', '😮', '😢', '😭', '😤', '🙏', '👍', '👎',
  '👏', '🙌', '🔥', '✨', '💯', '❤️', '🧡', '💛', '💚', '💙', '💜', '🎉',
];

type ChatComposerBarProps = {
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onAppendText: (fragment: string) => void;
  onSend: () => void;
  sending: boolean;
  canUploadImage: boolean;
  hasImage: boolean;
  imagePreviewUrl: string | null;
  onImageFileChange: (file: File | null) => void;
};

export function ChatComposerBar({
  value,
  onChange,
  onAppendText,
  onSend,
  sending,
  canUploadImage,
  hasImage,
  imagePreviewUrl,
  onImageFileChange,
}: ChatComposerBarProps) {
  const { t } = useTranslation();
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [emojiAnchor, setEmojiAnchor] = useState<HTMLElement | null>(null);

  const clearAttachedFileInput = useCallback(() => {
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  useEffect(() => {
    if (!hasImage) clearAttachedFileInput();
  }, [hasImage, clearAttachedFileInput]);

  const canSend = value.trim().length > 0 || hasImage;
  const closeEmoji = useCallback(() => setEmojiAnchor(null), []);

  return (
    <Box
      sx={{
        flexShrink: 0,
        borderTop: '1px solid',
        borderColor: (theme) => alpha(theme.palette.divider, theme.palette.mode === 'dark' ? 0.18 : 0.1),
        bgcolor: 'inherit',
        px: 0.5,
        py: 0.5,
      }}
    >
      {canUploadImage && hasImage && imagePreviewUrl && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5, pl: 0.25 }}>
          <Box
            component="img"
            src={imagePreviewUrl}
            alt=""
            sx={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 1 }}
          />
          <IconButton
            size="small"
            aria-label={t('events.chatRemoveImageAria')}
            onClick={() => {
              clearAttachedFileInput();
              onImageFileChange(null);
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      )}
      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.25 }}>
        {canUploadImage && (
          <>
            <input
              ref={fileInputRef}
              accept="image/*"
              type="file"
              id={inputId}
              hidden
              onChange={(e) => onImageFileChange(e.target.files?.[0] ?? null)}
            />
            <Tooltip title={t('events.addImage')}>
              <label htmlFor={inputId}>
                <IconButton
                  component="span"
                  size="small"
                  color="inherit"
                  aria-label={t('events.chatAttachAria')}
                >
                  <AddPhotoAlternateOutlinedIcon fontSize="small" />
                </IconButton>
              </label>
            </Tooltip>
          </>
        )}
        <TextField
          fullWidth
          multiline
          maxRows={5}
          minRows={1}
          size="small"
          variant="filled"
          hiddenLabel
          placeholder={t('events.messagePlaceholder')}
          value={value}
          onChange={onChange}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (!sending && canSend) onSend();
            }
          }}
          InputProps={{ disableUnderline: true }}
          sx={{
            flex: 1,
            minWidth: 0,
            '& .MuiFilledInput-root': {
              borderRadius: 2,
              bgcolor: (theme) =>
                theme.palette.mode === 'dark' ? 'grey.800' : 'grey.200',
              fontSize: '0.9375rem',
              py: 0.5,
              '&:hover': {
                bgcolor: (theme) =>
                  theme.palette.mode === 'dark' ? 'grey.700' : 'grey.300',
              },
              '&.Mui-focused': {
                bgcolor: (theme) =>
                  theme.palette.mode === 'dark' ? 'grey.800' : 'grey.200',
              },
            },
          }}
        />
        <Tooltip title={t('events.chatEmojiAria')}>
          <IconButton
            size="small"
            color="inherit"
            aria-label={t('events.chatEmojiAria')}
            aria-haspopup="true"
            aria-expanded={Boolean(emojiAnchor)}
            onClick={(e) => setEmojiAnchor(e.currentTarget)}
          >
            <SentimentSatisfiedAltOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <IconButton
          color="primary"
          onClick={onSend}
          disabled={sending || !canSend}
          aria-label={t('events.sendMessageAria')}
        >
          <SendIcon />
        </IconButton>
      </Box>
      <Popover
        open={Boolean(emojiAnchor)}
        anchorEl={emojiAnchor}
        onClose={closeEmoji}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        slotProps={{ paper: { sx: { p: 1, maxWidth: 280 } } }}
      >
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.25, justifyContent: 'center' }}>
          {QUICK_EMOJIS.map((emoji) => (
            <Typography
              key={emoji}
              component="button"
              type="button"
              onClick={() => {
                onAppendText(emoji);
                closeEmoji();
              }}
              sx={{
                fontSize: '1.35rem',
                lineHeight: 1,
                p: 0.5,
                border: 0,
                bgcolor: 'transparent',
                cursor: 'pointer',
                borderRadius: 1,
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              {emoji}
            </Typography>
          ))}
        </Box>
      </Popover>
    </Box>
  );
}
