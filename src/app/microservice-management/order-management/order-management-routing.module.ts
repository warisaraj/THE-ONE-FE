import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
// tslint:disable-next-line:max-line-length
import { ListAllOrdersComponent } from './all-orders/list-all-orders/list-all-orders.component';
import { ViewAllOrdersComponent } from './all-orders/view-all-orders/view-all-orders.component';
// tslint:disable-next-line:max-line-length
import { EditOrderCustomerServiceComponent } from './orders/customer-service/edit-order-customer-service/edit-order-customer-service.component';
import { ListCustomerServiceComponent } from './orders/customer-service/list-order-customer-service/list-order-customer-service.component';
import {
  ListOrderCashierViewComponent
} from './orders/cashier-view/list-order-cashier-view/list-order-cashier-view.component';
import {
  EditNutraceuticalsQuotationInfoComponent
} from './orders/cashier-view/edit-nutraceuticals-quotation-info/edit-nutraceuticals-quotation-info.component';
import {
  QueueManagementFinishedProductComponent
} from './orders/cashier-view/queue-management-finished-product/queue-management-finished-product.component';
import {
  QueueManagementReservationComponent
} from './orders/cashier-view/queue-management-reservation/queue-management-reservation.component';
import { ListPharmacistViewComponent } from './orders/pharmacist-view/list-order-pharmacist.e.component';
import {
  QueueManagementBookingComponent
} from './orders/cashier-view/queue-management-booking/queue-management-booking.component';
import { EditPharmacistComponent } from './orders/pharmacist-view/edit-pharmacist/edit-pharmacist.component';
import { ListProductionManagementComponent } from './production/list-production/list-production.component';
import { ViewProductionComponent } from './production/view-production/view-production.component';
import {SplitProductionComponent} from './orders/split-production/split-production.component';
import { EditProductPharmacistComponent } from './production/pharmacist-view/edit-product-pharmacist/edit-product-pharmacist.component';
import { ListProductPharmacistComponent } from './production/pharmacist-view/list-product-pharmacist/list-product-pharmacist.component';
import { ListProductionDoneComponent } from './production/list-production-done/list-production-done.component';
import {BookingCalendarComponent} from './orders/cashier-view/booking-calendar/booking-calendar.component';


const routes: Routes = [
  {
    path: '',
    data: {
      title: 'order-management'
    },
    children: [
      {
        path: 'orders-customer-service-view',
        component: ListCustomerServiceComponent
      },
      {
        path: 'orders-customer-service-view/:id/view',
        component: EditOrderCustomerServiceComponent
      },
      {
        path: 'orders-cashier-view',
        component: ListOrderCashierViewComponent,
      },
      {
        path: 'orders-cashier-view/queue-management-booking/:id',
        component: QueueManagementBookingComponent
      },
      {
        path: 'orders-cashier-view/queue-management-booking/:id/:action',
        component: QueueManagementBookingComponent
      },
      {
        path: 'orders-cashier-view/queue-management-booking/:id/:deliveryDetailId/:action',
        component: QueueManagementBookingComponent
      },
      {
        path: 'orders-cashier-view/queue-management-finished-product/:action',
        component: QueueManagementFinishedProductComponent
      },
      {
        path: 'orders-cashier-view/queue-management-finished-product/:id/:action',
        component: QueueManagementFinishedProductComponent
      },
      {
        path: 'orders-cashier-view/queue-management-finished-product/:id/:reorder',
        component: QueueManagementFinishedProductComponent
      },
      {
        path: 'orders-cashier-view/queue-management-finished-product/:id/:deliveryDetailId/:action',
        component: QueueManagementFinishedProductComponent
      },
      {
        path: 'orders-cashier-view/queue-management-create-reservation/:id',
        component: QueueManagementReservationComponent
      },
      {
        path: 'orders-cashier-view/queue-management-create-reservation',
        component: QueueManagementReservationComponent
      },
      {
        path: 'orders-cashier-view/nutraceuticals-quotation-info/:id/view',
        component: EditNutraceuticalsQuotationInfoComponent
      },
      {
        path: 'orders-cashier-view/nutraceuticals-quotation-info/:id/edit',
        component: EditNutraceuticalsQuotationInfoComponent
      },
      {
        path: 'orders-customer-service-view/:id/edit',
        component: EditOrderCustomerServiceComponent
      },
      {
        path: 'all-orders',
        component: ListAllOrdersComponent
      },
      {
        path: 'all-orders/:id/view',
        component: ViewAllOrdersComponent
      },
      {
        path: 'orders-pharmacist-view',
        component: ListPharmacistViewComponent
      },
      {
        path: 'orders-pharmacist-view/new',
        component: EditPharmacistComponent
      },
      {
        path: 'orders-pharmacist-view/:id/view',
        component: EditPharmacistComponent
      },
      {
        path: 'orders-pharmacist-view/:id/edit',
        component: EditPharmacistComponent
      },
      {
        path: 'orders-pharmacist-view/:id/quotation',
        component: EditPharmacistComponent
      },
      {
        path: 'orders-pharmacist-view/:id/reorder',
        component: EditPharmacistComponent
      },
      {
        path: 'orders-production',
        component: ListProductionManagementComponent
      },
      {
        path: 'orders-production/:id/edit',
        component: ViewProductionComponent
      },
      {
        path: 'orders-production/:id/view',
        component: ViewProductionComponent
      },
      {
        path: 'split-production/:id',
        component: SplitProductionComponent
      },
      {
        path: 'orders-production-pharmacist-view',
        component: ListProductPharmacistComponent
      },
      {
        path: 'all-orders-production-pharmacist-view/:id/view',
        component: EditProductPharmacistComponent
      },
      {
        path: 'orders-production-pharmacist-view/:id/view',
        component: EditProductPharmacistComponent
      },
      {
        path: 'orders-production-pharmacist-view/:id/edit',
        component: EditProductPharmacistComponent
      },
      {
        path: 'orders-production-done',
        component: ListProductionDoneComponent
      },
      {
        path: 'booking-calendar',
        component: BookingCalendarComponent
      },
    ]
  }
];


@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  providers: []
})
export class OrderManagementRoutingModule {
}
