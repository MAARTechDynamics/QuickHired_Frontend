import { Injectable } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { SeoService } from './seo.service';
import { AnalyticsService } from './analytics.service';

@Injectable({
  providedIn: 'root'
})
export class NavigationService {
  constructor(
    private router: Router,
    private seoService: SeoService,
    private analyticsService: AnalyticsService
  ) {
    this.initRouteTracking();
  }

  private initRouteTracking(): void {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.analyticsService.trackPageView(event.urlAfterRedirects);
        
        if (typeof window !== 'undefined') {
          window.scrollTo(0, 0);
        }
      });
  }
}
