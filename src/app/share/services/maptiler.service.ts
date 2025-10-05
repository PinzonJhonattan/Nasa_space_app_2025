// maptiler.service.ts
import { Injectable } from '@angular/core';
import { Map, MapStyle, config } from '@maptiler/sdk';
import { PrecipitationLayer, TemperatureLayer, WindLayer, RadarLayer } from '@maptiler/weather';
import { environment } from '../../../environments/environment';

export type WeatherLayerType = 'precipitation' | 'temperature' | 'wind' | 'radar';

@Injectable({
  providedIn: 'root'
})
export class MapTilerService {
  private static isConfigured = false;

  constructor() {
    this.initializeConfig();
  }

  private initializeConfig() {
    if (!MapTilerService.isConfigured) {
      config.apiKey = environment.mapTilerApiKey;
      MapTilerService.isConfigured = true;
    }
  }

  createMap(container: HTMLElement, options?: any): Map {
    const defaultOptions = {
      container,
      style: MapStyle.DATAVIZ,
      center: [-74.006, 40.7128], // Nueva York por defecto
      zoom: 3
    };

    // Manejar diferentes estilos de estilo
    if (options?.style === 'backdrop') {
      defaultOptions.style = MapStyle.BACKDROP;
    }

    return new Map({
      ...defaultOptions,
      ...options
    });
  }

  createWeatherLayer(type: WeatherLayerType, options?: any): any {
    let layer;
    switch (type) {
      case 'precipitation':
        layer = new PrecipitationLayer(options);
        break;
      case 'temperature':
        layer = new TemperatureLayer(options);
        break;
      case 'wind':
        layer = new WindLayer(options);
        break;
      case 'radar':
        layer = new RadarLayer(options);
        break;
      default:
        throw new Error(`Weather layer type "${type}" not supported`);
    }
    return layer;
  }

  // Los estilos CSS se cargan globalmente en vendor-maptiler.css
  // Ya no necesitamos cargarlos dinámicamente
}
