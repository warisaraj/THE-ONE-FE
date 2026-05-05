import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {
    DxDataGridModule, DxDateBoxModule, DxPopupModule, DxRadioGroupModule, DxRadioGroupComponent, DxScrollViewModule,
    DxCheckBoxModule, DxTreeListModule
} from 'devextreme-angular';
import {MicroserviceMenuRoutingModule} from './microservice-menu-routing.module';

import { ListMenuComponent } from './list-menu/list-menu.component';
import { CreateMenuComponent } from './create-menu/create-menu.component';
import { EditMenuComponent } from './edit-menu/edit-menu.component';
import { ViewMenuComponent } from './view-menu/view-menu.component';
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
      MicroserviceMenuRoutingModule,
      DxTreeListModule,
      DxCheckBoxModule
    ],
    declarations: [
      ListMenuComponent,
      CreateMenuComponent,
      EditMenuComponent,
      ViewMenuComponent
    ]
})
export class MicroserviceMenuModule {
}
