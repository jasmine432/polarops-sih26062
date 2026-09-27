export type IncidentSeverity = 'Low' | 'Moderate' | 'High' | 'Critical'

export type IncidentResponseStatus = 'Reported' | 'Acknowledged' | 'Responding' | 'Resolved'

export interface AffectedPerson {
  id: string
  name: string
  role: string
  station: string
  bloodGroup: string
  medicalStatus: string
}

export interface AffectedCargoItem {
  id: string
  description: string
  destination: string
  priority: string
  currentStatus: string
}

export interface EmergencyTimelineEvent {
  id: string
  timestamp: string
  action: string
  officer: string
  details: string
  statusTag?: string
}

export interface IncidentRecord {
  id: string
  time: string
  location: string
  type: string
  severity: IncidentSeverity
  personnelAffectedCount: number
  cargoAffectedCount: number
  responseStatus: IncidentResponseStatus
  description: string
  expeditionId: string
  expeditionName: string
  assignedUnit: string
  leadOfficer: string
  commsFrequency: string
  coordinates: string
  affectedPersonnel: AffectedPerson[]
  affectedCargo: AffectedCargoItem[]
  responseActions: Array<{ title: string; unit: string; time: string; status: string; notes: string }>
  resolutionNotes?: string
  timeline: EmergencyTimelineEvent[]
}

export const INITIAL_INCIDENTS_DATA: IncidentRecord[] = [
  {
    id: 'INC-2026-04',
    time: '2026-09-17 18:22 UTC (45m ago)',
    location: 'Schirmacher Oasis (Waypoint 14)',
    type: 'Overdue Field Traverse / Severe Whiteout Hold',
    severity: 'Critical',
    personnelAffectedCount: 4,
    cargoAffectedCount: 1,
    responseStatus: 'Responding',
    description: 'Geology Convoy PB-02 (4 crew members) halted at Waypoint 14 due to zero-visibility whiteout conditions and 34kt gusting winds. All 4 members are sheltered inside the heated mobile caboose with emergency rations.',
    expeditionId: 'EXP-2026-014',
    expeditionName: '44th Indian Scientific Expedition to Antarctica (ISEA)',
    assignedUnit: 'SAR Sledge Team 1 (Maitri Base)',
    leadOfficer: 'Lt. Col. Vikramaditya Singh / Dr. Alok Verma',
    commsFrequency: 'VHF Channel 16 / Sat HF 4125 kHz',
    coordinates: '70°49\' S, 11°38\' E',
    affectedPersonnel: [
      {
        id: 'NCPOR-P-4428',
        name: 'Sub. Major Gurpreet Singh',
        role: 'Traverse Master / Driver',
        station: 'Schirmacher Waypoint 14',
        bloodGroup: 'O-',
        medicalStatus: 'Sheltered in Caboose · Vitals Nominal',
      },
      {
        id: 'NCPOR-P-4432',
        name: 'Dr. Tarun Sen',
        role: 'Field Geologist',
        station: 'Schirmacher Waypoint 14',
        bloodGroup: 'B+',
        medicalStatus: 'Sheltered in Caboose · Vitals Nominal',
      },
      {
        id: 'NCPOR-P-4435',
        name: 'Er. Kamalpreet Joshi',
        role: 'Radio Technician',
        station: 'Schirmacher Waypoint 14',
        bloodGroup: 'A+',
        medicalStatus: 'Maintaining VHF Watch',
      },
      {
        id: 'NCPOR-P-4439',
        name: 'Hav. Ramesh Yadav',
        role: 'EME Support Mechanic',
        station: 'Schirmacher Waypoint 14',
        bloodGroup: 'O+',
        medicalStatus: 'Generator Monitoring Active',
      },
    ],
    affectedCargo: [
      {
        id: 'CRG-8826',
        description: 'PistenBully Track Spares & Field Drill Rig',
        destination: 'Bharati Vehicle Bay',
        priority: 'High',
        currentStatus: 'Secured on Traverse Sledge',
      },
    ],
    responseActions: [
      {
        title: 'Traverse Stop-Movement Directive Issued',
        unit: 'Maitri Ops Desk',
        time: '18:22 UTC',
        status: 'Active',
        notes: 'Strict order to remain in heated caboose until wind drops below 25 knots.',
      },
      {
        title: 'Maitri SAR Sledge Standby Activation',
        unit: 'Maitri SAR Sledge Unit',
        time: '18:30 UTC',
        status: 'Standby',
        notes: 'PistenBully 300 pre-heated with medical trauma pack and satellite beacon.',
      },
      {
        title: '30-Minute Radio Welfare Schedule Established',
        unit: 'Radio Control Room',
        time: '18:45 UTC',
        status: 'In Progress',
        notes: 'Next scheduled check-in at 19:15 UTC.',
      },
    ],
    timeline: [
      {
        id: 'EVT-01',
        timestamp: '2026-09-17 18:22 UTC',
        action: 'Incident Reported: Convoy Overdue at Waypoint 14',
        officer: 'Radio Control Officer',
        details: 'Convoy PB-02 failed to log scheduled 18:00 UTC crossing due to sudden katabatic gale.',
      },
      {
        id: 'EVT-02',
        timestamp: '2026-09-17 18:28 UTC',
        action: 'Radio Contact Re-established via VHF Ch 16',
        officer: 'Sub. Major Gurpreet Singh',
        details: 'Confirmed vehicle safely anchored. Visibility < 5 meters. 12 days rations on board.',
      },
      {
        id: 'EVT-03',
        timestamp: '2026-09-17 18:35 UTC',
        action: 'Incident Classified as Critical Severity',
        officer: 'Dr. Alok Verma (Expedition Lead)',
        details: 'Activated SAR Standby Protocol and notified NCPOR headquarters Goa.',
      },
    ],
  },
  {
    id: 'INC-2026-05',
    time: '2026-09-17 16:00 UTC (3h ago)',
    location: 'Polar Plateau Traverse km 22',
    type: 'Crevasse Hazard Zone Shift',
    severity: 'High',
    personnelAffectedCount: 6,
    cargoAffectedCount: 2,
    responseStatus: 'Responding',
    description: 'Ground penetrating radar (GPR) scan revealed a 4-meter sub-surface snow bridge fracture along the primary vehicle track. Flags updated and heavy convoys diverted 1.8km south.',
    expeditionId: 'EXP-2026-014',
    expeditionName: '44th Indian Scientific Expedition to Antarctica (ISEA)',
    assignedUnit: 'Sub-glacial Glaciology & Safety Unit',
    leadOfficer: 'Dr. Alok Verma',
    commsFrequency: 'VHF Channel 12',
    coordinates: '71°10\' S, 12°05\' E',
    affectedPersonnel: [
      {
        id: 'NCPOR-P-4441',
        name: 'Dr. Neha Kulkarni',
        role: 'Glaciologist / GPR Lead',
        station: 'Plateau Outpost',
        bloodGroup: 'B+',
        medicalStatus: 'Fit · On Site Survey',
      },
    ],
    affectedCargo: [
      {
        id: 'CRG-8821',
        description: 'Ultra-Low Sulfur Arctic Diesel (ISO Tank)',
        destination: 'Maitri Ice Shelf Berth',
        priority: 'Critical',
        currentStatus: 'Rerouted to Southern Track',
      },
    ],
    responseActions: [
      {
        title: 'Safety Perimeter Flagging & GPS Waypoint Upload',
        unit: 'Field Glaciology Team',
        time: '16:30 UTC',
        status: 'Completed',
        notes: 'High-visibility red flags planted 200m ahead of crevasse lip.',
      },
    ],
    timeline: [
      {
        id: 'EVT-04',
        timestamp: '2026-09-17 16:00 UTC',
        action: 'GPR Anomaly Detected on Primary Route',
        officer: 'Dr. Neha Kulkarni',
        details: 'Sub-surface void detected at 2.2m depth.',
      },
      {
        id: 'EVT-05',
        timestamp: '2026-09-17 16:45 UTC',
        action: 'Route Correction Distributed to Navigation Units',
        officer: 'Logistics Desk',
        details: 'New GPS waypoint file uploaded to all vehicle Garmin units.',
      },
    ],
  },
  {
    id: 'INC-2026-03',
    time: '2026-09-16 11:30 UTC',
    location: 'Punta Arenas Air Logistics Hub',
    type: 'Critical Consignment Customs Delay',
    severity: 'Moderate',
    personnelAffectedCount: 0,
    cargoAffectedCount: 1,
    responseStatus: 'Acknowledged',
    description: 'Cummins Generator Turbocharger delivery held by South American customs authorities for secondary documentation review.',
    expeditionId: 'EXP-2026-014',
    expeditionName: '44th Indian Scientific Expedition to Antarctica (ISEA)',
    assignedUnit: 'NCPOR Logistics Procurement Wing',
    leadOfficer: 'Logistics Super Goa',
    commsFrequency: 'Email / Diplomatic Satcom',
    coordinates: '53°09\' S, 70°54\' W',
    affectedPersonnel: [],
    affectedCargo: [
      {
        id: 'CRG-8834',
        description: 'Cummins QSK-60 Generator Turbocharger Assembly',
        destination: 'Bharati Power Module',
        priority: 'Critical',
        currentStatus: 'Customs Hold',
      },
    ],
    responseActions: [
      {
        title: 'Embassy Expedite Note Issued',
        unit: 'Ministry of Earth Sciences',
        time: '14:00 UTC',
        status: 'In Progress',
        notes: 'Diplomatic transit clearance documents submitted.',
      },
    ],
    timeline: [
      {
        id: 'EVT-06',
        timestamp: '2026-09-16 11:30 UTC',
        action: 'Customs Hold Notice Received from Broker',
        officer: 'Freight Forwarder',
        details: 'Inspection scheduled for next business window.',
      },
    ],
  },
  {
    id: 'INC-2026-01',
    time: '2026-09-10 08:00 UTC',
    location: 'Bharati Station Vehicle Bay',
    type: 'Hydraulic Fluid Hose Leak (PistenBully 300)',
    severity: 'Low',
    personnelAffectedCount: 0,
    cargoAffectedCount: 0,
    responseStatus: 'Resolved',
    description: 'Minor hydraulic hose pinhole leak detected during routine morning vehicle inspection. Fluid contained in spill tray and hose replaced from base stock.',
    expeditionId: 'EXP-2026-014',
    expeditionName: '44th Indian Scientific Expedition to Antarctica (ISEA)',
    assignedUnit: 'Bharati Vehicle Maintenance Team',
    leadOfficer: 'Er. Rajesh K. Nair',
    commsFrequency: 'Base Intercom',
    coordinates: '69°24\'28" S, 76°11\'14" E',
    affectedPersonnel: [],
    affectedCargo: [],
    responseActions: [
      {
        title: 'Hose Replacement & Spill Clean-up',
        unit: 'Mechanical Workshop',
        time: '08:30 UTC',
        status: 'Completed',
        notes: 'Replaced with part #HYD-300-PB. Zero soil or ice contamination.',
      },
    ],
    resolutionNotes: 'Hose replaced from station reserve. Hydraulic pressure pressure-tested to 280 bar with zero leaks. Vehicle cleared for traverse.',
    timeline: [
      {
        id: 'EVT-07',
        timestamp: '2026-09-10 08:00 UTC',
        action: 'Leak Identified during Pre-trip Inspection',
        officer: 'Er. Rajesh K. Nair',
        details: 'Pinhole rupture on main boom lift circuit.',
      },
      {
        id: 'EVT-08',
        timestamp: '2026-09-10 09:15 UTC',
        action: 'Repair Completed & Certified',
        officer: 'Er. Rajesh K. Nair',
        details: 'Incident closed and logged in station maintenance registry.',
      },
    ],
  },
]
