import { Box, Text, Group, Button, Badge, Modal } from '@mantine/core'
import { COLORS } from '../../theme'
import { formatTimeOfDay } from './dailyTrackingFormat'

export default function SyncStatusModal({ opened, onClose, syncedCount, pendingSyncCount, pendingItems, onRetry }) {
  return (
    <Modal opened={opened} onClose={onClose} title={<Text fw={700} size="sm">Sync Status</Text>} size="sm">
      <Group justify="space-between" mb={8}>
        <Text size="sm" c={COLORS.textMedium}>Synced this shift</Text>
        <Text size="sm" fw={700} c={COLORS.secondaryGreen}>{syncedCount}</Text>
      </Group>
      <Group justify="space-between" mb={16}>
        <Text size="sm" c={COLORS.textMedium}>Pending sync</Text>
        <Text size="sm" fw={700} c={pendingSyncCount > 0 ? (COLORS.warningBorder ?? '#d97706') : COLORS.secondaryGreen}>{pendingSyncCount}</Text>
      </Group>

      {pendingItems.length === 0 ? (
        <Text size="xs" c={COLORS.textLight} ta="center" py={10}>✓ Everything is synced.</Text>
      ) : (
        <Box mb={12}>
          {pendingItems.map((item) => (
            <Group key={item.local_id} justify="space-between" wrap="nowrap" p={8} mb={6} style={{ background: COLORS.lightGray, border: `1px solid ${COLORS.borderGray}`, borderRadius: 8 }}>
              <Box style={{ minWidth: 0 }}>
                <Text size="xs" fw={600} truncate>
                  {formatTimeOfDay(new Date(item.recordData.start_date_time))}–{formatTimeOfDay(new Date(item.recordData.end_date_time))}
                </Text>
                <Text size="10px" c={COLORS.textLight}>Queued {new Date(item.createdAt).toLocaleTimeString()}</Text>
              </Box>
              <Badge style={{ background: COLORS.warningBg ?? '#fef3c7', color: COLORS.warningText ?? '#92400e', flexShrink: 0 }}>Pending</Badge>
            </Group>
          ))}
        </Box>
      )}

      <Group justify="flex-end">
        <Button variant="default" size="xs" onClick={onClose}>Close</Button>
        {pendingSyncCount > 0 && (
          <Button size="xs" style={{ background: COLORS.primaryBlue }} onClick={onRetry}>Retry Now</Button>
        )}
      </Group>
    </Modal>
  )
}
