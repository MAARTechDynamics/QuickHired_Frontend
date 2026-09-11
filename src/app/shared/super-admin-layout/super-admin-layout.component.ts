import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FooterComponent } from '../footer/footer.component';
import { NavBarComponent } from '../nav-bar/nav-bar.component';
import { SuperAdminNavbarComponent } from "../../super-admin-navbar/super-admin-navbar.component";

@Component({
  selector: 'app-super-admin-layout',
 standalone: true,
  imports: [RouterOutlet, FooterComponent, SuperAdminNavbarComponent],
  template: `
    <app-super-admin-navbar></app-super-admin-navbar>
    <router-outlet></router-outlet>
    <app-footer></app-footer>
  `,
 
})
export class SuperAdminLayoutComponent {

}
