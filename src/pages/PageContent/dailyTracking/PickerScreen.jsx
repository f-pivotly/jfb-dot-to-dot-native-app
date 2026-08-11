import { Box, Text, Stack, UnstyledButton, Badge, Image } from '@mantine/core'
import { COLORS, FONT_FAMILY } from './dotToDotTheme'
import brennanLogo from '../../../assets/brennan-logo.png'

// Shared list-picker layout for the Select Project / Select Equipment /
// Who is operating? steps — Mantine components, but colored to match
// jfb-dot-to-dot's _buildPickerScreen exactly (blue overlay, white text,
// green "last used" highlight) rather than the shell's default theme.
export default function PickerScreen({ title, subtitle, items, selectedId, onSelect, onBack, background = COLORS.primaryBlue, showLogo = true }) {
  return (
    <Box
      style={{
        flex: 1, minHeight: 0, overflowY: 'auto', background,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '28px 20px 40px', fontFamily: FONT_FAMILY,
      }}
    >
      {showLogo && <Image src={brennanLogo} h={44} fit="contain" mb={20} />}

      {onBack && (
        <UnstyledButton onClick={onBack} mb={12} style={{ alignSelf: 'flex-start', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>
          ← Back
        </UnstyledButton>
      )}

      <Text c="#fff" fw={800} size="xl" ta="center" mb={4}>{title}</Text>
      {subtitle && <Text c="rgba(255,255,255,0.55)" size="sm" ta="center" mb={24}>{subtitle}</Text>}

      <Stack gap={10} w="100%" maw={380}>
        {items.map((item) => {
          const isSelected = item.id === selectedId
          return (
            <UnstyledButton
              key={item.id}
              onClick={() => onSelect(item)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 18px', borderRadius: 12,
                border: `2px solid ${isSelected ? 'rgba(0,220,120,0.7)' : 'rgba(255,255,255,0.2)'}`,
                background: isSelected ? 'rgba(0,180,100,0.3)' : 'rgba(255,255,255,0.1)',
              }}
            >
              <Box>
                <Text size="md" fw={700} c="#fff">{item.label}</Text>
                {item.sub && <Text size="xs" c="rgba(255,255,255,0.5)" mt={2}>{item.sub}</Text>}
              </Box>
              {isSelected && (
                <Badge size="xs" variant="light" style={{ background: 'rgba(0,220,120,0.3)', color: 'rgba(255,255,255,0.85)' }}>
                  last used
                </Badge>
              )}
            </UnstyledButton>
          )
        })}
        {items.length === 0 && (
          <Text size="sm" c="rgba(255,255,255,0.5)" ta="center" py={20}>Nothing to select here yet.</Text>
        )}
      </Stack>
    </Box>
  )
}
