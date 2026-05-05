import {Component, OnInit, AfterViewInit, Inject, forwardRef, Input, Renderer2} from '@angular/core';
import {trigger, state, style, transition, animate} from '@angular/animations';
import {Router} from '@angular/router';
declare let $: any;
import {PortalComponent} from '../portal.component';
import {LayoutMenu} from '../../shared/store/layout.menu.store';
import {Request} from '../../shared/services/request.service';
import {DomSanitizer} from '@angular/platform-browser';
import {Common} from '../../shared/services/common.service';
import {SharedService} from '../../shared/services/shared.service';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {Location} from '@angular/common';
import {StoreService} from '../../shared/services/store.service';

import {
  PerfectScrollbarConfigInterface
} from 'ngx-perfect-scrollbar';

@Component({
  selector: 'app-menu',
  providers: [LayoutMenu, Request, Common, BrowserAnimationsModule],
  templateUrl: './menu.component.html',
  animations: [
    trigger('children', [
      state('hiddenAnimated', style({
        height: '0px'
      })),
      state('visibleAnimated', style({
        height: '*'
      })),
      state('visible', style({
        height: '*'
      })),
      state('hidden', style({
        height: '0px'
      })),
      transition('visibleAnimated => hiddenAnimated', animate('400ms cubic-bezier(0.86, 0, 0.07, 1)')),
      transition('hiddenAnimated => visibleAnimated', animate('400ms cubic-bezier(0.86, 0, 0.07, 1)'))
    ])
  ]
})

export class MenuComponent implements OnInit, AfterViewInit {
  public config: PerfectScrollbarConfigInterface = {};
  model: any;
  modelFavorite: any;
  menuFavorite = [];
  item;
  root: boolean;
  visible: boolean;
  parentId: any = [];
  level: any = 0;
  levelMenu: any = 1;
  levelItem: any = 0;
  _reset: boolean;
  activeIndex: number;
  hover: boolean;
  activeIndexMenu: number;
  activeIndexMenuItem: number;
  arrayActive = [];
  dataTypePage: any;
  typePageData;
  dataMenus: any = [];
  dataActiveArray;
  token = '';
  url: any;


  constructor(
    @Inject(forwardRef(() => PortalComponent)) public app: PortalComponent,
    public router: Router,
    private request: Request,
    public layoutMenu: LayoutMenu,
    private common: Common,
    private sharedService: SharedService,
    private sanitizer: DomSanitizer,
    private location: Location,
    private store: StoreService,
    private renderer2: Renderer2
  ) {
  }

  async ngOnInit() {
    this.store.subscribeMenuFavorite().subscribe(menuFavorite => {
      this.menuFavorite = menuFavorite
      if (this.model && this.model.length > 0) {
        this.modelFavorite = [];
        for (let i = 0; i < this.menuFavorite.length; i++) {
          let item = this.model.find(r => r.menueId == this.menuFavorite[i])
          if (item) {
            this.modelFavorite.push(item)
          }
        }
      }
    })

    this.store.subscribeMenu().subscribe(menu => {
      if (menu) {
        for (let i in menu) {
          for (let j in menu[i].menus) {
            console.log(menu[i].menus[j]['url']);
            if (menu[i].menus[j]['url'] === null) {
              menu[i].menus[j]['url'] = '';
            }
          }

        }
        console.log('menu', menu);
        this.sharedService.dataMenu = menu;
        this.model = menu;
      }

      if (this.menuFavorite && this.menuFavorite.length > 0) {
        this.modelFavorite = [];
        for (let i = 0; i < this.menuFavorite.length; i++) {
          let item = this.model.find(r => r.menuId == this.menuFavorite[i])
          if (item) {
            this.modelFavorite.push(item)
          }
        }

      }
    });
    console.log(this.arrayActive);
    let keys = this.menuListKeys(this.router.url);
    if (keys && keys.length > 0) {
      console.log(this.level);
      this.activeIndex = keys[this.level];
      this.activeIndexMenu = keys[this.levelMenu];
      this.activeIndexMenuItem = keys[this.levelItem];
      this.arrayActive = await keys;
      this.dataActiveArray = [this.activeIndex, this.activeIndexMenu, this.activeIndexMenuItem];
    }
    this.token = JSON.parse(sessionStorage.getItem("currentUser")).token;
  }

  clearIframe(i = 0) {
    try {
      var iframe: any = document.getElementById("iframe-id");
      var html = "";

      iframe.contentWindow.document.open();
      iframe.contentWindow.document.write(html);
      iframe.contentWindow.document.close();
    } catch (e) {
      if (i > 5) {
        setTimeout(() => {
          this.clearIframe(i++);
        }, 500);
      }
    }

  }

  log(e: any) {
    var listItens = document.querySelectorAll('.draggable-data');
    let menuIds = [];
    [].forEach.call(listItens, function (item) {
      menuIds.push($(item).attr('menuId'));
    });

    setTimeout(() => {
      this.request.post('/api/user/menu-favorite', {menuFavorites: menuIds});
    }, 50);
  }

  async ngAfterViewInit() {
  }


  changeTab(e) {
    this.clearIframe();
    let pageName = sessionStorage.getItem('swapPageName');
    sessionStorage.removeItem('swapPageName');
    $('#' + pageName).parent().removeClass('active');
  }

  menuListKeys(url) {
    if (url.indexOf('/home') !== -1) {
      return [0];
    } else if (url.indexOf('/microservice-menus') !== -1) {
      return [1, 0, 0];
    } else if (url.indexOf('/microservice-menus') !== -1) {
      return [1, 0, 1];
    } else if (url.indexOf('/roles') !== -1) {
      return [1, 0, 2];
    } else if (url.indexOf('/user') !== -1) {
      return [2, 0, 1];
    } else if (url.indexOf('/assign-microservice-permission') !== -1) {
      return [2, 0, 2];
    }
    return [];
  }

  @Input() get reset(): boolean {
    return this._reset;
  }

  set reset(val: boolean) {
    this._reset = val;

    if (this._reset && this.app.slimMenu) {
      this.activeIndex = null;
      this.activeIndexMenu = null;
      this.activeIndexMenuItem = null;
    }
  }

  bypassTrustUrl(bypassSecurityTrustUrl) {
    let getToken = JSON.parse(sessionStorage.getItem("currentUser")).token;
    if (bypassSecurityTrustUrl) {
      return this.sanitizer.bypassSecurityTrustUrl(bypassSecurityTrustUrl + '?token=' + getToken);
    } else {
      return bypassSecurityTrustUrl + '?token=' + getToken;
    }
  }

  funLinktoggle() {
    console.log('click menu', this.typePageData);
    this.sharedService.dataTypePage.type = this.typePageData;
    this.renderer2.removeClass(document.body, 'body-hidden');
    $('.iframe-id').hide();
    if ($('body').hasClass('body-small')) {
      $('body').removeClass('#000').fadeIn(400);
    }
  }

  checkUrl(data) {
    if (data === 'undefined' || data === null) {
      return '/';
    } else {
      return data;
    }

  }
}
