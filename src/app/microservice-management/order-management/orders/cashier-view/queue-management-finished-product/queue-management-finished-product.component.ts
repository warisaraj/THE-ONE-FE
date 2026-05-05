import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
// import { LayoutMenu } from '../../../shared/store/layout.menu.store';
import { Request } from '../../../../../shared/services/request.service';
import { Common } from '../../../../../shared/services/common.service';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { DxTreeListComponent } from 'devextreme-angular';
import { environment } from '../../../../../../environments/environment';
import { CompareService } from '../../../../../shared/services/compare.service';
import { StoreService } from '../../../../../shared/services/store.service';
import { CurrencyMaskConfig } from 'ngx-currency';
import CustomStore from 'devextreme/data/custom_store';
import { GlobalVariable } from '../../pharmacist-view/edit-pharmacist/edit-pharmacist.global';
import * as moment from 'moment';
import { SharedService } from 'src/app/shared/services/shared.service';
import * as _ from 'lodash';

@Component({
  selector: 'app-queue-management-finished-product',
  providers: [Request, Common, CompareService],
  templateUrl: './queue-management-finished-product.component.html',
  styleUrls: ['./queue-management-finished-product.scss'],
  encapsulation: ViewEncapsulation.None
})
export class QueueManagementFinishedProductComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('fileInput') fileInput: ElementRef;
  @ViewChild('myModal') myModal;
  @ViewChild(DxTreeListComponent) treeList: DxTreeListComponent;
  originalPharmacyPictureList = []
  role = ''
  isEditMode = false
  originalData = {};
  orderStatusMapByName = {};
  orderStatusMapById = {};
  pageOrderStatus = null
  popupVisible = false
  filePicture = null
  updateRemarkSuccess = false
  isEditFinish = false
  isEditPage = false
  orderStatus: any;
  patientInfo = {
    hn: '',
    patientName: '',
    phone: '',
    address: '',
    district: '',
    subdistrict: '',
    province: '',
    addressShow: '',
    districtProvince: '',
    postcode: '',
    contactPerson: '',
    item: null,
    csReason: '',
    orderPharmacyNoteRemark: '',
    orderStatus: ''
  };
  deliveryDetail = {
    deliveryDetailId: null,
    recipientName: '',
    phone: '',
    patientAddressId: null,
    address: '',
    district: '',
    districtProvince: '',
    postcode: '',
    deliveryDate: null,
    arrivalTime: null,
    deliveryMethod: null,
    deliveryMethodOther: '',
    // packaging: null,
    subdistrict: '',
    province: '',
    isInvoice: false,
    isReceipt: false,
    cashierId: null,
    isUrgent: false,
    cashierDeliNote: '',
    deliveryStatus: null,
    pharmacyPicture: [],
    deliveryPicture: [],
    csReason: '',
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
  pageType: any = '';
  menuHome: any = false;
  menuPermissions: any = { view: false, add: false, edit: false, delete: false };
  unitList = [];
  // statusList: string[] = [];
  // detailList: Detail[] = [];
  summary = 9956.00;
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
  arrivalTimeList = [];
  arrivalTimeListBackup = [];
  deliveryMethodList = [];
  packagingList: { id: number, name: string }[] = [];
  cashierList: { userId: number, firstname: string, lastname: string, username: string }[] = [];
  addressList = [];
  id = null;
  patientItemList: { id: number, name: string }[] = [];
  patientInfoDataSource: any;
  autocompleteFilter = {};
  errorText: any;
  now = new Date();
  isClickComplete = false;
  deliveryDetailId: number;
  redirectPage = '';
  intervalUpdateWorkingBy;
  isPickupSelected: boolean = false;
  constructor(public router: Router,
    private fb: FormBuilder,
    private request: Request,
    public common: Common,
    private route: ActivatedRoute,
    private sharedService: SharedService,
    private store: StoreService) {
    this.patientInfoForm = this.fb.group({
      'txtHn': new FormControl({ value: '', disabled: true }, [Validators.required]),
      'txtPatientName': new FormControl({ value: '', disabled: true }, [Validators.required]),
      'txtPhone': new FormControl({ value: '', disabled: true }),
      'txtAddress': new FormControl({ value: '', disabled: true }),
      'txtDistrictProvince': new FormControl({ value: '', disabled: true }),
      'txtPostcode': new FormControl({ value: '', disabled: true }),
      'txtContactPerson': new FormControl({ value: '', disabled: true }),
      'txtReason': new FormControl({ value: '', disabled: true }),
      'txtStatus': new FormControl({ value: '', disabled: true }),
      'txtItem': new FormControl({ value: '', disabled: false }),
      'ddlItem': new FormControl({ value: '', disabled: false }, [Validators.required]),
      'txtLocation': new FormControl({ value: '', disabled: true }),
      'txtOrderPharmacyNoteRemark': new FormControl({ value: '', disabled: false }),
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
      // 'ddlDeliveryPackaging': new FormControl({ value: '', disabled: false }, [Validators.required]),
      'cbxDeliveryDocumentationInvoice': new FormControl({ value: '', disabled: false }),
      'cbxDeliveryDocumentationReceipt': new FormControl({ value: '', disabled: false }),
      'ddlDeliveryCashierName': new FormControl({ value: '', disabled: true }, [Validators.required]),
      'cbxDeliveryIsUrgent': new FormControl({ value: '', disabled: false }),
      'txtDeliveryCashierDeliNote': new FormControl({ value: '', disabled: false }),
      'txtDeliveryDetailReason': new FormControl({ value: '', disabled: true })
    });
  }

  ngOnDestroy() {
    console.log('clear interval');
    clearInterval(this.intervalUpdateWorkingBy);
  }

  getPageOrderStatus() {
    return this.pageOrderStatus
  }

  async ngOnInit() {
    try {
      if (sessionStorage.getItem('role')) {
        this.role = sessionStorage.getItem('role').toLowerCase()
      }
      this.pageOrderStatus = localStorage.getItem('pageOrderStatus') ? localStorage.getItem('pageOrderStatus') : null;
      //localStorage.removeItem('pageOrderStatus');
      const id = this.route.snapshot.paramMap.get('id');
      this.pageType = this.route.snapshot.paramMap.get('action');
      const deliveryDetailId = this.route.snapshot.paramMap.get('deliveryDetailId');
      if (deliveryDetailId) {
        this.deliveryDetailId = +deliveryDetailId
      }
      this.id = +id;

      const dropdown = await this.common.searchConfig()
      for (const orderStatus of dropdown.orderStatus) {
        if (!this.orderStatusMapByName[orderStatus.name]) {
          this.orderStatusMapByName[orderStatus.name] = [];
        }
        this.orderStatusMapByName[orderStatus.name].push(orderStatus.id);

        if (!this.orderStatusMapById[orderStatus.id]) {
          this.orderStatusMapById[orderStatus.id] = [];
        }
        this.orderStatusMapById[orderStatus.id].push(orderStatus.name);
      };
      this.patientItemList = dropdown.patientItemList.filter((row) => row.id !== 1) || [];
      this.packagingList = dropdown.packagingList || [];
      this.arrivalTimeListBackup = dropdown.arrivalTimeList;
      this.arrivalTimeList = dropdown.arrivalTimeList;

      this.deliveryMethodList = dropdown.deliveryMethodList || [];
      try {
        this.loading = false;
        this.disbledBtn = {
          'save': false,
          'cancel': false
        };
        if (this.pageType === 'new') {
          this.patientInfoForm.controls['txtHn'].enable();
          this.patientInfoForm.controls['txtPatientName'].enable();
        } else {

          if (this.pageType === 'view' || this.pageType === 'edit') {
            this.updateWorkingBy();
            this.intervalUpdateWorkingBy = setInterval(() => {
              this.updateWorkingBy();
            }, 3000);
          }

          if (this.pageType === 'view') {

            this.deliveryDetailForm.controls['txtDeliveryRecipientName'].disable();
            this.deliveryDetailForm.controls['txtDeliveryPhone'].disable();
            this.deliveryDetailForm.controls['ddlDeliveryAddress'].disable();
            this.deliveryDetailForm.controls['txtDeliveryDate'].disable();
            this.deliveryDetailForm.controls['ddlDeliveryArrivalTime'].disable();
            this.deliveryDetailForm.controls['ddlDeliveryMethod'].disable();
            this.deliveryDetailForm.controls['txtDeliveryMethodOther'].disable();
            // this.deliveryDetailForm.controls['ddlDeliveryPackaging'].disable();
            this.deliveryDetailForm.controls['cbxDeliveryDocumentationInvoice'].disable();
            this.deliveryDetailForm.controls['cbxDeliveryDocumentationReceipt'].disable();
            this.deliveryDetailForm.controls['ddlDeliveryCashierName'].disable();
            this.deliveryDetailForm.controls['cbxDeliveryIsUrgent'].disable();
            this.deliveryDetailForm.controls['txtDeliveryCashierDeliNote'].disable();
          }

          if (this.pageType === 'reorder') {
            this.patientInfoForm.controls['txtHn'].enable();
            this.patientInfoForm.controls['txtPatientName'].enable();
          }
          await this.getApiEdit();
          await this.searchDdlPatientAddress(this.patientInfo.hn);
        }
        await this.checkGroupPermission();
      } catch (e) {
        console.log(e);
        const resultDescriptionSystemErrorTitle = environment.resultDescriptionSystemErrorTitle;
        const resultDescriptionSystemErrorMassage = environment.resultDescriptionSystemErrorMassage;
        this.goAlert(resultDescriptionSystemErrorTitle, resultDescriptionSystemErrorMassage, 'myModalError');
      }

      await this.searchDdlCashier();
      this.store.subscribePagePermissionList().subscribe(pagePermissionList => {
        const pagePermission = pagePermissionList.find(r => r.url === environment.roleURL.cashierView);
        const permissionPharmacist = pagePermissionList.find(r => r.url === environment.roleURL.pharmacistView);
        if (pagePermission) {
          try {
            this.menuPermissions = JSON.parse(pagePermission.menuPermissions);
          } catch (error) {
            console.log(error);
          }
        }

        if (permissionPharmacist && this.redirectPage == 'pharmacist' && this.orderStatus != 35) {
            const permissionPharmacist = pagePermissionList.find(r => r.url === environment.roleURL.pharmacistView);
            const permissionEdit = JSON.parse(permissionPharmacist.menuPermissions).edit
            if (permissionPharmacist) {
              this.menuPermissions = {
                ...this.menuPermissions,
                edit: permissionEdit ? permissionEdit : this.menuPermissions.edit
              } 
            }
        }

        console.log(this.menuPermissions)
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
      this.store.subscribeUser().subscribe(data => {
        // this.username = data.username;
        const findCashier = this.cashierList.find((obj) => {
          return obj.username.toLowerCase() === data.username.toLowerCase();
        });

        if (findCashier) {
          this.deliveryDetail.cashierId = findCashier.userId;
        }
      });
      this.patientInfoDataSource = this.customStore();
    } catch (e) {
      console.log(e);
    }
  }
  loadDataBasedOnTab(tab: number) {
  }
  goHomeMenu() {
    if (this.menuHome) {
      this.router.navigate(['/menu', this.menuHome['menuId'], this.menuHome['typePage']]);
    }
  }

  async ngAfterViewInit() {
    this.redirectPage = localStorage.getItem('redirectPage');
  }

  customStore() {
    const dataSource: any = {};
    dataSource.store = new CustomStore({
      load: (loadOptions: any) => {
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
                resultData = response.resultData
              }
            }
            return {
              data: resultData
            };
          })
          .catch(() => {
            return {
              data: [],
            };
          });
      },
    });
    // console.log(dataSource);
    return dataSource;
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

  async searchDdlPatientAddress(hn) {
    try {
      const checkUrl = this.common.checkMockupUrl('', '', { hn }, {
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

  async searchDdlPatientDelivery(hn) {
    try {
      const checkUrl = this.common.checkMockupUrl('', '', { hn }, {
        BASE_API: '',
        BASE_MODULE: environment.apiPrefix,
        BASE_RESOURCE: environment.searchDdlPatientDelivery
      });
      const resultCodeSuccess = environment.resultCodeSuccess;
      const response = await this.request.get(checkUrl.url, checkUrl.filter);
      if (response.resultCode === resultCodeSuccess) {
        return response.resultData[0] || {};
      } else {
        return [];
      }
    } catch (e) {
      console.error('searchDdlPatientDelivery error', e);
    }
  }

  async onItemClick(e) {
    // const itemData = e.itemData;
    const hn = e.itemData.hn;
    const itemData = await this.searchDdlPatientDelivery(hn);
    const patients = itemData.patients || {};
    this.patientInfo.hn = patients.hn;
    this.patientInfo.patientName = patients.patientName;
    this.patientInfo.phone = patients.phone;
    const patientAddress = patients.patientAddress || {};

    // tslint:disable-next-line:max-line-length
    const address = patientAddress.address ? `${patientAddress.address} ` : '';
    const subdistrict = patientAddress.subdistrict ? `แขวง/ตำบล ${patientAddress.subdistrict} ` : '';
    const district = patientAddress.district ? `เขต/อำเภอ ${patientAddress.district} ` : '';
    const province = patientAddress.province ? `จังหวัด ${patientAddress.province} ` : '';
    this.patientInfo.address = patientAddress.address || '';
    this.patientInfo.addressShow = `${address}${subdistrict}`;
    this.patientInfo.subdistrict = patientAddress.subdistrict || '';
    this.patientInfo.district = patientAddress.district || '';
    this.patientInfo.province = patientAddress.province || '';
    this.patientInfo.districtProvince = `${district}${province}`;
    this.patientInfo.postcode = patientAddress.postcode;
    this.patientInfo.contactPerson = itemData.contactPerson;
    // this.patientInfo.item = 2;

    this.deliveryDetail.recipientName = itemData.recipientName || patients.patientName;
    this.deliveryDetail.phone = itemData.phoneDelivery || patients.phone;
    this.fnClearDeliveryDetail();
    // search auto complete address
    await this.searchDdlPatientAddress(hn);
    // set delivery detail address
    if (itemData.patientAddressId) {
      this.deliveryDetail.patientAddressId = +itemData.patientAddressId;
      this.onClickDeliveryDetailAddress();
    }
  }

  // clear delivery detail address
  fnClearPatientInfo() {
    this.patientInfo.hn = '';
    this.patientInfo.patientName = '';
    this.patientInfo.phone = '';

    this.patientInfo.address = '';
    this.patientInfo.district = '';
    this.patientInfo.subdistrict = '';
    this.patientInfo.province = '';
    // tslint:disable-next-line:max-line-length
    this.patientInfo.districtProvince = '';
    this.patientInfo.postcode = '';
    this.patientInfo.contactPerson = '';
    this.patientInfo.item = null;

    this.deliveryDetail.recipientName = '';
    this.deliveryDetail.phone = '';
    this.fnClearDeliveryDetail();
  }

  // clear delivery detail address
  fnClearDeliveryDetail() {
    this.deliveryDetail.address = '';
    this.deliveryDetail.subdistrict = '';
    this.deliveryDetail.district = '';
    this.deliveryDetail.province = '';
    this.deliveryDetail.districtProvince = '';
    this.deliveryDetail.postcode = '';
    this.deliveryDetail.patientAddressId = null;
  }

  async getApiEdit() {
    try {
      this.patientInfoForm.get('ddlItem').disable();
      this.loading = true;
      this.disbledBtn = {
        'save': true,
        'cancel': true
      };
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
        // patientInfo
        const patientInfo = resultData.order || {};
        this.patientInfo.hn = patientInfo.hn;
        this.patientInfo.patientName = patientInfo.patientName;
        this.patientInfo.phone = patientInfo.phone;
        this.patientInfo.contactPerson = patientInfo.contactPerson;
        this.patientInfo.item = patientInfo.item ? (typeof patientInfo.item === 'object' ? patientInfo.item.id : patientInfo.item) : 2;
        // tslint:disable-next-line:max-line-length
        let address = patientInfo.address ? `${patientInfo.address} ` : '';
        address = address.replace(/null/g, '');
        let subdistrict = patientInfo.subdistrict ? `แขวง/ตำบล${patientInfo.subdistrict} ` : '';
        subdistrict = subdistrict.replace(/null/g, '');
        const district = patientInfo.district ? `เขต/อำเภอ${patientInfo.district} ` : '';
        const province = patientInfo.province ? `จังหวัด${patientInfo.province} ` : '';
        this.patientInfo.address = patientInfo.address || '';
        this.patientInfo.addressShow = `${address}${subdistrict}`;
        this.patientInfo.subdistrict = patientInfo.subdistrict || '';
        this.patientInfo.district = patientInfo.district || '';
        this.patientInfo.province = patientInfo.province || '';
        this.patientInfo.districtProvince = `${district}${province}`;
        this.patientInfo.postcode = patientInfo.postcode;
        this.patientInfo.csReason = patientInfo.csReason;
        this.patientInfo.orderPharmacyNoteRemark = patientInfo.orderPharmacyNoteRemark;
        // Delivery Detail
        const deliveryDetail = resultData.deliveryDetail || {};
        this.deliveryDetail.deliveryDetailId = deliveryDetail.deliveryDetailId;
        this.deliveryDetail.recipientName = deliveryDetail.recipientName;
        this.deliveryDetail.phone = deliveryDetail.phone;
        this.deliveryDetail.patientAddressId = deliveryDetail.patientAddressId;
        let deliveryAddress = deliveryDetail.address ? `${deliveryDetail.address} ` : '';
        deliveryAddress = deliveryAddress.replace(/null/g, '');
        // tslint:disable-next-line:max-line-length
        const deliverySubdistrict = deliveryDetail.subdistrict ? `แขวง/ตำบล${deliveryDetail.subdistrict} ` : '';
        // tslint:disable-next-line:max-line-length
        const deliveryDistrict = deliveryDetail.district ? `เขต/อำเภอ${deliveryDetail.district} ` : '';
        let deliveryProvince = deliveryDetail.province ? `จังหวัด${deliveryDetail.province} ` : '';
        deliveryProvince = deliveryProvince.replace(/null/g, '');
        this.deliveryDetail.address = `${deliveryAddress}${deliverySubdistrict}`;
        this.deliveryDetail.districtProvince = `${deliveryDistrict}${deliveryProvince}`;
        this.deliveryDetail.postcode = deliveryDetail.postcode;
        // tslint:disable-next-line:max-line-length
        this.deliveryDetail.deliveryDate = deliveryDetail.deliveryDate ? this.common.stringToDate(deliveryDetail.deliveryDate, 'DD/MM/YYYY') : null;
        this.deliveryDetail.arrivalTime = deliveryDetail.arrivalTime || null;
        this.deliveryDetail.deliveryMethod = deliveryDetail.deliveryMethod || null;
        this.deliveryDetail.deliveryMethodOther = deliveryDetail.deliveryMethodOther || null;
        // this.deliveryDetail.packaging = deliveryDetail.packaging || null;
        this.deliveryDetail.isInvoice = deliveryDetail.isInvoice === 1;
        this.deliveryDetail.isReceipt = deliveryDetail.isReceipt === 1;
        this.deliveryDetail.cashierId = deliveryDetail.cashierId || null;
        this.deliveryDetail.isUrgent = deliveryDetail.isUrgent === 1;
        this.deliveryDetail.cashierDeliNote = deliveryDetail.cashierDeliNote;
        this.deliveryDetail.deliveryStatus = deliveryDetail.deliveryStatus;
        this.deliveryDetail.csReason = deliveryDetail.csReason;

        if (deliveryDetail.pharmacyPicture && deliveryDetail.pharmacyPicture.length > 0) {
          this.deliveryDetail.pharmacyPicture = deliveryDetail.pharmacyPicture.split('|');
        }

        if (deliveryDetail.deliveryPicture && deliveryDetail.deliveryPicture.length > 0) {
          this.deliveryDetail.deliveryPicture = deliveryDetail.deliveryPicture.split('|');
        }

        this.orderStatus = patientInfo.orderStatus
        this.patientInfo.orderStatus = this.mappingOrderStatus(this.orderStatus)

        if (this.orderStatus == 34 || this.orderStatus == 35 || this.orderStatus == 27) {
          this.isEditFinish = true
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

  checkGroupPermission() {
    this.selectMenuParentId = [];
    this.selectMenuId = [];

    const parent = this.microserviceMenuGroup.filter(r => !r.microserviceMenuParentId).map(r => r.microserviceMenuId);
    const childPanrenId = this.microserviceMenuGroup.filter(r => r.microserviceMenuParentId).map(r => r.microserviceMenuParentId);

    const parentNotchild = parent.filter(r => {
      // console.log(parent,child,r,child.indexOf(r))
      return childPanrenId.indexOf(r) === -1;
    });

    this.microserviceMenuGroupPermission.forEach(permission => {
      const microserviceMenuId = permission.microserviceMenuId;
      if (parentNotchild.indexOf(microserviceMenuId) > -1) {
        this.selectMenuParentId.push(permission.microserviceMenuId);
      } else if (parent.indexOf(microserviceMenuId) === -1) {
        this.selectMenuParentId.push(permission.microserviceMenuId);
      }
    });

  }

  async fnSave() {
    try {
      const isValidPatientInfo: boolean = this.fnCheckPatientInfoForm();
      const isValidDeliveryDetail: boolean = this.fnCheckDeliveryDetailForm();
      const resultCodeSuccess = environment.resultCodeSuccess;
      let checkForm = isValidPatientInfo && isValidDeliveryDetail;
      if (this.pageType === 'edit') {
        checkForm = isValidDeliveryDetail;
      }
      if (checkForm) {
        let postData: any = {};
        let response;
        let checkUrl = null;
        if (this.pageType === 'new' || this.pageType === 'reorder') {
          checkUrl = this.common.checkMockupUrl('', '', {}, {
            BASE_API: '',
            BASE_MODULE: environment.apiPrefix,
            BASE_RESOURCE: environment.createOrderFinishedProduct
          });
          postData = {
            hn: this.patientInfo.hn,
            patientName: this.patientInfo.patientName,
            phone: this.patientInfo.phone,
            address: this.patientInfo.address,
            district: this.patientInfo.district,
            subdistrict: this.patientInfo.subdistrict,
            province: this.patientInfo.province,
            postcode: this.patientInfo.postcode,
            contactPerson: this.patientInfo.contactPerson,
            item: this.patientInfo.item,
            deliveryDetail: {
              recipientName: this.deliveryDetail.recipientName,
              phone: this.deliveryDetail.phone,
              patientAddressId: +this.deliveryDetail.patientAddressId,
              address: this.deliveryDetail.address,
              district: this.deliveryDetail.district,
              subdistrict: this.deliveryDetail.subdistrict,
              province: this.deliveryDetail.province,
              postcode: this.deliveryDetail.postcode,
              deliveryDate: moment(this.deliveryDetail.deliveryDate).format('DD-MM-YYYY'),
              arrivalTime: this.deliveryDetail.arrivalTime,
              deliveryMethod: this.deliveryDetail.deliveryMethod,
              // packaging: this.deliveryDetail.packaging,
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
          // response = await this.request.post(checkUrl.url, [addData]);
        } else {
          checkUrl = this.common.checkMockupUrl('', '', {}, {
            BASE_API: '',
            BASE_MODULE: environment.apiPrefix,
            BASE_RESOURCE: environment.updateDeliveryDetail
          });
          postData = {
            orderId: +this.id,
            deliveryDetailId: this.deliveryDetail.deliveryDetailId,
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
            // packaging: this.deliveryDetail.packaging,
            isInvoice: this.deliveryDetail.isInvoice ? 1 : 0,
            isReceipt: this.deliveryDetail.isReceipt ? 1 : 0,
            cashierId: this.deliveryDetail.cashierId,
            isUrgent: this.deliveryDetail.isUrgent ? 1 : 0,
            cashierDeliNote: this.deliveryDetail.cashierDeliNote
          };
          if (+this.deliveryDetail.deliveryMethod === 6) {
            postData.deliveryMethodOther = this.deliveryDetail.deliveryMethodOther;
          }
        }
        response = await this.request.post(checkUrl.url, postData);
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

  async fnEdit() {
    this.isEditPage = true
  }
  async fnUpdate() {
    try {
      this.updateRemarkSuccess = false
      const resultCodeSuccess = environment.resultCodeSuccess;
      let postData: any = {};
      let response;
      const checkUrl = this.common.checkMockupUrl('', '', {}, {
        BASE_API: '',
        BASE_MODULE: environment.apiPrefix,
        BASE_RESOURCE: environment.updateOrder
      });

      postData = {
        orderId: +this.id,
        orderPharmacyNoteRemark: this.patientInfo.orderPharmacyNoteRemark
      };
      if (this.deliveryDetail.pharmacyPicture.length > 0) {
        const base64Images = await Promise.all(this.deliveryDetail.pharmacyPicture.map(async (url) => {
          return await this.convertUrlToBase64(url);
        }));
        const deliveryDetail = [{
          pharmacyPicture: base64Images.join('|'),
          deliveryId: localStorage.getItem('deliveryDetailId')
        }]
        postData.deliveryDetail = deliveryDetail
      } else {
        const deliveryDetail = [{
          pharmacyPicture: '',
          deliveryId: localStorage.getItem('deliveryDetailId')
        }]
        postData.deliveryDetail = deliveryDetail
      }

      response = await this.request.post(checkUrl.url, postData);
      if (response.resultCode === resultCodeSuccess) {
        this.updateRemarkSuccess = true
        this.isEditPage = false
        this.goAlert('', '', 'myModalSuccess');
        this.isEditMode = false
      } else {
        this.goAlert(response.resultCode, response.resultDescription, 'myModalError');
        this.isEditMode = false
      }
    } catch (e) {
      console.log("e", e)
      this.isEditPage = false
      this.isEditMode = false
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

    return this.patientInfoForm.valid;
  }

  fnCheckDeliveryDetailForm() {
    let isValid = true;
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
        const deliveryDateTimeZero = moment(this.deliveryDetail.deliveryDate).set({ h: 0, m: 0, s: 0, ms: 0 });
        const nowTimeZero = moment(this.now).set({ h: 0, m: 0, s: 0, ms: 0 });
        if (deliveryDateTimeZero < nowTimeZero) {
          this.deliveryDetailForm.controls[key].setErrors({ 'forceRequired': true });
          this.deliveryDetailForm.controls[key].markAsDirty();
        } else {
          this.deliveryDetailForm.controls[key].updateValueAndValidity();
        }
      } else {
        this.deliveryDetailForm.controls[key].updateValueAndValidity();
      }
    }

    if (!this.deliveryDetail.cashierId) {
      isValid = false;
    }
    return isValid && this.deliveryDetailForm.valid;
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
    if (this.updateRemarkSuccess) {
      this.updateRemarkSuccess = false
      return
    }
    if (this.redirectPage === 'allOrder') {
      localStorage.removeItem('redirectPage');
      this.router.navigate(['/order-management', 'all-orders']);
      return;
    } else if (this.redirectPage === 'pharmacist') {
      localStorage.removeItem('redirectPage');
      this.router.navigate(['/order-management', 'orders-pharmacist-view']);
      return;
    }
    if (this.isClickComplete) {
      this.isClickComplete = false;
      this.router.navigate(['/order-management', 'orders-pharmacist-view']);
    } else {
      this.router.navigate(['/order-management', 'orders-cashier-view']);
    }
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
  }

  onFocusOut(e, key, keyInput) {
    const inputValue = e.event.target.value;
    if (inputValue !== this.patientInfo[key]) {
      // e.event.target.value = this.patientInfo[key];
      if (inputValue === '') {
        this.patientInfoForm.controls[keyInput].reset('');
        this.fnClearPatientInfo();
      } else {
        this.patientInfoForm.controls[keyInput].reset(this.patientInfo[key]);
      }
    }
  }

  onValueChanged(e, key) {
    this.autocompleteFilter = {};
    this.autocompleteFilter[key] = e.value;
  }

  onClickDeliveryDetailAddress() {
    if (this.deliveryDetail.patientAddressId === 'null') {
      this.deliveryDetail.patientAddressId = null;
    }
    const findAddress = this.addressList.find(obj => obj.patientAddressId === +this.deliveryDetail.patientAddressId);
    if (findAddress) {
      this.deliveryDetail.address = findAddress.address;
      if (findAddress.subdistrict) {
        this.deliveryDetail.address = findAddress.address + ' แขวง/ตำบล ' + findAddress.subdistrict;
      }
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

  deliveryDateValueChange() {
    this.deliveryDetailForm.controls.ddlDeliveryArrivalTime.reset();
    this.arrivalTimeList = this.common.checkArrivalTime(this.arrivalTimeListBackup, this.deliveryDetail.deliveryDate);
  }

  async fnComplete() {
    try {
      this.isClickComplete = true;
      // const requiredData: boolean = this.checkRequiredData();
      const resultCodeSuccess = environment.resultCodeSuccess;
      let payload: any = {
        orderId: this.id,
        orderPharmacyNoteRemark: this.patientInfo.orderPharmacyNoteRemark
      };
      if (this.deliveryDetail.pharmacyPicture.length > 0) {
        const base64Images = await Promise.all(this.deliveryDetail.pharmacyPicture.map(async (url) => {
          return await this.convertUrlToBase64(url);
        }));
        payload = {
          ...payload,
          deliveryId: Number(localStorage.getItem('deliveryDetailId')),
          pharmacyPicture: base64Images.join('|')
        }
      } else {
        payload = {
          ...payload,
          deliveryId: Number(localStorage.getItem('deliveryDetailId')),
          pharmacyPicture: ''
        }
      }

      let checkUrl = null;

      checkUrl = this.common.checkMockupUrl('', GlobalVariable.RESOURCE, {}, {
        BASE_API: GlobalVariable.BASE_API,
        BASE_MODULE: GlobalVariable.BASE_MODULE,
        BASE_RESOURCE: GlobalVariable.BASE_RESOURCE + GlobalVariable.BASE_RESOURCE_UPDATE_COMPLETE_ORDER
      });

      const response = await this.request.post(checkUrl.url, payload);
      if (response.resultCode === resultCodeSuccess) {
        this.goAlert('', '', 'myModalSuccess');
      } else {
        this.isClickComplete = false;
        this.goAlert(response.resultCode, response.resultDescription, 'myModalError');
      }

    } catch (e) {
      console.log(e);
      this.isClickComplete = false;
    }
  }

  fnConvertStringNull(key) {
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


  triggerFileInput() {
    this.fileInput.nativeElement.click();
  }

  upload(event: any) {
    const files: FileList = event.target.files;
    if (!files || !files.length) return;

    const maxPictures = 5;
    const currentCount = this.deliveryDetail.pharmacyPicture.length;
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
        this.deliveryDetail.pharmacyPicture.push(base64);
      };

      reader.readAsDataURL(file);
    }

    event.target.value = '';
  }

  removePicture(index: number): void {
    this.deliveryDetail.pharmacyPicture.splice(index, 1);
  }

  mappingOrderStatus(orderStatus: number): string {
    return Array.isArray(this.orderStatusMapById[orderStatus])
      ? this.orderStatusMapById[orderStatus][0]
      : this.orderStatusMapById[orderStatus]
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

  popupImg(i) {
    this.filePicture = i
    this.popupVisible = true
  }

  enableEditMode() {
    this.isEditPage = true
    this.isEditMode = true;
    this.originalPharmacyPictureList = _.cloneDeep(this.deliveryDetail.pharmacyPicture)
  }

  async updatePictures() {
    // try {
    //   this.isAlertUpload = true
    //   const valid = this.checkRequiredProductionDone();
    //   if (valid) {
    //     this.isEditMode = false;
    //     this.isLoadingUpload = true
    //     const base64Images = await Promise.all(this.order.productionPictureList.map(async (url) => {
    //       return await this.convertUrlToBase64(url);
    //     }));
    //     const checkUrl = this.common.checkMockupUrl('', '', {}, {
    //       BASE_API: '',
    //       BASE_MODULE: environment.apiPrefix,
    //       BASE_RESOURCE: environment.updateProductTeam
    //     });


    //     let payloadPackageNote = ''
    //     if (this.isPackagingList) {
    //       const packagingNotesRaw = this.productionInfo.get('txtPackageNoteList').value;
    //       const packagingNotesProcessed = packagingNotesRaw.map(note => {
    //         const typeIndex = note.type.findIndex(selected => selected === true);
    //         const supTypeIndexes = note.supType
    //           .map((selected, idx) => selected ? idx + 1 : -1)
    //           .filter(idx => idx !== -1);

    //         return {
    //           ...note,
    //           type: typeIndex + 1,
    //           supType: supTypeIndexes
    //         };
    //       });
    //       payloadPackageNote = JSON.stringify(packagingNotesProcessed)
    //     } else {
    //       payloadPackageNote = this.order.packageNote
    //     }

    //     const resultCodeSuccess = environment.resultCodeSuccess;
    //     const data = {
    //       "orderId": this.Id,
    //       "productionPicture": base64Images.join('|'),
    //       "packageNote": payloadPackageNote
    //     }

    //     const response = await this.request.patch(checkUrl.url, data);
    //     if (response.resultCode === resultCodeSuccess) {
    //       this.isLoadingUpload = false
    //       this.goAlert('', '', 'myModalSuccess');
    //     }
    //     else {
    //       this.isAlertUpload = false
    //       this.goAlert(response.resultCode, response.resultDescription, 'myModalError');
    //     }
    //   } else {
    //     this.isAlertUpload = false
    //     const el = document.getElementById(`targetError`);
    //     if (el) {
    //       el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    //       if (typeof el['focus'] === 'function') {
    //         el.focus();
    //       }
    //     }

    //   }
    // } catch (error) {
    //   this.isLoadingUpload = false
    //   console.error('Error converting images to Base64', error);
    // }
  }

  cancelUpload() {
    this.isEditMode = false
    this.isEditPage = false
    this.deliveryDetail.pharmacyPicture = this.originalPharmacyPictureList
  }

  isEditableRole(): boolean {
    const normalized = this.normalizeRole(this.role);
    return !this.isEditMode && ['admin', 'superuser', 'pharmacist'].includes(normalized);
  }

  normalizeRole(role: string): string {
    return (role || '').toLowerCase().replace(/\s/g, '');
  }

}
