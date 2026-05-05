import { AfterViewInit, Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
// import { LayoutMenu } from '../../../shared/store/layout.menu.store';
import { Request } from '../../../../shared/services/request.service';
import { Common } from '../../../../shared/services/common.service';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { DxTreeListComponent } from 'devextreme-angular';
import { environment } from '../../../../../environments/environment';
import * as moment from 'moment';
import * as _ from 'lodash';
import { CompareService } from '../../../../shared/services/compare.service';
import { StoreService } from '../../../../shared/services/store.service';
import { GlobalVariable } from './split-production.global';

declare let $: any;

interface Detail {
  description: string;
  quantity: string;
  uom: string;
  unitPrice: number;
  amount: number;
}

@Component({
  selector: 'app-split-production',
  providers: [Request, Common, CompareService],
  templateUrl: './split-production.component.html',
  styleUrls: ['./split-production.scss'],
  encapsulation: ViewEncapsulation.None
})
export class SplitProductionComponent implements OnInit, AfterViewInit {

  @ViewChild('myModal') myModal;
  @ViewChild(DxTreeListComponent) treeList: DxTreeListComponent;
  patientInfo: any = {
    hn: '',
    patientNameTH: '',
    patientNameEN: '',
    phone: '',
    address: '',
    districtProvince: '',
    postcode: '',
    contactPerson: '',
    item: null,
  };
  supplementDetail = {
    confirmedDays: '',
    slotNo: '',
    productionEndDate: '',
    productionEndTime: '',
    stdProductionHour: '',
    startDateTime: '',
    additionalNote: '',
  };
  deliveryDetail = [];
  patientInfoForm: FormGroup;
  supplementDetailForm: FormGroup;
  deliveryDetailForm: FormGroup;
  microserviceId;
  microserviceGroupId;
  filterData: any = {};
  uomList: any = [];
  cloneData: any;
  loading = false;
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
  pageType: any = '';
  Id: any = null;
  menuHome: any = false;
  menuPermissions: any = { view: false, add: false, edit: false, delete: false };
  unitList = [];
  patientItemList: { id: number, name: string }[] = [];
  // detailList: Detail[] = [];
  summary = 9956.00;
  appointmentsData: any[] = [];
  currentDate: Date = moment().toDate();
  minDeliveryDate: Date = moment().toDate();
  prioritiesData: any[] = [];
  productionTimeMin = 0;
  startDayHour = 0;
  endDayHour = 24;
  fakeCurrentDate = moment().toDate();
  currentDateWith3Hr = moment(this.fakeCurrentDate).add(3, 'hours');
  arrivalTimeList = [];
  arrivalTimeListBackup = [];
  deliveryMethodList = [];
  packagingList = [];
  cashierList: { userId: number, firstname: string, lastname: string, username: string }[] = [];
  addressList = [];
  id = null;
  reservedDateFrom: moment.Moment = null;
  reservedDateTo: moment.Moment = null;
  isChangeBookingMode = false;
  currentIndex = 0;
  stepList: any = [];
  backup: any = {};
  enableDateList = {};
  currentEditHN = '';
  maxProductionLine = 0;
  timeZeroMoment = { h: 0, m: 0, s: 0, ms: 0 };
  timeEndDayMoment = { h: 23, m: 59, s: 59, ms: 59 };
  productionTimeHour = [];
  timeBeforeProdStart = 0;
  productionEnd = '';
  calProductionTime: moment.Moment = null;
  dateFrom = null;
  dateTo = null;
  itemCount = 0;
  disableDateList = {};
  oldBooking: any;
  showScheduler = false;
  initialArrivalTime = '';
  initialDeliveryDate = '';
  schedulerInstance: any;
  remarkMsg: any = [];
  configList: any = {};
  rawMaterialList = [];
  orderCompound = [];

  constructor(public router: Router,
    private fb: FormBuilder,
    private request: Request,
    public common: Common,
    private compare: CompareService,
    private route: ActivatedRoute,
    private store: StoreService) {
    this.patientInfoForm = this.fb.group({
      'txtHn': new FormControl({ value: '', disabled: true }),
      'txtPatientName': new FormControl({ value: '', disabled: true }),
      'txtPhone': new FormControl({ value: '', disabled: true }),
      'txtAddress': new FormControl({ value: '', disabled: true }),
      'txtDistrictProvince': new FormControl({ value: '', disabled: true }),
      'txtPostcode': new FormControl({ value: '', disabled: true }),
      'txtContactPerson': new FormControl({ value: '', disabled: true }),
      'ddlItem': new FormControl({ value: null, disabled: true }, [Validators.required]),
    });
    this.supplementDetailForm = this.fb.group({
      'txtConfirmedDays': new FormControl({ value: '', disabled: true }),
      'txtSlotNo': new FormControl({ value: '', disabled: true }),
      'txtProductionEndDate': new FormControl({ value: '', disabled: true }),
      'txtProductionEndTime': new FormControl({ value: '', disabled: true }),
      'txtProductionHour': new FormControl({ value: '', disabled: true }),
      'txtStartDateTime': new FormControl({ value: '', disabled: true }),
      'txtAdditionalNote': new FormControl({ value: '', disabled: false }),
    });
    this.deliveryDetailForm = this.fb.group({ 'deliveryDetail': this.fb.array([]) });
  }

  get deliveryForm(): FormArray {
    return this.deliveryDetailForm.controls['deliveryDetail'] as FormArray;
  }

  async ngOnInit() {
    try {
      const id = this.route.snapshot.paramMap.get('id');
      const action = this.route.snapshot.paramMap.get('action');
      this.id = +id;
      if (action === 'edit') {
        this.isChangeBookingMode = true;
      }
      const dropdown = await this.common.searchConfig();
      this.configList = dropdown;
      this.patientItemList = dropdown.patientItemList || [];
      // this.arrivalTimeList = dropdown.arrivalTimeList || [];
      this.arrivalTimeListBackup = dropdown.arrivalTimeList || [];
      this.packagingList = dropdown.packagingList || [];
      this.deliveryMethodList = dropdown.deliveryMethodList || [];
      this.searchDdlCashier();
      this.store.subscribePagePermissionList().subscribe(pagePermissionList => {
        console.log('ngOnInit', pagePermissionList);
        const pagePermission = pagePermissionList.find(r => r.url === environment.roleURL.cashierView);
        if (pagePermission) {
          try {
            this.menuPermissions = JSON.parse(pagePermission.menuPermissions);
            console.log(this.menuPermissions);
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

      let cashierId = null;
      this.store.subscribeUser().subscribe(data => {
        // this.username = data.username;
        console.log('data.username', data.username);
        const findCashier = this.cashierList.find((obj) => {
          return obj.username.toLowerCase() === data.username.toLowerCase();
        });
        console.log('findCashier', findCashier);
        if (findCashier) {
          cashierId = findCashier.userId;
        }
      });
      const oldBooking = localStorage.getItem('oldBookingSplitProduction');
      if (oldBooking) {
        this.oldBooking = JSON.parse(oldBooking);
      }
      const splitProductionList = localStorage.getItem('splitProductionList');
      if (splitProductionList) {
        const splitProductionListJSON = JSON.parse(splitProductionList);
        for (let i = 0; i < splitProductionListJSON.length; i++) {
          this.itemCount = splitProductionListJSON[0].itemCount || 0;
          // คำนวณ suggest date สำหรับแสดงใต้ text Production x
          let suggestDate = splitProductionListJSON[i].booking.productionStartDate;
          if (!moment(suggestDate, 'DD/MM/YYYY').isValid()) {
            suggestDate = moment(suggestDate).format('DD/MM/YYYY');
          }
          this.stepList.push({
            title: `Production ${i + 1}`,
            suggestDate: `Suggest date : ${suggestDate}`,
            isCompleted: i === 0,
            data: splitProductionListJSON[i]
          });
        }

        // เก็บค่า arrival time สำหรับแสดงใน Note ใต้ delivery date
        const findArrivalTime = this.arrivalTimeListBackup.find(obj => obj.id === splitProductionListJSON[0].deliveryDetail.arrivalTime);
        if (findArrivalTime) {
          this.initialArrivalTime = findArrivalTime.name;
        }
        this.initialDeliveryDate = moment(splitProductionListJSON[0].deliveryDetail.deliveryDate, 'DD-MM-YYYY').format('DD/MM/YYYY');
        console.log('this.stepList', this.stepList);
        this.fnSetPatientInfo(splitProductionListJSON[0].patientInfo);
        if (this.oldBooking) {
          this.patientInfo.supplyDay = this.stepList[0].data.supplyDay;
          this.currentDate = moment(this.oldBooking.start).toDate();
        } else {
          const data = _.cloneDeep(this.stepList[0]);
          this.patientInfo.supplyDay = data.data.supplyDay;
          if (moment(data.data.booking.productionStartDate, 'DD/MM/YYYY HH:mm', true).isValid()) {
            this.currentDate = moment(data.data.booking.productionStartDate, 'DD/MM/YYYY HH:mm', true).toDate();
          } else {
            this.currentDate = moment(data.data.booking.productionStartDate).toDate();
          }
        }
        for (let index = 0; index < this.stepList.length; index++) {
          const data = this.stepList[index].data;
          const deliveryDetail = data.deliveryDetail;
          const district = deliveryDetail.district ? `เขต/อำเภอ${deliveryDetail.district} ` : '';
          const province = deliveryDetail.province ? `จังหวัด${deliveryDetail.province} ` : '';
          this.deliveryDetail.push({
            deliveryDetailId: null,
            recipientName: deliveryDetail.recipientName || '',
            phone: deliveryDetail.phone || '',
            patientAddressId: deliveryDetail.patientAddressId || null,
            address: deliveryDetail.address || '',
            district: deliveryDetail.district || '',
            addressDetail: deliveryDetail.address || '',
            districtProvince: `${district}${province}`,
            postcode: deliveryDetail.postcode || '',
            deliveryDate: deliveryDetail.deliveryDate ? moment(deliveryDetail.deliveryDate, 'DD-MM-YYYY').toDate() : null,
            arrivalTime: deliveryDetail.arrivalTime || null,
            arrivalTimeList: dropdown.arrivalTimeList || [],
            deliveryMethod: deliveryDetail.deliveryMethod || null,
            deliveryMethodOther: deliveryDetail.deliveryMethodOther || '',
            packaging: deliveryDetail.packaging || null,
            subdistrict: deliveryDetail.subdistrict || '',
            province: deliveryDetail.province || '',
            isInvoice: deliveryDetail.isInvoice,
            isReceipt: deliveryDetail.isReceipt,
            cashierId: deliveryDetail.cashierId || cashierId,
            isUrgent: deliveryDetail.isUrgent,
            cashierDeliNote: deliveryDetail.cashierDeliNote || '',
          });
          this.deliveryForm.push(this.fb.group({
            'txtDeliveryRecipientName': new FormControl({ value: '', disabled: false }, [Validators.required]),
            'txtDeliveryPhone': new FormControl({ value: '', disabled: false }, [Validators.required]),
            'ddlDeliveryAddress': new FormControl({ value: '', disabled: false }, [Validators.required]),
            'txtDeliveryAddressDetail': new FormControl({ value: '', disabled: true }),
            'txtDeliveryDistrictProvince': new FormControl({ value: '', disabled: true }),
            'txtDeliveryPostcode': new FormControl({ value: '', disabled: true }),
            'txtDeliveryDate': new FormControl({ value: '', disabled: false }, [Validators.required]),
            'ddlDeliveryArrivalTime': new FormControl({ value: '', disabled: false }, [Validators.required]),
            'ddlDeliveryMethod': new FormControl({ value: '', disabled: false }, [Validators.required]),
            'txtDeliveryMethodOther': new FormControl({ value: '', disabled: false }),
            'ddlDeliveryPackaging': new FormControl({ value: null, disabled: false }, [Validators.required]),
            'cbxDeliveryDocumentationInvoice': new FormControl({ value: '', disabled: false }),
            'cbxDeliveryDocumentationReceipt': new FormControl({ value: '', disabled: false }),
            'ddlDeliveryCashierName': new FormControl({ value: '', disabled: true }, [Validators.required]),
            'cbxDeliveryIsUrgent': new FormControl({ value: '', disabled: false }),
            'txtDeliveryCashierDeliNote': new FormControl({ value: '', disabled: false }),
          }));
          setTimeout(() => {
            this.onClickDeliveryDetailAddress(index);
          }, 1000);
        }

        console.log(this.deliveryForm);

      }
      // เอาไว้คำนวณ bbf, mfg, cpdExp
      const rawMaterialList = localStorage.getItem('rawMaterialList');
      if (rawMaterialList) {
        const rawMaterialListJSON = JSON.parse(rawMaterialList);
        this.rawMaterialList = rawMaterialListJSON || [];
      }
      const orderCompound = localStorage.getItem('orderCompound');
      if (orderCompound) {
        const orderCompoundJSON = JSON.parse(orderCompound);
        this.orderCompound = orderCompoundJSON || [];
      }

      console.log('this.currentDate', this.currentDate);
      const dateFrom = moment(this.currentDate).day(0).toDate();
      const dateTo = moment(this.currentDate).day(6).toDate();
      this.dateFrom = dateFrom;
      this.dateTo = dateTo;
      console.log('dateForm', dateFrom);
      console.log('dateTo', dateTo);
      await this.searchProductionTime();
      await this.searchBookingCalendar(dateFrom, dateTo);
      await this.searchAllBooking(dateFrom, dateTo);
      if (oldBooking) {
        console.log('fnCalReserveOldBooking');
        this.fnCalReserveOldBooking();
      } else {
        console.log('fnCalReserveTime');
        this.fnCalReserveTime();
      }
      this.showScheduler = true;
    } catch (e) {
      console.log(e);
    }
  }

  goHomeMenu() {
    if (this.menuHome) {
      this.router.navigate(['/menu', this.menuHome['menuId'], this.menuHome['typePage']]);
    }
  }

  async ngAfterViewInit() {
    try {
      this.loading = false;
      this.disbledBtn = {
        'save': false,
        'cancel': false
      };
      await this.checkGroupPermission();
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

  fnCheckPatientInfoForm() {
    console.log(this.patientInfoForm.controls, this.patientInfoForm, this.patientInfoForm.valid);
    for (const key in this.patientInfoForm.controls) {
      if (this.patientInfoForm.controls[key].errors) {
        this.patientInfoForm.controls[key].setErrors({ 'forceRequired': true });
        this.patientInfoForm.controls[key].markAsDirty();
      } else {
        this.patientInfoForm.controls[key].updateValueAndValidity();
      }
    }

    return this.patientInfoForm.valid;
  }

  fnCheckDeliveryDetailForm(index: number) {
    const item: any = this.deliveryForm.controls[index];

    // check deliveryMethod
    if (+this.deliveryDetail[index].deliveryMethod === 6) {
      item.controls['txtDeliveryMethodOther'].setValidators(Validators.required);
    } else {
      item.controls['txtDeliveryMethodOther'].setValidators(null);
    }
    item.controls['txtDeliveryMethodOther'].updateValueAndValidity();

    // start validate
    let isValidSelect = true;
    Object.keys(item.controls).forEach((control: any) => {
      const Control: AbstractControl = item.controls[control];
      if ((control === 'ddlDeliveryArrivalTime' && Control.value === 'null') ||
        (control === 'ddlDeliveryMethod' && Control.value === 'null') ||
        (control === 'ddlDeliveryPackaging' && Control.value === 'null')) {
        Control.setErrors({ 'forceRequired': true });
        Control.markAsDirty();
        isValidSelect = false;
      } else {
        if (Control.invalid) {
          Control.setErrors({ 'forceRequired': true });
          Control.markAsDirty();
        } else {
          Control.updateValueAndValidity();
        }
      }
    });
    return this.deliveryForm.controls[index].valid && isValidSelect;
  }

  fnCalExpDate(data) {
    try {
      data.cpdExp = this.cpdExpValue(data);
      data.bbf = this.bbfValue(data);
      return data;
    } catch (error) {
      console.log('fnCalExpDate error', error);
      return data;
    }
  }

  bbfValue(data) {
    const cpdExp = this.cpdExpValue(data);
    if (cpdExp === 'N/A' || cpdExp === 'RM > 1 Year') {
      return moment(data.booking.productionEndDate).add(1, 'years').format('DD/MM/YYYY');
    }
    return cpdExp;
  }

  cpdExpValue(data) {
    // - เคส ถ้าไม่มี compounded ให้แสดง Cpd. Exp. เป็น N/A
    if (!this.orderCompound || this.orderCompound.length === 0) {
      return 'N/A';
    }
    console.log('this.configList', this.configList.formula, this.orderCompound);
    const vivapurCode = this.configList.formula ? this.configList.formula.vivapurCode : '';


    const rawMaterialList = _.cloneDeep(this.rawMaterialList);
    let orderCompound = _.cloneDeep(this.orderCompound);
    orderCompound = orderCompound.filter(r => r.rawMaterialName !== 'Vivapur' || r.rawMaterialCode != vivapurCode);
    console.log('orderCompound>', orderCompound, vivapurCode);
    // tslint:disable-next-line:forin
    for (const key in orderCompound) {
      const rawMaterial = rawMaterialList.find(r => r.code === orderCompound[key].rawMaterialCode);
      orderCompound[key].rawMaterialData = rawMaterial ? rawMaterial : false;
      orderCompound[key].diff = 0;
      if (rawMaterial) {
        const now = moment(rawMaterial.expiryDate, 'YYYY-MM-DD'); // today date
        const end = moment(new Date()); // another date
        const duration = moment.duration(now.diff(end));
        const days = duration.asDays();
        orderCompound[key].diff = duration.asDays();
      }
    }
    console.log('orderCompound', orderCompound);

    // tslint:disable-next-line:max-line-length
    // - เคส ถ้ามี compounded mfg (dd/mm/yyyy) - expiryDate RM (dd/mm/yyyy)) >= 12 เดือน && (mfg (dd/mm/yyyy) - expiryDate RM (dd/mm/yyyy) // ลบเป็นวันไม่สนเดือนและปี) > 0 วัน ) ให้แสดง Cpd. Exp. เป็น RM > 1 Year
    orderCompound.sort((a, b) => b.diff - a.diff);
    if (orderCompound.length && orderCompound[0].rawMaterialData) {
      const now = moment(data.booking.productionEndDate);
      const end = moment(orderCompound[orderCompound.length - 1].rawMaterialData.expiryDate, 'YYYY-MM-DD');
      const month = moment(end).diff(now, 'months', true);
      console.log('orderCompound', data.booking.productionEndDate, orderCompound[0].rawMaterialData.expiryDate, month);
      if (month >= 12) {
        return 'RM > 1 Year';
      } else {
        return end.format('DD/MM/YYYY');
      }
    }

    // else ให้แสดง Cpd. Exp. set as mfg (dd/mm/yyyy)
    return data.booking.productionEndDate;
  }

  async fnSave() {
    try {
      // const validPatientInfoForm: boolean = this.fnCheckPatientInfoForm();
      const validPatientInfoForm: boolean = !!this.patientInfo.item;
      const validDeliveryDetailForm: boolean = this.fnCheckDeliveryDetailForm(this.currentIndex);

      const findBookingData = this.appointmentsData.find((obj) => {
        return obj.text === '';
      });
      console.log('findBookingData', findBookingData);
      const isUnavailableSlot = this.fnCheckUnavailableSlot();
      console.log('isUnavailableSlot', isUnavailableSlot);
      if (validPatientInfoForm && validDeliveryDetailForm && findBookingData && !isUnavailableSlot) {
        let checkUrl = null;
        let response: any;
        const addData = [];
        for (let index = 0; index < this.stepList.length; index++) {
          let data = _.cloneDeep(this.stepList[index].data);
          // remove unused
          delete data.itemCount;

          // update booking
          if (this.stepList.length === 1 || (this.currentIndex === this.stepList.length - 1 && index === this.stepList.length - 1)) {
            const confirmedDay = +this.supplementDetail.confirmedDays;
            const slotNo = +this.supplementDetail.slotNo;
            const productionStartDate = moment(this.supplementDetail.startDateTime, 'DD/MM/YYYY HH:mm:ss').format('YYYY-MM-DD');
            const productionStartTime = moment(this.supplementDetail.startDateTime, 'DD/MM/YYYY HH:mm:ss').format('HH:mm');
            const productionEndDate = moment(this.supplementDetail.productionEndDate, 'DD/MM/YYYY', true).format('YYYY-MM-DD');
            data.mfg = productionEndDate;
            const productionEndTime = this.supplementDetail.productionEndTime;
            const stdProductionHour = +this.supplementDetail.stdProductionHour;
            const cashierSupNote = this.supplementDetail.additionalNote;
            data.booking = {
              confirmedDay,
              slotNo,
              productionStartDate,
              productionStartTime,
              productionEndDate,
              productionEndTime,
              stdProductionHour,
              cashierSupNote
            };
          } else {
            const confirmedDay = data.booking.confirmedDay;
            const slotNo = data.booking.slotNo;
            const productionStartDate = moment(data.booking.startDateTime, 'DD/MM/YYYY HH:mm:ss').format('YYYY-MM-DD');
            const productionStartTime = moment(data.booking.startDateTime, 'DD/MM/YYYY HH:mm:ss').format('HH:mm');
            const productionEndDate = moment(data.booking.productionEndDate, 'DD/MM/YYYY', true).format('YYYY-MM-DD');
            const productionEndTime = data.booking.productionEndTime;
            const stdProductionHour = data.booking.stdProductionHour;
            const cashierSupNote = data.booking.cashierSupNote || data.booking.additionalNote;
            data.booking = {
              confirmedDay,
              slotNo,
              productionStartDate,
              productionStartTime,
              productionEndDate,
              productionEndTime,
              stdProductionHour,
              cashierSupNote
            };
          }

          if (index === 0) {
            if (data.splitProdReason) {
              data.oldProdDate = moment(data.booking.startDateTime, 'DD/MM/YYYY HH:mm:ss').format('YYYY-MM-DD');
              data.booking.splitProdReason = data.splitProdReason;
            }
          }

          delete this.deliveryDetail[index].districtProvince;

          data.deliveryDetail = this.deliveryDetail[index];
          data.deliveryDetail.isInvoice = data.deliveryDetail.isInvoice ? 1 : 0;
          data.deliveryDetail.isReceipt = data.deliveryDetail.isReceipt ? 1 : 0;
          data.deliveryDetail.isUrgent = data.deliveryDetail.isUrgent ? 1 : 0;


          // update patientInfo
          const item = data.patientInfo.item;
          data.patientInfo = { item };

          data = this.fnCalExpDate(data);
          addData.push(data);
        }
        console.log('addData', addData);

        checkUrl = this.common.checkMockupUrl('', GlobalVariable.RESOURCE, {}, {
          BASE_API: GlobalVariable.BASE_API,
          BASE_MODULE: GlobalVariable.BASE_MODULE,
          BASE_RESOURCE: GlobalVariable.BASE_RESOURCE + GlobalVariable.BASE_RESOURCE_CREATE
        });

        const resultCodeSuccess = environment.resultCodeSuccess;
        response = await this.request.post(checkUrl.url, addData);
        if (response.resultCode === resultCodeSuccess) {
          this.goAlert('', '', 'myModalSuccess');
        } else {
          console.log('error');
          this.goAlert(response.resultCode, response.resultDescription, 'myModalError');
        }
      } else {
        if (isUnavailableSlot) {
          // tslint:disable-next-line:max-line-length
          this.goAlert('This time slot is unavailable for booking', 'Please check that the time slot you have chosen are available.', 'myModalWarning');
        } else {
          console.log('กรุณากรอกข้อมูลให้ถูกต้อง');
          this.goAlert('Field is required', 'Your have left a field empty and a value must be entered.', 'myModalWarning');
        }
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

  goAlert(userTitle, userMessage, modalId, data?) {
    const dataAlert: any = {
      'modalId': modalId,
      'userTitle': userTitle,
      'userMessage': userMessage
    };
    if (data) {
      dataAlert.data = data;
    }
    this.myModal.openModal(dataAlert);
  }

  numberOnly(event): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;
    console.log(charCode);
    if (charCode === 46) {
      return true;
    } else if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }

  onClickBack() {
    try {
      localStorage.removeItem('rawMaterialList');
      localStorage.removeItem('orderCompound');
      localStorage.removeItem('splitProductionList');
      localStorage.removeItem('oldBookingSplitProduction');
    } catch (error) {
      // continue
    }
    this.router.navigate(['/order-management', 'orders-pharmacist-view']);
  }

  onCloseModalError() {
    this.disbledBtn = {
      'save': false,
      'cancel': false
    };
  }

  onCloseModalWarning() {
    this.disbledBtn = {
      'save': false,
      'cancel': false
    };
  }

  textAreaAutoHeight() {
    const textAreaAutoHeight = this.common.textAreaAutoHeightFn();
  }

  is3Hours(date: Date) {
    const localeDate = moment(date);
    return localeDate <= this.currentDateWith3Hr;
  }

  isReservedDate(data: any) {
    if (this.reservedDateFrom && this.reservedDateTo && !this.isDisableDate(data.startDate)) {
      const slot = data.groups ? data.groups.priorityId : data.priorityId;
      const currentDate = moment(data.startDate);
      if (slot) {
        return currentDate >= this.reservedDateFrom && currentDate <= this.reservedDateTo && slot === 1;
      } else {
        return currentDate >= this.reservedDateFrom && currentDate <= this.reservedDateTo;
      }
    } else {
      return false;
    }
  }

  fnUrgentRequest() {
    this.goAlert('Are you sure', 'You want to send urgent order request ?', 'myModalUrgentRequest');
  }

  onConfirmUrgentRequest(e) {
    console.log('onConfirmUrgentRequest', e);
  }

  onClickOk() {

  }

  fnCheckValidSupplement() {
    if (!this.supplementDetail.confirmedDays) {
      return false;
    }
    if (!this.supplementDetail.slotNo) {
      return false;
    }
    if (!this.supplementDetail.startDateTime) {
      return false;
    }
    if (!this.supplementDetail.productionEndDate) {
      return false;
    }
    if (!this.supplementDetail.productionEndTime) {
      return false;
    }
    if (!this.supplementDetail.stdProductionHour) {
      return false;
    }
    return true;
  }

  onClickStep(step) {
    console.log('step', step);
    const validDeliveryDetailForm: boolean = this.fnCheckDeliveryDetailForm(this.currentIndex);
    const validSupplement = this.fnCheckValidSupplement();
    if (!validDeliveryDetailForm || !validSupplement) {
      console.log('กรุณากรอกข้อมูลให้ถูกต้อง');
      this.goAlert('Field is required', 'Your have left a field empty and a value must be entered.', 'myModalWarning');
      this.disbledBtn = {
        'save': false,
        'cancel': false
      };
      return;
    }

    // save current step
    this.stepList[this.currentIndex].data.booking.confirmedDays = _.cloneDeep(this.supplementDetail.confirmedDays);
    this.stepList[this.currentIndex].data.booking.slotNo = _.cloneDeep(this.supplementDetail.slotNo);
    this.stepList[this.currentIndex].data.booking.productionEndDate = _.cloneDeep(this.supplementDetail.productionEndDate);
    this.stepList[this.currentIndex].data.booking.productionEndTime = _.cloneDeep(this.supplementDetail.productionEndTime);
    this.stepList[this.currentIndex].data.booking.stdProductionHour = _.cloneDeep(this.supplementDetail.stdProductionHour);
    this.stepList[this.currentIndex].data.booking.startDateTime = _.cloneDeep(this.supplementDetail.startDateTime);
    this.stepList[this.currentIndex].data.booking.additionalNote = _.cloneDeep(this.supplementDetail.additionalNote);
    this.stepList[this.currentIndex].data.deliveryDetail.recipientName = _.cloneDeep(this.deliveryDetail[this.currentIndex].recipientName);
    this.stepList[this.currentIndex].data.deliveryDetail.phone = _.cloneDeep(this.deliveryDetail[this.currentIndex].phone);
    this.stepList[this.currentIndex].data.deliveryDetail.address = _.cloneDeep(this.deliveryDetail[this.currentIndex].address);
    this.stepList[this.currentIndex].data.deliveryDetail.addressDetail = _.cloneDeep(this.deliveryDetail[this.currentIndex].addressDetail);
    // tslint:disable-next-line:max-line-length
    this.stepList[this.currentIndex].data.deliveryDetail.districtProvince = _.cloneDeep(this.deliveryDetail[this.currentIndex].districtProvince);
    this.stepList[this.currentIndex].data.deliveryDetail.postcode = _.cloneDeep(this.deliveryDetail[this.currentIndex].postcode);
    this.stepList[this.currentIndex].data.deliveryDetail.deliveryDate = _.cloneDeep(this.deliveryDetail[this.currentIndex].deliveryDate);
    this.stepList[this.currentIndex].data.deliveryDetail.arrivalTime = _.cloneDeep(this.deliveryDetail[this.currentIndex].arrivalTime);
    // tslint:disable-next-line:max-line-length
    this.stepList[this.currentIndex].data.deliveryDetail.deliveryMethod = _.cloneDeep(this.deliveryDetail[this.currentIndex].deliveryMethod);
    this.stepList[this.currentIndex].data.deliveryDetail.packaging = _.cloneDeep(this.deliveryDetail[this.currentIndex].packaging);
    this.stepList[this.currentIndex].data.deliveryDetail.isInvoice = _.cloneDeep(this.deliveryDetail[this.currentIndex].isInvoice);
    this.stepList[this.currentIndex].data.deliveryDetail.isReceipt = _.cloneDeep(this.deliveryDetail[this.currentIndex].isReceipt);
    this.stepList[this.currentIndex].data.deliveryDetail.cashierId = _.cloneDeep(this.deliveryDetail[this.currentIndex].cashierId);
    this.stepList[this.currentIndex].data.deliveryDetail.isUrgent = _.cloneDeep(this.deliveryDetail[this.currentIndex].isUrgent);
    // tslint:disable-next-line:max-line-length
    this.stepList[this.currentIndex].data.deliveryDetail.cashierDeliNote = _.cloneDeep(this.deliveryDetail[this.currentIndex].cashierDeliNote);
    // end save current step

    if (this.stepList[step].isCompleted && this.currentIndex !== step) {
      for (let i = 0; i < this.appointmentsData.length; i++) {
        const appointmentsData = _.cloneDeep(this.appointmentsData[i]);
        if (this.appointmentsData[i].data.index === step) {
          // this.appointmentsData[i].text = '';
          // this.appointmentsData[i].data.hn = this.patientInfo.hn;
          // this.appointmentsData[i].data.name = this.patientInfo.patientName;
          // this.appointmentsData[i].data.index = step;
          appointmentsData.text = '';
          appointmentsData.data.hn = this.patientInfo.hn;
          appointmentsData.data.name = this.patientInfo.patientName;
          appointmentsData.data.index = step;
          this.schedulerInstance.updateAppointment(this.appointmentsData[i], appointmentsData);
        } else if (this.appointmentsData[i].text === '') {
          // this.appointmentsData[i].text = `HN :\n${this.patientInfo.hn}`;
          // this.appointmentsData[i].data.hn = this.patientInfo.hn;
          // this.appointmentsData[i].data.name = this.patientInfo.patientName;
          appointmentsData.text = `HN :\n${this.patientInfo.hn}`;
          appointmentsData.data.hn = this.patientInfo.hn;
          appointmentsData.data.name = this.patientInfo.patientName;
          this.schedulerInstance.updateAppointment(this.appointmentsData[i], appointmentsData);
        }
        this.appointmentsData[i] = appointmentsData;
      }


      // this.appointmentsData = this.appointmentsData.filter(obj => {
      //   if (obj.data.index === step) {
      //     obj.text = '';
      //     obj.data.hn = this.patientInfo.hn;
      //     obj.data.name = this.patientInfo.patientName;
      //     obj.data.index = step;
      //   } else if (obj.text === '') {
      //     obj.text = `HN :\n${this.patientInfo.hn}`;
      //     obj.data.hn = this.patientInfo.hn;
      //     obj.data.name = this.patientInfo.patientName;
      //   }
      //   return obj;
      // });

      // patientInfo
      const patientInfo = _.cloneDeep(this.stepList[step].data.patientInfo);
      this.patientInfo.item = patientInfo.item;
      // tslint:disable-next-line:max-line-length
      this.patientInfo.address = this.patientInfo.address + ' ' + (this.patientInfo.subdistrict ? `แขวง/ตำบล${this.patientInfo.subdistrict}` : '');
      // supplementDetail
      const supplementDetail = _.cloneDeep(this.stepList[step].data.booking);
      this.supplementDetail.additionalNote = _.cloneDeep(supplementDetail.additionalNote);
      console.log('onClickStep supplementDetail start', supplementDetail);
      supplementDetail.confirmedDays = this.supplementDetail.confirmedDays;
      supplementDetail.slotNo = this.supplementDetail.slotNo;
      supplementDetail.productionEndDate = this.supplementDetail.productionEndDate;
      supplementDetail.productionEndTime = this.supplementDetail.productionEndTime;
      supplementDetail.stdProductionHour = this.supplementDetail.stdProductionHour;
      supplementDetail.startDateTime = this.supplementDetail.startDateTime;
      supplementDetail.additionalNote = this.supplementDetail.additionalNote;
      console.log('onClickStep supplementDetail end', supplementDetail);
      // deliveryDetail
      const deliveryDetail = _.cloneDeep(this.stepList[step].data.deliveryDetail);
      this.deliveryDetail[step].recipientName = deliveryDetail.recipientName;
      this.deliveryDetail[step].phone = deliveryDetail.phone;
      this.deliveryDetail[step].address = deliveryDetail.address;
      this.deliveryDetail[step].addressDetail = deliveryDetail.addressDetail;
      this.deliveryDetail[step].districtProvince = deliveryDetail.districtProvince;
      this.deliveryDetail[step].postcode = deliveryDetail.postcode;
      this.deliveryDetail[step].deliveryDate = deliveryDetail.deliveryDate;
      this.deliveryDetail[step].arrivalTime = deliveryDetail.arrivalTime;
      this.deliveryDetail[step].deliveryMethod = deliveryDetail.deliveryMethod;
      this.deliveryDetail[step].packaging = deliveryDetail.packaging;
      this.deliveryDetail[step].isInvoice = deliveryDetail.isInvoice;
      this.deliveryDetail[step].isReceipt = deliveryDetail.isReceipt;
      this.deliveryDetail[step].cashierId = deliveryDetail.cashierId;
      this.deliveryDetail[step].isUrgent = deliveryDetail.isUrgent;
      this.deliveryDetail[step].cashierDeliNote = deliveryDetail.cashierDeliNote;

      this.fnSetSchedulerData(this.stepList[step]);
      this.currentIndex = step;
      console.log('this.stepList', this.stepList);
    }
  }

  onClickNext() {
    if (this.stepList[this.currentIndex + 1] && this.stepList[this.currentIndex + 1].isCompleted) {
      this.onClickStep(this.currentIndex + 1);
      return;
    }

    // const validPatientInfoForm: boolean = this.fnCheckPatientInfoForm();
    const validPatientInfoForm: boolean = !!this.patientInfo.item;
    const validDeliveryDetailForm: boolean = this.fnCheckDeliveryDetailForm(this.currentIndex);

    const findBookingData = this.appointmentsData.find((obj) => {
      return obj.text === '';
    });
    // console.log('findBookingData', findBookingData);

    if (validPatientInfoForm && validDeliveryDetailForm && findBookingData) {

      const i = this.currentIndex;

      // supplementDetail
      this.stepList[i].data.booking.confirmedDays = _.cloneDeep(this.supplementDetail.confirmedDays);
      this.stepList[i].data.booking.slotNo = _.cloneDeep(this.supplementDetail.slotNo);
      this.stepList[i].data.booking.productionEndDate = _.cloneDeep(this.supplementDetail.productionEndDate);
      this.stepList[i].data.booking.productionEndTime = _.cloneDeep(this.supplementDetail.productionEndTime);
      this.stepList[i].data.booking.stdProductionHour = _.cloneDeep(this.supplementDetail.stdProductionHour);
      this.stepList[i].data.booking.startDateTime = _.cloneDeep(this.supplementDetail.startDateTime);
      this.stepList[i].data.booking.additionalNote = _.cloneDeep(this.supplementDetail.additionalNote);
      this.supplementDetail.additionalNote = '';

      // deliveryDetail
      console.log('onClickNext i', i);
      this.stepList[i].data.deliveryDetail.recipientName = _.cloneDeep(this.deliveryDetail[i].recipientName);
      this.stepList[i].data.deliveryDetail.phone = _.cloneDeep(this.deliveryDetail[i].phone);
      this.stepList[i].data.deliveryDetail.address = _.cloneDeep(this.deliveryDetail[i].address);
      this.stepList[i].data.deliveryDetail.addressDetail = _.cloneDeep(this.deliveryDetail[i].addressDetail);
      this.stepList[i].data.deliveryDetail.districtProvince = _.cloneDeep(this.deliveryDetail[i].districtProvince);
      this.stepList[i].data.deliveryDetail.postcode = _.cloneDeep(this.deliveryDetail[i].postcode);
      this.stepList[i].data.deliveryDetail.deliveryDate = _.cloneDeep(this.deliveryDetail[i].deliveryDate);
      this.stepList[i].data.deliveryDetail.arrivalTime = _.cloneDeep(this.deliveryDetail[i].arrivalTime);
      this.stepList[i].data.deliveryDetail.deliveryMethod = _.cloneDeep(this.deliveryDetail[i].deliveryMethod);
      this.stepList[i].data.deliveryDetail.packaging = _.cloneDeep(this.deliveryDetail[i].packaging);
      this.stepList[i].data.deliveryDetail.isInvoice = _.cloneDeep(this.deliveryDetail[i].isInvoice);
      this.stepList[i].data.deliveryDetail.isReceipt = _.cloneDeep(this.deliveryDetail[i].isReceipt);
      this.stepList[i].data.deliveryDetail.cashierId = _.cloneDeep(this.deliveryDetail[i].cashierId);
      this.stepList[i].data.deliveryDetail.isUrgent = _.cloneDeep(this.deliveryDetail[i].isUrgent);
      this.stepList[i].data.deliveryDetail.cashierDeliNote = _.cloneDeep(this.deliveryDetail[i].cashierDeliNote);
      console.log('this.stepList[i].data.deliveryDetail ' + i, this.stepList[i].data.deliveryDetail);
      console.log('this.deliveryDetail[i] ' + i, this.deliveryDetail[i]);

      for (let j = 0; j < this.appointmentsData.length; j++) {
        if (this.appointmentsData[j].text === '') {
          const appointmentsData = _.cloneDeep(this.appointmentsData[j]);
          appointmentsData.text = `HN :\n${this.patientInfo.hn}`;
          appointmentsData.data.hn = this.patientInfo.hn;
          appointmentsData.data.name = this.patientInfo.patientName;
          appointmentsData.data.index = i;
          this.schedulerInstance.updateAppointment(this.appointmentsData[j], appointmentsData);
          // this.appointmentsData[j].text = `HN :\n${this.patientInfo.hn}`;
          // this.appointmentsData[j].data.hn = this.patientInfo.hn;
          // this.appointmentsData[j].data.name = this.patientInfo.patientName;
          // this.appointmentsData[j].data.index = i;
        }
      }

      // ถ้าไม่ใช production สุดท้าย
      if (this.currentIndex < this.stepList.length - 1) {
        this.currentIndex = i + 1;
        // tslint:disable-next-line:max-line-length
        console.log('this.stepList[this.currentIndex].data.booking', this.stepList[this.currentIndex].data.booking);
        if (this.stepList[this.currentIndex].data.booking.productionStartDate) {
          const data = _.cloneDeep(this.stepList[this.currentIndex]);
          this.patientInfo.supplyDay = data.data.supplyDay;
          if (moment(data.data.booking.productionStartDate, 'DD/MM/YYYY HH:mm', true).isValid()) {
            this.currentDate = moment(data.data.booking.productionStartDate, 'DD/MM/YYYY HH:mm', true).toDate();
          } else {
            this.currentDate = moment(data.data.booking.productionStartDate).toDate();
          }
          this.stepList[this.currentIndex].isCompleted = true;
        } else {
          this.patientInfo.supplyDay = this.stepList[i + 1].data.supplyDay;
          const tmpDate = moment().toDate();
          if (moment(this.currentDate).format('YYYYMMDD') === moment(tmpDate).format('YYYYMMDD')) {
            console.log('this.appointmentsData', this.appointmentsData);
            this.fnSetSupplementDetail({});
            this.fnCalReserveTime();
          } else {
            this.currentDate = tmpDate;
          }
          this.stepList[this.currentIndex].isCompleted = true;
        }

        setTimeout(() => {
          this.stepList[i + 1].data.booking.confirmedDays = _.cloneDeep(this.supplementDetail.confirmedDays);
          this.stepList[i + 1].data.booking.slotNo = _.cloneDeep(this.supplementDetail.slotNo);
          this.stepList[i + 1].data.booking.productionEndDate = _.cloneDeep(this.supplementDetail.productionEndDate);
          this.stepList[i + 1].data.booking.productionEndTime = _.cloneDeep(this.supplementDetail.productionEndTime);
          this.stepList[i + 1].data.booking.stdProductionHour = _.cloneDeep(this.supplementDetail.stdProductionHour);
          this.stepList[i + 1].data.booking.startDateTime = _.cloneDeep(this.supplementDetail.startDateTime);
          this.stepList[i + 1].data.booking.additionalNote = _.cloneDeep(this.supplementDetail.additionalNote);
          console.log('onClickNext this.stepList[i].data.booking', _.cloneDeep(this.stepList[i].data.booking));
        }, 500);
      }
    } else {
      console.log('กรุณากรอกข้อมูลให้ถูกต้อง');
      this.goAlert('Field is required', 'Your have left a field empty and a value must be entered.', 'myModalWarning');
      this.disbledBtn = {
        'save': false,
        'cancel': false
      };
    }
    console.log('this.stepList', this.stepList);
  }

  fnSetSchedulerData(data) {
    console.log('fnSetSchedulerData data', data);
    this.patientInfo.supplyDay = data.data.supplyDay;
    let tmpDate;
    if (moment(data.data.booking.startDateTime, 'DD/MM/YYYY HH:mm', true).isValid()) {
      tmpDate = moment(data.data.booking.startDateTime, 'DD/MM/YYYY HH:mm', true).toDate();
    } else {
      tmpDate = moment(data.data.booking.startDateTime).toDate();
    }
    if (moment(this.currentDate).format('YYYYMMDD') === moment(tmpDate).format('YYYYMMDD')) {
      this.fnSetSupplementDetail({});
      this.fnCalReserveTime();
    } else {
      this.currentDate = tmpDate;
    }
  }

  fnSetPatientInfo(data) {
    this.patientInfo = data;
    console.log(this.patientInfo);
    const address = this.patientInfo.address ? `${this.patientInfo.address} ` : '';
    const subdistrict = this.patientInfo.subdistrict ? `แขวง/ตำบล${this.patientInfo.subdistrict} ` : '';
    const district = this.patientInfo.district ? `เขต/อำเภอ${this.patientInfo.district} ` : '';
    const province = this.patientInfo.province ? `จังหวัด${this.patientInfo.province} ` : '';

    this.patientInfo.addressShow = `${address}${subdistrict}`;
    this.patientInfo.districtProvince = `${district}${province}`;
    this.patientInfo.item = this.patientInfo.item || 1;
    this.searchDdlPatientAddress();
  }

  onInitialized(e) {
    // const instance = e.component;
    this.schedulerInstance = e.component;
    setTimeout(async () => {
      document.querySelector('.dx-scheduler-navigator-next').addEventListener('click', () => {
        this.appointmentsData = this.appointmentsData.filter((obj) => {
          if (obj.text !== '') {
            return obj;
          }
        });
      });
      document.querySelector('.dx-scheduler-navigator-previous').addEventListener('click', () => {
        this.appointmentsData = this.appointmentsData.filter((obj) => {
          if (obj.text !== '') {
            return obj;
          }
        });
      });
    }, 100);
  }

  onOptionChanged(e) {
    if (e.name === 'currentDate') {
      console.log('onOptionChanged', e);
      this.fnSetSupplementDetail({});
      const instance = e.component;
      this.prioritiesData = [];
      setTimeout(async () => {
        const dateFrom = instance.getStartViewDate();
        const dateTo = instance.getEndViewDate();
        this.dateFrom = dateFrom;
        this.dateTo = dateTo;
        console.log('dateForm', dateFrom);
        console.log('dateTo', dateTo);
        await this.searchProductionTime();
        await this.searchBookingCalendar(dateFrom, dateTo);
        await this.searchAllBooking(dateFrom, dateTo);
        // this.appointmentsData = this.appointmentsData.filter((obj) => {
        //   if (obj.text !== '') {
        //     return obj;
        //   }
        // });
        this.fnCalReserveTime();
      }, 100);
    }
  }

  fnCalReserveTime() {
    // คำนวณหาเวลาของแท่งน้ำตาล หน้า reservation
    const supplyDay = this.patientInfo.supplyDay ? +this.patientInfo.supplyDay : 0;
    for (let i = 0; i < this.productionTimeHour.length; i++) {
      const rangeFrom = this.productionTimeHour[i].rangeFrom ? +this.productionTimeHour[i].rangeFrom : 0;
      const rangeTo = this.productionTimeHour[i].rangeTo ? +this.productionTimeHour[i].rangeTo : 0;
      const productionTimeHour1 = this.productionTimeHour[i].productionTimeHour1 ? this.productionTimeHour[i].productionTimeHour1 : 0;
      const productionTimeHour6 = this.productionTimeHour[i].productionTimeHour6 ? this.productionTimeHour[i].productionTimeHour6 : 0;
      const productionTimeHour11 = this.productionTimeHour[i].productionTimeHour11 ? this.productionTimeHour[i].productionTimeHour11 : 0;
      const productionTimeHour20 = this.productionTimeHour[i].productionTimeHour20 ? this.productionTimeHour[i].productionTimeHour20 : 0;
      if (supplyDay >= rangeFrom && (supplyDay <= rangeTo || (i === this.productionTimeHour.length - 1 && rangeTo === 0))) {
        if (this.itemCount >= 1 && this.itemCount <= 5) {
          this.productionTimeMin = productionTimeHour1 * 60; // convert hh to mm
        } else if (this.itemCount >= 6 && this.itemCount <= 10) {
          this.productionTimeMin = productionTimeHour6 * 60; // convert hh to mm
        } else if (this.itemCount >= 11 && this.itemCount <= 20) {
          this.productionTimeMin = productionTimeHour11 * 60; // convert hh to mm
        } else if (this.itemCount >= 20) {
          this.productionTimeMin = productionTimeHour20 * 60; // convert hh to mm
        }
        break;
      }
    }
    console.log('this.productionTimeMin', this.productionTimeMin);

    // คำนวน Production End
    if (this.productionTimeMin > 0) {
      const dateTime = moment(this.productionEnd, 'HH:mm');
      this.calProductionTime = dateTime.subtract(this.productionTimeMin, 'm');
      this.fnDisableBeforeProductionEnd();
    }

    // this.fnClearAppointmentReserve();
    console.log('this.enableDateList', this.enableDateList);
    const enableDateListKeys = _.keys(this.enableDateList).sort();
    if (this.productionTimeMin > 0) {

      const findOldReserveData = this.appointmentsData.find((obj) => {
        const startDateStr = moment(obj.startDate).format('YYYY-MM-DD');
        console.log('startDateStr', startDateStr);
        return obj.text === '' && obj.data.index >= 0 && this.enableDateList[startDateStr];
      });
      console.log('findOldReserveData', findOldReserveData);
      if (!findOldReserveData) {
        // const suggestDate = moment(this.stepList[this.currentIndex].suggestDate, 'DD/MM/YYYY').set(this.timeZeroMoment);
        // const currentDate = moment(this.currentDate).set(this.timeZeroMoment);
        // if (suggestDate.unix() !== currentDate.unix()) {
        //   this.currentDate = suggestDate.toDate();
        //   return;
        // }

        // start loop object 1
        // for (const key in this.enableDateList) {
        for (let i = 0; i < enableDateListKeys.length; i++) {
          const key = enableDateListKeys[i];
          console.log('key', key);
          if (this.enableDateList.hasOwnProperty(key)) {
            // tslint:disable-next-line:max-line-length
            if (!moment(key).set(this.timeZeroMoment).isBetween(moment(this.dateFrom).set(this.timeZeroMoment).subtract(1, 's'), moment(this.dateTo).set(this.timeEndDayMoment))) {
              continue;
            }
            // start loop object 2
            for (const key2 in this.enableDateList[key]) {
              if (this.enableDateList[key].hasOwnProperty(key2)) {
                const duration = this.enableDateList[key][key2]['duration'];
                const timeOpen = this.enableDateList[key][key2]['timeOpen'];
                const timeClose = this.enableDateList[key][key2]['timeClose'];
                const h = this.timeToMoment(timeOpen).get('h');
                const m = this.timeToMoment(timeOpen).get('m');

                const hClose = this.timeToMoment(timeClose).get('h');
                const mClose = this.timeToMoment(timeClose).get('m');

                const currentDate = moment().set(this.timeZeroMoment);
                const dataDate = moment(key).set(this.timeZeroMoment);
                // const addTimeBefore = dataDate.format('YYYYMMDD') === currentDate.format('YYYYMMDD') ? this.timeBeforeProdStart * 30 : 0;
                let calStartDate = dataDate.set({ h, m, s: 0, ms: 0 });

                console.log('duration', duration);
                // console.log('addTimeBefore', addTimeBefore);
                console.log('this.productionTimeMin', this.productionTimeMin);
                if (calStartDate >= currentDate && duration >= (this.productionTimeMin / 60)) {

                  // disabled time by productionEnd
                  if (this.timeToUnix(timeOpen) <= this.timeToUnix(this.calProductionTime)) {
                    const hProductionTime = this.timeToMoment(this.calProductionTime).get('h');
                    const mProductionTime = this.timeToMoment(this.calProductionTime).get('m');
                    calStartDate = dataDate.set({ h: hProductionTime, m: mProductionTime, s: 0, ms: 0 });
                  }
                  console.log('before calStartDate ' + key2, calStartDate.format('YYYY-MM-DD HH:mm'));
                  console.log(key, key2);
                  // หาช่วงเวลาที่มีการจองแล้ว ต้องเปลี่ยนไปจองช่วงเวลาต่อไป

                  const appointmentsMatchDate = this.appointmentsData.filter((obj) => {
                    return moment(obj.startDate).format('YYYYMMDD') === timeOpen.format('YYYYMMDD')
                      && obj.priorityId === +key2.replace('slot', '');
                  });
                  const disableDate = this.disableDateList[timeOpen.format('YYYY-MM-DD')];
                  if (disableDate && disableDate.from && disableDate.to) {
                    appointmentsMatchDate.push({
                      startDate: disableDate.from.toDate(),
                      endDate: disableDate.to.toDate()
                    });
                  }

                  console.log('appointmentsMatchDate', appointmentsMatchDate);
                  const startDateOfDay = moment(timeOpen);
                  const endDateOfDay = moment(timeClose);
                  let reserveTime = moment(timeOpen);
                  const reserveTimeEnd = moment(timeOpen);
                  while (startDateOfDay <= endDateOfDay) {

                    for (let j = 0; j < appointmentsMatchDate.length; j++) {
                      const appointmentData = appointmentsMatchDate[j];
                      const appointmentStartTime = moment(appointmentData.startDate);
                      const appointmentEndTime = moment(appointmentData.endDate);
                      if (startDateOfDay.isBetween(appointmentStartTime, appointmentEndTime)) {
                        reserveTime = appointmentEndTime;
                      }
                    }

                    console.log('reserveTime', this.tmpFormat(reserveTime));
                    console.log('reserveTimeEnd', this.tmpFormat(reserveTimeEnd));
                    const reserveDuration = this.fnCalDuration(reserveTime, reserveTimeEnd);
                    console.log('reserveDuration', reserveDuration);

                    if (reserveDuration === (this.productionTimeMin / 60)) {
                      const reserveData = {
                        text: '',
                        priorityId: +key2.replace('slot', ''),
                        startDate: reserveTime.toDate(),
                        endDate: reserveTimeEnd.toDate(),
                        data: {
                          hn: '',
                          name: '',
                          supplyDay: this.patientInfo.supplyDay,
                          index: this.currentIndex
                        }
                      };
                      this.appointmentsData.push(reserveData);
                      this.fnSetSupplementDetail(reserveData);
                      return;
                    }
                    startDateOfDay.add(30, 'minute');
                    reserveTimeEnd.add(30, 'minute');
                  }
                }
              }
            }
          }
        }
      } else {
        this.fnSetSupplementDetail(findOldReserveData, true);
      }
    }
  }

  fnCalReserveOldBooking() {
    // คำนวณหาเวลาของแท่งน้ำตาล หน้า reservation
    const supplyDay = this.patientInfo.supplyDay ? +this.patientInfo.supplyDay : 0;
    for (let i = 0; i < this.productionTimeHour.length; i++) {
      const rangeFrom = this.productionTimeHour[i].rangeFrom ? +this.productionTimeHour[i].rangeFrom : 0;
      const rangeTo = this.productionTimeHour[i].rangeTo ? +this.productionTimeHour[i].rangeTo : 0;
      const productionTimeHour1 = this.productionTimeHour[i].productionTimeHour1 ? this.productionTimeHour[i].productionTimeHour1 : 0;
      const productionTimeHour6 = this.productionTimeHour[i].productionTimeHour6 ? this.productionTimeHour[i].productionTimeHour6 : 0;
      const productionTimeHour11 = this.productionTimeHour[i].productionTimeHour11 ? this.productionTimeHour[i].productionTimeHour11 : 0;
      const productionTimeHour20 = this.productionTimeHour[i].productionTimeHour20 ? this.productionTimeHour[i].productionTimeHour20 : 0;
      if (supplyDay >= rangeFrom && (supplyDay <= rangeTo || (i === this.productionTimeHour.length - 1 && rangeTo === 0))) {
        if (this.itemCount >= 1 && this.itemCount <= 5) {
          this.productionTimeMin = productionTimeHour1 * 60; // convert hh to mm
        } else if (this.itemCount >= 6 && this.itemCount <= 10) {
          this.productionTimeMin = productionTimeHour6 * 60; // convert hh to mm
        } else if (this.itemCount >= 11 && this.itemCount <= 20) {
          this.productionTimeMin = productionTimeHour11 * 60; // convert hh to mm
        } else if (this.itemCount >= 20) {
          this.productionTimeMin = productionTimeHour20 * 60; // convert hh to mm
        }
        break;
      }
    }
    console.log('this.productionTimeMin', this.productionTimeMin);
    console.log('oldBooking', this.oldBooking);
    // คำนวน Production End
    if (this.productionTimeMin > 0) {
      const dateTime = moment(this.productionEnd, 'HH:mm');
      this.calProductionTime = dateTime.subtract(this.productionTimeMin, 'm');
      this.fnDisableBeforeProductionEnd();
    }

    // หาว่าวันที่ว่างตรงกับกับที่เคยจองไหม
    let isReserveOldBooking = false;
    const dateOldBooking = moment(this.oldBooking.start).format('YYYY-MM-DD');
    const slotOldBooking = 'slot' + this.oldBooking.slot;
    if (this.enableDateList[dateOldBooking] && this.enableDateList[dateOldBooking][slotOldBooking]) {
      console.log('this.enableDateList[dateOldBooking][slotOldBooking]', this.enableDateList[dateOldBooking][slotOldBooking]);
      const findEnableOldBooking = this.enableDateList[dateOldBooking][slotOldBooking];
      const duration = findEnableOldBooking['duration'];
      const timeOpen = moment(this.oldBooking.start);
      const timeOpenEnable = findEnableOldBooking['timeOpen'];
      const timeClose = findEnableOldBooking['timeClose'];
      const h = this.timeToMoment(timeOpen).get('h');
      const m = this.timeToMoment(timeOpen).get('m');

      const hClose = this.timeToMoment(timeClose).get('h');
      const mClose = this.timeToMoment(timeClose).get('m');

      const currentDate = moment().set(this.timeZeroMoment);
      const dataDate = moment(dateOldBooking).set(this.timeZeroMoment);
      const calStartDate = dataDate.set({ h, m, s: 0, ms: 0 });

      if (calStartDate >= currentDate && duration >= (this.productionTimeMin / 60)) {

        // หาช่วงเวลาที่มีการจองแล้ว ต้องเปลี่ยนไปจองช่วงเวลาต่อไป
        const appointmentsMatchDate = this.appointmentsData.filter((obj) => {
          return moment(obj.startDate).format('YYYYMMDD') === timeOpen.format('YYYYMMDD')
            && obj.priorityId === +slotOldBooking.replace('slot', '');
        });
        const disableDate = this.disableDateList[timeOpen.format('YYYY-MM-DD')];
        if (disableDate && disableDate.from && disableDate.to) {
          appointmentsMatchDate.push({
            startDate: disableDate.from.toDate(),
            endDate: disableDate.to.toDate()
          });
        }

        console.log('appointmentsMatchDate', appointmentsMatchDate);
        const startDateOfDay = moment(timeOpen);
        const endDateOfDay = moment(timeClose);
        let reserveTime = moment(timeOpen);
        const reserveTimeEnd = moment(timeOpen);
        while (startDateOfDay <= endDateOfDay) {

          console.log('timeOpenEnable', timeOpenEnable.format('YYYY-MM-DD HH:mm:ss'));
          console.log('startDateOfDay', startDateOfDay.format('YYYY-MM-DD HH:mm:ss'));

          // ถ้าวันเวลาของการจองเดิมน้อยกว่าเวลาเปิดที่ว่างอยู่ ต้องย้ายไปเวลาเปิดที่ว่าง
          if (reserveTime.unix() < timeOpenEnable.unix()) {
            reserveTime = timeOpenEnable;
          }

          for (let i = 0; i < appointmentsMatchDate.length; i++) {
            const appointmentData = appointmentsMatchDate[i];
            const appointmentStartTime = moment(appointmentData.startDate);
            const appointmentEndTime = moment(appointmentData.endDate);
            if (startDateOfDay.isBetween(appointmentStartTime, appointmentEndTime)) {
              reserveTime = appointmentEndTime;
            }
          }

          const reserveDuration = this.fnCalDuration(reserveTime, reserveTimeEnd);

          if (reserveDuration === (this.productionTimeMin / 60)) {
            const reserveData = {
              text: '',
              priorityId: +slotOldBooking.replace('slot', ''),
              startDate: reserveTime.toDate(),
              endDate: reserveTimeEnd.toDate(),
              data: {
                hn: '',
                name: '',
                supplyDay: this.patientInfo.supplyDay,
                index: this.currentIndex
              }
            };
            this.appointmentsData.push(reserveData);
            this.fnSetSupplementDetail(reserveData);
            isReserveOldBooking = true;
            break;
          }
          startDateOfDay.add(30, 'minute');
          reserveTimeEnd.add(30, 'minute');
        }
      }
    }

    console.log('isReserveOldBooking', isReserveOldBooking);
    // ถ้าไม่สามารถลงวันที่เคยจองไว้ได้ให้เข้า logic เดิมคือหาวันที่ว่างอื่น
    if (!isReserveOldBooking) {
      console.log('this.enableDateList', this.enableDateList);
      const enableDateListKeys = _.keys(this.enableDateList).sort();
      if (this.productionTimeMin > 0) {

        const findOldReserveData = this.appointmentsData.find((obj) => {
          return obj.text === '' && obj.data.index >= 0;
        });
        console.log('findOldReserveData', findOldReserveData);
        if (!findOldReserveData) {
          // start loop object 1 (date)
          for (let i = 0; i < enableDateListKeys.length; i++) {
            const key = enableDateListKeys[i];
            console.log('key', key);
            if (this.enableDateList.hasOwnProperty(key)) {
              // tslint:disable-next-line:max-line-length
              if (!moment(key).set(this.timeZeroMoment).isBetween(moment(this.dateFrom).set(this.timeZeroMoment).subtract(1, 's'), moment(this.dateTo).set(this.timeEndDayMoment))) {
                continue;
              }
              // start loop object 2 (slot)
              for (const key2 in this.enableDateList[key]) {
                console.log('key2', key2);
                if (this.enableDateList[key].hasOwnProperty(key2)) {
                  const duration = this.enableDateList[key][key2]['duration'];
                  const timeOpen = this.enableDateList[key][key2]['timeOpen'];
                  const timeClose = this.enableDateList[key][key2]['timeClose'];
                  const h = this.timeToMoment(timeOpen).get('h');
                  const m = this.timeToMoment(timeOpen).get('m');

                  const hClose = this.timeToMoment(timeClose).get('h');
                  const mClose = this.timeToMoment(timeClose).get('m');

                  const currentDate = moment().set(this.timeZeroMoment);
                  const dataDate = moment(key).set(this.timeZeroMoment);
                  let calStartDate = dataDate.set({ h, m, s: 0, ms: 0 });

                  if (calStartDate >= currentDate && duration >= (this.productionTimeMin / 60)) {

                    // disabled time by productionEnd
                    if (this.timeToUnix(timeOpen) <= this.timeToUnix(this.calProductionTime)) {
                      const hProductionTime = this.timeToMoment(this.calProductionTime).get('h');
                      const mProductionTime = this.timeToMoment(this.calProductionTime).get('m');
                      calStartDate = dataDate.set({ h: hProductionTime, m: mProductionTime, s: 0, ms: 0 });
                    }
                    console.log('before calStartDate ' + key2, calStartDate.format('YYYY-MM-DD HH:mm'));
                    console.log(key, key2);
                    // หาช่วงเวลาที่มีการจองแล้ว ต้องเปลี่ยนไปจองช่วงเวลาต่อไป

                    const appointmentsMatchDate = this.appointmentsData.filter((obj) => {
                      return moment(obj.startDate).format('YYYYMMDD') === timeOpen.format('YYYYMMDD')
                        && obj.priorityId === +key2.replace('slot', '');
                    });
                    const disableDate = this.disableDateList[timeOpen.format('YYYY-MM-DD')];
                    if (disableDate && disableDate.from && disableDate.to) {
                      appointmentsMatchDate.push({
                        startDate: disableDate.from.toDate(),
                        endDate: disableDate.to.toDate()
                      });
                    }

                    console.log('appointmentsMatchDate', appointmentsMatchDate);
                    const startDateOfDay = moment(timeOpen);
                    const endDateOfDay = moment(timeClose);
                    let reserveTime = moment(timeOpen);
                    const reserveTimeEnd = moment(timeOpen);
                    while (startDateOfDay <= endDateOfDay) {

                      for (let j = 0; j < appointmentsMatchDate.length; j++) {
                        const appointmentData = appointmentsMatchDate[j];
                        const appointmentStartTime = moment(appointmentData.startDate);
                        const appointmentEndTime = moment(appointmentData.endDate);
                        if (startDateOfDay.isBetween(appointmentStartTime, appointmentEndTime)) {
                          reserveTime = appointmentEndTime;
                        }
                      }

                      console.log('reserveTime', this.tmpFormat(reserveTime));
                      console.log('reserveTimeEnd', this.tmpFormat(reserveTimeEnd));
                      const reserveDuration = this.fnCalDuration(reserveTime, reserveTimeEnd);
                      console.log('reserveDuration', reserveDuration);

                      if (reserveDuration === (this.productionTimeMin / 60)) {
                        const reserveData = {
                          text: '',
                          priorityId: +key2.replace('slot', ''),
                          startDate: reserveTime.toDate(),
                          endDate: reserveTimeEnd.toDate(),
                          data: {
                            hn: '',
                            name: '',
                            supplyDay: this.patientInfo.supplyDay,
                            index: this.currentIndex
                          }
                        };
                        this.appointmentsData.push(reserveData);
                        this.fnSetSupplementDetail(reserveData);
                        return;
                      }
                      startDateOfDay.add(30, 'minute');
                      reserveTimeEnd.add(30, 'minute');
                    }
                  }
                }
              }
            }
          }
        } else {
          this.fnSetSupplementDetail(findOldReserveData, true);
        }
      }
    }
  }

  async searchProductionTime() {
    try {
      this.productionTimeMin = 0;
      const checkUrl = this.common.checkMockupUrl('', '', '', {
        BASE_API: '',
        BASE_MODULE: environment.apiPrefix,
        BASE_RESOURCE: environment.searchProductionTime
      });
      const resultCodeSuccess = environment.resultCodeSuccess;
      const response = await this.request.get(checkUrl.url, checkUrl.filter);
      if (response.resultCode === resultCodeSuccess) {
        const data = await response.resultData || response.data;
        if (data) {
          this.productionTimeHour = data.productionTimeHour || [];
          this.timeBeforeProdStart = data.timeBeforeProdStart;
          this.productionEnd = data.productionEnd;
        }
      } else {
        this.goAlert(response.resultCode, response.resultDescription, 'myModalError');
      }
    } catch (e) {
      console.error('searchProductionTime error', e);
      const resultDescriptionSystemErrorTitle = environment.resultDescriptionSystemErrorTitle;
      const resultDescriptionSystemErrorMassage = environment.resultDescriptionSystemErrorMassage;
      this.goAlert(resultDescriptionSystemErrorTitle, resultDescriptionSystemErrorMassage, 'myModalError');
    }
  }

  async searchBookingCalendar(dateFrom, dateTo) {
    try {
      const filterData = {
        dateFrom: moment(dateFrom).set(this.timeZeroMoment).toDate(),
        dateTo: moment(dateTo).set(this.timeEndDayMoment).toDate(),
      };
      const checkUrl = this.common.checkMockupUrl('', '', filterData, {
        BASE_API: '',
        BASE_MODULE: environment.apiPrefix,
        BASE_RESOURCE: environment.searchBookingCalendar
      });
      const resultCodeSuccess = environment.resultCodeSuccess;
      const response = await this.request.get(checkUrl.url, checkUrl.filter);
      if (response.resultCode === resultCodeSuccess) {
        this.remarkMsg = [];
        const resultData = await response.resultData;
        const productionSchedule = resultData.productionSchedule || [];
        const additionalProductionSchedule = resultData.additionalProductionSchedule || [];
        for (let i = 0; i < productionSchedule.length; i++) {
          const data = productionSchedule[i];
          // open
          const timeOpen = data.timeOpen;
          const openH = this.timeToMoment(timeOpen).get('h');
          const openM = this.timeToMoment(timeOpen).get('m');
          const openDateTime = moment().set({ h: openH, m: openM, s: 0, ms: 0 });
          // close
          const timeClose = data.timeClose;
          const closeH = this.timeToMoment(timeClose).get('h');
          const closeM = this.timeToMoment(timeClose).get('m');
          const closeDateTime = moment().set({ h: closeH, m: closeM, s: 0, ms: 0 });
          if (i === 0) {
            this.startDayHour = this.fnReplaceTime(timeOpen);
            this.endDayHour = Math.ceil(this.fnReplaceTime(timeClose));
          }
          if (this.fnReplaceTime(timeOpen) < this.startDayHour) {
            this.startDayHour = this.fnReplaceTime(timeOpen);
          }

          if (this.fnReplaceTime(timeClose) > this.endDayHour) {
            this.endDayHour = Math.ceil(this.fnReplaceTime(timeClose));
          }
        }

        this.enableDateList = {};
        let productionLine = 0;
        for (let i = 0; i < additionalProductionSchedule.length; i++) {
          productionLine = 0;
          const data = additionalProductionSchedule[i];
          const date = moment(data.date).get('date');
          const month = moment(data.date).get('month');
          const year = moment(data.date).get('year');
          // open
          const timeOpen = data.timeOpen;
          const openH = this.timeToMoment(timeOpen).get('h');
          const openM = this.timeToMoment(timeOpen).get('m');
          let openDateTime = moment().set({ year, month, date, h: openH, m: openM, s: 0, ms: 0 });
          // close
          const timeClose = data.timeClose;
          const closeH = this.timeToMoment(timeClose).get('h');
          const closeM = this.timeToMoment(timeClose).get('m');
          const closeDateTime = moment().set({ year, month, date, h: closeH, m: closeM, s: 0, ms: 0 });

          const dateAdditional = moment().set({ year, month, date, h: 0, m: 0, s: 0, ms: 0 });
          const dateCurrent = moment().set({ h: 0, m: 0, s: 0, ms: 0 });

          if (!this.disableDateList[data.date] || !data.isProductionStopped) {
            this.disableDateList[data.date] = {};
          }
          // ถ้า productionStoppedTime = 1 คือปิดทั้งวัน
          if (data.isProductionStopped && data.productionStoppedTime === 1) {
            // tslint:disable-next-line:max-line-length
            this.remarkMsg.push(`Production stopped on ${moment(data.date).format('DD/MM/YYYY')} (All day) (Reason : ${data.productionStoppedReason})`);
            continue;
          }

          if (data.isProductionStopped && data.productionStoppedTime === 2) {
            this.disableDateList[data.date].from = moment(data.date + ' ' + data.productionStoppedFrom);
            this.disableDateList[data.date].to = moment(data.date + ' ' + data.productionStoppedTo);
            // tslint:disable-next-line:max-line-length
            this.remarkMsg.push(`Production stopped on ${moment(data.date).format('DD/MM/YYYY')} (${data.productionStoppedFrom} - ${data.productionStoppedTo}) (Reason : ${data.productionStoppedReason})`);
          }

          if (!this.enableDateList[data.date]) {
            this.enableDateList[data.date] = {};
          }
          for (let j = 0; j < data.productionLine; j++) {
            // if current data disable time by time before
            if (dateCurrent.unix() === dateAdditional.unix()) {
              const open = moment().set({ h: openH, m: openM, s: 0, ms: 0 });
              console.log('open.unix()', open.unix());
              console.log('this.fnCalCurrent30Min().unix()', this.fnCalCurrent30Min().unix());
              if (open.unix() >= this.fnCalCurrent30Min().add(this.timeBeforeProdStart * 30, 'm').unix()) {
                openDateTime = moment().set({ h: openH, m: openM, s: 0, ms: 0 });
              } else {
                openDateTime = this.fnCalCurrent30Min().add(this.timeBeforeProdStart * 30, 'm');
              }
            }

            console.log('openDateTime', openDateTime);
            console.log('closeDateTime', closeDateTime);
            console.log('fnCalDuration', this.fnCalDuration(openDateTime, closeDateTime));
            this.enableDateList[data.date]['slot' + (j + 1)] = {
              timeOpen: openDateTime,
              timeClose: closeDateTime,
              duration: this.fnCalDuration(openDateTime, closeDateTime),
            };
          }

          if (data.productionLine && data.productionLine > productionLine) {
            productionLine = data.productionLine;
          }

          if (this.fnReplaceTime(timeOpen) < this.startDayHour) {
            this.startDayHour = this.fnReplaceTime(timeOpen);
          }

          if (this.fnReplaceTime(timeClose) > this.endDayHour) {
            this.endDayHour = Math.ceil(this.fnReplaceTime(timeClose));
          }

          // cal additionalProductionTime
          const additionalProductionTimeList = data.additionalProductionTime || [];
          for (let j = 0; j < additionalProductionTimeList.length; j++) {
            const additionalProductionTime = additionalProductionTimeList[j];
            const additionalTimeClose = additionalProductionTime.timeClose;
            // const additionalCloseH = this.timeToMoment(additionalTimeClose).get('h');

            const lineNo = additionalProductionTime.lineNo;
            const additionalCloseH = this.timeToMoment(additionalProductionTime.timeClose).get('h');
            const additionalCloseM = this.timeToMoment(additionalProductionTime.timeClose).get('m');

            // ถ้าเวลาปิดของ OT มากกว่าเวลาปิดเริ่มแรกให้เชื่อเวลาปิดของ OT ที่มากที่สุด
            if (this.fnReplaceTime(additionalTimeClose) > this.endDayHour) {
              this.endDayHour = Math.ceil(this.fnReplaceTime(additionalTimeClose));
            }
            // ถ้ามีเวลา OT ต้องกำหนดลงแต่ละ slot
            this.enableDateList[data.date]['slot' + lineNo]['timeClose'] = moment().set({
              year,
              month,
              date,
              h: additionalCloseH,
              m: additionalCloseM,
              s: 0,
              ms: 0
            });
            // tslint:disable-next-line:max-line-length
            this.enableDateList[data.date]['slot' + lineNo]['duration'] = this.fnCalDuration(openDateTime, this.enableDateList[data.date]['slot' + (j + 1)]['timeClose']);
          }

          // cal additionalProductionLine
          const additionalProductionLineList = data.additionalProductionLine || [];
          for (let j = 0; j < additionalProductionLineList.length; j++) {
            productionLine++;
            const additionalProductionLine = additionalProductionLineList[j];
            // open
            const additionalTimeOpen = additionalProductionLine.timeOpen;
            const additionalOpenH = this.timeToMoment(additionalTimeOpen).get('h');
            const additionalOpenM = this.timeToMoment(additionalTimeOpen).get('m');
            let additionalOpenDateTime = moment(dateAdditional).set({
              h: additionalOpenH,
              m: additionalOpenM,
              s: 0,
              ms: 0
            });
            // close
            const additionalTimeClose = additionalProductionLine.timeClose;
            const additionalCloseH = this.timeToMoment(additionalTimeClose).get('h');
            const additionalCloseM = this.timeToMoment(additionalTimeClose).get('m');
            const additionalCloseDateTime = moment(dateAdditional).set({
              h: additionalCloseH,
              m: additionalCloseM,
              s: 0,
              ms: 0
            });

            // if current data disable time by time before
            if (dateCurrent.unix() === dateAdditional.unix()) {
              const open = moment().set({ h: additionalOpenH, m: additionalOpenM, s: 0, ms: 0 });
              if (open.unix() >= this.fnCalCurrent30Min().add(this.timeBeforeProdStart * 30, 'm').unix()) {
                // tslint:disable-next-line:max-line-length
                additionalOpenDateTime = moment().set({
                  h: additionalOpenH,
                  m: additionalOpenM,
                  s: 0,
                  ms: 0
                });
              } else {
                additionalOpenDateTime = this.fnCalCurrent30Min().add(this.timeBeforeProdStart * 30, 'm');
              }
            }

            console.log('additionalOpenDateTime', additionalOpenDateTime);
            console.log('additionalCloseDateTime', additionalCloseDateTime);
            console.log('fnCalDuration', this.fnCalDuration(additionalOpenDateTime, additionalCloseDateTime));
            this.enableDateList[data.date]['slot' + productionLine] = {
              timeOpen: additionalOpenDateTime,
              timeClose: additionalCloseDateTime,
              duration: this.fnCalDuration(additionalOpenDateTime, additionalCloseDateTime),
            };
            if (this.fnReplaceTime(additionalTimeOpen) < this.startDayHour) {
              this.startDayHour = this.fnReplaceTime(additionalTimeOpen);
            }

            if (this.fnReplaceTime(additionalTimeClose) > this.endDayHour) {
              this.endDayHour = Math.ceil(this.fnReplaceTime(additionalTimeClose));
            }
          }
          // }
        }

        // fix time for startDayHour
        let startDayHourStr = this.startDayHour.toString();
        if (startDayHourStr.split('.')[1] === '3') {
          startDayHourStr = startDayHourStr.replace('.3', '.5');
          this.startDayHour = +startDayHourStr;
        }
        console.log('this.startDayHour', this.startDayHour);
        console.log('this.endDayHour', this.endDayHour);
        console.log('this.enableDateList', this.enableDateList);

        // cal max slot
        this.maxProductionLine = 0;
        for (const enableDateKey in this.enableDateList) {
          if (this.enableDateList.hasOwnProperty(enableDateKey)) {
            const enableDateData = this.enableDateList[enableDateKey];
            for (const slotKey in enableDateData) {
              if (enableDateData.hasOwnProperty(slotKey)) {
                const slotData = enableDateData[slotKey];
                const slotNo = +slotKey.replace('slot', '');
                if (slotNo > this.maxProductionLine) {
                  this.maxProductionLine = slotNo;
                }
              }
            }
          }
        }
        this.prioritiesData = [];
        for (let i = 0; i < this.maxProductionLine; i++) {
          this.prioritiesData.push(
            {
              text: 'Slot ' + (i + 1),
              id: i + 1
            },
          );
        }
      } else {
        // this.goAlert(resultDescriptionSystemErrorTitle, resultDescriptionSystemErrorMassage, 'myModalError');
        this.goAlert(response.resultCode, response.resultDescription, 'myModalError');
      }
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

  async searchAllBooking(dateFrom, dateTo) {
    try {
      this.appointmentsData = this.appointmentsData.filter((obj) => {
        if (obj.data.index >= 0) {
          return obj;
        }
      });
      console.log('searchAllBooking this.appointmentsData', this.appointmentsData);
      const filterData = {
        dateFrom: moment(dateFrom).set(this.timeZeroMoment).toDate(),
        dateTo: moment(dateTo).set(this.timeEndDayMoment).toDate(),
      };
      const checkUrl = this.common.checkMockupUrl('', '', filterData, {
        BASE_API: '',
        BASE_MODULE: environment.apiPrefix,
        BASE_RESOURCE: environment.searchAllBooking
      });
      const resultCodeSuccess = environment.resultCodeSuccess;
      const response = await this.request.get(checkUrl.url, checkUrl.filter);
      if (response.resultCode === resultCodeSuccess) {
        const resultData = await response.resultData;
        for (let i = 0; i < resultData.length; i++) {
          const data = resultData[i];
          const hn = data.hn || '';
          const name = data.name || data.patientName || '';
          const slot = data.slot || data.slotNo || null;
          const supplyDay = data.supplyDay || null;
          const productionStart = data.productionStart || '';
          const productionEnd = data.productionEnd || '';
          const productionStartDate = data.productionStartDate || '';
          const productionStartTime = data.productionStartTime || '';
          const productionEndDate = data.productionEndDate || '';
          const productionEndTime = data.productionEndTime || '';
          const startDate = productionStart || productionStartDate + ' ' + productionStartTime;
          const endDate = productionEnd || productionEndDate + ' ' + productionEndTime;
          if (data.orderId !== this.id) {
            this.appointmentsData.push({
              text: `HN :\n${hn}`,
              priorityId: slot,
              startDate: moment(startDate).toDate(),
              endDate: moment(endDate).toDate(),
              data: {
                hn: hn,
                name: name,
                supplyDay: supplyDay,
                isAllowCancelDate: this.currentEditHN === hn
              }
            });
          }
        }
        console.log('this.appointmentsData', this.appointmentsData);
        this.appointmentsData = _.sortBy(this.appointmentsData, ['endDate']);

      } else {
        // this.goAlert(resultDescriptionSystemErrorTitle, resultDescriptionSystemErrorMassage, 'myModalError');
        this.goAlert(response.resultCode, response.resultDescription, 'myModalError');
      }
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

  async searchDdlPatientAddress() {
    try {
      const checkUrl = this.common.checkMockupUrl('', '', { hn: this.patientInfo.hn }, {
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

  async searchDdlCashier() {
    try {
      const checkUrl = this.common.checkMockupUrl('', '', '', {
        BASE_API: '',
        BASE_MODULE: environment.apiPrefix,
        BASE_RESOURCE: environment.searchDdlCashier
      });
      const resultCodeSuccess = environment.resultCodeSuccess;
      const response = await this.request.get(checkUrl.url, checkUrl.filter);
      if (response.resultCode === resultCodeSuccess) {
        this.cashierList = await response.resultData || response.data || [];
      } else {
        this.cashierList = [];
      }
    } catch (e) {
      console.error('searchDdlCashier error', e);
      this.cashierList = [];
    }
  }

  timeCellTemplate(e) {
    return new Date(e.date).toLocaleString('en-GB', { hour: '2-digit', minute: '2-digit' });
  }

  isDisabledCurrentDateTime(data) {
    const date: Date = data.startDate;
    const localeDate = moment(date);
    return localeDate.unix() <= moment().unix();
  }

  isEnableDate(data) {
    const dateStart: Date = data.startDate;
    const dateEnd: Date = data.endDate;
    const localeDate = moment(dateStart).format('YYYY-MM-DD');
    // start
    const dateTimeStart = moment(dateStart);
    // end
    const dateTimeEnd = moment(dateEnd);
    let no = 0;
    if (data.groups) {
      no = data.groups.priorityId;
    } else if (data.priorityId) {
      no = data.priorityId;
    }
    const obj = this.enableDateList[localeDate];
    if (obj && obj['slot' + no]) {
      return obj['slot' + no]['timeOpen'].unix() <= dateTimeStart.unix() && dateTimeStart.unix() <= obj['slot' + no]['timeClose'].unix()
        && obj['slot' + no]['timeOpen'].unix() <= dateTimeEnd.unix() && dateTimeEnd.unix() <= obj['slot' + no]['timeClose'].unix();
    } else {
      return false;
    }
  }

  isDisableDateByProductionStopped(data) {
    const dateStart: Date = data.startDate;
    const dateEnd: Date = data.endDate;
    const localeDate = moment(dateStart).format('YYYY-MM-DD');
    // start
    const dateTimeStart = moment(dateStart);
    // end
    const dateTimeEnd = moment(dateEnd);
    const obj = this.disableDateList[localeDate];
    if (obj && obj['from'] && obj['to']) {
      return obj['from'].unix() <= dateTimeStart.unix() && dateTimeStart.unix() <= obj['to'].unix()
        && obj['from'].unix() <= dateTimeEnd.unix() && dateTimeEnd.unix() <= obj['to'].unix();
    } else {
      return false;
    }
  }

  isDisableDateByProductionStoppedAppointment(data) {
    const dateStart: Date = data.startDate;
    const dateEnd: Date = data.endDate;
    const localeDate = moment(dateStart).format('YYYY-MM-DD');
    // start
    const dateTimeStart = moment(dateStart);
    // end
    const dateTimeEnd = moment(dateEnd);
    const obj = this.disableDateList[localeDate];
    if (obj && obj['from'] && obj['to']) {
      return dateTimeStart.unix() <= obj['from'].unix() && dateTimeEnd.unix() <= obj['from'].unix()
        || dateTimeStart.unix() >= obj['to'].unix();
    } else {
      return true;
    }
  }

  isDisableDate(data) {
    if (this.pageType === 'edit') {
      return true;
    } else {
      return !this.isEnableDate(data) || this.isDisabledCurrentDateTime(data) || this.isDisableDateByProductionStopped(data);
    }
  }

  onAppointmentDblClick(e: any) {
    e.cancel = true;
  }

  onAppointmentClick(e: any) {
    console.log('onAppointmentClick', e);
    e.cancel = true;
    const isAllowCancelDate = e.appointmentData.data.isAllowCancelDate;
    if (isAllowCancelDate) {
      this.goAlert('Are you sure', 'You want to cancel reservation ?', 'myModalConfirm', {
        iconURL: '../../assets/icon-md/calendar.png'
      });
    }
  }

  onAppointmentUpdating(e: any) {
    console.log('onAppointmentUpdating', e);
    const newData = e.newData;
    const oldData = e.oldData;
    for (let i = 0; i < this.appointmentsData.length; i++) {
      const data = this.appointmentsData[i];
      if ((newData.priorityId === data.priorityId && data.text !== '' && this.common.isNotAvailable(newData, data))
        || this.isDisableDate(newData)
        || !this.isDisableDateByProductionStoppedAppointment(newData)) {
        e.cancel = true;
        return;
      } else {
        // this.fnSetSupplementDetail(newData);
      }
    }
    // ถ้าเป็นการย้ายแท่งน้ำตาลจะไปคำนวณ fnSetSupplementDetail ใหม่
    if (newData.text === '' && oldData.text === '') {
      this.fnSetSupplementDetail(newData);
    }
  }

  onAppointmentRendered(e: any) {
    const appointmentElement: HTMLElement = e.appointmentElement;
    appointmentElement.style.width = (appointmentElement.clientWidth + 31) + 'px';
    const isAllowCancelDate = e.appointmentData.data.isAllowCancelDate;
    appointmentElement.title = '';
    if (e.appointmentData.text === '') {
      appointmentElement.style.backgroundColor = '#AE934F';
    } else {
      appointmentElement.onmouseenter = (args) => {
        e.component.showAppointmentTooltip(e.appointmentData, e.appointmentElement, e.targetedAppointmentData);
      };
      appointmentElement.onmouseleave = (args) => {
        e.component.hideAppointmentTooltip();
      };
      if (isAllowCancelDate && this.isChangeBookingMode) {
        appointmentElement.querySelector('.dx-scheduler-appointment-title').innerHTML = 'Click here\nto cancel\nbooking';
        appointmentElement.querySelector('.dx-scheduler-appointment-title').setAttribute('style', 'color:#ffffff');
        appointmentElement.style.backgroundColor = '#B24343';
      } else {
        appointmentElement.style.backgroundColor = '#F9F7F2';
      }
    }
    // ถ้าเวลาเปิดเกิน 23:30 ต้องไม่แสดงส่วนที่ dis หลังจาก 23:30
    // if (this.endDayHour >= 24) {
    // const elmEndTimeRow = document.querySelector('.dx-scheduler-time-panel .dx-scheduler-time-panel-row:last-child');
    // elmEndTimeRow.setAttribute('style', 'display: none;');
    // const elmEndDateRow = document.querySelector('.dx-scheduler-date-table .dx-scheduler-date-table-row:last-child');
    // elmEndDateRow.setAttribute('style', 'display: none;');
    // }
  }

  onDragStart(e: any) {
    // console.log('onDragStart', e);
    const isAllowCancelDate = e.itemData.data.isAllowCancelDate;
    const data = e.itemData;
    if (data.text !== '' || isAllowCancelDate) {
      e.cancel = true;
    }
  }

  fnDisableBeforeProductionEnd() {
    const productionEnd = +moment(this.productionEnd, 'HH:mm').format('H.m');
    const diffTime = moment(this.productionEnd, 'HH:mm').diff(this.calProductionTime, 'm', true);
    console.log('diffTime', diffTime);
    // loop for disabled productionEnd
    for (const key in this.enableDateList) {
      if (this.enableDateList.hasOwnProperty(key)) {
        // start loop object 2
        for (const key2 in this.enableDateList[key]) {
          if (this.enableDateList[key].hasOwnProperty(key2)) {
            const timeOpen = this.enableDateList[key][key2]['timeOpen'];
            console.log('timeOpen', timeOpen);
            // disabled time by productionEnd
            if (productionEnd < +timeOpen.format('H.m')) {
              // no change open time
            } else {
              const calDateTime = moment(this.productionEnd, 'HH:mm').subtract(diffTime, 'm');
              console.log('calDateTime', calDateTime);
              if (+calDateTime.format('H.m') < +timeOpen.format('H.m')) {
                // no change open time
              } else {
                const h = calDateTime.get('h');
                const m = calDateTime.get('m');
                this.enableDateList[key][key2]['timeOpen'].set({ h, m, s: 0, ms: 0 });
              }
            }
            // if (+timeOpen.format('H.m') <= +this.calProductionTime.format('H.m')) {
            //   const h = this.calProductionTime.get('h');
            //   const m = this.calProductionTime.get('m');
            //   this.enableDateList[key][key2]['timeOpen'].set({h, m, s: 0, ms: 0});
            // }
          }
        }
      }
    }
  }

  timeToUnix(value) {
    return moment(value, 'HH:mm', true).unix();
  }

  timeToMoment(value) {
    return moment(value, 'HH:mm', true);
  }

  fnReplaceTime(value) {
    return +moment(value, 'HH:mm', true).format('H.m');
  }

  fnCalDuration(start: moment.Moment, end: moment.Moment) {
    return end.diff(start, 'h', true);
  }

  fnCalCurrent30Min() {
    const current = moment();
    const m = current.get('m');
    if (m > 0 && m <= 30) {
      return moment().set({ m: 30, s: 0, ms: 0 });
    } else if (m > 30) {
      return moment().add(1, 'h').set({ m: 0, s: 0, ms: 0 });
    } else {
      return moment().set({ m: 0, s: 0, ms: 0 });
    }
  }

  fnClearAppointmentReserve() {
    // clear current reserve
    this.appointmentsData = this.appointmentsData.filter((obj) => {
      if (obj.text !== '') {
        return obj;
      }
    });
  }

  tmpFormat(value) {
    return moment(value).format('YYYY-MM-DD HH:mm:ss');
  }

  fnSetSupplementDetail(data, isOldData?) {
    console.log('fnSetSupplementDetail data', data);
    const diffHour = this.fnCalDuration(moment(data.startDate), moment(data.endDate));
    this.supplementDetail.confirmedDays = data.data ? data.data.supplyDay : null;
    this.supplementDetail.slotNo = data.priorityId;
    this.supplementDetail.productionEndDate = data.endDate ? moment(data.endDate).format('DD/MM/YYYY') : null;
    this.supplementDetail.productionEndTime = data.endDate ? moment(data.endDate).format('HH:mm') : null;
    this.supplementDetail.stdProductionHour = diffHour.toString();
    this.supplementDetail.startDateTime = data.startDate ? moment(data.startDate).format('DD/MM/YYYY HH:mm') : null;

    // set min delivery date / clear arrival time
    if (this.stepList[this.currentIndex]) {
      this.stepList[this.currentIndex].data.booking.startDateTime = _.cloneDeep(this.supplementDetail.startDateTime);
      const deliveryDetail = this.stepList[this.currentIndex].data.deliveryDetail;
      // const deliveryDetail = this.deliveryDetail[this.currentIndex];
      console.log('fnSetSupplementDetail deliveryDetail', deliveryDetail);
      if (moment(deliveryDetail.deliveryDate, 'DD-MM-YYYY').isValid()) {
        deliveryDetail.deliveryDate = moment(deliveryDetail.deliveryDate, 'DD-MM-YYYY').toDate();
      }

      // this.minDeliveryDate = moment(data.endDate).toDate();
      // console.log('this.minDeliveryDate', this.minDeliveryDate);
      // this.deliveryForm.controls[this.currentIndex].get('txtDeliveryDate').reset();

      // tslint:disable-next-line:max-line-length
      if (isOldData) {
        console.log('isOldData true ', deliveryDetail.deliveryDate);
        this.deliveryDetail[this.currentIndex].deliveryDate = moment(deliveryDetail.deliveryDate).toDate();
        this.minDeliveryDate = moment(deliveryDetail.deliveryDate).toDate();
      } else {
        console.log('isOldData false', data.endDate);
        this.deliveryDetail[this.currentIndex].deliveryDate = moment(data.endDate).toDate();
        this.minDeliveryDate = moment(data.endDate).toDate();
      }
      // if (moment(deliveryDetail.deliveryDate).unix() < moment(data.endDate).unix()) {
      //   this.deliveryDetail[this.currentIndex].deliveryDate = moment(data.endDate).toDate();
      //   this.minDeliveryDate = moment(data.endDate).toDate();
      // } else if (moment(deliveryDetail.deliveryDate).unix() > moment(data.endDate).unix()) {
      //   this.deliveryDetail[this.currentIndex].deliveryDate = deliveryDetail.deliveryDate;
      //   this.minDeliveryDate = moment(data.endDate).toDate();
      // } else {
      //   this.deliveryDetail[this.currentIndex].deliveryDate = deliveryDetail.deliveryDate;
      //   this.minDeliveryDate = moment(deliveryDetail.deliveryDate).toDate();
      // }
      this.deliveryDateValueChange(this.currentIndex, deliveryDetail.arrivalTime);
    }
  }

  onClickDeliveryDetailAddress(step: number) {
    if (this.deliveryDetail[step].patientAddressId === 'null') {
      this.deliveryDetail[step].patientAddressId = null;
    }
    const findAddress = this.addressList.find(obj => obj.patientAddressId === +this.deliveryDetail[step].patientAddressId);
    if (findAddress) {
      this.deliveryDetail[step].address = findAddress.address;
      // tslint:disable-next-line:max-line-length
      this.deliveryDetail[step].addressShow = findAddress.address + ' ' + (findAddress.subdistrict ? `แขวง/ตำบล${findAddress.subdistrict}` : '');
      this.deliveryDetail[step].subdistrict = findAddress.subdistrict;
      this.deliveryDetail[step].district = findAddress.district;
      this.deliveryDetail[step].province = findAddress.province;
      this.deliveryDetail[step].districtProvince = this.common.concatAddress({
        district: findAddress.district,
        province: findAddress.province,
      });
      this.deliveryDetail[step].postcode = findAddress.postcode;
    } else {
      this.deliveryDetail[step].address = ""
      // tslint:disable-next-line:max-line-length
      this.deliveryDetail[step].addressShow = ""
      this.deliveryDetail[step].subdistrict = ""
      this.deliveryDetail[step].district = ""
      this.deliveryDetail[step].province = ""
      this.deliveryDetail[step].districtProvince = ""
      this.deliveryDetail[step].postcode = ""
    }
  }

  deliveryDateValueChange(i, arrivalTime?) {
    // this.deliveryDetailForm.controls.ddlDeliveryArrivalTime.reset();
    this.deliveryForm.controls[this.currentIndex].get('ddlDeliveryArrivalTime').reset();

    const setTimeZero = { h: 0, m: 0, s: 0, ms: 0 };
    const deliveryDateOnly = moment(this.deliveryDetail[i].deliveryDate).set(setTimeZero);
    const productionEndDate = moment(this.supplementDetail.productionEndDate, 'DD/MM/YYYY').set(setTimeZero);
    if (deliveryDateOnly > productionEndDate) {
      // this.arrivalTimeList = this.arrivalTimeListBackup;
      this.deliveryDetail[i].arrivalTimeList = _.cloneDeep(this.arrivalTimeListBackup);
    } else {
      // tslint:disable-next-line:max-line-length
      // this.arrivalTimeList = this.common.checkArrivalTime(this.arrivalTimeListBackup, this.deliveryDetail[i].deliveryDate, this.supplementDetail.productionEndTime);
      // tslint:disable-next-line:max-line-length
      this.deliveryDetail[i].arrivalTimeList = this.common.checkArrivalTime(this.arrivalTimeListBackup, this.deliveryDetail[i].deliveryDate, this.supplementDetail.productionEndTime);
    }
    setTimeout(() => {
      if (arrivalTime) {
        // const findArrivalTime = this.arrivalTimeList.find(obj => obj.id === +arrivalTime);
        const findArrivalTime = this.deliveryDetail[i].arrivalTimeList.find(obj => obj.id === +arrivalTime);
        if (findArrivalTime) {
          this.deliveryDetail[i].arrivalTime = arrivalTime;
        } else {
          this.deliveryDetail[i].arrivalTime = null;
        }
        console.log('this.deliveryDetail[i].arrivalTime', this.deliveryDetail[i].arrivalTime);
      }
    }, 100);
  }

  isDisableSave() {
    for (let index = 0; index < this.stepList.length; index++) {
      const data = this.stepList[index].data;
      // check booking
      if (this.stepList.length === 1 || (this.currentIndex === this.stepList.length - 1 && index === this.stepList.length - 1)) {
        if (!this.supplementDetail.confirmedDays) {
          // console.log('this.supplementDetail.confirmedDays', this.supplementDetail.confirmedDays);
          return true;
        }
        if (!this.supplementDetail.slotNo) {
          // console.log('this.supplementDetail.slotNo', this.supplementDetail.slotNo);
          return true;
        }
        if (!this.supplementDetail.startDateTime) {
          // console.log('this.supplementDetail.startDateTime', this.supplementDetail.startDateTime);
          return true;
        }
        if (!this.supplementDetail.productionEndDate) {
          // console.log('this.supplementDetail.productionEndDate', this.supplementDetail.productionEndDate);
          return true;
        }
        if (!this.supplementDetail.productionEndTime) {
          // console.log('this.supplementDetail.productionEndTime', this.supplementDetail.productionEndTime);
          return true;
        }
        if (!this.supplementDetail.stdProductionHour) {
          // console.log('this.supplementDetail.stdProductionHour', this.supplementDetail.stdProductionHour);
          return true;
        }
      } else {
        if (!data.booking.confirmedDay) {
          // console.log('data.booking.confirmedDay', data.booking.confirmedDay);
          return true;
        }
        if (!data.booking.slotNo) {
          // console.log('data.booking.slotNo', data.booking.slotNo);
          return true;
        }
        if (!data.booking.startDateTime) {
          // console.log('data.booking.startDateTime', data.booking.startDateTime);
          return true;
        }
        if (!data.booking.productionEndDate) {
          // console.log('data.booking.productionEndDate', data.booking.productionEndDate);
          return true;
        }
        if (!data.booking.productionEndTime) {
          // console.log('data.booking.productionEndTime', data.booking.productionEndTime);
          return true;
        }
        if (!data.booking.stdProductionHour) {
          // console.log('data.booking.stdProductionHour', data.booking.stdProductionHour);
          return true;
        }
      }
      // check patientInfo
      if (!data.patientInfo.item) {
        // console.log('data.patientInfo.item', data.patientInfo.item);
        return true;
      }
      // check deliveryDetail
      if (!this.deliveryDetail[index].recipientName) {
        // console.log('this.deliveryDetail[index].recipientName', this.deliveryDetail[index].recipientName);
        return true;
      }
      if (!this.deliveryDetail[index].phone) {
        // console.log('this.deliveryDetail[index].phone', this.deliveryDetail[index].phone);
        return true;
      }
      if (!this.deliveryDetail[index].patientAddressId) {
        // console.log('this.deliveryDetail[index].patientAddressId', this.deliveryDetail[index].patientAddressId);
        return true;
      }
      if (!this.deliveryDetail[index].deliveryDate) {
        // console.log('this.deliveryDetail[index].deliveryDate', this.deliveryDetail[index].deliveryDate);
        return true;
      }
      if (!this.deliveryDetail[index].arrivalTime || this.deliveryDetail[index].arrivalTime === 'null') {
        // console.log('this.deliveryDetail[index].arrivalTime ' + index, this.deliveryDetail[index].arrivalTime);
        return true;
      }
      if (!this.deliveryDetail[index].deliveryMethod || this.deliveryDetail[index].deliveryMethod === 'null') {
        // console.log('this.deliveryDetail[index].deliveryMethod', this.deliveryDetail[index].deliveryMethod);
        return true;
      }
      if (!this.deliveryDetail[index].packaging || this.deliveryDetail[index].packaging === 'null') {
        // console.log('this.deliveryDetail[index].packaging', this.deliveryDetail[index].packaging);
        return true;
      }
    }
  }

  fnCheckUnavailableSlot() {
    try {
      const lastIndex = this.stepList.length - 1;
      for (let i = 0; i < this.stepList.length; i++) {
        const stepData = _.cloneDeep(this.stepList[i]);
        console.log('stepData', stepData);
        let startDate = moment(stepData.data.booking.startDateTime, 'DD/MM/YYYY HH:mm:ss').toDate();
        if (lastIndex === i) {
          startDate = moment(this.supplementDetail.startDateTime, 'DD/MM/YYYY HH:mm:ss').toDate();
        }
        const isDisabledTimeBefore = this.isDisabledCurrentDateTime({ startDate: startDate });
        console.log('isDisabledTimeBefore', isDisabledTimeBefore);
        if (isDisabledTimeBefore) {
          return isDisabledTimeBefore;
        }
      }
      return false;
    } catch (error) {
      return false;
    }
  }
}
