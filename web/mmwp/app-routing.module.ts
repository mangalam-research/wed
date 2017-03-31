import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";

import { routes as dRoutes } from "../dashboard/app-routing.module";

const routes: Routes = dRoutes ;
// tslint:disable-next-line:no-stateless-class
@NgModule({
  imports: [ RouterModule.forRoot(routes, {
    useHash: true,
  }) ],
  exports: [ RouterModule ],
})
export class AppRoutingModule {}
