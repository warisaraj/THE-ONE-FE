import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, EventEmitter, Output } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { GlobalVariable } from './list-product-pharmacist.global';
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
  selector: 'app-list-product-pharmacist',
  providers: [LayoutMenu, Request, Common],
  templateUrl: './list-product-pharmacist.component.html',
  styleUrls: ['./list-product-pharmacist.component.scss'],
})
export class ListProductPharmacistComponent implements OnInit, AfterViewInit {
  [x: string]: any;
  @ViewChild('modalSplitProduction') modalSplitProduction;
  @ViewChild('myModal') myModal;
  @ViewChild(DxDataGridComponent) gridDataPendingOrders: DxDataGridComponent;
  @ViewChild(DxDataGridComponent) gridDataDeliverdOrders: DxDataGridComponent;
  dataPendingOrders = {};
  getDataPendingOrders = [];
  dataDeliverdOrders = {};
  getDataDeliverdOrders = [];

  statusList = ['Production Booked','Waiting For Delivery','Quotation Received','Order Received','Complete']

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
  hoverTootip: any;
  disbledBtn = {
    "create": false
  };
  menuHome: any = false;
  menuPermissions: any = { view: false, add: false, edit: false, delete: false }
  reOrderId: number;
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
      console.log(this.txtInputSearch);
      this.checkClickSearch = true;
      this.loadData = false;
      this.gridDataPendingOrders.instance.clearSorting();
      this.gridDataPendingOrders.instance.refresh();
      this.gridDataPendingOrders.instance.pageIndex(0);
      this.gridDataPendingOrders.instance.columnOption(6, 'sortOrder', 'desc');
    } catch (e) {
      console.log(e);
      const resultDescriptionSystemErrorTitle = environment.resultDescriptionSystemErrorTitle;
      const resultDescriptionSystemErrorMassage = environment.resultDescriptionSystemErrorMassage;
      this.goAlert(resultDescriptionSystemErrorTitle, resultDescriptionSystemErrorMassage, [], 'myModalError');
    }
  }

  async clickClear() {
    try {
      this.txtInputSearch = undefined;
      this.checkClickSearch = false;
      this.loadData = false;
      this.gridDataPendingOrders.instance.clearSorting();
      this.gridDataPendingOrders.instance.refresh();
      this.gridDataPendingOrders.instance.pageSize(10);
      this.gridDataPendingOrders.instance.pageIndex(0);
      this.gridDataPendingOrders.instance.columnOption(6, 'sortOrder', 'desc');
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

  async onFileChange(evt: any) {
    console.log(evt)
    try {
      const target: DataTransfer = <DataTransfer>(evt.target);
      this.fileUpload = target.files[0].name
      const fileType = (this.fileUpload).split('.');

      if (target.files.length !== 1)
        throw new Error('Cannot use multiple files');
      if (fileType[fileType.length - 1] == 'xlsx' || fileType[fileType.length - 1] == 'xlx') {
        let url = GlobalVariable.BASE_API + GlobalVariable.BASE_RESOURCE + GlobalVariable.BASE_RESOURCE_IMPORT_FILE;

        let formData = new FormData();

        formData.append('file', target.files[0], target.files[0].name)

        try {
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
            this.goAlert('', '', [], 'myModalSuccess');
            this.dataPendingOrders = this.customStore();
          }

        } catch (error) {
          // this.goAlert(response.resultCode, response.resultDescription, 'myModalError');
        }


      }
      else {
        this.goAlert('Invalid File Format', 'File should be .xlx or .xlxs', [], 'myModalWarning');
      }
    } catch (e) {
      console.log(e);
    }
    evt.target.value = '';
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
          if (loadOptions.sort !== null && (this.offset === loadOptions.skip && this.limits === loadOptions.take)) {
            // this.orderby = loadOptions.sort[0].selector;
            this.orderby = "updatedAt|DESC";
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

          let filterData: any = {
            // fields: '',
            // filter: '',
            offset: 0,
            limit: 10,
            // orderby: ''
          };

          if (this.txtInputSearch || this.txtInputSearch !== '' || this.txtInputSearch !== null || this.txtInputSearch !== 'undefined' || this.txtInputSearch !== undefined) {
            filterData = {
              "binName": this.common.trimData(this.txtInputSearch)
            };
          } else {
            filterData = {};
          }

          if (this.checkClickSearch === true) {
            filterData = {
              ...filterData,
              offset: 0,
              limit: this.limits,
              orderby: "updatedAt|DESC"
            };
          } else {
            filterData = {
              ...filterData,
              offset: this.offset,
              limit: this.limits,
              orderby: "updatedAt|DESC"
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

                  // let resultData = response.resultData

                  // resultData = resultData.map((r,i)=>{
                  //   return {
                  //     ...r,
                  //     id:i ,
                  //     rawMaterialName:r.rawMaterials && r.rawMaterials.length ? r.rawMaterials[0].rawMaterialName:'',
                  //     isDisbled:r.rawMaterials ?r.rawMaterials.length > 0 : false}
                  // })

                  let resultData = [{
                    orderId: 1,
                    hn: "12345678",
                    patientName: "Na Jaemin",
                    productionStart: "10/05/2022 09:00",
                    ProductionEnd: "10/05/2022 12:00",
                    orderStatus: "Production Booked",
                  },
                  {
                    orderId: 2,
                    hn: "12345678",
                    patientName: "Lee Jeno",
                    productionStart: "10/05/2022 09:00",
                    ProductionEnd: "10/05/2022 12:00",
                    orderStatus: "Printed",
                  },
                  {
                    orderId: 3,
                    hn: "12345678",
                    patientName: "Lee Minhyung",
                    productionStart: "10/05/2022 09:00",
                    ProductionEnd: "10/05/2022 12:00",
                    orderStatus: "First Review Done",
                  }]
                  this.getDataPendingOrders = resultData;
                  //click row view description
                  // for (let i = 0; i < this.getDataPendingOrders.length; i++) {
                  //   this.getDataPendingOrders[i].updatedAt = this.common.convertDate(this.getDataPendingOrders[i].updatedAt, 'DD/MM/YYYY HH:mm:ss');
                  // }

                  //num numMicroservices Search Results 0 of 0 Items
                  // this.numMicroservices = response.rowCount;
                  this.numMicroservices = 2;
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
    e.cellElement.accessKey = e.column.caption;
  }

  // Collapse ibox function
  clickCollapse() {
    let collapse = this.common.collapseFn();
  }

  onCellHoverChanged(e) {
    // console.log(e.value);
    this.hoverTootip = e.value;
  }

  fnReOrder(id : number ,hn: string){
    this.reOrderId = id
    this.goAlert('Are you sure', 'You want to reorder of HN' + hn +' ?', [], 'myModalConfirmReOrder');
  }

  onOkReOrder() {

  }

  fnClickSplitProduction(id) {
    this.modalSplitProduction.open(id);
  }

  fnClickChangeBooking(id){
    this.getIdDelete = id;

    this.goAlert('', '', [], 'myModalChangeBooking');
  }

  async onOkChangeBooking() {
    try {

      let url = GlobalVariable.BASE_API + GlobalVariable.BASE_RESOURCE1 + GlobalVariable.BASE_RESOURCE_ChangeBooking;
      // let url = GlobalVariable.BASE_API + GlobalVariable.BASE_RESOURCE + '/' + this.getIdDelete;

      let data = {
        'orderId': this.getIdDelete
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
}
