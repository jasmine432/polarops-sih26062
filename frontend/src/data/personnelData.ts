export type PersonnelStatus =
  | 'At Station'
  | 'In Transit'
  | 'Arrived'
  | 'Transferred'
  | 'Unavailable'

export type PersonnelTransportMode =
  | 'Station Base (No Transit)'
  | 'Basler BT-67 Air Lift'
  | 'Twin Otter Feeder'
  | 'PistenBully Sledge Traverse'
  | 'Helicopter Shuttle'
  | 'MV Vasily Golovnin'

export interface MovementHistoryEntry {
  id: string
  origin: string
  destination: string
  departureDate: string
  arrivalDate: string
  transportMode: string
  carrierVehicle: string
  status: 'Completed' | 'In Transit' | 'Scheduled'
  notes: string
}

export interface PersonnelActivityLog {
  timestamp: string
  activity: string
  location: string
  officer: string
}

export interface PersonnelRecord {
  id: string
  name: string
  role: string
  organization: string
  expeditionId: string
  expeditionName: string
  currentStation: string
  destination: string
  departure: string
  expectedArrival: string
  transportMode: PersonnelTransportMode
  status: PersonnelStatus
  carrierFlight: string
  coordinates: string
  moduleLocation: string
  vhfCallsign: string
  bloodGroup: string
  medicalClearance: string
  medicalClearanceDate: string
  survivalTraining: string
  survivalTrainingSchool: string
  emergencyRole: string
  movementTimeline: {
    origin: string
    destination: string
    departureTime: string
    transitCheckpoint: string
    expectedArrival: string
    currentStageIndex: number
    stages: Array<{ name: string; time: string; completed: boolean; current: boolean }>
  }
  movementHistory: MovementHistoryEntry[]
  activityLogs: PersonnelActivityLog[]
}

export const INITIAL_PERSONNEL_DATA: PersonnelRecord[] = [
  {
    id: 'NCPOR-P-4401',
    name: 'Dr. Alok Verma',
    role: 'Expedition Leader / Senior Glaciologist',
    organization: 'National Centre for Polar and Ocean Research (NCPOR)',
    expeditionId: 'EXP-2026-014',
    expeditionName: '44th Indian Scientific Expedition to Antarctica (ISEA)',
    currentStation: 'Maitri Base',
    destination: 'Maitri Base (Stationary)',
    departure: '2026-11-20',
    expectedArrival: '2026-11-25',
    transportMode: 'Station Base (No Transit)',
    status: 'At Station',
    carrierFlight: 'Station Command Post',
    coordinates: '70°45\'57" S, 11°44\'09" E',
    moduleLocation: 'Maitri Main Habitat · Room 04',
    vhfCallsign: 'MAITRI-LEADER-01',
    bloodGroup: 'O+',
    medicalClearance: 'AIIMS Certified (Class-1 Polar)',
    medicalClearanceDate: '2026-08-10 (Valid for 18 Months)',
    survivalTraining: 'Master Winter Mountaineer',
    survivalTrainingSchool: 'ITBP Auli Mountaineering & Skiing Institute',
    emergencyRole: 'Station Emergency Incident Commander',
    movementTimeline: {
      origin: 'Cape Town Staging Terminal',
      destination: 'Maitri Base',
      departureTime: '2026-11-20 04:00 UTC',
      transitCheckpoint: 'Novo Airfield Staging',
      expectedArrival: '2026-11-20 16:30 UTC',
      currentStageIndex: 3,
      stages: [
        { name: 'Staging Clearance', time: '2026-11-18', completed: true, current: false },
        { name: 'Flight Departure', time: '2026-11-20', completed: true, current: false },
        { name: 'Novo Runway Transit', time: '2026-11-20', completed: true, current: false },
        { name: 'Station Check-in', time: '2026-11-20', completed: true, current: true },
      ],
    },
    movementHistory: [
      {
        id: 'MOV-2026-01',
        origin: 'Cape Town Airport',
        destination: 'Maitri Base',
        departureDate: '2026-11-20',
        arrivalDate: '2026-11-20',
        transportMode: 'Basler BT-67 Air Lift',
        carrierVehicle: 'BT-67 Tail C-FTAP',
        status: 'Completed',
        notes: 'Main leadership vanguard deployment flight.',
      },
      {
        id: 'MOV-2025-14',
        origin: 'Bharati Station',
        destination: 'Maitri Base',
        departureDate: '2025-12-10',
        arrivalDate: '2025-12-12',
        transportMode: 'PistenBully Sledge Traverse',
        carrierVehicle: 'Traverse Convoy PB-01',
        status: 'Completed',
        notes: 'Inter-station scientific coordination traverse.',
      },
    ],
    activityLogs: [
      {
        timestamp: '2026-09-17 18:22 UTC',
        activity: 'Issued Whiteout Stage 1 Movement Pause Directive',
        location: 'Maitri Ops Desk',
        officer: 'Dr. Alok Verma',
      },
      {
        timestamp: '2026-09-16 09:00 UTC',
        activity: 'Chaired Austral Summer Glaciology Planning Review',
        location: 'Maitri Briefing Room',
        officer: 'Dr. Alok Verma',
      },
    ],
  },
  {
    id: 'NCPOR-P-4404',
    name: 'Lt. Col. Vikramaditya Singh',
    role: 'Operations & Logistics Commander',
    organization: 'Indian Army (Corps of Engineers)',
    expeditionId: 'EXP-2026-014',
    expeditionName: '44th Indian Scientific Expedition to Antarctica (ISEA)',
    currentStation: 'En Route (DROMLAN Feeder)',
    destination: 'Bharati Base',
    departure: '2026-09-17 06:30 UTC',
    expectedArrival: '2026-09-17 21:00 UTC',
    transportMode: 'Basler BT-67 Air Lift',
    status: 'In Transit',
    carrierFlight: 'Basler BT-67 (Flight C-FTAP)',
    coordinates: '69°50\' S, 45°20\' E (Mid-Flight)',
    moduleLocation: 'Aircraft BT-67 Cabin',
    vhfCallsign: 'POLAR-COMMANDER-LOGS',
    bloodGroup: 'B+',
    medicalClearance: 'Army Base Hospital Delhi (Fit Category SHAPE-1)',
    medicalClearanceDate: '2026-07-15 (Valid for 24 Months)',
    survivalTraining: 'High Altitude & Extreme Cold Warfare',
    survivalTrainingSchool: 'High Altitude Warfare School (HAWS Gulmarg)',
    emergencyRole: 'Search and Rescue (SAR) Tactical Controller',
    movementTimeline: {
      origin: 'Maitri Air Strip',
      destination: 'Bharati Base',
      departureTime: '2026-09-17 06:30 UTC',
      transitCheckpoint: 'Troll Research Waypoint',
      expectedArrival: '2026-09-17 21:00 UTC',
      currentStageIndex: 1,
      stages: [
        { name: 'Departure Maitri', time: '06:30 UTC', completed: true, current: false },
        { name: 'In-Flight Transit', time: '14:00 UTC', completed: false, current: true },
        { name: 'Troll Airway Checkpoint', time: '18:00 UTC', completed: false, current: false },
        { name: 'Bharati Touchdown', time: '21:00 UTC', completed: false, current: false },
      ],
    },
    movementHistory: [
      {
        id: 'MOV-2026-09',
        origin: 'Maitri Base',
        destination: 'Bharati Base',
        departureDate: '2026-09-17',
        arrivalDate: '2026-09-17',
        transportMode: 'Basler BT-67 Air Lift',
        carrierVehicle: 'Flight C-FTAP',
        status: 'In Transit',
        notes: 'Logistics handover and generator spare delivery oversight.',
      },
    ],
    activityLogs: [
      {
        timestamp: '2026-09-17 06:15 UTC',
        activity: 'Flight Departure Manifest Cleared',
        location: 'Maitri Air Strip',
        officer: 'Lt. Col. Vikramaditya Singh',
      },
    ],
  },
  {
    id: 'NCPOR-P-4409',
    name: 'Dr. Sunita Deshmukh',
    role: 'Medical Officer / Hyperbaric Specialist',
    organization: 'Indo-Tibetan Border Police (ITBP Medical)',
    expeditionId: 'EXP-2026-014',
    expeditionName: '44th Indian Scientific Expedition to Antarctica (ISEA)',
    currentStation: 'Maitri Base',
    destination: 'Maitri Hospital Module',
    departure: '2026-09-14',
    expectedArrival: '2026-09-14',
    transportMode: 'Station Base (No Transit)',
    status: 'At Station',
    carrierFlight: 'Hospital Module',
    coordinates: '70°45\'57" S, 11°44\'09" E',
    moduleLocation: 'Maitri Medical Bay & Hospital',
    vhfCallsign: 'MEDIC-MAITRI-01',
    bloodGroup: 'A+',
    medicalClearance: 'AIIMS Aeromedical Specialist Certified',
    medicalClearanceDate: '2026-08-01 (Valid for 24 Months)',
    survivalTraining: 'Advanced Winter Survival & Mountain Medicine',
    survivalTrainingSchool: 'ITBP Auli / NIM Uttarkashi',
    emergencyRole: 'Chief Medical Officer / Triage Controller',
    movementTimeline: {
      origin: 'Cape Town Airport',
      destination: 'Maitri Base',
      departureTime: '2026-09-14 05:00 UTC',
      transitCheckpoint: 'Novo Airfield',
      expectedArrival: '2026-09-14 11:15 UTC',
      currentStageIndex: 3,
      stages: [
        { name: 'Boarding Cape Town', time: '2026-09-14', completed: true, current: false },
        { name: 'Polar Air Flight', time: '2026-09-14', completed: true, current: false },
        { name: 'Novo Strip Arrival', time: '2026-09-14', completed: true, current: false },
        { name: 'Hospital Handover', time: '2026-09-14', completed: true, current: true },
      ],
    },
    movementHistory: [
      {
        id: 'MOV-2026-04',
        origin: 'Cape Town Airport',
        destination: 'Maitri Base',
        departureDate: '2026-09-14',
        arrivalDate: '2026-09-14',
        transportMode: 'Basler BT-67 Air Lift',
        carrierVehicle: 'BT-67 Flight C-FTAP',
        status: 'Completed',
        notes: 'Inbound medical rotation accompanying emergency oxygen cylinders.',
      },
    ],
    activityLogs: [
      {
        timestamp: '2026-09-16 14:00 UTC',
        activity: 'Completed Station Crew Periodic Blood Pressure & ECG Sweeps',
        location: 'Maitri Hospital Bay',
        officer: 'Dr. Sunita Deshmukh',
      },
    ],
  },
  {
    id: 'NCPOR-P-4414',
    name: 'Er. Rajesh K. Nair',
    role: 'Chief Generator & Heavy Machinery Engineer',
    organization: 'NCPOR Technical Division',
    expeditionId: 'EXP-2026-014',
    expeditionName: '44th Indian Scientific Expedition to Antarctica (ISEA)',
    currentStation: 'Bharati Base',
    destination: 'Bharati Base (Stationary)',
    departure: '2026-09-01',
    expectedArrival: '2026-09-05',
    transportMode: 'Station Base (No Transit)',
    status: 'At Station',
    carrierFlight: 'Power Module Workshop',
    coordinates: '69°24\'28" S, 76°11\'14" E',
    moduleLocation: 'Bharati Power Plant Module #1',
    vhfCallsign: 'BHARATI-CHIEF-ENG',
    bloodGroup: 'AB+',
    medicalClearance: 'AIIMS Certified',
    medicalClearanceDate: '2026-07-20 (Valid for 18 Months)',
    survivalTraining: 'Auli Snow Safety Valid',
    survivalTrainingSchool: 'ITBP Auli Training Institute',
    emergencyRole: 'Station Vital Systems & Fire Suppression Lead',
    movementTimeline: {
      origin: 'Mormugao Goa',
      destination: 'Bharati Base',
      departureTime: '2026-09-01 10:00 UTC',
      transitCheckpoint: 'Mauritius Staging Hub',
      expectedArrival: '2026-09-05 14:00 UTC',
      currentStageIndex: 3,
      stages: [
        { name: 'Staging Goa', time: '2026-09-01', completed: true, current: false },
        { name: 'Air Transport', time: '2026-09-03', completed: true, current: false },
        { name: 'Larsemann Helo Landing', time: '2026-09-05', completed: true, current: false },
        { name: 'Power Plant Check-in', time: '2026-09-05', completed: true, current: true },
      ],
    },
    movementHistory: [
      {
        id: 'MOV-2026-02',
        origin: 'Goa',
        destination: 'Bharati Base',
        departureDate: '2026-09-01',
        arrivalDate: '2026-09-05',
        transportMode: 'Helicopter Shuttle',
        carrierVehicle: 'Kamov Ka-32 Heli',
        status: 'Completed',
        notes: 'Deployment for pre-season generator turbo overhaul.',
      },
    ],
    activityLogs: [
      {
        timestamp: '2026-09-17 08:00 UTC',
        activity: 'Completed 250-hour oil drain on Generator #1',
        location: 'Bharati Power Module',
        officer: 'Er. Rajesh K. Nair',
      },
    ],
  },
  {
    id: 'NCPOR-P-4428',
    name: 'Sub. Major Gurpreet Singh',
    role: 'Heavy Vehicle Traverse Master',
    organization: 'Indian Army EME / NCPOR',
    expeditionId: 'EXP-2026-014',
    expeditionName: '44th Indian Scientific Expedition to Antarctica (ISEA)',
    currentStation: 'Schirmacher Oasis (Field Waypoint 14)',
    destination: 'Maitri Base',
    departure: '2026-09-17 14:00 UTC',
    expectedArrival: '2026-09-18 10:00 UTC',
    transportMode: 'PistenBully Sledge Traverse',
    status: 'In Transit',
    carrierFlight: 'PistenBully PB-02 Convoy',
    coordinates: '70°49\' S, 11°38\' E (Field Shelter)',
    moduleLocation: 'Mobile Heated Habitation Caboose #2',
    vhfCallsign: 'TRAVERSE-MASTER-02',
    bloodGroup: 'O-',
    medicalClearance: 'Army Medical Board Valid',
    medicalClearanceDate: '2026-06-15 (Valid for 24 Months)',
    survivalTraining: 'Siachen Polar & High Altitude Master',
    survivalTrainingSchool: 'Siachen Battle School / HAWS',
    emergencyRole: 'Field Search & Rescue Vehicle Lead',
    movementTimeline: {
      origin: 'Geology Field Outpost',
      destination: 'Maitri Base',
      departureTime: '2026-09-17 14:00 UTC',
      transitCheckpoint: 'Waypoint 14 (Halted for Weather)',
      expectedArrival: '2026-09-18 10:00 UTC',
      currentStageIndex: 1,
      stages: [
        { name: 'Convoy Departure', time: '14:00 UTC', completed: true, current: false },
        { name: 'Halt at Waypoint 14', time: '18:22 UTC', completed: false, current: true },
        { name: 'Ice Ridge Crossing', time: 'Pending', completed: false, current: false },
        { name: 'Maitri Base Arrival', time: '10:00 UTC', completed: false, current: false },
      ],
    },
    movementHistory: [
      {
        id: 'MOV-2026-08',
        origin: 'Geology Field Outpost',
        destination: 'Maitri Base',
        departureDate: '2026-09-17',
        arrivalDate: '2026-09-18',
        transportMode: 'PistenBully Sledge Traverse',
        carrierVehicle: 'PistenBully PB-02',
        status: 'In Transit',
        notes: 'Traverse halted temporarily at Waypoint 14 due to 34kt blowing snow.',
      },
    ],
    activityLogs: [
      {
        timestamp: '2026-09-17 18:22 UTC',
        activity: 'Reported Convoy Secured inside Caboose at Waypoint 14',
        location: 'Schirmacher Waypoint 14',
        officer: 'Sub. Major Gurpreet Singh',
      },
    ],
  },
  {
    id: 'NCPOR-P-4501',
    name: 'Dr. Priya Nambiar',
    role: 'Campaign Leader / Marine Biogeochemist',
    organization: 'National Centre for Polar and Ocean Research (NCPOR)',
    expeditionId: 'EXP-2026-015',
    expeditionName: 'Indian Arctic Autumn Scientific Campaign',
    currentStation: 'Himadri Station',
    destination: 'Himadri Station (Ny-Ålesund)',
    departure: '2026-08-15',
    expectedArrival: '2026-08-16',
    transportMode: 'Station Base (No Transit)',
    status: 'At Station',
    carrierFlight: 'Himadri Laboratory',
    coordinates: '78°55\' N, 11°56\' E',
    moduleLocation: 'Kings Bay Lab Suite 3',
    vhfCallsign: 'HIMADRI-LEAD-01',
    bloodGroup: 'A+',
    medicalClearance: 'AIIMS Certified',
    medicalClearanceDate: '2026-06-01 (Valid for 12 Months)',
    survivalTraining: 'Svalbard Polar Bear & Arctic Fire Safety',
    survivalTrainingSchool: 'UNIS Longyearbyen Safety Course',
    emergencyRole: 'Arctic Safety & Environmental Warden',
    movementTimeline: {
      origin: 'Longyearbyen',
      destination: 'Himadri Station',
      departureTime: '2026-08-15 08:00 UTC',
      transitCheckpoint: 'Kings Bay AS Wharf',
      expectedArrival: '2026-08-15 10:30 UTC',
      currentStageIndex: 3,
      stages: [
        { name: 'Longyearbyen Departure', time: '2026-08-15', completed: true, current: false },
        { name: 'Twin Otter Shuttle', time: '2026-08-15', completed: true, current: false },
        { name: 'Ny-Ålesund Landing', time: '2026-08-15', completed: true, current: false },
        { name: 'Himadri Base Check-in', time: '2026-08-15', completed: true, current: true },
      ],
    },
    movementHistory: [
      {
        id: 'MOV-ARC-01',
        origin: 'Longyearbyen',
        destination: 'Himadri (Ny-Ålesund)',
        departureDate: '2026-08-15',
        arrivalDate: '2026-08-15',
        transportMode: 'Twin Otter Feeder',
        carrierVehicle: 'Lufttransport Dornier 228',
        status: 'Completed',
        notes: 'Autumn campaign team deployment.',
      },
    ],
    activityLogs: [
      {
        timestamp: '2026-09-14 09:00 UTC',
        activity: 'Completed Kongsfjorden CTD Water Column Sampling',
        location: 'Fjord Marine Skiff',
        officer: 'Dr. Priya Nambiar',
      },
    ],
  },
  {
    id: 'NCPOR-P-4301',
    name: 'Dr. M. S. Negi',
    role: 'Wintering Overwinter Commander (Relieved)',
    organization: 'National Centre for Polar and Ocean Research (NCPOR)',
    expeditionId: 'EXP-2026-017',
    expeditionName: '43rd ISEA Wintering Relocation & Retrograde Team',
    currentStation: 'Maitri Ice Shelf Berth',
    destination: 'Cape Town Staging Port',
    departure: '2026-09-18 10:00 UTC',
    expectedArrival: '2026-10-15 12:00 UTC',
    transportMode: 'MV Vasily Golovnin',
    status: 'Transferred',
    carrierFlight: 'MV Vasily Golovnin (Cabin 12)',
    coordinates: '70°02\' S, 11°50\' E (Berth)',
    moduleLocation: 'Shipboard Stateroom',
    vhfCallsign: 'RETROGRADE-COMMAND-01',
    bloodGroup: 'O+',
    medicalClearance: 'Post-Wintering Fit to Travel',
    medicalClearanceDate: '2026-09-10',
    survivalTraining: 'Master Polar Instructor',
    survivalTrainingSchool: 'ITBP Auli Senior Fellow',
    emergencyRole: 'Vessel Embarkation Officer',
    movementTimeline: {
      origin: 'Maitri Base',
      destination: 'Cape Town Port',
      departureTime: '2026-09-18 10:00 UTC',
      transitCheckpoint: 'Southern Ocean Sea Lanes',
      expectedArrival: '2026-10-15 12:00 UTC',
      currentStageIndex: 1,
      stages: [
        { name: 'Maitri Handover', time: '2026-09-12', completed: true, current: false },
        { name: 'Vessel Embarkation', time: '2026-09-18', completed: true, current: true },
        { name: 'Sea Transit', time: 'Pending', completed: false, current: false },
        { name: 'Cape Town Berth', time: '2026-10-15', completed: false, current: false },
      ],
    },
    movementHistory: [
      {
        id: 'MOV-43-WINT',
        origin: 'Maitri Base',
        destination: 'Cape Town Port',
        departureDate: '2026-09-18',
        arrivalDate: '2026-10-15',
        transportMode: 'MV Vasily Golovnin',
        carrierVehicle: 'MV Vasily Golovnin',
        status: 'In Transit',
        notes: 'Handover complete. Returning with 43rd ISEA wintering cohort.',
      },
    ],
    activityLogs: [
      {
        timestamp: '2026-09-12 10:00 UTC',
        activity: 'Signed Antarctic Treaty Environmental Compliance Handover',
        location: 'Maitri Base Command Post',
        officer: 'Dr. M. S. Negi',
      },
    ],
  },
]
