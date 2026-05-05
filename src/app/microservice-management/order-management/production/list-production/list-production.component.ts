import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';

import { LayoutMenu } from '../../../../shared/store/layout.menu.store';
import { GlobalVariable } from './list-production.global';
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
  selector: 'app-list-production',
  providers: [LayoutMenu, Request, Common],
  templateUrl: './list-production.component.html',
})

export class ListProductionManagementComponent implements OnInit, AfterViewInit {
  @ViewChild('myModal') myModal;
  @ViewChild(DxDataGridComponent) gridDataPendingOrders: DxDataGridComponent;
  @ViewChild(DxDataGridComponent) gridDataDeliverdOrders: DxDataGridComponent;
  dataPendingOrders = {};
  getDataPendingOrders = [];
  dataDeliverdOrders = {};
  getDataDeliverdOrders = [];

  statusList = ['Production Booked', 'Order Inserted in TC', 'First Review Done', 'Printed', 'Waiting for production', 'Receiving', 'Weighing', 'Capsule Filling', 'Packing']

  filter: any = {};
  filterStore: any = {}
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
  orderStatusMapByName = {}
  orderStatusMapById = {}
  deliveryMethodMapByName = {}
  deliveryMethodMapById = {}
  arrivalTimeMapByName = {}
  arrivalTimeMapById = {}
  orderTypeMapByName = {}
  orderTypeMapById = {}
  orderUpdate: any;
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
    console.log(this.loading)
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

  onRowPrepared(e) {
    // UI [List] --> เพิ่มสีของวัน (ดูตาม Production Booking Slot (Date/Time))
    // โดยแบ่งสีตามนี้ -->
    // เลยกำหนด = เตือนด้วยสีแดง,
    // กำหนดผลิต Today = สีขาว / Default,
    // คิว Tomorrow = สีเหลือง,
    // คิววันอื่น = สีเทา
    const data = e.data || {};
    const rowElement: HTMLElement = e.rowElement;
    if (data.productionBookingSlotDateTime) {
      let now = new Date();
      let startDate = moment(data.productionBookingSlotDateTime, 'DD/MM/YYYY').format('YYYY-MM-DD');
      let nowHours = new Date();
      let startTime = moment(data.productionBookingSlotDateTime, 'DD/MM/YYYY HH:mm').format('YYYY-MM-DD HH:mm');
      let deliveryDate = moment(data.delivery.deliveryDate, 'DD/MM/YYYY').format('YYYY-MM-DD');
      let productionEndDate = moment(data.order.productionEndDate, 'DD/MM/YYYY').format('YYYY-MM-DD');
      now.setHours(0, 0, 0, 0);
      let diffDay = this.common.diffDays(startDate, now);
      let diffHours = this.common.diffHours(startTime, nowHours);
      let diffMinutes = this.common.diffMinutes(startTime, nowHours);
      // console.log('data.productionBookingSlotDateTime',data.productionBookingSlotDateTime);
      // console.log('now',now);
      // console.log('startDate',startDate);
      // console.log('deliveryDate',deliveryDate);
      // console.log('diffDay',diffDay);
      // console.log('nowHours',nowHours);
      // console.log('startTime',startTime);
      // console.log('diffHours',diffHours);
      // console.log('diffMinutes',diffMinutes);
      // console.log('diffDays',this.common.diffDays(deliveryDate,productionEndDate));
      if (diffDay < 0 || diffHours < 0 || diffMinutes < 0) {
        rowElement.classList.add('urgent-color');
      } else if (diffDay === 1) {
        rowElement.classList.add('bg-yellow-color');
      } else if (diffDay === 0) {
        if (this.common.diffDays(deliveryDate, productionEndDate) === 0) {
          rowElement.classList.add('bg-blue-color');
        } else {
          rowElement.classList.add('bg-white-color');
        }
      } else {
        rowElement.classList.add('bg-gray-color');
      }
    }

  }

  async clickSearch() {
    try {
      this.checkClickSearch = true;
      this.loadData = false;
      this.gridDataPendingOrders.instance.clearSorting();
      this.gridDataPendingOrders.instance.refresh();
      this.gridDataPendingOrders.instance.pageSize(10);
      this.gridDataPendingOrders.instance.pageIndex(0);
      this.gridDataPendingOrders.instance.columnOption(7, 'sortOrder', 'asc');
    } catch (e) {
      console.log(e);
      const resultDescriptionSystemErrorTitle = environment.resultDescriptionSystemErrorTitle;
      const resultDescriptionSystemErrorMassage = environment.resultDescriptionSystemErrorMassage;
      this.goAlert(resultDescriptionSystemErrorTitle, resultDescriptionSystemErrorMassage, [], 'myModalError');
    }
  }

  async clickClear() {
    try {
      this.filter.dateFrom = null
      this.filter.dateTo = null
      this.filter.orderStatus = ''
      this.checkClickSearch = false;
      this.loadData = false;

      this.gridDataPendingOrders.instance.clearSorting();
      this.gridDataPendingOrders.instance.refresh();
      this.gridDataPendingOrders.instance.pageSize(10);
      this.gridDataPendingOrders.instance.pageIndex(0);
      this.gridDataPendingOrders.instance.columnOption(7, 'sortOrder', 'asc');
    } catch (e) {
      console.log(e);
    }
  }

  goAlert(userTitle, userMessage, userMessageList, modalId,) {
    const dataAlert = {
      'modalId': modalId,
      'userTitle': userTitle,
      'userMessage': userMessage,
      'userMessageList': userMessageList,
      'productDoneDetail': this.orderUpdate,
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

  onClickExport() {
    console.log("onClickExport");
    this.downloadExcel()
  }

  async downloadExcel() {
    let header = [{
      A: "No",
      B: "BIN Name",
      C: "Raw Material Name",
      D: "Updated At",
      // E: "",
      // F: "",
      // G: ""
    }];
    let data: any = await this.getDataAll();
    this.exportAsExcelFile(data, header, 'BIN');
  }

  async getDataAll() {
    let data = [];
    const checkUrl = this.common.checkMockupUrl('', '', {

      orderby: 'updatedAt|DESC'
    }, {
      BASE_API: GlobalVariable.BASE_API,
      BASE_MODULE: GlobalVariable.BASE_MODULE,
      BASE_RESOURCE: GlobalVariable.BASE_RESOURCE + GlobalVariable.BASE_RESOURCE_GET
    });
    const res = await this.request.get(checkUrl.url, checkUrl.filter)
    if (res.resultCode === "20000") {
      data = [...data, ...res.resultData]
      // rowCount = res.rowCount
    }
    console.log(res);
    // } while (rowCount < data.length);
    return data.map((r, i) => {
      return {
        no: i + 1,
        binName: r.binName,
        rawMaterialName: r.rawMaterials && r.rawMaterials.length ? r.rawMaterials[0].rawMaterialName : '',
        updatedAt: r.updatedAt ? moment(r.updatedAt).format("DD/MM/YYYY HH:mm:ss") : ""
      }
    });
  }


  public exportAsExcelFile(json: any[], headerText: any[], excelFileName: string): void {
    var worksheet = XLSX.utils.json_to_sheet(headerText, { header: [], skipHeader: true });
    XLSX.utils.sheet_add_json(worksheet, json, { skipHeader: true, origin: "A2" });
    const workbook: XLSX.WorkBook = { Sheets: { 'data': worksheet }, SheetNames: ['data'] };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    this.saveAsExcelFile(excelBuffer, excelFileName);
  }

  private saveAsExcelFile(buffer: any, fileName: string): void {
    const data: Blob = new Blob([buffer], {
      type: EXCEL_TYPE
    });
    FileSaver.saveAs(data, fileName + "_" + moment().format("YYYYMMDD") + EXCEL_EXTENSION);
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

          this.limits = loadOptions.take;
          let filterData: any = {};
          if (this.filter.dateFrom) {
            filterData.dateFrom = moment(this.filter.dateFrom).format('YYYY-MM-DD')
          }

          if (this.filter.dateTo) {
            filterData.dateTo = moment(this.filter.dateTo).format('YYYY-MM-DD')
          }

          if (this.filter.orderStatus) {
            filterData.orderStatus = this.orderStatusMapByName[this.filter.orderStatus]
          } else {
            filterData.orderStatus = "13,14,17,18,19,20,21,22,23"
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
              orderby: loadOptions.sort ? loadOptions.sort[0].selector : 'productionEndDate|ASC'
            };
          } else {
            filterData = {
              ...filterData,
              offset: this.offset,
              limit: this.limits,
              orderby: loadOptions.sort ? loadOptions.sort[0].selector : 'productionEndDate|ASC'
            };
          }

          // console.log(filterData);
          this.checkClickSearch = false;

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

                  resultData = resultData.filter(obj => {
                    obj.typeName = this.orderTypeMapById[obj.order.type];
                    obj.orderstatusName = this.orderStatusMapById[obj.order.orderStatus];
                    obj.deliveryMethodName = this.deliveryMethodMapById[obj.delivery.deliveryMethod];
                    obj.arrivalDateTime = obj.delivery.deliveryDate.split(' ')[0] + ' (' + this.arrivalTimeMapById[obj.delivery.arrivalTime] + ')'
                    obj.productionBookingSlotDateTime = obj.order.productionEndDate.split(' ')[0] + ' ' + obj.order.productionEndTime
                    return obj;
                  })

                  console.log(resultData)
                  this.getDataPendingOrders = resultData;
                  this.numMicroservices = response.rowCount;

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

  onValueChangedDate(e: any, type: string) {
    if (type === 'dateFrom') {
      this.filter.dateFrom = e.value
    } else if (type === 'dateTo') {
      this.filter.dateTo = e.value
    }
  }

  async fnOpenModal(data: any) {
    this.orderUpdate = data;
    if (data.order.orderStatus === 19) {
      this.goAlert('assets/icon-md/c15.svg', 'You want to change status to receiving ?', [], 'myModalConfirmProduction');
    } else if (data.order.orderStatus === 20 && data.order.type === 1) {
      this.goAlert('assets/icon-md/c14.svg', 'You want to change status to weighing ?', [], 'myModalConfirmProduction');
    } else if (data.order.orderStatus === 20 && data.order.type === 2) {
      this.goAlert('assets/icon-md/c13.svg', 'You want to change status to packing?', [], 'myModalConfirmProduction');
    } else if (data.order.orderStatus === 21) {
      this.goAlert('fas fa-capsules', 'You want to change status to capsule filling ?', [], 'myModalConfirmProduction');
    } else if (data.order.orderStatus === 22) {
      this.goAlert('assets/icon-md/c13.svg', 'You want to change status to packing ?', [], 'myModalConfirmProduction');
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
      if (this.orderUpdate.order.orderStatus === 22 || (this.orderUpdate.order.orderStatus === 20 && this.orderUpdate.order.type === 2)) {
        orderStatusUpdate = 23
      }
      let data: any = {
        orderId: this.orderUpdate.order.orderId,
        orderStatus: orderStatusUpdate,
      };

      const resultCodeSuccess = environment.resultCodeSuccess;

      let response = await this.request.post(url, data);

      // this.userMessage = response.userMessage;
      if (response.resultCode === resultCodeSuccess) {
        this.goAlert('', '', [], 'myModalSuccess');
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

      let response = await this.request.post(url, data);

      // this.userMessage = response.userMessage;
      if (response.resultCode === resultCodeSuccess) {
        this.goAlert('', '', [], 'myModalSuccess');
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

  async onClickEditOrder() {
    try {
      this.disbledBtn = {
        "create": true
      };
      let url = GlobalVariable.BASE_API + GlobalVariable.BASE_RESOURCE + GlobalVariable.BASE_RESOURCE_UPDATE_ERROR_ORDER;

      let locationText = this.errorText[this.errorText.length - 1].split('in ')[1]
      locationText = locationText.replaceAll('.', '')
      let data: any = {
        orderId: this.orderUpdate.order.orderId,
        location: locationText,
        rawMaterials: [],
        finishedProducts: [],
        itemNotFound: []
      };

      if (this.errorText.includes('Raw Materials code')) {
        for (let index = 1; index < this.errorText.length - 1; index++) {
          let element = this.errorText[index];
          if (element.includes('-')) {
            element = element.replaceAll('- ', '');
            element = element.split(' is ')
            let status = element[1]
            data.rawMaterials.push({
              rawMaterialCode: element[0],
              status: status
            })
          } else {
            this.errorText.splice(0, index)
            break;
          }
        }
      }
      if (this.errorText.includes('Finished Products code')) {
        for (let index = 1; index < this.errorText.length - 1; index++) {
          let element = this.errorText[index];
          if (element.includes('-')) {
            element = element.replaceAll('- ', '');
            element = element.split(' is ')
            let status = element[1]
            data.finishedProducts.push({
              finishedProductCode: element[0],
              status: status
            })
          } else {
            this.errorText.splice(0, index)
            break;
          }
        }
      }
      if (this.errorText.includes('Item not found from TrakCare')) {
        for (let index = 1; index < this.errorText.length - 1; index++) {
          let element = this.errorText[index];
          if (element.includes('-')) {
            element = element.replaceAll('- ', '');
            element = element.split(' , ')
            console.log(element)
            data.itemNotFound.push({
              code: element[0].split(': ')[1],
              name: element[1].split(': ')[1]
            })
          } else {
            this.errorText.splice(0, index)
            break;
          }
        }
      }

      console.log(data)

      const resultCodeSuccess = environment.resultCodeSuccess;

      let response = await this.request.post(url, data);

      // this.userMessage = response.userMessage;
      if (response.resultCode === resultCodeSuccess) {
        this.goAlert('', '', [], 'myModalSuccess');
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

}