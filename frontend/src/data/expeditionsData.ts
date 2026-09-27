export interface ExpeditionPersonnel {
  id: string
  name: string
  role: string
  station: string
  organization: string
  team: string
  bloodGroup: string
  medicalClearance: string
  survivalTraining: string
  status: 'Deployed' | 'Transit' | 'Standby'
}

export interface ExpeditionCargo {
  id: string
  description: string
  carrier: string
  weight: string
  destination: string
  hazmat: string
  priority: 'Critical' | 'High' | 'Standard'
  eta: string
  status: 'In Transit' | 'Delayed' | 'Received' | 'Stowed'
}

export interface ExpeditionInventory {
  item: string
  station: string
  category: 'Fuel & Energy' | 'Life Support' | 'Vehicle & Spares' | 'Medical' | 'Scientific'
  currentStock: string
  minimumStock: string
  daysRemaining: number
  status: 'Critical' | 'Low Stock' | 'Normal'
  burnRate: string
}

export interface ExpeditionEnvironmental {
  station: string
  coordinates: string
  temperature: string
  windChill: string
  windSpeed: string
  windDirection: string
  pressure: string
  pressureTrend: 'Falling' | 'Steady' | 'Rising'
  condition: string
  alertLevel: 'NOMINAL' | 'WIND ADVISORY' | 'WHITEOUT WARNING' | 'STORM ALERT'
  lastUpdated: string
}

export interface ExpeditionIncident {
  id: string
  location: string
  type: string
  severity: 'Critical' | 'Warning' | 'Advisory'
  time: string
  status: string
  assignedUnit: string
  description: string
}

export interface ExpeditionTimelineEvent {
  id: string
  timestamp: string
  title: string
  category: 'Deployment' | 'Logistics' | 'Safety' | 'Scientific' | 'Milestone'
  officer: string
  details: string
}

export interface ExpeditionDetail {
  id: string
  name: string
  season: string
  station: string
  startDate: string
  endDate: string
  lead: string
  leadRole: string
  leadOrg: string
  personnelCount: number
  cargoCount: number
  status: 'Active' | 'Planning' | 'Returning' | 'Concluded'
  notes: string
  mandate: string
  primaryVessel: string
  airSupport: string
  commsLink: string
  personnel: ExpeditionPersonnel[]
  cargo: ExpeditionCargo[]
  inventory: ExpeditionInventory[]
  environmental: ExpeditionEnvironmental[]
  incidents: ExpeditionIncident[]
  timeline: ExpeditionTimelineEvent[]
}

export const INITIAL_EXPEDITIONS: ExpeditionDetail[] = [
  {
    id: 'EXP-2026-014',
    name: '44th Indian Scientific Expedition to Antarctica (ISEA)',
    season: '2026-2027 (Austral Summer & Wintering Relocation)',
    station: 'Maitri & Bharati',
    startDate: '2026-11-20',
    endDate: '2027-04-10',
    lead: 'Dr. Alok Verma',
    leadRole: 'Expedition Leader / Senior Glaciologist',
    leadOrg: 'National Centre for Polar and Ocean Research (NCPOR)',
    personnelCount: 58,
    cargoCount: 14,
    status: 'Active',
    notes: 'Primary 2026-2027 Antarctic campaign executing ice-core deep drilling at Dronning Maud Land, atmospheric physics lidar calibration, and Maitri II replacement station site preparatory surveys.',
    mandate: 'MoES Polar Mandate Ref #ANT-2026-44-NCPOR',
    primaryVessel: 'MV Vasily Golovnin (Chartered Polar Vessel)',
    airSupport: 'Basler BT-67 Polar Turbo / DROMLAN Air Link',
    commsLink: 'INMARSAT Global Xpress & GSAT-7A Ku-Band Feed',
    personnel: [
      {
        id: 'NCPOR-P-4401',
        name: 'Dr. Alok Verma',
        role: 'Expedition Leader / Senior Glaciologist',
        station: 'Maitri Station',
        organization: 'NCPOR / MoES',
        team: 'Glaciology & Leadership',
        bloodGroup: 'O+',
        medicalClearance: 'AIIMS Certified',
        survivalTraining: 'ITBP Auli Polar Qualified',
        status: 'Deployed',
      },
      {
        id: 'NCPOR-P-4404',
        name: 'Lt. Col. Vikramaditya Singh',
        role: 'Station Operations & Logistics Commander',
        station: 'Bharati Station',
        organization: 'Indian Army (Corps of Engineers)',
        team: 'Logistics & Safety',
        bloodGroup: 'B+',
        medicalClearance: 'Army Base Hospital Delhi',
        survivalTraining: 'High Altitude Warfare School',
        status: 'Deployed',
      },
      {
        id: 'NCPOR-P-4409',
        name: 'Dr. Sunita Deshmukh',
        role: 'Medical Officer / Hyperbaric Specialist',
        station: 'Maitri Station',
        organization: 'Indo-Tibetan Border Police (ITBP)',
        team: 'Medical Response',
        bloodGroup: 'A+',
        medicalClearance: 'Full Aeromedical Valid',
        survivalTraining: 'Winter Mountaineering Valid',
        status: 'Deployed',
      },
      {
        id: 'NCPOR-P-4414',
        name: 'Er. Rajesh K. Nair',
        role: 'Chief Generator & Heavy Machinery Engineer',
        station: 'Bharati Station',
        organization: 'NCPOR Technical Division',
        team: 'Engineering & Power',
        bloodGroup: 'AB+',
        medicalClearance: 'AIIMS Certified',
        survivalTraining: 'Auli Snow Safety Valid',
        status: 'Deployed',
      },
      {
        id: 'NCPOR-P-4421',
        name: 'Dr. Meenakshi Sunderam',
        role: 'Atmospheric & Space Physicist',
        station: 'Maitri Station',
        organization: 'Indian Institute of Geomagnetism (IIG)',
        team: 'Geomagnetism & Upper Atmosphere',
        bloodGroup: 'B+',
        medicalClearance: 'AIIMS Certified',
        survivalTraining: 'NCPOR Pre-Deployment Valid',
        status: 'Deployed',
      },
      {
        id: 'NCPOR-P-4428',
        name: 'Sub. Major Gurpreet Singh',
        role: 'Heavy Vehicle Traverse Master',
        station: 'Maitri Station',
        organization: 'Indian Army EME',
        team: 'Traverse Operations',
        bloodGroup: 'O-',
        medicalClearance: 'Army Medical Valid',
        survivalTraining: 'Auli / Siachen Master',
        status: 'Deployed',
      },
    ],
    cargo: [
      {
        id: 'CRG-8821',
        description: 'Ultra-Low Sulfur Arctic Diesel (20,000L ISO Tank)',
        carrier: 'MV Vasily Golovnin',
        weight: '18.4 MT',
        destination: 'Maitri Ice Shelf Berth',
        hazmat: 'Class 3 (Flammable Liquid)',
        priority: 'Critical',
        eta: '2026-11-04 12:00 UTC',
        status: 'In Transit',
      },
      {
        id: 'CRG-8826',
        description: 'PistenBully 300 Track Drive & Hydraulic Spare Assemblies',
        carrier: 'Charter Ice-Vessel',
        weight: '9.2 MT',
        destination: 'Bharati Vehicle Bay',
        hazmat: 'Non-Hazardous Machinery',
        priority: 'High',
        eta: '2026-10-24 16:30 UTC',
        status: 'Delayed',
      },
      {
        id: 'CRG-8830',
        description: 'Scientific Wintering Freeze-Dried Food Rations (18 MT)',
        carrier: 'DROMLAN Air Freight',
        weight: '3.1 MT',
        destination: 'Maitri Station Hub',
        hazmat: 'Non-Hazardous Provisions',
        priority: 'Standard',
        eta: '2026-10-18 09:00 UTC',
        status: 'In Transit',
      },
      {
        id: 'CRG-8834',
        description: 'Cummins QSK-60 Generator Turbocharger Assembly',
        carrier: 'Punta Arenas Air Hub',
        weight: '2.4 MT',
        destination: 'Bharati Power Module',
        hazmat: 'Class 9 Spare Component',
        priority: 'Critical',
        eta: '2026-10-28 14:00 UTC',
        status: 'Delayed',
      },
      {
        id: 'CRG-8812',
        description: 'Emergency Medical Oxygen Cylinders & Trauma Kits',
        carrier: 'Basler BT-67 Air Lift',
        weight: '1.2 MT',
        destination: 'Maitri Medical Bay',
        hazmat: 'Class 2.2 (Non-flam Gas)',
        priority: 'High',
        eta: '2026-09-14 11:20 UTC',
        status: 'Received',
      },
    ],
    inventory: [
      {
        item: 'Lake Priyadarshini RO Membrane Cartridges',
        station: 'Maitri',
        category: 'Life Support',
        currentStock: '3 Units',
        minimumStock: '6 Units',
        daysRemaining: 14,
        status: 'Critical',
        burnRate: '1 Unit / 5 Days (Heated)',
      },
      {
        item: 'Aviation Turbine Fuel (Jet A-1 Polar Spec)',
        station: 'Maitri',
        category: 'Fuel & Energy',
        currentStock: '24,000 Liters',
        minimumStock: '80,000 Liters',
        daysRemaining: 20,
        status: 'Low Stock',
        burnRate: '1,200 L / Flight Operation',
      },
      {
        item: 'Cummins QSK60 Primary Lubricant Oil (15W-40 Polar)',
        station: 'Bharati',
        category: 'Vehicle & Spares',
        currentStock: '6 Drums (1,200 L)',
        minimumStock: '12 Drums (2,400 L)',
        daysRemaining: 28,
        status: 'Low Stock',
        burnRate: '200 L / Month Turbine Cycle',
      },
      {
        item: 'Emergency Sterile Surgical Packs & Plasma',
        station: 'Maitri',
        category: 'Medical',
        currentStock: '4 Units',
        minimumStock: '8 Units',
        daysRemaining: 30,
        status: 'Low Stock',
        burnRate: 'Expedition Reserve Reserve',
      },
      {
        item: 'Ultra-Low Sulfur Arctic Diesel Reserve',
        station: 'Bharati',
        category: 'Fuel & Energy',
        currentStock: '410,000 Liters',
        minimumStock: '120,000 Liters',
        daysRemaining: 170,
        status: 'Normal',
        burnRate: '2,400 L / Day (Heating & Power)',
      },
    ],
    environmental: [
      {
        station: 'Maitri Base (Queen Maud Land)',
        coordinates: '70°45\'57" S, 11°44\'09" E · Elev 117m',
        temperature: '-21.8°C',
        windChill: '-38.4°C',
        windSpeed: '34 kt',
        windDirection: 'SE (135°)',
        pressure: '972 hPa',
        pressureTrend: 'Falling',
        condition: 'Blowing Snow / Whiteout Threat',
        alertLevel: 'WIND ADVISORY',
        lastUpdated: '18:20 UTC',
      },
      {
        station: 'Bharati Base (Larsemann Hills)',
        coordinates: '69°24\'28" S, 76°11\'14" E · Elev 35m',
        temperature: '-14.2°C',
        windChill: '-26.1°C',
        windSpeed: '18 kt',
        windDirection: 'E (090°)',
        pressure: '986 hPa',
        pressureTrend: 'Steady',
        condition: 'Partly Cloudy / VFR Flight Allowed',
        alertLevel: 'NOMINAL',
        lastUpdated: '18:22 UTC',
      },
    ],
    incidents: [
      {
        id: 'INC-2026-04',
        location: 'Schirmacher Oasis (Waypoint 14)',
        type: 'Overdue Field Traverse',
        severity: 'Critical',
        time: '18:22 UTC (45m ago)',
        status: 'SAR Sledge Standby',
        assignedUnit: 'Geology Convoy 2 (PistenBully PB-02)',
        description: 'Traverse team halted at Waypoint 14 due to zero-visibility whiteout conditions. VHF check-in confirmed all 4 members sheltered inside heated mobile caboose with 12 days emergency rations.',
      },
      {
        id: 'INC-2026-05',
        location: 'Polar Plateau Traverse km 22',
        type: 'Crevasse Hazard Zone Shift',
        severity: 'Warning',
        time: '16:00 UTC (3h ago)',
        status: 'Convoy Rerouted via South Track',
        assignedUnit: 'Sub-glacial Glaciology Unit',
        description: 'Ground penetrating radar identified sub-surface snow bridge fracture along primary route. Flag markers updated and navigation tracks rerouted 1.8km south.',
      },
    ],
    timeline: [
      {
        id: 'TL-01',
        timestamp: '2026-09-17 18:22 UTC',
        title: 'Traverse Hold Order Issued for Schirmacher Oasis Sector',
        category: 'Safety',
        officer: 'Lt. Col. Vikramaditya Singh',
        details: 'Issued stop-movement directive to Convoy PB-02 following sudden wind escalation to 34 knots.',
      },
      {
        id: 'TL-02',
        timestamp: '2026-09-17 17:30 UTC',
        title: 'Logistics Flag: Cargo CRG-8834 Delayed at Punta Arenas',
        category: 'Logistics',
        officer: 'NCPOR Logistics Cell',
        details: 'Carrier reported 48h delay on Cummins turbocharger shipment awaiting South American customs release.',
      },
      {
        id: 'TL-03',
        timestamp: '2026-09-16 11:00 UTC',
        title: 'Lake Priyadarshini RO System Health Audit Complete',
        category: 'Milestone',
        officer: 'Er. Rajesh K. Nair',
        details: 'Reverse osmosis system water flow tested at 1.4 L/min. Noted membrane replacement scheduled for next cargo airlift.',
      },
      {
        id: 'TL-04',
        timestamp: '2026-09-15 08:30 UTC',
        title: 'Atmospheric LIDAR Laser Alignment Validated',
        category: 'Scientific',
        officer: 'Dr. Meenakshi Sunderam',
        details: 'Night-sky stratospheric aerosol data transmission resumed to NCPOR headquarters Goa server.',
      },
    ],
  },
  {
    id: 'EXP-2026-015',
    name: 'Indian Arctic Autumn Scientific Campaign',
    season: '2026 (Boreal Autumn)',
    station: 'Himadri (Ny-Ålesund, Svalbard)',
    startDate: '2026-08-15',
    endDate: '2026-10-30',
    lead: 'Dr. Priya Nambiar',
    leadRole: 'Campaign Leader / Marine Biogeochemist',
    leadOrg: 'National Centre for Polar and Ocean Research (NCPOR)',
    personnelCount: 12,
    cargoCount: 6,
    status: 'Active',
    notes: 'Atmospheric boundary layer profiling, Kongsfjorden fjord marine sampling, and microplastic sedimentation tracking in high-Arctic glacier outflow.',
    mandate: 'MoES Arctic Science Policy Mandate #ARC-2026-15',
    primaryVessel: 'Kings Bay Marine Research Skiff & Air Cargo',
    airSupport: 'Svalbard Longyearbyen Twin Otter Feeder',
    commsLink: 'Ny-Ålesund Fiber Backbone & Iridium GO',
    personnel: [
      {
        id: 'NCPOR-P-4501',
        name: 'Dr. Priya Nambiar',
        role: 'Campaign Leader / Biogeochemist',
        station: 'Himadri Station',
        organization: 'NCPOR',
        team: 'Marine Ecology',
        bloodGroup: 'A+',
        medicalClearance: 'AIIMS Certified',
        survivalTraining: 'Svalbard Polar Bear Safety Certified',
        status: 'Deployed',
      },
      {
        id: 'NCPOR-P-4504',
        name: 'Dr. Rohan Bhattacharya',
        role: 'Atmospheric Aerosol Specialist',
        station: 'Himadri Station',
        organization: 'IIT Kanpur / NCPOR',
        team: 'Atmospheric Sciences',
        bloodGroup: 'O+',
        medicalClearance: 'Certified',
        survivalTraining: 'Polar Fire & Boat Safety Valid',
        status: 'Deployed',
      },
    ],
    cargo: [
      {
        id: 'CRG-7102',
        description: 'Kongsfjorden Niskin Water Bottle Sampling Carousel',
        carrier: 'Commercial Air Transport Svalbard',
        weight: '0.4 MT',
        destination: 'Himadri Marine Lab',
        hazmat: 'Non-Hazardous Equipment',
        priority: 'High',
        eta: '2026-09-22 10:00 UTC',
        status: 'In Transit',
      },
    ],
    inventory: [
      {
        item: 'Liquid Nitrogen Dewars (Sample Cryo-storage)',
        station: 'Himadri',
        category: 'Scientific',
        currentStock: '45 Liters',
        minimumStock: '30 Liters',
        daysRemaining: 40,
        status: 'Normal',
        burnRate: '0.8 L / Day Boil-off',
      },
    ],
    environmental: [
      {
        station: 'Himadri Station (Ny-Ålesund)',
        coordinates: '78°55\' N, 11°56\' E · Elev 12m',
        temperature: '-3.5°C',
        windChill: '-8.2°C',
        windSpeed: '12 kt',
        windDirection: 'NW (315°)',
        pressure: '1004 hPa',
        pressureTrend: 'Steady',
        condition: 'Light Sleet / Sea Ice Slush',
        alertLevel: 'NOMINAL',
        lastUpdated: '18:15 UTC',
      },
    ],
    incidents: [],
    timeline: [
      {
        id: 'TL-ARC-01',
        timestamp: '2026-09-14 09:00 UTC',
        title: 'Fjord Water Column Salinity Survey Batch 04 Logged',
        category: 'Scientific',
        officer: 'Dr. Priya Nambiar',
        details: 'CTD sonde profile recorded down to 280m depth in Kongsfjorden inner basin.',
      },
    ],
  },
  {
    id: 'EXP-2026-016',
    name: 'Southern Ocean Paleoclimate Marine Cruise',
    season: '2026-2027 (Summer Hydrographic Voyage)',
    station: 'Prydz Bay Sector',
    startDate: '2026-12-05',
    endDate: '2027-02-28',
    lead: 'Dr. S. K. Roy',
    leadRole: 'Chief Scientist / Marine Geochemist',
    leadOrg: 'National Institute of Oceanography (NIO / NCPOR)',
    personnelCount: 32,
    cargoCount: 8,
    status: 'Planning',
    notes: 'Southern Ocean multi-beam seafloor bathymetry and sediment piston coring along 57°S to 68°S Prydz Bay transect to study Antarctic Circumpolar Current variations.',
    mandate: 'MoES Oceanographic Expedition Order #SOE-13',
    primaryVessel: 'ORV Sagar Kanya / Chartered Oceanographic Vessel',
    airSupport: 'Shipboard Helo Reconnaissance',
    commsLink: 'FleetBroadband Satcom',
    personnel: [
      {
        id: 'NCPOR-P-4601',
        name: 'Dr. S. K. Roy',
        role: 'Chief Scientist',
        station: 'Prydz Bay Sector',
        organization: 'NIO Goa / NCPOR',
        team: 'Marine Geology',
        bloodGroup: 'B+',
        medicalClearance: 'DG Shipping Medical Valid',
        survivalTraining: 'PST & HUET Certified',
        status: 'Standby',
      },
    ],
    cargo: [
      {
        id: 'CRG-9901',
        description: 'Piston Corer 12m Barrel Assemblies & Heavy Winch Cable',
        carrier: 'Mormugao Port Staging',
        weight: '14.5 MT',
        destination: 'ORV Sagar Kanya Hold',
        hazmat: 'Non-Hazardous Steel Rigging',
        priority: 'Standard',
        eta: '2026-11-15 08:00 UTC',
        status: 'Stowed',
      },
    ],
    inventory: [
      {
        item: 'Marine Gas Oil (Bunker MGO Grade)',
        station: 'Prydz Bay Sector',
        category: 'Fuel & Energy',
        currentStock: '620,000 Liters',
        minimumStock: '200,000 Liters',
        daysRemaining: 65,
        status: 'Normal',
        burnRate: '9,500 L / Day Steaming',
      },
    ],
    environmental: [
      {
        station: 'Prydz Bay Marine Sector',
        coordinates: '66°30\' S, 75°00\' E · Open Sea',
        temperature: '-1.2°C',
        windChill: '-7.0°C',
        windSpeed: '26 kt',
        windDirection: 'SW (225°)',
        pressure: '992 hPa',
        pressureTrend: 'Rising',
        condition: 'Swell 3.5m / Pack Ice Margins',
        alertLevel: 'NOMINAL',
        lastUpdated: '18:00 UTC',
      },
    ],
    incidents: [],
    timeline: [
      {
        id: 'TL-SOE-01',
        timestamp: '2026-09-10 14:00 UTC',
        title: 'Cruise Plan & Sampling Stations Cleared by MoES Committee',
        category: 'Milestone',
        officer: 'Dr. S. K. Roy',
        details: 'Approved 42 hydrographic CTD stations and 12 sediment coring locations.',
      },
    ],
  },
  {
    id: 'EXP-2026-017',
    name: '43rd ISEA Wintering Relocation & Retrograde Team',
    season: '2025-2026 (Austral Winter Concluding)',
    station: 'Maitri Base',
    startDate: '2025-11-18',
    endDate: '2026-10-15',
    lead: 'Dr. M. S. Negi',
    leadRole: 'Overwintering Station Commander',
    leadOrg: 'National Centre for Polar and Ocean Research (NCPOR)',
    personnelCount: 22,
    cargoCount: 11,
    status: 'Returning',
    notes: 'Concluding 14-month continuous wintering rotation at Maitri Base. Preparing environmental waste retrograde containers and handing over station habitat control to 44th ISEA team.',
    mandate: 'MoES Antarctic Wintering Order #ISEA-43-WINT',
    primaryVessel: 'MV Vasily Golovnin (Relief Vessel)',
    airSupport: 'DROMLAN Feeder Transfer',
    commsLink: 'Maitri VSAT Ground Station',
    personnel: [
      {
        id: 'NCPOR-P-4301',
        name: 'Dr. M. S. Negi',
        role: 'Wintering Commander',
        station: 'Maitri Base',
        organization: 'NCPOR',
        team: 'Station Command',
        bloodGroup: 'O+',
        medicalClearance: 'Winter-over Clearance Valid',
        survivalTraining: 'Master Polar Survival Instructor',
        status: 'Transit',
      },
    ],
    cargo: [
      {
        id: 'CRG-8701',
        description: 'Antarctic Treaty Environmental Retrograde Waste (Solid Pack)',
        carrier: 'MV Vasily Golovnin',
        weight: '22.0 MT',
        destination: 'Cape Town Waste Treatment',
        hazmat: 'Class 9 Regulated Solid',
        priority: 'High',
        eta: '2026-10-15 12:00 UTC',
        status: 'In Transit',
      },
    ],
    inventory: [
      {
        item: 'Maitri Station Emergency Food Packs',
        station: 'Maitri',
        category: 'Life Support',
        currentStock: '12 Months Reserve',
        minimumStock: '6 Months Reserve',
        daysRemaining: 180,
        status: 'Normal',
        burnRate: 'Standard Wintering Consumption',
      },
    ],
    environmental: [
      {
        station: 'Maitri Base',
        coordinates: '70°45\'57" S, 11°44\'09" E',
        temperature: '-21.8°C',
        windChill: '-38.4°C',
        windSpeed: '34 kt',
        windDirection: 'SE',
        pressure: '972 hPa',
        pressureTrend: 'Falling',
        condition: 'Blowing Snow',
        alertLevel: 'WIND ADVISORY',
        lastUpdated: '18:20 UTC',
      },
    ],
    incidents: [],
    timeline: [
      {
        id: 'TL-43-01',
        timestamp: '2026-09-12 10:00 UTC',
        title: 'Retrograde Waste Containers Sealed under Treaty Protocol',
        category: 'Milestone',
        officer: 'Dr. M. S. Negi',
        details: 'Completed zero-discharge packaging compliance inspection.',
      },
    ],
  },
]
