import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

// import {MenuComponent} from './menu.component';

const routes: Routes = [
  {
    path: '',
    data: {
      title: 'Menu'
    },
      children: [
          {
            path: '',
            data: {
                title: ''
            },
            loadChildren: './menu.module#MenuModule',
          }
      ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  providers: []
})
export class MenuRoutingModule { }
