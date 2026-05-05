import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import {MenuFullComponent} from "./menu-full.component";
const routes: Routes = [
  {
    path: '',
    data: {
      title: 'Menu'
    },
    children: [
      {
        path: ':id/:type',
        data: {
          title: ''
        },
        component: MenuFullComponent
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  providers: []
})
export class MenuFullRoutingModule { }
