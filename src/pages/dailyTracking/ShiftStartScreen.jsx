import { Box, Text, Button, UnstyledButton, Image, ScrollArea } from '@mantine/core'
import TimeStepper from './TimeStepper'
import { COLORS, FONT_FAMILY } from '../../theme'
import brennanLogo from './assets/brennan-logo.png'

export default function ShiftStartScreen({ operator, equipment, shiftTime, onChangeShiftTime, onConfirm, onSkip }) {
  return (
    <ScrollArea style={{ flex: 1, minHeight: 0, background: COLORS.primaryBlue }}>
      <Box p={32} style={{ maxWidth: 460, margin: '0 auto', textAlign: 'center', fontFamily: FONT_FAMILY }}>
        <Image src={brennanLogo} h={48} fit="contain" mx="auto" mb={20} />
        <Text c="#fff" fw={800} size="xl" mb={6}>What time did the shift start?</Text>
        <Text c="rgba(255,255,255,0.6)" size="sm" mb={8}>Include safety meeting time — all pre-dredge time logs as Startup/Shutdown</Text>
        <Text c="rgba(255,255,255,0.5)" size="xs" mb={28}>Operator: {operator} · {equipment}</Text>
        <TimeStepper hours={shiftTime.hours} minutes={shiftTime.minutes} onChange={onChangeShiftTime} />
        <Button fullWidth size="lg" mt={24} style={{ background: COLORS.secondaryGreen }} onClick={onConfirm}>
          Confirm Shift Start →
        </Button>
        <UnstyledButton mt={12} onClick={onSkip} style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
          Skip — start from now
        </UnstyledButton>
      </Box>
    </ScrollArea>
  )
}
