import { Component, OnInit, AfterViewInit, ViewChild} from '@angular/core';
import { Router } from '@angular/router';
declare let $: any;
import { LayoutMenu } from '../../../shared/store/layout.menu.store';
import {GlobalVariable} from './movement-report.global';
import {Request} from '../../../shared/services/request.service';
import {Common} from '../../../shared/services/common.service';
import {DxDataGridComponent, DxDateBoxComponent} from 'devextreme-angular';
import * as moment from 'moment';
import { environment } from '../../../../environments/environment';
import { StoreService } from '../../../shared/services/store.service';
// import { Component} from '@angular/core';
import * as FileSaver from 'file-saver';
import * as XLSX from 'xlsx';

const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
const EXCEL_EXTENSION = '.xlsx';

@Component({
  selector: 'app-movement-report',
  providers: [LayoutMenu, Request, Common],
  templateUrl: './movement-report.component.html',
})
export class MovementReportComponent implements OnInit, AfterViewInit {
  @ViewChild('myModal') myModal;
  @ViewChild('dateFrom') dateFrom: DxDateBoxComponent;
  @ViewChild('dateTo') dateTo: DxDateBoxComponent;

  @ViewChild(DxDataGridComponent) gridMicroservices: DxDataGridComponent;
  dataMicroservices = {};
  getDataMicroservices = [];

  errorFilePath: string;
  fileUpload: string;
  numMicroservices = 0;
  dataResultItems = 0;
  loadData = false;
  fieldsMicroservicesList;
  checkClickSearch = false;
  filterData:any = {};
  txtInputSearch;
  resResultCode;
  loading = true;
  hoverTootip:any;
  menuHome:any = false;
  menuPermissions:any = {view: false, add: false, edit: false, delete: false}
  filter: any = {};
  orderStatusList: any;
  max:any=undefined;
  min:any=undefined;
  constructor(
    public router: Router,
    private request: Request,
    public layoutMenu: LayoutMenu,
    private common: Common,
    private store : StoreService,
  ) {
    this.fieldsMicroservicesList = environment.fieldsMicroservicesList
  }

  ngOnInit() {
    // pagePermissionList
    this.store.subscribePagePermissionList().subscribe(pagePermissionList => {
      console.log("ngOnInit",pagePermissionList);
      let pagePermission = pagePermissionList.find(r=>r.url === GlobalVariable.ROLE_URL);
      if(pagePermission){
        try {
          this.menuPermissions = JSON.parse(pagePermission.menuPermissions)
          console.log(this.menuPermissions)
        } catch (error) {
          console.log(error);
        }
      }
    })
    this.store.subscribeMenu().subscribe((menu:any) => {
      let menuHome = false;
      for (let index = 0; index < menu.length; index++) {
        const element = menu[index];
        for (let index2 = 0; index2 < element.menus.length; index2++) {
          const element2 = element.menus[index2];
          for (let index3 = 0; index3 < element2.submenus.length; index3++) {
            const element3 = element2.submenus[index3];
            if(GlobalVariable.ROLE_URL === element3.url){
                if(!menuHome){
                    menuHome = element;
                }
                break ;
            }
          }
        }
      }
      this.menuHome = menuHome;
    })

    this.loading = false;
  }

  goHomeMenu(){
    if(this.menuHome){
        this.router.navigate(['/menu',this.menuHome['menuId'],this.menuHome['typePage']]);
    }
  }

  async ngAfterViewInit() {
    try {
      this.filter.orderDateFrom = moment().format('YYYY-MM-DD')
      this.filter.orderDateTo = moment().format('YYYY-MM-DD')
      this.max = moment().toDate()
      this.min = moment().toDate()
    } catch (e) {
      console.log('catch: ', e);
    }
  }

  async clickSearch() {
    try {
      // if(this.txtInputSearch !== '' && this.txtInputSearch !== null && this.txtInputSearch !== 'undefined' && this.txtInputSearch !== undefined){
        this.checkClickSearch = true;
        this.loadData = false;
      // }else {
      //   this.goAlert('Field is required','Please specify at least one filter.', 'myModalWarning');
      // }
    } catch (e) {
      console.log(e);
      const resultDescriptionSystemErrorTitle = environment.resultDescriptionSystemErrorTitle;
      const resultDescriptionSystemErrorMassage = environment.resultDescriptionSystemErrorMassage;
      this.goAlert(resultDescriptionSystemErrorTitle, resultDescriptionSystemErrorMassage,[], 'myModalError');
    }
  }

  async clickClear() {
    try {
      this.filter.orderDateFrom = moment().format('YYYY-MM-DD')
      this.filter.orderDateTo = moment().format('YYYY-MM-DD')
      this.max = moment().toDate()
      this.min = moment().toDate()
      this.filter.itemCode = null
      this.filter.itemName = null
      this.txtInputSearch = undefined;
      this.checkClickSearch = false;
      this.loadData = false;
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



  ondDownload() {
    window.open(this.errorFilePath)
    this.myModal.closeModal('modalErrorImport');
  }

  clickDownload(){
    console.log("onClickExport");
    if(this.filter['orderDateFrom']&&!this.filter['orderDateTo']){
      this.filter['orderDateTo']=this.filter['orderDateFrom'];
    }else if(!this.filter['orderDateFrom']&&this.filter['orderDateTo']){
      this.filter['orderDateFrom']=this.filter['orderDateTo'];
    }
    // this.gridMicroservices.export.enabled = true;
    // this.gridMicroservices.export.fileName = 'export-bin';
    // this.gridMicroservices.instance.exportToExcel(true);
    // this.downloadExcel()
    this.common.export('Movement_Report', this.filter, this.myModal);
  }

  async downloadExcel(){
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
	    this.exportAsExcelFile(data,header, 'BIN');
	}

  async getDataAll(){
    // let limit = 10;
    let data = [];
    // let rowCount =  0;
    // let index = 0
    //   do {
        const checkUrl = this.common.checkMockupUrl('', '', {

            orderby:  'updatedAt|DESC'
        }, {
          BASE_API: GlobalVariable.BASE_API,
          BASE_MODULE: GlobalVariable.BASE_MODULE,
          BASE_RESOURCE: GlobalVariable.BASE_RESOURCE + GlobalVariable.BASE_RESOURCE_GET
        });
        const res = await this.request.get(checkUrl.url, checkUrl.filter)
        if(res.resultCode === "20000"){
          data = [...data,...res.resultData]
          // rowCount = res.rowCount
        }
        console.log(res);
    // } while (rowCount < data.length);
    return data.map((r,i)=>{
      return {
        no:i+1,
        binName:r.binName,
        rawMaterialName:r.rawMaterials && r.rawMaterials.length ? r.rawMaterials[0].rawMaterialName:'',
        updatedAt: r.updatedAt?moment(r.updatedAt).format("DD/MM/YYYY HH:mm:ss"):""
      }
    });
  }


  public exportAsExcelFile(json: any[],headerText:any[],excelFileName: string): void {
    var worksheet = XLSX.utils.json_to_sheet(headerText, {header: [], skipHeader: true});
		XLSX.utils.sheet_add_json(worksheet, json, {skipHeader: true, origin: "A2"});
		const workbook: XLSX.WorkBook = { Sheets: { 'data': worksheet }, SheetNames: ['data'] };
		const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
		this.saveAsExcelFile(excelBuffer, excelFileName);
  }

  private saveAsExcelFile(buffer: any, fileName: string): void {
    const data: Blob = new Blob([buffer], {
      type: EXCEL_TYPE
    });
    FileSaver.saveAs(data, fileName  + "_" + moment().format("YYYYMMDD") + EXCEL_EXTENSION);
  }


  onCloseModalError(){
    console.log('onCancelDelete');
  }

  // Collapse ibox function
  clickCollapse() {
    let collapse = this.common.collapseFn();
  }

  onCellHoverChanged(e) {
    // console.log(e.value);
    this.hoverTootip = e.value;
  }

  onValueChanged(event: any, type: string) {
    console.log(event)
    this.filter[type] = moment(event.value).format('YYYY-MM-DD')
    if (type == 'orderDateFrom') {
      this.min = this.filter[type]=='Invalid date'?null:this.filter[type];
    } else if (type == 'orderDateTo') {
      this.max = this.filter[type]=='Invalid date'?null:this.filter[type];
    }
  }
}
