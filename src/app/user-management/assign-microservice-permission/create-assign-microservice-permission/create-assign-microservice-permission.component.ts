import {Component, OnInit, AfterViewInit, ViewChild} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {LayoutMenu} from '../../../shared/store/layout.menu.store';
import {Request} from '../../../shared/services/request.service';
import {Common} from '../../../shared/services/common.service';
import {FormGroup, FormBuilder} from '@angular/forms';
import {DxTreeListComponent} from 'devextreme-angular';
import {environment} from '../../../../environments/environment';
import * as moment from 'moment';
import {StoreService} from '../../../shared/services/store.service';

@Component({
    selector: 'app-create-assign-microservice-permission',
    providers: [LayoutMenu, Request, Common],
    templateUrl: './create-assign-microservice-permission.component.html'
})
export class CreateAssignMicroservicePermissionComponent implements OnInit, AfterViewInit {

    @ViewChild('myModal') myModal;

    @ViewChild(DxTreeListComponent) gridMenus: DxTreeListComponent;
    addDataMenus = {
        'menuId': '',
        'menuName': '',
        'description': '',
        'menus': [{
            'subMenuParentId': null,
            'subMenuId': '',
            'subMenuName': '',
            'url': '',
            'description': '',
            'method': 'create'
        }]
    };

    addMenuForm: FormGroup;

    menuId;
    subMenuId;

    dxgridPageSize;
    offset;
    orderby;
    filterData = {};
    subMenuParentId;

    dataMenus = [];
    backupData: any = {};
    editing = false;
    dataDelete: any = {};

    cellPreparedData;
    checkClickAddNew = false;
    editorIndex;
    checkVarid = {
        'subMenuName': false,
        'url': false
    };
    username: '';
    microserviceMenuGroup: any = {};
    userMicroservice = [];
    userMicroserviceMenu = {};
    userMicroserviceGroup = {};
    loading = true;
    disbledBtn = {
        'save': true,
        'cancel': true
    };
    updatedAt: any = null;
    hoverTootip: any;
    menuHome: any = false;
    menuPermissions: any = {view: false, add: false, edit: false, delete: false};

    constructor(
        public router: Router,
        private fb: FormBuilder,
        private request: Request,
        public layoutMenu: LayoutMenu,
        private common: Common,
        private route: ActivatedRoute,
        private store: StoreService,
    ) {
    }

    async ngOnInit() {
        try {
            await this.route.params.subscribe(params => {
                console.log('params: ', params.username);
                this.username = params.username;
                this.getMicroMenuGroup();
                this.getUserPermission(params.username);
                this.disbledBtn = {
                    'save': false,
                    'cancel': false
                };
            });
            this.store.subscribePagePermissionList().subscribe(pagePermissionList => {
                console.log('ngOnInit', pagePermissionList);
                const pagePermission = pagePermissionList.find(r => r.url === environment.roleURL.microservice);
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
                            if (environment.roleURL.microservice === element3.url) {
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
            const resultDescriptionSystemErrorTitle = environment.resultDescriptionSystemErrorTitle;
            const resultDescriptionSystemErrorMassage = environment.resultDescriptionSystemErrorMassage;
            this.goAlert(resultDescriptionSystemErrorTitle, resultDescriptionSystemErrorMassage, 'myModalError');
        }
    }

    goHomeMenu() {
        if (this.menuHome) {
            this.router.navigate(['/menu', this.menuHome['menuId'], this.menuHome['typePage']]);
        }
    }


    ngAfterViewInit() {

    }

    onSelectionChanged(arr, id) {
        console.log('onSelectionChanged', arr, id);
        setTimeout(() => {
        }, 100);
    }

    addMicroserviceAll() {
        if (this.userMicroservice.length == this.microserviceMenuGroup['menu'].length) {
            // this.userMicroservice = this.userMicroservice.filter(r => menuId !== r)
            this.userMicroservice = [];
            this.userMicroserviceMenu = {};
            this.userMicroserviceGroup = {};
        } else {
            this.userMicroservice = this.microserviceMenuGroup['menu'].map(m => m.menuId);
            // this.userMicroservice.push(menuId);
        }
    }


    addMicroservice(menuId) {
        if (this.userMicroservice.indexOf(menuId) > -1) {
            this.userMicroservice = this.userMicroservice.filter(r => menuId !== r);
            this.userMicroserviceMenu[menuId] = [];
            this.userMicroserviceGroup[menuId] = [];
        } else {
            this.userMicroservice.push(menuId);
        }

    }
    getMicroMenuGroup() {
        // tslint:disable-next-line:max-line-length
        const filterData = {fields: 'menuId,menuName,subMenuId,subMenuName,roleId,roleName'};

        const checkUrl = this.common.checkMockupUrl('', '', filterData, {
            BASE_API: '',
            BASE_MODULE: environment.apiPrefix,
            BASE_RESOURCE: environment.rolesSearchRoleMenu
        });

        // this.loadData = true;
        return this.request.get(checkUrl.url, checkUrl.filter)
            .then(response => {
                console.log(response);
                this.loading = false;
                if (response.resultCode === 20000 || response.resultCode === '20000') {
                    this.microserviceMenuGroup = response.resultData;
                }

            });
    }

    getUserPermission(username) {
        const filterData = {
            // tslint:disable-next-line:max-line-length
            fields: 'menuId,menuName,subMenuId,subMenuName,roleId,roleName,subMenuParentId,updatedAt',
            filter: JSON.stringify({username: username})
        };

        const checkUrl = this.common.checkMockupUrl('', '', filterData, {
            BASE_API: '',
            BASE_MODULE: environment.apiPrefix,
            BASE_RESOURCE: environment.searchUserPermission
        });
        return this.request.get(checkUrl.url, checkUrl.filter)
            .then(response => {
                this.loading = false;

                this.updatedAt = response.updatedAt ? moment(response.updatedAt).format('DD/MM/YYYY HH:mm:ss') : null;
                const resultCodeSuccess = environment.resultCodeSuccess;
                const resultCodeDataNotFound = environment.resultCodeDataNotFound;
                const resultDescriptionDataNotFoundTitle = environment.resultDescriptionDataNotFoundTitle;
                const resultDescriptionDataNotFoundMassage = environment.resultDescriptionDataNotFoundMassage;
                const resultCodeDbError = environment.resultCodeDbError;
                const resultDescriptionDbErrorTitle = environment.resultDescriptionDbErrorTitle;
                const resultDescriptionDbErrorMassage = environment.resultDescriptionDbErrorMassage;
                if (response.resultCode === resultCodeSuccess) {
                    this.userMicroservice = [];
                    console.log(response);
                    if (response.resultData && response.resultData.menu) {
                        // tslint:disable-next-line:forin
                        for (const i in response.resultData.menu) {
                            const menu = response.resultData.menu[i];

                            this.userMicroservice.push(menu.menuId);

                            const selfUserMicroserviceMenu = {};
                            // tslint:disable-next-line:max-line-length
                            const parent = menu.subMenu.filter(r => r.subMenuParentId).map(r => r.subMenuParentId);
                            // tslint:disable-next-line:forin
                            for (const j in menu.subMenu) {
                                const subMenu = menu.subMenu[j];
                                if (!selfUserMicroserviceMenu[menu.menuId]) {
                                    selfUserMicroserviceMenu[menu.menuId] = [];
                                }

                                if (parent.indexOf(subMenu.subMenuId) === -1) {
                                    selfUserMicroserviceMenu[menu.menuId].push(subMenu.subMenuId);
                                }
                            }
                            this.userMicroserviceMenu[menu.menuId] = selfUserMicroserviceMenu[menu.menuId];

                            // tslint:disable-next-line:forin
                            for (const j in menu.role) {
                                const role = menu.role[j];
                                if (!this.userMicroserviceGroup[menu.menuId]) {
                                    this.userMicroserviceGroup[menu.menuId] = [];
                                }

                                this.userMicroserviceGroup[menu.menuId].push(role.roleId);
                            }
                        }
                    }
                } else if (response.resultCode === resultCodeDataNotFound) {
                    this.goAlert(resultDescriptionDataNotFoundTitle, resultDescriptionDataNotFoundMassage, 'myModalError');
                } else if (response.resultCode === resultCodeDbError) {
                    this.goAlert(resultDescriptionDbErrorTitle, resultDescriptionDbErrorMassage, 'myModalError');
                } else {
                    this.goAlert(response.resultCode, response.resultDescription, 'myModalError');
                }

            });
    }
    getIndexByKey(key, data) {
        for (let i = 0; i < data.length; i++) {
            if (data[i].subMenuId === key) {
                return i;
            }
        }
        return;
    }

    checkChildren(parentKey, data) {
        for (let i = 0; i < data.length; i++) {
            if (data[i].subMenuParentId === parentKey) {
                return true;
            }
        }
        return;
    }

    confirmDelete(data) {
        this.goAlert('', 'You want to delete This data ?', 'myModalDelete');
        this.dataDelete = data;
    }

    delete() {
        console.log('delete');
        const index = this.getIndexByKey(this.dataDelete.subMenuId, this.dataMenus);
        if (this.dataMenus[index].subMenuParentId) {
            this.dataMenus.splice(index, 1);
        } else if (!this.checkChildren(this.dataDelete.subMenuId, this.dataMenus)) {
            this.dataMenus.splice(index, 1);
        } else {
            this.goAlert('', 'Please check submenu before delete this menu.', 'myModalDuplicate');
        }
    }
    onchange() {
        console.log('onchange');
        this.checkVarid = {
            'subMenuName': false,
            'url': false
        };
    }
    async btnSave() {
        try {
            this.disbledBtn = {
                'save': true,
                'cancel': true
            };
            console.log(this.addDataMenus);
            const resultCodeSuccess = environment.resultCodeSuccess;
            const checkUrl = this.common.checkMockupUrl('', '', {}, {
                BASE_API: '',
                BASE_MODULE: environment.apiPrefix,
                BASE_RESOURCE: environment.createAssignRolePermission

            });
            const menu = [];
            // tslint:disable-next-line:forin
            for (const i in this.userMicroservice) {
                const m = this.userMicroservice[i];
                const role = [];
                if (this.userMicroserviceGroup[m]) {
                    // tslint:disable-next-line:forin
                    for (const j in this.userMicroserviceGroup[m]) {
                        role.push({
                            'roleId': this.userMicroserviceGroup[m][j]
                        });
                    }
                }
                menu.push({
                    'menuId': m,
                    'role': role
                });
            }


            const response = await this.request.post(checkUrl.url, {'username': this.username, menu: menu});
            if (response.resultCode === resultCodeSuccess) {
                this.goAlert('', '', 'myModalSuccess');
                this.disbledBtn = {
                    'save': true,
                    'cancel': true
                };
            } else {
                this.goAlert(response.resultCode, response.resultDescription, 'myModalError');
            }
        } catch (e) {
            console.log(e);
            this.disbledBtn = {
                'save': false,
                'cancel': false
            };
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
        console.log('onClickBack');
        this.router.navigateByUrl('/assign-microservice-permission');
    }

    onCancelDelete() {
        this.disbledBtn = {
            'save': false,
            'cancel': false
        };
    }

    onCancelViewWarning() {
        console.log('onCancelViewWarning');
    }

    onCloseModalError() {
        this.disbledBtn = {
            'save': false,
            'cancel': false
        };
    }

    onCloseModalWarning() {
        this.disbledBtn = {
            'save': false,
            'cancel': false
        };
    }

    textAreaAutoHeight() {
        const textAreaAutoHeight = this.common.textAreaAutoHeightFn();
    }

    onCellHoverChanged(e) {
        // console.log(e.value);
        this.hoverTootip = e.value;
    }
}
