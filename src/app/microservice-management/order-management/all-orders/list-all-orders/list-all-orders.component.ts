import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Request } from '../../../../shared/services/request.service';
import { Common } from '../../../../shared/services/common.service';
import { DxDataGridComponent } from 'devextreme-angular';
import * as moment from 'moment';
import { environment } from '../../../../../environments/environment';
import CustomStore from 'devextreme/data/custom_store';
import { StoreService } from '../../../../shared/services/store.service';
import { LayoutMenu } from 'src/app/shared/store/layout.menu.store';
import { SharedService } from 'src/app/shared/services/shared.service';
import { GlobalVariable } from '../../orders/pharmacist-view/list-order-pharmacist.global';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';

declare let $: any;

@Component({
  selector: 'app-list-all-orders',
  providers: [LayoutMenu, Request, Common],
  templateUrl: './list-all-orders.component.html',
  styleUrls: ['./list-all-orders.component.scss'],
})
export class ListAllOrdersComponent implements OnInit, AfterViewInit {
  @ViewChild('myModal') myModal;
  @ViewChild('modalImportDocument') modalImportDocument: any;
  @ViewChild(DxDataGridComponent) gridDataPendingOrders: DxDataGridComponent;
  dataPendingOrders = {};
  getDataPendingOrders = [];
  locationDetailList = []
  statusList = [
    "Order Received",
    "Order Reviewed",
    "Quotation Received",
    "Waiting for Customer",
    "Customer Need to Change",
    "Cannot Contact Customer",
    "Reminded",
    "Customer Rejected",
    "Customer Approve",
    "Urgent Request",
    "Urgent Approve",
    // "Production Reserved",
    "Production Booked",
    "Order Inserted in TC",
    "Change Booking",
    "Change Booking (Order Inserted in TC)",
    "First Review Done",
    "Printed",
    "Waiting for production",
    "Receiving",
    "Weighing",
    "Capsule Filling",
    "Packing",
    "Production Done",
    "First Check Done",
    "Complete",
    "Finished Product Delivery",
    "(Pre-Order) Finished Product",
    "Complete (Finished Product Delivery)",
    "Complete (Pre-Order) Finished Product",
    "Waiting for delivery",
    "Form Printed",
    "Cannot Deliver",
    "Change Delivery Detail",
    "Delivered",
  ];
  orderStatusList = [];
  orderStatusMap = {};
  tabIndex = 0;
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
  resResultCode;
  remotePaging;
  getIdDelete;
  loading = true;
  disbledBtn = {
    'create': false
  };
  menuHome: any = false;
  menuPermissions: any = { view: false, add: false, edit: false, delete: false };
  menuPermissionsPharmacist: any = { view: false, add: false, edit: false, delete: false };
  reOrderId: number;
  inactiveId: number;
  orderStatusNumber: number;
  filter = {
    hn: '',
    patientName: '',
    orderStatus: '',
    orderDate: null,
    locationDetail: '',
    productionDate: null,
    deliveryDate: null,
  };
  filterStore = {}
  orderStatusMapByName = {}
  role: string;
  errorText: any;
  changeSize = false
  pageIndex = 0
  step: number;
  hn: any;
  disbledBtnModal: boolean;
  hnFound: any;
  isLoadingPanel = false;
  importForm: FormGroup;

  constructor(
    public router: Router,
    private request: Request,
    public layoutMenu: LayoutMenu,
    public common: Common,
    private sharedService: SharedService,
    private store: StoreService,
    private fb: FormBuilder,
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
    this.importForm = this.fb.group({
      'txtImportHn': new FormControl('', [Validators.required]),
    });
  }

  async ngOnInit() {
    const dropdown = await this.common.searchConfig()
    this.orderStatusList = Array.from(
      new Map((dropdown.orderStatus || []).map(item => [item.name, item])).values()
    ).filter((item: any) => item.name !== 'Production Reserved');
    for (const orderStatus of dropdown.orderStatus) {
      if (!this.orderStatusMapByName[orderStatus.name]) {
        this.orderStatusMapByName[orderStatus.name] = [];
      }
      this.orderStatusMapByName[orderStatus.name].push(orderStatus.id);

      if (!this.orderStatusMap[orderStatus.id]) {
        this.orderStatusMap[orderStatus.id] = [];
      }
      this.orderStatusMap[orderStatus.id].push(orderStatus.name);
    }

    if (sessionStorage.getItem('role')) {
      this.role = sessionStorage.getItem('role');
    }

    this.store.subscribePagePermissionList().subscribe(pagePermissionList => {
      console.log('ngOnInit', pagePermissionList, environment.roleURL.order);
      // /order-management/orders-pharmacist-view

      const pagePermission = pagePermissionList.find(r => r.url === environment.roleURL.order);
      // For check reorder icon check role creare Order page
      const pagePermissionPharmacist = pagePermissionList.find(r => r.url === environment.roleURL.pharmacistView);
      console.log(pagePermission);
      if (pagePermission) {
        try {
          this.menuPermissions = JSON.parse(pagePermission.menuPermissions);
          this.menuPermissionsPharmacist = JSON.parse(pagePermissionPharmacist.menuPermissions);
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
    await this.getLocaltionList()
  }

  goHomeMenu() {
    if (this.menuHome) {
      this.router.navigate(['/menu', this.menuHome['menuId'], this.menuHome['typePage']]);
    }
  }

  ngAfterViewInit() {
    try {
      if (sessionStorage.getItem('role')) {
        this.role = sessionStorage.getItem('role');
      }
      this.dataPendingOrders = this.customStore();
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
      this.gridDataPendingOrders.instance.columnOption(8, 'sortOrder', 'desc');
    } catch (e) {
      console.log(e);
      const resultDescriptionSystemErrorTitle = environment.resultDescriptionSystemErrorTitle;
      const resultDescriptionSystemErrorMassage = environment.resultDescriptionSystemErrorMassage;
      this.goAlert(resultDescriptionSystemErrorTitle, resultDescriptionSystemErrorMassage, [], 'myModalError');
    }
  }

  async clickClear() {
    try {
      this.filter = {
        hn: '',
        patientName: '',
        orderStatus: '',
        orderDate: null,
        locationDetail: '',
        productionDate: null,
        deliveryDate: null,
      };
      this.checkClickSearch = false;
      this.loadData = false;
      this.gridDataPendingOrders.instance.clearSorting();
      this.gridDataPendingOrders.instance.refresh();
      this.gridDataPendingOrders.instance.pageSize(10);
      this.gridDataPendingOrders.instance.pageIndex(0);
      this.gridDataPendingOrders.instance.columnOption(8, 'sortOrder', 'desc');
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

  async getLocaltionList() {
    console.log("-----", this.locationDetailList)
    const checkUrl = this.common.checkMockupUrl('', '', {}, {
      BASE_API: '',
      BASE_MODULE: environment.apiPrefix,
      BASE_RESOURCE: environment.searchDdlLocations
    });
    console.log("====", checkUrl)
    //searchDdlLocations
    const resultCodeSuccess = environment.resultCodeSuccess;
    const response = await this.request.get(checkUrl.url, checkUrl.filter);
    if (response.resultCode === resultCodeSuccess) {
      const data = await response.resultData || response.data || [];
      this.locationDetailList = data
    } else {
      this.locationDetailList = [];
    }
  }
  changeFilter(filterData) {
    let isChange = false
    if (this.offset != 0 && JSON.stringify(filterData) != this.filterStore) {
      isChange = true
    }
    return isChange
  }

  customStore() {
    const dataSource: any = {};
    this.loadData = false;
    let backData: any = [];
    let backItemTotal = 0;

    dataSource.store = new CustomStore({
      load: (loadOptions) => {
        if (!this.loadData) {
          if (loadOptions.sort !== null && (this.offset === loadOptions.skip && this.limits === loadOptions.take)) {
            this.orderby = loadOptions.sort[0].selector;
          }
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
          if (this.filter.locationDetail) {
            filterData.locationDetail = (this.filter.locationDetail as any).name;
          }

          if (this.filter.orderStatus) {
            filterData.orderStatus = [this.filter.orderStatus]
            filterData.orderStatus = filterData.orderStatus.map(str => {
              return this.orderStatusMapByName[str];
            });
            // if (filterData.orderStatus[0] === 29 || filterData.orderStatus[0] === 30 || filterData.orderStatus[0] === 31 || filterData.orderStatus[0] === 32 || filterData.orderStatus[0] === 33) {
            //   filterData.isOneDeliveryDetail = 'true';
            // }
            filterData.isOneDeliveryDetail = 'true';
            filterData.orderStatus = filterData.orderStatus.toString();
          } else {
            filterData.isOneDeliveryDetail = 'true';
          }

          if (this.filter.orderDate) {
            filterData.orderDate = moment(this.filter.orderDate).format('YYYY-MM-DD');
          }

          if (this.filter.productionDate) {
            filterData.productionDate = moment(this.filter.productionDate).format('YYYY-MM-DD');
          }

          if (this.filter.deliveryDate) {
            filterData.deliveryDate = moment(this.filter.deliveryDate).format('YYYY-MM-DD');
          }

          if (this.common.isRoleClinics(this.role)) {
            filterData.locationType = 2;
            filterData.locationDetail = this.role;
          }

          if (this.changeSize) {
            this.offset = 0
          } else {
            this.offset = loadOptions.skip;
          }

          const isChange = this.changeFilter(filterData)
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
            BASE_RESOURCE: environment.searchOrders
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

                // // this.userMessage = response.userMessage;
                const resultCodeSuccess = environment.resultCodeSuccess;
                console.log(this.resResultCode);
                if (this.resResultCode === resultCodeSuccess) {

                  this.getDataPendingOrders = response.resultData;
                  // console.log( 'getDataPendingOrders',this.getDataPendingOrders)

                  for (let i = 0; i < this.getDataPendingOrders.length; i++) {

                    this.getDataPendingOrders[i]['orderStatusNumber'] = this.getDataPendingOrders[i].orderStatus;
                    this.getDataPendingOrders[i].orderStatus = this.orderStatusMap[this.getDataPendingOrders[i].orderStatus] + (this.getDataPendingOrders[i].deliveryStatus ? ` (${this.orderStatusMap[this.getDataPendingOrders[i].deliveryStatus]})` : '');

                  }
                  // console.log( 'getDataPendingOrders',this.getDataPendingOrders)

                  this.numMicroservices = response.rowCount;
                  if (this.numMicroservices !== 0) {
                    const page = ((this.offset / this.limits) + 1);
                    this.pageIndex = page - 1
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
                    this.dataPendingOrders = {};
                    this.getDataPendingOrders = [];
                    this.numMicroservices = 0;
                    this.textTotal = ' Search Results 0 of 0 Item';
                  }
                  this.loading = false;
                  this.changeSize = false;

                } else {
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

  fnReOrder(id: number, hn: string, orderStatusNumber: number) {
    this.reOrderId = id;
    this.orderStatusNumber = orderStatusNumber;

    this.goAlert('Are you sure', 'You want to reorder of HN' + hn + ' ?', [], 'myModalConfirmReOrder');
  }

  async fnGoView(data: any, viewAllOrder = false) {
    if (data.deliveryDetail_deliveryDetailId) {
      localStorage.setItem('deliveryDetailId', data.deliveryDetail_deliveryDetailId);
    }
    if (viewAllOrder) {
      this.router.navigate(['/order-management/all-orders', data.orderId, 'view']);
    } else {
      if (data.id) {
        data.orderId = data.id
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
        localStorage.setItem('redirectPage', 'allOrder');
        this.router.navigate(['/order-management/orders-cashier-view/queue-management-finished-product', data.orderId, 'view']);
      } else {
        this.errorText = response.resultDescription.split('\n')
        if (!this.menuPermissions.edit) {
          this.goAlert(response.resultCode, response.resultDescription, [], 'myModalOrderErrorStatus1');
        } else {
          this.goAlert(response.resultCode, response.resultDescription, [], 'myModalOrderError');
        }
      }
    }
  }

  onOkReOrder() {
    setTimeout(() => {

      console.log(this.orderStatusNumber);
      if (this.orderStatusNumber === 28 || this.orderStatusNumber == 35) {
        this.router.navigate(['/order-management/orders-cashier-view/queue-management-finished-product', this.reOrderId, 'reorder']);
      } else {
        this.router.navigate(['/order-management/orders-pharmacist-view', this.reOrderId, 'reorder']);
      }
    }, 100);
  }

  setRedirect() {
    this.sharedService.redirectPage = "allOrder"
  }

  goCreate() {
    this.router.navigate(['/order-management', 'orders-pharmacist-view', 'new']);
  }

  async fnUploadTemplate() {
    this.open();
  }

  async open() {
    this.importForm.controls['txtImportHn'].reset();
    this.step = 0;
    this.hn = null;
    $(this.modalImportDocument.nativeElement).modal('show');

    // ปรับ html <body> ให้กลับเป็นปกติเมื่อเปิด-ปิด modal
    document.body.style.paddingRight = '0px';
  }

  close() {
    $(this.modalImportDocument.nativeElement).modal('hide');
  }

  fnCheckImportForm() {
    for (const key in this.importForm.controls) {
      if (this.importForm.controls[key].errors) {
        this.importForm.controls[key].setErrors({ 'forceRequired': true });
        this.importForm.controls[key].markAsDirty();
      } else {
        this.importForm.controls[key].updateValueAndValidity();
      }
    }

    return this.importForm.valid;
  }

  async clickNext() {
    if (this.step === 0) {
      const isValid = this.fnCheckImportForm();
      if (isValid) {
        let url = GlobalVariable.BASE_API + GlobalVariable.BASE_RESOURCE_PATIENT + GlobalVariable.BASE_RESOURCE_GET_PATIENT;
        // let url = GlobalVariable.BASE_API + GlobalVariable.BASE_RESOURCE + '/' + this.getIdDelete;

        let data = {
          'hn': this.hn
        };

        const resultCodeSuccess = environment.resultCodeSuccess;

        let response = await this.request.get(url, data);

        // this.userMessage = response.userMessage;
        if (response.resultCode === resultCodeSuccess) {
          this.hnFound = this.hn
          this.step = 2
        } else {
          this.step = 1
          this.disbledBtnModal = true
        }
      }
    } else {
      this.step = 2
    }
  }

  onChangeHn() {
    if (this.hn) {
      this.disbledBtnModal = false;
    } else {
      this.disbledBtnModal = true;
    }
  }

  fnDownloadPatientTemplate() {
    try {
      window.open(environment.ip + '/download/template/Patient_Info_Template.xlsx')
    } catch (err) {
      console.log(err)
    }
  }

  async onFileChangePatient(evt: any) {
    console.log(evt)
    try {
      const cp = this;
      const target: DataTransfer = <DataTransfer>(evt.target);
      this.fileUpload = target.files[0].name
      const fileType = (this.fileUpload).split('.');

      if (target.files.length !== 1)
        throw new Error('Cannot use multiple files');
      if (fileType[fileType.length - 1] == 'xlsx' || fileType[fileType.length - 1] == 'xlx') {
        let url = GlobalVariable.BASE_API + GlobalVariable.BASE_RESOURCE_PATIENT + GlobalVariable.BASE_RESOURCE_IMPORT_PATIENT;

        let formData = new FormData();

        formData.append('file', target.files[0], target.files[0].name)

        try {
          this.isLoadingPanel = true;
          let response = await this.request.postFile(url, formData);
          if (response.resultCode !== '20000') {
            let errorMessage = response.resultDescription
            let errorMessagList = []
            if (response.resultCode === '40305') {
              this.errorFilePath = response.fileErrorPath;
              errorMessage = '';
              errorMessagList = this.common.messageInvalidFields(response);
              this.goAlert(response.resultCode, errorMessage, errorMessagList, 'modalErrorImport');
            } else if (response.resultCode === '40306') {
              this.goAlert('Invalid File Format', errorMessage, errorMessagList, 'myModalWarning');
            } else {
              this.goAlert(response.resultCode, response.resultDescription, [], 'myModalError');
            }

          } else {
            $(this.modalImportDocument.nativeElement).modal('hide');
            this.goAlert('', '', [], 'myModalSuccess');
            this.disbledBtnModal = true;
          }
          this.isLoadingPanel = false;
        } catch (error) {
          this.isLoadingPanel = false;
        }


      } else {
        this.goAlert('Invalid File Format', 'File should be .xlx or .xlxs', [], 'myModalWarning');
      }
    } catch (e) {
      console.log(e);
    }
    evt.target.value = '';
  }

  async fnDownloadTemplate() {
    try {
      console.log()
      const checkUrl = this.common.checkMockupUrl('', '', { hn: this.hnFound }, {
        BASE_API: GlobalVariable.BASE_API,
        BASE_MODULE: GlobalVariable.BASE_MODULE,
        BASE_RESOURCE: GlobalVariable.BASE_RESOURCE + GlobalVariable.BASE_RESOURCE_DOWNLOAD_FILE
      });

      const resultCodeSuccess = environment.resultCodeSuccess;

      let resp = await this.request.get(checkUrl.url, checkUrl.filter)
      if (resp.resultCode === resultCodeSuccess) {
        window.open(resp.filePath)
      } else {
        this.goAlert(resp.resultCode, resp.resultDescription, [], 'myModalError');
      }

      console.log(resp)
    } catch (err) {
      console.log(err)
    }
  }

  async onFileChange(evt: any) {
    console.log(evt)
    try {
      const target: DataTransfer = <DataTransfer>(evt.target);
      this.fileUpload = target.files[0].name
      const fileType = (this.fileUpload).split('.');

      if (target.files.length !== 1)
        throw new Error('Cannot use multiple files');
      if (fileType[fileType.length - 1] == 'xlsx' || fileType[fileType.length - 1] == 'xlx') {
        let url = GlobalVariable.BASE_API + GlobalVariable.BASE_RESOURCE + GlobalVariable.BASE_RESOURCE_IMPORT_ORDER;

        let formData = new FormData();

        formData.append('file', target.files[0], target.files[0].name)

        try {
          this.isLoadingPanel = true;
          let response = await this.request.postFile(url, formData);
          if (response.resultCode !== '20000') {
            let errorMessage = response.resultDescription
            let errorMessagList = []
            if (response.resultCode === '40305') {
              this.errorFilePath = response.fileErrorPath;
              errorMessage = '';
              errorMessagList = this.common.messageInvalidFields(response);
              this.goAlert(response.resultCode, errorMessage, errorMessagList, 'modalErrorImport');
            } else if (response.resultCode === '40306') {
              this.goAlert('Invalid File Format', errorMessage, errorMessagList, 'myModalWarning');
            } else {
              this.goAlert(response.resultCode, response.resultDescription, [], 'myModalError');
            }

          } else {
            let orderData = response.resultData
            let checkUrl = this.common.checkMockupUrl('', GlobalVariable.RESOURCE, {}, {
              BASE_API: GlobalVariable.BASE_API,
              BASE_MODULE: GlobalVariable.BASE_MODULE,
              BASE_RESOURCE: GlobalVariable.BASE_RESOURCE + GlobalVariable.BASE_RESOURCE_CREATE
            });
            response = await this.request.post(checkUrl.url, orderData);
            if (response.resultCode === '20000') {
              $(this.modalImportDocument.nativeElement).modal('hide');
              this.goAlert('', '', [], 'myModalSuccess');
              this.clickClear()
            } else {
              this.goAlert(response.resultCode, response.resultDescription, [], 'myModalError');
            }
          }
          this.isLoadingPanel = false;
        } catch (error) {
          this.isLoadingPanel = false;
        }


      } else {
        this.goAlert('Invalid File Format', 'File should be .xlx or .xlxs', [], 'myModalWarning');
      }
    } catch (e) {
      console.log(e);
    }
    evt.target.value = '';
  }

  onDownload() {
    window.open(this.errorFilePath);
    this.myModal.closeModal('modalErrorImport');
  }

  openOrderInactive(orderId) {
    this.inactiveId = orderId;
    this.goAlert('Are you sure', 'You want to change status to Inactive ?', [], 'myModalOrderInactive');
  }

  async onOKOrderInactive(remark) {
    this.isLoadingPanel = true;
    try {
      console.log('remark', remark);
      const checkUrl = this.common.checkMockupUrl('', '', {}, {
        BASE_API: '',
        BASE_MODULE: environment.apiPrefix,
        BASE_RESOURCE: environment.ordersInactive
      });
      const response = await this.request.patch(checkUrl.url, {
        orderId: this.inactiveId,
        remark
      });
      this.isLoadingPanel = false;
      if (response.resultCode === environment.resultCodeSuccess) {
        this.myModal.closeModal('myModalOrderInactive');
        this.goAlert('', '', [], 'myModalSuccess');
        this.gridDataPendingOrders.instance.refresh();
      } else {
        this.goAlert(response.resultCode, response.resultDescription, [], 'myModalError');
      }
    } catch (error) {
      this.isLoadingPanel = false;
      this.goAlert(environment.resultDescriptionSystemErrorTitle, environment.resultDescriptionSystemErrorMassage, [], 'myModalError');
    }
  }
}
