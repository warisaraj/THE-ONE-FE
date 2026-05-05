import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { LayoutMenu } from '../../../../shared/store/layout.menu.store';
import { GlobalVariable } from './list-pharmacy-notes.global';
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
  selector: 'app-list-pharmacy-notes',
  providers: [LayoutMenu, Request, Common],
  templateUrl: './list-pharmacy-notes.component.html',
})
export class ListPharmacyNoteComponent implements OnInit, AfterViewInit {
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
  numMicroservices = 0;
  dataResultItems = 0;
  loadData = false;
  fieldsMicroservicesList;
  checkClickSearch = false;
  filterData: any = {};
  filterStore: any = {}
  txtInputSearch: any = {};
  resResultCode;
  remotePaging;
  getIdDelete;
  loading = true;
  disbledBtn = {
    "create": false
  };
  uomList: any = [];
  menuHome: any = false;
  menuPermissions: any = { view: true, add: true, edit: true, delete: true }
  fileUpload: string;
  errorFilePath: string;
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
    this.store.subscribePagePermissionList().subscribe(pagePermissionList => {
      console.log("ngOnInit", pagePermissionList);
      let pagePermission = pagePermissionList.find(r => r.url === GlobalVariable.ROLE_URL);
      if (pagePermission) {
        try {
          console.log("pagePermission", pagePermission);
          this.menuPermissions = JSON.parse(pagePermission.menuPermissions)
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
      this.dataMicroservices = await this.customStore();
    } catch (e) {
      console.log('catch: ', e);
    }
  }

  async clickSearch() {
    try {
      // console.log(this.txtInputSearch);
      // if(this.txtInputSearch !== '' && this.txtInputSearch !== null && this.txtInputSearch !== 'undefined' && this.txtInputSearch !== undefined){
      this.checkClickSearch = true;
      this.loadData = false;
      this.gridMicroservices.instance.clearSorting();
      // this.gridMicroservices.instance.pageSize(10);
      this.gridMicroservices.instance.pageIndex(0);
      // this.gridMicroservices.instance.columnOption(5, 'sortOrder', 'desc');
      this.dataMicroservices = await this.customStore();
      // }else {
      //   this.goAlert('Field is required','Please specify at least one filter.', 'myModalWarning');
      // }
    } catch (e) {
      console.log(e);
      const resultDescriptionSystemErrorTitle = environment.resultDescriptionSystemErrorTitle;
      const resultDescriptionSystemErrorMassage = environment.resultDescriptionSystemErrorMassage;
      this.goAlert(resultDescriptionSystemErrorTitle, resultDescriptionSystemErrorMassage, [], 'myModalError');
    }
  }

  async clickClear() {
    try {
      this.txtInputSearch = {};
      this.checkClickSearch = false;
      this.loadData = false;
      this.gridMicroservices.instance.clearSorting();
      this.gridMicroservices.instance.refresh();
      this.gridMicroservices.instance.pageSize(10);
      this.gridMicroservices.instance.pageIndex(0);
      // this.gridMicroservices.instance.columnOption(5, 'sortOrder', 'desc');
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
        'pharmacyNoteId': this.getIdDelete
      };

      const resultCodeSuccess = environment.resultCodeSuccess;

      let response = await this.request.post(url, data);

      // this.userMessage = response.userMessage;
      if (response.resultCode === resultCodeSuccess) {
        this.goAlert('', '', [], 'myModalSuccessDelete');
        this.dataMicroservices = this.customStore();

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

  async onClickExport() {
    try {
      this.isLoadingPanel = true;
      await this.common.export('Pharmacy_Notes', this.txtInputSearch, this.myModal);
      this.isLoadingPanel = false;
    } catch (error) {
      this.isLoadingPanel = false;
    }
  }

  async downloadExcel() {
    let header = [{
      A: "No",
      B: "HN",
      C: "Name",
      D: "Order Note",
      E: "Production Note",
      H: "Updated At",
    }];
    let data: any = await this.getDataAll();
    this.exportAsExcelFile(data, header, 'Pharmacy_Notes');
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
    }
    console.log(res);
    return data.map((r, i) => {
      return {
        no: i + 1,
        hn: r.hn,
        name: r.name,
        orderNote: r.orderNote,
        productionNote: r.productionNote,
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
      let offset = e.value * this.gridMicroservices.instance.pageSize()
      let limits = this.gridMicroservices.instance.pageSize()
      if ((((offset / limits) + 1) * limits) > this.numMicroservices) {
        this.dataResultItems = (this.pageIndex) * limits + this.getDataMicroservices.length;
      } else {
        this.dataResultItems = limits * (page);
      }
      this.textTotal = 'Search Results ' + (offset + 1) + ' - ' + this.dataResultItems + ' of ' + this.numMicroservices + ' Items';
      this.gridMicroservices.instance.refresh();
    }

    if (e.fullName === "paging.pageSize") {
      this.changeSize = true;
      let page = 1
      let offset = 0
      let limits = e.value
      if ((((offset / limits) + 1) * limits) > this.numMicroservices) {
        this.dataResultItems = (offset) * limits + this.getDataMicroservices.length;
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

          let filterData: any = {
            ...this.txtInputSearch,
          }
          
          const isChange = this.common.checkFilter(filterData, this.filterStore, this.offset)
          console.log("isChange",isChange)
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
              orderby: loadOptions.sort ? loadOptions.sort[0].selector : 'updatedAt|DESC'
            };
          } else {
            filterData = {
              ...filterData,
              offset: this.offset,
              limit: this.limits,
              orderby: loadOptions.sort ? loadOptions.sort[0].selector : 'updatedAt|DESC'
            };
          }

          this.checkClickSearch = false;
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
                // console.log(this.resResultCode);
                if (this.resResultCode === resultCodeSuccess) {
                  let resultData = response.resultData
                  resultData = resultData.map((r, i) => {
                    return { ...r, id: i }
                  })

                  this.getDataMicroservices = resultData;
                  //click row view description
                  for (let i = 0; i < this.getDataMicroservices.length; i++) {
                    this.getDataMicroservices[i].updatedAt = this.common.convertDate(this.getDataMicroservices[i].updatedAt, 'DD/MM/YYYY HH:mm:ss');
                  }

                  //num numMicroservices Search Results 0 of 0 Items
                  this.numMicroservices = response.rowCount;
                  if (this.numMicroservices !== 0) {
                    let page = ((this.offset / this.limits) + 1);
                    this.pageIndex = page - 1
                    this.textTotal = ' Search Results 0 of 0 Item';
                    if ((((this.offset / this.limits) + 2) * this.limits) > this.numMicroservices) {
                      this.dataResultItems = (page - 1) * this.limits + this.getDataMicroservices.length;
                    } else {
                      this.dataResultItems = this.limits * page;
                    }
                    this.textTotal = 'Search Results ' + (this.offset + 1) + ' - ' + this.dataResultItems + ' of ' + this.numMicroservices + ' Items';
                  } else {
                    this.loading = false;
                    this.changeSize = false;
                    this.dataMicroservices = {};
                    this.getDataMicroservices = [];
                    this.numMicroservices = 0;
                    this.textTotal = ' Search Results 0 of 0 Item';
                  }
                  this.loading = false;
                  this.changeSize = false;

                } else {
                  this.loading = false;
                  this.changeSize = false;
                  this.dataMicroservices = {};
                  this.getDataMicroservices = [];
                  this.numMicroservices = 0;
                  this.textTotal = ' Search Results 0 of 0 Item';
                  this.goAlert(response.resultCode, response.resultDescription, [], 'myModalError');
                }

              }
              backData = this.getDataMicroservices;
              backItemTotal = this.numMicroservices;

              return {
                data: this.getDataMicroservices,
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

  fnDownloadTemplate() {
    try {
      window.open(environment.ip + '/download/template/Pharmacy_Note_Template.xlsx')
    } catch (err) {
      console.log(err)
    }
  }

  async onFileChange(evt: any) {
    console.log(evt)
    try {
      const cp = this;
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
            this.goAlert('', '', [], 'myModalSuccess');
            this.dataMicroservices = this.customStore();
          }
          this.isLoadingPanel = false;
        } catch (error) {
          this.isLoadingPanel = false;
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
}
