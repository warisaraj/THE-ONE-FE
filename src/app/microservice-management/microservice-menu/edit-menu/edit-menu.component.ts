import {Component, OnInit, AfterViewInit, ViewChild} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {LayoutMenu} from '../../../shared/store/layout.menu.store';
import {Request} from '../../../shared/services/request.service';
import {Common} from '../../../shared/services/common.service';
import {FormGroup, FormBuilder, FormControl, Validators} from '@angular/forms';
import {DxTreeListComponent} from 'devextreme-angular';
import {environment} from '../../../../environments/environment';
import {StoreService} from '../../../shared/services/store.service';

@Component({
    selector: 'app-edit-menu',
    providers: [LayoutMenu, Request, Common],
    templateUrl: './edit-menu.component.html'
})
export class EditMenuComponent implements OnInit, AfterViewInit {
    @ViewChild('myModal') myModal;
    @ViewChild(DxTreeListComponent) gridMenus: DxTreeListComponent;

    dataEditMenus = {};
    getDataMenus = [];
    ng = [];
    dataMenus: any = {};
    backupData: any = {};
    editing = false;
    dataDelete: any = {};

    checkVarid = {
        'subMenuName': false,
        'url': false,
        'menuIcon': false
    };

    checkClickAddNew = false;
    editMenuForm: FormGroup;
    menuId;
    dxgridPageSize;
    offset;
    limits;
    orderby;
    numMenus = 0;
    dataResultItems = 0;
    loadData = false;
    fieldsMenusList;
    checkClickSearch = false;
    filterData = {};
    resResultCode;
    inputSearchApi = '';
    dataMicroServices;
    getDataMicroserviceName;
    getDataMicroserviceDescription;
    getDataMicroserviceMenuIcon;
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
        private route: ActivatedRoute,
        private store: StoreService,
    ) {
        this.editMenuForm = this.fb.group({
            'txtMicroserviceName': new FormControl('', [Validators.required]),
            'txtDescription': new FormControl(''),
            'txtMenuIcon': new FormControl('', [Validators.required]),
        });
    }

    async ngOnInit() {

        try {
            await this.route.params.subscribe(params => {
                this.menuId = params.menuId;
            });
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

            await this.getMicroservice();
            await this.getMenus();

            await this.textAreaAutoHeight();
            console.log('this.dataMenus: ', this.dataMenus);
            console.log('re dataMenus');
            const data = JSON.parse(JSON.stringify(this.dataMenus));
            this.dataMenus = [];
            this.dataMenus = data;
            console.log('eng ngOnInit');
            // this.dataGroups =   await this.customStore();
            // this.gridMenus.instance.onRowUpdating();
            this.loading = false;
        } catch (e) {
            console.log(e);
            this.loading = false;
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


    async ngAfterViewInit() {
    }

    async getMicroservice() {
        try {

            const menuId = this.menuId;
            let filterData = {
                filter: ''
            };

            this.filterData = {
                'menuId': menuId,
            };

            filterData = {
                filter: JSON.parse(JSON.stringify(this.filterData))
            };

            filterData.filter = JSON.stringify(filterData.filter);

            const checkUrl = this.common.checkMockupUrl('', '', filterData, {
                BASE_API: '',
                BASE_MODULE: environment.apiPrefix,
                BASE_RESOURCE: environment.searchMenus
            });

            const response = await this.request.get(checkUrl.url, checkUrl.filter);
            const resultCodeSuccess = environment.resultCodeSuccess;
            if (response.resultCode === resultCodeSuccess) {
                this.dataMicroServices = await response.resultData[0];
                this.getDataMicroserviceName = await this.dataMicroServices.menuName;
                this.getDataMicroserviceDescription = await this.dataMicroServices.description;
                this.getDataMicroserviceMenuIcon = await this.dataMicroServices.menuIcon;
                console.log(this.dataMicroServices);

            } else {
                this.goAlert(response.resultCode, response.resultDescription, 'myModalError');
            }
        } catch (e) {
            console.log(e);
            this.loading = false;
            const resultDescriptionSystemErrorTitle = environment.resultDescriptionSystemErrorTitle;
            const resultDescriptionSystemErrorMassage = environment.resultDescriptionSystemErrorMassage;
            this.goAlert(resultDescriptionSystemErrorTitle, resultDescriptionSystemErrorMassage, 'myModalError');
        }
    }

    getMenus() {
        let filterData = {
            fields: '',
            filter: ''
        };

        console.log(this.menuId);
        console.log(this.inputSearchApi);
        console.log('else');
        this.filterData = {
            'menuId': this.menuId,
        };

        if (this.checkClickSearch === true) {
            filterData = {
                fields: this.fieldsMenusList,
                filter: JSON.parse(JSON.stringify(this.filterData))
            };
        } else {
            filterData = {
                fields: this.fieldsMenusList,
                filter: JSON.parse(JSON.stringify(this.filterData))
            };
        }

        filterData.filter = JSON.stringify(filterData.filter);

        const checkUrl = this.common.checkMockupUrl('', '', filterData, {
            BASE_API: '',
            BASE_MODULE: environment.apiPrefix,
            BASE_RESOURCE: environment.searchSubmenus
        });
        return this.request.get(checkUrl.url, checkUrl.filter)
            .then(response => {
                console.log(response);
                this.resResultCode = response.resultCode;
                const resultCodeSuccess = environment.resultCodeSuccess;
                const resultCodeDataNotFound = environment.resultCodeDataNotFound;
                const resultDescriptionDataNotFoundTitle = environment.resultDescriptionDataNotFoundTitle;
                const resultDescriptionDataNotFoundMassage = environment.resultDescriptionDataNotFoundMassage;
                const resultDescriptionSystemErrorTitle = environment.resultDescriptionSystemErrorTitle;
                const resultDescriptionSystemErrorMassage = environment.resultDescriptionSystemErrorMassage;
                if (+this.resResultCode === +resultCodeSuccess) {
                    this.getDataMenus = response.resultData;
                    console.log('this.getDataMenus: ', this.getDataMenus);
                    this.numMenus = response.rowCount;
                } else if (+this.resResultCode === +resultCodeDataNotFound) {
                    this.dataEditMenus = {};
                    this.getDataMenus = [];
                    this.numMenus = 0;
                    this.goAlert(resultDescriptionDataNotFoundTitle, resultDescriptionDataNotFoundMassage, 'myModalError');
                } else {
                    this.dataEditMenus = {};
                    this.getDataMenus = [];
                    this.numMenus = 0;
                    this.goAlert(resultDescriptionSystemErrorTitle, resultDescriptionSystemErrorMassage, 'myModalError');
                }


                for (let i = 0; i < this.getDataMenus.length; i++) {
                    this.getDataMenus[i] = {
                        'subMenuParentId': this.getDataMenus[i].subMenuParentId,
                        'subMenuId': this.getDataMenus[i].subMenuId,
                        'subMenuName': this.common.trimData(this.getDataMenus[i].subMenuName),
                        'url': this.getDataMenus[i].url,
                        'description': this.getDataMenus[i].description,
                        'editor': false,
                        'menuIcon': this.getDataMenus[i].menuIcon,
                        'newTap': this.getDataMenus[i].newTap,
                    };
                }
                this.getDataMenus = JSON.parse(JSON.stringify(this.getDataMenus));
                this.dataMenus = JSON.parse(JSON.stringify(this.getDataMenus));
                console.log('aff set this.getDataMenus: ', this.getDataMenus);
                console.log('aff set this.dataMenus: ', this.dataMenus);
                this.loading = false;

            })
            .catch(error => {
                setTimeout(() => {
                    this.loadData = false;
                }, 200);
                this.loading = false;

            });
    }

    cellPrepared(e) {
        if (e.column.command === 'edit') {
            const addLink = e.cellElement.querySelector('.dx-link-add');
            if (addLink) {
                addLink.remove();
            }
        }
    }

    editorPreparing(e) {
        // if(e.dataField === "Head_ID" && e.row.data.ID === 1) {
        //   e.cancel = true;
        // }
    }

    initNewRow(e) {
        e.data.subMenuParentId = 1;
    }

    clickAdd(parentId) {
        // this.checkClickAddNew = true;
        console.log('chickAdd this.dataMenus: ', this.dataMenus);
        console.log(parentId);
        this.gridMenus.instance.expandRow(parentId);


        this.dataMenus.push({
            'subMenuParentId': parentId || null,
            'subMenuId': this.common.generateId(),
            'subMenuName': '',
            'url': '',
            'description': '',
            'editor': true,
            'menuIcon': '',
            'newTap': false,
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
        if (this.backupData.data.subMenuName || this.backupData.data.url) {
            this.backupData.poniter.subMenuParentId = this.backupData.data.subMenuParentId;
            this.backupData.poniter.subMenuId = this.backupData.data.subMenuId;
            this.backupData.poniter.subMenuName = this.common.trimData(this.backupData.data.subMenuName);
            this.backupData.poniter.url = this.backupData.data.url;
            this.backupData.poniter.description = this.backupData.data.description;
            this.backupData.poniter.method = this.backupData.data.method;
            this.backupData.poniter.editor = false;
            this.backupData.poniter.menuIcon = this.backupData.data.menuIcon;
            this.backupData.poniter.newTap = this.backupData.data.newTap;

        } else {
            console.log('this.dataMenus', this.dataMenus);

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
        this.disbledBtn = {
            'save': false,
            'cancel': false
        };
        console.log('delete');
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

    async btnEdit() {
        try {
            this.disbledBtn = {
                'save': true,
                'cancel': true
            };
            const requiredName: boolean = this.checkMicroserviceName();
            const resultCodeSuccess = environment.resultCodeSuccess;
            if (requiredName) {
                const data = await this.compareData(this.getDataMenus, this.dataMenus);
                console.log('data: ', data);
                const editData = {
                    menuId: this.menuId,
                    menuName: this.common.trimData(this.getDataMicroserviceName),
                    description: this.getDataMicroserviceDescription,
                    menuIcon: this.getDataMicroserviceMenuIcon,
                    menus: data,
                };
                console.log('editData: ', editData);

                for (let i = 0; i < editData.menus.length; i++) {
                    editData.menus[i].url = this.common.trimData(editData.menus[i].url);
                    editData.menus[i].subMenuName = this.common.trimData(editData.menus[i].subMenuName);
                    editData.menus[i].method = this.common.trimData(editData.menus[i].method);
                    editData.menus[i].description = this.common.trimData(editData.menus[i].description);
                    editData.menus[i].menuIcon = this.common.trimData(editData.menus[i].menuIcon);
                    editData.menus[i].newTap = !editData.menus[i].newTap ? null : editData.menus[i].newTap;
                    delete editData.menus[i].editor;
                }
                const checkUrl = this.common.checkMockupUrl('', '', {}, {
                    BASE_API: '',
                    BASE_MODULE: environment.apiPrefix,
                    BASE_RESOURCE: environment.updateMenu
                });
                const response = await this.request.post(checkUrl.url, editData);
                const userMessageAlreadyExisted = response.userMessage;
                if (response.resultCode === resultCodeSuccess) {
                    this.goAlert('', '', 'myModalEditSuccess');
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

    compareData(befData, affData) {
        console.log('compareData');
        console.log('befData: ', befData);
        console.log('affData: ', affData);
        if (JSON.stringify(befData) === JSON.stringify(affData)) {
            console.log('compare If');
            return [];
        } else {
            const _befData = JSON.parse(JSON.stringify(befData));
            const _affData = JSON.parse(JSON.stringify(affData));
            const retunrData = [];
            const updateId = [];
            for (let i = 0; i < _affData.length; i++) {
                for (let j = 0; j < _befData.length; j++) {
                    if (JSON.stringify(_affData[i]) === JSON.stringify(_befData[j])) {
                        _affData.splice(i--, 1);
                        _befData.splice(j, 1);
                        break;
                    } else if (_affData[i].subMenuName === _befData[j].subMenuName) {
                        updateId.push(_affData[i].subMenuId + '|' + _befData[j].subMenuId);
                        retunrData.push({
                            subMenuParentId: this.checkParentId(updateId, _affData[i].subMenuParentId),
                            subMenuId: _befData[j].subMenuId,
                            subMenuName: this.common.trimData(_affData[i].subMenuName),
                            url: _affData[i].url,
                            description: _affData[i].description,
                            method: 'update',
                            menuIcon: _affData[i].menuIcon,
                            newTap: !_affData[i].newTap ? 'default' : _affData[i].newTap
                        });
                        _affData.splice(i--, 1);
                        _befData.splice(j, 1);
                        break;
                    } else if (_affData[i].subMenuId === _befData[j].subMenuId) {
                        retunrData.push({
                            subMenuParentId: this.checkParentId(updateId, _affData[i].subMenuParentId),
                            subMenuId: _befData[j].subMenuId,
                            subMenuName: this.common.trimData(_affData[i].subMenuName),
                            url: _affData[i].url,
                            description: _affData[i].description,
                            method: 'update',
                            menuIcon: _affData[i].menuIcon,
                            newTap: !_affData[i].newTap ? 'default' : _affData[i].newTap
                        });
                        _affData.splice(i--, 1);
                        _befData.splice(j, 1);
                        break;
                    }
                }
            }
            for (let i = 0; i < _affData.length; i++) {
                retunrData.push({
                    subMenuParentId: this.checkParentId(updateId, _affData[i].subMenuParentId),
                    subMenuId: _affData[i].subMenuId,
                    subMenuName: this.common.trimData(_affData[i].subMenuName),
                    url: _affData[i].url,
                    description: _affData[i].description,
                    method: 'create',
                    menuIcon: _affData[i].menuIcon,
                    newTap: _affData[i].newTap
                });
            }
            for (let i = 0; i < _befData.length; i++) {
                retunrData.push({
                    subMenuParentId: _befData[i].subMenuParentId,
                    subMenuId: _befData[i].subMenuId,
                    subMenuName: this.common.trimData(_befData[i].subMenuName),
                    url: _befData[i].url,
                    description: _befData[i].description,
                    method: 'delete',
                    menuIcon: _befData[i].menuIcon,
                    newTap: _befData[i].newTap
                });
            }
            return retunrData;
        }
    }


    checkMicroserviceName() {
        let res = true;
        if (this.common.trimData(this.getDataMicroserviceName) === '') {
            this.editMenuForm.controls['txtMicroserviceName'].setErrors({'forceRequired': true});
            this.editMenuForm.controls['txtMicroserviceName'].markAsDirty();
            // return false;
            res = false;
        } else {
            this.editMenuForm.controls['txtMicroserviceName'].updateValueAndValidity();
        }
        if (this.common.trimData(this.getDataMicroserviceMenuIcon) === '') {
            this.editMenuForm.controls['txtMenuIcon'].setErrors({'forceRequired': true});
            this.editMenuForm.controls['txtMenuIcon'].markAsDirty();
            res = false;
        } else {
            this.editMenuForm.controls['txtMenuIcon'].updateValueAndValidity();
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

    checkParentId(arrayData, parentId) {
        for (let i = 0; i < arrayData.length; i++) {
            if (arrayData[i].indexOf(parentId) > -1) {
                return arrayData[i].split('|')[1];
            }
        }
        return parentId;
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
