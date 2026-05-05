import { Component, OnInit, AfterViewInit, ElementRef, Input, ViewChild, ViewEncapsulation, } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
// import { LayoutMenu } from '../../../shared/store/layout.menu.store';
import { GlobalVariable } from './view-all-orders.global';
import { Request } from '../../../../shared/services/request.service';
import { Common } from '../../../../shared/services/common.service';
import { FormGroup, FormBuilder, FormControl, Validators, FormArray, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { environment } from '../../../../../environments/environment';
import * as _ from 'lodash';
import { CompareService } from '../../../../shared/services/compare.service';
import { StoreService } from '../../../../shared/services/store.service';
import { CurrencyMaskConfig } from 'ngx-currency';
import * as moment from 'moment';

declare let $: any;

@Component({
  selector: 'app-view-all-orders',
  providers: [Request, Common, CompareService],
  templateUrl: './view-all-orders.component.html',
  styleUrls: ['./view-all-orders.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ViewAllOrdersComponent implements OnInit, AfterViewInit {
  @ViewChild('fileInput') fileInput: ElementRef;
  @ViewChild('myModal') myModal;
  isAlertUpload = false
  pharmacyPictureList = []
  originalPharmacyPictureList = []
  addressList = [];
  isLoadingUpload = false
  role = ''
  isEditMode = false
  isEditModePharmacyCheck = false
  originalData = {};
  originalPackagingNote = [];
  popupVisible = false
  filePicture = null
  order: any = {
    productionPictureList: []
  };
  deliveryList: any = [];
  editGroupForm: FormGroup;
  productionInfo: FormGroup;
  microserviceId;
  microserviceGroupId;
  filterData: any = {};
  uomList: any = [];
  cloneData: any;
  loading = true;
  disbledBtn = {
    'save': true,
    'cancel': true
  };
  microserviceMenuGroup = [];
  microserviceMenuGroupPermission = [];
  selectMenuParentId = [];
  selectMenuId = [];
  editSelectKey = [];
  currentSelectedRowsDataKey;
  currentSelectedRowsData;
  currentDeselectedRowKeys;
  microserviceName;
  dispensedPillRadioLabel = ['With meals', 'Before meals'];
  pageType: any = '';
  Id: any = null;
  menuHome: any = false;
  menuPermissions: any = { view: false, add: false, edit: false, delete: false };
  unitList = [];
  statusList = [
    { id: 0, name: 'Inactive' },
    { id: 1, name: 'Active' },
    { id: 2, name: 'Out of stock' }
  ];
  tabIndex = 0;
  orderDispensedPill = [];
  dispensedPillTotal = {
    morningWithMeals: 0,
    morningBeforeMeals: 0,
    lunchWithMeals: 0,
    lunchBeforeMeals: 0,
    eveningWithMeals: 0,
    eveningBeforeMeals: 0,
    bedtimeWithMeals: 0,
  };
  pharmacyCheck = {
    urgent: false,
    rm: false,
    allergyChecked: false,
    medReconcile: false,
    wf2: false,
  };
  quotation = {
    noBatchCharge: false,
    noPackCharge: false,
    staff: false,
  };
  tariffList: any = [];
  itemList: any = [];
  packagingList: any = [];
  deliveryMethodList: any = [];
  deliveryDetailList: any = [];
  orderCompound: any = [];
  arrivalTimeList: any = [];
  arrivalTimeListBackup: any = []
  arrivalTimeMap = {};
  mealList: any = [];
  seperateMedicines: any = [];
  medicationsNotReceived: any = [];
  orderStatusList: any = [];
  orderStatusMap = {};
  orderStatusMapByName = {}
  locationList: any = [];
  capsuleWF1Name = '';
  capsuleWF2Name = '';
  deliveryDetailMethod = '';
  deliveryDetailArrivalDateTime = '';
  detailList: any = [];
  currencyMaskOptions: CurrencyMaskConfig = {
    align: 'right',
    allowNegative: true,
    allowZero: true,
    decimal: '.',
    precision: 2,
    prefix: '',
    suffix: '',
    thousands: ',',
    nullable: true,
    min: null,
    max: null,
  };
  summary = 0;
  showTab = [true, true, true, true, true];
  quotationDetail: any = {};
  printAllurl = null
  dispensedPillMorning = null
  dispensedPillLunch = null
  dispensedPillEvening = null
  dispensedPillBedtime = null
  isUpdatingType = false
  isPackagingList = false
  typeOptions = [
    { id: 1, text: 'Laminate Bag' },
    { id: 2, text: 'Box' },
    { id: 3, text: 'Bottle' }
  ];
  supTypeOptions = [
    { id: 1, text: 'เช้า' },
    { id: 2, text: 'กลางวัน' },
    { id: 3, text: 'เย็น' },
    { id: 4, text: 'ก่อนนอน' }
  ];
  deliveryPictureList = []
  constructor(public router: Router,
    private fb: FormBuilder,
    private request: Request,
    private common: Common,
    private route: ActivatedRoute,
    private store: StoreService) {
    this.editGroupForm = this.fb.group({
      'txtHn': new FormControl(''),
      'txtPatientNameTh': new FormControl(''),
      'txtPatientNameEn': new FormControl(''),
      'txtPhone': new FormControl(''),
      'txtAdress': new FormControl(''),
      'txtOtherAdress': new FormControl(''),
      'txtProvince': new FormControl(''),
      'txtPostcode': new FormControl(''),
      'txtContactPerson': new FormControl(''),
      'txtItem': new FormControl(''),
      'txtStatus': new FormControl(''),
      'txtReason': new FormControl('', [Validators.required]),

    });
    this.productionInfo = this.fb.group({
      'txtProductionTeamHn': new FormControl(''),
      'txtProductionTeamPatientName': new FormControl(''),
      'txtProductionTeamType': new FormControl(''),
      'txtProductionTeamSupplyDay': new FormControl(''),
      'txtProductionBookingSlotDateTime': new FormControl(''),
      'txtProductionStartDateTime': new FormControl(''),
      'txtProductionEndDateTime': new FormControl(''),
      'txtProductionTeamLotNumber': new FormControl(''),
      'txtProductionTeamProductionNote': new FormControl(''),
      'txtPackageNote': new FormControl({ value: '', disabled: true }),
      'txtPackageNoteList': this.fb.array([
        this.createPackagingNoteForm()
      ]),
    });
  }
  get txtPackageNoteList(): FormArray {
    return this.productionInfo.get('txtPackageNoteList') as FormArray;
  }
  get packagingNoteListLength() {
    return (this.productionInfo.get('txtPackageNoteList') as FormArray).length;
  }
  atLeastOneCheckboxCheckedValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const formArray = control as FormArray;

      if (!formArray || !Array.isArray(formArray.controls)) {
        return null;
      }

      const isAnyChecked = formArray.controls.some(c => c.value === true);
      return isAnyChecked ? null : { atLeastOneRequired: true };
    };
  }
  createPackagingNoteForm(isDisabled = true): FormGroup {
    const supTypeControls = this.supTypeOptions.map(() => this.fb.control({ value: false, disabled: isDisabled }));
    const typeControls = this.typeOptions.map(() => this.fb.control({ value: false, disabled: isDisabled }));

    return this.fb.group({
      qty: [{ value: '', disabled: isDisabled }, [Validators.required, Validators.min(1), Validators.pattern(/^[1-9]\d*$/)]],
      type: this.fb.array(typeControls, this.atLeastOneCheckboxCheckedValidator()),
      supplyDays: [{ value: '', disabled: isDisabled }, [Validators.required, Validators.min(1), Validators.pattern(/^[1-9]\d*$/)]],
      supType: this.fb.array(supTypeControls, this.atLeastOneCheckboxCheckedValidator()),
      other: [{ value: '', disabled: isDisabled }]
    });
  }

  createPackagingNoteFormWithData(item: any): FormGroup {
    const isDisabled = this.pageType === 'view';

    const typeControls = this.typeOptions.map((_, i) => {
      return this.fb.control(
        { value: item.type === i + 1, disabled: isDisabled }
      );
    });

    const supTypeControls = this.supTypeOptions.map((_, i) => {
      return this.fb.control(
        { value: Array.isArray(item.supType) && item.supType.includes(i + 1), disabled: isDisabled }
      );
    });

    return this.fb.group({
      qty: [{ value: item.qty || '', disabled: isDisabled }, [Validators.required, Validators.min(1), Validators.pattern(/^[1-9]\d*$/)]],
      type: this.fb.array(typeControls, this.atLeastOneCheckboxCheckedValidator()),
      supplyDays: [{ value: item.supplyDays || '', disabled: isDisabled }, [Validators.required, Validators.min(1), Validators.pattern(/^[1-9]\d*$/)]],
      supType: this.fb.array(supTypeControls, this.atLeastOneCheckboxCheckedValidator()),
      other: [{ value: item.other || '', disabled: isDisabled }]
    });
  }

  isCheckboxGroupInvalid(control: AbstractControl): boolean {
    return control && control.invalid && (control.dirty || control.touched);
  }

  addPackagingNote() {
    const formArray = this.productionInfo.get('txtPackageNoteList') as FormArray;
    formArray.push(this.createPackagingNoteForm(false));
  }

  removePackagingNote(index: number) {
    const formArray = this.productionInfo.get('txtPackageNoteList') as FormArray;
    if (formArray.length > 1) {
      formArray.removeAt(index);
    }
  }

  switchPackagingNoteList() {
    this.isPackagingList = true
  }

  onTypeChange(noteIndex: number, typeIndex: number) {
    if (this.isUpdatingType) return;

    this.isUpdatingType = true;

    const packagingNoteArray = this.productionInfo.get('txtPackageNoteList') as FormArray;
    const noteGroup = packagingNoteArray.at(noteIndex) as FormGroup;
    const typeArray = noteGroup.get('type') as FormArray;

    typeArray.controls.forEach((control, i) => {
      if (i !== typeIndex) {
        control.setValue(false, { emitEvent: false });
      } else {
        control.setValue(true, { emitEvent: false }); // Ensure selected is true
      }
    });

    // Optional: delay reset to prevent recursive trigger
    setTimeout(() => {
      this.isUpdatingType = false;
    });
  }

  async ngOnInit() {
    try {
      if (sessionStorage.getItem('role')) {
        this.role = sessionStorage.getItem('role').toLowerCase()
      }
      const searchConfig = await this.common.searchConfig();
      this.tariffList = searchConfig.tariffList || [];
      this.itemList = searchConfig.patientItemList || [];
      this.packagingList = searchConfig.packagingList || [];
      this.deliveryMethodList = searchConfig.deliveryMethodList || [];
      this.arrivalTimeList = searchConfig.arrivalTimeList || [];
      this.arrivalTimeListBackup = this.arrivalTimeList || [];
      this.mealList = searchConfig.mealList || [];
      this.seperateMedicines = searchConfig.seperateMedicines || [];
      this.orderStatusList = searchConfig.orderStatus || [];
      for (const orderStatus of this.orderStatusList) {
        this.orderStatusMap[orderStatus.id] = orderStatus.name;
        this.orderStatusMapByName[orderStatus.name] = orderStatus.id;
      }
      this.locationList = searchConfig.location || [];
      this.store.subscribePagePermissionList().subscribe(pagePermissionList => {
        console.log('ngOnInit', pagePermissionList);
        const pagePermission = pagePermissionList.find(r => r.url === GlobalVariable.ROLE_URL);
        if (pagePermission) {
          try {
            this.menuPermissions = JSON.parse(pagePermission.menuPermissions);
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
      });
    } catch (e) {
      console.log(e);
    }
  }

  goHomeMenu() {
    if (this.menuHome) {
      this.router.navigate(['/menu', this.menuHome['menuId'], this.menuHome['typePage']]);
    }
  }

  lineData() {
    // console.log(this.detailList,this.detailList.length, 24  - 3 - (this.detailList.length % 24)); // (this.detailList.length % 25) - 3
    try {
      const countLineData = this.detailList.length % 24;
      const maxLineNoTotal = 24 - 4;
      if (countLineData > maxLineNoTotal) {
        return Array(maxLineNoTotal + (24 - countLineData)).fill(0);
      } else {
        return Array(maxLineNoTotal - countLineData).fill(0);
      }
    } catch (e) {
      return [];
    }
  }

  async ngAfterViewInit() {
    try {
      await this.route.params.subscribe(async params => {
        this.loading = false;
        this.disbledBtn = {
          'save': false,
          'cancel': false
        };
        console.log(':params', params);
        const splitPath = this.router.url.split('/');
        this.pageType = splitPath[splitPath.length - 1];
        console.log(':pageType', this.pageType);
        this.Id = params.id;

        if (this.pageType === 'view' || this.pageType === 'edit') {
          // get api by id
          // if (this.pageType === 'view') {
          //   (this.productionInfo.get('txtPackageNoteList') as FormArray)
          //     .controls.forEach(c => c.disable({ emitEvent: false }));
          // } else if (this.pageType === 'edit') {
          //   (this.productionInfo.get('txtPackageNoteList') as FormArray)
          //     .controls.forEach(c => c.enable({ emitEvent: false }));
          // }


          await this.getApiEdit();
          await this.searchOrderCashierView();
          if (this.order.type === 'Sup' && [13, 14, 17, 18].indexOf(+this.order.orderStatus) >= 0) {
            await this.getSearchQuotationDetail();
          }
        }

        this.editGroupForm.controls['txtHn'].disable();
        this.editGroupForm.controls['txtPatientNameTh'].disable();
        this.editGroupForm.controls['txtPatientNameEn'].disable();
        this.editGroupForm.controls['txtPhone'].disable();
        this.editGroupForm.controls['txtAdress'].disable();
        this.editGroupForm.controls['txtOtherAdress'].disable();
        this.editGroupForm.controls['txtProvince'].disable();
        this.editGroupForm.controls['txtPostcode'].disable();
        this.editGroupForm.controls['txtContactPerson'].disable();
        this.editGroupForm.controls['txtItem'].disable();

        if (this.pageType === 'edit') {
          this.editGroupForm.controls['txtStatus'].enable();
          this.editGroupForm.controls['txtReason'].enable();
        } else {
          this.editGroupForm.controls['txtStatus'].disable();
          this.editGroupForm.controls['txtReason'].disable();
        }


      });
      // this.microserviceName = sessionStorage.getItem('microserviceName');
      // console.log('this.microserviceName', this.microserviceName);
      // await
      // await this.textAreaAutoHeight();
      // await this.getMicroMenuGroupPermission();
      // await this.getMicroMenuGroup();
      await this.checkGroupPermission();
      document.body.scrollTop = 0; // สั่งให้ scroll to top เมื่อเข้าหน้ามา
    } catch (e) {
      console.log(e);
      const resultDescriptionSystemErrorTitle = environment.resultDescriptionSystemErrorTitle;
      const resultDescriptionSystemErrorMassage = environment.resultDescriptionSystemErrorMassage;
      this.goAlert(resultDescriptionSystemErrorTitle, resultDescriptionSystemErrorMassage, 'myModalError');
    }
  }

  async getApiEdit() {
    try {
      this.loading = true;
      this.disbledBtn = {
        'save': true,
        'cancel': true
      };
      const filterData = {
        orderId: this.Id,
      };

      const checkUrl = this.common.checkMockupUrl('', '', filterData, {
        BASE_API: '',
        BASE_MODULE: environment.apiPrefix,
        BASE_RESOURCE: environment.searchOrderById
      });


      const resultCodeSuccess = environment.resultCodeSuccess;

      const response = await this.request.get(checkUrl.url, checkUrl.filter);
      if (response.resultCode === resultCodeSuccess) {
        const resultData = await response.resultData || {};
        this.order = resultData.order || {};
        console.log("this.orderxx", this.order);

        if (this.order.waitingRemindDate) {
          if (moment(this.order.waitingRemindDate, 'DD/MM/YYYY').isValid()) {
            this.order.remindDate = moment(this.order.waitingRemindDate, 'DD/MM/YYYY').format("DD/MM/YYYY");
          } else {
            this.order.remindDate = moment(this.order.waitingRemindDate).format("DD/MM/YYYY");
          }
        }
        console.log("this.order.remindDate", this.order.remindDate);

        this.order.additionalNote = this.order.cusChangeAdditionalNote;
        this.order.orderStatusText = this.orderStatusMap[this.order.orderStatus];

        this.orderCompound = resultData.orderCompound || [];
        this.orderCompound = this.orderCompound.filter(r => r.rawMaterialName !== "Vivapur")
        this.orderDispensedPill = resultData.orderDispensedPill || [];
        this.deliveryDetailList = resultData.deliveryDetail || [];
        this.seperateMedicines = resultData.seperateMedicines || [];
        this.medicationsNotReceived = resultData.medicationsNotReceived || [];
        if (this.order) {

          if (this.order.orderStatus === 25) {
            await this.searchDdlPatientAddress();
          }

          // check show tab by order status
          if (+this.order.orderStatus === 27 || +this.order.orderStatus === 28) {
            this.showTab = [false, true, true, false, false];
            this.tabIndex = 1;
          } else {
            if (+this.order.orderStatus === 1 || +this.order.orderStatus === 2) {
              this.showTab = [true, false, false, false, false];
            } else if (+this.order.orderStatus > 2 && +this.order.orderStatus <= 11) {
              this.showTab = [true, true, false, false, false];
            } else if (+this.order.orderStatus > 12 && +this.order.orderStatus <= 16) {
              this.showTab = [true, true, true, false, false];
            } else if ((+this.order.orderStatus === 17 || +this.order.orderStatus === 18) || +this.order.orderStatus === 32) {
              this.showTab = [true, true, true, true, false];
            } else {
              this.showTab = [true, true, true, true, true];
            }
          }
          this.order.orderDate = this.common.convertDate(this.order.orderDate, 'DD/MM/YYYY HH:mm');
          const findTariff = this.tariffList.find(obj => obj.id === this.order.tariff);
          const findItem = this.itemList.find(obj => obj.id === this.order.item);
          const findLocation = this.locationList.find(obj => obj.id === this.order.location);
          this.order.tariff = findTariff ? findTariff.name : '';
          this.order.item = findItem ? findItem.name : '';
          this.order.location = findLocation ? findLocation.name : '';
          const address = this.order.address ? `${this.order.address} ` : '';
          const subdistrict = this.order.subdistrict ? `แขวง/ตำบล${this.order.subdistrict} ` : '';
          const district = this.order.district ? `เขต/อำเภอ${this.order.district} ` : '';
          const province = this.order.province ? `จังหวัด${this.order.province} ` : '';
          const postcode = this.order.postcode ? `${this.order.postcode}` : '';
          console.log("address1", address, subdistrict, district, province, this.order.postcode);

          this.order.address1 = `${address}${subdistrict}${district}${province}${postcode}`;
          this.order.address2 = address ? `${address}${subdistrict}` : ''
          this.order.districtProvince = `${district}${province}`;
          if (this.order.productionStartDate && this.order.productionStartTime) {
            this.order.productionStart = this.order.productionStartDate + ' ' + this.order.productionStartTime;
          } else {
            this.order.productionStart = '';
          }
          if (this.order.productionEndDate && this.order.productionEndTime) {
            this.order.productionEnd = this.order.productionEndDate + ' ' + this.order.productionEndTime;
          } else {
            this.order.productionEnd = '';
          }
          if (this.order.realProductionStartDate && this.order.realProductionStartTime) {
            this.order.realProductionStart = this.order.realProductionStartDate + ' ' + this.order.realProductionStartTime;
          } else {
            this.order.realProductionStart = '';
          }
          if (this.order.realProductionEndDate && this.order.realProductionEndTime) {
            this.order.realProductionEnd = this.order.realProductionEndDate + ' ' + this.order.realProductionEndTime;
          } else {
            this.order.realProductionEnd = '';
          }
          // packaging
          const findOrderPackaging = this.packagingList.find(obj => obj.id === this.order.packaging);
          this.order.packagingName = findOrderPackaging ? findOrderPackaging.name : '';
          // bottleMeals
          const findMeals = this.mealList.find(obj => obj.id === this.order.bottleMeals);
          this.order.bottleMeals = findMeals ? findMeals.name : '';
          // pharmacyCheck
          this.pharmacyCheck.urgent = this.order.isOrderPcCheckUrgent === 1;
          this.pharmacyCheck.rm = this.order.isOrderPcCheckRm === 1;
          this.pharmacyCheck.allergyChecked = this.order.isOrderPcCheckAllergy === 1;
          this.pharmacyCheck.medReconcile = this.order.isOrderPcCheckMed === 1;
          this.pharmacyCheck.wf2 = this.order.isOrderPcCheckWf2 === 1;
          // quotation
          this.quotation.noBatchCharge = this.order.isOrderQtCheckNoBatch === 1;
          this.quotation.noPackCharge = this.order.isOrderQtCheckNoPack === 1;
          this.quotation.staff = this.order.isOrderQtCheckStaff === 1;
          // capsule
          if (this.order.capsuleWF1) {
            this.capsuleWF1Name = this.order.capsuleWF1.capsuleName || '';
          }
          if (this.order.capsuleWF2) {
            this.capsuleWF2Name = this.order.capsuleWF2.capsuleName || '';
          }
          // type
          this.order.type = this.order.type === 1 ? 'Sup' : 'Pack';

          // ถ้า Cap per Day ของ Order สั้่งแยกมื้อเป็น 0 ไม่ต้องแสดงในตาราง
          if (this.order.isSeparateMeal) {
            if (this.order.sepLastMorningCapPerDay === null || this.order.sepLastMorningCapPerDay === undefined || (this.order.sepLastMorningCapPerDay && +this.order.sepLastMorningCapPerDay === 0)) {
              this.order.sepLastMorningCapPerDay = 0;
            }
            if (this.order.sepLastLunchCapPerDay === null || this.order.sepLastLunchCapPerDay === undefined || (this.order.sepLastLunchCapPerDay && +this.order.sepLastLunchCapPerDay === 0)) {
              this.order.sepLastLunchCapPerDay = 0;
            }
            if (this.order.sepLastEveningCapPerDay === null || this.order.sepLastEveningCapPerDay === undefined || (this.order.sepLastEveningCapPerDay && +this.order.sepLastEveningCapPerDay === 0)) {
              this.order.sepLastEveningCapPerDay = 0;
            }
            if (this.order.sepLastBedtimeCapPerDay === null || this.order.sepLastBedtimeCapPerDay === undefined || (this.order.sepLastBedtimeCapPerDay && +this.order.sepLastBedtimeCapPerDay === 0)) {
              this.order.sepLastBedtimeCapPerDay = 0;
            }
          }

          if (this.order.productionPicture) {
            this.order.productionPictureList = this.order.productionPicture.split('|');
          } else {
            this.order.productionPictureList = [];
          }
          if (this.order.packageNote) {
            if (this.isValidJsonObjectArray(this.order.packageNote)) {
              this.isPackagingList = true
              const parsedNote = JSON.parse(this.order.packageNote);
              this.originalPackagingNote = parsedNote
              const formArray = this.fb.array(
                parsedNote.map(item => this.createPackagingNoteFormWithData(item))
              );

              this.productionInfo.setControl('txtPackageNoteList', formArray);
            } else {
              this.isPackagingList = false
            }
          } else {
            this.isPackagingList = true
          }

          //set form productInfo 
          const formData = {
            txtProductionTeamHn: this.order.hn,
            txtProductionTeamPatientName: this.order.patientName,
            txtProductionTeamType: this.order.type,
            txtProductionTeamSupplyDay: this.order.supplyDay,
            txtProductionBookingSlotDateTime: this.order.productionStart,
            txtProductionStartDateTime: this.order.realProductionStart,
            txtProductionEndDateTime: this.order.realProductionEnd,
            txtProductionTeamLotNumber: this.order.lotNumber,
            txtProductionTeamProductionNote: this.order.productionNote,
            txtPackageNote: this.order.packageNote,
          };
          this.productionInfo.patchValue(formData);
          // if (this.order.pharmacyPicture) {
          //   this.order.pharmacyPicture = this.order.pharmacyPicture.split('|');
          // } else {
          //   this.order.pharmacyPicture = [];
          // }

        }

        const deliveryDetailMethod = [];
        const deliveryDetailArrivalDateTime = [];
        if (this.deliveryDetailList.length > 0) {
          const deliyveryDetails = this.deliveryDetailList.find((row: any) => row.deliveryDetailId == localStorage.getItem('deliveryDetailId'))
          if (deliyveryDetails) {
            if (deliyveryDetails.pharmacyPicture) {
              this.pharmacyPictureList = deliyveryDetails.pharmacyPicture.split('|');
            } else {
              this.pharmacyPictureList = [];
            }
          }

          if (deliyveryDetails) {
            this.order.csReason = deliyveryDetails.csReason
            if (deliyveryDetails.deliveryPicture) {
              this.order.deliveryPicture = deliyveryDetails.deliveryPicture.split('|');
            } else {
              this.order.deliveryPicture = [];
            }
          }

          for (let i = 0; i < this.deliveryDetailList.length; i++) {
            const data = this.deliveryDetailList[i];
            this.deliveryList.push({
              deliveryDetailId: data.deliveryDetailId,
              supplyDay: data.supplyDay,
              remindDate: data.remindDate,
              deliveryDate: moment(data.deliveryDate, 'DD/MM/YYYY'),
              showHide: 1,
              edited: 1,
              isComplete: data.isComplete,
              recipientName: data.recipientName,
              phone: data.phone,
              patientAddressId: +data.patientAddressId,
              address: data.address,
              district: data.district,
              subdistrict: data.subdistrict,
              districtProvince: this.common.concatAddress({
                subdistrict: data.subdistrict,
                district: data.district,
                province: data.province,
              }),
              province: data.province,
              postcode: data.postcode,
              arrivalTime: data.arrivalTime,
              deliveryMethod: data.deliveryMethod,
              deliveryMethodOther: data.deliveryMethodOther,
              packaging: data.packaging,
              isInvoice: data.isInvoice === 1,
              isReceipt: data.isReceipt === 1,
              isUrgent: data.isUrgent === 1,
              cashierDeliNote: data.cashierDeliNote,
              cashierId: data.cashierId,
            });
            this.arrivalTimeMap[i] = _.cloneDeep(this.arrivalTimeListBackup);

            this.deliveryDetailList[i].isCollapseCashier = this.deliveryDetailList.length > 1;
            this.deliveryDetailList[i].isCollapseCS = this.deliveryDetailList.length > 1;
            this.deliveryDetailList[i].isCollapsePT = this.deliveryDetailList.length > 1;

            // patient Address
            if (this.deliveryDetailList[i].patientAddress) {
              const address = this.deliveryDetailList[i].address ? `${this.deliveryDetailList[i].address} ` : '';
              const subdistrict = this.deliveryDetailList[i].subdistrict ? `แขวง/ตำบล${this.deliveryDetailList[i].subdistrict} ` : '';
              const district = this.deliveryDetailList[i].district ? `เขต/อำเภอ${this.deliveryDetailList[i].district} ` : '';
              const province = this.deliveryDetailList[i].province ? `จังหวัด${this.deliveryDetailList[i].province} ` : '';
              this.deliveryDetailList[i].address = `${address}${subdistrict}`;
              // tslint:disable-next-line:max-line-length
              this.deliveryDetailList[i].addressDisplay = address ? `${address}${subdistrict}${district}${province}${this.deliveryDetailList[i].postcode}` : '';
              this.deliveryDetailList[i].districtProvince = `${district}${province}`;
            } else {
              this.deliveryDetailList[i].patientAddressDisplay = '';
            }
            // cashier
            const cashier = this.deliveryDetailList[i].cashier || {};
            this.deliveryDetailList[i].cashierName = cashier.firstname + ' ' + cashier.lastname;
            // packaging
            const findPackaging = this.packagingList.find(obj => obj.id === this.deliveryDetailList[i].packaging);
            this.deliveryDetailList[i].packagingName = findPackaging ? findPackaging.name : '';
            // deliveryMethod
            const findDeliveryMethod = this.deliveryMethodList.find(obj => obj.id === this.deliveryDetailList[i].deliveryMethod);
            this.deliveryDetailList[i].deliveryMethodName = findDeliveryMethod ? findDeliveryMethod.name : '';
            this.deliveryDetailList[i].deliveryMethodNameFull = findDeliveryMethod ? findDeliveryMethod.name : '';
            if (this.deliveryDetailList[i].deliveryMethod === 6) {
              this.deliveryDetailList[i].deliveryMethodNameFull += ' : ' + this.deliveryDetailList[i].deliveryMethodOther
            }
            // arrivalTime
            const findArrivalTime = this.arrivalTimeList.find(obj => obj.id === this.deliveryDetailList[i].arrivalTime);
            this.deliveryDetailList[i].arrivalTimeName = findArrivalTime ? findArrivalTime.name : '';
            // deliveryStatus
            const findOrderStatus = this.orderStatusList.find(obj => obj.id === this.deliveryDetailList[i].deliveryStatus);
            this.deliveryDetailList[i].deliveryStatus = findOrderStatus ? findOrderStatus.name : '';

            deliveryDetailMethod.push(this.deliveryDetailList[i].deliveryMethodNameFull);
            deliveryDetailArrivalDateTime.push(this.deliveryDetailList[i].deliveryDate + ' ' + this.deliveryDetailList[i].arrivalTimeName);
          }
        }

        this.deliveryDetailMethod = deliveryDetailMethod.join(', ');
        this.deliveryDetailArrivalDateTime = deliveryDetailArrivalDateTime.join(', ');
        let orderDispensedPill = _.cloneDeep(this.orderDispensedPill)
        if (orderDispensedPill.length > 0) {
          for (let i = 0; i < orderDispensedPill.length; i++) {
            const data = orderDispensedPill[i];
            if (this.order.orderStatus === 1) {
              orderDispensedPill[i].totalPill = +orderDispensedPill[i].dosePerDay * +this.order.supplyDay;
            }
            for (const key in data) {
              if (this.dispensedPillTotal[key] !== null && this.dispensedPillTotal[key] !== undefined) {
                this.dispensedPillTotal[key] += +data[key];
              }
            }

            // if (data.morningWithMeals) {
            //   this.dispensedPillTotal.morningWithMeals = 1;
            // } else if (data.morningBeforeMeals) {
            //   this.dispensedPillTotal.morningBeforeMeals = 1;
            // }
            // if (data.lunchWithMeals) {
            //   this.dispensedPillTotal.lunchWithMeals = 1;
            // } else if (data.lunchBeforeMeals) {
            //   this.dispensedPillTotal.lunchBeforeMeals = 1;
            // }
            // if (data.eveningWithMeals) {
            //   this.dispensedPillTotal.eveningWithMeals = 1;
            // } else if (data.eveningBeforeMeals) {
            //   this.dispensedPillTotal.eveningBeforeMeals = 1;
            // }
            // if (data.bedtimeWithMeals) {
            //   this.dispensedPillTotal.bedtimeWithMeals = 1;
            // }

            if (data.morningWithMeals && +data.morningWithMeals > 0) {
              data.mpc = data.morningWithMeals;
              this.dispensedPillMorning = this.dispensedPillRadioLabel[0];
            } else if (data.morningBeforeMeals && +data.morningBeforeMeals > 0) {
              data.mac = data.morningBeforeMeals;
              this.dispensedPillMorning = this.dispensedPillRadioLabel[1];
            }
            if (data.lunchWithMeals && +data.lunchWithMeals > 0) {
              data.lpc = data.lunchWithMeals;
              this.dispensedPillLunch = this.dispensedPillRadioLabel[0];
            } else if (data.lunchBeforeMeals && +data.lunchBeforeMeals > 0) {
              data.lac = data.lunchBeforeMeals;
              this.dispensedPillLunch = this.dispensedPillRadioLabel[1];
            }
            if (data.eveningWithMeals && +data.eveningWithMeals > 0) {
              data.epc = data.eveningWithMeals;
              this.dispensedPillEvening = this.dispensedPillRadioLabel[0];
            } else if (data.eveningBeforeMeals && +data.eveningBeforeMeals > 0) {
              data.eac = data.eveningBeforeMeals;
              this.dispensedPillMorning = this.dispensedPillRadioLabel[1];
            }
            if (data.bedtimeWithMeals && +data.bedtimeWithMeals > 0) {
              data.bpc = data.bedtimeWithMeals;
              this.dispensedPillBedtime = this.dispensedPillRadioLabel[0];
            }
          }
        }

        // finishedProductName === "Compounded Pills"
        orderDispensedPill.sort((a, b) => {
          if (a.finishedProductName === "Compounded Pills") {
            return -1
          } else if (b.finishedProductName === "Compounded Pills") {
            return 1
          }
          return a.no - b.no;
        });

        this.orderDispensedPill = orderDispensedPill;
        //   this.editDataGroups.priceThai = this.editDataGroups.priceThai
        //   this.editDataGroups.priceInter = this.editDataGroups.priceInter
        //   this.editDataGroups.priceMiddleEast = this.editDataGroups.priceMiddleEast
        //   this.cloneData = _.cloneDeep(this.editDataGroups)
        //   console.log(this.editDataGroups)
        //   this.checkUom()
      }
      // // else if (response.resultCode === resultCodeDataNotFound) {
      // //   this.goAlert(resultDescriptionDataNotFoundTitle, resultDescriptionDataNotFoundMassage, 'myModalError');
      // // } else if (response.resultCode === resultCodeDbError) {
      // //   this.goAlert(resultDescriptionDbErrorTitle, resultDescriptionDbErrorMassage, 'myModalError');
      // // }
      // else {
      //   // this.goAlert(resultDescriptionSystemErrorTitle, resultDescriptionSystemErrorMassage, 'myModalError');
      //   this.goAlert(response.resultCode, response.resultDescription, 'myModalError');
      // }

      // show color red in textbox
      console.log('this.order', this.orderCompound);

      if (this.orderCompound) {
        for (let i = 0; i < this.orderCompound.length; i++) {
          if (this.orderCompound[i].dosePerDay) {
            const minimumDose = this.orderCompound[i].minimumDose ? +this.orderCompound[i].minimumDose : 0;
            const maximumDose = this.orderCompound[i].maximumDose ? +this.orderCompound[i].maximumDose : 0;
            console.log(maximumDose, 'maximumDose');
            console.log(maximumDose, 'maximumDose');
            if (+this.orderCompound[i].dosePerDay > maximumDose || +this.orderCompound[i].dosePerDay < minimumDose) {
              this.orderCompound[i].invalid = true;
              console.log('1');
              console.log(this.orderCompound[i].invalid);
            } else {
              console.log('2');
              console.log(this.orderCompound[i].invalid);
              this.orderCompound[i].invalid = false;
            }
          } else {
            console.log('3');
            console.log(this.orderCompound[i].invalid);
            this.orderCompound[i].invalid = false;
          }
        }
      }

      setTimeout(() => {
        if (+this.order.isOrderPcCheckWf2 === 1) {
          $('#txtAdditionalNoteFromDoctor').highlightTextarea({
            ranges: [[0, 9999]]
          });
          $('#txtOrderPharmacyNoteRemark').highlightTextarea({
            ranges: [[0, 9999]]
          });
        }
      }, 1000);
      this.loading = false;
      this.disbledBtn = {
        'save': false,
        'cancel': false
      };

    } catch (e) {
      console.log(e);
      this.loading = false;
      this.disbledBtn = {
        'save': false,
        'cancel': false
      };
      const resultDescriptionSystemErrorTitle = environment.resultDescriptionSystemErrorTitle;
      const resultDescriptionSystemErrorMassage = environment.resultDescriptionSystemErrorMassage;
      this.goAlert(resultDescriptionSystemErrorTitle, resultDescriptionSystemErrorMassage, 'myModalError');
    }
  }
  isValidJsonObjectArray(value: string): boolean {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) && parsed.every(item => typeof item === 'object' && item !== null && !Array.isArray(item));
    } catch {
      return false;
    }
  }
  async searchOrderCashierView() {
    try {
      const filterData = {
        orderId: this.Id,
      };
      const checkUrl = this.common.checkMockupUrl('', '', filterData, {
        BASE_API: '',
        BASE_MODULE: environment.apiPrefix,
        BASE_RESOURCE: environment.searchOrderCashierView
      });
      const resultCodeSuccess = environment.resultCodeSuccess;

      const response = await this.request.get(checkUrl.url, checkUrl.filter);
      if (response.resultCode === resultCodeSuccess) {
        const resultData = await response.resultData;
        // detail
        this.detailList = resultData.quotationDetail || [];
        for (let i = 0; i < this.detailList.length; i++) {
          if (this.detailList[i].name.includes('Customized Supplement')) {
            this.detailList[i].unitPrice = Math.ceil(this.detailList[i].unitPrice);
            this.detailList[i].amount = Math.ceil(this.detailList[i].amount);
          }
        }
        let total = 0;
        for (let i = 0; i < resultData.quotationDetail.length; i++) {
          const data = resultData.quotationDetail[i];
          total += data.amount;
        }
        this.summary = Math.ceil(total);
      } else {
        this.detailList = [];
      }
    } catch (e) {
      console.error(e);
      this.detailList = [];
    }
  }

  async getSearchQuotationDetail() {
    try {
      const filterData = {
        orderId: this.Id,
      };
      const checkUrl = this.common.checkMockupUrl('', '', filterData, {
        BASE_API: '',
        BASE_MODULE: environment.apiPrefix,
        BASE_RESOURCE: environment.searchQuotationDetail
      });

      const resultCodeSuccess = environment.resultCodeSuccess;
      const response = await this.request.get(checkUrl.url, checkUrl.filter);
      if (response.resultCode === resultCodeSuccess) {
        this.quotationDetail = response.resultData;
      } else {
        this.quotationDetail = {};
        this.goAlert(response.resultCode, response.resultDescription, 'myModalError');
      }

    } catch (e) {
      console.log(e);
      const resultDescriptionSystemErrorTitle = environment.resultDescriptionSystemErrorTitle;
      const resultDescriptionSystemErrorMassage = environment.resultDescriptionSystemErrorMassage;
      this.goAlert(resultDescriptionSystemErrorTitle, resultDescriptionSystemErrorMassage, 'myModalError');
    }
  }

  checkGroupPermission() {
    console.log('checkGroupPermission1', this.microserviceMenuGroup);
    console.log('checkGroupPermission2', this.microserviceMenuGroupPermission);
    this.selectMenuParentId = [];
    this.selectMenuId = [];

    const parent = this.microserviceMenuGroup.filter(r => !r.microserviceMenuParentId).map(r => r.microserviceMenuId);
    const childPanrenId = this.microserviceMenuGroup.filter(r => r.microserviceMenuParentId).map(r => r.microserviceMenuParentId);

    const parentNotchild = parent.filter(r => {
      // console.log(parent,child,r,child.indexOf(r))
      return childPanrenId.indexOf(r) === -1;
    });

    console.log(parent, childPanrenId, parentNotchild);
    this.microserviceMenuGroupPermission.forEach(permission => {
      const microserviceMenuId = permission.microserviceMenuId;
      if (parentNotchild.indexOf(microserviceMenuId) > -1) {
        this.selectMenuParentId.push(permission.microserviceMenuId);
      } else if (parent.indexOf(microserviceMenuId) === -1) {
        this.selectMenuParentId.push(permission.microserviceMenuId);
      }
    });

    console.log('selectMenuParentId', this.selectMenuParentId);
    console.log(this.microserviceMenuGroup);
  }

  async btnSubmit() {
    try {
      // this.disbledBtn = {
      //   'save': true,
      //   'cancel': true
      // };
      const requiredData: boolean = this.checkRequiredData();
      console.log(this.order);
      if (requiredData) {
        const addData: any = {
          ...this.order,
          // "image":this.filePicture
        };
        if (this.pageType === 'edit') {
          for (const [key] of Object.entries(addData)) {
            if (addData[key] == this.cloneData[key]) {
              delete addData[key];
            }
          }
          addData.finishedProductId = this.Id;
        }
        if (this.order.uom == 'Box' || this.order.uom == 'Bottle') {
          addData['supplyDay'] = null;
        } else if (this.order.uom == 'Pack') {
          addData['quantity'] = null;
          addData['unit'] = null;
        } else {
          addData['supplyDay'] = null;
          addData['quantity'] = null;
          addData['unit'] = null;
        }
        let response;

        let checkUrl = null;
        if (this.pageType === 'new') {
          checkUrl = this.common.checkMockupUrl('', GlobalVariable.RESOURCE, {}, {
            BASE_API: GlobalVariable.BASE_API,
            BASE_MODULE: GlobalVariable.BASE_MODULE,
            BASE_RESOURCE: GlobalVariable.BASE_RESOURCE + GlobalVariable.BASE_RESOURCE_CREATE
          });
          response = await this.request.post(checkUrl.url, [addData]);
        } else {
          checkUrl = this.common.checkMockupUrl('', GlobalVariable.RESOURCE, {}, {
            BASE_API: GlobalVariable.BASE_API,
            BASE_MODULE: GlobalVariable.BASE_MODULE,
            BASE_RESOURCE: GlobalVariable.BASE_RESOURCE + GlobalVariable.BASE_RESOURCE_UPDATE
          });
          response = await this.request.patch(checkUrl.url, addData);
        }


        const resultCodeSuccess = environment.resultCodeSuccess;

        if (response.resultCode === resultCodeSuccess) {

          this.goAlert('', '', 'myModalSuccess');
        } else {
          // this.goAlert(resultDescriptionSystemErrorTitle, resultDescriptionSystemErrorMassage, 'myModalError');
          this.goAlert(response.resultCode, response.resultDescription, 'myModalError');
        }

      } else {
        this.goAlert('Field is required', 'Your have left a field empty and a value must be entered.', 'myModalWarning');
        this.disbledBtn = {
          'save': false,
          'cancel': false
        };

      }
    } catch (e) {
      console.log(e);
      this.disbledBtn = {
        'save': false,
        'cancel': false
      };
    }
  }

  checkRequiredData() {
    console.log(this.editGroupForm.controls, this.editGroupForm, this.editGroupForm.valid);
    for (const key in this.editGroupForm.controls) {
      if (this.editGroupForm.controls[key].errors) {
        this.editGroupForm.controls[key].setErrors({ 'forceRequired': true });
        this.editGroupForm.controls[key].markAsDirty();
      } else {
        this.editGroupForm.controls[key].updateValueAndValidity();
      }
    }

    return this.editGroupForm.valid;
  }

  checkUom() {
    if (this.pageType === 'view') {
      this.editGroupForm.controls['txtSupplyDay'].disable();
      this.editGroupForm.controls['txtQuantity'].disable();
      this.editGroupForm.controls['txtUnit'].disable();
      return;
    }

    if (this.order.uom == 'Box' || this.order.uom == 'Bottle') {
      this.editGroupForm.controls['txtQuantity'].enable();
      this.editGroupForm.controls['txtUnit'].enable();
      this.editGroupForm.controls['txtSupplyDay'].disable();
    } else if (this.order.uom == 'Pack') {
      this.editGroupForm.controls['txtSupplyDay'].enable();
      this.editGroupForm.controls['txtUnit'].disable();
      this.editGroupForm.controls['txtQuantity'].disable();
    } else {
      this.editGroupForm.controls['txtSupplyDay'].disable();
      this.editGroupForm.controls['txtUnit'].disable();
      this.editGroupForm.controls['txtQuantity'].disable();
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

  numberOnly(event): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;
    console.log(charCode);
    if (charCode == 46) {
      return true;
    } else if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }

  onClickBack() {
    if (this.isAlertUpload) {
      this.disbledBtn = {
        'save': false,
        'cancel': false
      };
      this.isEditModePharmacyCheck = false
    } else {
      this.router.navigate(['/order-management', 'all-orders']);
    }
  }

  onCloseModalError() {
    this.isLoadingUpload = false;
    this.disbledBtn = {
      'save': false,
      'cancel': false
    };
  }

  onCloseModalWarning() {
    this.isLoadingUpload = false;
    this.disbledBtn = {
      'save': false,
      'cancel': false
    };
  }

  textAreaAutoHeight() {
  }

  async changeTab(index: number) {
    this.tabIndex = index;
    if (this.tabIndex === 3 && !this.printAllurl) {
      await this.fnClickPrintDocument('all')
    }
  }

  clickCollapse(id, i) {
    if (this.tabIndex === 1) {
      this.deliveryDetailList[i].isCollapseCashier = !this.deliveryDetailList[i].isCollapseCashier;
    } else if (this.tabIndex === 2) {
      this.deliveryDetailList[i].isCollapseCS = !this.deliveryDetailList[i].isCollapseCS;
    } else if (this.tabIndex === 4) {
      this.deliveryDetailList[i].isCollapsePT = !this.deliveryDetailList[i].isCollapsePT;
    }
    this.common.collapseFnById(id);
  }

  async fnClickPrintDocument(type: string, deliveryDetailId?: number) {
    console.log('fnClickPrintDocument type', type);
    try {
      let url = ''
      let filterData: any = {}
      if (type === 'pharmacyProductionSheet') {
        url = environment.printProductionSheet
      }
      if (type === 'patientInformation') {
        url = environment.printPatientInformation
      }
      if (type === 'supplementInformation') {
        url = environment.printSupplementInformation
      }
      if (type === 'pharmacyProductionSheet') {
        url = environment.printProductionSheet
      }
      if (type === 'workingFormulaWF') {
        url = environment.printWorkingFormula
      }
      if (type === 'workingFormulaWF2') {
        url = environment.printWorkingFormula2
      }
      if (type === 'label') {
        url = environment.printSupplementFacts
      }
      if (type === 'labelSmall') {
        url = environment.printLabel
      }
      if (type === 'labelSizeS') {
        filterData.size = 'S'
        url = environment.printSMLLabel
        if (deliveryDetailId) {
          filterData.deliveryDetailId = deliveryDetailId
        }
      }
      if (type === 'labelSizeM') {
        filterData.size = 'M'
        url = environment.printSMLLabel
        if (deliveryDetailId) {
          filterData.deliveryDetailId = deliveryDetailId
        }
      }
      if (type === 'labelSizeL') {
        filterData.size = 'L'
        url = environment.printSMLLabel
        if (deliveryDetailId) {
          filterData.deliveryDetailId = deliveryDetailId
        }
      }
      if (type === 'labelSachet') {
        url = environment.printLabelSachet
      }
      if (type === 'rmChargeDetail') {
        url = environment.printRMChargeDetail
      }
      if (type === 'deliveryDetail') {
        url = environment.printDeliveryDetail
      }
      if (type === 'supplementDetail') {
        url = environment.printSupplementDetail
      }
      if (type === 'deliveryForm') {
        url = environment.printDeliveryForm
        if (deliveryDetailId) {
          filterData.deliveryDetailId = deliveryDetailId
        }
      }
      if (type === 'all') {
        url = environment.printAll
      }
      if (type === 'printVitallifeOrderSheet') {
        url = environment.printVitallifeOrderSheet
      }

      console.log(url)
      const checkUrl = this.common.checkMockupUrl('', '', filterData, {
        BASE_API: '',
        BASE_MODULE: environment.apiPrefix,
        BASE_RESOURCE: url + '/' + this.Id
      });

      const resultCodeSuccess = environment.resultCodeSuccess;
      const response = await this.request.get(checkUrl.url, checkUrl.filter);
      if (response.resultCode === resultCodeSuccess) {
        const resultData = response.resultData || response.data;
        const fileName = resultData.filename;
        console.log('fileName', fileName);
        if (fileName && type !== 'all') {
          window.open(fileName);
        } else {
          this.printAllurl = fileName
        }
      } else {
        this.myModal.openModal({
          'modalId': 'myModalError',
          'userTitle': response.resultCode,
          'userMessage': response.resultDescription,
          'userMessageList': []
        });
      }
    } catch (e) {
      console.log(e);
      const resultDescriptionSystemErrorTitle = environment.resultDescriptionSystemErrorTitle;
      const resultDescriptionSystemErrorMassage = environment.resultDescriptionSystemErrorMassage;
      this.myModal.openModal({
        'modalId': 'myModalError',
        'userTitle': resultDescriptionSystemErrorTitle,
        'userMessage': resultDescriptionSystemErrorMassage,
        'userMessageList': []
      });
    }
  }

  fnDownloadAll() {
    if (this.printAllurl) {
      window.open(this.printAllurl);
    }
  }

  showTotalDispensedPill() {
    return this.dispensedPillTotal.morningWithMeals > 0
      || this.dispensedPillTotal.morningBeforeMeals > 0
      || this.dispensedPillTotal.lunchWithMeals > 0
      || this.dispensedPillTotal.lunchBeforeMeals > 0
      || this.dispensedPillTotal.eveningWithMeals > 0
      || this.dispensedPillTotal.eveningBeforeMeals > 0
      || this.dispensedPillTotal.bedtimeWithMeals > 0;
  }
  popupImg(i) {
    this.filePicture = i
    this.popupVisible = true
  }

  enableEditMode() {
    this.originalData = _.cloneDeep(this.order)
    this.isEditMode = true;
    this.productionInfo.get('txtPackageNoteList').enable();
    this.productionInfo.get('txtPackageNote').enable();
  }

  enableEditModePharmacyCheck() {
    this.originalPharmacyPictureList = _.cloneDeep(this.pharmacyPictureList)
    this.isEditModePharmacyCheck = true;
  }

  save() {
    this.updatePictures()
  }

  savePharmacyCheck() {
    this.updatePicturesPharmacyCheck()
  }

  cancelPharmacyCheck() {
    this.pharmacyPictureList = this.originalPharmacyPictureList
    this.isEditModePharmacyCheck = false
  }

  cancel() {
    this.order = _.cloneDeep(this.originalData)
    if (this.isValidJsonObjectArray(this.order.packageNote) || !this.order.packageNote) {
      if (!this.order.packageNote) {
        this.productionInfo.setControl('txtPackageNoteList', this.fb.array([
          this.createPackagingNoteForm()
        ]));
      } else {
        const oldDataNote = _.cloneDeep(this.originalPackagingNote)
        const formArray = this.fb.array(
          oldDataNote.map(item => this.createPackagingNoteFormWithData(item))
        );

        this.productionInfo.setControl('txtPackageNoteList', formArray);
      }

      this.isPackagingList = true
    } else {
      this.isPackagingList = false
    }

    this.isEditMode = false;
    this.productionInfo.get('txtPackageNoteList').disable();
    this.productionInfo.get('txtPackageNote').disable();
  }

  triggerFileInput() {
    this.fileInput.nativeElement.click();
  }

  upload(event: any, type: string) {
    const files: FileList = event.target.files;
    console.log("--------------------------------upload");
    if (!files || !files.length) return;

    const maxPictures = 5;
    const currentCount = type == 'pharmacy' ? this.pharmacyPictureList.length : this.order.productionPictureList.length;
    const remainingSlots = maxPictures - currentCount;

    if (remainingSlots <= 0) {
      event.target.value = '';
      return;
    }

    const limitedFiles = Array.from(files).slice(0, remainingSlots);

    for (let i = 0; i < limitedFiles.length; i++) {
      const file = limitedFiles[i];
      const reader = new FileReader();

      reader.onload = (e: any) => {
        const base64 = e.target.result;
        if (type == 'pharmacy') {
          this.pharmacyPictureList.push(base64);
        } else {
          this.order.productionPictureList.push(base64);
        }
      };

      reader.readAsDataURL(file);
    }
    event.target.value = '';
  }

  removePicture(index: number, type: string): void {
    if (type == 'pharmacy') {
      this.pharmacyPictureList.splice(index, 1);
    } else {
      this.order.productionPictureList.splice(index, 1);
    }
  }

  convertUrlToBase64(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';

      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const dataURL = canvas.toDataURL('image/png');
          resolve(dataURL);
        } else {
          reject('Canvas context not available');
        }
      };

      img.onerror = (err) => reject(err);
      img.src = url;
    });
  }

  /**
   * เอาเฉพาะ URL โหลด canvas ได้ — รูปหาย/แตกจะตัดออก ไม่ให้ Promise.all ล้มทั้งรายการ
   */
  private async buildBase64ListSkippingFailed(urls: string[]): Promise<{ dataUrls: string[]; pruned: string[] }> {
    const dataUrls: string[] = [];
    const pruned: string[] = [];
    for (const u of urls) {
      if (u == null) {
        continue;
      }
      const url = String(u).trim();
      if (!url) {
        continue;
      }
      try {
        const b64 = await this.convertUrlToBase64(url);
        dataUrls.push(b64);
        pruned.push(u);
      } catch {
        /* ข้าม */
      }
    }
    return { dataUrls, pruned };
  }

  checkRequiredProductionDone() {
    if (!this.isPackagingList) {
      return true;
    }

    const formArray = this.productionInfo.get('txtPackageNoteList') as FormArray;

    formArray.controls.forEach((group: FormGroup) => {
      Object.keys(group.controls).forEach(key => {
        const control = group.get(key);

        if (control instanceof FormArray) {
          control.controls.forEach(ctrl => {
            ctrl.markAsTouched();
          });
          control.updateValueAndValidity();

        } else {
          control.markAsDirty();
          control.updateValueAndValidity();
        }
      });
    });
    return this.productionInfo.valid;
  }


  async updatePictures() {
    try {
      this.isAlertUpload = true
      const valid = this.checkRequiredProductionDone();
      if (valid) {
        this.isEditMode = false;
        this.isLoadingUpload = true
        const { dataUrls: base64Images, pruned } = await this.buildBase64ListSkippingFailed(this.order.productionPictureList);
        this.order.productionPictureList = pruned;
        const checkUrl = this.common.checkMockupUrl('', '', {}, {
          BASE_API: '',
          BASE_MODULE: environment.apiPrefix,
          BASE_RESOURCE: environment.updateProductTeam
        });


        let payloadPackageNote = ''
        if (this.isPackagingList) {
          const packagingNotesRaw = this.productionInfo.get('txtPackageNoteList').value;
          const packagingNotesProcessed = packagingNotesRaw.map(note => {
            const typeIndex = note.type.findIndex(selected => selected === true);
            const supTypeIndexes = note.supType
              .map((selected, idx) => selected ? idx + 1 : -1)
              .filter(idx => idx !== -1);

            return {
              ...note,
              type: typeIndex + 1,
              supType: supTypeIndexes
            };
          });
          payloadPackageNote = JSON.stringify(packagingNotesProcessed)
        } else {
          payloadPackageNote = this.order.packageNote
        }

        const resultCodeSuccess = environment.resultCodeSuccess;
        const data = {
          "orderId": this.Id,
          "productionPicture": base64Images.join('|'),
          "packageNote": payloadPackageNote
        }

        const response = await this.request.patch(checkUrl.url, data);
        if (response.resultCode === resultCodeSuccess) {
          this.isLoadingUpload = false
          this.goAlert('', '', 'myModalSuccess');
        }
        else {
          this.isLoadingUpload = false;
          this.isAlertUpload = false
          this.goAlert(response.resultCode, response.resultDescription, 'myModalError');
        }
      } else {
        this.isAlertUpload = false
        const el = document.getElementById(`targetError`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          if (typeof el['focus'] === 'function') {
            el.focus();
          }
        }

      }
    } catch (error) {
      this.isLoadingUpload = false
      console.error('Error converting images to Base64', error);
    }
  }

  async updatePicturesPharmacyCheck() {
    try {
      this.isAlertUpload = true
      this.isEditModePharmacyCheck = false;
      this.isLoadingUpload = true
      const resultCodeSuccess = environment.resultCodeSuccess;
      const { dataUrls: base64Images, pruned: pharmacyPruned } = await this.buildBase64ListSkippingFailed(this.pharmacyPictureList);
      this.pharmacyPictureList = pharmacyPruned;

      const payload: any = {
        orderId: this.Id,
        deliveryDetail: [],
      };
      let deliDetail = {
        deliveryId: Number(localStorage.getItem('deliveryDetailId')),
        pharmacyPicture: base64Images.join('|')
      } as any

      payload.deliveryDetail.push(deliDetail);

      let checkUrl = null;

      checkUrl = this.common.checkMockupUrl('', GlobalVariable.RESOURCE, {}, {
        BASE_API: GlobalVariable.BASE_API,
        BASE_MODULE: GlobalVariable.BASE_MODULE,
        BASE_RESOURCE: GlobalVariable.BASE_RESOURCE_ORDER + GlobalVariable.BASE_RESOURCE_UPDATE_ORDER
      });

      const response = await this.request.post(checkUrl.url, payload);
      if (response.resultCode === resultCodeSuccess) {
        this.isLoadingUpload = false
        this.goAlert('', '', 'myModalSuccess');
      }
      else {
        this.isLoadingUpload = false;
        this.goAlert(response.resultCode, response.resultDescription, 'myModalError');
        this.isAlertUpload = false
      }
    } catch (error) {
      this.isAlertUpload = false
      this.isLoadingUpload = false
      console.error('Error converting images to Base64', error);
    }
  }
  normalizeRole(role: string): string {
    return (role || '').toLowerCase().replace(/\s/g, '');
  }

  isEditableRole(): boolean {
    const normalized = this.normalizeRole(this.role);
    return !this.isEditMode && ['admin', 'superuser', 'productiontechnician'].includes(normalized);
  }
  isEditableRolePharmacyCheck(): boolean {
    const normalized = this.normalizeRole(this.role);
    return !this.isEditModePharmacyCheck && ['admin', 'superuser', 'pharmacist'].includes(normalized);
  }

  getSafeNumber(value: number | null | undefined): number {
    return (value !== null && value !== undefined) ? value : 0;
  }

  async searchDdlPatientAddress() {
    try {
      const checkUrl = this.common.checkMockupUrl('', '', { hn: this.order.hn }, {
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

  isMainDelivery(data: any) {
    try {
      const deliveryDetailId = localStorage.getItem('deliveryDetailId');
      return data.deliveryDetailId == deliveryDetailId
    } catch (e) {
      console.log(e);
    }
  }

}
