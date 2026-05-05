import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {PortalComponent} from './portal/portal.component';
import {LogoutComponent} from './auth/logout/logout.component';
import {AuthGuard} from './auth/_guards';

const routes: Routes = [
  {path: 'login', loadChildren: './auth/auth.module#AuthModule'},
  {path: 'error', loadChildren: './auth/auth.module#AuthModule'},
  {path: 'logout', component: LogoutComponent},
  {path: '', redirectTo: '/home', pathMatch: 'full'},

  {
    path: '', component: PortalComponent,
    children: [
      {
        path: 'home',
        canActivate: [AuthGuard],
        loadChildren: './home/home.module#HomeModule',
      },
      {
        path: 'noti-url',
        canActivate: [AuthGuard],
        loadChildren: './noti-url/noti-url.module#NotiUrlModule',
      },
      {
        path: 'list-noti',
        canActivate: [AuthGuard],
        loadChildren: './list-noti/list-noti.module#ListNotiModule'
      },
      {
        path: '',
        canActivate: [AuthGuard],
        loadChildren: './microservice-management/microservice-management.module#MicroserviceManagementModule',
      },
      {
        path: '',
        canActivate: [AuthGuard],
        loadChildren: './user-management/user-management.module#UserManagementModule'
      },
      {
        path: 'menu',
        canActivate: [AuthGuard],
        loadChildren: './menu-full/menu-full.module#MenuFullModule'
      }
    ],
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {useHash: true})
  ],
  exports: [RouterModule]
})
export class RoutingModule {
}
