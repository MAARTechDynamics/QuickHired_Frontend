import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, DOCUMENT } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { environment } from '../environments/environment';

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private lastTrackedUrl: string = '';
  private measurementId: string = 'G-XXXXXXXXXX';
  private isInitialized: boolean = false;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    @Inject(DOCUMENT) private document: Document,
    private router: Router
  ) {
    this.initGA4();
    this.initRouteTracking();
  }

  private initGA4(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (!this.measurementId || this.measurementId === 'G-XXXXXXXXXX') return;
    if (this.isInitialized) return;

    const existingScript = this.document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${this.measurementId}"]`);
    if (existingScript) {
      this.isInitialized = true;
      return;
    }

    const script = this.document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${this.measurementId}`;
    this.document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function() {
      window.dataLayer!.push(arguments);
    };
    window.gtag('js', new Date());
    window.gtag('config', this.measurementId, {
      'send_page_view': false
    });

    this.isInitialized = true;
  }

  private initRouteTracking(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        filter(event => !event.urlAfterRedirects.includes('#'))
      )
      .subscribe((event: NavigationEnd) => {
        const url = event.urlAfterRedirects;
        if (url !== this.lastTrackedUrl) {
          this.lastTrackedUrl = url;
          this.trackPageView(url);
        }
      });
  }

  trackPageView(url: string): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (!this.isInitialized) return;

    if (window.gtag) {
      window.gtag('event', 'page_view', {
        page_path: url,
        page_location: window.location.href,
        page_title: this.document.title
      });
    }
  }

  trackCTAClick(ctaName: string, location: string): void {
    if (!isPlatformBrowser(this.platformId)) return;

    if (window.gtag) {
      window.gtag('event', 'cta_click', {
        event_category: 'engagement',
        event_label: ctaName,
        cta_location: location
      });
    }
  }

  trackToolUsage(toolName: string): void {
    if (!isPlatformBrowser(this.platformId)) return;

    if (window.gtag) {
      window.gtag('event', 'tool_usage', {
        event_category: 'product',
        event_label: toolName
      });
    }
  }

  trackPricingInteraction(planName: string, action: string): void {
    if (!isPlatformBrowser(this.platformId)) return;

    if (window.gtag) {
      window.gtag('event', 'pricing_interaction', {
        event_category: 'conversion',
        event_label: planName,
        action: action
      });
    }
  }

  trackFormSubmit(formName: string): void {
    if (!isPlatformBrowser(this.platformId)) return;

    if (window.gtag) {
      window.gtag('event', 'form_submit', {
        event_category: 'engagement',
        event_label: formName
      });
    }
  }
}
