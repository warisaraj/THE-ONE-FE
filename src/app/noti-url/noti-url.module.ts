import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';
// import {LaddaModule} from 'angular2-ladda';
// import {BfSharedModule} from '../shared/shared.module';
import { NotiUrlComponent} from "./noti-url.component";
import { NotiUrlRoutingModule} from "./noti-url-routing.module";
// import {CreateAlertModule} from '../alert/alert.component';
import {Common} from '../shared/services/common.service';
import {Request} from '../shared/services/request.service';
@NgModule({
  imports: [
    CommonModule,
    FormsModule,
     NotiUrlRoutingModule,

  ],
  declarations: [
     NotiUrlComponent
  ],
  providers: [Common, Request]
})
export class NotiUrlModule {
}
