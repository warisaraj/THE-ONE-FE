import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, EventEmitter, Output } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

declare let $: any;
import { LayoutMenu } from '../shared/store/layout.menu.store';
import { GlobalVariable } from './list-noti.global';
import { Request } from '../shared/services/request.service';
import { Common } from '../shared/services/common.service';
import { FormGroup, FormBuilder, FormControl, Validators } from '@angular/forms';
import { DxDataGridComponent, DxDateBoxComponent, DxScrollViewComponent, DxPopupComponent } from 'devextreme-angular';
import * as moment from 'moment';
import * as _ from 'lodash';
import { environment } from '../../environments/environment';
import CustomStore from 'devextreme/data/custom_store';


@Component({
    selector: 'app-list-noti',
    providers: [LayoutMenu, Request, Common],
    templateUrl: './list-noti.component.html',
})
export class ListNotiComponent implements OnInit, AfterViewInit {
    @ViewChild('myModal') myModal;
    @ViewChild(DxDataGridComponent) gridUsers: DxDataGridComponent;

    dataUsers = {};
    dataDataUsers = [];

    dxgridPageSize;
    allowedPageSizes = environment.allowedPageSizes;
    offset;
    limits;
    orderby;
    textTotal = ' Search Results 0 of 0 items';
    numUser = 0;
    dataResultItems = 0;
    loadData = false;
    fieldsUsersList;
    checkClickSearch = false;
    txtInputSearch;
    filterData: any = {};
    _filterData: any = {};
    resResultCode;
    remotePaging;
    getIdDelete;
    loading = true;
    hoverTootip: any;
    disbledBtn = {
        'create': false
    };
    role: string;
    positionList: any [];

    constructor(public router: Router,
        private fb: FormBuilder,
        private request: Request,
        public layoutMenu: LayoutMenu,
        private common: Common,) {
        this.dxgridPageSize = environment.dxgridPageSize;
        this.fieldsUsersList = environment.fieldsUsersList;

    }

    ngOnInit() {
        if (sessionStorage.getItem('role')) {
            this.role = sessionStorage.getItem('role').toLowerCase()
        }
        this.getData()
    }

    async ngAfterViewInit() {
        // try {
        //     this.dataUsers = await this.customStore();
        //
        // } catch (e) {
        //     console.log(e);
        //     const resultDescriptionSystemErrorTitle = environment.resultDescriptionSystemErrorTitle;
        //     const resultDescriptionSystemErrorMassage = environment.resultDescriptionSystemErrorMassage;
        //     this.goAlert(resultDescriptionSystemErrorTitle, resultDescriptionSystemErrorMassage, 'myModalError');
        // }
    }

    // async clickSearch() {
    //     try {
    //         // if (JSON.stringify(this.filterData) === '{}' || !(this.filterData.username || this.filterData.firstnameEN || this.filterData.lastnameEN || this.filterData.email || this.filterData.telephoneNumber)) {
    //         //     console.log('if no text');
    //         //     this.goAlert('Field is required', 'Please specify at least one filter.', 'myModalWarning');
    //         // } else if (
    //         //     (this.filterData.firstnameEN && this.common.checkInvalidText(this.filterData.firstnameEN, 'eng')) ||
    //         //     (this.filterData.lastnameEN && this.common.checkInvalidText(this.filterData.lastnameEN, 'eng')) ||
    //         //     (this.filterData.telephoneNumber && this.common.checkInvalidText(this.filterData.telephoneNumber, 'num'))
    //         // ) {
    //         //     //     console.log('if invalid format');
    //         //     //   this.goAlert('Invalid Format!', 'Invalid Format!', 'myModalWarning');
    //         // }
    //         // else {
    //             this.checkClickSearch = true;
    //             this.loadData = false;
    //             this._filterData = _.cloneDeep(this.filterData);
    //             this.gridUsers.instance.clearSorting();
    //             this.gridUsers.instance.refresh();
    //             this.gridUsers.instance.pageSize(10);
    //             this.gridUsers.instance.pageIndex(0);
    //             this.gridUsers.instance.columnOption(1, 'sortOrder', 'desc');
    //         // }
    //     } catch (e) {
    //         console.log(e);
    //     }
    // }

    // async clickClear() {
    //     try {
    //         this.txtInputSearch = undefined;
    //         this.filterData = {};
    //         this.checkClickSearch = false;
    //         this.loadData = false;
    //         // this.gridUsers.instance.refresh();
    //         // this.gridUsers.instance.clearSorting();
    //         // this.gridUsers.instance.refresh();
    //         // this.gridUsers.instance.pageSize(10);
    //         // this.gridUsers.instance.pageIndex(0);
    //         // this.gridUsers.instance.columnOption(1, 'sortOrder', 'desc');
    //     } catch (e) {
    //         console.log(e);
    //     }
    // }

    goAlert(userTitle, userMessage, modalId) {
        const dataAlert = {
            'modalId': modalId,
            'userTitle': userTitle,
            'userMessage': userMessage
        };
        this.myModal.openModal(dataAlert);
    }

    async getData() {
        let filterData : any = {}
        const dropdown = await this.common.searchConfig();
        this.positionList = dropdown.positionList || [];
        for (let index = 0; index < this.positionList.length; index++) {
            this.positionList[index] = this.positionList[index].toLowerCase()
        }
        if (this.positionList.includes(this.role)) {
            if (this.role.toLowerCase() === 'pharmacist' ||this.role.toLowerCase() ===  'senior pharmacist' || this.role.toLowerCase() === 'pharmacy technician') {
                filterData.type = "1,5,6,7,12,13,15,16,17,18"

            }
            if (this.role.toLowerCase()  === 'cashier') {
                filterData.type = "2,4,8,9,10,14"
            }
            if (this.role.toLowerCase() === 'customer service') {
                filterData.type = "5,11,16,19"
            }
            if (this.role.toLowerCase() === 'production team' || this.role.toLowerCase() === 'production pharmacist' || this.role.toLowerCase() === 'production technician' || this.role.toLowerCase() === 'senior production technician') {
                filterData.type = "20"
              }
            const checkUrl = this.common.checkMockupUrl('', '', filterData, {
                BASE_API: GlobalVariable.BASE_API,
                BASE_MODULE: GlobalVariable.BASE_MODULE,
                BASE_RESOURCE: GlobalVariable.BASE_RESOURCE
            });

            // console.log(checkUrl);
            // console.log(checkUrl.url);
            // console.log(checkUrl.filter);
            // this.loadData = true;

            console.log('checkUrl.filter: ', checkUrl.filter);
            this.loadData = true;
            this.request.get(checkUrl.url, checkUrl.filter)
                .then(response => {
                    console.log(response);
                    setTimeout(() => {
                        this.loading = false;
                        this.loadData = false;
                    }, 200);

                    const resultDescriptionDataNotFoundTitle = environment.resultDescriptionDataNotFoundTitle;
                    const resultDescriptionDataNotFoundMassage = environment.resultDescriptionDataNotFoundMassage;


                    // if (response && response.count > 0) {
                    let dataDataUsers = response.data;
                    let temp = []
                    for (let i = 0; i < dataDataUsers.length; i++) {
                        dataDataUsers[i].date = moment(dataDataUsers[i].sendDate).subtract(7, 'hours').format('DD/MM/YYYY');
                        dataDataUsers[i].time = moment(dataDataUsers[i].sendDate).subtract(7, 'hours').format('HH:mm');
                        dataDataUsers[i].sendDate = this.common.convertDate(moment(dataDataUsers[i].sendDate).subtract(7, 'hours'), 'DD/MM/YYYY HH:mm:ss');
                        if (dataDataUsers[i].message.includes('\n')) {
                            dataDataUsers[i].messageList = dataDataUsers[i].message.split('\n')
                        } else {
                            dataDataUsers[i].messageList = []
                        }
                        temp.push(dataDataUsers[i])
                    }

                    let dataDataUsersdate = _.groupBy(temp, "date")

                    let temp2 = []
                    for (const key in dataDataUsersdate) {
                        temp2.push({
                            date: key,
                            data: dataDataUsersdate[key]
                        })
                    }
                    console.log("dataDataUsersdate", temp2);
                    this.dataDataUsers = temp2
                })
        } else {
            this.loading = false;
        }
    }

    // customStore() {
    //     const dataSource: any = {};
    //     this.loadData = false;
    //     let backData: any = [];
    //     let backItemTotal = 0;
    //
    //     dataSource.store = new CustomStore({
    //         load: (loadOptions) => {
    //             if (!this.loadData) {
    //                 console.log('loadOption : ', loadOptions);
    //                 // check sort if no no get api and sort no
    //                 if (loadOptions.sort !== null && (this.offset === loadOptions.skip && this.limits === loadOptions.take)) {
    //                     this.orderby = loadOptions.sort[0].selector;
    //                 }
    //                 // ดักให้ทำงานเฉพาะกรณีกด Paging / Sorting เท่านั้นกรณีอื่นจะทำให้ Datagrid พัง
    //                 if (this.common.checkLoadOptions(loadOptions) === false) {
    //                     return Promise.resolve({
    //                         data: backData.reverse(),
    //                         totalCount: backItemTotal
    //                     });
    //                 }
    //                 this.offset = loadOptions.skip;
    //                 this.limits = loadOptions.take;
    //                 this.orderby = loadOptions.sort;
    //
    //                 let filterData: any = {
    //                     title: null,
    //                     offset: this.offset,
    //                     limit: this.limits,
    //                     order: loadOptions.sort ? loadOptions.sort[0].selector : null
    //                 };
    //
    //                 if (JSON.stringify(this.filterData) === '{}') {
    //                     this.filterData = {};
    //                 } else {
    //                     if (this.filterData.title && this.filterData.title.trim()) {
    //                         this.filterData.title = this.filterData.title.trim();
    //                         filterData.title = this._filterData.title;
    //                     }
    //                     // const data = JSON.parse(JSON.stringify(this.filterData));
    //                     // this.filterData = {};
    //                     // for (const key in data) {
    //                     //     if (data[key]) {
    //                     //         this.filterData[key] = this.common.trimData(data[key]);
    //                     //     }
    //                     // }
    //                 }
    //
    //                 filterData = _.cloneDeep(filterData);
    //
    //                 console.log('aff this.filterData: ', this.filterData);
    //
    //                 if (loadOptions.sort !== null) {
    //                     filterData['order'] = loadOptions.sort[0].selector
    //                     if (loadOptions.sort[0].desc) {
    //                         // this.remotePaging['order'] += ' DESC';
    //                         filterData['order'] += '|DESC';
    //                     } else {
    //                         // this.remotePaging['order'] += ' ASC';
    //                         filterData['order'] += '|ASC';
    //                     }
    //                 }
    //
    //                 const checkUrl = this.common.checkMockupUrl('', '', filterData, {
    //                     BASE_API: GlobalVariable.BASE_API,
    //                     BASE_MODULE: GlobalVariable.BASE_MODULE,
    //                     BASE_RESOURCE: GlobalVariable.BASE_RESOURCE
    //                 });
    //
    //                 // console.log(checkUrl);
    //                 // console.log(checkUrl.url);
    //                 // console.log(checkUrl.filter);
    //                 // this.loadData = true;
    //
    //                 console.log('checkUrl.filter: ', checkUrl.filter);
    //                 this.loadData = true;
    //                 return this.request.get(checkUrl.url, checkUrl.filter)
    //                     .then(response => {
    //                         console.log(response);
    //                         setTimeout(() => {
    //                             this.loadData = false;
    //                         }, 200);
    //
    //                         const resultDescriptionDataNotFoundTitle = environment.resultDescriptionDataNotFoundTitle;
    //                         const resultDescriptionDataNotFoundMassage = environment.resultDescriptionDataNotFoundMassage;
    //
    //
    //                         // if (response && response.count > 0) {
    //                             let dataDataUsers = response.data;
    //                             //click row view description
    //                             for (let i = 0; i < this.dataDataUsers.length; i++) {
    //                                 dataDataUsers[i].sendDate = this.common.convertDate(moment(dataDataUsers[i].sendDate), 'DD/MM/YYYY HH:mm:ss');
    //                             }
    //                             this.dataDataUsers = dataDataUsers
    //
    //                             //num numUser Search Results 0 of 0 items
    //                             // this.numUser = response.count;
    //                             // if (this.numUser !== 0) {
    //                             //     let page = ((this.offset / this.limits) + 1);
    //                             //     this.textTotal = ' Search Results 0 of 0 items';
    //                             //     if ((((this.offset / this.limits) + 2) * this.limits) > this.numUser) {
    //                             //         this.dataResultItems = (page - 1) * this.limits + this.dataDataUsers.length;
    //                             //     } else {
    //                             //         this.dataResultItems = this.limits * page;
    //                             //     }
    //                             //     this.textTotal = 'Search Results ' + (this.offset + 1) + ' - ' + this.dataResultItems + ' of ' + this.numUser + ' items';
    //                             // } else {
    //                             //     this.textTotal = ' Search Results 0 of 0 items';
    //                             // }
    //
    //                             // this.loading = false;
    //                             // console.log(this.allowedPageSizes);
    //                         // } else {
    //                         //     this.loading = false;
    //                         //     this.dataUsers = {};
    //                         //     this.dataDataUsers = [];
    //                         //     this.numUser = 0;
    //                         //     this.textTotal = ' Search Results 0 of 0 items';
    //                         //     // this.goAlert(resultDescriptionDataNotFoundTitle, resultDescriptionDataNotFoundMassage, 'myModalError');
    //                         // }
    //                         // backData = this.dataDataUsers;
    //                         // backItemTotal = this.numUser;
    //
    //                         return {
    //                             data: this.dataDataUsers,
    //                             totalCount: this.numUser
    //                         };
    //                     })
    //                     .catch(error => {
    //                         setTimeout(() => {
    //                             this.loadData = false;
    //                         }, 200);
    //                         return {
    //                             data: [],
    //                             totalCount: this.numUser
    //                         };
    //                     });
    //
    //             } else {
    //                 console.log('Promise');
    //                 return Promise.resolve({
    //                     data: backData,
    //                     totalCount: backItemTotal
    //                 });
    //             }
    //         }
    //     });
    //     console.log(dataSource);
    //     return dataSource;
    // }

    viewNoti(url) {
        if (url) {
            window.location.replace(url);
        }
    }

    //show modal delete
    confirmDelete(id) {
        console.log(id);
        this.getIdDelete = id;
        this.disbledBtn = {
            'create': true
        };
        this.goAlert('', '', 'myModalDelete');
    }

    // async onOkDelete() {
    //     try {
    //         this.disbledBtn = {
    //             'create': true
    //         };
    //         let url = GlobalVariable.BASE_API + GlobalVariable.BASE_RESOURCE + GlobalVariable.BASE_RESOURCE_DELETE;
    //         // let url = GlobalVariable.BASE_API + GlobalVariable.BASE_RESOURCE + '/' + this.getIdDelete;
    //
    //         let data = {
    //             'username': this.getIdDelete
    //         };
    //
    //         const resultCodeSuccess = environment.resultCodeSuccess;
    //         const resultCodeDataNotFound = environment.resultCodeDataNotFound;
    //         const resultDescriptionDataNotFoundTitle = environment.resultDescriptionDataNotFoundTitle;
    //         const resultDescriptionDataNotFoundMassage = environment.resultDescriptionDataNotFoundMassage;
    //         const resultCodeDbError = environment.resultCodeDbError;
    //         const resultDescriptionDbErrorTitle = environment.resultDescriptionDbErrorTitle;
    //         const resultDescriptionDbErrorMassage = environment.resultDescriptionDbErrorMassage;
    //         const resultCodeDeleteDataAtHaveChild = environment.resultCodeDeleteDataAtHaveChild;
    //         const resultDescriptionDeleteDataAtHaveChildTitle = environment.resultDescriptionDeleteDataAtHaveChildTitle;
    //         const resultDescriptionDeleteDataAtHaveChildMassage = environment.resultDescriptionDeleteDataAtHaveChildMassage;
    //         const resultDescriptionSystemErrorTitle = environment.resultDescriptionSystemErrorTitle;
    //         const resultDescriptionSystemErrorMassage = environment.resultDescriptionSystemErrorMassage;
    //
    //         let response = await this.request.post(url, data);
    //
    //         // this.userMessage = response.userMessage;
    //         if (response.resultCode === resultCodeSuccess) {
    //             this.goAlert('', '', 'myModalSuccessDelete');
    //             this.dataUsers = this.customStore();
    //         } else if (response.resultCode === resultCodeDataNotFound) {
    //             this.goAlert(resultDescriptionDataNotFoundTitle, resultDescriptionDataNotFoundMassage, 'myModalError');
    //         } else if (response.resultCode === resultCodeDbError) {
    //             this.goAlert(resultDescriptionDbErrorTitle, resultDescriptionDbErrorMassage, 'myModalError');
    //         } else if (response.resultCode === resultCodeDeleteDataAtHaveChild) {
    //             this.goAlert(resultDescriptionDeleteDataAtHaveChildTitle, resultDescriptionDeleteDataAtHaveChildMassage, 'myModalError');
    //         } else {
    //             console.log('error');
    //             this.goAlert(resultDescriptionSystemErrorTitle, resultDescriptionSystemErrorMassage, 'myModalError');
    //         }
    //     } catch (e) {
    //         console.log(e);
    //         this.disbledBtn = {
    //             'create': false
    //         };
    //     }
    // }

    convertDate(date) {
        return moment(date).add(7, 'hours').format('D/M/YYYY HH:mm:ss');
    }

    onCancelDelete() {
        this.disbledBtn = {
            'create': false
        };
    }

    onCancelViewWarning() {
        console.log('onCancelViewWarning');
    }

    onCellPrepared(e) {
        e.cellElement.accessKey = e.column.caption;
    }

    onCloseModalError() {
        this.disbledBtn = {
            'create': false
        };
    }

    onCloseModalWarning() {
        this.disbledBtn = {
            'create': false
        };
    }

    onClickBack() {
        this.disbledBtn = {
            'create': false
        };
    }

    clickCollapse() {
        let collapse = this.common.collapseFn();
    }

    onCellHoverChanged(e) {
        // console.log(e.value);
        this.hoverTootip = e.value;
    }
}
