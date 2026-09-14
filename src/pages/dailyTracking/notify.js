import { notifications } from '@mantine/notifications'
import { COLORS } from '../../theme'

const TONES = {
  success: { color: COLORS.secondaryGreen, autoClose: 2500 },
  info: { color: COLORS.primaryBlue, autoClose: 2500 },
  warning: { color: COLORS.warningBorder, autoClose: 6000 },
  error: { color: COLORS.accentRed, autoClose: 8000 },
}

function show(tone, message, detail) {
  const { color, autoClose } = TONES[tone] ?? TONES.info
  notifications.show({
    message,
    color,
    autoClose,
    withCloseButton: tone === 'warning' || tone === 'error',
    styles: {
      root: { borderLeft: `6px solid ${color}` },
      description: { fontSize: 14, fontWeight: 600 },
    },
    ...(detail ? { title: message, message: detail } : {}),
  })
}

export const notifySuccess = (message, detail) => show('success', message, detail)
export const notifyInfo = (message, detail) => show('info', message, detail)
export const notifyWarning = (message, detail) => show('warning', message, detail)
export const notifyError = (message, detail) => show('error', message, detail)
