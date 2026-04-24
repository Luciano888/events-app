import { useState, useEffect, type ReactNode } from 'react';
import { Stack, Box, Typography, Skeleton, Alert } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { EventMessageRow } from '../models/EventMessage';
import type { Profile } from '../models/Profile';
import { EventChatMessageList } from './EventChatMessageList';
import { ChatComposerBar } from './ChatComposerBar';
import { chatTraySurfaceSx } from '../utils/chatTrayTheme';
import { uploadImage, isUploadConfigured, getThumbnailUrl } from '../services/cloudinaryService';

export type ChatImageLightboxPayload = {
  url: string;
  mediumUrl?: string;
  thumbUrl?: string;
  type: 'image' | 'video';
};

export type EventChatTrayPanelProps = {
  canAccessWallAndChat: boolean;
  /** Whether the event chat window is still open by policy (24h rule). */
  chatTimeOpen: boolean;
  messages: EventMessageRow[];
  messagesLoading: boolean;
  messagesError: string | null;
  sending: boolean;
  sendMessage: (
    body: string,
    options?: { imageCloudinaryPublicId?: string; imageThumbnailUrl?: string | null }
  ) => Promise<void>;
  profiles: Record<string, Profile>;
  currentUserId: string | null;
  locale: string;
  /** Shown when `canAccessWallAndChat` is false (e.g. RSVP CTA). */
  lockedSlot: ReactNode;
  onImageClick: (payload: ChatImageLightboxPayload) => void;
  /** Called after a message is sent successfully (e.g. refresh inbox previews). */
  onMessageSent?: () => void;
};

export function EventChatTrayPanel({
  canAccessWallAndChat,
  chatTimeOpen,
  messages,
  messagesLoading,
  messagesError,
  sending,
  sendMessage,
  profiles,
  currentUserId,
  locale,
  lockedSlot,
  onImageClick,
  onMessageSent,
}: EventChatTrayPanelProps) {
  const { t } = useTranslation();
  const [chatInput, setChatInput] = useState('');
  const [chatImageFile, setChatImageFile] = useState<File | null>(null);
  const [chatImagePreviewUrl, setChatImagePreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!chatImageFile) {
      setChatImagePreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(chatImageFile);
    setChatImagePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [chatImageFile]);

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
      onMessageSent?.();
    } catch {
      // error surfaced by hook
    }
  };

  if (!canAccessWallAndChat) {
    return (
      <Stack spacing={2} sx={{ flex: '1 0 0%', minHeight: 0, justifyContent: 'center' }}>
        {lockedSlot}
      </Stack>
    );
  }

  return (
    <Stack
      spacing={1}
      sx={{
        flex: '1 0 0%',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {!chatTimeOpen && (
        <Alert severity="info">
          {t('events.chatClosed')}
        </Alert>
      )}
      {messagesError && <Alert severity="error">{messagesError}</Alert>}
      <Box
        sx={{
          flex: '1 0 0%',
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          ...chatTraySurfaceSx,
        }}
      >
        <Box sx={{ flex: '1 0 0%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          {messagesLoading ? (
            <Skeleton variant="rounded" height={200} sx={{ flex: '1 0 0%', minHeight: 120 }} />
          ) : messages.length === 0 ? (
            <Box
              sx={{
                flex: 1,
                minHeight: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                px: 1,
                py: 2,
              }}
            >
              <Typography color="text.secondary" align="center">
                {chatTimeOpen ? t('events.noMessagesOpen') : t('events.noMessages')}
              </Typography>
            </Box>
          ) : (
            <EventChatMessageList
              messages={messages}
              profiles={profiles}
              currentUserId={currentUserId}
              locale={locale}
              sending={sending}
              onImageClick={onImageClick}
            />
          )}
        </Box>
        {chatTimeOpen && (
          <ChatComposerBar
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onAppendText={(fragment) => setChatInput((c) => c + fragment)}
            onSend={handleSendMessage}
            sending={sending}
            canUploadImage={isUploadConfigured()}
            hasImage={Boolean(chatImageFile)}
            imagePreviewUrl={chatImagePreviewUrl}
            onImageFileChange={setChatImageFile}
          />
        )}
      </Box>
    </Stack>
  );
}
