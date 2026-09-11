import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { IdleTimeOutService } from './idle-time-out-service';
import { NavigationService } from './services/navigation.service';
import { I18nService } from './services/i18n.service';



@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'Quick_Hired';
  constructor(
    private router: Router,
    private idleTimeOutService: IdleTimeOutService,
    private navigationService: NavigationService,
    private i18nService: I18nService
  ) {}
 

  ngOnInit() {
  this.router.events.subscribe(event => {
    if (event instanceof NavigationEnd) {
      const selectedLang = localStorage.getItem('selectedLang') || 'en';
      console.log('App component detected language:', selectedLang);
     
      // Initialize I18nService with saved language
      setTimeout(() => {
        this.i18nService.setLanguage(selectedLang);
      }, 500);  
    }
  });
}
}
