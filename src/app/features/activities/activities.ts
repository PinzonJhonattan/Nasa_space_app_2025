import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivityCardComponent } from '../../share/components/activity-card/activity-card.component';
import { Activity } from '../../share/models/activity.model';
import { ActivityConfigService } from '../../share/services/activity-config.service';

@Component({
  selector: 'app-activities',
  templateUrl: './activities.html',
  styleUrls: ['./activities.scss'],
  imports: [CommonModule, ActivityCardComponent]
})
export class Activities implements OnInit {
  activities: Activity[] = [];

  constructor(
    private http: HttpClient,
    private activityConfigService: ActivityConfigService
  ) {}

  ngOnInit() {
    this.activities = this.activityConfigService.getAllActivities();
    console.log(this.activities);
  }
}
