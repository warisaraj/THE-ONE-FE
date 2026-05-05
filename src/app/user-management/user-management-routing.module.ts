import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
const routes: Routes = [
  {
    path: '',
    data: {
      title: 'user-management'
    },
    children: [
        {path: '', redirectTo: 'user', pathMatch: 'full'},
      {
        path: 'user',
        loadChildren: './user/user.module#UserModule',
      },
      {
        path: 'assign-microservice-permission',
        loadChildren: './assign-microservice-permission/assign-microservice-permission.module#AssignMicroservicePermissionModule',
      },
    ]
  }
];





@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  providers: []
})
export class UserManagementRoutingModule {
  constructor() {
    console.log('UserManagementRoutingModule');
  }
}
