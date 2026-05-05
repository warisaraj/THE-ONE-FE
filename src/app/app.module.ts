import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {HttpModule} from '@angular/http';
import {RoutingModule} from './app.routing.module';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {DxDataGridModule, DxFileUploaderModule} from 'devextreme-angular';
import {AuthModule} from './auth/auth.module';
import {AppComponent} from './app.component';
import {PortalComponent} from './portal/portal.component';
import {HeaderComponent} from './portal/header/header.component';
import {MenuComponent} from './portal/menu/menu.component';
import {FooterComponent} from './portal/footer/footer.component';
import {SharedService} from './shared/services/shared.service';
import {StoreService} from './shared/services/store.service';
import {PerfectScrollbarModule, PerfectScrollbarConfigInterface, PERFECT_SCROLLBAR_CONFIG} from 'ngx-perfect-scrollbar';
import {SocketService} from './shared/services/socket.service';
import {Common} from './shared/services/common.service';
import {Request} from './shared/services/request.service';
import {HttpClientModule} from '@angular/common/http';
import {IConfig, NgxMaskModule} from 'ngx-mask';

export const options: Partial<null | IConfig> | (() => Partial<IConfig>) = null;
const DEFAULT_PERFECT_SCROLLBAR_CONFIG: PerfectScrollbarConfigInterface = {
  wheelPropagation: true
};


@NgModule({
  declarations: [
    AppComponent,
    PortalComponent,
    HeaderComponent,
    MenuComponent,
    FooterComponent,
  ],
  imports: [
    HttpClientModule,
    BrowserModule,
    RoutingModule,
    BrowserAnimationsModule,
    HttpModule,
    DxDataGridModule,
    DxFileUploaderModule,
    AuthModule,
    PerfectScrollbarModule,
    NgxMaskModule.forRoot()
  ],
  providers: [
    SharedService,
    StoreService,
    {
      provide: PERFECT_SCROLLBAR_CONFIG,
      useValue: DEFAULT_PERFECT_SCROLLBAR_CONFIG
    },
    SocketService,
    Common,
    Request
  ],
  bootstrap: [
    AppComponent
  ]
})
export class AppModule {
}
