import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { SliderModule } from 'primeng/slider';
import { CommonModule, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Dialog } from 'primeng/dialog';
import { environment } from '../../../../environments/environment';

// Importaciones de MapTiler
import { Map, MapStyle, config } from '@maptiler/sdk';
import '@maptiler/sdk/dist/maptiler-sdk.css';
import { PressureLayer } from '@maptiler/weather';

@Component({
    selector: 'app-map-presion',
    templateUrl: './map-presion.html',
    styleUrls: ['./map-presion.scss'],
    imports: [CardModule, ButtonModule, SliderModule, CommonModule, NgIf, FormsModule, Dialog],
    standalone: true
})
export class MapPresion implements OnInit, OnDestroy, AfterViewInit {
    @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef;

    private map!: Map;
    private weatherLayer!: PressureLayer;
    private isPlaying = false;

    // Propiedades para el template
    currentTime = '';
    sliderValue = 0;
    sliderMin = 0;
    sliderMax = 11;
    playButtonText = 'Play 3600x';
    pointerData = '';
    variableName = 'Pressure';
    visible = false;

    private pointerLngLat: { lng: number, lat: number } | null = null;

    constructor() {
        // Configura tu API key de MapTiler aquí
        config.apiKey = environment.mapTilerApiKey;
    }

    openMoreInfoPressure(): void {
        window.open('https://www.earthdata.nasa.gov/topics/atmosphere');
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
        this.map = new Map({
            container: this.mapContainer.nativeElement,
            style: MapStyle.BACKDROP,
            projectionControl: true,
            projection: 'globe',
            zoom: 2,
            center: [0, 40]
        });

        this.weatherLayer = new PressureLayer({
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

        // Para presión, mostramos en hPa (hectopascales)
        this.pointerData = `${value.value.toFixed(1)} hPa`;
    }
}
