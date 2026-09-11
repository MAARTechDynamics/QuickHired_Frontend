import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { Router, NavigationEnd } from '@angular/router';
import { isPlatformBrowser, DOCUMENT } from '@angular/common';
import { filter } from 'rxjs/operators';
import { environment } from '../environments/environment';
import { SEO_CONFIG, PageSeoConfig } from '../config/seo.config';

export interface JsonLdSchema {
  '@context': string;
  '@type': string;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class SeoService {
  private readonly baseUrl = this.getProductionSafeBaseUrl();
  private readonly defaultImage = `${this.baseUrl}/assets/media/logos/quickhired-og.jpg`;
  private schemaScriptIds: Set<string> = new Set();

  constructor(
    private meta: Meta,
    private titleService: Title,
    private router: Router,
    @Inject(DOCUMENT) private document: Document,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.initOrganizationSchema();
    this.initWebSiteSchema();
  }

  private getProductionSafeBaseUrl(): string {
    if (environment.production && isPlatformBrowser(this.platformId)) {
      const envUrl = environment.baseUrl || '';
      if (!envUrl || envUrl.includes('localhost')) {
        return window.location.origin;
      }
      return envUrl;
    }
    return environment.baseUrl || 'https://quickhired.com';
  }

  setPageMetaFromRoute(routeKey: string): void {
    const config = SEO_CONFIG[routeKey];
    if (!config) return;

    this.setPageMeta({
      title: config.title,
      description: config.description,
      keywords: config.keywords,
      canonicalPath: config.canonicalPath,
      ogType: config.ogType,
      ogImage: config.ogImage,
      robots: config.robots
    });

    if (config.faqs && config.faqs.length > 0) {
      this.addFAQSchema(config.faqs);
    } else {
      this.removeJsonLd('ld-faq');
    }
  }

  setPageMeta(config: {
    title: string;
    description: string;
    keywords?: string[];
    canonicalPath: string;
    ogType?: string;
    ogImage?: string;
    robots?: string;
  }): void {
    this.titleService.setTitle(config.title);

    this.meta.updateTag({ name: 'description', content: config.description });
    
    if (config.keywords && config.keywords.length > 0) {
      this.meta.updateTag({ name: 'keywords', content: config.keywords.join(', ') });
    }

    this.meta.updateTag({ 
      name: 'robots', 
      content: config.robots || 'index, follow'
    });

    const canonicalUrl = `${this.baseUrl}/${config.canonicalPath}`;
    this.setCanonicalUrl(canonicalUrl);

    this.meta.updateTag({ property: 'og:title', content: config.title });
    this.meta.updateTag({ property: 'og:description', content: config.description });
    this.meta.updateTag({ property: 'og:type', content: config.ogType || 'website' });
    this.meta.updateTag({ property: 'og:url', content: canonicalUrl });
    this.meta.updateTag({ property: 'og:image', content: config.ogImage || this.defaultImage });
    this.meta.updateTag({ property: 'og:site_name', content: 'QuickHired' });

    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: config.title });
    this.meta.updateTag({ name: 'twitter:description', content: config.description });
    this.meta.updateTag({ name: 'twitter:image', content: config.ogImage || this.defaultImage });
  }

  setCanonicalUrl(url: string): void {
    if (!isPlatformBrowser(this.platformId)) return;

    let link: HTMLLinkElement | null = this.document.querySelector('link[rel="canonical"]');
    
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }
    
    link.setAttribute('href', url);
  }

  addJsonLd(schema: JsonLdSchema, scriptId?: string): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const id = scriptId || `jsonld-${schema['@type'].toLowerCase()}-${Date.now()}`;

    if (this.schemaScriptIds.has(id)) {
      const existingScript = this.document.getElementById(id);
      if (existingScript) {
        existingScript.textContent = JSON.stringify(schema);
        return;
      }
    }

    const script = this.document.createElement('script');
    script.type = 'application/ld+json';
    script.id = id;
    script.textContent = JSON.stringify(schema);
    this.document.head.appendChild(script);
    this.schemaScriptIds.add(id);
  }

  removeJsonLd(scriptId: string): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const script = this.document.getElementById(scriptId);
    if (script) {
      script.remove();
      this.schemaScriptIds.delete(scriptId);
    }
  }

  addWebPageSchema(pageName: string, description: string, url: string): void {
    const schema: JsonLdSchema = {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      'name': pageName,
      'description': description,
      'url': url,
      'inLanguage': 'en-US',
      'isPartOf': {
        '@type': 'WebSite',
        '@id': `${this.baseUrl}/#website`
      }
    };

    this.addJsonLd(schema, 'ld-webpage');
  }

  addBreadcrumbSchema(items: Array<{ name: string; url: string }>): void {
    const listItems = items.map((item, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'name': item.name,
      'item': item.url
    }));

    const schema: JsonLdSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      'itemListElement': listItems
    };

    this.addJsonLd(schema, 'ld-breadcrumbs');
  }

  addFAQSchema(faqs: Array<{ question: string; answer: string }>): void {
    if (!faqs || faqs.length === 0) {
      this.removeJsonLd('ld-faq');
      return;
    }

    const mainEntities = faqs.map(faq => ({
      '@type': 'Question',
      'name': faq.question,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': faq.answer
      }
    }));

    const schema: JsonLdSchema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      'mainEntity': mainEntities
    };

    this.addJsonLd(schema, 'ld-faq');
  }

  removeFAQSchema(): void {
    this.removeJsonLd('ld-faq');
  }

  private initOrganizationSchema(): void {
    const schema: JsonLdSchema = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      '@id': `${this.baseUrl}/#organization`,
      'name': 'QuickHired',
      'url': this.baseUrl,
      'logo': `${this.baseUrl}/assets/media/logos/quickhired-logo.png`,
      'description': 'AI-powered interview preparation platform providing real-time assistance for coding, behavioral, and technical interviews.',
      'sameAs': [
        'https://www.linkedin.com/company/quickhired',
        'https://twitter.com/quickhired',
        'https://www.facebook.com/quickhired'
      ],
      'contactPoint': {
        '@type': 'ContactPoint',
        'contactType': 'Customer Support',
        'email': 'support@quickhired.com'
      }
    };

    this.addJsonLd(schema, 'ld-org');
  }

  private initWebSiteSchema(): void {
    const schema: JsonLdSchema = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': `${this.baseUrl}/#website`,
      'url': this.baseUrl,
      'name': 'QuickHired',
      'description': 'AI Interview Copilot for Real-Time Interview Assistance',
      'publisher': {
        '@id': `${this.baseUrl}/#organization`
      },
      'inLanguage': 'en-US'
    };

    this.addJsonLd(schema, 'ld-website');
  }

  trackEvent(eventName: string, eventParams?: Record<string, any>): void {
    if (!isPlatformBrowser(this.platformId)) return;

    if (typeof (window as any).gtag !== 'undefined') {
      (window as any).gtag('event', eventName, eventParams);
    }
  }
}
