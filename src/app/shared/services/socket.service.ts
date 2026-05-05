import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Observer } from 'rxjs/Observer';

import * as socketIo from 'socket.io-client';
import { environment } from './../../../environments/environment';
const SERVER_URL = environment.ipSocket;

@Injectable()
export class SocketService {
    private socket;

    public initSocket(): void {
        this.socket = socketIo(SERVER_URL);
    }

    public onEvent(event: string): Observable<any> {
        return new Observable<string>(observer => {
            this.socket.on(event, (data: string) => observer.next(data));
        });
    }

    public test(event){
        return this.socket.on(event, (data) => {
            console.log(data);
            return data
        });
    }

    public getSocket(){
        return this.socket;
    }
}
