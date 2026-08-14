import { useState } from 'react'
import { Modal, TextInput, Select, Textarea, Group, Button, SimpleGrid, Text } from '@mantine/core'
import { COLORS } from './dotToDotTheme'

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
  const [area, setArea] = useState('')
  const [subArea, setSubArea] = useState('')
  const [subSubArea, setSubSubArea] = useState('')
  const [pass, setPass] = useState('')
  const [description, setDescription] = useState('')

  const categoryOptions = [activeTileLabel, ...(project?.delayCodes.map((c) => c.code) ?? [])]
  const operatorOptions = (project?.operators ?? []).map((o) => ({ value: o.id, label: o.name }))

  const areaOptions = project?.areasFlat?.length
    ? project.areasFlat.filter((a) => a.depth === 1).map((a) => ({ value: a.id, label: a.name }))
    : (project?.areas ?? [])
  const subAreaOptions = (project?.areasFlat ?? [])
    .filter((a) => a.depth === 2 && a.parent_id === area)
    .map((a) => ({ value: a.id, label: a.name }))
  const subSubAreaOptions = (project?.areasFlat ?? [])
    .filter((a) => a.depth === 3 && a.parent_id === subArea)
    .map((a) => ({ value: a.id, label: a.name }))
  const showSubArea = !!project?.subAreaLabel && (project?.areasFlat ?? []).some((a) => a.depth === 2)
  const showSubSubArea = !!project?.subSubAreaLabel && (project?.areasFlat ?? []).some((a) => a.depth === 3)

  function labelForValue(options, value) {
    if (!value) return ''
    const opt = options.find((o) => (typeof o === 'string' ? o === value : o.value === value))
    if (!opt) return value
    return typeof opt === 'string' ? opt : opt.label
  }

  function handleAreaChange(v) {
    setArea(v ?? '')
    setSubArea('')
    setSubSubArea('')
  }
  function handleSubAreaChange(v) {
    setSubArea(v ?? '')
    setSubSubArea('')
  }

  function reset() {
    setStartDate(todayStr()); setStartTime(nowTimeStr())
    setEndDate(todayStr()); setEndTime(nowTimeStr())
    setCategory(activeTileLabel); setOperatorId(project?.operators?.[0]?.id ?? '')
    setArea(''); setSubArea(''); setSubSubArea(''); setPass(''); setDescription('')
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
      areaL1: labelForValue(areaOptions, area),
      areaL2: labelForValue(subAreaOptions, subArea),
      areaL3: labelForValue(subSubAreaOptions, subSubArea),
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

      <SimpleGrid cols={1 + (showSubArea ? 1 : 0) + (showSubSubArea ? 1 : 0)} spacing={10} mb={10}>
        <Select label={project?.areaLabel ?? 'Area'} data={areaOptions} value={area} onChange={handleAreaChange} clearable />
        {showSubArea && (
          <Select label={project.subAreaLabel} data={subAreaOptions} value={subArea} onChange={handleSubAreaChange} clearable />
        )}
        {showSubSubArea && (
          <Select label={project.subSubAreaLabel} data={subSubAreaOptions} value={subSubArea} onChange={(v) => setSubSubArea(v ?? '')} clearable />
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
