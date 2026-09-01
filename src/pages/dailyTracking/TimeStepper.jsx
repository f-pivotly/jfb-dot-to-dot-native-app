import { Box, Text, Group, ActionIcon } from '@mantine/core'

export default function TimeStepper({ hours, minutes, onChange }) {
  const ampm = hours >= 12 ? 'PM' : 'AM'
  const displayH = hours % 12 || 12

  function adjustHour(delta) {
    onChange({ hours: (hours + delta + 24) % 24, minutes })
  }
  function adjustMinutes(delta) {
    onChange({ hours, minutes: (minutes + delta + 60) % 60 })
  }

  const stepBtn = (label, onClick) => (
    <ActionIcon
      variant="default"
      radius="xl"
      size={52}
      onClick={onClick}
      style={{ background: 'rgba(255,255,255,0.15)', border: '2px solid rgba(255,255,255,0.3)', color: '#fff', fontSize: 22, fontWeight: 700 }}
    >
      {label}
    </ActionIcon>
  )

  return (
    <Box ta="center">
      <Text c="#fff" style={{ fontSize: 52, fontWeight: 900, letterSpacing: 2, fontVariantNumeric: 'tabular-nums' }}>
        {String(displayH).padStart(2, '0')}:{String(minutes).padStart(2, '0')} {ampm}
      </Text>
      <Group justify="center" gap={16} mt={20} maw={280} mx="auto">
        <Box>
          <Text size="xs" fw={700} c="rgba(255,255,255,0.5)" tt="uppercase" mb={8}>Hour</Text>
          <Group gap={8}>{stepBtn('−', () => adjustHour(-1))}{stepBtn('+', () => adjustHour(1))}</Group>
        </Box>
        <Box>
          <Text size="xs" fw={700} c="rgba(255,255,255,0.5)" tt="uppercase" mb={8}>Minutes</Text>
          <Group gap={8}>{stepBtn('−', () => adjustMinutes(-5))}{stepBtn('+', () => adjustMinutes(5))}</Group>
        </Box>
      </Group>
    </Box>
  )
}
