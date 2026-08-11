# Loop table domain schema vs. jfb-dot-to-dot — gap analysis

Reviewing a proposed 4-domain schema (`projects`, `operators`, `equipments`, `daily_activities`) against what the real `jfb-dot-to-dot` app actually reads/writes from Supabase. Every claim below is confirmed directly against the source in `jfb-dot-to-dot/js/app.js` and `jfb-dot-to-dot/js/db.js` — file:line cited so it can be checked independently.

## Proposed schema (as given)

| Domain | Attributes |
|---|---|
| `projects` | `name: text`, `project_id: uuid` |
| `operators` | `operator_id: uuid`, `email: text`, `name: text`, `favourite_activity_ids: picklist`, `project_id: FK → projects.project_id` |
| `equipments` | `equipment_id: uuid`, `name: text`, `project_id: FK → projects.project_id` |
| `daily_activities` | `project_id: FK`, `equipment_id: FK`, `operator_id: FK`, `start_date_time: date_time`, `end_date_time: date_time`, `timezone: text`, `session_id: text`, `task_id: picklist` |

## Confirmed gaps

### 1. `projects` has no `work_type`
Four separate places in the real app branch on this one field:

- `js/app.js:1102-1103` — `isCappingProject()` reads `db.projectConfig.work_type`, `.includes('cap')`
- `js/app.js:1110-1114` — `passOrLiftOptions()`: capping gets a hardcoded Lift list, dredging gets `pass_types` rows
- `js/app.js:1136-1139` — `passFieldLabelText()`: "Lift" vs "Pass" (or "Layer") depends on it
- `js/app.js:1269-1270` — `handleActivityClick()`: the Lane & Step modal only fires `if (this.isCappingProject())`

Verified against the real seed data too — `projects.work_type` is `'Hydraulic Dredging'` for Sandy Point Harbor Dredging and `'Hydraulic Capping'` for Clearwater Cove Capping, and the app's own field-select query (`js/db.js:90`) explicitly selects `work_type` alongside the project row.

### 2. No Areas domain
`js/db.js:148` (`getProjectAreas`) and `js/db.js:168` (`getAllProjectAreas`) both query a `project_areas` table. `js/app.js:312` loads it into `this.projectAreas` on init, and `renderAreaFields()` (`js/app.js:1162` onward) uses it to build the Session Fields' Area/Subarea dropdown(s). Nothing in the proposed schema represents this.

### 3. No Pass/Lift options domain
`js/db.js:186` (`getPassTypes`) queries a real `pass_types` table, scoped by `work_type` (`'dredging'`/`'capping'`/`'both'`) — this is what populates "1st Pass"–"5th Pass" for dredging projects. Capping's "Lift 1"–"Lift 8" list is hardcoded client-side, not a domain, but the dredging side genuinely needs one and none exists in the proposed schema.

### 4. No delay-code/category domain
`js/db.js:243` (`getDelayCodes`) queries `project_delay_codes` — rows with `category`, `code`, `code_num`, scoped to a single project via FK. This is what the Categories Grid groups and sorts by. The proposed `daily_activities.task_id` picklist has no way to carry per-project scoping, a category grouping, or a sort order — confirmed by the real data: Sandy Point Harbor Dredging has 18 codes across 7 categories, Clearwater Cove Capping has 13 codes across 6 *different* categories.

### 5. `daily_activities` is missing the fields an activity record actually needs
`js/db.js:391-403`, inside the Supabase sync (`_syncPending`), writes exactly these columns to `daily_events` for every session:

```js
area_l1:      session.areaL1 || session.dmu || null,
pass_number:  this._passNumberFor(session.pass),
lane:         session.lane || null,
step:         session.step || null,
notes:        session.notes || session.description || null,
```

None of `area`, `pass`/`lift`, `lane`, `step`, or `notes` appear among `daily_activities`' 8 attributes in the proposed schema (`project_id`, `equipment_id`, `operator_id`, `start_date_time`, `end_date_time`, `timezone`, `session_id`, `task_id`). This is core data captured on every single tile tap in the real app.

## Bottom line

The proposed schema models *who did what, when* (projects/operators/equipment/activity FK graph) but not *what the "what" actually is* (categorized, project-scoped delay codes with a work-type-dependent Pass/Lift/Layer system) or *where* (areas). To power the real app's behavior it would need, at minimum:

- `work_type` added to `projects`
- a `project_areas` domain (project-scoped)
- a `pass_types` domain (work-type-scoped)
- a `project_delay_codes` domain (project-scoped, with `category` + `code` + sort order)
- `area`, `pass`/`lift`, `lane`, `step`, `notes` fields added to `daily_activities`
