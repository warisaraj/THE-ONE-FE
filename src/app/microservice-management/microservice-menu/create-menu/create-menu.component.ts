import {Component, OnInit, AfterViewInit, ViewChild} from '@angular/core';
import {Router} from '@angular/router';
import {LayoutMenu} from '../../../shared/store/layout.menu.store';
import {Request} from '../../../shared/services/request.service';
import {Common} from '../../../shared/services/common.service';
import {FormGroup, FormBuilder, FormControl, Validators} from '@angular/forms';
import {DxTreeListComponent} from 'devextreme-angular';
import {environment} from '../../../../environments/environment';
import {StoreService} from '../../../shared/services/store.service';

declare let $: any;

@Component({
    selector: 'app-create-menu',
    providers: [LayoutMenu, Request, Common],
    templateUrl: './create-menu.component.html',
})
export class CreateMenuComponent implements OnInit, AfterViewInit {
    @ViewChild('myModal') myModal;
    @ViewChild(DxTreeListComponent) gridMenus: DxTreeListComponent;
    addDataMenus = {
        'menuId': '',
        'menuName': '',
        'description': '',
        'menuIcon': '',
        'menus': [{
            'subMenuParentId': null,
            'subMenuId': '',
            'subMenuName': '',
            'url': '',
            'description': '',
            'menuIcon': '',
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
        'url': false,
        'menuIcon': false
    };
    loading = true;
    hoverTootip: any;
    disbledBtn = {
        'save': false,
        'cancel': false
    };
    menuHome: any = false;
    menuPermissions: any = {view: false, add: false, edit: false, delete: false};

    constructor(
        public router: Router,
        private fb: FormBuilder,
        private request: Request,
        public layoutMenu: LayoutMenu,
        private common: Common,
        private store: StoreService,
    ) {
        this.addMenuForm = this.fb.group({
            'txtMicroserviceName': new FormControl('', [Validators.required]),
            'txtDescription': new FormControl(''),
            'txtMenuIcon': new FormControl('', [Validators.required]),
        });
    }

    ngOnInit() {
        this.store.subscribePagePermissionList().subscribe(pagePermissionList => {
            console.log('ngOnInit', pagePermissionList);
            const pagePermission = pagePermissionList.find(r => r.url === environment.roleURL.subMenus);
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
                        if (environment.roleURL.subMenus === element3.url) {
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

    ngAfterViewInit() {
        this.loading = false;
    }

    clickAdd(parentId) {
        console.log(parentId);
        this.gridMenus.instance.expandRow(parentId);
        this.dataMenus.push({
            'subMenuParentId': parentId || null,
            'subMenuId': this.common.generateId(),
            'subMenuName': '',
            'url': '',
            'description': '',
            'menuIcon': '',
            'editor': true,
            'newTap': false,
            'method': 'create'
        });
        this.backupData.poniter = this.dataMenus[this.dataMenus.length - 1];
        this.backupData.data = JSON.parse(JSON.stringify(this.dataMenus[this.dataMenus.length - 1]));
        this.editing = true;
    }

    saveMenu(data) {
        this.checkClickAddNew = true;

        this.checkVarid = {
            'subMenuName': false,
            'url': false,
            'menuIcon': false
        };
        if (
            this.common.trimData(data.subMenuName) === '' ||
            (this.common.trimData(data.subMenuParentId) && this.common.trimData(data.url) === '') ||
            (this.common.trimData(data.menuIcon) === '' && this.common.trimData(data.subMenuParentId))
        ) {
            if (this.common.trimData(data.subMenuParentId)) {
                if (this.common.trimData(data.subMenuName) === '') {
                    this.checkVarid.subMenuName = true;
                } else {
                    this.checkVarid.subMenuName = false;
                }
                if (this.common.trimData(data.url) === '') {
                    this.checkVarid.url = true;
                } else {
                    this.checkVarid.url = false;
                }
                if (this.common.trimData(data.menuIcon) === '') {
                    this.checkVarid.menuIcon = true;
                } else {
                    this.checkVarid.menuIcon = false;
                }
            } else {
                if (this.common.trimData(data.subMenuName) === '') {
                    this.checkVarid.subMenuName = true;
                } else {
                    this.checkVarid.subMenuName = false;
                }
            }
            this.goAlert('Field is required', 'Your have left a field empty and a value must be entered.', 'myModalWarning');
        } else if (this.checkDupData(this.dataMenus)) {
            const userMessageAlreadyExisted = 'Menu Name already existed !';
            const resultDescriptionDataExistedMassage = environment.resultDescriptionDataExistedMassage;
            this.goAlert(userMessageAlreadyExisted, resultDescriptionDataExistedMassage, 'myModalError');
        } else {
            this.checkClickAddNew = false;
            data.editor = false;
            this.editing = false;
            console.log(JSON.stringify(this.dataMenus));
            this.checkVarid = {
                'subMenuName': false,
                'url': false,
                'menuIcon': false
            };
        }
    }

    cancelMenu() {
        console.log('this.backupData: ', this.backupData);
        if (this.common.trimData(this.backupData.data.subMenuName) || this.common.trimData(this.backupData.data.url)) {
            this.backupData.poniter.subMenuParentId = this.backupData.data.subMenuParentId;
            this.backupData.poniter.subMenuId = this.backupData.data.subMenuId;
            this.backupData.poniter.subMenuName = this.common.trimData(this.backupData.data.subMenuName);
            this.backupData.poniter.url = this.common.trimData(this.backupData.data.url);
            this.backupData.poniter.description = this.common.trimData(this.backupData.data.description);
            this.backupData.poniter.method = this.common.trimData(this.backupData.data.method);
            this.backupData.poniter.editor = false;
            this.backupData.poniter.menuIcon = this.common.trimData(this.backupData.data.menuIcon);
            this.backupData.poniter.newTap = this.backupData.data.newTap;
        } else {
            const index = this.getIndexByKey(this.backupData.poniter.subMenuId, this.dataMenus);
            console.log('else index: ', index);
            this.dataMenus = this.dataMenus.filter((r, i) => i !== index);
        }
        this.checkVarid = {
            'subMenuName': false,
            'url': false,
            'menuIcon': false
        };
        this.editing = false;
        this.backupData = {};
    }

    editMenu(data) {
        console.log(data);
        console.log(this.getIndexByKey(data.subMenuId, this.dataMenus));
        const index = this.getIndexByKey(data.subMenuId, this.dataMenus);
        this.dataMenus[index].editor = true;
        this.backupData.poniter = this.dataMenus[index];
        this.backupData.data = JSON.parse(JSON.stringify(this.dataMenus[index]));
        this.editing = true;
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
        this.disbledBtn = {
            'save': true,
            'cancel': true
        };
        const resultDescriptionDeleteDataAtHaveChildTitle = environment.resultDescriptionDeleteDataAtHaveChildTitle;
        this.goAlert(resultDescriptionDeleteDataAtHaveChildTitle, 'You want to delete This data ?', 'myModalDelete');
        this.dataDelete = data;
    }

    delete() {
        console.log('delete');
        this.disbledBtn = {
            'save': false,
            'cancel': false
        };
        const index = this.getIndexByKey(this.dataDelete.subMenuId, this.dataMenus);
        if (this.dataMenus[index].subMenuParentId) {
            this.dataMenus.splice(index, 1);
        } else if (!this.checkChildren(this.dataDelete.subMenuId, this.dataMenus)) {
            this.dataMenus.splice(index, 1);
        } else {
            this.disbledBtn = {
                'save': true,
                'cancel': true
            };
            const resultDescriptionDeleteDataAtHaveChildTitle = environment.resultDescriptionDeleteDataAtHaveChildTitle;
            this.goAlert(resultDescriptionDeleteDataAtHaveChildTitle, 'Please check submenu before delete this menu.', 'myModalDuplicate');
        }
    }

    cellPrepared(e) {
        this.cellPreparedData = e.data;
    }

    onchange() {
        console.log('onchange');
        this.checkVarid = {
            'subMenuName': false,
            'url': false,
            'menuIcon': false
        };
    }

    editorPreparing(e) {
        console.log('editorPreparing', e);
        console.log('editorPreparing', e.row.data);


        this.editorIndex = e.index;
        if (e.dataField === 'Head_ID' && e.row.data.ID === 1) {
            e.cancel = true;
        }
    }

    initNewRow(e) {
        console.log('initNewRow', e);
        this.checkClickAddNew = true;
        e.data.subMenuParentId = null;
    }

    async btnSave() {
        try {
            this.disbledBtn = {
                'save': true,
                'cancel': true
            };
            console.log(this.addDataMenus);
            const requiredName: boolean = this.checkMicroserviceName();
            const resultCodeSuccess = environment.resultCodeSuccess;
            if (requiredName) {
                console.log(this.dataMenus);
                const addData = {
                    'menuId': this.common.generateId(),
                    'menuName': this.common.trimData(this.addDataMenus.menuName),
                    'description': this.addDataMenus.description,
                    'menuIcon': this.addDataMenus.menuIcon,
                    'menus': this.dataMenus
                };
                for (let i = 0; i < addData.menus.length; i++) {
                    addData.menus[i].url = this.common.trimData(addData.menus[i].url);
                    addData.menus[i].subMenuName = this.common.trimData(addData.menus[i].subMenuName);
                    addData.menus[i].method = this.common.trimData(addData.menus[i].method);
                    addData.menus[i].description = this.common.trimData(addData.menus[i].description);
                    addData.menus[i].menuIcon = this.common.trimData(addData.menus[i].menuIcon);
                    addData.menus[i].newTap = !addData.menus[i].newTap ? null : addData.menus[i].newTap;
                    delete addData.menus[i].editor;
                }
                console.log('addData: ', addData);
                const checkUrl = this.common.checkMockupUrl('', '', {}, {
                    BASE_API: '',
                    BASE_MODULE: environment.apiPrefix,
                    BASE_RESOURCE: environment.createMenu
                });
                const response = await this.request.post(checkUrl.url, addData);
                if (response.resultCode === resultCodeSuccess) {
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
        }
    }

    checkMicroserviceName() {
        let res = true;
        if (this.common.trimData(this.addDataMenus.menuName) === '') {
            this.addMenuForm.controls['txtMicroserviceName'].setErrors({'forceRequired': true});
            this.addMenuForm.controls['txtMicroserviceName'].markAsDirty();
            res = false;
        } else {
            this.addMenuForm.controls['txtMicroserviceName'].updateValueAndValidity();

        }

        if (this.common.trimData(this.addDataMenus.menuIcon) === '') {
            this.addMenuForm.controls['txtMenuIcon'].setErrors({'forceRequired': true});
            this.addMenuForm.controls['txtMenuIcon'].markAsDirty();
            res = false;
        } else {
            this.addMenuForm.controls['txtMenuIcon'].updateValueAndValidity();

        }
        return res;
    }

    checkDupData(data) {
        for (let i = 0; i < data.length; i++) {
            console.log('i: ', i);
            for (let j = (i + 1); j < data.length; j++) {
                console.log('j: ', j);
                console.log('data[i]: ', data[i]);
                console.log('data[j]: ', data[j]);
                if (data[i].subMenuName === data[j].subMenuName) {
                    return true;
                }
            }
        }
        return false;
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
        this.router.navigateByUrl('/microservice-menus');
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
        if (e && e.columnIndex === 0) {
            this.hoverTootip = e.data ? e.data.subMenuName : '';
        } else if (e.columnIndex === 1) {
            this.hoverTootip = e.data ? e.data.url : '';
        } else {
            this.hoverTootip = e.data ? e.data.description : '';
        }
    }

}
