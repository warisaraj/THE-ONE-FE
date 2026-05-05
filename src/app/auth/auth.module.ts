import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import { BaseRequestOptions, HttpModule } from '@angular/http';
import { MockBackend } from '@angular/http/testing';

import { AuthRoutingModule } from './auth-routing.routing';
import { AuthComponent } from './auth.component';
import { AlertComponent } from './_directives/alert.component';
import { LogoutComponent } from './logout/logout.component';
import { AuthGuard } from './_guards/auth.guard';
import { AlertService } from './_services/alert.service';
import { AuthenticationService } from './_services/authentication.service';
import { UserService } from './_services/user.service';
import { StoreService } from '../shared/services/store.service';
import {CreateAlertModule} from "../alert/alert.component";
@NgModule({
    declarations: [
        AuthComponent,
        AlertComponent,
        LogoutComponent,
    ],
    imports: [
        CommonModule,
        FormsModule,
        HttpModule,
        AuthRoutingModule,
        ReactiveFormsModule,
        CreateAlertModule,
    ],
    providers: [
        StoreService,
        AuthGuard,
        AlertService,
        AuthenticationService,
        UserService,
        // api backend simulation
        // fakeBackendProvider,
        MockBackend,
        BaseRequestOptions,
    ],
    entryComponents: [AlertComponent],
})

export class AuthModule {
}
