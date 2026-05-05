import {Injectable} from '@angular/core';
import {Headers, Http, RequestOptions, Response} from '@angular/http';
import {environment} from '../../../environments/environment';
import {User} from '../_models/index';
import {Observable} from 'rxjs/Observable';
import * as moment from 'moment';


@Injectable()
export class UserService {
    userMenu: any;
    prefix = environment.ip + environment.apiPrefix;

    constructor(private http: Http) {
    }

    verify() {
        let role = '';
        try {
            if (sessionStorage.getItem('role')) {
                role = `?role=${sessionStorage.getItem('role')}`;
            }
        } catch (error) {
            console.log(error);
        }

        // tslint:disable-next-line:max-line-length
        return this.http.get(this.prefix + '/login/searchUserMenu' + role, this.jwt()).map((response: Response) => response.json());
    }

    forgotPassword(email: string) {
        return this.http.post('/api/forgot-password', JSON.stringify({email}), this.jwt()).map((response: Response) => response.json());
    }

    getAll() {
        // tslint:disable-next-line:max-line-length
        return this.http.get(this.prefix + '/searchUser', this.jwt()).map((response: Response) => response.json());
    }

    getById(id: number) {
        return this.http.get(this.prefix + '/searchUserById/' + id, this.jwt()).map((response: Response) => response.json());
    }

    create(user: User) {
        return this.http.post(this.prefix + '/createUser', user, this.jwt()).map((response: Response) => response.json());
    }

    update(user: User) {
        return this.http.put(this.prefix + '/updateUser/' + user.id, user, this.jwt()).map((response: Response) => response.json());
    }

    delete(id: number) {
        return this.http.delete(this.prefix + '/deleteUser/' + id, this.jwt()).map((response: Response) => response.json());
    }

    private makeid(length) {
        let result = '';
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const charactersLength = characters.length;
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() *
              charactersLength));
        }
        return result;
    }

    private jwt() {
        // create authorization header with jwt token
        const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
        if (currentUser && currentUser.token) {
            const sessionId = `BIH-${moment().format('YYYYMMDDHHmmss')}${this.makeid(5)}`;
            const headers = new Headers({
                'x-token': '1',
                'Authorization': 'Bearer ' + currentUser.token,
                'Content-Type': 'application/json',
                'X-Session-Id': sessionId,
                'X-Rtid': sessionId,
                'X-Tid': sessionId,
            });
            return { headers: headers };
        }
        return {};
    }
}
