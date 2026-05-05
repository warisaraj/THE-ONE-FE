import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {MenuRoutingModule} from './menu-routing.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    MenuRoutingModule,
    ReactiveFormsModule,
  ],
  declarations: []
})
export class MenuModule {
}
