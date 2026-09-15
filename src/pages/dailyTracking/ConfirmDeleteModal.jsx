import { Modal, Text, Group, Button } from '@mantine/core'
import { COLORS, MODAL_STYLES } from '../../theme'
import { formatTimeOfDay } from './dailyTrackingFormat'

export default function ConfirmDeleteModal({ session, onCancel, onConfirm }) {
  return (
    <Modal
      opened={!!session}
      onClose={onCancel}
      title={<Text fw={700}>Delete Session</Text>}
      size="sm"
      styles={MODAL_STYLES}
    >
      {session && (
        <>
          <Text size="sm" mb={8}>
            Delete the {formatTimeOfDay(session.startTime)}–{formatTimeOfDay(session.endTime)} {session.category} session?
          </Text>
          <Text size="xs" c={COLORS.textMedium} mb={20}>
            It is removed from this device. If it has already synced, the office still has it — ask your PM to take it off the report.
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={onCancel}>Cancel</Button>
            <Button style={{ background: COLORS.accentRed }} onClick={onConfirm}>Delete</Button>
          </Group>
        </>
      )}
    </Modal>
  )
}
