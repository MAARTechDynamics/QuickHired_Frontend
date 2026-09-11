import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface Language {
  code: string;
  name: string;
  display: string;
  flag: string;
}

@Injectable({
  providedIn: 'root'
})
export class I18nService {
  private currentLanguageSubject = new BehaviorSubject<string>('en');
  public currentLanguage$ = this.currentLanguageSubject.asObservable();

  private translations: { [lang: string]: any } = {};
  private fallbackTranslations: any = {};
  private userId: string = '';
  private userApiUrl = `${environment.apiBaseUrl}/api/SecurityMaster`;

  constructor(private http: HttpClient) {
    this.loadCurrentUser();
    this.initializeLanguage();
  }

  private loadCurrentUser() {
    const token = localStorage.getItem('token');
    if (token) {
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
      this.http.get<any>(this.userApiUrl, { headers }).subscribe({
        next: (res) => {
          this.userId = res.model?.userId || '';
          this.loadUserLanguagePreference();
        },
        error: () => {
          this.initializeLanguage();
        }
      });
    } else {
      this.initializeLanguage();
    }
  }

  private loadUserLanguagePreference() {
    if (this.userId) {
      const headers = new HttpHeaders().set('Authorization', `Bearer ${localStorage.getItem('token')}`);
      this.http.get<any>(`${this.userApiUrl}/language-preference/${this.userId}`, { headers }).subscribe({
        next: (res) => {
          const userLang = res.languageCode || localStorage.getItem('selectedLang') || 'en';
          this.setLanguage(userLang);
        },
        error: () => {
          const savedLang = localStorage.getItem('selectedLang') || 'en';
          this.setLanguage(savedLang);
        }
      });
    }
  }

  private saveUserLanguagePreference(languageCode: string) {
    if (this.userId) {
      const token = localStorage.getItem('token');
      if (token) {
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
        const payload = { userId: this.userId, languageCode };
        
        this.http.post(`${this.userApiUrl}/save-language-preference`, payload, { headers }).subscribe({
          next: () => {
            console.log('Language preference saved successfully');
          },
          error: (error) => {
            console.error('Failed to save language preference:', error);
          }
        });
      }
    }
  }

  async initializeLanguage() {
    await this.loadTranslations();
    const savedLang = localStorage.getItem('selectedLang') || 'en';
    this.setLanguage(savedLang);
  }

  private async loadTranslations() {
    try {
      // Load English (fallback)
      this.fallbackTranslations = await import('../assets/i18n/en.json').then(m => m.default);
      this.translations['en'] = this.fallbackTranslations;

      // Load other languages
      const languages = ['es', 'fr', 'de', 'pt', 'it', 'ru', 'zh', 'ja', 'ko', 'ar'];
      
      for (const lang of languages) {
        try {
          const translation = await import(`../assets/i18n/${lang}.json`).then(m => m.default);
          this.translations[lang] = translation;
        } catch (e) {
          console.warn(`Translation file for ${lang} not found, using fallback`);
          this.translations[lang] = this.fallbackTranslations;
        }
      }
    } catch (error) {
      console.error('Error loading translations:', error);
      this.fallbackTranslations = {};
    }
  }

  setLanguage(lang: string): Promise<void> {
    return new Promise((resolve) => {
      this.currentLanguageSubject.next(lang);
      localStorage.setItem('selectedLang', lang);
      
      // Save to user preferences if logged in
      this.saveUserLanguagePreference(lang);
      
      // Apply to document language
      document.documentElement.lang = lang;
      
      resolve();
    });
  }

  getCurrentLanguage(): string {
    return this.currentLanguageSubject.value;
  }

  translate(key: string, params?: { [key: string]: string }): string {
    const currentLang = this.getCurrentLanguage();
    const translations = this.translations[currentLang] || this.fallbackTranslations;
    
    let translation = translations[key];
    
    // Fallback to English if translation not found
    if (!translation && currentLang !== 'en') {
      translation = this.fallbackTranslations[key];
    }
    
    // Fallback to key if no translation found
    if (!translation) {
      translation = key;
    }

    // Replace parameters if provided
    if (params) {
      Object.keys(params).forEach(param => {
        translation = translation.replace(new RegExp(`{{${param}}}`, 'g'), params[param]);
      });
    }

    return translation;
  }

  // Get all available languages
  getAvailableLanguages(): Language[] {
    return [
      { code: 'en', name: 'english', display: 'English', flag: 'assets/media/flags/united-states.svg' },
      { code: 'es', name: 'spanish', display: 'Español', flag: 'assets/media/flags/spain.svg' },
      { code: 'fr', name: 'french', display: 'Français', flag: 'assets/media/flags/france.svg' },
      { code: 'de', name: 'german', display: 'Deutsch', flag: 'assets/media/flags/germany.svg' },
      { code: 'it', name: 'italian', display: 'Italiano', flag: 'assets/media/flags/italy.svg' },
      { code: 'pt', name: 'portuguese', display: 'Português', flag: 'assets/media/flags/brazil.svg' },
      { code: 'ru', name: 'russian', display: 'Русский', flag: 'assets/media/flags/russia.svg' },
      { code: 'zh', name: 'chinese', display: '中文', flag: 'assets/media/flags/china.svg' },
      { code: 'ja', name: 'japanese', display: '日本語', flag: 'assets/media/flags/japan.svg' },
      { code: 'ko', name: 'korean', display: '한국어', flag: 'assets/media/flags/south-korea.svg' },
      { code: 'ar', name: 'arabic', display: 'العربية', flag: 'assets/media/flags/saudi-arabia.svg' }
    ];
  }
}