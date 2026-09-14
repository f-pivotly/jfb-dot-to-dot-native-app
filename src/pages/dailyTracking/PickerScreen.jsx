import { useState } from 'react'
import { Box, Text, Stack, UnstyledButton, Badge, Image, TextInput, Button } from '@mantine/core'
import { IconArrowLeft } from '@tabler/icons-react'
import { COLORS, FONT_FAMILY } from '../../theme'
import brennanLogo from './assets/brennan-logo.png'

function initialsOf(label) {
  return String(label || '')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 3)
}

function NameFallback({ notice, onSubmit }) {
  const [name, setName] = useState('')
  const trimmed = name.trim()

  return (
    <Stack gap={10} w="100%" maw={380}>
      <TextInput
        id="picker-name-fallback"
        value={name}
        onChange={(e) => setName(e.currentTarget.value)}
        placeholder="Enter name…"
        size="md"
        autoFocus
        styles={{
          input: {
            background: 'rgba(255,255,255,0.1)',
            border: '2px solid rgba(255,255,255,0.3)',
            color: '#fff',
            textAlign: 'center',
            fontSize: 18,
          },
        }}
      />
      <Button
        fullWidth
        size="lg"
        disabled={!trimmed}
        style={{ background: trimmed ? COLORS.secondaryGreen : 'rgba(255,255,255,0.15)' }}
        onClick={() => onSubmit(trimmed)}
      >
        Continue →
      </Button>
      {notice && (
        <Text size="xs" c="rgba(255,255,255,0.55)" ta="center">
          {notice}
        </Text>
      )}
    </Stack>
  )
}

export default function PickerScreen({
  title, subtitle, items, selectedId, onSelect, onBack, allowTextFallback, fallbackNotice,
}) {
  return (
    <Box
      style={{
        flex: 1, minHeight: 0, overflowY: 'auto', background: COLORS.primaryBlue,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '28px 20px 40px', fontFamily: FONT_FAMILY,
      }}
    >
      <Image src={brennanLogo} h={44} fit="contain" mb={20} />

      <Text c="#fff" fw={800} size="xl" ta="center" mb={4}>{title}</Text>
      {subtitle && <Text c="rgba(255,255,255,0.55)" size="sm" ta="center" mb={16}>{subtitle}</Text>}

      {onBack && (
        <Box w="100%" maw={380} mb={16}>
          <UnstyledButton
            onClick={onBack}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 18px 8px 14px', borderRadius: 999,
              background: COLORS.white,
              color: COLORS.primaryBlueDark,
            }}
          >
            <IconArrowLeft size={15} />
            <Text size="sm" fw={700} c="inherit">Back</Text>
          </UnstyledButton>
        </Box>
      )}

      {allowTextFallback ? (
        <NameFallback
          notice={fallbackNotice}
          onSubmit={(name) => onSelect({ id: null, label: name })}
        />
      ) : (
        <Stack gap={10} w="100%" maw={380}>
          {items.map((item) => {
            const isSelected = item.id === selectedId
            return (
              <UnstyledButton
                key={item.id}
                onClick={() => onSelect(item)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '16px 18px', borderRadius: 12,
                  border: `2px solid ${isSelected ? 'rgba(0,220,120,0.7)' : 'rgba(255,255,255,0.2)'}`,
                  background: isSelected ? 'rgba(0,180,100,0.3)' : 'rgba(255,255,255,0.1)',
                }}
              >
                {item.initials && (
                  <Box
                    style={{
                      width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                      background: 'rgba(255,255,255,0.2)', color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, fontWeight: 800,
                    }}
                  >
                    {initialsOf(item.label)}
                  </Box>
                )}
                <Box style={{ flex: 1, minWidth: 0 }}>
                  <Text size="md" fw={700} c="#fff" truncate>{item.label}</Text>
                  {item.sub && (
                    <Text size="xs" c="rgba(255,255,255,0.55)" truncate>{item.sub}</Text>
                  )}
                </Box>
                {isSelected && (
                  <Badge size="xs" variant="light" style={{ background: 'rgba(0,220,120,0.3)', color: 'rgba(255,255,255,0.85)', flexShrink: 0 }}>
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
      )}
    </Box>
  )
}
