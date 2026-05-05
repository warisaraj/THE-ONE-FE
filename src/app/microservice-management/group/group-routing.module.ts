import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import { ListGroupComponent } from './list-group/list-group.component';
import {ViewGroupMicroserviceComponent} from './view-group-microservice/view-group-microservice.component';
import {CreateGroupComponent} from './create-group/create-group.component';
import {EditGroupComponent} from './edit-group/edit-group.component';
import {ViewGroupComponent} from './view-group/view-group.component';
const routes: Routes = [
  {
    path: '',
    data: {
      title: 'roles'
    },
    children: [
      {
        path: '',
        component: ListGroupComponent
      },
      {
        path: ':menuId/list-of-groups',
        component: ViewGroupMicroserviceComponent
      },
      {
        path: ':menuId/list-of-groups/:roleId/view',
        component: ViewGroupComponent
      },
      {
        path: ':menuId/list-of-groups/:roleId/edit',
        component: EditGroupComponent
      },
      {
        path: ':menuId/list-of-groups/new',
        component: CreateGroupComponent
      },
    ]
  }
];


@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  providers: []
})
export class GroupRoutingModule {
}
