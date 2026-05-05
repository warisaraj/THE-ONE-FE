import {Injectable} from '@angular/core';
import {HttpService} from './http.service';
import {environment} from '../../../environments/environment';

@Injectable()
export class AuthService {

    configuredIP = '';
  // configuredIP = environment.ip || '';
  constructor(private http: HttpService) {
  }

  async isLoggedIn() {
    try {
      const resultObj = await this.http.get(this.configuredIP + '/loggedin');
      return !resultObj.hasOwnProperty('error');
    } catch (err) {
      return false;
    }
  }

}
