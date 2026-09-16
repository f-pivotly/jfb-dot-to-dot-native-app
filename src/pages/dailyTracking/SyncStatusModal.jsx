import { Box, Text, Group, Button, Badge, Modal } from '@mantine/core'
import { COLORS } from '../../theme'
import { formatTimeOfDay } from './dailyTrackingFormat'

function itemWindow(item) {
  return `${formatTimeOfDay(new Date(item.recordData.start_date_time))}–${formatTimeOfDay(new Date(item.recordData.end_date_time))}`
}

export default function SyncStatusModal({
  opened, onClose, syncedCount, pendingSyncCount, pendingItems,
  failedItems = [], failedSyncCount = 0, onRetry, onRetryFailed,
}) {
  return (
    <Modal opened={opened} onClose={onClose} title={<Text fw={700} size="sm">Sync Status</Text>} size="sm">
      <Group justify="space-between" mb={8}>
        <Text size="sm" c={COLORS.textMedium}>Synced this shift</Text>
        <Text size="sm" fw={700} c={COLORS.secondaryGreen}>{syncedCount}</Text>
      </Group>
      <Group justify="space-between" mb={failedSyncCount > 0 ? 8 : 16}>
        <Text size="sm" c={COLORS.textMedium}>Pending sync</Text>
        <Text size="sm" fw={700} c={pendingSyncCount > 0 ? COLORS.warningBorder : COLORS.secondaryGreen}>{pendingSyncCount}</Text>
      </Group>

      {failedSyncCount > 0 && (
        <Box mb={16}>
          <Group justify="space-between" mb={8}>
            <Text size="sm" c={COLORS.textMedium}>Rejected by the server</Text>
            <Text size="sm" fw={700} c={COLORS.accentRed}>{failedSyncCount}</Text>
          </Group>
          {failedItems.map((item) => (
            <Group key={item.local_id} justify="space-between" wrap="nowrap" p={8} mb={6} style={{ background: COLORS.lightGray, border: `1px solid ${COLORS.accentRed}`, borderRadius: 8 }}>
              <Box style={{ minWidth: 0 }}>
                <Text size="xs" fw={600} truncate>{itemWindow(item)}</Text>
                <Text size="10px" c={COLORS.textLight} truncate>{item.lastError || 'The server would not accept this session.'}</Text>
              </Box>
              <Badge style={{ background: COLORS.accentRed, color: '#fff', flexShrink: 0 }}>Failed</Badge>
            </Group>
          ))}
          <Text size="10px" c={COLORS.textLight} mb={8}>
            These will not retry on their own. Tell your PM, then try again once it is sorted — nothing is lost in the meantime.
          </Text>
          <Button size="xs" variant="default" onClick={onRetryFailed}>Try these again</Button>
        </Box>
      )}

      {pendingItems.length === 0 && failedSyncCount === 0 ? (
        <Text size="xs" c={COLORS.textLight} ta="center" py={10}>✓ Everything is synced.</Text>
      ) : (
        <Box mb={12}>
          {pendingItems.map((item) => (
            <Group key={item.local_id} justify="space-between" wrap="nowrap" p={8} mb={6} style={{ background: COLORS.lightGray, border: `1px solid ${COLORS.borderGray}`, borderRadius: 8 }}>
              <Box style={{ minWidth: 0 }}>
                <Text size="xs" fw={600} truncate>{itemWindow(item)}</Text>
                <Text size="10px" c={COLORS.textLight}>Queued {new Date(item.createdAt).toLocaleTimeString()}</Text>
              </Box>
              <Badge style={{ background: COLORS.warningBg, color: COLORS.warningText, flexShrink: 0 }}>Pending</Badge>
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
