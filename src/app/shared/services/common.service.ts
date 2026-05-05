import { Injectable } from '@angular/core';
import 'rxjs/Rx';
import * as moment from 'moment';
import { Http } from '@angular/http';
import { Request } from './request.service';
import uuidv4 from 'uuid/v4';
import { environment } from '../../../environments/environment';

declare let $: any;

@Injectable()
export class Common {
  mockupIP = '';
  userName = sessionStorage.getItem('userName') || 'BLUEFIN';
  permission: any = [];
  theme: any;

  private configuredLoginUrl = 'http://localhost:4800';

  constructor(private request: Request, public http: Http) {
  }

  checkMockupUrl(mockupUrl, realUrl, filter, global) {

    if (mockupUrl) {
      return {
        url: mockupUrl,
        filter: {}
      };
    } else {
      if (global.RESOURCE) {
        return {
          url: this.mockupIP + global.BASE_API + global.BASE_MODULE + global.BASE_RESOURCE + global.RESOURCE + realUrl,
          filter: filter
        };
      } else {
        return {
          url: this.mockupIP + global.BASE_API + global.BASE_MODULE + global.BASE_RESOURCE + realUrl,
          filter: filter
        };
      }
    }
  }

  convertDate(date, format) {
    // console.log("convertDate",date,format);

    if (date) {
      let convertedDate;
      if (moment(date, 'DD/MM/YYYY HH:mm:ss').isValid()) {
        convertedDate = moment(date, 'DD/MM/YYYY HH:mm:ss').format(format);
        // console.log('convertedDate2', convertedDate);
      } else if (moment(date).isValid()) {
        convertedDate = moment(date).format(format);
        // console.log('convertedDate1', convertedDate);
      } else if (moment(date, 'YYYYMMDDHHmmss+zzzz').isValid()) {
        convertedDate = moment(date, 'YYYYMMDDHHmmss+zzzz').format(format);
        // console.log('convertedDate1', convertedDate);
      } else {
        convertedDate = 'Invalid Date';
      }
      return convertedDate
    } else {
      return '';
    }
  }

  logout() {
    sessionStorage.removeItem('permission');
    sessionStorage.removeItem('userName');
    sessionStorage.removeItem('name');
    location.href = this.configuredLoginUrl + '/logout';
  }

  stringToDate(str, format?) {
    if (format) {
      return moment(str, format).toDate();
    } else {
      return moment(str).toDate();
    }
  }

  dateToString(date, format) {
    return moment(date).format(format);
  }

  getRandomNumber(num) {
    let text = '';
    const possible = '0123456789';

    for (let i = 0; i < num; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }

  checkLoadOptions(loadOptions) {
    if (loadOptions.hasOwnProperty('take') && loadOptions.hasOwnProperty('skip') && loadOptions.hasOwnProperty('sort')) {
      return true;
    } else {
      return false;
    }
  }

  checkFilter(filterData, filterStore, offset) {
    let isChange = false
    if (offset != 0 && JSON.stringify(filterData) != filterStore) {
      isChange = true
    }
    return isChange
  }

  generateId() {
    const id = uuidv4();
    return id;
  }

  collapseFn() {
    // $('a.collapse-link').click(function () {
    const ibox = $('div.collapse-link').closest('div.ibox');
    const button = $('div.collapse-link').find('svg');
    const content = ibox.find('div.ibox-body');
    const footer = ibox.find('div.ibox-footer');
    content.slideToggle();
    footer.slideToggle();
    button.toggleClass('fa-chevron-up').toggleClass('fa-chevron-down');
    ibox.toggleClass('').toggleClass('border-bottom');
    setTimeout(function () {
      ibox.resize();
      ibox.find('[id^=map-]').resize();
    }, 50);
    // });
  }

  collapseFnById(id) {
    const icon = $('#' + id + ' div.collapse-link i');
    const content = $('#' + id + ' div.ibox-body');
    const footer = $('#' + id + ' div.ibox-footer');
    content.slideToggle();
    footer.slideToggle();
    icon.toggleClass('fa-chevron-up').toggleClass('fa-chevron-down');
  }

  checkInvalidText(text: string, typeMatch: string) {
    console.log('checkTypeText');
    console.log('text: ', text);
    console.log('type: ', typeMatch);
    let reg: any;
    if (typeMatch === 'eng') {
      reg = /[a-zA-Z_ ]/g;

    } else if (typeMatch === 'num') {
      reg = /[0-9]/g;
    }
    const match = text.match(reg);
    if (!match || match.length !== text.length) {
      console.log('return true');
      return true;
    } else {
      return false;
    }
  }

  textAreaAutoHeightFn() {
    const el = document.querySelector('textarea');
    setTimeout(function () {
      el.style.cssText = 'height:auto; padding:0;';
      el.style.cssText = 'height:' + el.scrollHeight + 'px;resize: vertical';

    }, 0);
  }

  trimData(data) {
    if (data === undefined || data === null || data === 'null') {
      return data;
    } else {
      return data.trim();
    }

  }

  diffMinutes(after, before) {
    after = moment(after);
    before = moment(before);
    return after.diff(before, 'minutes');
  }

  diffHours(after, before) {
    after = moment(after);
    before = moment(before);
    return after.diff(before, 'hours');
  }

  diffDays(after, before) {
    after = moment(after);
    before = moment(before);
    return after.diff(before, 'days');
  }

  convertDateToString(date: any) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    let strDate = '';
    const diffDay = this.diffDays(moment(date, 'DD/MM/YYYY HH:mm:ss').format('YYYY-MM-DD'), now);
    if (diffDay === -1) {
      strDate += 'Yesterday';
    } else if (diffDay === 1) {
      strDate += 'Tomorrow';
    } else if (diffDay === 0) {
      strDate += 'Today';
    } else if (diffDay === 2) {
      strDate += 'Today+2';
    } else if (diffDay === 3) {
      strDate += 'Today+3';
    } else {
      strDate += moment(date, 'DD/MM/YYYY HH:mm:ss').format('DD/MM/YYYY');
    }
    return strDate;
  }

  messageInvalidFields(response) {
    const errorMessageList = [];
    if (response.errorRequired > 0) {
      errorMessageList.push(this.genMessageInvalid(response.errorRequired, 'required'));
    }
    if (response.errorDataNotFound > 0) {
      errorMessageList.push(this.genMessageInvalid(response.errorDataNotFound, 'data not found'));
    }
    if (response.errorDataUsed > 0) {
      errorMessageList.push(this.genMessageInvalid(response.errorDataUsed, 'already been used'));
    }
    if (response.errorDataInvalid > 0) {
      errorMessageList.push(this.genMessageInvalid(response.errorDataInvalid, 'data invalid'));
    }
    return errorMessageList;
  }

  genMessageInvalid(totalInvalid, message) {
    const textSingular = 'field is';
    const textPlural = 'fields are';
    const text1 = totalInvalid > 1 ? textPlural : textSingular;
    return `${totalInvalid} ${text1} ${message}`;
  }

  decimal(id, digit = 18, decimal = 10): string {
    // gen text 0 by digit
    if (digit && decimal) {
      digit -= decimal;
    }
    let tmpDigit = '';
    for (let i = 0; i < digit; i++) {
      tmpDigit += '0';
    }

    // gen text 0 by decimal
    let tmpDecimal = '';
    for (let i = 0; i < decimal; i++) {
      tmpDecimal += '0';
    }

    const elm: any = document.getElementById(id);
    if (elm && elm.value) {
      const splitValue = elm.value.split('.');
      const number = splitValue[0];
      if (number.length >= digit) {
        let tmp = '';
        for (let i = 0; i < digit; i++) {
          tmp += '0';
        }
        return `${tmp}.${tmpDecimal}`;
      } else {
        return `0*.${tmpDecimal}`;
      }
    } else {
      return `0*.${tmpDecimal}`;
    }
  }

  async searchConfig() {
    try {
      const checkUrl = this.checkMockupUrl('', '', '', {
        BASE_API: '',
        BASE_MODULE: environment.apiPrefix,
        BASE_RESOURCE: environment.searchConfig
      });

      const resultCodeSuccess = environment.resultCodeSuccess;
      const response = await this.request.get(checkUrl.url, checkUrl.filter);
      if (response.resultCode === resultCodeSuccess) {
        return response.resultData;
      } else {
        return {};
      }
    } catch (e) {
      console.log(e);
      return {};
    }
  }

  async export(reportName, filter, modal) {
    try {
      const filterData = {
        reportName: reportName,
        ...filter
      };

      const checkUrl = this.checkMockupUrl('', '', filterData, {
        BASE_API: '',
        BASE_MODULE: environment.apiPrefix,
        BASE_RESOURCE: environment.export
      });

      const resultCodeSuccess = environment.resultCodeSuccess;
      const response = await this.request.getWithTimeout(checkUrl.url, checkUrl.filter, 300000);
      if (response.resultCode === resultCodeSuccess) {
        const resultData = response.resultData || response.data;
        const fileURL = resultData.filename;
        if (fileURL) {
          window.open(fileURL);
        }
      } else {
        modal.openModal({
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
      modal.openModal({
        'modalId': 'myModalError',
        'userTitle': resultDescriptionSystemErrorTitle,
        'userMessage': resultDescriptionSystemErrorMassage,
        'userMessageList': []
      });
    }
  }

  concatAddress(data) {
    let returnData = '';

    if (data.address && data.address !== '') {
      returnData += data.address;
    }
    if (data.subdistrict && data.subdistrict !== '') {
      returnData += ` แขวง/ตำบล ${data.subdistrict}`;
    }
    if (data.district && data.district !== '') {
      returnData += ` เขต/อำเภอ ${data.district}`;
    }
    if (data.province && data.province !== '') {
      returnData += ` จังหวัด ${data.province}`;
    }
    if (data.postcode && data.postcode !== '') {
      returnData += ` ${data.postcode}`;
    }
    return returnData;
  }

  async print(data, orderId, modal) {
    try {
      let filterData: any = '';
      if (data.filter) {
        filterData = {
          ...data.filter
        };
      }
      const checkUrl = this.checkMockupUrl('', '', filterData, {
        BASE_API: '',
        BASE_MODULE: environment.apiPrefix,
        BASE_RESOURCE: data.url + '/' + orderId
      });

      const resultCodeSuccess = environment.resultCodeSuccess;
      const response = await this.request.get(checkUrl.url, checkUrl.filter);
      if (response.resultCode === resultCodeSuccess) {
        const resultData = response.resultData || response.data;
        const fileName = resultData.filename;
        console.log('fileName', fileName);
        if (fileName) {
          window.open(fileName);
        }
      } else {
        modal.openModal({
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
      modal.openModal({
        'modalId': 'myModalError',
        'userTitle': resultDescriptionSystemErrorTitle,
        'userMessage': resultDescriptionSystemErrorMassage,
        'userMessageList': []
      });
    }
  }

  /**
   * เวลาที่แสดงให้เลือกต้องมากกว่า deliveryDate
   * @param arrivalTimeList []
   * @param deliveryDate date
   * @param timeStr String HH:mm
   */
  checkArrivalTime(arrivalTimeList, deliveryDate, timeStr?: string) {
    // console.log('checkArrivalTime deliveryDate', deliveryDate);
    // console.log('checkArrivalTime timeStr', timeStr);
    const setTimeZero = { h: 0, m: 0, s: 0, ms: 0 };
    const deliveryDateOnly = moment(deliveryDate).set(setTimeZero);
    const currentDateOnly = moment().set(setTimeZero);
    // console.log('checkArrivalTime deliveryDateOnly', deliveryDateOnly.format('DD-MM-YYYY HH:mm:ss'));
    // console.log('checkArrivalTime currentDateOnly', currentDateOnly.format('DD-MM-YYYY HH:mm:ss'));
    // (วันที่ 6 > วันที่ 4 && 13:00) ||
    if ((deliveryDateOnly > currentDateOnly && !timeStr) || !deliveryDate) {
      return arrivalTimeList;
    }

    const currentDateTime = moment();
    let h = currentDateTime.get('h');
    let m = currentDateTime.get('m');
    if (timeStr) {
      const timeArr = timeStr.split(':');
      h = +timeArr[0];
      m = +timeArr[1];
    }
    const compareDateTime = moment().set({ h, m, s: 0, ms: 0 });
    // console.log('compareDateTime', compareDateTime.format('DD-MM-YYYY HH:mm:ss'));
    const displayList = [];
    for (let i = 0; i < arrivalTimeList.length; i++) {
      const data = arrivalTimeList[i];
      let str = data.name || '';
      str = str.replace(/ /g, '');
      str = str.split(':')[1];
      str = str.replace('น.', '');

      if (str.includes('-')) {
        const strArr = str.split('-');
        const strArrForm = strArr[0].split('.');

        const arrivalFromDateTime = moment().set({ h: +strArrForm[0], m: +strArrForm[1], s: 0, ms: 0 });
        if (arrivalFromDateTime > compareDateTime) {
          displayList.push(data);
        }
      } else {
        const strArr = str.split('.');
        const arrivalDateTime = moment().set({ h: +strArr[0], m: +strArr[1], s: 0, ms: 0 });
        if (arrivalDateTime > compareDateTime) {
          displayList.push(data);
        }
      }
    }
    // console.log('displayList', displayList);
    return displayList;
  }

  /**
   * เช็คเวลาใน scheduler ว่ามีการจองแล้วหรือเปล่า
   * @param newData ข้อของช่วงที่กำลังจะจอง
   * @param oldData ข้อมูลที่มีการจองไว้แล้ว
   */
  isNotAvailable(newData, oldData) {
    const startDateOfDay = moment(newData.startDate);
    const endDateOfDay = moment(newData.endDate);
    while (startDateOfDay <= endDateOfDay) {
      const appointmentStartTime = moment(oldData.startDate);
      const appointmentEndTime = moment(oldData.endDate);
      if (startDateOfDay.isBetween(appointmentStartTime, appointmentEndTime)) {
        return true;
      }
      startDateOfDay.add(30, 'minute');
    }
    return false;
  }


  getDose(element, PERCENT_LOSS) {
    /********************************************************************
     weight
     Step 1 ($dosePerday/$strength) = ($actualdose) (mg)
     Step 2 actualdose + (actualdose * 0.02)= $addmore
     Step 3 $addmore * (If $calculatedDay = NUll use $supplyDay) = $totalDose
     Step 4 convert to (g) totalDoseG = $totalDose / 1000 {ทศนิยม 4 ตำแหน่ง}
     *********************************************************************/
    const actualdose = element.dosePerDay / element.strength;
    const addmore = actualdose + (actualdose * PERCENT_LOSS);
    const totalDose = addmore * (element.calculatedDay || element.supplyDay);
    // let totalDose = service.unit2mg(element.unit, addmore * (element.calculatedDay || element.supplyDay))

    // console.log('🦞 addmore', addmore)

    return {
      totalDoseG: totalDose / 1000, // convert to gram
      actualdose: actualdose,
      totalDose: totalDose,
      addmore: addmore
    };
  }

  toBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  })

  blobToFile(theBlob: Blob, fileName: string): File {
    const b: any = theBlob;
    b.lastModified = new Date();
    b.name = fileName;
    return <File>theBlob;
  }

  fnResizeImage(files, name, ratio) {
    return new Promise((resolve, reject) => {
      const ele = new Image();
      ele.addEventListener('load', () => {
        console.log('load');
        // Create new canvas
        const canvas = document.createElement('canvas');

        // Draw the image that is scaled to `ratio`
        const context = canvas.getContext('2d');
        let w = ele.width;
        let h = ele.height;
        // window.alert('ก่อน ' + w + ' ' + h);
        if (ele.height > 1000) {
          w = ele.width * ratio;
          h = ele.height * ratio;
          // window.alert('หลัง ' + w + ' ' + h);
        }
        canvas.width = w;
        canvas.height = h;
        context.drawImage(ele, 0, 0, w, h);
        console.log('canvas', canvas);

        canvas.toBlob((blobResize: any) => {
          files = this.blobToFile(blobResize, name);
          console.log('files', files);
          // window.alert('ขนาด ' + files.size);
          resolve(files);
        });
      });
      this.toBase64(files).then((r: any) => {
        ele.src = r;
      });
    });
  }

  public isRoleClinics(role: string) {
    try {
      if (role) {
        const list = environment.clinicsList || [];
        for (let i = 0; i < list.length; i++) {
          const name = list[i].toLowerCase();
          if (role.toLowerCase() === name) {
            return true;
          }
        }
      } else {
        return false;
      }
    } catch (error) {
      console.log('isRoleClinics error', error);
      return false;
    }
  }
}
