import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import {HeaderComponent} from '../header/header.component';

const routes: Routes = [
  {
    path: '',
    data: {
      title: 'Header'
    },
      children: [
          {
              path: '',
              data: {
                  title: ''
              },
              component: HeaderComponent
          }
      ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  providers: []
})
export class HeaderRoutingModule { }
