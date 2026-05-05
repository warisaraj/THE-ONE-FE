import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {DxDataGridModule, DxDateBoxModule, DxPopupModule, DxRadioGroupModule, DxRadioGroupComponent, DxScrollViewModule, DxTreeListModule } from 'devextreme-angular';
import {UserRoutingModule} from './user-routing.module';
import {CreateAlertModule} from '../../alert/alert.component';
import {ListUserComponent} from './list-user/list-user.component';
import {ViewCreateEditUserComponent} from './view-create-edit-user/view-create-edit-user.component';
import { DxSwitchModule } from 'devextreme-angular';
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
      UserRoutingModule,
      DxSwitchModule
    ],
    declarations: [
        ListUserComponent,
        ViewCreateEditUserComponent
    ]
})
export class UserModule {
  constructor() {
    console.log('UserModule');
  }
}
