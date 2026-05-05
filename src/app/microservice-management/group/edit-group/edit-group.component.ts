import {Component, OnInit, AfterViewInit, ViewChild} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {Request} from '../../../shared/services/request.service';
import {Common} from '../../../shared/services/common.service';
import {FormGroup, FormBuilder, FormControl, Validators} from '@angular/forms';
import {DxTreeListComponent} from 'devextreme-angular';
import {environment} from '../../../../environments/environment';
import {CompareService} from '../../../shared/services/compare.service';
import {StoreService} from '../../../shared/services/store.service';

@Component({
    selector: 'app-edit-group',
    providers: [Request, Common, CompareService],
    templateUrl: './edit-group.component.html',
})
export class EditGroupComponent implements OnInit, AfterViewInit {

    @ViewChild('myModal') myModal;
    @ViewChild(DxTreeListComponent) treeList: DxTreeListComponent;
    editDataGroups: any = {
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
    editGroupForm: FormGroup;
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
    editSelectKey = [];
    currentSelectedRowsDataKey;
    currentSelectedRowsData;
    currentDeselectedRowKeys;
    microserviceName;
    menuHome: any = false;
    menuPermissions: any = {view: false, add: false, edit: false, delete: false};

    constructor(public router: Router,
                private fb: FormBuilder,
                private request: Request,
                private common: Common,
                private compare: CompareService,
                private route: ActivatedRoute,
                private store: StoreService) {
        this.editGroupForm = this.fb.group({
            'txtGroupName': new FormControl('', [Validators.required]),
            'txtDescription': new FormControl('', [Validators.required]),
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
            this.microserviceName = sessionStorage.getItem('microserviceName');
            console.log('this.microserviceName', this.microserviceName);
            await this.getApiEdit();
            await this.textAreaAutoHeight();
            await this.getMicroMenuGroupPermission();
            await this.getMicroMenuGroup();
            await this.checkGroupPermission();
        } catch (e) {
            console.log(e);
            const resultDescriptionSystemErrorTitle = environment.resultDescriptionSystemErrorTitle;
            const resultDescriptionSystemErrorMassage = environment.resultDescriptionSystemErrorMassage;
            this.goAlert(resultDescriptionSystemErrorTitle, resultDescriptionSystemErrorMassage, 'myModalError');
        }
    }

    async getApiEdit() {
        try {
            this.loading = true;
            this.disbledBtn = {
                'save': true,
                'cancel': true
            };
            const menuId = this.menuId;
            const roleId = this.roleId;

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
            const resultCodeSuccess = environment.resultCodeSuccess;
            if (response.resultCode === resultCodeSuccess) {
                this.editDataGroups = await response.resultData[0];
                console.log(this.editDataGroups);
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

    async getMicroMenuGroup() {
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

        // this.loadData = true;
        return this.request.get(checkUrl.url, checkUrl.filter)
            .then(response => {
                console.log(response);

                this.loading = false;
                if (+response.resultCode === 20000) {
                    this.microserviceMenuGroup = response.resultData;

                    // select box first
                    this.microserviceMenuGroup.forEach(r => {
                        r['menuPermissions'] = {
                            'view': false,
                            'add': false,
                            'edit': false,
                            'delete': false,
                        };
                        r['roleMenuId'] = null;

                        this.microserviceMenuGroupPermission.forEach(permission => {
                            if (r.subMenuId === permission.subMenuId) {
                                r['menuPermissions'] = JSON.parse(permission.menuPermissions);
                                r['roleMenuId'] = permission.roleMenuId;
                            }

                        });
                    });

                    console.log('r.this.microserviceMenuGroup', this.microserviceMenuGroup);
                    console.log('r.this.microserviceMenuGroupPermission', this.microserviceMenuGroupPermission);
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
                console.log(response);
                this.loading = false;
                if (+response.resultCode === 20000) {
                    this.microserviceMenuGroupPermission = response.resultData;
                }
            });
    }

    checkGroupPermission() {
        console.log('checkGroupPermission1', this.microserviceMenuGroup);
        console.log('checkGroupPermission2', this.microserviceMenuGroupPermission);
        this.selectMenuParentId = [];
        this.selectMenuId = [];

        const parent = this.microserviceMenuGroup.filter(r => !r.subMenuParentId).map(r => r.subMenuId);
        const childPanrenId = this.microserviceMenuGroup.filter(r => r.subMenuParentId).map(r => r.subMenuParentId);

        const parentNotchild = parent.filter(r => {
            return childPanrenId.indexOf(r) === -1;
        });

        console.log(parent, childPanrenId, parentNotchild);
        this.microserviceMenuGroupPermission.forEach(permission => {
            const subMenuId = permission.subMenuId;
            if (parentNotchild.indexOf(subMenuId) > -1) {
                this.selectMenuParentId.push(permission.subMenuId);
            } else if (parent.indexOf(subMenuId) === -1) {
                this.selectMenuParentId.push(permission.subMenuId);
            }
        });

        console.log('selectMenuParentId', this.selectMenuParentId);
        console.log(this.microserviceMenuGroup);
    }

    onSelectionChanged(e) {
        console.log('onSelectionChanged', e);
        const currentDeselectedRowKeys = e.currentDeselectedRowKeys;
        const currentSelectedRowKeys = e.currentSelectedRowKeys;
        const selectedRowsData = e.selectedRowsData;
        this.editSelectKey = e.selectedRowsData; // for disabled
        this.currentDeselectedRowKeys = currentDeselectedRowKeys; // for disabled
        this.currentSelectedRowsDataKey = this.treeList.instance.getSelectedRowKeys('all');
        this.currentSelectedRowsData = this.treeList.instance.getSelectedRowsData('all');

        // if data clear select
        if (currentDeselectedRowKeys) {
            currentDeselectedRowKeys.forEach(r => {
                const rowIndex = e.component.getRowIndexByKey(r);
                console.log('rowIndex', rowIndex, this.treeList.instance);
                this.treeList.instance.beginUpdate();
                this.treeList.instance.saveEditData();
                this.treeList.instance.endUpdate();
            });
        }
        console.log('this.treeList.instance', this.treeList.instance);

        // if data select  open edit row select after disabled
        if (this.currentSelectedRowsDataKey) {
            this.currentSelectedRowsDataKey.forEach(r => {
                const rowIndexSelect = e.component.getRowIndexByKey(r);
                this.treeList.instance.editRow(rowIndexSelect);
            });
        }
        // console.log(this.editSelectKey);
    }

    onEditorPreparing(e) {
        // console.log('onEditorPreparing',e);

        const parent = this.microserviceMenuGroup.filter(r => !r.subMenuParentId).map(r => r.subMenuId);
        const childPanrenId = this.microserviceMenuGroup.filter(r => r.subMenuParentId).map(r => r.subMenuParentId);
        const parentNotchild = parent.filter(r => {
            return childPanrenId.indexOf(r) === -1;
        });
        console.log('parentNotchild', parentNotchild);

        // check disabled
        if (e.row && e.row.data) {
            // for microservice === Portal
            if (e.dataField !== 'subMenuName' && (this.microserviceName === 'Portal' || this.microserviceName === 'portal')) {
                e.editorOptions.disabled = true;
                // for microservice !== Portal
            } else if (e.dataField !== 'subMenuName') {

                e.editorOptions.disabled = true;
                if (this.currentSelectedRowsData) {
                    this.currentSelectedRowsData.forEach(r => {
                        if (r.subMenuId === e.row.data.subMenuId && r.subMenuParentId !== null) {
                            console.log('currentSelectedRowKeys');
                            console.log(r);
                            e.editorOptions.disabled = false;
                        }
                    });
                }
            }
        }
        // check nondisabled add parent no child
        if (parentNotchild && parentNotchild.length > 0 && this.microserviceName !== 'Portal' && this.microserviceName !== 'portal') {
            for (let i = 0; i < parentNotchild.length; i++) {
                if ((e.dataField !== 'subMenuName') && (parentNotchild[i] === e.row.data.subMenuId)) {
                    e.editorOptions.disabled = true;
                    if (this.currentSelectedRowsData) {
                        this.currentSelectedRowsData.forEach(r => {
                            if (r.subMenuId === parentNotchild[i] && r.subMenuParentId === null) {
                                e.editorOptions.disabled = false;
                            }
                        });
                    }
                }
            }
        }

    }

    async btnEdit() {
        try {
            this.disbledBtn = {
                'save': true,
                'cancel': true
            };
            const requiredName: boolean = this.checkGroupName();
            if (requiredName) {
                const addData = {
                    'menuId': this.menuId,
                    'roleId': this.roleId,
                    'roleName': this.common.trimData(this.editDataGroups.roleName),
                    'description': this.editDataGroups.description
                };
                const checkUrl = this.common.checkMockupUrl('', '', {}, {
                    BASE_API: '',
                    BASE_MODULE: environment.apiPrefix,
                    BASE_RESOURCE: environment.updateRole
                });
                const response = await this.request.post(checkUrl.url, addData);
                // tslint:disable-next-line:no-shadowed-variable
                const resultCodeSuccess = environment.resultCodeSuccess;
                if (response.resultCode === resultCodeSuccess) {
                    // let getSelectedRowsData = this.currentSelectedRowsData;
                    const getSelectedRowsData = this.treeList.instance.getSelectedRowsData('all');
                    const addDataGroupMenu = [];
                    console.log('getSelectedRowsData', getSelectedRowsData);
                    console.log('this.microserviceMenuGroupPermission', this.microserviceMenuGroupPermission);
                    // check data send to backend
                    // tslint:disable-next-line:max-line-length
                    const compareCodeUpdate = this.compare.getUpdate(this.microserviceMenuGroupPermission, getSelectedRowsData, 'subMenuId');
                    // tslint:disable-next-line:max-line-length
                    const compareCodeInsert = this.compare.getInsert(this.microserviceMenuGroupPermission, getSelectedRowsData, 'subMenuId');
                    // tslint:disable-next-line:max-line-length
                    const compareCodeDeleted = this.compare.getDeleted(this.microserviceMenuGroupPermission, getSelectedRowsData, 'subMenuId');
                    console.log('compareCodeUpdate', compareCodeUpdate);
                    console.log('compareCodeInsert', compareCodeInsert);
                    console.log('compareCodeDeleted', compareCodeDeleted);
                    if (compareCodeUpdate && compareCodeUpdate.length > 0) {
                        compareCodeUpdate.forEach(key => {
                            addDataGroupMenu.push({
                                // tslint:disable-next-line:max-line-length
                                'roleMenuId': key.roleMenuId ? key.roleMenuId : this.common.generateId(),
                                'roleId': this.roleId,
                                'subMenuId': key.subMenuId,
                                'menuPermissions': key.menuPermissions
                            });
                        });
                    }

                    if (compareCodeInsert && compareCodeInsert.length > 0) {
                        compareCodeInsert.forEach(key => {
                            addDataGroupMenu.push({
                                'roleMenuId': this.common.generateId(),
                                'roleId': this.roleId,
                                'subMenuId': key.subMenuId,
                                'menuPermissions': key.menuPermissions
                            });
                        });
                    }

                    if (compareCodeDeleted && compareCodeDeleted.length > 0) {
                        console.log('compareCodeDeleted', compareCodeDeleted);

                        compareCodeDeleted.forEach(async key => {
                            let checkParent = false;
                            for (let i = 0; i < getSelectedRowsData.length; i++) {
                                if (key.subMenuId === getSelectedRowsData[i].subMenuParentId) {
                                    checkParent = true;
                                    break;

                                } else {
                                    checkParent = false;
                                }
                            }
                            console.log('checkParent', checkParent);

                            if (checkParent) {
                                addDataGroupMenu.push({
                                    'roleMenuId': key.roleMenuId ? key.roleMenuId : this.common.generateId(),
                                    'roleId': this.roleId,
                                    'subMenuId': key.subMenuId,
                                    'menuPermissions': JSON.parse(key.menuPermissions)
                                });
                            } else {
                                addDataGroupMenu.push({
                                    'roleMenuId': key.roleMenuId ? key.roleMenuId : this.common.generateId(),
                                    'roleId': this.roleId,
                                    'subMenuId': key.subMenuId,
                                    'menuPermissions': {
                                        'view': false,
                                        'add': false,
                                        'edit': false,
                                        'delete': false,
                                    },
                                    'deletedAt': true
                                });
                            }
                        });
                    }

                    console.log(addDataGroupMenu);
                    if (addDataGroupMenu && addDataGroupMenu.length > 0) {
                        const checkUrlGroupMenu = this.common.checkMockupUrl('', '', {}, {
                            BASE_API: '',
                            BASE_MODULE: environment.apiPrefix,
                            BASE_RESOURCE: environment.updateRoleMenu
                        });
                        const responseGroupMenu = await this.request.post(checkUrlGroupMenu.url, addDataGroupMenu);
                        console.log(responseGroupMenu);
                        if (responseGroupMenu.resultCode === resultCodeSuccess) {
                            this.goAlert('', '', 'myModalSuccess');
                        } else {
                            // this.goAlert(resultDescriptionSystemErrorTitle, resultDescriptionSystemErrorMassage, 'myModalError');
                            this.goAlert(response.resultCode, response.resultDescription, 'myModalError');
                        }
                    }
                    this.goAlert('', '', 'myModalSuccess');
                } else {
                    // this.goAlert(resultDescriptionSystemErrorTitle, resultDescriptionSystemErrorMassage, 'myModalError');
                    this.goAlert(response.resultCode, response.resultDescription, 'myModalError');
                }

            } else {
                console.log('กรุณากรอกข้อมูลให้ถูกต้อง');
                this.goAlert('Field is required', 'Your have left a field empty and a value must be entered.', 'myModalWarning');
                // $(this.modalRequired.nativeElement).modal('show');
            }
        } catch (e) {
            console.log(e);
        }
    }

    checkGroupName() {
        if (this.common.trimData(this.editDataGroups.roleName) === '') {
            this.editGroupForm.controls['txtGroupName'].setErrors({'forceRequired': true});
            this.editGroupForm.controls['txtGroupName'].markAsDirty();
            return false;
        } else {
            this.editGroupForm.controls['txtGroupName'].updateValueAndValidity();
            return true;
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

    onCloseModalWarning() {
        this.disbledBtn = {
            'save': false,
            'cancel': false
        };
    }

    textAreaAutoHeight() {
        const textAreaAutoHeight = this.common.textAreaAutoHeightFn();
    }
}
