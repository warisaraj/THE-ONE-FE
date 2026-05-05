import { Component, ComponentFactoryResolver, OnInit, ElementRef, ViewChild, ViewContainerRef, ViewEncapsulation, } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthenticationService } from './_services/authentication.service';
import { AlertService } from './_services/alert.service';
import { UserService } from './_services/user.service';
import { AlertComponent } from './_directives/alert.component';
import { FormGroup, FormBuilder, FormControl, Validators } from '@angular/forms';
import { Request } from '../shared/services/request.service';
import { environment } from '../../environments/environment';
import * as CryptoJS from 'crypto-js';
import { Common } from "../shared/services/common.service";

declare let $: any;
declare let mUtil: any;

// import { Component, OnInit, AfterViewInit, ElementRef, Input, ViewChild} from '@angular/core';
@Component({
    selector: '.m-grid.m-grid--hor.m-grid--root.m-page',
    templateUrl: './templates/login-0.component.html',
    encapsulation: ViewEncapsulation.None,
    styleUrls: ['./auth.component.css']
})

export class AuthComponent implements OnInit {
    @ViewChild('txtPassword') txtPassword: ElementRef;
    @ViewChild('myModal') myModal;
    model: any = { username: '', password: '' };
    loading = false;
    returnUrl: string;
    typePage = 'login';
    userToken: any = '';
    roles: any = [];
    roleSelected: any = null;
    dataUser: any = {
        username: '',
        firstname: '',
        lastname: '',
        email: '',
        telephoneNumber: '',
        password: '',
        confirm_password: '',
        admin: false,
        position: ''
    };
    loginSubmit: any = false;
    userForm: FormGroup;
    pattern = {
        tel: /^[0-9]*$/,
        email: /([\w\.\-_]+)?\w+@[\w-_]+(\.\w+){1,}/,
        eng: /^[a-zA-Z_ ]*$/,
        th: /^[ก-๙$@$!%*?&#^-_. +]+$/,
        user: /[a-zA-Z0-9]$/,
        password: /^[a-zA-Z0-9!@#$%^&*()_+-|~=\`{}:";'<>?,.]{8,}$/
    };
    positionList: any = [];
    @ViewChild('alertSignin',
        { read: ViewContainerRef }) alertSignin: ViewContainerRef;
    @ViewChild('alertSignup',
        { read: ViewContainerRef }) alertSignup: ViewContainerRef;
    @ViewChild('alertForgotPass',
        { read: ViewContainerRef }) alertForgotPass: ViewContainerRef;
    textShowHide = true;
    isFormat = true;

    constructor(
        private _router: Router,
        // private _script: ScriptLoaderService,
        private _userService: UserService,
        private _route: ActivatedRoute,
        private _authService: AuthenticationService,
        private _alertService: AlertService,
        private cfr: ComponentFactoryResolver,
        private fb: FormBuilder,
        private request: Request,
        private common: Common,
    ) {
    }

    async ngOnInit() {
        this.model.remember = true;
        const dropdown = await this.common.searchConfig();
        this.positionList = dropdown.positionList || [];
        this.returnUrl = this._route.snapshot.queryParams['returnUrl'] || '/';
        this.userForm = this.fb.group({
            'txtFirstname': new FormControl('', [Validators.required]), // , Validators.pattern(this.pattern.eng)
            'txtLastname': new FormControl('', [Validators.required]), //, Validators.pattern(this.pattern.eng)
            'txtEmail': new FormControl('', [Validators.required, Validators.pattern(this.pattern.email)]),
            'txtTelephoneNumber': new FormControl('', [Validators.required, Validators.pattern(this.pattern.tel)]),
            'txtUsername': new FormControl('', []),//Validators.required, Validators.pattern(this.pattern.user)
            'txtPosition': new FormControl(''),
            'chkAdmin': new FormControl('')
        });

        if (sessionStorage.getItem('verifyErrorResultCode')) {
            let resultCode = sessionStorage.getItem('verifyErrorResultCode');
            let resultDescription = sessionStorage.getItem('verifyErrorResultDescription');
            sessionStorage.setItem('verifyErrorResultCode', '');
            sessionStorage.setItem('verifyErrorResultDescription', '');

            this.goAlert(resultCode, resultDescription, 'myModalError');
        }
    }

    eventHandler(event) {
        // console.log(event, event.keyCode, event.keyIdentifier);
        if (event.which === 32) {
            return false;
        }
    }

    goToHome() {
        console.log(this.returnUrl);
        var parameters = '';
        if (this.returnUrl && this.returnUrl.split('?') && this.returnUrl.split('?').length > 1) {
            console.log('>>go if ', this.returnUrl);
            parameters = this.returnUrl.split('?')[1];
            console.log(parameters);
            var obj: any = parameters.split('&').reduce(function (prev, curr, i, arr) {
                var p = curr.split('=');
                prev[decodeURIComponent(p[0])] = decodeURIComponent(p[1]);
                return prev;
            }, {});
            console.log('obj', obj);
            if (obj) {
                delete obj.token;
            }
            this._router.navigate([this.returnUrl.split('?')[0]], { queryParams: obj });
        } else {
            console.log('>>go else ', this.returnUrl);
            if (this.returnUrl === '' || this.returnUrl === '/') {
                this._router.navigate(['/home']);
            } else {
                this._router.navigate([this.returnUrl]);
            }


        }
    }

    onClickBack() {
        this.typePage = 'login';
    }

    toggleShow() {
        // this.show = !this.show;
        if (this.textShowHide) {
            // this.textShowHide = "Hide";
            this.textShowHide = false;
            this.txtPassword.nativeElement.type = 'text';
        } else {
            // this.textShowHide = "Show";
            this.textShowHide = true;
            this.txtPassword.nativeElement.type = 'password';
        }
        // this.show2 = !this.show2;
        // if (this.show2) {
        //   // this.textShowHide = "Hide";
        //   this.textShowHide2 = false;
        //   // this.input.nativeElement.type = "text";
        //   this.input2.nativeElement.type = "text";
        // } else {
        //   // this.textShowHide = "Show";
        //   this.textShowHide2 = true;
        //   // this.input.nativeElement.type = "password";
        //   this.input2.nativeElement.type = "password";
        // }
    }

    selectRole() {
        if (this.roleSelected) {

            sessionStorage.setItem('currentUser', JSON.stringify({ token: this.userToken }));
            sessionStorage.setItem('role', this.roleSelected);
            this.loading = true;

            // const resultDescriptionSystemErrorTitle = environment.resultDescriptionSystemErrorTitle;
            // const resultDescriptionSystemErrorMassage = environment.resultDescriptionSystemErrorMassage;
            // console.log("_userService.verify()");

            // this._userService.verify()
            // .map(
            //     data => {
            //       console.log("data",data);
            // if (data.resultCode == '20000') {
            this.goToHome();
            setTimeout(() => {
                this.loading = false;
            }, 500);

            // }else{
            //     this.goAlert(response.resultCode, response.resultDescription, 'myModalError');
            //     this.onClickBack();
            //     sessionStorage.clear()
            //   }
            // });


        } else {
            this.showAlert('alertSignin');
            this._alertService.error('Please Select Role.');
        }

    }

    signin() {
        this.loginSubmit = true;

        let regex = /[a-zA-Z0-9]$/;
        console.log(regex.test(this.model.username));
        if (!regex.test(this.model.username)) {
            this.isFormat = false
        } else {
            this.isFormat = true
        }

        if (!this.model.username || !this.model.password || !this.isFormat) {
            return;
        }

        this.loginSubmit = false;
        this.loading = true;
        this.userToken = '';
        this.roles = [];
        this.roleSelected = null;

        this._authService.login(this.model.username.toLowerCase(), this.model.password).subscribe(
            data => {
                this.loading = false;
                console.log(data);

                if (data.resultCode == 20000) {
                    this.userToken = data.resultData.userToken;
                    let roles = data.resultData.roles || [];
                    let roles_ = [];
                    console.log('roles', roles);

                    for (const i in roles) {
                        if (roles_.indexOf(roles[i].roleName) === -1) {
                            roles_.push(roles[i].roleName);
                        }
                    }


                    this.roles = roles_;
                    if (!data.resultData.userId) {

                        // this.typePage = 'register';
                        // tslint:disable-next-line:max-line-length
                        this.goAlert('Please check your username and password', 'If you still can\'t log in, contact your Vitallife administrator.', 'myModalWarning');
                        this.dataUser = {
                            username: '',
                            firstname: '',
                            lastname: '',
                            email: '',
                            telephoneNumber: '',
                            password: '',
                            confirm_password: '',
                            admin: false,
                            position: ''
                        };
                        for (const key in this.userForm.controls) {
                            this.userForm.controls[key].reset();
                        }
                    } else {
                        if (roles_.length === 0) {
                            this.goAlert('Role not found.', 'Your account doesn\'t have a role assigned.<br/> Please contact the administrator to set your role and permissions.', 'myModalWarning');
                            this.onClickBack();
                            return;
                        }

                        if (roles_.length === 1) {

                            sessionStorage.setItem('currentUser', JSON.stringify({ token: this.userToken }));
                            sessionStorage.setItem('role', roles_[0]);
                            this.loading = true;
                            this.goToHome();
                            setTimeout(() => {
                                this.loading = false;
                            }, 500);
                            return;
                        }


                        this.typePage = 'select-role';
                    }
                    // console.log('this.typePage', this.typePage);
                    // this._router.navigate([this.returnUrl]);
                } else {
                    this.showAlert('alertSignin');
                    this._alertService.error(data.resultDescription);
                    this.loading = false;
                }
                //
            },
            error => {
                this.showAlert('alertSignin');
                this._alertService.error(error);
                this.loading = false;
            });
    }

    trimData(data) {
        if (data === undefined || data === null || data === 'null') {
            return data;
        } else {
            return data.trim();
        }

    }

    encryptPassword(username, password) {
        return CryptoJS.AES.encrypt(password, username).toString();
    }

    goAlert(userTitle, userMessage, modalId) {
        console.log(this.myModal);

        const dataAlert = {
            'modalId': modalId,
            'userTitle': userTitle,
            'userMessage': userMessage
        };
        this.myModal.openModal(dataAlert);
    }


    checkRequiredData() {
        let patternError = [];
        for (const key in this.userForm.controls) {
            if (this.userForm.controls[key].errors) {
                if (key === 'txtEmail' || key === 'txtTelephoneNumber') {
                    if (this.userForm.controls[key].errors.pattern) {
                        if (key === 'txtEmail') {
                            patternError.push('E-mail');
                        } else {
                            patternError.push('Mobile number');
                        }

                    } else {
                        this.userForm.controls[key].setErrors({ 'forceRequired': true });
                        this.userForm.controls[key].markAsDirty();
                    }

                } else {
                    this.userForm.controls[key].setErrors({ 'forceRequired': true });
                    this.userForm.controls[key].markAsDirty();
                }
            } else {
                this.userForm.controls[key].updateValueAndValidity();
            }
        }

        if (!this.userForm.valid) {
            if (patternError.length) {
                this.goAlert('Field is invalid', `Please enter a valid ${patternError.join(' ,')} format.`, 'myModalWarning');
            } else {
                this.goAlert('Field is required', 'Your have left a field empty and a value must be entered.', 'myModalWarning');
            }
        }
        return this.userForm.valid;
    }


    async onRegister() {
        // this.goAlert('', '', 'myModalSuccess');
        console.log(this.userForm);
        let required = this.checkRequiredData();
        if (!required) {
            return;
        }
        // this.checkClickSave = true;
        const requiredUsername: boolean = this.checkUsername();
        const requiredFirstname: boolean = this.checkFirstname();
        const requiredLastname: boolean = this.checkLastname();
        const requiredEmail: boolean = this.checkEmail();
        const requiredTelephoneNumber: boolean = this.checkTelephoneNumber();
        const requiredPassword: boolean = this.checkPassword();

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
        // const resultDescriptionDataExistedMassage = environment.resultDescriptionDataExistedMassage;
        // console.log('action',this.action);
        // console.log('this.dataUser.username',this.dataUser);
        console.log('action', requiredUsername && requiredFirstname && requiredLastname && requiredEmail && requiredTelephoneNumber && requiredPassword);
        if (requiredUsername && requiredFirstname && requiredLastname && requiredEmail && requiredTelephoneNumber && requiredPassword) {
            console.log('test');
            let addData = {
                'username': this.model.username,
                'firstname': this.trimData(this.dataUser.firstname),
                'lastname': this.trimData(this.dataUser.lastname),
                'email': this.trimData(this.dataUser.email),
                'telephoneNumber': this.trimData(this.dataUser.telephoneNumber),
                'password': '',//this.dataUser.password,
                'admin': this.dataUser.admin,
                'position': this.dataUser.position,
            };
            // if(addData.password){
            //   addData.password = this.encryptPassword(addData.username,addData.password);
            // }

            let response;


            response = await this.request.postWithToken('/api/v1/bih/user/createUser', addData, this.userToken);


            const userMessageAlreadyExisted = response.userMessage;
            const resultDescriptionDataExistedMassage = environment.resultDescriptionDataExistedMassage;
            if (response.resultCode === resultCodeSuccess) {
                // this.goAlert('','' , 'myModalSuccess');
                // this.typePage = 'select-role';
                // this.typePage = 'login';
                this.goAlert('', '', 'myModalSuccess');
            } else {
                // this.goAlert(resultDescriptionSystemErrorTitle, resultDescriptionSystemErrorMassage, 'myModalError');
                // this.showAlert('alertSignin');
                // this._alertService.error(response.resultDescription);
                this.showAlert('alertSignin');
                this._alertService.error(response.resultDescription);
                console.log(response.resultDescription);

            }
            // this.checkClickSave = false;

        } else {

        }

    }

    checkUsername() {
        // if (this.trimData(this.dataUser.username) === '' || this.userForm.controls['txtUsername'].errors) {
        //   this.userForm.controls['txtUsername'].setErrors({ 'forceRequired': true });
        //   this.userForm.controls['txtUsername'].markAsDirty();
        //   return false;
        // } else {
        //   this.userForm.controls['txtUsername'].updateValueAndValidity();
        return true;
        // }
    }

    checkFirstname() {
        console.log(this.userForm.controls['txtFirstname']);
        console.log(this.userForm.controls['txtFirstname'].errors);
        console.log(this.dataUser.firstname);
        if (this.trimData(this.dataUser.firstname) === '' || this.userForm.controls['txtFirstname'].errors) {
            console.log('txtFirstname');
            this.userForm.controls['txtFirstname'].setErrors({ 'forceRequired': true });
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
        if (this.trimData(this.dataUser.lastname) === '' || this.userForm.controls['txtLastname'].errors) {
            console.log('txtLastname');
            this.userForm.controls['txtLastname'].setErrors({ 'forceRequired': true });
            this.userForm.controls['txtLastname'].markAsDirty();
            return false;
        } else {
            console.log('ghghgh');
            this.userForm.controls['txtLastname'].updateValueAndValidity();

            return true;
        }
    }

    checkEmail() {
        if (this.trimData(this.dataUser.email) === '' || this.userForm.controls['txtEmail'].errors) {
            this.userForm.controls['txtEmail'].setErrors({ 'forceRequired': true });
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
        if (this.trimData(this.dataUser.telephoneNumber) === '' || this.userForm.controls['txtTelephoneNumber'].errors) {
            this.userForm.controls['txtTelephoneNumber'].setErrors({ 'forceRequired': true });
            this.userForm.controls['txtTelephoneNumber'].markAsDirty();
            return false;
        } else {
            this.userForm.controls['txtTelephoneNumber'].updateValueAndValidity();
            return true;
        }
    }

    checkPassword() {
        return true;
        //
        // console.log(this.userForm.controls['txtPassword'].errors);
        // if (this.trimData(this.dataUser.password) === '' || this.userForm.controls['txtPassword'].errors) {
        //   // this.userForm.controls['txtPassword'].setErrors({ 'forceRequired': true });
        //   this.userForm.controls['txtPassword'].markAsDirty();
        //   return false;
        // } else {
        //   this.userForm.controls['txtPassword'].updateValueAndValidity();
        //   return true;
        // }
    }

    showAlert(target) {
        this[target].clear();
        let factory = this.cfr.resolveComponentFactory(AlertComponent);
        let ref = this[target].createComponent(factory);
        ref.changeDetectorRef.detectChanges();
    }

    handleSignInFormSubmit() {
        $('#m_login_signin_submit').click((e) => {
            let form = $(e.target).closest('form');
            form.validate({
                rules: {
                    username: {
                        required: true,
                    },
                    password: {
                        required: true,
                    },
                },
            });
            if (!form.valid()) {
                e.preventDefault();
                return;
            }
        });
    }

    displaySignUpForm() {
        let login = document.getElementById('m_login');
        mUtil.removeClass(login, 'm-login--forget-password');
        mUtil.removeClass(login, 'm-login--signin');

        mUtil.addClass(login, 'm-login--signup');
        mUtil.animateClass(login.getElementsByClassName('m-login__signup')[0], 'flipInX animated');
    }

    displaySignInForm() {
        let login = document.getElementById('m_login');
        mUtil.removeClass(login, 'm-login--forget-password');
        mUtil.removeClass(login, 'm-login--signup');
        try {
            $('form').data('validator').resetForm();
        } catch (e) {
        }

        mUtil.addClass(login, 'm-login--signin');
        mUtil.animateClass(login.getElementsByClassName('m-login__signin')[0], 'flipInX animated');
    }

    displayForgetPasswordForm() {
        let login = document.getElementById('m_login');
        mUtil.removeClass(login, 'm-login--signin');
        mUtil.removeClass(login, 'm-login--signup');

        mUtil.addClass(login, 'm-login--forget-password');
        mUtil.animateClass(login.getElementsByClassName('m-login__forget-password')[0], 'flipInX animated');
    }

    handleFormSwitch() {
        document.getElementById('m_login_forget_password').addEventListener('click', (e) => {
            e.preventDefault();
            this.displayForgetPasswordForm();
        });

        document.getElementById('m_login_forget_password_cancel').addEventListener('click', (e) => {
            e.preventDefault();
            this.displaySignInForm();
        });

        document.getElementById('m_login_signup').addEventListener('click', (e) => {
            e.preventDefault();
            this.displaySignUpForm();
        });

        document.getElementById('m_login_signup_cancel').addEventListener('click', (e) => {
            e.preventDefault();
            this.displaySignInForm();
        });
    }

    handleSignUpFormSubmit() {
        document.getElementById('m_login_signup_submit').addEventListener('click', (e) => {
            let btn = $(e.target);
            let form = $(e.target).closest('form');
            form.validate({
                rules: {
                    fullname: {
                        required: true,
                    },
                    email: {
                        required: true,
                        email: true,
                    },
                    password: {
                        required: true,
                    },
                    rpassword: {
                        required: true,
                    },
                    agree: {
                        required: true,
                    },
                },
            });
            if (!form.valid()) {
                e.preventDefault();
                return;
            }
        });
    }

    handleForgetPasswordFormSubmit() {
        document.getElementById('m_login_forget_password_submit').addEventListener('click', (e) => {
            let btn = $(e.target);
            let form = $(e.target).closest('form');
            form.validate({
                rules: {
                    email: {
                        required: true,
                        email: true,
                    },
                },
            });
            if (!form.valid()) {
                e.preventDefault();
                return;
            }
        });
    }

}
