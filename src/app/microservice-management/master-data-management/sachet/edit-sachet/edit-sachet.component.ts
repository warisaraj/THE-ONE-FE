import {Component, OnInit, AfterViewInit, ViewChild} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
// import { LayoutMenu } from '../../../shared/store/layout.menu.store';
import {GlobalVariable} from './edit-sachet.global';
import {Request} from '../../../../shared/services/request.service';
import {Common} from '../../../../shared/services/common.service';
import {FormGroup, FormBuilder, FormControl, Validators} from '@angular/forms';
import {DxTreeListComponent} from 'devextreme-angular';
import {environment} from '../../../../../environments/environment';
import * as _ from 'lodash';
import {CompareService} from '../../../../shared/services/compare.service';
import {StoreService} from '../../../../shared/services/store.service';
import heic2any from 'heic2any';

class ImageSnippet {
  pending: boolean = false;
  status: string = 'init';

  constructor(public src: string, public file: File) {
  }
}

@Component({
  selector: 'app-edit-sachet',
  providers: [Request, Common, CompareService],
  templateUrl: './edit-sachet.component.html',
})
export class EditSachetComponent implements OnInit, AfterViewInit {

  @ViewChild('myModal') myModal;
  @ViewChild(DxTreeListComponent) treeList: DxTreeListComponent;
  editDataGroups: any = {};
  editGroupForm: FormGroup;
  microserviceId;
  microserviceGroupId;
  filterData: any = {};
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
  menuPermissions: any = {view: true, add: true, edit: true, delete: true}
  selectedFile: any;
  imageInputText: string;
  img = []
  isLoadingPanel: boolean;

  constructor(public router: Router,
              private fb: FormBuilder,
              private request: Request,
              private common: Common,
              private route: ActivatedRoute,
              private store: StoreService,) {
    this.editGroupForm = this.fb.group({
      'txtMorningNote': new FormControl(''),
      'txtLunchNote': new FormControl(''),
      'txtEveningNote': new FormControl(''),
      'txtBedTimeNote': new FormControl(''),
    });
  }

  async ngOnInit() {
    try {
      this.store.subscribePagePermissionList().subscribe(pagePermissionList => {
        console.log("ngOnInit", pagePermissionList);
        let pagePermission = pagePermissionList.find(r => r.url === GlobalVariable.ROLE_URL);
        if (pagePermission) {
          try {
            // this.menuPermissions = JSON.parse(pagePermission.menuPermissions)
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
      this.loading = false;
      this.disbledBtn = {
        'save': false,
        'cancel': false
      };
      this.checkGroupPermission();
      await this.getApiEdit();
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

      const checkUrl = this.common.checkMockupUrl('', '', {}, {
        BASE_API: GlobalVariable.BASE_API,
        BASE_MODULE: GlobalVariable.BASE_MODULE,
        BASE_RESOURCE: GlobalVariable.BASE_RESOURCE + GlobalVariable.BASE_RESOURCE_GET
      });


      const resultCodeSuccess = environment.resultCodeSuccess;

      let response = await this.request.get(checkUrl.url, checkUrl.filter);
      if (response.resultCode === resultCodeSuccess) {
        this.editDataGroups = await response.resultData;
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
      this.disbledBtn = {
        'save': true,
        'cancel': true
      };
      let payload: any = {
        ...this.editDataGroups,
      };

      let checkUrl = null;

      checkUrl = this.common.checkMockupUrl('', GlobalVariable.RESOURCE, {}, {
        BASE_API: GlobalVariable.BASE_API,
        BASE_MODULE: GlobalVariable.BASE_MODULE,
        BASE_RESOURCE: GlobalVariable.BASE_RESOURCE + GlobalVariable.BASE_RESOURCE_UPDATE
      });

      let response = await this.request.patch(checkUrl.url, payload);

      let resultCodeSuccess = environment.resultCodeSuccess;

      if (response.resultCode === resultCodeSuccess) {
        this.goAlert('', '', 'myModalSuccess');
      }
      else {
        this.goAlert(response.resultCode, response.resultDescription, 'myModalError');
      }


    } catch (e) {
      console.log(e); 
      this.disbledBtn = {
        'save': false,
        'cancel': false
      };
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
    this.router.navigate(['/master-data-management', 'sachet']);
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

  toBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });

  processFile(imageInput: any, index: number) {
    switch (index) {
      case 0:
        this.editDataGroups.morningPicture = null
        break;
      case 1:
        this.editDataGroups.lunchPicture = null
        break;
      case 2:
        this.editDataGroups.eveningPicture = null
        break;
      case 3:
        this.editDataGroups.bedtimePicture = null
        break;
      default:
        break;
    }
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
                switch (index) {
                  case 0:
                    this.editDataGroups.morningPicture = r
                    this.editDataGroups.morningPictureName = file.name
                    break;
                  case 1:
                    this.editDataGroups.lunchPicture = r
                    this.editDataGroups.lunchPictureName = file.name
                    break;
                  case 2:
                    this.editDataGroups.eveningPicture = r
                    this.editDataGroups.eveningPictureName = file.name
                    break;
                  case 3:
                    this.editDataGroups.bedtimePicture = r
                    this.editDataGroups.bedtimePictureName = file.name
                    break;
                  default:
                    break;
                }
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

        this.common.fnResizeImage(files, file.name, 0.20).then((resizeFile: File) => {
          if (resizeFile.size > 1000000) {
            // this.goAlert("Validate", 'The file is too large. Allowed maximum size is 1 MB.', 'myModalError');
            switch (index) {
              case 0:
                this.editDataGroups.morningPicture = null
                this.editDataGroups.morningPictureName = null
                break;
              case 1:
                this.editDataGroups.lunchPicture = null
                this.editDataGroups.lunchPictureName = null
                break;
              case 2:
                this.editDataGroups.eveningPicture = null
                this.editDataGroups.eveningPictureName = null
                break;
              case 3:
                this.editDataGroups.bedtimePicture = null
                this.editDataGroups.bedtimePictureName = null
                break;
              default:
                break;
            }
            this.goAlert('Invalid File Format', 'The file is too large. Allowed maximum size is 1 MB.', 'myModalWarning');
            return;
          } else {
            this.toBase64(resizeFile).then((r) => {
              switch (index) {
                case 0:
                  this.editDataGroups.morningPicture = r
                  this.editDataGroups.morningPictureName = file.name
                  break;
                case 1:
                  this.editDataGroups.lunchPicture = r
                  this.editDataGroups.lunchPictureName = file.name
                  break;
                case 2:
                  this.editDataGroups.eveningPicture = r
                  this.editDataGroups.eveningPictureName = file.name
                  break;
                case 3:
                  this.editDataGroups.bedtimePicture = r
                  this.editDataGroups.bedtimePictureName = file.name
                  break;
                default:
                  break;
              }
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
}
