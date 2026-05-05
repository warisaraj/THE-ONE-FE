import { Component, OnInit, AfterViewInit, ElementRef, Input, ViewChild, ViewEncapsulation, ViewChildren, QueryList } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { GlobalVariable } from './edit-pharmacist.global';
import { Request } from '../../../../../shared/services/request.service';
import { Common } from '../../../../../shared/services/common.service';
import { FormGroup, FormBuilder, FormControl, Validators, FormArray, AbstractControl } from '@angular/forms';
import { environment } from '../../../../../../environments/environment';
import CustomStore from 'devextreme/data/custom_store';
import * as moment from 'moment';

declare let $: any;
import * as _ from 'lodash';
import { CompareService } from '../../../../../shared/services/compare.service';
import { StoreService } from '../../../../../shared/services/store.service';
import { CurrencyMaskConfig } from 'ngx-currency';
import { OnDestroy } from '@angular/core';
import { DxCheckBoxComponent } from 'devextreme-angular';
@Component({
  selector: 'app-edit-pharmacist',
  providers: [Request, Common, CompareService],
  templateUrl: './edit-pharmacist.component.html',
  styleUrls: ['./edit-pharmacist.scss'],
  encapsulation: ViewEncapsulation.None
})
export class EditPharmacistComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChildren(DxCheckBoxComponent) checkboxes!: QueryList<DxCheckBoxComponent>;
  @ViewChild('myModal') myModal;
  // @ViewChild(DxTreeListComponent) treeList: DxTreeListComponent;
  orderStatusMap = {};
  orderStatusList = [];
  orderStatusCheckError = ''
  printAllurl = null
  finishedProduct: any;
  searchHn: any;
  searchPatients: any;
  resFinished: any;
  resHn: any;
  estPrice: any = 0;
  resPatient: any;
  invalidMeal = false;
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
  invalidTotalCap = false;
  invalidCalculatedDay = false;
  configList: any = {};
  rawMatList: any = [];
  totalCap: any;
  order: any = {
    tariff: 1,
    hn: null,
    patientName: null,
    orderDate: new Date(),
    supplyDay: null,
    physician: null,
    totalCapPerDay: null,
    totalCapRemark: null,
    orderPharmacyNote: null,
    orderPharmacyNoteRemark: null,
    additionalNoteFromDoctor: null,
    orderCompound: [],
    orderDispensedPill: [],
    orderStatus: null
  };
  rawMaterialList = [];
  cpdExp = '';
  bbf = '';
  finishedProductList: any = [];
  packMedList: any = [];
  orderForm: FormGroup;
  microserviceId;
  microserviceGroupId;
  filterData: any = {};
  dispensedPill: any = [];
  detailList: any = [];
  orderPill: any = {};
  loading = true;
  saved = false;
  disbledBtn = {
    'save': true,
    'cancel': true
  };
  cloneSepTotalCap: any;
  capsuleList: any = [];
  priceList: any = [];
  emptyAr = [];
  microserviceMenuGroup = [];
  microserviceMenuGroupPermission = [];
  selectMenuParentId = [];
  selectMenuId = [];
  editSelectKey = [];
  currentSelectedRowsDataKey;
  currentSelectedRowsData;
  currentDeselectedRowKeys;
  microserviceName;
  minNow: Date = new Date();
  pageType: any = 'edit';
  Id: any = null;
  cloneAutoHn: any = null;
  cloneAutoPat: any = null;
  menuHome: any = false;
  menuPermissions: any = { view: false, add: false, edit: false, delete: false };
  currencyMaskOptions: CurrencyMaskConfig = {
    align: 'right',
    allowNegative: true,
    allowZero: true,
    decimal: '.',
    precision: 0,
    prefix: '',
    suffix: '',
    thousands: ',',
    nullable: true,
    min: null,
    max: null,
  };
  summary = 0;
  intervalUpdateWorkingBy;
  isDuplicateDispensedPill = {};
  isReorder = false;
  pharmacyNotes: any;
  isCollapseTariff = true;
  pharmacyNotesList = [];
  errorText: any;
  rawMatMapByCode = {};
  errorCompoundText: any[] = [];
  errorDispensPillText: any[] = [];
  invalidMealSupplyDayMorning = false;
  invalidMealSupplyDayLunch = false;
  invalidMealSupplyDayEvening = false;
  invalidMealSupplyDayBedtime = false;
  isLoadingPanel: boolean = false;
  role: string;
  allCheckedCompound: boolean = false;
  allCheckedDispensedPill: boolean = false;
  allCompoundAndPillChecked: boolean = false;
  skipDisable: string[] = [
    'isCheckedCompound',
    'isCheckedDispensedPill'
  ]
  constructor(public router: Router,
    private fb: FormBuilder,
    private request: Request,
    private common: Common,
    private compare: CompareService,
    private route: ActivatedRoute,
    private store: StoreService) {
    this.orderForm = this.fb.group({
      'txtTariff': new FormControl('', [Validators.required]),
      'txtHn': new FormControl('', [Validators.required]),
      'txtPatientName': new FormControl('', [Validators.required]),
      'txtOrderDate': new FormControl('', [Validators.required]),
      'txtSupplyDay': new FormControl('', [Validators.required]),
      'txtCalculatedDay': new FormControl({ value: '', disabled: true }),
      'txtPhysician': new FormControl('', [Validators.required]),
      'txtOrderPharmacyNote': new FormControl({ value: '', disabled: true }),
      'txtAdditionalNoteFromDoctor': new FormControl({ value: '', disabled: true }),
      'txtOrderPharmacyNoteRemark': new FormControl(''),
      'txtIsSeparateMeal': new FormControl(''),
      'txtMorningCap': new FormControl(''),
      'txtLunchCap': new FormControl(''),
      'txtEveningCap': new FormControl(''),
      'txtBedtimeCap': new FormControl(''),
      'txtMorningSupply': new FormControl({ value: '', disabled: false }),
      'txtLunchSupply': new FormControl({ value: '', disabled: false }),
      'txtEveningSupply': new FormControl({ value: '', disabled: false }),
      'txtBedtimeSupply': new FormControl({ value: '', disabled: false }),
      'txtTotalCap': new FormControl({ value: '', disabled: true }),
      'txtTotalSupply': new FormControl({ value: '', disabled: true }),
      'txtIsOrderPcCheckUrgent': new FormControl(''),
      'txtIsOrderPcCheckRm': new FormControl(''),
      'txtIsOrderPcCheckAllergy': new FormControl(''),
      'txtIsOrderPcCheckMed': new FormControl(''),
      'txtIsOrderPcCheckWf2': new FormControl(''),
      'txtIsOrderQtCheckNoBatch': new FormControl(''),
      'txtIsOrderQtCheckNoPack': new FormControl(''),
      'txtIsOrderQtCheckStaff': new FormControl(''),
      'compound': this.fb.array([]),
      'dispensedPill': this.fb.array([])
    });
  }

  get f(): any {
    return this.orderForm.controls;
  }

  get formDispensedPill(): FormArray {
    return this.orderForm.controls['dispensedPill'] as FormArray;
  }

  get formCompound(): FormArray {
    return this.orderForm.controls['compound'] as FormArray;
  }

  ngOnDestroy() {
    console.log('clear interval');
    clearInterval(this.intervalUpdateWorkingBy);
  }

  async ngOnInit() {
    if (sessionStorage.getItem('role')) {
      this.role = sessionStorage.getItem('role')
    }
    const dropdown = await this.common.searchConfig();
    this.orderStatusList = dropdown.orderStatus || [];
    for (const orderStatus of this.orderStatusList) {
      this.orderStatusMap[orderStatus.id] = orderStatus.name;
    }
    this.store.subscribePagePermissionList().subscribe(pagePermissionList => {
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


    this.finishedProduct = this.customStore();
    this.searchHn = this.customStore2();
    this.searchPatients = this.customStore3();
  }

  checkAllCompound() {
    this.allCheckedCompound = this.formCompound.controls.every(control => control.get('isCheckedCompound').value);
    this.updateAllCompoundAndPillChecked();
  }
  onHeaderBcCompoundChanged(event: any) {
    if (event.event) {
      this.toggleAllCompound(event.value);
    }
  }
  toggleAllCompound(checked: boolean) {
    const formControls = this.formCompound.controls;
    const orderCompound = this.order.orderCompound;
    for (let i = 0; i < formControls.length; i++) {
      const control = formControls[i];
      const rawMaterialName = orderCompound[i] && orderCompound[i].rawMaterialName;
      const isError = orderCompound[i].isError
      if (rawMaterialName !== 'Vivapur' && !isError) {
        control.get('isCheckedCompound').setValue(checked);
      }
    }

    this.allCheckedCompound = checked;
    this.updateAllCompoundAndPillChecked();
  }
  onHeaderDpCompoundChanged(event: any) {
    if (event.event) {
      this.toggleAllDispensedPill(event.value);
    }
  }
  checkAllDispensedPill() {
    this.allCheckedDispensedPill = this.formDispensedPill.controls.every(control => control.get('isCheckedDispensedPill').value);
    this.updateAllCompoundAndPillChecked();
  }

  toggleAllDispensedPill(checked: boolean) {
    this.formDispensedPill.controls.forEach(control => {
      control.get('isCheckedDispensedPill').setValue(checked);
    });
    this.allCheckedDispensedPill = checked;
    this.updateAllCompoundAndPillChecked();
  }

  updateAllCompoundAndPillChecked() {
    const compoundValid = this.formCompound.controls.every((control, i) => {
      const isChecked = control.get('isCheckedCompound').value != null ? control.get('isCheckedCompound').value : true;
      const item = this.order.orderCompound[i];
      const dosePerDay = item.dosePerDay;
      const rawMaterialName = item.rawMaterialName;
      const isError = item.isError;
      if (rawMaterialName === 'Vivapur' || isError === true) {
        return true;
      }
      if (isChecked && dosePerDay) {
        if (this.order.orderCompound[i].invalidCheckbox) {
          this.order.orderCompound[i].invalidCheckbox = false
        }
        return true;
      } else if (!dosePerDay && !isChecked) {
        if (this.order.orderCompound[i].invalidCheckbox) {
          this.order.orderCompound[i].invalidCheckbox = false
        }
        return true;
      } else {
        return false;
      }
    });

    const pillValid = this.formDispensedPill.controls.every((control, i) => {
      const isChecked = control.get('isCheckedDispensedPill') != null ? control.get('isCheckedDispensedPill').value : true;
      const item = this.order.orderDispensedPill[i];
      const dosePerDay = item.dosePerDay;
      const totalPill = item.totalPill;

      if (isChecked && dosePerDay && totalPill) {
        if (this.order.orderDispensedPill[i].invalidCheckbox) {
          this.order.orderDispensedPill[i].invalidCheckbox = false
        }
        if (this.order.orderDispensedPill[i].invalidCheckboxTotalPill) {
          this.order.orderDispensedPill[i].invalidCheckboxTotalPill = false
        }
        return true;
      } else if (!dosePerDay && !totalPill && !isChecked) {
        if (this.order.orderDispensedPill[i].invalidCheckbox) {
          this.order.orderDispensedPill[i].invalidCheckbox = false
        }
        if (this.order.orderDispensedPill[i].invalidCheckboxTotalPill) {
          this.order.orderDispensedPill[i].invalidCheckboxTotalPill = false
        }
        return true;
      } else {
        return false;
      }
    })

    this.allCompoundAndPillChecked = compoundValid && pillValid;
  }


  goHomeMenu() {
    if (this.menuHome) {
      this.router.navigate(['/menu', this.menuHome['menuId'], this.menuHome['typePage']]);
    }
  }

  clickCollapse(id) {
    this.isCollapseTariff = false;
    this.common.collapseFnById(id);
  }

  lineData() {
    try {
      const countLineData = this.detailList.length % 24;
      const maxLineNoTotal = 24 - 4;
      if (countLineData > maxLineNoTotal) {
        return Array(maxLineNoTotal + (24 - countLineData)).fill(0);
      } else {
        return Array(maxLineNoTotal - countLineData).fill(0);
      }
    } catch (e) {
      return [];
    }
  }

  async ngAfterViewInit() {
    try {
      this.isLoadingPanel = true;
      this.configList = await this.common.searchConfig();
      console.log(this.configList);
      await this.route.params.subscribe(params => {
        this.disbledBtn = {
          'save': false,
          'cancel': false
        };
        console.log(':params', params);
        const splitPath = this.router.url.split('/');
        this.pageType = splitPath[splitPath.length - 1];
        console.log(':pageType', this.pageType);
        this.Id = params.id;
        if (this.pageType === 'view' || this.pageType === 'edit') {
          this.updateWorkingBy();
          this.intervalUpdateWorkingBy = setInterval(() => {
            this.updateWorkingBy();
          }, 3000);
        }

        if (this.pageType === 'reorder') {
          this.pageType = 'new';
          this.isReorder = true;
        }

        //get api by id

      });
      console.log('this.pageType', this.pageType);

      if (this.pageType === 'new') {
        await this.searchPharmacyNotes();
      } else if (this.pageType === 'view') {
        await this.getApiEdit();
        this.orderForm.controls['txtTariff'].disable();
        this.orderForm.controls['txtHn'].disable();
        this.orderForm.controls['txtPatientName'].disable();
        this.orderForm.controls['txtOrderDate'].disable();
        this.orderForm.controls['txtSupplyDay'].disable();
        this.orderForm.controls['txtPhysician'].disable();
        this.orderForm.controls['txtOrderPharmacyNote'].disable();
        this.orderForm.controls['txtAdditionalNoteFromDoctor'].disable();
        this.orderForm.controls['txtOrderPharmacyNoteRemark'].disable();
        this.orderForm.controls['txtIsSeparateMeal'].disable();
        this.orderForm.controls['txtMorningCap'].disable();
        this.orderForm.controls['txtLunchCap'].disable();
        this.orderForm.controls['txtEveningCap'].disable();
        this.orderForm.controls['txtBedtimeCap'].disable();
        this.orderForm.controls['txtMorningSupply'].disable();
        this.orderForm.controls['txtLunchSupply'].disable();
        this.orderForm.controls['txtEveningSupply'].disable();
        this.orderForm.controls['txtBedtimeSupply'].disable();
        this.orderForm.controls['txtTotalCap'].disable();
        this.orderForm.controls['txtTotalSupply'].disable();
        this.orderForm.controls['txtIsOrderPcCheckUrgent'].disable();
        this.orderForm.controls['txtIsOrderPcCheckRm'].disable();
        this.orderForm.controls['txtIsOrderPcCheckAllergy'].disable();
        this.orderForm.controls['txtIsOrderPcCheckMed'].disable();
        this.orderForm.controls['txtIsOrderPcCheckWf2'].disable();
        this.orderForm.controls['txtIsOrderQtCheckNoBatch'].disable();
        this.orderForm.controls['txtIsOrderQtCheckNoPack'].disable();
        this.orderForm.controls['txtIsOrderQtCheckStaff'].disable();
        this.orderForm.controls['compound'].disable();
        this.orderForm.controls['dispensedPill'].disable();
        try {
          this.order.location = this.order.location ? this.configList.location.find((x) => {
            return x.id == this.order.location;
          }).name : null;
          this.order.tariff = this.order.tariff ? this.configList.tariffList.find((x) => {
            return x.id == this.order.tariff;
          }).name : null;
        } catch (error) {
          console.log('error', error);
        }


        for (let i = 0; i < this.order.orderDispensedPill.length; i++) {
          if (this.order.orderStatus <= 1) {
            this.order.orderDispensedPill[i].totalPill = +this.order.orderDispensedPill[i].dosePerDay * +this.order.supplyDay;
          }
          this.formDispensedPill.push(this.fb.group({
            txtNo: new FormControl({ value: this.order.orderDispensedPill[i].no, disabled: true }),
            txtFinishedProductCode: new FormControl({
              value: this.order.orderDispensedPill[i].finishedProductCode,
              disabled: true
            }),
            txtFinishedProductName: new FormControl({
              value: this.order.orderDispensedPill[i].finishedProductName,
              disabled: true
            }),
            txtUnit: new FormControl({ value: this.order.orderDispensedPill[i].unit, disabled: true }),
            txtDosePerDay: new FormControl({
              value: this.order.orderDispensedPill[i].dosePerDay || null,
              disabled: true
            }, Validators.required),
            txtTotalPill: new FormControl({
              value: this.order.orderDispensedPill[i].totalPill,
              disabled: this.pageType == 'view' ? true : false
            }, Validators.required),
            txtRemark: new FormControl({
              value: this.order.orderDispensedPill[i].remark,
              disabled: this.pageType == 'view' ? true : false
            }),
          }));
        }

      } else if (this.pageType === 'edit') {
        await this.getApiEdit();
        await this.getSearchFinishedProducts();
        this.orderForm.controls['txtTariff'].disable();
        this.orderForm.controls['txtHn'].disable();
        this.orderForm.controls['txtPatientName'].disable();
        this.orderForm.controls['txtOrderDate'].disable();
        if (this.order.location === 1 || this.order.location === 'Trakcare') {
          this.orderForm.controls['txtSupplyDay'].disable();
        } else {
          this.orderForm.controls['txtSupplyDay'].enable();
        }
        this.orderForm.controls['txtPhysician'].disable();
        this.orderForm.controls['txtOrderPharmacyNote'].disable();
        this.orderForm.controls['txtAdditionalNoteFromDoctor'].disable();
        this.orderForm.controls['txtTotalCap'].disable();
        this.orderForm.controls['txtTotalSupply'].disable();
        this.order.location = this.order.location ? this.configList.location.find((x) => {
          return x.id == this.order.location;
        }).name : null;
        this.order.tariff = this.order.tariff ? this.configList.tariffList.find((x) => {
          return x.id == this.order.tariff;
        }).name : null;


        for (let i = 0; i < this.order.orderDispensedPill.length; i++) {
          if (this.order.orderStatus <= 1) {
            this.order.orderDispensedPill[i].totalPill = +this.order.orderDispensedPill[i].dosePerDay * +this.order.supplyDay;
          }
          // กรณีเข้ามา Edit จะดึง unit จาก fp เพราะ fp อาจจะมีการเปลี่ยนค่า
          const fp = this.finishedProductList.find(obj => obj.code === this.order.orderDispensedPill[i].finishedProductCode);
          if (fp) {
            if (fp.uom === 'Box' || fp.uom === 'Bottle') {
              this.order.orderDispensedPill[i].unit = fp.unit;
            } else {
              this.order.orderDispensedPill[i].unit = fp.uom;
            }
          }

          this.formDispensedPill.push(this.fb.group({
            txtNo: new FormControl({ value: this.order.orderDispensedPill[i].no, disabled: true }),
            txtFinishedProductCode: new FormControl({
              value: this.order.orderDispensedPill[i].finishedProductCode,
              disabled: true
            }),
            txtFinishedProductName: new FormControl({
              value: this.order.orderDispensedPill[i].finishedProductName,
              disabled: this.order.location == 'Trakcare' ? true : false
            }),
            txtUnit: new FormControl({ value: this.order.orderDispensedPill[i].unit, disabled: true }),
            txtDosePerDay: new FormControl({
              value: this.order.orderDispensedPill[i].dosePerDay || null,
              disabled: this.order.location == 'Trakcare' ? true : false
            }, Validators.required),
            txtTotalPill: new FormControl({
              value: this.order.orderDispensedPill[i].totalPill,
              disabled: this.pageType == 'view' ? true : false
            }, Validators.required),
            txtRemark: new FormControl({
              value: this.order.orderDispensedPill[i].remark,
              disabled: this.pageType == 'view' ? true : false
            }),
            isCheckedDispensedPill: new FormControl(false)
          }));
        }
        if (this.order.orderDispensedPill.length == 0) {
          this.allCheckedDispensedPill = true
          this.updateAllCompoundAndPillChecked()
        }
      } else if (this.pageType === 'quotation') {
        await this.searchOrderById();
        await this.getErrorOrder();
        console.log('this.order.location', this.order.location);
        // if (this.order.location === 1 || this.order.location === 'Trakcare') {
        //   this.orderForm.controls['txtSupplyDay'].disable();
        // } else {
        //   this.orderForm.controls['txtSupplyDay'].enable();
        // }
        // this.orderForm.controls['txtSupplyDay'].disable(); //cloes all location
      }
      await this.searchRawMaterials()
      if (this.pageType != 'quotation' && (this.order.location == 'Trakcare' || this.pageType == 'view')) {
        for (let i = 0; i < this.order.orderCompound.length; i++) {
          this.formCompound.push(this.fb.group({
            txtDosePerDayCom: new FormControl({ value: '', disabled: true }),
            txtRemark: new FormControl({ value: '', disabled: this.pageType === 'view' }),
            isCheckedCompound: new FormControl(
              this.order.orderCompound[i].rawMaterialName !== 'Vivapur' &&
                !this.order.orderCompound[i].isError ? false : true
            ),
          }));
        }

        // tslint:disable-next-line:max-line-length
      } else if (this.pageType != 'quotation' && (this.order.location == 'Manual' || this.order.location == 'Import' || this.pageType == 'new')) {
        await this.getSearchRawMaterials();
        console.log('this.isReorder', this.isReorder);
        if (this.isReorder) {

          for (let i = 0; i < this.order.orderDispensedPill.length; i++) {
            this.order.orderDispensedPill[i].totalPill = +this.order.orderDispensedPill[i].dosePerDay * +this.order.supplyDay;
            this.formDispensedPill.push(this.fb.group({
              txtNo: new FormControl({ value: this.order.orderDispensedPill[i].no, disabled: true }),
              txtFinishedProductCode: new FormControl({
                value: this.order.orderDispensedPill[i].finishedProductCode,
                disabled: true
              }),
              txtFinishedProductName: new FormControl({
                value: this.order.orderDispensedPill[i].finishedProductName,
                disabled: true
              }),
              txtUnit: new FormControl({ value: this.order.orderDispensedPill[i].unit, disabled: true }),
              txtDosePerDay: new FormControl({
                value: this.order.orderDispensedPill[i].dosePerDay || null,
                disabled: true
              }, Validators.required),
              txtTotalPill: new FormControl({
                value: this.order.orderDispensedPill[i].totalPill,
                disabled: false
              }, Validators.required),
              txtRemark: new FormControl({
                value: this.order.orderDispensedPill[i].remark,
                disabled: false
              }),
            }));
          }
        }
        const cloneCompound = this.order.orderCompound ? _.cloneDeep(this.order.orderCompound) : [];
        console.log('cloneCompound', cloneCompound);
        this.order.orderCompound = [];
        for (let i = 0; i < this.rawMatList.length; i++) {
          const findComp = cloneCompound.find(x => {
            return x.rawMaterialCode == this.rawMatList[i].code;
          });
          if (this.rawMatList[i].code == this.configList.formula.vivapurCode) {
            this.formCompound.push(this.fb.group({
              txtDosePerDayCom: new FormControl({ value: '', disabled: true }),
              txtRemark: new FormControl({ value: '', disabled: this.pageType == 'view' ? true : false }),
              isCheckedCompound: new FormControl(false),
            }));
          } else {
            this.formCompound.push(this.fb.group({
              txtDosePerDayCom: new FormControl({ value: '', disabled: this.pageType == 'view' ? true : false }),
              txtRemark: new FormControl({ value: '', disabled: this.pageType == 'view' ? true : false }),
              isCheckedCompound: new FormControl(false),
            }));
          }
          console.log('findComp', findComp);
          if (findComp) {
            this.order.orderCompound.push({
              no: findComp.no,
              rawMaterialCode: findComp.rawMaterialCode,
              rawMaterialName: findComp.rawMaterialName,
              unit: findComp.unit,
              recommendedDose: findComp.recommendedDose,
              minimumDose: findComp.minimumDose,
              maximumDose: findComp.maximumDose,
              strength: this.rawMatList[i].strength,
              vtlCapPackingStat: this.rawMatList[i].vtlCapPackingStat,
              dosePerDay: findComp.dosePerDay,
              remark: findComp.remark,
            });
          } else {
            this.order.orderCompound.push({
              no: this.rawMatList[i].no,
              rawMaterialCode: this.rawMatList[i].code,
              rawMaterialName: this.rawMatList[i].rawMaterialName,
              unit: this.rawMatList[i].unit,
              recommendedDose: this.rawMatList[i].recommendedDose,
              minimumDose: this.rawMatList[i].minimumDose,
              maximumDose: this.rawMatList[i].maximumDose,
              strength: this.rawMatList[i].strength,
              vtlCapPackingStat: this.rawMatList[i].vtlCapPackingStat,
              dosePerDay: null,
              remark: null,
            });
          }
        }
        // show color red in textbox
        console.log('this.order', this.order.orderCompound);
        if (this.order.orderCompound) {
          for (let i = 0; i < this.order.orderCompound.length; i++) {
            if (this.order.orderCompound[i].dosePerDay) {
              const minimumDose = this.order.orderCompound[i].minimumDose ? +this.order.orderCompound[i].minimumDose : 0;
              const maximumDose = this.order.orderCompound[i].maximumDose ? +this.order.orderCompound[i].maximumDose : 0;
              console.log(maximumDose, 'maximumDose');
              console.log(maximumDose, 'maximumDose');
              if (+this.order.orderCompound[i].dosePerDay > maximumDose || +this.order.orderCompound[i].dosePerDay < minimumDose) {
                this.order.orderCompound[i].invalid = true;
                console.log('1');
                console.log(this.order.orderCompound[i].invalid);
              } else {
                console.log('2');
                console.log(this.order.orderCompound[i].invalid);
                this.order.orderCompound[i].invalid = false;
              }
            } else {
              console.log('3');
              console.log(this.order.orderCompound[i].invalid);
              this.order.orderCompound[i].invalid = false;
            }
          }
        }
      }

      if (this.order.orderCompound.length == 0) {
        console.log("============", this.order.orderCompound.length)
        this.allCheckedCompound = true
        this.updateAllCompoundAndPillChecked()
      }

      this.isLoadingPanel = false
      console.log(this.order);
      document.body.scrollTop = 0; // สั่งให้ scroll to top เมื่อเข้าหน้ามา
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

  async getErrorOrder() {
    const filterData = {
      orderId: this.Id,
    };

    const checkUrl = this.common.checkMockupUrl('', '', filterData, {
      BASE_API: '',
      BASE_MODULE: environment.apiPrefix,
      BASE_RESOURCE: environment.searchErrorOrder
    });

    const resultCodeSuccess = environment.resultCodeSuccess;
    const response = await this.request.get(checkUrl.url, checkUrl.filter);
    if (response.resultCode !== resultCodeSuccess) {
      this.loading = false;
      this.errorText = response.resultDescription.split('\n');
      if ((this.orderStatusCheckError === "Order Reviewed" && this.errorText[this.errorText.length - 1].includes('Trakcare')) || !this.menuPermissions.edit) {
        this.goAlert(response.resultCode, response.resultDescription, 'myModalOrderErrorStatus1');
      } else {
        if (!this.menuPermissions.edit) {
          this.goAlert(response.resultCode, response.resultDescription, 'myModalOrderErrorStatus1');
        } else {
          this.goAlert(response.resultCode, response.resultDescription, 'myModalOrderError');
        }
      }

    } else {
      try {
        await this.getApiEdit();
        await this.getSearchFinishedProducts();
        // this.orderForm.controls['txtTariff'].disable();
        this.orderForm.controls['txtHn'].disable();
        this.orderForm.controls['txtPatientName'].disable();
        this.orderForm.controls['txtOrderDate'].disable();
        // this.orderForm.controls['txtSupplyDay'].disable();
        this.orderForm.controls['txtPhysician'].disable();
        this.orderForm.controls['txtOrderPharmacyNote'].disable();
        this.orderForm.controls['txtAdditionalNoteFromDoctor'].disable();
        this.orderForm.controls['txtOrderPharmacyNoteRemark'].disable();
        if (this.order.type == 1) {
          await this.getSearchPrice();
          await this.getSearchRawMaterials();
        } else if (this.order.type == 2) {
          await this.getSearchPackMedPrice();
        }
        this.fnCalDetailList();
      } catch (e) {
        console.log(e);
        const resultDescriptionSystemErrorTitle = environment.resultDescriptionSystemErrorTitle;
        const resultDescriptionSystemErrorMassage = environment.resultDescriptionSystemErrorMassage;
        this.goAlert(resultDescriptionSystemErrorTitle, resultDescriptionSystemErrorMassage, 'myModalError');
      }
    }
  }

  fnCalDetailList() {
    this.detailList = [];
    if (this.order.type == 1) {
      let total = 0;
      let calDay = 0;
      let totalPackCharge = 0;
      if (this.order.isSeparateMeal == 0 || this.order.isSeparateMeal == null) {
        calDay = this.order.supplyDay;
      } else if (this.order.isSeparateMeal == 1) {
        calDay = this.order.calculatedDay;
      }

      // new cal 17-11-2022
      for (let i = 0; i < this.order.orderCompound.length; i++) {
        const row = this.order.orderCompound[i];
        if (!this.order.isOrderQtCheckStaff) {
          const addmore = this.common.getDose(row, +this.configList.formula.percentLoss).addmore.toFixed(2);
          console.log('rawMaterialName', row.rawMaterialName);
          console.log('addmore', addmore);
          console.log('retailPrice', +row.retailPrice);
          const priceBatchChange = +row.retailPrice * +addmore;
          console.log('priceBatchChange = row.retailPrice * +addmore', priceBatchChange);
          const price = +calDay * priceBatchChange;
          console.log('price = this.order.supplyDay * priceBatchChange', price);
          total += price;
        } else {
          const rawMat = this.rawMatList.find(x => {
            return x.code == row.rawMaterialCode;
          });
          const actualDose = +row.dosePerDay / +rawMat.strength;
          console.log('actualDose = +row.dosePerDay / +rawMat.strength', actualDose);
          const addMore = +actualDose + (+actualDose * +this.configList.formula.percentLoss);
          console.log('addMore = +actualDose + (+actualDose * +this.configList.formula.percentLoss)', addMore);
          let retailPrice = 0;
          if (row.orderItemPrice != null && row.orderItemPrice !== '0' && row.orderItemPrice !== 0) {
            retailPrice = row.orderItemPrice;
          } else {
            retailPrice = rawMat.cost;
          }
          console.log('retailPrice', retailPrice);
          const rm = +addMore * +retailPrice * ((+this.priceList.percentMarkup + 100) / 100);
          console.log('rm = +addMore * +retailPrice * ((+this.priceList.percentMarkup + 100) / 100)', retailPrice);
          if (this.order.isSeparateMeal == 0 || this.order.isSeparateMeal == null) {
            calDay = +this.order.supplyDay;
          } else if (this.order.isSeparateMeal == 1) {
            calDay = +this.order.calculatedDay;
          }
          console.log('calDay', calDay);
          const totalRM = +rm * +calDay;
          console.log('totalRM', totalRM);
          total += +totalRM;
          console.log('total', total);
        }
      }
      // end new cal 17-11-2022

      // for (let i = 0; i < this.order.orderCompound.length; i++) {
      //   const com = this.order.orderCompound[i];
      //   const rawMat = this.rawMatList.find(x => {
      //     return x.code == com.rawMaterialCode;
      //   });
      //   const actualDose = +com.dosePerDay / +rawMat.strength;
      //   const addMore = +actualDose + (+actualDose * +this.configList.formula.percentLoss);
      //   if (this.order.isOrderQtCheckStaff == 0) {
      //     let retailPrice = 0;
      //     if (com.orderItemPrice != null) {
      //       retailPrice = com.orderItemPrice;
      //     } else {
      //       retailPrice = rawMat.retailPrice;
      //     }
      //     const rm = +addMore * +retailPrice;
      //
      //     const totalRM = rm * calDay;
      //     total += +totalRM;
      //   } else if (this.order.isOrderQtCheckStaff == 1) {
      //     let retailPrice = 0;
      //     if (com.orderItemPrice != null) {
      //       retailPrice = com.orderItemPrice;
      //     } else {
      //       retailPrice = rawMat.retailPrice;
      //     }
      //     const rm = +addMore * +retailPrice * (+this.priceList.percentMarkup / 100);
      //     if (this.order.isSeparateMeal == 0 || this.order.isSeparateMeal == null) {
      //       calDay = +this.order.supplyDay;
      //     } else if (this.order.isSeparateMeal == 1) {
      //       calDay = +this.order.calculatedDay;
      //     }
      //     const totalRM = +rm * +calDay;
      //     total += +totalRM;
      //   }
      // }
      let batch = 0;
      let prodCharge = 0;
      if (!this.order.isOrderQtCheckStaff) {
        let pack = 0;
        if (!this.order.isOrderQtCheckNoBatch) {
          batch = this.priceList.batchCharge;
          console.log('batchCharge', batch);
        }
        if (!this.order.isOrderQtCheckNoPack) {
          pack = this.priceList.packCharge;
          console.log('packCharge', pack);
        }
        totalPackCharge = pack * Math.ceil(calDay / 30);
        console.log('totalPackCharge = pack * Math.ceil(calDay / 30)', totalPackCharge);
        total += +batch + +totalPackCharge;
        console.log('total += +batch + +totalPackCharge', total);
      } else {
        for (let i = 0; i < this.priceList.productionCharge.length; i++) {
          const pCharge = this.priceList.productionCharge[i];
          // tslint:disable-next-line:max-line-length
          if ((+calDay >= pCharge.supplyDayFrom && +calDay <= pCharge.supplyDayTo) || (+calDay >= pCharge.supplyDayFrom && pCharge.supplyDayTo == null)) {
            if (pCharge.isCalculate == 0) {
              prodCharge = +pCharge.productionCharge;
            } else if (pCharge.isCalculate == 1) {
              prodCharge = (+pCharge.dividend / +pCharge.divider) * +calDay;
            }
            break;
          }
        }
        console.log('productionCharge', prodCharge);
        total += +prodCharge;
      }

      const month = Math.ceil(+this.order.supplyDay / 30);
      let packName;
      if (month == 1) {
        packName = 'Customized Supplement 1 Month';
      } else {
        packName = `Customized Supplement ${month} Months`;
      }
      this.detailList.push({
        category: 'supplement',
        type: 1,
        name: packName,
        quantity: 1,
        uom: null,
        unitPrice: Math.ceil(total),
        priceThai: total,
        priceInter: total,
        priceMiddleEast: total,
        amount: Math.ceil(total),
        packCharge: totalPackCharge,
        batchCharge: batch,
        staffProductionCharge: prodCharge,
      });
      console.log('this.detailList', this.detailList);
    } else if (this.order.type == 2) {
      if (this.order.isOrderQtCheckNoBatch === false) {
        const batch = this.packMedList.find(x => {
          return x.code == '070-98-0030';
        });
        this.detailList.push({
          category: 'batch',
          itemId: batch.packMedPriceId,
          type: 1,
          name: batch.packMedPriceName,
          quantity: 1,
          uom: null,
          unitPrice: batch.priceThai,
          priceThai: batch.priceThai,
          priceInter: batch.priceThai,
          priceMiddleEast: batch.priceThai,
          amount: batch.priceThai,
          packCharge: 0,
          batchCharge: 0,
          staffProductionCharge: 0,
        });
      }
      if (this.order.isOrderQtCheckNoPack === false) {
        const month = Math.ceil(+this.order.supplyDay / 30);
        let packName;
        if (month == 1) {
          packName = 'Package Charge 1 month';
        } else {
          packName = `Package Charge ${month} months`;
        }
        const batch = this.packMedList.find(x => {
          return x.packMedPriceName == packName;
        });
        this.detailList.push({
          category: 'pack',
          itemId: batch.packMedPriceId,
          type: 1,
          name: batch.packMedPriceName,
          quantity: 1,
          uom: null,
          unitPrice: batch.priceThai,
          priceThai: batch.priceThai,
          priceInter: batch.priceThai,
          priceMiddleEast: batch.priceThai,
          amount: batch.priceThai,
          packCharge: 0,
          batchCharge: 0,
          staffProductionCharge: 0,
        });
      }
    }

    for (let i = 0; i < this.order.orderDispensedPill.length; i++) {
      const fp = this.finishedProductList.find(x => {
        return x.code === this.order.orderDispensedPill[i].finishedProductCode;
      });
      let unit = this.order.orderDispensedPill[i].unit;
      let quantity = this.order.orderDispensedPill[i].totalPill;
      if (this.order.orderDispensedPill[i].orderItemPrice != null) {
        let amount = +this.order.orderDispensedPill[i].totalPill * this.order.orderDispensedPill[i].orderItemPrice;
        if (fp.uom === 'Box' || fp.uom === 'Bottle') {
          quantity = Math.ceil(+this.order.orderDispensedPill[i].totalPill / fp.quantity);
          amount = quantity * this.order.orderDispensedPill[i].orderItemPrice;
          unit = fp.uom;
        }
        this.detailList.push({
          category: 'dispensedPill',
          itemId: this.order.orderDispensedPill[i].id,
          type: 2,
          name: this.order.orderDispensedPill[i].finishedProductName,
          quantity: quantity,
          uom: unit,
          unitPrice: +this.order.orderDispensedPill[i].orderItemPrice,
          priceThai: +this.order.orderDispensedPill[i].orderItemPrice,
          priceInter: +this.order.orderDispensedPill[i].orderItemPrice,
          priceMiddleEast: +this.order.orderDispensedPill[i].orderItemPrice,
          amount: amount,
          packCharge: 0,
          batchCharge: 0,
          staffProductionCharge: 0,
        });
      } else {
        let unitP;
        if (this.order.tariff == 1) {
          unitP = fp.priceThai;
        } else if (this.order.tariff == 2) {
          unitP = fp.priceInter;
        } else if (this.order.tariff == 3) {
          unitP = fp.priceMiddleEast;
        }
        let amount = +this.order.orderDispensedPill[i].totalPill * unitP;
        if (fp.uom === 'Box' || fp.uom === 'Bottle') {
          quantity = Math.ceil(+this.order.orderDispensedPill[i].totalPill / fp.quantity);
          amount = quantity * unitP;
          unit = fp.uom;
        }
        this.detailList.push({
          category: 'dispensedPill',
          itemId: this.order.orderDispensedPill[i].id,
          type: 2,
          name: this.order.orderDispensedPill[i].finishedProductName,
          quantity: quantity,
          uom: unit,
          unitPrice: unitP,
          priceThai: fp.priceThai,
          priceInter: fp.priceInter,
          priceMiddleEast: fp.priceMiddleEast,
          amount: amount,
          packCharge: 0,
          batchCharge: 0,
          staffProductionCharge: 0,
        });
      }
    }

    const findLocation = this.configList.location.find((x) => {
      return x.id == this.order.location;
    });

    if (findLocation) {
      this.order.location = findLocation.name;
    }

    if (this.order.location == 'Trakcare') {
      this.order.tariff = this.order.tariff ? this.configList.tariffList.find((x) => {
        return x.id == this.order.tariff;
      }).name : null;
    }
    this.calculatedTotalAmount();
  }


  async getApiEdit() {
    try {
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
      const resultCodeDataNotFound = environment.resultCodeDataNotFound;
      const resultDescriptionDataNotFoundTitle = environment.resultDescriptionDataNotFoundTitle;
      const resultDescriptionDataNotFoundMassage = environment.resultDescriptionDataNotFoundMassage;
      const resultDescriptionSystemErrorTitle = environment.resultDescriptionSystemErrorTitle;
      const resultDescriptionSystemErrorMassage = environment.resultDescriptionSystemErrorMassage;
      const resultCodeDbError = environment.resultCodeDbError;
      const resultDescriptionDbErrorTitle = environment.resultDescriptionDbErrorTitle;
      const resultDescriptionDbErrorMassage = environment.resultDescriptionDbErrorMassage;

      const response = await this.request.get(checkUrl.url, checkUrl.filter);
      this.loading = false;
      if (response.resultCode === resultCodeSuccess) {
        this.order = response.resultData;
        this.order.isOrderPcCheckUrgent = this.order.isOrderPcCheckUrgent ? true : false;
        this.order.isOrderPcCheckRm = this.order.isOrderPcCheckRm ? true : false;
        this.order.isOrderPcCheckAllergy = this.order.isOrderPcCheckAllergy ? true : false;
        this.order.isOrderPcCheckMed = this.order.isOrderPcCheckMed ? true : false;
        this.order.isOrderPcCheckWf2 = this.order.isOrderPcCheckWf2 ? true : false;
        this.order.isOrderQtCheckNoBatch = this.order.isOrderQtCheckNoBatch ? true : false;
        this.order.isOrderQtCheckNoPack = this.order.isOrderQtCheckNoPack ? true : false;
        this.order.isOrderQtCheckStaff = this.order.isOrderQtCheckStaff ? true : false;
        this.order.isSeparateMeal = this.order.isSeparateMeal ? true : false;
        this.order.orderDate = this.order.orderDate ? moment(this.order.orderDate, 'DD/MM/YYYY HH:mm') : null;
        this.order.sepTotalCap = +this.order.totalCapPerDay;
        this.order.orderStatus = +this.order.orderStatus;

        let errorCompound = []
        let errorDispenspill = []
        if (localStorage.getItem('errorOrder')) {
          let errorData = JSON.parse(localStorage.getItem('errorOrder'))
          if (errorData.orderId == this.Id) {
            console.log(errorData)
            errorCompound = errorData.data.rawMaterials
            errorDispenspill = errorData.data.finishedProducts
          }
        }

        if (this.order.orderCompound) {
          this.errorCompoundText = []
          for (let i = 0; i < this.order.orderCompound.length; i++) {
            this.order.orderCompound[i].isError = false;
            if (this.order.orderCompound[i].dosePerDay) {
              const minimumDose = this.order.orderCompound[i].minimumDose ? +this.order.orderCompound[i].minimumDose : 0;
              const maximumDose = this.order.orderCompound[i].maximumDose ? +this.order.orderCompound[i].maximumDose : 0;
              console.log(maximumDose, 'maximumDose');
              console.log(maximumDose, 'maximumDose');
              if (+this.order.orderCompound[i].dosePerDay > maximumDose || +this.order.orderCompound[i].dosePerDay < minimumDose) {
                this.order.orderCompound[i].invalid = true
                console.log('1');
                console.log(this.order.orderCompound[i].invalid);
              } else {
                console.log('2');
                console.log(this.order.orderCompound[i].invalid);
                this.order.orderCompound[i].invalid = false;
              }


            } else {
              console.log('3');
              console.log(this.order.orderCompound[i].invalid);
              this.order.orderCompound[i].invalid = false;
            }
            for (let index = 0; index < errorCompound.length; index++) {
              const element = errorCompound[index];
              if (this.order.orderCompound[i].rawMaterialCode === element.code) {
                if (element.status === null) {
                  this.errorCompoundText.push(`${this.order.orderCompound[i].rawMaterialName} is not found`)
                }
                if (element.status === 0) {
                  this.errorCompoundText.push(`${this.order.orderCompound[i].rawMaterialName} is inactive`)
                }
                if (element.status === 1) {
                  this.errorCompoundText.push(`${this.order.orderCompound[i].rawMaterialName} is expire`)
                }
                if (element.status === 2) {
                  this.errorCompoundText.push(`${this.order.orderCompound[i].rawMaterialName} is out of stock`)
                }
                this.order.orderCompound[i].isError = true;
              }
            }
          }
        }

        if (this.order.orderDispensedPill) {
          this.errorDispensPillText = []
          for (let i = 0; i < this.order.orderDispensedPill.length; i++) {
            this.order.orderDispensedPill[i].isError = false;
            for (let index = 0; index < errorDispenspill.length; index++) {
              const element = errorDispenspill[index];
              if (this.order.orderDispensedPill[i].finishedProductCode === element.code) {
                if (element.status === null) {
                  this.errorDispensPillText.push({
                    text: `${this.order.orderDispensedPill[i].finishedProductName} is not found`,
                    code: this.order.orderDispensedPill[i].finishedProductCode
                  });
                }
                if (element.status === 0) {
                  this.errorDispensPillText.push({
                    text: `${this.order.orderDispensedPill[i].finishedProductName} is inactive`,
                    code: this.order.orderDispensedPill[i].finishedProductCode
                  });
                }
                if (element.status === 1) {
                  this.errorDispensPillText.push({
                    text: `${this.order.orderDispensedPill[i].finishedProductName} is expire`,
                    code: this.order.orderDispensedPill[i].finishedProductCode
                  });
                }
                if (element.status === 2) {
                  this.errorDispensPillText.push({
                    text: `${this.order.orderDispensedPill[i].finishedProductName} is out of stock`,
                    code: this.order.orderDispensedPill[i].finishedProductCode
                  });
                }
                this.order.orderDispensedPill[i].isError = true;
              }
            }
          }
        }

      } else {
        this.goAlert(resultDescriptionSystemErrorTitle, resultDescriptionSystemErrorMassage, 'myModalError');
        this.goAlert(response.resultCode, response.resultDescription, 'myModalError');
      }

      this.disbledBtn = {
        'save': false,
        'cancel': false
      };

    } catch (e) {
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

  async getSearchFinishedProducts() {
    try {
      const filterData = {};

      const checkUrl = this.common.checkMockupUrl('', '', filterData, {
        BASE_API: GlobalVariable.BASE_API,
        BASE_MODULE: GlobalVariable.BASE_MODULE,
        BASE_RESOURCE: GlobalVariable.BASE_RESOURCE_FINISHED + GlobalVariable.BASE_RESOURCE_GET_FINISHED_PRODUCT
      });

      const resultCodeSuccess = environment.resultCodeSuccess;
      const response = await this.request.get(checkUrl.url, checkUrl.filter);
      if (response.resultCode === resultCodeSuccess) {
        this.finishedProductList = response.resultData;
      } else {
        this.goAlert(response.resultCode, response.resultDescription, 'myModalError');
      }

    } catch (e) {
      console.log(e);
      const resultDescriptionSystemErrorTitle = environment.resultDescriptionSystemErrorTitle;
      const resultDescriptionSystemErrorMassage = environment.resultDescriptionSystemErrorMassage;
      this.goAlert(resultDescriptionSystemErrorTitle, resultDescriptionSystemErrorMassage, 'myModalError');
    }
  }

  async getSearchPackMedPrice() {
    try {
      const filterData = {};

      const checkUrl = this.common.checkMockupUrl('', '', filterData, {
        BASE_API: GlobalVariable.BASE_API,
        BASE_MODULE: GlobalVariable.BASE_MODULE,
        BASE_RESOURCE: GlobalVariable.BASE_RESOURCE_GET_PACKMED_PRICE
      });

      const resultCodeSuccess = environment.resultCodeSuccess;

      const response = await this.request.get(checkUrl.url, checkUrl.filter);
      if (response.resultCode === resultCodeSuccess) {
        this.packMedList = response.resultData;
      } else {
        this.goAlert(response.resultCode, response.resultDescription, 'myModalError');
      }

    } catch (e) {
      console.log(e);
      const resultDescriptionSystemErrorTitle = environment.resultDescriptionSystemErrorTitle;
      const resultDescriptionSystemErrorMassage = environment.resultDescriptionSystemErrorMassage;
      this.goAlert(resultDescriptionSystemErrorTitle, resultDescriptionSystemErrorMassage, 'myModalError');
    }
  }

  async getSearchRawMaterials() {
    try {
      const filterData = {};

      const checkUrl2 = this.common.checkMockupUrl('', '', {
        orderby: 'no|ASC',
        status: 1
      }, {
        BASE_API: GlobalVariable.BASE_API,
        BASE_MODULE: GlobalVariable.BASE_MODULE,
        BASE_RESOURCE: GlobalVariable.BASE_RESOURCE_GET_RAW_MATERIALS
      });

      const resultCodeSuccess = environment.resultCodeSuccess;
      const res = await this.request.get(checkUrl2.url, checkUrl2.filter);
      if (res.resultCode === resultCodeSuccess) {
        this.rawMatList = res.resultData;
        for (let i = 0; i < res.resultData.length; i++) {
          this.rawMatMapByCode[res.resultData[i].code] = res.resultData[i];
        }
      } else {
        this.goAlert(res.resultCode, res.resultDescription, 'myModalError');
      }
    } catch (e) {
      console.log(e);
      const resultDescriptionSystemErrorTitle = environment.resultDescriptionSystemErrorTitle;
      const resultDescriptionSystemErrorMassage = environment.resultDescriptionSystemErrorMassage;
      this.goAlert(resultDescriptionSystemErrorTitle, resultDescriptionSystemErrorMassage, 'myModalError');
    }
  }

  async searchRawMaterials() {
    console.log("------------------searchRawMaterials")
    // if (this.order.orderStatus == 24) {
    //   return;
    // }
    try {
      const filterData = {
        orderId: this.Id,
      };
      const checkUrl = this.common.checkMockupUrl('', '', filterData, {
        BASE_API: '',
        BASE_MODULE: environment.apiPrefix,
        BASE_RESOURCE: environment.searchRawMaterials
      });
      const resultCodeSuccess = environment.resultCodeSuccess;

      const response = await this.request.get(checkUrl.url, checkUrl.filter);
      if (response.resultCode === resultCodeSuccess) {
        const resultData = await response.resultData;
        // rawMaterials
        this.rawMaterialList = resultData || [];
        console.log("this.order.orderStatus ", this.order.orderStatus)
        // หลังจาก status 17 First Review Done เป็นต้นไปจะต้องดึงจาก order มาแสดงเพราะ มันถูก save ลงตอนขา POST updateFirstReviewDone
        if (+this.order.orderStatus < 17) {

          this.cpdExp = this.cpdExpValue();
          this.bbf = this.bbfValue();
        }
        console.log("this.bbf", this.bbf)
      } else {
        this.rawMaterialList = [];
      }
    } catch (e) {
      console.error(e);
      this.rawMaterialList = [];
    }
  }

  bbfValue() {
    let cpdExp = this.cpdExpValue();
    return cpdExp;
  }

  cpdExpValue() {
    // - เคส ถ้าไม่มี compounded ให้แสดง Cpd. Exp. เป็น N/A
    if (!this.order || !this.order.orderCompound || this.order.orderCompound.length === 0) {
      return "N/A";
    }
    let vivapurCode = this.configList.formula ? this.configList.formula.vivapurCode : ""
    let rawMaterialList = _.cloneDeep(this.rawMaterialList)
    let orderCompound = _.cloneDeep(this.order.orderCompound)
    orderCompound = orderCompound.filter(r => r.rawMaterialName !== 'Vivapur' || r.rawMaterialCode != vivapurCode)
    for (const key in orderCompound) {
      let rawMaterial = rawMaterialList.find(r => r.code === orderCompound[key].rawMaterialCode)
      orderCompound[key].rawMaterialData = rawMaterial ? rawMaterial : false
      orderCompound[key].diff = 0;
      if (rawMaterial) {
        var now = moment(rawMaterial.expiryDate, "YYYY-MM-DD"); //todays date
        var end = moment(new Date()); // another date
        var duration = moment.duration(now.diff(end));
        var days = duration.asDays();
        orderCompound[key].diff = duration.asDays();
      }
    }
    // - เคส ถ้ามี compounded mfg (dd/mm/yyyy) - expiryDate RM (dd/mm/yyyy)) >= 12 เดือน && (mfg (dd/mm/yyyy) - expiryDate RM (dd/mm/yyyy) // ลบเป็นวันไม่สนเดือนและปี) > 0 วัน ) ให้แสดง Cpd. Exp. เป็น RM > 1 Year
    orderCompound.sort((a, b) => b.diff - a.diff);
    if (orderCompound.length && orderCompound[0].rawMaterialData) {
      const now = moment();
      const end = moment(orderCompound[orderCompound.length - 1].rawMaterialData.expiryDate, "YYYY-MM-DD");
      const month = moment(end).diff(now, 'months', true);
      console.log("orderCompound", this.order.productionEndDate, orderCompound[orderCompound.length - 1].rawMaterialData.expiryDate, month);
      if (month >= 12) {
        return "RM > 1 Year"
      } else {
        return end.format('DD/MM/YYYY')
      }
    } else {
      return "N/A";
    }

    // else ให้แสดง Cpd. Exp. set as mfg (dd/mm/yyyy)
    // return this.order.productionEndDate;
  }

  async getSearchPrice() {
    try {
      const filterData = {};

      const checkUrl2 = this.common.checkMockupUrl('', '', {
        orderby: 'updatedAt|DESC'
      }, {
        BASE_API: GlobalVariable.BASE_API,
        BASE_MODULE: GlobalVariable.BASE_MODULE,
        BASE_RESOURCE: GlobalVariable.BASE_RESOURCE_GET_SEARCH_PRICE
      });

      const resultCodeSuccess = environment.resultCodeSuccess;
      const res = await this.request.get(checkUrl2.url, checkUrl2.filter);
      if (res.resultCode === resultCodeSuccess) {
        this.priceList = res.resultData;
      } else {
        this.goAlert(res.resultCode, res.resultDescription, 'myModalError');
      }
    } catch (e) {
      console.log(e);
      const resultDescriptionSystemErrorTitle = environment.resultDescriptionSystemErrorTitle;
      const resultDescriptionSystemErrorMassage = environment.resultDescriptionSystemErrorMassage;
      this.goAlert(resultDescriptionSystemErrorTitle, resultDescriptionSystemErrorMassage, 'myModalError');
    }
  }

  async getSearchCapsules(code) {
    try {
      const filterData = {};

      const checkUrl2 = this.common.checkMockupUrl('', '', {
        code: code
      }, {
        BASE_API: GlobalVariable.BASE_API,
        BASE_MODULE: GlobalVariable.BASE_MODULE,
        BASE_RESOURCE: GlobalVariable.BASE_RESOURCE_GET_SEARCH_CAPSULES
      });

      const resultCodeSuccess = environment.resultCodeSuccess;
      const res = await this.request.get(checkUrl2.url, checkUrl2.filter);
      if (res.resultCode === resultCodeSuccess) {
        this.capsuleList = res.resultData;
      } else {
        this.goAlert(res.resultCode, res.resultDescription, 'myModalError');
      }
    } catch (e) {
      console.log(e);
      const resultDescriptionSystemErrorTitle = environment.resultDescriptionSystemErrorTitle;
      const resultDescriptionSystemErrorMassage = environment.resultDescriptionSystemErrorMassage;
      this.goAlert(resultDescriptionSystemErrorTitle, resultDescriptionSystemErrorMassage, 'myModalError');
    }
  }

  async searchOrderById() {
    try {
      const filterData = {
        orderId: this.Id,
      };
      const checkUrl = this.common.checkMockupUrl('', '', filterData, {
        BASE_API: '',
        BASE_MODULE: environment.apiPrefix,
        BASE_RESOURCE: environment.searchOrderById
      });
      const resultCodeSuccess = environment.resultCodeSuccess;
      const response = await this.request.get(checkUrl.url, checkUrl.filter);
      if (response.resultCode === resultCodeSuccess) {
        const resultData = response.resultData;
        if (resultData && resultData.order) {
          this.order = resultData.order;
          this.order.isOrderPcCheckUrgent = this.order.isOrderPcCheckUrgent ? true : false;
          this.order.isOrderPcCheckRm = this.order.isOrderPcCheckRm ? true : false;
          this.order.isOrderPcCheckAllergy = this.order.isOrderPcCheckAllergy ? true : false;
          this.order.isOrderPcCheckMed = this.order.isOrderPcCheckMed ? true : false;
          this.order.isOrderPcCheckWf2 = this.order.isOrderPcCheckWf2 ? true : false;
          this.order.isOrderQtCheckNoBatch = this.order.isOrderQtCheckNoBatch ? true : false;
          this.order.isOrderQtCheckNoPack = this.order.isOrderQtCheckNoPack ? true : false;
          this.order.isOrderQtCheckStaff = this.order.isOrderQtCheckStaff ? true : false;
          this.order.isSeparateMeal = this.order.isSeparateMeal ? true : false;
          this.order.orderDate = this.order.orderDate ? moment(this.order.orderDate, 'DD/MM/YYYY HH:mm').format('YYYY-MM-DD') : null;
          this.order.orderCompound = resultData.orderCompound || [];
          this.order.orderDispensedPill = resultData.orderDispensedPill || [];
          this.orderStatusCheckError = this.orderStatusMap[this.order.orderStatus];
        }
      }
    } catch (e) {
      console.log(e);
      const resultDescriptionSystemErrorTitle = environment.resultDescriptionSystemErrorTitle;
      const resultDescriptionSystemErrorMassage = environment.resultDescriptionSystemErrorMassage;
      this.goAlert(resultDescriptionSystemErrorTitle, resultDescriptionSystemErrorMassage, 'myModalError');
    }
  }

  async updateWorkingBy() {
    try {
      const checkUrl = this.common.checkMockupUrl('', '', '', {
        BASE_API: '',
        BASE_MODULE: environment.apiPrefix,
        BASE_RESOURCE: environment.updateWorkingBy,
      });
      this.request.post(checkUrl.url, { orderId: this.Id });
    } catch (e) {
      console.log(e);
    }
  }

  customStore() {
    const dataSource: any = {};

    dataSource.store = new CustomStore({
      load: (loadOptions: any) => {
        // console.log('loadOption : ', loadOptions);
        const filterData: any = {
          finishedProductName: loadOptions.searchValue,
          status: 1
        };
        // console.log('filterData : ', filterData);

        const checkUrl = this.common.checkMockupUrl('', '', filterData, {
          BASE_API: GlobalVariable.BASE_API,
          BASE_MODULE: GlobalVariable.BASE_MODULE,
          BASE_RESOURCE: GlobalVariable.BASE_RESOURCE_FINISHED + GlobalVariable.BASE_RESOURCE_GET_FINISHED_PRODUCT
        });


        return this.request.get(checkUrl.url, checkUrl.filter)
          .then(response => {
            if (response) {
              // console.log('response', response);

              const resResultCode = response.resultCode;
              // // this.userMessage = response.userMessage;
              const resultCodeSuccess = environment.resultCodeSuccess;
              const resultCodeDataNotFound = environment.resultCodeDataNotFound;
              const resultDescriptionDataNotFoundTitle = environment.resultDescriptionDataNotFoundTitle;
              const resultDescriptionDataNotFoundMassage = environment.resultDescriptionDataNotFoundMassage;
              const resultDescriptionSystemErrorTitle = environment.resultDescriptionSystemErrorTitle;
              const resultDescriptionSystemErrorMassage = environment.resultDescriptionSystemErrorMassage;
              const resultCodeDbError = environment.resultCodeDbError;
              const resultDescriptionDbErrorTitle = environment.resultDescriptionDbErrorTitle;
              const resultDescriptionDbErrorMassage = environment.resultDescriptionDbErrorMassage;
              // console.log(this.resResultCode);
              if (resResultCode === resultCodeSuccess) {
                let resultData = response.resultData;
                resultData = resultData.map((r, i) => {
                  return { ...r, id: i };
                });
                this.resFinished = resultData;
              }
            }
            return {
              data: this.resFinished,
            };
          })
          .catch(error => {
            setTimeout(() => {
            }, 200);

            // console.log('return catch');
            return {
              data: [],
            };
          });

      },
    });
    // console.log(dataSource);
    return dataSource;
  }

  customStore2() {
    const dataSource: any = {};

    dataSource.store = new CustomStore({
      load: (loadOptions: any) => {
        // console.log('loadOption : ', loadOptions);
        const filterData: any = {
          hn: loadOptions.searchValue
        };

        if (this.common.isRoleClinics(this.role)) {
          filterData.locationType = 2;
          filterData.locationDetail = this.role;
        }
        // console.log('filterData : ', filterData);

        const checkUrl = this.common.checkMockupUrl('', '', filterData, {
          BASE_API: '',
          BASE_MODULE: environment.apiPrefix,
          BASE_RESOURCE: environment.searchDdlPatientReserve
        });


        return this.request.get(checkUrl.url, checkUrl.filter)
          .then(response => {
            if (response) {
              // console.log('response', response);

              const resResultCode = response.resultCode;
              // // this.userMessage = response.userMessage;
              const resultCodeSuccess = environment.resultCodeSuccess;
              const resultCodeDataNotFound = environment.resultCodeDataNotFound;
              const resultDescriptionDataNotFoundTitle = environment.resultDescriptionDataNotFoundTitle;
              const resultDescriptionDataNotFoundMassage = environment.resultDescriptionDataNotFoundMassage;
              const resultDescriptionSystemErrorTitle = environment.resultDescriptionSystemErrorTitle;
              const resultDescriptionSystemErrorMassage = environment.resultDescriptionSystemErrorMassage;
              const resultCodeDbError = environment.resultCodeDbError;
              const resultDescriptionDbErrorTitle = environment.resultDescriptionDbErrorTitle;
              const resultDescriptionDbErrorMassage = environment.resultDescriptionDbErrorMassage;
              // console.log(this.resResultCode);
              if (resResultCode === resultCodeSuccess) {
                let resultData = response.resultData;
                resultData = resultData.map((r, i) => {
                  return { ...r, id: i };
                });
                this.resHn = resultData;
              }
            }
            return {
              data: this.resHn,
            };
          })
          .catch(error => {
            setTimeout(() => {
            }, 200);

            // console.log('return catch');
            return {
              data: [],
            };
          });

      },
    });
    // console.log(dataSource);
    return dataSource;
  }

  customStore3() {
    const dataSource: any = {};

    dataSource.store = new CustomStore({
      load: (loadOptions: any) => {
        // console.log('loadOption : ', loadOptions);
        const filterData: any = {
          patientName: loadOptions.searchValue
        };

        if (this.common.isRoleClinics(this.role)) {
          filterData.locationType = 2;
          filterData.locationDetail = this.role;
        }

        const checkUrl = this.common.checkMockupUrl('', '', filterData, {
          BASE_API: '',
          BASE_MODULE: environment.apiPrefix,
          BASE_RESOURCE: environment.searchDdlPatientReserve
        });


        return this.request.get(checkUrl.url, checkUrl.filter)
          .then(response => {
            if (response) {
              // console.log('response', response);

              const resResultCode = response.resultCode;
              // // this.userMessage = response.userMessage;
              const resultCodeSuccess = environment.resultCodeSuccess;
              const resultCodeDataNotFound = environment.resultCodeDataNotFound;
              const resultDescriptionDataNotFoundTitle = environment.resultDescriptionDataNotFoundTitle;
              const resultDescriptionDataNotFoundMassage = environment.resultDescriptionDataNotFoundMassage;
              const resultDescriptionSystemErrorTitle = environment.resultDescriptionSystemErrorTitle;
              const resultDescriptionSystemErrorMassage = environment.resultDescriptionSystemErrorMassage;
              const resultCodeDbError = environment.resultCodeDbError;
              const resultDescriptionDbErrorTitle = environment.resultDescriptionDbErrorTitle;
              const resultDescriptionDbErrorMassage = environment.resultDescriptionDbErrorMassage;
              // console.log(this.resResultCode);
              if (resResultCode === resultCodeSuccess) {
                let resultData = response.resultData;
                resultData = resultData.map((r, i) => {
                  return { ...r, id: i };
                });
                this.resPatient = resultData;
              }
            }
            return {
              data: this.resPatient,
            };
          })
          .catch(error => {
            setTimeout(() => {
            }, 200);

            // console.log('return catch');
            return {
              data: [],
            };
          });

      },
    });
    // console.log(dataSource);
    return dataSource;
  }

  async btnSubmit() {
    try {
      // this.disbledBtn = {
      //   'save': true,
      //   'cancel': true
      // };
      this.saved = true;
      const requiredData: boolean = this.checkRequiredData();
      const resultCodeSuccess = environment.resultCodeSuccess;

      console.log(this.order);
      // if(this.pageType == 'new'){
      //   this.goAlert('', '', 'myModalSuccess');
      // }else{
      if (this.pageType != 'new') {
        this.goAlert('', '', 'myModalPrintDocument', {
          printPageList: [
            {
              name: 'Nutraceuticals Quotation',
              link: '#'
            },
          ],
          isShowPrintLabel: false
        });
        return;
      }

      Object.keys(this.f).forEach((control: string) => {
        const Control: AbstractControl = this.f[control];
        if (Control.invalid) {
          Control.markAsDirty();
        }
      });
      for (const i in this.formDispensedPill.controls) {
        const item: any = this.formDispensedPill.controls[i];
        Object.keys(item.controls).forEach((control: any) => {
          const Control: AbstractControl = item.controls[control];
          if (Control.invalid) {
            Control.markAsDirty();
          }
        });
      }

      if (requiredData) {

        // if(this.pageType ===  'edit'){
        //   addData.binId = this.Id
        // }
        const orderCompound = [];
        let count = 1;
        for (const i in this.order.orderCompound) {
          // tslint:disable-next-line:max-line-length
          if (this.order.orderCompound[i].dosePerDay != null && this.order.orderCompound[i].dosePerDay != '' && this.order.orderCompound[i].dosePerDay != undefined) {
            this.order.orderCompound[i].no = count;
            if (this.rawMatMapByCode[this.order.orderCompound[i].rawMaterialCode]) {
              this.order.orderCompound[i].retailPrice = this.rawMatMapByCode[this.order.orderCompound[i].rawMaterialCode].retailPrice;
            }
            orderCompound.push(this.order.orderCompound[i]);
            count++;
          }
        }
        const orderDispensedPill = [];
        for (const i in this.order.orderDispensedPill) {
          this.order.orderDispensedPill[i].no = +i + 1;
          orderDispensedPill.push(this.order.orderDispensedPill[i]);
        }
        const addData: any = {
          tariff: this.order.tariff,
          hn: this.order.hn,
          patientName: this.order.patientName,
          phone: this.order.phone,
          orderDate: this.order.orderDate,
          supplyDay: +this.order.supplyDay,
          physician: this.order.physician,
          orderCompound: orderCompound,
          totalCapPerDay: this.order.totalCapPerDay,
          totalCapRemark: this.order.totalCapRemark,
          orderDispensedPill: orderDispensedPill,
          orderPharmacyNote: this.order.orderPharmacyNote,
          additionalNoteFromDoctor: this.order.additionalNoteFromDoctor,
          orderPharmacyNoteRemark: this.order.orderPharmacyNoteRemark,
          address: this.order.address,
          district: this.order.district,
          subdistrict: this.order.subdistrict,
          province: this.order.province,
          postcode: this.order.postcode,
          locationDetail: this.order.locationDetail,
        };
        console.log('addData', addData);
        let checkUrl = null;
        if (this.pageType === 'new') {
          checkUrl = this.common.checkMockupUrl('', GlobalVariable.RESOURCE, {}, {
            BASE_API: GlobalVariable.BASE_API,
            BASE_MODULE: GlobalVariable.BASE_MODULE,
            BASE_RESOURCE: GlobalVariable.BASE_RESOURCE + GlobalVariable.BASE_RESOURCE_CREATE
          });
        } else {
          checkUrl = this.common.checkMockupUrl('', GlobalVariable.RESOURCE, {}, {
            BASE_API: GlobalVariable.BASE_API,
            BASE_MODULE: GlobalVariable.BASE_MODULE,
            BASE_RESOURCE: GlobalVariable.BASE_RESOURCE + GlobalVariable.BASE_RESOURCE_UPDATE
          });
        }

        const response = await this.request.post(checkUrl.url, this.pageType === 'new' ? addData : addData);

        if (response.resultCode === resultCodeSuccess) {

          this.goAlert('', '', 'myModalSuccess');
        } else {
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
    for (const key in this.orderForm.controls) {
      if (this.orderForm.controls[key].errors) {
        this.orderForm.controls[key].setErrors({ 'forceRequired': true });
        this.orderForm.controls[key].markAsDirty();
      } else {
        this.orderForm.controls[key].updateValueAndValidity();
      }
    }

    if (this.orderForm.valid) {
      // check duplicate Dispensed Pill
      for (let i = 0; i < this.order.orderDispensedPill.length; i++) {
        const finishedProductName = this.order.orderDispensedPill[i].finishedProductName;
        if (finishedProductName && this.isDuplicateDispensedPill[finishedProductName] > 1) {
          // is duplicate
          return false;
        }
      }

      // // check min/max Dose Per Day Compound
      // for (let i = 0; i < this.order.orderCompound.length; i++) {
      //   const invalid = this.order.orderCompound[i].invalid;
      //   if (invalid) {
      //     return false;
      //   }
      // }
    }
    return this.orderForm.valid;
  }
  numberOnly(event, numOnly?): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    const inputEl = event.target || event.srcElement;
    const inputValue = inputEl.value;

    var selectionStart = 0;
    var selectionEnd = 0;


    if (typeof inputEl.selectionStart === 'number' && typeof inputEl.selectionEnd === 'number') {
      selectionStart = inputEl.selectionStart;
      selectionEnd = inputEl.selectionEnd;
    }

    var isAllSelected = selectionStart === 0 && selectionEnd === inputValue.length;

    
    // if (charCode === 48 && (inputValue.length === 0 || isAllSelected)) {
    //   return false;
    // }

    if (charCode === 46 && !numOnly) {
      return true;
    }

    // ❌ ห้ามอักขระอื่นที่ไม่ใช่ตัวเลข
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }

    return true;
  }

  goAlert(userTitle, userMessage, modalId, data?) {
    const dataAlert: any = {
      'modalId': modalId,
      'userTitle': userTitle,
      'userMessage': userMessage
    };
    if (data) {
      dataAlert.data = data;
    }
    this.myModal.openModal(dataAlert);
  }

  onClickBack() {
    if (this.common.isRoleClinics(this.role)) {
      this.router.navigate(['/order-management', 'all-orders']);
    } else {
      this.router.navigate(['/order-management', 'orders-pharmacist-view']);
    }
  }

  onClickBackEdit() {
    this.router.navigate(['/order-management', 'orders-pharmacist-view', this.Id, 'edit']);
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
    const textAreaAutoHeight = this.common.textAreaAutoHeightFn();
  }

  addDispensed() {
    if (this.pageType == 'new') {
      this.saved = false;
      this.formDispensedPill.push(this.fb.group({
        txtNo: new FormControl(''),
        txtFinishedProductCode: new FormControl(''),
        txtFinishedProductName: new FormControl('', Validators.required),
        txtUnit: new FormControl({ value: '', disabled: false }, Validators.required),
        txtDosePerDay: new FormControl('', Validators.required),
        txtRemark: new FormControl(''),
        isCheckedDispensedPill: new FormControl(false)
      }));
      this.order.orderDispensedPill.push({
        no: null,
        finishedProductCode: null,
        finishedProductName: null,
        unit: null,
        dosePerDay: null,
        remark: null,
      });
    } else {
      this.formDispensedPill.push(this.fb.group({
        txtNo: new FormControl(''),
        txtFinishedProductCode: new FormControl(''),
        txtFinishedProductName: new FormControl('', Validators.required),
        txtUnit: new FormControl({ value: '', disabled: false }, Validators.required),
        txtDosePerDay: new FormControl('', Validators.required),
        txtTotalPill: new FormControl(''),
        txtRemark: new FormControl(''),
        isCheckedDispensedPill: new FormControl(false)
      }));
      this.order.orderDispensedPill.push({
        no: null,
        finishedProductCode: null,
        finishedProductName: null,
        unit: null,
        dosePerDay: null,
        totalPill: null,
        remark: null,
      });
    }
  }

  checkValid(e: any, target: any) {
    return e.controls[target].invalid && e.controls[target].dirty;
  }

  delDispensed(item) {
    let index = this.errorDispensPillText.findIndex(i => i.code === this.order.orderDispensedPill[item].finishedProductCode)
    if (index > -1) {
      this.errorDispensPillText.splice(index, 1);
    }
    this.order.orderDispensedPill.splice(item, 1);
    this.formDispensedPill.removeAt(item);
    this.isDuplicateDispensedPill = _.countBy(this.order.orderDispensedPill, 'finishedProductName');

  }

  addDetails() {
    this.detailList.push({
      name: null,
      quantity: null,
      uom: null,
      unitPrice: null,
      amount: null,
      packCharge: 0,
      batchCharge: 0,
      staffProductionCharge: 0,
    });

  }

  delDetails(item) {
    this.detailList.splice(item, 1);
  }

  changeOrder(isCalTotalPill = true) {
    if (this.order.isSeparateMeal) {
      this.cloneSepTotalCap = Math.ceil(+this.order.sepLastMorningCapPerDay + +this.order.sepLastLunchCapPerDay + +this.order.sepLastEveningCapPerDay + +this.order.sepLastBedtimeCapPerDay) || '';
      this.order.calculatedDay =
        Math.ceil(((+this.order.sepLastMorningCapPerDay * +this.order.sepMorningSupplyDay) +
          (+this.order.sepLastLunchCapPerDay * +this.order.sepLunchSupplyDay) +
          (+this.order.sepLastEveningCapPerDay * +this.order.sepEveningSupplyDay) +
          (+this.order.sepLastBedtimeCapPerDay * +this.order.sepBedtimeSupplyDay)) / +this.cloneSepTotalCap) || '';
      
      // ลบการตรวจสอบจำนวนฟิลด์ที่กรอก เพื่อให้ปล่อยว่างได้
      this.invalidMeal = false;

      if (+this.order.sepTotalCap != +this.cloneSepTotalCap) {
        this.invalidTotalCap = true;
      } else {
        this.invalidTotalCap = false;
      }

      if (+this.order.calculatedDay == 0) {
        this.invalidCalculatedDay = true;
      } else {
        this.invalidCalculatedDay = false;
      }

      // this.toggleSupplyField(this.order.sepLastMorningCapPerDay, 'txtMorningSupply', 'sepMorningSupplyDay');
      // this.toggleSupplyField(this.order.sepLastLunchCapPerDay, 'txtLunchSupply', 'sepLunchSupplyDay');
      // this.toggleSupplyField(this.order.sepLastEveningCapPerDay, 'txtEveningSupply', 'sepEveningSupplyDay');
      // this.toggleSupplyField(this.order.sepLastBedtimeCapPerDay, 'txtBedtimeSupply', 'sepBedtimeSupplyDay');
    }
    if (isCalTotalPill) {
      this.fnCalTotalPill();
    }
  }
  toggleSupplyField(capValue: any, formControlName: string, modelProp: string) {
    const cap = +capValue;
    if (cap > 0) {
      this.orderForm.controls[formControlName].enable();
    } else {
      this.orderForm.controls[formControlName].setValue('');
      this.orderForm.controls[formControlName].enable();
      this.order[modelProp] = '';
    }
  }
  updateDispensedPill(e, index) {
    if (e.itemData.uom === 'Box' || e.itemData.uom === 'Bottle') {
      this.order.orderDispensedPill[index].unit = e.itemData.unit;
    } else {
      this.order.orderDispensedPill[index].unit = e.itemData.uom;
    }
    this.order.orderDispensedPill[index].finishedProductCode = e.itemData.code;
    const cloneFname = _.cloneDeep(this.order.orderDispensedPill[index].finishedProductName);

    if (this.order.orderDispensedPill[index].finishedProductName == e.itemData.finishedProductName) {
      this.order.orderDispensedPill[index].finishedProductName = ' ';
      setTimeout(() => {
        this.order.orderDispensedPill[index].finishedProductName = cloneFname;
      }, 1);
    } else {
      this.order.orderDispensedPill[index].finishedProductName = e.itemData.finishedProductName;
    }
    this.isDuplicateDispensedPill = _.countBy(this.order.orderDispensedPill, 'finishedProductName');

    this.order.orderDispensedPill[index].isError = false;
  }

  fnReCheckErrorDispensedPill() {

  }

  updateDispensedPill2(e, index) {
    if (e.value == null) {
      this.order.orderDispensedPill[index].unit = null;
      this.order.orderDispensedPill[index].finishedProductCode = null;
      this.order.orderDispensedPill[index].finishedProductName = null;
    }
  }

  onFocusOutDispensedPill(e, index, item, key, keyInput) {
    const inputValue = e.event.target.value;
    if (inputValue !== this.order.orderDispensedPill[index][key]) {
      // e.event.target.value = this.patientInfo[key];
      if (inputValue === '') {
        item.controls[keyInput].reset('');
        this.order.orderDispensedPill[index].unit = null;
        this.order.orderDispensedPill[index].finishedProductCode = null;
        this.order.orderDispensedPill[index].finishedProductName = null;
      } else {
        item.controls[keyInput].reset(this.order.orderDispensedPill[index][key]);
      }
    }
  }

  async searchDdlPatients(hn) {
    try {
      const checkUrl = this.common.checkMockupUrl('', '', { hn }, {
        BASE_API: GlobalVariable.BASE_API,
        BASE_MODULE: GlobalVariable.BASE_MODULE,
        BASE_RESOURCE: GlobalVariable.BASE_RESOURCE_GET_SEARCH_PATIENTS
      });
      const resultCodeSuccess = environment.resultCodeSuccess;
      const response = await this.request.get(checkUrl.url, checkUrl.filter);
      if (response.resultCode === resultCodeSuccess) {
        return response.resultData[0] || {};
      } else {
        return [];
      }
    } catch (e) {
      console.error('searchDdlPatients error', e);
    }
  }

  updateHn(e) {
    // console.log(e)
    // console.log(this.order.hn)
    // console.log(e.selectedItem.hn)
    // // if(this.order.hn != e.selectedItem.hn && (typeof this.order.hn === 'object' && this.order.hn.hn != e.selectedItem.hn)){
    // if(this.order.hn != e.selectedItem.hn){
    //   this.order.hn = this.order.hn == e.selectedItem.hn ? this.order.hn : e.selectedItem.hn
    // }
    //   // console.log("yes")
    // // }
    // this.order.patientName = this.order.patientName == e.selectedItem.patientName ? this.order.patientName : e.selectedItem.patientName
    // this.order.physician = e.selectedItem.physician
    // this.order.orderPharmacyNote = e.selectedItem.orderPharmacyNote
    // this.order.address = e.selectedItem.address
    // this.order.district = e.selectedItem.district
    // this.order.subdistrict = e.selectedItem.subdistrict
    // this.order.province = e.selectedItem.province
    // this.order.postcode = e.selectedItem.postcode

    // this.cloneAutoHn = e.selectedItem.hn
    // this.cloneAutoPat = e.selectedItem.patientName
    // console.log(this.order.hn)
  }

  async updateHn2(e) {

    const hn = e.itemData.hn;
    const itemData = await this.searchDdlPatients(hn);

    this.cloneAutoHn = _.cloneDeep(this.order.hn);
    this.cloneAutoPat = _.cloneDeep(this.order.patientName);
    if (this.order.hn == itemData.hn) {
      this.order.hn = ' ';
      setTimeout(() => {
        this.order.hn = this.cloneAutoHn;
      }, 1);
    } else {
      this.order.hn = itemData.hn;
      this.cloneAutoHn = _.cloneDeep(this.order.hn);
    }
    if (this.order.patientName == itemData.patientName) {
      this.order.patientName = ' ';
      setTimeout(() => {
        this.order.patientName = this.cloneAutoPat;
      }, 1);
    } else {
      this.order.patientName = itemData.patientName;
      this.cloneAutoPat = _.cloneDeep(this.order.patientName);
    }
    this.order.physician = itemData.physician;
    if (itemData.orderPharmacyNote) {
      this.order.orderPharmacyNote = itemData.orderPharmacyNote;
    } else {
      const findPharmacyNote = this.pharmacyNotesList.find(obj => obj.hn === this.order.hn);
      if (findPharmacyNote) {
        this.order.orderPharmacyNote = findPharmacyNote.orderNote;
      } else {
        this.order.orderPharmacyNote = '';
      }
    }
    this.order.phone = itemData.phone;
    this.order.address = itemData.address;
    this.order.district = itemData.district;
    this.order.subdistrict = itemData.subdistrict;
    this.order.province = itemData.province;
    this.order.postcode = itemData.postcode;
    this.order.locationDetail = itemData.locationDetail;
    // // }
    // this.cloneAutoHn = itemData.hn
    // this.cloneAutoPat = itemData.patientName
  }

  updateHn3(e) {
    this.order.hn = ' ';
    setTimeout(() => {
      this.order.hn = this.cloneAutoHn;
    }, 1);

    this.order.patientName = ' ';
    setTimeout(() => {
      this.order.patientName = this.cloneAutoPat;
    }, 1);
    // if(this.order.hn == e.itemData.hn){
    //   setTimeout(() => {this.order.hn = this.cloneAutoHn},1)
    // }else{
    //   this.order.hn = e.itemData.hn
    // }
    // if(this.order.patientName == e.itemData.patientName){
    //   this.order.patientName = " "
    //   setTimeout(() => {this.order.patientName = this.cloneAutoPat},1)
    // }else{
    //   this.order.patientName = e.itemData.patientName
    // }
  }

  async calDosePerDay() {
    let capPerDay = 0;
    let vivapur = 0;
    for (const i in this.order.orderCompound) {
      if (this.order.orderCompound[i].rawMaterialCode != this.configList.formula.vivapurCode) {
        let actualDose = 0;
        let capsuleCap = 0;
        if (this.order.orderCompound[i].dosePerDay != null && this.order.orderCompound[i].dosePerDay != '' && this.order.orderCompound[i].dosePerDay != undefined) {
          actualDose = +this.order.orderCompound[i].dosePerDay / +this.order.orderCompound[i].strength;
          capsuleCap = +actualDose / +this.order.orderCompound[i].vtlCapPackingStat;
          capPerDay += +capsuleCap;
        }
      }
    }
    vivapur = capPerDay;
    console.log('capPerDay', capPerDay);
    let addVivapur = false;
    if (vivapur === this.configList.formula.vivapurfractionE) {
      addVivapur = false;
    } else if (vivapur < this.configList.formula.vivapurfractionLT) {
      addVivapur = true;
    } else if ((vivapur % 1 <= this.configList.formula.vivapurfractionGTE) || (vivapur % 1 >= this.configList.formula.vivapurfractionLTE)) {
      addVivapur = false;
    } else {
      addVivapur = true;
    }

    console.log('addVivapur', addVivapur);
    if (addVivapur) {
      if (this.capsuleList.length == 0) {
        await this.getSearchCapsules(this.configList.formula.capsuleNormal);
      }
      const viva = (1 - (+capPerDay % 1)) * +this.capsuleList[0].packingStat;
      console.log('viva', viva);
      const indexViva = this.order.orderCompound.findIndex(x => x.rawMaterialCode == this.configList.formula.vivapurCode);
      this.order.orderCompound[indexViva].dosePerDay = +viva.toFixed(2);
      const vivaCapPerDay = (+viva / +this.order.orderCompound[indexViva].strength) / +this.order.orderCompound[indexViva].vtlCapPackingStat;
      console.log('vivaCapPerDay', vivaCapPerDay);
      capPerDay += +vivaCapPerDay;
    } else {
      const indexViva = this.order.orderCompound.findIndex(x => x.rawMaterialCode == this.configList.formula.vivapurCode);
      this.order.orderCompound[indexViva].dosePerDay = null;
    }
    this.order.totalCapPerDay = +capPerDay.toFixed(0);
    this.order.sepTotalCap = +capPerDay.toFixed(0);
    console.log('totalcap', capPerDay);
    this.changeOrder();
  }

  isAllPharmacyCheckChecked(): boolean {
    const targetCheckboxes = this.checkboxes
      .filter(cb => cb.name === 'pharmacyCheck');
    if (targetCheckboxes.length === 0) {
      return true;
    }

    return targetCheckboxes.every(cb => cb.value === true);
  }

  async previewQuotation() {
    try {
      //update state checkbox
      this.updateAllCompoundAndPillChecked()
      console.log("---submit preview", this.isAllPharmacyCheckChecked())
      console.log("----", this.allCompoundAndPillChecked)
      if (!this.allCompoundAndPillChecked || !this.isAllPharmacyCheckChecked()) {
        this.goAlert('Field is required', 'Your have left a field empty and a value must be entered.', 'myModalWarning');
        if (!this.allCompoundAndPillChecked) {
          this.formCompound.controls.map((control, i) => {
            const isChecked = control.get('isCheckedCompound').value;
            const item = this.order.orderCompound[i];
            const dosePerDay = item.dosePerDay;
            const rawMaterialName = item.rawMaterialName;
            const isError = item.isError;
            if (rawMaterialName === 'Vivapur' || isError === true) {
              return true;
            }
            if (isChecked && dosePerDay) {
              return true;
            } else if (!dosePerDay && !isChecked) {
              return true;
            } else {
              this.order.orderCompound[i].invalidCheckbox = true
            }
          });

          this.formDispensedPill.controls.map((control, i) => {
            const isChecked = control.get('isCheckedDispensedPill').value;
            const item = this.order.orderDispensedPill[i];
            const dosePerDay = item.dosePerDay;
            const totalPill = item.totalPill;

            if (isChecked && dosePerDay && totalPill) {
              return true;
            } else if (!dosePerDay && !totalPill && !isChecked) {
              return true;
            } else {
              this.order.orderDispensedPill[i].invalidCheckbox = !totalPill ? true : false
              this.order.orderDispensedPill[i].invalidCheckboxTotalPill = !dosePerDay ? true : false
            }
          })
        }
        return
      }

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

      Object.keys(this.f).forEach((control: string) => {
        const Control: AbstractControl = this.f[control];
        if (Control.invalid) {
          Control.markAsDirty();
        }
      });
      for (const i in this.formDispensedPill.controls) {
        const item: any = this.formDispensedPill.controls[i];
        Object.keys(item.controls).forEach((control: any) => {
          const Control: AbstractControl = item.controls[control];
          if (Control.invalid) {
            Control.markAsDirty();
          }
        });
      }


      if (requiredData) {
        this.changeOrder(false);
        console.log(this.order);
        if (this.order.isSeparateMeal) {
          this.invalidMeal = false;
          let invalid = false;
          if (+this.order.sepTotalCap != +this.cloneSepTotalCap) {
            this.invalidTotalCap = true;
            invalid = true;
          } else {
            this.invalidTotalCap = false;
          }
          if (+this.order.calculatedDay == 0) {
            this.invalidCalculatedDay = true;
            invalid = true;
          } else {
            this.invalidCalculatedDay = false;
          }
          if (this.invalidMealSupplyDayMorning
            || this.invalidMealSupplyDayLunch
            || this.invalidMealSupplyDayEvening
            || this.invalidMealSupplyDayBedtime) {
            invalid = true;
          }
          if (invalid) {
            this.goAlert('Field is required', 'Your have left a field empty and a value must be entered.', 'myModalWarning');
            return;
          }
        }
        if (this.errorDispensPillText.length > 0 && _.some(this.order.orderDispensedPill, ['isError', true])) {
          this.goAlert('Field is required', 'Your have left a field empty and a value must be entered.', 'myModalWarning');
          return;
        }
        const orderCompound = [];
        let count = 1;
        for (const i in this.order.orderCompound) {
          if (this.order.orderCompound[i].dosePerDay != null && this.order.orderCompound[i].dosePerDay != '' && this.order.orderCompound[i].dosePerDay != undefined) {
            this.order.orderCompound[i].no = count;
            if (this.rawMatMapByCode[this.order.orderCompound[i].rawMaterialCode]) {
              this.order.orderCompound[i].retailPrice = this.rawMatMapByCode[this.order.orderCompound[i].rawMaterialCode].retailPrice;
            }
            orderCompound.push(this.order.orderCompound[i]);
            count++;
          }
        }
        const orderDispensedPill = [];
        for (const i in this.order.orderDispensedPill) {
          this.order.orderDispensedPill[i].no = +i + 1;
          orderDispensedPill.push(this.order.orderDispensedPill[i]);
        }
        const payload = {
          orderId: this.order.orderId,
          orderPharmacyNoteRemark: this.order.orderPharmacyNoteRemark,
          additionalNoteFromDoctor: this.order.additionalNoteFromDoctor,
          isSeparateMeal: this.order.isSeparateMeal,
          sepLastMorningCapPerDay: this.order.isSeparateMeal ? +this.order.sepLastMorningCapPerDay : null,
          sepLastLunchCapPerDay: this.order.isSeparateMeal ? +this.order.sepLastLunchCapPerDay : null,
          sepLastEveningCapPerDay: this.order.isSeparateMeal ? +this.order.sepLastEveningCapPerDay : null,
          sepLastBedtimeCapPerDay: this.order.isSeparateMeal ? +this.order.sepLastBedtimeCapPerDay : null,
          sepMorningSupplyDay: this.order.isSeparateMeal ? +this.order.sepMorningSupplyDay : null,
          sepLunchSupplyDay: this.order.isSeparateMeal ? +this.order.sepLunchSupplyDay : null,
          sepEveningSupplyDay: this.order.isSeparateMeal ? +this.order.sepEveningSupplyDay : null,
          sepBedtimeSupplyDay: this.order.isSeparateMeal ? +this.order.sepBedtimeSupplyDay : null,
          sepTotalCap: this.order.isSeparateMeal ? +this.order.sepTotalCap : null,
          calculatedDay: this.order.isSeparateMeal ? +this.order.calculatedDay : null,
          isOrderPcCheckUrgent: this.order.isOrderPcCheckUrgent,
          isOrderPcCheckRm: this.order.isOrderPcCheckRm,
          isOrderPcCheckAllergy: this.order.isOrderPcCheckAllergy,
          isOrderPcCheckMed: this.order.isOrderPcCheckMed,
          isOrderPcCheckWf2: this.order.isOrderPcCheckWf2,
          isOrderQtCheckNoBatch: this.order.isOrderQtCheckNoBatch,
          isOrderQtCheckNoPack: this.order.isOrderQtCheckNoPack,
          isOrderQtCheckStaff: this.order.isOrderQtCheckStaff,
          orderCompound: orderCompound,
          totalCapPerDay: this.order.totalCapPerDay,
          totalCapRemark: this.order.totalCapRemark,
          orderDispensedPill: orderDispensedPill,
          orderPharmacyNote: this.order.orderPharmacyNote,
          supplyDay: this.order.supplyDay
        };
        console.log(payload);
        let checkUrl = null;

        checkUrl = this.common.checkMockupUrl('', GlobalVariable.RESOURCE, {}, {
          BASE_API: GlobalVariable.BASE_API,
          BASE_MODULE: GlobalVariable.BASE_MODULE,
          BASE_RESOURCE: GlobalVariable.BASE_RESOURCE + GlobalVariable.BASE_RESOURCE_UPDATE_REVIEW_ORDER
        });

        const response = await this.request.post(checkUrl.url, payload);

        const resultCodeSuccess = environment.resultCodeSuccess;
        const resultCodeMissingParameter = environment.resultCodeMissingParameter;
        const resultCodeDataNotFound = environment.resultCodeDataNotFound;

        const userMessageAlreadyExisted = response.userMessage;
        if (response.resultCode === resultCodeSuccess) {
          this.router.navigate(['/order-management', 'orders-pharmacist-view', this.Id, 'quotation']);
          localStorage.removeItem('errorOrder')
        } else {
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

  changeTotalRemark(e) {
    console.log(e.target.value);
    this.order.totalCapRemark = e.target.value;
  }

  confirmCreateQuotation() {
    const requiredData: boolean = this.checkRequiredData();
    Object.keys(this.f).forEach((control: string) => {
      const Control: AbstractControl = this.f[control];
      if (Control.invalid) {
        Control.markAsDirty();
      }
    });

    if (requiredData) {
      // this.goAlert('Are you sure', 'You want to create quotation?', 'myModalConfirm');
      this.goAlert('Are you sure', 'You want to create quotation ?', 'myModalConfirm', {
        iconURL: '../../assets/icon-md/c15.svg'
      });
    } else {
      console.log('กรุณากรอกข้อมูลให้ถูกต้อง');
      this.goAlert('Field is required', 'Your have left a field empty and a value must be entered.', 'myModalWarning');
      // $(this.modalRequired.nativeElement).modal('show');
      this.disbledBtn = {
        'save': false,
        'cancel': false
      };

    }
  }

  async createQuotation() {
    try {

      const requiredData: boolean = this.checkRequiredData();
      Object.keys(this.f).forEach((control: string) => {
        const Control: AbstractControl = this.f[control];
        if (Control.invalid) {
          Control.markAsDirty();
        }
      });

      if (requiredData) {
        let tariff: any = this.order.tariff;
        if (this.order.location == 'Trakcare') {
          tariff = this.configList.tariffList.find(x => {
            return x.name == this.order.tariff;
          });
          tariff = tariff.id;
        }
        const payload = {
          orderId: this.order.orderId,
          supplyDay: this.order.supplyDay,
          tariff: tariff,
          quotationDetail: _.cloneDeep(this.detailList),
        };
        payload.quotationDetail.map((x, i) => {
          delete x.category;
          delete x.priceThai;
          delete x.priceInter;
          delete x.priceMiddleEast;
          x.no = i + 1;
        });
        console.log(payload);
        let checkUrl = null;
        checkUrl = this.common.checkMockupUrl('', GlobalVariable.RESOURCE, {}, {
          BASE_API: GlobalVariable.BASE_API,
          BASE_MODULE: GlobalVariable.BASE_MODULE,
          BASE_RESOURCE: GlobalVariable.BASE_RESOURCE + GlobalVariable.BASE_RESOURCE_CREATE_QUOTATION
        });

        const response = await this.request.post(checkUrl.url, payload);

        const resultCodeSuccess = environment.resultCodeSuccess;
        const resultCodeMissingParameter = environment.resultCodeMissingParameter;
        const resultCodeDataNotFound = environment.resultCodeDataNotFound;

        const userMessageAlreadyExisted = response.userMessage;
        if (response.resultCode === resultCodeSuccess) {

          this.goAlert('', '', 'myModalPrintDocument', {
            printPageList: [
              {
                name: 'Nutraceuticals Quotation',
                link: '#'
              },
            ],
            isShowPrintLabel: false
          });
        } else {
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

  updateTotalPill(i) {
    console.log(i);
    if (this.pageType == 'new') {
      return;
    }
    this.order.orderDispensedPill[i].totalPill = +this.order.orderDispensedPill[i].dosePerDay * +this.order.supplyDay;


    console.log(this.order.orderDispensedPill[i]);
    console.log(this.order);
  }

  fnCalTotalPill() {
    console.log('this.pageType', this.pageType);
    console.log('this.order.type', this.order.type);
    console.log('[1, 5].indexOf(+this.order.orderStatus)', [1, 5].indexOf(+this.order.orderStatus));
    if (this.pageType === 'edit' && [1, 5].indexOf(+this.order.orderStatus) >= 0) {
      console.log('this.order.supplyDay', this.order.supplyDay);
      console.log('this.order.isSeparateMeal', this.order.isSeparateMeal);
      console.log('this.order.calculatedDay', this.order.calculatedDay);
      for (let i = 0; i < this.order.orderDispensedPill.length; i++) {
        console.log('this.order.orderDispensedPill[i].dosePerDay', this.order.orderDispensedPill[i].dosePerDay);
        this.order.orderDispensedPill[i].totalPill = +this.order.orderDispensedPill[i].dosePerDay * +this.order.supplyDay;
        // if (+this.order.isSeparateMeal && this.order.calculatedDay) {
        //   this.order.orderDispensedPill[i].totalPill = +this.order.orderDispensedPill[i].dosePerDay * +this.order.calculatedDay;
        // } else {
        //   this.order.orderDispensedPill[i].totalPill = +this.order.orderDispensedPill[i].dosePerDay * +this.order.supplyDay;
        // }
      }
    }
  }

  changeSupplyDay() {
    this.fnCalTotalPill();
    if (this.pageType != 'quotation') {
      return;
    }
    if (this.order.type == 2 && this.order.isOrderQtCheckNoPack === false) {
      const index = this.detailList.findIndex(x => {
        return x.category == 'pack';
      });


      const month = Math.ceil(+this.order.supplyDay / 30);
      let packName;
      if (month == 1) {
        packName = 'Package Charge 1 month';
      } else {
        packName = `Package Charge ${month} months`;
      }
      const batch = this.packMedList.find(x => {
        return x.packMedPriceName == packName;
      });
      this.detailList[index] = {
        category: 'pack',
        itemId: batch.packMedPriceId,
        type: 1,
        name: batch.packMedPriceName,
        quantity: 1,
        uom: null,
        unitPrice: batch.priceThai,
        priceThai: batch.priceThai,
        priceInter: batch.priceThai,
        priceMiddleEast: batch.priceThai,
        amount: batch.priceThai,
      };
    }
    if (this.order.type == 1) {
      let total = 0;
      let calDay = 0;
      if (this.order.isSeparateMeal == 0 || this.order.isSeparateMeal == null) {
        calDay = this.order.supplyDay;
      } else if (this.order.isSeparateMeal == 1) {
        calDay = this.order.calculatedDay;
      }
      console.log('calDay', calDay);
      for (let i = 0; i < this.order.orderCompound.length; i++) {
        const com = this.order.orderCompound[i];
        const rawMat = this.rawMatList.find(x => {
          return x.code == com.rawMaterialCode;
        });
        const actualDose = +com.dosePerDay / +rawMat.strength;
        const addMore = +actualDose + (+actualDose * +this.configList.formula.percentLoss);
        if (this.order.isOrderQtCheckStaff == 0) {
          let retailPrice = 0;
          if (com.orderItemPrice != null && com.orderItemPrice !== '0' && com.orderItemPrice !== 0) {
            retailPrice = com.orderItemPrice;
          } else {
            retailPrice = rawMat.retailPrice;
          }
          const rm = +addMore * +retailPrice;

          const totalRM = rm * calDay;
          let batch = 0;
          let pack = 0;
          if (this.order.isOrderQtCheckNoBatch == 0) {
            batch = this.priceList.batchCharge;
          }
          if (this.order.isOrderQtCheckNoPack == 0) {
            pack = this.priceList.packCharge;
          }
          total += +totalRM + +batch + +pack;
        } else if (this.order.isOrderQtCheckStaff == 1) {
          let retailPrice = 0;
          if (com.orderItemPrice != null && com.orderItemPrice !== '0' && com.orderItemPrice !== 0) {
            retailPrice = com.orderItemPrice;
          } else {
            retailPrice = rawMat.retailPrice;
          }
          const rm = +addMore * +retailPrice * ((+this.priceList.percentMarkup + 100) / 100);
          if (this.order.isSeparateMeal == 0 || this.order.isSeparateMeal == null) {
            calDay = +this.order.supplyDay;
          } else if (this.order.isSeparateMeal == 1) {
            calDay = +this.order.calculatedDay;
          }
          const totalRM = +rm * +calDay;
          let prodCharge = 0;
          for (let i = 0; i < this.priceList.productionCharge.length; i++) {
            const pCharge = this.priceList.productionCharge[i];
            if ((+calDay >= pCharge.supplyDayFrom && +calDay <= pCharge.supplyDayTo) || (+calDay >= pCharge.supplyDayFrom && pCharge.supplyDayTo == null)) {
              if (pCharge.isCalculate == 0) {
                prodCharge = +pCharge.productionCharge;
              } else if (pCharge.isCalculate == 1) {
                prodCharge = (+pCharge.dividend / +pCharge.divider) * +calDay;
              }
              break;
            }
          }
          total += +totalRM + +prodCharge;
        }
      }
      const month = Math.ceil(+this.order.supplyDay / 30);
      let packName;
      if (month == 1) {
        packName = 'Customized Supplement 1 Month';
      } else {
        packName = `Customized Supplement ${month} Months`;
      }

      const index = this.detailList.findIndex(x => {
        return x.category == 'supplement';
      });
      this.detailList[index] = {
        category: 'supplement',
        type: 1,
        name: packName,
        quantity: 1,
        uom: null,
        unitPrice: Math.ceil(total),
        priceThai: total,
        priceInter: total,
        priceMiddleEast: total,
        amount: Math.ceil(total),
      };
    }

    this.calculatedTotalAmount();
  }

  calculatedTotalAmount() {
    let total = 0;
    for (let i = 0; i < this.detailList.length; i++) {
      total += +this.detailList[i].amount;
    }
    this.summary = Math.ceil(total);
  }

  changeTariff(i) {
    // for (let s = 0; s < this.detailList.length; s++) {
    //   if (i == 1) {
    //     this.detailList[s].unitPrice = this.detailList[s].priceThai;
    //   } else if (i == 2) {
    //     this.detailList[s].unitPrice = this.detailList[s].priceInter;
    //   } else if (i == 3) {
    //     this.detailList[s].unitPrice = this.detailList[s].priceMiddleEast;
    //   }
    //   this.detailList[s].amount = +this.detailList[s].quantity * +this.detailList[s].unitPrice;
    // }
    // this.calculatedTotalAmount();
    console.log('change');
    this.fnCalDetailList();
  }

  async updateEstimatePrice() {
    if (this.packMedList.length == 0) {
      await this.getSearchPackMedPrice();
    }
    if (this.priceList.length == 0) {
      await this.getSearchPrice();
    }
    if (this.finishedProductList.length == 0) {
      await this.getSearchFinishedProducts();
    }

    const comp = [];
    for (const i in this.order.orderCompound) {
      if (this.order.orderCompound[i].dosePerDay != null && this.order.orderCompound[i].dosePerDay != '' && this.order.orderCompound[i].dosePerDay != undefined) {
        comp.push(this.order.orderCompound[i]);
      }
    }

    const tempArr = [];
    if (comp.length > 0) {
      let total = 0;
      const calDay = +this.order.supplyDay;

      for (let i = 0; i < comp.length; i++) {
        const com = comp[i];
        const rawMat = this.rawMatList.find(x => {
          return x.code == com.rawMaterialCode;
        });
        const actualDose = +com.dosePerDay / +rawMat.strength;
        const addMore = +actualDose + (+actualDose * +this.configList.formula.percentLoss);
        let retailPrice = 0;
        retailPrice = +rawMat.retailPrice;
        const rm = +addMore * +retailPrice;
        const totalRM = +rm * +calDay;
        total += +totalRM;
      }
      const batch = +this.priceList.batchCharge;
      const pack = +this.priceList.packCharge;

      // total pack charge
      const totalPackCharge = pack * Math.ceil(calDay / 30);
      total += +batch + +totalPackCharge;

      tempArr.push(+total);
    }

    for (let i = 0; i < this.order.orderDispensedPill.length; i++) {
      const fp = this.finishedProductList.find(x => {
        return x.code === this.order.orderDispensedPill[i].finishedProductCode;
      });
      let unitP;
      if (this.order.tariff == 1) {
        unitP = fp.priceThai;
      } else if (this.order.tariff == 2) {
        unitP = fp.priceInter;
      } else if (this.order.tariff == 3) {
        unitP = fp.priceMiddleEast;
      }
      const cals = +this.order.orderDispensedPill[i].dosePerDay * +this.order.supplyDay * +unitP;
      tempArr.push(+cals);

    }
    let sum = 0;
    for (let i = 0; i < tempArr.length; i++) {
      sum += tempArr[i];
    }

    let batchCharge = 0;
    let packCharge = 0;
    if (comp.length === 0 && this.order.orderDispensedPill.length > 0) {
      // hard code จาก 070-98-0030
      const findPackMed = this.packMedList.find(obj => obj.code === '070-98-0030');
      if (findPackMed) {
        batchCharge = +findPackMed.priceThai || 0;
      }

      // กรณีที่เป็น 1 เดือน --> Package Charge x month
      // กรณีที่เป็นหลายเดือน --> Package Charge x months
      const month = Math.ceil(+this.order.supplyDay / 30);
      let packMedPriceName = '';
      if (month > 1) {
        packMedPriceName = 'Package Charge ' + month + ' months';
      } else {
        packMedPriceName = 'Package Charge ' + month + ' month';
      }
      console.log('packMedPriceName', packMedPriceName);
      const findPackMedByName = this.packMedList.find(obj => obj.packMedPriceName === packMedPriceName);
      if (findPackMedByName) {
        packCharge = +findPackMedByName.priceThai;
      }
    }

    if (sum) {
      const calEstPrice = +sum + batchCharge + packCharge;
      this.estPrice = Math.ceil(calEstPrice);
    } else {
      this.estPrice = 0;
    }
  }

  changeIsSeperate() {
    if (this.order.isSeparateMeal) {
      this.order.sepLastMorningCapPerDay = null;
      this.order.sepMorningSupplyDay = null;
      this.order.sepLastLunchCapPerDay = null;
      this.order.sepLunchSupplyDay = null;
      this.order.sepLastEveningCapPerDay = null;
      this.order.sepEveningSupplyDay = null;
      this.order.sepLastBedtimeCapPerDay = null;
      this.order.sepBedtimeSupplyDay = null;
      this.order.calculatedDay = null;
      this.invalidMeal = false;
      this.invalidTotalCap = false;
      this.invalidCalculatedDay = false;
      console.log(this.order);
    }

    this.fnCalTotalPill();
  }

  checkMinMax(i) {
    if (this.order.orderCompound[i].dosePerDay) {
      const minimumDose = this.order.orderCompound[i].minimumDose ? +this.order.orderCompound[i].minimumDose : 0;
      const maximumDose = this.order.orderCompound[i].maximumDose ? +this.order.orderCompound[i].maximumDose : 0;
      if (+this.order.orderCompound[i].dosePerDay > maximumDose || +this.order.orderCompound[i].dosePerDay < minimumDose) {
        this.order.orderCompound[i].invalid = true;
      } else {
        this.order.orderCompound[i].invalid = false;
      }
    } else {
      this.order.orderCompound[i].invalid = false;
    }
  }

  checkValidSeparateMeal(input1: any, input2: any) {
    const value1 = this.orderForm.controls[input1].value;
    const value2 = this.orderForm.controls[input2].value;
    console.log('value1', value1);
    console.log('value2', value2);
    
    // ล้าง validators ทั้งหมดเพื่อให้ปล่อยว่างได้
    this.orderForm.controls[input1].setValidators(null);
    this.orderForm.controls[input2].setValidators(null);
    
    // อัพเดท validation
    this.orderForm.controls[input1].updateValueAndValidity();
    this.orderForm.controls[input2].updateValueAndValidity();
  }

  async searchPharmacyNotes() {
    try {
      this.loading = true
      const filterData = {
        hn: this.order.hn,
      };
      const checkUrl = this.common.checkMockupUrl('', '', filterData, {
        BASE_API: '',
        BASE_MODULE: environment.apiPrefix,
        BASE_RESOURCE: environment.searchPharmacyNotes
      });
      const resultCodeSuccess = environment.resultCodeSuccess;

      const response = await this.request.get(checkUrl.url, checkUrl.filter);
      if (response.resultCode === resultCodeSuccess) {
        const resultData = await response.resultData;
        if (resultData && resultData.length > 0) {
          this.pharmacyNotesList = resultData;
        }
        this.loading = false
      } else {
        this.pharmacyNotesList = [];
        this.loading = false
      }
    } catch (e) {
      console.error(e);
      this.loading = false
      this.pharmacyNotesList = [];
    }
  }

  async onClickEditOrder() {
    try {
      this.disbledBtn = {
        'save': true,
        'cancel': true
      };

      const checkUrl = this.common.checkMockupUrl('', '', '', {
        BASE_API: '',
        BASE_MODULE: environment.apiPrefix,
        BASE_RESOURCE: environment.updateErrorOrderStatus
      });

      let locationText = this.errorText[this.errorText.length - 1].split('in ')[1];
      locationText = locationText.replaceAll('.', '');
      const data: any = {
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

      console.log(data);

      const resultCodeSuccess = environment.resultCodeSuccess;

      const response = await this.request.post(checkUrl.url, data);

      // this.userMessage = response.userMessage;
      if (response.resultCode === resultCodeSuccess) {
        this.goAlert('', '', 'myModalSuccess');
      } else {
        console.log('error');
        this.goAlert(response.resultCode, response.resultDescription, 'myModalError');
      }
    } catch (e) {
      console.log(e);
      this.disbledBtn = {
        'save': true,
        'cancel': true
      };
    }
  }

  onCloseEditOrder() {
    this.onClickBack();
  }

  fnCheckSumSupplyDay() {
    this.invalidMealSupplyDayMorning = false;
    this.invalidMealSupplyDayLunch = false;
    this.invalidMealSupplyDayEvening = false;
    this.invalidMealSupplyDayBedtime = false;
    if (this.order.isSeparateMeal) {
      this.invalidMealSupplyDayMorning = this.order.sepMorningSupplyDay > +this.order.supplyDay;
      this.invalidMealSupplyDayLunch = this.order.sepLunchSupplyDay > +this.order.supplyDay;
      this.invalidMealSupplyDayEvening = this.order.sepEveningSupplyDay > +this.order.supplyDay;
      this.invalidMealSupplyDayBedtime = this.order.sepBedtimeSupplyDay > +this.order.supplyDay;
    }
  }
  async fnClickPrintDocument(type: string) {
    console.log('fnClickPrintDocument type', type);
    try {
      let url = ''
      let filterData: any = {}
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
      if (type === 'labelSizeS') {
        filterData.size = 'S'
        url = environment.printSMLLabel
      }
      if (type === 'labelSizeM') {
        filterData.size = 'M'
        url = environment.printSMLLabel
      }
      if (type === 'labelSizeL') {
        filterData.size = 'L'
        url = environment.printSMLLabel
      }
      if (type === 'labelSachet') {
        url = environment.printLabelSachet
      }
      if (type === 'rmChargeDetail') {
        url = environment.printRMChargeDetail
      }
      if (type === 'deliveryDetail') {
        url = environment.printDeliveryDetail
      }
      if (type === 'supplementDetail') {
        url = environment.printSupplementDetail
      }
      if (type === 'deliveryForm') {
        url = environment.printDeliveryForm
      }
      if (type === 'all') {
        url = environment.printAll
      }
      if (type === 'printVitallifeOrderSheet') {
        url = environment.printVitallifeOrderSheet
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

}

