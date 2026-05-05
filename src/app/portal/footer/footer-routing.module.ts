import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

// import {FooterComponent} from '../footer/footer.component';

const routes: Routes = [
  {
    path: '',
    data: {
      title: 'Footer'
    },
      children: [
          {
              path: '',
              data: {
                  title: ''
              },
              loadChildren: './footer.module#FooterModule',
          }
      ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  providers: []
})
export class FooterRoutingModule { }
