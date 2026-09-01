import { UnstyledButton, ActionIcon } from '@mantine/core'
import { IconStar, IconStarFilled } from '@tabler/icons-react'

export default function TileButton({ code, color, isFavorite, onToggleFavorite, onClick, isActive }) {
  return (
    <UnstyledButton
      onClick={onClick}
      style={{
        position: 'relative',
        padding: '12px 26px 12px 16px',
        borderRadius: 8,
        minWidth: 140,
        boxShadow: isActive ? '0 0 0 3px yellow, 0 4px 12px rgba(0,0,0,0.3)' : 'none',
        background: color,
        color: '#fff',
        fontSize: 12,
        fontWeight: 600,
        lineHeight: 1.3,
        textAlign: 'center',
      }}
    >
      {code.code}
      <ActionIcon
        variant="transparent"
        size="xs"
        style={{ position: 'absolute', top: 3, right: 5 }}
        onClick={(e) => { e.stopPropagation(); onToggleFavorite(code.codeNum) }}
      >
        {isFavorite ? <IconStarFilled size={13} color="#FFD54A" /> : <IconStar size={13} color="rgba(255,255,255,0.55)" />}
      </ActionIcon>
    </UnstyledButton>
  )
}
