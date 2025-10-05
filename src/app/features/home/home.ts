import { Component } from '@angular/core';    
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-home',
    templateUrl: './home.html',
    styleUrls: ['./home.scss'],
    imports: [CardModule, ButtonModule, CommonModule]
})

export class Home {

    constructor(private router: Router) {}

    goToActivities() {
        this.router.navigate(['/activities']);
    }
}