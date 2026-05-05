import {Component, OnInit, AfterViewInit, ViewChild, ElementRef, EventEmitter, Output} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';

declare let $: any;
import {LayoutMenu} from '../../../../shared/store/layout.menu.store';
import {GlobalVariable} from './list-production-management.global';
import {Request} from '../../../../shared/services/request.service';
import {Common} from '../../../../shared/services/common.service';
import {FormGroup, FormBuilder, FormControl, Validators} from '@angular/forms';
import {DxDataGridComponent, DxDateBoxComponent, DxScrollViewComponent, DxPopupComponent} from 'devextreme-angular';
import * as moment from 'moment';
import {environment} from '../../../../../environments/environment';
import CustomStore from 'devextreme/data/custom_store';
import {StoreService} from '../../../../shared/services/store.service';
import * as FileSaver from 'file-saver';
import * as XLSX from 'xlsx';

const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
const EXCEL_EXTENSION = '.xlsx';

@Component({
    selector: 'app-list-production-management',
    providers: [LayoutMenu, Request, Common],
    templateUrl: './list-production-management.component.html',
})
export class ListProductionManagementComponent implements OnInit, AfterViewInit {
    @ViewChild('myModal') myModal;
    @ViewChild(DxDataGridComponent) gridMicroservices: DxDataGridComponent;
    dataMicroservices = [
        {
            no: 1,
            hn: '',
            name: '',
            type: 'Sup',
            supplyDay: 30,
            bookingSlotDate: 'Today ' + moment('2022-06-29 11:00:00').format('HH:mm'),
            lotNumber: '2022053001',
            startDate: 'Today ' + moment('2022-06-29 08:00:00').format('HH:mm'),
            endDate: 'Today ' + moment('2022-06-29 09:45:00').format('HH:mm'),
            note: ''
        },
        {
            no: 2,
            hn: '',
            name: '',
            type: 'Sup',
            supplyDay: 30,
            bookingSlotDate: 'Today ' + moment('2022-06-29 14:00:00').format('HH:mm'),
            lotNumber: '2022053001',
            startDate: 'Today ' + moment('2022-06-29 08:00:00').format('HH:mm'),
            endDate: 'Today ' + moment('2022-06-29 10:45:00').format('HH:mm'),
            note: ''
        }
    ];
    dxgridPageSize;
    allowedPageSizes = environment.allowedPageSizes;
    offset;
    limits;
    orderby;
    textTotal = ' Search Results 0 of 0 Item';
    numMicroservices = 0;
    dataResultItems = 0;
    loadData = false;
    fieldsMicroservicesList;
    checkClickSearch = false;
    filterData: any = {};
    txtInputSearch: any = {};
    resResultCode;
    remotePaging;
    getIdDelete;
    loading = false;
    disbledBtn = {
        'create': false
    };
    menuHome: any = false;
    menuPermissions: any = {view: false, add: false, edit: false, delete: false};

    constructor(
        public router: Router,
        private fb: FormBuilder,
        private request: Request,
        public layoutMenu: LayoutMenu,
        private common: Common,
        private store: StoreService,
    ) {
        this.dxgridPageSize = environment.dxgridPageSize;
        this.fieldsMicroservicesList = environment.fieldsMicroservicesList;

        this.remotePaging = {
            limit: 10,
            first: 0,
            jsonFirst: '',
            offset: 1,
            page: 1,
            pageIdex: 0,
            orderBy: 'updatedAt|ASC',
            fields: '',
        };

    }

    ngOnInit() {

        for (let i = 0; i < this.dataMicroservices.length; i++) {
            const bookingSlotDate = this.dataMicroservices[i].bookingSlotDate;
            const hh = bookingSlotDate.split(':')[0];
            const mm = bookingSlotDate.split(':')[1];
            // this.dataMicroservices[i][hh] = [];
            // for (let j = 8; j <= 22; j++) {
            //     this.dataMicroservices[i][j] = {
            //         '15': false,
            //         '30': false,
            //         '45': false,
            //         '60': false,
            //     };
            //     if(+hh === j) {
            //
            //     }
            // }
        }
        console.log(this.dataMicroservices);
        this.store.subscribePagePermissionList().subscribe(pagePermissionList => {
            console.log('ngOnInit', pagePermissionList);
            const pagePermission = pagePermissionList.find(r => r.url === GlobalVariable.ROLE_URL);
            if (pagePermission) {
                try {
                    // console.log("pagePermission",pagePermission);
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
    }

    goHomeMenu() {
        if (this.menuHome) {
            this.router.navigate(['/menu',this.menuHome['menuId'],this.menuHome['typePage']]);
        }
    }

    async ngAfterViewInit() {
    }


    confirmDelete(id) {
        console.log(id);
        this.getIdDelete = id;
        this.disbledBtn = {
            'create': true
        };
        this.goAlert('', '', 'myModalDelete');
    }

    async onOkDelete() {
        try {
            this.disbledBtn = {
                'create': true
            };
            let url = GlobalVariable.BASE_API + GlobalVariable.BASE_RESOURCE + GlobalVariable.BASE_RESOURCE_DELETE;
            // let url = GlobalVariable.BASE_API + GlobalVariable.BASE_RESOURCE + '/' + this.getIdDelete;

            let data = {
                'rawMaterialId': this.getIdDelete
            };

            const resultCodeSuccess = environment.resultCodeSuccess;
            const resultCodeDataNotFound = environment.resultCodeDataNotFound;
            const resultDescriptionDataNotFoundTitle = environment.resultDescriptionDataNotFoundTitle;
            const resultDescriptionDataNotFoundMassage = environment.resultDescriptionDataNotFoundMassage;
            const resultCodeDbError = environment.resultCodeDbError;
            const resultDescriptionDbErrorTitle = environment.resultDescriptionDbErrorTitle;
            const resultDescriptionDbErrorMassage = environment.resultDescriptionDbErrorMassage;
            const resultCodeDeleteDataAtHaveChild = environment.resultCodeDeleteDataAtHaveChild;
            const resultDescriptionDeleteDataAtHaveChildTitle = environment.resultDescriptionDeleteDataAtHaveChildTitle;
            const resultDescriptionDeleteDataAtHaveChildMassage = environment.resultDescriptionDeleteDataAtHaveChildMassage;
            const resultDescriptionSystemErrorTitle = environment.resultDescriptionSystemErrorTitle;
            const resultDescriptionSystemErrorMassage = environment.resultDescriptionSystemErrorMassage;

            let response = await this.request.post(url, data);

            // this.userMessage = response.userMessage;
            if (response.resultCode === resultCodeSuccess) {
                this.goAlert('', '', 'myModalSuccessDelete');
            } else {
                console.log('error');
                // this.goAlert(resultDescriptionSystemErrorTitle, resultDescriptionSystemErrorMassage, 'myModalError');
                this.goAlert(response.resultCode, response.resultDescription, 'myModalError');
            }
        } catch (e) {
            console.log(e);
            this.disbledBtn = {
                'create': false
            };
        }
    }

    onCancelDelete() {
        this.disbledBtn = {
            'create': false
        };
    }

    goAlert(userTitle, userMessage, modalId) {
        const dataAlert = {
            'modalId': modalId,
            'userTitle': userTitle,
            'userMessage': userMessage
        };
        this.myModal.openModal(dataAlert);
    }

    onClickExport() {
        console.log('onClickExport');
        // this.gridMicroservices.export.enabled = true;
        // this.gridMicroservices.export.fileName = 'export-bin';
        // this.gridMicroservices.instance.exportToExcel(true);
        this.downloadExcel();
    }

    async downloadExcel() {
        let header = [{
            A: 'No',
            B: 'Code',
            C: 'Raw Material Name',
            D: 'UOM',
            E: 'Recommended Dose/Day',
            F: 'Strength (UOM per mg)',
            G: 'Description',
            H: 'Updated At',
        }];
        let data: any = await this.getDataAll();
        this.exportAsExcelFile(data, header, 'Raw_Materials');
    }

    async getDataAll() {

        let data = [];
        const checkUrl = this.common.checkMockupUrl('', '', {
            orderby: 'updatedAt|DESC'
        }, {
            BASE_API: GlobalVariable.BASE_API,
            BASE_MODULE: GlobalVariable.BASE_MODULE,
            BASE_RESOURCE: GlobalVariable.BASE_RESOURCE + GlobalVariable.BASE_RESOURCE_GET
        });
        const res = await this.request.get(checkUrl.url, checkUrl.filter);
        if (res.resultCode === '20000') {
            data = [...data, ...res.resultData];
        }
        console.log(res);
        return data.map((r, i) => {
            return {
                no: i + 1,
                code: r.code,
                rawMaterialName: r.rawMaterialName,
                uom: r.uom,
                recommendedDose: r.recommendedDose,
                strength: r.strength,
                description: r.description,
                updatedAt: r.updatedAt ? moment(r.updatedAt).format('DD/MM/YYYY HH:mm:ss') : ''
            };
        });
    }


    public exportAsExcelFile(json: any[], headerText: any[], excelFileName: string): void {
        var worksheet = XLSX.utils.json_to_sheet(headerText, {header: [], skipHeader: true});
        XLSX.utils.sheet_add_json(worksheet, json, {skipHeader: true, origin: 'A2'});
        const workbook: XLSX.WorkBook = {Sheets: {'data': worksheet}, SheetNames: ['data']};
        const excelBuffer: any = XLSX.write(workbook, {bookType: 'xlsx', type: 'array'});
        this.saveAsExcelFile(excelBuffer, excelFileName);
    }

    private saveAsExcelFile(buffer: any, fileName: string): void {
        const data: Blob = new Blob([buffer], {
            type: EXCEL_TYPE
        });
        FileSaver.saveAs(data, fileName + '_' + moment().format('YYYYMMDD') + EXCEL_EXTENSION);
    }

    onCloseModalError() {
        console.log('onCancelDelete');
    }

    onCellPrepared(e) {
        if (e.rowType === 'header') {
            e.cellElement.title = e.cellElement.outerText;
        } else {
            e.cellElement.title = e.text;
        }
        e.cellElement.accessKey = e.column.caption;
    }

    // Collapse ibox function
    clickCollapse() {
        let collapse = this.common.collapseFn();
    }

    timeCellTemplate(e) {
        return new Date(e.date).toLocaleString('en-GB', {hour: '2-digit', minute: '2-digit'});
    }


    isDinner(date: Date) {
        const hours = date.getHours();
        const dinnerTime = {from: 12, to: 13};
        return hours >= dinnerTime.from && hours < dinnerTime.to;
    }

    isHoliday(date: Date) {
        const localeDate = date.toLocaleDateString();
        const holidays = [
            new Date(2021, 3, 18),
            new Date(2021, 3, 19),
        ];
        return holidays.filter((holiday) => holiday.toLocaleDateString() === localeDate).length > 0;
    }

    isDisableDate(date: Date) {
        return this.isHoliday(date);
    }
}
