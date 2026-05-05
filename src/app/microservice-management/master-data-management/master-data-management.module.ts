import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {
    DxDataGridModule, DxDateBoxModule, DxPopupModule, DxRadioGroupModule, DxScrollViewModule,
    DxCheckBoxModule, DxTreeListModule, DxSchedulerModule, DxNumberBoxModule, DxAutocompleteModule, DxLoadPanelModule
} from 'devextreme-angular';
import {MasterDataManagementRoutingModule} from './master-data-management-routing.module';

import {ListRawMaterialsComponent} from './raw-materials/list-raw-materials/list-raw-materials.component';
import {EditRawMaterialsComponent} from './raw-materials/edit-raw-materials/edit-raw-materials.component';

import {ListFinishedProductsComponent} from './finished-products/list-finished-products/list-finished-products.component';
import {EditFinishedProductsComponent} from './finished-products/edit-finished-products/edit-finished-products.component';

import {ListCapsulesComponent} from './capsules/list-capsules/list-capsules.component';
import {EditCapsulesComponent} from './capsules/edit-capsules/edit-capsules.component';

import {ListBinComponent} from './bin/list-bin/list-bin.component';
import {EditBinComponent} from './bin/edit-bin/edit-bin.component';


import {CreateAlertModule} from '../../alert/alert.component';
import {ListQueueManagementComponent} from './queue-management/list-queue-management/list-queue-management.component';
import {ListProductionManagementComponent} from './production-management/list-production-management/list-production-management.component';
import {ListProductionScheduleComponent} from './production-schedule/list-production-schedule/list-production-schedule.component';
import { EditPharmacyNoteComponent } from './pharmacy-notes/edit-pharmacy-notes/edit-pharmacy-notes.component';
import { ListPharmacyNoteComponent } from './pharmacy-notes/list-phamacy-notes/list-pharmacy-notes.component';
import { HistoryPharmacyNoteComponent } from './pharmacy-notes/history-pharmacy-notes/history-pharmacy-notes.component';
import { HistoryFinishedProductsComponent } from './finished-products/history-finished-products/history-finished-products.component';
import { HistoryCapsulesComponent } from './capsules/history-capsules/history-capsules.component';
import { HistoryBinComponent } from './bin/history-bin/history-bin.component';
import { HistoryRawMaterialsComponent } from './raw-materials/history-raw-materials/history-raw-materials.component';
import { ListPriceComponent } from './price/list-price/list-price.component';
import { ListSachetComponent } from './sachet/list-sachet/list-sachet.component';
import { EditSachetComponent } from './sachet/edit-sachet/edit-sachet.component';
import { HistorySachetComponent } from './sachet/history-sachet/history-sachet.component';
import { HistoryPriceComponent } from './price/history-price/history-price.component';
import {NgxMaskModule} from 'ngx-mask';
import { ListPatientComponent } from './patient/list-patient/list-patient.component';
import { ListPackMedPriceComponent } from './pack-med-price/list-pack-med-price/list-pack-med-price.component';
import { EditPackMedPriceComponent } from './pack-med-price/edit-pack-med-price/edit-pack-med-price.component';
import { HistoryPackMedPriceComponent } from './pack-med-price/history-pack-med-price/history-pack-med-price.component';
import { EditPatientComponent } from './patient/edit-patient/edit-patient.component';
import { HistoryPatientComponent } from './patient/history-patient/history-patient.component';
import { ResolveImageUrlModule } from '../../shared/resolve-image-url.module';


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
        MasterDataManagementRoutingModule,
        DxTreeListModule,
        DxCheckBoxModule,
        DxSchedulerModule,
        DxNumberBoxModule,
        NgxMaskModule,
        DxAutocompleteModule,
        DxLoadPanelModule,
        ResolveImageUrlModule
    ],
    declarations: [
        ListRawMaterialsComponent,
        EditRawMaterialsComponent,
        ListFinishedProductsComponent,
        EditFinishedProductsComponent,
        ListCapsulesComponent,
        EditCapsulesComponent,
        ListBinComponent,
        EditBinComponent,
        ListQueueManagementComponent,
        ListProductionManagementComponent,
        ListProductionScheduleComponent,
        ListPharmacyNoteComponent,
        EditPharmacyNoteComponent,
        HistoryPharmacyNoteComponent,
        HistoryFinishedProductsComponent,
        HistoryCapsulesComponent,
        HistoryBinComponent,
        HistoryRawMaterialsComponent,
        ListPriceComponent,
        ListSachetComponent,
        EditSachetComponent,
        HistorySachetComponent,
        HistoryPriceComponent,
        ListPatientComponent,
        ListPackMedPriceComponent,
        EditPackMedPriceComponent,
        HistoryPackMedPriceComponent,
        EditPatientComponent,
        HistoryPatientComponent,
    ]
})

export class MasterDataManagementModule {
}
