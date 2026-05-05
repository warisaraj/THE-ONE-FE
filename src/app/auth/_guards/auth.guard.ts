import { Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from "@angular/router";
import { UserService } from "../_services/user.service";
import { Observable } from "rxjs/Rx";
import { StoreService } from '../../shared/services/store.service';
@Injectable()
export class AuthGuard implements CanActivate {

    constructor(private _router: Router, private _userService: UserService,private store: StoreService,) {
    }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | boolean {


        console.log("route",route.queryParams.token)
        if(route.queryParams && route.queryParams.token){
          sessionStorage.setItem('currentUser', JSON.stringify({ token: route.queryParams.token}));
          // this.route.navigate(['.'], { relativeTo: this.route, queryParams: {  } });
        }

        let currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
        console.log('currentUser',currentUser)
        return this._userService.verify()
        .catch(res => {
          // this._router.navigate(['/login'], { queryParams: { returnUrl: state.url } });

          this._router.navigateByUrl('/error', {skipLocationChange: true}).then(
            ()=> this._router.navigate(['/login'], { queryParams: { returnUrl: state.url } })
          );


          return  Observable.throw(res.json())
        }).map(
            data => {
                if (data.resultCode == '20000') {
                  console.log('Data : ', data);
                  console.log(data.resultData.username)
                    this.store.menu = data.resultData.menus;
                    this._userService.userMenu = data.resultData.menus;
                    this.store.user = {username:data.resultData.username}
                    this.store.menuFavorite = data.resultData.menuFavorites?data.resultData.menuFavorites:[]
                    this.store.permission = data.resultData.permission
                    this.store.pagePermissionList = data.resultData.pagePermissionList

                    // logged in so return true
                    return true;
                }
                console.log('error','error')
                // error when verify so redirect to login page with the return url
                // this._router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
                sessionStorage.setItem('verifyErrorResultCode',data.resultCode);
                sessionStorage.setItem('verifyErrorResultDescription',data.resultDescription);

                this._router.navigateByUrl('/error', {skipLocationChange: true}).then(
                  ()=> this._router.navigate(['/login'], { queryParams: { returnUrl: state.url } })
                );
                return false;
            },
            error => {
              console.log('error',error)
                // error when verify so redirect to login page with the return url
                // this._router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
                this._router.navigateByUrl('/error', {skipLocationChange: true}).then(
                  ()=> this._router.navigate(['/login'], { queryParams: { returnUrl: state.url } })
                );
                return false;
            })

    }
}
