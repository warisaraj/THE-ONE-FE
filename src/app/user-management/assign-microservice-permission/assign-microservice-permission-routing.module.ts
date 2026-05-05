import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';

import {ListAssignMicroservicePermissionComponent} from './list-assign-microservice-permission/list-assign-microservice-permission.component';
import {CreateAssignMicroservicePermissionComponent} from './create-assign-microservice-permission/create-assign-microservice-permission.component';

const routes: Routes = [
    {
        path: '',
        data: {
            title: 'assign-microservice-permission'
        },
        children: [

          {
            path: '',
            component: ListAssignMicroservicePermissionComponent
          },
          {
            path: ':username/assign-microservice-permission-info',
            component: CreateAssignMicroservicePermissionComponent
          }
        ]
    }
];


@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
    providers: []
})
export class AssignMicroservicePermissionRoutingModule {
}
