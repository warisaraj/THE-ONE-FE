import { Component, OnInit, AfterViewInit, ElementRef, Input, ViewChild, ViewEncapsulation } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
// import { LayoutMenu } from '../../../shared/store/layout.menu.store';
import { GlobalVariable } from './edit-order-customer-service.global';
import { Request } from '../../../../../shared/services/request.service';
import { Common } from '../../../../../shared/services/common.service';
import { FormGroup, FormBuilder, FormControl, Validators } from '@angular/forms';
import { environment } from '../../../../../../environments/environment';
import * as _ from 'lodash';
import { CompareService } from '../../../../../shared/services/compare.service';
import { StoreService } from '../../../../../shared/services/store.service';

@Component({
  selector: 'app-edit-order-customer-service',
  providers: [Request, Common, CompareService],
  templateUrl: './edit-order-customer-service.component.html',
  styleUrls: ['./edit-order-customer-service.scss'],
  encapsulation: ViewEncapsulation.None
})
export class EditOrderCustomerServiceComponent implements OnInit, AfterViewInit {
  @ViewChild('fileInput') fileInput: ElementRef;
  @ViewChild('myModal') myModal;
  isLoadingPanel = false;
  popupVisible = false
  filePicture = null
  editDataGroups: any = {
    order: {},
    deliveryPicture: []
  };
  editGroupForm: FormGroup;
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
  pageType: any = ''
  Id: any = null;
  menuHome: any = false;
  menuPermissions: any = { view: false, add: false, edit: false, delete: false }
  unitList = [];
  statusList = [
    "Waiting for delivery",
    "Form Printed",
    "Cannot Deliver",
    "Change Delivery Detail",
    "Delivered",
  ]
  arrivalTimeMapByName = {}
  arrivalTimeMapById = {}
  deliveryMethodMapByName = {}
  deliveryMethodMapById = {}
  packingMapByName = {}
  packingMapById = {}
  itemMapByName = {}
  itemMapById = {}
  orderStatusMapByName = {}
  orderStatusMapById = {}
  reasonRequired: boolean = false;
  constructor(public router: Router,
    private fb: FormBuilder,
    private request: Request,
    private common: Common,
    private route: ActivatedRoute,
    private store: StoreService,) {
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
      'txtStatus': new FormControl('', [Validators.required]),
      'txtReason': new FormControl('', [Validators.required]),

    });
  }

  async ngOnInit() {
    try {
      // this.uomList = environment.uomListFinished;
      // this.unitList = environment.unitListFinished;
      this.store.subscribePagePermissionList().subscribe(pagePermissionList => {
        console.log("ngOnInit", pagePermissionList);
        let pagePermission = pagePermissionList.find(r => r.url === GlobalVariable.ROLE_URL);
        if (pagePermission) {
          try {
            this.menuPermissions = JSON.parse(pagePermission.menuPermissions)
          } catch (error) {
            console.log(error);
          }
        }
      })
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
      })
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
      document.body.scrollTop = 0; // สั่งให้ scroll to top เมื่อเข้าหน้ามา
      const dropdown = await this.common.searchConfig();
      for (const orderStatus of dropdown.orderStatus) {
        this.orderStatusMapByName[orderStatus.name] = orderStatus.id;
        this.orderStatusMapById[orderStatus.id] = orderStatus.name;
      }

      for (const arrivalTime of dropdown.arrivalTimeList) {
        this.arrivalTimeMapByName[arrivalTime.name] = arrivalTime.id;
        this.arrivalTimeMapById[arrivalTime.id] = arrivalTime.name;
      }

      for (const deliveryMethod of dropdown.deliveryMethodList) {
        this.deliveryMethodMapByName[deliveryMethod.name] = deliveryMethod.id;
        this.deliveryMethodMapById[deliveryMethod.id] = deliveryMethod.name;
      }
      for (const packing of dropdown.packagingList) {
        this.packingMapByName[packing.name] = packing.id;
        this.packingMapById[packing.id] = packing.name;
      }
      for (const item of dropdown.patientItemList) {
        this.itemMapByName[item.name] = item.id;
        this.itemMapById[item.id] = item.name;
      }

      await this.route.params.subscribe(async params => {
        this.loading = false;
        this.disbledBtn = {
          'save': false,
          'cancel': false
        };
        console.log(":params", params);
        let splitPath = this.router.url.split('/');
        this.pageType = splitPath[splitPath.length - 1]
        console.log(":pageType", this.pageType);
        this.Id = params.id;

        if (this.pageType === 'view' || this.pageType === 'edit') {
          // get api by id
          await this.getApiEdit();

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
          this.editGroupForm.controls['txtStatus'].disable();
          this.editGroupForm.controls['txtReason'].disable();

          if (this.pageType === 'edit') {
            if (this.editDataGroups.deliveryStatus && this.editDataGroups.deliveryStatus === 'Waiting for delivery') {
              this.statusList = [
                'Waiting for delivery',
                'Form Printed',
                'Change Delivery Detail',
              ];
            } else if (this.editDataGroups.deliveryStatus && this.editDataGroups.deliveryStatus === 'Form Printed') {
              this.statusList = [
                'Form Printed',
                'Cannot Deliver',
                'Change Delivery Detail',
                'Delivered',
              ];
            } else if (this.editDataGroups.deliveryStatus && this.editDataGroups.deliveryStatus === 'Cannot Deliver') {
              this.statusList = [
                'Cannot Deliver',
                'Change Delivery Detail',
              ];
            }

            console.log(this.editDataGroups.status)
            if (this.editDataGroups.status != 'Delivered') {
              this.editGroupForm.controls['txtStatus'].enable();
            }
            this.editGroupForm.controls['txtReason'].enable();
          }
        }
      });
      await this.checkGroupPermission();
      this.fnChangeStatus();
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
      let filterData = {
        deliveryDetailId: this.Id,
      };

      const checkUrl = this.common.checkMockupUrl('', '', filterData, {
        BASE_API: GlobalVariable.BASE_API,
        BASE_MODULE: GlobalVariable.BASE_MODULE,
        BASE_RESOURCE: GlobalVariable.BASE_RESOURCE + GlobalVariable.BASE_RESOURCE_GET_BY_ID
      });

      const resultCodeSuccess = environment.resultCodeSuccess;

      let response = await this.request.get(checkUrl.url, checkUrl.filter);
      if (response.resultCode === resultCodeSuccess) {
        console.log(this.arrivalTimeMapById)
        this.editDataGroups = await response.resultData;
        this.editDataGroups.status = this.orderStatusMapById[this.editDataGroups.deliveryStatus]
        this.editDataGroups.csReason = this.editDataGroups.csReason
        this.editDataGroups.deliveryDate = this.editDataGroups.deliveryDate.split(' ')[0]
        const orderAddress = this.editDataGroups.order.address ? `${this.editDataGroups.order.address} ` : ''
        const orderSubdistrict = this.editDataGroups.order.subdistrict ? `แขวง/ตำบล${this.editDataGroups.order.subdistrict} ` : ''
        const orderDistrict = this.editDataGroups.order.district ? `เขต/อำเภอ${this.editDataGroups.order.district} ` : ''
        const orderProvince = this.editDataGroups.order.province ? `จังหวัด${this.editDataGroups.order.province} ` : ''
        this.editDataGroups.order.address = `${orderAddress}${orderSubdistrict}`
        this.editDataGroups.order.districtProvince = `${orderDistrict}${orderProvince}`
        this.editDataGroups.order.item = this.itemMapById[this.editDataGroups.order.item]
        this.editDataGroups.arrivalTime = this.arrivalTimeMapById[this.editDataGroups.arrivalTime]
        this.editDataGroups.deliveryMethod = this.deliveryMethodMapById[this.editDataGroups.deliveryMethod]
        this.editDataGroups.deliveryStatus = this.orderStatusMapById[this.editDataGroups.deliveryStatus]
        this.editDataGroups.packaging = this.packingMapById[this.editDataGroups.packaging]
        const address = this.editDataGroups.address ? `${this.editDataGroups.address} ` : ''
        const subdistrict = this.editDataGroups.subdistrict ? `แขวง/ตำบล${this.editDataGroups.subdistrict} ` : ''
        const district = this.editDataGroups.district ? `เขต/อำเภอ${this.editDataGroups.district} ` : ''
        const province = this.editDataGroups.province ? `จังหวัด${this.editDataGroups.province} ` : ''
        this.editDataGroups.otherAddress = address + subdistrict
        this.editDataGroups.address = `${subdistrict}${district}${province}${this.editDataGroups.postcode}`
        this.editDataGroups.districtProvince = `${district}${province}`
        if (this.editDataGroups.cashier.firstName && this.editDataGroups.cashier.lastName) {
          this.editDataGroups.cashierName = this.editDataGroups.cashier.firstName + ' ' + this.editDataGroups.cashier.lastName;
        } else {
          this.editDataGroups.cashierName = '';
        }

        if (this.editDataGroups.deliveryPicture) {
          this.editDataGroups.deliveryPicture = this.editDataGroups.deliveryPicture.split('|');
        } else {
          this.editDataGroups.deliveryPicture = [];
        }

        this.cloneData = _.cloneDeep(this.editDataGroups)
        console.log('this.editDataGroupsxxx', this.editDataGroups)
      }
      else {
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

    let parent = this.microserviceMenuGroup.filter(r => !r.microserviceMenuParentId).map(r => r.microserviceMenuId);
    let childPanrenId = this.microserviceMenuGroup.filter(r => r.microserviceMenuParentId).map(r => r.microserviceMenuParentId);

    let parentNotchild = parent.filter(r => {
      // console.log(parent,child,r,child.indexOf(r))
      return childPanrenId.indexOf(r) === -1;
    });

    console.log(parent, childPanrenId, parentNotchild);
    this.microserviceMenuGroupPermission.forEach(permission => {
      let microserviceMenuId = permission.microserviceMenuId;
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
      this.isLoadingPanel = true;
      // this.disbledBtn = {
      //   'save': true,
      //   'cancel': true
      // };
      const requiredData: boolean = this.checkRequiredData();
      if (requiredData) {
        const base64Images = await Promise.all(this.editDataGroups.deliveryPicture.map(async (url) => {
          return await this.convertUrlToBase64(url);
        }));
        let addData: any = {
          deliveryDetailId: this.Id,
          orderId: this.editDataGroups.order.orderId,
          deliveryStatus: this.orderStatusMapByName[this.editDataGroups.status],
          deliveryPicture: base64Images.join('|'),
        };

        if (this.editDataGroups.csReason) {
          addData.csReason = this.editDataGroups.csReason
        }

        console.log(addData)
        let response

        let checkUrl = null;
        checkUrl = this.common.checkMockupUrl('', GlobalVariable.RESOURCE, {}, {
          BASE_API: GlobalVariable.BASE_API,
          BASE_MODULE: GlobalVariable.BASE_MODULE,
          BASE_RESOURCE: GlobalVariable.BASE_RESOURCE + GlobalVariable.BASE_RESOURCE_UPDATE
        });
        response = await this.request.post(checkUrl.url, addData);

        let resultCodeSuccess = environment.resultCodeSuccess;
        this.isLoadingPanel = false
        if (response.resultCode === resultCodeSuccess) {

          this.goAlert('', '', 'myModalSuccess');
        } else {
          this.goAlert(response.resultCode, response.resultDescription, 'myModalError');
        }

      } else {
        this.isLoadingPanel = false
        this.goAlert('Field is required', 'Your have left a field empty and a value must be entered.', 'myModalWarning');
        this.disbledBtn = {
          'save': false,
          'cancel': false
        };
        

      }
    } catch (e) {
      this.isLoadingPanel = false
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
      return
    }

    if (this.editDataGroups.uom == 'Box' || this.editDataGroups.uom == 'Bottle') {
      this.editGroupForm.controls['txtQuantity'].enable();
      this.editGroupForm.controls['txtUnit'].enable();
      this.editGroupForm.controls['txtSupplyDay'].disable();
    } else if (this.editDataGroups.uom == 'Pack') {
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
    this.router.navigate(['/order-management', 'orders-customer-service-view']);
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

  fnChangeStatus() {
    if (this.editDataGroups.status === 'Cannot Deliver' || this.editDataGroups.status === 'Change Delivery Detail') {
      this.reasonRequired = true
      this.editGroupForm.controls['txtReason'].setValidators(Validators.required)
      this.editGroupForm.controls['txtReason'].updateValueAndValidity();
    } else {
      this.reasonRequired = false
      this.editGroupForm.controls['txtReason'].setValidators(null)
      this.editGroupForm.controls['txtReason'].clearValidators();
      this.editGroupForm.controls['txtReason'].updateValueAndValidity();
    }
  }

  async fnClickPrintDocument(type: string) {
    try {
      console.log(this.editDataGroups.status)
      if (this.editDataGroups.status === 'Waiting for delivery' && type === 'deliveryForm') {
        let addData: any = {
          deliveryDetailId: this.Id,
          orderId: this.editDataGroups.order.orderId,
          deliveryStatus: 30,
        };

        console.log(addData)

        let checkUrl = null;
        checkUrl = this.common.checkMockupUrl('', GlobalVariable.RESOURCE, {}, {
          BASE_API: GlobalVariable.BASE_API,
          BASE_MODULE: GlobalVariable.BASE_MODULE,
          BASE_RESOURCE: GlobalVariable.BASE_RESOURCE + GlobalVariable.BASE_RESOURCE_UPDATE
        });
        const response = await this.request.post(checkUrl.url, addData);

        let resultCodeSuccess = environment.resultCodeSuccess;

        if (response.resultCode === resultCodeSuccess) {
          await this.getApiEdit();
          this.statusList = [
            'Form Printed',
            'Cannot Deliver',
            'Change Delivery Detail',
            'Delivered',
          ];
        } else {
          this.goAlert(response.resultCode, response.resultDescription, 'myModalError');
        }

      } else {
        let url = ''
        let filterData: any = {}
        if (type === 'label') {
          url = environment.printSupplementFacts
        }
        if (type === 'labelSmall') {
          filterData.size = 'S'
          url = environment.printSMLLabel
          if (this.Id) {
            filterData.deliveryDetailId = this.Id
          }
        }
        if (type === 'labelMedium') {
          filterData.size = 'M'
          url = environment.printSMLLabel
          if (this.Id) {
            filterData.deliveryDetailId = this.Id
          }
        }
        if (type === 'labelLarge') {
          filterData.size = 'L'
          url = environment.printSMLLabel
          if (this.Id) {
            filterData.deliveryDetailId = this.Id
          }
        }
        if (type === 'deliveryDetail') {
          url = environment.printDeliveryDetail
        }

        if (type === 'deliveryForm') {
          url = environment.printDeliveryForm
          if (this.Id) {
            filterData.deliveryDetailId = this.Id
          }
        }

        const checkUrl = this.common.checkMockupUrl('', '', filterData, {
          BASE_API: '',
          BASE_MODULE: environment.apiPrefix,
          BASE_RESOURCE: url + '/' + this.editDataGroups.order.orderId
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
          this.myModal.openModal({
            'modalId': 'myModalError',
            'userTitle': response.resultCode,
            'userMessage': response.resultDescription,
            'userMessageList': []
          });
        }
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


  triggerFileInput() {
    this.fileInput.nativeElement.click();
  }

  upload(event: any) {
    const files: FileList = event.target.files;
    if (!files || !files.length) return;

    const maxPictures = 5;
    const currentCount = this.editDataGroups.deliveryPicture.length;
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
        this.editDataGroups.deliveryPicture.push(base64);
      };

      reader.readAsDataURL(file);
    }

    event.target.value = '';
  }

  removePicture(index: number): void {
    this.editDataGroups.deliveryPicture.splice(index, 1);
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
}

