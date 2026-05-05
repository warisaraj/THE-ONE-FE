import {Component, OnInit, ViewChild, AfterViewInit, Renderer2, HostListener} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {Request} from '../shared/services/request.service';
import {GlobalVariable} from './menu-full.global';
import {Common} from '../shared/services/common.service';
import {environment} from './../../environments/environment';
import {DomSanitizer} from "@angular/platform-browser";
import {SharedService} from '../shared/services/shared.service';
import {LayoutMenu} from '../shared/store/layout.menu.store';
import {UserService} from '../auth/_services';

declare let $: any;

@Component({
  selector: 'app-menu-full',
  templateUrl: './menu-full.component.html',
  styleUrls: ['./menu-full.component.css']
})
export class MenuFullComponent implements OnInit, AfterViewInit {

  @ViewChild('myModal') myModal;
  menuId: any;
  typePage: any;
  filterData: any = {};
  dataMicroServices: any;
  loading: boolean = true;
  menuMicroServices: any = [];
  iframePortal: any;
  routerNavigatefail: any = false;

  constructor(
    private request: Request,
    private router: Router,
    private route: ActivatedRoute,
    private common: Common,
    private sanitizer: DomSanitizer,
    public sharedService: SharedService,
    public layoutMenu: LayoutMenu,
    private userService: UserService,
    private renderer: Renderer2
  ) {
  }

  @HostListener('window:popstate', ['$event'])
  onBrowserBackBtnClose(event: Event) {
    console.log('back button pressed', event, window.location.hash);
    event.preventDefault();
    setTimeout(() => {
      console.log(this.route.snapshot.queryParams);
      if ((this.route.snapshot.queryParams.show && this.route.snapshot.queryParams.show === 'portal') || !this.route.snapshot.queryParams.show) {
        this.router.navigate(['/menu', this.route.snapshot.paramMap.get('id'), this.route.snapshot.paramMap.get('type')], {queryParams: {"show": "portal"}});
        this.sharedService.dataTypePage.type = null
        // var iframe:any = document.getElementById("iframe-id");
        // console.log(iframeItem);
        // iframe.contentWindow.document.open();
        // iframe.contentWindow.document.write("");
        // iframe.contentWindow.document.close();
        this.renderer.removeClass(document.body, 'body-hidden');
        $('.iframe-id').hide();
        // console.log("xxxxx");

        if ($('body').hasClass('body-small')) {
          $('body').removeClass('mini-navbar').fadeIn(400);
        }
      }
    }, 200);


    // this.router.navigate(['/home'],  {replaceUrl:true});
  }

  ngOnInit() {
    //
  }

  async ngAfterViewInit() {
    try {
      this.route.queryParams.subscribe(params => {
        console.log("params", params);

        let redirecturl = params.redirecturl;
        if (redirecturl) {

          setTimeout(() => {
            let item = []
            let menuIdUrl = [];
            if (this.layoutMenu.menuId) {
              menuIdUrl = this.layoutMenu.menuId.map(r => r.url)
            }


            this.layoutMenu.updateMenu([item]);
            setTimeout(() => {
              this.sharedService.dataTypePage.type = this.typePage;
            }, 300)

            if (this.sharedService.dataTypePage.type === 'external') {
              this.renderer.addClass(document.body, 'body-hidden');
            } else if (this.sharedService.dataTypePage.type === 'internal') {
              this.renderer.removeClass(document.body, 'body-hidden');
            }
            let getToken = JSON.parse(sessionStorage.getItem("currentUser")).token;
            console.log(redirecturl + '?token=' + getToken + '&theme=' + localStorage.getItem('theme'))
            $('#iframe-id').attr('src', redirecturl + '?token=' + getToken + '&theme=' + localStorage.getItem('theme'))
            $('.iframe-home').hide();
          }, 100)
        }

      });


      await this.route.params.subscribe(params => {
        console.log('params : ', params.id);
        this.menuId = params.id;
        this.typePage = params.type;
        this.menuMicroServices = [];
        this.sharedService.dataTypePage.type = '';

        this.getMicroservice();
      });
      //
      this.loading = true;
    } catch (e) {
      this.loading = false;
      console.log(e);
    }
  }

  async getMicroservice() {
    console.log('store : ', this.userService.userMenu);
    for (let i = 0; i < this.userService.userMenu.length; i++) {
      if (this.userService.userMenu[i].menuId === this.menuId) {
        this.menuMicroServices = this.userService.userMenu[i].menus;
      }
    }
  }

  bypassTrustUrl(bypassSecurityTrustUrl,) {
    let getToken = JSON.parse(sessionStorage.getItem("currentUser")).token;
    if (bypassSecurityTrustUrl) {
      return this.sanitizer.bypassSecurityTrustUrl(bypassSecurityTrustUrl + '?token=' + getToken + '&theme=' + localStorage.getItem('theme'));
    } else {
      return bypassSecurityTrustUrl + '?token=' + getToken + '&theme=' + localStorage.getItem('theme');
    }
  }


  bypassTrustUrl2(bypassSecurityTrustUrl) {
    let getToken = JSON.parse(sessionStorage.getItem("currentUser")).token;

    if (bypassSecurityTrustUrl) {
      return (bypassSecurityTrustUrl + '?token=' + getToken + '&theme=' + localStorage.getItem('theme'));
    } else {
      return bypassSecurityTrustUrl + '?token=' + getToken + '&theme=' + localStorage.getItem('theme');
    }
  }

  bypassTrustUrlWithOutToken(bypassSecurityTrustUrl,) {
    if (bypassSecurityTrustUrl) {
      return this.sanitizer.bypassSecurityTrustUrl(bypassSecurityTrustUrl);
    } else {
      return bypassSecurityTrustUrl;
    }
  }

  bypassTrustUrlWithOutToken2(bypassSecurityTrustUrl) {
    let getToken = JSON.parse(sessionStorage.getItem("currentUser")).token;

    if (bypassSecurityTrustUrl) {
      return bypassSecurityTrustUrl;
    } else {
      return bypassSecurityTrustUrl;
    }
  }

  itemClickMenu(item: any, itemParent: any, $event, newUrl) {
    console.log(item, itemParent, newUrl);

    $event.preventDefault();

    if (item.newTap === 'new tab without token') {
      // let getToken =   JSON.parse(sessionStorage.getItem("currentUser")).token;
      // window.open(item.url + '?token=' + getToken + '&theme=' + localStorage.getItem('theme'), '_blank');
      window.open(item.url, '_blank');
      return;
    } else if (item.newTap === 'new tab') {
      let getToken = JSON.parse(sessionStorage.getItem("currentUser")).token;
      window.open(item.url + '?token=' + getToken + '&theme=' + localStorage.getItem('theme'), '_blank');
      // window.open(item.url, '_blank');
      return;
    } else if (item.newTap === 'new tab in portal') {
      let urlData = `${window.location.origin}/#/noti-url?system=0&redirecturl=${encodeURIComponent(item.url)}`
      // let getToken =   JSON.parse(sessionStorage.getItem("currentUser")).token;
      window.open(urlData, '_blank');
      return;
    }

    if ($event.metaKey || $event.ctrlKey) {

    } else {
      console.log('itemClickMenu false ', $event.metaKey);
      let menuIdUrl = [];
      if (this.layoutMenu.menuId) {
        menuIdUrl = this.layoutMenu.menuId.map(r => r.url)
      }

      let isMapNav = false;
      if (itemParent.subMenu && menuIdUrl.length > 0) {
        let itemParentMenuIdUrl = itemParent.subMenu.map(r => r.url)

        for (let i in menuIdUrl) {
          let rrr = itemParentMenuIdUrl.find(r => r == menuIdUrl[i]);
          if (rrr) {
            isMapNav = true;
          }
        }
      }
      console.log('this.isMapNav', isMapNav)
      if (isMapNav) {
        if (itemParent.url) {
          console.log('url', itemParent.url, item.url)
          let newUrl = item.url.replace(itemParent.url, "");
          if (newUrl !== item.url) {
            event.preventDefault();
          }
        }
      }

      this.layoutMenu.updateMenu([item]);
      setTimeout(() => {
        this.sharedService.dataTypePage.type = this.typePage;
      }, 300);
      // tslint:disable-next-line:max-line-length
      this.router.navigate(['/menu', this.route.snapshot.paramMap.get('id'), this.route.snapshot.paramMap.get('type')], {queryParams: {'show': 'iframe'}});
    }
  }

  internal() {
    this.renderer.removeClass(document.body, 'body-hidden');
  }

  checkUrl(data) {
    if (data === 'undefined' || data === null) {
      return '/';
    } else {
      return data;
    }

  }
}
