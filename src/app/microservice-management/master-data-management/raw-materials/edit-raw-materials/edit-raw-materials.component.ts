import { Component, OnInit, AfterViewInit, ElementRef, Input, ViewChild, ViewEncapsulation } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
// import { LayoutMenu } from '../../../shared/store/layout.menu.store';
import { GlobalVariable } from './edit-raw-materials.global';
import { Request } from '../../../../shared/services/request.service';
import { Common } from '../../../../shared/services/common.service';
import { FormGroup, FormBuilder, FormControl, Validators } from '@angular/forms';
import { DxDataGridComponent, DxTreeListComponent } from 'devextreme-angular';
import { environment } from '../../../../../environments/environment';
import CustomStore from 'devextreme/data/custom_store';
import * as moment from 'moment';

import * as _ from 'lodash';
import { CompareService } from '../../../../shared/services/compare.service';
import { StoreService } from '../../../../shared/services/store.service';
import heic2any from "heic2any";

class ImageSnippet {
  pending = false;
  status = 'init';

  constructor(public src: string, public file: File) {
  }
}

@Component({
  selector: 'app-edit-raw-materials',
  providers: [Request, Common, CompareService],
  templateUrl: './edit-raw-materials.component.html',
  styleUrls: ['./edit-raw-materials.scss'],
  encapsulation: ViewEncapsulation.None
})
export class EditRawMaterialsComponent implements OnInit, AfterViewInit {

  @ViewChild('myModal') myModal;
  @ViewChild(DxTreeListComponent) treeList: DxTreeListComponent;
  editDataGroups: any = {
    // 'microserviceGroupId': '',
    // 'microserviceGroupName': '',
    // 'description': '',
    // 'microserviceId': '',
    // 'createdAt': '',
    // 'updatedAt': '',
    // 'deletedAt': '',
    // 'createdBy': '',
    // 'updatedBy': '',
  };
  editGroupForm: FormGroup;
  cloneData: any;
  microserviceId;
  microserviceGroupId;
  filterData: any = {};
  loading = true;
  disbledBtn = {
    'save': true,
    'cancel': true
  };
  popupVisible = false;
  now: Date = new Date();
  minNow: Date = new Date();
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
  unitList: any = [];
  binList: any = [];
  statusList: any = [{ 'id': 0, 'name': 'Inactive' }, { 'id': 1, 'name': 'Active' }, { 'id': 2, 'name': 'Out of stock' }];
  calculateList: any = ['+', '-', '*', '/'];
  selectedFile: ImageSnippet;
  filePicture: any = null;
  imageInputText: any = '';
  menuHome: any = false;
  menuPermissions: any = { view: false, add: false, edit: false, delete: false };
  isLoadingPanel: boolean = false;

  constructor(public router: Router,
    private fb: FormBuilder,
    private request: Request,
    public common: Common,
    private route: ActivatedRoute,
    private store: StoreService,) {
    this.editGroupForm = this.fb.group({
      'txtCode': new FormControl('', [Validators.required]),
      'txtName': new FormControl('', [Validators.required]),
      'txtBin': new FormControl('', []),
      'txtUnit': new FormControl('', [Validators.required]),
      'txtRecommended': new FormControl('', [Validators.required]),
      'txtMinDose': new FormControl('', [Validators.required]),
      'txtMaxDose': new FormControl('', [Validators.required]),
      'txtExpiryDate': new FormControl('', [Validators.required]),
      'txtStrength': new FormControl('', []),
      'txtValue1': new FormControl('', [Validators.required]),
      'txtFormula': new FormControl('', [Validators.required]),
      'txtValue2': new FormControl('', [Validators.required]),
      'txtDescription': new FormControl('', []),
      'txtVtl': new FormControl('', []),
      'txtCost': new FormControl('', [Validators.required]),
      'txtRetailPrice': new FormControl('', [Validators.required]),
      'txtDoseEquivalent': new FormControl('', [Validators.required]),
      'txtPrescription': new FormControl('', [Validators.required]),
      'txtNo': new FormControl('', [Validators.required]),
      'txtStatus': new FormControl('', [Validators.required]),
    });
  }

  async ngOnInit() {
    try {
      const dropdown = await this.common.searchConfig();
      this.unitList = dropdown.uomList || [];

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
      await this.getDDBIN();

      this.route.params.subscribe(async (params) => {


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
        if (this.pageType === 'new') {
          this.editDataGroups.formula = '/';
          this.editDataGroups.isExpense = false;
          // this.editDataGroups.expiryDate = new Date();
        }


        if (this.pageType === 'view' || this.pageType === 'edit') {
          //get api by id
          await this.getApiEdit();
        }
        if (this.pageType === 'view') {
          // this.editGroupForm.controls['txtCode'].disable();
          this.editGroupForm.controls['txtCode'].disable();
          this.editGroupForm.controls['txtName'].disable();
          this.editGroupForm.controls['txtBin'].disable();
          this.editGroupForm.controls['txtUnit'].disable();
          this.editGroupForm.controls['txtRecommended'].disable();
          this.editGroupForm.controls['txtStrength'].disable();
          this.editGroupForm.controls['txtDescription'].disable();
          this.editGroupForm.controls['txtVtl'].disable();
          this.editGroupForm.controls['txtCost'].disable();
          this.editGroupForm.controls['txtRetailPrice'].disable();
          this.editGroupForm.controls['txtDoseEquivalent'].disable();
          this.editGroupForm.controls['txtPrescription'].disable();
          this.editGroupForm.controls['txtMinDose'].disable();
          this.editGroupForm.controls['txtMaxDose'].disable();
          this.editGroupForm.controls['txtExpiryDate'].disable();
          this.editGroupForm.controls['txtNo'].disable();
          this.editGroupForm.controls['txtStatus'].disable();

        } else {
          // console.log(this.editGroupForm.controls['txtGroupName']);
          this.editGroupForm.controls['txtCode'].enable();
          this.editGroupForm.controls['txtName'].enable();
          this.editGroupForm.controls['txtBin'].enable();
          this.editGroupForm.controls['txtUnit'].enable();
          this.editGroupForm.controls['txtRecommended'].enable();
          this.editGroupForm.controls['txtStrength'].enable();
          this.editGroupForm.controls['txtDescription'].enable();
          this.editGroupForm.controls['txtVtl'].enable();
          this.editGroupForm.controls['txtCost'].enable();
          // this.editGroupForm.controls['txtRetailPrice'].disable();
          this.editGroupForm.controls['txtRetailPrice'].enable();
          this.editGroupForm.controls['txtDoseEquivalent'].disable();
          this.editGroupForm.controls['txtPrescription'].enable();
          this.editGroupForm.controls['txtMinDose'].enable();
          this.editGroupForm.controls['txtMaxDose'].enable();
          this.editGroupForm.controls['txtExpiryDate'].enable();
          this.editGroupForm.controls['txtNo'].enable();
          this.editGroupForm.controls['txtStatus'].enable();
          if (this.pageType === 'new') {
            this.editGroupForm.controls['txtStatus'].disable();
          }
        }
      });

    } catch (e) {
      console.log(e);
      const resultDescriptionSystemErrorTitle = environment.resultDescriptionSystemErrorTitle;
      const resultDescriptionSystemErrorMassage = environment.resultDescriptionSystemErrorMassage;
      this.goAlert(resultDescriptionSystemErrorTitle, resultDescriptionSystemErrorMassage, 'myModalError');
    }
  }

  numberOnly(event, numOnly?): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;
    if (charCode == 46 && !numOnly) {
      return true;
    } else if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }

  calculateStrength() {
    try {
      const configRetailPriceConstant = 0.98;
      console.log(this.editDataGroups.value1, this.editDataGroups.formula, this.editDataGroups.value2);

      if (this.editDataGroups.value1 && this.editDataGroups.formula && this.editDataGroups.value2) {
        let strength = 0;
        if (this.editDataGroups.formula == '+') {
          strength = (+this.editDataGroups.value1) + (+this.editDataGroups.value2);
        } else if (this.editDataGroups.formula == '-') {
          strength = this.editDataGroups.value1 - this.editDataGroups.value2;
        } else if (this.editDataGroups.formula == '*') {
          strength = this.editDataGroups.value1 * this.editDataGroups.value2;
        } else if (this.editDataGroups.formula == '/') {
          strength = this.editDataGroups.value1 / this.editDataGroups.value2;
        }
        const roundedUpStrength = Math.round(strength * 1000) / 1000;
        this.editDataGroups.strength = roundedUpStrength;
        const doseEquivalent = configRetailPriceConstant * this.editDataGroups.strength;
        const roundedUpDoseEquivalent = Math.round(doseEquivalent * 1000) / 1000;
        this.editDataGroups.doseEquivalent = roundedUpDoseEquivalent;
      } else {
        this.editDataGroups.strength = 0;
      }
    } catch (e) {
      console.log(e);
      this.editDataGroups.strength = 0;
    }
  }


  toBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  })


  processFile(imageInput: any) {
    this.filePicture = null;
    const file: File = imageInput.files[0];
    const reader = new FileReader();
    let files: File = file;

    reader.addEventListener('load', (event: any) => {
      if (file.name.includes(".heic") || file.name.includes(".heif") || file.name.includes(".HEIC") || file.name.includes(".HEIF")) {
        this.isLoadingPanel = true;
        let blob: Blob = file;
        let convProm: Promise<any>;
        convProm = heic2any({ blob, toType: "image/jpeg", quality: 0.92 }).then(async (jpgBlob: Blob) => {

          //Change the name of the file according to the new format
          let newName = file.name.replace(/\.[^/.]+$/, ".jpg");

          //Convert blob back to file
          files = this.blobToFile(jpgBlob, newName);

          this.selectedFile = new ImageSnippet(event.target.result, files);
          this.imageInputText = newName;
          this.editDataGroups.imageName = newName;
          this.selectedFile.pending = true;

          console.log(file.size)
          console.log(files.size)
          this.common.fnResizeImage(files, newName, 0.20).then((resizeFile: File) => {
            this.isLoadingPanel = false;
            if (resizeFile.size > 1000000) {
              // this.goAlert("Validate", 'The file is too large. Allowed maximum size is 1 MB.', 'myModalError');
              this.goAlert('Invalid File Format', 'The file is too large. Allowed maximum size is 1 MB.', 'myModalWarning');
              return;
            } else {
              this.toBase64(resizeFile).then((r) => {
                this.filePicture = r;
              });
            }
          });

        }).catch(err => {
          //Handle error
        });
      } else if (['image/png', 'image/jpeg', 'image/jpg'].indexOf(file.type) === -1) {
        // this.goAlert("Validate", 'File should be .jpg, .jpeg, .png, .heic and .heif ', 'myModalError');
        this.goAlert('Invalid File Format', 'File should be .jpg, .jpeg, .png, .heic and .heif ', 'myModalWarning');
        return;
      } else {
        this.selectedFile = new ImageSnippet(event.target.result, file);
        this.imageInputText = file.name;
        this.editDataGroups.imageName = file.name;
        this.selectedFile.pending = true;

        // if (file.size > 1000000) {
        //   // this.goAlert("Validate", 'The file is too large. Allowed maximum size is 1 MB.', 'myModalError');
        //   this.goAlert('Invalid File Format', 'The file is too large. Allowed maximum size is 1 MB.', 'myModalWarning');
        //   return;
        // } else {
        //   this.toBase64(file).then((r) => {
        //     this.filePicture = r;
        //   });
        // }

        this.common.fnResizeImage(files, file.name, 0.20).then((resizeFile: File) => {
          this.isLoadingPanel = false;
          if (resizeFile.size > 1000000) {
            // this.goAlert("Validate", 'The file is too large. Allowed maximum size is 1 MB.', 'myModalError');
            this.goAlert('Invalid File Format', 'The file is too large. Allowed maximum size is 1 MB.', 'myModalWarning');
            return;
          } else {
            this.toBase64(resizeFile).then((r) => {
              this.filePicture = r;
            });
          }
        });
      }


    });
    if (file.name.includes(".heic") || file.name.includes(".heif") || file.name.includes(".HEIC") || file.name.includes(".HEIF")) {
      reader.readAsDataURL(files);
    } else {
      reader.readAsDataURL(file);
    }

  }


  blobToFile = (theBlob: Blob, fileName: string): File => {
    let b: any = theBlob;

    //A Blob() is almost a File() - it's just missing the two properties below which we will add
    b.lastModified = new Date();
    b.name = fileName;

    //Cast to a File() type

    return <File>theBlob;
  }


  resizedataURL(datas, wantedWidth, wantedHeight){
    return new Promise(async function(resolve,reject){

        // We create an image to receive the Data URI
        var img = document.createElement('img');

        // When the event "onload" is triggered we can resize the image.
        img.onload = function()
        {
            // We create a canvas and get its context.
            var canvas = document.createElement('canvas');
            var ctx = canvas.getContext('2d');

            // We set the dimensions at the wanted size.
            canvas.width = wantedWidth;
            canvas.height = wantedHeight;

            // We resize the image with the canvas method drawImage();
            ctx.drawImage(datas, 0, 0, wantedWidth, wantedHeight);

            var dataURI = canvas.toDataURL();

            // This is the return of the Promise
            resolve(dataURI);
        };

        // We put the Data URI in the image's src attribute
        img.src = datas;

    })
}// Use it like : var newDataURI = await resizedataURL('yourDataURIHere', 50, 50);
  async getDDBIN() {
    try {

      const checkUrl = this.common.checkMockupUrl('', '', {}, {
        BASE_API: GlobalVariable.BASE_API,
        BASE_MODULE: GlobalVariable.BASE_MODULE,
        BASE_RESOURCE: GlobalVariable.BASE_DD_BIN
      });
      const response = await this.request.get(checkUrl.url, checkUrl.filter);

      this.binList = response.resultData || [];
      console.log(this.binList)

    } catch (e) {
      console.log(e);

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
        rawMaterialId: this.Id,
      };

      const checkUrl = this.common.checkMockupUrl('', '', filterData, {
        BASE_API: GlobalVariable.BASE_API,
        BASE_MODULE: GlobalVariable.BASE_MODULE,
        BASE_RESOURCE: GlobalVariable.BASE_RESOURCE + GlobalVariable.BASE_RESOURCE_GET_BY_ID
      });


      const resultCodeSuccess = environment.resultCodeSuccess;

      const response = await this.request.get(checkUrl.url, checkUrl.filter);
      if (response.resultCode === resultCodeSuccess) {
        this.editDataGroups = response.resultData;
        this.editDataGroups.binId = this.editDataGroups.bin.binId ? this.editDataGroups.bin.binId : "undefined";

        if (this.editDataGroups.bin) {
          this.binList.push({
            id: this.editDataGroups.bin.binId,
            binName: this.editDataGroups.bin.binName,
            createdAt: null,
            createdBy: null,
            deletedAt: null,
            deletedBy: null,
            updatedAt: null,
            updatedBy: null,
          });
        }

        this.filePicture = this.editDataGroups.image;
        console.log(this.editDataGroups);
        console.log(this.binList);
        this.cloneData = _.cloneDeep(this.editDataGroups);
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

  onInput(id, key) {
    const elm: any = document.getElementById(id);
    this.editDataGroups[key] = elm.value || '';
  }

  async btnSubmit() {
    try {
      this.disbledBtn = {
        'save': true,
        'cancel': true
      };
      const requiredData: boolean = this.checkRequiredData();

      console.log(this.editDataGroups);
      if (requiredData) {
        const addData: any = {
          ...this.editDataGroups,
          'image': this.filePicture
        };
        if (this.pageType === 'edit') {
          delete addData['bin'];
          for (const [key] of Object.entries(addData)) {
            if (addData[key] == this.cloneData[key]) {
              delete addData[key];
            }
          }
          if (Object.keys(addData).length == 0) {
            addData.notSend = true;
          }
          addData.rawMaterialId = this.Id;
        }
        if (addData.expiryDate) { addData.expiryDate = addData.expiryDate ? moment(addData.expiryDate).format('YYYY-MM-DD 23:59:59') : null; }
        if (addData.cost) { addData.cost = addData.cost ? +addData.cost : addData.cost; }
        if (addData.doseEquivalent) { addData.doseEquivalent = addData.doseEquivalent ? +addData.doseEquivalent : addData.doseEquivalent; }
        if (addData.maximumDose) { addData.maximumDose = addData.maximumDose ? +addData.maximumDose : addData.maximumDose; }
        if (addData.minimumDose) { addData.minimumDose = addData.minimumDose ? +addData.minimumDose : addData.minimumDose; }
        if (addData.retailPrice) { addData.retailPrice = addData.retailPrice ? +addData.retailPrice : addData.retailPrice; }
        if (addData.value1) { addData.value1 = addData.value1 ? +addData.value1 : addData.value1; }
        if (addData.value2) { addData.value2 = addData.value2 ? +addData.value2 : addData.value2; }
        if (addData.vtlCapPackingStat) { addData.vtlCapPackingStat = addData.vtlCapPackingStat ? +addData.vtlCapPackingStat : addData.vtlCapPackingStat; }
        if (addData.strength) { addData.strength = addData.strength ? +addData.strength : addData.strength; }
        let checkUrl = null;
        let response;
        let resultCodeSuccess = environment.resultCodeSuccess;
        if (this.pageType === 'new') {
          checkUrl = this.common.checkMockupUrl('', GlobalVariable.RESOURCE, {}, {
            BASE_API: GlobalVariable.BASE_API,
            BASE_MODULE: GlobalVariable.BASE_MODULE,
            BASE_RESOURCE: GlobalVariable.BASE_RESOURCE + GlobalVariable.BASE_RESOURCE_CREATE
          });
          response = await this.request.post(checkUrl.url, [addData]);
          if (response.resultCode === resultCodeSuccess) {
            this.goAlert('', '', 'myModalSuccess');
          }
          else {
            // this.goAlert(resultDescriptionSystemErrorTitle, resultDescriptionSystemErrorMassage, 'myModalError');
            this.goAlert(response.resultCode, response.resultDescription, 'myModalError');
          }
        } else {
          if (!addData.notSend) {
            checkUrl = this.common.checkMockupUrl('', GlobalVariable.RESOURCE, {}, {
              BASE_API: GlobalVariable.BASE_API,
              BASE_MODULE: GlobalVariable.BASE_MODULE,
              BASE_RESOURCE: GlobalVariable.BASE_RESOURCE + GlobalVariable.BASE_RESOURCE_UPDATE
            });
            if (addData.binId === "undefined") {
              addData.binId = null
            }
            response = await this.request.patch(checkUrl.url, addData);
            if (response.resultCode === resultCodeSuccess) {
              this.goAlert('', '', 'myModalSuccess');
            }
            else {
              // this.goAlert(resultDescriptionSystemErrorTitle, resultDescriptionSystemErrorMassage, 'myModalError');
              this.goAlert(response.resultCode, response.resultDescription, 'myModalError');
            }

          } else {
            this.goAlert('', '', 'myModalSuccess');
          }
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

    if (this.editDataGroups.unit === 'undefined') {
      this.editGroupForm.controls['txtUnit'].setErrors({ 'forceRequired': true });
      this.editGroupForm.controls['txtUnit'].markAsDirty();
    }

    if (this.editDataGroups.capsuleSize === 'undefined') {
      this.editGroupForm.controls['txtSize'].setErrors({ 'forceRequired': true });
      this.editGroupForm.controls['txtSize'].markAsDirty();
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

  onClickBack() {
    this.router.navigate(['/master-data-management', 'raw-materials']);
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

  popupImg() {
    this.popupVisible = true
  }
}
