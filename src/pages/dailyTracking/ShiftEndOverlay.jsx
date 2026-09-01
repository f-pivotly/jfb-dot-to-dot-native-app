import { Box, Text, Button, UnstyledButton } from '@mantine/core'
import TimeStepper from './TimeStepper'
import { COLORS, FONT_FAMILY } from '../../theme'

export default function ShiftEndOverlay({ opened, shiftEndTime, onChangeShiftEndTime, onConfirm }) {
  if (!opened) return null
  return (
    <Box style={{ position: 'fixed', inset: 0, background: COLORS.shiftEndBg, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <Box style={{ maxWidth: 380, width: '100%', textAlign: 'center', fontFamily: FONT_FAMILY }}>
        <Text c="#fff" fw={800} size="xl" mb={6}>What time did the shift end?</Text>
        <Text c="rgba(255,255,255,0.6)" size="sm" mb={28}>Include ride back to shore — remaining time logs as Startup/Shutdown</Text>
        <TimeStepper hours={shiftEndTime.hours} minutes={shiftEndTime.minutes} onChange={onChangeShiftEndTime} />
        <Button fullWidth size="lg" mt={24} style={{ background: COLORS.shiftEndAccent }} onClick={onConfirm}>
          Confirm Shift End →
        </Button>
        <UnstyledButton mt={12} onClick={onConfirm} style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
          Skip — use current time
        </UnstyledButton>
      </Box>
    </Box>
  )
}
