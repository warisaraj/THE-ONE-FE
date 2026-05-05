import {Component, OnInit, AfterViewInit, ViewChild} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
// import { LayoutMenu } from '../../../shared/store/layout.menu.store';
import {GlobalVariable} from './edit-pharmacy-notes.global';
import {Request} from '../../../../shared/services/request.service';
import {Common} from '../../../../shared/services/common.service';
import {FormGroup, FormBuilder, FormControl, Validators} from '@angular/forms';
import {DxTreeListComponent} from 'devextreme-angular';
import {environment} from '../../../../../environments/environment';
import * as _ from 'lodash';
import {CompareService} from '../../../../shared/services/compare.service';
import {StoreService} from '../../../../shared/services/store.service';
import CustomStore from 'devextreme/data/custom_store';

@Component({
  selector: 'app-edit-pharmacy-notes',
  providers: [Request, Common, CompareService],
  templateUrl: './edit-pharmacy-notes.component.html',
  // styleUrls: ['./menu.component.scss']
})
export class EditPharmacyNoteComponent implements OnInit, AfterViewInit {

  @ViewChild('myModal') myModal;
  @ViewChild(DxTreeListComponent) treeList: DxTreeListComponent;
  editDataGroups: any = {};
  patientInfoDataSource
  autocompleteFilter = {};
  cloneData: any;
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

  constructor(public router: Router,
              private fb: FormBuilder,
              private request: Request,
              private common: Common,
              private route: ActivatedRoute,
              private store: StoreService,) {
    this.editGroupForm = this.fb.group({
      'txtHn': new FormControl('', [Validators.required]),
      'txtName': new FormControl('', [Validators.required]),
      'txtOrderNote': new FormControl(''),
      'txtProductionNote': new FormControl(''),
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
      });
      this.patientInfoDataSource = this.customStore();
    } catch (e) {
      console.log(e);
    }
  }

  customStore() {
    const dataSource: any = {};
    dataSource.store = new CustomStore({
      load: (loadOptions: any) => {
        console.log('loadOptions', loadOptions);
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
                resultData = response.resultData;
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
        this.Id = params.id;

        if (this.pageType === 'view' || this.pageType === 'edit') {
          //get api by id
          this.getApiEdit();
        }
        if (this.pageType === 'view') {
          this.editGroupForm.controls['txtHn'].disable();
          this.editGroupForm.controls['txtName'].disable();
          this.editGroupForm.controls['txtOrderNote'].disable();
          this.editGroupForm.controls['txtProductionNote'].disable();
        } else {
          console.log(this.editGroupForm.controls['txtGroupName']);
          this.editGroupForm.controls['txtHn'].enable();
          this.editGroupForm.controls['txtName'].enable();
          this.editGroupForm.controls['txtOrderNote'].enable();
          this.editGroupForm.controls['txtProductionNote'].enable();
        }


      });
      // this.microserviceName = sessionStorage.getItem('microserviceName');
      // console.log('this.microserviceName', this.microserviceName);
      // await
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

  async getApiEdit() {
    try {
      this.loading = true;
      this.disbledBtn = {
        'save': true,
        'cancel': true
      };
      let filterData = {
        pharmacyNoteId: this.Id,
      };

      const checkUrl = this.common.checkMockupUrl('', '', filterData, {
        BASE_API: GlobalVariable.BASE_API,
        BASE_MODULE: GlobalVariable.BASE_MODULE,
        BASE_RESOURCE: GlobalVariable.BASE_RESOURCE + GlobalVariable.BASE_RESOURCE_GET_BY_ID
      });


      const resultCodeSuccess = environment.resultCodeSuccess;

      let response = await this.request.get(checkUrl.url, checkUrl.filter);
      if (response.resultCode === resultCodeSuccess) {
        this.editDataGroups = await response.resultData;
        console.log(this.editDataGroups);
        this.cloneData = _.cloneDeep(this.editDataGroups)
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
      const requiredData: boolean = this.checkRequiredData();

      if (requiredData) {
        let addData: any = {
          ...this.editDataGroups,
          // "image":this.filePicture
        };

        if (this.pageType === 'edit') {
          for (const [key] of Object.entries(addData)) {
            if (addData[key] == this.cloneData[key])
              delete addData[key]
          }
          if (Object.keys(addData).length == 0) {
            addData.notSend = true
          }
          addData.pharmacyNoteId = this.Id
        }


        let checkUrl = null;
        // if(   this.pageType ===  'new' ){
        //   checkUrl = this.common.checkMockupUrl('', GlobalVariable.RESOURCE, {}, {
        //     BASE_API: GlobalVariable.BASE_API,
        //     BASE_MODULE: GlobalVariable.BASE_MODULE,
        //     BASE_RESOURCE: GlobalVariable.BASE_RESOURCE + GlobalVariable.BASE_RESOURCE_CREATE
        //   });
        // }else{
        //   checkUrl = this.common.checkMockupUrl('', GlobalVariable.RESOURCE, {}, {
        //     BASE_API: GlobalVariable.BASE_API,
        //     BASE_MODULE: GlobalVariable.BASE_MODULE,
        //     BASE_RESOURCE: GlobalVariable.BASE_RESOURCE + GlobalVariable.BASE_RESOURCE_UPDATE
        //   });
        // }
        let response: any
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

        // if(this.pageType ===  'new'){
        //   response = await this.request.post(checkUrl.url, [ addData ])
        // } else {
        //   response = await this.request.patch(checkUrl.url,addData);
        // }

        


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
        this.editGroupForm.controls[key].setErrors({'forceRequired': true});
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

  onClickBack() {
    this.router.navigate(['/master-data-management', 'pharmacy-notes']);
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

  onItemClick(e) {
    const itemData = e.itemData;
    this.editDataGroups.hn = itemData.hn;
    this.editDataGroups.name = itemData.patientName;
  }

  onFocusOut(e, key) {
    const inputValue = e.event.target.value;
    if (inputValue !== this.editDataGroups[key]) {
      e.event.target.value = '';
    }
  }

  onValueChanged(e, key) {
    this.autocompleteFilter = {};
    this.autocompleteFilter[key] = e.value;
  }
}
