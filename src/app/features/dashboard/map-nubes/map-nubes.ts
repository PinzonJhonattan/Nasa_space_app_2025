import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { SliderModule } from 'primeng/slider';
import { CommonModule, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Importaciones de MapTiler
import { Map, MapStyle, config } from '@maptiler/sdk';
import '@maptiler/sdk/dist/maptiler-sdk.css';
import { RadarLayer } from '@maptiler/weather'; //@maptiler/weather/dist/maptiler-weather.css
import { environment } from '../../../../environments/environment';

@Component({
    selector: 'app-map-nubes',
    templateUrl: './map-nubes.html',
    styleUrls: ['./map-nubes.scss'],
    imports: [CardModule, ButtonModule, DialogModule, SliderModule, CommonModule, NgIf, FormsModule],
    standalone: true
})
export class MapNubes implements OnInit, OnDestroy, AfterViewInit {
    @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef;

    private map!: Map;
    private weatherLayer!: RadarLayer;
    private isPlaying = false;

    // Propiedades para el template
    currentTime = '';
    sliderValue = 0;
    sliderMin = 0;
    sliderMax = 11;
    playButtonText = 'Play 3600x';
    pointerData = '';
    variableName = 'Cloud Coverage';
    visible = false;

    private pointerLngLat: { lng: number, lat: number } | null = null;

    constructor() {
        // Configura tu API key de MapTiler aquí
        config.apiKey = environment.mapTilerApiKey;
    }

    openMoreInfoClouds(): void {
        window.open('https://earthobservatory.nasa.gov/global-maps/MODAL2_M_CLD_FR');
      }

    ngOnInit(): void {
        // Inicialización del componente
    }

    showDialog(): void {
        this.visible = true;
    }

    ngAfterViewInit(): void {
        this.initializeMap();
    }

    ngOnDestroy(): void {
        if (this.map) {
            this.map.remove();
        }
    }

    private initializeMap(): void {
        this.map = new Map({
            container: this.mapContainer.nativeElement,
            style: MapStyle.BACKDROP,
            projectionControl: true,
            projection: 'globe',
            zoom: 2,
            center: [0, 40]
        });

        this.weatherLayer = new RadarLayer({
            opacity: 0.8,
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

        // Para radar, mostramos el valor de reflectividad (valor genérico)
        this.pointerData = `${value.value.toFixed(1)}`;
    }
}
