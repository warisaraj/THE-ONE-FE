import {Component, OnInit, AfterViewInit, ViewChild} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {LayoutMenu} from '../../../shared/store/layout.menu.store';
import {Request} from '../../../shared/services/request.service';
import {Common} from '../../../shared/services/common.service';
import {FormGroup, FormBuilder, FormControl, Validators} from '@angular/forms';
import {DxTreeListComponent} from 'devextreme-angular';
import {environment} from '../../../../environments/environment';
import {StoreService} from '../../../shared/services/store.service';

declare let $: any;

@Component({
    selector: 'app-create-group',
    providers: [LayoutMenu, Request, Common],
    templateUrl: './create-group.component.html',
})
export class CreateGroupComponent implements OnInit, AfterViewInit {

    @ViewChild('myModal') myModal;
    @ViewChild(DxTreeListComponent) treeList: DxTreeListComponent;
    addDataGroups = {
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
    addGroupForm: FormGroup;
    allowedPageSizes = environment.allowedPageSizes;
    dxgridPageSize;
    menuId;
    roleId;
    loading = true;
    disbledBtn = {
        'save': true,
        'cancel': true
    };
    microserviceMenuGroup = [];
    currentSelectedRowsData;
    currentSelectedRowsDataKey;
    microserviceName;
    menuHome: any = false;
    menuPermissions: any = {view: false, add: false, edit: false, delete: false};

    constructor(public router: Router,
                private fb: FormBuilder,
                private request: Request,
                public layoutMenu: LayoutMenu,
                private common: Common,
                private route: ActivatedRoute,
                private store: StoreService) {
        this.addGroupForm = this.fb.group({
            'txtGroupId': new FormControl('', [Validators.required]),
            'txtGroupName': new FormControl('', [Validators.required]),
            'txtDescription': new FormControl(''),
        });
    }

    ngOnInit() {
        this.disbledBtn = {
            'save': true,
            'cancel': true
        };
        this.store.subscribePagePermissionList().subscribe(pagePermissionList => {
            console.log('ngOnInit', pagePermissionList);
            const pagePermission = pagePermissionList.find(r => r.url === environment.roleURL.roles);
            if (pagePermission) {
                try {
                    this.menuPermissions = JSON.parse(pagePermission.menuPermissions);
                    console.log(this.menuPermissions)
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
            });
            // for recive microserviceName for group page check  checkbox
            this.microserviceName = sessionStorage.getItem('microserviceName');
            console.log('this.microserviceName', this.microserviceName);
            this.loading = false;
            this.disbledBtn = {
                'save': false,
                'cancel': false
            };
            this.getMicroMenuGroup();
        } catch (e) {
            this.loading = false;
            this.disbledBtn = {
                'save': false,
                'cancel': false
            };
            console.log(e);
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
                if (+response.resultCode === 20000) {
                    this.microserviceMenuGroup = response.resultData;
                    this.microserviceMenuGroup.forEach(r => {
                        console.log(r);
                        r['menuPermissions'] = {
                            'view': false,
                            'add': false,
                            'edit': false,
                            'delete': false,
                        };
                        r['roleMenuId'] = null;

                    });
                    console.log(this.microserviceMenuGroup);
                }

            });
    }

    onSelectionChanged(e) {
        console.log('onSelectionChanged', e);
        const currentDeselectedRowKeys = e.currentDeselectedRowKeys;
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
    }

    onEditorPreparing(e) {
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

    async btnSave() {
        try {
            this.disbledBtn = {
                'save': true,
                'cancel': true
            };
            const requiredName: boolean = this.checkGroupName();
            const resultCodeSuccess = environment.resultCodeSuccess;
            this.roleId = this.common.generateId();
            if (requiredName) {
                const addData = {
                    'menuId': this.menuId,
                    'roleId': this.roleId,
                    'roleName': this.common.trimData(this.addDataGroups.roleName),
                    'description': this.addDataGroups.description,
                };
                const checkUrl = this.common.checkMockupUrl('', '', {}, {
                    BASE_API: '',
                    BASE_MODULE: environment.apiPrefix,
                    BASE_RESOURCE: environment.createRole
                });

                const response = await this.request.post(checkUrl.url, addData);
                const userMessageAlreadyExisted = response.userMessage;
                if (response.resultCode === resultCodeSuccess) {
                    const getSelectedRowsData = this.currentSelectedRowsData;
                    const addDataGroupMenu = [];
                    console.log('getSelectedRowsData', getSelectedRowsData);
                    if (getSelectedRowsData) {
                        getSelectedRowsData.forEach(async r => {
                            addDataGroupMenu.push({
                                'roleMenuId': this.common.generateId(),
                                'roleId': this.roleId,
                                'subMenuId': r.subMenuId,
                                'menuPermissions': r.menuPermissions
                            });
                        });
                    }
                    console.log(addDataGroupMenu);
                    if (addDataGroupMenu && addDataGroupMenu.length > 0) {
                        const checkUrlGroupMenu = this.common.checkMockupUrl('', '', {}, {
                            BASE_API: '',
                            BASE_MODULE: environment.apiPrefix,
                            BASE_RESOURCE: environment.createRoleMenu
                        });
                        const responseGroupMenu = await this.request.post(checkUrlGroupMenu.url, addDataGroupMenu);
                        console.log(responseGroupMenu);
                        if (responseGroupMenu.resultCode === resultCodeSuccess) {
                            this.goAlert('', '', 'myModalSuccess');
                        } else {
                            this.goAlert(response.resultCode, response.resultDescription, 'myModalError');
                        }
                    }
                    this.goAlert('', '', 'myModalSuccess');
                } else {
                    this.goAlert(response.resultCode, response.resultDescription, 'myModalError');
                }
            } else {
                console.log('กรุณากรอกข้อมูลให้ถูกต้อง');
                this.goAlert('Field is required', 'Your have left a field empty and a value must be entered.', 'myModalWarning');
            }
        } catch (e) {
            console.log(e);
            this.disbledBtn = {
                'save': false,
                'cancel': false
            };
        }
    }

    checkGroupName() {
        if (this.common.trimData(this.addDataGroups.roleName) === '') {
            this.addGroupForm.controls['txtGroupName'].setErrors({'forceRequired': true});
            this.addGroupForm.controls['txtGroupName'].markAsDirty();
            return false;
        } else {
            this.addGroupForm.controls['txtGroupName'].updateValueAndValidity();
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
