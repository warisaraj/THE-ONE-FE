import { Component, OnInit, AfterViewInit, ElementRef, Input, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { GlobalVariable } from './edit-bin.global';
import { Request } from '../../../../shared/services/request.service';
import { Common } from '../../../../shared/services/common.service';
import { FormGroup, FormBuilder, FormControl, Validators } from '@angular/forms';
import { environment } from '../../../../../environments/environment';
import CustomStore from 'devextreme/data/custom_store';
import * as moment from 'moment';
import * as _ from 'lodash';
import { CompareService } from '../../../../shared/services/compare.service';
import { StoreService } from '../../../../shared/services/store.service';
@Component({
  selector: 'app-edit-bin',
  providers: [Request, Common, CompareService],
  templateUrl: './edit-bin.component.html',
  // styleUrls: ['./menu.component.scss']
})
export class EditBinComponent implements OnInit, AfterViewInit {

  @ViewChild('myModal') myModal;
  // @ViewChild(DxTreeListComponent) treeList: DxTreeListComponent;
  editDataGroups: any = {
    // 'microserviceGroupId': '',
    // 'name': '',
    // 'description': '',
    // 'microserviceId': '',
    // 'createdAt': '',
    // 'updatedAt': '',
    // 'deletedAt': '',
    // 'createdBy': '',
    // 'updatedBy': '',
  };
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
  menuPermissions: any = { view: false, add: false, edit: false, delete: false }
  tempData: any;
  constructor(public router: Router,
    private fb: FormBuilder,
    private request: Request,
    private common: Common,
    private route: ActivatedRoute,
    private store: StoreService,) {
    this.editGroupForm = this.fb.group({
      'txtName': new FormControl('', [Validators.required]),
    });
  }

  async ngOnInit() {
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

        if (this.pageType === 'view' || this.pageType === 'edit') {
          //get api by id
          this.getApiEdit();
        }
        if (this.pageType === 'view') {
          this.editGroupForm.controls['txtName'].disable();
        } else {
          this.editGroupForm.controls['txtName'].enable();
        }
      });
      // this.microserviceName = sessionStorage.getItem('microserviceName');
      // console.log('this.microserviceName', this.microserviceName);
      // await this.getApiEdit();
      // await this.textAreaAutoHeight();
      // await this.getMicroMenuGroupPermission();
      // await this.getMicroMenuGroup();
      // await this.checkGroupPermission();
    } catch (e) {
      console.log(e);
      const resultDescriptionSystemErrorTitle = environment.resultDescriptionSystemErrorTitle;
      const resultDescriptionSystemErrorMassage = environment.resultDescriptionSystemErrorMassage;
      this.goAlert(resultDescriptionSystemErrorTitle, resultDescriptionSystemErrorMassage, 'myModalError');
    }
  }

  // checkGroupPermission() {
  //   console.log('checkGroupPermission1', this.microserviceMenuGroup);
  //   console.log('checkGroupPermission2', this.microserviceMenuGroupPermission);
  //   this.selectMenuParentId = [];
  //   this.selectMenuId = [];
  //
  //   let parent = this.microserviceMenuGroup.filter(r => !r.microserviceMenuParentId).map(r => r.microserviceMenuId);
  //   let childPanrenId = this.microserviceMenuGroup.filter(r => r.microserviceMenuParentId).map(r => r.microserviceMenuParentId);
  //
  //   let parentNotchild = parent.filter(r => {
  //     // console.log(parent,child,r,child.indexOf(r))
  //     return childPanrenId.indexOf(r) === -1;
  //   });
  //
  //   console.log(parent, childPanrenId, parentNotchild);
  //   this.microserviceMenuGroupPermission.forEach(permission => {
  //     let microserviceMenuId = permission.microserviceMenuId;
  //     if (parentNotchild.indexOf(microserviceMenuId) > -1) {
  //       this.selectMenuParentId.push(permission.microserviceMenuId);
  //     } else if (parent.indexOf(microserviceMenuId) === -1) {
  //       this.selectMenuParentId.push(permission.microserviceMenuId);
  //     }
  //   });
  //
  //   console.log('selectMenuParentId', this.selectMenuParentId);
  //   console.log(this.microserviceMenuGroup);
  // }

  async getApiEdit() {
    try {
      this.loading = true;
      this.disbledBtn = {
        'save': true,
        'cancel': true
      };
      let filterData = {
        binId: this.Id,
      };

      const checkUrl = this.common.checkMockupUrl('', '', filterData, {
        BASE_API: GlobalVariable.BASE_API,
        BASE_MODULE: GlobalVariable.BASE_MODULE,
        BASE_RESOURCE: GlobalVariable.BASE_RESOURCE + GlobalVariable.BASE_RESOURCE_GET_BY_ID
      });


      const resultCodeSuccess = environment.resultCodeSuccess;
      const resultDescriptionSystemErrorTitle = environment.resultDescriptionSystemErrorTitle;
      const resultDescriptionSystemErrorMassage = environment.resultDescriptionSystemErrorMassage;

      let response = await this.request.get(checkUrl.url, checkUrl.filter);
      if (response.resultCode === resultCodeSuccess) {
        this.editDataGroups = response.resultData;
        this.tempData = _.cloneDeep(this.editDataGroups)
        console.log(this.editDataGroups);
      }
      // else if (response.resultCode === resultCodeDataNotFound) {
      //   this.goAlert(resultDescriptionDataNotFoundTitle, resultDescriptionDataNotFoundMassage, 'myModalError');
      // } else if (response.resultCode === resultCodeDbError) {
      //   this.goAlert(resultDescriptionDbErrorTitle, resultDescriptionDbErrorMassage, 'myModalError');
      // }
      else {
        this.goAlert(resultDescriptionSystemErrorTitle, resultDescriptionSystemErrorMassage, 'myModalError');
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
          'binName': this.common.trimData(this.editDataGroups['binName']),
        };
        if (this.pageType === 'edit') {
          addData.binId = this.Id
        }

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
          if (_.isEqual(this.editDataGroups, this.tempData)) {
            this.goAlert('', '', 'myModalSuccess');
          } else {
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

  onClickBack() {
    this.router.navigate(['/master-data-management', 'bin']);
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
}
