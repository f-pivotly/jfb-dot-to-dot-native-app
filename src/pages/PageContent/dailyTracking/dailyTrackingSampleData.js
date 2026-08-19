
export const DEFAULT_PROJECT_EXTRAS = {
  workType: 'dredging',
  usesLaneStep: false,
};

export const PROJECT_EXTRAS_BY_NAME = {
  'Sandy Point Harbor Dredging': {
    workType: 'dredging',
    usesLaneStep: false,
  },
  'Clearwater Cove Capping': {
    workType: 'capping',
    usesLaneStep: true,
  },
};

export function getProjectExtras(projectName) {
  return PROJECT_EXTRAS_BY_NAME[projectName] ?? DEFAULT_PROJECT_EXTRAS;
}
