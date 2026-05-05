import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';

import { LayoutMenu } from '../../../../shared/store/layout.menu.store';
import { GlobalVariable } from './list-production-done.global';
import { Request } from '../../../../shared/services/request.service';
import { Common } from '../../../../shared/services/common.service';
import { DxDataGridComponent } from 'devextreme-angular';
import * as moment from 'moment';
import { environment } from '../../../../../environments/environment';
import CustomStore from 'devextreme/data/custom_store';
import { StoreService } from '../../../../shared/services/store.service';
import * as FileSaver from 'file-saver';
import * as XLSX from 'xlsx';
const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
const EXCEL_EXTENSION = '.xlsx';

@Component({
  selector: 'app-list-production-done',
  providers: [LayoutMenu, Request, Common],
  templateUrl: './list-production-done.component.html',
  styleUrls: ['./list-production-done.scss'],
})

export class ListProductionDoneComponent implements OnInit, AfterViewInit {
  [x: string]: any;
  @ViewChild('myModal') myModal;
  @ViewChild(DxDataGridComponent) gridDataPendingOrders: DxDataGridComponent;
  @ViewChild(DxDataGridComponent) gridDataDeliverdOrders: DxDataGridComponent;
  dataPendingOrders = {};
  getDataPendingOrders = [];
  dataDeliverdOrders = {};
  getDataDeliverdOrders = [];

  statusList = ['Waiting for production',
    'Receiving',
    'Weighing',
    'Capsule Filling',
    'Packing'
  ]

  filter = {
    productionDate: null
  };

  errorFilePath: string;
  fileUpload: string;
  dxgridPageSize;
  allowedPageSizes = environment.allowedPageSizes;
  offset;
  limits;
  orderby;
  textTotal = ' Search Results 0 of 0 Item';
  totalCaseAndSupply = 'Total x cases per day | x Supplies per day.';
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
  orderStatusMapByName = {}
  orderStatusMapById = {}
  deliveryMethodMapByName = {}
  deliveryMethodMapById = {}
  arrivalTimeMapByName = {}
  arrivalTimeMapById = {}
  orderTypeMapByName = {}
  orderTypeMapById = {}
  orderUpdate: any;
  timeSlot = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23]
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
    // this.statusList = environment.positionList;
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
    const dropdown = await this.common.searchConfig();
    for (const orderStatus of dropdown.orderStatus) {
      this.orderStatusMapByName[orderStatus.name] = orderStatus.id;
      this.orderStatusMapById[orderStatus.id] = orderStatus.name;
    }
    for (const deliveryMethod of dropdown.deliveryMethodList) {
      this.deliveryMethodMapByName[deliveryMethod.name] = deliveryMethod.id;
      this.deliveryMethodMapById[deliveryMethod.id] = deliveryMethod.name;
    }

    for (const arrivalTime of dropdown.arrivalTimeList) {
      this.arrivalTimeMapByName[arrivalTime.name] = arrivalTime.id;
      this.arrivalTimeMapById[arrivalTime.id] = arrivalTime.name;
    }

    for (const orderType of dropdown.orderTypeList) {
      this.orderTypeMapByName[orderType.name] = orderType.id;
      this.orderTypeMapById[orderType.id] = orderType.name;
    }

    try {
      this.dataPendingOrders = await this.customStore();
    } catch (e) {
      console.log('catch: ', e);
    }
  }

  async changeTab() {
    try {
      this.dataPendingOrders = await this.customStore();
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
      this.gridDataPendingOrders.instance.columnOption(9, 'sortOrder', 'asc');
    } catch (e) {
      console.log(e);
      const resultDescriptionSystemErrorTitle = environment.resultDescriptionSystemErrorTitle;
      const resultDescriptionSystemErrorMassage = environment.resultDescriptionSystemErrorMassage;
      this.goAlert(resultDescriptionSystemErrorTitle, resultDescriptionSystemErrorMassage, [], 'myModalError');
    }
  }

  async clickClear() {
    try {
      this.filter.productionDate = null
      this.checkClickSearch = false;
      this.loadData = false;
      this.gridDataPendingOrders.instance.clearSorting();
      this.gridDataPendingOrders.instance.refresh();
      this.gridDataPendingOrders.instance.pageSize(10);
      this.gridDataPendingOrders.instance.pageIndex(0);
      this.gridDataPendingOrders.instance.columnOption(9, 'sortOrder', 'asc');
    } catch (e) {
      console.log(e);
    }
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

  customStore() {
    const dataSource: any = {};
    this.loadData = false;
    let backData: any = [];
    let backItemTotal = 0;

    dataSource.store = new CustomStore({
      load: (loadOptions) => {
        // if (!this.loadData) {
        console.log('loadOption : ', loadOptions);
        // check sort if no no get api and sort no
        if (loadOptions.sort !== null) {
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

        let filterData: any = {
          // fields: '',
          // filter: '',
          offset: 0,
          limit: 10,
          // orderby: ''
        };

        if (this.filter.productionDate) {
          filterData.productionDate = moment(this.filter.productionDate).format('YYYY-MM-DD')
        } else {
          filterData.productionDate = moment().format('YYYY-MM-DD')
        }

        if (this.checkClickSearch === true) {
          filterData = {
            ...filterData,
            offset: 0,
            limit: this.limits,
            orderby: this.orderby
          };
        } else {
          filterData = {
            ...filterData,
            offset: this.offset,
            limit: this.limits,
            orderby: this.orderby
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

        // console.log(checkUrl);
        // console.log(checkUrl.url);
        // console.log(checkUrl.filter);
        // this.loadData = true;

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

              // // this.userMessage = response.userMessage;
              const resultCodeSuccess = environment.resultCodeSuccess;
              console.log(this.resResultCode);
              if (this.resResultCode === resultCodeSuccess) {

                let resultData = response.resultData

                let timeArray = []

                resultData = resultData.filter(obj => {
                  obj.typeName = this.orderTypeMapById[obj.type];
                  // obj.operation = JSON.parse(obj.operation)
                  // obj.operation1 = (obj.operation.includes(4) || obj.operation.includes(5)) ? true : false
                  // obj.operation2 = obj.operation.includes(2) ? true : false
                  // obj.operation3 = obj.operation.includes(3) ? true : false
                  obj.productionBookingSlotDateTime = obj.productionEndDate + ' ' + obj.productionEndTime
                  obj.productionStartDateTime = obj.realProductionStartDate + ' ' + obj.realProductionStartTime
                  obj.productionEndDateTime = obj.realProductionEndDate + ' ' + obj.realProductionEndTime
                  obj.endTime = +(obj.productionEndTime.split(':')[0])
                  obj.endTimeMin = +(obj.productionEndTime.split(':')[1]) === 0 ? 0 : +(obj.productionEndTime.split(':')[1]) / 60 * 100
                  obj.realStartTime = +(obj.realProductionStartTime.split(':')[0])
                  obj.realStartTimeMin = +(obj.realProductionStartTime.split(':')[1]) === 0 ? 0 : +(obj.realProductionStartTime.split(':')[1]) / 60 * 100
                  obj.realEndTime = +(obj.realProductionEndTime.split(':')[0])
                  obj.realEndTimeMin = +(obj.realProductionEndTime.split(':')[1]) === 0 ? 0 : +(obj.realProductionEndTime.split(':')[1]) / 60 * 100
                  return obj;
                })

                console.log(resultData)
                console.log(this.timeSlot)
                this.getDataPendingOrders = resultData;
                this.numMicroservices = response.rowCount;

                if (this.numMicroservices !== 0) {
                  let page = ((this.offset / this.limits) + 1);
                  let totalSupplyDay = resultData.reduce(function (sum, item) {
                    const supplyDay = Number(item.supplyDay);
                    return sum + (isNaN(supplyDay) ? 0 : supplyDay);
                  }, 0);
                  this.pageIndex = page - 1
                  this.textTotal = ' Search Results 0 of 0 Item';
                  if ((((this.offset / this.limits) + 2) * this.limits) > this.numMicroservices) {
                    this.dataResultItems = (page - 1) * this.limits + this.getDataPendingOrders.length;
                  } else {
                    this.dataResultItems = this.limits * page;
                  }
                  this.textTotal = 'Search Results ' + (this.offset + 1) + ' - ' + this.dataResultItems + ' of ' + this.numMicroservices + ' Items';
                  this.totalCaseAndSupply = 'Total ' + this.numMicroservices + ' cases per day | ' + totalSupplyDay + ' Supplies per day.';
                } else {
                  this.textTotal = ' Search Results 0 of 0 Item';
                  this.totalCaseAndSupply = 'Total 0 cases per day | 0 Supplies per day.';
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
          .catch(() => {
            setTimeout(() => {
              this.loadData = false;
            }, 200);
            this.changeSize = false;
            console.log('return catch');
            return {
              data: [],
              totalCount: this.numMicroservices
            };
          });

        // } else {
        //   console.log('Promise');
        //   console.log(backData)
        //   return Promise.resolve({
        //     data: backData,
        //     totalCount: backItemTotal
        //   });
        // }
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

  onValueChangedDate(e: any) {
    this.filter.productionDate = moment(e.value).format('YYYY-MM-DD')
  }

  fnOpenModal(data: any) {
    this.orderUpdate = data;
    if (data.order.orderStatus === 19) {
      this.goAlert('assets/icon-md/c15.svg', 'You want to change status to receiving ?', [], 'myModalConfirmProduction');
    } else if (data.order.orderStatus === 20 && data.order.type === 1) {
      this.goAlert('assets/icon-md/c14.svg', 'You want to change status to weighing ?', [], 'myModalConfirmProduction');
    }
    else if (data.order.orderStatus === 20 && data.order.type === 2) {
      this.goAlert('assets/icon-md/c17.svg', 'You want to change status to packing?', [], 'myModalConfirmProduction');
    } else if (data.order.orderStatus === 21) {
      this.goAlert('fas fa-capsules', 'You want to change status to capsule filling ?', [], 'myModalConfirmProduction');
    } else if (data.order.orderStatus === 22) {
      this.goAlert('assets/icon-md/c16.svg', 'You want to change status to packing ?', [], 'myModalConfirmProduction');
    } else if (data.order.orderStatus === 23) {
      this.goAlert('assets/icon-md/c17.svg', '', [], 'myModalConfirmProductionDone');
    }
  }

  async onOkProduction() {
    try {
      this.disbledBtn = {
        "create": true
      };
      let url = GlobalVariable.BASE_API + GlobalVariable.BASE_RESOURCE + GlobalVariable.BASE_RESOURCE_UPDATE;
      // let url = GlobalVariable.BASE_API + GlobalVariable.BASE_RESOURCE + '/' + this.getIdDelete;

      let orderStatusUpdate
      if (this.orderUpdate.order.orderStatus === 19) {
        orderStatusUpdate = 20
      }
      if (this.orderUpdate.order.orderStatus === 20) {
        orderStatusUpdate = 21
      }
      if (this.orderUpdate.order.orderStatus === 21) {
        orderStatusUpdate = 22
      }
      if (this.orderUpdate.order.orderStatus === 22) {
        orderStatusUpdate = 23
      }
      let data: any = {
        orderId: this.orderUpdate.order.orderId,
        orderStatus: orderStatusUpdate,
      };

      if (orderStatusUpdate === 24) {
        data.productionNote = '',
          data.packageNote = '',
          data.productionPicture = ''
      }

      const resultCodeSuccess = environment.resultCodeSuccess;

      let response = await this.request.patch(url, data);

      // this.userMessage = response.userMessage;
      if (response.resultCode === resultCodeSuccess) {
        this.goAlert('', '', [], 'myModalSuccessDelete');
        this.dataPendingOrders = this.customStore();

      }
      else {
        console.log('error');
        this.goAlert(response.resultCode, response.resultDescription, [], 'myModalError');
      }
    } catch (e) {
      console.log(e);
      this.disbledBtn = {
        "create": false
      };
    }
  }

  async onOkProductionDone(e: any) {
    try {
      this.disbledBtn = {
        "create": true
      };
      let url = GlobalVariable.BASE_API + GlobalVariable.BASE_RESOURCE + GlobalVariable.BASE_RESOURCE_UPDATE;
      // let url = GlobalVariable.BASE_API + GlobalVariable.BASE_RESOURCE + '/' + this.getIdDelete;

      let data: any = {
        orderId: this.orderUpdate.order.orderId,
        orderStatus: 24,
        productionNote: e.productionNote,
        packageNote: e.packageNote,
        productionPicture: e.productionPicture
      };

      const resultCodeSuccess = environment.resultCodeSuccess;

      let response = await this.request.patch(url, data);

      // this.userMessage = response.userMessage;
      if (response.resultCode === resultCodeSuccess) {
        this.goAlert('', '', [], 'myModalSuccessDelete');
        this.dataPendingOrders = this.customStore();

      }
      else {
        console.log('error');
        this.goAlert(response.resultCode, response.resultDescription, [], 'myModalError');
      }
    } catch (e) {
      console.log(e);
      this.disbledBtn = {
        "create": false
      };
    }
  }

  onRowPrepared(e) {
    const data = e.data || {};
    const rowElement: HTMLElement = e.rowElement;

    if (data.operation) {
      try {
        const operation = JSON.parse(data.operation);
        if (Array.isArray(operation) && !operation.includes(3)) {
          rowElement.classList.add('urgent-color');
        }
      } catch (e) {
        console.log("onRowPrepared e: ", e)
      }
    }
  }
}