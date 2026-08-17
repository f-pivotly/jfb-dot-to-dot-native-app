import { Box, Text, Group, Button, UnstyledButton, Image, ScrollArea } from '@mantine/core'
import { COLORS, FONT_FAMILY } from '../../../theme'
import brennanLogo from '../../../assets/brennan-logo.png'

export default function ConfirmSetupScreen({ project, equipment, operator, onEditProject, onEditEquipment, onEditOperator, onConfirm }) {
  const rows = [
    { label: 'Project', value: project.name, onEdit: onEditProject },
    { label: 'Equipment', value: equipment, onEdit: onEditEquipment },
    { label: 'Operator', value: operator, onEdit: onEditOperator },
  ]
  return (
    <ScrollArea style={{ flex: 1, minHeight: 0, background: COLORS.primaryBlue }}>
      <Box p={32} style={{ maxWidth: 460, margin: '0 auto', fontFamily: FONT_FAMILY }}>
        <Image src={brennanLogo} h={44} fit="contain" mx="auto" mb={20} />
        <Text c="#fff" fw={800} size="xl" ta="center" mb={6}>Good morning — confirm your setup</Text>
        <Text c="rgba(255,255,255,0.55)" size="sm" ta="center" mb={24}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
        </Text>
        {rows.map((row) => (
          <Group key={row.label} justify="space-between" p={14} mb={10} style={{ background: 'rgba(255,255,255,0.1)', border: '1.5px solid rgba(255,255,255,0.2)', borderRadius: 10 }}>
            <Box>
              <Text size="10px" fw={700} c="rgba(255,255,255,0.5)" tt="uppercase" style={{ letterSpacing: '0.06em' }}>{row.label}</Text>
              <Text size="sm" fw={700} c="#fff">{row.value}</Text>
            </Box>
            <UnstyledButton
              onClick={row.onEdit}
              style={{ padding: '6px 14px', background: 'rgba(255,255,255,0.12)', border: '1.5px solid rgba(255,255,255,0.25)', borderRadius: 7, color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: 700 }}
            >
              Change
            </UnstyledButton>
          </Group>
        ))}
        <Button fullWidth size="lg" mt={8} style={{ background: COLORS.secondaryGreen }} onClick={onConfirm}>
          Confirm &amp; Set Shift Start →
        </Button>
      </Box>
    </ScrollArea>
  )
}
