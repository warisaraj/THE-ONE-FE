import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';

const routes: Routes = [
  {
    path: '',
    data: {
      title: 'portal'
    },
    children: [
      {
        path: 'header',
        loadChildren: './header/header.module#HeaderModule',
      },{
        path: 'menu',
        loadChildren: './menu/menu.module#MenuModule',
      },{
        path: 'footer',
        loadChildren: './footer/footer.module#FooterModule',
      }
    ]
  }
];


@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  providers: []
})
export class PortalRoutingModule {
}
