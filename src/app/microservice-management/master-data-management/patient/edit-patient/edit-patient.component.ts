import {Component, OnInit, AfterViewInit, ViewChild} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
// import { LayoutMenu } from '../../../shared/store/layout.menu.store';
import {GlobalVariable} from './edit-patient.global';
import {Request} from '../../../../shared/services/request.service';
import {Common} from '../../../../shared/services/common.service';
import {FormGroup, FormBuilder, FormControl, Validators, FormArray} from '@angular/forms';
import {DxTreeListComponent} from 'devextreme-angular';
import {environment} from '../../../../../environments/environment';
import * as _ from 'lodash';
import {CompareService} from '../../../../shared/services/compare.service';
import {StoreService} from '../../../../shared/services/store.service';
import * as moment from 'moment';
import CustomStore from 'devextreme/data/custom_store';

@Component({
  selector: 'app-edit-patient',
  providers: [Request, Common, CompareService],
  templateUrl: './edit-patient.component.html',
  styleUrls: ['./edit-patient.component.scss'],
})
export class EditPatientComponent implements OnInit, AfterViewInit {

  @ViewChild('myModal') myModal;
  @ViewChild(DxTreeListComponent) treeList: DxTreeListComponent;
  editDataGroups: any = {
    locationDetail: '',
    patientAddress: [
      {
        isFavorite: true,
        addressType: 0,
        address: '',
        district: '',
        subdistrict: '',
        province: '',
        postcode: ''
      }
    ]
  };
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
  addressArr = []
  sexList: any;
  addressTypeList: any;
  otherAddressTypeList: any;
  deletedAddressArr = []

  needForceCreateMainAddress = false;

  ddlTitle: any
  title: any;
  ddlPreferredLanguage: any
  preferredLanguage: any;
  ddlNationality: any
  nationality: any;
  ddlAddress: any
  address: any;
  ddlDistrict: any;
  ddlSubdistrict: any;
  ddlProvince: any;
  ddlPostcode: any;
  now: Date;
  role: string;
  locationDetailList = [];

  constructor(public router: Router,
              private fb: FormBuilder,
              private request: Request,
              public common: Common,
              private route: ActivatedRoute,
              private store: StoreService) {
    this.editGroupForm = this.fb.group({
      'txtHn': new FormControl('', [Validators.required]),
      'txtPreferredLanguage': new FormControl('', [Validators.required]),
      'txtTitle': new FormControl('', [Validators.required]),
      'txtGivenName': new FormControl('', [Validators.required]),
      'txtOtherName': new FormControl(''),
      'txtDistrict': new FormControl(''),
      'txtSurname': new FormControl('', [Validators.required]),
      'txtSex': new FormControl('', [Validators.required]),
      'txtDateOfBirth': new FormControl('', [Validators.required]),
      'txtPostcode': new FormControl(''),
      'txtNationality': new FormControl(''),
      'txtPhone': new FormControl(''),
      'txtAddressType': new FormControl({value: 0, disabled: true}),
      'txtAddress': new FormControl(''),
      'txtSubdistrict': new FormControl(''),
      'txtProvince': new FormControl(''),
      'locationDetail': new FormControl(''),
      'rdoLocationType': new FormControl(1),
      'otherAddress': this.fb.array([])
    });
  }

  get formOtherAddress(): FormArray {
    return this.editGroupForm.controls['otherAddress'] as FormArray;
  }

  async ngOnInit() {
    this.now = new Date();
    this.ddlTitle = await this.customStoreTitle();
    this.ddlPreferredLanguage = await this.customStorePreferredLanguage();
    this.ddlNationality = await this.customStoreNationality();
    this.ddlDistrict = await this.customStoreAddress('district');
    this.ddlSubdistrict = await this.customStoreAddress('subdistrict');
    this.ddlProvince = await this.customStoreAddress('province');
    this.ddlPostcode = await this.customStoreAddress('postcode');
    const dropdown = await this.common.searchConfig();
    this.sexList = await dropdown.sexList || [];
    this.addressTypeList = await dropdown.addressTypeList || [];
    this.otherAddressTypeList = _.cloneDeep(this.addressTypeList)
    this.otherAddressTypeList.shift();
    this.editDataGroups.patientAddress = [{
      isFavorite: true,
      addressType: 0,
      address: '',
      district: '',
      subdistrict: '',
      province: '',
      postcode: ''
    }]

    try {
      if (sessionStorage.getItem('role')) {
        this.role = sessionStorage.getItem('role');
      }
      console.log('this.role', this.role);
      this.store.subscribePagePermissionList().subscribe(pagePermissionList => {
        console.log("ngOnInit", pagePermissionList);
        let pagePermission = pagePermissionList.find(r => r.url === GlobalVariable.ROLE_URL);
        if (pagePermission) {
          try {
            this.menuPermissions = JSON.parse(pagePermission.menuPermissions)
            console.log("this.menuPermissions ::::" + this.menuPermissions)
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
      if (sessionStorage.getItem('role')) {
        this.role = sessionStorage.getItem('role');
      }
      console.log('this.role', this.role);
      await this.getDDLLocationDetail();
      await this.route.params.subscribe(async params => {
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
          await this.getApiEdit();
        } else {
          this.editDataGroups.locationType = 1
        }
        if (this.pageType === 'view') {
          this.editGroupForm.controls['txtHn'].disable();
          this.editGroupForm.controls['txtPreferredLanguage'].disable();
          this.editGroupForm.controls['txtTitle'].disable();
          this.editGroupForm.controls['txtGivenName'].disable();
          this.editGroupForm.controls['txtOtherName'].disable();
          this.editGroupForm.controls['txtSurname'].disable();
          this.editGroupForm.controls['txtSex'].disable();
          this.editGroupForm.controls['txtDateOfBirth'].disable();
          this.editGroupForm.controls['txtNationality'].disable();
          this.editGroupForm.controls['txtPhone'].disable();
          this.editGroupForm.controls['txtAddress'].disable();
          this.editGroupForm.controls['txtDistrict'].disable();
          this.editGroupForm.controls['txtSubdistrict'].disable();
          this.editGroupForm.controls['txtProvince'].disable();
          this.editGroupForm.controls['txtPostcode'].disable();
          this.editGroupForm.controls['locationDetail'].disable();
          this.editGroupForm.controls['rdoLocationType'].disable();
          const itemControls = <FormArray>this.editGroupForm.controls['otherAddress'];

          for (let index = 0; index < this.formOtherAddress.length; index++) {
            let element = <FormGroup>itemControls.controls[index];
            for (const key in element.controls) {
              element.controls[key].disable();
            }
          }
        } else {
          this.editGroupForm.controls['txtHn'].enable();
          this.editGroupForm.controls['txtPreferredLanguage'].enable();
          this.editGroupForm.controls['txtTitle'].enable();
          this.editGroupForm.controls['txtGivenName'].enable();
          this.editGroupForm.controls['txtOtherName'].enable();
          this.editGroupForm.controls['txtSurname'].enable();
          this.editGroupForm.controls['txtSex'].enable();
          this.editGroupForm.controls['txtDateOfBirth'].enable();
          this.editGroupForm.controls['txtNationality'].enable();
          this.editGroupForm.controls['txtPhone'].enable();
          this.editGroupForm.controls['txtAddress'].enable();
          this.editGroupForm.controls['txtDistrict'].enable();
          this.editGroupForm.controls['txtSubdistrict'].enable();
          this.editGroupForm.controls['txtProvince'].enable();
          this.editGroupForm.controls['txtPostcode'].enable();
          this.editGroupForm.controls['rdoLocationType'].enable();

          if (this.common.isRoleClinics(this.role)) {
            this.editDataGroups.locationType = 2;
            this.editGroupForm.controls['locationDetail'].setValidators(Validators.required);
            this.editGroupForm.controls['locationDetail'].updateValueAndValidity();
            this.editGroupForm.controls['rdoLocationType'].disable();
            this.editGroupForm.controls['txtHn'].disable();
          }
          if (this.pageType === 'edit') {
            this.editGroupForm.controls['rdoLocationType'].disable();
            this.editGroupForm.controls['locationDetail'].disable();
            if (this.editDataGroups.locationType === 2) {
              this.editGroupForm.controls['txtHn'].disable();
            }
          }
        }

      });
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
        patientId: this.Id,
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
        
        if (!this.editDataGroups.patientAddress || this.editDataGroups.patientAddress.length === 0) {
          this.editDataGroups.patientAddress = [{
            isFavorite: true,
            addressType: 0,
            address: null,
            district: null,
            subdistrict: null,
            province: null,
            postcode: null
          }];
          this.needForceCreateMainAddress = true;
        } else {
          let index = this.editDataGroups.patientAddress.findIndex(i => i.addressType === 0);
          
          if (index === -1) {
            let mainAddress = {
              isFavorite: true,
              addressType: 0,
              address: '',
              district: '',
              subdistrict: '',
              province: '',
              postcode: ''
            };
            this.editDataGroups.patientAddress = [mainAddress, ...this.editDataGroups.patientAddress];
            this.needForceCreateMainAddress = true;
          } else {
            let mainAddreess = this.editDataGroups.patientAddress[index];
            this.editDataGroups.patientAddress.splice(index, 1);
            this.editDataGroups.patientAddress = [mainAddreess, ...this.editDataGroups.patientAddress];
            this.needForceCreateMainAddress = false;
          }
        }
        this.editDataGroups.patientAddress.forEach(element => {
          if (element.addressType === null || element.addressType === undefined) {
            element.addressType = undefined;
          }
        });

        this.editDataGroups.dateOfBirth = moment(this.editDataGroups.dateOfBirth, 'YYYY-MM-DD HH:mm:ss').format('YYYY-MM-DD')

        this.cloneData = _.cloneDeep(this.editDataGroups)

        if (this.editDataGroups.patientAddress && this.editDataGroups.patientAddress.length > 1) {
          for (let index = 1; index < this.editDataGroups.patientAddress.length; index++) {
            const element = this.editDataGroups.patientAddress[index] || {};
            this.formOtherAddress.push(this.fb.group({
              txtOtherAddressType: new FormControl(element.addressType || ''),
              txtOtherAddress: new FormControl(element.address || ''),
              txtOtherDistrict: new FormControl(element.district || ''),
              txtOtherSubdistrict: new FormControl(element.subdistrict || ''),
              txtOtherProvince: new FormControl(element.province || ''),
              txtOtherPostcode: new FormControl(element.postcode || ''),
              txtRemark: new FormControl(element.remark || ''),
            }));
          }
        }


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
      // const resultDescriptionSystemErrorTitle = environment.resultDescriptionSystemErrorTitle;
      // const resultDescriptionSystemErrorMassage = environment.resultDescriptionSystemErrorMassage;
      // this.goAlert(resultDescriptionSystemErrorTitle, resultDescriptionSystemErrorMassage, 'myModalError');
    }
  }

  async getRunningPatient(hn) {
    try {
      const checkUrl = this.common.checkMockupUrl('', '', {hn}, {
        BASE_API: '',
        BASE_MODULE: environment.apiPrefix,
        BASE_RESOURCE: environment.searchRunningPatient
      });

      const response = await this.request.get(checkUrl.url, checkUrl.filter);
      if (response.resultCode === environment.resultCodeSuccess) {
        return response.resultData;
      }
    } catch (e) {
      return '';
    }
  }

  async getDDLLocationDetail() {
    try {
      let filter = {};
      if (this.common.isRoleClinics(this.role)) {
        filter = {
          role: this.role
        };
      }
      const checkUrl = this.common.checkMockupUrl('', '', filter, {
        BASE_API: '',
        BASE_MODULE: environment.apiPrefix,
        BASE_RESOURCE: environment.searchDdlLocationDetail
      });

      const response = await this.request.get(checkUrl.url, checkUrl.filter);
      if (response.resultCode === environment.resultCodeSuccess) {
        this.locationDetailList = response.resultData || [];
      }
    } catch (e) {
      this.locationDetailList = [];
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
      console.log(this.editDataGroups)
      const requiredData: boolean = this.checkRequiredData();

      if (requiredData) {

        let addData = _.cloneDeep(this.editDataGroups)
        addData.dateOfBirth = moment(addData.dateOfBirth).format('YYYY-MM-DD')
        addData.sex = +addData.sex
        for (let index = 0; index < this.editDataGroups.patientAddress.length; index++) {
          const element = this.editDataGroups.patientAddress[index];
          element.isFavorite = element.isFavorite ? 1 : 0
        }

        if (this.pageType === 'edit') {
          if (this.needForceCreateMainAddress) {
            if (!Array.isArray(addData.patientAddress)) {
              addData.patientAddress = [];
            }
            const mainFromUi = (this.editDataGroups && Array.isArray(this.editDataGroups.patientAddress) && this.editDataGroups.patientAddress[0])
              ? _.cloneDeep(this.editDataGroups.patientAddress[0])
              : {
                isFavorite: true,
                addressType: 0,
                address: null,
                district: null,
                subdistrict: null,
                province: null,
                postcode: null
              };
            mainFromUi.addressType = 0;
            mainFromUi.isFavorite = mainFromUi.isFavorite ? 1 : 0;
            if (!mainFromUi.patientAddressId) {
              mainFromUi.method = 'create';
            }
            addData.patientAddress[0] = mainFromUi;
          }

          for (const [key] of Object.entries(addData)) {
            if (addData[key] == this.cloneData[key])
              delete addData[key]
          }

          if (_.isEqual(addData.patientAddress, this.cloneData.patientAddress)) {
            delete addData.patientAddress
          } else {
            for (let index = 0; index < this.editDataGroups.patientAddress.length; index++) {
              const element = this.editDataGroups.patientAddress[index];
              if (element.patientAddressId) {
                let rrr = this.cloneData.patientAddress.find(r => r.patientAddressId == element.patientAddressId);
                if (!_.isEqual(element, rrr)) {
                  addData.patientAddress[index].method = 'update'
                } else {
                  addData.patientAddress[index].method = 'none'
                }
              }
            }
            addData.patientAddress = addData.patientAddress.filter(function (e) {
              return e.method !== 'none'
            })
          }


          if (this.deletedAddressArr.length > 0) {
            for (let index = 0; index < this.deletedAddressArr.length; index++) {
              const element = this.deletedAddressArr[index];
              addData.patientAddress.push(element)
            }
          }

          if (Object.keys(addData).length == 0 && !addData.patientAddress) {
            addData.notSend = true
          }
          addData.patientId = this.Id
        }


        if (this.pageType === 'edit') {
          const hadType0InClone = (this.cloneData && this.cloneData.patientAddress)
            ? this.cloneData.patientAddress.some(a => a && a.addressType === 0)
            : false;
          if (!hadType0InClone && addData.patientAddress && addData.patientAddress[0]) {
            if (addData.patientAddress[0].addressType === undefined || addData.patientAddress[0].addressType === null) {
              addData.patientAddress[0].addressType = 0;
            }
            if (!addData.patientAddress[0].patientAddressId) {
              addData.patientAddress[0].method = 'create';
            }
          }
        }

        if (Array.isArray(addData.patientAddress)) {
          addData.patientAddress = addData.patientAddress.map((addr) => {
            if (addr && !addr.patientAddressId && addr.addressType === 0) {
              return { ...addr, method: 'create' };
            }
            return addr;
          });
        }

        if (addData.patientAddress && addData.patientAddress.length > 0) {
          addData.patientAddress = addData.patientAddress.filter((obj) => {
            if (obj.addressType === 0) {
              return obj;
            } else {
              if (obj.address || obj.addressType
                || obj.district || obj.isFavorite
                || obj.postcode || obj.province
                || obj.remark || obj.subdistrict
              ) {
                return obj;
              }
            }
          });
        }

        let checkUrl = null;
        let response: any;
        const resultCodeSuccess = environment.resultCodeSuccess;
        if (this.pageType === 'new') {
          checkUrl = this.common.checkMockupUrl('', GlobalVariable.RESOURCE, {}, {
            BASE_API: GlobalVariable.BASE_API,
            BASE_MODULE: GlobalVariable.BASE_MODULE,
            BASE_RESOURCE: GlobalVariable.BASE_RESOURCE + GlobalVariable.BASE_RESOURCE_CREATE
          });
          response = await this.request.post(checkUrl.url, addData);
          if (response.resultCode === resultCodeSuccess) {
            this.goAlert('', '', 'myModalSuccess');
          } else if (response.resultCode === environment.resultCodeDataExisted) {
            if (addData.locationType === 1) {
              this.goAlert(response.resultCode, response.resultDescription, 'myModalError');
            } else {
              this.goAlert('HN is duplicate', 'Due to simultaneous access, please try again.', 'myModalWarning');
              await this.checkPatientName();
            }
          } else {
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
            } else {
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

    const itemControls = <FormArray>this.editGroupForm.controls['otherAddress'];

    for (let index = 0; index < this.formOtherAddress.length; index++) {
      let element = <FormGroup>itemControls.controls[index];
      for (const key in element.controls) {
        if (element.controls[key].errors) {
          element.controls[key].setErrors({'forceRequired': true});
          element.controls[key].markAsDirty();
        } else {
          element.controls[key].updateValueAndValidity();
        }
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
    this.router.navigate(['/master-data-management', 'patient']);
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

  clickCollapse(id: string) {
    this.common.collapseFnById(id);
  }

  addAddress() {
    this.formOtherAddress.push(this.fb.group({
      txtOtherAddressType: new FormControl(''),
      txtOtherAddress: new FormControl(''),
      txtOtherDistrict: new FormControl(''),
      txtOtherSubdistrict: new FormControl(''),
      txtOtherProvince: new FormControl(''),
      txtOtherPostcode: new FormControl(''),
      txtRemark: new FormControl('')
    }));
    if (this.pageType === 'edit') {
      this.editDataGroups.patientAddress.push({
        isFavorite: false,
        addressType: undefined,
        address: null,
        district: null,
        subdistrict: null,
        province: null,
        postcode: null,
        method: 'create'
      });
    } else {
      this.editDataGroups.patientAddress.push({
        isFavorite: false,
        addressType: undefined,
        address: null,
        district: null,
        subdistrict: null,
        province: null,
        postcode: null
      });
    }
  }

  deleteAddress(i: number) {
    if (!this.editDataGroups.patientAddress || !this.editDataGroups.patientAddress[i + 1]) {
      return;
    }
    
    if (this.editDataGroups.patientAddress[i + 1].isFavorite) {
      if (this.editDataGroups.patientAddress[0]) {
        this.editDataGroups.patientAddress[0].isFavorite = true;
      }
    }
    
    if (this.editDataGroups.patientAddress[i + 1].patientAddressId) {
      let deleteDaata = this.editDataGroups.patientAddress[i + 1];
      deleteDaata.method = 'delete';
      this.deletedAddressArr.push(deleteDaata);
    }
    
    this.editDataGroups.patientAddress.splice(i + 1, 1);
    this.formOtherAddress.removeAt(i);
  }

  fnCheckFavorite(i: number) {
    if (!this.editDataGroups.patientAddress || !this.editDataGroups.patientAddress[i]) {
      return;
    }
    
    for (let index = 0; index < this.editDataGroups.patientAddress.length; index++) {
      const element = this.editDataGroups.patientAddress[index];
      if (this.editDataGroups.patientAddress[i].isFavorite && index !== i && element && element.isFavorite) {
        element.isFavorite = false;
      }
    }
  }

  customStoreTitle() {
    const dataSource: any = {};

    dataSource.store = new CustomStore({
      load: (loadOptions: any) => {
        // console.log('loadOption : ', loadOptions);
        let filterData: any = {
          name: loadOptions.searchValue
        };
        // console.log('filterData : ', filterData);

        const checkUrl = this.common.checkMockupUrl('', '', filterData, {
          BASE_API: '',
          BASE_MODULE: environment.apiPrefix,
          BASE_RESOURCE: environment.searchDdl + GlobalVariable.BASE_RESOURCE_GET_DDL_TITLE
        });


        return this.request.get(checkUrl.url, checkUrl.filter)
          .then(response => {
            if (response) {

              let resResultCode = response.resultCode;
              const resultCodeSuccess = environment.resultCodeSuccess;
              if (resResultCode === resultCodeSuccess) {
                let resultData = response.resultData
                resultData = resultData.map((r, i) => {
                  return {...r, id: i}
                })
                this.title = resultData;
              }
            }
            return {
              data: this.title,
            };
          })
          .catch(() => {
            setTimeout(() => {
            }, 200);

            return {
              data: [],
            };
          });

      },
    });
    // console.log(dataSource);
    return dataSource;
  }

  customStorePreferredLanguage() {
    const dataSource: any = {};

    dataSource.store = new CustomStore({
      load: (loadOptions: any) => {
        // console.log('loadOption : ', loadOptions);
        let filterData: any = {
          name: loadOptions.searchValue
        };
        // console.log('filterData : ', filterData);

        const checkUrl = this.common.checkMockupUrl('', '', filterData, {
          BASE_API: '',
          BASE_MODULE: environment.apiPrefix,
          BASE_RESOURCE: environment.searchDdl + GlobalVariable.BASE_RESOURCE_GET_DDL_PREFERRED_LANGUAGE
        });


        return this.request.get(checkUrl.url, checkUrl.filter)
          .then(response => {
            if (response) {

              let resResultCode = response.resultCode;
              const resultCodeSuccess = environment.resultCodeSuccess;
              if (resResultCode === resultCodeSuccess) {
                let resultData = response.resultData
                resultData = resultData.map((r, i) => {
                  return {...r, id: i}
                })
                this.preferredLanguage = resultData;
              }
            }
            return {
              data: this.preferredLanguage,
            };
          })
          .catch(() => {
            setTimeout(() => {
            }, 200);

            return {
              data: [],
            };
          });

      },
    });
    // console.log(dataSource);
    return dataSource;
  }

  customStoreNationality() {
    const dataSource: any = {};

    dataSource.store = new CustomStore({
      load: (loadOptions: any) => {
        // console.log('loadOption : ', loadOptions);
        let filterData: any = {
          name: loadOptions.searchValue
        };
        // console.log('filterData : ', filterData);

        const checkUrl = this.common.checkMockupUrl('', '', filterData, {
          BASE_API: '',
          BASE_MODULE: environment.apiPrefix,
          BASE_RESOURCE: environment.searchDdl + GlobalVariable.BASE_RESOURCE_GET_DDL_NATIONALITY
        });


        return this.request.get(checkUrl.url, checkUrl.filter)
          .then(response => {
            if (response) {

              let resResultCode = response.resultCode;
              const resultCodeSuccess = environment.resultCodeSuccess;
              if (resResultCode === resultCodeSuccess) {
                let resultData = response.resultData
                resultData = resultData.map((r, i) => {
                  return {...r, id: i}
                })
                this.nationality = resultData;
              }
            }
            return {
              data: this.nationality,
            };
          })
          .catch(() => {
            setTimeout(() => {
            }, 200);

            return {
              data: [],
            };
          });

      },
    });
    // console.log(dataSource);
    return dataSource;
  }

  customStoreAddress(params: string) {
    const dataSource: any = {};

    dataSource.store = new CustomStore({
      load: (loadOptions: any) => {
        // console.log('loadOption : ', loadOptions);
        let filterData: any = {};

        filterData[params] = loadOptions.searchValue
        // console.log('filterData : ', filterData);

        const checkUrl = this.common.checkMockupUrl('', '', filterData, {
          BASE_API: '',
          BASE_MODULE: environment.apiPrefix,
          BASE_RESOURCE: environment.searchDdl + GlobalVariable.BASE_RESOURCE_GET_DDL_ADDRESS
        });


        return this.request.get(checkUrl.url, checkUrl.filter)
          .then(response => {
            if (response) {

              let resResultCode = response.resultCode;
              const resultCodeSuccess = environment.resultCodeSuccess;
              if (resResultCode === resultCodeSuccess) {
                let resultData = response.resultData
                resultData = resultData.map((r, i) => {
                  return {...r, id: i}
                })
                this.address = resultData;
              }
            }
            return {
              data: this.address,
            };
          })
          .catch(() => {
            setTimeout(() => {
            }, 200);

            return {
              data: [],
            };
          });

      },
    });
    // console.log(dataSource);
    return dataSource;
  }

  updateValueAutoComplete(e: any, type: string) {
    console.log('type', type);
    console.log('e.itemData.name', e.itemData.name);
    this.editDataGroups[type] = e.itemData.name
  }

  onFocusOut(e, key, keyInput) {
    const inputValue = e.event.target.value;
    if (inputValue !== this.editDataGroups[key]) {
      if (inputValue === '') {
        this.editGroupForm.controls[keyInput].reset('');
        this.editDataGroups[key] = '';
      } else {
        this.editGroupForm.controls[keyInput].reset(this.editDataGroups[key]);
      }
    }
  }

  deleteValueAutoComplete(e: any, type: string) {
    console.log('e.value', e.value);
    if (e.value == null) {
      this.editDataGroups[type] = null
    } else {
      this.editDataGroups[type] = e.value.name || e.value;
    }
  }

  updateAddressAutoComplete(e: any, index: number) {
    if (!this.editDataGroups.patientAddress || !this.editDataGroups.patientAddress[index] || !e.itemData) {
      return;
    }
    
    console.log(e.itemData);
    console.log(this.editDataGroups.patientAddress[index].postcode);
    this.editDataGroups.patientAddress[index].district = e.itemData.district;
    this.editDataGroups.patientAddress[index].subdistrict = e.itemData.subdistrict;
    this.editDataGroups.patientAddress[index].province = e.itemData.province;
    this.editDataGroups.patientAddress[index].postcode = e.itemData.postcode;
    console.log(this.editDataGroups.patientAddress[index].postcode);
  }

  deleteAddressAutoComplete(e: any, index: number, type: string) {
    if (!this.editDataGroups.patientAddress || !this.editDataGroups.patientAddress[index] || !e.value) {
      return;
    }
    
    if (e.value[type]) {
      this.editDataGroups.patientAddress[index][type] = e.value[type];
    }
  }

  changeLocationType() {
    if (this.editDataGroups.locationType === 2) {
      this.editDataGroups.hn = ''
      this.editGroupForm.controls['locationDetail'].enable();
      this.editGroupForm.controls['locationDetail'].setValidators(Validators.required)
      this.editGroupForm.controls['locationDetail'].updateValueAndValidity();
      this.editGroupForm.controls['txtHn'].disable();
      this.checkPatientName()
    } else {
      this.editDataGroups.hn = ''
      this.editDataGroups.locationDetail = ''
      this.editGroupForm.controls['locationDetail'].setValidators(null)
      this.editGroupForm.controls['locationDetail'].updateValueAndValidity();
      this.editGroupForm.controls['txtHn'].enable();
    }
  }

  async checkPatientName() {
    if (this.editDataGroups.givenName && this.editDataGroups.surname && this.editDataGroups.locationType === 2 && this.pageType === 'new') {
      // tslint:disable-next-line:max-line-length
      const prefix = this.editDataGroups.givenName[0] + this.editDataGroups.surname[0];
      // const prefix = this.editDataGroups.givenName[0] + this.editDataGroups.givenName[this.editDataGroups.givenName.length - 1];
      const runningNo = await this.getRunningPatient(prefix);
      this.editDataGroups.hn = prefix.toUpperCase() + runningNo;
    }
  }
}
