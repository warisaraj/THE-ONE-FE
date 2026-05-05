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
    selector: 'app-list-menu',
    providers: [LayoutMenu, Request, Common],
    templateUrl: './list-menu.component.html',
})
export class ListMenuComponent implements OnInit, AfterViewInit {
    @ViewChild('myModal') myModal;
    @ViewChild(DxDataGridComponent) gridMicroservices: DxDataGridComponent;

    dataMicroservices = {};
    getDataMicroservices = [];

    dxgridPageSize;
    allowedPageSizes = environment.allowedPageSizes;
    offset;
    limits;
    orderby;
    textTotal = ' Search Results 0 of 0 Item';
    numMenu = 0;
    dataResultItems = 0;
    loadData = false;
    fieldsMicroservicesList;
    checkClickSearch = false;
    filterData = {};
    filterStore: any = {}
    txtInputSearch;
    resResultCode;
    remotePaging;
    getIdDelete;
    loading = true;
    hoverTootip: any;
    disbledBtn = {
        'create': false
    };
    menuHome: any = false;
    menuPermissions: any = { view: false, add: false, edit: false, delete: false };
    changeSize = false
    pageIndex = 0

    constructor(public router: Router,
        private fb: FormBuilder,
        private request: Request,
        public layoutMenu: LayoutMenu,
        private common: Common,
        private store: StoreService) {
        this.dxgridPageSize = environment.dxgridPageSize;
        this.fieldsMicroservicesList = environment.fieldsMicroservicesList;

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

    async ngAfterViewInit() {
        try {
            this.dataMicroservices = await this.customStore();
        } catch (e) {
            console.log(e);
        }
    }

    async clickSearch() {
        try {
            console.log(this.txtInputSearch);
            this.checkClickSearch = true;
            this.loadData = false;
            this.gridMicroservices.instance.clearSorting();
            this.gridMicroservices.instance.refresh();
            this.gridMicroservices.instance.pageIndex(0);
            this.gridMicroservices.instance.columnOption(2, 'sortOrder', 'desc');
        } catch (e) {
            console.log(e);
        }
    }

    async clickClear() {
        try {
            this.txtInputSearch = undefined;
            this.checkClickSearch = false;
            this.loadData = false;
            this.gridMicroservices.instance.clearSorting();
            this.gridMicroservices.instance.refresh();
            this.gridMicroservices.instance.pageSize(10);
            this.gridMicroservices.instance.pageIndex(0);
            this.gridMicroservices.instance.columnOption(2, 'sortOrder', 'desc');
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
            let offset = e.value * this.gridMicroservices.instance.pageSize()
            let limits = this.gridMicroservices.instance.pageSize()
            if ((((offset / limits) + 1) * limits) > this.numMenu) {
                this.dataResultItems = (this.pageIndex) * limits + this.getDataMicroservices.length;
            } else {
                this.dataResultItems = limits * (page);
            }
            this.textTotal = 'Search Results ' + (offset + 1) + ' - ' + this.dataResultItems + ' of ' + this.numMenu + ' Items';
            this.gridMicroservices.instance.refresh();
        }

        if (e.fullName === "paging.pageSize") {
            this.changeSize = true;
            let page = 1
            let offset = 0
            let limits = e.value
            if ((((offset / limits) + 1) * limits) > this.numMenu) {
                this.dataResultItems = (offset) * limits + this.getDataMicroservices.length;
            } else {
                this.dataResultItems = limits * page;
            }
            this.textTotal = 'Search Results ' + (offset + 1) + ' - ' + this.dataResultItems + ' of ' + this.numMenu + ' Items';
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

                    if (this.txtInputSearch || this.txtInputSearch !== '' || this.txtInputSearch !== null || this.txtInputSearch !== 'undefined' || this.txtInputSearch !== undefined) {
                        filterData = {
                            'menuName': this.common.trimData(this.txtInputSearch)
                        };
                    } else {
                        filterData = {};
                    }

                    const isChange = this.common.checkFilter(filterData, this.filterStore, this.offset)
                    console.log("isChange", isChange)
                    if (isChange) {
                        this.checkClickSearch = true
                        this.clickSearch()
                        return
                    }
                    this.filterStore = JSON.stringify(filterData);

                    if (this.checkClickSearch === true) {
                        filterData = {
                            filter: JSON.parse(JSON.stringify(filterData)),
                            offset: 0,
                            limit: this.limits,
                            orderby: loadOptions.sort[0].selector
                        };
                    } else {
                        filterData = {
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
                        BASE_RESOURCE: environment.searchMenus
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
                            this.loading = true;
                            console.log(response);
                            setTimeout(() => {
                                this.loadData = false;
                            }, 200);
                            this.resResultCode = response.resultCode;
                            const resultCodeSuccess = environment.resultCodeSuccess;
                            if (this.resResultCode === resultCodeSuccess) {
                                this.getDataMicroservices = response.resultData;
                                // click row view description
                                for (let i = 0; i < this.getDataMicroservices.length; i++) {
                                    // tslint:disable-next-line:max-line-length
                                    this.getDataMicroservices[i].updatedAt = this.common.convertDate(this.getDataMicroservices[i].updatedAt, 'DD/MM/YYYY HH:mm:ss');
                                }
                                // num numMenu Search Results 0 of 0 Items
                                this.numMenu = response.rowCount;
                                if (this.numMenu !== 0) {
                                    const page = ((this.offset / this.limits) + 1);
                                    this.textTotal = ' Search Results 0 of 0 Item';
                                    if ((((this.offset / this.limits) + 2) * this.limits) > this.numMenu) {
                                        this.dataResultItems = (page - 1) * this.limits + this.getDataMicroservices.length;
                                    } else {
                                        this.dataResultItems = this.limits * page;
                                    }
                                    // tslint:disable-next-line:max-line-length
                                    this.textTotal = 'Search Results ' + (this.offset + 1) + ' - ' + this.dataResultItems + ' of ' + this.numMenu + ' items';
                                } else {
                                    this.loading = false;
                                    this.dataMicroservices = {};
                                    this.getDataMicroservices = [];
                                    this.numMenu = 0;
                                    this.textTotal = ' Search Results 0 of 0 Item';
                                }
                                this.loading = false;
                            } else {
                                this.loading = false;
                                this.dataMicroservices = {};
                                this.getDataMicroservices = [];
                                this.numMenu = 0;
                                this.textTotal = ' Search Results 0 of 0 Item';
                                this.goAlert(response.resultCode, response.resultDescription, 'myModalError');
                            }
                            backData = this.getDataMicroservices;
                            backItemTotal = this.numMenu;
                            return {
                                data: this.getDataMicroservices,
                                totalCount: this.numMenu
                            };
                        })
                        .catch(error => {
                            setTimeout(() => {
                                this.loadData = false;
                            }, 200);
                            return {
                                data: [],
                                totalCount: this.numMenu
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
            const url = environment.apiPrefix + environment.deleteMenu;

            const data = {
                'menuId': this.getIdDelete
            };

            const resultCodeSuccess = environment.resultCodeSuccess;
            const response = await this.request.post(url, data);
            if (response.resultCode === resultCodeSuccess) {
                this.goAlert('', '', 'myModalSuccessDelete');
                this.dataMicroservices = this.customStore();

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

    onCellPrepared(e) {
        e.cellElement.accessKey = e.column.caption;
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
