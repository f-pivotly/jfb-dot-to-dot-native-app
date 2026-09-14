import { Select } from '@mantine/core'

export default function AreaCascadeSelects({ cascade, project, size, width }) {
  const style = width ? { width } : undefined
  return (
    <>
      <Select
        label={project?.areaLabel ?? 'Area'}
        data={cascade.areaOptions}
        value={cascade.areaValue}
        onChange={cascade.handleAreaChange}
        clearable
        size={size}
        style={style}
      />
      {cascade.showSubArea && (
        <Select
          label={project?.subAreaLabel}
          data={cascade.subAreaOptions}
          value={cascade.subAreaValue}
          onChange={cascade.handleSubAreaChange}
          clearable
          size={size}
          style={style}
        />
      )}
      {cascade.showSubSubArea && (
        <Select
          label={project?.subSubAreaLabel}
          data={cascade.subSubAreaOptions}
          value={cascade.subSubAreaValue}
          onChange={cascade.handleSubSubAreaChange}
          clearable
          size={size}
          style={style}
        />
      )}
    </>
  )
}
