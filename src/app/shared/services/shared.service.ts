import { Injectable } from '@angular/core';
import { Headers, Http } from '@angular/http';
import 'rxjs/add/operator/toPromise';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

@Injectable()
export class SharedService {
  dataTypePage: any;
  redirectPage: any;
  dataMenu: any;
  loading: any;
  constructor() {
  // constructor(private http: Http) {
    this.dataTypePage = {};
    this.dataMenu = [];
    this.loading = '';
    this.redirectPage = '';
    console.log(this.dataTypePage);
  }

}
