import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {
    DxDataGridModule, DxDateBoxModule, DxPopupModule, DxRadioGroupModule, DxScrollViewModule,
    DxCheckBoxModule, DxTreeListModule, DxSchedulerModule, DxNumberBoxModule, DxAutocompleteModule
} from 'devextreme-angular';
import {CreateAlertModule} from '../../alert/alert.component';
import { ReportRoutingModule } from './report-routing.module';

// tslint:disable-next-line:max-line-length
import {NgxCurrencyModule} from 'ngx-currency';
import {AlertSplitProductionModule} from '../../alert/alert-split-production.component';
import { AlertSplitDeliveryModule } from '../../alert/alert-split-delivery.component';
import {NgxPrintModule} from 'ngx-print';
import { ListReportNo1Component } from './report-no1/list-report-no1.component';
import { ListReportNo2Component } from './report-no2/list-report-no2.component';
import { MovementReportComponent } from './movement-report/movement-report.component';
import { ConsumptionReportComponent } from './consumption- report/consumption- report.component';
import { ProductionReportComponent } from './production- report/production-report.component';
import { MedicationDispensingReportComponent } from './medication-dispensing-report/medication-dispensing-report.component';
import { SafetyFollowUpReportComponent } from './safety-follow-up-report/safety-follow-up-report.component';
import { CustomerNotNonfirmedReportComponent } from './customer-not-confirmed-report/customer-not-confirmed-report.component';
import { MedicationUseReportByCustomerComponent } from './medication-use-report-by-customer/medication-use-report-by-customer.component';
import { MedicationUseReportByLocationComponent } from './medication-use-report-by-location/medication-use-report-by-location.component';
import { AuditTrailReportComponent } from './audit-trail-report/audit-trail-report.component';




@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        DxDataGridModule,
        DxDateBoxModule,
        DxPopupModule,
        DxRadioGroupModule,
        DxScrollViewModule,
        CreateAlertModule,
        AlertSplitProductionModule,
        ReportRoutingModule,
        DxTreeListModule,
        DxCheckBoxModule,
        DxSchedulerModule,
        DxNumberBoxModule,
        NgxCurrencyModule,
        AlertSplitDeliveryModule,
        DxAutocompleteModule,
        NgxPrintModule
    ],
    declarations: [
        ListReportNo1Component,
        ListReportNo2Component,
        MovementReportComponent,
        ConsumptionReportComponent,
        ProductionReportComponent,
        MedicationDispensingReportComponent,
        SafetyFollowUpReportComponent,
        CustomerNotNonfirmedReportComponent,
        MedicationUseReportByCustomerComponent,
        MedicationUseReportByLocationComponent,
        AuditTrailReportComponent
    ]
})

export class ReportModule {
}
