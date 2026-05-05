import {AfterViewInit, Component, OnInit, ViewChild, ViewEncapsulation} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
// import { LayoutMenu } from '../../../shared/store/layout.menu.store';
import {Request} from '../../../../../shared/services/request.service';
import {Common} from '../../../../../shared/services/common.service';
import {FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {DxTreeListComponent} from 'devextreme-angular';
import {environment} from '../../../../../../environments/environment';
import * as moment from 'moment';
import * as _ from 'lodash';
import {CompareService} from '../../../../../shared/services/compare.service';
import {StoreService} from '../../../../../shared/services/store.service';
import CustomStore from 'devextreme/data/custom_store';

declare let $: any;

interface Detail {
  description: string;
  quantity: string;
  uom: string;
  unitPrice: number;
  amount: number;
}

@Component({
  selector: 'app-queue-management-reservation',
  providers: [Request, Common, CompareService],
  templateUrl: './queue-management-reservation.component.html',
  styleUrls: ['./queue-management-reservation.scss'],
  encapsulation: ViewEncapsulation.None
})
export class QueueManagementReservationComponent implements OnInit, AfterViewInit {

  @ViewChild('myModal') myModal;
  @ViewChild(DxTreeListComponent) treeList: DxTreeListComponent;
  patientInfo = {
    hn: '',
    patientName: '',
    supplyDay: '',
  };
  patientInfoForm: FormGroup;
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
  pageType: any = 'new';
  Id: any = null;
  menuHome: any = false;
  menuPermissions: any = {view: false, add: false, edit: false, delete: false};
  unitList = [];
  summary = 9956.00;
  appointmentsData: any[] = [];
  currentDate: Date = moment().toDate();
  prioritiesData: any[] = [];
  productionTimeMin = 0;
  startDayHour = 0;
  endDayHour = 24;
  id = null;
  isChangeBookingMode = false;
  patientInfoDataSource: any;
  autocompleteFilter = {};
  supplyDay = 60;
  enableDateList = {};
  enableDateListBackup = {};
  currentEditHN = '';
  maxProductionLine = 0;
  timeZeroMoment = {h: 0, m: 0, s: 0, ms: 0};
  timeEndDayMoment = {h: 23, m: 59, s: 59, ms: 59};
  productionTimeHour = [];
  timeBeforeProdStart = 0;
  productionEnd = '';
  calProductionTime: moment.Moment = null;
  dateFrom = null;
  dateTo = null;
  disableDateList = {};
  remarkMsg: any = [];

  constructor(public router: Router,
              private fb: FormBuilder,
              private request: Request,
              public common: Common,
              private compare: CompareService,
              private route: ActivatedRoute,
              private store: StoreService) {
    this.patientInfoForm = this.fb.group({
      'txtHn': new FormControl({value: '', disabled: false}, [Validators.required]),
      'txtPatientName': new FormControl({value: '', disabled: false}, [Validators.required]),
      'txtSupplyDay': new FormControl({value: '', disabled: false}, [Validators.required]),
    });
  }

  async ngOnInit() {
    document.body.scrollTop = 0; // สั่งให้ scroll to top เมื่อเข้าหน้ามา
    try {
      this.currentEditHN = '';
      this.id = this.route.snapshot.paramMap.get('id');
      if (this.id) {
        this.pageType = 'edit';
        this.isChangeBookingMode = true;
        this.patientInfoForm.controls['txtHn'].disable();
        this.patientInfoForm.controls['txtPatientName'].disable();
        this.patientInfoForm.controls['txtSupplyDay'].disable();
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
      this.patientInfoDataSource = this.customStore();
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
      // await this.getApiEdit();
    } catch (e) {
      console.log(e);
      const resultDescriptionSystemErrorTitle = environment.resultDescriptionSystemErrorTitle;
      const resultDescriptionSystemErrorMassage = environment.resultDescriptionSystemErrorMassage;
      this.goAlert(resultDescriptionSystemErrorTitle, resultDescriptionSystemErrorMassage, 'myModalError');
    }
  }

  customStore() {
    const dataSource: any = {};
    dataSource.store = new CustomStore({
      load: (loadOptions: any) => {
        console.log('loadOptions', loadOptions);
        const filterData: any = this.autocompleteFilter;
        const checkUrl = this.common.checkMockupUrl('', '', filterData, {
          BASE_API: '',
          BASE_MODULE: environment.apiPrefix,
          BASE_RESOURCE: environment.searchDdlPatientReserve
        });
        return this.request.get(checkUrl.url, checkUrl.filter)
          .then(response => {
            let resultData = [];
            if (response) {
              const resResultCode = response.resultCode;
              const resultCodeSuccess = environment.resultCodeSuccess;
              if (resResultCode === resultCodeSuccess) {
                resultData = response.resultData;
              }
            }
            return {
              data: resultData
            };
          })
          .catch(error => {
            return {
              data: [],
            };
          });
      },
    });
    // console.log(dataSource);
    return dataSource;
  }

  onInitialized(e) {
    const instance = e.component;
    console.log('instance', instance);
    setTimeout(async () => {
      const dateFrom = instance.getStartViewDate();
      const dateTo = instance.getEndViewDate();
      this.dateFrom = dateFrom;
      this.dateTo = dateTo;
      console.log('dateForm', dateFrom);
      console.log('dateTo', dateTo);
      await this.searchProductionTime();
      if (this.id) {
        await this.searchReservation();
      } else {
        await this.searchBookingCalendar(dateFrom, dateTo);
        const fromStr = moment(dateFrom).format('YYYY-MM-DD HH:mm:ss');
        const toStr = moment(dateTo).format('YYYY-MM-DD HH:mm:ss');
        await this.searchAllBooking(fromStr, toStr);
      }
    }, 100);
  }

  onOptionChanged(e) {
    if (e.name === 'currentDate') {
      const instance = e.component;
      this.prioritiesData = [];
      setTimeout(async () => {
        const dateFrom = instance.getStartViewDate();
        const dateTo = instance.getEndViewDate();
        this.dateFrom = dateFrom;
        this.dateTo = dateTo;
        await this.searchProductionTime();
        await this.searchBookingCalendar(dateFrom, dateTo);
        const fromStr = moment(dateFrom).format('YYYY-MM-DD HH:mm:ss');
        const toStr = moment(dateTo).format('YYYY-MM-DD HH:mm:ss');
        await this.searchAllBooking(fromStr, toStr);
        this.fnCalReserveTime();
      }, 100);
    }
  }

  fnReplaceTime(value) {
    return +moment(value, 'HH:mm', true).format('H.m');
  }

  fnCalDuration(start: moment.Moment, end: moment.Moment) {
    return end.diff(start, 'h', true);
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
          const openDateTime = moment().set({h: openH, m: openM, s: 0, ms: 0});
          // close
          const timeClose = data.timeClose;
          const closeH = this.timeToMoment(timeClose).get('h');
          const closeM = this.timeToMoment(timeClose).get('m');
          const closeDateTime = moment().set({h: closeH, m: closeM, s: 0, ms: 0});
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
          let openDateTime = moment().set({year, month, date, h: openH, m: openM, s: 0, ms: 0});
          // close
          const timeClose = data.timeClose;
          const closeH = this.timeToMoment(timeClose).get('h');
          const closeM = this.timeToMoment(timeClose).get('m');
          const closeDateTime = moment().set({year, month, date, h: closeH, m: closeM, s: 0, ms: 0});

          const dateAdditional = moment().set({year, month, date, h: 0, m: 0, s: 0, ms: 0});
          const dateCurrent = moment().set({h: 0, m: 0, s: 0, ms: 0});

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
              const open = moment().set({h: openH, m: openM, s: 0, ms: 0});
              console.log('open.unix()', open.unix());
              console.log('this.fnCalCurrent30Min().unix()', this.fnCalCurrent30Min().unix());
              if (open.unix() >= this.fnCalCurrent30Min().add(this.timeBeforeProdStart * 30, 'm').unix()) {
                openDateTime = moment().set({h: openH, m: openM, s: 0, ms: 0});
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
              const open = moment().set({h: additionalOpenH, m: additionalOpenM, s: 0, ms: 0});
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
        this.enableDateListBackup = _.cloneDeep(this.enableDateList);
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
          this.appointmentsData.push({
            text: `HN :\n${hn}`,
            priorityId: slot,
            startDate: moment(startDate).toDate(),
            endDate: moment(endDate).toDate(),
            data: {
              hn: hn,
              name: name,
              supplyDay: supplyDay,
              isAllowCancelDate: this.currentEditHN === hn && data.reserveId === +this.id,
            }
          });
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

  async searchReservation() {
    try {
      const filterData = {
        reserveId: this.id,
      };

      const checkUrl = this.common.checkMockupUrl('', '', filterData, {
        BASE_API: '',
        BASE_MODULE: environment.apiPrefix,
        BASE_RESOURCE: environment.searchReservationById
      });

      const resultCodeSuccess = environment.resultCodeSuccess;

      const response = await this.request.get(checkUrl.url, checkUrl.filter);
      if (response.resultCode === resultCodeSuccess) {
        const data = await response.resultData || response.data;
        if (data) {
          this.patientInfo.hn = data.hn;
          this.patientInfo.patientName = data.patientName;
          this.patientInfo.supplyDay = data.supplyDay;
          const productionStartDate = data.productionStartDate || '';
          const productionStartTime = data.productionStartTime || '';
          // const startDate = productionStartDate + ' ' + productionStartTime;
          const convertedStartDate = moment(productionStartDate).format('YYYY-MM-DD');
          const startDate = convertedStartDate + ' ' + productionStartTime;
          this.currentDate = moment(startDate).toDate();
          this.currentEditHN = data.hn;
        }
      } else {
        this.goAlert(response.resultCode, response.resultDescription, 'myModalError');
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
                this.enableDateList[key][key2]['timeOpen'].set({h, m, s: 0, ms: 0});
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

  fnCalReserveTime() {
    this.productionTimeMin = 0;
    // คำนวณหาเวลาของแท่งน้ำตาล หน้า reservation จะยึด productionTimeHour11 เลย
    const supplyDay = this.patientInfo.supplyDay ? +this.patientInfo.supplyDay : 0;
    for (let i = 0; i < this.productionTimeHour.length; i++) {
      const rangeFrom = this.productionTimeHour[i].rangeFrom ? +this.productionTimeHour[i].rangeFrom : 0;
      const rangeTo = this.productionTimeHour[i].rangeTo ? +this.productionTimeHour[i].rangeTo : 0;
      const productionTimeHour11 = this.productionTimeHour[i].productionTimeHour11 ? this.productionTimeHour[i].productionTimeHour11 : 0;
      if (supplyDay >= rangeFrom && (supplyDay <= rangeTo || (i === this.productionTimeHour.length - 1 && rangeTo === 0))) {
        this.productionTimeMin = productionTimeHour11 * 60; // convert hh to mm
        break;
      }
    }
    console.log('this.productionTimeMin', this.productionTimeMin);

    // คำนวน Production End
    this.enableDateList = _.cloneDeep(this.enableDateListBackup);
    if (this.productionTimeMin > 0) {
      const dateTime = moment(this.productionEnd, 'HH:mm');
      this.calProductionTime = dateTime.subtract(this.productionTimeMin, 'm');
      this.fnDisableBeforeProductionEnd();
    }

    this.fnClearAppointmentReserve();
    console.log('this.enableDateList', this.enableDateList);
    const enableDateListKeys = _.keys(this.enableDateList).sort();
    if (this.productionTimeMin > 0) {

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
              let calStartDate = dataDate.set({h, m, s: 0, ms: 0});

              if (calStartDate >= currentDate && duration >= (this.productionTimeMin / 60)) {

                // disabled time by productionEnd
                if (this.timeToUnix(timeOpen) <= this.timeToUnix(this.calProductionTime)) {
                  const hProductionTime = this.timeToMoment(this.calProductionTime).get('h');
                  const mProductionTime = this.timeToMoment(this.calProductionTime).get('m');
                  calStartDate = dataDate.set({h: hProductionTime, m: mProductionTime, s: 0, ms: 0});
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
                    if (this.pageType !== 'edit') {
                      this.appointmentsData.push({
                        text: '',
                        priorityId: +key2.replace('slot', ''),
                        startDate: reserveTime.toDate(),
                        endDate: reserveTimeEnd.toDate(),
                        data: {
                          hn: '',
                          name: '',
                          supplyDay: this.supplyDay
                        }
                      });
                      console.log('this.appointmentsData', this.appointmentsData);
                    }
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

  fnCalCurrent30Min() {
    const current = moment();
    const m = current.get('m');
    if (m > 0 && m <= 30) {
      return moment().set({m: 30, s: 0, ms: 0});
    } else if (m > 30) {
      return moment().add(1, 'h').set({m: 0, s: 0, ms: 0});
    } else {
      return moment().set({m: 0, s: 0, ms: 0});
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

  async updateCancelReservation() {
    try {
      const checkUrl = this.common.checkMockupUrl('', '', '', {
        BASE_API: '',
        BASE_MODULE: environment.apiPrefix,
        BASE_RESOURCE: environment.updateCancelReservation
      });
      const resultCodeSuccess = environment.resultCodeSuccess;
      const response = await this.request.post(checkUrl.url, {reserveId: this.id});
      if (response.resultCode === resultCodeSuccess) {
        this.goAlert('', '', 'myModalSuccess');
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
    try {
      const requiredData: boolean = this.fnCheckRequired();
      const resultCodeSuccess = environment.resultCodeSuccess;
      const findBookingData = this.appointmentsData.find(obj => obj.text === '');
      console.log('findBookingData', findBookingData);
      console.log('findBookingData', findBookingData);
      const isUnavailableSlot = this.fnCheckUnavailableSlot(findBookingData);
      if (requiredData && findBookingData && !isUnavailableSlot) {
        const postData: any = {
          hn: this.patientInfo.hn,
          patientName: this.patientInfo.patientName,
          supplyDay: this.patientInfo.supplyDay,
          confirmedDay: +moment().format('DD')
        };
        if (findBookingData) {
          const endDate = moment(findBookingData.endDate);
          const startDate = moment(findBookingData.startDate);
          const diffTime = endDate.diff(startDate, 'hour', true);
          postData.slotNo = findBookingData.priorityId;
          postData.productionStartDate = this.common.dateToString(findBookingData.startDate, 'DD-MM-YYYY');
          postData.productionStartTime = this.common.dateToString(findBookingData.startDate, 'HH:mm');
          postData.productionEndDate = this.common.dateToString(findBookingData.endDate, 'DD-MM-YYYY');
          postData.productionEndTime = this.common.dateToString(findBookingData.endDate, 'HH:mm');
          postData.stdProductionHour = diffTime;
        }
        console.log('postData', postData);
        let checkUrl = null;
        checkUrl = this.common.checkMockupUrl('', '', {}, {
          BASE_API: '',
          BASE_MODULE: environment.apiPrefix,
          BASE_RESOURCE: environment.createReservation
        });
        const response = await this.request.post(checkUrl.url, postData);
        if (response.resultCode === resultCodeSuccess) {
          this.goAlert('', '', 'myModalSuccess');
        } else {
          this.goAlert(response.resultCode, response.resultDescription, 'myModalError');
        }
      } else {
        console.log('isUnavailableSlot', isUnavailableSlot);
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

  fnCheckRequired() {
    console.log(this.patientInfoForm.controls, this.patientInfoForm, this.patientInfoForm.valid);
    for (const key in this.patientInfoForm.controls) {
      if (this.patientInfoForm.controls[key].errors) {
        this.patientInfoForm.controls[key].setErrors({'forceRequired': true});
        this.patientInfoForm.controls[key].markAsDirty();
      } else {
        this.patientInfoForm.controls[key].updateValueAndValidity();
      }
    }

    return this.patientInfoForm.valid;
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
    return new Date(e.date).toLocaleString('en-GB', {hour: '2-digit', minute: '2-digit'});
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
    const newData = e.newData;
    for (let i = 0; i < this.appointmentsData.length; i++) {
      const data = this.appointmentsData[i];
      if ((newData.priorityId === data.priorityId && data.text !== '' && this.common.isNotAvailable(newData, data))
        || this.isDisableDate(newData)
        || !this.isDisableDateByProductionStoppedAppointment(newData)) {
        e.cancel = true;
        return;
      }
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

  onItemClick(e) {
    const itemData = e.itemData;
    this.patientInfo.hn = itemData.hn;
    this.patientInfo.patientName = itemData.patientName;
  }

  onFocusOut(e, key) {
    const inputValue = e.event.target.value;
    if (inputValue !== this.patientInfo[key]) {
      e.event.target.value = '';
    }
  }

  onValueChanged(e, key) {
    this.autocompleteFilter = {};
    this.autocompleteFilter[key] = e.value;
  }

  onOk() {
    console.log('onOk');
    this.updateCancelReservation();
  }

  onOkSuccess() {
    console.log('onOkSuccess');
    if (this.id) {
      this.router.navigate(['/order-management', 'orders-cashier-view', 'queue-management-create-reservation']);
    } else {
      this.onClickBack();
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

  // เช็คว่าถ้าแท่งน้ำตาลมันไปกิน disabled ด้วยต้องแจ้งเตือนให้ลากออกมา
  fnCheckUnavailableSlot(findBookingData) {
    if (findBookingData) {
      return this.isDisableDate(findBookingData);
    } else {
      return false;
    }
  }
}
