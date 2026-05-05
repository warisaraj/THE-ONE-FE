import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {PortalRoutingModule} from './portal-routing.module';
import {StoreService} from '../shared/services/store.service';

@NgModule({
  imports: [
    CommonModule,
    PortalRoutingModule,
  ],
  declarations: [],
  providers: [
    StoreService,
  ]
})

export class PortalModule {
}
