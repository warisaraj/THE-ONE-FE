import { Injectable } from "@angular/core";

@Injectable()
export class DataService {
    public storage: any;
    get isEmpty(): boolean {
        return this.storage === null || this.storage === undefined;
    }

    constructor() {}
}
