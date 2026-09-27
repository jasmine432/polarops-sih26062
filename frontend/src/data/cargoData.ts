export type CargoStatus =
  | 'Planned'
  | 'Packed'
  | 'Loaded'
  | 'In Transit'
  | 'Arrived'
  | 'Received'
  | 'Delayed'

export type CargoPriority = 'Critical' | 'High' | 'Standard' | 'Low'

export type TransportMode = 'Polar Vessel' | 'Air Cargo' | 'Ice Traverse Sledge' | 'Helicopter Sling'

export interface CargoTimelineStep {
  status: 'Planned' | 'Packed' | 'Loaded' | 'In Transit' | 'Arrived' | 'Received'
  timestamp?: string
  location?: string
  completed: boolean
  current: boolean
}

export interface CargoLogEntry {
  timestamp: string
  action: string
  officer: string
  details: string
}

export interface CargoRecord {
  id: string
  description: string
  category: 'Fuel & Hydrocarbons' | 'Machinery Spares' | 'Scientific Instrumentation' | 'Provisions & Food' | 'Medical Supplies' | 'Structural & Habitat'
  weight: string
  origin: string
  destination: string
  transportMode: TransportMode
  carrier: string
  priority: CargoPriority
  expectedArrival: string
  actualArrival: string | null
  status: CargoStatus
  previousStatus?: CargoStatus // For delayed cargo to know base stage
  expeditionId: string
  expeditionName: string
  hazmat: string
  riskScorePlaceholder: string
  notes: string
  timeline: CargoLogEntry[]
}

export const TIMELINE_STAGES: Array<'Planned' | 'Packed' | 'Loaded' | 'In Transit' | 'Arrived' | 'Received'> = [
  'Planned',
  'Packed',
  'Loaded',
  'In Transit',
  'Arrived',
  'Received',
]

export const INITIAL_CARGO_DATA: CargoRecord[] = [
  {
    id: 'CRG-8821',
    description: 'Ultra-Low Sulfur Arctic Diesel (20,000L ISO Tank)',
    category: 'Fuel & Hydrocarbons',
    weight: '18.4 MT',
    origin: 'Cape Town Staging Port',
    destination: 'Maitri Ice Shelf Berth',
    transportMode: 'Polar Vessel',
    carrier: 'MV Vasily Golovnin',
    priority: 'Critical',
    expectedArrival: '2026-11-04 12:00 UTC',
    actualArrival: null,
    status: 'In Transit',
    expeditionId: 'EXP-2026-014',
    expeditionName: '44th Indian Scientific Expedition to Antarctica (ISEA)',
    hazmat: 'IMO Class 3 (Flammable Liquid)',
    riskScorePlaceholder: 'Nominal (0.14) · Future Risk Engine Slot',
    notes: 'Crucial wintering generator fuel reserves. Thermal jacket heating blanket attached to ISO container frame.',
    timeline: [
      {
        timestamp: '2026-08-20 09:00 UTC',
        action: 'Consignment Registered',
        officer: 'NCPOR Logistics Wing (Goa)',
        details: 'Purchase order cleared and ISO tank allocated at Cape Town storage facility.',
      },
      {
        timestamp: '2026-09-02 14:30 UTC',
        action: 'Packed & Pressure Certified',
        officer: 'Cape Town Port Authority',
        details: 'Pre-voyage seal inspection verified zero vapour leak.',
      },
      {
        timestamp: '2026-09-10 11:00 UTC',
        action: 'Loaded on Vessel Deck Hold 3',
        officer: 'First Mate, MV Vasily Golovnin',
        details: 'Secured with high-tensile twist locks and secondary heavy chain lashings.',
      },
      {
        timestamp: '2026-09-12 06:00 UTC',
        action: 'Vessel Departed Port Cape Town',
        officer: 'Master, MV Vasily Golovnin',
        details: 'Steaming south-southwest toward Antarctic pack ice edge.',
      },
    ],
  },
  {
    id: 'CRG-8826',
    description: 'PistenBully 300 Track Drive & Hydraulic Spare Assemblies',
    category: 'Machinery Spares',
    weight: '9.2 MT',
    origin: 'Mormugao Port Goa',
    destination: 'Bharati Vehicle Bay',
    transportMode: 'Polar Vessel',
    carrier: 'Charter Ice-Vessel',
    priority: 'High',
    expectedArrival: '2026-10-24 16:30 UTC',
    actualArrival: null,
    status: 'Delayed',
    previousStatus: 'Loaded',
    expeditionId: 'EXP-2026-014',
    expeditionName: '44th Indian Scientific Expedition to Antarctica (ISEA)',
    hazmat: 'Non-Hazardous Heavy Machinery',
    riskScorePlaceholder: 'Elevated (0.68) · Future Risk Engine Slot',
    notes: 'Staged for annual traverse fleet overhaul before austral summer fieldwork.',
    timeline: [
      {
        timestamp: '2026-08-15 10:00 UTC',
        action: 'Procured & Crated',
        officer: 'EME Logistics Officer',
        details: 'Heavy wooden crates built with desiccant vapor packs for maritime transit.',
      },
      {
        timestamp: '2026-09-01 16:00 UTC',
        action: 'Stowed at Staging Port',
        officer: 'Mormugao Cargo Super',
        details: 'Transferred to staging yard.',
      },
      {
        timestamp: '2026-09-15 17:30 UTC',
        action: 'Delay Notice Logged',
        officer: 'Shipping Agent Port Louis',
        details: 'Vessel engine drydock routine maintenance extended by 9 days.',
      },
    ],
  },
  {
    id: 'CRG-8830',
    description: 'Scientific Wintering Freeze-Dried Food Rations (18 MT)',
    category: 'Provisions & Food',
    weight: '3.1 MT',
    origin: 'New Delhi DFRL Depot',
    destination: 'Maitri Station Hub',
    transportMode: 'Air Cargo',
    carrier: 'DROMLAN Air Freight',
    priority: 'Standard',
    expectedArrival: '2026-10-18 09:00 UTC',
    actualArrival: null,
    status: 'In Transit',
    expeditionId: 'EXP-2026-014',
    expeditionName: '44th Indian Scientific Expedition to Antarctica (ISEA)',
    hazmat: 'Non-Hazardous Food Provisions',
    riskScorePlaceholder: 'Low (0.08) · Future Risk Engine Slot',
    notes: 'Long-shelf-life rations developed by Defence Food Research Laboratory (DFRL Mysore).',
    timeline: [
      {
        timestamp: '2026-08-25 12:00 UTC',
        action: 'Quality Verified by DFRL Mysore',
        officer: 'Scientific Officer Mysore',
        details: 'Caloric density and airtight foil seal testing passed 100%.',
      },
      {
        timestamp: '2026-09-08 08:00 UTC',
        action: 'Airlift Palletizing',
        officer: 'DROMLAN Air Cargo Hub',
        details: 'Palletized for IL-76 / BT-67 polar transport.',
      },
    ],
  },
  {
    id: 'CRG-8834',
    description: 'Cummins QSK-60 Generator Turbocharger Assembly',
    category: 'Machinery Spares',
    weight: '2.4 MT',
    origin: 'Punta Arenas Air Logistics Hub',
    destination: 'Bharati Power Module',
    transportMode: 'Air Cargo',
    carrier: 'Punta Arenas Air Hub',
    priority: 'Critical',
    expectedArrival: '2026-10-28 14:00 UTC',
    actualArrival: null,
    status: 'Delayed',
    previousStatus: 'In Transit',
    expeditionId: 'EXP-2026-014',
    expeditionName: '44th Indian Scientific Expedition to Antarctica (ISEA)',
    hazmat: 'Class 9 Spare Parts',
    riskScorePlaceholder: 'Critical (0.82) · Future Risk Engine Slot',
    notes: 'Replacement turbine blower for Station Main Powerhouse generator #2.',
    timeline: [
      {
        timestamp: '2026-09-05 11:00 UTC',
        action: 'Dispatched from Supplier',
        officer: 'NCPOR Procurement',
        details: 'Expedited air courier from factory.',
      },
      {
        timestamp: '2026-09-17 04:00 UTC',
        action: 'Customs Clearance Hold',
        officer: 'Punta Arenas Freight Broker',
        details: 'South American customs inspection hold due to export documentation discrepancy.',
      },
    ],
  },
  {
    id: 'CRG-8812',
    description: 'Emergency Medical Oxygen Cylinders & Trauma Kits',
    category: 'Medical Supplies',
    weight: '1.2 MT',
    origin: 'Cape Town Medical Depot',
    destination: 'Maitri Medical Bay',
    transportMode: 'Air Cargo',
    carrier: 'Basler BT-67 Air Lift',
    priority: 'High',
    expectedArrival: '2026-09-14 11:20 UTC',
    actualArrival: '2026-09-14 11:15 UTC',
    status: 'Received',
    expeditionId: 'EXP-2026-014',
    expeditionName: '44th Indian Scientific Expedition to Antarctica (ISEA)',
    hazmat: 'IMO Class 2.2 (Compressed Non-Flam Gas)',
    riskScorePlaceholder: 'Nominal (0.00) · Completed',
    notes: 'Delivered to Dr. Sunita Deshmukh at Maitri Hospital Room. Verified full bottle pressure.',
    timeline: [
      {
        timestamp: '2026-09-10 09:00 UTC',
        action: 'Flight Manifest Cleared',
        officer: 'Novo Runway Operations',
        details: 'Loaded onto BT-67 flight tail C-FTAP.',
      },
      {
        timestamp: '2026-09-14 11:15 UTC',
        action: 'Touchdown & Received at Base',
        officer: 'Dr. Sunita Deshmukh',
        details: 'Hospital inventory intake logged and confirmed on station network.',
      },
    ],
  },
  {
    id: 'CRG-8815',
    description: 'Atmospheric Physics Micro-LIDAR Replacement Mirrors',
    category: 'Scientific Instrumentation',
    weight: '0.8 MT',
    origin: 'Goa Lab Workshop',
    destination: 'Bharati Research Lab',
    transportMode: 'Air Cargo',
    carrier: 'DROMLAN Transfer',
    priority: 'Standard',
    expectedArrival: '2026-09-15 17:00 UTC',
    actualArrival: '2026-09-15 16:45 UTC',
    status: 'Received',
    expeditionId: 'EXP-2026-014',
    expeditionName: '44th Indian Scientific Expedition to Antarctica (ISEA)',
    hazmat: 'Fragile Optical Instrumentation',
    riskScorePlaceholder: 'Nominal (0.00) · Completed',
    notes: 'Laser alignment optics installed and calibrated for upper atmospheric ozone tracking.',
    timeline: [
      {
        timestamp: '2026-09-15 16:45 UTC',
        action: 'Delivered to Science Bay',
        officer: 'Dr. Meenakshi Sunderam',
        details: 'Optical mirror surfaces inspected without scratch or condensation damage.',
      },
    ],
  },
  {
    id: 'CRG-7102',
    description: 'Kongsfjorden Niskin Water Bottle Sampling Carousel',
    category: 'Scientific Instrumentation',
    weight: '0.4 MT',
    origin: 'Tromsø Marine Base',
    destination: 'Himadri Marine Lab',
    transportMode: 'Air Cargo',
    carrier: 'Commercial Air Transport Svalbard',
    priority: 'High',
    expectedArrival: '2026-09-22 10:00 UTC',
    actualArrival: null,
    status: 'Loaded',
    expeditionId: 'EXP-2026-015',
    expeditionName: 'Indian Arctic Autumn Scientific Campaign',
    hazmat: 'Non-Hazardous Oceanographic Gear',
    riskScorePlaceholder: 'Low (0.10) · Future Risk Engine Slot',
    notes: 'Marine biogeochemical sampling array for Arctic fjord depth transects.',
    timeline: [
      {
        timestamp: '2026-09-12 11:00 UTC',
        action: 'Packed & Loaded at Tromsø',
        officer: 'Svalbard Freight Forwarder',
        details: 'Stowed for Longyearbyen shuttle transfer.',
      },
    ],
  },
  {
    id: 'CRG-9901',
    description: 'Piston Corer 12m Barrel Assemblies & Heavy Winch Cable',
    category: 'Scientific Instrumentation',
    weight: '14.5 MT',
    origin: 'Mormugao Port Goa',
    destination: 'ORV Sagar Kanya Hold',
    transportMode: 'Polar Vessel',
    carrier: 'Mormugao Port Staging',
    priority: 'Standard',
    expectedArrival: '2026-11-15 08:00 UTC',
    actualArrival: null,
    status: 'Packed',
    expeditionId: 'EXP-2026-016',
    expeditionName: 'Southern Ocean Paleoclimate Marine Cruise',
    hazmat: 'Heavy Rigging Steel',
    riskScorePlaceholder: 'Low (0.05) · Future Risk Engine Slot',
    notes: 'Seafloor sediment sampling kit for Southern Ocean transects.',
    timeline: [
      {
        timestamp: '2026-09-05 14:00 UTC',
        action: 'Packed in Yard 4',
        officer: 'NIO Ocean Engineering Cell',
        details: 'Steel cables greased and spooled onto deck winches.',
      },
    ],
  },
  {
    id: 'CRG-9940',
    description: 'Modular Snow-Drift Shelter Prefab Panels',
    category: 'Structural & Habitat',
    weight: '6.5 MT',
    origin: 'New Delhi Staging Center',
    destination: 'Maitri Ice Shelf Berth',
    transportMode: 'Polar Vessel',
    carrier: 'MV Vasily Golovnin',
    priority: 'Low',
    expectedArrival: '2026-12-01 10:00 UTC',
    actualArrival: null,
    status: 'Planned',
    expeditionId: 'EXP-2026-014',
    expeditionName: '44th Indian Scientific Expedition to Antarctica (ISEA)',
    hazmat: 'Non-Hazardous Building Materials',
    riskScorePlaceholder: 'Nominal (0.02) · Future Risk Engine Slot',
    notes: 'Emergency refuge hut components for outer Schirmacher field traverses.',
    timeline: [
      {
        timestamp: '2026-09-15 09:30 UTC',
        action: 'Procurement Cleared',
        officer: 'NCPOR Infrastructure',
        details: 'Manufacturing specifications validated.',
      },
    ],
  },
]
