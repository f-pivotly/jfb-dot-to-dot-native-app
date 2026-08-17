import { useState } from 'react'

export function useAreaCascade(project) {
  const [areaValue, setAreaValue] = useState('')
  const [subAreaValue, setSubAreaValue] = useState('')
  const [subSubAreaValue, setSubSubAreaValue] = useState('')

  const areaOptions = project?.areasFlat?.length
    ? project.areasFlat.filter((a) => a.depth === 1).map((a) => ({ value: a.id, label: a.name }))
    : (project?.areas || [])
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
    const opt = options.find((o) => (typeof o === 'string' ? o === value : o.value === value))
    if (!opt) return value
    return typeof opt === 'string' ? opt : opt.label
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
    handleAreaChange,
    handleSubAreaChange,
    handleSubSubAreaChange,
    labelForValue,
    reset,
  }
}
