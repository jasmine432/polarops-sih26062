export type AlertCategory =
  | 'Inventory'
  | 'Cargo'
  | 'Personnel'
  | 'Emergency'
  | 'Environmental'

export type AlertSeverity = 'Critical' | 'High' | 'Moderate' | 'Low'

export type AlertStatus = 'New' | 'Acknowledged' | 'Resolved'

export type AlertSourceType = 'Rule-Based Threshold' | 'ML Forecast' | 'Sensor Downlink' | 'Manual Dispatch'

export interface OperationalAlertItem {
  id: string
  severity: AlertSeverity
  category: AlertCategory
  message: string
  detail: string
  relatedEntityName: string
  relatedEntityRoute: string
  createdAt: string
  createdDate: string
  status: AlertStatus
  sourceType: AlertSourceType
}

export const INITIAL_ALERTS_DATA: OperationalAlertItem[] = [
  {
    id: 'ALT-2026-081',
    severity: 'Critical',
    category: 'Emergency',
    message: 'Overdue field traverse convoy PB-02 halted at Waypoint 14 under severe whiteout.',
    detail: 'SAR Sledge Standby activated from Maitri Station. VHF radio welfare schedule active.',
    relatedEntityName: 'Incident INC-2026-04 (Schirmacher Oasis)',
    relatedEntityRoute: '/emergency/INC-2026-04',
    createdAt: '18:22 UTC (45m ago)',
    createdDate: '2026-09-17',
    status: 'New',
    sourceType: 'Manual Dispatch',
  },
  {
    id: 'ALT-2026-080',
    severity: 'Critical',
    category: 'Environmental',
    message: 'Katabatic gale advisory in effect for Maitri Base with surface winds exceeding 34 knots.',
    detail: 'Blowing surface snow reducing visibility below 1.5 km. Whiteout Protocol Stage 1 restrictions active.',
    relatedEntityName: 'Maitri Base AWS Telemetry',
    relatedEntityRoute: '/weather',
    createdAt: '18:20 UTC (47m ago)',
    createdDate: '2026-09-17',
    status: 'New',
    sourceType: 'Sensor Downlink',
  },
  {
    id: 'ALT-2026-079',
    severity: 'High',
    category: 'Cargo',
    message: 'Cargo CRG-8834 (Cummins Turbocharger) has passed its expected arrival date due to customs hold.',
    detail: 'Consignment delayed at Punta Arenas air hub awaiting export certificate verification.',
    relatedEntityName: 'Cargo CRG-8834 (Cummins Turbocharger)',
    relatedEntityRoute: '/cargo/CRG-8834',
    createdAt: '17:30 UTC (1h ago)',
    createdDate: '2026-09-17',
    status: 'New',
    sourceType: 'Rule-Based Threshold',
  },
  {
    id: 'ALT-2026-078',
    severity: 'High',
    category: 'Inventory',
    message: 'Medical supplies below minimum stock at Maitri Base.',
    detail: 'Emergency Sterile Surgical Packs & Plasma Units (INV-MED-0412) count at 4 packs (Safety minimum: 8 packs).',
    relatedEntityName: 'Inventory INV-MED-0412 (Surgical Packs & Plasma)',
    relatedEntityRoute: '/inventory/INV-MED-0412',
    createdAt: '15:00 UTC (3h ago)',
    createdDate: '2026-09-17',
    status: 'New',
    sourceType: 'Rule-Based Threshold',
  },
  {
    id: 'ALT-2026-077',
    severity: 'Moderate',
    category: 'Inventory',
    message: 'Predicted inventory requirement exceeds current stock for Aviation Turbine Fuel (Jet A-1).',
    detail: 'ML demand forecast projects 96,000 L requirement vs 24,000 L physical stock (Estimated shortfall: +72,000 L).',
    relatedEntityName: 'Inventory INV-POL-0101 (Jet A-1 Fuel)',
    relatedEntityRoute: '/inventory/INV-POL-0101',
    createdAt: '06:00 UTC (12h ago)',
    createdDate: '2026-09-17',
    status: 'Acknowledged',
    sourceType: 'ML Forecast',
  },
  {
    id: 'ALT-2026-076',
    severity: 'Moderate',
    category: 'Personnel',
    message: 'Field traverse personnel NCPOR-P-4428 sheltering at field waypoint caboose.',
    detail: 'Sub. Major Gurpreet Singh confirmed sheltered with nominal vitals and 12-day emergency ration reserve.',
    relatedEntityName: 'Personnel NCPOR-P-4428 (Sub. Major Gurpreet Singh)',
    relatedEntityRoute: '/personnel/NCPOR-P-4428',
    createdAt: '18:22 UTC (45m ago)',
    createdDate: '2026-09-17',
    status: 'Acknowledged',
    sourceType: 'Manual Dispatch',
  },
  {
    id: 'ALT-2026-075',
    severity: 'High',
    category: 'Cargo',
    message: 'PistenBully track assembly consignment CRG-8826 delayed by vessel maintenance schedule.',
    detail: 'Charter vessel drydock inspection in Mormugao port extended by 9 days.',
    relatedEntityName: 'Cargo CRG-8826 (Track Drive Spares)',
    relatedEntityRoute: '/cargo/CRG-8826',
    createdAt: '16:00 UTC (Yesterday)',
    createdDate: '2026-09-16',
    status: 'Acknowledged',
    sourceType: 'Rule-Based Threshold',
  },
  {
    id: 'ALT-2026-072',
    severity: 'Low',
    category: 'Environmental',
    message: 'VFR helicopter flight clearances operational at Bharati Base runway.',
    detail: 'Visibility exceeding 10 km, wind speeds steady at 18 knots from East.',
    relatedEntityName: 'Bharati Base AWS Telemetry',
    relatedEntityRoute: '/weather',
    createdAt: '14:00 UTC (2 days ago)',
    createdDate: '2026-09-15',
    status: 'Resolved',
    sourceType: 'Sensor Downlink',
  },
  {
    id: 'ALT-2026-070',
    severity: 'Low',
    category: 'Inventory',
    message: 'Lake Priyadarshini water RO membrane filter replacement logged.',
    detail: 'Replaced element B-2 from station stock following high silt intake during thaw.',
    relatedEntityName: 'Inventory INV-WTR-0204 (RO Membrane Filters)',
    relatedEntityRoute: '/inventory/INV-WTR-0204',
    createdAt: '11:00 UTC (Yesterday)',
    createdDate: '2026-09-16',
    status: 'Resolved',
    sourceType: 'Manual Dispatch',
  },
]
