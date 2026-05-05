import { Injectable } from '@angular/core';
import { observable, autorun, computed, action, reaction, when, toJS } from 'mobx';

@Injectable()
export class LayoutMenu {
  // @observable menuId = [];
  menuId = [];
  constructor() {
    // if (sessionStorage.favoriteIds) {
    //   this.favoriteIds =  JSON.parse( sessionStorage.favoriteIds );
    // }
    // autorun(() => {
    //   sessionStorage.favoriteIds = JSON.stringify( toJS(this.favoriteIds) );
    // });
  }

  @action updateMenu(menuId) {
    console.log("menung ng serId",menuId);
    this.menuId = [];
    this.menuId = menuId;
  }

  // updateMenu(menuId) {
  //   console.log("menuId",menuId);
  //   this.menuId = menuId;
  // }

  // @computed get isFavoriteId() {
  //   return this.favoriteIds;
  // }

}
