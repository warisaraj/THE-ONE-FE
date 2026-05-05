import { Component, OnInit, AfterViewInit, ElementRef, Input, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { GlobalVariable } from './edit-capsules.global';
import { Request } from '../../../../shared/services/request.service';
import { Common } from '../../../../shared/services/common.service';
import { FormGroup, FormBuilder, FormControl, Validators } from '@angular/forms';
import { environment } from '../../../../../environments/environment';
import CustomStore from 'devextreme/data/custom_store';
import * as moment from 'moment';

import * as _ from 'lodash';
import { CompareService } from '../../../../shared/services/compare.service';
import { StoreService } from '../../../../shared/services/store.service';
import { a } from "@angular/core/src/render3";
import heic2any from "heic2any";


class ImageSnippet {
  pending: boolean = false;
  status: string = 'init';

  constructor(public src: string, public file: File) {
  }
}

@Component({
  selector: 'app-edit-capsules',
  providers: [Request, Common, CompareService],
  templateUrl: './edit-capsules.component.html',
  // styleUrls: ['./menu.component.scss']
})
export class EditCapsulesComponent implements OnInit, AfterViewInit {

  @ViewChild('myModal') myModal;
  editDataGroups: any = {};
  uomList: any = [];
  capsuleSizeList: any = [];
  editGroupForm: FormGroup;
  microserviceId;
  microserviceGroupId;
  filterData: any = {};
  loading = true;
  cloneData: any;
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
  selectedFile: ImageSnippet;
  filePicture: any = null;
  imageInputText: any = '';
  menuHome: any = false;
  popupVisible = false
  menuPermissions: any = { view: false, add: false, edit: false, delete: false }
  isLoadingPanel: boolean = false;

  constructor(public router: Router,
    private fb: FormBuilder,
    private request: Request,
    private common: Common,
    private route: ActivatedRoute,
    private store: StoreService,) {
    this.editGroupForm = this.fb.group({
      'txtCode': new FormControl('', [Validators.required]),
      'txtName': new FormControl('', [Validators.required]),
      'txtUom': new FormControl('', [Validators.required]),
      'txtSize': new FormControl('', [Validators.required]),
      'txtOrigin': new FormControl('', [Validators.required]),
      'txtPackingStat': new FormControl('', [Validators.required]),
      'txtPicture': new FormControl('', []),
    });
  }

  async ngOnInit() {
    try {
      const dropdown = await this.common.searchConfig();
      this.uomList = dropdown.uomList || [];
      this.capsuleSizeList = dropdown.capsuleSizeList || [];
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
      await this.route.params.subscribe(params => {
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

        if (this.pageType === 'new') {
          this.editDataGroups.isExpense = false
        }

        if (this.pageType === 'view' || this.pageType === 'edit') {
          //get api by id
          this.getApiEdit();
        }
        if (this.pageType === 'view') {
          // this.filePicture = this.filePictureTemp;
          this.editGroupForm.controls['txtCode'].disable();
          this.editGroupForm.controls['txtName'].disable();
          this.editGroupForm.controls['txtUom'].disable();
          this.editGroupForm.controls['txtSize'].disable();
          this.editGroupForm.controls['txtOrigin'].disable();
          this.editGroupForm.controls['txtPackingStat'].disable();

        } else {
          this.editGroupForm.controls['txtCode'].enable();
          this.editGroupForm.controls['txtName'].enable();
          this.editGroupForm.controls['txtUom'].enable();
          this.editGroupForm.controls['txtSize'].enable();
          this.editGroupForm.controls['txtOrigin'].enable();
          this.editGroupForm.controls['txtPackingStat'].enable();

        }
      });
      // this.microserviceName = sessionStorage.getItem('microserviceName');
      // console.log('this.microserviceName', this.microserviceName);
      // await this.getApiEdit();
      // await this.textAreaAutoHeight();
      // await this.getMicroMenuGroupPermission();
      // await this.getMicroMenuGroup();
      await this.checkGroupPermission();
    } catch (e) {
      console.log(e);
      const resultDescriptionSystemErrorTitle = environment.resultDescriptionSystemErrorTitle;
      const resultDescriptionSystemErrorMassage = environment.resultDescriptionSystemErrorMassage;
      this.goAlert(resultDescriptionSystemErrorTitle, resultDescriptionSystemErrorMassage, 'myModalError');
    }
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


  toBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });


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
        convProm = heic2any({ blob, toType: "image/jpeg", quality: 0.92 }).then((jpgBlob: Blob) => {

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
        //
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

  async getApiEdit() {
    try {
      this.loading = true;
      this.disbledBtn = {
        'save': true,
        'cancel': true
      };
      let filterData = {
        capsuleId: this.Id,
      };

      const checkUrl = this.common.checkMockupUrl('', '', filterData, {
        BASE_API: GlobalVariable.BASE_API,
        BASE_MODULE: GlobalVariable.BASE_MODULE,
        BASE_RESOURCE: GlobalVariable.BASE_RESOURCE + GlobalVariable.BASE_RESOURCE_GET_BY_ID
      });


      const resultCodeSuccess = environment.resultCodeSuccess;

      let response = await this.request.get(checkUrl.url, checkUrl.filter);
      if (response.resultCode === resultCodeSuccess) {
        this.editDataGroups = response.resultData;
        this.filePicture = this.editDataGroups.image

        this.cloneData = _.cloneDeep(this.editDataGroups)
        console.log(this.editDataGroups);
      }
      // else if (response.resultCode === resultCodeDataNotFound) {
      //   this.goAlert(resultDescriptionDataNotFoundTitle, resultDescriptionDataNotFoundMassage, 'myModalError');
      // } else if (response.resultCode === resultCodeDbError) {
      //   this.goAlert(resultDescriptionDbErrorTitle, resultDescriptionDbErrorMassage, 'myModalError');
      // }
      else {
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

  async btnSubmit() {
    try {
      this.disbledBtn = {
        'save': true,
        'cancel': true
      };
      const requiredData: boolean = this.checkRequiredData();

      if (requiredData) {
        let addData: any = {
          ...this.editDataGroups,
          "image": this.filePicture
        };

        if (this.pageType === 'edit') {
          for (const [key] of Object.entries(addData)) {
            if (addData[key] == this.cloneData[key])
              delete addData[key]
          }
          if (Object.keys(addData).length == 0) {
            addData.notSend = true
          }
          addData.capsuleId = this.Id
        }

        if (addData.packingStat) addData.packingStat = addData.packingStat ? +addData.packingStat : addData.packingStat
        let response
        let resultCodeSuccess = environment.resultCodeSuccess;
        let checkUrl = null;
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
    console.log(this.editDataGroups)
    console.log(this.editGroupForm.controls, this.editGroupForm, this.editGroupForm.valid);
    for (const key in this.editGroupForm.controls) {
      if (this.editGroupForm.controls[key].errors) {
        this.editGroupForm.controls[key].setErrors({ 'forceRequired': true });
        this.editGroupForm.controls[key].markAsDirty();
      } else {
        this.editGroupForm.controls[key].updateValueAndValidity();
      }
    }

    if (this.editDataGroups.uom === 'undefined') {
      this.editGroupForm.controls['txtUom'].setErrors({ 'forceRequired': true });
      this.editGroupForm.controls['txtUom'].markAsDirty();
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
    this.router.navigate(['/master-data-management', 'capsules']);
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
