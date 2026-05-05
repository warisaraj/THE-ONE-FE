import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {DxDataGridModule, DxDateBoxModule, DxPopupModule, DxRadioGroupModule, DxRadioGroupComponent, DxScrollViewModule, DxTreeListModule } from 'devextreme-angular';
import {ListNotiRoutingModule} from './list-noti-routing.module';
// import {CreateMenuComponent} from './create-menu/create-menu.component';
// import {EditMenuComponent } from './edit-menu/edit-menu.component';
// import {ViewMenuComponent } from './view-menu/view-menu.component';
import {CreateAlertModule} from '../alert/alert.component';
import {ListNotiComponent} from './list-noti.component';

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
        ListNotiRoutingModule
    ],
    declarations: [
        ListNotiComponent
    ]
})
export class ListNotiModule {
  constructor() {
    console.log('ListNotiModule');
  }
}
