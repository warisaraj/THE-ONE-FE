import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuditTrailReportComponent } from './audit-trail-report/audit-trail-report.component';
import { ConsumptionReportComponent } from './consumption- report/consumption- report.component';
import { CustomerNotNonfirmedReportComponent } from './customer-not-confirmed-report/customer-not-confirmed-report.component';
import { MedicationUseReportByCustomerComponent } from './medication-use-report-by-customer/medication-use-report-by-customer.component';
import { MedicationUseReportByLocationComponent } from './medication-use-report-by-location/medication-use-report-by-location.component';
import { MovementReportComponent } from './movement-report/movement-report.component';
import { MedicationDispensingReportComponent } from './medication-dispensing-report/medication-dispensing-report.component';
import { ProductionReportComponent } from './production- report/production-report.component';
import { ListReportNo1Component } from './report-no1/list-report-no1.component';
import { ListReportNo2Component } from './report-no2/list-report-no2.component';
import { SafetyFollowUpReportComponent } from './safety-follow-up-report/safety-follow-up-report.component';

const routes: Routes = [
  {
    path: '',
    data: {
      title: 'report'
    },
    children: [
      {
        path: 'report-no1',
        component: ListReportNo1Component
      },
      {
        path: 'report-no2',
        component: ListReportNo2Component
      },
      {
        path: 'movement-report',
        component: MovementReportComponent
      },
      {
        path: 'consumption-report',
        component: ConsumptionReportComponent
      },
      {
        path: 'production-report',
        component: ProductionReportComponent
      },
      {
        path: 'safety-follow-up-report',
        component: SafetyFollowUpReportComponent
      },
      {
        path: 'medication-dispensing-report',
        component: MedicationDispensingReportComponent
      },
      {
        path: 'customer-not-confirmed-report',
        component: CustomerNotNonfirmedReportComponent
      },
      {
        path: 'medication-use-report-by-customer',
        component: MedicationUseReportByCustomerComponent
      },
      {
        path: 'medication-use-report-by-location',
        component: MedicationUseReportByLocationComponent
      },
      {
        path: 'audit-trail-report',
        component: AuditTrailReportComponent
      }
    ]
  }
];


@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  providers: []
})
export class ReportRoutingModule {
}
