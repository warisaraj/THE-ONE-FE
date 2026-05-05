import { Component, OnInit, AfterViewInit, ElementRef, Input, ViewChild, ViewEncapsulation } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
// import { LayoutMenu } from '../../../shared/store/layout.menu.store';
import { GlobalVariable } from './view-production.global';
import { Request } from '../../../../shared/services/request.service';
import { Common } from '../../../../shared/services/common.service';
import { FormGroup, FormBuilder, FormControl, Validators, FormArray, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { environment } from '../../../../../environments/environment';
import * as _ from 'lodash';
import { CompareService } from '../../../../shared/services/compare.service';
import { StoreService } from '../../../../shared/services/store.service';
import * as moment from 'moment';
import heic2any from 'heic2any';

class ImageSnippet {
  pending = false;
  status = 'init';

  constructor(public src: string, public file: File) {
  }
}

@Component({
  selector: 'app-view-production',
  providers: [Request, Common, CompareService],
  templateUrl: './view-production.component.html',
  styleUrls: ['./view-production.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ViewProductionComponent implements OnInit, AfterViewInit {
  @ViewChild('fileInput') fileInput: ElementRef;
  @ViewChild('myModal') myModal;
  isUpdatingType = false
  isPackagingList = false
  popupVisible = false
  editDataGroups: any = {};
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
  Id: any = null;
  menuHome: any = false;
  menuPermissions: any = { view: false, add: false, edit: false, delete: false };
  unitList = [];
  statusSupList = [
    'Receiving',
    'Weighing',
    'Capsule Filling',
    'Packing',
    'Production Done'
  ];

  statusPackList = [
    'Receiving',
    'Packing',
    'Production Done'
  ];

  statusList;

  selectedFile: any;
  imageInputText: string;
  filePicture: any;
  orderStatusMapByName = {};
  orderStatusMapById = {};
  deliveryMethodMapByName = {};
  deliveryMethodMapById = {};
  arrivalTimeMapByName = {};
  arrivalTimeMapById = {};
  orderTypeMapByName = {};
  orderTypeMapById = {};
  imageList: any[] = [];
  errorText: any;
  reasonRequired: boolean = false;
  submitted: boolean = false;
  printAllurl: any;
  isLoadingPanel: boolean = false;
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
  constructor(public router: Router,
    private fb: FormBuilder,
    private request: Request,
    private common: Common,
    private route: ActivatedRoute,
    private store: StoreService) {
    this.editGroupForm = this.fb.group({
      'txtHn': new FormControl({ value: '', disabled: true }),
      'txtPatientName': new FormControl({ value: '', disabled: true }),
      'txtType': new FormControl({ value: '', disabled: true }),
      'txtSupplyDay': new FormControl({ value: '', disabled: true }),
      'txtProductionBookingSlotDateTime': new FormControl({ value: '', disabled: true }),
      'txtArrivalDateTime': new FormControl({ value: '', disabled: true }),
      'txtDeliveryOption': new FormControl({ value: '', disabled: true }),
      'txtDeliveryNote': new FormControl({ value: '', disabled: true }),
      'txtStatus': new FormControl({ value: '', disabled: true }),
      'ddlStatus': new FormControl('', [Validators.required]),
      'txtProductionNote': new FormControl(''),
      'txtPackagingNote': new FormControl(''),
      'txtPackageNoteList': this.fb.array([
        this.createPackagingNoteForm()
      ]),
    });
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

  createPackagingNoteForm(): FormGroup {
    const supTypeControls = this.supTypeOptions.map(() => this.fb.control(false));
    const typeControls = this.typeOptions.map(() => this.fb.control(false));

    return this.fb.group({
      qty: ['', [Validators.required, Validators.min(1), Validators.pattern(/^[1-9]\d*$/)]],
      type: this.fb.array(typeControls, this.atLeastOneCheckboxCheckedValidator()),
      supplyDays: ['', [Validators.required, Validators.min(1), Validators.pattern(/^[1-9]\d*$/)]],
      supType: this.fb.array(supTypeControls, this.atLeastOneCheckboxCheckedValidator()),
      other: ['']
    });
  }


  get packagingNoteListLength() {
    return (this.editGroupForm.get('txtPackageNoteList') as FormArray).length;
  }

  isCheckboxGroupInvalid(control: AbstractControl): boolean {
    return control && control.invalid && (control.dirty || control.touched);
  }

  addPackagingNote() {
    const formArray = this.editGroupForm.get('txtPackageNoteList') as FormArray;
    formArray.push(this.createPackagingNoteForm());
  }

  removePackagingNote(index: number) {
    const formArray = this.editGroupForm.get('txtPackageNoteList') as FormArray;
    if (formArray.length > 1) {
      formArray.removeAt(index);
    }
  }

  switchPackagingNoteList() {
    this.isPackagingList = true
  }

  async ngOnInit() {
    try {
      // this.uomList = environment.uomListFinished;
      // this.unitList = environment.unitListFinished;
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

  async ngAfterViewInit() {
    try {
      document.body.scrollTop = 0; // สั่งให้ scroll to top เมื่อเข้าหน้ามา
      await this.route.params.subscribe(params => {
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
      });

      const dropdown = await this.common.searchConfig();
      for (const orderStatus of dropdown.orderStatus) {
        this.orderStatusMapByName[orderStatus.name] = orderStatus.id;
        this.orderStatusMapById[orderStatus.id] = orderStatus.name;
      }
      for (const deliveryMethod of dropdown.deliveryMethodList) {
        this.deliveryMethodMapByName[deliveryMethod.name] = deliveryMethod.id;
        this.deliveryMethodMapById[deliveryMethod.id] = deliveryMethod.name;
      }

      for (const arrivalTime of dropdown.arrivalTimeList) {
        this.arrivalTimeMapByName[arrivalTime.name] = arrivalTime.id;
        this.arrivalTimeMapById[arrivalTime.id] = arrivalTime.name;
      }

      for (const orderType of dropdown.orderTypeList) {
        this.orderTypeMapByName[orderType.name] = orderType.id;
        this.orderTypeMapById[orderType.id] = orderType.name;
      }


      if (this.pageType === 'view' || this.pageType === 'edit') {
        // get api by id
        this.getApiEdit();
        this.fnClickPrintDocument('all')
      }

      if (this.pageType === 'edit') {
        this.editGroupForm.controls['ddlStatus'].enable();
        this.editGroupForm.controls['txtProductionNote'].enable();
        this.editGroupForm.controls['txtPackagingNote'].enable();
      } else {
        this.editGroupForm.controls['ddlStatus'].disable();
        this.editGroupForm.controls['txtProductionNote'].disable();
        this.editGroupForm.controls['txtPackagingNote'].disable();
      }
      await this.checkGroupPermission();

      // await this.getErrorOrder();

    } catch (e) {
      console.log(e);
      const resultDescriptionSystemErrorTitle = environment.resultDescriptionSystemErrorTitle;
      const resultDescriptionSystemErrorMassage = environment.resultDescriptionSystemErrorMassage;
      this.goAlert(resultDescriptionSystemErrorTitle, resultDescriptionSystemErrorMassage, 'myModalError');
    }
  }

  async getErrorOrder() {
    const filterData = {
      orderId: this.Id,
    };

    const checkUrl = this.common.checkMockupUrl('', '', filterData, {
      BASE_API: GlobalVariable.BASE_API,
      BASE_MODULE: GlobalVariable.BASE_MODULE,
      BASE_RESOURCE: GlobalVariable.BASE_RESOURCE + GlobalVariable.BASE_RESOURCE_GET_ERROR_ORDER
    });

    const resultCodeSuccess = environment.resultCodeSuccess;
    const response = await this.request.get(checkUrl.url, checkUrl.filter);
    if (response.resultCode !== resultCodeSuccess) {
      this.loading = false;
      this.errorText = response.resultDescription.split('\n')
      if (!this.menuPermissions.edit) {
        this.goAlert(response.resultCode, response.resultDescription, 'myModalOrderErrorStatus1');
      } else {
        this.goAlert(response.resultCode, response.resultDescription, 'myModalOrderError');
      }
    } else {
      const dropdown = await this.common.searchConfig();
      for (const orderStatus of dropdown.orderStatus) {
        this.orderStatusMapByName[orderStatus.name] = orderStatus.id;
        this.orderStatusMapById[orderStatus.id] = orderStatus.name;
      }
      for (const deliveryMethod of dropdown.deliveryMethodList) {
        this.deliveryMethodMapByName[deliveryMethod.name] = deliveryMethod.id;
        this.deliveryMethodMapById[deliveryMethod.id] = deliveryMethod.name;
      }

      for (const arrivalTime of dropdown.arrivalTimeList) {
        this.arrivalTimeMapByName[arrivalTime.name] = arrivalTime.id;
        this.arrivalTimeMapById[arrivalTime.id] = arrivalTime.name;
      }

      for (const orderType of dropdown.orderTypeList) {
        this.orderTypeMapByName[orderType.name] = orderType.id;
        this.orderTypeMapById[orderType.id] = orderType.name;
      }


      if (this.pageType === 'view' || this.pageType === 'edit') {
        // get api by id
        this.getApiEdit();
        this.fnClickPrintDocument('all')
      }

      if (this.pageType === 'edit') {
        this.editGroupForm.controls['ddlStatus'].enable();
        this.editGroupForm.controls['txtProductionNote'].enable();
        this.editGroupForm.controls['txtPackagingNote'].enable();
      } else {
        this.editGroupForm.controls['ddlStatus'].disable();
        this.editGroupForm.controls['txtProductionNote'].disable();
        this.editGroupForm.controls['txtPackagingNote'].disable();
      }
      await this.checkGroupPermission();
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
        BASE_API: GlobalVariable.BASE_API,
        BASE_MODULE: GlobalVariable.BASE_MODULE,
        BASE_RESOURCE: GlobalVariable.BASE_RESOURCE + GlobalVariable.BASE_RESOURCE_GET_BY_ID
      });


      const resultCodeSuccess = environment.resultCodeSuccess;

      const response = await this.request.get(checkUrl.url, checkUrl.filter);
      if (response.resultCode === resultCodeSuccess) {
        const data = await response.resultData;
        this.editDataGroups = {
          hn: data.order.hn,
          patientName: data.order.patientName,
          type: this.orderTypeMapById[data.order.type],
          supplyDay: data.order.supplyDay,
          // productionBookingSlot: this.common.convertDateToString(data.order.productionStartDate),
          // arrivalDateTime: this.common.convertDateToString(data.delivery.deliveryDate),
          deliveryOption: this.deliveryMethodMapById[data.delivery.deliveryMethod],
          deliveryNote: data.order.cashierSupNote,
          status: this.orderStatusMapById[data.order.orderStatus],
          statusEdit: this.orderStatusMapById[data.order.orderStatus],
          packageNote: data.order.packageNote,
          arrivalDateTime: moment(data.delivery.deliveryDate, 'DD/MM/YYYY HH:mm:ss').format('DD/MM/YYYY') + ' (' + this.arrivalTimeMapById[data.delivery.arrivalTime] + ')',
          productionBookingSlot: this.common.convertDateToString(moment(data.order.productionEndDate, 'DD/MM/YYYY')) + ' ' + data.order.productionEndTime
        };



        if (data.order.orderStatus === 19) {
          this.statusList = [
            'Waiting for production',
            'Receiving',
          ];
        }

        if (data.order.orderStatus === 20 && this.editDataGroups.type === 'Pack') {
          this.statusList = [
            'Receiving',
            'Packing',
          ];
        }

        if (data.order.orderStatus === 20 && this.editDataGroups.type === 'Sup') {
          this.statusList = [
            'Receiving',
            'Weighing',
          ];
        }

        if (data.order.orderStatus === 21) {
          this.statusList = [
            'Weighing',
            'Capsule Filling'
          ];
        }

        if (data.order.orderStatus === 21) {
          this.statusList = [
            'Weighing',
            'Capsule Filling'
          ];
        }
        if (data.order.orderStatus === 22) {
          this.statusList = [
            'Capsule Filling',
            'Packing'
          ];
        }

        if (data.order.orderStatus === 23) {
          this.statusList = [
            'Packing',
            'Production Done',
          ];
        }

        console.log(this.editDataGroups)
      } else {
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

  async btnSubmit() {
    try {
      this.submitted = true
      const valid = this.checkRequired();
      const base64Images = await Promise.all(this.imageList.map(async (url) => {
        return await this.convertUrlToBase64(url);
      }));
      if (valid) {
        const editData: any = {
          orderId: this.Id,
          orderStatus: this.orderStatusMapByName[this.editDataGroups.statusEdit]
        };

        const packagingNotesRaw = this.editGroupForm.get('txtPackageNoteList').value;
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

        if (editData.orderStatus === 24) {
          editData.productionNote = this.editDataGroups.productionNote;
          editData.packageNote = JSON.stringify(packagingNotesProcessed)
          editData.productionPicture = base64Images.join('|');
        }

        let response;

        let checkUrl = null;
        if (this.editDataGroups.statusEdit) {
          checkUrl = this.common.checkMockupUrl('', GlobalVariable.RESOURCE, {}, {
            BASE_API: GlobalVariable.BASE_API,
            BASE_MODULE: GlobalVariable.BASE_MODULE,
            BASE_RESOURCE: GlobalVariable.BASE_RESOURCE + GlobalVariable.BASE_RESOURCE_UPDATE
          });
          response = await this.request.post(checkUrl.url, editData);


          const resultCodeSuccess = environment.resultCodeSuccess;

          if (response.resultCode === resultCodeSuccess) {
            this.goAlert('', '', 'myModalSuccess');
          } else {
            this.goAlert(response.resultCode, response.resultDescription, 'myModalError');
          }
        } else {
          this.goAlert('', '', 'myModalSuccess');
        }
      } else {
        console.log('กรุณากรอกข้อมูลให้ถูกต้อง');
        this.goAlert('Field is required', 'Your have left a field empty and a value must be entered.', 'myModalWarning');
        // $(this.modalRequired.nativeElement).modal('show');
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

  checkRequired() {
    const ddlStatus = this.editGroupForm.get('ddlStatus').value;
    const targetStatuses = ['Production Done'];

    if (targetStatuses.includes(ddlStatus)) {
      const formArray = this.editGroupForm.get('txtPackageNoteList') as FormArray;
      formArray.controls.forEach((group: FormGroup) => {
        Object.keys(group.controls).forEach(key => {
          const control = group.get(key);

          if (control instanceof FormArray) {
            control.controls.forEach(ctrl => ctrl.markAsTouched());
            control.updateValueAndValidity();
          } else {
            control.markAsDirty();
            control.updateValueAndValidity();
          }
        });
      });

      return this.editGroupForm.valid;
    } else {
      return this.editGroupForm.get('ddlStatus').valid; 
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


  onClickBack() {
    this.router.navigate(['/order-management', 'orders-production']);
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

  clickCollapse() {
    const collapse = this.common.collapseFn();
  }

  toBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  })


  // processFile(imageInput: any) {
  //   this.filePicture = null;
  //   console.log(imageInput)
  //   const file: File = imageInput.files[0];
  //   const reader = new FileReader();
  //   reader.addEventListener('load', (event: any) => {
  //     console.log(file.type);
  //
  //     if (['image/png', 'image/jpeg', 'image/jpg'].indexOf(file.type) === -1) {
  //       // this.goAlert("Validate", 'File should be .jpg, .jpeg, .png, .heic and .heif ', 'myModalError');
  //       this.goAlert('Invalid File Format', 'File should be .jpg, .jpeg, .png, .heic and .heif ', 'myModalWarning');
  //       return;
  //     }
  //
  //     if (file.size > 1000000) {
  //       // this.goAlert("Validate", 'The file is too large. Allowed maximum size is 1 MB.', 'myModalError');
  //       this.goAlert('Invalid File Format', 'The file is too large. Allowed maximum size is 1 MB.', 'myModalWarning');
  //       return;
  //     }
  //
  //     this.selectedFile = new ImageSnippet(event.target.result, file);
  //     this.selectedFile.pending = true;
  //     // let file = this.selectedFile.file
  //     console.log(file.name);
  //     this.imageInputText = file.name;
  //     this.editDataGroups.imageName = file.name;
  //     this.toBase64(file).then((r) => {
  //       console.log(r);
  //       this.filePicture = r;
  //     });
  //   });
  //   reader.readAsDataURL(file);
  // }

  fnChangeStatus() {
    console.log('this.editDataGroups.statusEdit', this.editDataGroups.statusEdit);
    if (this.editDataGroups.statusEdit === 'Production Done') {
      this.reasonRequired = true
      this.editGroupForm.controls['txtPackagingNote'].setValidators(null)
      this.editGroupForm.controls['txtPackagingNote'].clearValidators();
      this.editGroupForm.controls['txtPackagingNote'].updateValueAndValidity();
    } else {
      this.reasonRequired = false
      this.editGroupForm.controls['txtPackagingNote'].setValidators(null)
      this.editGroupForm.controls['txtPackagingNote'].clearValidators();
      this.editGroupForm.controls['txtPackagingNote'].updateValueAndValidity();
    }
  }

  fnClickUploader() {
    console.log("max upload");

    if (this.imageList.length === 5) { // max upload
      return;
    }
    const elm: any = document.querySelector('.dx-fileuploader-button');
    elm.click();
  }

  fnDeleteImage(index) {
    this.imageList.splice(index, 1);
  }

  onValueChanged(event) {

    if (this.imageList.length > 5) { // max upload
      this.imageList.length = 5; // max upload
    }
    const removeIndexList = [];
    let isErrorFormat = false;
    let isErrorSize = false;
    for (let i = 0; i < this.imageList.length; i++) {
      const file: File = this.imageList[i];
      if (this.imageList[i].name.includes(".heic") || this.imageList[i].name.includes(".heif") || this.imageList[i].name.includes(".HEIC") || this.imageList[i].name.includes(".HEIF")) {
        let blob: Blob = file;
        let convProm: Promise<any>;
        console.log('before ::' + this.imageList[i].size)
        this.isLoadingPanel = true
        convProm = heic2any({ blob, toType: "image/jpeg", quality: 0.92 }).then(async (jpgBlob: Blob) => {

          //Change the name of the file according to the new format
          let newName = file.name.replace(/\.[^/.]+$/, ".jpg");

          this.imageList[i] = this.blobToFile(jpgBlob, newName);

          this.common.fnResizeImage(this.imageList[i], newName, 0.20).then((resizeFile: File) => {
            // Convert blob back to file
            console.log('after ::' + resizeFile.size);
            if (resizeFile.size > 1000000) {
              removeIndexList.push(i);
              isErrorFormat = false;
              isErrorSize = true;
            }
            this.isLoadingPanel = false;
          });
        }).catch(err => {
          //Handle error
        });

      } else {
        if (['image/png', 'image/jpeg', 'image/jpg'].indexOf(this.imageList[i].type) === -1) {
          removeIndexList.push(i);
          isErrorFormat = true;
          isErrorSize = false;

        } else {
          this.common.fnResizeImage(this.imageList[i], file.name, 0.20).then((resizeFile: File) => {
            if (resizeFile.size > 1000000) {
              removeIndexList.push(i);
              isErrorFormat = false;
              isErrorSize = true;
            }
          });
        }
      }
    }

    for (let i = removeIndexList.length - 1; i >= 0; i--) {
      this.fnDeleteImage(removeIndexList[i]);
    }

    if (isErrorFormat) {
      this.goAlert('Invalid File Format', 'File should be .jpg, .jpeg, .png, .heic and .heif ', 'myModalWarning');
    } else if (isErrorSize) {
      this.goAlert('Invalid File Size', 'The file is too large. Allowed maximum size is 1 MB.', 'myModalWarning');
    }

    // set input file null เพื่อให้อัพโหลดชื่อไฟล์เดิมซ้ำได้
    const elm: any = document.querySelector('input[type="file"]');
    elm.value = null;

  }

  blobToFile = (theBlob: Blob, fileName: string): File => {
    let b: any = theBlob;

    //A Blob() is almost a File() - it's just missing the two properties below which we will add
    b.lastModified = new Date();
    b.name = fileName;

    //Cast to a File() type

    return <File>theBlob;
  }

  async fnClickPrintDocument(type: string) {
    console.log('fnClickPrintDocument type', type);
    try {
      let url = ''
      let filterData: any = {}
      if (type === 'quotation') {
        // url = environment.printDeliveryDetail
      }
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
      if (type === 'labelSachet') {
        url = environment.printLabelSachet
      }
      if (type === 'rmChargeDetail') {
        url = environment.printRMChargeDetail
      }
      if (type === 'all') {
        url = environment.printAll
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

  async onClickEditOrder() {
    try {
      this.disbledBtn = {
        "save": true,
        "cancel": true
      };
      let url = GlobalVariable.BASE_API + GlobalVariable.BASE_RESOURCE + GlobalVariable.BASE_RESOURCE_UPDATE_ERROR_ORDER;

      let locationText = this.errorText[this.errorText.length - 1].split('in ')[1]
      locationText = locationText.replaceAll('.', '')
      let data: any = {
        orderId: this.Id,
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

      let response = await this.request.post(url, data);

      // this.userMessage = response.userMessage;
      if (response.resultCode === resultCodeSuccess) {
        this.goAlert('', '', 'myModalSuccess');
        // this.onClickBack()
      }
      else {
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

  triggerFileInput() {
    this.fileInput.nativeElement.click();
  }

  removePicture(index: number): void {
    this.imageList.splice(index, 1);
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

  upload(event: any) {
    const files: FileList = event.target.files;
    if (!files || !files.length) return;

    const maxPictures = 5;
    const currentCount = this.imageList.length;
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
        this.imageList.push(base64);
      };

      reader.readAsDataURL(file);
    }

    event.target.value = '';
  }

  onTypeChange(noteIndex: number, typeIndex: number) {
    if (this.isUpdatingType) return;

    this.isUpdatingType = true;

    const packagingNoteArray = this.editGroupForm.get('txtPackageNoteList') as FormArray;
    const noteGroup = packagingNoteArray.at(noteIndex) as FormGroup;
    const typeArray = noteGroup.get('type') as FormArray;

    typeArray.controls.forEach((control, i) => {
      if (i !== typeIndex) {
        control.setValue(false, { emitEvent: false });
      } else {
        control.setValue(true, { emitEvent: false });
      }
    });

    setTimeout(() => {
      this.isUpdatingType = false;
    });
  }
}
