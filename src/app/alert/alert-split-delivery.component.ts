import { AfterViewInit, Component, ElementRef, EventEmitter, NgModule, OnInit, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { DxCheckBoxModule, DxDateBoxModule, DxNumberBoxModule } from 'devextreme-angular';
import { environment } from '../../environments/environment';
import { Request } from '../shared/services/request.service';
import { Common } from '../shared/services/common.service';
import * as moment from 'moment';
import * as _ from 'lodash';

declare let $: any;

class ImageSnippet {
  pending = false;
  status = 'init';

  constructor(public src: string, public file: File) {
  }
}

@Component({
  selector: 'app-alert-split-delivery',
  providers: [],
  templateUrl: './alert-split-delivery.component.html'
})
export class AlertSplitDeliveryComponent implements OnInit, AfterViewInit {
  @ViewChild('modalSplitDelivery') modalSplitDelivery: ElementRef;
  @Output() splitDeliveryClose = new EventEmitter();
  @Output() cancelUrgentRequest = new EventEmitter();
  @Output() confirmUrgentRequest = new EventEmitter();
  userMessage;
  userMessageList;
  dataText: any;
  dxgridPageSize;
  failDescription;
  percent = 0;
  buttonText = '';
  data: any = {};
  urgentRequestReason = '';
  splitDeliveryForm1: FormGroup;
  splitDeliveryForm2: FormGroup;
  printPageList = [];
  isShowPrintLabel = false;
  iconURL = '../../assets/icon-md/calendar.png';
  selectedFile: any;
  filePicture: any;
  imageInputText: string;
  Id: any;
  emptyList = [];
  remindList = ['1 day before', '2 days before', '3 days before', '4 days before', '5 days before', '6 days before', '7 days before'];
  dataForm1 = {
    supplyDay: '',
    numberOfItem: '',
    numberOfSplit: '',
    firstDeliveryDate: moment().format('YYYY-MM-DD'),
    deliveryStart: 1,
    remind: '1 day before',
    customDate: moment().toDate()
  };
  step = 0;
  deliveryList: any = [];
  isChangeDeliveryDate = false;
  openData: any = {};
  addressList = [];
  arrivalTimeMap = {};
  arrivalTimeListBackup = [];
  minCustomDate: Date = moment().toDate();
  minDeliveryDate: Date = moment().toDate();
  deliveryDetailData: any = {};
  splitDeliveryList = [];
  isErrorMaxSupplyDay = false;

  constructor(private router: Router, private request: Request, private common: Common, private fb: FormBuilder,
    private route: ActivatedRoute) {
    this.dataText = {
      userTitle: '',
      userMessage: '',
      userMessageList: ''
    };
    this.splitDeliveryForm1 = this.fb.group({
      'txtSupplyDay': new FormControl({ value: '', disabled: true }),
      // 'txtNumberOfItem': new FormControl({value: '', disabled: true}),
      'txtNumberOfSplit': new FormControl({ value: '', disabled: false }, [Validators.required]),
      'txtFirstDeliveryDate': new FormControl({ value: '', disabled: true }),
      'rdlDeliveryStart': new FormControl({ value: '', disabled: false }),
      'txtRemindDate': new FormControl({ value: '', disabled: false }),
      'txtCustomDate': new FormControl({ value: '', disabled: false }),
    });

    // this.fnCreateNewForm2();
  }

  ngOnInit() {
  }

  async ngAfterViewInit() {
    try {
      await this.route.params.subscribe(params => {
        const splitPath = this.router.url.split('/');
        // console.log(":pageType",this.pageType);
        this.Id = params.id;
        console.log(this.Id);

        // if(  this.pageType ===  'view'){
        //   this.editGroupForm.controls['txtName'].disable();
        // }else{
        //   this.editGroupForm.controls['txtName'].enable();
        // }
      });
      $(this.modalSplitDelivery.nativeElement).on('hidden.bs.modal', async () => {
        this.splitDeliveryClose.emit();
      });
    } catch (e) {
      console.log(e);
    }
  }

  async searchDdlPatientAddress() {
    try {
      const checkUrl = this.common.checkMockupUrl('', '', { hn: this.openData.hn }, {
        BASE_API: '',
        BASE_MODULE: environment.apiPrefix,
        BASE_RESOURCE: environment.searchDdlPatientAddress
      });
      const resultCodeSuccess = environment.resultCodeSuccess;
      const response = await this.request.get(checkUrl.url, checkUrl.filter);
      if (response.resultCode === resultCodeSuccess) {
        const data = await response.resultData || response.data || {};
        this.addressList = data.patientAddress.filter(obj => {
          obj.concatAddress = this.common.concatAddress(obj);
          return obj;
        });
      } else {
        this.addressList = [];
      }
    } catch (e) {
      console.error('searchDdlCashier error', e);
      this.addressList = [];
    }
  }

  async searchDeliveryDetail() {
    try {
      const checkUrl = this.common.checkMockupUrl('', '', { orderId: this.Id }, {
        BASE_API: '',
        BASE_MODULE: environment.apiPrefix,
        BASE_RESOURCE: environment.searchDeliveryDetail
      });
      const resultCodeSuccess = environment.resultCodeSuccess;
      const response = await this.request.get(checkUrl.url, checkUrl.filter);
      if (response.resultCode === resultCodeSuccess) {
        const data = await response.resultData || response.data || {};
        console.log('searchDeliveryDetail this.deliveryList.length', this.deliveryList.length);
        if (data && data[0]) {
          this.deliveryDetailData = data[0];
        }
      } else {
        this.deliveryDetailData = {};
      }
    } catch (e) {
      console.error('searchDeliveryDetail error', e);
      this.deliveryDetailData = {};
    }
  }

  async open(data) {
    console.log('data', data);
    this.step = data.step || 1;
    // this.step = 1;
    // this.fnCreateNewForm2();
    $(this.modalSplitDelivery.nativeElement).modal({
      backdrop: 'static'
    });

    // ปรับ html <body> ให้กลับเป็นปกติเมื่อเปิด-ปิด modal
    document.body.style.paddingRight = '0px';

    this.openData = data;
    this.dataForm1.supplyDay = data.supplyDay;
    this.arrivalTimeListBackup = data.arrivalTimeList;
    const productionEndDate = moment(data.productionEndDate, 'DD/MM/YYYY');
    if (productionEndDate.unix() > moment().unix()) {
      this.minCustomDate = moment(data.productionEndDate, 'DD/MM/YYYY').toDate();
    }
    await this.searchDdlPatientAddress();
    // set delivery detail
    await this.searchDeliveryDetail();

    const splitDeliveryListStr = localStorage.getItem('splitDeliveryList');
    const splitDeliveryStep1 = localStorage.getItem('splitDeliveryStep1');
    if (splitDeliveryListStr) {
      this.splitDeliveryList = JSON.parse(splitDeliveryListStr);
      if (splitDeliveryStep1) {
        const splitDeliveryStep1JSON = JSON.parse(splitDeliveryStep1);
        this.dataForm1.numberOfSplit = splitDeliveryStep1JSON.numberOfSplit;
        this.dataForm1.deliveryStart = splitDeliveryStep1JSON.deliveryStart;
        this.dataForm1.remind = splitDeliveryStep1JSON.remind;
        if (splitDeliveryStep1JSON.deliveryStart === 2) {
          this.dataForm1.customDate = moment(splitDeliveryStep1JSON.customDate).toDate();
        }
      }
      await this.onClickSplitDeliveryNext(true);
    } else {
      this.splitDeliveryList = [];
    }
  }

  close() {
    $(this.modalSplitDelivery.nativeElement).modal('hide');
  }

  async onClickSplitDeliveryNext(isLoadStorage: boolean, split?: number) {
    this.isErrorMaxSupplyDay = false;
    const valid = this.validsplitDeliveryForm1();
    if (valid) {
      this.step = 2;
      let firstDeliveryStateDate;
      if (+this.dataForm1.deliveryStart === 2 && split) {
        firstDeliveryStateDate = moment(this.deliveryList[0].deliveryStartDate);
      }
      this.fnCreateNewForm2();
      const numberOfSplit = split ? split : +this.dataForm1.numberOfSplit;
      const supplyDay = +this.dataForm1.supplyDay;
      let firstDeliveryDate = moment(this.dataForm1.firstDeliveryDate);
      if (+this.dataForm1.deliveryStart === 2) {
        if (split) { // แสดงว่ามาจากการกด + จาก HTML
          console.log('firstDeliveryStateDate', firstDeliveryStateDate);
          firstDeliveryDate = moment(firstDeliveryStateDate);
        } else {
          firstDeliveryDate = moment(this.dataForm1.customDate);
        }
        this.isChangeDeliveryDate = true;
        this.splitDeliveryForm2.controls['txtDeliveryStartDate1'].enable();
        this.splitDeliveryForm2.controls['txtDeliveryRemindDate1'].enable();
      } else {
        if (moment(this.deliveryDetailData.deliveryDate, 'DD/MM/YYYY').isValid()) {
          firstDeliveryDate = moment(this.deliveryDetailData.deliveryDate, 'DD/MM/YYYY');
        } else {
          firstDeliveryDate = moment(this.deliveryDetailData.deliveryDate);
        }
      }
      const remind = this.remindList.indexOf(this.dataForm1.remind) + 1;
      let supplyDayFraction = 0;
      if (supplyDay % numberOfSplit !== 0) {
        supplyDayFraction = supplyDay % numberOfSplit;
      }
      const calSupplyDay = Math.floor(supplyDay / numberOfSplit);
      for (let i = 0; i < numberOfSplit; i++) {
        this.arrivalTimeMap[i] = _.cloneDeep(this.arrivalTimeListBackup);
        if (supplyDayFraction && supplyDayFraction > 0) {

          --supplyDayFraction;
          if (i === 0) {
            this.deliveryList[0].supplyDay = `${calSupplyDay + 1}`;
            if (+this.dataForm1.deliveryStart === 2) {
              this.deliveryList[0].deliveryStartDate = firstDeliveryDate.toDate();
              this.deliveryList[0].deliveryRemindDate = moment(firstDeliveryDate).subtract(remind, 'day').toDate();
            } else {
              this.deliveryList[0].deliveryStartDate = firstDeliveryDate.format('DD/MM/YYYY');
              this.deliveryList[0].deliveryRemindDate = moment(firstDeliveryDate).subtract(remind, 'day').format('DD/MM/YYYY');
            }
          } else {
            this.onClickDeliveryAdd({
              supplyDay: `${calSupplyDay + 1}`,
              deliveryStartDate: firstDeliveryDate.toDate(),
              deliveryRemindDate: moment(firstDeliveryDate).subtract(remind, 'day').toDate(),
            });
          }
          firstDeliveryDate.add(calSupplyDay + 1, 'd');
        } else {
          if (i === 0) {
            this.deliveryList[0].supplyDay = `${calSupplyDay}`;
            if (+this.dataForm1.deliveryStart === 2) {
              this.deliveryList[0].deliveryStartDate = firstDeliveryDate.toDate();
              this.deliveryList[0].deliveryRemindDate = moment(firstDeliveryDate).subtract(remind, 'day').toDate();
            } else {
              this.deliveryList[0].deliveryStartDate = firstDeliveryDate.format('DD/MM/YYYY');
              this.deliveryList[0].deliveryRemindDate = moment(firstDeliveryDate).subtract(remind, 'day').format('DD/MM/YYYY');
            }

            this.arrivalTimeMap[0] = this.common.checkArrivalTime(this.arrivalTimeListBackup, firstDeliveryDate);
          } else {
            this.onClickDeliveryAdd({
              supplyDay: `${calSupplyDay}`,
              deliveryStartDate: firstDeliveryDate.toDate(),
              deliveryRemindDate: moment(firstDeliveryDate).subtract(remind, 'day').toDate(),
            });
          }
          firstDeliveryDate.add(calSupplyDay, 'd');
        }
      }
      // set delivery detail
      for (let i = 0; i < this.deliveryList.length; i++) {
        this.deliveryList[i].packaging = this.deliveryDetailData.packaging || null;
        this.deliveryList[i].recipientName = this.deliveryDetailData.recipientName || '';
        this.deliveryList[i].phone = this.deliveryDetailData.phone || '';
        if (this.deliveryDetailData.patientAddressId) {
          this.deliveryList[i].patientAddressId = +this.deliveryDetailData.patientAddressId || null;
          this.onClickDeliveryDetailAddress(i);
        }
        this.deliveryList[i].arrivalTime = this.deliveryDetailData.arrivalTime || null;
        if (this.arrivalTimeMap[i] && this.arrivalTimeMap[i].length > 0) {
          const findArrivalTime = this.arrivalTimeMap[i].find(obj => +obj.id === +this.deliveryList[i].arrivalTime);
          if (!findArrivalTime) {
            this.deliveryList[i].arrivalTime = null;
          }
        }
        this.deliveryList[i].deliveryMethod = this.deliveryDetailData.deliveryMethod || null;
        if (this.deliveryList[i].deliveryMethod) {
          this.onDeliveryMethodChanged(this.deliveryList[i].deliveryMethod, i + 1)
        }
        this.deliveryList[i].deliveryMethodOther = this.deliveryDetailData.deliveryMethodOther || '';
        // this.deliveryList[i].packaging = this.deliveryDetailData.packaging || null;
        this.deliveryList[i].isInvoice = this.deliveryDetailData.isInvoice === 1;
        this.deliveryList[i].isReceipt = this.deliveryDetailData.isReceipt === 1;
        this.deliveryList[i].isUrgent = this.deliveryDetailData.isUrgent === 1;
        this.deliveryList[i].cashierDeliNote = this.deliveryDetailData.cashierDeliNote || '';
        this.deliveryList[i].packaging = this.deliveryDetailData.packaging || null;
      }

      // set data from local storage
      if (isLoadStorage) {
        setTimeout(() => {
          for (let i = 0; i < this.deliveryList.length; i++) {
            if (this.splitDeliveryList.length > 0 && this.splitDeliveryList[i]) {
              const oldData = this.splitDeliveryList[i];
              oldData.no = i + 1;
              if (oldData.deliveryMethod) {
                this.onDeliveryMethodChanged(oldData.deliveryMethod, i + 1)
              }
              if (moment(oldData.deliveryStartDate, 'DD/MM/YYYY').isValid()) {
                oldData.deliveryStartDate = moment(oldData.deliveryStartDate, 'DD/MM/YYYY').format('DD/MM/YYYY');
              } else {
                if (+this.dataForm1.deliveryStart === 1 && i === 0) {
                  oldData.deliveryStartDate = moment(oldData.deliveryStartDate).format('DD/MM/YYYY');
                } else {
                  oldData.deliveryStartDate = moment(oldData.deliveryStartDate).toDate();
                  if (oldData.deliveryRemindDate) {
                    oldData.deliveryRemindDate = moment(oldData.deliveryRemindDate).toDate();
                  } else {
                    oldData.deliveryRemindDate = moment(oldData.deliveryStartDate).subtract(remind, 'day').toDate();
                  }
                }
              }

              this.deliveryList[i] = _.cloneDeep(oldData);
            }
          }
        }, 100);
      }
    }

  }

  async onClickSplitDeliveryAdd() {
    this.isErrorMaxSupplyDay = false;
    const valid = this.validsplitDeliveryForm1();
    if (valid) {
      const lastIndex = this.deliveryList.length - 1;
      const lastData = this.deliveryList[lastIndex];
      const remind = this.remindList.indexOf(this.dataForm1.remind) + 1;
      const supplyDay = lastData.supplyDay || 0;
      this.onClickDeliveryAdd({
        supplyDay: `0`,
        deliveryStartDate: moment(lastData.deliveryStartDate).add(supplyDay, 'day').toDate(),
        deliveryRemindDate: moment(lastData.deliveryStartDate).add(supplyDay, 'day').subtract(remind, 'day').toDate(),
      });
      // set delivery detail
      this.deliveryList[this.deliveryList.length - 1].packaging = this.deliveryDetailData.packaging || null;
      this.deliveryList[this.deliveryList.length - 1].recipientName = this.deliveryDetailData.recipientName || '';
      this.deliveryList[this.deliveryList.length - 1].phone = this.deliveryDetailData.phone || '';
      if (this.deliveryDetailData.patientAddressId) {
        this.deliveryList[this.deliveryList.length - 1].patientAddressId = +this.deliveryDetailData.patientAddressId || null;
        this.onClickDeliveryDetailAddress(this.deliveryList.length - 1);
      }
      this.deliveryList[this.deliveryList.length - 1].arrivalTime = this.deliveryDetailData.arrivalTime || null;
      if (this.arrivalTimeMap[this.deliveryList.length - 1] && this.arrivalTimeMap[this.deliveryList.length - 1].length > 0) {
        // tslint:disable-next-line:max-line-length
        const findArrivalTime = this.arrivalTimeMap[this.deliveryList.length - 1].find(obj => +obj.id === +this.deliveryList[this.deliveryList.length - 1].arrivalTime);
        console.log('findArrivalTime', findArrivalTime);
        if (!findArrivalTime) {
          this.deliveryList[this.deliveryList.length - 1].arrivalTime = null;
        }
      }
      this.deliveryList[this.deliveryList.length - 1].deliveryMethod = this.deliveryDetailData.deliveryMethod || null;
      this.deliveryList[this.deliveryList.length - 1].deliveryMethodOther = this.deliveryDetailData.deliveryMethodOther || '';
      // this.deliveryList[this.deliveryList.length - 1].packaging = this.deliveryDetailData.packaging || null;
      this.deliveryList[this.deliveryList.length - 1].isInvoice = this.deliveryDetailData.isInvoice === 1;
      this.deliveryList[this.deliveryList.length - 1].isReceipt = this.deliveryDetailData.isReceipt === 1;
      this.deliveryList[this.deliveryList.length - 1].isUrgent = this.deliveryDetailData.isUrgent === 1;
      this.deliveryList[this.deliveryList.length - 1].cashierDeliNote = this.deliveryDetailData.cashierDeliNote || '';
      this.deliveryList[this.deliveryList.length - 1].packaging = this.deliveryDetailData.packaging || null;
      if (this.deliveryList[this.deliveryList.length - 1].deliveryMethod) {
        this.onDeliveryMethodChanged(this.deliveryList[this.deliveryList.length - 1].deliveryMethod, this.deliveryList.length)
      }
      this.fnCheckSumSupplyDay();
    }
  }

  onClickSplitDeliveryYes() {
    this.step = 1;
  }

  onClickSplitDeliveryNo() {

  }

  validsplitDeliveryForm1() {
    console.log(this.splitDeliveryForm1.controls, this.splitDeliveryForm1, this.splitDeliveryForm1.valid);
    for (const key in this.splitDeliveryForm1.controls) {
      if (this.splitDeliveryForm1.controls[key].errors) {
        this.splitDeliveryForm1.controls[key].setErrors({ 'forceRequired': true });
        this.splitDeliveryForm1.controls[key].markAsDirty();
      } else {
        this.splitDeliveryForm1.controls[key].updateValueAndValidity();
      }
    }
    return this.splitDeliveryForm1.valid;
  }

  // step 2

  validsplitDeliveryForm2() {
    console.log(this.splitDeliveryForm2.controls, this.splitDeliveryForm2, this.splitDeliveryForm2.valid);

    // check deliveryMethod
    for (let i = 0; i < this.deliveryList.length; i++) {
      const item = this.deliveryList[i];
      if (+item.deliveryMethod === 6) {
        this.splitDeliveryForm2.controls['txtDeliveryMethodOther' + item.no].setValidators(Validators.required);
      } else {
        this.splitDeliveryForm2.controls['txtDeliveryMethodOther' + item.no].setValidators(null);
      }
      this.splitDeliveryForm2.controls['txtDeliveryMethodOther' + item.no].updateValueAndValidity();
    }

    // start validate
    for (const key in this.splitDeliveryForm2.controls) {
      if (this.splitDeliveryForm2.controls[key].errors) {
        this.splitDeliveryForm2.controls[key].setErrors({ 'forceRequired': true });
        this.splitDeliveryForm2.controls[key].markAsDirty();
      } else {
        this.splitDeliveryForm2.controls[key].updateValueAndValidity();
      }
    }
    return this.splitDeliveryForm2.valid;
  }

  fnCreateNewForm2() {
    this.isChangeDeliveryDate = false;
    this.deliveryList = [
      {
        no: '1',
        supplyDay: '',
        phone: '',
        recipientName: '',
        patientAddressId: null,
        address: '',
        districtProvince: '',
        postcode: '',
        arrivalTime: null,
        deliveryMethod: null,
        packaging: null,
        isInvoice: false,
        isReceipt: false,
        isUrgent: false,
        cashierDeliNote: '',
        cashierId: this.deliveryDetailData.cashierId || null,
        deliveryStartDate: null,
        deliveryStartDateRemark: '',
        reason: '',
        deliveryRemindDate: null,
        showHide: 1,
      }
    ];
    this.splitDeliveryForm2 = this.fb.group({
      'txtForm2SupplyDay': new FormControl({ value: '', disabled: true }),
      'txtForm2NumberOfItem': new FormControl({ value: '', disabled: true }),
      'txtDeliverySupplyDay1': new FormControl({ value: '', disabled: false }),
      'txtDeliveryStartDate1': new FormControl({ value: '', disabled: true }),
      'txtDeliveryRemindDate1': new FormControl({ value: '', disabled: false }),
      'txtDeliveryReason': new FormControl({ value: '', disabled: false }),
      'txtRecipientName1': new FormControl({ value: '', disabled: false }, [Validators.required]),
      'txtPhone1': new FormControl({ value: '', disabled: false }, [Validators.required]),
      'ddlAddress1': new FormControl({ value: '', disabled: false }, [Validators.required]),
      'txtAddressDetail1': new FormControl({ value: '', disabled: true }),
      'txtDistrictProvince1': new FormControl({ value: '', disabled: true }),
      'txtPostcode1': new FormControl({ value: '', disabled: true }),
      'ddlArrivalTime1': new FormControl({ value: '', disabled: false }, [Validators.required]),
      'ddlDeliveryMethod1': new FormControl({ value: '', disabled: false }, [Validators.required]),
      'txtDeliveryMethodOther1': new FormControl({ value: '', disabled: false }),
      'ddlPackaging1': new FormControl({ value: '', disabled: false }, [Validators.required]),
      'cbxIsInvoice1': new FormControl({ value: '', disabled: false }),
      'cbxIsReceipt1': new FormControl({ value: '', disabled: false }),
      'cbxIsUrgent1': new FormControl({ value: '', disabled: false }),
      'txtCashierDeliNote1': new FormControl({ value: '', disabled: false }),
    });
  }

  onClickSplitDeliveryBack() {
    this.step = 1;
  }

  async onClickSplitDeliverySave() {
    const valid = this.validsplitDeliveryForm2();
    if (valid && !this.isErrorMaxSupplyDay) {
      const deliveryList = _.cloneDeep(this.deliveryList);
      deliveryList[0].deliveryStartDate = moment(deliveryList[0].deliveryStartDate, 'DD/MM/YYYY').toDate();
      if (+this.dataForm1.deliveryStart === 1) {
        deliveryList[0].deliveryRemindDate = null;
      }
      localStorage.setItem('splitDeliveryStep1', JSON.stringify({
        numberOfSplit: deliveryList.length,
        deliveryStart: this.dataForm1.deliveryStart,
        remind: this.dataForm1.remind,
        customDate: this.dataForm1.customDate,
      }));
      localStorage.setItem('splitDeliveryList', JSON.stringify(deliveryList));
      try {
        $(this.modalSplitDelivery.nativeElement).modal('hide');
      } catch (e) {
        console.log(e);
      }
    } else {
    }
  }

  onClickDeliveryAdd(data?: any) {
    const no = this.deliveryList.length + 1;
    console.log('no', no);
    this.deliveryList.push({
      no: `${no}`,
      supplyDay: data ? data.supplyDay : '',
      phone: '',
      recipientName: '',
      patientAddressId: null,
      address: '',
      districtProvince: '',
      postcode: '',
      arrivalTime: null,
      deliveryMethod: null,
      packaging: this.deliveryList[0] ? this.deliveryList[0].packaging : null,
      isInvoice: false,
      isReceipt: false,
      isUrgent: false,
      cashierDeliNote: '',
      cashierId: this.deliveryDetailData.cashierId || null,
      deliveryStartDate: data ? data.deliveryStartDate : null,
      deliveryRemindDate: data ? data.deliveryRemindDate : null,
      deliveryStartDateRemark: data ? moment(data.deliveryStartDate).format('DD/MM/YYYY') : '',
      reason: '',
      showHide: 1,
    });
    this.splitDeliveryForm2.addControl(`txtDeliverySupplyDay${no}`, new FormControl({
      value: '',
      disabled: false
    }));
    this.splitDeliveryForm2.addControl(`txtDeliveryStartDate${no}`, new FormControl({
      value: null,
      disabled: false
    }));
    this.splitDeliveryForm2.addControl(`txtDeliveryRemindDate${no}`, new FormControl({
      value: null,
      disabled: false
    }));
    this.splitDeliveryForm2.addControl(`txtRecipientName${no}`, new FormControl({
      value: null,
      disabled: false
    }, [Validators.required]));
    this.splitDeliveryForm2.addControl(`txtPhone${no}`, new FormControl({
      value: null,
      disabled: false
    }, [Validators.required]));
    this.splitDeliveryForm2.addControl(`ddlAddress${no}`, new FormControl({
      value: null,
      disabled: false
    }, [Validators.required]));
    this.splitDeliveryForm2.addControl(`txtAddressDetail${no}`, new FormControl({
      value: null,
      disabled: true
    }));
    this.splitDeliveryForm2.addControl(`txtDistrictProvince${no}`, new FormControl({
      value: null,
      disabled: true
    }));
    this.splitDeliveryForm2.addControl(`txtPostcode${no}`, new FormControl({
      value: null,
      disabled: true
    }));
    this.splitDeliveryForm2.addControl(`ddlArrivalTime${no}`, new FormControl({
      value: null,
      disabled: false
    }, [Validators.required]));
    this.splitDeliveryForm2.addControl(`ddlDeliveryMethod${no}`, new FormControl({
      value: null,
      disabled: false
    }, [Validators.required]));
    this.splitDeliveryForm2.addControl(`txtDeliveryMethodOther${no}`, new FormControl({
      value: null,
      disabled: false
    }));
    this.splitDeliveryForm2.addControl(`ddlPackaging${no}`, new FormControl({
      value: null,
      disabled: false
    }, [Validators.required]));
    this.splitDeliveryForm2.addControl(`cbxIsInvoice${no}`, new FormControl({
      value: null,
      disabled: false
    }));
    this.splitDeliveryForm2.addControl(`cbxIsReceipt${no}`, new FormControl({
      value: null,
      disabled: false
    }));
    this.splitDeliveryForm2.addControl(`cbxIsUrgent${no}`, new FormControl({
      value: null,
      disabled: false
    }));
    this.splitDeliveryForm2.addControl(`txtCashierDeliNote${no}`, new FormControl({
      value: null,
      disabled: false
    }));
  }

  onValueChangedDeliveryStartDate(e, i) {
    if (this.deliveryList[i + 1]) {
      const currentData = this.deliveryList[i];
      const nextData = this.deliveryList[i + 1];
      nextData['deliveryStartDateRemark'] = moment(currentData.deliveryStartDate).add(nextData.supplyDay, 'd').format('DD/MM/YYYY');
    }

    this.splitDeliveryForm2.controls['ddlArrivalTime' + this.deliveryList[i].no].reset(this.deliveryList[i].arrivalTime);
    this.arrivalTimeMap[i] = this.common.checkArrivalTime(this.arrivalTimeListBackup, this.deliveryList[i].deliveryStartDate);
    this.fnCalDeliveryByDate(i);
  }

  onClickChangeDeliveryStartDate() {
    this.isChangeDeliveryDate = true;
    this.splitDeliveryForm2.controls['txtDeliveryStartDate1'].enable();
    this.splitDeliveryForm2.controls['txtDeliveryRemindDate1'].enable();
    this.deliveryList[0].deliveryStartDate = moment(this.deliveryList[0].deliveryStartDate, 'DD/MM/YYYY').toDate();
  }

  onClickDeliveryDelete(no, i) {
    // this.deliveryList = this.deliveryList.filter(obj => {
    //   if (obj.no !== no) {
    //     return obj;
    //   }
    // });

    this.splitDeliveryForm2.removeControl(`txtDeliverySupplyDay${no}`);
    this.splitDeliveryForm2.removeControl(`txtDeliveryStartDate${no}`);
    this.splitDeliveryForm2.removeControl(`txtDeliveryRemindDate${no}`);
    this.splitDeliveryForm2.removeControl(`txtRecipientName${no}`);
    this.splitDeliveryForm2.removeControl(`txtPhone${no}`);
    this.splitDeliveryForm2.removeControl(`ddlAddress${no}`);
    this.splitDeliveryForm2.removeControl(`txtAddressDetail${no}`);
    this.splitDeliveryForm2.removeControl(`txtDistrictProvince${no}`);
    this.splitDeliveryForm2.removeControl(`txtPostcode${no}`);
    this.splitDeliveryForm2.removeControl(`ddlArrivalTime${no}`);
    this.splitDeliveryForm2.removeControl(`ddlDeliveryMethod${no}`);
    this.splitDeliveryForm2.removeControl(`txtDeliveryMethodOther${no}`);
    this.splitDeliveryForm2.removeControl(`ddlPackaging${no}`);
    this.splitDeliveryForm2.removeControl(`cbxIsInvoice${no}`);
    this.splitDeliveryForm2.removeControl(`cbxIsReceipt${no}`);
    this.splitDeliveryForm2.removeControl(`cbxIsUrgent${no}`);
    this.splitDeliveryForm2.removeControl(`txtCashierDeliNote${no}`);
    this.deliveryList.splice(i, 1);
    // const deliveryList = _.cloneDeep(this.deliveryList);
    // deliveryList[0].deliveryStartDate = moment(deliveryList[0].deliveryStartDate, 'DD/MM/YYYY').toDate();
    // if (+this.dataForm1.deliveryStart === 1) {
    //   deliveryList[0].deliveryRemindDate = null;
    // }
    // localStorage.setItem('splitDeliveryList', JSON.stringify(deliveryList));
    // this.splitDeliveryList = _.cloneDeep(deliveryList);
    // this.fnReCalDelivery();
    this.fnCheckSumSupplyDay();
  }

  onClickDeliveryDetailAddress(i) {
    this.fnConvertStringNull(i, 'patientAddressId');
    const findAddress = this.addressList.find(obj => obj.patientAddressId === +this.deliveryList[i].patientAddressId);
    if (findAddress) {
      this.deliveryList[i].address = findAddress.address;
      this.deliveryList[i].subdistrict = findAddress.subdistrict;
      this.deliveryList[i].district = findAddress.district;
      this.deliveryList[i].province = findAddress.province;
      this.deliveryList[i].districtProvince = this.common.concatAddress({
        subdistrict: findAddress.subdistrict,
        district: findAddress.district,
        province: findAddress.province,
      });
      this.deliveryList[i].postcode = findAddress.postcode;
    } else {
      this.deliveryList[i].address = ""
      this.deliveryList[i].subdistrict = ""
      this.deliveryList[i].district = ""
      this.deliveryList[i].province = ""
      this.deliveryList[i].districtProvince = ""
      this.deliveryList[i].postcode = ""
    }

  }

  checkRequired(name) {
    const control = this.splitDeliveryForm2.controls[name];
    let hasRequired = false;
    if (control && control.validator) {
      const result = control.validator({} as AbstractControl);
      return hasRequired = result && result.required !== undefined;
    } else {
      return false
    }
  }

  onDeliveryMethodChanged(value: string | number | null, index): void {
    const addressControl = this.splitDeliveryForm2.controls['ddlAddress' + index];
    console.log("-----addressControl", addressControl, value, index)
    if (addressControl) {
      if (value == 2) {
        addressControl.clearValidators();
      } else {
        addressControl.setValidators([Validators.required]);
      }
      addressControl.updateValueAndValidity();
    }
    this.fnConvertStringNull(index - 1, 'patientAddressId');
  }

  fnCheckSumSupplyDay() {
    // หาผลรวมของ supply day ทั้งหมดถ้า เกินไม่ต้องคำนวณไรต่อ ต้องขึ้นกรอบแดง
    let sumSupplyDay = 0;
    let isSupplyDayZero = false;
    this.isErrorMaxSupplyDay = false;
    for (let i = 0; i < this.deliveryList.length; i++) {
      if (+this.deliveryList[i].supplyDay < 0) {
        this.deliveryList[i].supplyDay = 0;
      }
      if (+this.deliveryList[i].supplyDay === 0) {
        isSupplyDayZero = true;
      }
      sumSupplyDay += +this.deliveryList[i].supplyDay;
    }
    if (sumSupplyDay !== +this.dataForm1.supplyDay || isSupplyDayZero) {
      this.isErrorMaxSupplyDay = true;
      // return;
    }
  }

  fnCalDeliveryByDate(index) {
    const currentData = this.deliveryList[index];
    const currentSupplyDay = currentData.supplyDay || 0;
    const numberOfSplit = this.deliveryList.length;
    const supplyDay = +this.dataForm1.supplyDay;
    const remind = this.remindList.indexOf(this.dataForm1.remind) + 1;
    console.log('remind', remind);

    const newSupplyDay = supplyDay - currentSupplyDay;
    const newNumberOfSplit = numberOfSplit - 1;
    const calSupplyDay = Math.floor(newSupplyDay / newNumberOfSplit);
    console.log('calSupplyDay', calSupplyDay);
    for (let i = 0; i < this.deliveryList.length; i++) {
      const data = this.deliveryList[i];
      const beforeData = this.deliveryList[i - 1];
      if (i > index) {
        data.deliveryStartDate = moment(beforeData.deliveryStartDate).add(beforeData.supplyDay, 'day').toDate();
      }
      data.deliveryRemindDate = moment(data.deliveryStartDate).subtract(remind, 'day').toDate();
    }
  }

  fnReCalDelivery() {
    this.isErrorMaxSupplyDay = false;
    const numberOfSplit = this.deliveryList.length;
    const supplyDay = +this.dataForm1.supplyDay;
    console.log('this.dataForm1.firstDeliveryDate', this.dataForm1.firstDeliveryDate);
    let firstDeliveryDate;
    if (+this.dataForm1.deliveryStart === 2) {
      firstDeliveryDate = moment(this.deliveryList[0].deliveryStartDate);
      this.isChangeDeliveryDate = true;
      this.splitDeliveryForm2.controls['txtDeliveryStartDate1'].enable();
      this.splitDeliveryForm2.controls['txtDeliveryRemindDate1'].enable();
    } else {
      if (moment(this.deliveryDetailData.deliveryDate, 'DD/MM/YYYY').isValid()) {
        firstDeliveryDate = moment(this.deliveryDetailData.deliveryDate, 'DD/MM/YYYY');
      } else {
        firstDeliveryDate = moment(this.deliveryDetailData.deliveryDate);
      }
    }
    console.log('firstDeliveryDate', firstDeliveryDate);
    const remind = this.remindList.indexOf(this.dataForm1.remind) + 1;
    console.log('remind', remind);

    let supplyDayFraction = 0;
    if (supplyDay % numberOfSplit !== 0) {
      supplyDayFraction = supplyDay % numberOfSplit;
    }
    const calSupplyDay = Math.floor(supplyDay / numberOfSplit);
    for (let i = 0; i < this.deliveryList.length; i++) {
      const data = this.deliveryList[i];
      if (i === 0 && +this.dataForm1.deliveryStart === 1) {
        // data.deliveryStartDate = firstDeliveryDate.format('DD/MM/YYYY');
      } else {
        data.deliveryStartDate = firstDeliveryDate.toDate();
      }
      data.deliveryRemindDate = moment(firstDeliveryDate).subtract(remind, 'day').toDate();
      if (supplyDayFraction && supplyDayFraction > 0) {
        --supplyDayFraction;
        console.log('calSupplyDay', calSupplyDay);
        firstDeliveryDate.add(calSupplyDay + 1, 'd');
        data.supplyDay = calSupplyDay + 1;
      } else {
        console.log('calSupplyDay', calSupplyDay);
        firstDeliveryDate.add(calSupplyDay, 'd');
        data.supplyDay = calSupplyDay;
      }
    }
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

  fnConvertStringNull(i, key) {
    console.log('fnConvertStringNull');
    if (this.deliveryList[i] && this.deliveryList[i][key] === 'null') {
      this.deliveryList[i][key] = null;
    }
  }
}

@NgModule({
  imports: [CommonModule, FormsModule, ReactiveFormsModule, DxDateBoxModule, DxCheckBoxModule, DxNumberBoxModule],
  exports: [AlertSplitDeliveryComponent],
  declarations: [AlertSplitDeliveryComponent]

})
export class AlertSplitDeliveryModule {
}
