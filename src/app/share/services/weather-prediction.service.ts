import { Injectable } from '@angular/core';

export interface HistoricalPrediction {
  date: string;
  hour: string;
  temp: number;
  tempMin: number;
  tempMax: number;
  humidity: number;
  wind: number;
  precipitation: number;
  confidence: number; // 0-100
  source: 'forecast' | 'historical-average' | 'historical-data';
  yearsAnalyzed: number;
}

export interface WeatherPredictionResult {
  time: string[];
  temp: number[];
  tempMin: number[];
  tempMax: number[];
  humidity: number[];
  wind: number[];
  precipitation: number[];
  confidence: number[];
  source: string;
}

@Injectable({
  providedIn: 'root'
})
export class WeatherPredictionService {

  constructor() { }

  /**
   * Obtiene predicción climática usando la mejor fuente disponible
   */
  async getWeatherPrediction(
    lat: number,
    lon: number,
    targetDate: Date,
    startHour: string,
    endHour: string
  ): Promise<WeatherPredictionResult> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(targetDate);
    target.setHours(0, 0, 0, 0);
    
    const daysFromToday = Math.floor((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    // Caso 1: Fecha pasada reciente (últimos 3 días) - NO DISPONIBLE
    // NASA tiene delay y Open-Meteo no tiene datos históricos confiables
    if (daysFromToday >= -3 && daysFromToday < 0) {
      throw new Error(`Los datos para fechas de los últimos 3 días no están disponibles debido al delay de procesamiento de NASA POWER. Por favor selecciona una fecha desde hoy en adelante o más de 3 días atrás.`);
    }
    
    // Caso 2: Fecha futura cercana (0-15 días) - usar pronóstico de Open-Meteo
    if (daysFromToday >= 0 && daysFromToday <= 15) {
      return await this.getOpenMeteoForecast(lat, lon, targetDate, startHour, endHour);
    }
    
    // Caso 3: Fecha pasada antigua (>3 días atrás) - usar datos históricos de NASA
    if (daysFromToday < -3) {
      return await this.getNASAHistoricalData(lat, lon, targetDate, startHour, endHour);
    }
    
    // Caso 4: Fecha futura lejana (>15 días) - usar predicción basada en históricos
    return await this.getHistoricalBasedPrediction(lat, lon, targetDate, startHour, endHour);
  }

  /**
   * Obtiene datos históricos reales de NASA POWER
   */
  private async getNASAHistoricalData(
    lat: number,
    lon: number,
    date: Date,
    startHour: string,
    endHour: string
  ): Promise<WeatherPredictionResult> {
    const dateStr = date.toISOString().slice(0, 10);
    const formattedDate = dateStr.replaceAll('-', '');
    
    const apiURL = `https://power.larc.nasa.gov/api/temporal/hourly/point?parameters=T2M,WS10M,RH2M,PRECTOTCORR&community=RE&longitude=${lon}&latitude=${lat}&start=${formattedDate}&end=${formattedDate}&format=JSON`;

    try {
      const response = await fetch(apiURL);
      const data = await response.json();

      const params = data.properties?.parameter;
      if (!params) {
        throw new Error('No NASA POWER data available');
      }

      const [startHours] = startHour.split(':').map(Number);
      const [endHours] = endHour.split(':').map(Number);

      const result: WeatherPredictionResult = {
        time: [],
        temp: [],
        tempMin: [],
        tempMax: [],
        humidity: [],
        wind: [],
        precipitation: [],
        confidence: [],
        source: 'NASA POWER - Historical Data'
      };

      for (let hour = startHours; hour <= endHours; hour++) {
        const hourKey = formattedDate + String(hour).padStart(2, '0');
        const temp = params.T2M?.[hourKey] ?? 20;
        
        result.time.push(`${dateStr}T${String(hour).padStart(2, '0')}:00:00`);
        result.temp.push(temp);
        result.tempMin.push(temp); // Datos reales, min=max
        result.tempMax.push(temp);
        result.humidity.push(params.RH2M?.[hourKey] ?? 60);
        result.wind.push((params.WS10M?.[hourKey] ?? 3) * 3.6);
        result.precipitation.push(params.PRECTOTCORR?.[hourKey] ?? 0);
        result.confidence.push(100); // Datos reales = 100% confianza
      }

      return result;
    } catch (error) {
      console.error('Error fetching NASA data:', error);
      throw error;
    }
  }

  /**
   * Obtiene pronóstico de Open-Meteo (0-15 días)
   */
  private async getOpenMeteoForecast(
    lat: number,
    lon: number,
    date: Date,
    startHour: string,
    endHour: string
  ): Promise<WeatherPredictionResult> {
    const dateStr = date.toISOString().slice(0, 10);
    const apiURL = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation&forecast_days=16&timezone=auto`;

    try {
      const response = await fetch(apiURL);
      const data = await response.json();

      // Formatear timestamps para búsqueda (sin zona horaria)
      const [startHourNum] = startHour.split(':').map(Number);
      const [endHourNum] = endHour.split(':').map(Number);
      const targetStart = `${dateStr}T${String(startHourNum).padStart(2, '0')}:00`;
      const targetEnd = `${dateStr}T${String(endHourNum).padStart(2, '0')}:00`;

      // Buscar índices por string match (más confiable que timestamps)
      const startIndex = data.hourly.time.findIndex((t: string) => t.startsWith(targetStart));
      const endIndex = data.hourly.time.findIndex((t: string) => t.startsWith(targetEnd));

      if (startIndex === -1 || endIndex === -1 || startIndex > endIndex) {
        console.error('Search failed:', {
          targetStart,
          targetEnd,
          startIndex,
          endIndex,
          availableTimes: data.hourly.time.slice(0, 5)
        });
        throw new Error('Forecast not found for selected time range');
      }

      const temps = data.hourly.temperature_2m.slice(startIndex, endIndex + 1);
      
      return {
        time: data.hourly.time.slice(startIndex, endIndex + 1),
        temp: temps,
        tempMin: temps.map((t: number) => t - 1), // Estimación de variación
        tempMax: temps.map((t: number) => t + 1),
        humidity: data.hourly.relative_humidity_2m.slice(startIndex, endIndex + 1),
        wind: data.hourly.wind_speed_10m.slice(startIndex, endIndex + 1),
        precipitation: data.hourly.precipitation.slice(startIndex, endIndex + 1),
        confidence: new Array(endIndex - startIndex + 1).fill(90), // Pronósticos = 90% confianza
        source: 'Open-Meteo - Weather Forecast'
      };
    } catch (error) {
      console.error('Error fetching Open-Meteo data:', error);
      throw error;
    }
  }

  /**
   * Predicción basada en análisis de datos históricos (>15 días futuro)
   * Analiza los últimos 5 años del mismo día/mes
   */
  private async getHistoricalBasedPrediction(
    lat: number,
    lon: number,
    targetDate: Date,
    startHour: string,
    endHour: string
  ): Promise<WeatherPredictionResult> {
    const currentYear = new Date().getFullYear();
    const yearsToAnalyze = 5; // Analizar últimos 5 años
    const targetMonth = targetDate.getMonth() + 1;
    const targetDay = targetDate.getDate();

    console.log(`🔮 Generating prediction based on historical data for ${targetDate.toISOString().slice(0, 10)}`);

    // Recolectar datos históricos de los últimos 5 años
    const historicalData: any[] = [];

    for (let yearOffset = 1; yearOffset <= yearsToAnalyze; yearOffset++) {
      const historicalYear = currentYear - yearOffset;
      const historicalDate = new Date(historicalYear, targetMonth - 1, targetDay);
      const formattedDate = historicalDate.toISOString().slice(0, 10).replaceAll('-', '');

      try {
        const apiURL = `https://power.larc.nasa.gov/api/temporal/hourly/point?parameters=T2M,WS10M,RH2M,PRECTOTCORR&community=RE&longitude=${lon}&latitude=${lat}&start=${formattedDate}&end=${formattedDate}&format=JSON`;
        
        const response = await fetch(apiURL);
        const data = await response.json();

        if (data.properties?.parameter) {
          historicalData.push({
            year: historicalYear,
            date: formattedDate,
            params: data.properties.parameter
          });
        }
      } catch (error) {
        console.warn(`Could not fetch data for ${historicalYear}:`, error);
      }
    }

    if (historicalData.length === 0) {
      throw new Error('No historical data available for prediction');
    }

    // Calcular estadísticas para cada hora
    const [startHours] = startHour.split(':').map(Number);
    const [endHours] = endHour.split(':').map(Number);
    const dateStr = targetDate.toISOString().slice(0, 10);

    const result: WeatherPredictionResult = {
      time: [],
      temp: [],
      tempMin: [],
      tempMax: [],
      humidity: [],
      wind: [],
      precipitation: [],
      confidence: [],
      source: `NASA POWER - Historical Pattern Analysis (${historicalData.length} years)`
    };

    for (let hour = startHours; hour <= endHours; hour++) {
      const hourStr = String(hour).padStart(2, '0');
      
      // Recolectar valores de todos los años para esta hora
      const tempValues: number[] = [];
      const humidityValues: number[] = [];
      const windValues: number[] = [];
      const precipValues: number[] = [];

      historicalData.forEach(yearData => {
        const hourKey = yearData.date + hourStr;
        const temp = yearData.params.T2M?.[hourKey];
        const humidity = yearData.params.RH2M?.[hourKey];
        const wind = yearData.params.WS10M?.[hourKey];
        const precip = yearData.params.PRECTOTCORR?.[hourKey];

        if (temp !== undefined) tempValues.push(temp);
        if (humidity !== undefined) humidityValues.push(humidity);
        if (wind !== undefined) windValues.push(wind);
        if (precip !== undefined) precipValues.push(precip);
      });

      // Calcular estadísticas
      result.time.push(`${dateStr}T${hourStr}:00:00`);
      result.temp.push(this.calculateAverage(tempValues));
      result.tempMin.push(this.calculateMin(tempValues));
      result.tempMax.push(this.calculateMax(tempValues));
      result.humidity.push(this.calculateAverage(humidityValues));
      result.wind.push(this.calculateAverage(windValues) * 3.6); // m/s a km/h
      result.precipitation.push(this.calculateAverage(precipValues));
      
      // Confianza basada en variabilidad histórica
      const tempVariability = this.calculateStandardDeviation(tempValues);
      const confidence = Math.max(50, 100 - (tempVariability * 5)); // Menor variabilidad = mayor confianza
      result.confidence.push(Math.round(confidence));
    }

    return result;
  }

  // Funciones auxiliares para cálculos estadísticos
  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  private calculateMin(values: number[]): number {
    if (values.length === 0) return 0;
    return Math.min(...values);
  }

  private calculateMax(values: number[]): number {
    if (values.length === 0) return 0;
    return Math.max(...values);
  }

  private calculateStandardDeviation(values: number[]): number {
    if (values.length === 0) return 0;
    const avg = this.calculateAverage(values);
    const squareDiffs = values.map(value => Math.pow(value - avg, 2));
    const avgSquareDiff = this.calculateAverage(squareDiffs);
    return Math.sqrt(avgSquareDiff);
  }
}
