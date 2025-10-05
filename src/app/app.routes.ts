import { Routes } from '@angular/router';
import { Layout } from './layout/layout';
import { Home } from './features/home/home';
import { Intro } from './features/intro/intro';
import { ConfigThemeComponent } from './features/config-Theme/config-Theme';

export const routes: Routes = [
    {
        path: "",
        redirectTo: "intro",
        pathMatch: "full"
    },
    {
        path: "intro",
        component: Intro
    },
    {
        path: "",
        component: Layout,
        children: [
            {
                path: "home",
                component: Home
            },
            {
                path: "home",
                component: Home
            },
            {
                path: "global-climate",
                loadComponent: () => import('./features/dashboard/dashboard').then(m => m.Dashboard)
            },
            {
                path: 'activities',
                loadComponent: () => import('./features/activities/activities').then(m => m.Activities)
            },

            {
                path: "config",
                component: ConfigThemeComponent
            },
            {
                path: "form",
                loadComponent: () => import('./features/form/form').then(m => m.FormComponent)
            },
            {
                path: "activity/:activityId",
                loadComponent: () => import('./features/activity-detail/activity-detail').then(m => m.ActivityDetailComponent)
            },
            {
                path: "new-activity",
                loadComponent: () => import('./features/nueva-actividad/nueva-actividad').then(m => m.NuevaActividadComponent)
            },
            {
                path: "about-us",
                loadComponent: () => import('./features/us/us').then(m => m.UsComponent)
            }
        ]
    }
];
