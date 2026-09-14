import { useState } from 'react'
import { Modal, TextInput, Button, Text } from '@mantine/core'
import { COLORS, MODAL_STYLES } from '../../theme'

export default function LaneStepModal({ opened, lastLane, lastStep, onCancel, onContinue }) {
  return (
    <Modal opened={opened} onClose={onCancel} title={<Text fw={700}>Lane &amp; Step</Text>} size="sm" styles={MODAL_STYLES}>
      {opened && <LaneStepForm lastLane={lastLane} lastStep={lastStep} onContinue={onContinue} />}
    </Modal>
  )
}

function LaneStepForm({ lastLane, lastStep, onContinue }) {
  const [lane, setLane] = useState(lastLane || '')
  const [step, setStep] = useState(lastStep || '')

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
