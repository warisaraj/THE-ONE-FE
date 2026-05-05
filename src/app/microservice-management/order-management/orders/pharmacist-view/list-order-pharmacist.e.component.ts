import { Component, OnInit, AfterViewInit, ViewChild, Output, EventEmitter, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { GlobalVariable } from './list-order-pharmacist.global';
import { Request } from '../../../../shared/services/request.service';
import { Common } from '../../../../shared/services/common.service';
import { DxDataGridComponent } from 'devextreme-angular';
import * as moment from 'moment';
import { environment } from '../../../../../environments/environment';
import CustomStore from 'devextreme/data/custom_store';
import { StoreService } from '../../../../shared/services/store.service';
// import { Component} from '@angular/core';
import { LayoutMenu } from 'src/app/shared/store/layout.menu.store';
import { SharedService } from 'src/app/shared/services/shared.service';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';

declare let $: any;

@Component({
  selector: 'app-list-pharmacist',
  providers: [LayoutMenu, Request, Common],
  templateUrl: './list-order-pharmacist.component.html',
  styleUrls: ['./list-order-pharmacist.component.scss'],
})
export class ListPharmacistViewComponent implements OnInit, AfterViewInit {
  @ViewChild('modalSplitProduction') modalSplitProduction;
  @ViewChild('modalImportDocument') modalImportDocument: any;
  @ViewChild('myModal') myModal;
  @ViewChild(DxDataGridComponent) gridDataPendingOrders: DxDataGridComponent;
  @ViewChild(DxDataGridComponent) gridDataDeliverdOrders: DxDataGridComponent;
  @Output() clickImportDocumentNo = new EventEmitter();
  dataPendingOrders = {};
  getDataPendingOrders = [];
  dataDeliverdOrders = {};
  getDataDeliverdOrders = [];
  searchPatient: any;
  searchHn: any;
  filter = {
    hn: '',
    patientName: '',
    orderStatus: '',
    productionDate: null,
    deliveryDateFrom: null,
    deliveryDateTo: null,
    orderDateFrom: null,
    orderDateTo: null
  };
  filterStore = {}
  orderStatusMap = {};
  orderStatusList = [];
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
  popupId: any;
  menuHome: any = false;
  menuPermissions: any = { view: false, add: false, edit: false, delete: false }
  statusList: string[];
  orderStatus = '';
  orderStatusMapByName = {};
  orderStatusMapById = {};
  statusOrderReview = [
    'Order Received',
    'Order Reviewed',
    'Customer Need to Change',
    'Urgent Request'
  ];
  statusListProductionReview = [
    'Order Inserted in TC',
    'Printed',
  ];
  statusListPharTech = [
    'Production Booked',
    'First Review Done',
  ];
  statusListDispensing = [
    'Production Done',
    'Finished Product Delivery',
    'First Check Done',
  ];
  statusListComplete = [
    'Complete',
    'Complete (Finished Product Delivery)',
    'Complete (Pre-Order) Finished Product',
  ];
  statusListFinishedProduction = [
    'Complete',
    'Complete (Finished Product Delivery)',
  ];
  statusListPreOrder = [
    '(Pre-Order) Finished Product',
  ];
  errorText: any;
  Id: any;
  isStatus1: boolean = false;
  isAcceptAndContinue: boolean = false;
  isLoadingPanel = false;
  arrivalTimeMapById = {};
  role: string;
  step: number;
  hn: any;
  hnFound: any;
  disbledBtnModal: boolean;
  errorData: any;
  changeSize = false
  pageIndex = 0
  importForm: FormGroup;
  typeAccept = ''
  constructor(
    public router: Router,
    private request: Request,
    public layoutMenu: LayoutMenu,
    private common: Common,
    private store: StoreService,
    private sharedService: SharedService,
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
    if (sessionStorage.getItem('role')) {
      this.role = sessionStorage.getItem('role')
    }
    const dropdown = await this.common.searchConfig();
    this.orderStatusList = dropdown.orderStatus || [];
    for (const arrivalTime of dropdown.arrivalTimeList) {
      this.arrivalTimeMapById[arrivalTime.id] = arrivalTime.name;
    }
    for (const orderStatus of this.orderStatusList) {
      this.orderStatusMap[orderStatus.id] = orderStatus.name;
    }
    console.log(dropdown)
    console.log(this.orderStatusMap)
    this.statusList = ['Production Booked', 'Waiting For Delivery', 'Quotation Received', 'Order Received', 'Complete'];
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
      this.dataPendingOrders = await this.customStore();
    } catch (e) {
      console.log('catch: ', e);
    }
  }


  async changeTab(index: number) {
    this.orderStatus = '';
    this.tabIndex = index;
    try {
      // Clear filter ทั้งหมด
      this.filter = {
        hn: '',
        patientName: '',
        orderStatus: '',
        productionDate: null,
        deliveryDateFrom: null,
        deliveryDateTo: null,
        orderDateFrom: null,
        orderDateTo: null
      };
      
      // Reset filterStore เพื่อให้ API ถูกเรียกใหม่
      this.filterStore = {};
      
      // Refresh data source เพื่อยิง API ใหม่
      this.dataPendingOrders = await this.customStore();
      
      this.gridDataPendingOrders.instance.clearSorting();
      this.gridDataPendingOrders.instance.refresh();
      this.gridDataPendingOrders.instance.pageIndex(0);
      if (this.tabIndex == 0) {
        this.gridDataPendingOrders.instance.columnOption(7, 'sortOrder', 'desc');
      } else if (this.tabIndex == 1) {
        this.gridDataPendingOrders.instance.columnOption(6, 'sortOrder', 'asc');
      } else if (this.tabIndex == 2) {
        this.gridDataPendingOrders.instance.columnOption(6, 'sortOrder', 'asc');
      } else if (this.tabIndex == 3) {
        this.gridDataPendingOrders.instance.columnOption(6, 'sortOrder', 'asc');
      } else if (this.tabIndex == 4) {
        this.gridDataPendingOrders.instance.columnOption(5, 'sortOrder', 'asc');
      } else if (this.tabIndex == 5) {
        this.gridDataPendingOrders.instance.columnOption(4, 'sortOrder', 'asc');
      } else {
        this.gridDataPendingOrders.instance.columnOption(4, 'sortOrder', 'asc');
      }
      console.log(this.dataPendingOrders)
    } catch (e) {
      console.log('catch: ', e);
    }
  }

  async fnClickSplitProduction(id: number) {
    this.typeAccept = ''
    this.Id = id
    const filterData = {
      orderId: id
    };

    const checkUrl = this.common.checkMockupUrl('', '', filterData, {
      BASE_API: GlobalVariable.BASE_API,
      BASE_MODULE: GlobalVariable.BASE_MODULE,
      BASE_RESOURCE: GlobalVariable.BASE_RESOURCE + GlobalVariable.BASE_RESOURCE_GET_ERROR_ORDER
    });

    const resultCodeSuccess = environment.resultCodeSuccess;

    const response = await this.request.get(checkUrl.url, checkUrl.filter);
    if (response.resultCode === resultCodeSuccess) {
      this.modalSplitProduction.open(id);

    } else {
      this.errorText = response.resultDescription.split('\n')
      this.errorData = response.data
      if (!this.menuPermissions.edit) {
        this.goAlert(response.resultCode, response.resultDescription, [], 'myModalOrderErrorStatus1');
      } else {
        this.typeAccept = 'split'
        this.goAlert(response.resultCode, response.resultDescription, [], 'myModalOrderErrorEditOrAccept');
      }
    }

  }

  async clickSearch() {
    try {
      this.checkClickSearch = true;
      this.loadData = false;

      // this.dataPendingOrders = await this.customStore();
      this.gridDataPendingOrders.instance.clearSorting();
      this.gridDataPendingOrders.instance.refresh();
      this.gridDataPendingOrders.instance.pageIndex(0);
      // this.gridDataPendingOrders.instance.columnOption(6, 'sortOrder', 'desc');
      if (this.tabIndex == 0) {
        this.gridDataPendingOrders.instance.columnOption(7, 'sortOrder', 'desc');
      } else if (this.tabIndex == 1) {
        this.gridDataPendingOrders.instance.columnOption(6, 'sortOrder', 'asc');
      } else if (this.tabIndex == 2) {
        this.gridDataPendingOrders.instance.columnOption(6, 'sortOrder', 'asc');
      } else if (this.tabIndex == 3) {
        this.gridDataPendingOrders.instance.columnOption(6, 'sortOrder', 'asc');
      } else if (this.tabIndex == 4) {
        this.gridDataPendingOrders.instance.columnOption(4, 'sortOrder', 'asc');
      } else if (this.tabIndex == 5) {
        this.gridDataPendingOrders.instance.columnOption(5, 'sortOrder', 'asc');
      } else {
        this.gridDataPendingOrders.instance.columnOption(4, 'sortOrder', 'asc');
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
      this.filter = {
        hn: '',
        patientName: '',
        orderStatus: '',
        productionDate: null,
        deliveryDateFrom: null,
        deliveryDateTo: null,
        orderDateFrom: null,
        orderDateTo: null
      };
      this.orderStatus = ''
      this.checkClickSearch = false;
      this.loadData = false;
      this.gridDataPendingOrders.instance.clearSorting();
      this.gridDataPendingOrders.instance.refresh();
      this.gridDataPendingOrders.instance.pageSize(10);
      this.gridDataPendingOrders.instance.pageIndex(0);
      if (this.tabIndex == 0) {
        this.gridDataPendingOrders.instance.columnOption(7, 'sortOrder', 'desc');
      } else if (this.tabIndex == 1) {
        this.gridDataPendingOrders.instance.columnOption(6, 'sortOrder', 'asc');
      } else if (this.tabIndex == 2) {
        this.gridDataPendingOrders.instance.columnOption(6, 'sortOrder', 'asc');
      } else if (this.tabIndex == 3) {
        this.gridDataPendingOrders.instance.columnOption(6, 'sortOrder', 'asc');
      } else if (this.tabIndex == 4) {
        this.gridDataPendingOrders.instance.columnOption(4, 'sortOrder', 'asc');
      } else if (this.tabIndex == 5) {
        this.gridDataPendingOrders.instance.columnOption(5, 'sortOrder', 'asc');
      } else {
        this.gridDataPendingOrders.instance.columnOption(4, 'sortOrder', 'asc');
      }
    } catch (e) {
      console.log(e);
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

  async onOkDelete() {
    try {
      this.disbledBtn = {
        "create": true
      };
      let url = GlobalVariable.BASE_API + GlobalVariable.BASE_RESOURCE + GlobalVariable.BASE_RESOURCE_DELETE;
      // let url = GlobalVariable.BASE_API + GlobalVariable.BASE_RESOURCE + '/' + this.getIdDelete;

      let data = {
        'binId': this.getIdDelete
      };

      const resultCodeSuccess = environment.resultCodeSuccess;

      let response = await this.request.post(url, data);

      // this.userMessage = response.userMessage;
      if (response.resultCode === resultCodeSuccess) {
        this.goAlert('', '', [], 'myModalSuccessDelete');
        this.dataPendingOrders = this.customStore();

      }
      // else if(response.resultCode === resultCodeDataNotFound){
      //   this.goAlert(resultDescriptionDataNotFoundTitle, resultDescriptionDataNotFoundMassage, 'myModalError');
      // }else if(response.resultCode === resultCodeDbError){
      //   this.goAlert(resultDescriptionDbErrorTitle, resultDescriptionDbErrorMassage, 'myModalError');
      // }else if(response.resultCode === resultCodeDeleteDataAtHaveChild){
      //   this.goAlert(resultDescriptionDeleteDataAtHaveChildTitle, resultDescriptionDeleteDataAtHaveChildMassage, 'myModalError');
      // }
      else {
        console.log('error');
        // this.goAlert(resultDescriptionSystemErrorTitle, resultDescriptionSystemErrorMassage, 'myModalError');
        this.goAlert(response.resultCode, response.resultDescription, [], 'myModalError');
      }
    } catch (e) {
      console.log(e);
      this.disbledBtn = {
        "create": false
      };
    }
  }

  onCancelDelete() {
    this.disbledBtn = {
      "create": false
    };
  }

  goAlert(userTitle, userMessage, userMessageList, modalId, cs = '') {
    const dataAlert = {
      'modalId': modalId,
      'userTitle': userTitle,
      'userMessage': userMessage,
      'userMessageList': userMessageList,
      'userMessageText': userMessageList,
      'cs': cs,
    };
    this.myModal.openModal(dataAlert);
  }

  async fnUploadTemplate() {
    this.open();
  }


  async onClickExportAll() {
    try {
      this.isLoadingPanel = true;
      // tslint:disable-next-line:max-line-length
      let allStatus = [...this.statusOrderReview, ...this.statusListProductionReview, ...this.statusListPharTech, ...this.statusListDispensing, ...this.statusListComplete, ...this.statusListPreOrder];
      allStatus = allStatus.map(str => {
        return this.orderStatusMapByName[str];
      });

      const exportFilter: any = {
        orderStatus: allStatus.toString()
      };
      await this.common.export('Orders', exportFilter, this.myModal);
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

      if (this.tabIndex == 4) {
        exportFilter.orderStatus = 34
      }

      if (this.filter.hn) {
        exportFilter.hn = this.filter.hn;
      }
      if (this.filter.patientName) {
        exportFilter.patientName = this.filter.patientName;
      }
      if (this.filter.productionDate) {
        exportFilter.productionDate = moment(this.filter.productionDate).format('YYYY-MM-DD');
      }
      if (this.filter.orderDateFrom) {
        exportFilter.orderDateFrom = moment(this.filter.orderDateFrom).format('YYYY-MM-DD');
      }
      if (this.filter.orderDateTo) {
        exportFilter.orderDateTo = moment(this.filter.orderDateTo).format('YYYY-MM-DD');
      }
      if (this.filter.deliveryDateFrom) {
        exportFilter.deliveryDateFrom = moment(this.filter.deliveryDateFrom).format('YYYY-MM-DD');
      }
      if (this.filter.deliveryDateTo) {
        exportFilter.deliveryDateTo = moment(this.filter.deliveryDateTo).format('YYYY-MM-DD');
      }
      await this.common.export('Orders', exportFilter, this.myModal);
      this.isLoadingPanel = false;
    } catch (error) {
      this.isLoadingPanel = false;
    }
  }

  fnSetOrderStatus() {
    let orderStatusNameList = [];
    if (+this.tabIndex === 0) {
      orderStatusNameList = this.statusOrderReview;
    } else if (+this.tabIndex === 1) {
      orderStatusNameList = this.statusListProductionReview;
    } else if (+this.tabIndex === 2) {
      orderStatusNameList = this.statusListPharTech;
    } else if (+this.tabIndex === 3) {
      orderStatusNameList = this.statusListDispensing;
    } else if (+this.tabIndex === 5) {
      orderStatusNameList = this.statusListComplete;
    } else if (+this.tabIndex === 4) {
      orderStatusNameList = this.statusListPreOrder;
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
      load: (loadOptions: any) => {
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

          if (this.filter.hn) {
            filterData.hn = this.filter.hn;
          }

          if (this.filter.patientName) {
            filterData.patientName = this.filter.patientName;
          }

          if (this.filter.productionDate && this.tabIndex != 0 && this.tabIndex != 3) {
            filterData.productionDate = moment(this.filter.productionDate).format('YYYY-MM-DD');
          }
          if (this.filter.orderDateFrom && this.tabIndex == 0) {
            filterData.orderDateFrom = moment(this.filter.orderDateFrom).format('YYYY-MM-DD');
          }
          if (this.filter.orderDateTo && this.tabIndex == 0) {
            filterData.orderDateTo = moment(this.filter.orderDateTo).format('YYYY-MM-DD');
          }
          if (this.filter.deliveryDateFrom && (this.tabIndex == 3 || this.tabIndex == 5 || this.tabIndex == 4)) {
            filterData.deliveryDateFrom = moment(this.filter.deliveryDateFrom).format('YYYY-MM-DD');
          }

          if (this.filter.deliveryDateTo && (this.tabIndex == 3 || this.tabIndex == 5 || this.tabIndex == 4)) {
            filterData.deliveryDateTo = moment(this.filter.deliveryDateTo).format('YYYY-MM-DD');
          }


          if (this.fnSetOrderStatus()) {
            console.log('this.fnSetOrderStatus()', this.fnSetOrderStatus())
            filterData.orderStatus = this.fnSetOrderStatus();
          }

          if (this.orderStatus) {
            filterData.orderStatus = this.orderStatusMapByName[this.orderStatus];
          }

          if (this.tabIndex == 4) {
            filterData.orderStatus = 34
          }

          if (+this.tabIndex === 3 || +this.tabIndex === 4 || +this.tabIndex === 5) {
            filterData.isOneDeliveryDetail = true;
          }


          if (this.tabIndex > 0 && this.tabIndex != 4) {
            filterData.orderby = loadOptions.sort ? loadOptions.sort[0].selector : "productionStartDate|DESC"
          }

          if (this.tabIndex == 5) {
            filterData.orderby = loadOptions.sort ? loadOptions.sort[0].selector : "deliveryDate|ASC"
          }

          if (this.changeSize) {
            this.offset = 0
          } else {
            this.offset = loadOptions.skip;
          }

          const isChange = this.common.checkFilter(filterData,this.filterStore,this.offset)
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
              orderby: loadOptions.sort ? loadOptions.sort[0].selector : "updatedAt|DESC"
            };
          } else {
            filterData = {
              ...filterData,
              offset: this.offset,
              limit: this.limits,
              orderby: loadOptions.sort ? loadOptions.sort[0].selector : "updatedAt|DESC"
            };
          }
          
          this.checkClickSearch = false;
          filterData.filter = JSON.stringify(filterData.filter);

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
                  for (let i = 0; i < this.getDataPendingOrders.length; i++) {

                    if (this.getDataPendingOrders[i].arrivalTime) {
                      this.getDataPendingOrders[i].arrivalTime = this.arrivalTimeMapById[this.getDataPendingOrders[i].arrivalTime];
                    }
                    if (this.getDataPendingOrders[i].deliveryDate) {
                      this.getDataPendingOrders[i].deliveryDate = moment(this.getDataPendingOrders[i].deliveryDate, 'DD/MM/YYYY HH:mm:ss').format('DD/MM/YYYY')
                    }
                    if (this.getDataPendingOrders[i].completedAt) {
                      this.getDataPendingOrders[i].completedAt = moment(this.getDataPendingOrders[i].completedAt, 'DD/MM/YYYY HH:mm:ss').format('DD/MM/YYYY')
                    }

                    if (this.getDataPendingOrders[i].deliveryDetail_isSplitDelivery && this.tabIndex == 3) {
                      this.getDataPendingOrders[i].orderStatus = this.orderStatusMap[this.getDataPendingOrders[i].orderStatus] + (this.getDataPendingOrders[i].deliveryStatus ? ` (${this.orderStatusMap[this.getDataPendingOrders[i].deliveryStatus]})` : '');
                    } else if (this.tabIndex == 4) {
                      this.getDataPendingOrders[i].orderStatus = '(Pre-Order) Finished Product'
                    } else {
                      this.getDataPendingOrders[i].orderStatus = this.orderStatusMap[this.getDataPendingOrders[i].orderStatus];
                    }

                  }
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

              console.log('return catch');
              return {
                data: [],
                totalCount: this.numMicroservices
              };
            });
        } else {
          this.changeSize = false;
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

  async fnConfirmUrgentRequest(data: any) {
    console.log(data)
    this.Id = data.orderId
    this.isStatus1 = false;
    this.isAcceptAndContinue = false
    const filterData = {
      orderId: data.orderId,
    };
    this.popupId = data.orderId
    const checkUrl = this.common.checkMockupUrl('', '', filterData, {
      BASE_API: GlobalVariable.BASE_API,
      BASE_MODULE: GlobalVariable.BASE_MODULE,
      BASE_RESOURCE: GlobalVariable.BASE_RESOURCE + GlobalVariable.BASE_RESOURCE_GET_ERROR_ORDER
    });

    const resultCodeSuccess = environment.resultCodeSuccess;

    const response = await this.request.get(checkUrl.url, checkUrl.filter);
    if (response.resultCode === resultCodeSuccess) {
      this.goAlert('Are you sure', 'You want to approve this urgent order ?', [], 'myModalConfirmUrgentRequest', data.urgentRequestReason ? data.urgentRequestReason : '');
    } else {
      this.errorText = response.resultDescription.split('\n')
      const errorMessage = this.errorText.join('<br>');
      this.errorData = response.data
      this.goAlert("Error " + response.resultCode, errorMessage, this.errorText, 'myModalConfirmUrgentRequest', data.urgentRequestReason ? data.urgentRequestReason : '');
    }
  }

  async onClickApprove() {
    try {
      const resultCodeSuccess = environment.resultCodeSuccess;
      let payload: any = {
        orderId: this.popupId,
        orderStatus: 11
      }
      this.popupId = null
      let checkUrl = null;

      checkUrl = this.common.checkMockupUrl('', GlobalVariable.RESOURCE, {}, {
        BASE_API: GlobalVariable.BASE_API,
        BASE_MODULE: GlobalVariable.BASE_MODULE,
        BASE_RESOURCE: GlobalVariable.BASE_RESOURCE + GlobalVariable.BASE_RESOURCE_UPDATE_URGENT_ORDER
      });

      let response = await this.request.patch(checkUrl.url, payload);
      if (response.resultCode === resultCodeSuccess) {
        this.goAlert('', '', [], 'myModalSuccess');
        this.clickClear()
      } else {
        this.goAlert(response.resultCode, response.resultDescription, [], 'myModalError');
      }

    } catch (e) {
      console.log(e);
    }
  }

  async onClickReject() {
    try {
      const resultCodeSuccess = environment.resultCodeSuccess;
      let payload: any = {
        orderId: this.popupId,
        orderStatus: 9
      }
      this.popupId = null
      let checkUrl = null;

      checkUrl = this.common.checkMockupUrl('', GlobalVariable.RESOURCE, {}, {
        BASE_API: GlobalVariable.BASE_API,
        BASE_MODULE: GlobalVariable.BASE_MODULE,
        BASE_RESOURCE: GlobalVariable.BASE_RESOURCE + GlobalVariable.BASE_RESOURCE_UPDATE_URGENT_ORDER
      });

      let response = await this.request.patch(checkUrl.url, payload);
      if (response.resultCode === resultCodeSuccess) {
        this.goAlert('', '', [], 'myModalSuccess');
        this.clickClear()
      } else {
        this.goAlert(response.resultCode, response.resultDescription, [], 'myModalError');
      }

    } catch (e) {
      console.log(e);
    }
  }

  goCreate() {
    this.router.navigate(['/order-management', 'orders-pharmacist-view', 'new']);
  }

  async fnClickView(data: any) {
    console.log(data)
    this.Id = data.orderId
    this.isStatus1 = false;
    this.isAcceptAndContinue = false
    const filterData = {
      orderId: data.orderId,
    };

    const checkUrl = this.common.checkMockupUrl('', '', filterData, {
      BASE_API: GlobalVariable.BASE_API,
      BASE_MODULE: GlobalVariable.BASE_MODULE,
      BASE_RESOURCE: GlobalVariable.BASE_RESOURCE + GlobalVariable.BASE_RESOURCE_GET_ERROR_ORDER
    });

    const resultCodeSuccess = environment.resultCodeSuccess;

    const response = await this.request.get(checkUrl.url, checkUrl.filter);
    if (response.resultCode === resultCodeSuccess) {
      this.router.navigate(['/order-management/orders-pharmacist-view', data.orderId, 'view'])
    } else {
      this.errorText = response.resultDescription.split('\n')
      this.errorData = response.data
      if (data.orderStatus === "Order Received") {
        this.isStatus1 = true;
      }
      if ((data.orderStatus === "Order Received" && this.errorText[this.errorText.length - 1].includes('Trakcare')) || !this.menuPermissions.edit) {
        this.goAlert(response.resultCode, response.resultDescription, [], 'myModalOrderErrorStatus1');
      } else {
        // if (data.orderStatus === "Order Received") {
        //   this.goAlert(response.resultCode, response.resultDescription, [], 'myModalOrderErrorEditOrAccept');
        // } else {
        if (data.orderStatus === "Customer Need to Change" && this.errorText[this.errorText.length - 1].includes('Trakcare')) {
          this.goAlert(response.resultCode, response.resultDescription, [], 'myModalOrderErrorStatus1');
        } else {
          this.goAlert(response.resultCode, response.resultDescription, [], 'myModalOrderError');
        }

        // }

      }
    }

  }

  async fnClickChangeBooking(id) {
    this.typeAccept = ''
    this.Id = id
    this.isStatus1 = false;
    this.isAcceptAndContinue = false;
    const filterData = {
      orderId: id,
    };

    const checkUrl = this.common.checkMockupUrl('', '', filterData, {
      BASE_API: GlobalVariable.BASE_API,
      BASE_MODULE: GlobalVariable.BASE_MODULE,
      BASE_RESOURCE: GlobalVariable.BASE_RESOURCE + GlobalVariable.BASE_RESOURCE_GET_ERROR_ORDER
    });

    const resultCodeSuccess = environment.resultCodeSuccess;

    const response = await this.request.get(checkUrl.url, checkUrl.filter);
    if (response.resultCode === resultCodeSuccess) {
      this.getIdDelete = id;
      this.goAlert('', '', [], 'myModalChangeBooking');
    } else {
      this.errorText = response.resultDescription.split('\n')
      this.errorData = response.data
      if (!this.menuPermissions.edit) {
        this.goAlert(response.resultCode, response.resultDescription, [], 'myModalOrderErrorStatus1');
      } else {
        this.typeAccept = "booking"
        this.goAlert(response.resultCode, response.resultDescription, [], 'myModalOrderErrorEditOrAccept');
      }
    }

  }

  async onOkChangeBooking() {
    try {

      let url = GlobalVariable.BASE_API + GlobalVariable.BASE_RESOURCE + GlobalVariable.BASE_RESOURCE_ChangeBooking;
      // let url = GlobalVariable.BASE_API + GlobalVariable.BASE_RESOURCE + '/' + this.getIdDelete;

      let data = {
        'orderId': this.getIdDelete
      };

      const resultCodeSuccess = environment.resultCodeSuccess;

      let response = await this.request.post(url, data);

      // this.userMessage = response.userMessage;
      if (response.resultCode === resultCodeSuccess) {
        this.goAlert('', '', [], 'myModalSuccess');
        this.dataPendingOrders = this.customStore();

      }
      // else if(response.resultCode === resultCodeDataNotFound){
      //   this.goAlert(resultDescriptionDataNotFoundTitle, resultDescriptionDataNotFoundMassage, 'myModalError');
      // }else if(response.resultCode === resultCodeDbError){
      //   this.goAlert(resultDescriptionDbErrorTitle, resultDescriptionDbErrorMassage, 'myModalError');
      // }else if(response.resultCode === resultCodeDeleteDataAtHaveChild){
      //   this.goAlert(resultDescriptionDeleteDataAtHaveChildTitle, resultDescriptionDeleteDataAtHaveChildMassage, 'myModalError');
      // }
      else {
        console.log('error');
        // this.goAlert(resultDescriptionSystemErrorTitle, resultDescriptionSystemErrorMassage, 'myModalError');
        this.goAlert(response.resultCode, response.resultDescription, [], 'myModalError');
      }
    } catch (e) {
      console.log(e);
      this.disbledBtn = {
        "create": false
      };
    }
  }

  async fnChangeStatus() {
    this.dataPendingOrders = await this.customStore();
  }

  async onClickEditOrder() {
    try {
      console.log('this.isStatus1', this.isStatus1)
      if (this.isStatus1) {
        localStorage.setItem('errorOrder', JSON.stringify({
          orderId: this.Id,
          data: this.errorData
        }));
        this.router.navigate(['/order-management/orders-pharmacist-view', this.Id, 'view'])
      } else {
        this.disbledBtn = {
          "create": true
        };
        let url = GlobalVariable.BASE_API + GlobalVariable.BASE_RESOURCE + GlobalVariable.BASE_RESOURCE_UPDATE_ERROR_ORDER;

        let locationText = this.errorText[this.errorText.length - 1].split('in ')[1]
        locationText = locationText.replaceAll('.', '')
        let data: any = {
          orderId: this.Id,
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

        } else {
          console.log('error');
          this.goAlert(response.resultCode, response.resultDescription, [], 'myModalError');
        }
      }
    } catch (e) {
      console.log(e);
      this.disbledBtn = {
        "create": false
      };
    }

  }
  async onClickEditOrAcceptOrder() {
    try {
      if (this.typeAccept && this.typeAccept == 'booking') {
        this.getIdDelete = this.Id;
        this.goAlert('', '', [], 'myModalChangeBooking');
        this.typeAccept = ''
        return
      } else if (this.typeAccept && this.typeAccept == 'split') {
        this.modalSplitProduction.open(this.Id);
        this.typeAccept = ''
        return
      }

      localStorage.setItem('errorOrder', JSON.stringify({
        orderId: this.Id,
        data: this.errorData
      }));
      if (this.isStatus1) {
        this.router.navigate(['/order-management/orders-pharmacist-view', this.Id, 'view'])
      } else {
        this.router.navigate(['/order-management/orders-production-pharmacist-view', this.Id, 'view'], {
          queryParams: {
            tab: this.tabIndex,
          }
        })
      }

    } catch (e) {
      console.log(e);
      this.disbledBtn = {
        "create": false
      };
    }

  }


  onCloseEditOrder() {

  }

  onRowPrepared(e) {
    const data = e.data || {};
    const rowElement: HTMLElement = e.rowElement;

    const endDate = moment(data.productionEndDate, 'DD/MM/YYYY HH:mm');
    const today = moment().startOf('day');
    if (endDate.isSame(today, 'day') && (this.tabIndex === 1 || this.tabIndex === 2) && data.orderStatus !== "Urgent Request") {
      if (data.isUrgentApprove) {
        rowElement.classList.add('urgent-color');
      } else {
        rowElement.classList.add('bg-yellow-color');
      }

    }

    if (data.orderStatus === "Urgent Request") {
      rowElement.classList.add('urgent-color');
    }

    if ((data.orderStatus === "Urgent Approve" ||
      data.orderStatus === "Production Booked" ||
      data.orderStatus === "Order Inserted in TC" ||
      data.orderStatus === "Change Booking" ||
      data.orderStatus === "Change Booking (Order Inserted in TC)" ||
      data.orderStatus === "First Review Done" ||
      data.orderStatus === "Printed")
      && +data.isUrgentApprove === 1) {
      rowElement.classList.add('urgent-color');
    }
  }

  onRowPreparedDispensing(e) {
    const data = e.data || {};
    const rowElement: HTMLElement = e.rowElement;
    const today = moment().startOf('day');
    const deliveryDateOnly = moment(data.deliveryDate, 'DD/MM/YYYY HH:mm');

    if (data.deliveryDate && data.arrivalTime) {
      const timeMatch = data.arrivalTime.match(/(\d{1,2})\.(\d{2})/);
      if (timeMatch) {
        const hour = parseInt(timeMatch[1], 10);
        const minute = parseInt(timeMatch[2], 10);

        const fullDeliveryDatetime = deliveryDateOnly.clone().hour(hour).minute(minute).second(0);

        console.log('fullDeliveryDatetime:', fullDeliveryDatetime.format('YYYY-MM-DD HH:mm:ss'));
        console.log('now:', today.format('YYYY-MM-DD HH:mm:ss'));

        if (moment().isAfter(fullDeliveryDatetime)) {
          rowElement.classList.add('urgent-color');
        } else if (data.deliveryDetail_isUrgent) {
          rowElement.classList.add('bg-blue-color');
        } else if (deliveryDateOnly.isSame(today, 'day')) {
          rowElement.classList.add('bg-yellow-color');
        }
      }
    }

  }


  async fnGoView(data: any) {
    this.typeAccept = ''
    if (data.deliveryDetail_deliveryDetailId) {
      localStorage.setItem('deliveryDetailId', data.deliveryDetail_deliveryDetailId);
    }
    console.log("----data.orderStatus", data.orderStatus)
    if (data.orderStatus === 'Production Done' || data.orderStatus.includes('First Check Done') || data.orderStatus === 'Complete') {
      this.router.navigate(['/order-management/orders-production-pharmacist-view', data.orderId, 'view'], {
        queryParams: {
          tab: this.tabIndex,
        }
      });
    } else if (data.orderStatus === 'Finished Product Delivery' || data.orderStatus === 'Complete (Finished Product Delivery)' || data.orderStatus === '(Pre-Order) Finished Product' || data.orderStatus === 'Complete (Pre-Order) Finished Product') {
      this.setRedirect();
      this.router.navigate(['/order-management/orders-cashier-view/queue-management-finished-product', data.orderId, 'view'], {
        queryParams: {
          tab: this.tabIndex,
        }
      });
    } else {
      this.Id = data.orderId
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
        this.router.navigate(['/order-management/orders-production-pharmacist-view', data.orderId, 'view'], {
          queryParams: {
            tab: this.tabIndex,
          }
        });
      } else {
        this.errorText = response.resultDescription.split('\n')
        console.log(this.errorText)
        console.log(this.Id)
        this.errorData = response.data
        if (!this.menuPermissions.edit) {
          this.goAlert(response.resultCode, response.resultDescription, [], 'myModalOrderErrorStatus1');
        } else {
          this.goAlert(response.resultCode, response.resultDescription, [], 'myModalOrderErrorEditOrAccept');
          // if(data.orderStatus === "Order Inserted in TC"){
          //   this.goAlert(response.resultCode, response.resultDescription, [], 'myModalOrderErrorEditOrAccept');
          // }else{
          //   this.goAlert(response.resultCode, response.resultDescription, [], 'myModalOrderError');
          // }
        }
      }
    }
  }

  setRedirect() {
    this.sharedService.redirectPage = "pharmacist"
    localStorage.setItem('redirectPage', 'pharmacist');
  }

  async open() {
    this.importForm.controls['txtImportHn'].reset();
    this.step = 0;
    this.hn = null
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
    window.open(this.errorFilePath)
    this.myModal.closeModal('modalErrorImport');
  }
}
