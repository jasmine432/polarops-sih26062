export interface StationWeather {
  id: string
  name: string
  location: string
  coordinates: string
  elevation: string
  temperature: number
  temperatureUnit: string
  windChill: number
  pressure: number
  pressureUnit: string
  pressureTrend: 'Falling' | 'Steady' | 'Rising'
  windSpeed: number
  windSpeedUnit: string
  windDirection: string
  windBearing: number
  relativeHumidity: number
  humidityUnit: string
  visibility: string
  condition: string
  blizzardStage: string
  alertLevel: 'NOMINAL' | 'WIND ADVISORY' | 'WHITEOUT WARNING' | 'STORM ALERT'
  statusVariant: 'operational' | 'warning' | 'critical'
  observationTime: string
  sensorId: string
}

export interface WeatherChartPoint {
  time: string
  temp: number
  wind: number
  pressure: number
  humidity: number
}

export interface StationTimeSeries {
  stationId: string
  period: '24h' | '7d' | '30d'
  data: WeatherChartPoint[]
}

export const STATIONS_WEATHER_DATA: Record<string, StationWeather> = {
  Maitri: {
    id: 'Maitri',
    name: 'Maitri Research Base',
    location: 'Schirmacher Oasis, Queen Maud Land, East Antarctica',
    coordinates: '70°45\'57" S, 11°44\'09" E',
    elevation: '117m above sea level',
    temperature: -21.8,
    temperatureUnit: '°C',
    windChill: -38.4,
    pressure: 972.1,
    pressureUnit: 'hPa',
    pressureTrend: 'Falling',
    windSpeed: 34.2,
    windSpeedUnit: 'knots (63 km/h)',
    windDirection: 'Southeast (135°)',
    windBearing: 135,
    relativeHumidity: 68,
    humidityUnit: '%',
    visibility: '1.5 km (Reduced by blowing surface snow)',
    condition: 'Blowing Snow / Katabatic Gale Drift',
    blizzardStage: 'Stage 1 Restricted',
    alertLevel: 'WIND ADVISORY',
    statusVariant: 'warning',
    observationTime: '2026-09-17 18:20 UTC',
    sensorId: 'NCPOR-AWS-MT-01',
  },
  Bharati: {
    id: 'Bharati',
    name: 'Bharati Research Base',
    location: 'Larsemann Hills, East Antarctica',
    coordinates: '69°24\'28" S, 76°11\'14" E',
    elevation: '35m above sea level',
    temperature: -14.2,
    temperatureUnit: '°C',
    windChill: -26.1,
    pressure: 986.4,
    pressureUnit: 'hPa',
    pressureTrend: 'Steady',
    windSpeed: 18.4,
    windSpeedUnit: 'knots (34 km/h)',
    windDirection: 'East (090°)',
    windBearing: 90,
    relativeHumidity: 54,
    humidityUnit: '%',
    visibility: '10+ km (Unrestricted VFR)',
    condition: 'Partly Cloudy, Clear Ice Shelf Runway',
    blizzardStage: 'Stage 0 Normal',
    alertLevel: 'NOMINAL',
    statusVariant: 'operational',
    observationTime: '2026-09-17 18:22 UTC',
    sensorId: 'NCPOR-AWS-BH-02',
  },
}

// 24-hour observation time series
export const MAITRI_24H_SERIES: WeatherChartPoint[] = [
  { time: '00:00', temp: -18.2, wind: 16.0, pressure: 981.2, humidity: 62 },
  { time: '03:00', temp: -19.0, wind: 18.5, pressure: 980.0, humidity: 64 },
  { time: '06:00', temp: -19.8, wind: 22.0, pressure: 978.5, humidity: 65 },
  { time: '09:00', temp: -18.5, wind: 26.4, pressure: 976.2, humidity: 66 },
  { time: '12:00', temp: -17.9, wind: 29.8, pressure: 974.8, humidity: 67 },
  { time: '15:00', temp: -20.4, wind: 32.1, pressure: 973.0, humidity: 68 },
  { time: '18:00', temp: -21.8, wind: 34.2, pressure: 972.1, humidity: 68 },
]

export const BHARATI_24H_SERIES: WeatherChartPoint[] = [
  { time: '00:00', temp: -12.4, wind: 12.0, pressure: 988.0, humidity: 50 },
  { time: '03:00', temp: -13.1, wind: 13.5, pressure: 987.8, humidity: 51 },
  { time: '06:00', temp: -14.0, wind: 15.0, pressure: 987.2, humidity: 52 },
  { time: '09:00', temp: -12.8, wind: 16.2, pressure: 987.0, humidity: 53 },
  { time: '12:00', temp: -11.9, wind: 17.0, pressure: 986.8, humidity: 53 },
  { time: '15:00', temp: -13.5, wind: 17.8, pressure: 986.5, humidity: 54 },
  { time: '18:00', temp: -14.2, wind: 18.4, pressure: 986.4, humidity: 54 },
]

// 7-day observation time series
export const MAITRI_7D_SERIES: WeatherChartPoint[] = [
  { time: '11 Sep', temp: -24.5, wind: 42.0, pressure: 968.0, humidity: 72 },
  { time: '12 Sep', temp: -22.1, wind: 38.5, pressure: 971.2, humidity: 70 },
  { time: '13 Sep', temp: -19.4, wind: 24.0, pressure: 977.0, humidity: 65 },
  { time: '14 Sep', temp: -17.8, wind: 18.2, pressure: 982.5, humidity: 60 },
  { time: '15 Sep', temp: -18.6, wind: 20.1, pressure: 981.0, humidity: 62 },
  { time: '16 Sep', temp: -20.2, wind: 28.0, pressure: 975.4, humidity: 66 },
  { time: '17 Sep', temp: -21.8, wind: 34.2, pressure: 972.1, humidity: 68 },
]

export const BHARATI_7D_SERIES: WeatherChartPoint[] = [
  { time: '11 Sep', temp: -16.8, wind: 22.0, pressure: 984.0, humidity: 58 },
  { time: '12 Sep', temp: -15.4, wind: 20.5, pressure: 985.2, humidity: 56 },
  { time: '13 Sep', temp: -13.8, wind: 15.0, pressure: 988.0, humidity: 52 },
  { time: '14 Sep', temp: -12.1, wind: 14.2, pressure: 989.5, humidity: 48 },
  { time: '15 Sep', temp: -13.0, wind: 15.1, pressure: 988.0, humidity: 50 },
  { time: '16 Sep', temp: -13.9, wind: 16.8, pressure: 987.4, humidity: 52 },
  { time: '17 Sep', temp: -14.2, wind: 18.4, pressure: 986.4, humidity: 54 },
]

// 30-day observation time series
export const MAITRI_30D_SERIES: WeatherChartPoint[] = [
  { time: 'Week 1', temp: -26.2, wind: 38.0, pressure: 970.0, humidity: 74 },
  { time: 'Week 2', temp: -23.5, wind: 31.0, pressure: 975.0, humidity: 69 },
  { time: 'Week 3', temp: -19.8, wind: 22.5, pressure: 980.5, humidity: 63 },
  { time: 'Week 4', temp: -21.8, wind: 34.2, pressure: 972.1, humidity: 68 },
]

export const BHARATI_30D_SERIES: WeatherChartPoint[] = [
  { time: 'Week 1', temp: -18.5, wind: 24.0, pressure: 982.0, humidity: 60 },
  { time: 'Week 2', temp: -16.2, wind: 19.5, pressure: 985.0, humidity: 55 },
  { time: 'Week 3', temp: -13.4, wind: 15.0, pressure: 989.0, humidity: 50 },
  { time: 'Week 4', temp: -14.2, wind: 18.4, pressure: 986.4, humidity: 54 },
]
