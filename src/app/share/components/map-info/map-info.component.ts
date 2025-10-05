// map-info.component.ts
import { Component, ElementRef, OnDestroy, OnInit, ViewChild, inject, signal, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { isPlatformBrowser, CommonModule, NgIf } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { ProgressBarModule } from 'primeng/progressbar';
import { TableModule } from 'primeng/table';
import { MessageModule } from 'primeng/message';
import { ChartModule } from 'primeng/chart';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';

export interface MapPosition {
  latitude: number;
  longitude: number;
}

export interface MapConfig {
  initialCenter?: [number, number];
  initialZoom?: number;
  accessToken: string;
}

interface WeatherData {
  time: string[];
  temp: number[];
  humidity: number[];
  wind: number[];
  precipitation: number[];
  shortwave_radiation: number[];
}

interface EventThresholds {
  frio: { temp: number; prob: number };
  calor: { temp: number; prob: number };
  viento: { speed: number; prob: number };
  humedo: { humidity: number; prob: number };
  lluvia: { precip: number; prob: number };
}

interface ProbabilityResult {
  label: string;
  percentage: number;
  color: string;
}

@Component({
  selector: 'app-map-info',
  standalone: true,
  imports: [
    CommonModule, NgIf, CardModule, TagModule, ButtonModule,
    InputGroupModule,
    InputGroupAddonModule, ProgressBarModule, TableModule,
    MessageModule, ChartModule, FormsModule
  ],
  templateUrl: './map-info.component.html',
  styleUrls: ['./map-info.component.scss']
})
export class MapInfoComponent implements OnInit, OnDestroy {
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef;

  @Input() config: MapConfig = {
    initialCenter: [-98.54818, 40.00811],
    initialZoom: 3.2,
    accessToken: environment.mapboxToken
  };

  @Input() showControls: boolean = true;
  @Input() showPositionInfo: boolean = true;
  @Input() showEventConfig: boolean = true;
  @Input() showWeatherResults: boolean = true;
  @Input() showTitle: boolean = true;
  @Input() title: string = 'Weather Conditions Forecast for Events';
  @Input() mapHeight: string = 'h-120';

  @Output() positionSelected = new EventEmitter<MapPosition>();
  @Output() mapMoved = new EventEmitter<{ center: [number, number]; zoom: number }>();
  @Output() weatherDataChanged = new EventEmitter<WeatherData | null>();

  private map: any;
  private marker: any;
  private platformId = inject(PLATFORM_ID);

  // Signals para el estado del mapa
  center = signal<[number, number]>(this.config.initialCenter || [-98.54818, 40.00811]);
  zoom = signal<number>(this.config.initialZoom || 3.2);
  selectedPosition = signal<[number, number] | null>(null);

  // Signals para el clima
  weatherData = signal<WeatherData | null>(null);
  probabilities = signal<ProbabilityResult[]>([]);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  // Charts data
  chartData: any;
  chartOptions: any;
  temperatureChartData: any;
  temperatureChartOptions: any;

  constructor(private cd: ChangeDetectorRef) {}

  // Formulario
  eventTypes = [
    { label: 'Caminata / Senderismo', value: 'caminata' },
    { label: 'Picnic / Almuerzo al aire libre', value: 'picnic' },
    { label: 'Deportes al aire libre', value: 'deporte' },
    { label: 'Día de playa', value: 'playa' },
    { label: 'Campamento', value: 'campamento' }
  ];

  selectedEventType = 'caminata';
  date: Date | undefined;
  minDate: Date | undefined;
  maxDate: Date | undefined;
  startTime = '10:00';
  endTime = '14:00';

  // Umbrales de incomodidad por tipo de evento
  private thresholds: Record<string, EventThresholds> = {
    caminata: {
      frio: { temp: 10, prob: 0.8 },
      calor: { temp: 28, prob: 0.8 },
      viento: { speed: 20, prob: 0.7 },
      humedo: { humidity: 80, prob: 0.6 },
      lluvia: { precip: 1, prob: 0.9 }
    },
    picnic: {
      frio: { temp: 15, prob: 0.7 },
      calor: { temp: 30, prob: 0.9 },
      viento: { speed: 15, prob: 0.8 },
      humedo: { humidity: 75, prob: 0.5 },
      lluvia: { precip: 0.5, prob: 1 }
    },
    deporte: {
      frio: { temp: 12, prob: 0.7 },
      calor: { temp: 25, prob: 0.9 },
      viento: { speed: 25, prob: 0.8 },
      humedo: { humidity: 85, prob: 0.6 },
      lluvia: { precip: 2, prob: 0.9 }
    },
    playa: {
      frio: { temp: 20, prob: 0.9 },
      calor: { temp: 35, prob: 0.8 },
      viento: { speed: 30, prob: 0.7 },
      humedo: { humidity: 90, prob: 0.5 },
      lluvia: { precip: 0.2, prob: 1 }
    },
    campamento: {
      frio: { temp: 5, prob: 1 },
      calor: { temp: 32, prob: 0.8 },
      viento: { speed: 25, prob: 0.9 },
      humedo: { humidity: 90, prob: 0.7 },
      lluvia: { precip: 1.5, prob: 1 }
    }
  };

  async ngOnInit() {
    // Configurar fechas mínima y máxima
    this.initializeDateLimits();
    this.initCharts();

    if (isPlatformBrowser(this.platformId)) {
      await this.initializeMap();
    }
  }

  // Inicializar límites de fecha
  private initializeDateLimits() {
    const today = new Date();

    // Fecha mínima: hoy
    this.minDate = new Date(today);

    // Fecha máxima: 15 días después de hoy
    this.maxDate = new Date(today);
    this.maxDate.setDate(today.getDate() + 15);
  }

  // Inicializar configuración de charts
  private initCharts() {
    if (isPlatformBrowser(this.platformId)) {
      const documentStyle = getComputedStyle(document.documentElement);
      const textColor = documentStyle.getPropertyValue('--p-text-color') || '#6b7280';
      const textColorSecondary = documentStyle.getPropertyValue('--p-text-muted-color') || '#9ca3af';
      const surfaceBorder = documentStyle.getPropertyValue('--p-content-border-color') || '#e5e7eb';

      // Configuración para el chart multi-axis (Temperatura y Humedad)
      this.temperatureChartOptions = {
        stacked: false,
        maintainAspectRatio: false,
        aspectRatio: 0.6,
        plugins: {
          legend: {
            labels: {
              color: textColor
            }
          }
        },
        scales: {
          x: {
            ticks: {
              color: textColorSecondary
            },
            grid: {
              color: surfaceBorder
            }
          },
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            ticks: {
              color: textColorSecondary
            },
            grid: {
              color: surfaceBorder
            },
            title: {
              display: true,
              text: 'Temperatura (°C)',
              color: textColor
            }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            ticks: {
              color: textColorSecondary
            },
            grid: {
              drawOnChartArea: false,
              color: surfaceBorder
            },
            title: {
              display: true,
              text: 'Humedad (%)',
              color: textColor
            }
          }
        }
      };

      // Configuración para el chart de líneas (Viento y Precipitación)
      this.chartOptions = {
        maintainAspectRatio: false,
        aspectRatio: 0.6,
        plugins: {
          legend: {
            labels: {
              color: textColor
            }
          }
        },
        scales: {
          x: {
            ticks: {
              color: textColorSecondary
            },
            grid: {
              color: surfaceBorder
            }
          },
          y: {
            ticks: {
              color: textColorSecondary
            },
            grid: {
              color: surfaceBorder
            },
            title: {
              display: true,
              text: 'Viento (km/h) / Precipitación (mm)',
              color: textColor
            }
          }
        }
      };

      this.cd.markForCheck();
    }
  }

  // Crear charts con datos del clima
  private createCharts(data: WeatherData) {
    if (isPlatformBrowser(this.platformId)) {
      const documentStyle = getComputedStyle(document.documentElement);

      // Formatear etiquetas de tiempo
      const timeLabels = data.time.map(time =>
        new Date(time).toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit'
        })
      );

      // Chart 1: Temperatura y Humedad (Multi-axis)
      this.temperatureChartData = {
        labels: timeLabels,
        datasets: [
          {
            label: 'Temperatura (°C)',
            fill: false,
            borderColor: documentStyle.getPropertyValue('--p-red-500') || '#ef4444',
            backgroundColor: documentStyle.getPropertyValue('--p-red-500') || '#ef4444',
            yAxisID: 'y',
            tension: 0.4,
            data: data.temp
          },
          {
            label: 'Humedad (%)',
            fill: false,
            borderColor: documentStyle.getPropertyValue('--p-blue-500') || '#3b82f6',
            backgroundColor: documentStyle.getPropertyValue('--p-blue-500') || '#3b82f6',
            yAxisID: 'y1',
            tension: 0.4,
            data: data.humidity
          }
        ]
      };

      // Chart 2: Viento y Precipitación
      this.chartData = {
        labels: timeLabels,
        datasets: [
          {
            label: 'Viento (km/h)',
            fill: false,
            borderColor: documentStyle.getPropertyValue('--p-green-500') || '#22c55e',
            backgroundColor: documentStyle.getPropertyValue('--p-green-500') || '#22c55e',
            tension: 0.4,
            data: data.wind
          },
          {
            label: 'Precipitación (mm)',
            fill: true,
            backgroundColor: documentStyle.getPropertyValue('--p-cyan-200') || '#a5f3fc',
            borderColor: documentStyle.getPropertyValue('--p-cyan-500') || '#06b6d4',
            tension: 0.4,
            data: data.precipitation
          }
        ]
      };

      this.cd.markForCheck();
    }
  }

  // Get weather forecast
  async getWeatherForecast() {
    const position = this.selectedPosition();
    if (!position) {
      this.errorMessage.set('Por favor selecciona una ubicación en el mapa');
      return;
    }

    if (!this.date) {
      this.errorMessage.set('Por favor selecciona una fecha para el evento');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.weatherData.set(null);
    this.probabilities.set([]);

    try {
      const [lng, lat] = position;
      const eventDate = this.date; // Usar la fecha única directamente
      const dateStr = this.formatDate(eventDate);

      // Validar fecha
      const today = new Date();
      const maxDate = new Date();
      maxDate.setDate(maxDate.getDate() + 15);

      if (eventDate < today || eventDate > maxDate) {
        throw new Error('La fecha debe estar entre hoy y los próximos 15 días');
      }

      const apiURL = `${environment.openMeteoUrl}?latitude=${lat}&longitude=${lng}&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation,shortwave_radiation&forecast_days=16&timezone=auto`;

      const response = await fetch(apiURL);
      const data = await response.json();

      const eventDateTimeStart = new Date(`${dateStr}T${this.startTime}:00`);
      const eventDateTimeEnd = new Date(`${dateStr}T${this.endTime}:00`);

      const startIndex = data.hourly.time.findIndex((t: string) => {
        const time = new Date(t);
        return time.getTime() === eventDateTimeStart.getTime();
      });

      const endIndex = data.hourly.time.findIndex((t: string) => {
        const time = new Date(t);
        return time.getTime() === eventDateTimeEnd.getTime();
      });

      if (startIndex === -1 || endIndex === -1 || startIndex > endIndex) {
        throw new Error('No forecast found for the selected time range');
      }

      const weatherData: WeatherData = {
        time: data.hourly.time.slice(startIndex, endIndex + 1),
        temp: data.hourly.temperature_2m.slice(startIndex, endIndex + 1),
        humidity: data.hourly.relative_humidity_2m.slice(startIndex, endIndex + 1),
        wind: data.hourly.wind_speed_10m.slice(startIndex, endIndex + 1),
        precipitation: data.hourly.precipitation.slice(startIndex, endIndex + 1),
        shortwave_radiation: data.hourly.shortwave_radiation.slice(startIndex, endIndex + 1)
      };

      this.weatherData.set(weatherData);
      this.calculateProbabilities(weatherData);
      this.createCharts(weatherData);
      this.weatherDataChanged.emit(weatherData);

    } catch (error) {
      console.error('Error fetching weather data:', error);
      this.errorMessage.set(error instanceof Error ? error.message : 'Error getting forecast');
    } finally {
      this.isLoading.set(false);
    }
  }

  // Calcular probabilidades de incomodidad
  private calculateProbabilities(data: WeatherData) {
    const eventThresholds = this.thresholds[this.selectedEventType];
    const totalHours = data.time.length;

    let counts = {
      muy_frio: 0,
      muy_caluroso: 0,
      muy_ventoso: 0,
      muy_humedo: 0,
      lluvia: 0,
      muy_incomodo: 0
    };

    let totalIncomfortableHours = 0;

    data.time.forEach((_, index) => {
      const temp = data.temp[index];
      const wind = data.wind[index];
      const humidity = data.humidity[index];
      const precip = data.precipitation[index];

      let isIncomfortable = false;

      if (temp < eventThresholds.frio.temp) { counts.muy_frio++; isIncomfortable = true; }
      if (temp > eventThresholds.calor.temp) { counts.muy_caluroso++; isIncomfortable = true; }
      if (wind > eventThresholds.viento.speed) { counts.muy_ventoso++; isIncomfortable = true; }
      if (humidity > eventThresholds.humedo.humidity) { counts.muy_humedo++; isIncomfortable = true; }
      if (precip > eventThresholds.lluvia.precip) { counts.lluvia++; isIncomfortable = true; }

      if (isIncomfortable) totalIncomfortableHours++;
    });

    counts.muy_incomodo = totalIncomfortableHours;

    const results: ProbabilityResult[] = [
      { label: 'Muy Frío', percentage: (counts.muy_frio / totalHours) * 100, color: this.getProgressBarColor((counts.muy_frio / totalHours) * 100) },
      { label: 'Muy Caluroso', percentage: (counts.muy_caluroso / totalHours) * 100, color: this.getProgressBarColor((counts.muy_caluroso / totalHours) * 100) },
      { label: 'Muy Ventoso', percentage: (counts.muy_ventoso / totalHours) * 100, color: this.getProgressBarColor((counts.muy_ventoso / totalHours) * 100) },
      { label: 'Muy Húmedo', percentage: (counts.muy_humedo / totalHours) * 100, color: this.getProgressBarColor((counts.muy_humedo / totalHours) * 100) },
      { label: 'Lluvia', percentage: (counts.lluvia / totalHours) * 100, color: this.getProgressBarColor((counts.lluvia / totalHours) * 100) },
      { label: 'Generalmente Incómodo', percentage: (counts.muy_incomodo / totalHours) * 100, color: this.getProgressBarColor((counts.muy_incomodo / totalHours) * 100) }
    ];

    this.probabilities.set(results);
  }

  // Obtener color de la barra de progreso
  private getProgressBarColor(percentage: number): string {
    if (percentage < 30) return '#4ade80'; // Verde
    if (percentage < 70) return '#fbbf24'; // Amarillo
    return '#ef4444'; // Rojo
  }

  // Formatear fecha para API
  private formatDate(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  // Formatear hora para mostrar
  formatTime(timeStr: string): string {
    return new Date(timeStr).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private async initializeMap() {
    try {
      const mapboxgl = (await import('mapbox-gl')).default;

      this.map = new mapboxgl.Map({
        accessToken: this.config.accessToken,
        container: this.mapContainer.nativeElement,
        center: this.center(),
        zoom: this.zoom(),
        pitch: 0,
        bearing: 0
      });

      // Map events
      this.map.on('move', () => {
        const newCenter = this.map.getCenter();
        const newZoom = this.map.getZoom();

        this.center.set([newCenter.lng, newCenter.lat]);
        this.zoom.set(newZoom);

        this.mapMoved.emit({
          center: [newCenter.lng, newCenter.lat],
          zoom: newZoom
        });
      });

      this.map.on('click', (e: any) => {
        const coordinates: [number, number] = [e.lngLat.lng, e.lngLat.lat];
        console.log('Click coordinates:', coordinates);
        this.selectedPosition.set(coordinates);
        this.addMarker(coordinates);

        // Emitir evento
        this.positionSelected.emit({
          latitude: coordinates[1],
          longitude: coordinates[0]
        });
      });

      this.map.on('style.load', () => {
        this.map.resize();
      });

      this.map.on('load', () => {
        console.log('Mapa cargado correctamente');
        this.map.resize();
      });

      this.map.on('moveend', () => {
        if (this.marker) {
          this.marker._update();
        }
      });

    } catch (error) {
      console.error('Error al inicializar el mapa:', error);
    }
  }

  // Métodos del mapa
  resetView() {
    if (this.map) {
      const initialCenter = this.config.initialCenter || [-98.54818, 40.00811];
      const initialZoom = this.config.initialZoom || 3.2;

      this.map.flyTo({
        center: initialCenter,
        zoom: initialZoom,
        duration: 1000
      });
    }
  }

  clearSelection() {
    this.selectedPosition.set(null);
    this.weatherData.set(null);
    this.probabilities.set([]);
    this.errorMessage.set(null);
    this.removeMarker();

    // Emitir evento de limpieza
    this.positionSelected.emit({
      latitude: 0,
      longitude: 0
    });
  }

  centerOnPosition() {
    const position = this.selectedPosition();
    if (position && this.map) {
      this.map.flyTo({
        center: position,
        zoom: 13,
        duration: 3000
      });
    }
  }

  addMarker(coordinates: [number, number]) {
    // Eliminar todos los marcadores existentes
    this.removeMarker();

    if (isPlatformBrowser(this.platformId)) {
      import('mapbox-gl').then((mapboxgl) => {
        console.log('Adding marker at:', coordinates);

        const el = document.createElement('div');
        el.style.width = '30px';
        el.style.height = '30px';
        el.style.backgroundImage = 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'%23ef4444\'%3E%3Cpath d=\'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z\'/%3E%3C/svg%3E")';
        el.style.backgroundSize = 'contain';
        el.style.backgroundRepeat = 'no-repeat';
        el.style.backgroundPosition = 'center';
        el.style.cursor = 'grab';
        el.style.filter = 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))';

        this.marker = new mapboxgl.default.Marker({
          element: el,
          draggable: true
        })
          .setLngLat(coordinates)
          .addTo(this.map);

        console.log('Marker added:', this.marker);
        console.log('Total markers after adding:', document.querySelectorAll('.mapboxgl-marker').length);

        this.marker.on('dragend', () => {
          const lngLat = this.marker.getLngLat();
          const newCoordinates: [number, number] = [lngLat.lng, lngLat.lat];
          this.selectedPosition.set(newCoordinates);
        });
      });
    }
  }

  removeMarker() {
    if (this.marker) {
      this.marker.remove();
      this.marker = null;
    }
    // Asegurar que se eliminen todos los marcadores del mapa
    const markers = document.querySelectorAll('.mapboxgl-marker');
    markers.forEach(marker => marker.remove());
  }

  // Método para obtener la posición actual
  getCurrentPosition(): MapPosition | null {
    const pos = this.selectedPosition();
    if (pos) {
      return {
        latitude: pos[1],
        longitude: pos[0]
      };
    }
    return null;
  }

  // Método para establecer una posición programáticamente
  setPosition(position: MapPosition) {
    const coordinates: [number, number] = [position.longitude, position.latitude];
    this.selectedPosition.set(coordinates);
  }

  ngOnDestroy(): void {
    if (this.marker) {
      this.marker.remove();
    }
    if (this.map) {
      this.map.remove();
    }
  }
}

