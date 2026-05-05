import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';

import { ListMenuComponent } from './list-menu/list-menu.component';
import { CreateMenuComponent } from './create-menu/create-menu.component';
import { EditMenuComponent } from './edit-menu/edit-menu.component';
import { ViewMenuComponent } from './view-menu/view-menu.component';

const routes: Routes = [
  {
    path: '',
    data: {
      title: 'microservice-menus'
    },
    children: [
      {
        path: '',
        component: ListMenuComponent
      },
      {
        path: 'new',
        component: CreateMenuComponent
      },
      {
        path: ':menuId/edit',
        component: EditMenuComponent
      },
      {
        path: ':menuId/view',
        component: ViewMenuComponent
      },

    ]
  }
]



@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  providers: []
})
export class MicroserviceMenuRoutingModule {
}
