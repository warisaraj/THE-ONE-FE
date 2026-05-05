import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
// import { LayoutMenu } from '../../../shared/store/layout.menu.store';
import { Request } from '../../../../../shared/services/request.service';
import { Common } from '../../../../../shared/services/common.service';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { DxTreeListComponent } from 'devextreme-angular';
import { environment } from '../../../../../../environments/environment';
import * as moment from 'moment';
import * as _ from 'lodash';
import { CompareService } from '../../../../../shared/services/compare.service';
import { StoreService } from '../../../../../shared/services/store.service';

declare let $: any;

interface Detail {
  description: string;
  quantity: string;
  uom: string;
  unitPrice: number;
  amount: number;
}

@Component({
  selector: 'app-queue-management-booking',
  providers: [Request, Common, CompareService],
  templateUrl: './queue-management-booking.component.html',
  styleUrls: ['./queue-management-booking.scss'],
  encapsulation: ViewEncapsulation.None
})
export class QueueManagementBookingComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('myModal') myModal;
  @ViewChild(DxTreeListComponent) treeList: DxTreeListComponent;
  patientInfo = {
    hn: '',
    patientName: '',
    phone: '',
    address: '',
    district: '',
    subdistrict: '',
    province: '',
    districtProvince: '',
    postcode: '',
    contactPerson: '',
    plan: '',
    location: 0,
    item: 'Supplement',
    supplyDay: 0,
    csReason: ''
  };
  supplementDetail = {
    confirmedDay: '',
    slotNo: null,
    productionEndDate: '',
    productionEndTime: '',
    productionHour: '',
    startDateTime: '',
    additionalNote: ''
  };
  deliveryDetail = {
    deliveryDetailId: null,
    recipientName: '',
    phone: '',
    patientAddressId: null,
    address: '',
    addressShow: '',
    district: '',
    addressDetail: '',
    districtProvince: '',
    postcode: '',
    deliveryDate: null,
    arrivalTime: null,
    deliveryMethod: null,
    deliveryMethodOther: '',
    packaging: null,
    subdistrict: '',
    province: '',
    isInvoice: false,
    isReceipt: false,
    cashierId: null,
    isUrgent: false,
    cashierDeliNote: '',
    deliveryStatus: null,
    csReason: '',
  };
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
    'save': false,
    'cancel': false
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
  pageType = 'new';
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
  productionTimeMin = 90;
  fakeCurrentDate = moment().toDate();
  currentDateWithTimeBefore = moment();
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
  reserveSlot = 0;
  reserveHN = '';
  reserveId = null;
  startDayHour = 0;
  endDayHour = 24;
  isChangeBookingMode = false;
  isChangeDeliveryDetail = false;
  supplyDay = 0;
  enableDateList = {};
  itemCount = 0;
  maxProductionLine = 0;
  timeZeroMoment = { h: 0, m: 0, s: 0, ms: 0 };
  timeEndDayMoment = { h: 23, m: 59, s: 59, ms: 59 };
  productionTimeHour = [];
  timeBeforeProdStart = 0;
  productionEnd = '';
  calProductionTime: moment.Moment = null;
  bookingId = null;
  canceledBooking = false;
  dateFrom = null;
  dateTo = null;
  isUrgent = false;
  disableDateList = {};
  errorText: any;
  orderStatus = null;
  deliveryDetailId: number;
  deliveryStatus = null;
  showScheduler = false;
  remarkMsg: any = [];
  intervalUpdateWorkingBy;
  isPickupSelected: boolean = false;
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
      'txtPlan': new FormControl({ value: '', disabled: true }),
      // 'ddlItem': new FormControl({ value: 'null', disabled: true }, [Validators.required]),
      'txtItem': new FormControl({ value: '', disabled: true })
    });
    this.supplementDetailForm = this.fb.group({
      'txtConfirmedDay': new FormControl({ value: '', disabled: true }),
      'txtSlotNo': new FormControl({ value: '', disabled: true }),
      'txtProductionEndDate': new FormControl({ value: '', disabled: true }),
      'txtProductionEndTime': new FormControl({ value: '', disabled: true }),
      'txtProductionHour': new FormControl({ value: '', disabled: true }),
      'txtStartDateTime': new FormControl({ value: '', disabled: true }),
      'txtAdditionalNote': new FormControl({ value: '', disabled: false }),
    });
    this.deliveryDetailForm = this.fb.group({
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
      'txtDeliveryDetailReason': new FormControl({ value: '', disabled: true }),
    });
  }


  ngOnDestroy() {
    console.log('clear interval');
    clearInterval(this.intervalUpdateWorkingBy);
  }

  async ngOnInit() {
    try {
      document.body.scrollTop = 0;
      this.canceledBooking = false;
      this.reserveHN = '';
      this.isUrgent = false;
      
      this.disbledBtn = {
        'save': false,
        'cancel': false
      };
      
      const id = this.route.snapshot.paramMap.get('id');
      const action = this.route.snapshot.paramMap.get('action');
      const deliveryDetailId = this.route.snapshot.paramMap.get('deliveryDetailId');
      const orderStatus = this.route.snapshot.queryParams['orderStatus'];
      if (deliveryDetailId) {
        this.deliveryDetailId = +deliveryDetailId;
      }
      this.id = +id;
      let splitAction = [];
      if (action) {
        splitAction = action.split('?');
        console.log('splitAction', splitAction);
      }
      if (splitAction[0] === 'edit') {
        this.pageType = 'edit';
        this.updateWorkingBy();
        this.intervalUpdateWorkingBy = setInterval(() => {
          this.updateWorkingBy();
        }, 3000);
        this.isChangeBookingMode = true;
        this.isChangeDeliveryDetail = false;
        // this.patientInfoForm.controls['ddlItem'].disable();
        // this.patientInfoForm.controls['txtItem'].disable();
        this.supplementDetailForm.controls['txtAdditionalNote'].disable();
        this.deliveryDetailForm.controls['txtDeliveryRecipientName'].disable();
        this.deliveryDetailForm.controls['txtDeliveryPhone'].disable();
        this.deliveryDetailForm.controls['ddlDeliveryAddress'].disable();
        this.deliveryDetailForm.controls['txtDeliveryDate'].disable();
        this.deliveryDetailForm.controls['ddlDeliveryArrivalTime'].disable();
        this.deliveryDetailForm.controls['ddlDeliveryMethod'].disable();
        this.deliveryDetailForm.controls['txtDeliveryMethodOther'].disable();
        this.deliveryDetailForm.controls['ddlDeliveryPackaging'].disable();
        this.deliveryDetailForm.controls['cbxDeliveryDocumentationInvoice'].disable();
        this.deliveryDetailForm.controls['cbxDeliveryDocumentationReceipt'].disable();
        this.deliveryDetailForm.controls['ddlDeliveryCashierName'].disable();
        this.deliveryDetailForm.controls['cbxDeliveryIsUrgent'].disable();
        this.deliveryDetailForm.controls['txtDeliveryCashierDeliNote'].disable();
      }

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
      const notCheckError = ['Change Booking', 'Change Booking (Order Inserted in TC)', 'Urgent Approve']
      const modalAcceptAndContinue = ['Customer Approve']
      if (!orderStatus || orderStatus !== 'Change Delivery Detail' && !notCheckError.includes(orderStatus)) {
        console.log("-------------------------------orderStatus", orderStatus)
        const response = await this.getErrorOrder();
        if (response.resultCode !== environment.resultCodeSuccess) {
          this.loading = false;
          this.errorText = response.resultDescription.split('\n');
          if (!this.menuPermissions.edit) {
            this.goAlert(response.resultCode, response.resultDescription, 'myModalOrderErrorStatus1');
          } else if (modalAcceptAndContinue.includes(orderStatus)) {
            await this.fnLoadData();
            this.goAlert(response.resultCode, response.resultDescription, 'myModalOrderErrorEditOrAccept');
          } else {
            this.goAlert(response.resultCode, response.resultDescription, 'myModalOrderError');
          }
        } else {
          await this.fnLoadData();
        }
      } else {
        await this.fnLoadData();
      }

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
      this.store.subscribeUser().subscribe(data => {
        // this.username = data.username;
        console.log('data.username', data.username);
        const findCashier = this.cashierList.find((obj) => {
          return obj.username.toLowerCase() === data.username.toLowerCase();
        });
        console.log('findCashier', findCashier);
        if (findCashier) {
          this.deliveryDetail.cashierId = findCashier.userId;
        }
      });


    } catch (e) {
      console.log(e);
    }
  }
  async fnLoadData() {
    const dropdown = await this.common.searchConfig();
    this.patientItemList = dropdown.patientItemList || [];
    this.arrivalTimeListBackup = dropdown.arrivalTimeList || [];
    this.arrivalTimeList = dropdown.arrivalTimeList || [];
    this.packagingList = dropdown.packagingList || [];
    this.deliveryMethodList = dropdown.deliveryMethodList || [];

    try {
      this.loading = false;
      this.disbledBtn = {
        'save': false,
        'cancel': false
      };
      await this.checkGroupPermission();
      await this.searchPatientBooking();
      await this.searchDdlCashier();
      await this.searchOrderCashierView();
      await this.searchProductionTime();
      await this.searchReservation();
      const dateFrom = moment(this.currentDate).day(1).set({ h: 0, m: 0, s: 0 }).toDate();
      const dateTo = moment(this.currentDate).day(7).set({ h: 23, m: 59, s: 59 }).toDate();
      this.dateFrom = dateFrom;
      this.dateTo = dateTo;
      console.log('dateForm', dateFrom);
      console.log('dateTo', dateTo);
      await this.searchBookingCalendar(dateFrom, dateTo);
      const fromStr = moment(dateFrom).format('YYYY-MM-DD HH:mm:ss');
      const toStr = moment(dateTo).format('YYYY-MM-DD HH:mm:ss');
      await this.searchAllBooking(fromStr, toStr);
      await this.searchDdlPatientAddress();
      await this.searchCountItem();
      this.fnCheckChangeDeliveryDetail();
      this.showScheduler = true;

      // ถ้า recipientName,phone ของ deliveryDetail ไม่มีให้ไปเอาของ order
      this.deliveryDetail.addressShow = '';
      this.deliveryDetail.recipientName = this.deliveryDetail.recipientName || this.patientInfo.patientName || '';
      this.deliveryDetail.phone = this.deliveryDetail.phone || this.patientInfo.phone || '';
      if (this.deliveryDetail.patientAddressId) {
        this.onClickDeliveryDetailAddress();
      }
      if (this.pageType !== 'edit') {
        this.fnCalReserveTime(dateFrom, dateTo);
      }
    } catch (e) {
      console.log(e);
      const resultDescriptionSystemErrorTitle = environment.resultDescriptionSystemErrorTitle;
      const resultDescriptionSystemErrorMassage = environment.resultDescriptionSystemErrorMassage;
      this.goAlert(resultDescriptionSystemErrorTitle, resultDescriptionSystemErrorMassage, 'myModalError');
    }
  }
  async getErrorOrder() {
    const filterData = {
      orderId: this.id,
    };
    const checkUrl = this.common.checkMockupUrl('', '', filterData, {
      BASE_API: '',
      BASE_MODULE: environment.apiPrefix,
      BASE_RESOURCE: environment.searchErrorOrder
    });
    return await this.request.get(checkUrl.url, checkUrl.filter);
  }

  goHomeMenu() {
    if (this.menuHome) {
      this.router.navigate(['/menu', this.menuHome['menuId'], this.menuHome['typePage']]);
    }
  }

  async ngAfterViewInit() {

  }

  onInitialized(e) {
  }

  onOptionChanged(e) {
    if (e.name === 'currentDate') {
      this.fnSetSupplementDetail({});
      const instance = e.component;
      setTimeout(async () => {
        const dateFrom = instance.getStartViewDate();
        const dateTo = instance.getEndViewDate();
        this.dateFrom = dateFrom;
        this.dateTo = dateTo;
        console.log('dateForm', dateFrom);
        console.log('dateTo', dateTo);
        await this.searchProductionTime();
        await this.searchBookingCalendar(dateFrom, dateTo);
        const fromStr = moment(dateFrom).format('YYYY-MM-DD HH:mm:ss');
        const toStr = moment(dateTo).format('YYYY-MM-DD HH:mm:ss');
        await this.searchAllBooking(fromStr, toStr);
        // await this.searchAllBooking(dateFrom, dateTo);
        if (this.canceledBooking && !this.isChangeBookingMode && this.pageType === 'edit') {
          document.querySelector('.dx-scheduler-navigator.dx-widget').setAttribute('style', 'display:block');
          // tslint:disable-next-line:max-line-length
          this.appointmentsData = this.appointmentsData.filter(obj => obj.data.bookingId !== this.bookingId || obj.data.reserveId !== this.reserveId);
        }
        this.fnCalReserveTime(dateFrom, dateTo);
      }, 100);
    }
  }

  fnReplaceTime(value) {
    return +moment(value, 'HH:mm', true).format('H.m');
  }

  fnCalDuration(start: moment.Moment, end: moment.Moment) {
    return end.diff(start, 'h', true);
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
          this.timeBeforeProdStart = this.isUrgent ? 0 : data.timeBeforeProdStart;
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
        this.remarkMsg = []
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
            this.remarkMsg.push(`Production stopped on ${moment(data.date).format('DD/MM/YYYY')} (All day) (Reason : ${data.productionStoppedReason})`)
            continue;
          }

          if (data.isProductionStopped && data.productionStoppedTime === 2) {
            this.disableDateList[data.date].from = moment(data.date + ' ' + data.productionStoppedFrom);
            this.disableDateList[data.date].to = moment(data.date + ' ' + data.productionStoppedTo);
            this.remarkMsg.push(`Production stopped on ${moment(data.date).format('DD/MM/YYYY')} (${data.productionStoppedFrom} - ${data.productionStoppedTo}) (Reason : ${data.productionStoppedReason})`)
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

            // // ถ้าเป็นวันเดียวกันจะต้องเอา Time Before Production Start ไปคำนวณด้วย
            // if (dateCurrent.unix() === dateAdditional.unix()) {
            //   const dateWithTimeBefore = moment().set({
            //     h: additionalOpenH,
            //     m: additionalOpenM,
            //     s: 0,
            //     ms: 0
            //   }).add(this.timeBeforeProdStart * 30, 'm');
            //   if (moment().unix() >= dateWithTimeBefore.unix()) {
            //     additionalOpenDateTime = this.fnCalCurrent30Min().add(this.timeBeforeProdStart * 30, 'm').set({
            //       s: 0,
            //       ms: 0
            //     });
            //   } else {
            //     additionalOpenDateTime = moment().set({
            //       h: additionalOpenH,
            //       m: additionalOpenM,
            //       s: 0,
            //       ms: 0
            //     }).add(this.timeBeforeProdStart * 30, 'm');
            //   }
            // }

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
      this.appointmentsData = [];
      const filterData = {
        dateFrom: dateFrom,
        dateTo: dateTo,
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
          if (this.reserveId === data.reserveId && this.pageType !== 'edit') {
            continue;
          }
          const appointmentData = {
            text: `HN :\n${hn}`,
            priorityId: slot,
            startDate: moment(startDate).toDate(),
            endDate: moment(endDate).toDate(),
            data: {
              bookingId: data.bookingId,
              reserveId: data.reserveId,
              orderId: data.orderId,
              hn: hn,
              name: name,
              supplyDay: supplyDay,
              isAllowCancelDate: this.pageType === 'edit' && (data.orderId === +this.id || data.reserveId === this.reserveId)
            }
          };
          this.appointmentsData.push(appointmentData);
          if (this.pageType === 'edit' && (data.orderId === +this.id || data.reserveId === this.reserveId)) {
            this.bookingId = data.bookingId;
            this.fnSetSupplementDetail(appointmentData);
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

  async searchOrderCashierView() {
    try {
      const filterData = {
        orderId: this.id,
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
        // patientInfo
        const patientInfo = resultData.order || {};
        this.orderStatus = patientInfo.orderStatus;
        this.patientInfo.hn = patientInfo.hn;
        this.patientInfo.patientName = patientInfo.patientName;
        this.patientInfo.phone = patientInfo.phone;
        this.patientInfo.postcode = patientInfo.postcode;
        this.patientInfo.contactPerson = patientInfo.contactPerson;
        this.patientInfo.plan = patientInfo.plan;
        this.patientInfo.location = +patientInfo.location;
        // this.supplementDetail.confirmedDay = patientInfo.supplyDay;
        // tslint:disable-next-line:max-line-length
        if (patientInfo.orderStatus === 9 || patientInfo.orderStatus === 11 || patientInfo.orderStatus === 15 || patientInfo.orderStatus === 16) {
          this.supplementDetail.confirmedDay = patientInfo.supplyDay;
        } else {
          this.supplementDetail.confirmedDay = patientInfo.confirmedDay;
        }
        // this.patientInfo.item = patientInfo.item || 1;
        // if(patientInfo.item === 1){this.patientInfo.item = 'Supplement'}
        this.patientInfo.item = 'Supplement';
        // tslint:disable-next-line:max-line-length
        const address = patientInfo.address ? `${patientInfo.address} ` : '';
        const subdistrict = patientInfo.subdistrict ? `แขวง/ตำบล${patientInfo.subdistrict} ` : '';
        const district = patientInfo.district ? `เขต/อำเภอ${patientInfo.district} ` : '';
        const province = patientInfo.province ? `จังหวัด${patientInfo.province} ` : '';
        this.patientInfo.address = `${address}${subdistrict}`;
        this.patientInfo.districtProvince = `${district}${province}`;
        this.patientInfo.supplyDay = +patientInfo.supplyDay || 0;
        this.isUrgent = +patientInfo.orderStatus === 11;
        this.patientInfo.csReason = patientInfo.csReason;

        // ถ้ามีการจอง booking ไว้จะเปิดปฏิทินของ week นั้น
        if (patientInfo.productionStartDate) {
          this.currentDate = moment(patientInfo.productionStartDate, 'DD/MM/YYYY').toDate();
        }
      } else {
        // this.goAlert(response.resultCode, response.resultDescription, 'myModalError');
      }

    } catch (e) {
      console.log(e);
      // const resultDescriptionSystemErrorTitle = environment.resultDescriptionSystemErrorTitle;
      // const resultDescriptionSystemErrorMassage = environment.resultDescriptionSystemErrorMassage;
      // this.goAlert(resultDescriptionSystemErrorTitle, resultDescriptionSystemErrorMassage, 'myModalError');
    }
  }

  async searchCountItem() {
    try {
      const filterData = {
        orderId: this.id,
      };
      const checkUrl = this.common.checkMockupUrl('', '', filterData, {
        BASE_API: '',
        BASE_MODULE: environment.apiPrefix,
        BASE_RESOURCE: environment.searchCountItem
      });
      const resultCodeSuccess = environment.resultCodeSuccess;

      const response = await this.request.get(checkUrl.url, checkUrl.filter);
      if (response.resultCode === resultCodeSuccess) {
        const resultData = await response.resultData;
        this.itemCount = resultData.itemCount || 1; // ถ้าได้ 0 หรือไม่มีค่าจะ default เป็น 1
      } else {
        // this.goAlert(response.resultCode, response.resultDescription, 'myModalError');
      }

    } catch (e) {
      console.log(e);
      // const resultDescriptionSystemErrorTitle = environment.resultDescriptionSystemErrorTitle;
      // const resultDescriptionSystemErrorMassage = environment.resultDescriptionSystemErrorMassage;
      // this.goAlert(resultDescriptionSystemErrorTitle, resultDescriptionSystemErrorMassage, 'myModalError');
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

  async searchPatientBooking() {
    try {
      const filterData = {
        orderId: this.id,
        deliveryDetailId: this.deliveryDetailId
      };

      const checkUrl = this.common.checkMockupUrl('', '', filterData, {
        BASE_API: '',
        BASE_MODULE: environment.apiPrefix,
        BASE_RESOURCE: environment.searchPatientBooking
      });

      const resultCodeSuccess = environment.resultCodeSuccess;

      const response = await this.request.get(checkUrl.url, checkUrl.filter);
      if (response.resultCode === resultCodeSuccess) {
        const resultData = await response.resultData;

        // Delivery Detail
        let deliveryDetail: any = {};
        if (resultData.deliveryDetail && resultData.deliveryDetail[0]) {
          deliveryDetail = resultData.deliveryDetail[0];
        } else if (resultData.deliveryDetail) {
          deliveryDetail = resultData.deliveryDetail;
        }
        this.deliveryStatus = deliveryDetail.deliveryStatus;
        this.deliveryDetail.deliveryDetailId = deliveryDetail.deliveryDetailId;
        this.deliveryDetail.recipientName = deliveryDetail.recipientName;
        this.deliveryDetail.phone = deliveryDetail.phone;
        this.deliveryDetail.patientAddressId = deliveryDetail.patientAddressId ? +deliveryDetail.patientAddressId : null;
        console.log('this.deliveryDetail.patientAddressId', this.deliveryDetail.patientAddressId);
        if (this.deliveryDetail.patientAddressId) {
          this.onClickDeliveryDetailAddress();
        } else {
          this.deliveryDetail.address = deliveryDetail.address;
          this.deliveryDetail.addressShow = (deliveryDetail.address ? `${deliveryDetail.address} ` : '') + (deliveryDetail.subdistrict ? `แขวง/ตำบล${deliveryDetail.subdistrict}` : '')
          this.deliveryDetail.addressDetail = deliveryDetail.addressDetail;
          this.deliveryDetail.districtProvince = deliveryDetail.districtProvince;
          this.deliveryDetail.postcode = deliveryDetail.postcode;
        }
        // tslint:disable-next-line:max-line-length
        this.deliveryDetail.deliveryDate = deliveryDetail.deliveryDate ? this.common.stringToDate(deliveryDetail.deliveryDate, 'DD/MM/YYYY') : null;
        this.deliveryDetail.arrivalTime = deliveryDetail.arrivalTime || null;
        this.deliveryDetail.deliveryMethod = deliveryDetail.deliveryMethod || null;
        if (this.deliveryDetail.deliveryMethod) {
          this.onDeliveryMethodChanged(this.deliveryDetail.deliveryMethod)
        }
        this.deliveryDetail.deliveryMethodOther = deliveryDetail.deliveryMethodOther || '';
        this.deliveryDetail.packaging = deliveryDetail.packaging || null;
        this.deliveryDetail.isInvoice = deliveryDetail.isInvoice || false;
        this.deliveryDetail.isReceipt = deliveryDetail.isReceipt || false;
        this.deliveryDetail.cashierId = deliveryDetail.cashierId || null;
        this.deliveryDetail.isUrgent = deliveryDetail.isUrgent || false;
        this.deliveryDetail.cashierDeliNote = deliveryDetail.cashierDeliNote;
        this.deliveryDetail.deliveryStatus = deliveryDetail.deliveryStatus;
        this.deliveryDetail.csReason = deliveryDetail.csReason;
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

  async searchReservation() {
    try {
      const filterData = {
        hn: this.patientInfo.hn,
      };

      const checkUrl = this.common.checkMockupUrl('', '', filterData, {
        BASE_API: '',
        BASE_MODULE: environment.apiPrefix,
        BASE_RESOURCE: environment.searchReservation
      });

      const resultCodeSuccess = environment.resultCodeSuccess;

      const response = await this.request.get(checkUrl.url, checkUrl.filter);
      if (response.resultCode === resultCodeSuccess) {
        const data = await response.resultData || response.data;
        if (data[0]) {
          this.currentDate = moment(data[0].productionStartDateTime, 'DD/MM/YYYY HH:mm:ss').toDate();
          this.reserveHN = data[0].hn;
          this.reservedDateFrom = moment(data[0].productionStartDateTime, 'DD/MM/YYYY HH:mm:ss');
          this.reservedDateTo = moment(data[0].productionEndDateTime, 'DD/MM/YYYY HH:mm:ss');
          this.reserveSlot = +data[0].slotNo;
          this.reserveId = data[0].reserveId;
        }
      } else {
        // this.goAlert(response.resultCode, response.resultDescription, 'myModalError');
      }
    } catch (e) {
      console.error('searchReservation error', e);
      const resultDescriptionSystemErrorTitle = environment.resultDescriptionSystemErrorTitle;
      const resultDescriptionSystemErrorMassage = environment.resultDescriptionSystemErrorMassage;
      this.goAlert(resultDescriptionSystemErrorTitle, resultDescriptionSystemErrorMassage, 'myModalError');
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

  fnCalReserveTime(dateFrom, dateTo) {
    // คำนวณหาเวลาของแท่งน้ำตาล หน้า reservation จะยึด productionTimeHour11 เลย
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

    this.fnClearAppointmentReserve();
    console.log('this.enableDateList', this.enableDateList);
    const enableDateListKeys = _.keys(this.enableDateList).sort();
    if (this.productionTimeMin > 0) {
      // ถ้าเข้ามาด้วย hn เดียวกันกับที่ reserve ต้องไปทับที่ slot เขียว
      let isOldReserve = false;
      if (this.reservedDateFrom) {
        const oldReserveDate = this.reservedDateFrom.format('YYYY-MM-DD');
        const findEnableReserveDate = enableDateListKeys.indexOf(oldReserveDate);
        if (findEnableReserveDate >= 0) {
          console.log('this.enableDateList[oldReserveDate]', this.enableDateList[oldReserveDate]);
          const slotOldReserve = 'slot' + this.reserveSlot;
          if (this.enableDateList[oldReserveDate] && this.enableDateList[oldReserveDate][slotOldReserve]) {
            console.log('this.enableDateList[dateOldBooking][slotOldBooking]', this.enableDateList[oldReserveDate][slotOldReserve]);
            const findEnableOldBooking = this.enableDateList[oldReserveDate][slotOldReserve];
            const duration = findEnableOldBooking['duration'];
            const timeOpen = moment(this.reservedDateFrom);
            const timeOpenEnable = findEnableOldBooking['timeOpen'];
            const timeClose = findEnableOldBooking['timeClose'];
            const h = this.timeToMoment(timeOpen).get('h');
            const m = this.timeToMoment(timeOpen).get('m');

            const currentDate = moment().set(this.timeZeroMoment);
            const dataDate = moment(oldReserveDate).set(this.timeZeroMoment);
            const calStartDate = dataDate.set({ h, m, s: 0, ms: 0 });

            if (calStartDate >= currentDate && duration >= (this.productionTimeMin / 60)) {

              // หาช่วงเวลาที่มีการจองแล้ว ต้องเปลี่ยนไปจองช่วงเวลาต่อไป
              const appointmentsMatchDate = this.appointmentsData.filter((obj) => {
                return moment(obj.startDate).format('YYYYMMDD') === timeOpen.format('YYYYMMDD')
                  && obj.priorityId === +slotOldReserve.replace('slot', '');
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
                    priorityId: +slotOldReserve.replace('slot', ''),
                    startDate: reserveTime.toDate(),
                    endDate: reserveTimeEnd.toDate(),
                    data: {
                      hn: '',
                      name: '',
                      supplyDay: this.patientInfo.supplyDay,
                    }
                  };
                  this.appointmentsData.push(reserveData);
                  this.fnSetSupplementDetail(reserveData);
                  isOldReserve = true;
                  break;
                }
                startDateOfDay.add(30, 'minute');
                reserveTimeEnd.add(30, 'minute');
              }
            }
          }
        }
      }

      // ถ้าม่ใช่เคสที่ต้องจองทับ slot ที่ reserve ไว้ก็เข้าเงื่อนไขตามปกติ
      if (!isOldReserve) {
        // start loop object 1
        for (let i = 0; i < enableDateListKeys.length; i++) {
          const key = enableDateListKeys[i];
          console.log('key', key);
          if (this.enableDateList.hasOwnProperty(key)) {
            // tslint:disable-next-line:max-line-length
            if (!moment(key).set(this.timeZeroMoment).isBetween(moment(dateFrom).set(this.timeZeroMoment).subtract(1, 's'), moment(dateTo).set(this.timeEndDayMoment))) {
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
                      if (this.pageType === 'edit' && !this.canceledBooking) {
                        return;
                      }
                      const reserveData = {
                        text: '',
                        priorityId: +key2.replace('slot', ''),
                        startDate: reserveTime.toDate(),
                        endDate: reserveTimeEnd.toDate(),
                        data: {
                          hn: '',
                          name: '',
                          supplyDay: this.supplyDay
                        }
                      };
                      this.appointmentsData.push(reserveData);
                      this.fnSetSupplementDetail(reserveData);
                      console.log('this.appointmentsData', this.appointmentsData);
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
      }
    }
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

  fnSetSupplementDetail(data) {
    // console.log('fnSetSupplementDetail data', data);
    const diffHour = this.fnCalDuration(moment(data.startDate), moment(data.endDate));
    // this.supplementDetail.confirmedDay = moment().format('D');
    this.supplementDetail.slotNo = data.priorityId;
    this.supplementDetail.productionEndDate = data.endDate ? moment(data.endDate).format('DD/MM/YYYY') : null;
    this.supplementDetail.productionEndTime = data.endDate ? moment(data.endDate).format('HH:mm') : null;
    this.supplementDetail.productionHour = diffHour.toString();
    this.supplementDetail.startDateTime = data.startDate ? moment(data.startDate).format('DD/MM/YYYY HH:mm') : null;

    // set min delivery date / clear arrival time
    if (moment(data.endDate).set(this.timeZeroMoment) > moment().set(this.timeZeroMoment)) {
      this.minDeliveryDate = moment(data.endDate).toDate();
    } else {
      this.minDeliveryDate = moment().toDate();
    }
    // console.log('txtDeliveryDate reset', this.deliveryDetail.deliveryDate);
    if (this.pageType === 'edit') {
      this.deliveryDetailForm.controls.txtDeliveryDate.reset(this.deliveryDetail.deliveryDate);
    } else {
      this.deliveryDetailForm.controls.txtDeliveryDate.reset();
    }
    this.deliveryDateValueChange();
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

  async fnSave() {
    console.log('fnSave', this.disbledBtn);
    if (this.disbledBtn.save) {
      console.log('Save function is already running, please wait...');
      return;
    }

    this.disbledBtn = {
      'save': true,
      'cancel': true
    };

    try {
      const resultCodeSuccess = environment.resultCodeSuccess;
      if (this.isChangeDeliveryDetail) {
        const validDeliveryDetailForm: boolean = this.fnCheckDeliveryDetailForm();
        if (validDeliveryDetailForm) {
          const checkUrl = this.common.checkMockupUrl('', '', {}, {
            BASE_API: '',
            BASE_MODULE: environment.apiPrefix,
            BASE_RESOURCE: environment.updateDeliveryDetail
          });
          const postData: any = {
            orderId: +this.id,
            deliveryDetailId: this.deliveryDetailId,
            recipientName: this.deliveryDetail.recipientName,
            phone: this.deliveryDetail.phone,
            patientAddressId: +this.deliveryDetail.patientAddressId,
            address: this.deliveryDetail.address,
            district: this.deliveryDetail.district,
            subdistrict: this.deliveryDetail.subdistrict,
            province: this.deliveryDetail.province,
            postcode: this.deliveryDetail.postcode,
            deliveryDate: this.deliveryDetail.deliveryDate,
            arrivalTime: this.deliveryDetail.arrivalTime,
            deliveryMethod: this.deliveryDetail.deliveryMethod,
            packaging: this.deliveryDetail.packaging,
            isInvoice: this.deliveryDetail.isInvoice ? 1 : 0,
            isReceipt: this.deliveryDetail.isReceipt ? 1 : 0,
            cashierId: this.deliveryDetail.cashierId,
            isUrgent: this.deliveryDetail.isUrgent ? 1 : 0,
            cashierDeliNote: this.deliveryDetail.cashierDeliNote
          };
          if (+this.deliveryDetail.deliveryMethod === 6) {
            postData.deliveryMethodOther = this.deliveryDetail.deliveryMethodOther;
          }
          const response = await this.request.post(checkUrl.url, postData);
          if (response.resultCode === resultCodeSuccess) {
            this.goAlert('', '', 'myModalPrintDocument', {
              printPageList: [
                {
                  name: 'Delivery Detail',
                  url: environment.printDeliveryDetail,
                }
              ],
              orderId: response.orderId || this.id,
              isShowPrintLabel: true
            });
          } else {
            this.goAlert(response.resultCode, response.resultDescription, 'myModalError');
          }
        } else {
          console.log('กรุณากรอกข้อมูลให้ถูกต้อง');
          this.goAlert('Field is required', 'Your have left a field empty and a value must be entered.', 'myModalWarning');
        }
      } else {
        // const validPatientInfoForm: boolean = this.fnCheckPatientInfoForm();
        const validDeliveryDetailForm: boolean = this.fnCheckDeliveryDetailForm();

        const findBookingData = this.appointmentsData.find((obj) => {
          return obj.text === '';
        });
        console.log('findBookingData', findBookingData);
        const isUnavailableSlot = this.fnCheckUnavailableSlot(findBookingData);
        console.log('isUnavailableSlot', isUnavailableSlot);
        if (validDeliveryDetailForm && findBookingData && !isUnavailableSlot) {
          const endDate = moment(findBookingData.endDate);
          const startDate = moment(findBookingData.startDate);
          const diffTime = endDate.diff(startDate, 'hour', true);

          const postData: any = {
            orderId: this.id,
            patientInfo: {
              hn: this.patientInfo.hn,
              patientName: this.patientInfo.patientName,
              phone: this.patientInfo.phone,
              address: this.patientInfo.address,
              district: this.patientInfo.district,
              subdistrict: this.patientInfo.subdistrict,
              province: this.patientInfo.province,
              postcode: this.patientInfo.postcode,
              contactPerson: this.patientInfo.contactPerson,
              item: 1
            },
            booking: {
              // confirmedDay: +moment().format('DD'),
              confirmedDay: +this.patientInfo.supplyDay,
              supplyDay: +this.patientInfo.supplyDay || 0,
              slotNo: findBookingData.priorityId,
              productionStartDate: this.common.dateToString(findBookingData.startDate, 'YYYY-MM-DD'),
              productionStartTime: this.common.dateToString(findBookingData.startDate, 'HH:mm'),
              productionEndDate: this.common.dateToString(findBookingData.endDate, 'YYYY-MM-DD'),
              productionEndTime: this.common.dateToString(findBookingData.endDate, 'HH:mm'),
              stdProductionHour: diffTime,
              cashierSupNote: this.supplementDetail.additionalNote
            },
            deliveryDetail: {
              recipientName: this.deliveryDetail.recipientName,
              phone: this.deliveryDetail.phone,
              patientAddressId: this.deliveryDetail.patientAddressId,
              address: this.deliveryDetail.address,
              district: this.deliveryDetail.district,
              subdistrict: this.deliveryDetail.subdistrict,
              province: this.deliveryDetail.province,
              postcode: this.deliveryDetail.postcode,
              deliveryDate: this.deliveryDetail.deliveryDate,
              arrivalTime: this.deliveryDetail.arrivalTime,
              deliveryMethod: this.deliveryDetail.deliveryMethod,
              packaging: this.deliveryDetail.packaging,
              isInvoice: this.deliveryDetail.isInvoice ? 1 : 0,
              isReceipt: this.deliveryDetail.isReceipt ? 1 : 0,
              cashierId: this.deliveryDetail.cashierId,
              isUrgent: this.deliveryDetail.isUrgent ? 1 : 0,
              cashierDeliNote: this.deliveryDetail.cashierDeliNote
            }
          };
          if (+this.deliveryDetail.deliveryMethod === 6) {
            postData.deliveryDetail.deliveryMethodOther = this.deliveryDetail.deliveryMethodOther;
          }

          let response;
          let checkUrl;
          if (this.pageType === 'new') {
            checkUrl = this.common.checkMockupUrl('', '', {}, {
              BASE_API: '',
              BASE_MODULE: environment.apiPrefix,
              BASE_RESOURCE: environment.createBooking
            });
            response = await this.request.post(checkUrl.url, postData);
            if (response.resultCode === resultCodeSuccess) {
              this.goAlert('', '', 'myModalPrintDocument', {
                printPageList: [
                  {
                    name: 'Supplement Confirmation',
                    url: environment.printSupplementDetail,
                  },
                  {
                    name: 'Delivery Detail',
                    url: environment.printDeliveryDetail,
                  }
                ],
                orderId: this.id,
                isShowPrintLabel: true
              });
            } else {
              this.goAlert(response.resultCode, response.resultDescription, 'myModalError');
            }
          } else {
            const updateData: any = {
              orderId: this.id,
              hn: this.patientInfo.hn,
              patientInfo: {
                item: 1
              },
              booking: postData.booking,
              deliveryDetail: postData.deliveryDetail
            };
            updateData.deliveryDetail.deliveryDetailId = this.deliveryDetail.deliveryDetailId;

            checkUrl = this.common.checkMockupUrl('', '', {}, {
              BASE_API: '',
              BASE_MODULE: environment.apiPrefix,
              BASE_RESOURCE: environment.updateChangeBooking
            });
            response = await this.request.post(checkUrl.url, updateData);
            if (response.resultCode === resultCodeSuccess) {
              this.goAlert('', '', 'myModalSuccess');
            } else {
              this.goAlert(response.resultCode, response.resultDescription, 'myModalError');
            }
          }
        } else {
          if (isUnavailableSlot) {
            // tslint:disable-next-line:max-line-length
            this.goAlert('This time slot is unavailable for booking', 'Please check that the time slot you have chosen are available.', 'myModalWarning');
          } else {
            console.log('กรุณากรอกข้อมูลให้ถูกต้อง');
            this.goAlert('Field is required', 'Your have left a field empty and a value must be entered.', 'myModalWarning');
          }
        }
      }
    } catch (e) {
      console.log(e);
    } finally {
      // รีเซ็ตสถานะการทำงานเสมอ ไม่ว่าจะสำเร็จหรือไม่
      this.disbledBtn = {
        'save': false,
        'cancel': false
      };
    }
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
    console.log('this.patientInfoForm.valid', this.patientInfoForm.valid);
    return this.patientInfoForm.valid;
  }

  fnCheckDeliveryDetailForm() {
    let isValid = true;
    console.log(this.deliveryDetailForm.controls, this.deliveryDetailForm, this.deliveryDetailForm.valid);
    // check deliveryMethod
    if (+this.deliveryDetail.deliveryMethod === 6) {
      this.deliveryDetailForm.controls['txtDeliveryMethodOther'].setValidators(Validators.required);
    } else {
      this.deliveryDetailForm.controls['txtDeliveryMethodOther'].setValidators(null);
    }
    this.deliveryDetailForm.controls['txtDeliveryMethodOther'].updateValueAndValidity();

    // start validate
    for (const key in this.deliveryDetailForm.controls) {
      if (this.deliveryDetailForm.controls[key].errors) {
        this.deliveryDetailForm.controls[key].setErrors({ 'forceRequired': true });
        this.deliveryDetailForm.controls[key].markAsDirty();
      } else {
        this.deliveryDetailForm.controls[key].updateValueAndValidity();
      }

      // เช็ควันที่กรณีที่เป็นอดีตจะไม่ให้ผ่าน
      if (key === 'txtDeliveryDate') {
        console.log('this.deliveryDetail.deliveryDate', this.deliveryDetail.deliveryDate);
        const deliveryDateTimeZero = moment(this.deliveryDetail.deliveryDate).set({ h: 0, m: 0, s: 0, ms: 0 });
        const minTimeZero = moment(this.minDeliveryDate).set({ h: 0, m: 0, s: 0, ms: 0 });
        console.log('minTimeZero', minTimeZero);
        console.log('deliveryDateTimeZero < minTimeZero', deliveryDateTimeZero < minTimeZero);
        if (deliveryDateTimeZero < minTimeZero) {
          this.deliveryDetailForm.controls[key].setErrors({ 'forceRequired': true });
          this.deliveryDetailForm.controls[key].markAsDirty();
        } else {
          this.deliveryDetailForm.controls[key].updateValueAndValidity();
        }
      } else {
        this.deliveryDetailForm.controls[key].updateValueAndValidity();
      }
    }
    console.log('this.deliveryDetailForm.valid', this.deliveryDetailForm.valid);
    isValid = this.deliveryDetailForm.valid

    if (!this.deliveryDetail.cashierId) {
      isValid = false
    }
    return isValid;
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
    this.router.navigate(['/order-management', 'orders-cashier-view']);
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
    if (this.pageType === 'edit' && !this.canceledBooking) {
      return true;
    } else {
      return !this.isEnableDate(data) || this.isDisabledCurrentDateTime(data) || this.isDisableDateByProductionStopped(data);
    }
  }

  isReservedDateForTemplate(data: any) {
    if (this.reservedDateFrom && this.reservedDateTo && !this.isDisableDate(data)) {
      const slot = data.groups ? data.groups.priorityId : data.priorityId;
      const startDate = moment(data.startDate);
      const endDate = moment(data.endDate);
      // tslint:disable-next-line:max-line-length
      return this.reservedDateFrom.unix() <= startDate.unix() && startDate.unix() <= this.reservedDateTo.unix()
        && this.reservedDateFrom.unix() <= endDate.unix() && endDate.unix() <= this.reservedDateTo.unix()
        && this.reserveSlot === slot;
      // return currentDate >= this.reservedDateFrom && currentDate <= this.reservedDateTo && this.reserveSlot === slot;
    } else {
      return false;
    }
  }

  isReservedDate(data: any) {
    if (this.reservedDateFrom && this.reservedDateTo && !this.isDisableDate(data)) {
      const slot = data.groups ? data.groups.priorityId : data.priorityId;
      const startDate = moment(data.startDate);
      const endDate = moment(data.endDate);
      // tslint:disable-next-line:max-line-length
      return (this.reservedDateFrom.unix() <= startDate.add(1, 'm').unix() && startDate.add(1, 'm').unix() <= this.reservedDateTo.unix()
        // tslint:disable-next-line:max-line-length
        || this.reservedDateFrom.unix() <= endDate.subtract(1, 'm').unix() && endDate.subtract(1, 'm').unix() <= this.reservedDateTo.unix())
        && this.reserveSlot === slot;
      // return currentDate >= this.reservedDateFrom && currentDate <= this.reservedDateTo && this.reserveSlot === slot;
    } else {
      return false;
    }
  }

  onAppointmentDblClick(e: any) {
    e.cancel = true;
  }

  onAppointmentClick(e: any) {
    console.log('onAppointmentClick', e);
    e.cancel = true;
    const isAllowCancelDate = e.appointmentData.data.isAllowCancelDate;
    if (isAllowCancelDate && this.isChangeBookingMode) {
      this.goAlert('Are you sure', 'You want to cancel booking ?', 'myModalConfirm', {
        iconURL: '../../assets/icon-md/calendar.png'
      });
    }
  }

  onAppointmentUpdating(e: any) {
    const newData = e.newData;
    for (let i = 0; i < this.appointmentsData.length; i++) {
      const data = this.appointmentsData[i];
      if ((newData.priorityId === data.priorityId && data.text !== '' && this.common.isNotAvailable(newData, data))
        || this.isDisableDate(newData)
        || !this.isDisableDateByProductionStoppedAppointment(newData)) {
        e.cancel = true;
        return;
      } else {
        data.data.isReservedSlot = false;
        this.fnSetSupplementDetail(newData);
      }
    }
  }

  onAppointmentRendered(e: any) {
    const appointmentElement: HTMLElement = e.appointmentElement;
    appointmentElement.style.width = (appointmentElement.clientWidth + 31) + 'px';
    const isAllowCancelDate = e.appointmentData.data.isAllowCancelDate;
    const isReservedDate = e.appointmentData.data.isReservedDate;
    appointmentElement.title = '';
    console.log('e.appointmentData', e.appointmentData);
    if (e.appointmentData.text === '') {
      if (this.isReservedDate(e.appointmentData)) {
        console.log('isReservedSlot');
        e.appointmentData.data.isReservedSlot = true;
        appointmentElement.querySelector('.dx-scheduler-appointment-title').innerHTML = 'Reserved\nSlot';
        appointmentElement.querySelector('.dx-scheduler-appointment-title').setAttribute('style', 'color:#ffffff');
        appointmentElement.style.backgroundColor = '#829D87';
      } else {
        appointmentElement.style.backgroundColor = '#AE934F';
      }
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
        document.querySelector('.dx-scheduler-navigator.dx-widget').setAttribute('style', 'display:none');
        // tslint:disable-next-line:max-line-length
      } else if (e.appointmentData.data.hn === this.patientInfo.hn && (+e.appointmentData.data.orderId === +this.id || +e.appointmentData.data.reserveId === +this.reserveId) && this.isChangeDeliveryDetail) {
        appointmentElement.querySelector('.dx-scheduler-appointment-title').innerHTML = '';
        appointmentElement.style.backgroundColor = '#797979';
        document.querySelector('.dx-scheduler-navigator.dx-widget').setAttribute('style', 'display:none');
      } else {
        appointmentElement.style.backgroundColor = '#F9F7F2';
      }
    }

    // ถ้าเวลาเปิดเกิน 23:30 ต้องไม่แสดงส่วนที่ dis หลังจาก 23:30
    // if (this.endDayHour >= 24) {
    // this.endDayHour = 23.5;
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

  fnUrgentRequest() {
    this.goAlert('Are you sure', 'You want to send urgent order request ?', 'myModalUrgentRequest');
  }

  async onConfirmUrgentRequest(e) {
    console.log('onConfirmUrgentRequest', e);
    try {
      const resultCodeSuccess = environment.resultCodeSuccess;
      const postData: any = {
        orderId: this.id,
        urgentRequestReason: e
      };
      const checkUrl = this.common.checkMockupUrl('', '', {}, {
        BASE_API: '',
        BASE_MODULE: environment.apiPrefix,
        BASE_RESOURCE: environment.createUrgentRequest
      });
      const response = await this.request.post(checkUrl.url, postData);
      if (response.resultCode === resultCodeSuccess) {
        this.goAlert('', '', 'myModalSuccess');
      } else {
        this.goAlert(response.resultCode, response.resultDescription, 'myModalError');
      }
    } catch (e) {
      console.log(e);
      const resultDescriptionSystemErrorTitle = environment.resultDescriptionSystemErrorTitle;
      const resultDescriptionSystemErrorMassage = environment.resultDescriptionSystemErrorMassage;
      this.goAlert(resultDescriptionSystemErrorTitle, resultDescriptionSystemErrorMassage, 'myModalError');
    }
  }

  async onClickOk() {
    document.querySelector('.dx-scheduler-navigator.dx-widget').setAttribute('style', 'display:block');
    console.log('onClickOk');
    this.fnSetSupplementDetail({});
    if (this.reserveId) {
      this.appointmentsData = this.appointmentsData.filter(obj => obj.data.reserveId !== this.reserveId);
    } else if (this.bookingId) {
      this.appointmentsData = this.appointmentsData.filter(obj => obj.data.bookingId !== this.bookingId);
    }
    console.log('this.appointmentsData', this.appointmentsData);
    this.canceledBooking = true;
    setTimeout(() => {
      this.isChangeBookingMode = false;
      // this.patientInfoForm.controls['ddlItem'].disable();
      // this.patientInfoForm.controls['txtItem'].disable();
      this.supplementDetailForm.controls['txtAdditionalNote'].enable();
      this.deliveryDetailForm.controls['txtDeliveryRecipientName'].enable();
      this.deliveryDetailForm.controls['txtDeliveryPhone'].enable();
      this.deliveryDetailForm.controls['ddlDeliveryAddress'].enable();
      this.deliveryDetailForm.controls['txtDeliveryDate'].enable();
      this.deliveryDetailForm.controls['ddlDeliveryArrivalTime'].enable();
      this.deliveryDetailForm.controls['ddlDeliveryMethod'].enable();
      this.deliveryDetailForm.controls['txtDeliveryMethodOther'].enable();
      this.deliveryDetailForm.controls['ddlDeliveryPackaging'].enable();
      this.deliveryDetailForm.controls['cbxDeliveryDocumentationInvoice'].enable();
      this.deliveryDetailForm.controls['cbxDeliveryDocumentationReceipt'].enable();
      // this.deliveryDetailForm.controls['ddlDeliveryCashierName'].enable();
      this.deliveryDetailForm.controls['cbxDeliveryIsUrgent'].enable();
      this.deliveryDetailForm.controls['txtDeliveryCashierDeliNote'].enable();
      this.fnCalReserveTime(this.dateFrom, this.dateTo);
    }, 100);
    // await this.fnSave();
  }

  onClickDeliveryDetailAddress() {
    if (this.deliveryDetail.patientAddressId === 'null') {
      this.deliveryDetail.patientAddressId = null;
    }
    const findAddress = this.addressList.find(obj => obj.patientAddressId === +this.deliveryDetail.patientAddressId);
    if (findAddress) {
      this.deliveryDetail.address = findAddress.address
      this.deliveryDetail.addressShow = findAddress.address ? `${findAddress.address} ` : '' + (findAddress.subdistrict ? `แขวง/ตำบล${findAddress.subdistrict}` : '')
      this.deliveryDetail.subdistrict = findAddress.subdistrict;
      this.deliveryDetail.district = findAddress.district;
      this.deliveryDetail.province = findAddress.province;
      this.deliveryDetail.districtProvince = this.common.concatAddress({
        district: findAddress.district,
        province: findAddress.province,
      });
      this.deliveryDetail.postcode = findAddress.postcode;
    } else {
      this.deliveryDetail.address = ""
      this.deliveryDetail.addressShow = ""
      this.deliveryDetail.subdistrict = ""
      this.deliveryDetail.district = ""
      this.deliveryDetail.province = ""
      this.deliveryDetail.districtProvince = ""
      this.deliveryDetail.postcode = ""
    }
  }

  onClosePrintDocument() {
    this.onClickBack();
  }

  onOkSuccess() {
    console.log('onOkSuccess');
    this.onClickBack();
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

  async onClickEditOrder() {
    try {
      this.disbledBtn = {
        "save": true,
        "cancel": true
      };

      const checkUrl = this.common.checkMockupUrl('', '', '', {
        BASE_API: '',
        BASE_MODULE: environment.apiPrefix,
        BASE_RESOURCE: environment.updateErrorOrderStatus
      });


      console.log(this.errorText)

      let locationText = this.errorText[this.errorText.length - 1].split('in ')[1]
      locationText = locationText.replaceAll('.', '')
      let data: any = {
        orderId: this.id,
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

      const response = await this.request.post(checkUrl.url, data);

      // this.userMessage = response.userMessage;
      if (response.resultCode === resultCodeSuccess) {
        this.goAlert('', '', 'myModalSuccess');
      } else {
        console.log('error');
        this.goAlert(response.resultCode, response.resultDescription, 'myModalError');
      }
    } catch (e) {
      console.log(e);
      this.disbledBtn = {
        "save": true,
        "cancel": true
      };
    }
  }

  async onClickEditOrAcceptOrder() {
    try {


    } catch (e) {
      console.log(e);

    }

  }

  onCloseEditOrder() {
    this.onClickBack()
  }

  deliveryDateValueChange() {
    if (this.pageType === 'edit') {
      this.deliveryDetailForm.controls.ddlDeliveryArrivalTime.reset(this.deliveryDetail.arrivalTime);
    } else {
      this.deliveryDetailForm.controls.ddlDeliveryArrivalTime.reset();
    }
    const setTimeZero = { h: 0, m: 0, s: 0, ms: 0 };
    const deliveryDateOnly = moment(this.deliveryDetail.deliveryDate).set(setTimeZero);
    const productionEndDate = moment(this.supplementDetail.productionEndDate, 'DD/MM/YYYY').set(setTimeZero);
    const currentDate = moment().set(setTimeZero);
    if (deliveryDateOnly > productionEndDate) {
      if (deliveryDateOnly > currentDate) {
        this.arrivalTimeList = this.arrivalTimeListBackup;
      } else {
        // tslint:disable-next-line:max-line-length
        this.arrivalTimeList = this.common.checkArrivalTime(this.arrivalTimeListBackup, this.deliveryDetail.deliveryDate);
      }
    } else {
      // tslint:disable-next-line:max-line-length
      this.arrivalTimeList = this.common.checkArrivalTime(this.arrivalTimeListBackup, this.deliveryDetail.deliveryDate, this.supplementDetail.productionEndTime);

    }
  }

  // ถ้าเป็น Supplement ต้องเปิดให้แก้ Delivery Detail อย่างเดียว
  fnCheckChangeDeliveryDetail() {
    // if (this.patientInfo.item === 1 && this.deliveryStatus === 32 ) {
    if (this.patientInfo.item === 'Supplement' && this.deliveryStatus === 32) {
      this.isChangeBookingMode = false;
      this.isChangeDeliveryDetail = true;
      this.deliveryDetailForm.controls['txtDeliveryRecipientName'].enable();
      this.deliveryDetailForm.controls['txtDeliveryPhone'].enable();
      this.deliveryDetailForm.controls['ddlDeliveryAddress'].enable();
      this.deliveryDetailForm.controls['txtDeliveryDate'].enable();
      this.deliveryDetailForm.controls['ddlDeliveryArrivalTime'].enable();
      this.deliveryDetailForm.controls['ddlDeliveryMethod'].enable();
      this.deliveryDetailForm.controls['txtDeliveryMethodOther'].enable();
      this.deliveryDetailForm.controls['ddlDeliveryPackaging'].enable();
      this.deliveryDetailForm.controls['cbxDeliveryDocumentationInvoice'].enable();
      this.deliveryDetailForm.controls['cbxDeliveryDocumentationReceipt'].enable();
      // this.deliveryDetailForm.controls['ddlDeliveryCashierName'].enable();
      this.deliveryDetailForm.controls['cbxDeliveryIsUrgent'].enable();
      this.deliveryDetailForm.controls['txtDeliveryCashierDeliNote'].enable();
    }
  }

  // เช็คว่าถ้าแท่งน้ำตาลมันไปกิน disabled ด้วยต้องแจ้งเตือนให้ลากออกมา
  fnCheckUnavailableSlot(findBookingData) {
    if (findBookingData) {
      return this.isDisableDate(findBookingData);
    } else {
      return false;
    }
  }

  fnConvertStringNull(key) {
    console.log('fnConvertStringNull');
    if (this.deliveryDetail[key] === 'null') {
      this.deliveryDetail[key] = null;
    }
  }

  async updateWorkingBy() {
    try {
      const checkUrl = this.common.checkMockupUrl('', '', '', {
        BASE_API: '',
        BASE_MODULE: environment.apiPrefix,
        BASE_RESOURCE: environment.updateWorkingBy,
      });
      this.request.post(checkUrl.url, { orderId: this.id });
    } catch (e) {
      console.log(e);
    }
  }

  onDeliveryMethodChanged(value: string | number | null): void {
    const addressControl = this.deliveryDetailForm.get('ddlDeliveryAddress');

    this.isPickupSelected = (value == 'pickup' || value == 2);

    if (addressControl) {
      if (this.isPickupSelected) {
        addressControl.clearValidators();
      } else {
        addressControl.setValidators([Validators.required]);
      }
      addressControl.updateValueAndValidity();
    }

    if (this.deliveryDetail['deliveryMethod'] === 'null') {
      this.deliveryDetail['deliveryMethod'] = null;
    }
  }


}
