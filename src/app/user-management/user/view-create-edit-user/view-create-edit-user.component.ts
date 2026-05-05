import {Component, OnInit, AfterViewInit, ElementRef, ViewChild} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {Request} from '../../../shared/services/request.service';
import {Common} from '../../../shared/services/common.service';
import {FormGroup, FormBuilder, FormControl, Validators} from '@angular/forms';
import {environment} from '../../../../environments/environment';
import {StoreService} from '../../../shared/services/store.service';

@Component({
    selector: 'app-view-create-edit-user',
    providers: [Request, Common],
    templateUrl: './view-create-edit-user.component.html',
})
export class ViewCreateEditUserComponent implements OnInit, AfterViewInit {
    @ViewChild('myModal') myModal;
    action: any;
    id: any;
    dataUser: any = {
        username: '',
        firstname: '',
        lastname: '',
        email: '',
        telephoneNumber: '',
        admin: false,
        position: '',
    };
    userForm: FormGroup;
    microserviceId;
    microserviceGroupId;
    filterData: any = {};
    username: any;
    show = false;
    disabledView = false;
    pattern = {
        tel: /^[0-9]*$/,
        email: /([\w\.\-_]+)?\w+@[\w-_]+(\.\w+){1,}/,
        eng: /^[a-zA-Z_ ]*$/,
        th: /^[ก-๙$@$!%*?&#^-_. +]+$/,
        user: /[a-zA-Z0-9]$/,
    };
    loading = true;
    checkClickSave = false;
    disbledBtn = {
        'save': true,
        'cancel': true
    };
    menuHome: any = false;
    menuPermissions: any = {view: false, add: false, edit: false, delete: false};
    positionList: any = [];

    constructor(
        public router: Router,
        private fb: FormBuilder,
        private request: Request,
        private common: Common,
        private route: ActivatedRoute,
        private store: StoreService,
    ) {
        this.userForm = this.fb.group({
            'txtFirstname': new FormControl('', [Validators.required]),
            'txtLastname': new FormControl('', [Validators.required]),
            'txtEmail': new FormControl('', [Validators.required, Validators.pattern(this.pattern.email)]),
            'txtTelephoneNumber': new FormControl('', [Validators.pattern(this.pattern.tel)]),
            'txtUsername': new FormControl('', [Validators.required, Validators.pattern(this.pattern.user)]),
            'txtPosition': new FormControl('', []),
            'chkAdmin': new FormControl('')
        });
        console.log(this.userForm);
    }

    async ngOnInit() {
        const dropdown = await this.common.searchConfig();
        this.positionList = dropdown.positionList || [];
        this.store.subscribePagePermissionList().subscribe(pagePermissionList => {
            console.log('ngOnInit', pagePermissionList);
            const pagePermission = pagePermissionList.find(r => r.url === environment.roleURL.user);
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
                        if (environment.roleURL.user === element3.url) {
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
                console.log('params: ', params);
                this.action = params.action || '';
                // tslint:disable-next-line:max-line-length
                this.action = this.action === 'new' ? 'Create' : this.action === 'view' ? 'View' : this.action === 'edit' ? 'Edit' : this.action;
                this.username = params.username || '';
            });

            if (this.action === 'Create') {
                this.disabledView = false;
                this.dataUser.admin = false;
                this.userForm = this.fb.group({
                    'txtFirstname': new FormControl('', [Validators.required]),
                    'txtLastname': new FormControl('', [Validators.required]),
                    'txtEmail': new FormControl('', [Validators.required, Validators.pattern(this.pattern.email)]),
                    'txtTelephoneNumber': new FormControl('', [Validators.pattern(this.pattern.tel)]),
                    'txtUsername': new FormControl('', [Validators.required, Validators.pattern(this.pattern.user)]),
                    'txtPosition': new FormControl('', []),
                    'chkAdmin': new FormControl('')
                });
                this.loading = false;
                this.loading = false;
                this.disbledBtn = {
                    'save': false,
                    'cancel': false
                };
            } else if (this.action === 'Edit') {
                console.log('ngAfterViewInit');
                this.disabledView = false;
                this.userForm = this.fb.group({
                    'txtFirstname': new FormControl('', [Validators.required]),
                    'txtLastname': new FormControl('', [Validators.required]),
                    'txtEmail': new FormControl('', [Validators.required, Validators.pattern(this.pattern.email)]),
                    'txtTelephoneNumber': new FormControl('', [Validators.pattern(this.pattern.tel)]),
                    'txtUsername': new FormControl('', [Validators.required, Validators.pattern(this.pattern.user)]),
                    'txtPosition': new FormControl('', []),
                    'chkAdmin': new FormControl('')
                });
                await this.getData();
                this.loading = false;
                this.disbledBtn = {
                    'save': false,
                    'cancel': false
                };
            } else if (this.action === 'View') {
                this.disabledView = true;
                this.userForm = this.fb.group({
                    'txtFirstname': new FormControl('', [Validators.required]),
                    'txtLastname': new FormControl('', [Validators.required]),
                    'txtEmail': new FormControl('', [Validators.required, Validators.pattern(this.pattern.email)]),
                    'txtTelephoneNumber': new FormControl('', [Validators.pattern(this.pattern.tel)]),
                    'txtUsername': new FormControl('', [Validators.required, Validators.pattern(this.pattern.user)]),
                    'chkAdmin': new FormControl(''),
                    'txtPosition': new FormControl('', []),
                });

                await this.getData();
                this.loading = false;
                this.disbledBtn = {
                    'save': false,
                    'cancel': false
                };
            }
            console.log('this.userForm: ', this.action);
        } catch (e) {
            console.log(e);
            const resultDescriptionSystemErrorTitle = environment.resultDescriptionSystemErrorTitle;
            const resultDescriptionSystemErrorMassage = environment.resultDescriptionSystemErrorMassage;
            this.goAlert(resultDescriptionSystemErrorTitle, resultDescriptionSystemErrorMassage, 'myModalError');
        }
    }
    async getData() {
        try {
            const username = this.username;
            let filterData = {
                filter: ''
            };
            this.filterData = {
                'username': username,
            };

            filterData = {
                filter: JSON.parse(JSON.stringify(this.filterData))
            };

            filterData.filter = JSON.stringify(filterData.filter);

            const checkUrl = this.common.checkMockupUrl('', '', filterData, {
                BASE_API: '',
                BASE_MODULE: environment.apiPrefix,
                BASE_RESOURCE: environment.searchUserById
            });

            const response = await this.request.get(checkUrl.url, checkUrl.filter);
            const resultCodeSuccess = environment.resultCodeSuccess;
            this.loading = false;
            if (response.resultCode === resultCodeSuccess) {
                this.dataUser = response.resultData[0];
                console.log(this.dataUser);
            } else {
                this.goAlert(response.resultCode, response.resultDescription, 'myModalError');
            }
            this.loading = false;

        } catch (e) {
            console.log(e);
            this.loading = false;
            const resultDescriptionSystemErrorTitle = environment.resultDescriptionSystemErrorTitle;
            const resultDescriptionSystemErrorMassage = environment.resultDescriptionSystemErrorMassage;
            this.goAlert(resultDescriptionSystemErrorTitle, resultDescriptionSystemErrorMassage, 'myModalError');
        }
    }

    btnEdit() {
        // edit click
        console.log('edit');
        setTimeout(() => {
            this.router.navigate(['/user', this.username, 'edit']);
        }, 5);
        this.disabledView = false;

    }

    checkRequiredData() {
        const patternError = [];
        for (const key in this.userForm.controls) {
            if (this.userForm.controls[key].errors) {
                if (key === 'txtEmail' || key === 'txtTelephoneNumber' || key === 'txtUsername') {
                    if (this.userForm.controls[key].errors.pattern) {
                        if (key === 'txtEmail') {
                            patternError.push('E-mail');
                        } if (key === 'txtUsername') {
                            patternError.push('Username');
                        }
                        else {
                            patternError.push('Mobile number');
                        }

                    } else {
                        this.userForm.controls[key].setErrors({'forceRequired': true});
                        this.userForm.controls[key].markAsDirty();
                    }

                } else {
                    this.userForm.controls[key].setErrors({'forceRequired': true});
                    this.userForm.controls[key].markAsDirty();
                }
            } else {
                this.userForm.controls[key].updateValueAndValidity();
            }
        }

        if (!this.userForm.valid) {
            console.log('---------------------')
            if (patternError.length) {
                this.goAlert('Field is invalid', `Please enter a valid ${patternError.join(' ,')} format.`, 'myModalWarning');
            } else {
                this.goAlert('Field is required', 'Your have left a field empty and a value must be entered.', 'myModalWarning');
            }
        }
        return this.userForm.valid;
    }

    async btnSave() {
        // click btnsave
        this.disbledBtn = {
            'save': true,
            'cancel': true
        };
        console.log(this.userForm.controls);
        if (!this.checkRequiredData()) {
            console.log('กรุณากรอกข้อมูลให้ถูกต้อง');

            this.disbledBtn = {
                'save': false,
                'cancel': false
            };
            return;
        }
        this.checkClickSave = true;
        const requiredUsername: boolean = this.checkUsername();
        const requiredFirstname: boolean = this.checkFirstname();
        const requiredLastname: boolean = this.checkLastname();
        const requiredEmail: boolean = this.checkEmail();
        // const requiredTelephoneNumber: boolean = this.checkTelephoneNumber();
        const patternUsername: boolean = this.checkUsername();


        console.log(
            'requiredUsername:', requiredUsername,
            'requiredFirstname:', requiredFirstname,
            'requiredLastname:', requiredLastname,
            'requiredEmail:', requiredEmail,
        );
        const resultCodeSuccess = environment.resultCodeSuccess;
        // tslint:disable-next-line:max-line-length
        if (requiredUsername && requiredFirstname && requiredLastname && requiredEmail) {
            console.log('test');
            const u_username = this.common.trimData(this.dataUser.username);
            const addData = {
                'username': this.common.trimData(this.dataUser.username),
                'firstname': this.common.trimData(this.dataUser.firstname),
                'lastname': this.common.trimData(this.dataUser.lastname),
                'email': this.common.trimData(this.dataUser.email),
                'telephoneNumber': this.common.trimData(this.dataUser.telephoneNumber),
                'admin': this.dataUser.admin === true ? 1 : 0,
                'position': this.dataUser.position
            };
            console.log(addData);
            let response;
            if (this.action === 'Create') {
                console.log('Create');
                const checkUrl = this.common.checkMockupUrl('', '', {}, {
                    BASE_API: '',
                    BASE_MODULE: environment.apiPrefix,
                    BASE_RESOURCE: environment.createUser
                });

                response = await this.request.post(checkUrl.url, addData);
            } else {
                // edit click
                const checkUrl = this.common.checkMockupUrl('', '', {}, {
                    BASE_API: '',
                    BASE_MODULE: environment.apiPrefix,
                    BASE_RESOURCE: environment.updateUser
                });
                response = await this.request.post(checkUrl.url, addData);
            }
            if (response.resultCode === resultCodeSuccess) {
                console.log('>>>>');

                if (this.action === 'Edit') {
                    console.log('>>>>' + 'edit');
                    this.goAlert('', '', 'myModalEditSuccess');
                } else {
                    console.log('>>>>' + u_username);
                    this.goAlert(u_username, '', 'myModalSuccessUser');
                }

                this.disbledBtn = {
                    'save': true,
                    'cancel': true
                };
            } else {
                this.goAlert(response.resultCode, response.resultDescription, 'myModalError');
            }
            this.checkClickSave = false;

        }else {
            console.log('กรุณากรอกข้อมูลให้ถูกต้อง');
            this.goAlert('Field is required', 'Your have left a field empty and a value must be entered.', 'myModalWarning');
            this.checkClickSave = false;
            this.disbledBtn = {
                'save': true,
                'cancel': true
            };
        }

    }

    checkUsername() {
        if (this.common.trimData(this.dataUser.username) === '' || this.userForm.controls['txtUsername'].errors) {
            this.userForm.controls['txtUsername'].setErrors({'forceRequired': true});
            this.userForm.controls['txtUsername'].markAsDirty();
            return false;
        } else {
            this.userForm.controls['txtUsername'].updateValueAndValidity();
            return true;
        }
    }

    checkFirstname() {
        console.log(this.userForm.controls['txtFirstname']);
        console.log(this.userForm.controls['txtFirstname'].errors);
        console.log(this.dataUser.firstname);
        if (this.common.trimData(this.dataUser.firstname) === '' || this.userForm.controls['txtFirstname'].errors) {
            console.log('txtFirstname');
            this.userForm.controls['txtFirstname'].setErrors({'forceRequired': true});
            this.userForm.controls['txtFirstname'].markAsDirty();
            return false;
        } else {
            console.log('txtFirstnamefgfgfgfgfgEN');
            this.userForm.controls['txtFirstname'].updateValueAndValidity();
            return true;
        }
    }

    checkLastname() {
        console.log(this.userForm.controls['txtLastname']);
        console.log(this.userForm.controls['txtLastname'].errors);
        console.log(this.dataUser.lastname);
        if (this.common.trimData(this.dataUser.lastname) === '' || this.userForm.controls['txtLastname'].errors) {
            console.log('txtLastname');
            this.userForm.controls['txtLastname'].setErrors({'forceRequired': true});
            this.userForm.controls['txtLastname'].markAsDirty();
            return false;
        } else {
            console.log('ghghgh');
            this.userForm.controls['txtLastname'].updateValueAndValidity();

            return true;
        }
    }

    checkEmail() {
        if (this.common.trimData(this.dataUser.email) === '' || this.userForm.controls['txtEmail'].errors) {
            this.userForm.controls['txtEmail'].setErrors({'forceRequired': true});
            this.userForm.controls['txtEmail'].markAsDirty();
            return false;
        } else {
            this.userForm.controls['txtEmail'].updateValueAndValidity();
            return true;
        }
    }

    checkTelephoneNumber() {
        console.log(this.userForm.controls['txtTelephoneNumber']);
        console.log(this.userForm.controls['txtTelephoneNumber'].errors);
        if (this.common.trimData(this.dataUser.telephoneNumber) === '' || this.userForm.controls['txtTelephoneNumber'].errors) {
            this.userForm.controls['txtTelephoneNumber'].setErrors({'forceRequired': true});
            this.userForm.controls['txtTelephoneNumber'].markAsDirty();
            return false;
        } else {
            this.userForm.controls['txtTelephoneNumber'].updateValueAndValidity();
            return true;
        }
    }

    checkPassword() {
        return true;
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
        this.router.navigate(['/user']);
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

    // input no space ex.user and password
    eventHandler(event) {
        // console.log(event, event.keyCode, event.keyIdentifier);
        if (event.which === 32) {
            return false;
        }
    }
}
