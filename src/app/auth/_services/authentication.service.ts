import {Injectable} from '@angular/core';
import {Http, Response, RequestOptions, Headers} from '@angular/http';
import 'rxjs/add/operator/map';
import {environment} from '../../../environments/environment';
import * as CryptoJS from 'crypto-js';

@Injectable()
export class AuthenticationService {

    constructor(private http: Http) {
    }

    login(username: string, password: string) {
        let pass = this.encryptPassword(username, password);
        let headers = new Headers({'x-token': '1'});
        let options = new RequestOptions({headers: headers});

        let fcm_token = sessionStorage.getItem('fcm_token');

        return this.http.post(environment.ip + environment.apiPrefix + '/login/login', {
            username: username,
            password: pass,
            fcm_token: fcm_token
        }, options)
            .map((response: Response) => {
                // login successful if there's a jwt token in the response
                let data = response.json();

                return data;
            });
    }

    logout() {
        // remove user from local storage to log user out
        sessionStorage.removeItem('currentUser');
    }

    encryptPassword(username, password) {
        return CryptoJS.AES.encrypt(password, username).toString();
    }

}
