import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DashBoardComponent } from './dashboard/dashboard.component';


const routes: Routes = [
  {
    path: '',
    data: {
      title: 'report'
    },
    children: [{
      path: 'dashboard',
      component: DashBoardComponent
    }]
  }
];


@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  providers: []
})
export class ProductionSummaryRoutingModule {
}
