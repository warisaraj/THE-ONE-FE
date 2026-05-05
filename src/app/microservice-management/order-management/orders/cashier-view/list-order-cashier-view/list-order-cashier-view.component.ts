import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Request } from '../../../../../shared/services/request.service';
import { Common } from '../../../../../shared/services/common.service';
import { DxDataGridComponent } from 'devextreme-angular';
import * as moment from 'moment';
import { environment } from '../../../../../../environments/environment';
import CustomStore from 'devextreme/data/custom_store';
import { StoreService } from '../../../../../shared/services/store.service';
// import { Component} from '@angular/core';
import * as FileSaver from 'file-saver';
import * as XLSX from 'xlsx';
import { LayoutMenu } from 'src/app/shared/store/layout.menu.store';
import { GlobalVariable } from '../../pharmacist-view/list-order-pharmacist.global';

const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
const EXCEL_EXTENSION = '.xlsx';

@Component({
  selector: 'app-list-order-cashier-view',
  providers: [LayoutMenu, Request, Common],
  templateUrl: './list-order-cashier-view.component.html',
  styleUrls: ['./list-order-cashier-view.component.scss'],
})
export class ListOrderCashierViewComponent implements OnInit, AfterViewInit {
  @ViewChild('myModal') myModal;
  @ViewChild(DxDataGridComponent) gridDataPendingOrders: DxDataGridComponent;
  @ViewChild(DxDataGridComponent) gridDataDeliverdOrders: DxDataGridComponent;
  dataSource = {};
  getDataPendingOrders = [];
  dataDeliverdOrders = {};
  getDataDeliverdOrders = [];


  errorFilePath: string;
  fileUpload: string;
  dxgridPageSize;
  allowedPageSizes = environment.allowedPageSizes;
  offset;
  limits;
  orderby;
  textTotal = ' Search Results 0 of 0 Item';
  numMicroservices = 0;
  dataResultItems = 0;
  loadData = false;
  fieldsMicroservicesList;
  checkClickSearch = false;
  filterData: any = {};
  txtInputSearch;
  resResultCode;
  remotePaging;
  getIdDelete;
  loading = true;
  disbledBtn = {
    'create': false
  };
  menuHome: any = false;
  menuPermissions: any = { view: false, add: false, edit: false, delete: false };
  orderStatusMapByName = {};
  orderStatusMapById = {};
  statusListPending = [
    'Quotation Received',
    'Waiting for Customer',
    'Urgent Approve',
    'Customer Approve',
    'Cannot Contact Customer',
    'Reminded',
  ];
  statusListBooked = [
    'Change Booking',
    'Change Booking (Order Inserted in TC)',
  ];
  statusListRejected = [
    'Customer Rejected',
  ];
  statusListReserved = [
    'Production Reserved',
  ];
  statusListChangeDeliveryDetail = [
    'Change Delivery Detail',
  ];
  statusList = this.statusListPending;
  orderStatus = '';
  // don't change position
  tabList = ['Pending', 'Booked', 'Rejected', 'Reserved', 'Change Delivery Detail'];
  selectedTabName: string = this.tabList[0];
  filter: any = {}
  filterStore: any = {}
  max: any = undefined;
  min: any = undefined;
  isLoadingPanel = false;
  errorText: any;
  changeSize = false
  pageIndex = 0

  constructor(
    public router: Router,
    private request: Request,
    public layoutMenu: LayoutMenu,
    private common: Common,
    private store: StoreService,
  ) {
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
      const pagePermission = pagePermissionList.find(r => r.url === environment.roleURL.cashierView);
      if (pagePermission) {
        try {
          this.menuPermissions = JSON.parse(pagePermission.menuPermissions);
          console.log(this.menuPermissions);
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
            if (environment.roleURL.order === element3.url) {
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
      const dropdown = await this.common.searchConfig()
      for (const orderStatus of dropdown.orderStatus) {
        if (!this.orderStatusMapByName[orderStatus.name]) {
          this.orderStatusMapByName[orderStatus.name] = [];
        }
        this.orderStatusMapByName[orderStatus.name].push(orderStatus.id);

        if (!this.orderStatusMapById[orderStatus.id]) {
          this.orderStatusMapById[orderStatus.id] = [];
        }
        this.orderStatusMapById[orderStatus.id].push(orderStatus.name);
      }

      this.dataSource = await this.customStore();
      this.filter.hn = '';
      this.filter.patientName = '';
      this.filter.orderDateFrom = null
      this.filter.orderDateTo = null
      this.filter.productionEndDateFrom = null
      this.filter.productionEndDateTo = null
      this.max = moment().toDate()
      this.min = moment().toDate()
    } catch (e) {
      console.log('catch: ', e);
    }
  }

  async changeTab(tabName: string) {
    this.filter.hn = '';
    this.filter.patientName = '';
    this.filter.orderDateFrom = null
    this.filter.orderDateTo = null
    this.filter.productionEndDateFrom = null
    this.filter.productionEndDateTo = null
    this.selectedTabName = tabName;
    this.orderStatus = '';
    if (tabName === this.tabList[0]) {
      this.statusList = this.statusListPending;
    } else if (tabName === this.tabList[1]) {
      this.statusList = this.statusListBooked;
    } else if (tabName === this.tabList[2]) {
      this.statusList = this.statusListRejected;
    } else if (tabName === this.tabList[3]) {
      this.statusList = this.statusListReserved;
    } else if (tabName === this.tabList[4]) {
      this.statusList = this.statusListChangeDeliveryDetail;
    }
    try {
      this.gridDataPendingOrders.instance.clearSorting();
      this.gridDataPendingOrders.instance.pageIndex(0);
      if (this.selectedTabName === this.tabList[3]) {
        this.gridDataPendingOrders.instance.columnOption(6, 'sortOrder', 'desc');
      } else {
        this.gridDataPendingOrders.instance.columnOption(8, 'sortOrder', 'desc');
      }
      if (this.selectedTabName === this.tabList[4]) {
        this.dataSource = await this.customStoreTab5();
      } else {
        this.dataSource = await this.customStore();
        // this.gridDataPendingOrders.instance.refresh();
        // this.gridDataPendingOrders.instance.pageIndex(0);
      }
    } catch (e) {
      console.log('catch: ', e);
    }
  }

  async clickSearch() {
    try {
      console.log(this.txtInputSearch);
      this.checkClickSearch = true;
      this.loadData = false;
      this.gridDataPendingOrders.instance.clearSorting();
      this.gridDataPendingOrders.instance.refresh();
      this.gridDataPendingOrders.instance.pageIndex(0);
      if (this.selectedTabName === this.tabList[3]) {
        this.gridDataPendingOrders.instance.columnOption(6, 'sortOrder', 'desc');
      } else {
        this.gridDataPendingOrders.instance.columnOption(8, 'sortOrder', 'desc');
      }
    } catch (e) {
      console.log(e);
      const resultDescriptionSystemErrorTitle = environment.resultDescriptionSystemErrorTitle;
      const resultDescriptionSystemErrorMassage = environment.resultDescriptionSystemErrorMassage;
      this.goAlert(resultDescriptionSystemErrorTitle, resultDescriptionSystemErrorMassage, [], 'myModalError');
    }
  }

  async clickClear() {
    try {
      this.filter.hn = '';
      this.filter.patientName = '';
      this.filter.orderDateFrom = null
      this.filter.orderDateTo = null
      this.filter.productionEndDateFrom = null
      this.filter.productionEndDateTo = null

      this.max = moment().toDate()
      this.min = moment().toDate()
      this.checkClickSearch = false;
      this.loadData = false;
      this.orderStatus = '';
      this.gridDataPendingOrders.instance.clearSorting();
      this.gridDataPendingOrders.instance.refresh();
      this.gridDataPendingOrders.instance.pageSize(10);
      this.gridDataPendingOrders.instance.pageIndex(0);
      if (this.selectedTabName === this.tabList[3]) {
        this.gridDataPendingOrders.instance.columnOption(6, 'sortOrder', 'desc');
      } else {
        this.gridDataPendingOrders.instance.columnOption(8, 'sortOrder', 'desc');
      }

    } catch (e) {
      console.log(e);
    }
  }

  confirmDelete(id) {
    console.log(id);
    this.getIdDelete = id;
    this.disbledBtn = {
      'create': true
    };
    this.goAlert('', '', [], 'myModalDelete');
  }

  onCancelDelete() {
    this.disbledBtn = {
      'create': false
    };
  }

  goAlert(userTitle, userMessage, userMessageList, modalId) {
    const dataAlert = {
      'modalId': modalId,
      'userTitle': userTitle,
      'userMessage': userMessage,
      'userMessageList': userMessageList
    };
    this.myModal.openModal(dataAlert);
  }

  fnDownloadTemplate() {
    try {
      window.open(environment.ip + '/download/template/BIN_Template.xlsx');
    } catch (err) {
      console.log(err);
    }
  }

  ondDownload() {
    window.open(this.errorFilePath);
    this.myModal.closeModal('modalErrorImport');
  }

  fnSetOrderStatus() {
    let orderStatusNameList = [];
    if (this.selectedTabName === this.tabList[0]) {
      orderStatusNameList = this.statusListPending;
    } else if (this.selectedTabName === this.tabList[1]) {
      orderStatusNameList = this.statusListBooked;
    } else if (this.selectedTabName === this.tabList[2]) {
      orderStatusNameList = this.statusListRejected;
    } else if (this.selectedTabName === this.tabList[3]) {
      orderStatusNameList = this.statusListReserved;
    } else if (this.selectedTabName === this.tabList[4]) {
      orderStatusNameList = this.statusListChangeDeliveryDetail;
    }

    if (orderStatusNameList && orderStatusNameList.length > 0) {
      orderStatusNameList = orderStatusNameList.map(str => {
        return this.orderStatusMapByName[str];
      });
      return orderStatusNameList.toString();
    } else {
      return '';
    }
  }

  async onClickExportAll() {
    try {
      this.isLoadingPanel = true;
      // tslint:disable-next-line:max-line-length
      let allStatus = [...this.statusListPending, ...this.statusListBooked, ...this.statusListRejected, ...this.statusListChangeDeliveryDetail];
      allStatus = allStatus.map(str => {
        return this.orderStatusMapByName[str];
      });
      const exportFilter: any = {
        orderStatus: allStatus.toString()
      };
      await this.common.export('Orders_Reservation', exportFilter, this.myModal);

      this.isLoadingPanel = false;

    } catch (error) {
      this.isLoadingPanel = false;

    }
  }

  async onClickExport() {
    try {
      this.isLoadingPanel = true;
      const exportFilter: any = {
        orderStatus: this.fnSetOrderStatus(),
      };

      if (this.orderStatus) {
        exportFilter.orderStatus = this.orderStatusMapByName[this.orderStatus];
      }

      if (this.selectedTabName === this.tabList[4]) {
        exportFilter.deliveryStatus = this.statusListChangeDeliveryDetail;

        if (exportFilter.deliveryStatus && exportFilter.deliveryStatus.length > 0) {
          exportFilter.deliveryStatus = exportFilter.deliveryStatus.map(str => {
            return this.orderStatusMapByName[str];
          });
          exportFilter.deliveryStatus = exportFilter.deliveryStatus.toString();
        }
        if (this.filter.orderDateFrom) {
          exportFilter.orderDateFrom = moment(this.filter.orderDateFrom).format('YYYY-MM-DD');
        }
        if (this.filter.orderDateTo) {
          exportFilter.orderDateTo = moment(this.filter.orderDateTo).format('YYYY-MM-DD');
        }

      }

      if (this.selectedTabName === this.tabList[3] || this.selectedTabName === this.tabList[4]) {
        delete exportFilter.orderStatus;
      }

      if (this.filter.hn) {
        exportFilter.hn = this.filter.hn;
      }
      if (this.filter.patientName) {
        exportFilter.patientName = this.filter.patientName;
      }

      if (this.filter.orderDateFrom && ['Pending', 'Booked', 'Rejected'].some(status => this.selectedTabName.includes(status))) {
        exportFilter.orderDateFrom = moment(this.filter.orderDateFrom).format('YYYY-MM-DD');
      }
      if (this.filter.orderDateTo && ['Pending', 'Booked', 'Rejected'].some(status => this.selectedTabName.includes(status))) {
        exportFilter.orderDateTo = moment(this.filter.orderDateTo).format('YYYY-MM-DD');
      }
      if (this.filter.productionEndDateFrom && ['Reserved'].some(status => this.selectedTabName.includes(status))) {
        exportFilter.productionEndDateFrom = moment(this.filter.productionEndDateFrom).format('YYYY-MM-DD');
      }
      if (this.filter.productionEndDateTo && ['Reserved'].some(status => this.selectedTabName.includes(status))) {
        exportFilter.productionEndDateTo = moment(this.filter.productionEndDateTo).format('YYYY-MM-DD');
      }

      console.log('exportFilter', exportFilter);
      if (this.selectedTabName === this.tabList[3]) {
        await this.common.export('Reservation', exportFilter, this.myModal);
      } else if (this.selectedTabName === this.tabList[4]) {
        await this.common.export('Orders_Customer_Service', exportFilter, this.myModal);
      } else {
        await this.common.export('Orders', exportFilter, this.myModal);
      }
      this.isLoadingPanel = false;
    } catch (error) {
      this.isLoadingPanel = false;
    }
  }

  changePageIndex(e: any) {
    if (e.fullName === "paging.pageIndex") {
      this.pageIndex = e.value
      let page = e.value + 1
      let offset = e.value * this.gridDataPendingOrders.instance.pageSize()
      let limits = this.gridDataPendingOrders.instance.pageSize()
      if ((((offset / limits) + 1) * limits) > this.numMicroservices) {
        this.dataResultItems = (this.pageIndex) * limits + this.getDataPendingOrders.length;
      } else {
        this.dataResultItems = limits * (page);
      }
      this.textTotal = 'Search Results ' + (offset + 1) + ' - ' + this.dataResultItems + ' of ' + this.numMicroservices + ' Items';
      this.gridDataPendingOrders.instance.refresh();
    }

    if (e.fullName === "paging.pageSize") {
      this.changeSize = true;
      let page = 1
      let offset = 0
      let limits = e.value
      if ((((offset / limits) + 1) * limits) > this.numMicroservices) {
        this.dataResultItems = (offset) * limits + this.getDataPendingOrders.length;
      } else {
        this.dataResultItems = limits * page;
      }
      this.textTotal = 'Search Results ' + (offset + 1) + ' - ' + this.dataResultItems + ' of ' + this.numMicroservices + ' Items';
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
          // check sort if no no get api and sort no
          if (loadOptions.sort !== null && (this.offset === loadOptions.skip && this.limits === loadOptions.take)) {
            this.orderby = loadOptions.sort[0].selector;
          }
          // ดักให้ทำงานเฉพาะกรณีกด Paging / Sorting เท่านั้นกรณีอื่นจะทำให้ Data grid พัง
          if (this.common.checkLoadOptions(loadOptions) === false) {
            return Promise.resolve({
              data: backData.reverse(),
              totalCount: backItemTotal
            });
          }

          this.limits = loadOptions.take;

          let urlSearch = environment.searchOrders;

          let filterData: any = {};
          if (this.selectedTabName === this.tabList[0]) {
            filterData.orderStatus = this.statusListPending;
          } else if (this.selectedTabName === this.tabList[1]) {
            filterData.orderStatus = this.statusListBooked;
          } else if (this.selectedTabName === this.tabList[2]) {
            filterData.orderStatus = this.statusListRejected;
          } else if (this.selectedTabName === this.tabList[3]) {
            urlSearch = environment.searchReservation;
            // filterData.orderStatus = this.statusListReserved;
          }
          if (this.orderStatus) {
            filterData.orderStatus = [this.orderStatus];
          }
          if (filterData.orderStatus && filterData.orderStatus.length > 0) {
            filterData.orderStatus = filterData.orderStatus.map(str => {
              return this.orderStatusMapByName[str];
            });
            filterData.orderStatus = filterData.orderStatus.toString();
          }

          if (this.filter.hn) {
            filterData.hn = this.filter.hn;
          }
          if (this.filter.patientName) {
            filterData.patientName = this.filter.patientName;
          }
          if (this.filter.orderDateFrom && ['Pending', 'Booked', 'Rejected'].some(status => this.selectedTabName.includes(status))) {
            filterData.orderDateFrom = moment(this.filter.orderDateFrom).format('YYYY-MM-DD');
          }
          if (this.filter.orderDateTo && ['Pending', 'Booked', 'Rejected'].some(status => this.selectedTabName.includes(status))) {
            filterData.orderDateTo = moment(this.filter.orderDateTo).format('YYYY-MM-DD');
          }
          if (this.filter.productionEndDateFrom && ['Reserved'].some(status => this.selectedTabName.includes(status))) {
            filterData.productionEndDateFrom = moment(this.filter.productionEndDateFrom).format('YYYY-MM-DD');
          }
          if (this.filter.productionEndDateTo && ['Reserved'].some(status => this.selectedTabName.includes(status))) {
            filterData.productionEndDateTo = moment(this.filter.productionEndDateTo).format('YYYY-MM-DD');
          }

          if (this.changeSize) {
            this.offset = 0
          } else {
            this.offset = loadOptions.skip;
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
              ...filterData,
              offset: 0,
              limit: this.limits,
              orderby: loadOptions.sort[0].selector
            };
          } else {
            filterData = {
              ...filterData,
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
            BASE_RESOURCE: urlSearch
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
              if (response) {
                setTimeout(() => {
                  this.loadData = false;
                }, 200);
                this.resResultCode = response.resultCode;
                const resultCodeSuccess = environment.resultCodeSuccess;
                if (this.resResultCode === resultCodeSuccess) {
                  let resultData = response.resultData || [];

                  resultData = resultData.map(obj => ({
                    ...obj,
                    orderStatus: Array.isArray(this.orderStatusMapById[obj.orderStatus])
                      ? this.orderStatusMapById[obj.orderStatus][0]
                      : this.orderStatusMapById[obj.orderStatus],
                    productionStartDate: obj.productionStartDateTime,
                    productionEndDate: obj.productionEndDateTime
                  }));
                  this.getDataPendingOrders = resultData;
                  this.numMicroservices = response.rowCount;
                  if (this.numMicroservices !== 0) {
                    const page = ((this.offset / this.limits) + 1);
                    this.textTotal = ' Search Results 0 of 0 Item';
                    if ((((this.offset / this.limits) + 2) * this.limits) > this.numMicroservices) {
                      this.dataResultItems = (page - 1) * this.limits + this.getDataPendingOrders.length;
                    } else {
                      this.dataResultItems = this.limits * page;
                    }
                    // tslint:disable-next-line:max-line-length
                    this.textTotal = 'Search Results ' + (this.offset + 1) + ' - ' + this.dataResultItems + ' of ' + this.numMicroservices + ' Items';
                  } else {
                    this.loading = false;
                    this.changeSize = false;
                    this.dataSource = {};
                    this.getDataPendingOrders = [];
                    this.numMicroservices = 0;
                    this.textTotal = ' Search Results 0 of 0 Item';
                  }
                  this.loading = false;
                  this.changeSize = false;
                } else {
                  this.loading = false;
                  this.dataSource = {};
                  this.getDataPendingOrders = [];
                  this.numMicroservices = 0;
                  this.textTotal = ' Search Results 0 of 0 Item';
                  this.goAlert(response.resultCode, response.resultDescription, [], 'myModalError');
                }

              }
              backData = this.getDataPendingOrders;
              backItemTotal = this.numMicroservices;

              return {
                data: this.getDataPendingOrders,
                totalCount: this.numMicroservices
              };
            })
            .catch(() => {
              setTimeout(() => {
                this.loadData = false;
              }, 200);

              console.log('return catch');
              return {
                data: [],
                totalCount: this.numMicroservices
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
    });
    console.log(dataSource);
    return dataSource;
  }

  customStoreTab5() {
    const dataSource: any = {};
    this.loadData = false;
    let backData: any = [];
    let backItemTotal = 0;

    dataSource.store = new CustomStore({
      load: (loadOptions) => {
        if (!this.loadData) {
          // check sort if no no get api and sort no
          if (loadOptions.sort !== null && (this.offset === loadOptions.skip && this.limits === loadOptions.take)) {
            this.orderby = loadOptions.sort[0].selector;
          }
          // ดักให้ทำงานเฉพาะกรณีกด Paging / Sorting เท่านั้นกรณีอื่นจะทำให้ Data grid พัง
          if (this.common.checkLoadOptions(loadOptions) === false) {
            return Promise.resolve({
              data: backData.reverse(),
              totalCount: backItemTotal
            });
          }

          this.limits = loadOptions.take;

          let urlSearch = environment.searchOrderCS;

          let filterData: any = {};

          if (this.filter.orderDateFrom) {
            filterData.orderDateFrom = moment(this.filter.orderDateFrom).format('YYYY-MM-DD');
          }
          if (this.filter.orderDateTo) {
            filterData.orderDateTo = moment(this.filter.orderDateTo).format('YYYY-MM-DD');
          }

          filterData.deliveryStatus = 32;

          if (this.filter.hn) {
            filterData.hn = this.filter.hn;
          }
          if (this.filter.patientName) {
            filterData.patientName = this.filter.patientName;
          }

          if (this.changeSize) {
            this.offset = 0
          } else {
            this.offset = loadOptions.skip;
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
              ...filterData,
              offset: 0,
              limit: this.limits,
              orderby: loadOptions.sort[0].selector
            };
          } else {
            filterData = {
              ...filterData,
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
            BASE_RESOURCE: urlSearch
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
              if (response) {
                console.log('response', response);
                setTimeout(() => {
                  this.loadData = false;
                }, 200);
                this.resResultCode = response.resultCode;
                const resultCodeSuccess = environment.resultCodeSuccess;
                if (this.resResultCode === resultCodeSuccess) {
                  let resultData = response.resultData || [];

                  resultData = resultData.map(obj => ({
                    ...obj,
                    orderId: obj.order.orderId,
                    hn: obj.order.hn,
                    patientName: obj.order.patientName,
                    orderDate: obj.order.orderDate,
                    orderStatus: Array.isArray(this.orderStatusMapById[obj.deliveryStatus])
                      ? this.orderStatusMapById[obj.deliveryStatus][0]
                      : this.orderStatusMapById[obj.deliveryStatus],
                    locationDetail: obj && obj.locationDetail ? obj.locationDetail : (obj && obj.order ? obj.order.locationDetail : null)
                  }));

                  this.getDataPendingOrders = resultData;
                  this.numMicroservices = response.rowCount;
                  if (this.numMicroservices !== 0) {
                    const page = ((this.offset / this.limits) + 1);
                    this.textTotal = ' Search Results 0 of 0 Item';
                    if ((((this.offset / this.limits) + 2) * this.limits) > this.numMicroservices) {
                      this.dataResultItems = (page - 1) * this.limits + this.getDataPendingOrders.length;
                    } else {
                      this.dataResultItems = this.limits * page;
                    }
                    // tslint:disable-next-line:max-line-length
                    this.textTotal = 'Search Results ' + (this.offset + 1) + ' - ' + this.dataResultItems + ' of ' + this.numMicroservices + ' Items';
                  } else {
                    this.loading = false;
                    this.dataSource = {};
                    this.getDataPendingOrders = [];
                    this.numMicroservices = 0;
                    this.textTotal = ' Search Results 0 of 0 Item';
                  }
                  this.loading = false;
                  this.changeSize = false;
                } else {
                  this.loading = false;
                  this.dataSource = {};
                  this.getDataPendingOrders = [];
                  this.numMicroservices = 0;
                  this.textTotal = ' Search Results 0 of 0 Item';
                  this.goAlert(response.resultCode, response.resultDescription, [], 'myModalError');
                }

              }
              backData = this.getDataPendingOrders;
              backItemTotal = this.numMicroservices;

              return {
                data: this.getDataPendingOrders,
                totalCount: this.numMicroservices
              };
            })
            .catch((error) => {
              setTimeout(() => {
                this.loadData = false;
              }, 200);

              console.log('return catch');
              console.log(error)
              return {
                data: [],
                totalCount: this.numMicroservices
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
    });
    console.log(dataSource);
    return dataSource;
  }

  onCloseModalError() {
    console.log('onCancelDelete');
  }

  onCellPrepared(e) {
    if (e.rowType === 'header') {
      e.cellElement.title = e.cellElement.outerText;
    } else {
      e.cellElement.title = e.text;
    }
    e.cellElement.accessKey = e.column.caption;
  }

  // Collapse ibox function
  clickCollapse() {
    this.common.collapseFn();
  }

  onRowPrepared(e) {
    const data = e.data || {};
    const rowElement: HTMLElement = e.rowElement;
    if ((data.orderStatus === 'Quotation Received' || data.orderStatus === 'Waiting for Customer' || data.orderStatus === 'Cannot Contact Customer' || data.orderStatus === 'Customer Approve' || data.orderStatus === 'Customer Rejected') && +data.isOrderPcCheckUrgent === 1) {
      rowElement.classList.add('urgent-color');
    }

    if ((data.orderStatus === 'Urgent Approve' ||
      data.orderStatus === 'Change Booking' ||
      data.orderStatus === 'Change Booking (Order inserted in TC)')
      && +data.isUrgentApprove === 1) {
      rowElement.classList.add('urgent-color');
    }
  }

  async fnChangeStatus() {
    await this.clickSearch();
  }

  async fnClickEditDeliveryDetail(data) {
    console.log('datxxxxa', data.data.deliveryStatus)
    localStorage.setItem('pageOrderStatus', data.data.deliveryStatus);
    if (data.data.order.item === 1) {
      // tslint:disable-next-line:max-line-length
      this.router.navigate(['/order-management', 'orders-cashier-view', 'queue-management-booking', data.data.order.orderId, data.data.deliveryDetailId, 'edit'], {
        queryParams: { orderStatus: data.data.orderStatus }
      });
    } else {

      if (
        (data.data.orderStatus === 'Change Delivery Detail' || data.data.orderStatus === 32) ||
        (data.data.orderStatus === 'Customer Rejected' || data.data.orderStatus === 8)
      ) {

        // tslint:disable-next-line:max-line-length
        this.router.navigate(['/order-management', 'orders-cashier-view', 'queue-management-finished-product', data.data.order.orderId, data.data.deliveryDetailId, 'edit']);
        return;
      }
      if (data.id) {
        data.orderId = data.id;
      } else if (data.data.order && data.data.order.orderId) {
        data.orderId = data.data.order.orderId;
      }
      const filterData = {
        orderId: data.orderId
      };
      const checkUrl = this.common.checkMockupUrl('', '', filterData, {
        BASE_API: GlobalVariable.BASE_API,
        BASE_MODULE: GlobalVariable.BASE_MODULE,
        BASE_RESOURCE: GlobalVariable.BASE_RESOURCE + GlobalVariable.BASE_RESOURCE_GET_ERROR_ORDER
      });

      const resultCodeSuccess = environment.resultCodeSuccess;

      const response = await this.request.get(checkUrl.url, checkUrl.filter);
      if (response.resultCode === resultCodeSuccess) {
        // tslint:disable-next-line:max-line-length
        this.router.navigate(['/order-management', 'orders-cashier-view', 'queue-management-finished-product', data.data.order.orderId, data.data.deliveryDetailId, 'edit']);
      } else {
        this.errorText = response.resultDescription.split('\n');
        if (!this.menuPermissions.edit) {
          this.goAlert(response.resultCode, response.resultDescription, [], 'myModalOrderErrorStatus1');
        } else {
          this.goAlert(response.resultCode, response.resultDescription, [], 'myModalOrderError');
        }
      }
    }
  }

  onValueChanged(event: any, type: string) {
    console.log(event)
    this.filter[type] = moment(event.value).format('YYYY-MM-DD')
    if (type == 'orderDateFrom') {
      this.min = this.filter[type] == 'Invalid date' ? null : this.filter[type];
    } else if (type == 'orderDateTo') {
      this.max = this.filter[type] == 'Invalid date' ? null : this.filter[type];
    }
  }
}
