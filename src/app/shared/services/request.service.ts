import { Injectable } from '@angular/core';
import { Http, Headers, URLSearchParams, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import { environment } from '../../../environments/environment';
import 'rxjs/Rx';
import * as _ from 'lodash';
import * as is from 'is_js';
import * as moment from 'moment';

class RESULT_CODE {
    public static SUCCESS = '20000';
    public static NOT_FOUND = '40400';
    public static ERROR = '50000';
}

@Injectable()
export class Request {
    mockupIP = environment.ip;

    constructor(public http: Http) {

    }

    get(url, data): Promise<any> {
        let params: URLSearchParams = new URLSearchParams();
        for (let key in data) {
            if (key === 'filter') {
                if (data[key] != '{}') {
                    params.set(key, data[key]);
                }
            } else {
                params.set(key, data[key]);
            }
        }

        let options = new RequestOptions({ withCredentials: true, ...this.jwt() });
        options.search = params;
        return this.http.get(this.mockupIP + url, options).map(response => {
            if (response.json().notLogin) {
                location.href = this.mockupIP + '/login';
                return { resultDescription: 'session expired' };
            } else {
                return response.json() || { resultCode: 50000, resultDescription: 'No response from server' };
            }
        }).catch((error: Response | any) => {
            if (error.status == 401) {
            }
            return Observable.throw(error.json());
        }).toPromise();
    }

    getWithTimeout(url, data, timeoutMs: number = 300000): Promise<any> {
        // timeoutMs default = 5 minutes (300000 milliseconds) สำหรับ export
        let params: URLSearchParams = new URLSearchParams();
        for (let key in data) {
            if (key === 'filter') {
                if (data[key] != '{}') {
                    params.set(key, data[key]);
                }
            } else {
                params.set(key, data[key]);
            }
        }

        let options = new RequestOptions({ withCredentials: true, ...this.jwt() });
        options.search = params;
        return this.http.get(this.mockupIP + url, options)
            .timeout(timeoutMs)
            .map(response => {
                if (response.json().notLogin) {
                    location.href = this.mockupIP + '/login';
                    return { resultDescription: 'session expired' };
                } else {
                    return response.json() || { resultCode: 50000, resultDescription: 'No response from server' };
                }
            }).catch((error: Response | any) => {
                if (error.status == 401) {
                }
                return Observable.throw(error.json());
            }).toPromise();
    }

    post(url, data): Promise<any> {
        let options = new RequestOptions({ withCredentials: true, ...this.jwt() });
        return this.http.post(this.mockupIP + url, data, options).map(response => {
            if (response.json().notLogin) {
                location.href = this.mockupIP + '/login';
                return { resultDescription: 'session expired' };
            } else {
                return response.json() || { resultCode: 50000, resultDescription: 'No response from server' };
            }
        }).catch((error: Response | any) => {
            return Observable.throw(error.json());
        }).toPromise();
    }

    postFile(url, data): Promise<any> {
        let options = new RequestOptions({ withCredentials: true, ...this.jwtFile() });

        return this.http.post(this.mockupIP + url, data, options).map(response => {
            console.log(response);
            if (response.json().notLogin) {
                location.href = this.mockupIP + '/login';
                return { resultDescription: 'session expired' };
            } else {
                return response.json() || { resultCode: 50000, resultDescription: 'No response from server' };
            }
        }).catch((error: Response | any) => {
            return Observable.throw(error.json());
        }).toPromise();
    }

    postWithToken(url, data, token): Promise<any> {
        let headers = new Headers({ 'x-token': '1', 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' });
        let options = new RequestOptions({ withCredentials: true, ...{ headers: headers } });
        return this.http.post(this.mockupIP + url, data, options).map(response => {
            console.log(response);
            if (response.json().notLogin) {
                location.href = this.mockupIP + '/login';
                return { resultDescription: 'session expired' };
            } else {
                return response.json() || { resultCode: 50000, resultDescription: 'No response from server' };
            }
        }).catch((error: Response | any) => {
            return Observable.throw(error.json());
        }).toPromise();
    }

    put(url, data): Promise<any> {
        let options = new RequestOptions({ withCredentials: true, ...this.jwt() });
        return this.http.put(this.mockupIP + url, data, options).map(response => {
            if (response.json().notLogin) {
                location.href = this.mockupIP + '/login';
                return { resultDescription: 'session expired' };
            } else {
                return response.json() || { resultCode: 50000, resultDescription: 'No response from server' };
            }
        }).catch((error: Response | any) => {
            return Observable.throw(error.json());
        }).toPromise();
    }

    patch(url, data): Promise<any> {
        let options = new RequestOptions({ withCredentials: true, ...this.jwt() });
        return this.http.patch(this.mockupIP + url, data, options).map(response => {
            if (response.json().notLogin) {
                location.href = this.mockupIP + '/login';
                return { resultDescription: 'session expired' };
            } else {
                return response.json() || { resultCode: 50000, resultDescription: 'No response from server' };
            }
        }).catch((error: Response | any) => {
            return Observable.throw(error.json());
        }).toPromise();
    }

    delete(url): Promise<any> {
        let options = new RequestOptions({ withCredentials: true, ...this.jwt() });
        return this.http.delete(this.mockupIP + url, options).map(response => {
            if (response.json().notLogin) {
                location.href = this.mockupIP + '/login';
                return { resultDescription: 'session expired' };
            } else {
                return response.json() || { resultCode: 50000, resultDescription: 'No response from server' };
            }
        }).catch((error: Response | any) => {
            return Observable.throw(error.json());
        }).toPromise();
    }

    async postCustomStore(customStoreOptions: any) {
        let options = new RequestOptions({ withCredentials: true, ...this.jwt() });
        const url = customStoreOptions.url || '';
        const data = JSON.parse(JSON.stringify(customStoreOptions.filter)) || {};
        const loadMode = customStoreOptions.loadMode || 'processed';
        console.log(this.mockupIP + url, data);
        return this.http.post(this.mockupIP + url, data, options)
            .map((res) => {
                const resData = res.json();
                console.log('​Request -> getCustomStore -> resData', resData);
                if (loadMode === 'processed') {
                    return this.fnHandleResponseProcessedMode(resData);
                } else {
                    return this.fnHandleResponseRawMode(resData);
                }
            })
            .toPromise();

    }

    /**
     * ถ้า getCustomStore แล้ว success กรณี loadMode = 'processed'
     * @param resData
     */
    fnHandleResponseProcessedMode(resData) {
        const customStoreData = {
            data: [],
            totalCount: 0
        };
        let code = '';
        let description = '';
        let data = [];
        let rowCount = 0;
        if (is.array(resData)) {
            data = resData;
            rowCount = _.size(data);
        } else {
            /** เปลี่ยนไปตามรูปแบบ response */
            code = resData.resultCode || '';
            description = resData.resultDescription || '';
            data = resData.resultData || [];
            rowCount = resData.rowCount || 0; // เปลี่ยนไปตาม Response
            /** */
        }
        if (code === RESULT_CODE.ERROR) {
            console.log('​fnHandleResponseProcessedMode -> RESULT_CODE.ERROR', RESULT_CODE.ERROR);
        } else if (code === RESULT_CODE.NOT_FOUND) {
            console.log('​fnHandleResponseProcessedMode -> RESULT_CODE.NOT_FOUND', RESULT_CODE.NOT_FOUND);
        } else {
            customStoreData.data = data;
            customStoreData.totalCount = rowCount;
        }
        return customStoreData;
    }

    /**
     * ถ้า getCustomStore แล้ว success กรณี loadMode = 'raw'
     * @param resData
     */
    fnHandleResponseRawMode(resData) {
        let code = '';
        let description = '';
        let data = [];
        if (is.array(resData)) {
            data = resData;
        } else {
            /** เปลี่ยนไปตามรูปแบบ response */
            code = resData.resultCode || '';
            description = resData.resultDescription || '';
            data = resData.resultData || [];
            /** */
        }
        if (code === RESULT_CODE.ERROR) {
            alert('ERROR:' + RESULT_CODE.ERROR);
            return [];
        } else if (code === RESULT_CODE.NOT_FOUND) {
            alert('ERROR:' + RESULT_CODE.NOT_FOUND);
            return [];
        } else {
            return data;
        }
    }

    private makeid(length) {
        var result = '';
        var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var charactersLength = characters.length;
        for (var i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() *
                charactersLength));
        }
        return result;
    }

    private jwt() {
        // create authorization header with jwt token
        let currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
        if (currentUser && currentUser.token) {
            let sessionId = `BIH-${moment().format('YYYYMMDDHHmmss')}${this.makeid(5)}`;
            let headers = new Headers({
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

    private jwtFile() {
        // create authorization header with jwt token
        let currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
        if (currentUser && currentUser.token) {
            let sessionId = `BIH-${moment().format('YYYYMMDDHHmmss')}${this.makeid(5)}`;
            let headers = new Headers({
                'x-token': '1',
                'Authorization': 'Bearer ' + currentUser.token,
                'X-Session-Id': sessionId,
                'X-Rtid': sessionId,
                'X-Tid': sessionId,
            });
            return { headers: headers };
        }
        return {};
    }
}
