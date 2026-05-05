import {Component, OnInit, AfterViewInit, ViewChild} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {Request} from '../../../shared/services/request.service';
import {Common} from '../../../shared/services/common.service';
import {FormGroup, FormBuilder, FormControl} from '@angular/forms';
import {DxTreeListComponent} from 'devextreme-angular';
import {environment} from '../../../../environments/environment';
import {StoreService} from '../../../shared/services/store.service';

@Component({
    selector: 'app-view-group',
    providers: [Request, Common],
    templateUrl: './view-group.component.html',
})
export class ViewGroupComponent implements OnInit, AfterViewInit {
    @ViewChild('myModal') myModal;
    @ViewChild(DxTreeListComponent) treeList: DxTreeListComponent;
    dataViewGroups = {
        'roleId': '',
        'roleName': '',
        'description': '',
        'menuId': '',
        'createdAt': '',
        'updatedAt': '',
        'deletedAt': '',
        'createdBy': '',
        'updatedBy': '',
    };
    viewGroupForm: FormGroup;
    menuId;
    roleId;
    filterData = {};
    loading = true;
    disbledBtn = {
        'save': true,
        'cancel': true
    };
    microserviceMenuGroup = [];
    microserviceMenuGroupPermission = [];
    selectMenuParentId = [];
    selectMenuId = [];
    menuHome: any = false;
    menuPermissions: any = {view: false, add: false, edit: false, delete: false};

    constructor(
        public router: Router,
        private fb: FormBuilder,
        private request: Request,
        private common: Common,
        private route: ActivatedRoute,
        private store: StoreService,
    ) {
        this.viewGroupForm = this.fb.group({
            'txtGroupName': new FormControl(''),
            'txtDescription': new FormControl(''),
        });
    }

    async ngOnInit() {
        try {
            this.store.subscribePagePermissionList().subscribe(pagePermissionList => {
                console.log('ngOnInit', pagePermissionList);
                const pagePermission = pagePermissionList.find(r => r.url === environment.roleURL.roles);
                if (pagePermission) {
                    try {
                        this.menuPermissions = JSON.parse(pagePermission.menuPermissions);
                    } catch (error) {
                        console.log(error);
                    }
                }
            });
            this.store.subscribeMenu().subscribe((menu: any) => {
                let menuHome = false;
                for (let index = 0; index < menu.length; index++) {
                    const element = menu[index];
                    for (let index2 = 0; index2 < element.menus.length; index2++) {
                        const element2 = element.menus[index2];
                        for (let index3 = 0; index3 < element2.submenus.length; index3++) {
                            const element3 = element2.submenus[index3];
                            if (environment.roleURL.roles === element3.url) {
                                if (!menuHome) {
                                    menuHome = element;
                                }
                                break;
                            }
                        }
                    }
                }
                this.menuHome = menuHome;
            });
        } catch (e) {
            console.log(e);
        }
    }

    goHomeMenu() {
        if (this.menuHome) {
            this.router.navigate(['/menu', this.menuHome['menuId'], this.menuHome['typePage']]);
        }
    }

    async ngAfterViewInit() {
        try {
            await this.route.params.subscribe(params => {
                this.menuId = params.menuId;
                this.roleId = params.roleId;
            });

            await this.getApiView();
            await this.getMicroMenuGroup();
            await this.getMicroMenuGroupPermission();
            await this.textAreaAutoHeight();
            await this.checkGroupPermission();
        } catch (e) {
            console.log(e);
            this.loading = false;
            const resultDescriptionSystemErrorTitle = environment.resultDescriptionSystemErrorTitle;
            const resultDescriptionSystemErrorMassage = environment.resultDescriptionSystemErrorMassage;
            this.goAlert(resultDescriptionSystemErrorTitle, resultDescriptionSystemErrorMassage, 'myModalError');
        }
    }

    async getApiView() {
        try {
            this.loading = true;
            this.disbledBtn = {
                'save': true,
                'cancel': true
            };
            const menuId = this.menuId;
            const roleId = this.roleId;
            const resultCodeSuccess = environment.resultCodeSuccess;
            let filterData = {
                filter: ''
            };
            this.filterData = {
                'menuId': menuId,
                'roleId': roleId
            };
            filterData = {
                filter: JSON.parse(JSON.stringify(this.filterData))
            };
            filterData.filter = JSON.stringify(filterData.filter);
            const checkUrl = this.common.checkMockupUrl('', '', filterData, {
                BASE_API: '',
                BASE_MODULE: environment.apiPrefix,
                BASE_RESOURCE: environment.searchRoles
            });
            const response = await this.request.get(checkUrl.url, checkUrl.filter);
            if (response.resultCode === resultCodeSuccess) {
                this.dataViewGroups = await response.resultData[0];
                console.log(this.dataViewGroups);
            } else {
                this.goAlert(response.resultCode, response.resultDescription, 'myModalError');
            }
            this.loading = false;
            this.disbledBtn = {
                'save': false,
                'cancel': false
            };
        } catch (e) {
            console.log(e);
            this.loading = false;
            this.disbledBtn = {
                'save': false,
                'cancel': false
            };
            const resultDescriptionSystemErrorTitle = environment.resultDescriptionSystemErrorTitle;
            const resultDescriptionSystemErrorMassage = environment.resultDescriptionSystemErrorMassage;
            this.goAlert(resultDescriptionSystemErrorTitle, resultDescriptionSystemErrorMassage, 'myModalError');
        }
    }

    getMicroMenuGroup() {
        const filterDataMicroservice = {
            'menuId': this.menuId,
        };
        const filterData = {
            filter: JSON.stringify(filterDataMicroservice)
        };
        const checkUrl = this.common.checkMockupUrl('', '', filterData, {
            BASE_API: '',
            BASE_MODULE: environment.apiPrefix,
            BASE_RESOURCE: environment.searchSubmenus
        });

        return this.request.get(checkUrl.url, checkUrl.filter)
            .then(response => {
                console.log(response);
                this.loading = false;
                if (response.resultCode === 20000 || response.resultCode === '20000') {
                    this.microserviceMenuGroup = response.resultData;
                    this.microserviceMenuGroup.forEach(r => {
                        r.menuPermissions = {
                            'view': false,
                            'add': false,
                            'edit': false,
                            'delete': false,
                        };
                    });
                }

            });
    }

    getMicroMenuGroupPermission() {
        const filterDataMicroservice = {
            'roleId': this.roleId,
        };
        const filterData = {
            filter: JSON.stringify(filterDataMicroservice)
        };
        const checkUrl = this.common.checkMockupUrl('', '', filterData, {
            BASE_API: '',
            BASE_MODULE: environment.apiPrefix,
            BASE_RESOURCE: environment.searchRoleMenus
        });

        // this.loadData = true;
        return this.request.get(checkUrl.url, checkUrl.filter)
            .then(response => {
                this.loading = false;
                if (response.resultCode === 20000 || response.resultCode === '20000') {
                    this.microserviceMenuGroupPermission = response.resultData;
                }
            });
    }

    checkGroupPermission() {
        console.log(this.microserviceMenuGroup);
        console.log(this.microserviceMenuGroupPermission);
        this.selectMenuParentId = [];
        this.selectMenuId = [];
        this.microserviceMenuGroup.forEach(menu => {
            if (menu.subMenuParentId) {
                this.microserviceMenuGroupPermission.forEach(permission => {
                    if (menu.subMenuId === permission.subMenuId) {
                        permission.menuPermissions = JSON.parse(permission.menuPermissions);
                        console.log(permission.menuPermissions);
                        if (!permission.deletedAt) {
                            this.selectMenuParentId.push(menu.subMenuId);
                        }
                        menu.roleMenuId = permission.roleMenuId;
                        menu.menuPermissions = permission.menuPermissions;
                        menu.selectRow = false;
                    }
                });
                console.log(menu);
                console.log(this.selectMenuParentId);
                console.log(this.selectMenuId);
            }
        });
        console.log(this.microserviceMenuGroup);
    }

    onEditorPreparing(e) {
        console.log(e);
        if (e.row && e.row.data) {
            if (e.dataField === 'subMenuName' && !e.row.data.selectRow) {
                console.log(e.row.data.selectDisabled);
                e.editorOptions.disabled = true;
            }
        }
    }

    goAlert(userTitle, userMessage, modalId) {
        const dataAlert = {
            'modalId': modalId,
            'userTitle': userTitle,
            'userMessage': userMessage
        };
        this.myModal.openModal(dataAlert);
    }

    onClickBack() {
        this.router.navigate(['/roles', this.menuId, 'list-of-groups']);
    }

    onCloseModalError() {
        this.disbledBtn = {
            'save': false,
            'cancel': false
        };
    }

    textAreaAutoHeight() {
        const textAreaAutoHeight = this.common.textAreaAutoHeightFn();
    }

}
