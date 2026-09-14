import { useState } from 'react'

export function useAreaCascade(project) {
  const [areaValue, setAreaValue] = useState('')
  const [subAreaValue, setSubAreaValue] = useState('')
  const [subSubAreaValue, setSubSubAreaValue] = useState('')

  const areaOptions = (project?.areasFlat || [])
    .filter((a) => a.depth === 1)
    .map((a) => ({ value: a.id, label: a.name }))
  const subAreaOptions = (project?.areasFlat || [])
    .filter((a) => a.depth === 2 && a.parent_id === areaValue)
    .map((a) => ({ value: a.id, label: a.name }))
  const subSubAreaOptions = (project?.areasFlat || [])
    .filter((a) => a.depth === 3 && a.parent_id === subAreaValue)
    .map((a) => ({ value: a.id, label: a.name }))
  const showSubArea = !!project?.subAreaLabel && (project?.areasFlat || []).some((a) => a.depth === 2)
  const showSubSubArea = !!project?.subSubAreaLabel && (project?.areasFlat || []).some((a) => a.depth === 3)

  function labelForValue(options, value) {
    if (!value) return ''
    const opt = options.find((o) => o.value === value)
    return opt ? opt.label : value
  }

  const ids = {
    areaId: areaValue || null,
    subAreaId: subAreaValue || null,
    subSubAreaId: subSubAreaValue || null,
  }
  const labels = {
    areaL1: labelForValue(areaOptions, areaValue),
    areaL2: labelForValue(subAreaOptions, subAreaValue),
    areaL3: labelForValue(subSubAreaOptions, subSubAreaValue),
  }

  function handleAreaChange(v) {
    setAreaValue(v ?? '')
    setSubAreaValue('')
    setSubSubAreaValue('')
  }
  function handleSubAreaChange(v) {
    setSubAreaValue(v ?? '')
    setSubSubAreaValue('')
  }
  function handleSubSubAreaChange(v) {
    setSubSubAreaValue(v ?? '')
  }

  function reset() {
    setAreaValue('')
    setSubAreaValue('')
    setSubSubAreaValue('')
  }

  return {
    areaValue,
    subAreaValue,
    subSubAreaValue,
    areaOptions,
    subAreaOptions,
    subSubAreaOptions,
    showSubArea,
    showSubSubArea,
    visibleCount: 1 + (showSubArea ? 1 : 0) + (showSubSubArea ? 1 : 0),
    handleAreaChange,
    handleSubAreaChange,
    handleSubSubAreaChange,
    ids,
    labels,
    reset,
  }
}
