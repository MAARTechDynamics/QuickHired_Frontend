import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const superAdminGuard: CanActivateFn = (route, state) => {
  const role = localStorage.getItem('role');

  if (role === 'Super Admin') {
    return true; 
  }

  
  const router = inject(Router);
  router.navigate(['/']);
  return false;
};
