import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {
  DxDataGridModule,
  DxDateBoxModule,
  DxPopupModule,
  DxRadioGroupModule,
  DxScrollViewModule,
  DxTreeListModule
} from 'devextreme-angular';
import {UserManagementRoutingModule} from './user-management-routing.module';
import {CreateAlertModule} from '../alert/alert.component';

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
    UserManagementRoutingModule
  ],
  declarations: []
})
export class UserManagementModule {
  constructor() {
    console.log('UserManagementModule');
  }
}
