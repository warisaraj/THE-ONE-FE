import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import { ListRawMaterialsComponent } from './raw-materials/list-raw-materials/list-raw-materials.component';
import { EditRawMaterialsComponent } from './raw-materials/edit-raw-materials/edit-raw-materials.component';

import { ListFinishedProductsComponent } from './finished-products/list-finished-products/list-finished-products.component';
import { EditFinishedProductsComponent } from './finished-products/edit-finished-products/edit-finished-products.component';

import { ListCapsulesComponent } from './capsules/list-capsules/list-capsules.component';
import { EditCapsulesComponent } from './capsules/edit-capsules/edit-capsules.component';

import { ListBinComponent } from './bin/list-bin/list-bin.component';
import { EditBinComponent } from './bin/edit-bin/edit-bin.component';
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
import { ListPatientComponent } from './patient/list-patient/list-patient.component';
import { ListPackMedPriceComponent } from './pack-med-price/list-pack-med-price/list-pack-med-price.component';
import { EditPackMedPriceComponent } from './pack-med-price/edit-pack-med-price/edit-pack-med-price.component';
import { HistoryPackMedPriceComponent } from './pack-med-price/history-pack-med-price/history-pack-med-price.component';
import { EditPatientComponent } from './patient/edit-patient/edit-patient.component';
import { HistoryPatientComponent } from './patient/history-patient/history-patient.component';


;

const routes: Routes = [
  {
    path: '',
    data: {
      title: 'master-data-management'
    },
    children: [
      {
        path: 'raw-materials', // /master-data-management/raw-materials
        component: ListRawMaterialsComponent
      },
      {
        path: 'raw-materials/:id/view',
        component: EditRawMaterialsComponent
      },
      {
        path: 'raw-materials/:id/edit',
        component: EditRawMaterialsComponent
      },
      {
        path: 'raw-materials/new',
        component: EditRawMaterialsComponent
      },
      {
        path: 'raw-materials/:id/history',
        component: HistoryRawMaterialsComponent
      },

      {
        path: 'finished-products', // /master-data-management/raw-materials
        component: ListFinishedProductsComponent
      },
      {
        path: 'finished-products/:id/view',
        component: EditFinishedProductsComponent
      },
      {
        path: 'finished-products/:id/edit',
        component: EditFinishedProductsComponent
      },
      {
        path: 'finished-products/new',
        component: EditFinishedProductsComponent
      },
      {
        path: 'finished-products/:id/history',
        component: HistoryFinishedProductsComponent
      },
      {
        path: 'capsules', // /master-data-management/raw-materials
        component: ListCapsulesComponent
      },
      {
        path: 'capsules/:id/view',
        component: EditCapsulesComponent
      },
      {
        path: 'capsules/:id/edit',
        component: EditCapsulesComponent
      },
      {
        path: 'capsules/new',
        component: EditCapsulesComponent
      },
      {
        path: 'capsules/:id/history',
        component: HistoryCapsulesComponent
      },


      {
        path: 'bin', // /master-data-management/raw-materials
        component: ListBinComponent
      },
      {
        path: 'bin/:id/view',
        component: EditBinComponent
      },
      {
        path: 'bin/:id/edit',
        component: EditBinComponent
      },
      {
        path: 'bin/new',
        component: EditBinComponent
      },
      {
        path: 'bin/:id/history',
        component: HistoryBinComponent
      },
      {
        path: 'pharmacy-notes',
        component: ListPharmacyNoteComponent
      },
      {
        path: 'pharmacy-notes/:id/edit',
        component: EditPharmacyNoteComponent
      },
      {
        path: 'pharmacy-notes/new',
        component: EditPharmacyNoteComponent
      },
      {
        path: 'pharmacy-notes/:id/history',
        component: HistoryPharmacyNoteComponent
      },
      {
        path: 'sachet',
        component: ListSachetComponent
      },
      {
        path: 'sachet/edit',
        component: EditSachetComponent
      },
      {
        path: 'sachet/history',
        component: HistorySachetComponent
      },
      {
        path: 'queue-management',
        component: ListQueueManagementComponent
      },
      {
        path: 'production-management',
        component: ListProductionManagementComponent
      },
      {
        path: 'production-schedule',
        component: ListProductionScheduleComponent
      },
      {
        path: 'price', 
        component: ListPriceComponent
      },
      {
        path: 'price/:id/history', 
        component: HistoryPriceComponent
      },
      {
        path: 'patient', 
        component: ListPatientComponent
      },
      {
        path: 'patient/:id/view',
        component: EditPatientComponent
      },
      {
        path: 'patient/:id/edit',
        component: EditPatientComponent
      },
      {
        path: 'patient/new',
        component: EditPatientComponent
      },
      {
        path: 'patient/:id/history', 
        component: HistoryPatientComponent
      },
      {
        path: 'pack-med-price', 
        component: ListPackMedPriceComponent
      },
      {
        path: 'pack-med-price/:id/view',
        component: EditPackMedPriceComponent
      },
      {
        path: 'pack-med-price/:id/edit',
        component: EditPackMedPriceComponent
      },
      {
        path: 'pack-med-price/new',
        component: EditPackMedPriceComponent
      },
      {
        path: 'pack-med-price/:id/history',
        component: HistoryPackMedPriceComponent
      },
      

     

      
      
    ]
  }
];


@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  providers: []
})
export class MasterDataManagementRoutingModule {
}
