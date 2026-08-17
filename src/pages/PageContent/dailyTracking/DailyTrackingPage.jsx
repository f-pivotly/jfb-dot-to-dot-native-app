import { useState, useEffect } from 'react'
import { Box, Text, Group, Button, Select, Textarea, ActionIcon, ScrollArea, UnstyledButton, Image, Badge } from '@mantine/core'
import { IconPlayerStopFilled, IconTrash, IconUserCircle, IconPlus } from '@tabler/icons-react'
import PickerScreen from './PickerScreen'
import LaneStepModal from './LaneStepModal'
import AddPastSessionModal from './AddPastSessionModal'
import TileButton from './TileButton'
import SessionInterruptedScreen from './SessionInterruptedScreen'
import ShiftStartScreen from './ShiftStartScreen'
import ConfirmSetupScreen from './ConfirmSetupScreen'
import ShiftEndOverlay from './ShiftEndOverlay'
import SyncStatusModal from './SyncStatusModal'
import { COLORS, FONT_FAMILY } from '../../../theme'
import { activeTileLabel, activityLabel, groupColor, formatClock, formatDuration, formatTimeOfDay } from './dailyTrackingFormat'
import { writeRecovery, clearRecovery } from './recoverySession'
import { saveDailyActivity } from './saveDailyActivity'
import { buildProjects } from './projectsViewModel'
import { useAreaCascade } from './useAreaCascade'
import { useOfflineSyncQueue } from './useOfflineSyncQueue'
import { useCrashRecovery } from './useCrashRecovery'
import { useDomainData } from '../../../hooks/useDomainData'
import { useCachedDomainData } from '../../../hooks/useCachedDomainData'
import { findDomainSource } from '../../../helpers/formatting'
import brennanLogo from './assets/brennan-logo.png'

export default function DailyTrackingPage({ domainSources = [] }) {
  const projectsSource = findDomainSource(domainSources, 'jfb_projects')
  const operatorsSource = findDomainSource(domainSources, 'jfb_operators')
  const equipmentsSource = findDomainSource(domainSources, 'jfb_equipments')
  const dailyActivitiesSource = findDomainSource(domainSources, 'jfb_daily_activities')
  const areasSource = findDomainSource(domainSources, 'jfb_project_areas')
  const areaLevelsSource = findDomainSource(domainSources, 'jfb_project_area_levels')

  const { records: projectRecords, loading: projectsLoading, offline: projectsOffline } = useCachedDomainData({ domain: projectsSource?.domain, system: projectsSource?.system })
  const { records: operatorRecords } = useCachedDomainData({ domain: operatorsSource?.domain, system: operatorsSource?.system })
  const { records: equipmentRecords } = useCachedDomainData({ domain: equipmentsSource?.domain, system: equipmentsSource?.system })
  const { records: areaRecords } = useCachedDomainData({ domain: areasSource?.domain, system: areasSource?.system })
  const { records: areaLevelRecords } = useCachedDomainData({ domain: areaLevelsSource?.domain, system: areaLevelsSource?.system })

  const { create: createDailyActivity } = useDomainData({ domain: dailyActivitiesSource?.domain, system: dailyActivitiesSource?.system })

  const projects = buildProjects({ projectRecords, operatorRecords, equipmentRecords, areaRecords, areaLevelRecords })

  const crashRecovery = useCrashRecovery(projects)

  const [step, setStep] = useState(crashRecovery.recovery ? 'sessionInterrupted' : 'project')
  const [project, setProject] = useState(null)
  const [equipment, setEquipment] = useState(crashRecovery.recovery?.equipment ?? null)
  const [equipmentId, setEquipmentId] = useState(crashRecovery.recovery?.equipmentId ?? null)
  const [operator, setOperator] = useState(crashRecovery.recovery?.operator ?? null)
  const [operatorId, setOperatorId] = useState(crashRecovery.recovery?.operatorId ?? null)
  const [sessionId, setSessionId] = useState(crashRecovery.recovery?.sessionId ?? null)
  const [shiftStart, setShiftStart] = useState(null)
  const [shiftTime, setShiftTime] = useState(() => {
    const d = new Date()
    return { hours: d.getHours(), minutes: d.getMinutes() }
  })

  const [sessions, setSessions] = useState([])
  const [activeSession, setActiveSession] = useState(null)
  const [favoritesByProject, setFavoritesByProject] = useState({})
  const [now, setNow] = useState(() => Date.now())
  const [syncModalOpen, setSyncModalOpen] = useState(false)

  const areaCascade = useAreaCascade(project)
  const [passValue, setPassValue] = useState('')
  const [notes, setNotes] = useState('')
  const [lastLane, setLastLane] = useState('')
  const [lastStep, setLastStep] = useState('')

  const [laneStepOpen, setLaneStepOpen] = useState(false)
  const [pendingActivity, setPendingActivity] = useState(null)
  const [addPastOpen, setAddPastOpen] = useState(false)
  const [shiftEndOpen, setShiftEndOpen] = useState(false)
  const [shiftEndTime, setShiftEndTime] = useState(() => {
    const d = new Date()
    return { hours: d.getHours(), minutes: d.getMinutes() }
  })

  const { pendingSyncCount, pendingItems, drainQueue } = useOfflineSyncQueue({ createDailyActivity })

  useEffect(() => {
    if (!activeSession) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [activeSession])

  const favorites = (project && favoritesByProject[project.id]) || []

  function selectProject(item) {
    const proj = projects.find((p) => p.id === item.id)
    setProject(proj)
    areaCascade.reset()
    setPassValue('')
    if (proj.equipment.length === 1) {
      setEquipment(proj.equipment[0].name)
      setEquipmentId(proj.equipment[0].id)
      setStep('operator')
    } else {
      setStep('equipment')
    }
  }
  function selectEquipment(item) {
    setEquipment(item.label)
    setEquipmentId(item.id)
    setStep('operator')
  }
  function selectOperator(item) {
    setOperator(item.label)
    setOperatorId(item.id)
    setStep('shiftStart')
  }
  function confirmShiftStart() {
    const d = new Date()
    d.setHours(shiftTime.hours, shiftTime.minutes, 0, 0)
    if (d > new Date()) d.setDate(d.getDate() - 1)
    setShiftStart(d)
    setSessionId(crypto.randomUUID())
    setStep('tracking')
  }
  function skipShiftStart() {
    setShiftStart(new Date())
    setSessionId(crypto.randomUUID())
    setStep('tracking')
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
      areaL1: session.areaL1,
      areaL2: session.areaL2,
      areaL3: session.areaL3,
      pass: session.pass,
      notes: session.notes,
      lane: session.lane,
      step: session.step,
    })
  }

  function endActiveSession(endTime) {
    setActiveSession((cur) => {
      if (!cur) return cur
      const end = endTime || new Date()
      setSessions((prev) => [{
        id: crypto.randomUUID(),
        category: cur.activity.active ? activeTileLabel(project) : cur.activity.code,
        delayCategory: cur.activity.active ? null : cur.activity.category,
        startTime: cur.startTime,
        endTime: end,
        durationMs: end - cur.startTime,
        operatorName: operator,
        areaL1: cur.areaL1,
        areaL2: cur.areaL2,
        areaL3: cur.areaL3,
        pass: cur.pass,
        description: cur.notes,
        lane: cur.lane,
        step: cur.step,
      }, ...prev])
      clearRecovery()
      saveDailyActivity(createDailyActivity, {
        projectId: project.id,
        equipmentId,
        operatorId,
        sessionId,
        startTime: cur.startTime,
        endTime: end,
      })
      return null
    })
  }

  function startSession(activity, lane, stepVal) {
    if (activeSession) endActiveSession()
    const session = {
      activity,
      startTime: new Date(),
      areaL1: areaCascade.labelForValue(areaCascade.areaOptions, areaCascade.areaValue),
      areaL2: areaCascade.labelForValue(areaCascade.subAreaOptions, areaCascade.subAreaValue),
      areaL3: areaCascade.labelForValue(areaCascade.subSubAreaOptions, areaCascade.subSubAreaValue),
      pass: passValue,
      notes,
      lane: lane || '',
      step: stepVal || '',
    }
    setActiveSession(session)
    setNow(Date.now())
    persistActiveSession(session)
  }

  function handleActivityClick(activity) {
    if (project.usesLaneStep) {
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

  function toggleFavorite(codeNum) {
    setFavoritesByProject((prev) => {
      const cur = prev[project.id] || []
      const next = cur.includes(codeNum) ? cur.filter((c) => c !== codeNum) : [...cur, codeNum].slice(-5)
      return { ...prev, [project.id]: next }
    })
  }

  function deleteSession(id) {
    setSessions((prev) => prev.filter((s) => s.id !== id))
  }

  function confirmShiftEnd() {
    const end = new Date()
    end.setHours(shiftEndTime.hours, shiftEndTime.minutes, 0, 0)
    if (activeSession) endActiveSession(end)

    const sorted = [...sessions].sort((a, b) => a.startTime - b.startTime)
    const gaps = []
    if (sorted.length === 0 && shiftStart) {
      const totalMs = end - shiftStart
      if (totalMs > 60000) {
        gaps.push({
          id: crypto.randomUUID(), category: 'STARTUP/SHUTDOWN', delayCategory: 'Startup/Shutdown',
          startTime: shiftStart, endTime: end, durationMs: totalMs, operatorName: operator,
          description: 'Full shift startup/shutdown (auto-logged)',
        })
      }
    } else if (sorted.length > 0) {
      const lastEnd = sorted.at(-1).endTime
      const gapMs = end - lastEnd
      if (gapMs > 60000) {
        gaps.push({
          id: crypto.randomUUID(), category: 'STARTUP/SHUTDOWN', delayCategory: 'Startup/Shutdown',
          startTime: lastEnd, endTime: end, durationMs: gapMs, operatorName: operator,
          description: 'Post-shift / ride back to shore (auto-logged)',
        })
      }
    }
    if (gaps.length) {
      setSessions((prev) => [...gaps, ...prev])
      gaps.forEach((gap) => {
        saveDailyActivity(createDailyActivity, {
          projectId: project.id,
          equipmentId,
          operatorId,
          sessionId,
          startTime: gap.startTime,
          endTime: gap.endTime,
        })
      })
    }
    setShiftEndOpen(false)
    setStep('confirmSetup')
  }

  function saveRecoveredSession() {
    const { recoveryData, recoveredProject } = crashRecovery
    const { start, end } = crashRecovery.buildRecoveredSession()
    setSessions((prev) => [{
      id: crypto.randomUUID(),
      category: recoveryData.activity.active ? activeTileLabel(recoveredProject) : recoveryData.activity.code,
      delayCategory: recoveryData.activity.active ? null : recoveryData.activity.category,
      startTime: start, endTime: end, durationMs: end - start,
      operatorName: recoveryData.operator,
      areaL1: recoveryData.areaL1, areaL2: recoveryData.areaL2, areaL3: recoveryData.areaL3,
      pass: recoveryData.pass,
      description: recoveryData.notes, lane: recoveryData.lane, step: recoveryData.step,
    }, ...prev])
    crashRecovery.clear()
    saveDailyActivity(createDailyActivity, {
      projectId: recoveredProject.id,
      equipmentId: recoveryData.equipmentId,
      operatorId: recoveryData.operatorId,
      sessionId: recoveryData.sessionId,
      startTime: start,
      endTime: end,
    })
    setProject(recoveredProject)
    setEquipment(recoveryData.equipment)
    setEquipmentId(recoveryData.equipmentId)
    setOperator(recoveryData.operator)
    setOperatorId(recoveryData.operatorId)
    setSessionId(recoveryData.sessionId)
    setStep('tracking')
  }
  function discardRecoveredSession() {
    const { recoveryData, recoveredProject } = crashRecovery
    crashRecovery.clear()
    setProject(recoveredProject)
    setEquipment(recoveryData.equipment)
    setEquipmentId(recoveryData.equipmentId)
    setOperator(recoveryData.operator)
    setOperatorId(recoveryData.operatorId)
    setSessionId(recoveryData.sessionId)
    setStep('tracking')
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
        items={projects.map((p) => ({ id: p.id, label: p.name }))}
        selectedId={project?.id}
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
        selectedId={equipmentId}
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
        items={project.operators.map((o) => ({ id: o.id, label: o.name }))}
        selectedId={operatorId}
        onSelect={selectOperator}
        onBack={() => setStep(project.equipment.length > 1 ? 'equipment' : 'project')}
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
        onConfirm={() => setStep('shiftStart')}
      />
    )
  }

  if (!project) return null

  const activeIsRunning = !!activeSession
  const seenCats = []
  project.delayCodes.forEach((c) => {
    if (!seenCats.includes(c.category)) seenCats.push(c.category)
  })
  const totalHours = sessions.reduce((sum, s) => sum + s.durationMs, 0) / 3600000

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
                radius="xl" size={44} title="Change Operator" onClick={() => setStep('operator')}
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
                style={{ background: pendingSyncCount > 0 ? (COLORS.warningBorder ?? '#d97706') : 'rgba(255,255,255,0.15)', color: '#fff' }}
                onClick={() => setSyncModalOpen(true)}
              >
                {pendingSyncCount > 0 ? `⏳ ${pendingSyncCount} Pending` : '✓ Synced'}
              </Button>
              <Button style={{ background: COLORS.primaryBlue }} onClick={() => setShiftEndOpen(true)}>
                End of Day
              </Button>
            </Group>
          </Group>
        </Box>

        <Group justify="space-between" px={20} py={8} style={{ background: COLORS.mediumGray, borderBottom: `1px solid ${COLORS.borderGray}` }}>
          <Text size="xs" fw={600} c={activeIsRunning ? COLORS.secondaryGreen : COLORS.textMedium}>
            {activeIsRunning ? `● Recording: ${activityLabel(activeSession.activity, project)}` : '● Ready - Tap a category to start'}
          </Text>
          <Group gap={8}>
            {projectsOffline && (
              <Badge style={{ background: COLORS.warningBorder ?? '#d97706', color: '#fff' }} radius="xl">
                ⚠ Offline
              </Badge>
            )}
            <Badge style={{ background: COLORS.primaryBlue, color: '#fff' }} radius="xl">
              {sessions.length} session{sessions.length === 1 ? '' : 's'}
            </Badge>
          </Group>
        </Group>

        {activeIsRunning && (
          <Group justify="space-between" px={20} py={12} mx={15} my={10} style={{ background: COLORS.warningBg, border: `1px solid ${COLORS.warningBorder}`, borderRadius: 8 }}>
            <Box>
              <Text size="sm" fw={700}>{activityLabel(activeSession.activity, project)}</Text>
              <Text size="xs" c={COLORS.warningText} style={{ fontVariantNumeric: 'tabular-nums' }}>{formatClock(now - activeSession.startTime.getTime())}</Text>
            </Box>
            <Button size="xs" leftSection={<IconPlayerStopFilled size={12} />} style={{ background: COLORS.accentRed }} onClick={() => endActiveSession()}>
              Stop
            </Button>
          </Group>
        )}

        <Group px={16} py={10} gap={10} align="flex-end" style={{ background: '#f8f9fa', borderBottom: '1px solid #dee2e6', flexWrap: 'wrap' }}>
          <Select label={project.areaLabel} data={areaCascade.areaOptions} value={areaCascade.areaValue} onChange={areaCascade.handleAreaChange} clearable size="xs" style={{ width: 160 }} />
          {areaCascade.showSubArea && (
            <Select label={project.subAreaLabel} data={areaCascade.subAreaOptions} value={areaCascade.subAreaValue} onChange={areaCascade.handleSubAreaChange} clearable size="xs" style={{ width: 160 }} />
          )}
          {areaCascade.showSubSubArea && (
            <Select label={project.subSubAreaLabel} data={areaCascade.subSubAreaOptions} value={areaCascade.subSubAreaValue} onChange={areaCascade.handleSubSubAreaChange} clearable size="xs" style={{ width: 160 }} />
          )}
          <Select label={project.passLabel} data={project.passOptions} value={passValue} onChange={(v) => setPassValue(v ?? '')} clearable size="xs" style={{ width: 140 }} />
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
            {activeTileLabel(project)}
          </UnstyledButton>

          {favorites.length > 0 && (
            <>
              <Text size="11px" fw={800} c="#B8860B" tt="uppercase" mb={6} style={{ letterSpacing: '0.06em' }}>★ Favorites</Text>
              <Group gap={10} mb={16}>
                {project.delayCodes.filter((c) => favorites.includes(c.codeNum)).map((c) => (
                  <TileButton key={c.codeNum} code={c} color={groupColor(project, c.category)} isFavorite onToggleFavorite={toggleFavorite} onClick={() => handleActivityClick(c)} isActive={activeIsRunning && !activeSession.activity.active && activeSession.activity.codeNum === c.codeNum} />
                ))}
              </Group>
            </>
          )}

          {seenCats.map((cat) => (
            <Box key={cat} mb={16}>
              <Text size="11px" fw={800} c="#5a6a7a" tt="uppercase" mb={6} style={{ letterSpacing: '0.06em' }}>{cat}</Text>
              <Group gap={10}>
                {project.delayCodes.filter((c) => c.category === cat).map((c) => (
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
            <Text size="sm" fw={700} c={COLORS.primaryBlue}>Total Hours: {totalHours.toFixed(2)}</Text>
          </Group>
        </Box>

        <Box px={16} pb={16}>
          {sessions.length === 0 ? (
            <Box style={{ background: '#fff', border: `1px dashed ${COLORS.borderGray}`, borderRadius: 8 }} py={30}>
              <Text size="sm" c={COLORS.textLight} ta="center">No sessions recorded yet</Text>
              <Text size="xs" c={COLORS.textLight} ta="center" mt={4}>Tap a category to start tracking</Text>
            </Box>
          ) : (
            sessions.map((s) => (
              <Group key={s.id} wrap="nowrap" style={{ background: COLORS.lightGray, border: `1px solid ${COLORS.borderGray}`, borderRadius: 8, padding: 12, marginBottom: 8 }}>
                <Box style={{ width: 5, height: 34, borderRadius: 3, background: s.delayCategory ? groupColor(project, s.delayCategory) : COLORS.secondaryGreen, flexShrink: 0 }} />
                <Box style={{ flex: 1, minWidth: 0 }}>
                  <Text size="sm" fw={700} c={COLORS.textDark} truncate>
                    {s.category}{s.lane ? ` · Lane ${s.lane}` : ''}{s.step ? ` / Step ${s.step}` : ''}
                  </Text>
                  <Text size="xs" c={COLORS.textMedium}>
                    {formatTimeOfDay(s.startTime)}–{formatTimeOfDay(s.endTime)} · {s.operatorName}
                    {s.areaL1 ? ` · ${s.areaL1}` : ''}{s.areaL2 ? ` · ${s.areaL2}` : ''}{s.areaL3 ? ` · ${s.areaL3}` : ''}{s.pass ? ` · ${s.pass}` : ''}
                  </Text>
                </Box>
                <Text size="sm" fw={700} c={COLORS.primaryBlue} style={{ flexShrink: 0 }}>{formatDuration(s.durationMs)}</Text>
                <ActionIcon variant="subtle" color="gray" size="sm" onClick={() => deleteSession(s.id)}>
                  <IconTrash size={14} />
                </ActionIcon>
              </Group>
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
        activeTileLabel={activeTileLabel(project)}
        onSave={(s) => {
          setSessions((prev) => [{ id: crypto.randomUUID(), ...s }, ...prev])
          saveDailyActivity(createDailyActivity, {
            projectId: project.id,
            equipmentId,
            operatorId: s.operatorId,
            sessionId,
            startTime: s.startTime,
            endTime: s.endTime,
          })
        }}
      />

      <SyncStatusModal
        opened={syncModalOpen}
        onClose={() => setSyncModalOpen(false)}
        syncedCount={Math.max(0, sessions.length - pendingSyncCount)}
        pendingSyncCount={pendingSyncCount}
        pendingItems={pendingItems}
        onRetry={drainQueue}
      />

      <ShiftEndOverlay
        opened={shiftEndOpen}
        shiftEndTime={shiftEndTime}
        onChangeShiftEndTime={setShiftEndTime}
        onConfirm={confirmShiftEnd}
      />
    </ScrollArea>
  )
}
