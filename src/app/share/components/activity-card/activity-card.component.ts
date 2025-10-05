import { Component, Input } from '@angular/core';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { RouterModule } from '@angular/router';
import { Activity } from '../../models/activity.model';

@Component({
  selector: 'app-activity-card',
  standalone: true,
  imports: [CardModule, ButtonModule, TagModule, RouterModule],
  styleUrls: ['./activity-card.component.scss'],
  template: `
    <p-card class="activity-card">
      <ng-template #header>
        <img [alt]="activity.title" class="w-full h-50 object-contain" [src]="activity.imageUrl" />
      </ng-template>
      <ng-template #title>
        <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200">{{ activity.title }}</h3>
      </ng-template>
      <div class="mb-3">
        <p-tag [value]="activity.category" [severity]="activity.categoryColor"></p-tag>
      </div>
      <p class="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-4">{{ activity.description }}</p>
      <ng-template #footer>
        <div class="flex gap-2">
          <p-button
            label="Open"
            class="w-full"
            styleClass="w-full"
            [routerLink]="activity.routerLink"
            size="small" />
        </div>
      </ng-template>
    </p-card>
  `
})
export class ActivityCardComponent {
  @Input() activity!: Activity;
}
