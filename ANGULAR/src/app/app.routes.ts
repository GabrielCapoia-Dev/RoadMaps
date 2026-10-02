import { Routes } from '@angular/router';
import { authGuard } from './core/auth-guard';
import { pendingChangesGuard } from './core/pending-changes-guard';
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./layouts/shell/shell').then((m) => m.Shell),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'explorar' },
      {
        path: 'explorar',
        title: 'Explore novos caminhos · BreadCrumbs',
        loadComponent: () => import('./features/explore/explore/explore').then((m) => m.Explore),
      },
      {
        path: 'entrar',
        title: 'Entrar · BreadCrumbs',
        data: { mode: 'login' },
        loadComponent: () => import('./features/auth/auth-page/auth-page').then((m) => m.AuthPage),
      },
      {
        path: 'cadastro',
        title: 'Criar conta · BreadCrumbs',
        data: { mode: 'register' },
        loadComponent: () => import('./features/auth/auth-page/auth-page').then((m) => m.AuthPage),
      },
      {
        path: 'confirmar-email',
        title: 'Confirmar e-mail · BreadCrumbs',
        data: { mode: 'verify' },
        loadComponent: () => import('./features/auth/auth-page/auth-page').then((m) => m.AuthPage),
      },
      {
        path: 'meus-roadmaps',
        title: 'Meus roadmaps · BreadCrumbs',
        canActivate: [authGuard],
        loadComponent: () => import('./features/library/library/library').then((m) => m.Library),
      },
      {
        path: 'salvos',
        title: 'Trilhas salvas · BreadCrumbs',
        data: { saved: true },
        canActivate: [authGuard],
        loadComponent: () => import('./features/library/library/library').then((m) => m.Library),
      },
      {
        path: 'roadmaps/:id',
        title: 'Sua trilha · BreadCrumbs',
        loadComponent: () =>
          import('./features/roadmap/roadmap-page/roadmap-page').then((m) => m.RoadmapPage),
      },
      {
        path: 'modelos/:id',
        title: 'Inspiração · BreadCrumbs',
        data: { template: true },
        loadComponent: () =>
          import('./features/roadmap/roadmap-page/roadmap-page').then((m) => m.RoadmapPage),
      },
      {
        path: 'editor/:id',
        title: 'Editor de roadmap · BreadCrumbs',
        canActivate: [authGuard],
        canDeactivate: [pendingChangesGuard],
        loadComponent: () => import('./features/editor/editor/editor').then((m) => m.Editor),
      },
      {
        path: 'comunidade',
        title: 'Comunidade · BreadCrumbs',
        loadComponent: () =>
          import('./features/community/community/community').then((m) => m.Community),
      },
      {
        path: 'perfil',
        title: 'Meu perfil · BreadCrumbs',
        canActivate: [authGuard],
        loadComponent: () => import('./features/profile/profile/profile').then((m) => m.Profile),
      },
      {
        path: 'pessoas/:id',
        title: 'Perfil · BreadCrumbs',
        loadComponent: () => import('./features/profile/profile/profile').then((m) => m.Profile),
      },
      {
        path: 'ambiente',
        title: 'Diagnóstico do ambiente',
        loadComponent: () =>
          import('./features/environment/environment-page').then((m) => m.EnvironmentPage),
      },
      {
        path: '**',
        title: 'Página não encontrada · BreadCrumbs',
        loadComponent: () => import('./shared/not-found/not-found').then((m) => m.NotFound),
      },
    ],
  },
];
