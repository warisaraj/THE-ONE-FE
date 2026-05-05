import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {ListUserComponent} from './list-user/list-user.component';
import {ViewCreateEditUserComponent} from './view-create-edit-user/view-create-edit-user.component';

const routes: Routes = [
    {
        path: '',
        data: {
            title: 'user'
        },
        children: [
            {
                path: '',
                component: ListUserComponent
            },
            {
                path: ':action',
                component: ViewCreateEditUserComponent
            },
            {
                path: ':username/:action',
                component: ViewCreateEditUserComponent
            }
        ]
    }
];


@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
    providers: []
})
export class UserRoutingModule {
    constructor() {
        console.log('UserRoutingModule');
    }
}
