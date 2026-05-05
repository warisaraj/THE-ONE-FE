import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';
import { LayoutMenu } from '../shared/store/layout.menu.store';
// import {LaddaModule} from 'angular2-ladda';
// import {BfSharedModule} from '../shared/shared.module';
import {MenuFullComponent} from "./menu-full.component";
import {MenuFullRoutingModule} from "./menu-full-routing.module";
// import {CreateAlertModule} from '../alert/alert.component';
import {Common} from '../shared/services/common.service';
import {Request} from '../shared/services/request.service';
@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    MenuFullRoutingModule,
    // BfSharedModule,
    // BfSharedModule,
    // ReactiveFormsModule,
    // LaddaModule,
    // CreateAlertModule
  ],
  declarations: [
    MenuFullComponent
  ],
  providers: [Common, Request, LayoutMenu]
})
export class MenuFullModule {
}
