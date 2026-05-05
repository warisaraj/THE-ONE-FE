import { Component, OnInit, AfterViewInit, ElementRef, Input, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { GlobalVariable } from './dashboard.global';
import { Request } from '../../../shared/services/request.service';
import { Common } from '../../../shared/services/common.service';
import { FormGroup, FormBuilder, FormControl, Validators } from '@angular/forms';
import { environment } from '../../../../environments/environment';
import * as moment from 'moment';
declare let $: any;
import * as _ from 'lodash';
import { CompareService } from '../../../shared/services/compare.service';
import { StoreService } from '../../../shared/services/store.service';
@Component({
  selector: 'app-dashboard',
  providers: [Request, Common, CompareService],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashBoardComponent implements OnInit, AfterViewInit {

  

  customizeText(arg) {
    return `${arg.argument},${arg.value}`;
  }
  customizeTextOnTimeChart(arg) {
    return `${arg.value}`;
  }
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
  Mount: any = new Date();
  dataReport: any = {
    averageCase: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    averageMonth2Case: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    averageMonth2D: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    numberNo: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    numberYes: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ontimeNo: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ontimeYes: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    percentOnTime: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    packMed: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    percentUrgent: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    supplement: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    supplyDay: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    supplyMonth: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    totalCase: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    urgent: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    overschedule: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    overtime: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  };

  energySources = [
    { value: 'value', name: 'value' },
  ];

  valuePerMonth = [{
    month: 'Jan',
    value: 0,
  }, {
    month: 'Feb',
    value: 0,
  }, {
    month: 'Mar',
    value: 0,
  }, {
    month: 'Apr',
    value: 0,
  }, {
    month: 'May',
    value: 0,
  }, {
    month: 'Jun',
    value: 0,
  }, {
    month: 'Jul',
    value: 0,
  }, {
    month: 'Aug',
    value: 0,
  }, {
    month: 'Sep',
    value: 0,
  }, {
    month: 'Oct',
    value: 0,
  }, {
    month: 'Nov',
    value: 0,
  }, {
    month: 'Dec',
    value: 0,
  }];
  valueSupplyMonth = [{
    month: 'Jan',
    value: 0,
  }, {
    month: 'Feb',
    value: 0,
  }, {
    month: 'Mar',
    value: 0,
  }, {
    month: 'Apr',
    value: 0,
  }, {
    month: 'May',
    value: 0,
  }, {
    month: 'Jun',
    value: 0,
  }, {
    month: 'Jul',
    value: 0,
  }, {
    month: 'Aug',
    value: 0,
  }, {
    month: 'Sep',
    value: 0,
  }, {
    month: 'Oct',
    value: 0,
  }, {
    month: 'Nov',
    value: 0,
  }, {
    month: 'Dec',
    value: 0,
  }];
  valueUrgent= [{
    month: 'Jan',
    value: 0,
  }, {
    month: 'Feb',
    value: 0,
  }, {
    month: 'Mar',
    value: 0,
  }, {
    month: 'Apr',
    value: 0,
  }, {
    month: 'May',
    value: 0,
  }, {
    month: 'Jun',
    value: 0,
  }, {
    month: 'Jul',
    value: 0,
  }, {
    month: 'Aug',
    value: 0,
  }, {
    month: 'Sep',
    value: 0,
  }, {
    month: 'Oct',
    value: 0,
  }, {
    month: 'Nov',
    value: 0,
  }, {
    month: 'Dec',
    value: 0,
  }];
  OnTimeChart = [{
    month: 'Jan',
    value : 0
  }, {
    month: 'Feb',
    value : 0
  }, {
    month: 'Mar',
    value : 0
  }, {
    month: 'Apr',
    value : 0
  }, {
    month: 'May',
    value : 0
  }, {
    month: 'Jun',
    value : 0
  }, {
    month: 'Jul',
    value : 0
  }, {
    month: 'Aug',
    value : 0
  }, {
    month: 'Sep',
    value : 0
  }, {
    month: 'Oct',
    value : 0
  }, {
    month: 'Nov',
    value : 0
  }, {
    month: 'Dec',
    value : 0
  }];
  OnTimePercentChart = [{
    month: 'Jan',
    value : 0
  }, {
    month: 'Feb',
    value : 0
  }, {
    month: 'Mar',
    value : 0
  }, {
    month: 'Apr',
    value : 0
  }, {
    month: 'May',
    value : 0
  }, {
    month: 'Jun',
    value : 0
  }, {
    month: 'Jul',
    value : 0
  }, {
    month: 'Aug',
    value : 0
  }, {
    month: 'Sep',
    value : 0
  }, {
    month: 'Oct',
    value : 0
  }, {
    month: 'Nov',
    value : 0
  }, {
    month: 'Dec',
    value : 0
  }];
  delayChart= [{
    month: 'Jan',
    value : 0
  }, {
    month: 'Feb',
    value : 0
  }, {
    month: 'Mar',
    value : 0
  }, {
    month: 'Apr',
    value : 0
  }, {
    month: 'May',
    value : 0
  }, {
    month: 'Jun',
    value : 0
  }, {
    month: 'Jul',
    value : 0
  }, {
    month: 'Aug',
    value : 0
  }, {
    month: 'Sep',
    value : 0
  }, {
    month: 'Oct',
    value : 0
  }, {
    month: 'Nov',
    value : 0
  }, {
    month: 'Dec',
    value : 0
  }];
  numberChart = [{
    month: 'Jan',
    value : 0
  }, {
    month: 'Feb',
    value : 0
  }, {
    month: 'Mar',
    value : 0
  }, {
    month: 'Apr',
    value : 0
  }, {
    month: 'May',
    value : 0
  }, {
    month: 'Jun',
    value : 0
  }, {
    month: 'Jul',
    value : 0
  }, {
    month: 'Aug',
    value : 0
  }, {
    month: 'Sep',
    value : 0
  }, {
    month: 'Oct',
    value : 0
  }, {
    month: 'Nov',
    value : 0
  }, {
    month: 'Dec',
    value : 0
  }];
  valueOverSchedule= [{
    month: 'Jan',
    value: 0,
  }, {
    month: 'Feb',
    value: 0,
  }, {
    month: 'Mar',
    value: 0,
  }, {
    month: 'Apr',
    value: 0,
  }, {
    month: 'May',
    value: 0,
  }, {
    month: 'Jun',
    value: 0,
  }, {
    month: 'Jul',
    value: 0,
  }, {
    month: 'Aug',
    value: 0,
  }, {
    month: 'Sep',
    value: 0,
  }, {
    month: 'Oct',
    value: 0,
  }, {
    month: 'Nov',
    value: 0,
  }, {
    month: 'Dec',
    value: 0,
  }];
  valueOverTime= [{
    month: 'Jan',
    value: 0,
  }, {
    month: 'Feb',
    value: 0,
  }, {
    month: 'Mar',
    value: 0,
  }, {
    month: 'Apr',
    value: 0,
  }, {
    month: 'May',
    value: 0,
  }, {
    month: 'Jun',
    value: 0,
  }, {
    month: 'Jul',
    value: 0,
  }, {
    month: 'Aug',
    value: 0,
  }, {
    month: 'Sep',
    value: 0,
  }, {
    month: 'Oct',
    value: 0,
  }, {
    month: 'Nov',
    value: 0,
  }, {
    month: 'Dec',
    value: 0,
  }];

  constructor(public router: Router,
    private fb: FormBuilder,
    private request: Request,
    private common: Common,
    private compare: CompareService,
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
      console.log("😍😍ngAfterViewInit");

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

      this.getApiProductionsummary();

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


  async getApiProductionsummary() {
    console.log("getApiProductionsummary");
    try {
      console.log("this.mount::", this.Mount);
      console.log("this.mount::", this.Mount.getFullYear().toString());
      let filterData = {
        orderDateYear: this.Mount.getFullYear().toString(),
      };

      const checkUrl = this.common.checkMockupUrl('', '', filterData, {
        BASE_API: GlobalVariable.BASE_API,
        BASE_MODULE: GlobalVariable.BASE_MODULE,
        BASE_RESOURCE: GlobalVariable.BASE_PRODUCTION_SUMMARY + GlobalVariable.PRODUCTION_SUMMARY
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

        this.dataReport = _.cloneDeep(response.data);
        console.log("this.dataReport:", this.dataReport);
        this.formatData(this.dataReport);
        // this.editDataGroups = response.resultData;
        // this.tempData = _.cloneDeep(this.editDataGroups)
        // console.log(this.editDataGroups);
      }
      // let response = await this.request.get(checkUrl.url, checkUrl.filter);

    } catch (e) {
      console.log(e);
      this.loading = false;
      this.dataReport = [];
      this.disbledBtn = {
        'save': false,
        'cancel': false
      };
      const resultDescriptionSystemErrorTitle = environment.resultDescriptionSystemErrorTitle;
      const resultDescriptionSystemErrorMassage = environment.resultDescriptionSystemErrorMassage;
      this.goAlert(resultDescriptionSystemErrorTitle, resultDescriptionSystemErrorMassage, 'myModalError');
    }
  }
  formatData(data: any) {
    console.log("formatData🤤🤤:::", data);
    for(let i=0;i<data.averageCase.length;i++){
      data.averageCase[i]=data.averageCase[i].toFixed(1);
    }
    for(let i=0;i<data.averageMonth2D.length;i++){
      data.averageMonth2D[i]=data.averageMonth2D[i].toFixed(1);
    }
    for(let i=0;i<data.averageMonth2Case.length;i++){
      data.averageMonth2Case[i]=data.averageMonth2Case[i].toFixed(2);
    }
    for(let i=0;i<data.percentDelayInReceiving.length;i++){
      data.percentDelayInReceiving[i]=data.percentDelayInReceiving[i].toFixed(2);
    }
    for(let i=0;i<data.percentUrgent.length;i++){
      data.percentUrgent[i]=data.percentUrgent[i].toFixed(2);
    }
    for(let i=0;i<data.ontimeYes.length;i++){
      data.ontimeYes[i]=data.ontimeYes[i].toFixed(1);
    }
    for(let i=0;i<data.percentOntime.length;i++){
      data.percentOntime[i]=data.percentOntime[i].toFixed(2);
    }
    for(let i=0;i<data.ontimeNo.length;i++){
      data.ontimeNo[i]=data.ontimeNo[i].toFixed(1);
    }
    for(let i=0;i<data.numberYes.length;i++){
      data.numberYes[i]=data.numberYes[i].toFixed(1);
    }
    for(let i=0;i<data.percentOverschedule.length;i++){
      data.percentOverschedule[i]=data.percentOverschedule[i].toFixed(2);
    }
    for(let i=0;i<data.percentOvertime.length;i++){
      data.percentOvertime[i]=data.percentOvertime[i].toFixed(2);
    }
    let dataValuePerMonth:any=[]
    for(let i=0;i<12;i++){
      let obj = {
        month:this.valuePerMonth[i]['month'],
        value:data.totalCase[i]
      }
      dataValuePerMonth.push(obj);
    }
    this.valuePerMonth= _.cloneDeep(dataValuePerMonth);
    let dataValueSupplyMonth:any=[]
    for(let i=0;i<12;i++){
      let obj = {
        month:this.valueSupplyMonth[i]['month'],
        value:data.supplyMonth[i]
      }
      dataValueSupplyMonth.push(obj);
    }
    this.valueSupplyMonth= _.cloneDeep(dataValueSupplyMonth);

    let dataValueUrgent:any=[]
    for(let i=0;i<12;i++){
      let obj = {
        month:this.valueUrgent[i]['month'],
        value:parseFloat(data.percentUrgent[i])
      }
      dataValueUrgent.push(obj);
    }
    this.valueUrgent= _.cloneDeep(dataValueUrgent);
    
    let dataOnTimeChart:any=[]
    for(let i=0;i<12;i++){
      let obj = {
        month:this.OnTimeChart[i]['month'],
        value:parseFloat(data.percentOntime[i])
      }
      dataOnTimeChart.push(obj);
    }
    this.OnTimeChart= _.cloneDeep(dataOnTimeChart);

    let dataDelayChart:any=[]
    for(let i=0;i<12;i++){
      let obj = {
        month:this.delayChart[i]['month'],
        value:parseFloat(data.percentDelayInReceiving[i])
      }
      dataDelayChart.push(obj);
    }
    this.delayChart= _.cloneDeep(dataDelayChart);
    
    let dataNumberChart:any=[]
    for(let i=0;i<12;i++){
      let obj = {
        month:this.numberChart[i]['month'],
        value:parseFloat(data.numberYes[i])
      }
      dataNumberChart.push(obj);
    }
    this.numberChart= _.cloneDeep(dataNumberChart);

    let dataValueOverSchedule:any=[]
    for(let i=0;i<12;i++){
      let obj = {
        month:this.valueOverSchedule[i]['month'],
        value:parseFloat(data.percentOverschedule[i])
      }
      dataValueOverSchedule.push(obj);
    }
    this.valueOverSchedule= _.cloneDeep(dataValueOverSchedule);

    let dataValueOverTime:any=[]
    for(let i=0;i<12;i++){
      let obj = {
        month:this.valueOverTime[i]['month'],
        value:parseFloat(data.percentOvertime[i])
      }
      dataValueOverTime.push(obj);
    }
    this.valueOverTime= _.cloneDeep(dataValueOverTime);
    
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

      if (requiredData) {
        let addData: any = {
          'binName': this.common.trimData(this.editDataGroups['binName']),
        };
        if (this.pageType === 'edit') {
          addData.binId = this.Id
        }

        let checkUrl = null;
        let response;
        if (this.pageType === 'new') {
          checkUrl = this.common.checkMockupUrl('', GlobalVariable.RESOURCE, {}, {
            BASE_API: GlobalVariable.BASE_API,
            BASE_MODULE: GlobalVariable.BASE_MODULE,
            BASE_RESOURCE: GlobalVariable.BASE_RESOURCE + GlobalVariable.BASE_RESOURCE_CREATE
          });
          response = await this.request.post(checkUrl.url, [addData]);
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
          }
        }

        let resultCodeSuccess = environment.resultCodeSuccess;
        let resultCodeMissingParameter = environment.resultCodeMissingParameter;
        let resultCodeDataNotFound = environment.resultCodeDataNotFound;

        const userMessageAlreadyExisted = response.userMessage;
        if (response.resultCode === resultCodeSuccess) {

          this.goAlert('', '', 'myModalSuccess');
        }
        // else if (response.resultCode === resultCodeDataNotFound) {
        //   this.goAlert(resultDescriptionDataNotFoundTitle, resultDescriptionDataNotFoundMassage, 'myModalError');
        // } else if (response.resultCode === resultCodeDataExisted) {
        //   this.goAlert(userMessageAlreadyExisted, resultDescriptionDataExistedMassage, 'myModalError');
        // } else if (response.resultCode === resultCodeDbError) {
        //   this.goAlert(resultDescriptionDbErrorTitle, resultDescriptionDbErrorMassage, 'myModalError');
        // }
        else {
          // this.goAlert(resultDescriptionSystemErrorTitle, resultDescriptionSystemErrorMassage, 'myModalError');
          this.goAlert(response.resultCode, response.resultDescription, 'myModalError');
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
    let textAreaAutoHeight = this.common.textAreaAutoHeightFn();
  }
}
