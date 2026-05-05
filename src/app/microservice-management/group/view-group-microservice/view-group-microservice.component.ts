import {Component, OnInit, AfterViewInit, ElementRef, Input, ViewChild} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {LayoutMenu} from '../../../shared/store/layout.menu.store';
import {Request} from '../../../shared/services/request.service';
import {Common} from '../../../shared/services/common.service';
import {FormBuilder} from '@angular/forms';
import {DxDataGridComponent} from 'devextreme-angular';
import {environment} from '../../../../environments/environment';
import CustomStore from 'devextreme/data/custom_store';
import {StoreService} from '../../../shared/services/store.service';

declare let $: any;

@Component({
    selector: 'app-view-group-microservice',
    providers: [LayoutMenu, Request, Common],
    templateUrl: './view-group-microservice.component.html',
    // styleUrls: ['./menu.component.scss']
})
export class ViewGroupMicroserviceComponent implements OnInit, AfterViewInit {

    @ViewChild('myModal') myModal;
    @ViewChild(DxDataGridComponent) gridGroups: DxDataGridComponent;
    @ViewChild('txtInputSearch') txtInputSearch: ElementRef;
    dataGroups = {};
    getDataGroups = [];

    menuId;

    dxgridPageSize;
    allowedPageSizes = environment.allowedPageSizes;
    offset;
    limits;
    orderby;
    textTotal = ' Search Results 0 of 0 Item';
    numGroups = 0;
    dataResultItems = 0;
    loadData = false;
    fieldsGroupsList;
    checkClickSearch = false;
    filterData = {};
    resResultCode;
    inputSearchApi = '';
    dataMicroServices;
    getDataMicroserviceName;
    getIdDelete;
    remotePaging;

    loading = true;
    hoverTootip: any;
    disbledBtn = {
        'save': true,
        'cancel': true
    };
    menuHome: any = false;
    menuPermissions: any = {view: false, add: false, edit: false, delete: false};
    changeSize = false
    pageIndex = 0

    constructor(
        public router: Router,
        private fb: FormBuilder,
        private request: Request,
        public layoutMenu: LayoutMenu,
        private common: Common,
        private route: ActivatedRoute,
        private store: StoreService,
    ) {
        this.dxgridPageSize = environment.dxgridPageSize;
        this.fieldsGroupsList = environment.fieldsGroupsList;

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

            await this.getMicroservice();
            this.dataGroups = await this.customStore();
            this.gridGroups.instance.refresh();
            this.loading = false;
        } catch (e) {
            console.log(e);
            this.loading = false;
            const resultDescriptionSystemErrorTitle = environment.resultDescriptionSystemErrorTitle;
            const resultDescriptionSystemErrorMassage = environment.resultDescriptionSystemErrorMassage;
            this.goAlert(resultDescriptionSystemErrorTitle, resultDescriptionSystemErrorMassage, 'myModalError');
        }
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
                console.log(this.dataMicroServices);
            } else {
                this.goAlert(response.resultCode, response.resultDescription, 'myModalError');
            }

        } catch (e) {
            this.loading = false;
            const resultDescriptionSystemErrorTitle = environment.resultDescriptionSystemErrorTitle;
            const resultDescriptionSystemErrorMassage = environment.resultDescriptionSystemErrorMassage;
            this.goAlert(resultDescriptionSystemErrorTitle, resultDescriptionSystemErrorMassage, 'myModalError');
        }
    }

    changePageIndex(e : any){
        if(e.fullName === "paging.pageIndex") {
          this.pageIndex = e.value
          let page = e.value + 1
          let offset = e.value*this.gridGroups.instance.pageSize()
          let limits = this.gridGroups.instance.pageSize()
          if ((((offset / limits) + 1) * limits) > this.numGroups) {
            this.dataResultItems = (this.pageIndex) * limits + this.getDataGroups.length;
          } else {
            this.dataResultItems = limits * (page);
          }
          this.textTotal = 'Search Results ' + (offset + 1) + ' - ' + this.dataResultItems + ' of ' + this.numGroups + ' Items';
        }
    
        if(e.fullName === "paging.pageSize") {
          this.changeSize = true;
          let page =  1
          let offset = 0
          let limits = e.value
          if ((((offset / limits) + 1) * limits) > this.numGroups) {
            this.dataResultItems = (offset) * limits + this.getDataGroups.length;
          } else {
            this.dataResultItems = limits * page;
          }
          this.textTotal = 'Search Results ' + (offset + 1) + ' - ' + this.dataResultItems + ' of ' + this.numGroups + ' Items';
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
                    if(this.changeSize) {
                    this.offset = 0
                    } else {
                    this.offset = loadOptions.skip;
                    }
                    this.limits = loadOptions.take;
                    this.orderby = loadOptions.sort;

                    let filterData = {
                        fields: '',
                        filter: '',
                        offset: 0,
                        limit: 10,
                        orderby: ''
                    };
                  // tslint:disable-next-line:max-line-length
                    if (this.inputSearchApi && this.inputSearchApi !== '' && this.inputSearchApi !== null && this.inputSearchApi !== undefined) {
                        console.log('else');
                        this.filterData = {
                            'roleName': this.inputSearchApi,
                            'menuId': this.menuId,
                        };

                    } else {
                        this.filterData = {
                            'menuId': this.menuId,
                        };
                    }
                    if (this.checkClickSearch === true) {
                        filterData = {
                            fields: this.fieldsGroupsList,
                            filter: JSON.parse(JSON.stringify(this.filterData)),
                            offset: 0,
                            limit: this.limits,
                            orderby: loadOptions.sort[0].selector
                        };
                    } else {
                        filterData = {
                            fields: this.fieldsGroupsList,
                            filter: JSON.parse(JSON.stringify(this.filterData)),
                            offset: this.offset,
                            limit: this.limits,
                            orderby: loadOptions.sort[0].selector
                        };
                    }
                    filterData.filter = JSON.stringify(filterData.filter);

                    const checkUrl = this.common.checkMockupUrl('', '', filterData, {
                        BASE_API: '',
                        BASE_MODULE: environment.apiPrefix,
                        BASE_RESOURCE: environment.searchRoles
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
                            console.log('response', response);
                            setTimeout(() => {
                                this.loadData = false;
                            }, 200);
                            this.resResultCode = response.resultCode;
                            const resultCodeSuccess = environment.resultCodeSuccess;
                            if (this.resResultCode === resultCodeSuccess) {
                                this.getDataGroups = response.resultData;

                                // click row view description
                                for (let i = 0; i < this.getDataGroups.length; i++) {
                                  // tslint:disable-next-line:max-line-length
                                    this.getDataGroups[i].updatedAt = this.common.convertDate(this.getDataGroups[i].updatedAt, 'DD/MM/YYYY HH:mm:ss');
                                }

                                // num numGroups Search Results 0 of 0 Items
                                this.numGroups = response.rowCount;
                                if (this.numGroups !== 0) {
                                    const page = ((this.offset / this.limits) + 1);
                                    if ((((this.offset / this.limits) + 2) * this.limits) > this.numGroups) {
                                        this.dataResultItems = (page - 1) * this.limits + this.getDataGroups.length;
                                    } else {
                                        this.dataResultItems = this.limits * page;
                                    }
                                  // tslint:disable-next-line:max-line-length
                                    this.textTotal = 'Search Results ' + (this.offset + 1) + ' - ' + this.dataResultItems + ' of ' + this.numGroups + ' items';
                                } else {
                                    this.textTotal = ' Search Results 0 of 0 Item';
                                }
                                this.loading = false;
                            } else {
                                this.dataGroups = {};
                                this.getDataGroups = [];
                                this.numGroups = 0;
                                this.textTotal = ' Search Results 0 of 0 Item';
                                this.goAlert(response.resultCode, response.resultDescription, 'myModalError');
                            }

                            backData = this.getDataGroups;
                            backItemTotal = this.numGroups;

                            return {
                                data: this.getDataGroups,
                                totalCount: this.numGroups
                            };
                        })
                        .catch(error => {
                            setTimeout(() => {
                                this.loadData = false;
                            }, 200);
                            return {
                                data: [],
                                totalCount: this.numGroups
                            };
                        });

                } else {
                    console.log('Promise');
                    return Promise.resolve({
                        data: backData,
                        totalCount: backItemTotal
                    });
                }
            },
            onLoaded: (result) => {
                this.checkClickSearch = false;
            }
        });
        console.log(dataSource);
        return dataSource;
    }

    searchListApi() {
        this.gridGroups.instance.clearSorting();
        this.gridGroups.instance.refresh();
        this.gridGroups.instance.pageIndex(0);
        this.gridGroups.instance.columnOption(2, 'sortOrder', 'desc');
        this.inputSearchApi = this.common.trimData(this.txtInputSearch.nativeElement.value);
        console.log('inputSearchApi', this.inputSearchApi);
        this.gridGroups.instance.refresh();
    }

    fnCheckDisableSearch() {
        if (this.getDataGroups.length === 0 && this.inputSearchApi.length === 0) {
            return 'disabled';
        } else {
            return null;
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


    // show modal delete
    confirmDelete(id) {
        console.log(id);
        this.getIdDelete = id;
        this.goAlert('', '', 'myModalDelete');
    }

    async onOkDelete() {
        try {
            const url = environment.apiPrefix + environment.deleteRole;
            const data = {
                'roleId': this.getIdDelete
            };

            const resultCodeSuccess = environment.resultCodeSuccess;
            const response = await this.request.post(url, data);
            if (response.resultCode === resultCodeSuccess) {
                this.goAlert('', '', 'myModalSuccessDelete');
                this.dataGroups = this.customStore();
            } else {
                this.goAlert(response.resultCode, response.resultDescription, 'myModalError');
            }
        } catch (e) {
            console.log(e);
        }
    }

    onCancelDelete() {
        console.log('onCancelDelete');
    }

    onCancelViewWarning() {
        console.log('onCancelDelete');
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

    onCellHoverChanged(e) {
        // console.log(e.value);
        this.hoverTootip = e.value;
    }
}
