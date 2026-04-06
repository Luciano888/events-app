import { useState } from 'react';
import {
  TextField,
  InputAdornment,
  IconButton,
  type TextFieldProps,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useTranslation } from 'react-i18next';

type Props = Omit<TextFieldProps, 'type'> & {
  /** e.g. "current-password", "new-password" */
  autoComplete?: string;
};

export function PasswordTextField({
  autoComplete = 'current-password',
  InputProps,
  ...props
}: Props) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  return (
    <TextField
      type={visible ? 'text' : 'password'}
      autoComplete={autoComplete}
      {...props}
      InputProps={{
        ...InputProps,
        endAdornment: (
          <InputAdornment position="end">
            <IconButton
              aria-label={visible ? t('auth.hidePassword') : t('auth.showPassword')}
              onClick={() => setVisible((v) => !v)}
              edge="end"
            >
              {visible ? <VisibilityOff /> : <Visibility />}
            </IconButton>
          </InputAdornment>
        ),
      }}
    />
  );
}
