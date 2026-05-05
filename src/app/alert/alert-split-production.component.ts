import {AfterViewInit, Component, ElementRef, EventEmitter, NgModule, OnInit, Output, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActivatedRoute, Router} from '@angular/router';
import {FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {DxDateBoxModule, DxNumberBoxModule} from 'devextreme-angular';
import {environment} from '../../environments/environment';
import {GlobalVariable} from './alert-split-production.global';
import {Request} from '../shared/services/request.service';
import {Common} from '../shared/services/common.service';
import * as moment from 'moment';
import * as _ from 'lodash';

declare let $: any;

@Component({
  selector: 'app-alert-split-production',
  providers: [],
  templateUrl: './alert-split-production.component.html',
  styleUrls: ['./alert-split-production.scss'],
})
export class AlertSplitProductionComponent implements OnInit, AfterViewInit {
  @ViewChild('myModal') myModal;
  @ViewChild('modalSplitProduction') modalSplitProduction: ElementRef;
  @Output() clickSplitProductionNo = new EventEmitter();
  userMessage;
  userMessageList;
  dataText: any;
  dxgridPageSize;
  failDescription;
  percent = 0;
  buttonText = '';
  data: any = {};
  urgentRequestReason = '';
  splitProductionForm1: FormGroup;
  splitProductionForm2: FormGroup;
  printPageList = [];
  isShowPrintLabel = false;
  iconURL = '../../assets/icon-md/calendar.png';
  selectedFile: any;
  filePicture: any;
  imageInputText: string;
  oldProdDate;
  dataForm1 = {
    supplyDay: '',
    numberOfItem: '',
    numberOfSplit: '',
    calculatedDay: '',
    firstProductionDate: null,
  };
  step = 0;
  productionList = [
    {
      no: '1',
      supplyDay: null,
      productionStartDate: null,
      productionStartDateRemark: '',
      splitProdReason: '',
      sepLastMorningCapPerDay: '',
      sepMorningSupplyDay: '',
      sepLastLunchCapPerDay: '',
      sepLunchSupplyDay: '',
      sepLastEveningCapPerDay: '',
      sepEveningSupplyDay: '',
      sepLastBedtimeCapPerDay: '',
      sepBedtimeSupplyDay: '',
      totalCapPerDay: '',
      calculatedDay: null,
      sepMorningSupplyDayError: false,
      sepLunchSupplyDayError: false,
      sepEveningSupplyDayError: false,
      sepBedtimeSupplyDayError: false
    }
  ];
  isChangeProductionDate = false;
  orderId: any;
  result: any;
  now: Date;
  splitProductionData = {
    itemCount: 0,
    orderId: null,
    supplyDay: null,
    isSeparateMeal: null,
    sepLastMorningCapPerDay: null,
    sepLastLunchCapPerDay: null,
    sepLastEveningCapPerDay: null,
    sepLastBedtimeCapPerDay: null,
    sepMorningSupplyDay: null,
    sepLunchSupplyDay: null,
    sepEveningSupplyDay: null,
    sepBedtimeSupplyDay: null,
    sepTotalCap: null,
    calculatedDay: null,
    splitProdReason: '',
    patientInfo: {
      hn: '',
      patientName: '',
      phone: '',
      address: '',
      subdistrict: '',
      district: '',
      province: '',
      postcode: '',
      contactPerson: '',
      item: null
    },
    booking: {
      confirmedDay: null,
      slotNo: null,
      productionStartDate: '',
      productionStartTime: '',
      productionEndDate: '',
      productionEndTime: '',
      stdProductionHour: null,
      cashierSupNote: ''
    },
    deliveryDetail: {
      recipientName: '',
      phone: '',
      patientAddressId: null,
      address: '',
      district: '',
      subdistrict: '',
      province: '',
      postcode: '',
      deliveryDate: '',
      arrivalTime: null,
      deliveryMethod: null,
      deliveryMethodOther: '',
      packaging: null,
      isInvoice: null,
      isReceipt: null,
      isUrgent: null,
      cashierId: null,
      cashierDeliNote: ''
    }
  };
  isInvalidSupplyDay = false;
  rawMaterialList = [];
  orderCompound = [];
  isMaxSplit = false;

  constructor(private router: Router,
              private request: Request,
              private common: Common,
              private fb: FormBuilder,
              private route: ActivatedRoute) {
    this.dataText = {
      userTitle: '',
      userMessage: '',
      userMessageList: ''
    };
    this.splitProductionForm1 = this.fb.group({
      'txtSupplyDay': new FormControl({value: '', disabled: true}),
      'txtNumberOfItem': new FormControl({value: '', disabled: true}),
      'txtNumberOfSplit': new FormControl({value: '', disabled: false}, [Validators.required]),
      'txtFirstProductionDate': new FormControl({value: '', disabled: true}),
    });
  }

  ngOnInit() {

  }

  async ngAfterViewInit() {
    try {

    } catch (e) {
      console.log(e);
    }
  }

  goAlert(userTitle, userMessage, modalId) {
    const dataAlert = {
      'modalId': modalId,
      'userTitle': userTitle,
      'userMessage': userMessage
    };
    this.myModal.openModal(dataAlert);
  }

  async searchOrderPharmacistView() {
    try {
      this.dataForm1.numberOfSplit = '';
      this.splitProductionForm1.controls['txtNumberOfSplit'].reset();
      const filterData = {
        orderId: this.orderId,
      };

      const checkUrl = this.common.checkMockupUrl('', '', filterData, {
        BASE_API: GlobalVariable.BASE_API,
        BASE_MODULE: GlobalVariable.BASE_MODULE,
        BASE_RESOURCE: GlobalVariable.BASE_RESOURCE + GlobalVariable.BASE_RESOURCE_GET_BY_ID
      });
      const resultCodeSuccess = environment.resultCodeSuccess;
      const response = await this.request.get(checkUrl.url, checkUrl.filter);
      if (response.resultCode === resultCodeSuccess) {
        this.result = await response.resultData;
        this.oldProdDate = this.result.productionStartDate;
        this.dataForm1.supplyDay = response.resultData.supplyDay;
        this.dataForm1.calculatedDay = response.resultData.calculatedDay;
        this.dataForm1.firstProductionDate = moment(response.resultData.productionStartDate, 'DD/MM/YYYY').format('DD/MM/YYYY');
        this.orderCompound = this.result.orderCompound || [];
        localStorage.setItem('orderCompound', JSON.stringify(this.result.orderCompound)); // ไว้ใช้คำนวณ cpdExp

        // เก็บข้อมูลการจองเดิมเพื่อไปใช้หน้า split production
        try {
          const startDateTime = response.resultData.productionStartDate + ' ' + response.resultData.productionStartTime;
          const start = moment(startDateTime, 'DD/MM/YYYY HH:mm');
          const endDateTime = response.resultData.productionEndDate + ' ' + response.resultData.productionEndTime;
          const end = moment(endDateTime, 'DD/MM/YYYY HH:mm');
          const diffHour = end.diff(start, 'h', true);
          const oldBooking = {
            start,
            end,
            slot: +response.resultData.slotNo,
            diffHour
          };
          localStorage.setItem('oldBookingSplitProduction', JSON.stringify(oldBooking));
        } catch (error) {
          console.log('searchOrderPharmacistView error', error);
        }

        this.fnCreateNewForm2();
      } else {
        this.goAlert(response.resultCode, response.resultDescription, 'myModalError');
      }
    } catch (e) {
      console.log(e);
    }
  }

  async searchRawMaterials() {
    // if (this.order.orderStatus == 24) {
    //   return;
    // }
    try {
      const filterData = {
        orderId: this.orderId,
      };
      const checkUrl = this.common.checkMockupUrl('', '', filterData, {
        BASE_API: '',
        BASE_MODULE: environment.apiPrefix,
        BASE_RESOURCE: environment.searchRawMaterials
      });
      const resultCodeSuccess = environment.resultCodeSuccess;

      const response = await this.request.get(checkUrl.url, checkUrl.filter);
      if (response.resultCode === resultCodeSuccess) {
        const resultData = await response.resultData;
        // rawMaterials
        this.rawMaterialList = resultData || [];
        for (let i = 0; i < this.rawMaterialList.length; i++) {
          const code = this.rawMaterialList[i].code;
          // check rawMaterial has in orderCompound
          let isInOrderCompound = false;
          for (let j = 0; j < this.orderCompound.length; j++) {
            if (this.orderCompound[j].rawMaterialCode === code && this.orderCompound[j].rawMaterialName !== 'Vivapur') {
              isInOrderCompound = true;
              break;
            }
          }
        }
        localStorage.setItem('rawMaterialList', JSON.stringify(resultData)); // ไว้ใช้คำนวณ cpdExp
      } else {
        this.rawMaterialList = [];
      }
    } catch (e) {
      console.error(e);
      this.rawMaterialList = [];
    }
  }

  async searchCountItem() {
    try {
      const filterData = {
        orderId: this.orderId,
      };

      const checkUrl = this.common.checkMockupUrl('', '', filterData, {
        BASE_API: GlobalVariable.BASE_API,
        BASE_MODULE: GlobalVariable.BASE_MODULE,
        BASE_RESOURCE: GlobalVariable.BASE_RESOURCE + GlobalVariable.BASE_RESOURCE_GET_COUNT
      });
      const resultCodeSuccess = environment.resultCodeSuccess;
      const response = await this.request.get(checkUrl.url, checkUrl.filter);
      if (response.resultCode === resultCodeSuccess) {
        const result = await response.resultData;
        console.log('result.itemCount', result.itemCount);
        this.dataForm1.numberOfItem = `${result.itemCount || 1}`; // ถ้าได้ 0 หรือไม่มีค่าจะ default เป็น 1
        console.log('this.dataForm1.numberOfItem', this.dataForm1.numberOfItem);
      } else {
        this.goAlert(response.resultCode, response.resultDescription, 'myModalError');
      }
    } catch (e) {
      console.log(e);
      // const resultDescriptionSystemErrorTitle = environment.resultDescriptionSystemErrorTitle;
      // const resultDescriptionSystemErrorMassage = environment.resultDescriptionSystemErrorMassage;
      // this.goAlert(resultDescriptionSystemErrorTitle, resultDescriptionSystemErrorMassage, 'myModalError');
    }
  }

  async open(id: number) {
    this.orderId = id;
    this.step = 0;
    this.now = new Date();
    await this.searchOrderPharmacistView();
    await this.searchCountItem();
    await this.searchRawMaterials();
    $(this.modalSplitProduction.nativeElement).modal({
      backdrop: 'static'
    });

    // ปรับ html <body> ให้กลับเป็นปกติเมื่อเปิด-ปิด modal
    document.body.style.paddingRight = '0px';
  }

  close() {
    $(this.modalSplitProduction.nativeElement).modal('hide');
  }

  fnSetSplitProductionData(data) {
    // setData
    this.splitProductionData.itemCount = +this.dataForm1.numberOfItem;
    this.splitProductionData.orderId = +this.orderId;
    this.splitProductionData.supplyDay = +data.supplyDay;
    this.splitProductionData.isSeparateMeal = +this.result.isSeparateMeal;
    this.splitProductionData.sepLastMorningCapPerDay = +this.result.sepLastMorningCapPerDay;
    this.splitProductionData.sepLastLunchCapPerDay = +this.result.sepLastLunchCapPerDay;
    this.splitProductionData.sepLastEveningCapPerDay = +this.result.sepLastEveningCapPerDay;
    this.splitProductionData.sepLastBedtimeCapPerDay = +this.result.sepLastBedtimeCapPerDay;
    this.splitProductionData.sepMorningSupplyDay = +data.sepMorningSupplyDay;
    this.splitProductionData.sepLunchSupplyDay = +data.sepLunchSupplyDay;
    this.splitProductionData.sepEveningSupplyDay = +data.sepEveningSupplyDay;
    this.splitProductionData.sepBedtimeSupplyDay = +data.sepBedtimeSupplyDay;
    this.splitProductionData.sepTotalCap = +this.result.totalCapPerDay;
    this.splitProductionData.calculatedDay = +data.calculatedDay;
    // tslint:disable-next-line:max-line-length
    this.splitProductionData.splitProdReason = this.productionList[0].splitProdReason || '';

    // setData patientInfo
    this.splitProductionData.patientInfo.hn = this.result.hn || '';
    this.splitProductionData.patientInfo.patientName = this.result.patientName || '';
    this.splitProductionData.patientInfo.phone = this.result.phone || '';
    this.splitProductionData.patientInfo.address = this.result.address;
    this.splitProductionData.patientInfo.district = this.result.district;
    this.splitProductionData.patientInfo.subdistrict = this.result.subdistrict;
    this.splitProductionData.patientInfo.province = this.result.province;
    this.splitProductionData.patientInfo.postcode = this.result.postcode || '';
    this.splitProductionData.patientInfo.contactPerson = this.result.contactPerson || '';
    this.splitProductionData.patientInfo.item = this.result.item || null;

    this.splitProductionData.booking.confirmedDay = +moment().format('DD');
    this.splitProductionData.booking.slotNo = null;
    this.splitProductionData.booking.productionStartDate = data.productionStartDate || null;
    this.splitProductionData.booking.productionStartTime = '';
    this.splitProductionData.booking.productionEndDate = null;
    this.splitProductionData.booking.productionEndTime = '';
    this.splitProductionData.booking.stdProductionHour = null;
    this.splitProductionData.booking.cashierSupNote = '';

    // setData deliveryDetail
    if (this.result.deliveryDetail && this.result.deliveryDetail.length > 0) {
      const deliveryDetail = this.result.deliveryDetail[0];
      this.splitProductionData.deliveryDetail.recipientName = deliveryDetail.recipientName || '';
      this.splitProductionData.deliveryDetail.phone = deliveryDetail.phone || '';
      this.splitProductionData.deliveryDetail.patientAddressId = deliveryDetail.patientAddressId || null;
      this.splitProductionData.deliveryDetail.address = deliveryDetail.address || '';
      this.splitProductionData.deliveryDetail.district = deliveryDetail.district || '';
      this.splitProductionData.deliveryDetail.subdistrict = deliveryDetail.subdistrict || '';
      this.splitProductionData.deliveryDetail.province = deliveryDetail.province || '';
      this.splitProductionData.deliveryDetail.postcode = deliveryDetail.postcode || '';
      // tslint:disable-next-line:max-line-length
      this.splitProductionData.deliveryDetail.deliveryDate = deliveryDetail.deliveryDate ? moment(deliveryDetail.deliveryDate, 'DD/MM/YYYY').format('DD-MM-YYYY') : '';
      this.splitProductionData.deliveryDetail.arrivalTime = deliveryDetail.arrivalTime || null;
      this.splitProductionData.deliveryDetail.deliveryMethod = deliveryDetail.deliveryMethod || null;
      this.splitProductionData.deliveryDetail.deliveryMethodOther = deliveryDetail.deliveryMethodOther || null;
      this.splitProductionData.deliveryDetail.packaging = deliveryDetail.packaging || null;
      this.splitProductionData.deliveryDetail.isInvoice = deliveryDetail.isInvoice === 1 || null;
      this.splitProductionData.deliveryDetail.isReceipt = deliveryDetail.isReceipt === 1 || null;
      this.splitProductionData.deliveryDetail.isUrgent = deliveryDetail.isUrgent === 1 || null;
      this.splitProductionData.deliveryDetail.cashierId = deliveryDetail.cashierId || null;
      this.splitProductionData.deliveryDetail.cashierDeliNote = deliveryDetail.cashierDeliNote || '';
    }
  }

  onClickSplitProductionNext(split?: number) {
    const valid = this.validSplitProductionForm1();
    if (valid) {
      this.step = 2;
      this.fnCreateNewForm2();
      const numberOfSplit = split ? split : +this.dataForm1.numberOfSplit;
      const supplyDay = +this.dataForm1.supplyDay;
      const firstProductionDate = moment(this.dataForm1.firstProductionDate, 'DD/MM/YYYY');
      let supplyDayFraction = 0;
      if (supplyDay % numberOfSplit !== 0) {
        supplyDayFraction = supplyDay % numberOfSplit;
      }
      const calSupplyDay = Math.floor(supplyDay / numberOfSplit);
      console.log('calSupplyDay', calSupplyDay);
      for (let i = 0; i < numberOfSplit; i++) {
        console.log(i, supplyDayFraction);
        if (supplyDayFraction && supplyDayFraction > 0) {
          --supplyDayFraction;
          if (i === 0) {
            this.productionList[0].supplyDay = `${calSupplyDay + 1}`;
            console.log('this.productionList[0].productionStartDate', this.productionList[0].productionStartDate);
            this.productionList[0].productionStartDate = firstProductionDate.format('DD/MM/YYYY');
            firstProductionDate.add(calSupplyDay + 1, 'd');
          } else {
            firstProductionDate.add(calSupplyDay + 1, 'd');
            this.onClickProductionAdd({
              supplyDay: `${calSupplyDay + 1}`,
              productionStartDate: firstProductionDate.toDate(),
            });
          }
        } else {
          if (i === 0) {
            this.productionList[0].supplyDay = `${calSupplyDay}`;
            console.log('this.productionList[0].productionStartDate', this.productionList[0].productionStartDate);
            this.productionList[0].productionStartDate = firstProductionDate.format('DD/MM/YYYY');
            firstProductionDate.add(calSupplyDay, 'd');
          } else {
            firstProductionDate.add(calSupplyDay, 'd');
            this.onClickProductionAdd({
              supplyDay: `${calSupplyDay}`,
              productionStartDate: firstProductionDate.toDate(),
            });
          }
        }
      }
      console.log(this.productionList);

      this.fnReCalDelivery(true);
    }
  }

  onClickSplitProductionAdd() {
    const valid = this.validSplitProductionForm1();
    if (valid) {
      const lastIndex = this.productionList.length - 1;
      const lastData = this.productionList[lastIndex];
      const supplyDay = lastData.supplyDay || 0;
      this.onClickProductionAdd({
        supplyDay: `0`,
        productionStartDate: moment(lastData.productionStartDate).add(supplyDay, 'day').toDate(),
      });
    }
  }

  onClickSplitProductionYes() {
    this.step = 1;
  }

  onClickSplitProductionNo() {
    this.clickSplitProductionNo.emit();
    $(this.modalSplitProduction.nativeElement).modal('hide');
  }

  validSplitProductionForm1() {
    console.log(this.splitProductionForm1.controls, this.splitProductionForm1, this.splitProductionForm1.valid);
    for (const key in this.splitProductionForm1.controls) {
      if (this.splitProductionForm1.controls[key].errors) {
        this.splitProductionForm1.controls[key].setErrors({'forceRequired': true});
        this.splitProductionForm1.controls[key].markAsDirty();
      } else {
        this.splitProductionForm1.controls[key].updateValueAndValidity();
      }
    }
    return this.splitProductionForm1.valid;
  }

  // step 2

  validSplitProductionForm2() {
    // check require txtSplitProdReason1
    if (this.isChangeProductionDate) {
      this.splitProductionForm2.controls['txtSplitProdReason1'].setValidators(Validators.required);
    } else {
      this.splitProductionForm2.controls['txtSplitProdReason1'].setValidators(null);
    }
    this.splitProductionForm2.controls['txtSplitProdReason1'].updateValueAndValidity();

    // start validate
    console.log(this.splitProductionForm2.controls, this.splitProductionForm2, this.splitProductionForm2.valid);
    for (const key in this.splitProductionForm2.controls) {
      if (this.splitProductionForm2.controls[key].errors) {
        this.splitProductionForm2.controls[key].setErrors({'forceRequired': true});
        console.log('key', key);
        this.splitProductionForm2.controls[key].markAsDirty();
      } else {
        this.splitProductionForm2.controls[key].updateValueAndValidity();
      }
    }

    // validate Separate Meal
    for (let i = 0; i < this.productionList.length; i++) {
      const data = this.productionList[i];
      if (data.sepMorningSupplyDayError || data.sepLunchSupplyDayError || data.sepEveningSupplyDayError || data.sepBedtimeSupplyDayError) {
        return false;
      }
    }
    return this.splitProductionForm2.valid;
  }

  fnCreateNewForm2() {
    this.isChangeProductionDate = false;
    this.productionList = [
      {
        no: '1',
        supplyDay: '',
        productionStartDate: this.result.productionStartDate,
        productionStartDateRemark: '',
        splitProdReason: '',
        sepLastMorningCapPerDay: this.result.sepLastMorningCapPerDay,
        sepMorningSupplyDay: this.result.sepLastMorningCapPerDay ? '' : '',
        sepLastLunchCapPerDay: this.result.sepLastLunchCapPerDay,
        sepLunchSupplyDay: this.result.sepLastLunchCapPerDay ? '' : '',
        sepLastEveningCapPerDay: this.result.sepLastEveningCapPerDay,
        sepEveningSupplyDay: this.result.sepLastEveningCapPerDay ? '' : '',
        sepLastBedtimeCapPerDay: this.result.sepLastBedtimeCapPerDay,
        sepBedtimeSupplyDay: this.result.sepLastBedtimeCapPerDay ? '' : '',
        totalCapPerDay: this.result.totalCapPerDay,
        calculatedDay: null,
        sepMorningSupplyDayError: false,
        sepLunchSupplyDayError: false,
        sepEveningSupplyDayError: false,
        sepBedtimeSupplyDayError: false
      }
    ];
    this.splitProductionForm2 = this.fb.group({
      'txtForm2SupplyDay': new FormControl({value: this.dataForm1.supplyDay, disabled: true}),
      'txtForm2NumberOfItem': new FormControl({value: this.dataForm1.numberOfItem, disabled: true}),
      'txtForm2CalculatedDay': new FormControl({value: this.dataForm1.calculatedDay, disabled: true}),
      'txtProductionSupplyDay1': new FormControl({value: '', disabled: false}, Validators.required),
      'txtProductionStartDate1': new FormControl({value: '', disabled: true}, Validators.required),
      'txtSplitProdReason1': new FormControl({value: '', disabled: false}),
      'txtProductionReason': new FormControl({value: '', disabled: false}),
      'txtSepMorningSupplyDay1': new FormControl({value: '', disabled: false}),
      'txtSepLunchSupplyDay1': new FormControl({value: '', disabled: false}),
      'txtSepEveningSupplyDay1': new FormControl({value: '', disabled: false}),
      'txtSepBedtimeSupplyDay1': new FormControl({value: '', disabled: false}),
      'txtCalculatedDay1': new FormControl({value: '', disabled: true}),
    });

    // if (!this.result.sepLastMorningCapPerDay) {
    //   this.splitProductionForm2.controls['txtSepMorningSupplyDay1'].disable();
    // }
    // if (!this.result.sepLastLunchCapPerDay) {
    //   this.splitProductionForm2.controls['txtSepLunchSupplyDay1'].disable();
    // }
    // if (!this.result.sepLastEveningCapPerDay) {
    //   this.splitProductionForm2.controls['txtSepEveningSupplyDay1'].disable();
    // }
    // if (!this.result.sepLastBedtimeCapPerDay) {
    //   this.splitProductionForm2.controls['txtSepBedtimeSupplyDay1'].disable();
    // }

    this.fnCheckRequireSeperateMeal();
  }

  onClickSplitProductionBack() {
    this.step = 1;
  }

  onClickSplitProductionSave() {
    const valid = this.validSplitProductionForm2();
    this.fnCheckSumSupplyDay(false);
    console.log('valid', valid);
    console.log('this.isInvalidSupplyDay', this.isInvalidSupplyDay);
    if (valid && !this.isInvalidSupplyDay) {
      $(this.modalSplitProduction.nativeElement).modal('hide');
      const splitProductionList = [];
      for (let i = 0; i < this.productionList.length; i++) {
        const data = this.productionList[i];
        this.fnSetSplitProductionData(data);
        splitProductionList.push(_.cloneDeep(this.splitProductionData));
      }
      // const productionList = _.cloneDeep(this.productionList);
      // productionList[0].productionStartDate = moment(productionList[0].productionStartDate, 'DD/MM/YYYY').toDate();
      // productionList.forEach((element: any) => {
      //   element.orderId = this.orderId;
      //   element.sepTotalCap = element.totalCapPerDay;
      //   element.sepMorningSupplyDay = element.sepMorningSupplyDay === '-' ? null : element.sepMorningSupplyDay;
      //   element.sepLunchSupplyDay = element.sepLunchSupplyDay === '-' ? null : element.sepLunchSupplyDay;
      //   element.sepEveningSupplyDay = element.sepEveningSupplyDay === '-' ? null : element.sepEveningSupplyDay;
      //   element.sepBedtimeSupplyDay = element.sepBedtimeSupplyDay === '-' ? null : element.sepBedtimeSupplyDay;
      //   const district = this.result.district ? `แขวง/ตำบล ${this.result.district}` : '';
      //   const subdistrict = this.result.subdistrict ? `เขต/อำเภอ ${this.result.subdistrict}` : '';
      //   const province = this.result.province || '';
      //   element.patientInfo = {
      //     hn: this.result.hn,
      //     patientName: this.result.patientName,
      //     phone: this.result.phone,
      //     address: this.result.address,
      //     districtProvince: `${district} ${subdistrict} ${province}`,
      //     postcode: this.result.postcode,
      //     contactPerson: this.result.contactPerson,
      //     item: this.result.item
      //   };
      //   element.booking = {};
      //   element.deliveryDetail = {};
      //   delete element.totalCapPerDay;
      //   delete element.productionStartDateRemark;
      // });
      // console.log(productionList);
      localStorage.removeItem('splitProductionList');
      localStorage.setItem('splitProductionList', JSON.stringify(splitProductionList));
      console.log('this.isChangeProductionDate', this.isChangeProductionDate);
      if (this.isChangeProductionDate) {
        localStorage.removeItem('oldBookingSplitProduction');
      }
      this.router.navigate(['/order-management', 'split-production', this.orderId]);
    }
  }

  onClickProductionAdd(data?) {
    console.log('data.productionStartDate', data.productionStartDate);
    const no = this.productionList.length + 1;
    this.productionList.push({
      no: `${no}`,
      supplyDay: data.supplyDay || '',
      productionStartDate: data.productionStartDate || null,
      productionStartDateRemark: moment(data.productionStartDate).format('DD/MM/YYYY'),
      splitProdReason: '',
      sepLastMorningCapPerDay: this.result.sepLastMorningCapPerDay,
      sepMorningSupplyDay: this.result.sepLastMorningCapPerDay ? '' : '',
      sepLastLunchCapPerDay: this.result.sepLastLunchCapPerDay,
      sepLunchSupplyDay: this.result.sepLastLunchCapPerDay ? '' : '',
      sepLastEveningCapPerDay: this.result.sepLastEveningCapPerDay,
      sepEveningSupplyDay: this.result.sepLastEveningCapPerDay ? '' : '',
      sepLastBedtimeCapPerDay: this.result.sepLastBedtimeCapPerDay,
      sepBedtimeSupplyDay: this.result.sepLastBedtimeCapPerDay ? '' : '',
      totalCapPerDay: this.result.totalCapPerDay,
      calculatedDay: null,
      sepMorningSupplyDayError: false,
      sepLunchSupplyDayError: false,
      sepEveningSupplyDayError: false,
      sepBedtimeSupplyDayError: false
    });
    this.splitProductionForm2.addControl(`txtProductionSupplyDay${no}`, new FormControl({
      value: '',
      disabled: false
    }, Validators.required));
    this.splitProductionForm2.addControl(`txtProductionStartDate${no}`, new FormControl({
      value: null,
      disabled: false
    }, Validators.required));
    this.splitProductionForm2.addControl(`txtSplitProdReason${no}`, new FormControl({
      value: null,
      disabled: false
    }));
    this.splitProductionForm2.addControl(`txtCalculatedDay${no}`, new FormControl({
      value: null,
      disabled: true
    }));


    if (this.result.isSeparateMeal === 1) {
      this.splitProductionForm2.addControl(`txtSepMorningSupplyDay${no}`, new FormControl({
        value: null,
        disabled: false
      }));
      this.splitProductionForm2.addControl(`txtSepLunchSupplyDay${no}`, new FormControl({
        value: null,
        disabled: false
      }));
      this.splitProductionForm2.addControl(`txtSepEveningSupplyDay${no}`, new FormControl({
        value: null,
        disabled: false
      }));
      this.splitProductionForm2.addControl(`txtSepBedtimeSupplyDay${no}`, new FormControl({
        value: null,
        disabled: false
      }));

      // if (!this.result.sepLastMorningCapPerDay) {
      //   this.splitProductionForm2.controls[`txtSepMorningSupplyDay${no}`].disable();
      // }
      // if (!this.result.sepLastLunchCapPerDay) {
      //   this.splitProductionForm2.controls[`txtSepLunchSupplyDay${no}`].disable();
      // }
      // if (!this.result.sepLastEveningCapPerDay) {
      //   this.splitProductionForm2.controls[`txtSepEveningSupplyDay${no}`].disable();
      // }
      // if (!this.result.sepLastBedtimeCapPerDay) {
      //   this.splitProductionForm2.controls[`txtSepBedtimeSupplyDay${no}`].disable();
      // }

    }

    this.fnCheckRequireSeperateMeal();
  }

  onValueChangedProductionStartDate(e, i) {
    if (this.productionList[i + 1]) {
      const currentData = this.productionList[i];
      const nextData = this.productionList[i + 1];
      if (moment(currentData.productionStartDate, 'DD/MM/YYYY').isValid()) {
        // tslint:disable-next-line:max-line-length
        nextData['productionStartDateRemark'] = moment(currentData.productionStartDate, 'DD/MM/YYYY').add(nextData.supplyDay, 'd').format('DD/MM/YYYY');
      } else {
        nextData['productionStartDateRemark'] = moment(currentData.productionStartDate).add(nextData.supplyDay, 'd').format('DD/MM/YYYY');
      }
      console.log(moment(currentData.productionStartDate).format('DD/MM/YYYY'));
      if (moment(currentData.productionStartDate).format('DD/MM/YYYY') !== this.oldProdDate) {
        this.splitProductionForm2.controls['txtSplitProdReason1'].setValidators(Validators.required);
      } else {
        this.splitProductionForm2.controls['txtSplitProdReason1'].setValidators(null);
      }
      this.splitProductionForm2.controls['txtSplitProdReason1'].updateValueAndValidity();
    }
  }

  onClickChangeProductionStartDate() {
    this.isChangeProductionDate = true;
    this.splitProductionForm2.controls['txtProductionStartDate1'].enable();
    this.splitProductionForm2.controls['txtSplitProdReason1'].setValidators(Validators.required);
    this.productionList[0].productionStartDate = moment(this.productionList[0].productionStartDate, 'DD/MM/YYYY').toDate();
  }

  onClickProductionDelete(no) {
    this.productionList = this.productionList.filter(obj => {
      if (obj.no !== no) {
        return obj;
      }
    });
    this.splitProductionForm2.removeControl(`txtProductionSupplyDay${no}`);
    this.splitProductionForm2.removeControl(`txtProductionStartDate${no}`);
    if (this.result.isSeparateMeal === 1) {
      this.splitProductionForm2.removeControl(`txtSepMorningSupplyDay${no}`);
      this.splitProductionForm2.removeControl(`txtSepLunchSupplyDay${no}`);
      this.splitProductionForm2.removeControl(`txtSepEveningSupplyDay${no}`);
      this.splitProductionForm2.removeControl(`txtSepBedtimeSupplyDay${no}`);
      this.fnCheckSeparateMealSupplyDay('sepMorningSupplyDay', 'txtSepMorningSupplyDay');
      this.fnCheckSeparateMealSupplyDay('sepLunchSupplyDay', 'txtSepLunchSupplyDay');
      this.fnCheckSeparateMealSupplyDay('sepEveningSupplyDay', 'txtSepEveningSupplyDay');
      this.fnCheckSeparateMealSupplyDay('sepBedtimeSupplyDay', 'txtSepBedtimeSupplyDay');
    }
    this.fnCheckRequireSeperateMeal();
    // calculate
    // this.fnReCalDelivery(true);
    this.fnCheckSumSupplyDay(false);
  }

  onInput(index: number, id: string, key: string) {
    const idNoIndex = id;
    id = idNoIndex + index;
    const elm: any = document.getElementById(id);
    this.productionList[index - 1][key] = elm.value || '';

    this.fnCheckSeparateMealSupplyDay(key, idNoIndex);
  }

  calcalculatedDay(index: number, e: any) {
    const item = this.productionList[index - 1];
    const A = +item.sepLastMorningCapPerDay || 0;
    const B = +item.sepLastLunchCapPerDay || 0;
    const C = +item.sepLastEveningCapPerDay || 0;
    const D = +item.sepLastBedtimeCapPerDay || 0;
    const W = +item.sepMorningSupplyDay || 0;
    const X = +item.sepLunchSupplyDay || 0;
    const Y = +item.sepEveningSupplyDay || 0;
    const Z = +item.sepBedtimeSupplyDay || 0;
    item.calculatedDay = Math.ceil(((A * W) + (B * X) + (C * Y) + (D * Z)) / (A + B + C + D));
  }

  numberOnly(event): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;
    if (charCode == 46) {
      return true;
    } else if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }

  numberGraterThan2Only(event) {
    const charCode = (event.which) ? event.which : event.keyCode;
    if (charCode == 46) {
      return true;
    } else if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }

  fnCheckSeparateMealSupplyDay(key, id) {
    const tempObj = {};
    tempObj[key] = 0;
    for (let i = 0; i < this.productionList.length; i++) {
      const data = this.productionList[i];
      if (data[key] && +data[key] >= 0) {
        tempObj[key] += +data[key];
      }
    }
    for (let i = 0; i < this.productionList.length; i++) {
      const data = this.productionList[i];
      console.log(tempObj[key], +this.result[key]);
      // this.productionList[i][key + 'Error'] = tempObj[key] > this.result[key];
      console.log('tempObj[key]', tempObj[key]);
      console.log('this.result[key]', this.result[key]);
      if (tempObj[key] !== +this.result[key] || +data[key] < 0) {
        this.productionList[i][key + 'Error'] = true;
        if (id) {
          console.log('if id', id + data.no);
          this.splitProductionForm2.controls[id + data.no].setValidators(Validators.required);
          this.splitProductionForm2.controls[id + data.no].updateValueAndValidity();
        }
      } else {
        this.productionList[i][key + 'Error'] = false;
        // if (id) {
        //   console.log('else id', id + data.no);
        //   this.splitProductionForm2.controls[id + data.no].setValidators(null);
        //   this.splitProductionForm2.controls[id + data.no].updateValueAndValidity();
        // }
      }
    }
  }

  fnReCalDelivery(isReCalStartDate) {
    const numberOfSplit = this.productionList.length;
    const supplyDay = +this.dataForm1.supplyDay;
    const firstProductionDate = moment(this.dataForm1.firstProductionDate, 'DD/MM/YYYY');

    let supplyDayFraction = 0;
    if (supplyDay % numberOfSplit !== 0) {
      supplyDayFraction = supplyDay % numberOfSplit;
    }
    const calSupplyDay = Math.floor(supplyDay / numberOfSplit);
    // console.log('calSupplyDay', calSupplyDay);
    for (let i = 0; i < this.productionList.length; i++) {
      const data = this.productionList[i];

      // cal supply day
      if (supplyDayFraction && supplyDayFraction > 0) {
        --supplyDayFraction;
        firstProductionDate.add(calSupplyDay + 1, 'd');
        data.supplyDay = calSupplyDay + 1;
      } else {
        firstProductionDate.add(calSupplyDay, 'd');
        data.supplyDay = calSupplyDay;
      }
    }
    // cal remark
    for (let i = 0; i < this.productionList.length; i++) {
      const data = this.productionList[i];
      // cal remark date
      if (i > 0) {
        const previousData = this.productionList[i - 1];
        let convertedDate = null;
        if (moment(previousData.productionStartDate, 'DD/MM/YYYY').isValid()) {
          convertedDate = moment(previousData.productionStartDate, 'DD/MM/YYYY');
        } else {
          convertedDate = moment(previousData.productionStartDate);
        }
        data.productionStartDateRemark = convertedDate.add(+data.supplyDay, 'day').format('DD/MM/YYYY');
        if (isReCalStartDate) {
          data.productionStartDate = moment(data.productionStartDateRemark, 'DD/MM/YYYY').toDate();
        }
      }
    }
  }

  fnReCalRemarkDate() {
    for (let i = 0; i < this.productionList.length; i++) {
      const data = this.productionList[i];
      // cal remark date
      if (i > 0) {
        const previousData = this.productionList[i - 1];
        let convertedDate = null;
        if (moment(previousData.productionStartDate, 'DD/MM/YYYY').isValid()) {
          convertedDate = moment(previousData.productionStartDate, 'DD/MM/YYYY');
        } else {
          convertedDate = moment(previousData.productionStartDate);
        }
        console.log('data.supplyDay', data.supplyDay);
        data.productionStartDateRemark = convertedDate.add(+data.supplyDay, 'day').format('DD/MM/YYYY');
        console.log('data.productionStartDateRemark', data.productionStartDateRemark);
      }
    }
  }

  fnCheckSumSupplyDay(isReCalRemark) {
    this.isInvalidSupplyDay = false;
    let sum = 0;
    for (let i = 0; i < this.productionList.length; i++) {
      const data = this.productionList[i];
      if (data.supplyDay) {
        document.getElementById('txtProductionSupplyDay' + data.no).parentElement.classList.remove('has-error');
        sum += +data.supplyDay;
      }
    }
    console.log('this.dataForm1.supplyDay', this.dataForm1.supplyDay);
    console.log('sum', sum);
    if (sum !== +this.dataForm1.supplyDay) {
      this.isInvalidSupplyDay = true;
      for (let i = 0; i < this.productionList.length; i++) {
        const data = this.productionList[i];
        if (+data.supplyDay < 0) {
          data.supplyDay = 0;
        }
        document.getElementById('txtProductionSupplyDay' + data.no).parentElement.classList.add('has-error');
      }
    } else {
      for (let i = 0; i < this.productionList.length; i++) {
        const data = this.productionList[i];
        if (+data.supplyDay < 0) {
          this.isInvalidSupplyDay = true;
          document.getElementById('txtProductionSupplyDay' + data.no).parentElement.classList.add('has-error');
        }
      }
    }
    if (isReCalRemark) {
      this.fnReCalRemarkDate();
    }
  }

  fnCalProductionBySupplyDay(index) {
    const currentData = this.productionList[index];
    const currentSupplyDay = currentData.supplyDay || 0;
    const numberOfSplit = this.productionList.length;
    const supplyDay = +this.dataForm1.supplyDay;
    const firstDeliveryDate = moment(this.dataForm1.firstProductionDate);

    const newSupplyDay = supplyDay - currentSupplyDay;
    const newNumberOfSplit = numberOfSplit - 1;
    let supplyDayFraction = 0;
    if (newSupplyDay % newNumberOfSplit !== 0) {
      supplyDayFraction = newSupplyDay % newNumberOfSplit;
    }
    const calSupplyDay = Math.floor(newSupplyDay / newNumberOfSplit);
    console.log('calSupplyDay', calSupplyDay);
    for (let i = 0; i < this.productionList.length; i++) {
      const data = this.productionList[i];
      const beforeData = this.productionList[i - 1];
      if (i === 0) {
        // data.deliveryStartDate = firstDeliveryDate.format('DD/MM/YYYY');
      } else {
        // data.deliveryStartDate = firstDeliveryDate.toDate();
        if (moment(beforeData.productionStartDate, 'DD/MM/YYYY').isValid()) {
          // tslint:disable-next-line:max-line-length
          data.productionStartDate = moment(beforeData.productionStartDate, 'DD/MM/YYYY').add(beforeData.supplyDay, 'day').toDate();
        } else {
          data.productionStartDate = moment(beforeData.productionStartDate).add(beforeData.supplyDay, 'day').toDate();
        }
        data.productionStartDateRemark = moment(data.productionStartDate).format('DD/MM/YYYY');
      }
      if (i === index) {
        continue;
      }
      if (supplyDayFraction && supplyDayFraction > 0) {
        --supplyDayFraction;
        firstDeliveryDate.add(calSupplyDay + 1, 'd');
        data.supplyDay = calSupplyDay + 1;
      } else {
        firstDeliveryDate.add(calSupplyDay, 'd');
        data.supplyDay = calSupplyDay;
      }
    }
    this.fnCheckSumSupplyDay(false);
  }

  fnCheckRequireSeperateMeal() {
    if (this.result.isSeparateMeal === 1) {
      for (let i = 0; i < this.productionList.length; i++) {
        const data = this.productionList[i];
        const isSepMorningSupplyDayEnabled = this.splitProductionForm2.controls['txtSepMorningSupplyDay' + data.no].enabled;
        if (isSepMorningSupplyDayEnabled) {
          this.splitProductionForm2.controls['txtSepMorningSupplyDay' + data.no].setValidators(Validators.required);
        }
        const isSepLunchSupplyDayEnabled = this.splitProductionForm2.controls['txtSepLunchSupplyDay' + data.no].enabled;
        if (isSepLunchSupplyDayEnabled) {
          this.splitProductionForm2.controls['txtSepLunchSupplyDay' + data.no].setValidators(Validators.required);
        }
        const isSepEveningSupplyDayEnabled = this.splitProductionForm2.controls['txtSepEveningSupplyDay' + data.no].enabled;
        if (isSepEveningSupplyDayEnabled) {
          this.splitProductionForm2.controls['txtSepEveningSupplyDay' + data.no].setValidators(Validators.required);
        }
        const isSepBedtimeSupplyDayEnabled = this.splitProductionForm2.controls['txtSepBedtimeSupplyDay' + data.no].enabled;
        if (isSepBedtimeSupplyDayEnabled) {
          this.splitProductionForm2.controls['txtSepBedtimeSupplyDay' + data.no].setValidators(Validators.required);
        }
      }
    }
  }

  isInvalid(item, keyError, id) {
    return this.splitProductionForm2.controls[id + item.no].enabled
      && (item[keyError]
        || (!this.splitProductionForm2.controls[id + item.no].valid
          && this.splitProductionForm2.controls[id + item.no].dirty)
      );
  }

  goBack() {
    $(this.modalSplitProduction.nativeElement).modal('hide');
    this.router.navigate(['/order-management', 'orders-pharmacist-view']);
  }

  fnCheckMaxSplit() {
    this.isMaxSplit = this.dataForm1.numberOfSplit && +this.dataForm1.numberOfSplit > +this.dataForm1.supplyDay;
  }
}

@NgModule({
  imports: [CommonModule, FormsModule, ReactiveFormsModule, DxDateBoxModule, DxNumberBoxModule],
  exports: [AlertSplitProductionComponent],
  declarations: [AlertSplitProductionComponent]

})
export class AlertSplitProductionModule {
}
