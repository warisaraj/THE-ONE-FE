import {Component, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {Request} from '../shared/services/request.service';
import {GlobalVariable} from './noti-url.global';
import {Common} from '../shared/services/common.service';
import * as webNotification from 'simple-web-notification';

@Component({
  selector: 'app-noti-url',
  templateUrl: './noti-url.component.html',
})
export class NotiUrlComponent implements OnInit {
  constructor(private request: Request, private router: Router, private route: ActivatedRoute, private common: Common) { }
  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      console.log('params : all', params);
      let system = params.system ;
      let redirecturl = params.redirecturl ;

      console.log('params : all', system,redirecturl);
      if(system){
        this.router.navigate(['/menu/'+system+'/external'], { queryParams: { redirecturl: redirecturl }})//
      }
    });

  }


}
