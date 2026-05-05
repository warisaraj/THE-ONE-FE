import {Component, OnInit, AfterViewInit, ViewChild, ViewEncapsulation} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
// import { LayoutMenu } from '../../../shared/store/layout.menu.store';
import {Request} from '../../../../../shared/services/request.service';
import {Common} from '../../../../../shared/services/common.service';
import {FormBuilder} from '@angular/forms';
import {environment} from '../../../../../../environments/environment';
import * as moment from 'moment';
import * as _ from 'lodash';
import {CompareService} from '../../../../../shared/services/compare.service';
import {StoreService} from '../../../../../shared/services/store.service';

@Component({
  selector: 'app-booking-calendar',
  providers: [Request, Common, CompareService],
  templateUrl: './booking-calendar.component.html',
  styleUrls: ['./booking-calendar.scss'],
  encapsulation: ViewEncapsulation.None
})
export class BookingCalendarComponent implements OnInit, AfterViewInit {
  @ViewChild('myModal') myModal;
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
  pageType = 'edit';
  Id: any = null;
  menuHome: any = false;
  menuPermissions: any = {view: false, add: false, edit: false, delete: false};
  unitList = [];
  patientItemList: { id: number, name: string }[] = [];
  summary = 9956.00;
  appointmentsData: any[] = [];
  currentDate: Date = moment().toDate();
  prioritiesData: any[] = [];
  productionTimeMin = 90;
  arrivalTimeList = [];
  deliveryMethodList = [];
  packagingList = [];
  addressList = [];
  id = null;
  reserveHN = '';
  reserveId = null;
  startDayHour = 0;
  endDayHour = 24;
  supplyDay = 60;
  enableDateList = {};
  itemCount = 0;
  maxProductionLine = 0;
  timeZeroMoment = {h: 0, m: 0, s: 0, ms: 0};
  timeEndDayMoment = {h: 23, m: 59, s: 59, ms: 59};
  productionTimeHour = [];
  timeBeforeProdStart = 0;
  productionEnd = '';
  bookingId = null;
  dateFrom = null;
  dateTo = null;
  isUrgent = false;
  disableDateList = {};
  errorText: any;
  orderStatus = null;
  additionalProductionSchedule = [];

  constructor(public router: Router,
              private fb: FormBuilder,
              private request: Request,
              public common: Common,
              private compare: CompareService,
              private route: ActivatedRoute,
              private store: StoreService) {
  }

  async ngOnInit() {
    try {
      this.reserveHN = '';
      this.isUrgent = false;
      await this.checkGroupPermission();
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
      await this.searchBookingCalendar(dateFrom, dateTo);
      const fromStr = moment(dateFrom).format('YYYY-MM-DD HH:mm:ss')
      const toStr = moment(dateTo).format('YYYY-MM-DD HH:mm:ss')
      await this.searchAllBooking(fromStr, toStr);
    }, 100);
  }

  onOptionChanged(e) {
    if (e.name === 'currentDate') {
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
        const fromStr = moment(dateFrom).format('YYYY-MM-DD HH:mm:ss')
        const toStr = moment(dateTo).format('YYYY-MM-DD HH:mm:ss')
        await this.searchAllBooking(fromStr, toStr);
        // this.fnCalReserveTime(dateFrom, dateTo);
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
        const resultData = await response.resultData;
        const productionSchedule = resultData.productionSchedule || [];
        const additionalProductionSchedule = resultData.additionalProductionSchedule || [];
        // เตรียม data สำหรับแสดงใน Calendar Detail
        this.additionalProductionSchedule = [];
        const dateMomentFrom = moment(dateFrom).set(this.timeZeroMoment);
        const dateMomentTo = moment(dateTo).set(this.timeEndDayMoment);
        while (dateMomentFrom <= dateMomentTo) {
          const date = dateMomentFrom.format('YYYY-MM-DD');
          const findByDate = resultData.additionalProductionSchedule.find(obj => obj.date === date);
          console.log('date', date);
          if (findByDate) {
            this.additionalProductionSchedule.push({
              ...findByDate,
              dateDisplay: moment(date, 'YYYY-MM-DD').format('DD/MM/YYYY')
            });
          } else {
            this.additionalProductionSchedule.push({
              date: date,
              noSchedule: true,
              dateDisplay: moment(date, 'YYYY-MM-DD').format('DD/MM/YYYY')
            });
          }
          dateMomentFrom.add({d: 1});
        }
        this.additionalProductionSchedule = _.orderBy(this.additionalProductionSchedule, ['date'], ['asc']);
        // END
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
            continue;
          }

          if (data.isProductionStopped && data.productionStoppedTime === 2) {
            this.disableDateList[data.date].from = moment(data.date + ' ' + data.productionStoppedFrom);
            this.disableDateList[data.date].to = moment(data.date + ' ' + data.productionStoppedTo);
          }

          if (!this.enableDateList[data.date]) {
            this.enableDateList[data.date] = {};
          }


          for (let j = 0; j < data.productionLine; j++) {
            // if current data disable time by time before
            if (dateCurrent.unix() === dateAdditional.unix()) {
              const open = moment().set({h: openH, m: openM, s: 0, ms: 0});
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
              hn: hn,
              name: name,
              supplyDay: supplyDay,
              isAllowCancelDate: this.pageType === 'edit' && data.orderId === +this.id
            }
          };
          this.appointmentsData.push(appointmentData);
          if (this.pageType === 'edit' && data.orderId === +this.id) {
            this.bookingId = data.bookingId;
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

  timeToMoment(value) {
    return moment(value, 'HH:mm', true);
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

  timeCellTemplate(e) {
    return new Date(e.date).toLocaleString('en-GB', {hour: '2-digit', minute: '2-digit'});
  }

  onAppointmentDblClick(e: any) {
    e.cancel = true;
  }

  onAppointmentClick(e: any) {
    e.cancel = true;
  }

  onAppointmentRendered(e: any) {
    const appointmentElement: HTMLElement = e.appointmentElement;
    appointmentElement.style.width = (appointmentElement.clientWidth + 31) + 'px';
    appointmentElement.title = '';
    appointmentElement.onmouseenter = (args) => {
      e.component.showAppointmentTooltip(e.appointmentData, e.appointmentElement, e.targetedAppointmentData);
    };
    appointmentElement.onmouseleave = (args) => {
      e.component.hideAppointmentTooltip();
    };
    appointmentElement.style.backgroundColor = '#F9F7F2';

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

  async onClickOk() {
    console.log('onClickOk');
    this.appointmentsData = this.appointmentsData.filter(obj => obj.data.bookingId !== this.bookingId);
  }

  onClosePrintDocument() {
    this.goHomeMenu();
  }

  onOkSuccess() {
    console.log('onOkSuccess');
    this.goHomeMenu();
  }

  tmpFormat(value) {
    return moment(value).format('YYYY-MM-DD HH:mm:ss');
  }

  onCloseEditOrder() {
    this.goHomeMenu();
  }
}
