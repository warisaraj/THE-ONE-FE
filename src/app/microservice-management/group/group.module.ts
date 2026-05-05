import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {
    DxDataGridModule, DxDateBoxModule, DxPopupModule, DxRadioGroupModule, DxRadioGroupComponent, DxScrollViewModule,
    DxCheckBoxModule, DxTreeListModule
} from 'devextreme-angular';
import {GroupRoutingModule} from './group-routing.module';

import {ListGroupComponent} from './list-group/list-group.component';
import {ViewGroupMicroserviceComponent} from './view-group-microservice/view-group-microservice.component';
import {CreateGroupComponent} from './create-group/create-group.component';
import {EditGroupComponent} from './edit-group/edit-group.component';
import {ViewGroupComponent} from './view-group/view-group.component';

import {CreateAlertModule} from "../../alert/alert.component";

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
      GroupRoutingModule,
      DxTreeListModule,
      DxCheckBoxModule
    ],
    declarations: [
      ListGroupComponent,
      ViewGroupMicroserviceComponent,
      CreateGroupComponent,
      EditGroupComponent,
      ViewGroupComponent
    ]
})

export class GroupModule {
}
