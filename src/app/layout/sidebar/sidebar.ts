// sidebar.ts
import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Subject, takeUntil } from 'rxjs';
import { PanelMenu } from 'primeng/panelmenu';

// PrimeNG
import { PanelMenuModule } from 'primeng/panelmenu';
import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { DrawerModule } from 'primeng/drawer';

import { ConfigThemeComponent } from '../../features/config-Theme/config-Theme';
import { ActivityConfigService } from '../../share/services/activity-config.service';


@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    PanelMenuModule,
    PanelMenu,
    ButtonModule,
    AvatarModule,
    BadgeModule,
    DrawerModule,
    ConfigThemeComponent
  ],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.scss']
})
export class Sidebar implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();

    items: MenuItem[] = [];
    isCollapsed = signal(false);
    private router = inject(Router);
    private activityService = inject(ActivityConfigService);
    visible: boolean = false;
    ngOnInit() {
        this.initializeMenu();

        // Subscribe to activity changes
        this.activityService.activitiesUpdated
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => {
                this.updateActivitiesMenu();
            });
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private initializeMenu() {
        this.items = [
            {
                label: 'Home',
                icon: 'pi pi-home',
                styleClass: 'menu-item-home',
                command: () => this.navigate('/home')
            },
            {
                label: 'Global Climate',
                icon: 'pi pi-chart-bar',
                styleClass: 'menu-item-dashboard',
                command: () => this.navigate('/global-climate')
            },
            {
                label: 'Activities',
                icon: 'pi pi-map',
                styleClass: 'menu-item-activities',
                command: () => this.navigate('/activities')
            },
/*             {
                label: 'Mapa',
                icon: 'pi pi-map',
                styleClass: 'menu-item-map',
                command: () => this.navigate('/map')
            }, */
            {
                label: "Activity List",
                icon: 'pi pi-list',
                items: this.generateActivityMenuItems()
            },
            {
                label: 'About Us',
                icon: 'pi pi-user',
                styleClass: 'menu-item-us',
                command: () => this.navigate('/about-us')
            }
        ];
    }

    private updateActivitiesMenu() {
        // Locate the index of the activity list menu
        const activitiesMenuIndex = this.items.findIndex(item => item.label === "Activity List");
        if (activitiesMenuIndex !== -1) {
            // Update only the activity menu items
            this.items[activitiesMenuIndex].items = this.generateActivityMenuItems();
        }
    }

    generateActivityMenuItems(): MenuItem[] {
        const activities = this.activityService.getAllActivities();
        return activities.map(activity => ({
            label: activity.title,
            icon: 'pi pi-map',
            command: () => this.navigate(`/activity/${this.activityService.normalizeActivityId(activity.title)}`)
        }));
    }

    toggleSidebar() {
        this.isCollapsed.update(value => !value);
    }

    navigate(route: string) {
        this.router.navigateByUrl(route);
    }

    logout() {
        console.log('Logging out...');
        // Implement logout logic here
    }

    navigateToNewActivity() {
        this.navigate('/new-activity');
    }
}
