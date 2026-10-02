import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'Ambiente preparado',
    loadComponent: () =>
      import('./features/environment/environment-page').then((module) => module.EnvironmentPage),
  },
  { path: '**', redirectTo: '' },
];
