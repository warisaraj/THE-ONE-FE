import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { LayoutMenu } from '../../../shared/store/layout.menu.store';
import { Request } from '../../../shared/services/request.service';
import { Common } from '../../../shared/services/common.service';
import { FormBuilder } from '@angular/forms';
import { DxDataGridComponent } from 'devextreme-angular';
import { environment } from '../../../../environments/environment';
import CustomStore from 'devextreme/data/custom_store';
import { StoreService } from '../../../shared/services/store.service';

@Component({
    selector: 'app-list-user',
    providers: [LayoutMenu, Request, Common],
    templateUrl: './list-user.component.html',
})
export class ListUserComponent implements OnInit, AfterViewInit {
    @ViewChild('myModal') myModal;
    @ViewChild(DxDataGridComponent) gridUsers: DxDataGridComponent;

    dataUsers = {};
    dataDataUsers = [];

    dxgridPageSize;
    allowedPageSizes = environment.allowedPageSizes;
    offset;
    limits;
    orderby;
    textTotal = ' Search Results 0 of 0 Item';
    numUser = 0;
    dataResultItems = 0;
    loadData = false;
    fieldsUsersList;
    checkClickSearch = false;
    txtInputSearch;
    filterData: any = {};
    filterStore: any = {}
    resResultCode;
    remotePaging;
    getIdDelete;
    loading = true;
    hoverTootip: any;
    disbledBtn = {
        'create': false
    };
    positionList: any = [];
    menuHome: any = false;
    menuPermissions: any = { view: false, add: false, edit: false, delete: false };
    changeSize = false
    pageIndex = 0

    constructor(public router: Router,
        private fb: FormBuilder,
        private request: Request,
        public layoutMenu: LayoutMenu,
        public common: Common,
        private store: StoreService,) {
        this.dxgridPageSize = environment.dxgridPageSize;
        this.fieldsUsersList = environment.fieldsUsersList;

        this.remotePaging = {
            limit: 10,
            first: 0,
            jsonFirst: '',
            offset: 1,
            page: 1,
            pageIdex: 0,
            orderBy: 'updatedAt|ASC',
            fields: '',
        };
    }

    async ngOnInit() {
        const dropdown = await this.common.searchConfig();
        this.positionList = dropdown.positionList || [];
        this.store.subscribePagePermissionList().subscribe(pagePermissionList => {
            console.log('ngOnInit', pagePermissionList);
            const pagePermission = pagePermissionList.find(r => r.url === environment.roleURL.user);
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
                        if (environment.roleURL.user === element3.url) {
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
            this.dataUsers = await this.customStore();

        } catch (e) {
            console.log(e);
            const resultDescriptionSystemErrorTitle = environment.resultDescriptionSystemErrorTitle;
            const resultDescriptionSystemErrorMassage = environment.resultDescriptionSystemErrorMassage;
            this.goAlert(resultDescriptionSystemErrorTitle, resultDescriptionSystemErrorMassage, 'myModalError');
        }
    }

    async clickSearch() {
        try {
            this.checkClickSearch = true;
            this.loadData = false;
            this.gridUsers.instance.clearSorting();
            this.gridUsers.instance.refresh();
            this.gridUsers.instance.pageIndex(0);
            this.gridUsers.instance.columnOption(7, 'sortOrder', 'desc');
        } catch (e) {
            console.log(e);
        }
    }

    async clickClear() {
        try {
            this.txtInputSearch = undefined;
            this.filterData = {};
            this.checkClickSearch = false;
            this.loadData = false;
            this.gridUsers.instance.refresh();
            this.gridUsers.instance.clearSorting();
            this.gridUsers.instance.refresh();
            this.gridUsers.instance.pageSize(10);
            this.gridUsers.instance.pageIndex(0);
            this.gridUsers.instance.columnOption(7, 'sortOrder', 'desc');
        } catch (e) {
            console.log(e);
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

    changePageIndex(e: any) {
        if (e.fullName === "paging.pageIndex") {
            this.pageIndex = e.value
            let page = e.value + 1
            let offset = e.value * this.gridUsers.instance.pageSize()
            let limits = this.gridUsers.instance.pageSize()
            if ((((offset / limits) + 1) * limits) > this.numUser) {
                this.dataResultItems = (this.pageIndex) * limits + this.dataDataUsers.length;
            } else {
                this.dataResultItems = limits * (page);
            }
            this.textTotal = 'Search Results ' + (offset + 1) + ' - ' + this.dataResultItems + ' of ' + this.numUser + ' Items';
            this.gridUsers.instance.refresh();
        }

        if (e.fullName === "paging.pageSize") {
            this.changeSize = true;
            let page = 1
            let offset = 0
            let limits = e.value
            if ((((offset / limits) + 1) * limits) > this.numUser) {
                this.dataResultItems = (offset) * limits + this.dataDataUsers.length;
            } else {
                this.dataResultItems = limits * page;
            }
            this.textTotal = 'Search Results ' + (offset + 1) + ' - ' + this.dataResultItems + ' of ' + this.numUser + ' Items';
        }
    }

    customStore() {
        const dataSource: any = {};
        this.loadData = false;
        let backData: any = [];
        let backItemTotal = 0;

        dataSource.store = new CustomStore({
            load: (loadOptions) => {
                if (!this.loadData) {
                    console.log('loadOption : ', loadOptions);
                    // check sort if no no get api and sort no
                    if (loadOptions.sort !== null && (this.offset === loadOptions.skip && this.limits === loadOptions.take)) {
                        this.orderby = loadOptions.sort[0].selector;
                    }
                    // ดักให้ทำงานเฉพาะกรณีกด Paging / Sorting เท่านั้นกรณีอื่นจะทำให้ Datagrid พัง
                    if (this.common.checkLoadOptions(loadOptions) === false) {
                        return Promise.resolve({
                            data: backData.reverse(),
                            totalCount: backItemTotal
                        });
                    }
                    if (this.changeSize) {
                        this.offset = 0
                    } else {
                        this.offset = loadOptions.skip;
                    }
                    this.limits = loadOptions.take;
                    this.orderby = loadOptions.sort;

                    let filterData: any = {};
                    if (JSON.stringify(this.filterData) === '{}') {
                        filterData = {};
                    } else {
                        const data = JSON.parse(JSON.stringify(this.filterData));
                        filterData = {};
                        for (const key in data) {
                            if (data[key]) {
                                filterData[key] = this.common.trimData(data[key]);
                            }
                        }
                    }

                    const isChange = this.common.checkFilter(filterData, this.filterStore, this.offset)
                    if (isChange) {
                        this.checkClickSearch = true
                        this.clickSearch()
                        return
                    }
                    this.filterStore = JSON.stringify(filterData);
                    if (this.checkClickSearch === true) {
                        filterData = {
                            fields: this.fieldsUsersList,
                            filter: JSON.parse(JSON.stringify(filterData)),
                            offset: 0,
                            limit: this.limits,
                            orderby: loadOptions.sort[0].selector
                        };
                    } else {
                        filterData = {
                            fields: this.fieldsUsersList,
                            filter: JSON.parse(JSON.stringify(filterData)),
                            offset: this.offset,
                            limit: this.limits,
                            orderby: loadOptions.sort[0].selector
                        };
                    }
                    this.checkClickSearch = false;
                    filterData.filter = JSON.stringify(filterData.filter);
                    const checkUrl = this.common.checkMockupUrl('', '', filterData, {
                        BASE_API: '',
                        BASE_MODULE: environment.apiPrefix,
                        BASE_RESOURCE: environment.searchUsers
                    });
                    if (loadOptions.sort !== null) {
                        if (loadOptions.sort[0].desc) {
                            this.remotePaging.orderBy += '|DESC';
                            checkUrl.filter.orderby += '|DESC';
                        } else {
                            this.remotePaging.orderBy += '|ASC';
                            checkUrl.filter.orderby += '|ASC';
                        }
                    }
                    this.loadData = true;
                    return this.request.get(checkUrl.url, checkUrl.filter)
                        .then(response => {
                            console.log(response);
                            setTimeout(() => {
                                this.loadData = false;
                            }, 200);
                            this.resResultCode = response.resultCode;
                            const resultCodeSuccess = environment.resultCodeSuccess;
                            if (this.resResultCode === resultCodeSuccess) {
                                this.dataDataUsers = response.resultData;
                                // click row view description
                                for (let i = 0; i < this.dataDataUsers.length; i++) {
                                    // tslint:disable-next-line:max-line-length
                                    this.dataDataUsers[i].updatedAt = this.common.convertDate(this.dataDataUsers[i].updatedAt, 'DD/MM/YYYY HH:mm:ss');
                                }

                                // num numUser Search Results 0 of 0 Items
                                this.numUser = response.rowCount;
                                if (this.numUser !== 0) {
                                    const page = ((this.offset / this.limits) + 1);
                                    this.textTotal = ' Search Results 0 of 0 Item';
                                    if ((((this.offset / this.limits) + 2) * this.limits) > this.numUser) {
                                        this.dataResultItems = (page - 1) * this.limits + this.dataDataUsers.length;
                                    } else {
                                        this.dataResultItems = this.limits * page;
                                    }
                                    // tslint:disable-next-line:max-line-length
                                    this.textTotal = 'Search Results ' + (this.offset + 1) + ' - ' + this.dataResultItems + ' of ' + this.numUser + ' Items';
                                } else {
                                    this.loading = false;
                                    this.dataUsers = {};
                                    this.dataDataUsers = [];
                                    this.numUser = 0;
                                    this.textTotal = ' Search Results 0 of 0 Item';
                                }

                                this.loading = false;
                            } else {
                                this.loading = false;
                                this.dataUsers = {};
                                this.dataDataUsers = [];
                                this.numUser = 0;
                                this.textTotal = ' Search Results 0 of 0 Item';
                                this.goAlert(response.resultCode, response.resultDescription, 'myModalError');
                            }

                            backData = this.dataDataUsers;
                            backItemTotal = this.numUser;

                            return {
                                data: this.dataDataUsers,
                                totalCount: this.numUser
                            };
                        })
                        .catch(error => {
                            setTimeout(() => {
                                this.loadData = false;
                            }, 200);
                            return {
                                data: [],
                                totalCount: this.numUser
                            };
                        });

                } else {
                    console.log('Promise');
                    return Promise.resolve({
                        data: backData,
                        totalCount: backItemTotal
                    });
                }
            }
        });
        console.log(dataSource);
        return dataSource;
    }

    // show modal delete
    confirmDelete(id) {
        console.log(id);
        this.getIdDelete = id;
        this.disbledBtn = {
            'create': true
        };
        this.goAlert('', '', 'myModalDelete');
    }

    async onOkDelete() {
        try {
            this.disbledBtn = {
                'create': true
            };
            const url = environment.apiPrefix + environment.deleteUser;
            const data = {
                'username': this.getIdDelete
            };
            const resultCodeSuccess = environment.resultCodeSuccess;
            const response = await this.request.post(url, data);
            if (response.resultCode === resultCodeSuccess) {
                this.goAlert('', '', 'myModalSuccessDelete');
                this.dataUsers = this.customStore();
            } else {
                console.log('error');
                this.goAlert(response.resultCode, response.resultDescription, 'myModalError');
            }
        } catch (e) {
            console.log(e);
            this.disbledBtn = {
                'create': false
            };
        }
    }

    onCancelDelete() {
        this.disbledBtn = {
            'create': false
        };
    }

    onCancelViewWarning() {
        console.log('onCancelViewWarning');
    }

    onCellPrepared(e) {
        e.cellElement.accessKey = e.column.caption;
    }

    onCloseModalError() {
        this.disbledBtn = {
            'create': false
        };
    }

    onCloseModalWarning() {
        this.disbledBtn = {
            'create': false
        };
    }

    onClickBack() {
        this.disbledBtn = {
            'create': false
        };
    }

    clickCollapse() {
        const collapse = this.common.collapseFn();
    }

    onCellHoverChanged(e) {
        // console.log(e.value);
        this.hoverTootip = e.value;
    }
}
