import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {
    DxDataGridModule, DxDateBoxModule, DxPopupModule, DxRadioGroupModule, DxScrollViewModule,
    DxCheckBoxModule, DxTreeListModule, DxSchedulerModule, DxNumberBoxModule, DxAutocompleteModule, DxChartModule
} from 'devextreme-angular';
import {CreateAlertModule} from '../../alert/alert.component';
import { ProductionSummaryRoutingModule } from './production-summary-routing.module';

// tslint:disable-next-line:max-line-length
import {NgxCurrencyModule} from 'ngx-currency';
import {AlertSplitProductionModule} from '../../alert/alert-split-production.component';
import { AlertSplitDeliveryModule } from '../../alert/alert-split-delivery.component';
import {NgxPrintModule} from 'ngx-print';
import { DashBoardComponent } from './dashboard/dashboard.component';




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
        ProductionSummaryRoutingModule,
        DxTreeListModule,
        DxCheckBoxModule,
        DxSchedulerModule,
        DxNumberBoxModule,
        NgxCurrencyModule,
        AlertSplitDeliveryModule,
        DxAutocompleteModule,
        NgxPrintModule,
        DxChartModule
    ],
    declarations: [
        DashBoardComponent
    ]
})

export class ProductionSummaryModule {
}
