import {
  Component,
  OnInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  AfterViewInit,
  EventEmitter,
  Output,
  NgModule,
  ViewChildren,
  QueryList
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormGroup, FormBuilder, FormControl, Validators, ReactiveFormsModule, FormArray, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { DxDataGridComponent, DxDataGridModule, DxFileUploaderModule, DxCheckBoxModule } from 'devextreme-angular';
import { environment } from '../../environments/environment';
import { DxCheckBoxComponent } from 'devextreme-angular';
declare let $: any;
import { FormsModule } from '@angular/forms';
import CustomStore from 'devextreme/data/custom_store';
import { Request } from '../shared/services/request.service';
import { Common } from '../shared/services/common.service';
import { NgxPrintModule } from 'ngx-print';
import heic2any from 'heic2any';
import { DxLoadPanelModule } from 'devextreme-angular';
import { DxPopupModule } from 'devextreme-angular';
import { ResolveImageUrlModule } from '../shared/resolve-image-url.module';
class ImageSnippet {
  pending = false;
  status = 'init';

  constructor(public src: string, public file: File) {
  }
}

@Component({
  selector: 'app-alert',
  providers: [],
  templateUrl: './alert.component.html'
})
export class CreateAlertComponent implements OnInit, AfterViewInit {
  @ViewChildren(DxCheckBoxComponent) checkboxes!: QueryList<DxCheckBoxComponent>;
  @ViewChild('fileInput') fileInput: ElementRef;
  @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;
  @ViewChild('gridExport') gridExport: DxDataGridComponent;
  @ViewChild('gridAlertValidExcel') gridAlertValidExcel: DxDataGridComponent;
  @ViewChild('gridAlertErrorExcel') gridAlertErrorExcel: DxDataGridComponent;
  @ViewChild('gridAdvance') gridAdvance: DxDataGridComponent;
  @ViewChild('myModalSuccess') modalSuccess: ElementRef;
  @ViewChild('myModalSuccessUser') modalSuccessUser: ElementRef;

  @ViewChild('myModalSuccessWarning') modalSuccessWarning: ElementRef;

  @ViewChild('myModalDelete') modalDelete: ElementRef;
  @ViewChild('myModalChangeBooking') modalChangeBooking: ElementRef;
  @ViewChild('myModalConfirmManPower') modalConfirmManPower: ElementRef;
  @ViewChild('myModalDeleteWarning') modalDeleteWarning: ElementRef;
  @ViewChild('myModalSuccessDelete') modalSuccessDelete: ElementRef;
  @ViewChild('myModalEditSuccess') modalEditSuccess: ElementRef;
  @ViewChild('myModalWarning') modalWarning: ElementRef;
  @ViewChild('myModalInsertTrakCare') modalInsertTrakCare: ElementRef;
  @ViewChild('myModalCompleteDelivery') modalCompleteDelivery: ElementRef;


  @ViewChild('myModalError') modalError: ElementRef;
  @ViewChild('myModalErrorImport') modalErrorImport: ElementRef;
  @ViewChild('myModalViewWarning') modalViewWarning: ElementRef;
  @ViewChild('myModalProgressBarWarning') modalProgressBarWarning: ElementRef;
  @ViewChild('myModalUploadImageWarning') modalUploadImageWarning: ElementRef;
  @ViewChild('myModalUploadImageTypeWarning') modalUploadImageTypeWarning: ElementRef;

  @ViewChild('myModalWarningNoTextSearch') modalWarningNoTextSearch: ElementRef;
  @ViewChild('myModalErrorDataExisted') modalErrorDataExisted: ElementRef;
  @ViewChild('myModalErrorDeleteButHaveMenuGroup') modalErrorDeleteButHaveMenuGroup: ElementRef;
  @ViewChild('myModalConfirmReOrder') modalConfirmReOrder: ElementRef;
  @ViewChild('myModalConfirmUrgentRequest') modalConfirmUrgentRequest: ElementRef;
  @ViewChild('myModalUrgentRequest') modalUrgentRequest: ElementRef;
  @ViewChild('myModalPrintDocument') modalPrintDocument: ElementRef;
  @ViewChild('myModalPrintDocument2') modalPrintDocument2: ElementRef;
  @ViewChild('myModalConfirm') modalConfirm: ElementRef;
  @ViewChild('myModalConfirmProduction') modalConfirmProduction: ElementRef;
  @ViewChild('myModalConfirmProductionDone') modalConfirmProductionDone: ElementRef;
  @ViewChild('myModalOrderError') modalOrderError: ElementRef;
  @ViewChild('myModalOrderErrorEditOrAccept') modalOrderErrorEditOrAccept: ElementRef;
  @ViewChild('myModalOrderErrorStatus1') modalOrderErrorStatus1: ElementRef;
  @ViewChild('myModalOrderInactive') modalOrderInactive: ElementRef;
  @ViewChild('myModalSplitDeliveryAlert') modalSplitDeliveryAlert: ElementRef;

  userMessage;
  userMessageList;
  dataText: any;
  dxgridPageSize;
  failDescription;
  percent = 0;
  buttonText = '';
  data: any = {};
  urgentRequestReason = '';
  urgentRequestForm: FormGroup;
  orderInactiveForm: FormGroup;
  orderInactiveRemark = '';
  printPageList = [];
  isShowPrintLabel = false;
  printOrderId = null;
  iconURL = '../../assets/icon-md/calendar.png';
  selectedFile: any;
  filePicture: any;
  imageInputText: string;
  productionNote: any;
  hn: any;
  name: any;
  packageNote: any;
  imageList = [];
  productionDoneForm: FormGroup;
  submitted: boolean = false;
  printAllurl = null
  isLoadingPanel: boolean = false;
  /** เฉพาะ 40317 (disk เต็ม): แสดงเป็น myModalWarning แต่ตอนปิดต้อง emit onCloseModalError ด้วย */
  emitCloseModalErrorAfterWarningHide = false;
  popupVisible = false
  typeOptions = [
    { id: 1, text: 'Laminate Bag' },
    { id: 2, text: 'Box' },
    { id: 3, text: 'Bottle' }
  ];
  isUpdatingType = false;
  supTypeOptions = [
    { id: 1, text: 'เช้า' },
    { id: 2, text: 'กลางวัน' },
    { id: 3, text: 'เย็น' },
    { id: 4, text: 'ก่อนนอน' }
  ];
  constructor(private router: Router, private request: Request, private common: Common, private fb: FormBuilder) {

    this.dataText = {
      userTitle: '',
      userMessage: '',
      userMessageList: '',
      userMessageText: '',
      cs: ''
    };
    this.urgentRequestForm = this.fb.group({
      'txtUrgentRequestReason': new FormControl('', [Validators.required]),
    });
    this.orderInactiveForm = this.fb.group({
      'txtOrderInactiveRemark': new FormControl('', [Validators.required]),
    });

    this.productionDoneForm = this.fb.group({
      'txtProductionNote': new FormControl(''),
      'txtPackageNoteList': this.fb.array([
        this.createPackagingNoteForm()
      ]),
      'txtPackageNote': new FormControl(''),
      'txtHn': new FormControl({ value: '', disabled: true }),
      'txtName': new FormControl({ value: '', disabled: true }),
    });
  }
  get txtPackageNoteList(): FormArray {
    return this.productionDoneForm.get('txtPackageNoteList') as FormArray;
  }
  get packagingNoteListLength() {
    return (this.productionDoneForm.get('txtPackageNoteList') as FormArray).length;
  }

  // Add getter for controls access
  get txtPackageNoteListControls() {
    return (this.productionDoneForm.get('txtPackageNoteList') as FormArray).controls;
  }

  atLeastOneCheckboxCheckedValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const formArray = control as FormArray;

      if (!formArray || !Array.isArray(formArray.controls)) {
        return null;
      }

      const isAnyChecked = formArray.controls.some(c => c.value === true);
      return isAnyChecked ? null : { atLeastOneRequired: true };
    };
  }

  createPackagingNoteForm(): FormGroup {
    const supTypeControls = this.supTypeOptions.map(() => this.fb.control(false));
    const typeControls = this.typeOptions.map(() => this.fb.control(false));

    return this.fb.group({
      qty: ['', [Validators.required, Validators.min(1), Validators.pattern(/^[1-9]\d*$/)]],
      type: this.fb.array(typeControls, this.atLeastOneCheckboxCheckedValidator()),
      supplyDays: ['', [Validators.required, Validators.min(1), Validators.pattern(/^[1-9]\d*$/)]],
      supType: this.fb.array(supTypeControls, this.atLeastOneCheckboxCheckedValidator()),
      other: ['']
    });
  }

  addPackagingNote() {
    const formArray = this.productionDoneForm.get('txtPackageNoteList') as FormArray;
    formArray.push(this.createPackagingNoteForm());
  }

  removePackagingNote(index: number) {
    const formArray = this.productionDoneForm.get('txtPackageNoteList') as FormArray;
    if (formArray.length > 1) {
      formArray.removeAt(index);
    }
  }

  onTypeChange(noteIndex: number, typeIndex: number) {
    if (this.isUpdatingType) return;

    this.isUpdatingType = true;

    const packagingNoteArray = this.productionDoneForm.get('txtPackageNoteList') as FormArray;
    const noteGroup = packagingNoteArray.at(noteIndex) as FormGroup;
    const typeArray = noteGroup.get('type') as FormArray;

    typeArray.controls.forEach((control, i) => {
      if (i !== typeIndex) {
        control.setValue(false, { emitEvent: false });
      } else {
        control.setValue(true, { emitEvent: false }); // Ensure selected is true
      }
    });

    // Optional: delay reset to prevent recursive trigger
    setTimeout(() => {
      this.isUpdatingType = false;
    });
  }


  ngOnInit() {
    console.log("--------------------------------");
  }

  isNumber(str) {
    return !isNaN(str);
  }

  /**
   * BE 40317 = disk/ที่เก็บรูปไม่พอ (imageStorage) — ต้องแสดง myModalWarning ตาม environment
   * บาง path ส่ง resultCode เป็นตัวเลข / บาง error อาจบ่งใน resultDescription อย่างเดียว
   */
  private isImageStorageFullMyModalError(data: {
    modalId?: string;
    userTitle?: any;
    userMessage?: any;
  }): boolean {
    if (!data || data.modalId !== 'myModalError') {
      return false;
    }
    const expected = String(environment.resultCodeImageStorageFull);
    const raw = data.userTitle != null ? String(data.userTitle).trim() : '';
    if (raw === expected) {
      return true;
    }
    if (raw === '40317' || (raw !== '' && !isNaN(Number(raw)) && Math.floor(Number(raw)) === 40317)) {
      return true;
    }
    const msg = data.userMessage != null ? String(data.userMessage) : '';
    if (msg.indexOf('Server disk is full') >= 0 || msg.indexOf('image could not be saved') >= 0) {
      return true;
    }
    if (msg.indexOf('insufficient') >= 0 && msg.indexOf('disk') >= 0) {
      return true;
    }
    return false;
  }

  async ngAfterViewInit() {
    try {
      $(this.modalSuccess.nativeElement).on('hidden.bs.modal', async () => {
        // put your default event here

        this.onClickBack.emit();
      });

      $(this.modalEditSuccess.nativeElement).on('hidden.bs.modal', async () => {
        // put your default event here
        this.onClickBack.emit();
      });
      $(this.modalSuccessDelete.nativeElement).on('hidden.bs.modal', async () => {
        // put your default event here
        this.onClickBack.emit();
      });

      $(this.modalError.nativeElement).on('hidden.bs.modal', async () => {
        // put your default event here
        // await this.router.navigate([this.urlBack]);
        this.onCloseModalError.emit();
      });

      $(this.modalErrorImport.nativeElement).on('hidden.bs.modal', async () => {
        // put your default event here
        // await this.router.navigate([this.urlBack]);
        this.onCloseModalErrorImport.emit();
      });

      $(this.modalWarning.nativeElement).on('hidden.bs.modal', async () => {
        // put your default event here
        // await this.router.navigate([this.urlBack]);
        if (this.emitCloseModalErrorAfterWarningHide) {
          this.emitCloseModalErrorAfterWarningHide = false;
          this.isLoadingPanel = false;
          this.onCloseModalError.emit();
        }
        this.onCloseModalWarning.emit();
      });

      $(this.modalViewWarning.nativeElement).on('hidden.bs.modal', async () => {
        // put your default event here
        // await this.router.navigate([this.urlBack]);
        this.onCancelViewWarning.emit();
      });

      // ปรับ html <body> ให้กลับเป็นปกติเมื่อเปิด-ปิด modal
      // document.body.style.paddingRight = '0px';
    } catch (e) {
      console.log(e);
    }
  }

  openModal(data) {
    this.emitCloseModalErrorAfterWarningHide = false;
    /** ดิสก์เก็บรูปไม่พอ (BE resultCode 40317) — ใช้ modal Warning ตามดีไซน์ (หัวข้อ Warning + ข้อความจาก environment) */
    if (data && this.isImageStorageFullMyModalError(data)) {
      this.emitCloseModalErrorAfterWarningHide = true;
      data = {
        ...data,
        modalId: 'myModalWarning',
        userTitle: environment.resultDescriptionImageStorageFullTitleTh,
        userMessage: environment.resultDescriptionImageStorageFullMessageTh
      };
    }
    this.dataText = {
      userTitle: data.userTitle,
      userMessage: data.userMessage,
      userMessageList: Array.isArray(data.userMessageList) ? data.userMessageList : [],
      userMessageText: data.userMessageText
    };
    // }


    if (data.modalId === 'myModalDelete') {
      $(this.modalDelete.nativeElement).modal('show');
    } else if (data.modalId === 'myModalConfirmManPower') {
      if (data.data) {
        this.data = data.data;
        if (!this.data.manPowerFrom) {
          this.data.manPowerFrom = 0;
        }
      }
      $(this.modalConfirmManPower.nativeElement).modal('show');
    } else if (data.modalId === 'myModalDeleteWarning') {
      $(this.modalDeleteWarning.nativeElement).modal('show');
    } else if (data.modalId === 'myModalSuccessDelete') {
      $(this.modalSuccessDelete.nativeElement).modal('show');
    } else if (data.modalId === 'myModalSuccess') {
      $(this.modalSuccess.nativeElement).modal('show');
    } else if (data.modalId === 'myModalSuccessUser') {
      $(this.modalSuccessUser.nativeElement).modal('show');
    } else if (data.modalId === 'myModalSuccessWarning') {
      $(this.modalSuccessWarning.nativeElement).modal('show');
    } else if (data.modalId === 'myModalEditSuccess') {
      $(this.modalEditSuccess.nativeElement).modal('show');
    } else if (data.modalId === 'myModalWarning') {
      $(this.modalWarning.nativeElement).modal('show');
    } else if (data.modalId === 'myModalViewWarning') {
      $(this.modalViewWarning.nativeElement).modal('show');
    } else if (data.modalId === 'myModalUploadImageWarning') {
      $(this.modalUploadImageWarning.nativeElement).modal('show');
    } else if (data.modalId === 'myModalUploadImageTypeWarning') {
      $(this.modalUploadImageTypeWarning.nativeElement).modal('show');
    } else if (data.modalId === 'myModalWarningNoTextSearch') {
      $(this.modalWarningNoTextSearch.nativeElement).modal('show');
    } else if (data.modalId === 'myModalErrorDataExisted') {
      $(this.modalErrorDataExisted.nativeElement).modal('show');
    } else if (data.modalId === 'myModalErrorDeleteButHaveMenuGroup') {
      $(this.modalErrorDeleteButHaveMenuGroup.nativeElement).modal('show');
    } else if (data.modalId === 'modalError') {
      $(this.modalError.nativeElement).modal('show');
    } else if (data.modalId === 'modalErrorImport') {
      $(this.modalErrorImport.nativeElement).modal('show');
    } else if (data.modalId === 'myModalConfirmReOrder') {
      $(this.modalConfirmReOrder.nativeElement).modal('show');
    } else if (data.modalId === 'myModalConfirmUrgentRequest') {
      if (data.cs) {
        this.dataText.cs = data.cs;
      }
      $(this.modalConfirmUrgentRequest.nativeElement).modal('show');
    } else if (data.modalId === 'myModalUrgentRequest') {
      this.urgentRequestForm.controls[`txtUrgentRequestReason`].reset();
      $(this.modalUrgentRequest.nativeElement).modal('show');
    } else if (data.modalId === 'myModalPrintDocument') {
      if (data.data) {
        this.printPageList = data.data.printPageList;
        this.isShowPrintLabel = data.data.isShowPrintLabel;
        this.printOrderId = data.data.orderId;
      }
      $(this.modalPrintDocument.nativeElement).modal({
        backdrop: 'static',
        keyboard: false
      });
    } else if (data.modalId === 'myModalPrintDocument2') {
      if (data.data) {
        this.printPageList = data.data.printPageList;
        this.isShowPrintLabel = data.data.isShowPrintLabel;
        this.printOrderId = data.data.orderId;
        this.printAllurl = data.data.printAllurl
      }
      $(this.modalPrintDocument2.nativeElement).modal({
        backdrop: 'static',
        keyboard: false
      });
    } else if (data.modalId === 'myModalConfirm') {
      if (data.data) {
        this.iconURL = data.data.iconURL;
      }
      $(this.modalConfirm.nativeElement).modal('show');
    } else if (data.modalId === 'myModalConfirmProduction') {
      $(this.modalConfirmProduction.nativeElement).modal('show');
    } else if (data.modalId === 'myModalConfirmProductionDone') {

      this.submitted = false
      this.imageList = [];
      this.packageNote = ''
      this.productionNote = data.productDoneDetail.order.productionNote ? data.productDoneDetail.order.productionNote : ''
      this.hn = data.productDoneDetail.order.hn ? data.productDoneDetail.order.hn : ''
      this.name = data.productDoneDetail.order.patientName ? data.productDoneDetail.order.patientName : ''
      this.filePicture = null
      this.imageInputText = ''
      this.productionDoneForm.controls[`txtProductionNote`].reset(this.productionNote);
      this.productionDoneForm.controls[`txtPackageNote`].reset();
      this.productionDoneForm.controls['txtHn'].setValue(this.hn);
      this.productionDoneForm.controls[`txtName`].setValue(this.name);
      const formArray = this.productionDoneForm.get('txtPackageNoteList') as FormArray;
      while (formArray.length !== 0) {
        formArray.removeAt(0);
      }
      formArray.push(this.createPackagingNoteForm());
      $(this.modalConfirmProductionDone.nativeElement).modal({
        backdrop: 'static'
      });
    } else if (data.modalId === 'myModalChangeBooking') {
      $(this.modalChangeBooking.nativeElement).modal('show');
    } else if (data.modalId === 'myModalInsertTrakCare') {
      $(this.modalInsertTrakCare.nativeElement).modal('show');
    } else if (data.modalId === 'myModalCompleteDelivery') {
      $(this.modalCompleteDelivery.nativeElement).modal('show');
    } else if (data.modalId === 'myModalOrderError') {
      this.dataText.userMessageList = this.dataText.userMessage.split('\n')
      $(this.modalOrderError.nativeElement).modal({
        backdrop: 'static'
      });
    } else if (data.modalId === 'myModalOrderErrorEditOrAccept') {
      this.dataText.userMessageList = this.dataText.userMessage.split('\n')
      $(this.modalOrderErrorEditOrAccept.nativeElement).modal({
        backdrop: 'static'
      });
    } else if (data.modalId === 'myModalOrderErrorStatus1') {
      this.dataText.userMessageList = this.dataText.userMessage.split('\n')
      $(this.modalOrderErrorStatus1.nativeElement).modal({
        backdrop: 'static'
      });
    } else if (data.modalId === 'myModalOrderInactive') {
      this.orderInactiveForm.controls['txtOrderInactiveRemark'].reset();
      if (this.dataText.userMessageList) {
        this.orderInactiveRemark = this.dataText.userMessageList;
      }
      $(this.modalOrderInactive.nativeElement).modal('show');
    } else if (data.modalId === 'myModalSplitDeliveryAlert') {
      $(this.modalSplitDeliveryAlert.nativeElement).modal('show');
    } else {
      $(this.modalError.nativeElement).modal('show');
    }

    // ปรับ html <body> ให้กลับเป็นปกติเมื่อเปิด-ปิด modal
    document.body.style.paddingRight = '0px';
  }

  isArray(data) {
    return Array.isArray(data) ? data : []
  }

  closeModal(modalId) {
    if (modalId === 'myModalDelete') {
      $(this.modalDelete.nativeElement).modal('hide');
    } else if (modalId === 'myModalConfirmManPower') {
      $(this.modalConfirmManPower.nativeElement).modal('hide');
    } else if (modalId === 'myModalDeleteWarning') {
      $(this.modalDeleteWarning.nativeElement).modal('hide');
    } else if (modalId === 'myModalSuccessDelete') {
      $(this.modalSuccessDelete.nativeElement).modal('hide');

    } else if (modalId === 'myModalSuccess') {
      $(this.modalSuccess.nativeElement).modal('hide');

    } else if (modalId === 'myModalSuccessUser') {
      $(this.modalSuccessUser.nativeElement).modal('hide');

    } else if (modalId === 'myModalSuccessWarning') {
      $(this.modalSuccessWarning.nativeElement).modal('hide');
    } else if (modalId === 'myModalEditSuccess') {
      $(this.modalEditSuccess.nativeElement).modal('hide');
    } else if (modalId === 'myModalWarning') {
      $(this.modalWarning.nativeElement).modal('hide');
    } else if (modalId === 'myModalViewWarning') {
      $(this.modalViewWarning.nativeElement).modal('hide');
    } else if (modalId === 'myModalUploadImageWarning') {
      $(this.modalUploadImageWarning.nativeElement).modal('hide');
    } else if (modalId === 'myModalUploadImageTypeWarning') {
      $(this.modalUploadImageTypeWarning.nativeElement).modal('hide');
    } else if (modalId === 'myModalWarningNoTextSearch') {
      $(this.modalWarningNoTextSearch.nativeElement).modal('hide');
    } else if (modalId === 'myModalErrorDataExisted') {
      $(this.modalErrorDataExisted.nativeElement).modal('hide');
    } else if (modalId === 'myModalErrorDeleteButHaveMenuGroup') {
      $(this.modalErrorDeleteButHaveMenuGroup.nativeElement).modal('hide');
    } else if (modalId === 'modalErrorImport') {
      $(this.modalErrorImport.nativeElement).modal('hide');
    } else if (modalId === 'myModalConfirmUrgentRequest') {
      $(this.modalConfirmUrgentRequest.nativeElement).modal('hide');
    } else if (modalId === 'myModalUrgentRequest') {
      $(this.modalUrgentRequest.nativeElement).modal('hide');
    } else if (modalId === 'myModalPrintDocument') {
      $(this.modalPrintDocument.nativeElement).modal('hide');
    } else if (modalId === 'myModalConfirm') {
      $(this.modalConfirm.nativeElement).modal('hide');
    } else if (modalId === 'myModalProduction') {
      $(this.modalConfirmProduction.nativeElement).modal('hide');
    } else if (modalId === 'myModalProductionDone') {
      $(this.modalConfirmProductionDone.nativeElement).modal('hide');
    } else if (modalId === 'myModalChangeBooking') {
      $(this.modalChangeBooking.nativeElement).modal('hide');
    } else if (modalId === 'myModalInsertTrakCare') {
      $(this.modalInsertTrakCare.nativeElement).modal('hide');
    } else if (modalId === 'myModalCompleteDelivery') {
      $(this.modalCompleteDelivery.nativeElement).modal('hide');
    } else if (modalId === 'myModalConfirmProductionDone') {
      this.submitted = false
      this.imageList = [];
      $(this.modalConfirmProductionDone.nativeElement).modal('hide');
    } else if (modalId === 'myModalOrderError') {
      $(this.modalOrderError.nativeElement).modal('hide');
    } else if (modalId === 'myModalOrderErrorEditOrAccept') {
      $(this.modalOrderErrorEditOrAccept.nativeElement).modal('hide');
    } else if (modalId === 'myModalOrderErrorStatus1') {
      $(this.modalOrderError.nativeElement).modal('hide');
    } else if (modalId === 'myModalOrderInactive') {
      $(this.modalOrderInactive.nativeElement).modal('hide');
    } else if (modalId === 'myModalSplitDeliveryAlert') {
      $(this.modalOrderInactive.nativeElement).modal('hide');
    } else {
      console.error('closeModal Error');
    }
  }

  goBack() {
    this.onClickBack.emit();
  }

  showStringValidDataExcel(data) {
    let text = '';
    if (data.data && data.data.itemOjb && data.data.itemOjb.failDescription) {
      for (let j = 0; j < data.data.itemOjb.failDescription.length; j++) {
        text += '[' + data.data.itemOjb.failDescription[j].columeName + ']' + ':"' + data.data.itemOjb.failDescription[j].text + '", <br/>';
      }
    }
    return text;
  }

  goAssignRolePermission() {
    console.log(this.dataText.userTitle);
    this.router.navigate(['/assign-microservice-permission', this.dataText.userTitle, 'assign-microservice-permission-info']);
  }

  showStringErrorDataExcel(failDescription) {
    let text = '';
    for (let j = 0; j < failDescription.length; j++) {
      text += '[' + failDescription[j].columeName + ']' + ':"' + failDescription[j].text + '", <br/>';
    }
    return text;
  }

  closeProgressbar() {
    $(this.modalProgressBarWarning.nativeElement).modal('hide');
  }

  @Output() onCloseModalError = new EventEmitter();
  @Output() onCloseModalErrorImport = new EventEmitter();
  @Output() onOkDelete = new EventEmitter();
  @Output() onCancelDelete = new EventEmitter();
  @Output() onClickBack = new EventEmitter();
  @Output() onCancelViewWarning = new EventEmitter();
  @Output() onCancelUploadValid = new EventEmitter();
  @Output() onDataErrorExcel = new EventEmitter();
  @Output() onClickExport = new EventEmitter();
  @Output() onClickDeleteExport = new EventEmitter();
  @Output() onOkClone = new EventEmitter();
  @Output() onCancelClone = new EventEmitter();
  @Output() onOkDiagramCancel = new EventEmitter();
  @Output() onCancelDiagramCancel = new EventEmitter();
  @Output() onClose = new EventEmitter();
  @Output() onCloseModalWarning = new EventEmitter();
  @Output() onDownload = new EventEmitter();
  @Output() onOkManPowerModal = new EventEmitter();
  @Output() onOkReOrderModal = new EventEmitter();
  @Output() onClickApproveModal = new EventEmitter();
  @Output() onCancelUrgentRequest = new EventEmitter();
  @Output() onEditUrgentRequest = new EventEmitter();
  @Output() onConfirmUrgentRequest = new EventEmitter();
  @Output() onCancelOrderInactive = new EventEmitter();
  @Output() onOKOrderInactive = new EventEmitter();
  @Output() onOk = new EventEmitter();
  @Output() onOkProductionModal = new EventEmitter
  @Output() onOkProductionDoneModal = new EventEmitter
  @Output() onOkSuccess = new EventEmitter
  @Output() onOkChangeBooking = new EventEmitter();
  @Output() onCancelChangeBooking = new EventEmitter();
  @Output() onCancelInsertTrakCare = new EventEmitter();
  @Output() onOkInsertTrakCare = new EventEmitter();
  @Output() onOkCompleteDelivery = new EventEmitter();
  @Output() onCancelCompleteDelivery = new EventEmitter();
  @Output() onClosePrintDocument = new EventEmitter();
  @Output() onClickRejectModal = new EventEmitter();
  @Output() onClickEditOrder = new EventEmitter();
  @Output() onClickEditOrAcceptOrder = new EventEmitter();
  @Output() onClickContinueOrder = new EventEmitter();
  @Output() onCloseEditOrder = new EventEmitter();
  @Output() onCloseModalSplit = new EventEmitter();

  onClickEditOrderModal() {
    $(this.modalOrderError.nativeElement).modal('hide');
    this.onClickEditOrder.emit();
  }
  onClickEditOrAcceptOrderModal() {
    $(this.modalOrderError.nativeElement).modal('hide');
    this.onClickEditOrAcceptOrder.emit();
  }

  onClickContinueOrderModal() {
    $(this.modalOrderError.nativeElement).modal('hide');
    this.onClickContinueOrder.emit();
  }

  onCloseEditOrderModal() {
    $(this.modalOrderError.nativeElement).modal('hide');
    this.onCloseEditOrder.emit();
  }

  onOkDeleteModal() {
    $(this.modalDelete.nativeElement).modal('hide');
    this.onOkDelete.emit();
  }

  onCancelDeleteModal() {
    this.onCancelDelete.emit();
  }

  onOkChangeBookingModal() {
    $(this.modalChangeBooking.nativeElement).modal('hide');
    this.onOkChangeBooking.emit();
  }

  onCancelChangeBookingModal() {
    this.onCancelChangeBooking.emit();
  }

  onOkInsertTrakCareModal() {
    $(this.modalInsertTrakCare.nativeElement).modal('hide');
    this.onOkInsertTrakCare.emit();
  }

  onCancelInsertTrakCareModal() {
    this.onCancelInsertTrakCare.emit();
  }

  onCancelCompleteDeliveryModal() {
    this.onCancelCompleteDelivery.emit();
  }

  onOkCompleteDeliveryModal() {
    $(this.modalCompleteDelivery.nativeElement).modal('hide');
    this.onOkCompleteDelivery.emit();
  }

  onClickBackModal() {
    this.onClickBack.emit();
  }

  onClickReject() {
    this.onClickRejectModal.emit();
  }

  onClickBackProductionDoneModal() {
    const valid = this.checkRequiredProductionDone();
    this.submitted = true
    if (valid) {
      $(this.modalConfirmProductionDone.nativeElement).modal('hide');
    }
  }

  onCancelViewWarningModal() {
    console.log('hjh');
    this.onCancelViewWarning.emit();
  }

  onCancelUploadValidModal() {
    this.onCancelUploadValid.emit();
  }

  onDataErrorExcelModal() {
    this.onDataErrorExcel.emit();
  }

  onCloseModalErrorModal() {
    this.onCloseModalError.emit();
  }

  onCloseModalWarningModal() {
    this.onCloseModalWarning.emit();
  }

  onCancelCloneModal() {
    this.onCancelClone.emit();
  }
  onCloseSplitAlertModal() {
    this.onCloseModalSplit.emit();
  }

  onCancelDiagramCancelModal() {
    this.onCancelDiagramCancel.emit();
  }

  onDownloadModal() {
    this.onDownload.emit();
  }

  onClickOkManPower() {
    this.onOkManPowerModal.emit();
  }

  onClickOkReOrder() {
    this.closeModal('myModalConfirmReOrder');
    this.onOkReOrderModal.emit();
  }

  onClickApprove() {
    this.onClickApproveModal.emit();
  }

  onClickEditUrgentRequest() {
    this.onClickEditOrder.emit();
  }

  onClickCancelUrgentRequest() {
    this.onCancelUrgentRequest.emit();
  }

  onClickConfirmUrgentRequest() {
    const valid = this.checkRequiredData();
    if (valid) {
      this.onConfirmUrgentRequest.emit(this.urgentRequestReason);
      $(this.modalUrgentRequest.nativeElement).modal('hide');
    }
  }

  onClickCancelOrderInactive() {
    this.onCancelOrderInactive.emit();
  }

  onClickOKOrderInactive() {
    const valid = this.checkRequiredOrderInactive();
    if (valid) {
      this.onOKOrderInactive.emit(this.orderInactiveRemark);
      // $(this.modalOrderInactive.nativeElement).modal('hide');
    }
  }

  onClickOk() {
    this.onOk.emit();
  }

  onClickCancel() {
    this.onClose.emit();
  }

  onClickOkProduction() {
    this.onOkProductionModal.emit();
  }

  async onClickOkProductionDone() {
    const valid = this.checkRequiredProductionDone();
    this.submitted = true
    if (valid) {
      const packagingNotesRaw = this.productionDoneForm.get('txtPackageNoteList').value;

      const packagingNotesProcessed = packagingNotesRaw.map(note => {
        const typeIndex = note.type.findIndex(selected => selected === true);
        const supTypeIndexes = note.supType
          .map((selected, idx) => selected ? idx + 1 : -1)
          .filter(idx => idx !== -1);

        return {
          ...note,
          type: typeIndex + 1,
          supType: supTypeIndexes
        };
      });

      const data = {
        productionNote: this.productionNote,
        packageNote: JSON.stringify(packagingNotesProcessed),
        hn: this.hn,
        name: this.name,
        productionPicture: this.imageList.map(img => img.base64).join('|')

      };

      this.onOkProductionDoneModal.emit(data);
      $(this.modalConfirmProductionDone.nativeElement).modal('hide');
    }

  }

  onClickOkSuccess() {
    $(this.modalSuccess.nativeElement).modal('hide');
    this.onOkSuccess.emit();
  }

  onClickClosePrintDocument() {
    $(this.modalPrintDocument.nativeElement).modal('hide');
    this.onClosePrintDocument.emit();
  }

  onClickClosePrintDocument2() {
    $(this.modalPrintDocument2.nativeElement).modal('hide');
    this.onClosePrintDocument.emit();
  }


  checkRequiredData() {
    console.log(this.urgentRequestForm.controls, this.urgentRequestForm, this.urgentRequestForm.valid);
    for (const key in this.urgentRequestForm.controls) {
      if (this.urgentRequestForm.controls[key].errors) {
        this.urgentRequestForm.controls[key].setErrors({ 'forceRequired': true });
        this.urgentRequestForm.controls[key].markAsDirty();
      } else {
        this.urgentRequestForm.controls[key].updateValueAndValidity();
      }
    }
    return this.urgentRequestForm.valid;
  }
  isCheckboxGroupInvalid(control: AbstractControl): boolean {
    return control && control.invalid && (control.dirty || control.touched);
  }
  checkRequiredProductionDone() {
    const formArray = this.productionDoneForm.get('txtPackageNoteList') as FormArray;

    formArray.controls.forEach((group: FormGroup) => {
      Object.keys(group.controls).forEach(key => {
        const control = group.get(key);

        if (control instanceof FormArray) {
          control.controls.forEach(ctrl => {
            ctrl.markAsTouched();
          });
          control.updateValueAndValidity();
        } else {
          control.markAsDirty();
          control.updateValueAndValidity();
        }
      });
    });

    return this.productionDoneForm.valid;
  }
  checkRequiredOrderInactive() {
    for (const key in this.orderInactiveForm.controls) {
      if (this.orderInactiveForm.controls[key].errors) {
        this.orderInactiveForm.controls[key].setErrors({ 'forceRequired': true });
        this.orderInactiveForm.controls[key].markAsDirty();
      } else {
        this.orderInactiveForm.controls[key].updateValueAndValidity();
      }
    }
    return this.orderInactiveForm.valid;
  }


  async fnClickPrintDocument(data) {
    try {
      let filterData: any = '';
      if (data.filter) {
        filterData = {
          ...data.filter
        };
      }
      const checkUrl = this.common.checkMockupUrl('', '', filterData, {
        BASE_API: '',
        BASE_MODULE: environment.apiPrefix,
        BASE_RESOURCE: data.url + '/' + this.printOrderId
      });

      const resultCodeSuccess = environment.resultCodeSuccess;
      const response = await this.request.get(checkUrl.url, checkUrl.filter);
      if (response.resultCode === resultCodeSuccess) {
        const resultData = response.resultData || response.data;
        const fileName = resultData.filename;
        console.log('fileName', fileName);
        console.log(data)
        window.open(fileName);
      } else {
        this.openModal({
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
      this.openModal({
        'modalId': 'myModalError',
        'userTitle': resultDescriptionSystemErrorTitle,
        'userMessage': resultDescriptionSystemErrorMassage,
        'userMessageList': []
      });
    }
  }

  async fnClickPrintLabel(size) {
    try {
      const checkUrl = this.common.checkMockupUrl('', '', { size }, {
        BASE_API: '',
        BASE_MODULE: environment.apiPrefix,
        BASE_RESOURCE: environment.printSMLLabel + '/' + this.printOrderId
      });

      const resultCodeSuccess = environment.resultCodeSuccess;
      const response = await this.request.get(checkUrl.url, checkUrl.filter);
      if (response.resultCode === resultCodeSuccess) {
        const resultData = response.resultData || response.data;
        const fileName = resultData.filename;
        console.log('fileName', fileName);
        if (fileName) {
          window.open(fileName);
        }
      } else {
        this.openModal({
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
      this.openModal({
        'modalId': 'myModalError',
        'userTitle': resultDescriptionSystemErrorTitle,
        'userMessage': resultDescriptionSystemErrorMassage,
        'userMessageList': []
      });
    }
  }


  toBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  })

  goAlert(userTitle, userMessage, modalId) {
    const dataAlert = {
      'modalId': modalId,
      'userTitle': userTitle,
      'userMessage': userMessage
    };
    this.openModal(dataAlert);
  }

  // processFile(imageInput: any) {
  //   this.filePicture = null;
  //   const file: File = imageInput.files[0];
  //   const reader = new FileReader();
  //   reader.addEventListener('load', (event: any) => {
  //     console.log(file.type);
  //
  //     if (['image/png', 'image/jpeg', 'image/jpg'].indexOf(file.type) === -1) {
  //       // this.goAlert("Validate", 'File should be .jpg, .jpeg, .png, .heic and .heif ', 'myModalError');
  //       this.goAlert('Invalid File Format', 'File should be .jpg, .jpeg, .png, .heic and .heif ', 'myModalWarning');
  //       return;
  //     }
  //
  //     if (file.size > 1000000) {
  //       // this.goAlert("Validate", 'The file is too large. Allowed maximum size is 1 MB.', 'myModalError');
  //       this.goAlert('Invalid File Format', 'The file is too large. Allowed maximum size is 1 MB.', 'myModalWarning');
  //       return;
  //     }
  //
  //     this.selectedFile = new ImageSnippet(event.target.result, file);
  //     this.selectedFile.pending = true;
  //     // let file = this.selectedFile.file
  //     console.log(file.name);
  //     this.imageInputText = file.name;
  //     this.toBase64(file).then((r) => {
  //       console.log(r);
  //       this.filePicture = r;
  //     });
  //   });
  //   reader.readAsDataURL(file);
  // }

  fnClickUploader() {
    // if (this.imageList.length === 5) {
    //   return;
    // }
    // const elm: any = document.querySelector('.dx-fileuploader-button');
    // elm.click();
    this.fileInput.nativeElement.click();
  }

  fnDeleteImage(index) {
    this.imageList.splice(index, 1);
  }

  onValueChanged(event) {
    if (this.imageList.length > 5) {
      this.imageList.length = 5;
    }

    const removeIndexList = [];
    let isErrorFormat = false;
    let isErrorSize = false;
    for (let i = 0; i < this.imageList.length; i++) {
      const file: File = this.imageList[i];
      if (this.imageList[i].name.includes(".heic") || this.imageList[i].name.includes(".heif") || this.imageList[i].name.includes(".HEIC") || this.imageList[i].name.includes(".HEIF")) {
        let blob: Blob = file;
        let convProm: Promise<any>;

        console.log('before ::' + this.imageList[i].size)
        this.isLoadingPanel = true
        convProm = heic2any({ blob, toType: "image/jpeg", quality: 0.92 }).then((jpgBlob: Blob) => {

          //Change the name of the file according to the new format
          let newName = file.name.replace(/\.[^/.]+$/, ".jpg");

          //Convert blob back to file
          this.imageList[i] = this.blobToFile(jpgBlob, newName);

          this.common.fnResizeImage(this.imageList[i], newName, 0.20).then((resizeFile: File) => {
            // Convert blob back to file
            console.log('after ::' + resizeFile.size);
            if (resizeFile.size > 1000000) {
              removeIndexList.push(i);
              isErrorFormat = false;
              isErrorSize = true;
            }
            this.isLoadingPanel = false;
          });
        }).catch(err => {
          //Handle error
        });

      } else {
        if (['image/png', 'image/jpeg', 'image/jpg'].indexOf(this.imageList[i].type) === -1) {
          removeIndexList.push(i);
          isErrorFormat = true;
          isErrorSize = false;

        } else {
          this.common.fnResizeImage(this.imageList[i], file.name, 0.20).then((resizeFile: File) => {
            if (resizeFile.size > 1000000) {
              removeIndexList.push(i);
              isErrorFormat = false;
              isErrorSize = true;
            }
          });
        }
      }
    }

    for (let i = removeIndexList.length - 1; i >= 0; i--) {
      this.fnDeleteImage(removeIndexList[i]);
    }


    if (isErrorFormat) {
      this.goAlert('Invalid File Format', 'File should be .jpg, .jpeg, .png, .heic and .heif ', 'myModalWarning');
    } else if (isErrorSize) {
      this.goAlert('Invalid File Size', 'The file is too large. Allowed maximum size is 1 MB.', 'myModalWarning');
    }

    // set input file null เพื่อให้อัพโหลดชื่อไฟล์เดิมซ้ำได้
    const elm: any = document.querySelector('input[type="file"]');
    elm.value = null;

  }

  blobToFile = (theBlob: Blob, fileName: string): File => {
    let b: any = theBlob;

    //A Blob() is almost a File() - it's just missing the two properties below which we will add
    b.lastModified = new Date();
    b.name = fileName;

    //Cast to a File() type

    return <File>theBlob;
  }
  upload(event: any) {
    const files: FileList = event.target.files;
    if (!files || !files.length) return;

    const maxPictures = 5;
    const currentCount = this.imageList.length;
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
        this.imageList.push({
          name: file.name,
          base64: base64
        });
      };

      reader.readAsDataURL(file);
    }
    console.log("thi,s.imageList", this.imageList)
    event.target.value = '';
  }
  removePicture(index: number): void {
    this.imageList.splice(index, 1);
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
    console.log("i")
    this.filePicture = i
    this.popupVisible = true
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
        BASE_RESOURCE: url + '/' + this.printOrderId
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
          window.open(fileName);
          this.printAllurl = fileName
        }
      } else {
        this.openModal({
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
      this.openModal({
        'modalId': 'myModalError',
        'userTitle': resultDescriptionSystemErrorTitle,
        'userMessage': resultDescriptionSystemErrorMassage,
        'userMessageList': []
      });
    }
  }
}

@NgModule({
  imports: [DxDataGridModule, CommonModule, FormsModule, ReactiveFormsModule, DxFileUploaderModule, DxLoadPanelModule, DxCheckBoxModule, DxPopupModule,NgxPrintModule, ResolveImageUrlModule],
  exports: [CreateAlertComponent],
  declarations: [CreateAlertComponent]

})
export class CreateAlertModule { 
}
