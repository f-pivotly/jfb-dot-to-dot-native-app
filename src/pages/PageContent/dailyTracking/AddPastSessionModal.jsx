import { useState } from 'react'
import { Modal, TextInput, Select, Textarea, Group, Button, SimpleGrid, Text } from '@mantine/core'
import { COLORS } from '../../../theme'
import { useAreaCascade } from './useAreaCascade'

const modalStyles = {
  header: { background: COLORS.primaryBlue, color: COLORS.white },
  title: { color: COLORS.white, fontWeight: 700, fontSize: 18 },
  close: { color: COLORS.white },
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}
function nowTimeStr() {
  return new Date().toTimeString().slice(0, 5)
}

export default function AddPastSessionModal({ opened, onClose, project, activeTileLabel, onSave }) {
  const [startDate, setStartDate] = useState(todayStr())
  const [startTime, setStartTime] = useState(nowTimeStr())
  const [endDate, setEndDate] = useState(todayStr())
  const [endTime, setEndTime] = useState(nowTimeStr())
  const [category, setCategory] = useState(activeTileLabel)
  const [operatorId, setOperatorId] = useState(project?.operators?.[0]?.id ?? '')
  const [pass, setPass] = useState('')
  const [description, setDescription] = useState('')
  const areaCascade = useAreaCascade(project)

  const categoryOptions = [activeTileLabel, ...(project?.delayCodes.map((c) => c.code) ?? [])]
  const operatorOptions = (project?.operators ?? []).map((o) => ({ value: o.id, label: o.name }))

  function reset() {
    setStartDate(todayStr()); setStartTime(nowTimeStr())
    setEndDate(todayStr()); setEndTime(nowTimeStr())
    setCategory(activeTileLabel); setOperatorId(project?.operators?.[0]?.id ?? '')
    areaCascade.reset(); setPass(''); setDescription('')
  }

  function handleSave() {
    const start = new Date(`${startDate}T${startTime}:00`)
    const end = new Date(`${endDate}T${endTime}:00`)
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) return
    const delayCode = project?.delayCodes.find((c) => c.code === category)
    const selectedOperator = project?.operators?.find((o) => o.id === operatorId)
    onSave({
      category,
      delayCategory: delayCode?.category ?? null,
      startTime: start,
      endTime: end,
      durationMs: end - start,
      operatorName: selectedOperator?.name ?? '',
      operatorId,
      areaL1: areaCascade.labelForValue(areaCascade.areaOptions, areaCascade.areaValue),
      areaL2: areaCascade.labelForValue(areaCascade.subAreaOptions, areaCascade.subAreaValue),
      areaL3: areaCascade.labelForValue(areaCascade.subSubAreaOptions, areaCascade.subSubAreaValue),
      pass,
      description,
    })
    reset()
    onClose()
  }

  function handleClose() {
    reset()
    onClose()
  }

  return (
    <Modal opened={opened} onClose={handleClose} title={<Text fw={700}>Add Past Session</Text>} size="md" styles={modalStyles}>
      <SimpleGrid cols={2} spacing={10} mb={10}>
        <TextInput label="Start Date" type="date" value={startDate} onChange={(e) => setStartDate(e.currentTarget.value)} />
        <TextInput label="Start Time" type="time" value={startTime} onChange={(e) => setStartTime(e.currentTarget.value)} />
        <TextInput label="End Date" type="date" value={endDate} onChange={(e) => setEndDate(e.currentTarget.value)} />
        <TextInput label="End Time" type="time" value={endTime} onChange={(e) => setEndTime(e.currentTarget.value)} />
      </SimpleGrid>

      <Select label="Category *" data={categoryOptions} value={category} onChange={setCategory} mb={10} allowDeselect={false} />

      <SimpleGrid cols={2} spacing={10} mb={10}>
        <Select label="Operator" data={operatorOptions} value={operatorId} onChange={setOperatorId} allowDeselect={false} />
        <Select label={project?.passLabel ?? 'Pass'} data={project?.passOptions ?? []} value={pass} onChange={setPass} clearable />
      </SimpleGrid>

      <SimpleGrid cols={1 + (areaCascade.showSubArea ? 1 : 0) + (areaCascade.showSubSubArea ? 1 : 0)} spacing={10} mb={10}>
        <Select label={project?.areaLabel ?? 'Area'} data={areaCascade.areaOptions} value={areaCascade.areaValue} onChange={areaCascade.handleAreaChange} clearable />
        {areaCascade.showSubArea && (
          <Select label={project.subAreaLabel} data={areaCascade.subAreaOptions} value={areaCascade.subAreaValue} onChange={areaCascade.handleSubAreaChange} clearable />
        )}
        {areaCascade.showSubSubArea && (
          <Select label={project.subSubAreaLabel} data={areaCascade.subSubAreaOptions} value={areaCascade.subSubAreaValue} onChange={areaCascade.handleSubSubAreaChange} clearable />
        )}
      </SimpleGrid>

      <Textarea label="Description" value={description} onChange={(e) => setDescription(e.currentTarget.value)} rows={2} mb={20} />

      <Group justify="flex-end">
        <Button style={{ background: COLORS.secondaryGreen }} onClick={handleClose}>Cancel</Button>
        <Button style={{ background: COLORS.primaryBlue }} onClick={handleSave}>Save Session</Button>
      </Group>
    </Modal>
  )
}
