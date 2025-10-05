import { Component, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';

import { Sidebar } from './sidebar/sidebar';
import { StarsBackgroundComponent } from '../share/components/stars-background/stars-background.component';
@Component({
    selector: 'app-layout',
    imports: [RouterOutlet, Sidebar, ButtonModule, TooltipModule, StarsBackgroundComponent],
    templateUrl: './layout.html',
    styleUrls: ['./layout.scss']
})

export class Layout {
    @ViewChild(Sidebar) sidebar!: Sidebar;
    
    constructor() {}
    
    openColorConfig() {
        // Activar el drawer del sidebar directamente
        if (this.sidebar) {
            this.sidebar.visible = true;
        }
    }
}   
