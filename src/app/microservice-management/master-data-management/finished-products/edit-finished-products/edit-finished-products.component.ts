import { Component, OnInit, AfterViewInit, ElementRef, Input, ViewChild, ViewEncapsulation } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
// import { LayoutMenu } from '../../../shared/store/layout.menu.store';
import { GlobalVariable } from './edit-finished-products.global';
import { Request } from '../../../../shared/services/request.service';
import { Common } from '../../../../shared/services/common.service';
import { FormGroup, FormBuilder, FormControl, Validators } from '@angular/forms';
import { DxDataGridComponent, DxTreeListComponent } from 'devextreme-angular';
import { environment } from '../../../../../environments/environment';
import CustomStore from 'devextreme/data/custom_store';
import * as moment from 'moment';
declare let $: any;
import * as _ from 'lodash';
import { CompareService } from '../../../../shared/services/compare.service';
import { StoreService } from '../../../../shared/services/store.service';

@Component({
  selector: 'app-edit-finished-products',
  providers: [Request, Common, CompareService],
  templateUrl: './edit-finished-products.component.html',
  styleUrls: ['./edit-finished-products.scss'],
  encapsulation: ViewEncapsulation.None
})
export class EditFinishedProductsComponent implements OnInit, AfterViewInit {

  @ViewChild('myModal') myModal;
  @ViewChild(DxTreeListComponent) treeList: DxTreeListComponent;
  editDataGroups: any = {
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
    { id: 0, name: 'Inactive' },
    { id: 1, name: 'Active' },
    { id: 2, name: 'Out of stock' }
  ]
  constructor(public router: Router,
    private fb: FormBuilder,
    private request: Request,
    public common: Common,
    private compare: CompareService,
    private route: ActivatedRoute,
    private store: StoreService,) {
    this.editGroupForm = this.fb.group({
      'txtCode': new FormControl('', [Validators.required]),
      'txtName': new FormControl('', [Validators.required]),
      'txtUom': new FormControl('', [Validators.required]),
      'txtQuantity': new FormControl('', [Validators.required]),
      'txtUnit': new FormControl('', [Validators.required]),
      'txtSupplyDay': new FormControl('', [Validators.required]),
      'txtPriceThai': new FormControl('', [Validators.required]),
      'txtPriceInter': new FormControl('', [Validators.required]),
      'txtPriceMiddleEast': new FormControl('', [Validators.required]),
      'txtStatus': new FormControl(''),
    });
  }

  async ngOnInit() {
    try {
      const dropdown = await this.common.searchConfig();
      console.log('dropdown', dropdown);
      this.uomList = dropdown.uomListFinished || [];
      this.unitList = dropdown.unitListFinished || [];
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

        if (this.pageType === 'view' || this.pageType === 'edit') {
          //get api by id
          this.getApiEdit();
        }
        if (this.pageType === 'view') {
          this.editGroupForm.controls['txtCode'].disable();
          this.editGroupForm.controls['txtName'].disable();
          this.editGroupForm.controls['txtUom'].disable();
          this.editGroupForm.controls['txtPriceThai'].disable();
          this.editGroupForm.controls['txtPriceInter'].disable();
          this.editGroupForm.controls['txtPriceMiddleEast'].disable();
          this.editGroupForm.controls['txtQuantity'].disable();
          this.editGroupForm.controls['txtSupplyDay'].disable();
          this.editGroupForm.controls['txtStatus'].disable();
          this.editGroupForm.controls['txtUnit'].disable();
        } else {
          console.log(this.editGroupForm.controls['txtGroupName']);
          this.editGroupForm.controls['txtCode'].enable();
          this.editGroupForm.controls['txtName'].enable();
          this.editGroupForm.controls['txtUom'].enable();
          this.editGroupForm.controls['txtPriceThai'].enable();
          this.editGroupForm.controls['txtPriceInter'].enable();
          this.editGroupForm.controls['txtPriceMiddleEast'].enable();
          this.editGroupForm.controls['txtQuantity'].disable();
          this.editGroupForm.controls['txtSupplyDay'].disable();
          this.editGroupForm.controls['txtUnit'].disable();
          this.editGroupForm.controls['txtStatus'].enable();
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
        finishedProductId: this.Id,
      };

      const checkUrl = this.common.checkMockupUrl('', '', filterData, {
        BASE_API: GlobalVariable.BASE_API,
        BASE_MODULE: GlobalVariable.BASE_MODULE,
        BASE_RESOURCE: GlobalVariable.BASE_RESOURCE + GlobalVariable.BASE_RESOURCE_GET_BY_ID
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

      let response = await this.request.get(checkUrl.url, checkUrl.filter);
      if (response.resultCode === resultCodeSuccess) {
        this.editDataGroups = await response.resultData;
        this.editDataGroups.priceThai = this.editDataGroups.priceThai
        this.editDataGroups.priceInter = this.editDataGroups.priceInter
        this.editDataGroups.priceMiddleEast = this.editDataGroups.priceMiddleEast
        this.cloneData = _.cloneDeep(this.editDataGroups)
        console.log(this.editDataGroups)
        this.checkUom()
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
      // this.disbledBtn = {
      //   'save': true,
      //   'cancel': true
      // };
      const requiredData: boolean = this.checkRequiredData();
      const resultCodeSuccess = environment.resultCodeSuccess;
      const resultCodeDataNotFound = environment.resultCodeDataNotFound;
      const resultDescriptionDataNotFoundTitle = environment.resultDescriptionDataNotFoundTitle;
      const resultDescriptionDataNotFoundMassage = environment.resultDescriptionDataNotFoundMassage;
      const resultDescriptionSystemErrorTitle = environment.resultDescriptionSystemErrorTitle;
      const resultDescriptionSystemErrorMassage = environment.resultDescriptionSystemErrorMassage;
      const resultCodeDbError = environment.resultCodeDbError;
      const resultDescriptionDbErrorTitle = environment.resultDescriptionDbErrorTitle;
      const resultDescriptionDbErrorMassage = environment.resultDescriptionDbErrorMassage;
      const resultCodeDataExisted = environment.resultCodeDataExisted;
      const resultDescriptionDataExistedTitle = environment.resultDescriptionDataExistedTitle;
      const resultDescriptionDataExistedMassage = environment.resultDescriptionDataExistedMassage;
      console.log(this.editDataGroups)
      if (requiredData) {
        let addData: any = {
          ...this.editDataGroups,
          // "image":this.filePicture
        };
        if (this.pageType === 'edit') {
          for (const [key, value] of Object.entries(addData)) {
            if (addData[key] == this.cloneData[key])
              delete addData[key]
          }
          addData.finishedProductId = this.Id
        }
        if (this.editDataGroups.uom == 'Box' || this.editDataGroups.uom == 'Bottle') {
          addData['supplyDay'] = null
        } else if (this.editDataGroups.uom == 'Pack') {
          addData['quantity'] = null
          addData['unit'] = null
        } else {
          addData['supplyDay'] = null
          addData['quantity'] = null
          addData['unit'] = null
        }
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
            this.goAlert(response.resultCode, response.resultDescription, 'myModalError');
          }
        } else {
          if (_.isEqual(this.editDataGroups, this.cloneData)) {
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
    this.router.navigate(['/master-data-management', 'finished-products']);
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
    let textAreaAutoHeight = this.common.textAreaAutoHeightFn();
  }

  onInput(id, key) {
    const elm: any = document.getElementById(id);
    this.editDataGroups[key] = elm.value || '';
  }
}
