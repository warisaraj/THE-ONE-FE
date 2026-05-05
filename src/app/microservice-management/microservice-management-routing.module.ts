import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
// import { MenuMicroserviceModule } from './menu/menu.module';
// import { GroupModule } from './group/group.module';
const routes: Routes = [
  {
    path: '',
    data: {
      title: 'microservice-management'
    },
    children: [
      {
        path: 'microservice-menus',
        // loadChildren: () => MenuMicroserviceModule
        loadChildren: './microservice-menu/microservice-menu.module#MicroserviceMenuModule',
      },
      {
        path: 'roles',
        // loadChildren: () => GroupModule
        loadChildren: './group/group.module#GroupModule',
      },
      {
        path: 'master-data-management',
        loadChildren: './master-data-management/master-data-management.module#MasterDataManagementModule',
      },
      {
        path: 'order-management',
        loadChildren: './order-management/order-management.module#OrderManagementModule',
      },
      {
        path: 'report',
        loadChildren: './report/report.module#ReportModule',
      },
      {
        path: 'production-summary',
        loadChildren: './production-summary/production-summary.module#ProductionSummaryModule',
      }
    ]
  }
];





@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  providers: []
})
export class MicroserviceManagementRoutingModule {
}
