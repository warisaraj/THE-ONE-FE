import {AfterViewInit, Component, OnInit, ViewChild, ViewEncapsulation} from '@angular/core';
import {Router} from '@angular/router';
import {LayoutMenu} from '../../../../shared/store/layout.menu.store';
import {Request} from '../../../../shared/services/request.service';
import {Common} from '../../../../shared/services/common.service';
import {FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {StoreService} from '../../../../shared/services/store.service';
import * as _ from 'lodash';
import {GlobalVariable} from '../../raw-materials/list-raw-materials/list-raw-materials.global';
import {environment} from '../../../../../environments/environment';
import * as moment from 'moment';

moment.locale('en');

@Component({
  selector: 'app-list-raw-materials',
  providers: [LayoutMenu, Request, Common],
  templateUrl: './list-production-schedule.component.html',
  styleUrls: ['./list-production-schedule.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ListProductionScheduleComponent implements OnInit, AfterViewInit {
  @ViewChild('myModal') myModal;
  loadData = false;
  loading = false;
  menuHome = false;
  menuPermissions: any = {view: false, add: false, edit: false, delete: false};
  days = {
    Monday: {
      id: 1,
      disable: false,
      value: false
    },
    Tuesday: {
      id: 2,
      disable: false,
      value: false
    },
    Wednesday: {
      id: 3,
      disable: false,
      value: false
    },
    Thursday: {
      id: 4,
      disable: false,
      value: false
    },
    Friday: {
      id: 5,
      disable: false,
      value: false
    },
    Saturday: {
      id: 6,
      disable: false,
      value: false
    },
    Sunday: {
      id: 0,
      disable: false,
      value: false
    },
  };
  // for display in html
  daysKey = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  productionTimeList: any = [
    {
      no: 1,
      days: _.cloneDeep(this.days),
      openingTime: null,
      closingTime: null,
      checkMinTime: null
    }
  ];
  productionTime = {
    timeBeforeProductionStart: '',
    productionEnd: null,
    fixedTime: null,
    perMonthSupply0: null,
    perMonthSupply1: null,
    perMonthSupply2: null,
    perMonthSupply3: null,
    perMonthSupply4: null,
    productionTimeList: []
  };
  additional = {
    manPower: null,
    productionLine: null,
    isAddProductionLine: false,
    isAddProductionTime: false,
    isProductionStopped: false,
    productionLineList: [],
    additionalProductionTime: [],
    productionStoppedTime: 1,
    productionStoppedFrom: null,
    productionStoppedTo: null,
    productionStoppedReason: '',
    checkMinTime: null,
    checkMaxTime: null,
  };
  timeBeforeProductionList = [];
  isEditProductionSchedule = false;
  isEditProductionTime = false;
  isEditAdditionalProductionSchedule = false;
  isDisableAddProductionTime = false;
  productionScheduleForm: FormGroup;
  productionTimeForm: FormGroup;
  additionalProductionScheduleForm: FormGroup;
  currentDate: Date = moment().toDate();
  formatAdditionalSchedule = 'DD MMMM YYYY';
  formatAdditionalScheduleAPI = 'YYYY-MM-DD';
  selectedDateDisplay = moment().format(this.formatAdditionalSchedule);
  backupProductionSchedule = [];
  regexProductionTimeHour = '[0-9]+([.][5]+)?';
  isEditManPower = false;
  manPowerBackup = null;
  backupAdditionalProductionSchedule = null;
  additionalOpenTimeDisplay = '';
  additionalClosingTimeDisplay = '';
  additionalScheduler = [
    {
      text: '',
      startDate: moment(this.currentDate).set({hour: 0, minute: 0, second: 0}).toDate(),
      endDate: moment(this.currentDate).set({hour: 23, minute: 59, second: 59}).toDate(),
    }
  ];
  tempAdditional: any;
  tempProductionTime: any;
  tempProductionTimeList: any;
  isCanEdit = true;

  mapForShowProductionLine: any = {};
  mapForShowProductionTime: any = {};
  mapForShowProductionStopped: any = {};
  mapForShowTimeOpenTimeClose: any = {};
  productionTimeTimeCloseMin = moment().set({h: 0, m: 0}).toDate();
  productionTimeTimeCloseMax = moment().set({h: 23, m: 30}).toDate();
  backupPrePostData = [];

  constructor(
    public router: Router,
    private fb: FormBuilder,
    private request: Request,
    public layoutMenu: LayoutMenu,
    public common: Common,
    private store: StoreService,
  ) {
    // Production Schedule Form
    this.productionScheduleForm = this.fb.group({
      'openingTime1': new FormControl('', [Validators.required]),
      'closingTime1': new FormControl('', [Validators.required]),
    });
    // Production Time Form
    this.productionTimeForm = this.fb.group({
      'timeBeforeProductionStart': new FormControl({
        value: this.productionTime.timeBeforeProductionStart,
        disabled: !this.isEditProductionTime
      }, [Validators.required]),
      'productionEnd': new FormControl({
        value: this.productionTime.productionEnd,
        disabled: !this.isEditProductionTime
      }, [Validators.required]),
      'fixedTime': new FormControl(this.productionTime.fixedTime, Validators.required),
      'perMonthSupply0': new FormControl(this.productionTime.perMonthSupply0, Validators.required),
      'perMonthSupply1': new FormControl(this.productionTime.perMonthSupply1, Validators.required),
      'perMonthSupply2': new FormControl(this.productionTime.perMonthSupply2, Validators.required),
      'perMonthSupply3': new FormControl(this.productionTime.perMonthSupply3, Validators.required),
      'perMonthSupply4': new FormControl(this.productionTime.perMonthSupply4, Validators.required),
      // 'supplyMonthStartRow1': new FormControl({
      //   value: '',
      //   disabled: true
      // }),
      // 'supplyMonthEndRow1': new FormControl(''),
      // tslint:disable-next-line:max-line-length
      // 'productionTimeRow1Col1': new FormControl('', [Validators.required, Validators.pattern(this.regexProductionTimeHour)]),
      // tslint:disable-next-line:max-line-length
      // 'productionTimeRow1Col2': new FormControl('', [Validators.required, Validators.pattern(this.regexProductionTimeHour)]),
      // tslint:disable-next-line:max-line-length
      // 'productionTimeRow1Col3': new FormControl('', [Validators.required, Validators.pattern(this.regexProductionTimeHour)]),
      // tslint:disable-next-line:max-line-length
      // 'productionTimeRow1Col4': new FormControl('', [Validators.required, Validators.pattern(this.regexProductionTimeHour)]),
    });
    // Additional Production Schedule Form
    this.additionalProductionScheduleForm = this.fb.group({
      'manPower': new FormControl({
        value: this.additional.manPower,
        disabled: !this.isEditAdditionalProductionSchedule
      }, [Validators.required]),
      'productionLine': new FormControl({
        value: this.additional.productionLine,
        disabled: true
      }, [Validators.required]),
    });
  }

  async ngOnInit() {
    const dropdown = await this.common.searchConfig();
    this.timeBeforeProductionList = dropdown.timeBeforeProductionList || [];
    this.store.subscribePagePermissionList().subscribe(pagePermissionList => {
      const pagePermission = pagePermissionList.find(r => r.url === GlobalVariable.ROLE_SHCEDULE_URL);
      if (pagePermission) {
        try {
          // console.log("pagePermission",pagePermission);
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
  }

  goHomeMenu() {
    if (this.menuHome) {
      this.router.navigate(['/menu', this.menuHome['menuId'], this.menuHome['typePage']]);
    }
  }

  async ngAfterViewInit() {
    try {
      await this.searchProductionSchedule();
      await this.searchProductionTime();
      await this.searchAdditionalProdSchedules();
      await this.searchAdditionalProdSchedule();
      this.clickCollapse('divProductionSchedule');
      this.clickCollapse('divProductionTime');
    } catch (error) {
      console.error(error);
    }
  }

  // GET searchProductionSchedule
  async searchProductionSchedule() {
    try {
      this.backupProductionSchedule = [];
      const checkUrl = this.common.checkMockupUrl('', '', {}, {
        BASE_API: '',
        BASE_MODULE: environment.apiPrefix,
        BASE_RESOURCE: environment.searchProductionSchedule
      });
      const response = await this.request.get(checkUrl.url, checkUrl.filter);
      const resultData = response.resultData;
      for (let i = 0; i < resultData.length; i++) {
        const data = resultData[i];
        if (!this.productionTimeList[i]) {
          this.fnAddProductionTime();
          this.productionTimeList[i].openingTime = this.formatHHMMToDate(data.timeOpen);
          this.productionTimeList[i].closingTime = this.formatHHMMToDate(data.timeClose);
        } else {
          this.productionTimeList[i].openingTime = this.formatHHMMToDate(data.timeOpen);
          this.productionTimeList[i].closingTime = this.formatHHMMToDate(data.timeClose);
        }
        const days = data.day;
        for (let j = 0; j < days.length; j++) {
          const day = +days[j];
          if (day === 0) {
            this.productionTimeList[i].days['Sunday'].value = true;
          } else if (day === 1) {
            this.productionTimeList[i].days['Monday'].value = true;
          } else if (day === 2) {
            this.productionTimeList[i].days['Tuesday'].value = true;
          } else if (day === 3) {
            this.productionTimeList[i].days['Wednesday'].value = true;
          } else if (day === 4) {
            this.productionTimeList[i].days['Thursday'].value = true;
          } else if (day === 5) {
            this.productionTimeList[i].days['Friday'].value = true;
          } else if (day === 6) {
            this.productionTimeList[i].days['Saturday'].value = true;
          }
        }

        const tmpObj = {
          day: data.day,
          timeOpen: data.timeOpen,
          timeClose: data.timeClose,
        };
        if (data.productionScheduleId) {
          tmpObj['productionScheduleId'] = data.productionScheduleId;
          this.productionTimeList[i]['productionScheduleId'] = data.productionScheduleId;
        }
      }
      this.backupProductionSchedule = _.cloneDeep(this.productionTimeList);

      this.backupPrePostData = this.backupProductionSchedule.map((data: any) => {
        const dayID = [];
        for (const day in data.days) {
          if (data.days[day].value) {
            dayID.push(data.days[day].id.toString());
          }
        }
        const tmpObj = {
          no: data.no,
          day: dayID,
          timeOpen: this.formatHHMM(data.openingTime),
          timeClose: this.formatHHMM(data.closingTime),
        };
        if (data.productionScheduleId) {
          tmpObj['productionScheduleId'] = data.productionScheduleId;
        }
        return tmpObj;
      });
      this.fnCalOpenTime();
    } catch (error) {
      console.error(error);
    }
  }

  // GET searchProductionTime
  async searchProductionTime() {
    try {
      const checkUrl = this.common.checkMockupUrl('', '', {}, {
        BASE_API: '',
        BASE_MODULE: environment.apiPrefix,
        BASE_RESOURCE: environment.searchProductionTime
      });
      const response = await this.request.get(checkUrl.url, checkUrl.filter);
      const resultData = response.resultData;
      // const resultData: any = [];
      if (resultData.length === 0) {
        this.productionTime = {
          timeBeforeProductionStart: '',
          productionEnd: null,
          fixedTime: null,
          perMonthSupply0: null,
          perMonthSupply1: null,
          perMonthSupply2: null,
          perMonthSupply3: null,
          perMonthSupply4: null,
          productionTimeList: []
        };
      } else {
        this.productionTime.timeBeforeProductionStart = this.timeBeforeProductionList[resultData.timeBeforeProdStart - 1];
        this.productionTime.productionEnd = this.formatHHMMToDate(resultData.productionEnd);
        this.productionTime.fixedTime = resultData.fixedTime;
        this.productionTime.perMonthSupply0 = resultData.perMonthSupply;
        this.productionTime.perMonthSupply1 = resultData.perWeightedItem1;
        this.productionTime.perMonthSupply2 = resultData.perWeightedItem6;
        this.productionTime.perMonthSupply3 = resultData.perWeightedItem11;
        this.productionTime.perMonthSupply4 = resultData.perWeightedItem20;
        const productionTimeHour = resultData.productionTimeHour || [];
        for (let i = 0; i < productionTimeHour.length; i++) {
          const data = productionTimeHour[i];
          this.fnAddProductionTimeRow();
          this.productionTime.productionTimeList[i]['supplyMonthStartRow' + data.no] = data.rangeFrom;
          this.productionTime.productionTimeList[i]['supplyMonthEndRow' + data.no] = data.rangeTo;
          this.productionTime.productionTimeList[i]['productionTimeRow' + data.no + 'Col1'] = data.productionTimeHour1;
          this.productionTime.productionTimeList[i]['productionTimeRow' + data.no + 'Col2'] = data.productionTimeHour6;
          this.productionTime.productionTimeList[i]['productionTimeRow' + data.no + 'Col3'] = data.productionTimeHour11;
          this.productionTime.productionTimeList[i]['productionTimeRow' + data.no + 'Col4'] = data.productionTimeHour20;
        }
      }
    } catch (error) {
      console.error(error);
    }
  }

  // GET searchAdditionalProdSchedule
  async searchAdditionalProdSchedule(dateFromClick?) {
    try {
      const filterDate = dateFromClick || this.currentDate;
      const filterData = {
        date: moment(filterDate).format(this.formatAdditionalScheduleAPI),
      };
      const checkUrl = this.common.checkMockupUrl('', '', filterData, {
        BASE_API: '',
        BASE_MODULE: environment.apiPrefix,
        BASE_RESOURCE: environment.searchAdditionalProdSchedule
      });
      const response = await this.request.get(checkUrl.url, checkUrl.filter);
      const resultData = response.resultData;
      this.mapForShowTimeOpenTimeClose = {};
      this.additional.productionLineList = [];
      if (resultData.length === 0) {
        // const date = resultData.date;
        this.manPowerBackup = null;
        this.additional = {
          manPower: null,
          productionLine: null,
          isAddProductionLine: false,
          isAddProductionTime: false,
          isProductionStopped: false,
          productionLineList: [],
          additionalProductionTime: [],
          productionStoppedTime: 1,
          productionStoppedFrom: null,
          productionStoppedTo: null,
          productionStoppedReason: '',
          checkMinTime: null,
          checkMaxTime: null,
        };
        this.fnCalOpenTime();
      } else {
        const date = resultData.date;

        this.currentDate = moment(date).toDate();
        this.selectedDateDisplay = moment(date).format(this.formatAdditionalSchedule);

        // cal timeOpen - timeClose
        if (resultData.timeOpen && resultData.timeClose) {
          this.mapForShowTimeOpenTimeClose[resultData.date] = {
            timeOpen: this.formatHHMM(resultData.timeOpen),
            timeClose: this.formatHHMM(resultData.timeClose),
          };
        }
        this.manPowerBackup = resultData.manPower;
        this.additional.manPower = resultData.manPower;
        this.additional.productionLine = resultData.productionLine;
        this.additional.isAddProductionLine = resultData.isAddProductionLine === 1;
        this.additional.isAddProductionTime = resultData.isAddProductionTime === 1;
        this.additional.isProductionStopped = resultData.isProductionStopped === 1;
        this.additional.productionStoppedTime = resultData.productionStoppedTime || 1;
        this.additional.productionStoppedFrom = this.formatHHMMToDate(resultData.productionStoppedFrom);
        this.additional.productionStoppedTo = this.formatHHMMToDate(resultData.productionStoppedTo);
        this.additional.productionStoppedReason = resultData.productionStoppedReason;
        // if (this.additional.isAddProductionLine) {
        //   this.fnAddProductionLine();
        // }
        // รอ checkbox event ทำงานก่อน
        setTimeout(() => {
          if (this.additional.isAddProductionLine) {
            const additionalProductionLine = resultData.additionalProductionLine || [];
            for (let i = 0; i < additionalProductionLine.length; i++) {
              const data = additionalProductionLine[i];
              console.log('data', data);
              this.fnAddProductionLine();
              this.additional.productionLineList[i].openingTime = this.formatHHMMToDate(data.timeOpen);
              this.additional.productionLineList[i].closingTime = this.formatHHMMToDate(data.timeClose);
              this.additional.productionLineList[i].note = data.note;
            }
          }

          this.additional.additionalProductionTime = [];
          const additionalProductionTime = resultData.additionalProductionTime || [];
          for (let i = 0; i < resultData.productionLine; i++) {
            const tmpObj = {
              lineNo: i + 1,
              timeClose: null,
              note: ''
            };
            const findAdditional = additionalProductionTime.find((obj) => obj.lineNo === tmpObj.lineNo);
            if (findAdditional) {
              tmpObj.timeClose = findAdditional.timeClose ? this.formatHHMMToDate(findAdditional.timeClose) : '';
              tmpObj.note = findAdditional.note;
            }
            this.additional.additionalProductionTime.push(tmpObj);
          }
          console.log(' this.additional.additionalProductionTime',  this.additional.additionalProductionTime);

          // for (let i = 0; i < additionalProductionTime.length; i++) {
          //   const data = additionalProductionTime[i];
          //   this.additional.additionalProductionTime[i].lineNo = data.lineNo;
          //   this.additional.additionalProductionTime[i].timeClose = this.formatHHMMToDate(data.timeClose);
          //   this.additional.additionalProductionTime[i].note = data.note;
          // }

          this.backupAdditionalProductionSchedule = _.cloneDeep(this.additional);
        }, 100);
      }

    } catch (error) {
      console.error(error);
    }
  }

  // GET searchAdditionalProdSchedules
  async searchAdditionalProdSchedules(dateFromClick?) {
    try {
      const filterDate = dateFromClick || this.currentDate;
      const filterData = {
        month: moment(filterDate).get('month'),
      };
      const checkUrl = this.common.checkMockupUrl('', '', filterData, {
        BASE_API: '',
        BASE_MODULE: environment.apiPrefix,
        BASE_RESOURCE: environment.searchAdditionalProdSchedules
      });
      const response = await this.request.get(checkUrl.url, checkUrl.filter);
      const resultData = response.resultData;
      this.mapForShowProductionLine = {};
      this.mapForShowProductionTime = {};
      this.mapForShowProductionStopped = {};
      if (resultData.length > 0) {
        for (let i = 0; i < resultData.length; i++) {
          if (resultData[i].isAddProductionLine) {
            this.mapForShowProductionLine[resultData[i].date] = true;
          }
          if (resultData[i].isAddProductionTime) {
            this.mapForShowProductionTime[resultData[i].date] = true;
          }
          if (resultData[i].isProductionStopped) {
            this.mapForShowProductionStopped[resultData[i].date] = true;
          }
        }
      }
    } catch (error) {
      console.error(error);
    }
  }

  // POST updateProductionSchedule
  async updateProductionSchedule() {
    try {
      const checkUrl = this.common.checkMockupUrl('', '', {}, {
        BASE_API: '',
        BASE_MODULE: environment.apiPrefix,
        BASE_RESOURCE: environment.updateProductionSchedule
      });
      const postData = this.productionTimeList.map((data: any) => {
        const dayID = [];
        for (const day in data.days) {
          if (data.days[day].value) {
            dayID.push(data.days[day].id.toString());
          }
        }
        const tmpObj = {
          no: data.no,
          day: dayID,
          timeOpen: this.formatHHMM(data.openingTime),
          timeClose: this.formatHHMM(data.closingTime),
        };
        if (data.productionScheduleId) {
          tmpObj['productionScheduleId'] = data.productionScheduleId;
        }
        return tmpObj;
      });
      // หาตัวที่ถูกแก้ไขแล้วส่งไปอัพเดต
      const editedDataList = [];
      for (let i = 0; i < postData.length; i++) {
        const data = postData[i];
        const findBackupData = this.backupPrePostData.filter((obj) => {
          return obj.day.toString() === data.day.toString()
            && obj.timeOpen === data.timeOpen
            && obj.timeClose === data.timeClose;
        });
        if (findBackupData.length === 0) {
          console.log('data edit', data);
          editedDataList.push(data);
        } else {
          postData[i].isNoChange = true;
        }
      }
      // ถ้าไม่มี data ที่ถูกแก้ไข ไม่ต้องทำอะไร
      if (editedDataList.length > 0) {
        const response = await this.request.post(checkUrl.url, postData);
        console.log('response', response);
        // const resultData = response.resultData;
        const resultCode = response.resultCode;
        const resultCodeSuccess = environment.resultCodeSuccess;
        if (response.resultCode === resultCodeSuccess) {
          this.goAlert('', '', 'myModalSuccess');
          await this.searchProductionSchedule();
        } else {
          this.goAlert(response.resultCode, response.resultDescription, 'myModalError');
          this.productionTimeList = _.cloneDeep(this.backupProductionSchedule);
          for (let i = 0; i < this.productionTimeList.length; i++) {
            const no = this.productionTimeList[i].no;
            if (!this.productionScheduleForm.controls[`openingTime${no}`]) {
              this.productionScheduleForm.addControl(`openingTime${no}`, new FormControl('', Validators.required));
              this.productionScheduleForm.addControl(`closingTime${no}`, new FormControl('', Validators.required));
            }
          }
        }
      } else {
        // this.goAlert('', '', 'myModalSuccess');
      }
    } catch (error) {
      console.error(error);
    }
  }

  // POST updateProductionTime
  async updateProductionTime() {
    try {
      const checkUrl = this.common.checkMockupUrl('', '', {}, {
        BASE_API: '',
        BASE_MODULE: environment.apiPrefix,
        BASE_RESOURCE: environment.updateProductionTime
      });
      const timeBefore = this.timeBeforeProductionList.indexOf(this.productionTime.timeBeforeProductionStart);
      const postData = {
        timeBeforeProdStart: timeBefore + 1,
        productionEnd: moment(this.productionTime.productionEnd).format('HH:mm'),
        fixedTime: +this.productionTime.fixedTime,
        perMonthSupply: +this.productionTime.perMonthSupply0,
        perWeightedItem1: +this.productionTime.perMonthSupply1,
        perWeightedItem6: +this.productionTime.perMonthSupply2,
        perWeightedItem11: +this.productionTime.perMonthSupply3,
        perWeightedItem20: +this.productionTime.perMonthSupply4,
        productionTimeHour: this.productionTime.productionTimeList.map(obj => {
          return {
            no: obj.no,
            rangeFrom: +obj[`supplyMonthStartRow${obj.no}`],
            rangeTo: +obj[`supplyMonthEndRow${obj.no}`],
            productionTimeHour1: +obj[`productionTimeRow${obj.no}Col1`],
            productionTimeHour6: +obj[`productionTimeRow${obj.no}Col2`],
            productionTimeHour11: +obj[`productionTimeRow${obj.no}Col3`],
            productionTimeHour20: +obj[`productionTimeRow${obj.no}Col4`],
          };
        })
      };
      const response = await this.request.post(checkUrl.url, postData);
      console.log('response', response);
      // const resultData = response.resultData;
      const resultCode = response.resultCode;
      const resultCodeSuccess = environment.resultCodeSuccess;
      const resultCodeAdditionalClosingTimeError = environment.resultCodeAdditionalClosingTimeError;
      if (response.resultCode === resultCodeSuccess) {
        this.goAlert('', '', 'myModalSuccess');
        this.isEditProductionTime = false;
        this.productionTimeForm.controls[`timeBeforeProductionStart`].disable();
        this.productionTimeForm.controls[`timeBeforeProductionStart`].reset(this.productionTime.timeBeforeProductionStart);
        this.productionTimeForm.controls[`productionEnd`].disable();
        this.productionTimeForm.controls[`productionEnd`].reset(this.productionTime.productionEnd);
      } else {
        this.goAlert(response.resultCode, response.resultDescription, 'myModalError');
      }
    } catch (error) {
      console.error(error);
    }
  }

  // POST updateAdditionalProdSchedule
  async updateAdditionalProdSchedule() {
    try {
      const checkUrl = this.common.checkMockupUrl('', '', {}, {
        BASE_API: '',
        BASE_MODULE: environment.apiPrefix,
        BASE_RESOURCE: environment.updateAdditionalProdSchedule
      });
      const momentDate = moment(this.currentDate);
      const postData: any = {
        date: momentDate.format(this.formatAdditionalScheduleAPI),
        manPower: +this.additional.manPower,
        timeOpen: this.additionalOpenTimeDisplay,
        timeClose: this.additionalClosingTimeDisplay,
        productionLine: +this.additional.productionLine,
        isAddProductionLine: this.additional.isAddProductionLine ? 1 : 0,
        isAddProductionTime: this.additional.isAddProductionTime ? 1 : 0,
        isProductionStopped: this.additional.isProductionStopped ? 1 : 0,
        refDay: +momentDate.format('d'),
      };
      if (this.additional.isAddProductionTime) {
        postData.additionalProductionTime = [];
        for (let i = 0; i < this.additional.additionalProductionTime.length; i++) {
          const obj = this.additional.additionalProductionTime[i];
          if (obj.timeClose) {
            postData.additionalProductionTime.push({
              lineNo: obj.lineNo,
              timeClose: this.formatHHMM(obj.timeClose),
              note: obj.note,
            });
          }
        }
      }
      if (this.additional.isAddProductionLine) {
        postData.additionalProductionLine = this.additional.productionLineList.map(obj => {
          return {
            lineNo: obj.lineNo,
            timeOpen: this.formatHHMM(obj.openingTime),
            timeClose: this.formatHHMM(obj.closingTime),
            note: obj.note,
          };
        });
      }
      if (postData.isProductionStopped === 1) {
        postData.productionStoppedTime = this.additional.productionStoppedTime;
        postData.productionStoppedFrom = this.formatHHMM(this.additional.productionStoppedFrom);
        postData.productionStoppedTo = this.formatHHMM(this.additional.productionStoppedTo);
        postData.productionStoppedReason = this.additional.productionStoppedReason;
      }
      const response = await this.request.post(checkUrl.url, postData);
      // const resultData = response.resultData;
      const resultCode = response.resultCode;
      const resultCodeSuccess = environment.resultCodeSuccess;
      const resultCodeAdditionalClosingTimeError = environment.resultCodeAdditionalClosingTimeError;
      if (response.resultCode === resultCodeSuccess) {
        this.goAlert('', '', 'myModalSuccess');
      } else {
        this.additional = _.cloneDeep(this.backupAdditionalProductionSchedule);
        this.goAlert(response.resultCode, response.resultDescription, 'myModalError');
      }
    } catch (error) {
      console.error(error);
    }
  }

  /** Production Schedule */
  fnEditProductionSchedule() {
    this.tempProductionTimeList = _.cloneDeep(this.productionTimeList);
    this.isEditProductionSchedule = true;

    // check disable add production time button
    for (let i = 0; i < this.productionTimeList.length; i++) {
      const productionTime = this.productionTimeList[i];
      this.fnValueChanged(productionTime.days);
    }
  }

  async fnSaveProductionSchedule() {
    const valid = this.fnCheckProductionScheduleForm();
    console.log('productionScheduleForm', valid);
    if (valid) {
      await this.updateProductionSchedule();
      await this.searchAdditionalProdSchedule();
      this.isEditProductionSchedule = false;

      // ถ้าเปลี่ยน Production Schedule ต้องคำนวณ min max ของ Additional ใหม่
      const dateStr = moment(this.currentDate).format(this.formatAdditionalScheduleAPI);
      console.log('this.mapForShowTimeOpenTimeClose', this.mapForShowTimeOpenTimeClose);
      console.log('dateStr', dateStr);
      if (this.mapForShowTimeOpenTimeClose[dateStr]) {
        this.additionalOpenTimeDisplay = this.mapForShowTimeOpenTimeClose[dateStr].timeOpen;
        this.additionalClosingTimeDisplay = this.mapForShowTimeOpenTimeClose[dateStr].timeClose;
        this.fnGetProductionTimeTimeCloseMax();
      } else {
        this.fnCalOpenTime();
      }
    }
  }

  fnCancelProductionSchedule() {
    this.fnClearProductionScheduleForm();
    this.productionTimeList = this.tempProductionTimeList;
    this.isEditProductionSchedule = false;
  }

  fnAddProductionTime() {
    const obj = this.productionTimeList[this.productionTimeList.length - 1];
    const no = this.productionTimeList.length + 1;
    this.productionTimeList.push({
      no: no,
      days: this.fnClearDays(obj.days),
      openingTime: null,
      closingTime: null
    });
    this.productionScheduleForm.addControl(`openingTime${no}`, new FormControl('', Validators.required));
    this.productionScheduleForm.addControl(`closingTime${no}`, new FormControl('', Validators.required));
    this.isDisableAddProductionTime = true;
  }

  fnDeleteProductionTime() {
    try {
      const objBeforeDelete = this.productionTimeList[this.productionTimeList.length - 1];
      this.productionScheduleForm.removeControl(`openingTime${objBeforeDelete.no}`);
      this.productionScheduleForm.removeControl(`closingTime${objBeforeDelete.no}`);
      this.productionTimeList.pop();
      const objAfterDelete = this.productionTimeList[this.productionTimeList.length - 1];
      for (const key in objAfterDelete.days) {
        if (objAfterDelete.days.hasOwnProperty(key)) {
          if (objAfterDelete.days[key].value || !objBeforeDelete.days[key].disable) {
            objAfterDelete.days[key].disable = false;
          }
        }
      }
      this.isDisableAddProductionTime = false;
      this.fnClearProductionScheduleForm();
    } catch (error) {
      // continue
    }
  }

  fnValueChanged(days) {
    this.isDisableAddProductionTime = true;
    let isNoSelected = true;
    for (const key in days) {
      if (days.hasOwnProperty(key)) {
        if (!days[key].value && !days[key].disable) {
          this.isDisableAddProductionTime = false;
        }
        if (days[key].value) {
          isNoSelected = false;
        }
      }
    }
    // ถ้ามีช่องที่ enable แต่ไม่มีการติ๊กต้อง disabled ปุ่ม
    if (isNoSelected) {
      this.isDisableAddProductionTime = true;
    }
  }

  fnClearDays(days) {
    const obj = _.cloneDeep(days);
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        days[key].disable = true; // ปิดตัวก่อนหน้าให้หมด
        if (obj[key].value) {
          obj[key].value = false;
          obj[key].disable = true;
        }
      }
    }
    return obj;
  }

  formatHHMM(value) {
    if (moment(value).isValid()) {
      return moment(value).format('HH:mm');
    } else {
      return value;
    }
  }

  fnCheckProductionScheduleForm() {
    // tslint:disable-next-line:max-line-length
    console.log(this.productionScheduleForm.controls, this.productionScheduleForm, this.productionScheduleForm.valid);
    for (const key in this.productionScheduleForm.controls) {
      if (this.productionScheduleForm.controls[key].errors) {
        this.productionScheduleForm.controls[key].setErrors({'forceRequired': true});
        this.productionScheduleForm.controls[key].markAsDirty();
      } else {
        this.productionScheduleForm.controls[key].updateValueAndValidity();
      }
    }

    return this.productionScheduleForm.valid;
  }

  fnClearProductionScheduleForm() {
    this.productionScheduleForm.reset(this.productionScheduleForm.value);
  }

  /** End Production Schedule */

  /** Production Time */
  fnEditProductionTime() {
    this.isEditProductionTime = true;
    this.tempProductionTime = _.cloneDeep(this.productionTime);
    const productionTimeList = this.productionTime.productionTimeList;
    this.productionTimeForm.controls[`timeBeforeProductionStart`].enable();
    this.productionTimeForm.controls[`productionEnd`].enable();
    if (productionTimeList.length === 1) {
      this.productionTimeForm.controls[`supplyMonthStartRow1`].disable();
      this.productionTimeForm.controls[`supplyMonthEndRow1`].enable();
    }

  }

  async fnSaveProductionTime() {
    const valid = this.fnCheckProductionTimeForm();
    console.log('productionTimeForm', valid);
    if (valid) {
      await this.updateProductionTime();
    }
  }

  fnCancelProductionTime() {
    this.isEditProductionTime = false;
    this.productionTimeForm.controls[`timeBeforeProductionStart`].disable();
    this.productionTimeForm.controls[`timeBeforeProductionStart`].reset(this.productionTime.timeBeforeProductionStart);
    this.productionTimeForm.controls[`productionEnd`].disable();
    this.productionTimeForm.controls[`productionEnd`].reset(this.productionTime.productionEnd);
    this.productionTime = this.tempProductionTime;
  }

  fnAddProductionTimeRow() {
    const productionTimeList = this.productionTime.productionTimeList;
    let no = 0;
    let obj;
    no = productionTimeList.length + 1;
    if (productionTimeList.length > 0) {
      obj = productionTimeList[productionTimeList.length - 1];
    }
    const tmpObj: any = {no: no};
    if (obj) {
      tmpObj['supplyMonthStartRow' + no] = +(obj['supplyMonthEndRow' + obj.no]) + 1;
    } else {
      tmpObj['supplyMonthStartRow' + no] = 1;
    }
    tmpObj['supplyMonthEndRow' + no] = null;
    tmpObj['productionTimeRow' + no + 'Col1'] = null;
    tmpObj['productionTimeRow' + no + 'Col2'] = null;
    tmpObj['productionTimeRow' + no + 'Col3'] = null;
    tmpObj['productionTimeRow' + no + 'Col4'] = null;
    productionTimeList.push(tmpObj);

    // disable before input
    if (obj) {
      this.productionTimeForm.controls[`supplyMonthStartRow${obj.no}`].disable();
      this.productionTimeForm.controls[`supplyMonthEndRow${obj.no}`].disable();
    }

    // add new input
    this.productionTimeForm.addControl(`supplyMonthStartRow${no}`, new FormControl({
      value: '',
      disabled: true
    }));
    this.productionTimeForm.addControl(`supplyMonthEndRow${no}`, new FormControl(''));
    this.productionTimeForm.controls[`supplyMonthEndRow${no}`].reset();
    // tslint:disable-next-line:max-line-length
    this.productionTimeForm.addControl(`productionTimeRow${no}Col1`, new FormControl('', [Validators.required, Validators.pattern(this.regexProductionTimeHour)]));
    this.productionTimeForm.controls[`productionTimeRow${no}Col1`].reset();
    // tslint:disable-next-line:max-line-length
    this.productionTimeForm.addControl(`productionTimeRow${no}Col2`, new FormControl('', [Validators.required, Validators.pattern(this.regexProductionTimeHour)]));
    this.productionTimeForm.controls[`productionTimeRow${no}Col2`].reset();
    // tslint:disable-next-line:max-line-length
    this.productionTimeForm.addControl(`productionTimeRow${no}Col3`, new FormControl('', [Validators.required, Validators.pattern(this.regexProductionTimeHour)]));
    this.productionTimeForm.controls[`productionTimeRow${no}Col3`].reset();
    // tslint:disable-next-line:max-line-length
    this.productionTimeForm.addControl(`productionTimeRow${no}Col4`, new FormControl('', [Validators.required, Validators.pattern(this.regexProductionTimeHour)]));
    this.productionTimeForm.controls[`productionTimeRow${no}Col4`].reset();
  }

  fnDeleteProductionTimeRow() {
    const productionTimeList = this.productionTime.productionTimeList;
    const objBeforeDelete = productionTimeList[productionTimeList.length - 1];
    this.productionScheduleForm.removeControl(`supplyMonthStartRow${objBeforeDelete.no}`);
    this.productionScheduleForm.removeControl(`supplyMonthEndRow${objBeforeDelete.no}`);
    this.productionScheduleForm.removeControl(`productionTimeRow${objBeforeDelete.no}Col1`);
    this.productionScheduleForm.removeControl(`productionTimeRow${objBeforeDelete.no}Col2`);
    this.productionScheduleForm.removeControl(`productionTimeRow${objBeforeDelete.no}Col3`);
    this.productionScheduleForm.removeControl(`productionTimeRow${objBeforeDelete.no}Col4`);

    productionTimeList.pop();
    const objAfterDelete = productionTimeList[productionTimeList.length - 1];
    // disable/enable input
    this.productionTimeForm.controls[`supplyMonthStartRow${objAfterDelete.no}`].disable();
    this.productionTimeForm.controls[`supplyMonthEndRow${objAfterDelete.no}`].enable();

  }

  disabledAddProductionTimeRow(): boolean {
    try {
      const productionTimeList = this.productionTime.productionTimeList;
      const objLast = productionTimeList[productionTimeList.length - 1];
      return !objLast[`supplyMonthEndRow${objLast.no}`];
    } catch (error) {
      // continue
    }
  }

  fnCheckProductionTimeForm() {
    // tslint:disable-next-line:max-line-length
    console.log(this.productionTimeForm.controls, this.productionTimeForm, this.productionTimeForm.valid);
    for (const key in this.productionTimeForm.controls) {
      if (this.productionTimeForm.controls[key].errors) {
        this.productionTimeForm.controls[key].setErrors({'forceRequired': true});
        this.productionTimeForm.controls[key].markAsDirty();
      } else {
        this.productionTimeForm.controls[key].updateValueAndValidity();
      }
    }

    return this.productionTimeForm.valid;
  }

  fnCalProductionTimeHour(e, index?: number) {
    try {
      const id = e.target.id;
      const elm: any = document.getElementById(id);
      this.productionTime.productionTimeList[index][id] = elm.value || '';

      // const value = productionTimeRow[id];
      if (elm.value) {
        const valueArr = elm.value.split('.');
        const decimal = valueArr[1];
        if (decimal && +decimal < 5 && +elm.value > 0.5) {
          const changedValue = valueArr[0] + '.5';
          setTimeout(() => {
            console.log('changedValue', changedValue);
            this.productionTime.productionTimeList[index][id] = changedValue;
          }, 100);
        } else if (decimal && +decimal > 5 && +elm.value > 0.5) {
          const changedValue = +valueArr[0] + 1;
          setTimeout(() => {
            console.log('changedValue', changedValue);
            this.productionTime.productionTimeList[index][id] = changedValue;
          }, 100);
        } else if (+elm.value < 0.5) {
          setTimeout(() => {
            this.productionTime.productionTimeList[index][id] = 0.5;
          }, 100);
        }
      }
    } catch (error) {
      // handle error
    }

  }

  /** End Production Time */

  /** Additional Production Schedule */
  fnCheckAdditionalProductionScheduleForm() {
    let isValid = true;

    for (let i = 0; i < this.additional.productionLineList.length; i++) {
      const item = this.additional.productionLineList[i];
      if (this.additional.isAddProductionLine) {
        this.additionalProductionScheduleForm.controls['openingTime' + item.lineNo].setValidators(Validators.required);
        this.additionalProductionScheduleForm.controls['closingTime' + item.lineNo].setValidators(Validators.required);
      } else {
        this.additionalProductionScheduleForm.controls['openingTime' + item.lineNo].setValidators(null);
        this.additionalProductionScheduleForm.controls['closingTime' + item.lineNo].setValidators(null);
      }
      this.additionalProductionScheduleForm.controls['openingTime' + item.lineNo].updateValueAndValidity();
      this.additionalProductionScheduleForm.controls['closingTime' + item.lineNo].updateValueAndValidity();
    }


    const exceptInvalidList = ['productionStoppedFrom', 'productionStoppedTo'];
    // tslint:disable-next-line:max-line-length
    console.log(this.additionalProductionScheduleForm.controls, this.additionalProductionScheduleForm, this.additionalProductionScheduleForm.valid);
    for (const key in this.additionalProductionScheduleForm.controls) {
      if (this.additionalProductionScheduleForm.controls[key].invalid && !exceptInvalidList.includes(key)) {
        console.log(key, this.additionalProductionScheduleForm.controls[key].invalid);
        isValid = false;
        this.additionalProductionScheduleForm.controls[key].setErrors({'forceRequired': true});
        this.additionalProductionScheduleForm.controls[key].markAsDirty();
      } else {
        this.additionalProductionScheduleForm.controls[key].updateValueAndValidity();
      }
    }

    return isValid;
  }

  fnEditAdditionalProductionSchedule() {
    this.isEditAdditionalProductionSchedule = true;
    // this.additionalProductionScheduleForm.controls['manPower'].enable();
    // this.additionalProductionScheduleForm.disable();
    this.tempAdditional = _.cloneDeep(this.additional);
    for (let i = 0; i < this.additional.productionLineList.length; i++) {
      const data = this.additional.productionLineList[i];
      this.additionalProductionScheduleForm.controls[`openingTime${data.lineNo}`].enable();
      this.additionalProductionScheduleForm.controls[`closingTime${data.lineNo}`].enable();
      this.additionalProductionScheduleForm.controls[`note${data.lineNo}`].enable();
    }

    for (let i = 0; i < this.additional.additionalProductionTime.length; i++) {
      const data = this.additional.additionalProductionTime[i];
      this.additionalProductionScheduleForm.controls[`productionTimeClosingTime${data.lineNo}`].enable();
      this.additionalProductionScheduleForm.controls[`productionTimeNote${data.lineNo}`].enable();
    }
    if (this.additional.isProductionStopped) {
      this.additionalProductionScheduleForm.controls[`productionStoppedTime`].enable();
      this.additionalProductionScheduleForm.controls[`productionStoppedFrom`].enable();
      this.additionalProductionScheduleForm.controls[`productionStoppedTo`].enable();
      this.additionalProductionScheduleForm.controls[`productionStoppedReason`].enable();
    }
  }

  async fnSaveAdditionalProductionSchedule() {
    const valid = this.fnCheckAdditionalProductionScheduleForm();
    console.log('additionalProductionScheduleForm', valid);
    if (valid) {
      await this.updateAdditionalProdSchedule();
      await this.searchAdditionalProdSchedules();
      this.isEditAdditionalProductionSchedule = false;
      this.isEditManPower = false;
      this.additionalProductionScheduleForm.disable();
      this.additionalProductionScheduleForm.reset(this.additionalProductionScheduleForm.value);
    }
  }

  async fnLoopManPower1Year() {
    try {
      const checkUrl = this.common.checkMockupUrl('', '', {}, {
        BASE_API: '',
        BASE_MODULE: environment.apiPrefix,
        BASE_RESOURCE: environment.updateAdditionalProdSchedule
      });
      const startDate = moment().subtract(1, 'days');
      const add1Year = moment().subtract(1, 'days').add(1, 'years');
      for (let i = startDate; i < add1Year; i = i.add(1, 'days')) {
        const momentDate = moment(i);
        const refDay = +momentDate.format('d');
        if (refDay !== 0) {
          const postData: any = {
            date: momentDate.format(this.formatAdditionalScheduleAPI),
            manPower: 4,
            timeOpen: '08:00',
            timeClose: '17:00',
            productionLine: 2,
            isAddProductionLine: 0,
            isAddProductionTime: 0,
            isProductionStopped: 0,
            refDay: +momentDate.format('d'),
          };
          console.log('postData', postData);
          await this.request.post(checkUrl.url, postData);
        }
      }
    } catch (error) {
      console.error(error);
    }
  }

  fnCancelAdditionalProductionSchedule() {
    this.isEditAdditionalProductionSchedule = false;
    this.isEditManPower = false;
    this.additionalProductionScheduleForm.disable();
    this.additionalProductionScheduleForm.reset(this.additionalProductionScheduleForm.value);
    this.additional = this.tempAdditional;
  }

  isDisableDate(date: Date) {
    return moment(date) < moment().set({hour: 0, minute: 0, second: 0});
  }

  isSelectedDate(date: Date) {
    return moment(date).set({hour: 0, minute: 0, second: 0}).unix() === moment(this.currentDate).set({
      hour: 0,
      minute: 0,
      second: 0
    }).unix();
  }

  isShowProductionLine(date: Date) {
    const dateStr = moment(date).format(this.formatAdditionalScheduleAPI);
    return !!this.mapForShowProductionLine[dateStr];
  }

  isShowProductionTime(date: Date) {
    const dateStr = moment(date).format(this.formatAdditionalScheduleAPI);
    return !!this.mapForShowProductionTime[dateStr];
  }

  isShowProductionStopped(date: Date) {
    const dateStr = moment(date).format(this.formatAdditionalScheduleAPI);
    return !!this.mapForShowProductionStopped[dateStr];
  }

  async onCellClick(e) {
    // this.fnCancelAdditionalProductionSchedule();
    this.isEditAdditionalProductionSchedule = false;
    this.isEditManPower = false;
    this.additionalProductionScheduleForm.disable();
    this.additionalProductionScheduleForm.reset(this.additionalProductionScheduleForm.value);
    const momentStartDate = moment(e.cellData.startDate);
    // set false to toggle
    this.additional.isAddProductionTime = false;
    await this.searchAdditionalProdSchedule(e.cellData.startDate);
    this.currentDate = moment(e.cellData.startDate).toDate();
    this.selectedDateDisplay = moment(e.cellData.startDate).format(this.formatAdditionalSchedule);

    // ถ้าน้อยกว่าวันปัจจุบันจะไม่ได้ แก้ไข
    this.isCanEdit = momentStartDate.set({hour: 0, minute: 0, second: 0}).unix() >= moment().set({
      hour: 0,
      minute: 0,
      second: 0
    }).unix();

    // ถ้ามี timeOpen timeClose อยู่แล้วก็แสดงเลย ถ้าไม่มีไปเชื่อ Schedule
    const dateStr = moment(e.cellData.startDate).format(this.formatAdditionalScheduleAPI);
    console.log('this.mapForShowTimeOpenTimeClose', this.mapForShowTimeOpenTimeClose);
    console.log('dateStr', dateStr);
    if (this.mapForShowTimeOpenTimeClose[dateStr]) {
      this.additionalOpenTimeDisplay = this.mapForShowTimeOpenTimeClose[dateStr].timeOpen;
      this.additionalClosingTimeDisplay = this.mapForShowTimeOpenTimeClose[dateStr].timeClose;
      this.fnGetProductionTimeTimeCloseMax();
    } else {
      this.fnCalOpenTime();
    }
    this.additionalScheduler = [{
      text: '',
      startDate: moment(this.currentDate).set({hour: 0, minute: 0, second: 0}).toDate(),
      endDate: moment(this.currentDate).set({hour: 23, minute: 59, second: 59}).toDate(),
    }];
  }

  fnGetProductionTimeTimeCloseMax() {
    console.log('fnGetProductionTimeTimeCloseMax', this.additionalClosingTimeDisplay, this.additionalOpenTimeDisplay);

    if (this.additionalClosingTimeDisplay) {
      const h = +this.additionalClosingTimeDisplay.split(':')[0];
      const m = +this.additionalClosingTimeDisplay.split(':')[1];
      this.productionTimeTimeCloseMin = moment().set({h, m}).add({m: 30}).toDate();
    } else {

    }

    this.productionTimeTimeCloseMax = moment().set({h: 23, m: 30}).toDate();

    // if (this.additionalClosingTimeDisplay) {
    //   const h = +this.additionalClosingTimeDisplay.split(':')[0];
    //   const m = +this.additionalClosingTimeDisplay.split(':')[1];
    //   this.productionTimeTimeCloseMax = moment().set({h, m}).toDate();
    // } else {
    //   this.productionTimeTimeCloseMax = moment().set({h: 23, m: 30}).toDate();
    // }

    // if (this.additionalOpenTimeDisplay) {
    //   const h = +this.additionalOpenTimeDisplay.split(':')[0];
    //   const m = +this.additionalOpenTimeDisplay.split(':')[1];
    //   this.productionTimeTimeCloseMin = moment().set({h, m}).toDate();
    // } else {
    //   this.productionTimeTimeCloseMin = moment().set({h: 0, m: 0}).toDate();
    // }
  }

  onAppointmentClick(e: any) {
    e.cancel = true;
  }

  fnChangeManPower() {
    console.log('additional.manPower', this.additional.manPower);
    if (this.additional.manPower > 0) {
      if (this.additional.manPower <= 3) {
        this.additional.productionLine = 1;
      } else if (this.additional.manPower < 5) {
        this.additional.productionLine = 2;
      } else {
        this.additional.productionLine = 3;
      }
    } else {
      this.additional.productionLine = null;
    }
  }

  fnToggleAddProductionLine(e) {
    console.log('e', e);
    if (e.value) {
      // this.fnAddProductionLine();
    } else {
      this.fnDeleteProductionLine();
    }
    this.additional.isAddProductionLine = e.value;
    console.log('additional.isAddProductionLine', this.additional.isAddProductionLine);
  }

  fnAddProductionLine() {
    const obj = this.additional.productionLineList[this.additional.productionLineList.length - 1];
    let lineNo = 0;
    if (obj && obj.lineNo) {
      lineNo = obj.lineNo + 1;
    } else {
      lineNo = this.additional.productionLine + 1;
    }
    this.additional.productionLineList.push({
      lineNo: lineNo,
      openingTime: null,
      closingTime: null,
      note: '',
    });
    this.additionalProductionScheduleForm.addControl(`openingTime${lineNo}`, new FormControl('', [Validators.required]));
    this.additionalProductionScheduleForm.addControl(`closingTime${lineNo}`, new FormControl('', [Validators.required]));
    this.additionalProductionScheduleForm.addControl(`note${lineNo}`, new FormControl(''));
    this.additionalProductionScheduleForm.controls[`openingTime${lineNo}`].enable();
    this.additionalProductionScheduleForm.controls[`closingTime${lineNo}`].enable();
    this.additionalProductionScheduleForm.controls[`note${lineNo}`].enable();

    if (!this.isEditAdditionalProductionSchedule) {
      this.additionalProductionScheduleForm.controls[`note${lineNo}`].disable();
    }
  }

  fnDeleteProductionLine(lineNo?) {
    try {
      if (lineNo) {
        this.additionalProductionScheduleForm.removeControl(`openingTime${lineNo}`);
        this.additionalProductionScheduleForm.removeControl(`closingTime${lineNo}`);
        this.additionalProductionScheduleForm.removeControl(`note${lineNo}`);
        this.additional.productionLineList = this.additional.productionLineList.filter(obj => obj.lineNo !== lineNo);
      } else {
        const objAfterDelete = this.additional.productionLineList[this.additional.productionLineList.length - 1];
        const lastLineNo = objAfterDelete.lineNo;
        this.additionalProductionScheduleForm.removeControl(`openingTime${lastLineNo}`);
        this.additionalProductionScheduleForm.removeControl(`closingTime${lastLineNo}`);
        this.additionalProductionScheduleForm.removeControl(`note${lastLineNo}`);
        this.additional.productionLineList.pop();
      }
    } catch (error) {
      // continue
    }

  }

  fnToggleAddProductionTime(e) {
    console.log('e', e);
    if (e.value) {
      this.fnAddAdditionalProductionTime();
    } else {
      this.fnDeleteAdditionalProductionTime();
    }
    this.additional.isAddProductionTime = e.value;
    console.log('additional.isAddProductionTime', this.additional.isAddProductionTime);
  }

  fnAddAdditionalProductionTime() {
    this.additional.additionalProductionTime = [];
    for (let i = 0; i < this.additional.productionLine; i++) {
      const lineNo = i + 1;
      this.additional.additionalProductionTime.push({
        refDay: moment(this.currentDate).format('d'),
        lineNo: lineNo,
        timeClose: null,
        note: '',
      });
      this.additionalProductionScheduleForm.addControl(`productionTimeClosingTime${lineNo}`, new FormControl(''));
      this.additionalProductionScheduleForm.addControl(`productionTimeNote${lineNo}`, new FormControl(''));
      this.additionalProductionScheduleForm.controls[`productionTimeClosingTime${lineNo}`].enable();
      this.additionalProductionScheduleForm.controls[`productionTimeNote${lineNo}`].enable();

      if (!this.isEditAdditionalProductionSchedule) {
        this.additionalProductionScheduleForm.controls[`productionTimeNote${lineNo}`].disable();
      }
    }
  }

  fnDeleteAdditionalProductionTime() {
    try {
      const controls = Object.keys(this.additionalProductionScheduleForm.controls);
      for (let i = 0; i < controls.length; i++) {
        const control = controls[i];
        if (control.startsWith('productionTimeClosingTime') || control.startsWith('productionTimeNote')) {
          this.additionalProductionScheduleForm.removeControl(control);
        }
      }
      this.additional.additionalProductionTime = [];
    } catch (e) {
      // continue
    }
  }

  fnToggleAddProductionStopped(e) {
    console.log('e', e);
    if (e.value) {
      this.additionalProductionScheduleForm.addControl(`productionStoppedTime`, new FormControl('', [Validators.required]));
      this.additionalProductionScheduleForm.addControl(`productionStoppedFrom`, new FormControl('', [Validators.required]));
      this.additionalProductionScheduleForm.addControl(`productionStoppedTo`, new FormControl('', [Validators.required]));
      this.additionalProductionScheduleForm.addControl(`productionStoppedReason`, new FormControl('', [Validators.required]));
      if (!this.isEditAdditionalProductionSchedule) {
        this.additionalProductionScheduleForm.controls[`productionStoppedTime`].disable();
        this.additionalProductionScheduleForm.controls[`productionStoppedFrom`].disable();
        this.additionalProductionScheduleForm.controls[`productionStoppedTo`].disable();
        this.additionalProductionScheduleForm.controls[`productionStoppedReason`].disable();
      }
    } else {
      this.additional.productionStoppedTime = 1;
      this.additional.productionStoppedFrom = null;
      this.additional.productionStoppedTo = null;
      this.additional.productionStoppedReason = '';
      this.additionalProductionScheduleForm.removeControl(`productionStoppedTime`);
      this.additionalProductionScheduleForm.removeControl(`productionStoppedFrom`);
      this.additionalProductionScheduleForm.removeControl(`productionStoppedTo`);
      this.additionalProductionScheduleForm.removeControl(`productionStoppedReason`);
    }
    this.additional.isProductionStopped = e.value;
    console.log('additional.isProductionStopped', this.additional.isProductionStopped);
  }

  fnEditManPower() {
    this.isEditManPower = true;
    this.additionalProductionScheduleForm.controls[`manPower`].enable();
  }

  fnSaveManPower() {
    if (this.additional.manPower) {
      if (+this.manPowerBackup !== +this.additional.manPower) {
        this.goAlert('', '', 'myModalConfirmManPower', {
          date: this.selectedDateDisplay,
          manPowerFrom: this.manPowerBackup,
          manPowerTo: this.additional.manPower,
        });
      } else {
        this.fnCancelManPower();
      }
    }
  }

  fnCancelManPower() {
    this.isEditManPower = false;
    this.additionalProductionScheduleForm.controls[`manPower`].disable();
    this.additionalProductionScheduleForm.controls[`manPower`].reset(this.additional.manPower);

    // หน่วงรอ form reset แปป
    setTimeout(() => {
      this.additional.manPower = _.cloneDeep(this.manPowerBackup);
      this.fnChangeManPower();
    }, 100);

  }

  fnCalOpenTime() {
    try {
      const d = moment(this.currentDate).format('d');
      for (let i = 0; i < this.productionTimeList.length; i++) {
        const data = this.productionTimeList[i];
        const days = data.days;
        for (const key in days) {
          if (days[key].id === +d && days[key].value) {
            this.additionalOpenTimeDisplay = this.formatHHMM(data.openingTime);
            this.additionalClosingTimeDisplay = this.formatHHMM(data.closingTime);
            this.fnGetProductionTimeTimeCloseMax();
            break;
          }
        }
      }
    } catch (error) {
      // handle error
    }
  }

  onAdditionalOptionChanged(e) {
    console.log('e', e);
    if (e.name === 'currentDate' && e.component.option('currentView') === 'month') {
      const previousValue = moment(e.previousValue).get('month');
      const newValue = moment(e.value).get('month');
      if (previousValue !== newValue) {
        this.searchAdditionalProdSchedules(e.value);
      }
    }
  }

  /** End Additional Production Schedule */

  formatHHMMToDate(value) {
    if (moment(value, 'HH:mm').isValid()) {
      return moment(value, 'HH:mm').toDate();
    } else {
      return value;
    }
  }

  // Collapse ibox function
  clickCollapse(id) {
    this.common.collapseFnById(id);
  }


  onCancelDelete() {
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
    console.log('onCancelDelete');
  }

  onOkDelete() {
  }

  onOkManPowerModal() {
    console.log('onOkManPowerModal');
    this.manPowerBackup = _.cloneDeep(this.additional.manPower);
    this.additionalProductionScheduleForm.controls[`manPower`].disable();
    this.additionalProductionScheduleForm.controls[`manPower`].reset(this.additional.manPower);
    this.isEditManPower = false;

    // หน่วงรอ form reset แปป
    setTimeout(() => {
      this.fnChangeManPower();
      this.additional.productionLineList = [];
      this.additional.additionalProductionTime = [];
      if (this.additional.isAddProductionTime) {
        this.fnDeleteAdditionalProductionTime();
        this.fnAddAdditionalProductionTime();
      } else {
        this.fnDeleteAdditionalProductionTime();
      }
      if (this.additional.isAddProductionLine) {
        this.fnDeleteProductionLine();
        this.fnAddProductionLine();
      } else {
        this.fnDeleteProductionLine();
      }
    }, 100);

  }

  numberOnly(event: any): boolean {
    const key = event.key;
    if (key === 'Backspace' || key === 'Delete') {
      return true;
    }
    return /[0-9]/g.test(key);
  }

  fnCheckMinTime(data: any, key: string) {
    data.checkMinTime = moment(data[key]).add(30, 'minutes');
  }

  fnCheckMaxTime(data: any, key: string) {
    data.checkMaxTime = moment(data[key]).subtract(30, 'minutes');
  }
}
