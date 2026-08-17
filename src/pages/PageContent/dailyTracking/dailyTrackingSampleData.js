
const LIFT_OPTIONS = ['Lift 1', 'Lift 2', 'Lift 3', 'Lift 4', 'Lift 5', 'Lift 6', 'Lift 7', 'Lift 8', 'N/A'];

export const DEFAULT_PROJECT_EXTRAS = {
  workType: 'dredging',
  areaLabel: 'Area',
  passLabel: 'Pass',
  areas: [],
  passOptions: [],
  usesLaneStep: false,
  delayCodes: [],
};

export const PROJECT_EXTRAS_BY_NAME = {
  'Sandy Point Harbor Dredging': {
    workType: 'dredging',
    areaLabel: 'Area',
    passLabel: 'Pass',
    areas: ['North Basin', 'Turning Basin', 'South Channel'],
    passOptions: ['1st Pass', '2nd Pass', '3rd Pass', '4th Pass', '5th Pass'],
    usesLaneStep: false,
    delayCodes: [
      { category: 'Startup/Shutdown', code: 'Startup', codeNum: 1 },
      { category: 'Startup/Shutdown', code: 'ShutDown', codeNum: 2 },
      { category: 'Support Systems', code: 'Service Water', codeNum: 10 },
      { category: 'Support Systems', code: 'Sensors/DredgePack/GPS', codeNum: 11 },
      { category: 'Support Systems', code: 'Engine Room', codeNum: 12 },
      { category: 'Maintenance', code: 'CLEAN CUTTERHEAD', codeNum: 20 },
      { category: 'Maintenance', code: 'Mechanical Repair', codeNum: 21 },
      { category: 'Maintenance', code: 'Electrical Repair', codeNum: 22 },
      { category: 'Pipeline', code: 'WASH PIPELINE', codeNum: 30 },
      { category: 'Pipeline', code: 'Pipe Extension', codeNum: 31 },
      { category: 'Pipeline', code: 'Pipe Leak Repair', codeNum: 32 },
      { category: 'Mobilization', code: 'MOB TO NEW AREA', codeNum: 40 },
      { category: 'Mobilization', code: 'Move Dredge', codeNum: 41 },
      { category: 'Weather', code: 'Weather Delay', codeNum: 50 },
      { category: 'Weather', code: 'Lightning Hold', codeNum: 51 },
      { category: 'Survey/Admin', code: 'Survey', codeNum: 60 },
      { category: 'Survey/Admin', code: 'Safety Meeting', codeNum: 61 },
      { category: 'Survey/Admin', code: 'Waiting on Instructions', codeNum: 62 },
    ],
  },
  'Clearwater Cove Capping': {
    workType: 'capping',
    areaLabel: 'Subarea',
    passLabel: 'Lift',
    areas: ['Subarea 1', 'Subarea 2', 'Subarea 3'],
    passOptions: LIFT_OPTIONS,
    usesLaneStep: true,
    delayCodes: [
      { category: 'Startup/Shutdown', code: 'Startup', codeNum: 1 },
      { category: 'Startup/Shutdown', code: 'ShutDown', codeNum: 2 },
      { category: 'Material Supply', code: 'Waiting on Material', codeNum: 10 },
      { category: 'Material Supply', code: 'Barge Delay', codeNum: 11 },
      { category: 'Material Supply', code: 'Loadout Delay', codeNum: 12 },
      { category: 'Maintenance', code: 'Mechanical Repair', codeNum: 20 },
      { category: 'Maintenance', code: 'Spreader Repair', codeNum: 21 },
      { category: 'Weather', code: 'Weather Delay', codeNum: 30 },
      { category: 'Weather', code: 'Tide Restriction', codeNum: 31 },
      { category: 'Survey/Admin', code: 'Survey', codeNum: 40 },
      { category: 'Survey/Admin', code: 'Safety Meeting', codeNum: 41 },
      { category: 'Survey/Admin', code: 'QA/QC Hold', codeNum: 42 },
      { category: 'Mobilization', code: 'Move Spreader', codeNum: 50 },
    ],
  },
};

export function getProjectExtras(projectName) {
  return PROJECT_EXTRAS_BY_NAME[projectName] ?? DEFAULT_PROJECT_EXTRAS;
}
