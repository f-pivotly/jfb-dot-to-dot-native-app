import { useState } from 'react'
import { Modal, TextInput, Select, Textarea, Group, Button, SimpleGrid, Text } from '@mantine/core'
import { COLORS, MODAL_STYLES } from '../../theme'
import { useAreaCascade } from './useAreaCascade'
import AreaCascadeSelects from './AreaCascadeSelects'
import { resolvePass, visibleDelayCodes } from './projectsViewModel'
import { localDateKey } from './dailyTrackingFormat'

function nowTimeStr() {
  return new Date().toTimeString().slice(0, 5)
}

export default function AddPastSessionModal({
  opened, onClose, project, equipmentId, activeTileLabel, passFieldSpec, workTypeNameById, onSave,
}) {
  const [startDate, setStartDate] = useState(localDateKey())
  const [startTime, setStartTime] = useState(nowTimeStr())
  const [endDate, setEndDate] = useState(localDateKey())
  const [endTime, setEndTime] = useState(nowTimeStr())
  const [category, setCategory] = useState(activeTileLabel)
  const [operatorId, setOperatorId] = useState(project?.operators?.[0]?.id ?? '')
  const [pass, setPass] = useState('')
  const [description, setDescription] = useState('')
  const areaCascade = useAreaCascade(project)

  const availableCodes = visibleDelayCodes(project, equipmentId, workTypeNameById)
  const categoryOptions = [activeTileLabel, ...availableCodes.map((c) => c.code)]
  const operatorOptions = (project?.operators ?? []).map((o) => ({ value: o.id, label: o.name }))

  function reset() {
    setStartDate(localDateKey()); setStartTime(nowTimeStr())
    setEndDate(localDateKey()); setEndTime(nowTimeStr())
    setCategory(activeTileLabel); setOperatorId(project?.operators?.[0]?.id ?? '')
    areaCascade.reset(); setPass(''); setDescription('')
  }

  function handleSave() {
    const start = new Date(`${startDate}T${startTime}:00`)
    const end = new Date(`${endDate}T${endTime}:00`)
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) return
    const delayCode = availableCodes.find((c) => c.code === category)
    const selectedOperator = project?.operators?.find((o) => o.id === operatorId)
    onSave({
      category,
      delayCategory: delayCode?.category ?? null,
      delayCodeId: delayCode?.id ?? null,
      startTime: start,
      endTime: end,
      durationMs: end - start,
      operatorName: selectedOperator?.name ?? '',
      operatorId,
      ...areaCascade.labels,
      ...areaCascade.ids,
      ...resolvePass(project, equipmentId, pass, passFieldSpec.options),
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
    <Modal opened={opened} onClose={handleClose} title={<Text fw={700}>Add Past Session</Text>} size="md" styles={MODAL_STYLES}>
      <SimpleGrid cols={2} spacing={10} mb={10}>
        <TextInput label="Start Date" type="date" value={startDate} onChange={(e) => setStartDate(e.currentTarget.value)} />
        <TextInput label="Start Time" type="time" value={startTime} onChange={(e) => setStartTime(e.currentTarget.value)} />
        <TextInput label="End Date" type="date" value={endDate} onChange={(e) => setEndDate(e.currentTarget.value)} />
        <TextInput label="End Time" type="time" value={endTime} onChange={(e) => setEndTime(e.currentTarget.value)} />
      </SimpleGrid>

      <Select label="Category *" data={categoryOptions} value={category} onChange={setCategory} mb={10} allowDeselect={false} />

      <SimpleGrid cols={2} spacing={10} mb={10}>
        <Select label="Operator" data={operatorOptions} value={operatorId} onChange={setOperatorId} allowDeselect={false} />
        <Select label={passFieldSpec.label} data={passFieldSpec.options} value={pass} onChange={setPass} clearable />
      </SimpleGrid>

      <SimpleGrid cols={areaCascade.visibleCount} spacing={10} mb={10}>
        <AreaCascadeSelects cascade={areaCascade} project={project} />
      </SimpleGrid>

      <Textarea label="Description" value={description} onChange={(e) => setDescription(e.currentTarget.value)} rows={2} mb={20} />

      <Group justify="flex-end">
        <Button style={{ background: COLORS.secondaryGreen }} onClick={handleClose}>Cancel</Button>
        <Button style={{ background: COLORS.primaryBlue }} onClick={handleSave}>Save Session</Button>
      </Group>
    </Modal>
  )
}
