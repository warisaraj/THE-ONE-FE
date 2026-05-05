import {Component, OnInit, AfterViewInit, ViewChild} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {LayoutMenu} from '../../../shared/store/layout.menu.store';
import {Request} from '../../../shared/services/request.service';
import {Common} from '../../../shared/services/common.service';
import {FormBuilder} from '@angular/forms';
import {environment} from '../../../../environments/environment';
import {StoreService} from '../../../shared/services/store.service';

declare let $: any;

@Component({
    selector: 'app-view-menu',
    providers: [LayoutMenu, Request, Common],
    templateUrl: './view-menu.component.html',
})
export class ViewMenuComponent implements OnInit, AfterViewInit {

    @ViewChild('myModal') myModal;
    getDataMenus = [];
    menuId;
    dataEditMenus = {};
    dxgridPageSize;
    allowedPageSizes = environment.allowedPageSizes;
    offset;
    limits;
    orderby;
    textTotal = ' Search Results 0 of 0 Item';
    numMenus = 0;
    dataResultItems = 0;
    loadData = false;
    fieldsMenusList;
    checkClickSearch = false;
    filterData = {};
    resResultCode;
    inputSearchApi = '';
    dataMicroServices;
    getDataMicroserviceName;
    getDataMicroserviceDescription;
    getDataMicroserviceMenuIcon;
    loading = true;
    hoverTootip: any;
    dataMenus: any = [];
    disbledBtn = {
        'save': true,
        'cancel': true
    };
    menuHome: any = false;
    menuPermissions: any = {view: false, add: false, edit: false, delete: false};

    constructor(
        public router: Router,
        private fb: FormBuilder,
        private request: Request,
        public layoutMenu: LayoutMenu,
        private common: Common,
        private route: ActivatedRoute,
        private store: StoreService,
    ) {
        this.dxgridPageSize = environment.dxgridPageSize;

    }

    async ngOnInit() {
        this.store.subscribePagePermissionList().subscribe(pagePermissionList => {
            console.log('ngOnInit', pagePermissionList);
            const pagePermission = pagePermissionList.find(r => r.url === environment.roleURL.subMenus);
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
                        if (environment.roleURL.subMenus === element3.url) {
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
            this.router.navigate(['/menu', this.menuHome['menuId'], this.menuHome['typePage']]);
        }
    }

    async ngAfterViewInit() {
        try {
            await this.route.params.subscribe(params => {
                this.menuId = params.menuId;
            });
            console.log(this.menuId,"this.menuId")
            //
            this.loading = true;
            this.disbledBtn = {
                'save': true,
                'cancel': true
            };
            await this.getMicroservice();
            await this.getMenus();
            await this.textAreaAutoHeight();


            // this.dataGroups =   await this.customStore();

        } catch (e) {
            console.log(e);

            this.loading = false;
            const resultDescriptionSystemErrorTitle = environment.resultDescriptionSystemErrorTitle;
            const resultDescriptionSystemErrorMassage = environment.resultDescriptionSystemErrorMassage;
            this.goAlert(resultDescriptionSystemErrorTitle, resultDescriptionSystemErrorMassage, 'myModalError');
            console.log(e);
        }

    }

    async getMicroservice() {
        try {
            let menuId = this.menuId;
            let filterData = {
                filter: ''
            };

            this.filterData = {
                'menuId': menuId,
            };

            filterData = {
                filter: JSON.parse(JSON.stringify(this.filterData))
            };

            filterData.filter = JSON.stringify(filterData.filter);

            const checkUrl = this.common.checkMockupUrl('', '', filterData, {
                BASE_API: '',
                BASE_MODULE: environment.apiPrefix,
                BASE_RESOURCE: environment.searchMenus
            });

            const response = await this.request.get(checkUrl.url, checkUrl.filter);
            this.loading = false;
            // this.userMessage = response.userMessage;
            const resultCodeSuccess = environment.resultCodeSuccess;
            const resultCodeDataNotFound = environment.resultCodeDataNotFound;
            const resultDescriptionDataNotFoundTitle = environment.resultDescriptionDataNotFoundTitle;
            const resultDescriptionDataNotFoundMassage = environment.resultDescriptionDataNotFoundMassage;
            const resultDescriptionSystemErrorTitle = environment.resultDescriptionSystemErrorTitle;
            const resultDescriptionSystemErrorMassage = environment.resultDescriptionSystemErrorMassage;
            const resultCodeDbError = environment.resultCodeDbError;
            const resultDescriptionDbErrorTitle = environment.resultDescriptionDbErrorTitle;
            const resultDescriptionDbErrorMassage = environment.resultDescriptionDbErrorMassage;
            if (response.resultCode === resultCodeSuccess) {
                this.dataMicroServices = await response.resultData[0];
                this.getDataMicroserviceName = await this.dataMicroServices.menuName;
                this.getDataMicroserviceDescription = await this.dataMicroServices.description;
                this.getDataMicroserviceMenuIcon = await this.dataMicroServices.menuIcon;
                console.log(this.dataMicroServices);
            } else {
                console.log('errorrr');
                // this.goAlert(resultDescriptionSystemErrorTitle, resultDescriptionSystemErrorMassage, 'myModalError');
                this.goAlert(response.resultCode, response.resultDescription, 'myModalError');
            }

            this.loading = false;
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
            console.log(e);

        }
    }

    getMenus() {
        let filterData = {
            fields: '',
            filter: ''
        };

        console.log(this.menuId);
        console.log(this.inputSearchApi);
        console.log('else');
        this.filterData = {
            'menuId': this.menuId,
        };

        if (this.checkClickSearch === true) {
            filterData = {
                fields: this.fieldsMenusList,
                filter: JSON.parse(JSON.stringify(this.filterData))
            };
        } else {
            filterData = {
                fields: this.fieldsMenusList,
                filter: JSON.parse(JSON.stringify(this.filterData))
            };
        }

        filterData.filter = JSON.stringify(filterData.filter);

        const checkUrl = this.common.checkMockupUrl('', '', filterData, {
            BASE_API: '',
            BASE_MODULE: environment.apiPrefix,
            BASE_RESOURCE: environment.searchSubmenus
        });


        return this.request.get(checkUrl.url, checkUrl.filter)
            .then(response => {
                console.log(response);
                this.resResultCode = response.resultCode;
                const resultCodeSuccess = environment.resultCodeSuccess;
                const resultCodeDataNotFound = environment.resultCodeDataNotFound;
                const resultDescriptionDataNotFoundTitle = environment.resultDescriptionDataNotFoundTitle;
                const resultDescriptionDataNotFoundMassage = environment.resultDescriptionDataNotFoundMassage;
                const resultDescriptionSystemErrorTitle = environment.resultDescriptionSystemErrorTitle;
                const resultDescriptionSystemErrorMassage = environment.resultDescriptionSystemErrorMassage;
                if (+this.resResultCode === +resultCodeSuccess) {
                    this.getDataMenus = response.resultData;
                    console.log('this.getDataMenus: ', this.getDataMenus);
                    this.numMenus = response.rowCount;
                } else if (+this.resResultCode === +resultCodeDataNotFound) {
                    this.dataEditMenus = {};
                    this.getDataMenus = [];
                    this.numMenus = 0;
                    this.goAlert(resultDescriptionDataNotFoundTitle, resultDescriptionDataNotFoundMassage, 'myModalError');
                } else {
                    this.dataEditMenus = {};
                    this.getDataMenus = [];
                    this.numMenus = 0;
                    this.goAlert(resultDescriptionSystemErrorTitle, resultDescriptionSystemErrorMassage, 'myModalError');
                }


                for (let i = 0; i < this.getDataMenus.length; i++) {
                    this.getDataMenus[i] = {
                        'subMenuParentId': this.getDataMenus[i].subMenuParentId,
                        'subMenuId': this.getDataMenus[i].subMenuId,
                        'subMenuName': this.common.trimData(this.getDataMenus[i].subMenuName),
                        'url': this.getDataMenus[i].url,
                        'description': this.getDataMenus[i].description,
                        'editor': false,
                        'menuIcon': this.getDataMenus[i].menuIcon,
                        'newTap': this.getDataMenus[i].newTap,
                    };
                }
                this.getDataMenus = JSON.parse(JSON.stringify(this.getDataMenus));
                this.dataMenus = JSON.parse(JSON.stringify(this.getDataMenus));
                console.log('aff set this.getDataMenus: ', this.getDataMenus);
                console.log('aff set this.dataMenus: ', this.dataMenus);
                this.loading = false;

            })
            .catch(error => {
                console.log(error);

                setTimeout(() => {
                    this.loadData = false;
                }, 200);
                this.loading = false;

            });
    }

    textAreaAutoHeight() {
        const textAreaAutoHeight = this.common.textAreaAutoHeightFn();
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
        this.router.navigate(['/microservice-menus', this.menuId]);
    }

    onCloseModalError() {
        this.disbledBtn = {
            'save': false,
            'cancel': false
        };
    }

    onCellHoverChanged(e) {
        console.log(e.value);
        this.hoverTootip = e.value;
    }

}


