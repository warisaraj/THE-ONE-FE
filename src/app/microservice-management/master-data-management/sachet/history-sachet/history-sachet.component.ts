import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { LayoutMenu } from '../../../../shared/store/layout.menu.store';
import { GlobalVariable } from './history-sachet.global';
import { Request } from '../../../../shared/services/request.service';
import { Common } from '../../../../shared/services/common.service';
import { StoreService } from '../../../../shared/services/store.service';
import { environment } from 'src/environments/environment';
import * as moment from 'moment';

const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
const EXCEL_EXTENSION = '.xlsx';

@Component({
  selector: 'app-history-sachet',
  providers: [LayoutMenu, Request, Common],
  templateUrl: './history-sachet.component.html',
})
export class HistorySachetComponent implements OnInit, AfterViewInit {
  @ViewChild('myModal') myModal;
  popupVisible=false;
  filePicture=null
  loading = true;
  hoverTootip: any;
  menuHome: any = false;
  sachet : any;
  menuPermissions: any = { view: true, add: true, edit: true, delete: true }
  historyData: any;
  constructor(
    public router: Router,
    private request: Request,
    public layoutMenu: LayoutMenu,
    private store: StoreService,
    private common: Common,
  ) {

  }

  async ngOnInit() {
    this.store.subscribePagePermissionList().subscribe(pagePermissionList => {
      console.log("ngOnInit", pagePermissionList);
      let pagePermission = pagePermissionList.find(r => r.url === GlobalVariable.ROLE_URL);
      if (pagePermission) {
        try {
          // console.log("pagePermission",pagePermission);
          // this.menuPermissions = JSON.parse(pagePermission.menuPermissions)
        } catch (error) {
          console.log(error);
        }
      }
    })

    this.store.subscribeMenu().subscribe((menu: any) => {
      let menuHome = false;
      for (let index = 0; index < menu.length; index++) {
        const element = menu[index];
        for (let index2 = 0; index2 < element.menus.length; index2++) {
          const element2 = element.menus[index2];
          for (let index3 = 0; index3 < element2.submenus.length; index3++) {
            const element3 = element2.submenus[index3];
            if (GlobalVariable.ROLE_URL === element3.url) {
              if (!menuHome) {
                menuHome = element;
              }
              break;
            }
          }
        }
      }
      this.menuHome = menuHome;
    })

    await this.getSachet();
  }

  goHomeMenu() {
    if (this.menuHome) {
      this.router.navigate(['/menu', this.menuHome['menuId'], this.menuHome['typePage']]);
    }
  }

  onClickBack() {
    this.router.navigate(['/master-data-management', 'sachet']);
  }

  onCloseModalWarning() {

  }

  async ngAfterViewInit() {

  }

  async getSachet(){
    let url = GlobalVariable.BASE_API + GlobalVariable.BASE_RESOURCE + GlobalVariable.BASE_RESOURCE_GET_HISTORY;
    try {
      let response = await this.request.get(url , {});
      if(response.resultCode === '20000') {
        this.loading = false;
        this.historyData = response.resultData
        for (let index = 0; index < this.historyData.length; index++) {
          const element = this.historyData[index];
          element.createdAt = moment(element.createdAt).format("DD/MM/YYYY HH:mm:ss")
        }
        console.log(this.historyData)
      } else {
        this.loading = false;
        this.goAlert(response.resultCode, response.resultDescription, 'myModalError');
      }

    } catch (e) {
      console.log('catch: ', e);
      this.loading = false;
      console.log(e);
      const resultDescriptionSystemErrorTitle = environment.resultDescriptionSystemErrorTitle;
      const resultDescriptionSystemErrorMassage = environment.resultDescriptionSystemErrorMassage;
      this.goAlert(resultDescriptionSystemErrorTitle, resultDescriptionSystemErrorMassage, 'myModalError');
    }
  }

  goAlert(userTitle, userMessage, modalId) {
    const dataAlert = {
      'modalId': modalId,
      'userTitle': userTitle,
      'userMessage': userMessage,
    };
    this.myModal.openModal(dataAlert);
  }

  onCloseModalError() {
    console.log('onCancelDelete');
  }

  onCellPrepared(e) {
    e.cellElement.accessKey = e.column.caption;
  }

  // Collapse ibox function
  clickCollapse() {
    let collapse = this.common.collapseFn();
  }

  onCellHoverChanged(e) {
    // console.log(e.value);
    this.hoverTootip = e.value;
  }
  
  popupImg(i){
    this.filePicture = i
    this.popupVisible = true
  }

}
