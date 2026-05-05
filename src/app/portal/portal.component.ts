import {Component, AfterViewInit, NgZone, Renderer, OnInit} from '@angular/core';
import {
  Router, // import as RouterEvent to avoid confusion with the DOM Event
  Event as RouterEvent, NavigationStart, NavigationEnd, NavigationCancel, NavigationError
} from '@angular/router';
import {SharedService} from '../shared/services/shared.service';
import {
  PerfectScrollbarConfigInterface
} from 'ngx-perfect-scrollbar';
import * as $ from 'jquery';

enum MenuMode {
  STATIC,
  OVERLAY,
  SLIM
}

@Component({
  selector: 'app-portal',
  providers: [SharedService],
  templateUrl: './portal.component.html',
})
export class PortalComponent implements OnInit, AfterViewInit {
  // @Input()
  public config: PerfectScrollbarConfigInterface = {};
  dataTypePage: any = {type: 'internal'};
  dataMenu: any = [];
  menu: MenuMode = MenuMode.STATIC;
  showIframe = true;
  layout = 'default';

  darkMenu: boolean;

  documentClickListener: Function;

  staticMenuInactive: boolean;

  overlayMenuActive: boolean;

  mobileMenuActive: boolean;

  menuClick: boolean;

  menuButtonClick: boolean;

  topbarMenuButtonClick: boolean;

  topbarMenuClick: boolean;

  topbarMenuActive: boolean;

  activeTopbarItem: Element;
  resetSlim: boolean;

  loading = true;

  constructor(
    private router: Router,
    private ngZone: NgZone,
    private sharedService: SharedService,
    private renderer: Renderer,
    // private state: RouterStateSnapshot
  ) {
    router.events.subscribe((event: RouterEvent) => {
      this._navigationInterceptor(event);
    });
  }

  ngOnInit() {
  }

  private _navigationInterceptor(event: RouterEvent): void {

    if (event instanceof NavigationStart) {
      this.loading = true;
    }
    if (event instanceof NavigationEnd) {
      this.loading = false;
    }

    // Set loading state to false in both of the below events to hide the spinner in case a request fails
    if (event instanceof NavigationCancel) {
      this.loading = false;
    }
    if (event instanceof NavigationError) {
      this.loading = false;
    }
  }

  async ngAfterViewInit() {
    let dataTypePage = await this.sharedService.dataTypePage;
    this.loading = true;
    setTimeout(() => {
      this.loading = false;
      console.log('time dataTypePage: ', dataTypePage.dataTypePage);
    }, 1000);

    this.dataTypePage = await this.sharedService.dataTypePage;
    this.dataMenu = await this.sharedService.dataMenu;
    console.log(this.dataMenu);
    this.documentClickListener = this.renderer.listenGlobal('body', 'click', (event) => {
      if (!this.menuClick && !this.menuButtonClick) {
        this.mobileMenuActive = false;
        this.overlayMenuActive = false;
        this.resetSlim = true;
      }

      if (!this.topbarMenuClick && !this.topbarMenuButtonClick) {
        this.topbarMenuActive = false;
      }

      this.menuClick = false;
      this.menuButtonClick = false;
      this.topbarMenuClick = false;
      this.topbarMenuButtonClick = false;
    });

    let width = window.innerHeight > 0 ? window.innerWidth : screen.width;
    let nav_header = $('.wrapper-nav-header').outerHeight();
    let valueHeight;
    if (width > 720 && $('body').hasClass('collapse-collapse')) {
      valueHeight = $('.site-sidebar').outerHeight() - 1;
      $('#main-wrapper').css('min-height', valueHeight + 'px');
    }
    if (width > 720 && $('body').hasClass('sidebar-horizontal')) {
      valueHeight = (window.innerHeight > 0 ? window.innerHeight : screen.height) - 1 - $('.wrapper-nav-header').outerHeight() - $('.wrapper-nav-site').outerHeight();
      $('#main-wrapper').css('min-height', valueHeight + 'px');
    } else if (width > 720) {
      valueHeight = (window.innerHeight > 0 ? window.innerHeight : screen.height) - 1 - $('.wrapper-nav-header').outerHeight() - $('.wrapper-nav-header').outerHeight();
      $('#main-wrapper').css('min-height', valueHeight + 'px');
    }
  }

  get slimMenu(): boolean {
    return this.menu === MenuMode.SLIM;
  }

  get overlayMenu(): boolean {
    return this.menu === MenuMode.OVERLAY;
  }

  get staticMenu(): boolean {
    return this.menu === MenuMode.STATIC;
  }

}
