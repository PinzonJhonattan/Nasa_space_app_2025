import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MapViento } from './map-viento/map-viento';
import { MapTemperatura } from './map-temperatura/map-temperatura';
import { MapPresion } from './map-presion/map-presion';
import { MapPrecipitacion } from './map-precipitacion/map-precipitacion';
import { MapRadar } from './map-radar/map-radar';
import { MapNubes } from './map-nubes/map-nubes';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';

// Importaciones de MapTiler
import '@maptiler/sdk/dist/maptiler-sdk.css';

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.html',
    styleUrls: ['./dashboard.scss'],
        imports: [CommonModule, MapViento, MapTemperatura, MapPresion, MapPrecipitacion, MapRadar, MapNubes, CardModule, ButtonModule],
    standalone: true
})
export class Dashboard implements OnInit, OnDestroy, AfterViewInit {
    constructor() {}

    ngOnInit(): void {
    }

    ngOnDestroy(): void {
    }

    ngAfterViewInit(): void {
    }


    

   
}