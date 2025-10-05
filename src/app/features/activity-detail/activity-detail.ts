import { MapInfoComponent, MapConfig, MapPosition } from '../../share/components/map-info/map-info.component';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild, inject, signal, ChangeDetectorRef } from '@angular/core';
import { isPlatformBrowser, CommonModule, NgIf } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { DatePicker } from 'primeng/datepicker';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { ProgressBarModule } from 'primeng/progressbar';
import { TableModule } from 'primeng/table';
import { MessageModule } from 'primeng/message';
import { ChartModule } from 'primeng/chart';
import { KnobModule } from 'primeng/knob';
import { FormsModule } from '@angular/forms';
import { SelectButton } from 'primeng/selectbutton';
import { ChatbotComponent } from '../../share/components/chatbot/chatbot.component';
import { ActivityConfigService } from '../../share/services/activity-config.service';
import { Activity } from '../../share/models/activity.model';
import { PdfGeneratorService } from '../../share/services/pdf-generator.service';
import { WeatherData } from '../../share/models/weather-data.model';
import { Subject, takeUntil } from 'rxjs';

interface ProbabilityResult {
  label: string;
  percentage: number;
  color: string;
}

@Component({
  selector: 'app-activity-detail',
  standalone: true,
  imports: [MapInfoComponent, CommonModule, NgIf, CardModule, TagModule, ButtonModule,
    DatePicker, InputGroupModule,
    InputGroupAddonModule, ProgressBarModule, TableModule,
    MessageModule, ChartModule, KnobModule, FormsModule, SelectButton, ChatbotComponent],
  templateUrl: './activity-detail.html',
  styleUrls: ['./activity-detail.scss']
})
export class ActivityDetailComponent implements OnInit, OnDestroy {
  stateOptions: any[] = [{ label: 'Charts', value: 'charts' }, { label: 'Table', value: 'table' }];

  value: string = 'charts';

  private platformId = inject(PLATFORM_ID);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private activityConfigService = inject(ActivityConfigService);
  private pdfGeneratorService = inject(PdfGeneratorService);
  private destroy$ = new Subject<void>();

  // Signals para el clima
  weatherData = signal<WeatherData | null>(null);
  probabilities = signal<ProbabilityResult[]>([]);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  currentActivity = signal<Activity | null>(null);

  // Ubicación seleccionada para el chatbot
  chatbotPosition: MapPosition | null = null;

  // Charts data
  chartData: any;
  chartOptions: any;
  temperatureChartData: any;
  temperatureChartOptions: any;

  // New discomfort chart data
  discomfortChartData: any;
  discomfortChartOptions: any;

  // Comfort level data
  comfortLevel: number = 0;
  comfortColor: string = '#4ade80';

  selectedEventType = '';
  date: Date | undefined;
  minDate: Date | undefined;
  maxDate: Date | undefined;
  startTime = '10:00';
  endTime = '14:00';

  constructor(private cd: ChangeDetectorRef) {}

  async ngOnInit() {
    // Obtener parámetro de la actividad desde la ruta
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const activityId = params['activityId'];
        if (activityId) {
          this.loadActivity(activityId);
        } else {
          this.router.navigate(['/activities']);
        }
      });

    // Configurar fechas mínima y máxima
    this.initializeDateLimits();
    this.initCharts();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadActivity(activityId: string) {
    const activityConfig = this.activityConfigService.getActivityConfig(activityId);

    if (!activityConfig) {
      this.errorMessage.set(`Activity "${activityId}" was not found`);
      return;
    }

    this.currentActivity.set(activityConfig);
    this.selectedEventType = activityConfig.title;

    console.log('Activity loaded:', activityConfig);
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
      const textColor = documentStyle.getPropertyValue('#cdcfd4') || '#cdcfd4';
      const textColorSecondary = documentStyle.getPropertyValue('--p-text-muted-color') || '#ffffff';
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
              text: 'Temperature (°C)',
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
              text: 'Humidity (%)',
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
              text: 'Wind (km/h) / Precipitation (mm)',
              color: textColor
            }
          }
        }
      };

      // Configuración para el chart de barras (Factores de Incomodidad)
      this.discomfortChartOptions = {
        indexAxis: 'y',
        maintainAspectRatio: false,
        aspectRatio: 0.8,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            max: 100,
            ticks: {
              color: textColorSecondary,
              callback: function(value: any) {
                return value + '%';
              }
            },
            grid: {
              color: surfaceBorder
            },
            title: {
              display: true,
              text: 'Porcentaje de Incomodidad (%)',
              color: textColor
            }
          },
          y: {
            ticks: {
              color: textColorSecondary
            },
            grid: {
              color: surfaceBorder
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
        new Date(time).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        })
      );

      // Chart 1: Temperatura y Humedad (Multi-axis)
      this.temperatureChartData = {
        labels: timeLabels,
        datasets: [
          {
            label: 'Temperature (°C)',
            fill: false,
            borderColor: documentStyle.getPropertyValue('--p-red-500') || '#ef4444',
            backgroundColor: documentStyle.getPropertyValue('--p-red-500') || '#ef4444',
            yAxisID: 'y',
            tension: 0.4,
            data: data.temp
          },
          {
            label: 'Humidity (%)',
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
            label: 'Wind (km/h)',
            fill: false,
            borderColor: documentStyle.getPropertyValue('--p-green-500') || '#22c55e',
            backgroundColor: documentStyle.getPropertyValue('--p-green-500') || '#22c55e',
            tension: 0.4,
            data: data.wind
          },
          {
            label: 'Precipitation (mm)',
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
      this.errorMessage.set('Please select a location on the map');
      return;
    }

    if (!this.date) {
      this.errorMessage.set('Please select a date for the event');
      return;
    }

    if (!this.currentActivity()) {
      this.errorMessage.set('Activity configuration is not available');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.weatherData.set(null);
    this.probabilities.set([]);

    try {
      const [lng, lat] = position;
      const eventDate = this.date;
      const dateStr = this.formatDate(eventDate);

      // Validar fecha
      const today = new Date();
      const maxDate = new Date();
      maxDate.setDate(maxDate.getDate() + 15);

      if (eventDate < today || eventDate > maxDate) {
        throw new Error('The date must be between today and the next 15 days');
      }

      const apiURL = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation&forecast_days=16&timezone=auto`;

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
        throw new Error('No forecast was found for the selected time range');
      }

      const weatherData: WeatherData = {
        time: data.hourly.time.slice(startIndex, endIndex + 1),
        temp: data.hourly.temperature_2m.slice(startIndex, endIndex + 1),
        humidity: data.hourly.relative_humidity_2m.slice(startIndex, endIndex + 1),
        wind: data.hourly.wind_speed_10m.slice(startIndex, endIndex + 1),
        precipitation: data.hourly.precipitation.slice(startIndex, endIndex + 1)
      };

      this.weatherData.set(weatherData);
      this.calculateProbabilities(weatherData);
      this.createCharts(weatherData);

    } catch (error) {
      console.error('Error fetching weather data:', error);
      this.errorMessage.set(error instanceof Error ? error.message : 'Error fetching the forecast');
    } finally {
      this.isLoading.set(false);
    }
  }

  // Calcular probabilidades de incomodidad usando criterios específicos por actividad
  private calculateProbabilities(data: WeatherData) {
    const totalHours = data.time.length;
    const activity = this.currentActivity();

    if (!activity) {
      this.probabilities.set([]);
      return;
    }

    // Obtener umbrales específicos para la actividad actual
    const thresholds = this.getActivityThresholds(activity.title);

    let probabilityAccumulated = {
      muy_frio: 0,
      muy_caluroso: 0,
      muy_ventoso: 0,
      muy_humedo: 0,
      lluvia: 0
    };

    let totalComfortScore = 0;

    data.time.forEach((_, index) => {
      const temp = data.temp[index];
      const wind = data.wind[index];
      const humidity = data.humidity[index];
      const precip = data.precipitation[index];

      let hourComfortScore = 100; // Comienza en 100% de confort

      // Calcular probabilidades graduales basadas en umbrales específicos
      // Temperatura Fría
      if (temp <= thresholds.frio.temp) {
        const discomfortProb = this.calculateGradualDiscomfort(temp, thresholds.frio.temp, thresholds.frio.temp - 10, thresholds.frio.prob);
        probabilityAccumulated.muy_frio += discomfortProb;
        hourComfortScore -= discomfortProb * 100;
      }

      // Temperatura Calurosa
      if (temp >= thresholds.calor.temp) {
        const discomfortProb = this.calculateGradualDiscomfort(temp, thresholds.calor.temp, thresholds.calor.temp + 15, thresholds.calor.prob);
        probabilityAccumulated.muy_caluroso += discomfortProb;
        hourComfortScore -= discomfortProb * 100;
      }

      // Viento
      if (wind >= thresholds.viento.speed) {
        const discomfortProb = this.calculateGradualDiscomfort(wind, thresholds.viento.speed, thresholds.viento.speed + 20, thresholds.viento.prob);
        probabilityAccumulated.muy_ventoso += discomfortProb;
        hourComfortScore -= discomfortProb * 100;
      }

      // Humedad
      if (humidity >= thresholds.humedo.humidity) {
        const discomfortProb = this.calculateGradualDiscomfort(humidity, thresholds.humedo.humidity, 100, thresholds.humedo.prob);
        probabilityAccumulated.muy_humedo += discomfortProb;
        hourComfortScore -= discomfortProb * 100;
      }

      // Precipitación
      if (precip >= thresholds.lluvia.precip) {
        const discomfortProb = this.calculateGradualDiscomfort(precip, thresholds.lluvia.precip, thresholds.lluvia.precip + 10, thresholds.lluvia.prob);
        probabilityAccumulated.lluvia += discomfortProb;
        hourComfortScore -= discomfortProb * 100;
      }

      // Asegurar que el puntaje de confort no sea negativo
      totalComfortScore += Math.max(0, hourComfortScore);
    });

    // Calcular porcentajes promedio de incomodidad
    const results: ProbabilityResult[] = [
      {
        label: 'Cold Conditions',
        percentage: Math.round((probabilityAccumulated.muy_frio / totalHours) * 100),
        color: this.getProgressBarColor((probabilityAccumulated.muy_frio / totalHours) * 100)
      },
      {
        label: 'Hot Conditions',
        percentage: Math.round((probabilityAccumulated.muy_caluroso / totalHours) * 100),
        color: this.getProgressBarColor((probabilityAccumulated.muy_caluroso / totalHours) * 100)
      },
      {
        label: 'Windy Conditions',
        percentage: Math.round((probabilityAccumulated.muy_ventoso / totalHours) * 100),
        color: this.getProgressBarColor((probabilityAccumulated.muy_ventoso / totalHours) * 100)
      },
      {
        label: 'High Humidity',
        percentage: Math.round((probabilityAccumulated.muy_humedo / totalHours) * 100),
        color: this.getProgressBarColor((probabilityAccumulated.muy_humedo / totalHours) * 100)
      },
      {
        label: 'Precipitation',
        percentage: Math.round((probabilityAccumulated.lluvia / totalHours) * 100),
        color: this.getProgressBarColor((probabilityAccumulated.lluvia / totalHours) * 100)
      },
      {
        label: 'Overall Comfort Level',
        percentage: Math.round(totalComfortScore / (totalHours * 100) * 100),
        color: this.getComfortColor(totalComfortScore / (totalHours * 100) * 100)
      }
    ];

    this.probabilities.set(results);

    // Crear datos para la gráfica de barras
    this.createDiscomfortChart(results);

    // Actualizar nivel de confort
    const comfortPercentage = results.find(r => r.label === 'Overall Comfort Level')?.percentage || 0;
    this.comfortLevel = comfortPercentage;
    this.comfortColor = this.getComfortColor(comfortPercentage);
  }

  // Crear datos para la gráfica de barras de incomodidad
  private createDiscomfortChart(results: ProbabilityResult[]) {
    if (isPlatformBrowser(this.platformId)) {
      // Filtrar solo los factores de incomodidad (sin el nivel de confort general)
      const discomfortFactors = results.filter(r => r.label !== 'Overall Comfort Level');

      this.discomfortChartData = {
        labels: discomfortFactors.map(r => r.label),
        datasets: [
          {
            data: discomfortFactors.map(r => r.percentage),
            backgroundColor: discomfortFactors.map(r => r.color + '80'), // Con transparencia
            borderColor: discomfortFactors.map(r => r.color),
            borderWidth: 2,
            borderRadius: 4,
            borderSkipped: false,
          }
        ]
      };

      this.cd.markForCheck();
    }
  }

  // Calcular incomodidad gradual en lugar de binaria
  private calculateGradualDiscomfort(value: number, threshold: number, extremeThreshold: number, baseProbability: number): number {
    if (value < threshold && threshold > extremeThreshold) return 0; // Para temperatura fría
    if (value < threshold && threshold < extremeThreshold) return 0; // Para otros casos

    // Calcular la intensidad del factor (0 a 1)
    const intensity = Math.min(Math.abs(value - threshold) / Math.abs(extremeThreshold - threshold), 1);

    // Calcular probabilidad de incomodidad basada en la intensidad
    return baseProbability * (0.3 + 0.7 * intensity); // Mínimo 30% del impacto base, máximo 100%
  }

  // Obtener umbrales específicos por tipo de actividad
  private getActivityThresholds(activityTitle: string) {
    const normalizedTitle = activityTitle.toLowerCase().replace(/[áàâã]/g, 'a').replace(/[éèê]/g, 'e').replace(/[íìî]/g, 'i').replace(/[óòô]/g, 'o').replace(/[úùû]/g, 'u');

    const defaultThresholds = {
      frio: { temp: 10, prob: 0.8 },
      calor: { temp: 28, prob: 0.8 },
      viento: { speed: 20, prob: 0.7 },
      humedo: { humidity: 80, prob: 0.6 },
      lluvia: { precip: 1, prob: 0.9 }
    };

    const activityThresholds: Record<string, any> = {
      'caminata': {
        frio: { temp: 8, prob: 0.8 },
        calor: { temp: 28, prob: 0.8 },
        viento: { speed: 20, prob: 0.7 },
        humedo: { humidity: 80, prob: 0.6 },
        lluvia: { precip: 1, prob: 0.9 }
      },
      'pesca': {
        frio: { temp: 5, prob: 0.7 },
        calor: { temp: 32, prob: 0.6 },
        viento: { speed: 15, prob: 0.9 }, // Muy sensible al viento
        humedo: { humidity: 85, prob: 0.5 },
        lluvia: { precip: 2, prob: 0.8 }
      },
      'natacion': {
        frio: { temp: 18, prob: 0.9 }, // Requiere temperaturas más altas
        calor: { temp: 35, prob: 0.7 },
        viento: { speed: 25, prob: 0.8 },
        humedo: { humidity: 90, prob: 0.3 }, // Menos sensible a humedad
        lluvia: { precip: 0.5, prob: 0.9 }
      },
      'playa': {
        frio: { temp: 20, prob: 0.9 },
        calor: { temp: 35, prob: 0.8 },
        viento: { speed: 30, prob: 0.7 },
        humedo: { humidity: 90, prob: 0.5 },
        lluvia: { precip: 0.2, prob: 1 }
      },
      'camping': {
        frio: { temp: 5, prob: 1 },
        calor: { temp: 32, prob: 0.8 },
        viento: { speed: 25, prob: 0.9 },
        humedo: { humidity: 90, prob: 0.7 },
        lluvia: { precip: 1.5, prob: 1 }
      },
      'vuelos': {
        frio: { temp: -10, prob: 0.8 },
        calor: { temp: 40, prob: 0.8 },
        viento: { speed: 15, prob: 0.95 }, // Muy crítico para vuelos
        humedo: { humidity: 95, prob: 0.7 },
        lluvia: { precip: 0.1, prob: 0.9 }
      },
      'ganaderia': {
        frio: { temp: 0, prob: 0.9 },
        calor: { temp: 35, prob: 0.9 },
        viento: { speed: 30, prob: 0.6 },
        humedo: { humidity: 85, prob: 0.5 },
        lluvia: { precip: 5, prob: 0.7 }
      },
      'navegacion': {
        frio: { temp: 5, prob: 0.7 },
        calor: { temp: 35, prob: 0.6 },
        viento: { speed: 20, prob: 0.95 }, // Muy crítico para navegación
        humedo: { humidity: 90, prob: 0.4 },
        lluvia: { precip: 2, prob: 0.8 }
      },
      'eventos': {
        frio: { temp: 12, prob: 0.8 },
        calor: { temp: 30, prob: 0.9 },
        viento: { speed: 20, prob: 0.8 },
        humedo: { humidity: 80, prob: 0.6 },
        lluvia: { precip: 0.5, prob: 1 }
      },
      'riego': {
        frio: { temp: 0, prob: 0.5 },
        calor: { temp: 40, prob: 0.7 }, // El calor extremo causa evaporación rápida
        viento: { speed: 25, prob: 0.8 }, // Dispersa el agua
        humedo: { humidity: 95, prob: 0.3 },
        lluvia: { precip: 5, prob: 0.9 } // Evitar con lluvia fuerte
      },
      'cosecha': {
        frio: { temp: 5, prob: 0.6 },
        calor: { temp: 35, prob: 0.7 },
        viento: { speed: 30, prob: 0.6 },
        humedo: { humidity: 85, prob: 0.5 },
        lluvia: { precip: 2, prob: 0.95 } // Muy crítico para cosecha
      },
      'carretera': {
        frio: { temp: -5, prob: 0.8 },
        calor: { temp: 40, prob: 0.7 },
        viento: { speed: 30, prob: 0.8 }, // Vientos laterales peligrosos
        humedo: { humidity: 95, prob: 0.6 },
        lluvia: { precip: 1, prob: 0.9 }
      }
    };

    return activityThresholds[normalizedTitle] || defaultThresholds;
  }

  // Obtener color específico para el nivel de confort (invertido)
  private getComfortColor(percentage: number): string {
    if (percentage >= 70) return '#4ade80'; // Verde - Alta comodidad
    if (percentage >= 40) return '#fbbf24'; // Amarillo - Comodidad moderada
    return '#ef4444'; // Rojo - Baja comodidad
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
    return new Date(timeStr).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  mapConfig: MapConfig = {
    initialCenter: [-98.54818, 40.00811],
    initialZoom: 3.2,
    accessToken: 'pk.eyJ1Ijoib2xpdmVydmx6IiwiYSI6ImNtZW5rZng3djE2OTMyam9hMG80bXh6bHgifQ.SRpK6tafQerVOz0qd7PJXw'
  };
  mapPosition: MapPosition = {
    latitude: 0,
    longitude: 0
  };
  onPositionSelected(position: MapPosition) {
    this.mapPosition = position;
    this.chatbotPosition = position;
  }
  onMapMoved(event: { center: [number, number]; zoom: number }) {
    this.mapConfig.initialCenter = event.center;
    this.mapConfig.initialZoom = event.zoom;
  }

  // Get the selected position from the map
  selectedPosition(): [number, number] | null {
    if (this.mapPosition.latitude === 0 && this.mapPosition.longitude === 0) {
      return null;
    }
    return [this.mapPosition.longitude, this.mapPosition.latitude];
  }

  // Obtener icono para cada condición climática
  getConditionIcon(label: string): string {
    const iconMap: Record<string, string> = {
      'Cold Conditions': 'pi pi-snowflake',
      'Hot Conditions': 'pi pi-sun',
      'Windy Conditions': 'pi pi-flag-fill',
      'High Humidity': 'pi pi-cloud',
      'Precipitation': 'pi pi-bolt',
      'Very Cold': 'pi pi-snowflake',
      'Very Hot': 'pi pi-sun',
      'Very Windy': 'pi pi-flag-fill',
      'Very Humid': 'pi pi-cloud',
      'Rain': 'pi pi-bolt'
    };
    return iconMap[label] || 'pi pi-info-circle';
  }

  // Obtener descripción del nivel de confort
  getComfortDescription(percentage: number): string {
    if (percentage >= 80) return 'Excellent conditions for the activity';
    if (percentage >= 60) return 'Good conditions, slightly uncomfortable';
    if (percentage >= 40) return 'Moderate conditions, consider precautions';
    if (percentage >= 20) return 'Challenging conditions, caution recommended';
    return 'Very difficult conditions, consider postponing the activity';
  }

  // Generar y descargar PDF del reporte climático
  async downloadPdfReport(): Promise<void> {
    const weatherData = this.weatherData();
    const activity = this.currentActivity();
    const position = this.selectedPosition();

    if (!weatherData || !activity || !this.date || !position) {
      console.error('Not enough data to generate the PDF report');
      return;
    }

    try {
      await this.pdfGeneratorService.generateWeatherReport({
        activity: activity,
        weatherData: weatherData,
        probabilities: this.probabilities(),
        date: this.date,
        startTime: this.startTime,
        endTime: this.endTime,
        latitude: position[1], // latitude
        longitude: position[0], // longitude
        comfortLevel: this.comfortLevel
      });
    } catch (error) {
      console.error('Error generating the PDF:', error);
      // Aquí podrías mostrar un mensaje de error al usuario
    }
  }

  // Verificar si los datos están listos para generar PDF
  canGeneratePdf(): boolean {
    return !!(this.weatherData() && this.currentActivity() && this.date && this.selectedPosition());
  }
}

