import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { LayoutMenu } from '../../../../shared/store/layout.menu.store';
import { GlobalVariable } from './list-sachet.global';
import { Request } from '../../../../shared/services/request.service';
import { Common } from '../../../../shared/services/common.service';
import { StoreService } from '../../../../shared/services/store.service';
import { environment } from 'src/environments/environment';

const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
const EXCEL_EXTENSION = '.xlsx';

@Component({
  selector: 'app-list-sachet',
  providers: [LayoutMenu, Request, Common],
  templateUrl: './list-sachet.component.html',
  styleUrls: ['./list-sachet.component.scss']
})
export class ListSachetComponent implements OnInit, AfterViewInit {
  @ViewChild('myModal') myModal;
  popupVisible = false
  filePicture = null
  loading = true;
  hoverTootip: any;
  menuHome: any = false;
  sachet: any = {
    bedtimeNote: null,
    bedtimePicture: null,
    bedtimePictureName: null,
    createdAt: null,
    createdBy: null,
    deletedAt: null,
    deletedBy: null,
    eveningNote: null,
    eveningPicture: null,
    eveningPictureName: null,
    lunchNote: null,
    lunchPicture: null,
    lunchPictureName: null,
    morningNote: null,
    morningPicture: null,
    morningPictureName: null,
    sachetId: null,
    updatedAt: null,
    updatedBy: null,
  };
  menuPermissions: any = { view: true, add: true, edit: true, delete: true }
  constructor(
    public router: Router,
    private request: Request,
    public layoutMenu: LayoutMenu,
    private store: StoreService,
  ) {

  }

  async ngOnInit() {
    this.store.subscribePagePermissionList().subscribe(pagePermissionList => {
      console.log("ngOnInit", pagePermissionList);
      let pagePermission = pagePermissionList.find(r => r.url === GlobalVariable.ROLE_URL);
      if (pagePermission) {
        try {
          console.log("pagePermission", pagePermission);
          this.menuPermissions = JSON.parse(pagePermission.menuPermissions)
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

    this.sachet = await this.getSachet();
    console.log(this.sachet)
  }

  onClickBack() {
    this.goHomeMenu();
  }

  onCloseModalWarning() {
  }

  goHomeMenu() {
    if (this.menuHome) {
      this.router.navigate(['/menu', this.menuHome['menuId'], this.menuHome['typePage']]);
    }
  }

  async ngAfterViewInit() {

  }

  async getSachet() {
    let url = GlobalVariable.BASE_API + GlobalVariable.BASE_RESOURCE + GlobalVariable.BASE_RESOURCE_GET;
    try {
      let response = await this.request.get(url, {});
      if (response.resultCode === '20000') {
        this.loading = false;
        return response.resultData
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
  }

  onCellHoverChanged(e) {
    // console.log(e.value);
    this.hoverTootip = e.value;
  }

  popupImg(i) {
    this.filePicture = i
    this.popupVisible = true
  }
}
