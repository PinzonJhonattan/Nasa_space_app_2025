import { Component } from '@angular/core';
import { RouterOutlet, provideRouter } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';






@Component({
  selector: 'app-root',
  imports: [RouterOutlet
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  providers: [ MessageService, ConfirmationService]
})

export class App {


    constructor() {}



}
