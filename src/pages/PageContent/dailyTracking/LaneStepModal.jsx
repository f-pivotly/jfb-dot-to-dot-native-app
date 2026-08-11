import { useState } from 'react'
import { Modal, TextInput, Button, Text } from '@mantine/core'
import { COLORS } from './dotToDotTheme'

const modalStyles = {
  header: { background: COLORS.primaryBlue, color: COLORS.white },
  title: { color: COLORS.white, fontWeight: 700, fontSize: 18 },
  close: { color: COLORS.white },
}

// Capping-project-only prompt shown on every activity tap, pre-filled from
// the last entry (carry-forward) — matches jfb-dot-to-dot's Lane & Step
// popup, including its blue modal header.
export default function LaneStepModal({ opened, lastLane, lastStep, onCancel, onContinue }) {
  return (
    <Modal opened={opened} onClose={onCancel} title={<Text fw={700}>Lane &amp; Step</Text>} size="sm" styles={modalStyles}>
      {/* Mounted fresh each time the modal opens, so its initial state always
          picks up the latest carry-forward values with no effect needed. */}
      {opened && <LaneStepForm lastLane={lastLane} lastStep={lastStep} onContinue={onContinue} />}
    </Modal>
  )
}

function LaneStepForm({ lastLane, lastStep, onContinue }) {
  const [lane, setLane] = useState(lastLane || '')
  const [step, setStep] = useState(lastStep || '')

  // Original has no Cancel button here — dismissal is the modal's × only.
  return (
    <>
      <TextInput label="Lane" placeholder="e.g. A" value={lane} onChange={(e) => setLane(e.currentTarget.value)} mb={12} autoFocus />
      <TextInput label="Step" placeholder="e.g. 21" inputMode="numeric" value={step} onChange={(e) => setStep(e.currentTarget.value)} mb={20} />
      <Button fullWidth size="lg" style={{ background: COLORS.primaryBlue }} onClick={() => onContinue({ lane: lane.trim(), step: step.trim() })}>
        Continue
      </Button>
    </>
  )
}
