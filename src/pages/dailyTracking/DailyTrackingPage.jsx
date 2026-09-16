import { useState, useEffect } from 'react'
import { Box, Text, Group, Button, Select, Textarea, ActionIcon, ScrollArea, UnstyledButton, Image, Badge } from '@mantine/core'
import { IconPlayerStopFilled, IconTrash, IconUserCircle, IconPlus } from '@tabler/icons-react'
import PickerScreen from './PickerScreen'
import LaneStepModal from './LaneStepModal'
import AddPastSessionModal from './AddPastSessionModal'
import TileButton from './TileButton'
import AreaCascadeSelects from './AreaCascadeSelects'
import SessionInterruptedScreen from './SessionInterruptedScreen'
import ShiftStartScreen from './ShiftStartScreen'
import ConfirmSetupScreen from './ConfirmSetupScreen'
import ShiftEndOverlay from './ShiftEndOverlay'
import SyncStatusModal from './SyncStatusModal'
import ConfirmDeleteModal from './ConfirmDeleteModal'
import { COLORS, FONT_FAMILY } from '../../theme'
import { activeTileLabel, activityLabel, dateKeyOf, dayHeading, delayCategoryOf, usesLaneStep, groupColor, groupSessionsByDate, formatClock, formatTimeOfDay, hoursAndMinutesOf, localDateKey, nowRoundedToFiveMin, sessionColor, totalHoursOf, STARTUP_SHUTDOWN_CATEGORY, STARTUP_SHUTDOWN_LABEL } from './dailyTrackingFormat'
import { putSession, getAllStoredSessions, deleteStoredSession } from '../../data/offlineDb'
import { writeRecovery, clearRecovery } from './recoverySession'
import { saveDailyActivity } from './saveDailyActivity'
import { buildProjects, resolvePass, passField, visibleDelayCodes } from './projectsViewModel'
import { useAreaCascade } from './useAreaCascade'
import { useOfflineSyncQueue } from './useOfflineSyncQueue'
import { useCrashRecovery } from './useCrashRecovery'
import { useLastUsedSelection } from './useLastUsedSelection'
import { useFavoriteCodes } from './useFavoriteCodes'
import { notifyInfo, notifySuccess } from './notify'
import { useDomainSource, useCachedDomainSource } from '../../hooks/useDomainSource'
import { usePicklist } from '../../hooks/usePicklist'
import brennanLogo from './assets/brennan-logo.png'

const GAP_THRESHOLD_MS = 60000
const FUTURE_START_TOLERANCE_MS = 6 * 3600000
const NO_ROSTER_NOTICE = 'No operators are set up on this project. Your name shows on this device only — the sessions will save without an operator until a PM adds you to the project.'

function notAfterNow(remembered) {
  const candidate = new Date()
  candidate.setHours(remembered.getHours(), remembered.getMinutes(), 0, 0)
  return candidate > new Date() ? nowRoundedToFiveMin() : hoursAndMinutesOf(remembered)
}

function sessionRow(fields) {
  return {
    id: crypto.randomUUID(),
    date: localDateKey(fields.startTime),
    category: fields.category,
    delayCategory: fields.delayCategory ?? null,
    startTime: fields.startTime,
    endTime: fields.endTime,
    durationMs: fields.endTime - fields.startTime,
    operatorName: fields.operatorName,
    areaL1: fields.areaL1,
    areaL2: fields.areaL2,
    areaL3: fields.areaL3,
    pass: fields.pass,
    description: fields.description,
    lane: fields.lane,
    step: fields.step,
  }
}

export default function DailyTrackingPage({ domainSources = [] }) {
  const { records: projectRecords, loading: projectsLoading, offline: projectsOffline } = useCachedDomainSource(domainSources, 'jfb_projects')
  const { records: operatorRecords } = useCachedDomainSource(domainSources, 'jfb_operators')
  const { records: projectOperatorRecords } = useCachedDomainSource(domainSources, 'jfb_project_operators')
  const { records: equipmentRecords } = useCachedDomainSource(domainSources, 'jfb_equipments')
  const { records: areaRecords } = useCachedDomainSource(domainSources, 'jfb_project_areas')
  const { records: areaLevelRecords } = useCachedDomainSource(domainSources, 'jfb_project_area_levels')
  const { records: layerRecords } = useCachedDomainSource(domainSources, 'jfb_project_layers')
  const { records: projectDelayCodeRecords } = useCachedDomainSource(domainSources, 'jfb_project_delay_codes')
  const { records: masterDelayCodeRecords } = useCachedDomainSource(domainSources, 'jfb_delay_codes')
  const { records: workTypeRecords } = useCachedDomainSource(domainSources, 'jfb_work_types')
  const { values: passTypeValues, labels: passTypeLabels } = usePicklist('pkl-jfb-pass-type')
  const { values: liftValues, labels: liftLabels } = usePicklist('pkl-jfb-lift')

  const { create: createDailyActivity } = useDomainSource(domainSources, 'jfb_daily_activities', { autoLoad: false })

  const passTypeOptions = passTypeValues.map((v) => ({ value: v, label: passTypeLabels[v] ?? v }))
  const liftOptions = liftValues.map((v) => ({ value: v, label: liftLabels[v] ?? v }))
  const workTypeNameById = new Map(workTypeRecords.map((w) => [w.id, w.name]))

  const projects = buildProjects({
    projectRecords, operatorRecords, projectOperatorRecords, equipmentRecords, areaRecords, areaLevelRecords,
    layerRecords, projectDelayCodeRecords, masterDelayCodeRecords,
  })

  const crashRecovery = useCrashRecovery(projects)
  const { lastUsed, ready: lastUsedReady, fresh, openShiftToday, remember } = useLastUsedSelection()

  const [step, setStep] = useState(crashRecovery.recovery ? 'sessionInterrupted' : null)
  const [project, setProject] = useState(null)
  const [equipment, setEquipment] = useState(crashRecovery.recovery?.equipment ?? null)
  const [equipmentId, setEquipmentId] = useState(crashRecovery.recovery?.equipmentId ?? null)
  const [operator, setOperator] = useState(crashRecovery.recovery?.operator ?? null)
  const [operatorId, setOperatorId] = useState(crashRecovery.recovery?.operatorId ?? null)
  const [sessionId, setSessionId] = useState(crashRecovery.recovery?.sessionId ?? null)
  const [shiftStart, setShiftStart] = useState(null)
  const [gapAnchor, setGapAnchor] = useState(null)
  const [shiftTime, setShiftTime] = useState(nowRoundedToFiveMin)

  const [sessions, setSessions] = useState([])
  const [activeSession, setActiveSession] = useState(null)
  const { favorites, toggle: toggleFavorite } = useFavoriteCodes(operatorId, project?.id)
  const [now, setNow] = useState(() => Date.now())
  const [syncModalOpen, setSyncModalOpen] = useState(false)

  const areaCascade = useAreaCascade(project)
  const [passValue, setPassValue] = useState('')
  const passFieldSpec = passField(project, equipmentId, { passTypeOptions, liftOptions })
  const [notes, setNotes] = useState('')
  const [lastLane, setLastLane] = useState('')
  const [lastStep, setLastStep] = useState('')

  const [laneStepOpen, setLaneStepOpen] = useState(false)
  const [pendingActivity, setPendingActivity] = useState(null)
  const [addPastOpen, setAddPastOpen] = useState(false)
  const [shiftEndOpen, setShiftEndOpen] = useState(false)
  const [shiftEndTime, setShiftEndTime] = useState(nowRoundedToFiveMin)

  const {
    pendingSyncCount, pendingItems, failedSyncCount, failedItems,
    drainQueue, retryFailed, dropSessionFromQueue,
  } = useOfflineSyncQueue({ createDailyActivity })
  const [deleteRow, setDeleteRow] = useState(null)

  useEffect(() => {
    if (!activeSession) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [activeSession])

  useEffect(() => {
    let cancelled = false
    getAllStoredSessions()
      .then((rows) => {
        if (cancelled || !rows.length) return
        setSessions(rows.sort((a, b) => b.startTime - a.startTime))
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  if (step === null && lastUsedReady && !projectsLoading) {
    const remembered = fresh ? projects.find((p) => p.id === lastUsed.projectId) : null
    const unit = remembered?.equipment.find((e) => e.id === lastUsed.equipmentId)
    const person = remembered?.operators.find((o) => o.id === lastUsed.operatorId)

    if (remembered && unit && person) {
      setProject(remembered)
      setEquipment(unit.name)
      setEquipmentId(unit.id)
      setOperator(person.name)
      setOperatorId(person.id)
      if (openShiftToday) {
        setSessionId(lastUsed.sessionId ?? null)
        setShiftStart(new Date(lastUsed.shiftStartISO))
        setStep('tracking')
      } else {
        setStep('confirmSetup')
      }
    } else {
      setStep('project')
    }
  }

  function selectProject(item) {
    const proj = projects.find((p) => p.id === item.id)
    setProject(proj)
    remember({ projectId: proj.id })
    areaCascade.reset()
    setPassValue('')
    if (proj.equipment.length === 1) {
      setEquipment(proj.equipment[0].name)
      setEquipmentId(proj.equipment[0].id)
      remember({ equipmentId: proj.equipment[0].id })
      setStep('operator')
    } else {
      setStep('equipment')
    }
  }
  function selectEquipment(item) {
    setEquipment(item.label)
    setEquipmentId(item.id)
    remember({ equipmentId: item.id })
    setStep('operator')
  }
  function selectOperator(item) {
    setOperator(item.label)
    setOperatorId(item.id)
    if (item.id) remember({ operatorId: item.id })
    goToShiftStart()
  }
  function beginOperatorSwap() {
    if (activeSession) endActiveSession()
    setStep('swapOperator')
  }
  function selectSwapOperator(item) {
    setOperator(item.label)
    setOperatorId(item.id)
    if (item.id) remember({ operatorId: item.id })
    setStep('tracking')
    notifyInfo(`Operator: ${item.label}`)
  }
  function goToShiftStart() {
    const last = lastUsed?.lastShiftStartISO
    setShiftTime(last ? hoursAndMinutesOf(new Date(last)) : nowRoundedToFiveMin())
    setStep('shiftStart')
  }

  function openShiftEnd() {
    const last = lastUsed?.lastShiftEndISO
    setShiftEndTime(last ? notAfterNow(new Date(last)) : nowRoundedToFiveMin())
    setShiftEndOpen(true)
  }

  function beginShift(start) {
    const newSessionId = crypto.randomUUID()
    setShiftStart(start)
    setSessionId(newSessionId)
    remember({
      shiftStartISO: start.toISOString(),
      shiftDate: localDateKey(),
      sessionId: newSessionId,
      lastShiftStartISO: start.toISOString(),
    })
    setStep('tracking')
  }
  function confirmShiftStart() {
    const d = new Date()
    d.setHours(shiftTime.hours, shiftTime.minutes, 0, 0)
    if (d - Date.now() > FUTURE_START_TOLERANCE_MS) d.setDate(d.getDate() - 1)
    beginShift(d)
  }
  function skipShiftStart() {
    beginShift(new Date())
  }

  function persistActiveSession(session) {
    writeRecovery({
      projectId: project.id,
      equipment,
      equipmentId,
      operator,
      operatorId,
      sessionId,
      activity: session.activity,
      startTimeISO: session.startTime.toISOString(),
      shiftStartISO: shiftStart ? shiftStart.toISOString() : null,
      areaL1: session.areaL1,
      areaL2: session.areaL2,
      areaL3: session.areaL3,
      areaId: session.areaId,
      subAreaId: session.subAreaId,
      subSubAreaId: session.subSubAreaId,
      pass: session.pass,
      passType: session.passType,
      layerId: session.layerId,
      notes: session.notes,
      lane: session.lane,
      step: session.step,
    })
  }

  function recordSession(fields, overrides = {}) {
    const row = sessionRow(fields)
    setSessions((prev) => [row, ...prev].sort((a, b) => b.startTime - a.startTime))
    putSession(row).catch(() => {})
    saveDailyActivity(createDailyActivity, {
      sessionRowId: row.id,
      projectId: project?.id,
      equipmentId,
      operatorId,
      sessionId,
      startTime: fields.startTime,
      endTime: fields.endTime,
      areaId: fields.areaId,
      subAreaId: fields.subAreaId,
      subSubAreaId: fields.subSubAreaId,
      passType: fields.passType,
      layerId: fields.layerId,
      delayCodeId: fields.delayCodeId,
      notes: fields.description,
      category: fields.category,
      lane: fields.lane,
      step: fields.step,
      ...overrides,
    })
  }

  function endActiveSession(endTime) {
    const cur = activeSession
    if (!cur) return
    const end = endTime || new Date()
    setActiveSession(null)
    clearRecovery()
    recordSession({
      category: activityLabel(cur.activity, project, equipmentId),
      delayCategory: delayCategoryOf(cur.activity),
      startTime: cur.startTime,
      endTime: end,
      operatorName: operator,
      areaL1: cur.areaL1,
      areaL2: cur.areaL2,
      areaL3: cur.areaL3,
      areaId: cur.areaId,
      subAreaId: cur.subAreaId,
      subSubAreaId: cur.subSubAreaId,
      pass: cur.pass,
      passType: cur.passType,
      layerId: cur.layerId,
      delayCodeId: cur.activity?.id ?? null,
      description: cur.notes,
      lane: cur.lane,
      step: cur.step,
    })
    notifySuccess('Session saved')
  }

  function latestSessionEnd() {
    return sessions.reduce((latest, s) => (!latest || s.endTime > latest ? s.endTime : latest), null)
  }

  function recordGap(gapEnd, { atShiftEnd = false } = {}) {
    const previousEnd = latestSessionEnd() ?? gapAnchor
    const startsShift = !previousEnd || (!!shiftStart && previousEnd < shiftStart)
    const gapStart = startsShift ? shiftStart : previousEnd
    if (!gapStart || gapEnd - gapStart <= GAP_THRESHOLD_MS) return

    let description
    if (atShiftEnd) {
      description = startsShift
        ? 'Full shift startup/shutdown (auto-logged)'
        : 'Post-shift / ride back to shore (auto-logged)'
    } else {
      description = startsShift
        ? 'Pre-work startup (auto-logged)'
        : 'Between sessions (auto-logged)'
    }

    recordSession({
      category: STARTUP_SHUTDOWN_LABEL,
      delayCategory: STARTUP_SHUTDOWN_CATEGORY,
      startTime: gapStart,
      endTime: gapEnd,
      operatorName: operator,
      description,
    }, { notes: null })
  }

  function startSession(activity, lane, stepVal) {
    const startTime = new Date()
    if (activeSession) {
      endActiveSession(startTime)
    } else {
      recordGap(startTime)
    }
    const session = {
      activity,
      startTime,
      ...areaCascade.labels,
      ...areaCascade.ids,
      ...resolvePass(project, equipmentId, passValue, passFieldSpec.options),
      notes,
      lane: lane || '',
      step: stepVal || '',
    }
    setActiveSession(session)
    setNotes('')
    setNow(Date.now())
    persistActiveSession(session)
    notifyInfo(`Started: ${activityLabel(activity, project, equipmentId)}`)
  }

  function handleActivityClick(activity) {
    if (usesLaneStep(project, equipmentId)) {
      setPendingActivity(activity)
      setLaneStepOpen(true)
      return
    }
    startSession(activity, '', '')
  }

  function handleLaneStepContinue({ lane, step: stepVal }) {
    setLastLane(lane); setLastStep(stepVal)
    setLaneStepOpen(false)
    startSession(pendingActivity, lane, stepVal)
    setPendingActivity(null)
  }

  async function confirmDeleteSession() {
    const target = deleteRow
    if (!target) return
    setDeleteRow(null)
    setSessions((prev) => prev.filter((s) => s.id !== target.id))
    deleteStoredSession(target.id).catch(() => {})
    const dropped = await dropSessionFromQueue(target.id)
    if (dropped > 0) {
      notifyInfo('Session deleted', 'It had not synced yet, so nothing was sent to the office.')
    } else {
      notifyInfo('Session removed from this device', 'The synced record is unchanged.')
    }
  }

  function confirmShiftEnd(explicitEnd) {
    let end = explicitEnd
    if (!end) {
      end = new Date()
      end.setHours(shiftEndTime.hours, shiftEndTime.minutes, 0, 0)
    }
    if (activeSession) {
      endActiveSession(end)
    } else {
      recordGap(end, { atShiftEnd: true })
    }
    remember({ shiftStartISO: null, shiftDate: null, sessionId: null, lastShiftEndISO: end.toISOString() })
    setShiftEndOpen(false)
    setStep('confirmSetup')
    notifySuccess('Day logged')
  }

  function adoptRecoveredContext(recoveryData, recoveredProject) {
    setShiftStart(recoveryData.shiftStartISO ? new Date(recoveryData.shiftStartISO) : null)
    setGapAnchor(new Date(recoveryData.startTimeISO))
    setProject(recoveredProject)
    setEquipment(recoveryData.equipment)
    setEquipmentId(recoveryData.equipmentId)
    setOperator(recoveryData.operator)
    setOperatorId(recoveryData.operatorId)
    setSessionId(recoveryData.sessionId)
    setStep('tracking')
  }

  function saveRecoveredSession() {
    const { recoveryData, recoveredProject } = crashRecovery
    const { start, end } = crashRecovery.buildRecoveredSession()
    recordSession({
      category: activityLabel(recoveryData.activity, recoveredProject, recoveryData.equipmentId),
      delayCategory: delayCategoryOf(recoveryData.activity),
      startTime: start,
      endTime: end,
      operatorName: recoveryData.operator,
      areaL1: recoveryData.areaL1,
      areaL2: recoveryData.areaL2,
      areaL3: recoveryData.areaL3,
      areaId: recoveryData.areaId,
      subAreaId: recoveryData.subAreaId,
      subSubAreaId: recoveryData.subSubAreaId,
      pass: recoveryData.pass,
      passType: recoveryData.passType,
      layerId: recoveryData.layerId,
      delayCodeId: recoveryData.activity?.id ?? null,
      description: recoveryData.notes,
      lane: recoveryData.lane,
      step: recoveryData.step,
    }, {
      projectId: recoveredProject.id,
      equipmentId: recoveryData.equipmentId,
      operatorId: recoveryData.operatorId,
      sessionId: recoveryData.sessionId,
    })
    crashRecovery.clear()
    adoptRecoveredContext(recoveryData, recoveredProject)
    notifySuccess('Session recovered')
  }
  function discardRecoveredSession() {
    const { recoveryData, recoveredProject } = crashRecovery
    crashRecovery.clear()
    adoptRecoveredContext(recoveryData, recoveredProject)
    notifyInfo('Session discarded')
  }

  if (step === null) {
    return (
      <Box
        style={{
          flex: 1, minHeight: 0, background: COLORS.primaryBlue, fontFamily: FONT_FAMILY,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14,
        }}
      >
        <Image src={brennanLogo} h={44} fit="contain" />
        <Text size="sm" c="rgba(255,255,255,0.55)">Checking for an open shift…</Text>
      </Box>
    )
  }

  if (step === 'sessionInterrupted' && crashRecovery.recoveryData) {
    return (
      <SessionInterruptedScreen
        projectsLoading={projectsLoading}
        recoveredProject={crashRecovery.recoveredProject}
        recoveryData={crashRecovery.recoveryData}
        now={now}
        recoveryEndTime={crashRecovery.recoveryEndTime}
        onChangeRecoveryEndTime={crashRecovery.setRecoveryEndTime}
        onSave={saveRecoveredSession}
        onDiscard={discardRecoveredSession}
      />
    )
  }

  if (step === 'project') {
    return (
      <PickerScreen
        title="Select Project"
        subtitle={projectsLoading ? 'Loading projects…' : projectsOffline ? 'Offline — showing last-synced projects' : new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
        items={projects.map((p) => ({ id: p.id, label: p.name, sub: p.client }))}
        selectedId={project?.id ?? lastUsed?.projectId}
        onSelect={selectProject}
      />
    )
  }
  if (step === 'equipment' && project) {
    return (
      <PickerScreen
        title="Select Equipment"
        subtitle={project.name}
        items={project.equipment.map((e) => ({ id: e.id, label: e.name }))}
        selectedId={equipmentId ?? lastUsed?.equipmentId}
        onSelect={selectEquipment}
        onBack={() => setStep('project')}
      />
    )
  }
  if (step === 'operator' && project) {
    return (
      <PickerScreen
        title="Who is operating?"
        subtitle={`${equipment} · ${project.name}`}
        items={project.operators.map((o) => ({ id: o.id, label: o.name, initials: true }))}
        selectedId={operatorId ?? lastUsed?.operatorId}
        allowTextFallback={project.operators.length === 0}
        fallbackNotice={NO_ROSTER_NOTICE}
        onSelect={selectOperator}
        onBack={() => setStep(project.equipment.length > 1 ? 'equipment' : 'project')}
      />
    )
  }

  if (step === 'swapOperator' && project) {
    return (
      <PickerScreen
        title="Who is operating?"
        subtitle={`${equipment} · ${project.name}`}
        items={project.operators.map((o) => ({ id: o.id, label: o.name, initials: true }))}
        selectedId={operatorId}
        allowTextFallback={project.operators.length === 0}
        fallbackNotice={NO_ROSTER_NOTICE}
        onSelect={selectSwapOperator}
        onBack={() => setStep('tracking')}
      />
    )
  }

  if (step === 'shiftStart' && project) {
    return (
      <ShiftStartScreen
        operator={operator}
        equipment={equipment}
        shiftTime={shiftTime}
        onChangeShiftTime={setShiftTime}
        onConfirm={confirmShiftStart}
        onSkip={skipShiftStart}
      />
    )
  }

  if (step === 'confirmSetup' && project) {
    return (
      <ConfirmSetupScreen
        project={project}
        equipment={equipment}
        operator={operator}
        onEditProject={() => setStep('project')}
        onEditEquipment={() => setStep('equipment')}
        onEditOperator={() => setStep('operator')}
        onConfirm={goToShiftStart}
      />
    )
  }

  if (!project) return null

  const activeIsRunning = !!activeSession
  const delayCodes = visibleDelayCodes(project, equipmentId, workTypeNameById)
  const seenCats = []
  delayCodes.forEach((c) => {
    if (!seenCats.includes(c.category)) seenCats.push(c.category)
  })
  const todayKey = localDateKey()
  const todayRows = sessions.filter((s) => dateKeyOf(s) === todayKey)
  const todayHours = totalHoursOf(todayRows)
  const days = groupSessionsByDate(sessions)

  return (
    <ScrollArea style={{ flex: 1, minHeight: 0, background: COLORS.lightGray }}>
      <Box style={{ fontFamily: FONT_FAMILY }}>
        <Box px={20} py={14} style={{ background: `linear-gradient(135deg, ${COLORS.primaryBlue} 0%, ${COLORS.primaryBlueDark} 100%)` }}>
          <Group justify="space-between" align="center">
            <Group gap={16}>
              <Image src={brennanLogo} h={40} fit="contain" />
              <Box>
                <Text size="sm" fw={700} c="#fff">{project.name}</Text>
                <Text size="xs" c="rgba(255,255,255,0.75)">{equipment} · {operator}</Text>
              </Box>
            </Group>
            <Group gap={10}>
              <ActionIcon
                radius="xl" size={44} title="Change Operator" onClick={beginOperatorSwap}
                style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}
              >
                <IconUserCircle size={18} />
              </ActionIcon>
              <ActionIcon
                radius="xl" size={44} title="Add Past Session" onClick={() => setAddPastOpen(true)}
                style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}
              >
                <IconPlus size={18} />
              </ActionIcon>
              <Button
                style={{
                  background: failedSyncCount > 0
                    ? COLORS.accentRed
                    : (pendingSyncCount > 0 ? COLORS.warningBorder : 'rgba(255,255,255,0.15)'),
                  color: '#fff',
                }}
                onClick={() => setSyncModalOpen(true)}
              >
                {failedSyncCount > 0 && `⚠ ${failedSyncCount} Failed`}
                {failedSyncCount === 0 && pendingSyncCount > 0 && `⏳ ${pendingSyncCount} Pending`}
                {failedSyncCount === 0 && pendingSyncCount === 0 && '✓ Synced'}
              </Button>
              <Button style={{ background: COLORS.primaryBlue }} onClick={openShiftEnd}>
                End of Day
              </Button>
            </Group>
          </Group>
        </Box>

        <Group justify="space-between" px={20} py={8} style={{ background: COLORS.mediumGray, borderBottom: `1px solid ${COLORS.borderGray}` }}>
          <Text size="xs" fw={600} c={activeIsRunning ? COLORS.secondaryGreen : COLORS.textMedium}>
            {activeIsRunning ? `● Recording: ${activityLabel(activeSession.activity, project, equipmentId)}` : '● Ready - Tap a category to start'}
          </Text>
          <Group gap={8}>
            {projectsOffline && (
              <Badge style={{ background: COLORS.warningBorder, color: '#fff' }} radius="xl">
                ⚠ Offline
              </Badge>
            )}
            <Badge style={{ background: COLORS.primaryBlue, color: '#fff' }} radius="xl">
              {todayRows.length} session{todayRows.length === 1 ? '' : 's'} today
            </Badge>
          </Group>
        </Group>

        {activeIsRunning && (
          <Group justify="space-between" px={20} py={12} mx={15} my={10} style={{ background: COLORS.warningBg, border: `1px solid ${COLORS.warningBorder}`, borderRadius: 8 }}>
            <Box>
              <Text size="sm" fw={700}>{activityLabel(activeSession.activity, project, equipmentId)}</Text>
              <Text size="xs" c={COLORS.warningText} style={{ fontVariantNumeric: 'tabular-nums' }}>{formatClock(now - activeSession.startTime.getTime())}</Text>
            </Box>
            <Button size="xs" leftSection={<IconPlayerStopFilled size={12} />} style={{ background: COLORS.accentRed }} onClick={() => endActiveSession()}>
              Stop
            </Button>
          </Group>
        )}

        <Group px={16} py={10} gap={10} align="flex-end" style={{ background: '#f8f9fa', borderBottom: '1px solid #dee2e6', flexWrap: 'wrap' }}>
          <AreaCascadeSelects cascade={areaCascade} project={project} size="xs" width={160} />
          <Select label={passFieldSpec.label} data={passFieldSpec.options} value={passValue} onChange={(v) => setPassValue(v ?? '')} clearable size="xs" style={{ width: 140 }} />
          <Textarea label="Notes" placeholder="Optional..." value={notes} onChange={(e) => setNotes(e.currentTarget.value)} autosize minRows={1} size="xs" style={{ flex: 1, minWidth: 200 }} />
        </Group>

        <Box p={16}>
          <UnstyledButton
            disabled={activeIsRunning && activeSession.activity.active}
            onClick={() => handleActivityClick({ active: true })}
            style={{
              display: 'block', width: '100%', padding: 16, borderRadius: 8, marginBottom: 14,
              background: COLORS.secondaryGreen, color: '#fff', fontSize: 15, fontWeight: 800, letterSpacing: '0.04em',
              textAlign: 'center', opacity: activeIsRunning && activeSession.activity.active ? 0.6 : 1,
            }}
          >
            {activeTileLabel(project, equipmentId)}
          </UnstyledButton>

          {favorites.length > 0 && (
            <>
              <Text size="11px" fw={800} c="#B8860B" tt="uppercase" mb={6} style={{ letterSpacing: '0.06em' }}>★ Favorites</Text>
              <Group gap={10} mb={16}>
                {delayCodes.filter((c) => favorites.includes(c.codeNum)).map((c) => (
                  <TileButton key={c.codeNum} code={c} color={groupColor(project, c.category)} isFavorite onToggleFavorite={toggleFavorite} onClick={() => handleActivityClick(c)} isActive={activeIsRunning && !activeSession.activity.active && activeSession.activity.codeNum === c.codeNum} />
                ))}
              </Group>
            </>
          )}

          {seenCats.map((cat) => (
            <Box key={cat} mb={16}>
              <Text size="11px" fw={800} c="#5a6a7a" tt="uppercase" mb={6} style={{ letterSpacing: '0.06em' }}>{cat}</Text>
              <Group gap={10}>
                {delayCodes.filter((c) => c.category === cat).map((c) => (
                  <TileButton
                    key={c.codeNum}
                    code={c}
                    color={groupColor(project, cat)}
                    isFavorite={favorites.includes(c.codeNum)}
                    onToggleFavorite={toggleFavorite}
                    onClick={() => handleActivityClick(c)}
                    isActive={activeIsRunning && !activeSession.activity.active && activeSession.activity.codeNum === c.codeNum}
                  />
                ))}
              </Group>
            </Box>
          ))}

          <Group justify="flex-end" mt={8}>
            <Text size="sm" fw={700} c={COLORS.primaryBlue}>Today&rsquo;s Hours: {todayHours.toFixed(2)}</Text>
          </Group>
        </Box>

        <Box px={16} pb={16}>
          {sessions.length === 0 ? (
            <Box style={{ background: '#fff', border: `1px dashed ${COLORS.borderGray}`, borderRadius: 8 }} py={30}>
              <Text size="sm" c={COLORS.textLight} ta="center">No sessions recorded yet</Text>
              <Text size="xs" c={COLORS.textLight} ta="center" mt={4}>Tap a category to start tracking</Text>
            </Box>
          ) : (
            days.map((day) => (
              <Box key={day.dateKey} mb={14}>
                <Group
                  justify="space-between"
                  wrap="nowrap"
                  px={4}
                  py={6}
                  mb={6}
                  style={{ borderBottom: `2px solid ${COLORS.borderGray}` }}
                >
                  <Text size="xs" fw={800} c={COLORS.textDark} tt="uppercase" style={{ letterSpacing: '0.06em' }}>
                    {dayHeading(day.dateKey)}
                  </Text>
                  <Text size="xs" fw={600} c={COLORS.textMedium} style={{ flexShrink: 0 }}>
                    {day.rows.length} session{day.rows.length === 1 ? '' : 's'} · {day.hours.toFixed(2)} hrs
                  </Text>
                </Group>

                {day.rows.map((s) => (
                  <Group key={s.id} wrap="nowrap" style={{ background: COLORS.lightGray, border: `1px solid ${COLORS.borderGray}`, borderRadius: 8, padding: 12, marginBottom: 8 }}>
                    <Box style={{ width: 5, height: 34, borderRadius: 3, background: sessionColor(project, s), flexShrink: 0 }} />
                    <Box style={{ flex: 1, minWidth: 0 }}>
                      <Text size="sm" fw={700} c={COLORS.textDark} truncate>
                        {s.category}{s.lane ? ` · Lane ${s.lane}` : ''}{s.step ? ` / Step ${s.step}` : ''}
                      </Text>
                      <Text size="xs" c={COLORS.textMedium}>
                        {formatTimeOfDay(s.startTime)}–{formatTimeOfDay(s.endTime)} · {s.operatorName}
                        {s.areaL1 ? ` · ${s.areaL1}` : ''}{s.areaL2 ? ` · ${s.areaL2}` : ''}{s.areaL3 ? ` · ${s.areaL3}` : ''}{s.pass ? ` · ${s.pass}` : ''}
                      </Text>
                    </Box>
                    <Text size="sm" fw={700} c={COLORS.primaryBlue} style={{ flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>{formatClock(s.durationMs)}</Text>
                    <ActionIcon variant="subtle" color="gray" size="sm" onClick={() => setDeleteRow(s)}>
                      <IconTrash size={14} />
                    </ActionIcon>
                  </Group>
                ))}
              </Box>
            ))
          )}
        </Box>
      </Box>

      <LaneStepModal
        opened={laneStepOpen}
        lastLane={lastLane}
        lastStep={lastStep}
        onCancel={() => { setLaneStepOpen(false); setPendingActivity(null) }}
        onContinue={handleLaneStepContinue}
      />
      <AddPastSessionModal
        opened={addPastOpen}
        onClose={() => setAddPastOpen(false)}
        project={project}
        equipmentId={equipmentId}
        activeTileLabel={activeTileLabel(project, equipmentId)}
        passFieldSpec={passFieldSpec}
        workTypeNameById={workTypeNameById}
        onSave={(s) => {
          recordSession(s, { operatorId: s.operatorId })
          notifySuccess('Past session added')
        }}
      />

      <ConfirmDeleteModal
        session={deleteRow}
        onCancel={() => setDeleteRow(null)}
        onConfirm={confirmDeleteSession}
      />

      <SyncStatusModal
        opened={syncModalOpen}
        onClose={() => setSyncModalOpen(false)}
        syncedCount={Math.max(0, todayRows.length - pendingSyncCount - failedSyncCount)}
        pendingSyncCount={pendingSyncCount}
        pendingItems={pendingItems}
        failedSyncCount={failedSyncCount}
        failedItems={failedItems}
        onRetry={drainQueue}
        onRetryFailed={retryFailed}
      />

      <ShiftEndOverlay
        opened={shiftEndOpen}
        shiftEndTime={shiftEndTime}
        onChangeShiftEndTime={setShiftEndTime}
        onConfirm={() => confirmShiftEnd()}
        onSkip={() => confirmShiftEnd(new Date())}
      />
    </ScrollArea>
  )
}
