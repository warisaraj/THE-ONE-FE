import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {DxDataGridModule, DxDateBoxModule, DxPopupModule, DxRadioGroupModule,DxCheckBoxModule, DxRadioGroupComponent, DxScrollViewModule, DxTreeListModule } from 'devextreme-angular';
import {AssignMicroservicePermissionRoutingModule} from './assign-microservice-permission-routing.module';
import {CreateAlertModule} from "../../alert/alert.component";

import {ListAssignMicroservicePermissionComponent} from './list-assign-microservice-permission/list-assign-microservice-permission.component';
import {CreateAssignMicroservicePermissionComponent} from './create-assign-microservice-permission/create-assign-microservice-permission.component';
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
      DxTreeListModule,
      CreateAlertModule,
      AssignMicroservicePermissionRoutingModule,
      DxCheckBoxModule
    ],
    declarations: [
      ListAssignMicroservicePermissionComponent,
      CreateAssignMicroservicePermissionComponent
    ]
})
export class AssignMicroservicePermissionModule {
}
