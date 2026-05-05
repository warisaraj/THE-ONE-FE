import {Component, OnInit, AfterViewInit, Renderer2, HostListener} from '@angular/core';
import {Router} from '@angular/router';
// import {environment} from '../../environments/environment';
import * as $ from 'jquery';
import {StoreService} from '../../shared/services/store.service';
import {SocketService} from '../../shared/services/socket.service';
import {Common} from '../../shared/services/common.service';
import {
  PerfectScrollbarConfigInterface,
  PerfectScrollbarComponent,
  PerfectScrollbarDirective
} from 'ngx-perfect-scrollbar';
import * as webNotification from 'simple-web-notification';
import {Request} from '../../shared/services/request.service';
import {Subject} from 'rxjs/Subject';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit, AfterViewInit {
  public config: PerfectScrollbarConfigInterface = {};
  notiList: any = [];
  socket;
  count = 0;
  lastClick;
  username = '';
  permission: any = {};
  public innerWidth: any;
  role: string;
  positionList: any = [];
  @HostListener('window:resize', ['$event'])
  private onDestroySource: Subject<any> = new Subject();

  onResize(event) {
    this.innerWidth = window.innerWidth;
    if (this.innerWidth < 998) {
      this.renderer2.addClass(document.body, 'body-small');
    } else {
      this.renderer2.removeClass(document.body, 'body-small');
    }
  }

  constructor(
    private router: Router,
    private store: StoreService,
    private socketService: SocketService,
    private common: Common,
    private renderer2: Renderer2,
    private request: Request,
  ) {

  }

  ngOnInit() {
    this.store.subscribeUser()
      .takeUntil(this.onDestroySource)
      .subscribe(data => {
        console.log('this.socket subscribeUser', data.username, this.username);
        this.username = data.username;
        console.log(data, 'username');
        this.initIoConnection();
      });
    this.store.subscribePermission().subscribe(permission => {
      this.permission = permission;
      console.log(permission, 'permission');
    });
    if (sessionStorage.getItem('role')) {
      this.role = sessionStorage.getItem('role').toLowerCase();
    }
  }

  async ngAfterViewInit() {
    this.lastClick = new Date(localStorage.getItem('lastClick'));
    this.getNoti();

  }


  async getNoti() {
    const filterData: any = {
      isHeader: true
    };
    const dropdown = await this.common.searchConfig();
    this.positionList = dropdown.positionList || [];
    for (let index = 0; index < this.positionList.length; index++) {
      this.positionList[index] = this.positionList[index].toLowerCase();
    }
    if (this.positionList.includes(this.role)) {
      if (this.role.toLowerCase() === 'pharmacist' || this.role.toLowerCase() === 'senior pharmacist' || this.role.toLowerCase() === 'pharmacy technician') {
        filterData.type = '1,5,6,7,12,13,15,16,17,18';

      }
      if (this.role.toLowerCase() === 'cashier') {
        filterData.type = '2,4,8,9,10,14';
      }
      if (this.role.toLowerCase() === 'customer service') {
        filterData.type = '5,11,16,19';
      }
      if (this.role.toLowerCase() === 'production team' || this.role.toLowerCase() === 'production pharmacist' || this.role.toLowerCase() === 'production technician' || this.role.toLowerCase() === 'senior production technician') {
        filterData.type = '20';
      }
      console.log(filterData.type);
      const checkUrl = this.common.checkMockupUrl('', '', filterData, {
        BASE_API: '/api/v1/bih',
        BASE_MODULE: '/notification',
        BASE_RESOURCE: '/searchNotifications'
      });
      this.notiList = [];
      this.count = 0;
      this.request.get(checkUrl.url, checkUrl.filter)
        .then(response => {
          console.log(response);
          if (response.resultCode === '20000') {
            this.notiList = response.data;
            for (let index = 0; index < this.notiList.length; index++) {
              const element = this.notiList[index];
              if (element.message.includes('\n')) {
                this.notiList[index].messageList = this.notiList[index].message.split('\n');
              } else {
                this.notiList[index].messageList = [];
              }
              if (!element.isRead) {
                this.count++;
              }
            }
          }

        });
    }
  }

  ngOnDestroy() {
    console.log('this.socket \'ngOnDestroy\'');
    this.socket.disconnect();
    this.onDestroySource.next();
    this.onDestroySource.complete();
    // this.store.subscribeUser().unsubscribe();
  }

  readNoti() {
    const checkUrl = this.common.checkMockupUrl('', '', {}, {
      BASE_API: '/api/v1/bih',
      BASE_MODULE: '/notification',
      BASE_RESOURCE: '/updateNotificationRead'
    });
    this.request.post(checkUrl.url, {});
    // .then(response => {})
  }

  private initIoConnection(): void {
    console.log('this.socket', this.socket);
    this.socketService.initSocket();
    this.socket = this.socketService.getSocket();
    console.log('this.socket', this.socket);

    this.socket.on(`noti-${this.username.toLowerCase()}`, (noti) => {

      console.log(this.notiList, noti);

      if (this.notiList && this.notiList.length > 0) {
        if (this.notiList[0].message === noti.message) {
          console.log('break;');
          return;
        }
      }

      noti.messageList = [];
      if (noti.message.includes('\n')) {
        noti.messageList = noti.message.split('\n');
      }

      noti.sendDate = new Date(noti.sendDate);

      // tslint:disable-next-line:max-line-length
      if (this.role.toLowerCase() === 'pharmacist' || this.role.toLowerCase() === 'senior pharmacist' || this.role.toLowerCase() === 'pharmacy technician') {
        // tslint:disable-next-line:max-line-length
        if (noti.type === 1 || noti.type === 5 || noti.type === 6 || noti.type === 7 || noti.type === 12 || noti.type === 13 || noti.type === 15 || noti.type === 16) {
          if (noti.sendDate.getTime() > this.lastClick.getTime()) {
            noti.isNotRead = true;
            this.count++;
          }
          this.notiList = [noti, ...this.notiList];
        }
      } else if (this.role.toLowerCase() === 'cashier') {
        if (noti.type === 2 || noti.type === 4 || noti.type === 8 || noti.type === 9 || noti.type === 10 || noti.type === 14) {
          if (noti.sendDate.getTime() > this.lastClick.getTime()) {
            noti.isNotRead = true;
            this.count++;
          }
          this.notiList = [noti, ...this.notiList];
        }
      } else if (this.role.toLowerCase() === 'customer service') {
        if (noti.type === 5 || noti.type === 11 || noti.type === 16 || noti.type === 19) {
          if (noti.sendDate.getTime() > this.lastClick.getTime()) {
            noti.isNotRead = true;
            this.count++;
          }
          this.notiList = [noti, ...this.notiList];
        }
        // tslint:disable-next-line:max-line-length
      } else if (this.role.toLowerCase() === 'production team' || this.role.toLowerCase() === 'production pharmacist' || this.role.toLowerCase() === 'production technician' || this.role.toLowerCase() === 'senior production technician') {
        if (noti.type === 20) {
          if (noti.sendDate.getTime() > this.lastClick.getTime()) {
            noti.isNotRead = true;
            this.count++;
          }
          this.notiList = [noti, ...this.notiList];
        }
      }
      console.log('this.notiList', this.notiList);

    });
    console.log(`log :: initIoConnection --> notiList --> ${this.notiList}`);
  }

  clickNoti() {
    setTimeout(r => {
      this.count = 0;
      const date = new Date();
      localStorage.setItem('lastClick', date.toString());
      this.lastClick = date;

      this.readNoti();
    }, 100);
    //

  }

  clickRead(noti) {
    noti.isNotRead = false;
    console.log('Notification clicked.');
    // const url = noti.url || 'http://localhost:4200';
    // window.location.replace(url); // open url here
    this.router.navigate(['/list-noti']);
  }

  async clickListNoti() {
    await this.clearIframe();
    this.renderer2.removeClass(document.body, 'body-hidden');
    $('.iframe-id').hide();
    this.router.navigate(['/list-noti']);
  }

  clearIframe(i = 0) {
    try {
      return new Promise<void>((rev) => {
        const iframe: any = document.getElementById('iframe-id');
        const html = '';
        iframe.contentWindow.document.open();
        iframe.contentWindow.document.write(html);
        iframe.contentWindow.document.close();
        rev();
      });
    } catch (e) {
      if (i > 5) {
        setTimeout(async () => {
          await this.clearIframe(i++);
        }, 500);
      }
    }

  }

  SmoothlyMenu() {
    $('body').toggleClass('mini-navbar');
    // console.log($('body').toggleClass("mini-navbar"));
    if (!$('body').hasClass('mini-navbar') || $('body').hasClass('body-small')) {
      console.log('if');
      // Hide menu in order to smoothly turn on when maximize menu
      $('#side-menu').hide();
      // For smoothly turn on menu
      setTimeout(
        function () {
          $('#side-menu').fadeIn(400);
        }, 200);
    } else if ($('body').hasClass('fixed-sidebar')) {
      console.log('else if');
      $('#side-menu').hide();
      setTimeout(
        function () {
          $('#side-menu').fadeIn(400);
        }, 100);
    } else {
      console.log('else');
      // Remove all inline style from jquery fadeIn function to reset menu state
      $('#side-menu').removeAttr('style');
    }
  }

  pastTime(noti) {
    const now = new Date();
    const diffMinutes = this.common.diffMinutes(now, noti.sendDate);
    if (diffMinutes < 60) {
      return diffMinutes + ' นาที ที่แล้ว';
    } else if (diffMinutes < 1440) {
      return this.common.diffHours(now, noti.sendDate) + ' ชั่วโมง ที่แล้ว';
    } else {
      return this.common.diffDays(now, noti.sendDate) + ' วัน ที่แล้ว';
    }
  }

}
