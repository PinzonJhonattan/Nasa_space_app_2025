import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { activitiesData } from '../data/activities-data';
import { Activity } from '../models/activity.model';

export interface ActivityConfig extends Activity {
  chatbotContext: string;
}

@Injectable({
  providedIn: 'root'
})
export class ActivityConfigService {
  private customActivities: Activity[] = [];
  private customActivityConfigs: Record<string, ActivityConfig> = {};

  // Observable para notificar cambios en las actividades
  private activitiesUpdated$ = new BehaviorSubject<Activity[]>([]);
  public activitiesUpdated = this.activitiesUpdated$.asObservable();

  constructor() {
    this.loadCustomActivities();
    this.notifyActivitiesUpdated();
  }

  // Función para normalizar títulos de actividades (quitar tildes y caracteres especiales)
  private normalizeActivityTitle(title: string): string {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Quita las tildes
      .replace(/[^a-z0-9]/g, '') // Quita caracteres especiales excepto letras y números
      .trim();
  }

  private activityConfigs: Record<string, ActivityConfig> = {
    'hiking': {
      ...activitiesData.find(a => this.normalizeActivityTitle(a.title) === 'hiking')!,
      chatbotContext: 'outdoor hiking adventure'
    },
    'fishing': {
      ...activitiesData.find(a => this.normalizeActivityTitle(a.title) === 'fishing')!,
      chatbotContext: 'sport fishing trip'
    },
    'openwaterswimming': {
      ...activitiesData.find(a => this.normalizeActivityTitle(a.title) === 'openwaterswimming')!,
      chatbotContext: 'open water swimming session'
    },
    'irrigation': {
      ...activitiesData.find(a => this.normalizeActivityTitle(a.title) === 'irrigation')!,
      chatbotContext: 'crop irrigation planning'
    },
    'harvesting': {
      ...activitiesData.find(a => this.normalizeActivityTitle(a.title) === 'harvesting')!,
      chatbotContext: 'agricultural harvesting schedule'
    },
    'livestockcare': {
      ...activitiesData.find(a => this.normalizeActivityTitle(a.title) === 'livestockcare')!,
      chatbotContext: 'livestock care and shelter management'
    },
    'flightplanning': {
      ...activitiesData.find(a => this.normalizeActivityTitle(a.title) === 'flightplanning')!,
      chatbotContext: 'commercial or private flight planning'
    },
    'roadtrips': {
      ...activitiesData.find(a => this.normalizeActivityTitle(a.title) === 'roadtrips')!,
      chatbotContext: 'long-distance road trip'
    },
    'sailing': {
      ...activitiesData.find(a => this.normalizeActivityTitle(a.title) === 'sailing')!,
      chatbotContext: 'coastal sailing excursion'
    },
    'outdoorevents': {
      ...activitiesData.find(a => this.normalizeActivityTitle(a.title) === 'outdoorevents')!,
      chatbotContext: 'outdoor public event'
    },
    'camping': {
      ...activitiesData.find(a => this.normalizeActivityTitle(a.title) === 'camping')!,
      chatbotContext: 'camping and outdoor overnight stay'
    },
    'beachday': {
      ...activitiesData.find(a => this.normalizeActivityTitle(a.title) === 'beachday')!,
      chatbotContext: 'beach leisure day'
    }
  };

  getAllActivities(): Activity[] {
    return [...activitiesData, ...this.customActivities];
  }

  // Método público para normalizar títulos (necesario para el sidebar)
  public normalizeActivityId(title: string): string {
    return this.normalizeActivityTitle(title);
  }

  getActivityConfig(activityId: string): ActivityConfig | null {
    const normalizedId = this.normalizeActivityTitle(activityId);

    // Buscar primero en actividades predefinidas
    let config = this.activityConfigs[normalizedId];

    // Si no se encuentra, buscar en actividades personalizadas
    if (!config) {
      config = this.customActivityConfigs[normalizedId];
    }

    return config || null;
  }

  getActivityChatbotContext(activityId: string): string {
    const config = this.getActivityConfig(activityId);
    return config?.chatbotContext || 'general activity';
  }

  getActivityByTitle(title: string): Activity | null {
    return activitiesData.find(activity =>
      this.normalizeActivityTitle(activity.title) === this.normalizeActivityTitle(title)
    ) || null;
  }

  getActivityById(id: number): Activity | null {
    return activitiesData.find(activity => activity.id === id) || null;
  }

  getSupportedActivityIds(): string[] {
    return [...Object.keys(this.activityConfigs), ...Object.keys(this.customActivityConfigs)];
  }

  // Métodos para actividades personalizadas
  addCustomActivity(activity: Activity, chatbotContext: string): void {
    // Verificar que no exista una actividad con el mismo título normalizado
    const normalizedId = this.normalizeActivityTitle(activity.title);

    if (this.activityConfigs[normalizedId] || this.customActivityConfigs[normalizedId]) {
      throw new Error('An activity with that name already exists');
    }

    // Agregar la actividad personalizada
    this.customActivities.push(activity);

    // Crear la configuración para la actividad personalizada
    const config: ActivityConfig = {
      ...activity,
      chatbotContext
    };

    this.customActivityConfigs[normalizedId] = config;

    // Guardar en localStorage
    this.saveCustomActivities();

    // Notificar cambios
    this.notifyActivitiesUpdated();
  }

  getCustomActivities(): Activity[] {
    return [...this.customActivities];
  }

  removeCustomActivity(activityTitle: string): boolean {
    const normalizedId = this.normalizeActivityTitle(activityTitle);

    // Buscar y eliminar de la lista de actividades
    const activityIndex = this.customActivities.findIndex(
      activity => this.normalizeActivityTitle(activity.title) === normalizedId
    );

    if (activityIndex !== -1) {
      this.customActivities.splice(activityIndex, 1);
      delete this.customActivityConfigs[normalizedId];
      this.saveCustomActivities();
      this.notifyActivitiesUpdated();
      return true;
    }

    return false;
  }

  private loadCustomActivities(): void {
    try {
      const savedActivities = localStorage.getItem('customActivities');
      const savedConfigs = localStorage.getItem('customActivityConfigs');

      if (savedActivities) {
        this.customActivities = JSON.parse(savedActivities);
      }

      if (savedConfigs) {
        this.customActivityConfigs = JSON.parse(savedConfigs);
      }
    } catch (error) {
      console.error('Error loading custom activities:', error);
      this.customActivities = [];
      this.customActivityConfigs = {};
    }
  }

  private saveCustomActivities(): void {
    try {
      localStorage.setItem('customActivities', JSON.stringify(this.customActivities));
      localStorage.setItem('customActivityConfigs', JSON.stringify(this.customActivityConfigs));
    } catch (error) {
      console.error('Error saving custom activities:', error);
    }
  }

  isCustomActivity(activityTitle: string): boolean {
    const normalizedId = this.normalizeActivityTitle(activityTitle);
    return !!this.customActivityConfigs[normalizedId];
  }

  isCustomActivityByTitle(activityTitle: string): boolean {
    return this.customActivities.some(activity => activity.title === activityTitle);
  }

  getActivityChatbotContextByTitle(activityTitle: string): string | null {
    const activity = this.customActivities.find(activity => activity.title === activityTitle);
    if (!activity) return null;

    const normalizedId = this.normalizeActivityTitle(activity.title);
    const config = this.customActivityConfigs[normalizedId];
    return config?.chatbotContext || null;
  }

  getActivityByExactTitle(title: string): Activity | null {
    // Buscar primero en actividades personalizadas
    const customActivity = this.customActivities.find(activity => activity.title === title);
    if (customActivity) return customActivity;

    // Buscar en actividades predefinidas
    return activitiesData.find(activity => activity.title === title) || null;
  }

  private notifyActivitiesUpdated(): void {
    const allActivities = this.getAllActivities();
    this.activitiesUpdated$.next(allActivities);
  }
}
