import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
    DxDataGridModule,
    DxDateBoxModule,
    DxPopupModule,
    DxRadioGroupModule,
    DxRadioGroupComponent,
    DxScrollViewModule,
    DxCheckBoxModule,
    DxTreeListModule,
    DxSchedulerModule,
    DxNumberBoxModule,
    DxAutocompleteModule,
    DxFileUploaderModule,
    DxLoadPanelModule, DxButtonGroupModule
} from 'devextreme-angular';
import { CreateAlertModule } from '../../alert/alert.component';
import { OrderManagementRoutingModule } from './order-management-routing.module';

import { ListCustomerServiceComponent } from './orders/customer-service/list-order-customer-service/list-order-customer-service.component';
// tslint:disable-next-line:max-line-length
import { EditOrderCustomerServiceComponent } from './orders/customer-service/edit-order-customer-service/edit-order-customer-service.component';
import {
    ListOrderCashierViewComponent
} from './orders/cashier-view/list-order-cashier-view/list-order-cashier-view.component';
import {
    EditNutraceuticalsQuotationInfoComponent
} from './orders/cashier-view/edit-nutraceuticals-quotation-info/edit-nutraceuticals-quotation-info.component';
import { NgxCurrencyModule } from 'ngx-currency';
import {
    QueueManagementFinishedProductComponent
} from './orders/cashier-view/queue-management-finished-product/queue-management-finished-product.component';
import {
    QueueManagementReservationComponent
} from './orders/cashier-view/queue-management-reservation/queue-management-reservation.component';
import { ListAllOrdersComponent } from './all-orders/list-all-orders/list-all-orders.component';
import { ViewAllOrdersComponent } from './all-orders/view-all-orders/view-all-orders.component';
import { ListPharmacistViewComponent } from './orders/pharmacist-view/list-order-pharmacist.e.component';
import {
    QueueManagementBookingComponent
} from './orders/cashier-view/queue-management-booking/queue-management-booking.component';
import { EditPharmacistComponent } from './orders/pharmacist-view/edit-pharmacist/edit-pharmacist.component';
import { ListProductionManagementComponent } from './production/list-production/list-production.component';
import { ViewProductionComponent } from './production/view-production/view-production.component';
import { AlertSplitProductionModule } from '../../alert/alert-split-production.component';
import { SplitProductionComponent } from './orders/split-production/split-production.component';
import { EditProductPharmacistComponent } from './production/pharmacist-view/edit-product-pharmacist/edit-product-pharmacist.component';
import { ListProductPharmacistComponent } from './production/pharmacist-view/list-product-pharmacist/list-product-pharmacist.component';
import { AlertSplitDeliveryModule } from '../../alert/alert-split-delivery.component';
import { NgxPrintModule } from 'ngx-print';
import { ListProductionDoneComponent } from './production/list-production-done/list-production-done.component';
import {BookingCalendarComponent} from './orders/cashier-view/booking-calendar/booking-calendar.component';
import { ResolveImageUrlModule } from '../../shared/resolve-image-url.module';



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
        OrderManagementRoutingModule,
        DxTreeListModule,
        DxCheckBoxModule,
        DxSchedulerModule,
        DxNumberBoxModule,
        NgxCurrencyModule,
        AlertSplitDeliveryModule,
        DxAutocompleteModule,
        NgxPrintModule,
        DxFileUploaderModule,
        DxLoadPanelModule,
        DxButtonGroupModule,
        ResolveImageUrlModule
    ],
    declarations: [
        ListCustomerServiceComponent,
        EditOrderCustomerServiceComponent,
        ListOrderCashierViewComponent,
        EditNutraceuticalsQuotationInfoComponent,
        QueueManagementBookingComponent,
        QueueManagementFinishedProductComponent,
        QueueManagementReservationComponent,
        ListAllOrdersComponent,
        ViewAllOrdersComponent,
        ListPharmacistViewComponent,
        EditPharmacistComponent,
        ListProductionManagementComponent,
        ViewProductionComponent,
        SplitProductionComponent,
        EditProductPharmacistComponent,
        ListProductPharmacistComponent,
        ListProductionDoneComponent,
        BookingCalendarComponent
    ]
})

export class OrderManagementModule {
}
