/**
 * PolarOps Assistant Knowledge & Chat Service
 * Grounded in actual PolarOps routes, role-based access control, operational workflows,
 * and ML Inventory Demand Prediction specifications.
 */

import { type UserRole } from '@/context/OperationalContext'

export interface ChatNavigationAction {
  label: string
  path: string
  description?: string
}

export interface ChatMessage {
  id: string
  sender: 'user' | 'assistant' | 'system'
  text: string
  timestamp: string
  actions?: ChatNavigationAction[]
  category?: 'general' | 'role' | 'page' | 'ml' | 'tutorial' | 'navigation' | 'safety'
  isStreaming?: boolean
}

export interface ChatContext {
  currentRole: UserRole
  pathname: string
  opconLevel?: string
  unreadAlerts?: number
  theme?: 'light' | 'dark'
}

// -------------------------------------------------------------------------------------
// GROUNDED SYSTEM KNOWLEDGE
// -------------------------------------------------------------------------------------

export const VERIFIED_ROUTES: Record<string, { title: string; path: string; description: string; authorizedRoles: string[] }> = {
  '/dashboard': {
    title: 'Operational Dashboard',
    path: '/dashboard',
    description: 'Central operational cockpit displaying active stations (Maitri, Bharati, Himadri), OPCON status, live logistics telemetry, and quick alert feeds.',
    authorizedRoles: ['Admin', 'Expedition Coordinator', 'Inventory Manager', 'Emergency Coordinator', 'Logistics Officer', 'Station Officer'],
  },
  '/mission-control': {
    title: 'Mission Control',
    path: '/mission-control',
    description: 'Director-level strategic oversight dashboard with global OPCON level escalation controls, fleet-wide emergency broadcast dispatch, and live audit tracking.',
    authorizedRoles: ['Admin'],
  },
  '/expeditions': {
    title: 'Expeditions Management',
    path: '/expeditions',
    description: 'Management of 44th ISEA and Arctic research missions, waypoint traverse logging, personnel assignments, and active field expedition ledgers.',
    authorizedRoles: ['Admin', 'Expedition Coordinator', 'Emergency Coordinator', 'Station Officer', 'Logistics Officer'],
  },
  '/cargo': {
    title: 'Cargo & Logistics',
    path: '/cargo',
    description: 'Vessel manifests (e.g., MV Vasily Golovnin), TEU container tracking, 6-stage logistics timelines (Planned -> Packed -> Loaded -> In Transit -> Arrived -> Received), and HAZMAT monitoring.',
    authorizedRoles: ['Admin', 'Expedition Coordinator', 'Logistics Officer'],
  },
  '/inventory': {
    title: 'Station Inventory & Reserves',
    path: '/inventory',
    description: 'Strategic reserves (Jet A-1 Fuel, RO filtration, machinery spares, trauma kits, rations), consumption burn rates, and ML demand predictions.',
    authorizedRoles: ['Admin', 'Inventory Manager', 'Logistics Officer', 'Station Officer'],
  },
  '/personnel': {
    title: 'Wintering Personnel Rosters',
    path: '/personnel',
    description: 'Personnel deployment rosters, medical fitness ratings (Class 1 Polar Fit), blood group allocations, survival training certifications, and station deployments.',
    authorizedRoles: ['Admin', 'Expedition Coordinator', 'Emergency Coordinator', 'Station Officer'],
  },
  '/weather': {
    title: 'Stations & Meteorological Telemetry',
    path: '/weather',
    description: 'Live weather telemetry from Maitri (Schirmacher Oasis), Bharati (Larsemann Hills), and Himadri (Ny-Ålesund, Svalbard), including wind chill, barometric trends, and blizzards.',
    authorizedRoles: ['Admin', 'Expedition Coordinator', 'Inventory Manager', 'Emergency Coordinator', 'Logistics Officer', 'Station Officer'],
  },
  '/emergency': {
    title: 'Emergency Response & SAR',
    path: '/emergency',
    description: 'Incident response hub (SAR, Whiteout lockdown, MEDEVAC), casualty rosters, response team dispatches, and real-time emergency timeline logging.',
    authorizedRoles: ['Admin', 'Emergency Coordinator'],
  },
  '/alerts': {
    title: 'System Operational Alerts',
    path: '/alerts',
    description: 'Central alert triage center with CRITICAL, WARNING, and ADVISORY notifications, audio klaxon toggles, and acknowledgement audit workflows.',
    authorizedRoles: ['Admin', 'Expedition Coordinator', 'Inventory Manager', 'Emergency Coordinator', 'Logistics Officer', 'Station Officer'],
  },
  '/reports': {
    title: 'Compliance & Mission Reports',
    path: '/reports',
    description: 'Automated reporting engine for fuel burn audits, Treaty compliance summaries, cargo customs manifests, and exportable PDF/Excel logs.',
    authorizedRoles: ['Admin', 'Expedition Coordinator', 'Inventory Manager', 'Emergency Coordinator', 'Logistics Officer', 'Station Officer'],
  },
  '/map': {
    title: 'Interactive Antarctic GIS Map',
    path: '/map',
    description: 'Live geospatial map centered on Antarctica with Carto Polar Dark & Light layers, station markers, active cargo vessel coordinates, weather overlays, and waypoint route inspectors.',
    authorizedRoles: ['Admin', 'Expedition Coordinator', 'Inventory Manager', 'Emergency Coordinator', 'Logistics Officer', 'Station Officer'],
  },
}

export const ROLE_CAPABILITIES: Record<string, { title: string; summary: string; permissions: string[]; primaryPages: string[] }> = {
  'Admin': {
    title: 'Admin / Mission Director',
    summary: 'Full executive oversight and administrative control over all PolarOps operational modules, stations, and security protocols.',
    permissions: [
      'Elevate or de-escalate OPCON levels (OPCON 1 Normal, OPCON 2 Caution, OPCON 3 Critical Alert)',
      'Trigger fleet-wide emergency advisory broadcasts and station muster alarms in Mission Control',
      'Approve and review ML demand forecast allocations',
      'Access all modules: Expeditions, Cargo, Inventory, Personnel, Weather, Emergency SAR, Alerts, Reports, and Map',
      'Oversee institutional audit logs and system configuration',
    ],
    primaryPages: ['/mission-control', '/dashboard', '/inventory', '/emergency', '/expeditions', '/map'],
  },
  'Expedition Coordinator': {
    title: 'Expedition Coordinator (NCPOR)',
    summary: 'Coordinates active Antarctic & Arctic scientific expeditions, field traverses, logistics milestones, and personnel movement.',
    permissions: [
      'Create and manage expedition dossiers and waypoint itineraries',
      'Assign deployed scientists and technical officers to specific traverses',
      'Track cargo delivery milestones for field parties',
      'Review weather suitability windows before authorizing vehicle movement',
      'Generate mission progress reports and audit dossiers',
    ],
    primaryPages: ['/expeditions', '/dashboard', '/cargo', '/personnel', '/weather', '/reports'],
  },
  'Expedition Manager (NCPOR)': {
    title: 'Expedition Coordinator (NCPOR)',
    summary: 'Coordinates active Antarctic & Arctic scientific expeditions, field traverses, logistics milestones, and personnel movement.',
    permissions: [
      'Create and manage expedition dossiers and waypoint itineraries',
      'Assign deployed scientists and technical officers to specific traverses',
      'Track cargo delivery milestones for field parties',
      'Review weather suitability windows before authorizing vehicle movement',
      'Generate mission progress reports and audit dossiers',
    ],
    primaryPages: ['/expeditions', '/dashboard', '/cargo', '/personnel', '/weather', '/reports'],
  },
  'Inventory Manager': {
    title: 'Inventory & Stores Manager',
    summary: 'Oversees strategic station reserves, fuel storage farms, consumables burn rates, and ML demand projections.',
    permissions: [
      'Monitor stock levels across Maitri, Bharati, and Himadri stations',
      'Review ML Demand Prediction metrics (predicted requirement, additional needed, days remaining)',
      'Track consumption drawdowns, intake deliveries, and physical audit verifications',
      'Identify critical deficits below safety buffer and plan replenishment shipments',
      'Export stock ledgers and fuel consumption audits',
    ],
    primaryPages: ['/inventory', '/dashboard', '/cargo', '/reports', '/alerts'],
  },
  'Emergency Coordinator': {
    title: 'Emergency & SAR Coordinator',
    summary: 'Directs incident response, search and rescue (SAR) operations, medical evacuations (MEDEVAC), and station lockdowns.',
    permissions: [
      'Triage active emergency incidents by severity (Low, Moderate, High, Critical)',
      'Assign emergency response units (Traverse Rescue, Medical, Generator Fire Team)',
      'Coordinate MEDEVAC flight vectors and whiteout shelter protocols',
      'Track affected personnel and hazardous cargo in incident zones',
      'Update real-time incident timelines and resolution notes',
    ],
    primaryPages: ['/emergency', '/dashboard', '/alerts', '/personnel', '/weather', '/map'],
  },
  'Logistics Officer': {
    title: 'Logistics & Vessel Officer',
    summary: 'Manages sea and air freight logistics, container manifests, cargo timelines, and polar vessel movements.',
    permissions: [
      'Track container shipments on polar vessels (e.g. MV Vasily Golovnin) and air bridges',
      'Advance cargo status through 6-stage logistics pipeline (Planned -> Packed -> Loaded -> In Transit -> Arrived -> Received)',
      'Monitor HAZMAT compliance, gross weights, and destination station delivery ETAs',
      'Coordinate station replenishment handoffs with Inventory Managers',
      'Inspect supply chain bottlenecks and delayed manifests',
    ],
    primaryPages: ['/cargo', '/inventory', '/dashboard', '/map', '/reports'],
  },
  'Station Officer': {
    title: 'Station Officer / Manager',
    summary: 'Oversees on-site station operations, local life-support systems, personnel safety, and meteorological instruments.',
    permissions: [
      'Monitor real-time station environmental telemetry (temperature, wind chill, barometric trend)',
      'Verify on-site fuel tank dipsticks and water RO membrane filters',
      'Manage daily wintering team logs and habitat duty rosters',
      'Issue local weather safety advisories during blizzard conditions',
      'Coordinate emergency drill preparedness and local inventory drawdowns',
    ],
    primaryPages: ['/weather', '/dashboard', '/inventory', '/personnel', '/alerts'],
  },
  'Station Manager (Maitri)': {
    title: 'Station Officer / Manager',
    summary: 'Oversees on-site station operations, local life-support systems, personnel safety, and meteorological instruments.',
    permissions: [
      'Monitor real-time station environmental telemetry (temperature, wind chill, barometric trend)',
      'Verify on-site fuel tank dipsticks and water RO membrane filters',
      'Manage daily wintering team logs and habitat duty rosters',
      'Issue local weather safety advisories during blizzard conditions',
      'Coordinate emergency drill preparedness and local inventory drawdowns',
    ],
    primaryPages: ['/weather', '/dashboard', '/inventory', '/personnel', '/alerts'],
  },
}

// -------------------------------------------------------------------------------------
// KNOWLEDGE EXPLANATION BUILDERS
// -------------------------------------------------------------------------------------

/**
 * Returns thorough, statistically sound explanation of ML Demand Prediction model
 */
export function getMLDemandPredictionExplanation(): { text: string; actions: ChatNavigationAction[] } {
  const text = `### PolarOps AI Inventory Demand Prediction System

The **Inventory Demand Prediction Engine** is a specialized decision-support system designed for polar stations (Maitri, Bharati, Himadri) where supply replenishment is strictly constrained by seasonal shipping windows (e.g., Austral summer air bridges and polar ice-class vessels).

---

#### 1. Core Mathematical Formula
The model calculates the necessary supply order using:
\`\`\`
recommended_additional_qty = max(0, predicted_requirement - current_stock)
\`\`\`

- **\`predicted_requirement\`**: Estimated total quantity needed for the configured forecast horizon (typically 60 to 120 days), taking into account historical daily burn rates, scheduled expedition flights, generator maintenance cycles, and station population.
- **\`current_stock\`**: Physical inventory on hand verified by recent audit logs.
- **\`recommended_additional_qty\`**: Recommended replenishment order quantity required to prevent a stockout deficit before the next resupply window.

---

#### 2. Key ML Response Fields
| Field | Meaning |
| :--- | :--- |
| **\`predicted_requirement\`** | Statistical forecast of total demand over the forecast horizon. |
| **\`current_stock\`** | Real-time physical inventory recorded in the station ledger. |
| **\`recommended_additional_qty\`** | Net shortfall required for replenishment: $\\max(0, \\text{predicted} - \\text{current})$. |
| **\`minimum_stock\`** | Mandatory safety buffer threshold below which alarms trigger. |
| **\`lead_time_days\`** | Estimated supply chain delivery transit time (sea/air freight). |
| **\`status\`** | Inventory classification (\`NORMAL\`, \`LOW_STOCK\`, \`CRITICAL\`, or \`REQUIREMENT_GAP\`). |
| **\`recommendation\`** | Operational guidance action (e.g., "Schedule resupply on MV Vasily Golovnin Voyage 44"). |
| **\`prediction_source\`** | Algorithm origin: \`HISTORICAL_REGRESSION\`, \`SEASONAL_TIME_SERIES\`, or \`CATEGORY_BASELINE\`. |
| **\`low_confidence\`** | Boolean flag indicating data uncertainty or lack of historical records. |
| **\`model_version\`** | Deployed model identifier (e.g., \`NCPOR-Demand-Predictor-v2.4\`). |

---

#### 3. Cold-Start Handling (\`CATEGORY_BASELINE\`)
When a new SKU or rarely consumed item lacks sufficient historical consumption history:
- The system automatically falls back to **\`prediction_source = CATEGORY_BASELINE\`**.
- It flags **\`low_confidence = true\`**.
- **Important**: Any prediction marked with low confidence or category baseline **must be manually reviewed** by the Inventory Manager or Expedition Commander before placing procurement requests.

---

#### 4. Safety & Operational Safeguards
> [!NOTE]
> - **Decision Support Only**: ML predictions **never** automatically modify station stock ledgers or place orders without human authorization.
> - **Statistical Grounding**: In regression models, the goodness-of-fit $R^2$ represents the proportion of variance explained by seasonal and operational factors—**not** classification accuracy.`

  return {
    text,
    actions: [
      { label: 'Open Inventory', path: '/inventory', description: 'Review stock ledgers and ML forecasts' },
      { label: 'Open Cargo', path: '/cargo', description: 'Check inbound resupply shipments' },
    ],
  }
}

/**
 * Returns grounded explanation of a specific application page
 */
export function getPageExplanation(pathname: string, role: UserRole): { text: string; actions: ChatNavigationAction[] } {
  // Normalize path (strip query params and ID segments)
  const baseRoute = pathname.split('?')[0].replace(/\/([a-zA-Z0-9_-]+)$/, (match) => {
    if (['/inventory', '/expeditions', '/cargo', '/personnel', '/emergency'].some((r) => pathname.startsWith(r) && pathname !== r)) {
      return ''
    }
    return match
  })

  switch (baseRoute) {
    case '/inventory':
    case '/inventory/':
      return {
        text: `### Inventory Management & Strategic Reserves (\`/inventory\`)

You are viewing the **Station Inventory & Strategic Reserves** ledger for Antarctic and Arctic bases.

#### Key Features & Elements on this Page:
- **Operational Summary Metric Cards**:
  - **Monitored Items**: Total active critical polar SKUs.
  - **Critical Deficits**: Items with immediate stockout risk requiring airlift or emergency transfer.
  - **Low Stock Items**: Items currently below the mandatory station safety buffer.
  - **Normal Stock**: Adequate reserves on hand.
- **Search & Multi-Filter Bar**:
  - Filter by **Station** (Maitri, Bharati, Himadri, Joint Antarctic), **Category** (Fuel & Energy, Water & Life Support, Vehicle Spares, Medical Supplies, Reagents, Rations), and **Status** (Critical, Low Stock, Normal).
- **Inventory Ledger Table**:
  - Shows Item ID, Nomenclature, Station, Category, Current Stock, Minimum Safety Buffer, Daily Burn Rate, Days Remaining bar, Status Badge, and Last Audit Date.
- **ML Forecast Modal**:
  - Click the **"Forecast"** button on any SKU row to inspect the AI Demand Prediction modal showing **Predicted Requirement**, **Current Stock**, **Recommended Additional Qty**, **Prediction Horizon**, and **Confidence Interval**.
- **Item Ledger Detail**:
  - Click **"Details"** to view the full consumption history and recent transaction audit trail.`,
        actions: [
          { label: 'Open Cargo', path: '/cargo', description: 'Track inbound replenishment shipments' },
          { label: 'Open Dashboard', path: '/dashboard', description: 'Return to operational cockpit' },
        ],
      }

    case '/mission-control':
      return {
        text: `### Mission Control Center (\`/mission-control\`)

You are viewing **Mission Control**, the highest-level operational command and escalation console in PolarOps (restricted to **Admin / Director**).

#### Key Features on this Page:
- **Global OPCON Level Switcher**:
  - **OPCON 1 - NORMAL**: Routine seasonal scientific and logistical operations.
  - **OPCON 2 - CAUTION**: Elevated environmental hazard or severe logistics delays.
  - **OPCON 3 - CRITICAL ALERT**: Emergency station lockdown, active SAR, or severe life-support deficit.
- **Fleet-Wide Broadcast Dispatcher**:
  - Dispatches priority broadcast advisories across all station radio networks and vessel bridges.
- **Station Emergency Muster**:
  - Initiates station-wide headcounts and verifies personnel presence in safe habitat modules.
- **Strategic Live Telemetry**:
  - Aggregates active expeditions progress, cargo in-transit metrics, critical inventory alerts, and emergency incidents in a single command matrix.`,
        actions: [
          { label: 'Open Emergency Response', path: '/emergency', description: 'Manage active SAR incidents' },
          { label: 'Open Alerts', path: '/alerts', description: 'Triage pending system alerts' },
        ],
      }

    case '/expeditions':
      return {
        text: `### Expeditions Management (\`/expeditions\`)

You are viewing the **Expeditions Management** module for Indian Antarctic & Arctic scientific traverses.

#### Key Capabilities:
- **Active Expedition Cards**:
  - View expeditions such as the **44th Indian Scientific Expedition to Antarctica (ISEA)**, **Maitri-Bharati Inland Traverse**, and **Arctic Svalbard Marine Survey**.
- **Traverse Progress & Milestones**:
  - Track expedition status (Active, In Transit, Planned, Completed), current coordinates, assigned personnel headcount, and allocated cargo containers.
- **Detailed Expedition Dossier**:
  - Click on any expedition to view assigned field scientists, allocated cargo TEUs, dedicated reserve buffers, environmental conditions, and traverse waypoint logs.`,
        actions: [
          { label: 'Open Personnel', path: '/personnel', description: 'View expedition personnel rosters' },
          { label: 'Open Map', path: '/map', description: 'View traverse routes on Antarctic map' },
        ],
      }

    case '/cargo':
      return {
        text: `### Cargo & Logistics Management (\`/cargo\`)

You are viewing the **Cargo & Logistics** tracking module for polar transport supply chains.

#### Key Features:
- **6-Stage Logistics Pipeline**:
  - Track containers through: **Planned $\\rightarrow$ Packed $\\rightarrow$ Loaded $\\rightarrow$ In Transit $\\rightarrow$ Arrived $\\rightarrow$ Received**.
- **Vessel & Carrier Tracking**:
  - Monitor chartered polar vessels (e.g. *MV Vasily Golovnin*), Basler BT-67 air cargo, and ice traverse sledges.
- **Cargo Manifest Filtering**:
  - Filter by priority (**Critical, High, Standard, Low**), transport mode, destination base, and HAZMAT designation.
- **Container Ledger**:
  - Inspect gross weight, expected arrival date, assigned expedition, and full custodial chain-of-custody logs.`,
        actions: [
          { label: 'Open Inventory', path: '/inventory', description: 'Check station storage levels' },
          { label: 'Open Map', path: '/map', description: 'View cargo vessels on the map' },
        ],
      }

    case '/emergency':
      return {
        text: `### Emergency Response & SAR (\`/emergency\`)

You are viewing the **Emergency Response & Search and Rescue (SAR)** incident command center.

#### Available Capabilities:
- **Incident Triage & Severity Matrix**:
  - Monitor incidents categorized as **Critical**, **High**, **Moderate**, or **Low** (e.g., Whiteout Holds, Crevasse Rescues, Generator Failures).
- **Casualty & Affected Tracking**:
  - Immediate visibility of affected personnel, blood groups, medical clearance status, and stranded cargo containers.
- **Response Team Actions**:
  - Assign and dispatch specialized units (e.g., *Maitri Traverse Rescue Alpha*, *Trauma Medical Team*, *Station Engineering*).
- **Incident Timelines**:
  - Chronological audit logging of comms dispatches, radio check-ins, and field rescue milestones.`,
        actions: [
          { label: 'Open Alerts', path: '/alerts', description: 'Review high-priority alarm feeds' },
          { label: 'Open Weather', path: '/weather', description: 'Check blizzard winds and visibility' },
        ],
      }

    case '/weather':
      return {
        text: `### Stations & Meteorological Telemetry (\`/weather\`)

You are viewing the **Meteorological Telemetry** system for polar research stations.

#### Monitored Stations:
- **Maitri Station**: Schirmacher Oasis ($70^\\circ 45'\\text{S}, 11^\\circ 44'\\text{E}$)
- **Bharati Station**: Larsemann Hills ($69^\\circ 24'\\text{S}, 76^\\circ 11'\\text{E}$)
- **Himadri Station**: Ny-Ålesund, Svalbard ($78^\\circ 55'\\text{N}, 11^\\circ 55'\\text{E}$)

#### Telemetry Metrics:
- **Ambient Air Temperature** and **Calculated Wind Chill**
- **Wind Speed & Direction** (knots / km/h with blizzard hazard alerts)
- **Barometric Pressure & 3-Hour Trend** (Rapid drops indicate approaching katabatic storms)
- **Visibility & Cloud Cover** for flight operations safety.`,
        actions: [
          { label: 'Open Map', path: '/map', description: 'Inspect weather overlays on the map' },
          { label: 'Open Expeditions', path: '/expeditions', description: 'Verify field traverse conditions' },
        ],
      }

    case '/map':
      return {
        text: `### Interactive Antarctic GIS Map (\`/map\`)

You are viewing the **Antarctic Geospatial Information System (GIS) Map**.

#### Interactive Controls & Layers:
- **Tile Layer Switcher**: Toggle between **Carto Clean Light**, **Carto Polar Dark**, and **OpenStreetMap Standard**.
- **Live Overlays**: Toggle **Weather Suitability Layer** and **Traverse Route Lines**.
- **Interactive Markers**: Click on any Station (Maitri, Bharati), Expedition traverse, or Cargo vessel icon to open the detailed **Geospatial Inspector Panel**.
- **Map Filters**: Filter displayed map entities by Station, Active Traverse, or Vessel.`,
        actions: [
          { label: 'Open Dashboard', path: '/dashboard', description: 'Return to operational dashboard' },
          { label: 'Open Weather', path: '/weather', description: 'View detailed station telemetry' },
        ],
      }

    case '/personnel':
      return {
        text: `### Wintering Personnel Rosters (\`/personnel\`)

You are viewing the **Personnel Management** roster for wintering scientists and logistics personnel.

#### Features:
- **Team Roster & Deployments**: Track station officers, glaciologists, meteorologists, mechanics, and medical doctors.
- **Medical Readiness**: Check **Class 1 Polar Fitness** certifications and blood group compatibility.
- **Survival Certifications**: Verify mandatory polar survival training, cold-weather firefighting, and emergency SAR certifications.`,
        actions: [
          { label: 'Open Expeditions', path: '/expeditions', description: 'View assigned expedition teams' },
        ],
      }

    case '/alerts':
      return {
        text: `### System Operational Alerts (\`/alerts\`)

You are viewing the **Central Alert Triage Center**.

#### Key Features:
- **Severity Classification**: **CRITICAL** (Red), **WARNING** (Amber), and **ADVISORY** (Blue) operational notifications.
- **Acknowledgement Workflow**: Acknowledge alerts with a single click to log receipt in the compliance audit trail.
- **Audio Alarm Simulation**: Test or mute the emergency audible klaxon alarm.`,
        actions: [
          { label: 'Open Mission Control', path: '/mission-control', description: 'Review OPCON escalation status' },
        ],
      }

    case '/reports':
      return {
        text: `### Compliance & Mission Reports (\`/reports\`)

You are viewing the **Compliance & Reporting Engine**.

#### Generated Reports:
- **Fuel & Energy Burn Rate Audit**
- **Antarctic Treaty Environmental Compliance Log**
- **Customs & Cargo Manifest Verification**
- **Medical & Incident Response Summary**
- **Export Formats**: Instant download in PDF or spreadsheet formats.`,
        actions: [
          { label: 'Open Dashboard', path: '/dashboard', description: 'Return to operational cockpit' },
        ],
      }

    case '/dashboard':
    default:
      return {
        text: `### PolarOps Operational Dashboard (\`/dashboard\`)

You are viewing the **Central Operational Cockpit** of PolarOps.

#### Overview Sections:
- **Active Operations Banner**: Quick snapshot of current OPCON status and polar stations summary.
- **Live Logistics Telemetry**: Real-time status of cargo vessels, active air bridge sorties, and station fuel reserves.
- **Active Expeditions Carousel**: High-level progress on the 44th ISEA and wintering missions.
- **Station Weather Widgets**: Live conditions at Maitri, Bharati, and Himadri.
- **Recent Alert Triage**: Immediate overview of unread critical warnings.`,
        actions: [
          { label: 'Open Map', path: '/map', description: 'View live Antarctic map' },
          { label: 'Open Inventory', path: '/inventory', description: 'Review station reserves & ML predictions' },
          { label: 'Open Expeditions', path: '/expeditions', description: 'Inspect active expedition traverses' },
        ],
      }
  }
}

/**
 * Returns role capability explanation
 */
export function getRoleExplanation(role: UserRole): { text: string; actions: ChatNavigationAction[] } {
  const roleInfo = ROLE_CAPABILITIES[role] || ROLE_CAPABILITIES['Expedition Coordinator']
  const actions: ChatNavigationAction[] = roleInfo.primaryPages.slice(0, 3).map((p) => ({
    label: `Open ${VERIFIED_ROUTES[p]?.title?.split(' ')[0] || p.replace('/', '')}`,
    path: p,
    description: VERIFIED_ROUTES[p]?.description,
  }))

  const text = `### Your Role: ${roleInfo.title}

${roleInfo.summary}

#### Authorized Capabilities in PolarOps:
${roleInfo.permissions.map((p) => `- **${p}**`).join('\n')}

#### Recommended Primary Modules:
${roleInfo.primaryPages.map((p) => `- \`${p}\`: ${VERIFIED_ROUTES[p]?.title || p}`).join('\n')}

> [!NOTE]
> PolarOps enforces strict Institutional Role-Based Access Control (RBAC). Your access to navigation items and controls is automatically tailored to your active role.`

  return { text, actions }
}

/**
 * Returns step-by-step PolarOps onboarding tutorial
 */
export function getApplicationTutorial(role: UserRole): { text: string; actions: ChatNavigationAction[] } {
  const text = `### Step-by-Step Guide: How to Operate PolarOps

Welcome to **PolarOps**, the polar expedition logistics and station management platform. Follow this step-by-step operational workflow:

---

#### 1. Authentication & Role Selection
- Log in with your institutional credentials (e.g. NCPOR director, expedition coordinator, inventory manager).
- Your interface automatically configures allowed routes based on your role.

#### 2. Review the Operational Dashboard (\`/dashboard\`)
- Start every shift by checking the **OPCON status**, live station conditions (**Maitri**, **Bharati**, **Himadri**), and the unread alert banner.

#### 3. Monitor Active Expeditions (\`/expeditions\`)
- Review ongoing scientific traverses (such as the **44th ISEA**), team rosters, and field waypoint milestones.

#### 4. Audit Station Inventory & Reserves (\`/inventory\`)
- Check critical life-support consumables, Jet A-1 fuel tank farm levels, and water filtration cartridges.

#### 5. Review AI Demand Predictions
- Open the **ML Demand Forecast** on any inventory item to check **\`predicted_requirement\`**, **\`current_stock\`**, and **\`recommended_additional_qty\`** ($\max(0, \text{predicted} - \text{current})$).
- Check the **\`low_confidence\`** flag—if true, manually verify category baselines.

#### 6. Track Cargo & Supply Chain (\`/cargo\`)
- Inspect polar vessel shipments (*MV Vasily Golovnin*) and airlifts across the 6-stage logistics pipeline (**Planned $\\rightarrow$ Received**).

#### 7. Check Station Weather & Wind Chill (\`/weather\`)
- Review wind speeds, blizzard warnings, and barometric pressure trends before authorizing field traverses.

#### 8. Geospatial Exploration on the Map (\`/map\`)
- Open the interactive Antarctic GIS map to inspect live vessel positions, station coordinates, and weather overlays.

#### 9. Triage Alerts & Alarms (\`/alerts\`)
- Review critical alerts, acknowledge notifications, and track corrective action logs.

#### 10. Coordinate Emergency Response if Required (\`/emergency\`)
- In the event of an overdue traverse or hazard, open the Emergency Response console to dispatch SAR teams and manage affected rosters.

#### 11. Mission Control Strategic Command (\`/mission-control\`)
- If authorized as an **Admin**, adjust OPCON levels, broadcast fleet-wide advisories, or trigger emergency muster protocols.`

  return {
    text,
    actions: [
      { label: 'Open Dashboard', path: '/dashboard', description: 'Start at the main cockpit' },
      { label: 'Open Map', path: '/map', description: 'Explore Antarctic map' },
      { label: 'Open Inventory', path: '/inventory', description: 'Inspect stock and ML forecasts' },
    ],
  }
}

// -------------------------------------------------------------------------------------
// INTENT RECOGNITION & CONVERSATIONAL RESPONSE ENGINE
// -------------------------------------------------------------------------------------

/**
 * Analyzes query text and conversational context to generate grounded responses
 */
export function generateAssistantResponse(
  query: string,
  context: ChatContext,
  history: ChatMessage[] = []
): { text: string; actions: ChatNavigationAction[]; category: ChatMessage['category'] } {
  const q = query.trim().toLowerCase()
  const currentRole = context.currentRole
  const pathname = context.pathname

  // Check last assistant message for conversational context / pronouns ("it", "how is it calculated")
  const lastAssistantMsg = [...history].reverse().find((m) => m.sender === 'assistant')
  const lastTopic = lastAssistantMsg?.category

  // 1. Safety Guardrail: Attempts to mutate records or perform unapproved database actions
  if (
    q.includes('change inventory') ||
    q.includes('modify stock') ||
    q.includes('delete expedition') ||
    q.includes('change database') ||
    q.includes('bypass rbac') ||
    q.includes('override permission') ||
    q.includes('hack') ||
    q.includes('create fake')
  ) {
    return {
      text: `### Operational Safety & Boundary Notice

As the **PolarOps Assistant**, I operate strictly as a **read-only help, guidance, and decision-support tool**.

- I **cannot** modify inventory records, delete expeditions, change database entries, or override role permissions.
- All operational transactions (e.g., fuel drawdowns, cargo status updates, or OPCON escalations) must be performed directly through the designated UI modules by authorized personnel with appropriate RBAC credentials.

To manage inventory ledgers or stock entries, please use the official **Inventory Management** page.`,
      actions: [{ label: 'Open Inventory', path: '/inventory', description: 'Go to Inventory page' }],
      category: 'safety',
    }
  }

  // 2. Tutorial / How to use PolarOps
  if (
    q.includes('teach me') ||
    q.includes('how do i use this application') ||
    q.includes('how to use polarops') ||
    q.includes('how do i use polarops') ||
    q.includes('tutorial') ||
    q.includes('getting started') ||
    q.includes('onboarding') ||
    q.includes('application guide') ||
    q === 'guide'
  ) {
    const res = getApplicationTutorial(currentRole)
    return { text: res.text, actions: res.actions, category: 'tutorial' }
  }

  // 3. Inventory ML / Demand Prediction / Formulas / R2 / Confidence
  if (
    q.includes('demand prediction') ||
    q.includes('how does demand prediction work') ||
    q.includes('how does ai demand prediction work') ||
    q.includes('ai prediction') ||
    q.includes('predicted requirement') ||
    q.includes('recommended additional quantity') ||
    q.includes('recommended additional qty') ||
    q.includes('how is it calculated') ||
    q.includes('formula') ||
    q.includes('category baseline') ||
    q.includes('low confidence') ||
    q.includes('prediction source') ||
    q.includes('model version') ||
    (lastTopic === 'ml' && (q.includes('how is it') || q.includes('what about') || q.includes('accuracy') || q.includes('formula')))
  ) {
    const res = getMLDemandPredictionExplanation()
    return { text: res.text, actions: res.actions, category: 'ml' }
  }

  // 4. Role Permissions / What can I do
  if (
    q.includes('what can i do') ||
    q.includes('what does my role allow') ||
    q.includes('explain my role') ||
    q.includes('my permissions') ||
    q.includes('who am i') ||
    q.includes('role capabilities') ||
    q.includes('what can i control')
  ) {
    const res = getRoleExplanation(currentRole)
    return { text: res.text, actions: res.actions, category: 'role' }
  }

  // 5. Page Explanation ("Explain this page", "What is this page", "How to use this page")
  if (
    q.includes('explain this page') ||
    q.includes('what is this page') ||
    q.includes('how to use this page') ||
    q.includes('what can i do from this dashboard') ||
    q.includes('what does this page do') ||
    q === 'explain page' ||
    q === 'page info'
  ) {
    const res = getPageExplanation(pathname, currentRole)
    return { text: res.text, actions: res.actions, category: 'page' }
  }

  // 6. Navigation Direct Queries
  if (q.startsWith('take me to') || q.startsWith('open ') || q.startsWith('go to') || q.includes('where can i find') || q.includes('where is')) {
    if (q.includes('inventory') || q.includes('stock') || q.includes('fuel') || q.includes('reserve')) {
      return {
        text: `You can access **Station Inventory & Strategic Reserves** at \`/inventory\`. This page lets you audit stock balances, monitor daily burn rates, and review AI Demand Predictions.`,
        actions: [{ label: 'Open Inventory', path: '/inventory', description: 'Go to Inventory Ledger' }],
        category: 'navigation',
      }
    }
    if (q.includes('expedition') || q.includes('mission') || q.includes('isea') || q.includes('traverse')) {
      return {
        text: `You can view all active and planned expeditions at \`/expeditions\`. Track field traverse waypoints, assigned scientists, and equipment.`,
        actions: [{ label: 'Open Expeditions', path: '/expeditions', description: 'Go to Expeditions' }],
        category: 'navigation',
      }
    }
    if (q.includes('cargo') || q.includes('manifest') || q.includes('shipment') || q.includes('vessel') || q.includes('teu') || q.includes('logistics')) {
      return {
        text: `You can manage cargo manifests and track transport vessels (e.g. *MV Vasily Golovnin*) at \`/cargo\`.`,
        actions: [{ label: 'Open Cargo', path: '/cargo', description: 'Go to Cargo & Logistics' }],
        category: 'navigation',
      }
    }
    if (q.includes('weather') || q.includes('station') || q.includes('telemetry') || q.includes('temperature') || q.includes('wind')) {
      return {
        text: `Live weather telemetry and station data for Maitri, Bharati, and Himadri are available at \`/weather\`.`,
        actions: [{ label: 'Open Weather', path: '/weather', description: 'Go to Weather Telemetry' }],
        category: 'navigation',
      }
    }
    if (q.includes('emergency') || q.includes('sar') || q.includes('incident') || q.includes('medevac') || q.includes('rescue')) {
      return {
        text: `Emergency incident management and Search and Rescue (SAR) command is located at \`/emergency\`.`,
        actions: [{ label: 'Open Emergency Response', path: '/emergency', description: 'Go to Emergency Response' }],
        category: 'navigation',
      }
    }
    if (q.includes('mission control') || q.includes('opcon') || q.includes('broadcast') || q.includes('muster')) {
      return {
        text: `The **Mission Control** executive escalation dashboard is available at \`/mission-control\` (Admin authorization required).`,
        actions: [{ label: 'Open Mission Control', path: '/mission-control', description: 'Go to Mission Control' }],
        category: 'navigation',
      }
    }
    if (q.includes('map') || q.includes('gis') || q.includes('antarctica') || q.includes('carto')) {
      return {
        text: `The interactive Antarctic GIS Map with vessel trackers and weather layers is available at \`/map\`.`,
        actions: [{ label: 'Open Map', path: '/map', description: 'Go to Interactive Map' }],
        category: 'navigation',
      }
    }
    if (q.includes('personnel') || q.includes('team') || q.includes('roster') || q.includes('doctor') || q.includes('scientist')) {
      return {
        text: `Wintering personnel dossiers, medical ratings, and team rosters are located at \`/personnel\`.`,
        actions: [{ label: 'Open Personnel', path: '/personnel', description: 'Go to Personnel Rosters' }],
        category: 'navigation',
      }
    }
    if (q.includes('alert') || q.includes('notification') || q.includes('warning') || q.includes('alarm')) {
      return {
        text: `System alert feeds and notification triage are located at \`/alerts\`.`,
        actions: [{ label: 'Open Alerts', path: '/alerts', description: 'Go to Operational Alerts' }],
        category: 'navigation',
      }
    }
    if (q.includes('report') || q.includes('compliance') || q.includes('audit') || q.includes('export')) {
      return {
        text: `Mission reports and Treaty compliance audits can be generated and exported at \`/reports\`.`,
        actions: [{ label: 'Open Reports', path: '/reports', description: 'Go to Compliance Reports' }],
        category: 'navigation',
      }
    }
    if (q.includes('dashboard') || q.includes('home')) {
      return {
        text: `The primary operational overview cockpit is located at \`/dashboard\`.`,
        actions: [{ label: 'Open Dashboard', path: '/dashboard', description: 'Go to Dashboard' }],
        category: 'navigation',
      }
    }
  }

  // 7. Status definitions (What does LOW_STOCK / REQUIREMENT_GAP / OPCON mean?)
  if (q.includes('status mean') || q.includes('what does this status mean') || q.includes('what does opcon mean') || q.includes('what does critical mean')) {
    return {
      text: `### PolarOps Operational Status Definitions

#### 1. Inventory Status Levels:
- **\`NORMAL\`**: Stock level exceeds both minimum safety buffer and expected seasonal demand.
- **\`LOW_STOCK\`**: Stock on hand has dropped below the mandatory station safety buffer; resupply order should be planned.
- **\`CRITICAL\`**: Inventory deficit poses immediate operational risk; priority airlift or emergency transfer required.
- **\`REQUIREMENT_GAP\`**: Projected seasonal consumption exceeds verified reserves ($\text{predicted} > \text{current}$).

#### 2. OPCON (Operational Condition) Levels:
- **\`OPCON 1 - NORMAL\`**: Standard polar operations, baseline weather, routine science activities.
- **\`OPCON 2 - CAUTION\`**: Approaching storm fronts, supply chain delays, or elevated system alerts.
- **\`OPCON 3 - CRITICAL ALERT\`**: Active emergency SAR, severe whiteout lock, or critical life support hazard.

#### 3. Cargo Logistics Stages:
- **\`Planned\`** $\\rightarrow$ **\`Packed\`** $\\rightarrow$ **\`Loaded\`** $\\rightarrow$ **\`In Transit\`** $\\rightarrow$ **\`Arrived\`** $\\rightarrow$ **\`Received\`**.`,
      actions: [
        { label: 'Open Inventory', path: '/inventory', description: 'Review inventory statuses' },
        { label: 'Open Alerts', path: '/alerts', description: 'Review system alert statuses' },
      ],
      category: 'general',
    }
  }

  // 8. Specific Expedition / Emergency / Cargo inquiries
  if (q.includes('create an expedition') || q.includes('create expedition') || q.includes('manage expedition')) {
    return {
      text: `### Managing Expeditions in PolarOps

Expeditions are managed from the **Expeditions Management** page (\`/expeditions\`).

1. Navigate to **Expeditions**.
2. Review active missions such as the **44th ISEA** or **Arctic Svalbard Survey**.
3. Authorized roles (**Admin** and **Expedition Coordinator**) can inspect waypoint itineraries, assign personnel rosters, and link dedicated cargo containers.
4. Click on any expedition card to view its comprehensive dossier and field logistics.`,
      actions: [{ label: 'Open Expeditions', path: '/expeditions', description: 'Go to Expeditions' }],
      category: 'general',
    }
  }

  if (q.includes('respond to an emergency') || q.includes('respond to emergency') || q.includes('emergency response')) {
    return {
      text: `### Emergency Response Workflow

In the event of an operational emergency (blizzard hold, vehicle breakdown, or medical trauma):

1. Open the **Emergency Response** module at \`/emergency\`.
2. Review the incident severity (**Critical**, **High**, **Moderate**, **Low**).
3. Check the affected personnel roster and HAZMAT cargo status in the incident zone.
4. Dispatch assigned rescue teams (e.g. *Traverse Rescue Unit Alpha*, *Medical Trauma Team*).
5. Maintain chronological logs in the Incident Timeline until resolved.`,
      actions: [{ label: 'Open Emergency Response', path: '/emergency', description: 'Go to Emergency Response' }],
      category: 'general',
    }
  }

  if (q.includes('mission control') || q.includes('how do i use mission control')) {
    return {
      text: `### Operating Mission Control (\`/mission-control\`)

**Mission Control** is the executive command hub accessible to **Admin / Director** roles.

- **OPCON Level Control**: Escalate system readiness to OPCON 1, 2, or 3.
- **Broadcast System**: Dispatch station-wide advisory messages to all base communicators.
- **Station Muster**: Trigger roll-call musters during safety drills or critical emergencies.
- **Strategic Matrix**: Real-time cross-module visibility across expeditions, cargo, inventory, and SAR.`,
      actions: [{ label: 'Open Mission Control', path: '/mission-control', description: 'Go to Mission Control' }],
      category: 'general',
    }
  }

  // 9. Default Fallback with grounded suggestions
  return {
    text: `I can help you navigate and operate the **PolarOps Expedition Logistics Platform**.

Here are some things you can ask me:
- **"Explain this page"** — Overview of fields and features on your current view (\`${pathname}\`).
- **"What can I do in my role?"** — Exact capabilities for **${currentRole}**.
- **"How does AI demand prediction work?"** — Mathematical formula and ML forecast explanation.
- **"Teach me how to use PolarOps"** — Step-by-step application tutorial.
- **"Where can I find [inventory / cargo / expeditions / weather / emergency]?"** — Direct navigation guidance.`,
    actions: [
      { label: 'Explain this page', path: pathname, description: 'Get breakdown of current page' },
      { label: 'Explain my role', path: pathname, description: 'View role capabilities' },
      { label: 'Explain AI prediction', path: '/inventory', description: 'Learn about ML forecasting' },
    ],
    category: 'general',
  }
}

// -------------------------------------------------------------------------------------
// EXTERNAL AI PROVIDER INTEGRATION SERVICE
// -------------------------------------------------------------------------------------

/**
 * Sends chat messages to an external AI backend if configured via VITE_AI_API_URL,
 * or gracefully falls back to the grounded local intelligence engine.
 */
export async function sendChatMessage(
  query: string,
  context: ChatContext,
  history: ChatMessage[] = []
): Promise<{ text: string; actions: ChatNavigationAction[]; category: ChatMessage['category'] }> {
  // Check for external AI API endpoint
  const externalApiUrl = (import.meta as any).env?.VITE_AI_API_URL

  if (externalApiUrl) {
    try {
      const response = await fetch(externalApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: query,
          context: {
            role: context.currentRole,
            page: context.pathname,
            opcon: context.opconLevel,
          },
          history: history.slice(-6).map((h) => ({ role: h.sender, content: h.text })),
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data && data.reply) {
          return {
            text: data.reply,
            actions: data.actions || [],
            category: data.category || 'general',
          }
        }
      }
    } catch {
      // External API unavailable — continue with local grounded engine
    }
  }

  // Simulate slight operational processing time (150ms) for natural feel
  await new Promise((resolve) => setTimeout(resolve, 150))

  return generateAssistantResponse(query, context, history)
}
