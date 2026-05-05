import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {HomeComponent} from './home.component';
import {HomeRoutingModule} from './home-routing.module';
import {Common} from '../shared/services/common.service';
import {Request} from '../shared/services/request.service';
@NgModule({
  imports: [
    CommonModule,
    HomeRoutingModule,
  ],
  declarations: [
    HomeComponent
  ],
  providers: [Common, Request]
})
export class HomeModule {
}
