import { Injectable } from '@angular/core';
import { Http, Response, Headers, RequestOptions, URLSearchParams } from '@angular/http';
import { Observable } from 'rxjs';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import 'rxjs/add/operator/map';

@Injectable()
export class StoreService {


  private _userSubject = new BehaviorSubject({username:''});
  private _menuSubject = new BehaviorSubject({});
  private _menuFavoriteSubject = new BehaviorSubject([]);
  private _permissionSubject = new BehaviorSubject({});

  private _pagePermissionListSubject = new BehaviorSubject([]);
  constructor(private http: Http) {

  }

  public subscribePagePermissionList() {
    return this._pagePermissionListSubject.asObservable();
  }
  set pagePermissionList(value: any) {
    this._pagePermissionListSubject.next(value);
  }


  public subscribeMenuFavorite() {
    return this._menuFavoriteSubject.asObservable();
  }
  public subscribeMenu() {
    return this._menuSubject.asObservable();
  }
  set menuFavorite(value: any) {
    this._menuFavoriteSubject.next(value);
  }
  set menu(value: any) {
    this._menuSubject.next(value);
  }
  set permission(value: any) {
      this._permissionSubject.next(value);
  }
  public subscribePermission() {
      return this._permissionSubject.asObservable();
  }
  public subscribeUser() {
    return this._userSubject.asObservable();
  }

  set user(value: any) {
    this._userSubject.next(value);
  }


  getLanguage() {
    return Observable.fromPromise(this.Language());

  }

  Language(){
    return new Promise((resolve)=>{
      resolve({
        "statusCode": 200,
        "message": "OK",
        "language": "th"
      })
    })
  }



}
