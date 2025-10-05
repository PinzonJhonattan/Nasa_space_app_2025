import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { SliderModule } from 'primeng/slider';
import { CommonModule, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Dialog } from 'primeng/dialog';

// Servicio optimizado de MapTiler
import { MapTilerService } from '../../../share/services/maptiler.service';
import { Map } from '@maptiler/sdk';

@Component({
    selector: 'app-map-precipitacion',
    templateUrl: './map-precipitacion.html',
    styleUrls: ['./map-precipitacion.scss'],
    imports: [CardModule, ButtonModule, SliderModule, CommonModule, NgIf, FormsModule, Dialog],
    standalone: true
})
export class MapPrecipitacion implements OnInit, OnDestroy, AfterViewInit {
    @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef;

    private map!: Map;
    private weatherLayer!: any;
    private isPlaying = false;

    // Propiedades para el template
    currentTime = '';
    sliderValue = 0;
    sliderMin = 0;
    sliderMax = 11;
    playButtonText = 'Play 3600x';
    pointerData = '';
    variableName = 'Precipitation';
    visible = false;
    private pointerLngLat: { lng: number, lat: number } | null = null;

    constructor(private mapTilerService: MapTilerService) {
        // La configuración se maneja automáticamente en el servicio
        // Los estilos CSS se cargan globalmente en vendor-maptiler.css
    }

    openMoreInfoPrecipitation(): void {
        window.open('https://gpm.nasa.gov/');
      }

    ngOnInit(): void {
        // Inicialización del componente
    }

    ngAfterViewInit(): void {
        this.initializeMap();
    }

    ngOnDestroy(): void {
        if (this.map) {
            this.map.remove();
        }
    }

    showDialog(): void {
        this.visible = true;
    }

    private initializeMap(): void {
        this.map = this.mapTilerService.createMap(this.mapContainer.nativeElement, {
            style: 'backdrop',
            projectionControl: true,
            projection: 'globe',
            zoom: 2,
            center: [0, 40]
        });

        this.weatherLayer = this.mapTilerService.createWeatherLayer('precipitation', {
            opacity: 0.8
        });

        this.map.on('load', () => {
            this.map.setPaintProperty("Water", 'fill-color', "rgba(0, 0, 0, 0.4)");
            this.map.addLayer(this.weatherLayer, 'Water');
        });

        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        // Inicializar valores del slider después de que el mapa esté listo
        setTimeout(() => {
            try {
                const startDate = this.weatherLayer.getAnimationStartDate();
                const endDate = this.weatherLayer.getAnimationEndDate();
                const currentDate = this.weatherLayer.getAnimationTimeDate();

                this.sliderMin = +startDate;
                this.sliderMax = +endDate;
                this.sliderValue = +currentDate;
                this.refreshTime();
            } catch (error) {
                console.warn('No se pudieron obtener las fechas de animación:', error);
            }
        }, 1000);

        // Mouse events
        this.map.on('mouseout', (evt: any) => {
            if (!evt.originalEvent.relatedTarget) {
                this.pointerData = "";
                this.pointerLngLat = null;
            }
        });

        this.map.on('mousemove', (e: any) => {
            this.updatePointerValue(e.lngLat);
        });
    }

    // Método para manejar cambios en el slider
    onSliderChange(): void {
        this.weatherLayer.setAnimationTime(parseInt((this.sliderValue / 1000).toString()));
        this.refreshTime();
    }

    // Método para play/pause
    togglePlayPause(): void {
        if (this.isPlaying) {
            this.weatherLayer.animateByFactor(0);
            this.playButtonText = "Play 3600x";
        } else {
            this.weatherLayer.animateByFactor(3600);
            this.playButtonText = "Pause";
            this.startTimeUpdate();
        }
        this.isPlaying = !this.isPlaying;
    }

    private startTimeUpdate(): void {
        const updateInterval = setInterval(() => {
            if (this.isPlaying) {
                this.refreshTime();
                this.updatePointerValue(this.pointerLngLat);
            } else {
                clearInterval(updateInterval);
            }
        }, 100);
    }

    // Actualizar la visualización del tiempo
    private refreshTime(): void {
        const d = this.weatherLayer.getAnimationTimeDate();
        this.currentTime = d.toString();
        this.sliderValue = +d;
    }

    // Actualizar valores del puntero
    private updatePointerValue(lngLat: { lng: number, lat: number } | null): void {
        if (!lngLat) return;

        this.pointerLngLat = lngLat;
        const value = this.weatherLayer.pickAt(lngLat.lng, lngLat.lat);

        if (!value) {
            this.pointerData = "";
            return;
        }

        // Para precipitación, mostramos en mm
        this.pointerData = `${value.value.toFixed(1)} mm`;
    }
}
