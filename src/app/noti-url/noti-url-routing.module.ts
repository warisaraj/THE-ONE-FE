import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import {NotiUrlComponent} from "./noti-url.component";
const routes: Routes = [
  {
    path: '',
    data: {
      title: 'noti-url'
    },
    children: [
      {
        path: '',
        data: {
          title: ''
        },
        component: NotiUrlComponent
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  providers: []
})
export class NotiUrlRoutingModule { }
