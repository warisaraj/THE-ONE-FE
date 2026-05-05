import { Injectable } from '@angular/core';
import * as _ from 'lodash';

@Injectable()
export class CompareService {

  getUpdate(before, after, idName = 'key') {
    const toUpdate = _.intersectionBy(after, before , idName);
    // console.log('toUpdate', toUpdate);
    return toUpdate;
  }

  getInsert(before, after, idName = 'key') {
    const toInsert = _.differenceBy(after, before, idName);
    // console.log('toInsert', toInsert);
    return toInsert;
  }

  getDeleted(before, after, idName = 'key') {
    const toDelete = _.differenceBy(before, after, idName);
    // console.log('toDelete', toDelete);
    return toDelete;
  }

}
