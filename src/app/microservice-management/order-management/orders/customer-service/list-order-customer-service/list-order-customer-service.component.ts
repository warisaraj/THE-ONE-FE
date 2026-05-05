import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, EventEmitter, Output } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { GlobalVariable } from './list-order.global';
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

const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
const EXCEL_EXTENSION = '.xlsx';

@Component({
  selector: 'app-list-customer-service',
  providers: [LayoutMenu, Request, Common],
  templateUrl: './list-order-customer-service.component.html',
  styleUrls: ['./list-order.component.scss'],
})
export class ListCustomerServiceComponent implements OnInit, AfterViewInit {
  @ViewChild('myModal') myModal;
  @ViewChild(DxDataGridComponent) gridDataPendingOrders: DxDataGridComponent;
  @ViewChild(DxDataGridComponent) gridDataDeliverdOrders: DxDataGridComponent;
  dataPendingOrders = {};
  getDataPendingOrders = [];
  dataDeliverdOrders = {};
  getDataDeliverdOrders = [];


  tabIndex = 0
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
    "create": false
  };
  menuHome: any = false;
  menuPermissions: any = { view: false, add: false, edit: false, delete: false }
  statusList: string[] = ['Waiting for delivery',
    'Form Printed',
    'Cannot Deliver',
    'Delivered',];
  orderStatusMapByName = {}
  orderStatusMapById = {}
  patientItemListMapByName = {}
  patientItemListMapById = {}
  statusListPending = [
    'Waiting for delivery',
    'Form Printed',
    'Cannot Deliver',
  ];
  statusListDelivered = [
    'Delivered',
  ];
  deliveryMethodMapByName = []
  deliveryMethodMapById = []
  arrivalTimeMapByName = []
  arrivalTimeMapById = []
  orderStatus = '';
  filter = {
    hn: '',
    patientName: '',
    deliveryDateFrom: null,
    deliveryDateTo: null,
    deliveryStatus: null,
    orderStatus: ''
  };
  filterStore: any = {}
  isExportAll: boolean;
  isLoadingPanel = false;
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
    // pagePermissionList
    this.store.subscribePagePermissionList().subscribe(pagePermissionList => {
      console.log("ngOnInit", pagePermissionList);
      let pagePermission = pagePermissionList.find(r => r.url === GlobalVariable.ROLE_URL);
      if (pagePermission) {
        try {
          this.menuPermissions = JSON.parse(pagePermission.menuPermissions)
          console.log(this.menuPermissions)
        } catch (error) {
          console.log(error);
        }
      }
    })
    this.store.subscribeMenu().subscribe((menu: any) => {
      let menuHome = false;
      for (let index = 0; index < menu.length; index++) {
        const element = menu[index];
        for (let index2 = 0; index2 < element.menus.length; index2++) {
          const element2 = element.menus[index2];
          for (let index3 = 0; index3 < element2.submenus.length; index3++) {
            const element3 = element2.submenus[index3];
            if (GlobalVariable.ROLE_URL === element3.url) {
              if (!menuHome) {
                menuHome = element;
              }
              break;
            }
          }
        }
      }
      this.menuHome = menuHome;
    })
  }

  goHomeMenu() {
    if (this.menuHome) {
      this.router.navigate(['/menu', this.menuHome['menuId'], this.menuHome['typePage']]);
    }
  }

  async ngAfterViewInit() {
    try {
      const dropdown = await this.common.searchConfig();
      for (const orderStatus of dropdown.orderStatus) {
        this.orderStatusMapByName[orderStatus.name] = orderStatus.id;
        this.orderStatusMapById[orderStatus.id] = orderStatus.name;
      }
      for (const patientItemList of dropdown.patientItemList) {
        this.patientItemListMapByName[patientItemList.name] = patientItemList.id;
        this.patientItemListMapById[patientItemList.id] = patientItemList.name;
      }
      for (const deliveryMethod of dropdown.deliveryMethodList) {
        this.deliveryMethodMapByName[deliveryMethod.name] = deliveryMethod.id;
        this.deliveryMethodMapById[deliveryMethod.id] = deliveryMethod.name;
      }
      for (const arrivalTime of dropdown.arrivalTimeList) {
        this.arrivalTimeMapByName[arrivalTime.name] = arrivalTime.id;
        this.arrivalTimeMapById[arrivalTime.id] = arrivalTime.name;
      }
      this.dataPendingOrders = await this.customStore();
    } catch (e) {
      console.log('catch: ', e);
    }
  }


  async changeTab(index: number) {
    this.tabIndex = index;
    try {
      this.filter.hn = ''
      this.filter.patientName = ''
      this.filter.deliveryDateFrom = null
      this.filter.deliveryDateTo = null
      this.filter.orderStatus = ''
      this.gridDataPendingOrders.instance.clearSorting();
      this.gridDataPendingOrders.instance.refresh();
      this.gridDataPendingOrders.instance.pageIndex(0);
      this.gridDataPendingOrders.instance.columnOption(12, 'sortOrder', 'desc');
    } catch (e) {
      console.log('catch: ', e);
    }
  }

  async clickSearch() {
    try {
      this.checkClickSearch = true;
      this.loadData = false;
      this.gridDataPendingOrders.instance.clearSorting();
      this.gridDataPendingOrders.instance.refresh();
      this.gridDataPendingOrders.instance.pageIndex(0);
      this.gridDataPendingOrders.instance.columnOption(12, 'sortOrder', 'desc');
      if (this.filter.orderStatus === 'Delivered') {
        this.tabIndex = 1
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
      this.filter.hn = ''
      this.filter.patientName = ''
      this.filter.deliveryDateFrom = null
      this.filter.deliveryDateTo = null
      this.filter.orderStatus = ''
      this.checkClickSearch = false;
      this.loadData = false;
      this.gridDataPendingOrders.instance.clearSorting();
      this.gridDataPendingOrders.instance.refresh();
      this.gridDataPendingOrders.instance.pageSize(10);
      this.gridDataPendingOrders.instance.pageIndex(0);
      this.gridDataPendingOrders.instance.columnOption(12, 'sortOrder', 'desc');
    } catch (e) {
      console.log(e);
    }
  }

  onRowPrepared(e) {
    const data = e.data || {};
    const rowElement: HTMLElement = e.rowElement;
    if (data.isUrgent || (data.isSplitDelivery == true && data.deliveryStatus === 29)) {
      rowElement.classList.add('urgent-color');
    }
  }

  confirmDelete(id) {
    console.log(id);
    this.getIdDelete = id;
    this.disbledBtn = {
      "create": true
    };
    this.goAlert('', '', [], 'myModalDelete');
  }

  onCancelDelete() {
    this.disbledBtn = {
      "create": false
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
      window.open(environment.ip + '/download/template/BIN_Template.xlsx')
    } catch (err) {
      console.log(err)
    }
  }


  ondDownload() {
    window.open(this.errorFilePath)
    this.myModal.closeModal('modalErrorImport');
  }
  async onClickExportAll() {
    try {
      this.isLoadingPanel = true;
      // tslint:disable-next-line:max-line-length
      let exportFilter: any = {
      };
      if (this.filter.hn) {
        exportFilter.hn = this.filter.hn;
      }
      if (this.filter.patientName) {
        exportFilter.patientName = this.filter.patientName;
      }

      if (this.filter.deliveryDateFrom) {
        exportFilter.deliveryDateFrom = this.filter.deliveryDateFrom;
      }

      if (this.filter.deliveryDateTo) {
        exportFilter.deliveryDateTo = this.filter.deliveryDateTo;
      }

      if (this.tabIndex === 0) {
        exportFilter.deliveryStatus = this.statusListPending;
      } else {
        exportFilter.deliveryStatus = this.statusListDelivered;
      }

      if (this.filter.orderStatus) {
        exportFilter.deliveryStatus = [this.filter.orderStatus]
      }

      if (exportFilter.deliveryStatus && exportFilter.deliveryStatus.length > 0) {
        exportFilter.deliveryStatus = exportFilter.deliveryStatus.map(str => {
          return this.orderStatusMapByName[str];
        });
        exportFilter.deliveryStatus = exportFilter.deliveryStatus.toString();
      }

      await this.common.export('Orders_Customer_Service', exportFilter, this.myModal);
      this.isLoadingPanel = false;
    } catch (error) {
      this.isLoadingPanel = false;
    }
  }

  // async onClickExport() {
  //   try {
  //     this.isLoadingPanel = true;
  //     console.log('onClickExport', this.filter);
  //     const exportFilter: any = {
  //       orderStatus: this.tabIndex === 0 ? this.statusListPending : this.statusListDelivered
  //     };

  //     if (this.orderStatus && this.tabIndex === 0) {
  //       exportFilter.orderStatus = [this.orderStatus];
  //     }

  //     exportFilter.orderStatus = exportFilter.orderStatus.map(str => {
  //       return this.orderStatusMapByName[str];
  //     });

  //     if (this.filter.hn) {
  //       exportFilter.hn = this.filter.hn;
  //     }
  //     if (this.filter.patientName) {
  //       exportFilter.patientName = this.filter.patientName;
  //     }
  //     if (this.filter.deliveryDate) {
  //       exportFilter.orderDate = moment(this.filter.deliveryDate).format('YYYY-MM-DD');
  //     }
  //     console.log('exportFilter', exportFilter);
  //     await this.common.export('Orders_Customer_Service', exportFilter, this.myModal);
  //     this.isLoadingPanel = false;
  //   } catch (error) {
  //     this.isLoadingPanel = false;
  //   }
  // }

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
          console.log('loadOption : ', loadOptions);
          // check sort if no no get api and sort no
          if (loadOptions.sort !== null && (this.offset === loadOptions.skip && this.limits === loadOptions.take)) {
            console.log(loadOptions.sort[0].selector)
            this.orderby = loadOptions.sort[0].selector;

          }
          // ดักให้ทำงานเฉพาะกรณีกด Paging / Sorting เท่านั้นกรณีอื่นจะทำให้ Datagrid พัง
          if (this.common.checkLoadOptions(loadOptions) === false) {
            return Promise.resolve({
              data: backData.reverse(),
              totalCount: backItemTotal
            });
          }

          this.limits = loadOptions.take;
          this.orderby = loadOptions.sort;

          let filterData: any = {};

          if (this.filter.hn) {
            filterData.hn = this.filter.hn;
          }
          if (this.filter.patientName) {
            filterData.patientName = this.filter.patientName;
          }

          if (this.filter.deliveryDateFrom) {
            filterData.deliveryDateFrom = this.filter.deliveryDateFrom;
          }

          if (this.filter.deliveryDateTo) {
            filterData.deliveryDateTo = this.filter.deliveryDateTo;
          }

          if (this.tabIndex === 0) {
            filterData.deliveryStatus = this.statusListPending;
          } else {
            filterData.deliveryStatus = this.statusListDelivered;
          }

          if (this.filter.orderStatus) {
            filterData.deliveryStatus = [this.filter.orderStatus]
          }

          if (filterData.deliveryStatus && filterData.deliveryStatus.length > 0) {
            filterData.deliveryStatus = filterData.deliveryStatus.map(str => {
              return this.orderStatusMapByName[str];
            });
            filterData.deliveryStatus = filterData.deliveryStatus.toString();
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

          // console.log(filterData);
          this.checkClickSearch = false;
          filterData.filter = JSON.stringify(filterData.filter);
          // console.log(filterData);


          const checkUrl = this.common.checkMockupUrl('', '', filterData, {
            BASE_API: GlobalVariable.BASE_API,
            BASE_MODULE: GlobalVariable.BASE_MODULE,
            BASE_RESOURCE: GlobalVariable.BASE_RESOURCE + GlobalVariable.BASE_RESOURCE_GET
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
                  let resultData = response.resultData || []
                  resultData = resultData.filter(obj => {
                    obj.deliveryStatusName = this.orderStatusMapById[obj.deliveryStatus];
                    obj.deliveryMethodName = this.deliveryMethodMapById[obj.deliveryMethod];
                    if (obj.deliveryMethod && +obj.deliveryMethod === 6) {
                      obj.deliveryMethodName = obj.deliveryMethodOther;
                    }
                    obj.arrivalTimeName = this.arrivalTimeMapById[obj.arrivalTime];
                    obj.patientItem = this.patientItemListMapById[obj.order.item]
                    return obj;
                  });

                  console.log(resultData)

                  this.getDataPendingOrders = resultData;
                  //click row view description
                  // for (let i = 0; i < this.getDataPendingOrders.length; i++) {
                  //   this.getDataPendingOrders[i].updatedAt = this.common.convertDate(this.getDataPendingOrders[i].updatedAt, 'DD/MM/YYYY HH:mm:ss');
                  // }

                  //num numMicroservices Search Results 0 of 0 Items
                  this.numMicroservices = response.rowCount;
                  // this.numMicroservices = 2;
                  if (this.numMicroservices !== 0) {
                    let page = ((this.offset / this.limits) + 1);
                    this.pageIndex = page - 1
                    this.textTotal = ' Search Results 0 of 0 Item';
                    if ((((this.offset / this.limits) + 2) * this.limits) > this.numMicroservices) {
                      this.dataResultItems = (page - 1) * this.limits + this.getDataPendingOrders.length;
                    } else {
                      this.dataResultItems = this.limits * page;
                    }
                    this.textTotal = 'Search Results ' + (this.offset + 1) + ' - ' + this.dataResultItems + ' of ' + this.numMicroservices + ' Items';
                    if (this.getDataPendingOrders[0].deliveryStatusName === 'Delivered') {
                      this.tabIndex = 1
                    } else {
                      this.tabIndex = 0
                    }
                  } else {
                    this.textTotal = ' Search Results 0 of 0 Item';
                  }
                  this.loading = false;
                  this.changeSize = false;

                }
                else {
                  this.loading = false;
                  this.changeSize = false;
                  this.dataPendingOrders = {};
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
              this.changeSize = false;
              console.log(error);
              return {
                data: [],
                totalCount: this.numMicroservices
              };
            });

        } else {
          console.log('Promise');
          console.log(backData)
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
    let collapse = this.common.collapseFn();
  }

  async fnChangeStatus() {
    this.dataPendingOrders = await this.customStore();
  }

  onValueChanged(event: any, type: string) {
    console.log(event)
    if (event.value && type === 'dateFrom') {
      this.filter.deliveryDateFrom = moment(event.value).format('YYYY-MM-DD')
    }
    if (event.value && type === 'dateTo') {
      this.filter.deliveryDateTo = moment(event.value).format('YYYY-MM-DD')
    }
  }
}
