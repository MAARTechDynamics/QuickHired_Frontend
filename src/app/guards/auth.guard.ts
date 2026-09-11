import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const token = localStorage.getItem('token'); 

  console.log('Auth Guard Check - Token:', token);
  
  if (token) {
    return true; 
  }

  
  const router = inject(Router);
  router.navigate(['/login']);
     //router.createUrlTree(['/login']); 
  return false;
};
