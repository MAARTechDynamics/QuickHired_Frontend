import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class IdleTimeOutService {
  private timeoutId: any;
  private readonly timeoutDuration = 30 * 60 * 1000; 
  private isProcessActive: boolean = false; // NEW FLAG

  constructor(private router: Router, private ngZone: NgZone) {
    this.setupListeners();
    this.resetTimeout(); // start on app load
  }

  private setupListeners(): void {
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

    events.forEach(event => {
      window.addEventListener(event, () => this.resetTimeout());
    });
  }

  private resetTimeout(): void {
    clearTimeout(this.timeoutId);

    
    if (this.isProcessActive) {
      return; 
    }

    this.ngZone.runOutsideAngular(() => {
      this.timeoutId = setTimeout(() => {
        this.ngZone.run(() => {
          // Session clear
          localStorage.removeItem('token');
          this.router.navigate(['/login']);
        });
      }, this.timeoutDuration);
    });
  }

  
  public pauseTimeout(): void {
    this.isProcessActive = true;
    clearTimeout(this.timeoutId);
  }

 
  public resumeTimeout(): void {
    this.isProcessActive = false;
    this.resetTimeout();
  }
}
