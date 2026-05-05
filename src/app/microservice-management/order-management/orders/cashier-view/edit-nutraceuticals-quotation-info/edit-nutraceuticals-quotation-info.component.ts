import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
// import { LayoutMenu } from '../../../shared/store/layout.menu.store';
import { Request } from '../../../../../shared/services/request.service';
import { Common } from '../../../../../shared/services/common.service';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { DxTreeListComponent } from 'devextreme-angular';
import { environment } from '../../../../../../environments/environment';
import { CompareService } from '../../../../../shared/services/compare.service';
import { StoreService } from '../../../../../shared/services/store.service';
import { CurrencyMaskConfig } from "ngx-currency";
import * as moment from 'moment';

declare let $: any;

interface Detail {
  name: string;
  quantity: string;
  uom: string;
  unitPrice: number;
  amount: number;
}

@Component({
  selector: 'app-edit-nutraceuticals-quotation-info',
  providers: [Request, Common, CompareService],
  templateUrl: './edit-nutraceuticals-quotation-info.component.html',
  styleUrls: ['./edit-nutraceuticals-quotation-info.scss'],
  encapsulation: ViewEncapsulation.None
})
export class EditNutraceuticalsQuotationInfoComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('myModal') myModal;
  @ViewChild(DxTreeListComponent) treeList: DxTreeListComponent;
  orderStatusParam = ''
  locationList;
  patientInfo = {
    hn: '',
    patientName: '',
    orderDate: '',
    supplyDay: '',
    physician: '',
    location: '',
    tariff: '',
    plan: '',
    orderStatus: null,
    remindDate: null,
    additionalNote: ''
  };
  editGroupForm: FormGroup;
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
  menuHome: any = false;
  menuPermissions: any = { view: false, add: false, edit: false, delete: false };
  unitList = [];
  statusList: { id: number, name: string }[] = [];
  detailList: Detail[] = [];
  summary = 0;
  currencyMaskOptions: CurrencyMaskConfig = {
    align: 'right',
    allowNegative: true,
    allowZero: true,
    decimal: '.',
    precision: 0,
    prefix: '',
    suffix: '',
    thousands: ',',
    nullable: true,
    min: null,
    max: null,
  };
  orderId = null;
  dropdown: any = {};
  currentDate = new Date();
  errorText: any;
  tariffList = [];
  intervalUpdateWorkingBy;

  constructor(public router: Router,
    private fb: FormBuilder,
    private request: Request,
    public common: Common,
    private compare: CompareService,
    private route: ActivatedRoute,
    private store: StoreService) {
    this.editGroupForm = this.fb.group({
      'txtHn': new FormControl(''),
      'txtPatientName': new FormControl(''),
      'txtOrderDate': new FormControl(''),
      'txtSupplyDay': new FormControl(''),
      'txtPhysician': new FormControl(''),
      'txtOrderType': new FormControl(''),
      'txtTariff': new FormControl(''),
      'txtPlan': new FormControl({ disabled: true }),
      'ddlStatus': new FormControl(null),
      'txtRemindDate': new FormControl(''),
      'txtAdditionalNote': new FormControl(''),
    });
  }

  async ngOnInit() {
    try {
      const id = this.route.snapshot.paramMap.get('id');
      console.log('----------------------id', id)
      this.pageType = this.route.snapshot.paramMap.get('action');
      const orderStatus = this.route.snapshot.queryParams['orderStatus'];
      this.orderStatusParam = orderStatus
      this.orderId = +id;
      const dropdown = await this.common.searchConfig();
      this.tariffList = dropdown.tariffList || [];
      this.locationList = dropdown.location || [];

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
      const notCheckError = ['Waiting for Customer', 'Cannot Contact Customer', 'Urgent Approve', 'Reminded']
      if (!orderStatus || orderStatus !== 'Customer Rejected' && !notCheckError.includes(orderStatus)) {
        console.log("-------------------------------orderStatus", orderStatus)
        const response = await this.getErrorOrder();
        if (response.resultCode !== environment.resultCodeSuccess) {
          this.loading = false;
          this.errorText = response.resultDescription.split('\n');
          if (!this.menuPermissions.edit) {
            this.goAlert(response.resultCode, response.resultDescription, 'myModalOrderErrorStatus1');
          } else {
            this.goAlert(response.resultCode, response.resultDescription, 'myModalOrderError');
          }
        } else {
          await this.fnLoadData();
        }
      } else {
        await this.fnLoadData();
      }
    } catch (e) {
      console.log(e);
    }
  }

  ngOnDestroy() {
    console.log('clear interval');
    clearInterval(this.intervalUpdateWorkingBy);
  }

  async fnLoadData() {
    try {
      this.dropdown = await this.common.searchConfig();
      this.loading = false;
      this.disbledBtn = {
        'save': false,
        'cancel': false
      };
      const splitPath = this.router.url.split('/');
      const splitAction = splitPath[splitPath.length - 1].split('?');
      this.pageType = splitAction[0];
      console.log('this.pageType', this.pageType);
      this.editGroupForm.controls['txtPlan'].disable();
      if (this.pageType === 'view' || this.pageType === 'edit') {
        this.updateWorkingBy();
        this.intervalUpdateWorkingBy = setInterval(() => {
          this.updateWorkingBy();
        }, 3000);
      }
      this.editGroupForm.controls['txtHn'].disable();
      this.editGroupForm.controls['txtPatientName'].disable();
      this.editGroupForm.controls['txtOrderDate'].disable();
      this.editGroupForm.controls['txtSupplyDay'].disable();
      this.editGroupForm.controls['txtPhysician'].disable();
      this.editGroupForm.controls['txtOrderType'].disable();
      this.editGroupForm.controls['txtTariff'].disable();
      if (this.pageType === 'view') {
        this.editGroupForm.controls['ddlStatus'].disable();
        this.editGroupForm.controls['txtRemindDate'].disable();
        this.editGroupForm.controls['txtAdditionalNote'].disable();
      } else {
        this.editGroupForm.controls['ddlStatus'].enable();
        this.editGroupForm.controls['txtRemindDate'].enable();
        this.editGroupForm.controls['txtAdditionalNote'].enable();
      }
      await this.getApiEdit();
      if (this.showAdditionalNote()) {
        this.editGroupForm.controls['txtAdditionalNote'].setValidators(Validators.required);
      }
      if (this.showRemindDate()) {
        this.editGroupForm.controls['txtRemindDate'].setValidators(Validators.required);
      }
      await this.checkGroupPermission();
    } catch (e) {
      console.log(e);
      const resultDescriptionSystemErrorTitle = environment.resultDescriptionSystemErrorTitle;
      const resultDescriptionSystemErrorMassage = environment.resultDescriptionSystemErrorMassage;
      this.goAlert(resultDescriptionSystemErrorTitle, resultDescriptionSystemErrorMassage, 'myModalError');
    }
  }

  async getErrorOrder() {
    const filterData = {
      orderId: this.orderId,
    };

    const checkUrl = this.common.checkMockupUrl('', '', filterData, {
      BASE_API: '',
      BASE_MODULE: environment.apiPrefix,
      BASE_RESOURCE: environment.searchErrorOrder
    });

    return await this.request.get(checkUrl.url, checkUrl.filter);
  }

  lineData() {
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

  goHomeMenu() {
    if (this.menuHome) {
      this.router.navigate(['/menu', this.menuHome['menuId'], this.menuHome['typePage']]);
    }
  }

  async ngAfterViewInit() {
    document.body.scrollTop = 0; // สั่งให้ scroll to top เมื่อเข้าหน้ามา
  }

  async getApiEdit() {
    try {
      this.loading = true;
      this.disbledBtn = {
        'save': true,
        'cancel': true
      };
      const filterData = {
        orderId: this.orderId,
      };

      const checkUrl = this.common.checkMockupUrl('', '', filterData, {
        BASE_API: '',
        BASE_MODULE: environment.apiPrefix,
        BASE_RESOURCE: environment.searchOrderCashierView
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

      const response = await this.request.get(checkUrl.url, checkUrl.filter);
      if (response.resultCode === resultCodeSuccess) {
        const resultData = await response.resultData;
        // order
        const order = resultData.order || {};
        this.patientInfo.hn = order.hn;
        this.patientInfo.patientName = order.patientName;
        this.patientInfo.orderDate = this.common.convertDate(order.orderDate, 'DD/MM/YYYY HH:mm');
        this.patientInfo.supplyDay = order.supplyDay;
        this.patientInfo.physician = order.physician;
        this.patientInfo.plan = order.plan;
        this.patientInfo.tariff = order.tariff ? this.tariffList.find((x) => {
          return +x.id === +order.tariff;
        }).name : '';
        this.patientInfo.location = order.location ? this.locationList.find((x) => {
          return +x.id === +order.location;
        }).name : '';
        this.patientInfo.orderStatus = order.orderStatus;
        if (order.waitingRemindDate) {
          if (moment(order.waitingRemindDate, 'DD/MM/YYYY').isValid()) {
            this.patientInfo.remindDate = moment(order.waitingRemindDate, 'DD/MM/YYYY').toDate();
          } else {
            this.patientInfo.remindDate = moment(order.waitingRemindDate).toDate();
          }
        }
        this.patientInfo.additionalNote = order.cusChangeAdditionalNote;

        let displayStatusList = [];
        if (order.orderStatus === 3) {
          displayStatusList = [3, 4, 6, 9];
        } else if (order.orderStatus === 4) {
          displayStatusList = [4, 5, 8, 9];
        } else if (order.orderStatus === 9) {
          displayStatusList = [9, 10, 11, 13];
        } else if (order.orderStatus === 11) {
          displayStatusList = [11, 13];
        } else if (order.orderStatus === 6) {
          displayStatusList = [6, 4, 9];
        } else if (order.orderStatus === 7) {
          displayStatusList = [7, 4, 6];
        }
        if (this.pageType === 'view') {
          this.statusList = this.dropdown.orderStatus;
        } else {
          this.statusList = this.dropdown.orderStatus.filter(obj => {
            if (displayStatusList.indexOf(obj.id) >= 0) {
              return obj;
            }
          });
        }
        
        // detail
        this.detailList = resultData.quotationDetail || [];
        for (let i = 0; i < this.detailList.length; i++) {
          if (this.detailList[i].name.includes('Customized Supplement')) {
            this.detailList[i].unitPrice = Math.ceil(this.detailList[i].unitPrice);
            this.detailList[i].amount = Math.ceil(this.detailList[i].amount);
          }
          if (this.detailList[i].unitPrice == null) {
            this.detailList[i].unitPrice = 0.00
          }
          if (this.detailList[i].amount == null) {
            this.detailList[i].amount = 0.00
          }

        }
        let total = 0;
        for (let i = 0; i < resultData.quotationDetail.length; i++) {
          const data = resultData.quotationDetail[i];
          total += data.amount;
        }
        this.summary = Math.ceil(total);
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
      console.log(this.patientInfo);
      if (requiredData) {
        let updateData: any = {
          orderId: this.orderId,
          orderStatus: +this.patientInfo.orderStatus,
          cusChangeAdditionalNote: this.patientInfo.additionalNote,
        };

        if (+this.patientInfo.orderStatus === 4 || +this.patientInfo.orderStatus === 6) {
          updateData.waitingRemindDate = this.common.dateToString(this.patientInfo.remindDate, 'YYYY-MM-DD')
        }
        const checkUrl = this.common.checkMockupUrl('', '', '', {
          BASE_API: '',
          BASE_MODULE: environment.apiPrefix,
          BASE_RESOURCE: environment.updateStatusCashier
        });
        const response = await this.request.post(checkUrl.url, updateData);
        if (response.resultCode === resultCodeSuccess) {
          this.goAlert('', '', 'myModalSuccess');
        } else {
          this.goAlert(response.resultCode, response.resultDescription, 'myModalError');
        }
      } else {
        console.log('กรุณากรอกข้อมูลให้ถูกต้อง');
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

  fnCheckRequired() {
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

  showAdditionalNote(): boolean {
    if (this.patientInfo.orderStatus) {
      return [4, 5, 8].indexOf(+this.patientInfo.orderStatus) >= 0;
    } else {
      return false;
    }
  }

  showRemindDate(): boolean {
    if (this.patientInfo.orderStatus) {
      return [4, 6].indexOf(+this.patientInfo.orderStatus) >= 0;
    } else {
      return false;
    }
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


      let locationText = this.errorText[this.errorText.length - 1].split('in ')[1]
      locationText = locationText.replaceAll('.', '')
      let data: any = {
        orderId: this.orderId,
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

  onCloseEditOrder() {
    this.onClickBack()
  }

  fnChangeStatus() {
    if (this.showAdditionalNote()) {
      this.editGroupForm.controls['txtAdditionalNote'].setValidators(Validators.required);
    } else {
      this.editGroupForm.controls['txtAdditionalNote'].setValidators(null);
    }
    this.editGroupForm.controls['txtAdditionalNote'].updateValueAndValidity();
    if (this.showRemindDate()) {
      this.editGroupForm.controls['txtRemindDate'].setValidators(Validators.required);
    } else {
      this.editGroupForm.controls['txtRemindDate'].setValidators(null);
    }
    this.editGroupForm.controls['txtRemindDate'].updateValueAndValidity();
  }

  async updateWorkingBy() {
    try {
      const checkUrl = this.common.checkMockupUrl('', '', '', {
        BASE_API: '',
        BASE_MODULE: environment.apiPrefix,
        BASE_RESOURCE: environment.updateWorkingBy,
      });
      this.request.post(checkUrl.url, { orderId: this.orderId });
    } catch (e) {
      console.log(e);
    }
  }
}
