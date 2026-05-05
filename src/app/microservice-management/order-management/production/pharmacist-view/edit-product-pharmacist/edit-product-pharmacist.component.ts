import { Component, OnInit, AfterViewInit, ElementRef, Input, ViewChild, ViewEncapsulation, OnDestroy, ViewChildren, QueryList } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { GlobalVariable } from './edit-product-pharmacist.global';
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
import { DxCheckBoxComponent } from 'devextreme-angular';
@Component({
  selector: 'app-edit-product-pharmacist',
  providers: [Request, Common, CompareService],
  templateUrl: './edit-product-pharmacist.component.html',
  styleUrls: ['./edit-product-pharmacist.scss'],
  encapsulation: ViewEncapsulation.None
})
export class EditProductPharmacistComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('fileInput') fileInput: ElementRef;
  @ViewChild('modalSplitProduction') modalSplitProduction;
  @ViewChild('modalSplitDelivery') modalSplitDelivery;
  @ViewChild('myModal') myModal;
  @ViewChildren(DxCheckBoxComponent) checkboxes!: QueryList<DxCheckBoxComponent>;
  // @ViewChild(DxTreeListComponent) treeList: DxTreeListComponent;
  popupVisible = false
  filePicture = null
  nextAfterAlert: (() => void) | null = null;
  finishedProduct: any;
  resFinished: any;
  delDispensedArr: any = [];
  editDataGroups: any = {};
  cloneSplit: any = [];
  deliveryList: any = [];
  order: any = {
    orderDispensedPill: []
  };
  editGroupForm: FormGroup;
  orderStatus = 0;
  completeId: any;
  microserviceId;
  microserviceGroupId;
  printPageList = [
    {
      name: 'Pharmacy Production Sheet',
      url: environment.printProductionSheet,
      type: 'pharmacyProductionSheet'
    }, {
      name: 'Working Formula (WF)',
      url: environment.printWorkingFormula,
      type: 'workingFormulaWF'
    }, {
      name: 'Working Formula (WF2)',
      url: environment.printWorkingFormula2,
      type: 'workingFormulaWF2'
    }, {
      name: 'Patient Information',
      url: environment.printPatientInformation,
      type: 'patientInformation'
    }, {
      name: 'Supplement Information',
      url: environment.printSupplementInformation,
      type: 'supplementInformation'
    }, {
      name: 'Label',
      url: environment.printSupplementFacts,
      type: 'label'
    }, {
      name: 'Label Small',
      url: environment.printLabel,
      type: 'labelSmall'
    }, {
      name: 'RM Charge Detail',
      url: environment.printRMChargeDetail,
      type: 'rmChargeDetail'
    }, {
      name: 'Label Sachet ',
      url: environment.printLabelSachet,
      type: 'labelSachet'
    }
  ];
  filterData: any = {};
  quotationDetails: any = [{
    description: 'Customized Supplement 1 Mo',
    quantity: 1,
    uom: '-',
    unitPrice: '2000',
    amount: '2000',
  }];
  orderPill: any = {};
  orderForm: FormGroup;
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
  pageType: any = 'edit';
  Id: any = null;
  menuHome: any = false;
  menuPermissions: any = { view: false, add: false, edit: false, delete: false };
  rawMaterialList = [];
  dispensedPillTotal = {
    morningWithMeals: 0,
    morningBeforeMeals: 0,
    lunchWithMeals: 0,
    lunchBeforeMeals: 0,
    eveningWithMeals: 0,
    eveningBeforeMeals: 0,
    bedtimeWithMeals: 0,
  };
  pharmacyCheck = {
    urgent: false,
    rm: false,
    allergyChecked: false,
    medReconcile: false,
    wf2: false,
  };
  quotation = {
    noBatchCharge: false,
    noPackCharge: false,
    staff: false,
  };
  tariffList: any = [];
  itemList: any = [];
  locationList: any = [];
  packagingList: any = [];
  deliveryMethodList: any = [];
  deliveryDetailList: any = [];
  pharmacyPictureList: any = [];
  isCompletePcCheckDeli = false
  orderCompound: any = [];
  arrivalTimeList: any = [];
  arrivalTimeListBackup = [];
  arrivalTimeMap = {};
  mealList: any = [];
  seperateMedicines = [];
  medicationsNotReceived = [];
  orderStatusList: any = [];
  capsuleWF1Name = '';
  capsuleWF2Name = '';
  deliveryDetailMethod = '';
  deliveryDetailArrivalDateTime = '';
  detailList: any = [];
  currencyMaskOptions: CurrencyMaskConfig = {
    align: 'right',
    allowNegative: true,
    allowZero: true,
    decimal: '.',
    precision: 2,
    prefix: '',
    suffix: '',
    thousands: ',',
    nullable: true,
    min: null,
    max: null,
  };
  summary = 0;
  bbf = '';
  dispensedPillRadioLabel = ['With meals', 'Before meals'];
  dispensedPillMorning = null;
  dispensedPillLunch = null;
  dispensedPillEvening = null;
  dispensedPillBedtime = null;
  total = {
    mpc: 0,
    mac: 0,
    lpc: 0,
    lac: 0,
    epc: 0,
    eac: 0,
    bpc: 0,
  };
  instructionWarning = {};
  warning = '';
  mealMapInstruction = {};
  lang = {};
  pharmacyNotes: any = {
    productionNote: ''
  };
  configList: any = {};
  pharmacyCheck1 = {
    isProdPc1CheckDoc: false,
    isProdPc1CheckStock: false,
    isProdPc1CheckPills: false,
    isProdPc1CheckSep: false,
    isCompletePcCheckDeli: false,
  };
  pharmacyCheck2 = {
    isProdPc2CheckProd: false,
    isProdPc2CheckTC: false,
    isProdPc2CheckPills: false,
    isProdPc2CheckMed: false,
    isProdPc2CheckGuide: false,
  };
  isDuplicateFinishedProduct = {};
  isDuplicateMedicationsNotReceived = {};
  isDuplicateDispensedPill = {};
  capsulesList = [];
  capsule = {
    wf1: '929047',
    wf2: '',
  };
  capsuleWF2Require = false;
  bottleRequire = false;
  addressList = [];
  errorText: any;
  minDeliveryDate: Date = moment().toDate();
  packagingListMap: any = {};
  preferredLanguage = 'Thai';
  preferredLanguageList = [{
    text: 'TH',
    value: 'Thai',
    hint: 'Thai',
  },
  {
    text: 'EN',
    value: 'English',
    hint: 'English',
  }];
  cpdExp = '';
  hideEditBtn = false;
  partialDeliveryReadonly = false;
  capPerDayWF2 = 0;
  isEditDelivery = false;
  quotationDetail: any = {};
  isCompleteAllDelivery = true;
  totalPillCompoundedPillsBackup = 0;
  printAllurl = null
  isLoadingPanel: boolean = false;
  intervalUpdateWorkingBy;
  allCheckedCompound: boolean = false;
  allCheckedDispensedPill: boolean = false;
  allCompoundAndPillChecked: boolean = false;
  tabIndex = ''
  isPackagingList = false
  typeOptions = [
    { id: 1, text: 'Laminate Bag' },
    { id: 2, text: 'Box' },
    { id: 3, text: 'Bottle' }
  ];
  supTypeOptions = [
    { id: 1, text: 'เช้า' },
    { id: 2, text: 'กลางวัน' },
    { id: 3, text: 'เย็น' },
    { id: 4, text: 'ก่อนนอน' }
  ];
  constructor(public router: Router,
    private fb: FormBuilder,
    private request: Request,
    private common: Common,
    private compare: CompareService,
    private route: ActivatedRoute,
    private store: StoreService) {
    this.orderForm = this.fb.group({
      txtHn: new FormControl({ value: '', disabled: true }),
      txtPatientName: new FormControl({ value: '', disabled: true }),
      txtOrderDate: new FormControl({ value: '', disabled: true }),
      txtSupplyDay: new FormControl({ value: '', disabled: true }),
      txtPhysician: new FormControl({ value: '', disabled: true }),
      txtCalculatedDay: new FormControl({ value: '', disabled: true }),
      txtCustomizedSupplement: new FormControl({ value: '', disabled: true }),
      txtProductionEnd: new FormControl({ value: '', disabled: true }),
      ddlPackaging: new FormControl('', [Validators.required]),
      ddlLocation: new FormControl({ value: '', disabled: true }),
      txtOrderPharmacyNote: new FormControl({ value: '', disabled: true }),
      txtOrderPharmacyNoteRemark: new FormControl(''),
      compound: this.fb.array([]),
      dispensedPill: this.fb.array([]),
      separateMedicines: this.fb.array([]),
      medicationsNotReceived: this.fb.array([]),
      splitDelivery: this.fb.array([]),
      rdlDispensedPillMorning: new FormControl({ value: '', disabled: true }),
      // rdlDispensedPillMorningWithMeals: new FormControl(''),
      // rdlDispensedPillMorningBeforeMeals: new FormControl(''),
      rdlDispensedPillLunch: new FormControl({ value: '', disabled: true }),
      // rdlDispensedPillLunchWithMeals: new FormControl(''),
      // rdlDispensedPillLunchBeforeMeals: new FormControl(''),
      rdlDispensedPillEvening: new FormControl({ value: '', disabled: true }),
      // rdlDispensedPillEveningWithMeals: new FormControl(''),
      // rdlDispensedPillEveningBeforeMeals: new FormControl(''),
      rdlDispensedPillBedtime: new FormControl({ value: '', disabled: true }),
      // rdlDispensedPillBedtimeWithMeals: new FormControl(''),
      txtNumberOfCapsules: new FormControl(''),
      ddlInstructionMeals: new FormControl(''),
      ddlCapsuleWF1: new FormControl({ value: '', disabled: true }),
      ddlCapsuleWF2: new FormControl(''),
      txtAdditionalInstruction: new FormControl(''),
      txtAdditionalWarning: new FormControl(''),
      txtPackageNoteList: this.fb.array([
        this.createPackagingNoteForm()
      ]),
    });
  }

  isValidJsonObjectArray(value: string): boolean {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) && parsed.every(item => typeof item === 'object' && item !== null && !Array.isArray(item));
    } catch {
      return false;
    }
  }

  createPackagingNoteForm(isDisabled = true): FormGroup {
    const supTypeControls = this.supTypeOptions.map(() => this.fb.control({ value: false, disabled: isDisabled }));
    const typeControls = this.typeOptions.map(() => this.fb.control({ value: false, disabled: isDisabled }));

    return this.fb.group({
      qty: [{ value: '', disabled: isDisabled }, Validators.required],
      type: this.fb.array(typeControls),
      supplyDays: [{ value: '', disabled: isDisabled }, Validators.required],
      supType: this.fb.array(supTypeControls),
      other: [{ value: '', disabled: isDisabled }]
    });
  }

  createPackagingNoteFormWithData(item: any): FormGroup {
    const isDisabled = true;

    const typeControls = this.typeOptions.map((_, i) => {
      return this.fb.control(
        { value: item.type === i + 1, disabled: isDisabled }
      );
    });

    const supTypeControls = this.supTypeOptions.map((_, i) => {
      return this.fb.control(
        { value: Array.isArray(item.supType) && item.supType.includes(i + 1), disabled: isDisabled }
      );
    });

    return this.fb.group({
      qty: [{ value: item.qty || '', disabled: isDisabled }, Validators.required],
      type: this.fb.array(typeControls),
      supplyDays: [{ value: item.supplyDays || '', disabled: isDisabled }, Validators.required],
      supType: this.fb.array(supTypeControls),
      other: [{ value: item.other || '', disabled: isDisabled }]
    });
  }
  ngOnDestroy() {
    console.log('clear interval');
    clearInterval(this.intervalUpdateWorkingBy);
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

  get formSeparateMedicines(): FormArray {
    return this.orderForm.controls['separateMedicines'] as FormArray;
  }

  get formMedicationsNotReceived(): FormArray {
    return this.orderForm.controls['medicationsNotReceived'] as FormArray;
  }

  get formSplitDelivery(): FormArray {
    return this.orderForm.controls['splitDelivery'] as FormArray;
  }

  isInvalidDelivery(i, name): boolean {
    try {
      return !this.formSplitDelivery.controls[i].get(name).valid && this.formSplitDelivery.controls[i].get(name).dirty;
    } catch (e) {
      return false;
    }
  }

  async ngOnInit() {
    this.tabIndex = this.route.snapshot.queryParamMap.get('tab');
    if (Number(this.tabIndex) === 3) {
      this.allCompoundAndPillChecked = true;
    }

    await this.route.params.subscribe(params => {
      const purePath = this.router.url.split('?')[0];
      const splitPath = purePath.split('/');
      this.pageType = splitPath[splitPath.length - 1];
      if (splitPath[splitPath.length - 3] === 'all-orders-production-pharmacist-view') {
        this.hideEditBtn = true;
      }
      this.Id = params.id;
    });

    this.store.subscribePagePermissionList().subscribe(pagePermissionList => {
      const pagePermission = pagePermissionList.find(r => r.url === environment.roleURL.pharmacistView);
      if (pagePermission) {
        try {
          this.menuPermissions = JSON.parse(pagePermission.menuPermissions);
          console.log(this.menuPermissions)
        } catch (error) {
          console.log(error);
        }
      }
    });
    this.isLoadingPanel = true;
    await this.getData()
    await this.fnPrintDocument('all')

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
    this.finishedProduct = await this.customStore();
    this.isLoadingPanel = false;
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
      if (rawMaterialName !== 'Vivapur') {
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
    if (Number(this.tabIndex) === 3) {
      this.allCompoundAndPillChecked = true;
    } else {
      this.allCompoundAndPillChecked = this.allCheckedCompound && this.allCheckedDispensedPill;
    }
  }

  async getData() {
    this.configList = await this.common.searchConfig();
    this.tariffList = this.configList.tariffList || [];
    this.itemList = this.configList.itemList || [];
    this.packagingList = this.configList.packagingList || [];
    for (let i = 0; i < this.packagingList.length; i++) {
      const obj = this.packagingList[i];
      this.packagingListMap[obj.id] = obj.name || '';
    }
    this.deliveryMethodList = this.configList.deliveryMethodList || [];
    this.arrivalTimeList = this.configList.arrivalTimeList || [];
    this.arrivalTimeListBackup = this.configList.arrivalTimeList || [];
    this.mealList = this.configList.mealList || [];
    await this.getLocaltionList()
    this.mealMapInstruction = {
      1: 'C_MAC',
      2: 'C_MPC',
      3: 'C_LAC',
      4: 'C_LPC',
      5: 'C_EAC',
      6: 'C_EPC',
      7: 'C_B'
    };
    this.orderStatusList = this.configList.orderStatus || [];
    this.instructionWarning = this.configList.instructionWarning || {};
    try {
      await this.searchOrderPharmacistView();
      console.log('this.order.type', this.order.type);
      console.log('[13, 14, 17, 18].indexOf(+this.orderStatus)', [13, 14, 17, 18].indexOf(+this.orderStatus));
      if (this.order.type === 'Yes' && [13, 14, 17, 18].indexOf(+this.orderStatus) >= 0) {
        await this.getSearchQuotationDetail();
      }
      await this.searchCapsules();
      await this.searchRawMaterials();
      for (let i = 0; i < this.order.orderDispensedPill.length; i++) {
        const data = this.order.orderDispensedPill[i];
        data.note = data.remark;
        const controls = {
          txtFinishedProductName: new FormControl({ value: '', disabled: true }),
          txtNote: new FormControl({ value: '', disabled: false }),
          txtPhysician: new FormControl({ value: '', disabled: true }),
          txtMac: new FormControl(''),
          txtMpc: new FormControl(''),
          txtLac: new FormControl(''),
          txtLpc: new FormControl(''),
          txtEac: new FormControl(''),
          txtEpc: new FormControl(''),
          txtBac: new FormControl(''),
          txtTotalPill: new FormControl({ value: '', disabled: true }),
          isCheckedDispensedPill: new FormControl(false)
        };
        if (data.no > 0) {
          if (data.isVitalLife) {
            controls.txtFinishedProductName = new FormControl({ value: '', disabled: false });
            controls.txtPhysician = new FormControl({ value: '', disabled: false });
            controls.txtTotalPill = new FormControl({ value: '', disabled: false });
          }
          this.order.orderDispensedPill[i].physician = this.order.orderDispensedPill[i].dosePerDay;
          if (this.order.orderDispensedPill[i].physician) {
            this.order.orderDispensedPill[i].physician = (+this.order.orderDispensedPill[i].physician);
          }
        } else {
          if (data.finishedProductName === 'Compounded Pills') {
            if (+this.orderStatus === 13 || +this.orderStatus === 14) {
              
              if (+this.order.isSeparateMeal === 1) {
                const m = (+this.order.sepMorningSupplyDay > 0 ? +this.order.sepLastMorningCapPerDay || 0 : 0);
                const l = (+this.order.sepLunchSupplyDay > 0 ? +this.order.sepLastLunchCapPerDay || 0 : 0);
                const e = (+this.order.sepEveningSupplyDay > 0 ? +this.order.sepLastEveningCapPerDay || 0 : 0);
                const b = (+this.order.sepBedtimeSupplyDay > 0 ? +this.order.sepLastBedtimeCapPerDay || 0 : 0);
                this.order.orderDispensedPill[i].physician = (m + l + e + b);
              } else {
                this.order.orderDispensedPill[i].physician = +this.order.totalCapPerDay;
              }
            } else {
              this.order.orderDispensedPill[i].physician = this.order.orderDispensedPill[i].dosePerDay || 0;
            }
          } else {
            this.order.orderDispensedPill[i].physician = this.order.orderDispensedPill[i].dosePerDay || 0;
            if (this.order.orderDispensedPill[i].physician) {
              this.order.orderDispensedPill[i].physician = (+this.order.orderDispensedPill[i].physician);
            }
          }

          if (+this.order.isSeparateMeal === 1) {
            // tslint:disable-next-line:max-line-length
            this.order.orderDispensedPill[i].totalPill = +this.order.orderDispensedPill[i].physician * +this.order.calculatedDay;
          } else {
            this.order.orderDispensedPill[i].totalPill = +this.order.orderDispensedPill[i].physician * +this.order.supplyDay;
          }
          this.totalPillCompoundedPillsBackup = _.cloneDeep(this.order.orderDispensedPill[0].totalPill);
        }
        this.formDispensedPill.push(this.fb.group(controls));

        if (data.morningWithMeals && +data.morningWithMeals > 0) {
          data.mpc = data.morningWithMeals;
          this.dispensedPillMorning = this.dispensedPillRadioLabel[0];
        } else if (data.morningBeforeMeals && +data.morningBeforeMeals > 0) {
          data.mac = data.morningBeforeMeals;
          this.dispensedPillMorning = this.dispensedPillRadioLabel[1];
        }
        if (data.lunchWithMeals && +data.lunchWithMeals > 0) {
          data.lpc = data.lunchWithMeals;
          this.dispensedPillLunch = this.dispensedPillRadioLabel[0];
        } else if (data.lunchBeforeMeals && +data.lunchBeforeMeals > 0) {
          data.lac = data.lunchBeforeMeals;
          this.dispensedPillLunch = this.dispensedPillRadioLabel[1];
        }
        if (data.eveningWithMeals && +data.eveningWithMeals > 0) {
          data.epc = data.eveningWithMeals;
          this.dispensedPillEvening = this.dispensedPillRadioLabel[0];
        } else if (data.eveningBeforeMeals && +data.eveningBeforeMeals > 0) {
          data.eac = data.eveningBeforeMeals;
          this.dispensedPillEvening = this.dispensedPillRadioLabel[1];
        }
        if (data.bedtimeWithMeals && +data.bedtimeWithMeals > 0) {
          data.bpc = data.bedtimeWithMeals;
          this.dispensedPillBedtime = this.dispensedPillRadioLabel[0];
        }
      }

      if (this.order.orderDispensedPill.length == 0) {
        this.allCheckedDispensedPill = true
        this.updateAllCompoundAndPillChecked()
      }

      for (let i = 0; i < this.seperateMedicines.length; i++) {
        const data = this.seperateMedicines[i];
        if (data.isVitalLife) {
          this.formSeparateMedicines.push(this.fb.group({
            txtSeperateMedicines: new FormControl('', [Validators.required]),
          }));
        } else {
          this.formSeparateMedicines.push(this.fb.group({
            txtSeperateMedicines: new FormControl(''),
          }));
        }
      }

      for (let i = 0; i < this.medicationsNotReceived.length; i++) {
        const data = this.medicationsNotReceived[i];
        if (data.isVitalLife) {
          this.formMedicationsNotReceived.push(this.fb.group({
            txtMedicationsNotReceived: new FormControl('', [Validators.required]),
          }));
        } else {
          this.formMedicationsNotReceived.push(this.fb.group({
            txtMedicationsNotReceived: new FormControl(''),
          }));
        }
      }

      if (this.pageType === 'view' || this.pageType === 'edit') {
        this.updateWorkingBy();
        this.intervalUpdateWorkingBy = setInterval(() => {
          this.updateWorkingBy();
        }, 3000);
        if (this.order.packageNote) {
          if (this.isValidJsonObjectArray(this.order.packageNote)) {
            this.isPackagingList = true
            const parsedNote = JSON.parse(this.order.packageNote);
            const formArray = this.fb.array(
              parsedNote.map(item => this.createPackagingNoteFormWithData(item))
            );

            this.orderForm.setControl('txtPackageNoteList', formArray);
          } else {
            this.isPackagingList = false
          }
        } else {
          this.isPackagingList = true
        }
      }

      if (this.pageType === 'view') {
        this.orderForm.controls['ddlLocation'].disable();
        this.orderForm.controls['ddlPackaging'].disable();
        this.orderForm.controls['ddlCapsuleWF2'].disable();
        this.orderForm.controls['txtOrderPharmacyNoteRemark'].disable();
        this.orderForm.controls['txtAdditionalInstruction'].disable();
        this.orderForm.controls['txtAdditionalWarning'].disable();
        this.orderForm.controls['txtNumberOfCapsules'].disable();
        this.orderForm.controls['ddlInstructionMeals'].disable();
        this.orderForm.controls['rdlDispensedPillMorning'].disable();
        this.orderForm.controls['rdlDispensedPillLunch'].disable();
        this.orderForm.controls['rdlDispensedPillEvening'].disable();
        this.orderForm.controls['rdlDispensedPillBedtime'].disable();
        if (this.formDispensedPill.controls.length > 0) {
          this.formDispensedPill.controls[0].get('txtMpc').disable();
          this.formDispensedPill.controls[0].get('txtMac').disable();
          this.formDispensedPill.controls[0].get('txtLpc').disable();
          this.formDispensedPill.controls[0].get('txtLac').disable();
          this.formDispensedPill.controls[0].get('txtEpc').disable();
          this.formDispensedPill.controls[0].get('txtEac').disable();
          this.formDispensedPill.controls[0].get('txtBac').disable();
        }
        this.formDispensedPill.disable();
        for (let i = 0; i < this.order.orderCompound.length; i++) {
          const fCompound = {
            txtRmWeight: new FormControl({ value: '' }),
            isCheckedCompound: new FormControl(
              this.order.orderCompound[i].rawMaterialName !== 'Vivapur' &&
                !this.order.orderCompound[i].isError ? false : true
            ),
          };
          fCompound['rdlWF' + i] = new FormControl({ value: '', disabled: true });
          this.formCompound.push(this.fb.group(fCompound));
        }
        this.formCompound.disable();
      } else if (this.pageType === 'edit') {
        for (let i = 0; i < this.order.orderCompound.length; i++) {
          const fCompound = {
            txtRmWeight: new FormControl({ value: '' }),
            isCheckedCompound: new FormControl(
              this.order.orderCompound[i].rawMaterialName !== 'Vivapur' &&
                !this.order.orderCompound[i].isError ? false : true
            ),
          };
          fCompound['rdlWF' + i] = new FormControl({ value: '', disabled: false });
          if (this.order.orderCompound[i].wf == null) {
            this.order.orderCompound[i].wf = 1;
          }
          this.formCompound.push(this.fb.group(fCompound));
        }
        if (this.order.orderCompound.length == 0) {
          this.allCheckedCompound = true
          this.updateAllCompoundAndPillChecked()
        }
        const findWF2 = this.order.orderCompound.find(obj => +obj.wf === 2 && obj.rawMaterialName !== 'Vivapur');
        if (findWF2) {
          await this.fnSetRequireCapsule(false, 2);
        }
        const findWF1 = this.order.orderCompound.find(obj => +obj.wf === 1 && obj.rawMaterialName !== 'Vivapur');
        if (findWF1) {
          await this.fnSetRequireCapsule(false, 1);
        }
        this.fnSetRequireBottle();
        if (this.order.orderStatus === 24 || this.order.orderStatus === 25 || this.order.orderStatus === 13) {
          this.orderForm.controls['ddlLocation'].disable();
          this.orderForm.controls['ddlPackaging'].disable();
          this.orderForm.controls['ddlCapsuleWF2'].disable();
          this.orderForm.controls['txtAdditionalInstruction'].disable();
          this.orderForm.controls['txtAdditionalWarning'].disable();
          this.orderForm.controls['txtNumberOfCapsules'].disable();
          this.orderForm.controls['ddlInstructionMeals'].disable();
          this.formCompound.disable();
          this.formDispensedPill.disable();

          (this.formCompound.controls as FormGroup[]).forEach(formGroup => {
            formGroup.controls['isCheckedCompound'].enable({ emitEvent: false });
          });
          (this.formDispensedPill.controls as FormGroup[]).forEach(formGroup => {
            formGroup.controls['isCheckedDispensedPill'].enable({ emitEvent: false });
          });
        }
        if (this.order.orderStatus === 13) {
          this.orderForm.controls['txtOrderPharmacyNoteRemark'].disable();
        }
      }
      await this.searchPharmacyNotes();
      this.orderStatus = this.order.orderStatus;
      if (this.order.orderStatus === 25) {
        await this.searchDdlPatientAddress();
      }
      // set preferredLanguage
      // if (this.orderStatus === 18) {
      //   if (this.order.warning === this.instructionWarning['en']['WARNING']) {
      //     this.preferredLanguage = 'English';
      //   } else {
      //     this.preferredLanguage = 'Thai';
      //   }
      // } else {
      //   if (this.order.preferredLanguage !== 'ไทย' && this.order.preferredLanguage !== 'Thai') {
      //     this.preferredLanguage = 'English';
      //   } else {
      //     this.preferredLanguage = 'Thai';
      //   }
      // }
      // set cpdExp
      if (this.orderStatus >= 17 && this.order.cpdExp) {
        this.cpdExp = this.order.cpdExp;
      }
      this.fnSetPreferredLanguage();
      this.fnCalTotal();
      this.loading = false;
      this.disbledBtn = {
        'save': false,
        'cancel': false
      };
    } catch (e) {
      console.error(e);
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

  async getLocaltionList() {
    const checkUrl = this.common.checkMockupUrl('', '', {}, {
      BASE_API: '',
      BASE_MODULE: environment.apiPrefix,
      BASE_RESOURCE: environment.searchDdlLocations
    });
    //searchDdlLocations
    const resultCodeSuccess = environment.resultCodeSuccess;
    const response = await this.request.get(checkUrl.url, checkUrl.filter);
    if (response.resultCode === resultCodeSuccess) {
      const data = await response.resultData || response.data || [];
      this.locationList = data
    } else {
      this.locationList = [];
    }
  }

  customStore() {
    const dataSource: any = {};

    dataSource.store = new CustomStore({
      load: (loadOptions: any) => {
        // console.log('loadOption : ', loadOptions);
        const filterData: any = {
          finishedProductName: loadOptions.searchValue
        };
        // console.log('filterData : ', filterData);

        const checkUrl = this.common.checkMockupUrl('', '', filterData, {
          BASE_API: GlobalVariable.BASE_API,
          BASE_MODULE: GlobalVariable.BASE_MODULE,
          BASE_RESOURCE: GlobalVariable.BASE_RESOURCE_GET_FINISHED_PRODUCT
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

  goHomeMenu() {
    if (this.menuHome) {
      this.router.navigate(['/menu', this.menuHome['menuId'], this.menuHome['typePage']]);
    }
  }

  clickCollapse(id) {
    this.common.collapseFnById(id);
  }

  async ngAfterViewInit() {
    this.fnClearSplitDeliveryList();
    document.body.scrollTop = 0; // สั่งให้ scroll to top เมื่อเข้าหน้ามา
  }

  fnClearSplitDeliveryList() {
    localStorage.removeItem('splitDeliveryList');
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

  setbbf_cpdExp() {

  }


  bbfValue() {
    let cpdExp = this.cpdExpValue();
    if (cpdExp === "N/A" || cpdExp === "RM > 1 Year") {
      return moment(this.order.productionEndDate, "DD/MM/YYYY").add(1, 'years').format("DD/MM/YYYY");
    }
    return cpdExp;
  }

  cpdExpValue() {
    // - เคส ถ้าไม่มี compounded ให้แสดง Cpd. Exp. เป็น N/A
    if (!this.order || !this.order.orderCompound || this.order.orderCompound.length === 0) {
      return "N/A";
    }
    console.log("this.configList", this.configList.formula, this.order.orderCompound);
    let vivapurCode = this.configList.formula ? this.configList.formula.vivapurCode : ""


    let rawMaterialList = _.cloneDeep(this.rawMaterialList)
    let orderCompound = _.cloneDeep(this.order.orderCompound)
    orderCompound = orderCompound.filter(r => r.rawMaterialName !== 'Vivapur' || r.rawMaterialCode != vivapurCode)
    console.log("orderCompound>", orderCompound, vivapurCode);
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
    console.log("orderCompound", orderCompound);

    // - เคส ถ้ามี compounded mfg (dd/mm/yyyy) - expiryDate RM (dd/mm/yyyy)) >= 12 เดือน && (mfg (dd/mm/yyyy) - expiryDate RM (dd/mm/yyyy) // ลบเป็นวันไม่สนเดือนและปี) > 0 วัน ) ให้แสดง Cpd. Exp. เป็น RM > 1 Year
    orderCompound.sort((a, b) => b.diff - a.diff);
    if (orderCompound.length && orderCompound[0].rawMaterialData) {
      var now = moment(this.order.productionEndDate, "DD/MM/YYYY");
      var end = moment(orderCompound[orderCompound.length - 1].rawMaterialData.expiryDate, "YYYY-MM-DD");
      const month = moment(end).diff(now, 'months', true);
      console.log("orderCompound", this.order.productionEndDate, orderCompound[orderCompound.length - 1].rawMaterialData.expiryDate, month);
      if (month >= 12) {
        return "RM > 1 Year"
      } else {
        return end.format('DD/MM/YYYY')
      }
    }

    // else ให้แสดง Cpd. Exp. set as mfg (dd/mm/yyyy)
    return this.order.productionEndDate;
  }

  async searchOrderPharmacistView() {
    try {
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
      if (response.resultCode === resultCodeSuccess) {
        this.order = response.resultData;
        if (this.order.totalCapPerDayWF2) {
          this.capPerDayWF2 = this.order.totalCapPerDayWF2;
        }
        this.orderCompound = this.order.orderCompound || [];
        // this.orderDispensedPill = this.order.orderDispensedPill || [];
        this.deliveryDetailList = this.order.deliveryDetail || [];
        this.seperateMedicines = this.order.seperateMedicines || [];
        this.medicationsNotReceived = this.order.medicationsNotReceived || [];
        if (this.order) {
          this.orderStatus = +this.order.orderStatus;
          if (this.orderStatus < 17) {
            this.order.packaging = this.deliveryDetailList[0] ? this.deliveryDetailList[0].packaging : null;
          }
          if (this.orderStatus >= 17) {
            this.bbf = this.order.bbf;
            this.cpdExp = this.order.cpdExp;
          }
          if (this.orderCompound.length > 0) {
            const findCompoundPill = this.order.orderDispensedPill.find(obj => obj.finishedProductName === 'Compounded Pills');
            if (!findCompoundPill) {
              this.order.orderDispensedPill.unshift({
                orderId: this.Id,
                no: 0,
                finishedProductName: 'Compounded Pills',
                unit: 'Cap',
                totalPill: 0
              });
            }
          }
          this.order.orderDispensedPill = this.order.orderDispensedPill.filter(obj => {
            console.log('obj', obj);
            if (obj.isVitalLife) {
              obj.method = 'update';
            }
            return obj;
          });

          if (this.orderStatus < 24) {
            //if (this.order.orderDispensedPill.length > 0 && this.order.isSeparateMeal != 0) {
            if (this.order.orderDispensedPill.length > 0) {
              if (this.order.sepMorningSupplyDay) {
                this.orderForm.controls['rdlDispensedPillMorning'].enable();
              } else {
                this.orderForm.controls['rdlDispensedPillMorning'].enable();
              }
              if (this.order.sepLunchSupplyDay) {
                this.orderForm.controls['rdlDispensedPillLunch'].enable();
              } else {
                this.orderForm.controls['rdlDispensedPillLunch'].enable();
              }
              if (this.order.sepEveningSupplyDay) {
                this.orderForm.controls['rdlDispensedPillEvening'].enable();
              } else {
                this.orderForm.controls['rdlDispensedPillEvening'].enable();
              }
              if (this.order.sepBedtimeSupplyDay) {
                this.orderForm.controls['rdlDispensedPillBedtime'].enable();
              } else {
                this.orderForm.controls['rdlDispensedPillBedtime'].enable();
              }
            } else {
              this.orderForm.controls['rdlDispensedPillMorning'].disable();
              this.orderForm.controls['rdlDispensedPillLunch'].disable();
              this.orderForm.controls['rdlDispensedPillEvening'].disable();
              this.orderForm.controls['rdlDispensedPillBedtime'].disable();
            }
          }

          this.order.orderDate = this.common.convertDate(this.order.orderDate, 'DD/MM/YYYY HH:mm');
          const findItem = this.itemList.find(obj => obj.id === this.order.item);
          this.order.item = findItem ? findItem.name : '';
          this.order.productionStart = this.order.productionStartDate + ' ' + this.order.productionStartTime;
          this.order.productionEnd = this.order.productionEndDate + ' ' + this.order.productionEndTime;
          this.order.realProductionStart = this.order.realProductionStartDate + ' ' + this.order.realProductionStartTime;
          this.order.realProductionEnd = this.order.realProductionEndDate + ' ' + this.order.realProductionEndTime;
          // packaging
          const findOrderPackaging = this.packagingList.find(obj => obj.id === this.order.packaging);
          this.order.packagingName = findOrderPackaging ? findOrderPackaging.name : '';
          // pharmacyCheck1
          this.pharmacyCheck1.isProdPc1CheckDoc = this.order.isProdPc1CheckDoc === 1;
          this.pharmacyCheck1.isProdPc1CheckStock = this.order.isProdPc1CheckStock === 1;
          this.pharmacyCheck1.isProdPc1CheckPills = this.order.isProdPc1CheckPills === 1;
          this.pharmacyCheck1.isProdPc1CheckSep = this.order.isProdPc1CheckSep === 1;
          // pharmacyCheck2
          this.pharmacyCheck2.isProdPc2CheckProd = this.order.isProdPc2CheckProd === 1;
          this.pharmacyCheck2.isProdPc2CheckTC = this.order.isProdPc2CheckTC === 1;
          this.pharmacyCheck2.isProdPc2CheckPills = this.order.isProdPc2CheckPills === 1;
          this.pharmacyCheck2.isProdPc2CheckMed = this.order.isProdPc2CheckMed === 1;
          this.pharmacyCheck2.isProdPc2CheckGuide = this.order.isProdPc2CheckGuide === 1;
          // pharmacyCheck
          this.pharmacyCheck.urgent = this.order.isOrderPcCheckUrgent === 1;
          this.pharmacyCheck.rm = this.order.isOrderPcCheckRm === 1;
          this.pharmacyCheck.allergyChecked = this.order.isOrderPcCheckAllergy === 1;
          this.pharmacyCheck.medReconcile = this.order.isOrderPcCheckMed === 1;
          this.pharmacyCheck.wf2 = this.order.isOrderPcCheckWf2 === 1;

          // quotation
          this.quotation.noBatchCharge = this.order.isOrderQtCheckNoBatch === 1;
          this.quotation.noPackCharge = this.order.isOrderQtCheckNoPack === 1;
          this.quotation.staff = this.order.isOrderQtCheckStaff === 1;
          // capsule
          if (this.order.capsuleWF2) {
            this.capsule.wf2 = this.order.capsuleWF2.code || null;
          }
          // type
          this.order.type = this.order.type === 1 ? 'Yes' : 'No';

          // ถ้า Cap per Day ของ Order สั้่งแยกมื้อเป็น 0 ไม่ต้องแสดงในตาราง
          if (this.order.isSeparateMeal) {
            if (this.order.sepLastMorningCapPerDay === null || this.order.sepLastMorningCapPerDay === undefined || (this.order.sepLastMorningCapPerDay && +this.order.sepLastMorningCapPerDay === 0)) {
              this.order.sepLastMorningCapPerDay = 0;
            }
            if (this.order.sepLastLunchCapPerDay === null || this.order.sepLastLunchCapPerDay === undefined || (this.order.sepLastLunchCapPerDay && +this.order.sepLastLunchCapPerDay === 0)) {
              this.order.sepLastLunchCapPerDay = 0;
            }
            if (this.order.sepLastEveningCapPerDay === null || this.order.sepLastEveningCapPerDay === undefined || (this.order.sepLastEveningCapPerDay && +this.order.sepLastEveningCapPerDay === 0)) {
              this.order.sepLastEveningCapPerDay = 0;
            }
            if (this.order.sepLastBedtimeCapPerDay === null || this.order.sepLastBedtimeCapPerDay === undefined || (this.order.sepLastBedtimeCapPerDay && +this.order.sepLastBedtimeCapPerDay === 0)) {
              this.order.sepLastBedtimeCapPerDay = 0;
            }
          }

          if (this.order.language) {
            this.preferredLanguage = this.order.language === 1 ? 'Thai' : 'English'
          } else {
            if (this.order.preferredLanguage !== 'ไทย' && this.order.preferredLanguage !== 'Thai') {
              this.preferredLanguage = 'English';
            } else {
              this.preferredLanguage = 'Thai';
            }
          }
          this.fnSetPreferredLanguage();

          if (this.order.productionPicture) {
            this.order.productionPictureList = this.order.productionPicture.split('|');
          } else {
            this.order.productionPictureList = [];
          }
          const deliyveryEdit = this.order.deliveryDetail.find((row: any) => row.deliveryDetailId == localStorage.getItem('deliveryDetailId'))

          if (deliyveryEdit) {
            if (deliyveryEdit.pharmacyPicture) {
              this.pharmacyPictureList = deliyveryEdit.pharmacyPicture.split('|');
            } else {
              this.pharmacyPictureList = [];
            }
          }
          console.log("=========================x", this.pharmacyPictureList)
          this.partialDeliveryReadonly = !!(this.orderStatus === 25 && this.order.isCompletePcCheckDeli);
          this.isCompletePcCheckDeli = this.order.isCompletePcCheckDeli
          console.log("=========================b", this.isCompletePcCheckDeli)
          // set text highlight textarea
          setTimeout(() => {
            if (+this.order.isOrderPcCheckWf2 === 1) {
              $('#txtOrderPharmacyNoteRemark').highlightTextarea({
                ranges: [[0, 9999]]
              });
              $('#txtAdditionalNoteFromDoctor').highlightTextarea({
                ranges: [[0, 9999]]
              });
            }
          }, 1000);
        }

        const deliveryDetailMethod = [];
        const deliveryDetailArrivalDateTime = [];

        for (let i = 0; i < this.order.deliveryDetail.length; i++) {
          const data = this.order.deliveryDetail[i];
          if (this.order.isCompletePcCheckDeli) {
            const deliyveryEdit = this.order.deliveryDetail.find((row: any) => row.deliveryDetailId == localStorage.getItem('deliveryDetailId'))

            if (+deliyveryEdit.isComplete === 0 || deliyveryEdit.isComplete === null) {
              this.isCompleteAllDelivery = false;
            }
            this.deliveryList.push({
              deliveryDetailId: data.deliveryDetailId,
              supplyDay: data.supplyDay,
              remindDate: data.remindDate,
              deliveryDate: moment(data.deliveryDate, 'DD/MM/YYYY'),
              showHide: 1,
              edited: 1,
              isComplete: data.isComplete,
              recipientName: data.recipientName,
              phone: data.phone,
              patientAddressId: +data.patientAddressId,
              address: data.address,
              district: data.district,
              subdistrict: data.subdistrict,
              districtProvince: this.common.concatAddress({
                subdistrict: data.subdistrict,
                district: data.district,
                province: data.province,
              }),
              province: data.province,
              postcode: data.postcode,
              arrivalTime: data.arrivalTime,
              deliveryMethod: data.deliveryMethod,
              deliveryMethodOther: data.deliveryMethodOther,
              packaging: data.packaging,
              isInvoice: data.isInvoice === 1,
              isReceipt: data.isReceipt === 1,
              isUrgent: data.isUrgent === 1,
              cashierDeliNote: data.cashierDeliNote,
              cashierId: data.cashierId,
            });

            let controlAddress = new FormControl({ value: '', disabled: true }, [Validators.required]);
            if (data.deliveryMethod == 2) {
              controlAddress = new FormControl({ value: '', disabled: true });
            }

            const controls = {
              txtDeliveryStartDate: new FormControl({ value: '', disabled: true }, [Validators.required]),
              txtDeliverySupplyDay: new FormControl({ value: '', disabled: true }, [Validators.required]),
              txtRecipientName: new FormControl({ value: '', disabled: true }, [Validators.required]),
              txtPhone: new FormControl({ value: '', disabled: true }, [Validators.required]),
              ddlAddress: controlAddress,
              txtAddressDetail: new FormControl({ value: '', disabled: true }),
              txtDistrictProvince: new FormControl({ value: '', disabled: true }),
              txtPostcode: new FormControl({ value: '', disabled: true }),
              ddlArrivalTime: new FormControl({ value: '', disabled: true }, [Validators.required]),
              ddlDeliveryMethod: new FormControl({ value: '', disabled: true }, [Validators.required]),
              txtDeliveryMethodOther: new FormControl({ value: '', disabled: true }),
              ddlPackaging: new FormControl({ value: '', disabled: true }, [Validators.required]),
              ddlLocation: new FormControl({ value: '', disabled: true }),
              cbxIsInvoice: new FormControl({ value: '', disabled: true }),
              cbxIsReceipt: new FormControl({ value: '', disabled: true }),
              cbxIsUrgent: new FormControl({ value: '', disabled: true }),
              txtCashierDeliNote: new FormControl({ value: '', disabled: true }),
            };
            if (data.remindDate) {
              controls['txtDeliveryRemindDate'] = new FormControl({
                value: '',
                disabled: true
              }, [Validators.required]);
            }
            this.formSplitDelivery.push(this.fb.group(controls));
          }
          // deliveryMethod
          let deliveryMethod = '';
          if (data.deliveryMethod === 6) { // other
            deliveryMethod = data.deliveryMethodOther ? 'Other : ' + data.deliveryMethodOther : '';
          } else {
            const findDeliveryMethod = this.deliveryMethodList.find(obj => obj.id === data.deliveryMethod);
            deliveryMethod = findDeliveryMethod ? findDeliveryMethod.name : '';
          }
          deliveryDetailMethod.push(deliveryMethod);

          // arrivalTime
          const findArrivalTime = this.arrivalTimeList.find(obj => obj.id === data.arrivalTime);
          const arrivalTime = findArrivalTime ? findArrivalTime.name : '';
          deliveryDetailArrivalDateTime.push(data.deliveryDate + ' ' + arrivalTime);
          this.arrivalTimeMap[i] = _.cloneDeep(this.arrivalTimeListBackup);
        }
        if (this.order.isCompletePcCheckDeli) {
          this.cloneSplit = _.cloneDeep(this.deliveryList);
        }
        this.deliveryDetailMethod = deliveryDetailMethod.join(', ');
        this.deliveryDetailArrivalDateTime = deliveryDetailArrivalDateTime.join(', ');
      } else {
        this.goAlert(resultDescriptionSystemErrorTitle, resultDescriptionSystemErrorMassage, 'myModalError');
        this.goAlert(response.resultCode, response.resultDescription, 'myModalError');
      }
    } catch (e) {
      console.log(e);
      const resultDescriptionSystemErrorTitle = environment.resultDescriptionSystemErrorTitle;
      const resultDescriptionSystemErrorMassage = environment.resultDescriptionSystemErrorMassage;
      this.goAlert(resultDescriptionSystemErrorTitle, resultDescriptionSystemErrorMassage, 'myModalError');
    }
  }

  async searchRawMaterials() {
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
        // หลังจาก status 17 First Review Done เป็นต้นไปจะต้องดึงจาก order มาแสดงเพราะ มันถูก save ลงตอนขา POST updateFirstReviewDone
        if (+this.order.orderStatus < 17) {

          this.cpdExp = this.cpdExpValue();
          this.bbf = this.bbfValue();

          // const defaultExpiryDate = moment(this.order.productionEndDate).add(1, 'y');
          // const expiryDateUnixList = [];
          // for (let i = 0; i < this.rawMaterialList.length; i++) {
          //   const code = this.rawMaterialList[i].code;
          //   // check rawMaterial has in orderCompound
          //   let isInOrderCompound = false;
          //   for (let j = 0; j < this.orderCompound.length; j++) {
          //     if (this.orderCompound[j].rawMaterialCode === code && this.orderCompound[j].rawMaterialName !== 'Vivapur') {
          //       isInOrderCompound = true;
          //       break;
          //     }
          //   }
          //   if (isInOrderCompound) {
          //     const rawMatExpiryDate = this.rawMaterialList[i].expiryDate;
          //     console.log('rawMatExpiryDate', rawMatExpiryDate);
          //     expiryDateUnixList.push(moment(rawMatExpiryDate).unix());
          //   }
          // }
          // let expiryDate = null;
          // expiryDateUnixList.sort();
          // console.log('expiryDateUnixList', expiryDateUnixList);
          // const productionEndDate = moment(this.order.productionEndDate, 'DD/MM/YYYY HH:mm').set({
          //   h: 0,
          //   m: 0,
          //   s: 0,
          //   ms: 0
          // });
          // console.log('productionEndDate', productionEndDate.format('DD/MM/YYYY'));
          // for (let i = 0; i < expiryDateUnixList.length; i++) {
          //   const expDate = moment.unix(expiryDateUnixList[i]);
          //   console.log(expDate.format('DD/MM/YYYY'));
          //   const diffDay = expDate.diff(productionEndDate, 'day', false);
          //   console.log('diffDay', diffDay);
          //   if (diffDay <= 365) {
          //     expiryDate = expDate;
          //     break;
          //   }
          // }
          // if (expiryDate) {
          //   this.bbf = moment(expiryDate).format('DD/MM/YYYY');
          // } else {
          //   this.bbf = defaultExpiryDate.format('DD/MM/YYYY');
          // }
          //
          // const maxExpiryDate = expiryDateUnixList[expiryDateUnixList.length - 1];
          // if (maxExpiryDate) {
          //   console.log('maxExpiryDate', moment.unix(maxExpiryDate).format('DD/MM/YYYY'));
          //   const cpdExpDiffDay = moment.unix(maxExpiryDate).diff(productionEndDate, 'day', false);
          //   console.log('cpdExpDiffDay', cpdExpDiffDay);
          //   if (cpdExpDiffDay > 365) {
          //     this.cpdExp = 'RM > 1 Year';
          //   } else {
          //     this.cpdExp = this.bbf;
          //   }
          // } else {
          //   this.cpdExp = this.bbf;
          // }
        }

      } else {
        this.rawMaterialList = [];
      }
    } catch (e) {
      console.error(e);
      this.rawMaterialList = [];
    }
  }

  async searchPharmacyNotes() {
    // if (this.order.orderStatus == 24) {
    //   return;
    // }
    try {
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
          this.pharmacyNotes.productionNote = resultData[0].productionNote;
        }
      } else {
        this.pharmacyNotes.productionNote = '';
      }
    } catch (e) {
      console.error(e);
      this.pharmacyNotes.productionNote = '';
    }
  }

  async searchCapsules() {
    // if (this.order.orderStatus == 24) {
    //   return;
    // }
    try {
      const checkUrl = this.common.checkMockupUrl('', '', '', {
        BASE_API: '',
        BASE_MODULE: environment.apiPrefix,
        BASE_RESOURCE: environment.searchCapsules
      });
      const resultCodeSuccess = environment.resultCodeSuccess;

      const response = await this.request.get(checkUrl.url, checkUrl.filter);
      if (response.resultCode === resultCodeSuccess) {
        const resultData = await response.resultData;
        if (resultData && resultData.length > 0) {
          this.capsulesList = resultData;
        }
      } else {
        this.capsulesList = [];
      }
    } catch (e) {
      console.error(e);
      this.capsulesList = [];
    }
  }

  async getSearchQuotationDetail() {
    try {
      const filterData = {
        orderId: this.Id,
      };
      const checkUrl = this.common.checkMockupUrl('', '', filterData, {
        BASE_API: '',
        BASE_MODULE: environment.apiPrefix,
        BASE_RESOURCE: environment.searchQuotationDetail
      });

      const resultCodeSuccess = environment.resultCodeSuccess;
      const response = await this.request.get(checkUrl.url, checkUrl.filter);
      if (response.resultCode === resultCodeSuccess) {
        this.quotationDetail = response.resultData;
      } else {
        this.quotationDetail = {};
        this.goAlert(response.resultCode, response.resultDescription, 'myModalError');
      }

    } catch (e) {
      console.log(e);
      const resultDescriptionSystemErrorTitle = environment.resultDescriptionSystemErrorTitle;
      const resultDescriptionSystemErrorMassage = environment.resultDescriptionSystemErrorMassage;
      this.goAlert(resultDescriptionSystemErrorTitle, resultDescriptionSystemErrorMassage, 'myModalError');
    }
  }

  async btnSubmit() {
    try {
      // this.disbledBtn = {
      //   'save': true,
      //   'cancel': true
      // };
      const requiredData: boolean = this.checkOrderForm();
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

      if (this.pageType == 'new') {
        this.goAlert('', '', 'myModalSuccess');
      } else {
        this.fnClickSplitProduction();
      }

      // if (requiredData) {
      //   let addData:any = {
      //     'binName': this.common.trimData(this.editDataGroups['binName']),
      //   };
      //   if(this.pageType ===  'edit'){
      //     addData.binId = this.Id
      //   }

      //   let checkUrl = null;
      //     if(   this.pageType ===  'new' ){
      //       checkUrl = this.common.checkMockupUrl('', GlobalVariable.RESOURCE, {}, {
      //         BASE_API: GlobalVariable.BASE_API,
      //         BASE_MODULE: GlobalVariable.BASE_MODULE,
      //         BASE_RESOURCE: GlobalVariable.BASE_RESOURCE + GlobalVariable.BASE_RESOURCE_CREATE
      //       });
      //     }else{
      //       checkUrl = this.common.checkMockupUrl('', GlobalVariable.RESOURCE, {}, {
      //         BASE_API: GlobalVariable.BASE_API,
      //         BASE_MODULE: GlobalVariable.BASE_MODULE,
      //         BASE_RESOURCE: GlobalVariable.BASE_RESOURCE + GlobalVariable.BASE_RESOURCE_UPDATE
      //       });
      //     }

      //   let response = await this.request.post(checkUrl.url,this.pageType ===  'new' ? [addData]: addData);

      //   let resultCodeSuccess = environment.resultCodeSuccess;
      //   let resultCodeMissingParameter = environment.resultCodeMissingParameter;
      //   let resultCodeDataNotFound = environment.resultCodeDataNotFound;

      //   const userMessageAlreadyExisted = response.userMessage;
      //   if (response.resultCode === resultCodeSuccess) {

      //     this.goAlert('', '', 'myModalSuccess');
      //   }
      //   // else if (response.resultCode === resultCodeDataNotFound) {
      //   //   this.goAlert(resultDescriptionDataNotFoundTitle, resultDescriptionDataNotFoundMassage, 'myModalError');
      //   // } else if (response.resultCode === resultCodeDataExisted) {
      //   //   this.goAlert(userMessageAlreadyExisted, resultDescriptionDataExistedMassage, 'myModalError');
      //   // } else if (response.resultCode === resultCodeDbError) {
      //   //   this.goAlert(resultDescriptionDbErrorTitle, resultDescriptionDbErrorMassage, 'myModalError');
      //   // }
      //   else {
      //     // this.goAlert(resultDescriptionSystemErrorTitle, resultDescriptionSystemErrorMassage, 'myModalError');
      //     this.goAlert(response.resultCode, response.resultDescription, 'myModalError');
      //   }

      // } else {
      //   console.log('กรุณากรอกข้อมูลให้ถูกต้อง');
      //   this.goAlert('Field is required', 'Your have left a field empty and a value must be entered.', 'myModalWarning');
      //   // $(this.modalRequired.nativeElement).modal('show');
      //   this.disbledBtn = {
      //     'save': false,
      //     'cancel': false
      //   };

      // }
    } catch (e) {
      console.log(e);
      this.disbledBtn = {
        'save': false,
        'cancel': false
      };
    }
  }

  checkOrderForm() {
    for (const key in this.orderForm.controls) {
      if (key === 'dispensedPill' || key === 'separateMedicines' || key === 'compound' || key === 'medicationsNotReceived') {
        const formArr: any = this.orderForm.controls[key];
        for (const formGroup of formArr.controls) {
          for (const key2 in formGroup.controls) {
            if (formGroup.controls[key2].errors) {
              formGroup.controls[key2].setErrors({ 'forceRequired': true });
              formGroup.controls[key2].markAsDirty();
            } else {
              formGroup.controls[key2].updateValueAndValidity();
            }
          }
        }
      } else {
        if (this.orderForm.controls[key].errors || this.orderForm.controls[key].value === 'null') {
          this.orderForm.controls[key].setErrors({ 'forceRequired': true });
          this.orderForm.controls[key].markAsDirty();
        } else {
          this.orderForm.controls[key].updateValueAndValidity();
        }
      }

    }
    console.log('this.orderForm', this.orderForm);

    // check duplicate
    if (this.orderForm.valid) {
      // Dispensed Pill
      for (let i = 0; i < this.order.orderDispensedPill.length; i++) {
        const finishedProductName = this.order.orderDispensedPill[i].finishedProductName;
        if (finishedProductName && this.isDuplicateDispensedPill[finishedProductName] > 1) {
          // is duplicate
          return false;
        }
      }
      // Separate medicines
      for (let i = 0; i < this.seperateMedicines.length; i++) {
        const name = this.seperateMedicines[i].name;
        if (name && this.isDuplicateFinishedProduct[name] > 1) {
          // is duplicate
          return false;
        }
      }
      console.log("-isDuplicateMedicationsNotReceived", this.isDuplicateMedicationsNotReceived)
      for (let i = 0; i < this.medicationsNotReceived.length; i++) {
        const name = this.medicationsNotReceived[i].name;
        if (name && this.isDuplicateMedicationsNotReceived[name] > 1) {
          // is duplicate
          return false;
        }
      }
    }
    return this.orderForm.valid;
  }

  numberOnly(event): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;
    if (charCode == 46) {
      return true;
    } else if (charCode > 31 && (charCode < 48 || charCode > 57)) {
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
    this.fnClearSplitDeliveryList();
    this.router.navigate(['/order-management', 'orders-pharmacist-view']);
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

  onCloseModalSplit() {
    if (this.nextAfterAlert) {
      this.nextAfterAlert();
      this.nextAfterAlert = null;
    }
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
    // txtFinishedProductName: new FormControl('', Validators.required),
    this.formDispensedPill.push(this.fb.group({
      txtFinishedProductName: new FormControl('', [Validators.required]),
      txtNote: new FormControl(''),
      txtPhysician: new FormControl(''),
      txtMac: new FormControl(''),
      txtMpc: new FormControl(''),
      txtLac: new FormControl(''),
      txtLpc: new FormControl(''),
      txtEac: new FormControl(''),
      txtEpc: new FormControl(''),
      txtBac: new FormControl(''),
      txtTotalPill: new FormControl('', [Validators.required]),
      isCheckedDispensedPill: new FormControl(false)
    }));
    this.checkAllDispensedPill()
    this.order.orderDispensedPill.push({
      no: null,
      finishedProductName: null,
      note: null,
      physician: null,
      mac: null,
      mpc: null,
      lac: null,
      lpc: null,
      eac: null,
      epc: null,
      bpc: null,
      totalPill: null,
      isVitalLife: 1
    });
    this.orderForm.controls['rdlDispensedPillMorning'].enable();
    this.orderForm.controls['rdlDispensedPillLunch'].enable();
    this.orderForm.controls['rdlDispensedPillEvening'].enable();
    this.orderForm.controls['rdlDispensedPillBedtime'].enable();
  }

  checkValid(e: any, target: any) {
    return e.controls[target].invalid && e.controls[target].dirty;
  }

  delDispensed(item) {
    if (this.order.orderDispensedPill[item].id) {
      this.delDispensedArr.push({
        method: 'delete',
        orderDispensedPillId: this.order.orderDispensedPill[item].id
      });
    }
    this.order.orderDispensedPill.splice(item, 1);
    this.formDispensedPill.removeAt(item);
    this.fnCalTotal();
    this.isDuplicateDispensedPill = _.countBy(this.order.orderDispensedPill, 'finishedProductName');
    if (this.order.orderDispensedPill.length > 0) {
      this.orderForm.controls['rdlDispensedPillMorning'].enable();
      this.orderForm.controls['rdlDispensedPillLunch'].enable();
      this.orderForm.controls['rdlDispensedPillEvening'].enable();
      this.orderForm.controls['rdlDispensedPillBedtime'].enable();
    } else {
      this.orderForm.controls['rdlDispensedPillMorning'].disable();
      this.orderForm.controls['rdlDispensedPillLunch'].disable();
      this.orderForm.controls['rdlDispensedPillEvening'].disable();
      this.orderForm.controls['rdlDispensedPillBedtime'].disable();
    }
  }

  fnCheckDupDispensedPill() {
    this.isDuplicateDispensedPill = _.countBy(this.order.orderDispensedPill, 'finishedProductName');
  }

  // updateDispensedPill(e, index) {
  //   console.log('e.itemData', e.itemData);
  //   this.order.orderDispensedPill[index].unit = e.itemData.uom;
  //   this.order.orderDispensedPill[index].finishedProductCode = e.itemData.code;
  //   this.order.orderDispensedPill[index].finishedProductName = e.itemData.finishedProductName;
  //   this.order.orderDispensedPill[index].dosePerDay = e.itemData.dosePerDay;
  //   this.isDuplicateDispensedPill = _.countBy(this.order.orderDispensedPill, 'finishedProductName');
  // }

  // onFocusOutDispensedPill(e, index) {
  //   const inputValue = e.event.target.value;
  //   if (inputValue !== this.order.orderDispensedPill[index].finishedProductName) {
  //     if (this.order.orderDispensedPill[index].finishedProductName) {
  //       e.event.target.value = this.order.orderDispensedPill[index].finishedProductName;
  //     } else {
  //       e.event.target.value = '';
  //     }
  //   }
  // }

  addDetails() {
    this.quotationDetails.push({
      description: null,
      quantity: null,
      uom: null,
      unitPrice: null,
      amount: null
    });

  }

  delDetails(item) {
    this.quotationDetails.splice(item, 1);
  }

  changeOrder() {
    this.orderPill.totalCap = (+this.orderPill.lastMorning + +this.orderPill.lastLunch + +this.orderPill.lastEvening + +this.orderPill.lastBedtime).toFixed(2) || '';
    this.orderPill.calculatedDay =
      (((+this.orderPill.lastMorning * +this.orderPill.currentMorning) +
        (+this.orderPill.lastLunch * +this.orderPill.currentLunch) +
        (+this.orderPill.lastEvening * +this.orderPill.currentEvening) +
        (+this.orderPill.lastBedtime * +this.orderPill.currentBedtime)) / +this.orderPill.totalCap).toFixed(2) || '';
    console.log(this.orderPill);
  }

  fnClickSplitProduction() {
    this.modalSplitProduction.open(this.Id);
  }

  onClickSplitProductionNo() {
    this.router.navigate(['/order-management', 'orders-production-pharmacist-view', this.Id, 'view'], {
      queryParams: {
        tab: this.tabIndex,
      }
    });
  }

  fnClickSplitDelivery() {
    const splitDeliveryListStr = localStorage.getItem('splitDeliveryList');
    const deliveryDetailId = localStorage.getItem('deliveryDetailId');
    const deliveryDetail = this.order.deliveryDetail.find((row: any) => row.deliveryDetailId == deliveryDetailId);
    if (deliveryDetail && deliveryDetail.deliveryStatus == 30) {
      this.nextAfterAlert = () => {
        this.openSplitDeliveryModal(splitDeliveryListStr);
      };
      this.goAlert('', '', 'myModalSplitDeliveryAlert');
      return;
    }

    this.openSplitDeliveryModal(splitDeliveryListStr);
  }

  // แยก logic เปิด modalSplitDelivery ออกมา
  openSplitDeliveryModal(splitDeliveryListStr: string | null) {
    const modalData = {
      productionEndDate: this.order.productionEndDate,
      hn: this.order.hn,
      arrivalTimeList: this.arrivalTimeList,
      deliveryMethodList: this.deliveryMethodList,
      packagingList: this.packagingList,
      supplyDay: this.order.supplyDay,
      step: splitDeliveryListStr ? 2 : 1
    };

    this.modalSplitDelivery.open(modalData);
  }


  fnClickInsertOrder() {
    if (!this.allCompoundAndPillChecked || !this.isAllPharmacyCheckChecked()) {
      this.goAlert('Field is required', 'Your have left a field empty and a value must be entered.', 'myModalWarning');
      return
    }
    this.goAlert('', '', 'myModalInsertTrakCare');
  }

  async insertTrakCare() {
    try {
      const resultCodeSuccess = environment.resultCodeSuccess;

      const addData: any = {
        orderId: this.Id
      };

      let checkUrl = null;
      checkUrl = this.common.checkMockupUrl('', GlobalVariable.RESOURCE, {}, {
        BASE_API: GlobalVariable.BASE_API,
        BASE_MODULE: GlobalVariable.BASE_MODULE,
        BASE_RESOURCE: GlobalVariable.BASE_RESOURCE + GlobalVariable.BASE_RESOURCE_UPDATE_TRAKCARE
      });

      const response = await this.request.post(checkUrl.url, addData);
      if (response.resultCode === resultCodeSuccess) {
        this.router.navigateByUrl('/microservice-menus').then(
          () => this.router.navigate(['/order-management', 'orders-production-pharmacist-view', this.Id, 'view'], {
            queryParams: {
              tab: this.tabIndex,
            }
          })
        );
      } else {
        this.goAlert(response.resultCode, response.resultDescription, 'myModalError');
      }
    } catch (e) {
      console.log(e);
    }
  }

  async fnUpdateFirstReviewDone() {
    try {

      if (this.disbledBtn.save) {
        console.log('Print Done function is already running, please wait...');
        return;
      }
      this.disbledBtn = {
        'save': true,
        'cancel': true
      };

      if (!this.allCompoundAndPillChecked) {
        this.goAlert('Field is required', 'Your have left a field empty and a value must be entered.', 'myModalWarning');
        return
      }
      const isValid: boolean = this.checkOrderForm();
      if (isValid && this.isAllPharmacyCheckChecked()) {
        const capsuleWF1 = this.capsulesList.find(obj => obj.code === this.capsule.wf1);
        const capsuleWF2 = this.capsulesList.find(obj => obj.code === this.capsule.wf2);
        const resultCodeSuccess = environment.resultCodeSuccess;
        const payload: any = {
          orderId: this.order.orderId,
          mfg: moment(this.order.productionEndDate, 'DD/MM/YYYY').format('DD-MM-YYYY'),
          bbf: moment(this.bbf, 'DD/MM/YYYY').format('DD-MM-YYYY'),
          cpdExp: this.cpdExp,
          packaging: +this.order.packaging,
          prodPharmacyNote: this.pharmacyNotes.productionNote,
          orderPharmacyNoteRemark: this.order.orderPharmacyNoteRemark,
          capsuleWF1: capsuleWF1 ? capsuleWF1.capsuleId : null,
          capsuleWF2: capsuleWF2 ? capsuleWF2.capsuleId : null,
          bottleNumberOfCap: this.order.bottleNumberOfCap,
          bottleMeals: this.order.bottleMeals,
          instruction: this.order.instruction,
          warning: this.order.warning,
          additionalInstruction: this.order.additionalInstruction,
          additionalWarning: this.order.additionalWarning,
          isProdPc1CheckDoc: this.pharmacyCheck1.isProdPc1CheckDoc ? 1 : 0,
          isProdPc1CheckStock: this.pharmacyCheck1.isProdPc1CheckStock ? 1 : 0,
          isProdPc1CheckPills: this.pharmacyCheck1.isProdPc1CheckPills ? 1 : 0,
          isProdPc1CheckSep: this.pharmacyCheck1.isProdPc1CheckSep ? 1 : 0,
          language: this.preferredLanguage === 'Thai' ? 1 : 2,
          totalCapPerDayWF2: this.capPerDayWF2 || null,
          orderCompound: [],
          orderDispensedPill: [],
          seperateMedicines: [],
          medicationsNotReceived: [],
        };
        for (let i = 0; i < this.order.orderCompound.length; i++) {
          if (this.order.orderCompound[i].isNewOrderCompound) {
            this.order.orderCompound[i].no = +this.order.orderCompound[i].no;
            this.order.orderCompound[i].orderId = +this.order.orderCompound[i].orderId;
            this.order.orderCompound[i].rmWeight = +this.order.orderCompound[i].rmWeight;
            this.order.orderCompound[i].maximumDose = +this.order.orderCompound[i].maximumDose;
            this.order.orderCompound[i].minimumDose = +this.order.orderCompound[i].minimumDose;
            payload.orderCompound.push(this.order.orderCompound[i]);
          } else {
            payload.orderCompound.push({
              orderCompoundId: this.order.orderCompound[i].id,
              rmWeight: this.order.orderCompound[i].rmWeight,
              wf: this.order.orderCompound[i].wf,
            });
          }
        }
        for (let i = 0; i < this.order.orderDispensedPill.length; i++) {
          if (this.order.orderDispensedPill[i].isVitalLife || this.order.orderDispensedPill[i].finishedProductName === 'Compounded Pills') {
            if (this.order.orderDispensedPill[i].id) {
              payload.orderDispensedPill.push({
                orderDispensedPillId: this.order.orderDispensedPill[i].id,
                no: i + 1,
                method: 'update',
                totalPill: this.order.orderDispensedPill[i].totalPill || 0,
                morningWithMeals: +this.order.orderDispensedPill[i].mpc || 0,
                morningBeforeMeals: +this.order.orderDispensedPill[i].mac || 0,
                remark: this.order.orderDispensedPill[i].note,
                lunchWithMeals: +this.order.orderDispensedPill[i].lpc || 0,
                lunchBeforeMeals: +this.order.orderDispensedPill[i].lac || 0,
                eveningWithMeals: +this.order.orderDispensedPill[i].epc || 0,
                eveningBeforeMeals: +this.order.orderDispensedPill[i].eac || 0,
                bedtimeWithMeals: +this.order.orderDispensedPill[i].bpc || 0,
                isVitalLife: 1
              });
            } else {
              payload.orderDispensedPill.push({
                no: i + 1,
                method: 'insert',
                finishedProductCode: this.order.orderDispensedPill[i].finishedProductCode,
                finishedProductName: this.order.orderDispensedPill[i].finishedProductName,
                unit: this.order.orderDispensedPill[i].unit,
                dosePerDay: this.order.orderDispensedPill[i].physician || 0,
                totalPill: this.order.orderDispensedPill[i].totalPill || 0,
                remark: this.order.orderDispensedPill[i].note,
                morningWithMeals: +this.order.orderDispensedPill[i].mpc || 0,
                morningBeforeMeals: +this.order.orderDispensedPill[i].mac || 0,
                lunchWithMeals: +this.order.orderDispensedPill[i].lpc || 0,
                lunchBeforeMeals: +this.order.orderDispensedPill[i].lac || 0,
                eveningWithMeals: +this.order.orderDispensedPill[i].epc || 0,
                eveningBeforeMeals: +this.order.orderDispensedPill[i].eac || 0,
                bedtimeWithMeals: +this.order.orderDispensedPill[i].bpc || 0,
                isVitalLife: 1
              });
            }
          } else {
            if (this.order.orderDispensedPill[i].id) {
              payload.orderDispensedPill.push({
                orderDispensedPillId: this.order.orderDispensedPill[i].id,
                no: i + 1,
                method: 'update',
                totalPill: this.order.orderDispensedPill[i].totalPill || 0,
                morningWithMeals: +this.order.orderDispensedPill[i].mpc || 0,
                morningBeforeMeals: +this.order.orderDispensedPill[i].mac || 0,
                remark: this.order.orderDispensedPill[i].note,
                lunchWithMeals: +this.order.orderDispensedPill[i].lpc || 0,
                lunchBeforeMeals: +this.order.orderDispensedPill[i].lac || 0,
                eveningWithMeals: +this.order.orderDispensedPill[i].epc || 0,
                eveningBeforeMeals: +this.order.orderDispensedPill[i].eac || 0,
                bedtimeWithMeals: +this.order.orderDispensedPill[i].bpc || 0,
                isVitalLife: 1
              });
            }
          }
        }
        for (let i = 0; i < this.seperateMedicines.length; i++) {
          payload.seperateMedicines.push({
            no: i + 1,
            ...this.seperateMedicines[i]
          });
        }

        for (let i = 0; i < this.medicationsNotReceived.length; i++) {
          payload.medicationsNotReceived.push({
            no: i + 1,
            ...this.medicationsNotReceived[i]
          });
        }

        for (let i = 0; i < this.delDispensedArr.length; i++) {
          payload.orderDispensedPill.push(this.delDispensedArr[i]);
        }
        console.log('payload', payload);
        let checkUrl = null;

        checkUrl = this.common.checkMockupUrl('', GlobalVariable.RESOURCE, {}, {
          BASE_API: GlobalVariable.BASE_API,
          BASE_MODULE: GlobalVariable.BASE_MODULE,
          BASE_RESOURCE: GlobalVariable.BASE_RESOURCE + GlobalVariable.BASE_RESOURCE_UPDATE_FIRST_REVIEW_DONE
        });

        const response = await this.request.post(checkUrl.url, payload);
        if (response.resultCode === resultCodeSuccess) {
          this.fnClickSplitProduction();
        } else {
          this.goAlert(response.resultCode, response.resultDescription, 'myModalError');
        }
      } else {
        this.goAlert('Field is required', 'Your have left a field empty and a value must be entered.', 'myModalWarning');
      }
    } catch (e) {
      console.log(e);
    } finally {
      this.disbledBtn = {
        'save': false,
        'cancel': false
      };
    }
  }

  async fnClickPrintDone() {
    if (this.disbledBtn.save) {
      console.log('Print Done function is already running, please wait...');
      return;
    }
    this.disbledBtn = {
      'save': true,
      'cancel': true
    };

    try {
      const resultCodeSuccess = environment.resultCodeSuccess;

      const addData: any = {
        orderId: this.Id
      };

      let checkUrl = null;
      checkUrl = this.common.checkMockupUrl('', GlobalVariable.RESOURCE, {}, {
        BASE_API: GlobalVariable.BASE_API,
        BASE_MODULE: GlobalVariable.BASE_MODULE,
        BASE_RESOURCE: GlobalVariable.BASE_RESOURCE + GlobalVariable.BASE_RESOURCE_UPDATE_PRINT_DONE
      });

      const response = await this.request.post(checkUrl.url, addData);
      if (response.resultCode === resultCodeSuccess) {
        this.goAlert('', '', 'myModalSuccess');
      } else {
        this.goAlert(response.resultCode, response.resultDescription, 'myModalError');
      }
    } catch (e) {
      console.log(e);
    } finally {
      this.disbledBtn = {
        'save': false,
        'cancel': false
      };
    }
  }

  isAllPharmacyCheckChecked(): boolean {
    const targetCheckboxes = this.checkboxes
      .filter(cb => cb.name === 'pharmacyCheck');

    if (targetCheckboxes.length === 0) {
      return true;
    }

    return targetCheckboxes.every(cb => Boolean(cb.value) === true);
  }

  async fnClickSecondCheckDone() {
    try {
      if (!this.allCompoundAndPillChecked) {
        this.goAlert('Field is required', 'Your have left a field empty and a value must be entered.', 'myModalWarning');
        return
      }

      if (this.checkDispensedPill() && this.order.packaging != "null" && this.isAllPharmacyCheckChecked()) {
        const capsuleWF1 = this.capsulesList.find(obj => obj.code === this.capsule.wf1);
        const capsuleWF2 = this.capsulesList.find(obj => obj.code === this.capsule.wf2);
        const resultCodeSuccess = environment.resultCodeSuccess;
        const payload: any = {
          orderId: this.order.orderId,
          mfg: moment(this.order.productionEndDate, 'DD/MM/YYYY').format('DD-MM-YYYY'),
          bbf: moment(this.bbf, 'DD/MM/YYYY').format('DD-MM-YYYY'),
          packaging: +this.order.packaging,
          prodPharmacyNote: this.pharmacyNotes.productionNote,
          orderPharmacyNoteRemark: this.order.orderPharmacyNoteRemark,
          capsuleWF1: capsuleWF1 ? capsuleWF1.capsuleId : null,
          capsuleWF2: capsuleWF2 ? capsuleWF2.capsuleId : null,
          bottleNumberOfCap: this.order.bottleNumberOfCap,
          bottleMeals: this.order.bottleMeals,
          instruction: this.order.instruction,
          warning: this.order.warning,
          additionalInstruction: this.order.additionalInstruction,
          additionalWarning: this.order.additionalWarning,
          isProdPc1CheckDoc: this.pharmacyCheck1.isProdPc1CheckDoc ? 1 : 0,
          isProdPc1CheckStock: this.pharmacyCheck1.isProdPc1CheckStock ? 1 : 0,
          isProdPc1CheckPills: this.pharmacyCheck1.isProdPc1CheckPills ? 1 : 0,
          isProdPc1CheckSep: this.pharmacyCheck1.isProdPc1CheckSep ? 1 : 0,
          isProdPc2CheckProd: this.pharmacyCheck2.isProdPc2CheckProd ? 1 : 0,
          isProdPc2CheckTC: this.pharmacyCheck2.isProdPc2CheckTC ? 1 : 0,
          isProdPc2CheckPills: this.pharmacyCheck2.isProdPc2CheckPills ? 1 : 0,
          isProdPc2CheckMed: this.pharmacyCheck2.isProdPc2CheckMed ? 1 : 0,
          isProdPc2CheckGuide: this.pharmacyCheck2.isProdPc2CheckGuide ? 1 : 0,
          language: this.preferredLanguage === 'Thai' ? 1 : 2,
          totalCapPerDayWF2: this.capPerDayWF2 || null,
          orderCompound: [],
          orderDispensedPill: [],
          seperateMedicines: [],
          medicationsNotReceived: [],

        };
        for (let i = 0; i < this.order.orderCompound.length; i++) {
          if (this.order.orderCompound[i].isNewOrderCompound) {
            this.order.orderCompound[i].no = +this.order.orderCompound[i].no;
            this.order.orderCompound[i].orderId = +this.order.orderCompound[i].orderId;
            this.order.orderCompound[i].rmWeight = +this.order.orderCompound[i].rmWeight;
            this.order.orderCompound[i].maximumDose = +this.order.orderCompound[i].maximumDose;
            this.order.orderCompound[i].minimumDose = +this.order.orderCompound[i].minimumDose;
            payload.orderCompound.push(this.order.orderCompound[i]);
          } else {
            payload.orderCompound.push({
              orderCompoundId: this.order.orderCompound[i].id,
              rmWeight: this.order.orderCompound[i].rmWeight,
              wf: this.order.orderCompound[i].wf,
            });
          }
        }
        for (let i = 0; i < this.order.orderDispensedPill.length; i++) {
          if (this.order.orderDispensedPill[i].id) {
            let dataPayload = {
              orderDispensedPillId: this.order.orderDispensedPill[i].id,
              no: i + 1,
              method: 'update',
              totalPill: this.order.orderDispensedPill[i].totalPill,
              remark: this.order.orderDispensedPill[i].note,
              morningWithMeals: +this.order.orderDispensedPill[i].mpc || 0,
              morningBeforeMeals: +this.order.orderDispensedPill[i].mac || 0,
              lunchWithMeals: +this.order.orderDispensedPill[i].lpc || 0,
              lunchBeforeMeals: +this.order.orderDispensedPill[i].lac || 0,
              eveningWithMeals: +this.order.orderDispensedPill[i].epc || 0,
              eveningBeforeMeals: +this.order.orderDispensedPill[i].eac || 0,
              bedtimeWithMeals: +this.order.orderDispensedPill[i].bpc || 0,
              isVitalLife: 1
            }
            if (this.order.orderDispensedPill[i].oldPhysician != this.order.orderDispensedPill[i].physician && this.order.orderDispensedPill[i].finishedProductName == "Compounded Pills") {
              dataPayload = {
                ...dataPayload,
                dosePerDay: this.order.orderDispensedPill[i].physician,
              } as any;
            }
            payload.orderDispensedPill.push(dataPayload);
          } else {
            payload.orderDispensedPill.push({
              no: i + 1,
              method: 'insert',
              finishedProductCode: this.order.orderDispensedPill[i].finishedProductCode,
              finishedProductName: this.order.orderDispensedPill[i].finishedProductName,
              unit: this.order.orderDispensedPill[i].unit,
              dosePerDay: this.order.orderDispensedPill[i].physician,
              totalPill: this.order.orderDispensedPill[i].totalPill,
              remark: this.order.orderDispensedPill[i].note,
              morningWithMeals: +this.order.orderDispensedPill[i].mpc || 0,
              morningBeforeMeals: +this.order.orderDispensedPill[i].mac || 0,
              lunchWithMeals: +this.order.orderDispensedPill[i].lpc || 0,
              lunchBeforeMeals: +this.order.orderDispensedPill[i].lac || 0,
              eveningWithMeals: +this.order.orderDispensedPill[i].epc || 0,
              eveningBeforeMeals: +this.order.orderDispensedPill[i].eac || 0,
              bedtimeWithMeals: +this.order.orderDispensedPill[i].bpc || 0,
              isVitalLife: 1
            });
          }
        }

        for (let i = 0; i < this.delDispensedArr.length; i++) {
          payload.orderDispensedPill.push(this.delDispensedArr[i]);
        }

        for (let i = 0; i < this.seperateMedicines.length; i++) {
          payload.seperateMedicines.push({
            no: i + 1,
            ...this.seperateMedicines[i]
          });
        }

        for (let i = 0; i < this.medicationsNotReceived.length; i++) {
          payload.medicationsNotReceived.push({
            no: i + 1,
            ...this.medicationsNotReceived[i]
          });
        }

        console.log(payload);
        let checkUrl = null;

        checkUrl = this.common.checkMockupUrl('', GlobalVariable.RESOURCE, {}, {
          BASE_API: GlobalVariable.BASE_API,
          BASE_MODULE: GlobalVariable.BASE_MODULE,
          BASE_RESOURCE: GlobalVariable.BASE_RESOURCE + GlobalVariable.BASE_RESOURCE_UPDATE_SECOND_CHECK
        });

        const response = await this.request.post(checkUrl.url, payload);
        if (response.resultCode === resultCodeSuccess) {
          this.goAlert('', '', 'myModalPrintDocument2', {
            printPageList: this.printPageList,
            orderId: this.Id,
            isShowPrintLabel: false,
            printAllurl: this.printAllurl
          });
          // this.goAlert('', '', 'myModalSuccess');
        } else {
          this.goAlert(response.resultCode, response.resultDescription, 'myModalError');
        }

      } else {
        console.log('กรุณากรอกข้อมูลให้ถูกต้อง');
        this.goAlert('Field is required', 'Your have left a field empty and a value must be entered.', 'myModalWarning');
        this.disbledBtn = {
          'save': false,
          'cancel': false
        };

      }
    } catch (e) {
      console.log(e);
    }
  }

  async fnUpdatePharmacyCheck() {
    try {
      console.log('fnUpdatePharmacyCheck',this.allCompoundAndPillChecked);
      console.log('fnUpdatePharmacyCheck',this.isAllPharmacyCheckChecked());
      if (!this.allCompoundAndPillChecked || !this.isAllPharmacyCheckChecked()) {
        this.goAlert('Field is required', 'Your have left a field empty and a value must be entered.', 'myModalWarning');
        return
      }
      const resultCodeSuccess = environment.resultCodeSuccess;
      const base64Images = await Promise.all(this.pharmacyPictureList.map(async (url) => {
        return await this.convertUrlToBase64(url);
      }));
      const payload: any = {
        orderId: this.order.orderId,
        isCompletePcCheckScan: this.order.isCompletePcCheckScan ? 1 : 0,
        isCompletePcCheckFormula: this.order.isCompletePcCheckFormula ? 1 : 0,
        isCompletePcCheckDeli: this.order.isCompletePcCheckDeli ? 1 : 0,
        orderPharmacyNoteRemark: this.order.orderPharmacyNoteRemark,
        // packageNote:this.order.packageNote,
        // cashierSupNote:this.order.cashierSupNote,
        deliveryDetail: [],
        // pharmacyPicture: base64Images.join('|'),
      };

      if (this.order.isCompletePcCheckDeli && !this.isCompletePcCheckDeli) {
        const splitDeliveryListStr = localStorage.getItem('splitDeliveryList');

        if (splitDeliveryListStr) {
          let splitDeliveryList = JSON.parse(splitDeliveryListStr);
          if (+this.order.orderStatus === 25 && this.deliveryList.length > 0) {
            splitDeliveryList = this.deliveryList;
          }
          if (splitDeliveryList.length > 0) {
            for (let i = 0; i < splitDeliveryList.length; i++) {
              const data = splitDeliveryList[i];
              let deliDetail = {
                supplyDay: +data.supplyDay,
                recipientName: data.recipientName,
                phone: data.phone,
                patientAddressId: +data.patientAddressId,
                address: data.address,
                district: data.district,
                subdistrict: data.subdistrict,
                province: data.province,
                postcode: data.postcode,
                deliveryDate: moment(data.deliveryStartDate).format('DD-MM-YYYY'),
                remindDate: data.deliveryRemindDate ? moment(data.deliveryRemindDate).format('DD-MM-YYYY') : null,
                arrivalTime: +data.arrivalTime,
                deliveryMethod: +data.deliveryMethod,
                deliveryMethodOther: data.deliveryMethodOther || '',
                packaging: +data.packaging,
                isInvoice: data.isInvoice ? 1 : 0,
                isReceipt: data.isReceipt ? 1 : 0,
                isUrgent: data.isUrgent ? 1 : 0,
                cashierDeliNote: data.cashierDeliNote,
                cashierId: data.cashierId,
                // pharmacyPicture: base64Images.join('|'),
              } as any;
              if (!this.isCompletePcCheckDeli && this.order.isCompletePcCheckDeli) {
                deliDetail.pharmacyPicture = base64Images.join('|');
              }
              payload.deliveryDetail.push(deliDetail);
            }
          } else {
            this.goAlert('Field is required', 'Your have left a field empty and a value must be entered.', 'myModalWarning');
            return;
          }
        } else {
          if (+this.order.orderStatus === 25) {
            console.log('====================if2')
            if (this.deliveryList.length > 0) {
              for (let i = 0; i < this.deliveryList.length; i++) {
                const data = this.deliveryList[i];
                let deliDetail = {
                  supplyDay: +data.supplyDay,
                  recipientName: data.recipientName,
                  phone: data.phone,
                  patientAddressId: +data.patientAddressId,
                  address: data.address,
                  district: data.district,
                  subdistrict: data.subdistrict,
                  province: data.province,
                  postcode: data.postcode,
                  deliveryDate: moment(data.deliveryStartDate).format('DD-MM-YYYY'),
                  remindDate: data.deliveryRemindDate ? moment(data.deliveryRemindDate).format('DD-MM-YYYY') : null,
                  arrivalTime: +data.arrivalTime,
                  deliveryMethod: +data.deliveryMethod,
                  deliveryMethodOther: data.deliveryMethodOther || '',
                  packaging: +data.packaging,
                  isInvoice: data.isInvoice ? 1 : 0,
                  isReceipt: data.isReceipt ? 1 : 0,
                  isUrgent: data.isUrgent ? 1 : 0,
                  cashierDeliNote: data.cashierDeliNote,
                  cashierId: data.cashierId,
                } as any;

                if (!this.isCompletePcCheckDeli && this.order.isCompletePcCheckDeli) {
                  deliDetail.pharmacyPicture = this.pharmacyPictureList;
                }
                payload.deliveryDetail.push(deliDetail);
              }

            } else {
              this.goAlert('Field is required', 'Your have left a field empty and a value must be entered.', 'myModalWarning');
              return;
            }
          } else {
            this.goAlert('Field is required', 'Your have left a field empty and a value must be entered.', 'myModalWarning');
            return;
          }
        }
      } else {
        let deliDetail = {
          deliveryId: Number(localStorage.getItem('deliveryDetailId')),
          pharmacyPicture: base64Images.join('|')
        } as any

        payload.deliveryDetail.push(deliDetail);
      }

      console.log('updatePharmacyCheck payload', payload);

      let checkUrl = null;

      checkUrl = this.common.checkMockupUrl('', GlobalVariable.RESOURCE, {}, {
        BASE_API: GlobalVariable.BASE_API,
        BASE_MODULE: GlobalVariable.BASE_MODULE,
        BASE_RESOURCE: GlobalVariable.BASE_RESOURCE + GlobalVariable.BASE_RESOURCE_UPDATE_PHARMACY_CHECK
      });

      const response = await this.request.post(checkUrl.url, payload);
      if (response.resultCode === resultCodeSuccess) {
        this.fnClearSplitDeliveryList();
        this.goAlert('', '', 'myModalSuccess');
      } else {
        this.goAlert(response.resultCode, response.resultDescription, 'myModalError');
      }
    } catch (e) {
      console.log(e);
    }
  }

  async fnUpdateCompleteOrder() {
    try {
      // const requiredData: boolean = this.checkRequiredData();

      const resultCodeSuccess = environment.resultCodeSuccess;
      let payload: any = {
        orderId: this.order.orderId,
      };
      if (this.pharmacyPictureList.length > 0) {
        const base64Images = await Promise.all(this.pharmacyPictureList.map(async (url) => {
          return await this.convertUrlToBase64(url);
        }));
        payload = {
          ...payload,
          deliveryId: Number(localStorage.getItem('deliveryDetailId')),
          pharmacyPicture: base64Images.join('|')
        }
      } else {
        payload = {
          ...payload,
          deliveryId: Number(localStorage.getItem('deliveryDetailId')),
          pharmacyPicture: ''
        }
      }

      console.log(payload);
      let checkUrl = null;

      checkUrl = this.common.checkMockupUrl('', GlobalVariable.RESOURCE, {}, {
        BASE_API: GlobalVariable.BASE_API,
        BASE_MODULE: GlobalVariable.BASE_MODULE,
        BASE_RESOURCE: GlobalVariable.BASE_RESOURCE + GlobalVariable.BASE_RESOURCE_UPDATE_COMPLETE_ORDER
      });

      const response = await this.request.post(checkUrl.url, payload);
      if (response.resultCode === resultCodeSuccess) {
        this.goAlert('', '', 'myModalSuccess');
      } else {
        this.goAlert(response.resultCode, response.resultDescription, 'myModalError');
      }

      // } else {
      //   console.log('กรุณากรอกข้อมูลให้ถูกต้อง');
      //   this.goAlert('Field is required', 'Your have left a field empty and a value must be entered.', 'myModalWarning');
      //   // $(this.modalRequired.nativeElement).modal('show');
      //   this.disbledBtn = {
      //     'save': false,
      //     'cancel': false
      //   };

      // }
    } catch (e) {
      console.log(e);
    }
  }

  fnCompleteDelivery(item) {
    const currentDateStr = moment().format('YYYYMMDD');
    const deliveryDateStr = moment(item.deliveryDate).format('YYYYMMDD');
    if (currentDateStr === deliveryDateStr) {
      this.completeId = item.deliveryDetailId;
      this.goAlert('', '', 'myModalCompleteDelivery');
    } else {
      // tslint:disable-next-line:max-line-length
      this.goAlert('Delivery date is not current date', 'Before completing delivery, please double-check or update the delivery date.', 'myModalWarning');
    }
  }

  fnEditDelivery(i) {
    this.isEditDelivery = true;
    this.deliveryList[i].edited = 2;
    this.formSplitDelivery.controls[i].enable();
    this.formSplitDelivery.controls[i].get('txtDeliverySupplyDay').disable();
    this.formSplitDelivery.controls[i].get('txtAddressDetail').disable();
    this.formSplitDelivery.controls[i].get('txtDistrictProvince').disable();
    this.formSplitDelivery.controls[i].get('txtPostcode').disable();
  }

  async completeDelivery() {
    try {
      // const requiredData: boolean = this.checkRequiredData();
      const resultCodeSuccess = environment.resultCodeSuccess;
      const payload: any = {
        deliveryDetailId: this.completeId,
      };
      this.completeId = null;

      console.log(payload);
      let checkUrl = null;

      checkUrl = this.common.checkMockupUrl('', GlobalVariable.RESOURCE, {}, {
        BASE_API: GlobalVariable.BASE_API,
        BASE_MODULE: GlobalVariable.BASE_MODULE,
        BASE_RESOURCE: GlobalVariable.BASE_RESOURCE + GlobalVariable.BASE_RESOURCE_UPDATE_COMPLETE_DELIVERY
      });

      const response = await this.request.post(checkUrl.url, payload);
      if (response.resultCode === resultCodeSuccess) {
        // this.goAlert('', '', 'myModalPrintDocument', {
        //   printPageList: [
        //     {
        //       name: 'Nutraceuticals Quotation',
        //       link: '#'
        //     },
        //   ],
        //   isShowPrintLabel: false
        // });
        // this.goAlert('', '', 'myModalSuccess');

        this.router.navigateByUrl('/microservice-menus').then(
          () => this.router.navigate(['/order-management', 'orders-production-pharmacist-view', this.Id, 'edit'], {
            queryParams: {
              tab: this.tabIndex,
            }
          })
        );
      } else {
        this.goAlert(response.resultCode, response.resultDescription, 'myModalError');
      }

      // } else {
      //   console.log('กรุณากรอกข้อมูลให้ถูกต้อง');
      //   this.goAlert('Field is required', 'Your have left a field empty and a value must be entered.', 'myModalWarning');
      //   // $(this.modalRequired.nativeElement).modal('show');
      //   this.disbledBtn = {
      //     'save': false,
      //     'cancel': false
      //   };

      // }
    } catch (e) {
      console.log(e);
    }
  }

  fnCheckSplitDeliveryForm(index: number) {
    const item: any = this.formSplitDelivery.controls[index];

    // ตรวจสอบ txtDeliveryMethodOther ถ้า deliveryMethod = 6
    if (+this.deliveryList[index].deliveryMethod === 6) {
      item.controls['txtDeliveryMethodOther'].setValidators([Validators.required]);
    } else {
      item.controls['txtDeliveryMethodOther'].clearValidators();
    }
    item.controls['txtDeliveryMethodOther'].updateValueAndValidity();

    // ตรวจสอบฟอร์ม
    Object.keys(item.controls).forEach((controlName: string) => {
      const control: AbstractControl = item.controls[controlName];

      if (controlName === 'ddlAddress') {
        let hasRequired = false;
        if (control.validator) {
          const validatorResult = control.validator({} as AbstractControl);
          hasRequired = validatorResult && validatorResult['required'] !== undefined;
        }

        if (!hasRequired) {
          control.setErrors(null);
          control.markAsPristine();
          return;
        }

        const noValue = control.value === null || control.value === '' || control.value === undefined || control.value === 'null';
        if (control.invalid || noValue) {
          control.setErrors({ forceRequired: true });
          control.markAsDirty();
        } else {
          control.updateValueAndValidity();
        }

        return;
      }

      if (control.invalid || control.value === 'null') {
        control.setErrors({ forceRequired: true });
        control.markAsDirty();
      } else {
        control.updateValueAndValidity();
      }
    });

    return item.valid;
  }


  async updateSplit(i) {
    try {
      const validSplitDeliveryForm: boolean = this.fnCheckSplitDeliveryForm(i);

      if (validSplitDeliveryForm) {
        const resultCodeSuccess = environment.resultCodeSuccess;
        const deliveryDate = moment(this.deliveryList[i].deliveryDate).format('YYYY-MM-DD');
        const payload: any = {
          deliveryDetailId: this.deliveryList[i].deliveryDetailId,
          supplyDay: this.deliveryList[i].supplyDay,
          recipientName: this.deliveryList[i].recipientName,
          phone: this.deliveryList[i].phone,
          patientAddressId: this.deliveryList[i].patientAddressId == "null" ? null : this.deliveryList[i].patientAddressId,
          address: this.deliveryList[i].address,
          district: this.deliveryList[i].district,
          subdistrict: this.deliveryList[i].subdistrict,
          province: this.deliveryList[i].province,
          postcode: this.deliveryList[i].postcode,
          deliveryDate: deliveryDate,
          remindDate: this.deliveryList[i].remindDate,
          arrivalTime: this.deliveryList[i].arrivalTime,
          deliveryMethod: this.deliveryList[i].deliveryMethod,
          deliveryMethodOther: this.deliveryList[i].deliveryMethodOther,
          packaging: this.deliveryList[i].packaging,
          isInvoice: this.deliveryList[i].isInvoice,
          isReceipt: this.deliveryList[i].isReceipt,
          isUrgent: this.deliveryList[i].isUrgent,
          cashierDeliNote: this.deliveryList[i].cashierDeliNote,
          cashierId: this.deliveryList[i].cashierId,
        };
        this.completeId = null;

        console.log(payload);
        let checkUrl = null;

        checkUrl = this.common.checkMockupUrl('', GlobalVariable.RESOURCE, {}, {
          BASE_API: GlobalVariable.BASE_API,
          BASE_MODULE: GlobalVariable.BASE_MODULE,
          BASE_RESOURCE: GlobalVariable.BASE_RESOURCE + GlobalVariable.BASE_RESOURCE_UPDATE_SPLIT_DELIVERY
        });

        const response = await this.request.post(checkUrl.url, payload);
        if (response.resultCode === resultCodeSuccess) {
          this.isEditDelivery = false;
          this.deliveryList[i].edited = 1;
          this.cloneSplit[i] = _.cloneDeep(this.deliveryList[i]);
          this.formSplitDelivery.controls[i].disable();
        } else {
          this.goAlert(response.resultCode, response.resultDescription, 'myModalError');
        }
      } else {
        this.goAlert('Field is required', 'Your have left a field empty and a value must be entered.', 'myModalWarning');
      }
    } catch (e) {
      console.log(e);
    }
  }

  cancelSplit(i) {
    this.isEditDelivery = false;
    this.deliveryList[i] = _.cloneDeep(this.cloneSplit[i]);
    this.deliveryList[i].edited = 1;
    this.formSplitDelivery.controls[i].disable();
  }

  onClickMorning(radioName) {
    if (radioName === this.dispensedPillMorning) {
      this.dispensedPillMorning = null;
    }
    this.fnClearPills('m');
    this.fnSetLangInstruction();
    this.fnCalTotal();
  }

  onClickLunch(radioName) {
    if (radioName === this.dispensedPillLunch) {
      this.dispensedPillLunch = null;
    }
    this.fnClearPills('l');
    this.fnSetLangInstruction();
    this.fnCalTotal();
  }

  onClickEvening(radioName) {
    if (radioName === this.dispensedPillEvening) {
      this.dispensedPillEvening = null;
    }
    this.fnClearPills('e');
    this.fnSetLangInstruction();
    this.fnCalTotal();
  }

  onClickBedtime(radioName) {
    if (radioName === this.dispensedPillBedtime) {
      this.dispensedPillBedtime = null;
    }
    this.fnClearPills('b');
    this.fnSetLangInstruction();
    this.fnCalTotal();
  }

  onCalInstruction() {
    console.log('this.order.packaging', this.order.packaging);
    console.log('this.order.bottleMeals', this.order.bottleMeals);
    console.log('this.order.bottleMeals', this.order.bottleMeals);
    if (+this.order.packaging === 1 && this.order.bottleMeals && this.order.bottleMeals !== 'null') {
      return;
    }

    this.fnSetLangInstruction();
    this.fnCalTotal();
    // this.calDosePerDay();
  }

  fnSetLangInstruction() {
    let key = '';
    if (+this.order.packaging === 1 && this.order.bottleMeals && this.order.bottleMeals !== 'null') {
      key = this.mealMapInstruction[this.order.bottleMeals];
    } else {
      console.log('this.dispensedPillMorning', this.dispensedPillMorning);
      if (this.dispensedPillMorning) {
        key = key ? key += '_M' : 'M';
        if (this.dispensedPillMorning === this.dispensedPillRadioLabel[0]) {
          key += 'PC';
        } else if (this.dispensedPillMorning === this.dispensedPillRadioLabel[1]) {
          key += 'AC';
        }
      }
      console.log('this.dispensedPillLunch', this.dispensedPillLunch);
      if (this.dispensedPillLunch) {
        key = key ? key += '_L' : 'L';
        if (this.dispensedPillLunch === this.dispensedPillRadioLabel[0]) {
          key += 'PC';
        } else if (this.dispensedPillLunch === this.dispensedPillRadioLabel[1]) {
          key += 'AC';
        }
      }
      console.log('this.dispensedPillEvening', this.dispensedPillEvening);
      if (this.dispensedPillEvening) {
        key = key ? key += '_E' : 'E';
        if (this.dispensedPillEvening === this.dispensedPillRadioLabel[0]) {
          key += 'PC';
        } else if (this.dispensedPillEvening === this.dispensedPillRadioLabel[1]) {
          key += 'AC';
        }
      }
      console.log('this.dispensedPillBedtime', this.dispensedPillBedtime);
      if (this.dispensedPillBedtime) {
        key = key ? key += '_B' : 'B';
      }
    }
    console.log('key', key);
    if (key) {
      const instructionStr = this.lang[key].replace('$number', this.order.bottleNumberOfCap);
      this.order.instruction = instructionStr;
    } else {
      this.order.instruction = '';
    }
  }

  fnChangePacking() {
    if (+this.order.packaging !== 1) {
      this.order.bottleNumberOfCap = null
      this.order.bottleMeals = null
    }
    this.onCalInstruction();
    this.orderForm.controls['txtNumberOfCapsules'].reset();
    this.orderForm.controls['ddlInstructionMeals'].reset();
    this.fnSetRequireBottle();

  }
  fnChangeLocation() {
    // if (+this.order.packaging !== 1) {
    //   this.order.bottleNumberOfCap = null
    //   this.order.bottleMeals = null
    // }
    // this.onCalInstruction();
    // this.orderForm.controls['txtNumberOfCapsules'].reset();
    // this.orderForm.controls['ddlInstructionMeals'].reset();
    // this.fnSetRequireBottle();

  }
  fnChangeMeals() {
    let key = '';
    if (+this.order.packaging === 1 && this.order.bottleMeals && this.order.bottleMeals !== 'null') {
      key = this.mealMapInstruction[this.order.bottleMeals];
      if (key) {
        const instructionStr = this.lang[key].replace('$number', this.order.bottleNumberOfCap);
        this.order.instruction = instructionStr;
      }
    } else {
      this.onCalInstruction();
    }
    this.fnSetRequireBottle();
  }

  async fnPrintDocument(type) {
    try {
      let url = ''
      let filterData: any = {}
      console.log(type)
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

  fnDownloadAll() {
    if (this.printAllurl) {
      window.open(this.printAllurl);
    }
  }

  clickAddSeparateMedicines() {
    this.formSeparateMedicines.push(this.fb.group({
      txtSeperateMedicines: new FormControl('', [Validators.required]),
    }));
    this.seperateMedicines.push({
      finishedProductId: null,
      code: '',
      name: '',
      isVitalLife: 1,
    });
  }

  clickAddMedicationsNotReceived() {
    this.formMedicationsNotReceived.push(this.fb.group({
      txtMedicationsNotReceived: new FormControl('', [Validators.required]),
    }));
    this.medicationsNotReceived.push({
      finishedProductId: null,
      code: '',
      name: '',
      isVitalLife: 1,
    });
  }

  clickDeleteSeparateMedicines(index) {
    this.order.seperateMedicines.splice(index, 1);
    this.isDuplicateFinishedProduct = _.countBy(this.order.seperateMedicines, 'name');
    this.formSeparateMedicines.removeAt(index);
  }

  fnCheckDupSeparateMedicines() {
    this.isDuplicateFinishedProduct = _.countBy(this.order.seperateMedicines, 'name');
  }


  clickDeleteMedicationsNotReceived(index) {
    this.order.medicationsNotReceived.splice(index, 1);
    this.isDuplicateMedicationsNotReceived = _.countBy(this.order.medicationsNotReceived, 'name');
    this.formMedicationsNotReceived.removeAt(index);
  }

  fnCheckDupMedicationsNotReceived() {
    this.isDuplicateMedicationsNotReceived = _.countBy(this.order.medicationsNotReceived, 'name');
  }


  fnCalTotal() {
    this.total.mac = 0;
    this.total.mpc = 0;
    this.total.lac = 0;
    this.total.lpc = 0;
    this.total.eac = 0;
    this.total.epc = 0;
    this.total.bpc = 0;
    // Cal Compounded Pills
    if (this.order.orderDispensedPill.length > 0) {
      const dataCompoundPill = this.order.orderDispensedPill[0];
      if (dataCompoundPill.no === 0 && this.order.isSeparateMeal === 1) {
        let totalPill = 0;
        // Total Pill Morning
        if (dataCompoundPill.mac && !isNaN(+dataCompoundPill.mac)) {
          totalPill += dataCompoundPill.mac * +this.order.sepMorningSupplyDay;
        } else if (dataCompoundPill.mpc && !isNaN(+dataCompoundPill.mpc)) {
          totalPill += dataCompoundPill.mpc * +this.order.sepMorningSupplyDay;
        }
        // Total Pill Lunch
        if (dataCompoundPill.lac && !isNaN(+dataCompoundPill.lac)) {
          totalPill += dataCompoundPill.lac * +this.order.sepLunchSupplyDay;
        } else if (dataCompoundPill.lpc && !isNaN(+dataCompoundPill.lpc)) {
          totalPill += dataCompoundPill.lpc * +this.order.sepLunchSupplyDay;
        }
        // Total Pill Evening
        if (dataCompoundPill.eac && !isNaN(+dataCompoundPill.eac)) {
          totalPill += dataCompoundPill.eac * +this.order.sepEveningSupplyDay;
        } else if (dataCompoundPill.epc && !isNaN(+dataCompoundPill.epc)) {
          totalPill += dataCompoundPill.epc * +this.order.sepEveningSupplyDay;
        }
        // Total Pill Bedtime
        if (dataCompoundPill.bpc && !isNaN(+dataCompoundPill.bpc)) {
          totalPill += dataCompoundPill.bpc * +this.order.sepBedtimeSupplyDay;
        }

        if (totalPill === 0) {
          dataCompoundPill.totalPill = _.cloneDeep(this.totalPillCompoundedPillsBackup);
        } else {
          dataCompoundPill.totalPill = totalPill;
        }
      }
    }
    // Cal Total
    for (let i = 0; i < this.order.orderDispensedPill.length; i++) {
      const data = this.order.orderDispensedPill[i];
      data.isErrorTimeToTakePills = false;
      let sumOnRow = 0;
      // Total Morning
      if (data.mac && !isNaN(+data.mac)) {
        this.total.mac += +data.mac;
        sumOnRow += +data.mac;
      }
      if (data.mpc && !isNaN(+data.mpc)) {
        this.total.mpc += +data.mpc;
        sumOnRow += +data.mpc;
      }
      // Total Lunch
      if (data.lac && !isNaN(+data.lac)) {
        this.total.lac += +data.lac;
        sumOnRow += +data.lac;
      }
      if (data.lpc && !isNaN(+data.lpc)) {
        this.total.lpc += +data.lpc;
        sumOnRow += +data.lpc;
      }
      // Total Evening
      if (data.eac && !isNaN(+data.eac)) {
        this.total.eac += +data.eac;
        sumOnRow += +data.eac;
      }
      if (data.epc && !isNaN(+data.epc)) {
        this.total.epc += +data.epc;
        sumOnRow += +data.epc;
      }
      // Total Bedtime
      if (data.bpc && !isNaN(+data.bpc)) {
        this.total.bpc += +data.bpc;
        sumOnRow += +data.bpc;
      }
      if (sumOnRow !== +data.physician) {
        data.isErrorTimeToTakePills = true;
      }
    }
  }

  fnClearPills(key) {
    this.total[key + 'ac'] = 0;
    if (key !== 'b') {
      this.total[key + 'pc'] = 0;
    } else {
      this.total['bpc'] = 0;
    }
    for (let i = 0; i < this.order.orderDispensedPill.length; i++) {
      this.order.orderDispensedPill[i][key + 'ac'] = '';
      if (key !== 'b') {
        this.order.orderDispensedPill[i][key + 'pc'] = '';
      } else {
        this.order.orderDispensedPill[i]['bpc'] = '';
      }
    }
  }

  fnCalTotalPillCompoundPill(data) {
    console.log('data', data);
  }

  // ถ้ามี WF2 ใน compound Capsule WF2 = Require
  async fnSetRequireCapsule(isClearCompoundedPills: boolean, wf?) {
    console.log('isClearCompoundedPills', isClearCompoundedPills);
    setTimeout(async () => {
      const findWF2 = this.order.orderCompound.find(obj => +obj.wf === 2 && obj.rawMaterialName !== 'Vivapur');
      console.log('findWF2', findWF2);
      if (findWF2) {
        this.capsuleWF2Require = true;
        this.orderForm.controls['ddlCapsuleWF2'].setValidators(Validators.required);
      } else {
        this.capsuleWF2Require = false;
        this.orderForm.controls['ddlCapsuleWF2'].setValidators(null);
      }
      this.orderForm.controls['ddlCapsuleWF2'].updateValueAndValidity();
      if (isClearCompoundedPills) {
        // clear value dispensed pill only Compounded Pills
        if (this.order.orderDispensedPill[0] && this.order.orderDispensedPill[0].finishedProductName === 'Compounded Pills') {
          this.order.orderDispensedPill[0].mpc = '';
          this.order.orderDispensedPill[0].mac = '';
          this.order.orderDispensedPill[0].lpc = '';
          this.order.orderDispensedPill[0].lac = '';
          this.order.orderDispensedPill[0].epc = '';
          this.order.orderDispensedPill[0].eac = '';
          this.order.orderDispensedPill[0].bpc = '';
        }
      }
      this.fnCalTotal();
      if (wf === 1) {
        await this.calDosePerDayWF1();
      }
      if (wf === 2) {
        await this.calDosePerDayWF2();
      }
      if (!wf) {
        await this.calDosePerDayWF1();
        await this.calDosePerDayWF2();
      }

      // ถ้า Compounded Pills physician == 0 ให้ disabled แยกมื้อ
      if (this.order.orderDispensedPill[0] && this.order.orderDispensedPill[0].finishedProductName === 'Compounded Pills') {
        // tslint:disable-next-line:max-line-length
        if (this.order.orderDispensedPill[0].physician && +this.order.orderDispensedPill[0].physician > 0 && this.order.orderStatus !== 24 && this.order.orderStatus !== 25) {
          this.formDispensedPill.controls[0].get('txtMpc').enable();
          this.formDispensedPill.controls[0].get('txtMac').enable();
          this.formDispensedPill.controls[0].get('txtLpc').enable();
          this.formDispensedPill.controls[0].get('txtLac').enable();
          this.formDispensedPill.controls[0].get('txtEpc').enable();
          this.formDispensedPill.controls[0].get('txtEac').enable();
          this.formDispensedPill.controls[0].get('txtBac').enable();
          this.fnCalTotal();
        } else {
          this.formDispensedPill.controls[0].get('txtMpc').disable();
          this.formDispensedPill.controls[0].get('txtMac').disable();
          this.formDispensedPill.controls[0].get('txtLpc').disable();
          this.formDispensedPill.controls[0].get('txtLac').disable();
          this.formDispensedPill.controls[0].get('txtEpc').disable();
          this.formDispensedPill.controls[0].get('txtEac').disable();
          this.formDispensedPill.controls[0].get('txtBac').disable();
          this.order.orderDispensedPill[0].isErrorTimeToTakePills = false;
        }
      }
    }, 100);
  }

  // เป็น M เมื่อค่า packaging = 1
  fnSetRequireBottle() {
    if (+this.order.packaging === 1) {
      this.bottleRequire = true;
      this.orderForm.controls['txtNumberOfCapsules'].setValidators(Validators.required);
      this.orderForm.controls['ddlInstructionMeals'].setValidators(Validators.required);
    } else {
      this.bottleRequire = false;
      this.orderForm.controls['txtNumberOfCapsules'].setValidators(null);
      this.orderForm.controls['ddlInstructionMeals'].setValidators(null);
    }
    this.orderForm.controls['txtNumberOfCapsules'].updateValueAndValidity();
    this.orderForm.controls['ddlInstructionMeals'].updateValueAndValidity();
  }

  async calDosePerDayWF1() {
    console.log('START CAL WF1');
    console.log(this.capsulesList);
    const wf1 = this.capsulesList.find(x => x.code == this.capsule.wf1);
    console.log(wf1);
    let capPerDay = 0;
    let vivapur = 0;
    for (const i in this.order.orderCompound) {
      if (this.order.orderCompound[i].rawMaterialCode != this.configList.formula.vivapurCode) {
        const raw = this.rawMaterialList.find(x => x.code == this.order.orderCompound[i].rawMaterialCode);
        console.log(raw);
        let actualDose = 0;
        let capsuleCap = 0;
        // tslint:disable-next-line:max-line-length
        if (this.order.orderCompound[i].dosePerDay != null && this.order.orderCompound[i].dosePerDay != '' && this.order.orderCompound[i].dosePerDay != undefined) {
          const dosePerDay = this.order.orderCompound[i].dosePerDay ? +this.order.orderCompound[i].dosePerDay : 0;
          console.log('dosePerDay', dosePerDay);
          const strength = this.order.orderCompound[i].strength ? +this.order.orderCompound[i].strength : 0;
          console.log('strength', strength);
          /**
           *  #1 Actual Dose (mg/day) = Order Dose (UOM/day) / Strength (UOM per mg)
           *  Actual Dose (mg/day) = dosePerDay / strength
           */
          actualDose = dosePerDay / strength;
          if (!isFinite(actualDose)) {
            actualDose = 0;
          }
          console.log('actualDose', actualDose);

          /**
           * #6 Packing Stat : จำนวน mg ของ RM ที่ใช้เติมลงไปในแคปซูลจนเต็มปริมาตร/เต็มเม็ด
           * Packing StatRM (mg/cap) = VTL Cap Packing StatRM x [Vivapur Packing StatCapX  Vivapur Packing StatCapRef]
           * wf1 Packing StatRM (mg/cap) = raw.vtlCapPackingStat x (wf1PackingStat / wf1PackingStat)
           * wf2 Packing StatRM (mg/cap) = raw.vtlCapPackingStat x ([)wf2PackingStat / wf1PackingStat)
           * โดย CapX = Capsule ที่เลือกใช้ใน Batch นั้น
           * CapRef = Capsule ที่ใช้อ้างอิงในการหาค่า Packing Stat = Capsule No.0 “VTL” (code 929047)
           */

          /**
           * #7 Capsule Capacity : คำนวณหาว่าผงยาแต่ละตัว ในขนาด mg/day เมื่อใส่ลงไปใน CapX แล้วกินพื้นที่/ปริมาตรไปเท่าไหร่
           * Capsule Capacity (cap/day) = Actual Dose (mg/day) / Packing StatRM (mg/cap)
           * Capsule Capacity (cap/day) = actualDose / #6
           */
          const rawVtlCapPackingStat = raw ? +raw.vtlCapPackingStat : 0;
          const wf1PackingStat = wf1 ? +wf1.packingStat : 0;
          if (this.order.orderCompound[i].wf == 1) {
            capsuleCap = +actualDose / (rawVtlCapPackingStat * (wf1PackingStat / wf1PackingStat));
          }
          capPerDay += +capsuleCap;
        }
      }
    }
    /**
     * "percentLoss": 0.02,
     * "trayDecPlace": 4,
     * "capsuleNormal": "929047",
     * "vivapurCode": "938010",
     * "vivapurfractionE": 0,
     * "vivapurfractionLT": 0.9,
     * "vivapurfractionGTE": 0.05,
     * "vivapurfractionLTE": 0.9
     */
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
      console.log('this.capsulesList', this.capsulesList);
      console.log('this.configList.formula', this.configList.formula);
      let indexViva = this.order.orderCompound.findIndex(x => x.rawMaterialCode == this.configList.formula.vivapurCode && x.wf === 1);
      if (indexViva < 0) {
        const findVivapur = this.rawMaterialList.find(obj => obj.code === this.configList.formula.vivapurCode);
        if (findVivapur) {
          this.order.orderCompound.push({
            isNewOrderCompound: true,
            dosePerDay: 0,
            maximumDose: findVivapur.maximumDose,
            minimumDose: findVivapur.minimumDose,
            no: findVivapur.no,
            orderId: this.Id,
            orderItemPrice: 0,
            rawMaterialCode: findVivapur.code,
            rawMaterialName: findVivapur.rawMaterialName,
            recommendedDose: findVivapur.recommendedDose,
            retailPrice: findVivapur.retailPrice,
            rmWeight: 0,
            strength: findVivapur.strength,
            unit: findVivapur.unit,
            wf: 1,
          });
          indexViva = this.order.orderCompound.findIndex(x => x.rawMaterialCode == this.configList.formula.vivapurCode && x.wf === 1);
        }
      }
      // เหมือนจะไม่ได้ใช้
      // const capViva = this.capsulesList.find(x => x.code == this.configList.formula.capsuleNormal);
      // console.log('capViva', capViva);

      let viva = 0;
      const wf1PackingStat = wf1 ? +wf1.packingStat : 0;
      console.log('wf1PackingStat', wf1PackingStat);
      if (this.order.orderCompound[indexViva].wf == 1) {
        viva = (1 - (+capPerDay % 1)) * wf1PackingStat;
      }
      if (!isFinite(viva)) {
        viva = 0;
      }
      console.log('viva', viva);
      this.order.orderCompound[indexViva].dosePerDay = +viva.toFixed(2);
      const actualViva = +viva / +this.order.orderCompound[indexViva].strength;
      const addMoreViva = actualViva + (actualViva * this.configList.formula.percentLoss);
      if (+this.order.isSeparateMeal === 1) {
        this.order.orderCompound[indexViva].rmWeight = (+addMoreViva * +this.order.calculatedDay).toFixed(2);
      } else {
        this.order.orderCompound[indexViva].rmWeight = (+addMoreViva * +this.order.supplyDay).toFixed(2);
      }
      console.log(this.order.orderCompound[indexViva]);

      let vivaCapPerDay = 0;
      const raw = this.rawMaterialList.find(x => x.code == this.order.orderCompound[indexViva].rawMaterialCode);
      console.log('raw', raw);
      const rawVtlCapPackingStat = raw ? +raw.vtlCapPackingStat : 0;
      console.log('rawVtlCapPackingStat', rawVtlCapPackingStat);
      const strength = +this.order.orderCompound[indexViva].strength;
      console.log('strength', strength);
      if (this.order.orderCompound[indexViva].wf == 1) {
        vivaCapPerDay = (+viva / strength) / (rawVtlCapPackingStat * (wf1PackingStat / wf1PackingStat));
      }
      if (!isFinite(vivaCapPerDay)) {
        vivaCapPerDay = 0;
      }
      console.log('vivaCapPerDay', vivaCapPerDay);
      capPerDay += +vivaCapPerDay;
      if (!isFinite(capPerDay)) {
        capPerDay = 0;
      }
    } else {
      const indexViva = this.order.orderCompound.findIndex(x => x.rawMaterialCode == this.configList.formula.vivapurCode && x.wf === 1);
      if (indexViva >= 0) {
        this.order.orderCompound[indexViva].dosePerDay = 0;
        this.order.orderCompound[indexViva].rmWeight = 0;
      }
    }

    if (this.order.orderDispensedPill[0].finishedProductName == 'Compounded Pills') {
      console.log('capPerDay', capPerDay);
      
      
      if (+this.order.isSeparateMeal === 1) {
        const m = (+this.order.sepMorningSupplyDay > 0 ? +this.order.sepLastMorningCapPerDay || 0 : 0);
        const l = (+this.order.sepLunchSupplyDay > 0 ? +this.order.sepLastLunchCapPerDay || 0 : 0);
        const e = (+this.order.sepEveningSupplyDay > 0 ? +this.order.sepLastEveningCapPerDay || 0 : 0);
        const b = (+this.order.sepBedtimeSupplyDay > 0 ? +this.order.sepLastBedtimeCapPerDay || 0 : 0);
        this.order.orderDispensedPill[0].physician = (m + l + e + b);
      } else {
        this.order.orderDispensedPill[0].physician = Math.round(capPerDay);
      }
      
      if (!this.order.orderDispensedPill[0].oldPhysician) {
        this.order.orderDispensedPill[0].oldPhysician = this.order.orderDispensedPill[0].physician;
      }
      if (+this.order.isSeparateMeal === 1) {
        this.order.orderDispensedPill[0].totalPill = +(+this.order.orderDispensedPill[0].physician * +this.order.calculatedDay).toFixed(2);
      } else {
        this.order.orderDispensedPill[0].totalPill = +(+this.order.orderDispensedPill[0].physician * +this.order.supplyDay).toFixed(2);
      }
      this.totalPillCompoundedPillsBackup = _.cloneDeep(this.order.orderDispensedPill[0].totalPill);
    }

    console.log('totalcap', capPerDay);
    console.log('END CAL WF1');
  }

  async calDosePerDayWF2() {
    console.log('START CAL WF2');
    console.log(this.capsulesList);
    const wf1 = this.capsulesList.find(x => x.code == this.capsule.wf1);
    console.log(wf1);
    const wf2 = this.capsulesList.find(x => x.code == this.capsule.wf2);
    console.log(wf2);
    let capPerDay = 0;
    let vivapur = 0;
    let isNoWF2 = true;
    for (const i in this.order.orderCompound) {
      if (this.order.orderCompound[i].rawMaterialCode != this.configList.formula.vivapurCode) {
        if (this.order.orderCompound[i].wf === 2) {
          isNoWF2 = false;
        }
        const raw = this.rawMaterialList.find(x => x.code == this.order.orderCompound[i].rawMaterialCode);
        console.log(raw);
        let actualDose = 0;
        let capsuleCap = 0;
        // tslint:disable-next-line:max-line-length
        if (this.order.orderCompound[i].dosePerDay != null && this.order.orderCompound[i].dosePerDay != '' && this.order.orderCompound[i].dosePerDay != undefined) {
          const dosePerDay = this.order.orderCompound[i].dosePerDay ? +this.order.orderCompound[i].dosePerDay : 0;
          console.log('dosePerDay', dosePerDay);
          const strength = this.order.orderCompound[i].strength ? +this.order.orderCompound[i].strength : 0;
          console.log('strength', strength);
          /**
           *  #1 Actual Dose (mg/day) = Order Dose (UOM/day) / Strength (UOM per mg)
           *  Actual Dose (mg/day) = dosePerDay / strength
           */
          actualDose = dosePerDay / strength;
          if (!isFinite(actualDose)) {
            actualDose = 0;
          }
          console.log('actualDose', actualDose);

          /**
           * #6 Packing Stat : จำนวน mg ของ RM ที่ใช้เติมลงไปในแคปซูลจนเต็มปริมาตร/เต็มเม็ด
           * Packing StatRM (mg/cap) = VTL Cap Packing StatRM x [Vivapur Packing StatCapX  Vivapur Packing StatCapRef]
           * wf1 Packing StatRM (mg/cap) = raw.vtlCapPackingStat x (wf1PackingStat / wf1PackingStat)
           * wf2 Packing StatRM (mg/cap) = raw.vtlCapPackingStat x ([)wf2PackingStat / wf1PackingStat)
           * โดย CapX = Capsule ที่เลือกใช้ใน Batch นั้น
           * CapRef = Capsule ที่ใช้อ้างอิงในการหาค่า Packing Stat = Capsule No.0 “VTL” (code 929047)
           */

          /**
           * #7 Capsule Capacity : คำนวณหาว่าผงยาแต่ละตัว ในขนาด mg/day เมื่อใส่ลงไปใน CapX แล้วกินพื้นที่/ปริมาตรไปเท่าไหร่
           * Capsule Capacity (cap/day) = Actual Dose (mg/day) / Packing StatRM (mg/cap)
           * Capsule Capacity (cap/day) = actualDose / #6
           */
          const rawVtlCapPackingStat = raw ? +raw.vtlCapPackingStat : 0;
          const wf1PackingStat = wf1 ? +wf1.packingStat : 0;
          const wf2PackingStat = wf2 ? +wf2.packingStat : 0;
          if (this.order.orderCompound[i].wf == 2) {
            capsuleCap = +actualDose / (rawVtlCapPackingStat * (wf2PackingStat / wf1PackingStat));
          }
          capPerDay += +capsuleCap;
        }
      }
    }
    if (isNoWF2) {
      if (this.orderStatus === 18) {
        this.order.orderCompound = this.order.orderCompound.filter((obj) => {
          if (obj.wf === 2) {
            obj.dosePerDay = 0;
            obj.rmWeight = 0;
          }
          return obj;
        });
      } else {
        this.order.orderCompound = this.order.orderCompound.filter((obj) => {
          return obj.wf === 1;
        });
      }
      this.capPerDayWF2 = 0;
      this.capsuleWF2Require = false;
      this.orderForm.controls['ddlCapsuleWF2'].setValidators(null);
      return;
    }
    /**
     * "percentLoss": 0.02,
     * "trayDecPlace": 4,
     * "capsuleNormal": "929047",
     * "vivapurCode": "938010",
     * "vivapurfractionE": 0,
     * "vivapurfractionLT": 0.9,
     * "vivapurfractionGTE": 0.05,
     * "vivapurfractionLTE": 0.9
     */
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
      console.log('this.capsulesList', this.capsulesList);
      console.log('this.configList.formula', this.configList.formula);
      let indexViva = this.order.orderCompound.findIndex(x => x.rawMaterialCode == this.configList.formula.vivapurCode && x.wf === 2);
      if (indexViva < 0) {
        const findVivapur = this.rawMaterialList.find(obj => obj.code === this.configList.formula.vivapurCode);
        if (findVivapur) {
          this.order.orderCompound.push({
            isNewOrderCompound: true,
            dosePerDay: 0,
            maximumDose: findVivapur.maximumDose,
            minimumDose: findVivapur.minimumDose,
            no: findVivapur.no,
            orderId: this.Id,
            orderItemPrice: 0,
            rawMaterialCode: findVivapur.code,
            rawMaterialName: findVivapur.rawMaterialName,
            recommendedDose: findVivapur.recommendedDose,
            retailPrice: findVivapur.retailPrice,
            rmWeight: 0,
            strength: findVivapur.strength,
            unit: findVivapur.unit,
            wf: 2,
          });
          indexViva = this.order.orderCompound.findIndex(x => x.rawMaterialCode == this.configList.formula.vivapurCode && x.wf === 2);
        }
      }
      // เหมือนจะไม่ได้ใช้
      // const capViva = this.capsulesList.find(x => x.code == this.configList.formula.capsuleNormal);
      // console.log('capViva', capViva);

      let viva = 0;
      const wf1PackingStat = wf1 ? +wf1.packingStat : 0;
      console.log('wf1PackingStat', wf1PackingStat);
      const wf2PackingStat = wf2 ? +wf2.packingStat : 0;
      console.log('wf2PackingStat', wf2PackingStat);
      if (this.order.orderCompound[indexViva].wf == 1) {
        viva = (1 - (+capPerDay % 1)) * wf1PackingStat;
      } else if (this.order.orderCompound[indexViva].wf == 2) {
        viva = (1 - (+capPerDay % 1)) * wf2PackingStat;
      }
      if (!isFinite(viva)) {
        viva = 0;
      }
      console.log('viva', viva);
      this.order.orderCompound[indexViva].dosePerDay = +viva.toFixed(2);
      const actualViva = +viva / +this.order.orderCompound[indexViva].strength;
      const addMoreViva = actualViva + (actualViva * this.configList.formula.percentLoss);
      if (+this.order.isSeparateMeal === 1) {
        this.order.orderCompound[indexViva].rmWeight = (+addMoreViva * +this.order.calculatedDay).toFixed(2);
      } else {
        this.order.orderCompound[indexViva].rmWeight = (+addMoreViva * +this.order.supplyDay).toFixed(2);
      }
      console.log(this.order.orderCompound[indexViva]);

      let vivaCapPerDay = 0;
      const raw = this.rawMaterialList.find(x => x.code == this.order.orderCompound[indexViva].rawMaterialCode);
      console.log('raw', raw);
      const rawVtlCapPackingStat = raw ? +raw.vtlCapPackingStat : 0;
      console.log('rawVtlCapPackingStat', rawVtlCapPackingStat);
      const strength = +this.order.orderCompound[indexViva].strength;
      console.log('strength', strength);
      if (this.order.orderCompound[indexViva].wf == 2) {
        vivaCapPerDay = (+viva / strength) / (rawVtlCapPackingStat * (wf2PackingStat / wf1PackingStat));
      }
      if (!isFinite(vivaCapPerDay)) {
        vivaCapPerDay = 0;
      }
      console.log('vivaCapPerDay', vivaCapPerDay);
      capPerDay += +vivaCapPerDay;
      if (!isFinite(capPerDay)) {
        capPerDay = 0;
      }
    } else {
      const indexViva = this.order.orderCompound.findIndex(x => x.rawMaterialCode == this.configList.formula.vivapurCode && x.wf === 2);
      if (indexViva >= 0) {
        this.order.orderCompound[indexViva].dosePerDay = 0;
        this.order.orderCompound[indexViva].rmWeight = 0;
      }
    }

    if (this.order.orderDispensedPill[0].finishedProductName == 'Compounded Pills') {
      console.log('capPerDay', capPerDay);
      
      
      if (+this.order.isSeparateMeal === 1) {
        const m = (+this.order.sepMorningSupplyDay > 0 ? +this.order.sepLastMorningCapPerDay || 0 : 0);
        const l = (+this.order.sepLunchSupplyDay > 0 ? +this.order.sepLastLunchCapPerDay || 0 : 0);
        const e = (+this.order.sepEveningSupplyDay > 0 ? +this.order.sepLastEveningCapPerDay || 0 : 0);
        const b = (+this.order.sepBedtimeSupplyDay > 0 ? +this.order.sepLastBedtimeCapPerDay || 0 : 0);
        this.order.orderDispensedPill[0].physician = (m + l + e + b);
      } else {
        // this.order.orderDispensedPill[0].physician = Math.round(capPerDay);
      }
   
    }

    console.log('totalcap', capPerDay);
    this.capPerDayWF2 = capPerDay;
    console.log('END CAL WF2');
  }

  // zone split delivery
  onValueChangedDeliveryStartDate(e, i) {
    if (this.deliveryList[i + 1]) {
      const currentData = this.deliveryList[i];
      const nextData = this.deliveryList[i + 1];
      nextData['deliveryStartDateRemark'] = moment(currentData.deliveryStartDate).add(nextData.supplyDay, 'd').format('DD/MM/YYYY');
    }
    this.formSplitDelivery.controls[i].get('ddlArrivalTime').reset();
    this.arrivalTimeMap[i] = this.common.checkArrivalTime(this.arrivalTimeListBackup, this.deliveryList[i].deliveryDate);
  }
  onDeliveryMethodChanged(value: string | number | null, index): void {
    const addressControl = this.formSplitDelivery.controls[index].get('ddlAddress');
    if (addressControl) {
      if (value == 2) {
        addressControl.clearValidators();
      } else {
        addressControl.setValidators([Validators.required]);
      }
      addressControl.updateValueAndValidity();
    }
  }

  checkRequired(name, index) {
    const control = this.formSplitDelivery.controls[index].get(name);
    let hasRequired = false;
    if (control && control.validator) {
      const result = control.validator({} as AbstractControl);
      return hasRequired = result && result.required !== undefined;
    } else {
      return false
    }
  }

  onClickDeliveryDetailAddress(i) {
    const findAddress = this.addressList.find(obj => obj.patientAddressId === +this.deliveryList[i].patientAddressId);
    console.log('findAddress', findAddress);
    if (findAddress) {
      this.deliveryList[i].address = findAddress.address;
      this.deliveryList[i].subdistrict = findAddress.subdistrict;
      this.deliveryList[i].district = findAddress.district;
      this.deliveryList[i].province = findAddress.province;
      this.deliveryList[i].districtProvince = this.common.concatAddress({
        subdistrict: findAddress.subdistrict,
        district: findAddress.district,
        province: findAddress.province,
      });
      this.deliveryList[i].postcode = findAddress.postcode;
    } else {
      this.deliveryList[i].address = ""
      this.deliveryList[i].subdistrict = ""
      this.deliveryList[i].district = ""
      this.deliveryList[i].province = ""
      this.deliveryList[i].districtProvince = ""
      this.deliveryList[i].postcode = ""
    }
  }

  async searchDdlPatientAddress() {
    try {
      const checkUrl = this.common.checkMockupUrl('', '', { hn: this.order.hn }, {
        BASE_API: '',
        BASE_MODULE: environment.apiPrefix,
        BASE_RESOURCE: environment.searchDdlPatientAddress
      });
      const resultCodeSuccess = environment.resultCodeSuccess;
      const response = await this.request.get(checkUrl.url, checkUrl.filter);
      if (response.resultCode === resultCodeSuccess) {
        const data = await response.resultData || response.data || {};
        this.addressList = data.patientAddress.filter(obj => {
          obj.concatAddress = this.common.concatAddress(obj);
          return obj;
        });
      } else {
        this.addressList = [];
      }
    } catch (e) {
      console.error('searchDdlCashier error', e);
      this.addressList = [];
    }
  }

  async onClickEditOrder() {
    try {
      this.disbledBtn = {
        "save": true,
        "cancel": true
      };

      const checkUrl = this.common.checkMockupUrl('', '', '', {
        BASE_API: '',
        BASE_MODULE: environment.apiPrefix,
        BASE_RESOURCE: environment.updateErrorOrderStatus
      });


      console.log(checkUrl)

      let locationText = this.errorText[this.errorText.length - 1].split('in ')[1]
      locationText = locationText.replaceAll('.', '')
      let data: any = {
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
      console.log(data)

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
        "save": true,
        "cancel": true
      };
    }
  }

  onCloseEditOrder() {
    this.onClickBack()
  }

  // end zone split delivery

  preferredLanguageItemClick(e) {
    this.preferredLanguage = e.itemData.value;
    if (this.preferredLanguage === 'English') {
      this.order.language = 2
    } else {
      this.order.language = 1
    }
    this.fnSetPreferredLanguage();
  }

  // set preferredLanguage
  fnSetPreferredLanguage() {
    console.log('this.preferredLanguage', this.preferredLanguage);
    if (this.preferredLanguage === 'English') {
      this.lang = this.instructionWarning['en'];
      this.order.warning = this.lang['WARNING'];
    } else {
      this.lang = this.instructionWarning['th'];
      this.order.warning = this.lang['WARNING'];
    }
    this.fnSetLangInstruction();
  }

  checkDispensedPill() {
    for (let i = 0; i < this.order.orderDispensedPill.length; i++) {
      const data = this.order.orderDispensedPill[i];
      // tslint:disable-next-line:max-line-length
      if (data.isErrorTimeToTakePills && (this.dispensedPillMorning || this.dispensedPillLunch || this.dispensedPillEvening || this.dispensedPillBedtime)) {
        return false;
      }
    }
    return true;
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

  isMainDelivery(data: any) {
    try {
      const deliveryDetailId = localStorage.getItem('deliveryDetailId');
      return data.deliveryDetailId == deliveryDetailId
    } catch (e) {
      console.log(e);
    }
  }


  triggerFileInput() {
    this.fileInput.nativeElement.click();
  }

  upload(event: any) {
    const files: FileList = event.target.files;
    if (!files || !files.length) return;

    const maxPictures = 5;
    const currentCount = this.pharmacyPictureList.length;
    const remainingSlots = maxPictures - currentCount;

    if (remainingSlots <= 0) {
      event.target.value = '';
      return;
    }

    const limitedFiles = Array.from(files).slice(0, remainingSlots);

    for (let i = 0; i < limitedFiles.length; i++) {
      const file = limitedFiles[i];
      const reader = new FileReader();

      reader.onload = (e: any) => {
        const base64 = e.target.result;
        this.pharmacyPictureList.push(base64);
      };

      reader.readAsDataURL(file);
    }

    event.target.value = '';
  }

  removePicture(index: number): void {
    this.pharmacyPictureList.splice(index, 1);
  }

  convertUrlToBase64(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';

      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const dataURL = canvas.toDataURL('image/png');
          resolve(dataURL);
        } else {
          reject('Canvas context not available');
        }
      };

      img.onerror = (err) => reject(err);
      img.src = url;
    });
  }

  popupImg(i) {
    this.filePicture = i
    this.popupVisible = true
  }

  calSupplyDay(value) {
    return value ? value : 0;
  }
}
