
export const DEFAULT_PROJECT_EXTRAS = {
  workType: 'dredging',
  usesLaneStep: false,
};

export const PROJECT_EXTRAS_BY_NAME = {};

export function getProjectExtras(projectName) {
  return PROJECT_EXTRAS_BY_NAME[projectName] ?? DEFAULT_PROJECT_EXTRAS;
}
