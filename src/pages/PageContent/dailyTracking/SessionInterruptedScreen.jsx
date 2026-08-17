import { Box, Text, Button, UnstyledButton, Badge, ScrollArea } from '@mantine/core'
import TimeStepper from './TimeStepper'
import { COLORS, FONT_FAMILY } from '../../../theme'
import { activeTileLabel, groupColor, formatTimeOfDay } from './dailyTrackingFormat'

export default function SessionInterruptedScreen({
  projectsLoading, recoveredProject, recoveryData, now,
  recoveryEndTime, onChangeRecoveryEndTime, onSave, onDiscard,
}) {
  if (!recoveredProject) {
    return (
      <ScrollArea style={{ flex: 1, minHeight: 0, background: COLORS.recoveryBg }}>
        <Box p={32} style={{ maxWidth: 460, margin: '0 auto', textAlign: 'center', fontFamily: FONT_FAMILY }}>
          <Text c="#fff" fw={800} size="xl" mb={6}>Session interrupted</Text>
          <Text c="rgba(255,255,255,0.55)" size="sm" mb={20}>
            {projectsLoading ? 'Loading project data…' : "This session's project could not be found."}
          </Text>
          {!projectsLoading && (
            <UnstyledButton onClick={onDiscard} style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
              Discard — session was already stopped
            </UnstyledButton>
          )}
        </Box>
      </ScrollArea>
    )
  }
  const startDt = new Date(recoveryData.startTimeISO)
  const label = recoveryData.activity.active ? activeTileLabel(recoveredProject) : recoveryData.activity.code
  const badgeColor = recoveryData.activity.active ? COLORS.secondaryGreen : groupColor(recoveredProject, recoveryData.activity.category)
  const agoMs = now - startDt.getTime()
  const agoH = Math.floor(agoMs / 3600000)
  const agoM = Math.floor((agoMs % 3600000) / 60000)
  return (
    <ScrollArea style={{ flex: 1, minHeight: 0, background: COLORS.recoveryBg }}>
      <Box p={32} style={{ maxWidth: 460, margin: '0 auto', textAlign: 'center', fontFamily: FONT_FAMILY }}>
        <Text style={{ fontSize: 36 }} mb={12}>⚡</Text>
        <Text c="#fff" fw={800} size="xl" mb={6}>Session interrupted</Text>
        <Text c="rgba(255,255,255,0.55)" size="sm" mb={20}>The app closed while a session was running.</Text>
        <Badge size="lg" radius="md" style={{ background: badgeColor, color: '#fff', padding: '10px 22px', height: 'auto', fontSize: 15 }} mb={6}>
          {label}
        </Badge>
        <Text c="rgba(255,255,255,0.6)" size="sm" mt={8}>Started {formatTimeOfDay(startDt)}</Text>
        <Text c="rgba(255,255,255,0.4)" size="xs" mb={24}>({agoH > 0 ? `${agoH}h ${agoM}m ago` : `${agoM}m ago`})</Text>
        <Text c="rgba(255,255,255,0.6)" size="xs" fw={700} tt="uppercase" mb={10}>What time did it end?</Text>
        <TimeStepper hours={recoveryEndTime.hours} minutes={recoveryEndTime.minutes} onChange={onChangeRecoveryEndTime} />
        <Button fullWidth size="lg" mt={24} style={{ background: COLORS.secondaryGreen }} onClick={onSave}>
          ✓ Save Session
        </Button>
        <UnstyledButton mt={10} onClick={onDiscard} style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
          Discard — session was already stopped
        </UnstyledButton>
      </Box>
    </ScrollArea>
  )
}
