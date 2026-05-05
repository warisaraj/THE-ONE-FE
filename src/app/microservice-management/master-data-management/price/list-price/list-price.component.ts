import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, EventEmitter, Output, ViewEncapsulation} from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
declare let $: any;
import { LayoutMenu } from '../../../../shared/store/layout.menu.store';
import {GlobalVariable} from './list-price.global';
import {Request} from '../../../../shared/services/request.service';
import {Common} from '../../../../shared/services/common.service';
import {DxDataGridComponent} from 'devextreme-angular';
import * as moment from 'moment';
import { environment } from '../../../../../environments/environment';
import CustomStore from 'devextreme/data/custom_store';
import { StoreService } from '../../../../shared/services/store.service';
// import { Component} from '@angular/core';
import * as FileSaver from 'file-saver';
import * as XLSX from 'xlsx';
import { FormBuilder, FormControl, FormGroup, Validators, FormArray, AbstractControl } from '@angular/forms';
import * as _ from 'lodash'

const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
const EXCEL_EXTENSION = '.xlsx';

@Component({
  selector: 'app-list-price',
  providers: [LayoutMenu, Request, Common],
  templateUrl: './list-price.component.html',
  styleUrls: ['./list-price.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ListPriceComponent implements OnInit, AfterViewInit {
  @ViewChild('myModal') myModal;
  @ViewChild('myModalFormula') modalFormula: ElementRef;
  dataMicroservices = {};
  getDataMicroservices = [];
  priceForm:FormGroup;
  cloneView:any;
  cloneViewArr:any;
  pageType:any = "view";
  modalType:any = "add";
  modalIndex:any;
  modalData:any = {
    dividend:undefined,
    divider:undefined,
  };
  loading = false;
  priceData:any={
    batchCharge:null,
    packCharge:null,
    percentMarkup:null,
    productionCharge:[],
  };
  validatePopup = false;
  menuHome:any = false;
  menuPermissions:any = {view: false, add: false, edit: false, delete: false}
  constructor(
    public router: Router,
    private fb: FormBuilder,
    private request: Request,
    public layoutMenu: LayoutMenu,
    public common: Common,
    private store : StoreService,
  ) {
    this.priceForm = this.fb.group({
      'txtBatchCharge': new FormControl('', [Validators.required]),
      'txtPackCharge': new FormControl('', [Validators.required]),
      'txtPercentMarkup': new FormControl('', [Validators.required]),
      'productionCharge': this.fb.array([])
  });
  }

  get f(): any {
    return this.priceForm.controls
  }

  get formRowArray(): FormArray {
    return this.priceForm.controls['productionCharge'] as FormArray;
  }

  checkValid(e: any, target: any) {
    return e.controls[target].invalid && e.controls[target].dirty
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
    this.getSearchPrice()

    $(this.modalFormula.nativeElement).on("hidden.bs.modal", async () => {
      // put your default event here
      this.closeModal()
    });
  }


  async getSearchPrice() {
    try {
      const checkUrl = this.common.checkMockupUrl('', '', {}, {
        BASE_API: GlobalVariable.BASE_API,
        BASE_MODULE: GlobalVariable.BASE_MODULE,
        BASE_RESOURCE: GlobalVariable.BASE_RESOURCE + GlobalVariable.BASE_RESOURCE_GET
      });

      const resultCodeSuccess = environment.resultCodeSuccess;
      const resultCodeDataNotFound = environment.resultCodeDataNotFound;
      const resultDescriptionDataNotFoundTitle = environment.resultDescriptionDataNotFoundTitle;
      const resultDescriptionDataNotFoundMassage = environment.resultDescriptionDataNotFoundMassage;
      const resultDescriptionSystemErrorTitle = environment.resultDescriptionSystemErrorTitle;
      const resultDescriptionSystemErrorMassage = environment.resultDescriptionSystemErrorMassage;
      const resultCodeDbError = environment.resultCodeDbError;
      const resultDescriptionDbErrorTitle = environment.resultDescriptionDbErrorTitle;
      const resultDescriptionDbErrorMassage = environment.resultDescriptionDbErrorMassage;

      let response = await this.request.get(checkUrl.url, checkUrl.filter);
      if (response.resultCode === resultCodeSuccess) {
        if(Object.keys(response.resultData).length > 0) {
          this.priceData = response.resultData
          for (var i in this.priceData.productionCharge){
            if(this.priceData.productionCharge[i].isCalculate == 1){
              this.priceData.productionCharge[i].productionCharge = `(${this.priceData.productionCharge[i].dividend}/${this.priceData.productionCharge[i].divider})*Supply Day`
              this.formRowArray.push(this.fb.group({
                txtSupplyDayFrom: new FormControl({ value: +this.priceData.productionCharge[i].supplyDayFrom, disabled: true }),
                txtSupplyDayTo: new FormControl(this.priceData.productionCharge[i].supplyDayTo),
                txtProductionCharge: new FormControl({ value: this.priceData.productionCharge[i].productionCharge, disabled: true }, Validators.required),
              }));
            }else{
              this.priceData.productionCharge[i].productionCharge = this.priceData.productionCharge[i].productionCharge.toString();
              this.formRowArray.push(this.fb.group({
                txtSupplyDayFrom: new FormControl({ value: +this.priceData.productionCharge[i].supplyDayFrom, disabled: true }),
                txtSupplyDayTo: new FormControl(this.priceData.productionCharge[i].supplyDayTo),
                txtProductionCharge: new FormControl(this.priceData.productionCharge[i].productionCharge, Validators.required),
              }));
            }
          }
          this.priceData.batchCharge = this.priceData.batchCharge ? this.priceData.batchCharge.toString() : null
          this.priceData.packCharge = this.priceData.packCharge ? this.priceData.packCharge.toString() : null
          this.priceData.percentMarkup = this.priceData.percentMarkup ? this.priceData.percentMarkup.toString() : null
          console.log(this.priceData)
        }
      }
      //  else if (response.resultCode === resultCodeDataNotFound) {
      //   this.goAlert(resultDescriptionDataNotFoundTitle, resultDescriptionDataNotFoundMassage, 'myModalError');
      // } else if (response.resultCode === resultCodeDbError) {
      //   this.goAlert(resultDescriptionDbErrorTitle, resultDescriptionDbErrorMassage, 'myModalError');
      // }
       else {
        // this.goAlert(resultDescriptionSystemErrorTitle, resultDescriptionSystemErrorMassage, 'myModalError');
        this.goAlert(response.resultCode, response.resultDescription, 'myModalError');
      }

    } catch (e) {
      console.log(e);
      this.loading = false;

      const resultDescriptionSystemErrorTitle = environment.resultDescriptionSystemErrorTitle;
      const resultDescriptionSystemErrorMassage = environment.resultDescriptionSystemErrorMassage;
      this.goAlert(resultDescriptionSystemErrorTitle, resultDescriptionSystemErrorMassage, 'myModalError');
    }
  }

  initiateForm(): FormGroup {
      return this.fb.group({
        txtSupplyDayFrom: new FormControl({ value: '', disabled: true }),
        txtSupplyDayTo: new FormControl(''),
        txtProductionCharge: new FormControl('', Validators.required),
      });
  }

  addSource() {
    if(this.priceData.productionCharge.length == 0){
      this.formRowArray.push(this.fb.group({
        txtSupplyDayFrom: new FormControl({ value: '1', disabled: true }),
        txtSupplyDayTo: new FormControl(''),
        txtProductionCharge: new FormControl('', Validators.required),
      }));
      this.priceData.productionCharge.push({
        supplyDayFrom:1,
        supplyDayTo:null,
        productionCharge:null,
        no:1,
        isCalculate:0,
        dividend: null,
        divider: null,
      })
    }else{
      this.formRowArray.push(this.fb.group({
        txtSupplyDayFrom: new FormControl({ value: +this.priceData.productionCharge[this.priceData.productionCharge.length - 1].supplyDayTo + 1, disabled: true }),
        txtSupplyDayTo: new FormControl(''),
        txtProductionCharge: new FormControl('', Validators.required),
      }));
      this.priceData.productionCharge.push({
        supplyDayFrom: +this.priceData.productionCharge[this.priceData.productionCharge.length - 1].supplyDayTo + 1,
        supplyDayTo:null,
        productionCharge:null,
        no:this.formRowArray.length,
        isCalculate:0,
        dividend: null,
        divider: null,
      })
    }

    console.log(this.priceData.productionCharge)
  }

  delSource() {
    this.priceData.productionCharge.splice(this.formRowArray.length-1, 1);
    this.formRowArray.removeAt(this.formRowArray.length-1);
  }

  goHomeMenu(){
    if(this.menuHome){
        this.router.navigate(['/menu',this.menuHome['menuId'],this.menuHome['typePage']]);
    }
  }

  checkDup(){
    if (_.isEqualWith(this.cloneView, this.priceData, (a, b) => {
      if ((_.isNull(a) || a == '') && (_.isNull(b) || b == '')) return true;
    }))
      return true
    return false
  }

  async saveSubmit(){
    console.log(this.priceData)

    if (this.priceForm.invalid) {
      console.log("invalid")
      Object.keys(this.f).forEach((control: string) => {
        const Control: AbstractControl = this.f[control]
        if (Control.invalid)
          Control.markAsDirty()
      })
      for (var i in this.formRowArray.controls) {
        let item: any = this.formRowArray.controls[i]
        Object.keys(item.controls).forEach((control: any) => {
          const Control: AbstractControl = item.controls[control]
          if (Control.invalid)
            Control.markAsDirty()
        })
      }
      this.goAlert('Field is required', 'Your have left a field empty and a value must be entered.', 'myModalWarning');
    }else{
      console.log("valid")
      let payload = _.cloneDeep(this.priceData)
      console.log(this.cloneView)
      console.log(this.priceData)

      if(+payload.batchCharge == +this.cloneView.batchCharge) delete payload.batchCharge
      if(+payload.packCharge == +this.cloneView.packCharge) delete payload.packCharge
      if(+payload.percentMarkup == +this.cloneView.percentMarkup) delete payload.percentMarkup

      if (_.isEqualWith(this.cloneView.productionCharge, payload.productionCharge, (a, b) => {
        if ((_.isNull(a) || a === '') && (_.isNull(b) || b === '')) return true;
      })){
        delete payload.productionCharge
      }else{
        for (let i in payload.productionCharge){
          if(payload.productionCharge[i].isCalculate == 1){
            payload.productionCharge[i].productionCharge = null
          } else {
            payload.productionCharge[i].productionCharge = +payload.productionCharge[i].productionCharge
          }
        }
      }
      console.log(payload)
      let checkUrl = null;
      let response
      checkUrl = this.common.checkMockupUrl('', GlobalVariable.RESOURCE, {}, {
        BASE_API: GlobalVariable.BASE_API,
        BASE_MODULE: GlobalVariable.BASE_MODULE,
        BASE_RESOURCE: GlobalVariable.BASE_RESOURCE + GlobalVariable.BASE_RESOURCE_UPDATE
      });
      response = await this.request.post(checkUrl.url, payload);

      let resultCodeSuccess = environment.resultCodeSuccess;
      let resultCodeMissingParameter = environment.resultCodeMissingParameter;
      let resultCodeDataNotFound = environment.resultCodeDataNotFound;

      const userMessageAlreadyExisted = response.userMessage;
      if (response.resultCode === resultCodeSuccess) {
        this.goAlert('', '', 'myModalSuccess');
      }
      else {
        this.goAlert(response.resultCode, response.resultDescription, 'myModalError');
      }
    }
  }

  async ngAfterViewInit() {
    try {
    // this.dataMicroservices = await this.customStore();
    } catch (e) {
      console.log('catch: ', e);
    }
  }

  goAlert(userTitle,userMessage, modalId) {
    const dataAlert = {
      'modalId': modalId,
      'userTitle': userTitle,
      'userMessage': userMessage
    };
    this.myModal.openModal(dataAlert);
  }

  onCloseModalError(){
    console.log('onCancelDelete');
  }

  onClickBack() {
    this.router.navigateByUrl('/microservice-menus').then(
      ()=> this.router.navigate(['/master-data-management','price'])
    );
  }

  goEdit(){
    this.cloneView = _.cloneDeep(this.priceData)
    this.pageType = 'update'
  }

  // cancelEdit(){
  //   while(this.formRowArray.length > 0){
  //     this.formRowArray.removeAt(this.formRowArray.length-1)
  //   }
  //   this.priceData = _.cloneDeep(this.cloneView)
  //   for (var i in this.priceData.productionCharge){
  //     this.formRowArray.push(this.fb.group({
  //       txtSupplyDayFrom: new FormControl({ value: +this.priceData.productionCharge[i].supplyDayFrom, disabled: true }),
  //       txtSupplyDayTo: new FormControl(this.priceData.productionCharge[i].supplyDayTo),
  //       txtProductionCharge: new FormControl(this.priceData.productionCharge[i].productionCharge, Validators.required),
  //     }));
  //   }
  //   this.cloneView = undefined
  //   Object.keys(this.f).forEach((control: string) => {
  //     const Control: AbstractControl = this.f[control]
  //     Control.markAsPristine()
  //     Control.markAsUntouched()
  //   })
  //   this.pageType = 'view'
  // }

  numberOnly(event): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;
    if( charCode == 46 ){
        return true;
    }else if (charCode > 31 && (charCode < 48 || charCode > 57 ) ) {
      return false;
    }
    return true;
  }

  openModal(data, index) {
    console.log(data);
    if(data.isCalculate == 0){
      this.modalType = 'add'
    }else{
      this.modalType = 'update'
      this.modalData.divider = data.divider
      this.modalData.dividend = data.dividend
    }
    this.modalIndex = index
    $(this.modalFormula.nativeElement).modal('show');

    // ปรับ html <body> ให้กลับเป็นปกติเมื่อเปิด-ปิด modal
    document.body.style.paddingRight = '0px';
  }



  closeModal() {
    $(this.modalFormula.nativeElement).modal('hide');
    this.modalIndex = undefined
    this.modalType = undefined
    this.modalData.divider = undefined
    this.modalData.dividend = undefined
    this.validatePopup = false
  }

  addFormula(){
    this.validatePopup = true
    if(this.modalData.divider != null && this.modalData.divider != undefined && this.modalData.divider != 0 &&
      this.modalData.dividend != null && this.modalData.dividend != undefined && this.modalData.dividend != 0 ){
        console.log(this.modalData.divider)
        console.log(this.modalData.dividend)
        this.priceData.productionCharge[this.modalIndex].divider = +this.modalData.divider
        this.priceData.productionCharge[this.modalIndex].dividend = +this.modalData.dividend
        this.priceData.productionCharge[this.modalIndex].isCalculate = 1
        this.priceData.productionCharge[this.modalIndex].productionCharge = `(${this.priceData.productionCharge[this.modalIndex].dividend}/${this.priceData.productionCharge[this.modalIndex].divider})*Supply Day`
        let item: any = this.formRowArray.controls[this.modalIndex]
        item.controls["txtProductionCharge"].disable()
        this.closeModal()
    }
  }

  clearFormula(){
    this.priceData.productionCharge[this.modalIndex].divider = null
    this.priceData.productionCharge[this.modalIndex].dividend = null
    this.priceData.productionCharge[this.modalIndex].isCalculate = 0
    this.priceData.productionCharge[this.modalIndex].productionCharge = null
    let item: any = this.formRowArray.controls[this.modalIndex]
    item.controls["txtProductionCharge"].enable()
    this.closeModal()
  }

  onInput(id, key, index?: number) {
    if (index >= 0) {
      const elm: any = document.getElementById(id + index);
      this.priceData.productionCharge[index][key] = elm.value || '';
    } else {
      const elm: any = document.getElementById(id);
      this.priceData[key] = elm.value || '';
    }
  }
}
