import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {ListNotiComponent} from './list-noti.component';
const routes: Routes = [
  {
    path: '',
    data: {
      title: 'list-noti'
    },
    component: ListNotiComponent
      // ,
    //   children: [
    //
    //       {
    //           path: 'list-noti',
    //           component: ListNotiComponent
    //       }
    //   ]
  }
];


@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  providers: []
})
export class ListNotiRoutingModule {
  constructor() {
    console.log('ListNotiRoutingModule');
  }
}
