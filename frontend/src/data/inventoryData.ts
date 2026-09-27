export type InventoryStatus = 'Normal' | 'Low Stock' | 'Critical'

export type InventoryCategory =
  | 'Fuel & Energy'
  | 'Water & Life Support'
  | 'Vehicle & Machinery Spares'
  | 'Medical Supplies'
  | 'Scientific Reagents'
  | 'Provisions & Rations'

export interface ConsumptionHistoryPoint {
  period: string
  consumption: number
  burnRateDesc: string
  notes: string
}

export interface InventoryTransaction {
  id: string
  timestamp: string
  type: 'Intake Delivery' | 'Consumption Drawdown' | 'Emergency Relocation' | 'Audit Verification'
  quantity: number
  unit: string
  balanceAfter: number
  officer: string
  referenceDoc: string
}

export interface MLInventoryForecast {
  predictedRequirement: number
  currentStock: number
  additionalRequirement: number
  predictionHorizon: string
  modelTimestamp: string
  modelId: string
  confidenceBand: string
  seasonalFactorNote: string
}

export interface PrototypeForecastInputs {
  provenance: 'prototype/synthetic operational inputs'
  scenario?: 'historical-demo' | 'cold-start-demo'
  expedition_id: string
  personnel_count: number
  expedition_duration: number
  lead_time: number
  previous_expedition_consumption: number
  inventory_usage_history: number
  consumption_lag_1: number
  consumption_lag_7: number
  consumption_avg_7: number
  consumption_avg_14: number
  temperature_mean: number
  temperature_min: number
  temperature_max: number
  pressure_mean: number
  pressure_min: number
  pressure_max: number
  wind_speed_mean: number
  wind_speed_max: number
}

const createPrototypeForecastInputs = (
  overrides: Partial<PrototypeForecastInputs> = {},
): PrototypeForecastInputs => ({
  provenance: 'prototype/synthetic operational inputs',
  scenario: 'historical-demo',
  expedition_id: 'EXP-PROTOTYPE-001',
  personnel_count: 39,
  expedition_duration: 136,
  lead_time: 30,
  previous_expedition_consumption: 8.28,
  inventory_usage_history: 118.43,
  consumption_lag_1: 4.79,
  consumption_lag_7: 8.67,
  consumption_avg_7: 7.208571,
  consumption_avg_14: 6.810714,
  temperature_mean: -17.371,
  temperature_min: -22.7,
  temperature_max: -13,
  pressure_mean: 990.029,
  pressure_min: 987.4,
  pressure_max: 994.7,
  wind_speed_mean: 4.454,
  wind_speed_max: 4.5,
  ...overrides,
})

export interface InventoryItem {
  id: string
  name: string
  category: InventoryCategory
  station: 'Maitri' | 'Bharati' | 'Himadri' | 'Joint Antarctic'
  storageLocation: string
  unit: string
  currentStock: number
  minimumStock: number
  averageDailyConsumption: number
  dailyConsumptionDisplay: string
  daysRemaining: number
  status: InventoryStatus
  lastUpdated: string
  specifications: string
  expectedRequirement: number
  forecast: MLInventoryForecast
  prototypeForecastInputs: PrototypeForecastInputs
  consumptionHistory: ConsumptionHistoryPoint[]
  recentTransactions: InventoryTransaction[]
}

export const INITIAL_INVENTORY_ITEMS: InventoryItem[] = [
  {
    id: 'INV-POL-0101',
    name: 'Aviation Turbine Fuel (Jet A-1 Polar Spec)',
    category: 'Fuel & Energy',
    station: 'Maitri',
    prototypeForecastInputs: createPrototypeForecastInputs({
      previous_expedition_consumption: 31.7,
      inventory_usage_history: 366.18,
      consumption_lag_1: 21.6,
      consumption_lag_7: 47.67,
      consumption_avg_7: 34.661429,
      consumption_avg_14: 31.551429,
      lead_time: 13,
    }),
    storageLocation: 'Aviation Fuel Tank Farm Alpha',
    unit: 'Liters',
    currentStock: 24000,
    minimumStock: 80000,
    averageDailyConsumption: 1200,
    dailyConsumptionDisplay: '1,200 L / Flight Operation',
    daysRemaining: 20,
    status: 'Low Stock',
    lastUpdated: '2026-09-17 14:30 UTC',
    specifications: 'DEF STAN 91-091 / GOST Polar formulation with anti-icing additive (DIEGME). Rated to -58°C freezing point.',
    expectedRequirement: 96000,
    forecast: {
      predictedRequirement: 96000,
      currentStock: 24000,
      additionalRequirement: 72000,
      predictionHorizon: 'Next 90 Days (Austral Summer Air Bridge Operations)',
      modelTimestamp: '2026-09-17 06:00 UTC',
      modelId: 'NCPOR-Demand-Predictor-v2.4',
      confidenceBand: '95% Interval: [88,000 L – 104,000 L]',
      seasonalFactorNote: '+35% increase expected due to Basler BT-67 inter-station feeder airlifts.',
    },
    consumptionHistory: [
      { period: 'Apr 2026', consumption: 8400, burnRateDesc: 'Wintering Flight Pause', notes: 'Emergency flights only' },
      { period: 'May 2026', consumption: 3600, burnRateDesc: 'Overwintering Minimum', notes: 'Station generator testing' },
      { period: 'Jun 2026', consumption: 2400, burnRateDesc: 'Polar Night Standby', notes: 'Nil flights' },
      { period: 'Jul 2026', consumption: 2400, burnRateDesc: 'Polar Night Standby', notes: 'Nil flights' },
      { period: 'Aug 2026', consumption: 7200, burnRateDesc: 'Spring Flight Prep', notes: 'Pre-flight warm-up cycles' },
      { period: 'Sep 2026 (MTD)', consumption: 14400, burnRateDesc: 'Field Recon Dispatches', notes: 'Twin Otter / BT-67 surveys' },
    ],
    recentTransactions: [
      {
        id: 'TXN-9481',
        timestamp: '2026-09-15 11:30 UTC',
        type: 'Consumption Drawdown',
        quantity: -2400,
        unit: 'Liters',
        balanceAfter: 24000,
        officer: 'Sub. Major Gurpreet Singh',
        referenceDoc: 'FLIGHT-REF-BT67-04',
      },
      {
        id: 'TXN-9462',
        timestamp: '2026-09-10 08:00 UTC',
        type: 'Consumption Drawdown',
        quantity: -3600,
        unit: 'Liters',
        balanceAfter: 26400,
        officer: 'Sub. Major Gurpreet Singh',
        referenceDoc: 'FLIGHT-REF-BT67-02',
      },
      {
        id: 'TXN-9410',
        timestamp: '2026-09-01 09:00 UTC',
        type: 'Audit Verification',
        quantity: 0,
        unit: 'Liters',
        balanceAfter: 30000,
        officer: 'Lt. Col. Vikramaditya Singh',
        referenceDoc: 'AUDIT-DIPSTICK-MT-09',
      },
    ],
  },
  {
    id: 'INV-WTR-0204',
    name: 'Lake Priyadarshini RO Membrane Cartridges',
    category: 'Water & Life Support',
    station: 'Maitri',
    prototypeForecastInputs: createPrototypeForecastInputs({
      previous_expedition_consumption: 1.7,
      inventory_usage_history: 30.89,
      consumption_lag_1: 1.63,
      consumption_lag_7: 2.71,
      consumption_avg_7: 2.748571,
      consumption_avg_14: 2.378571,
      lead_time: 19,
    }),
    storageLocation: 'Priyadarshini Water Pump House Module 2',
    unit: 'Units',
    currentStock: 3,
    minimumStock: 6,
    averageDailyConsumption: 0.2,
    dailyConsumptionDisplay: '1 Unit / 5 Days (Heated)',
    daysRemaining: 14,
    status: 'Critical',
    lastUpdated: '2026-09-17 18:00 UTC',
    specifications: 'Dow Filmtec SW30-8040 Sea/Freshwater Spiral-Wound Polyamide reverse osmosis element (high-salinity & glacial lake organics certified).',
    expectedRequirement: 12,
    forecast: {
      predictedRequirement: 12,
      currentStock: 3,
      additionalRequirement: 9,
      predictionHorizon: 'Next 60 Days (Summer Transition)',
      modelTimestamp: '2026-09-17 06:00 UTC',
      modelId: 'NCPOR-Demand-Predictor-v2.4',
      confidenceBand: '95% Interval: [10 – 14 Units]',
      seasonalFactorNote: 'Higher particulate sedimentation during summer lake edge thaw increases filter fouling rate by 40%.',
    },
    consumptionHistory: [
      { period: 'Apr 2026', consumption: 4, burnRateDesc: 'Standard Overwinter', notes: 'Priyadarshini ice-melt intake' },
      { period: 'May 2026', consumption: 3, burnRateDesc: 'Sub-ice pump cycle', notes: 'Normal wear' },
      { period: 'Jun 2026', consumption: 3, burnRateDesc: 'Sub-ice pump cycle', notes: 'Normal wear' },
      { period: 'Jul 2026', consumption: 4, burnRateDesc: 'Sub-ice pump cycle', notes: 'Replaced element B-2' },
      { period: 'Aug 2026', consumption: 4, burnRateDesc: 'Sub-ice pump cycle', notes: 'Replaced element B-1' },
      { period: 'Sep 2026 (MTD)', consumption: 3, burnRateDesc: 'High silt intake', notes: 'Fouled element replacement' },
    ],
    recentTransactions: [
      {
        id: 'TXN-9490',
        timestamp: '2026-09-16 11:00 UTC',
        type: 'Consumption Drawdown',
        quantity: -1,
        unit: 'Units',
        balanceAfter: 3,
        officer: 'Er. Rajesh K. Nair',
        referenceDoc: 'MAINT-RO-2026-09-16',
      },
      {
        id: 'TXN-9380',
        timestamp: '2026-08-28 14:00 UTC',
        type: 'Consumption Drawdown',
        quantity: -1,
        unit: 'Units',
        balanceAfter: 4,
        officer: 'Er. Rajesh K. Nair',
        referenceDoc: 'MAINT-RO-2026-08-28',
      },
    ],
  },
  {
    id: 'INV-DSL-0102',
    name: 'Ultra-Low Sulfur Arctic Diesel Reserve',
    category: 'Fuel & Energy',
    station: 'Bharati',
    prototypeForecastInputs: createPrototypeForecastInputs({
      previous_expedition_consumption: 23.41,
      inventory_usage_history: 611.63,
      consumption_lag_1: 16.39,
      consumption_lag_7: 27.71,
      consumption_avg_7: 24.021429,
      consumption_avg_14: 22.03,
      temperature_mean: -14.2,
      temperature_min: -16.8,
      temperature_max: -12.1,
      pressure_mean: 987.4,
      pressure_min: 984,
      pressure_max: 989.5,
      wind_speed_mean: 18.4,
      wind_speed_max: 22,
      lead_time: 38,
    }),
    storageLocation: 'Bharati Main Fuel Tanker Farm B-1',
    unit: 'Liters',
    currentStock: 410000,
    minimumStock: 120000,
    averageDailyConsumption: 2400,
    dailyConsumptionDisplay: '2,400 L / Day (Heating & Power)',
    daysRemaining: 170,
    status: 'Normal',
    lastUpdated: '2026-09-17 12:00 UTC',
    specifications: 'Arctic Grade Diesel with Cold Filter Plugging Point (CFPP) -52°C. Low aromatic content, ultra-clean combustion.',
    expectedRequirement: 280000,
    forecast: {
      predictedRequirement: 280000,
      currentStock: 410000,
      additionalRequirement: 0,
      predictionHorizon: 'Next 120 Days (Austral Summer)',
      modelTimestamp: '2026-09-17 06:00 UTC',
      modelId: 'NCPOR-Demand-Predictor-v2.4',
      confidenceBand: '95% Interval: [265,000 L – 295,000 L]',
      seasonalFactorNote: 'Summer solar array generation reduces daytime diesel generator load by 18%.',
    },
    consumptionHistory: [
      { period: 'Apr 2026', consumption: 78000, burnRateDesc: 'Overwinter heating', notes: '3 generators in alternating cycle' },
      { period: 'May 2026', consumption: 82000, burnRateDesc: 'Peak winter load', notes: 'Full thermal heating loops active' },
      { period: 'Jun 2026', consumption: 85000, burnRateDesc: 'Peak winter load', notes: 'External temps dropped to -34°C' },
      { period: 'Jul 2026', consumption: 86000, burnRateDesc: 'Peak winter load', notes: 'External temps dropped to -38°C' },
      { period: 'Aug 2026', consumption: 79000, burnRateDesc: 'Spring transition', notes: 'Normal generator operation' },
      { period: 'Sep 2026 (MTD)', consumption: 38000, burnRateDesc: 'Moderate heating', notes: 'Generator #2 offline for maintenance' },
    ],
    recentTransactions: [
      {
        id: 'TXN-9502',
        timestamp: '2026-09-17 08:00 UTC',
        type: 'Consumption Drawdown',
        quantity: -2400,
        unit: 'Liters',
        balanceAfter: 410000,
        officer: 'Er. Rajesh K. Nair',
        referenceDoc: 'DAILY-FUEL-BH-2026-09-17',
      },
    ],
  },
  {
    id: 'INV-MCH-0308',
    name: 'Cummins QSK60 Primary Lubricant Oil (15W-40 Polar)',
    category: 'Vehicle & Machinery Spares',
    station: 'Bharati',
    prototypeForecastInputs: createPrototypeForecastInputs({
      previous_expedition_consumption: 2.97,
      inventory_usage_history: 26.36,
      consumption_lag_1: 2.32,
      consumption_lag_7: 4.05,
      consumption_avg_7: 3.294286,
      consumption_avg_14: 2.900714,
      temperature_mean: -14.2,
      temperature_min: -16.8,
      temperature_max: -12.1,
      pressure_mean: 987.4,
      pressure_min: 984,
      pressure_max: 989.5,
      wind_speed_mean: 18.4,
      wind_speed_max: 22,
      lead_time: 11,
    }),
    storageLocation: 'Bharati Mechanical Spares Vault',
    unit: 'Drums (200L)',
    currentStock: 6,
    minimumStock: 12,
    averageDailyConsumption: 0.21,
    dailyConsumptionDisplay: '1 Drum / 5 Days (Generator Rotation)',
    daysRemaining: 28,
    status: 'Low Stock',
    lastUpdated: '2026-09-17 09:15 UTC',
    specifications: 'Synthetic low-temperature heavy-duty diesel engine oil with high total base number (TBN 14) for continuous running polar generators.',
    expectedRequirement: 18,
    forecast: {
      predictedRequirement: 18,
      currentStock: 6,
      additionalRequirement: 12,
      predictionHorizon: 'Next 90 Days (Generator Overhaul Window)',
      modelTimestamp: '2026-09-17 06:00 UTC',
      modelId: 'NCPOR-Demand-Predictor-v2.4',
      confidenceBand: '95% Interval: [16 – 20 Drums]',
      seasonalFactorNote: 'Heavy usage scheduled for continuous 250-hour oil drain intervals on all 3 generator sets.',
    },
    consumptionHistory: [
      { period: 'May 2026', consumption: 4, burnRateDesc: 'Generator Oil Change', notes: 'Unit 1 full drain' },
      { period: 'Jun 2026', consumption: 4, burnRateDesc: 'Generator Oil Change', notes: 'Unit 2 full drain' },
      { period: 'Jul 2026', consumption: 5, burnRateDesc: 'Generator Oil Change', notes: 'Unit 3 full drain' },
      { period: 'Aug 2026', consumption: 4, burnRateDesc: 'Generator Oil Change', notes: 'Unit 1 full drain' },
      { period: 'Sep 2026', consumption: 3, burnRateDesc: 'Routine topping', notes: 'Sump top-up' },
    ],
    recentTransactions: [
      {
        id: 'TXN-9477',
        timestamp: '2026-09-14 16:00 UTC',
        type: 'Consumption Drawdown',
        quantity: -1,
        unit: 'Drums',
        balanceAfter: 6,
        officer: 'Er. Rajesh K. Nair',
        referenceDoc: 'LUBE-BH-QSK60-09',
      },
    ],
  },
  {
    id: 'INV-MED-0412',
    name: 'Emergency Sterile Surgical Packs & Plasma Units',
    category: 'Medical Supplies',
    station: 'Maitri',
    prototypeForecastInputs: createPrototypeForecastInputs({
      previous_expedition_consumption: 1.47,
      inventory_usage_history: 37.67,
      consumption_lag_1: 0.98,
      consumption_lag_7: 1.43,
      consumption_avg_7: 1.258571,
      consumption_avg_14: 1.188571,
      lead_time: 15,
    }),
    storageLocation: 'Maitri Hospital Trauma Refrigerator Module',
    unit: 'Packs',
    currentStock: 4,
    minimumStock: 8,
    averageDailyConsumption: 0.13,
    dailyConsumptionDisplay: 'Standby Reserve (Expedition Quota)',
    daysRemaining: 30,
    status: 'Low Stock',
    lastUpdated: '2026-09-17 15:00 UTC',
    specifications: 'Lyophilized freeze-dried plasma, sterile orthopedic trauma instrumentation, haemostatic gauze, and vascular clamps (AIIMS certified).',
    expectedRequirement: 10,
    forecast: {
      predictedRequirement: 10,
      currentStock: 4,
      additionalRequirement: 6,
      predictionHorizon: 'Next 90 Days (Field Traverse Season)',
      modelTimestamp: '2026-09-17 06:00 UTC',
      modelId: 'NCPOR-Demand-Predictor-v2.4',
      confidenceBand: '95% Interval: [8 – 12 Packs]',
      seasonalFactorNote: 'Higher probability of minor frostbite and orthopedic field trauma during remote tractor traverses.',
    },
    consumptionHistory: [
      { period: 'Jun 2026', consumption: 1, burnRateDesc: 'Minor finger laceration', notes: 'Suturing sterile pack consumed' },
      { period: 'Aug 2026', consumption: 1, burnRateDesc: 'Medical audit expired', notes: 'Routine disposal of batch 2024' },
    ],
    recentTransactions: [
      {
        id: 'TXN-9430',
        timestamp: '2026-09-05 10:00 UTC',
        type: 'Audit Verification',
        quantity: 0,
        unit: 'Packs',
        balanceAfter: 4,
        officer: 'Dr. Sunita Deshmukh',
        referenceDoc: 'MED-AUDIT-MT-Q3',
      },
    ],
  },
  {
    id: 'INV-SCI-0509',
    name: 'Liquid Nitrogen Sample Cryo-Dewars (35L)',
    category: 'Scientific Reagents',
    station: 'Himadri',
    prototypeForecastInputs: createPrototypeForecastInputs({
      previous_expedition_consumption: 2.07,
      inventory_usage_history: 18.94,
      consumption_lag_1: 1.44,
      consumption_lag_7: 2.52,
      consumption_avg_7: 1.94,
      consumption_avg_14: 1.825714,
      lead_time: 16,
    }),
    storageLocation: 'Himadri Marine Cryobiology Vault',
    unit: 'Dewars',
    currentStock: 5,
    minimumStock: 3,
    averageDailyConsumption: 0.08,
    dailyConsumptionDisplay: '0.8 L / Day Boil-off Loss',
    daysRemaining: 62,
    status: 'Normal',
    lastUpdated: '2026-09-16 11:30 UTC',
    specifications: 'Taylor-Wharton high-efficiency vacuum-insulated cryogenic dewars for biological DNA and microbial deep-cold preservation.',
    expectedRequirement: 4,
    forecast: {
      predictedRequirement: 4,
      currentStock: 5,
      additionalRequirement: 0,
      predictionHorizon: 'Next 60 Days (Autumn Marine Campaign)',
      modelTimestamp: '2026-09-17 06:00 UTC',
      modelId: 'NCPOR-Demand-Predictor-v2.4',
      confidenceBand: '95% Interval: [3 – 5 Dewars]',
      seasonalFactorNote: 'Standard static boil-off rate within nominal laboratory temperature tolerances.',
    },
    consumptionHistory: [
      { period: 'Jul 2026', consumption: 1, burnRateDesc: 'Fjord sample preservation', notes: 'Glacial runoff microbes' },
      { period: 'Aug 2026', consumption: 1, burnRateDesc: 'Bacterial isolate archive', notes: 'DNA sequencing isolates' },
    ],
    recentTransactions: [
      {
        id: 'TXN-9350',
        timestamp: '2026-09-12 14:00 UTC',
        type: 'Intake Delivery',
        quantity: 2,
        unit: 'Dewars',
        balanceAfter: 5,
        officer: 'Dr. Priya Nambiar',
        referenceDoc: 'DELIV-SVALBARD-LN2',
      },
    ],
  },
  {
    id: 'INV-PRV-0601',
    name: 'Wintering High-Calorie Freeze-Dried Food Packs',
    category: 'Provisions & Rations',
    station: 'Maitri',
    prototypeForecastInputs: createPrototypeForecastInputs({
      scenario: 'cold-start-demo',
      previous_expedition_consumption: 0,
      inventory_usage_history: 0,
      consumption_lag_1: 0,
      consumption_lag_7: 0,
      consumption_avg_7: 0,
      consumption_avg_14: 0,
    }),
    storageLocation: 'Maitri Habitat Cold Storage Hold #1',
    unit: 'Packs (Monthly)',
    currentStock: 180,
    minimumStock: 90,
    averageDailyConsumption: 1,
    dailyConsumptionDisplay: '1 Pack / Person-Month equivalent',
    daysRemaining: 180,
    status: 'Normal',
    lastUpdated: '2026-09-17 08:00 UTC',
    specifications: 'DFRL Mysore certified balanced 4,200 kcal/day high-protein polar emergency ration packages with 3-year shelf life.',
    expectedRequirement: 120,
    forecast: {
      predictedRequirement: 120,
      currentStock: 180,
      additionalRequirement: 0,
      predictionHorizon: 'Next 120 Days (End of Austral Winter)',
      modelTimestamp: '2026-09-17 06:00 UTC',
      modelId: 'NCPOR-Demand-Predictor-v2.4',
      confidenceBand: '95% Interval: [110 – 130 Packs]',
      seasonalFactorNote: 'Caloric consumption stable during scheduled station meals.',
    },
    consumptionHistory: [
      { period: 'May 2026', consumption: 24, burnRateDesc: 'Wintering ration consumption', notes: '24 station members' },
      { period: 'Jun 2026', consumption: 24, burnRateDesc: 'Wintering ration consumption', notes: '24 station members' },
      { period: 'Jul 2026', consumption: 24, burnRateDesc: 'Wintering ration consumption', notes: '24 station members' },
      { period: 'Aug 2026', consumption: 24, burnRateDesc: 'Wintering ration consumption', notes: '24 station members' },
    ],
    recentTransactions: [
      {
        id: 'TXN-9401',
        timestamp: '2026-09-01 07:00 UTC',
        type: 'Consumption Drawdown',
        quantity: -24,
        unit: 'Packs',
        balanceAfter: 180,
        officer: 'Dr. M. S. Negi',
        referenceDoc: 'RATION-MONTHLY-09',
      },
    ],
  },
]
