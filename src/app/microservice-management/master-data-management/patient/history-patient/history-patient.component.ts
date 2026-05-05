import { Component, OnInit, AfterViewInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
// import { LayoutMenu } from '../../../shared/store/layout.menu.store';
import { GlobalVariable } from './history-patient.global';
import { Request } from '../../../../shared/services/request.service';
import { Common } from '../../../../shared/services/common.service';
import { FormBuilder } from '@angular/forms';
import { environment } from '../../../../../environments/environment';
import * as _ from 'lodash';
import { CompareService } from '../../../../shared/services/compare.service';
import { StoreService } from '../../../../shared/services/store.service';
import * as moment from 'moment';

@Component({
  selector: 'app-history-patient',
  providers: [Request, Common, CompareService],
  templateUrl: './history-patient.component.html',
  styleUrls: ['./history-patient.scss'],
  encapsulation: ViewEncapsulation.None
})
export class HistoryPatientComponent implements OnInit, AfterViewInit {

  @ViewChild('myModal') myModal;
  historyData: any = {
  };
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
  menuPermissions: any = { view: true, add: true, edit: true, delete: true }
  patientName: any;
  mainAddress: any;
  addressTypeMapByName = {}
  addressTypeMapById = {}
  sexListMapById = {};
  constructor(public router: Router,
    private fb: FormBuilder,
    private request: Request,
    private common: Common,
    private route: ActivatedRoute,
    private store: StoreService,) {
  }

  async ngOnInit() {
    try {
      const dropdown = await this.common.searchConfig();
      for (const addressType of dropdown.addressTypeList) {
        this.addressTypeMapByName[addressType.name] = addressType.id;
        this.addressTypeMapById[addressType.id] = addressType.name;
      }
      for (const sex of dropdown.sexList) {
        this.sexListMapById[sex.id] = sex.name;
      }
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
      await this.route.params.subscribe(params => {
        this.loading = false;
        this.disbledBtn = {
          'save': false,
          'cancel': false
        };
        console.log(":params", params);
        this.pageType = params.type ? params.type : 'new'
        this.Id = params.id;
        this.getApiHistory();
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

  async getApiHistory() {
    try {
      this.loading = true;
      let filterData = {
        patientId: this.Id,
        orderby: 'createdAt|DESC',
      };

      const checkUrl = this.common.checkMockupUrl('', '', filterData, {
        BASE_API: GlobalVariable.BASE_API,
        BASE_MODULE: GlobalVariable.BASE_MODULE,
        BASE_RESOURCE: GlobalVariable.BASE_RESOURCE + GlobalVariable.BASE_RESOURCE_GET_HISTORY
      });


      const resultCodeSuccess = environment.resultCodeSuccess;

      let response = await this.request.get(checkUrl.url, checkUrl.filter);
      if (response.resultCode === resultCodeSuccess) {
        this.historyData = await response.resultData;
        let n = this.historyData.find(x => x.patientName)
        this.patientName = n.patientName

        this.historyData.forEach(element => {
          element.dateOfBirth = element.dateOfBirth ? moment(element.dateOfBirth).format("DD/MM/YYYY") : ""
          element.createdAt = element.createdAt ? moment(element.createdAt).format("DD/MM/YYYY") : ""
          if (element.patientAddress.length > 0) {
            let index = element.patientAddress.findIndex(i => i.addressType === "0")
            if (index >= 0) {
              element.mainAddress = {
                address: element.patientAddress[index].address,
                addressType: this.addressTypeMapById[element.patientAddress[index].addressType],
                district: element.patientAddress[index].district,
                isFavorite: element.patientAddress[index].isFavorite,
                postcode: element.patientAddress[index].postcode,
                province: element.patientAddress[index].province,
                remark: element.patientAddress[index].remark,
                subdistrict: element.patientAddress[index].subdistrict,
              }
              element.patientAddress.splice(index, 1)
            }

            for (let index = 0; index < element.patientAddress.length; index++) {
              const element2 = element.patientAddress[index];
              element2.addressType =  this.addressTypeMapById[element2.addressType]
            }
          }
        });
      }
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
}
