// src/app/layout/services/layout.service.ts
import { Injectable, signal, computed } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export enum MenuMode {
  STATIC = 'static',
  OVERLAY = 'overlay',
  SLIM = 'slim',
  SLIM_PLUS = 'slim-plus',
  REVEAL = 'reveal',
  DRAWER = 'drawer',
  HORIZONTAL = 'horizontal'
}

export enum ThemeMode {
  LIGHT = 'light',
  DIM = 'dim',
  DARK = 'dark'
}

@Injectable({
  providedIn: 'root'
})
export class LayoutService {
  // Signals para estado reactivo
  private _menuMode = signal<MenuMode>(MenuMode.STATIC);
  private _mobileMenuActive = signal<boolean>(false);
  private _menuActive = signal<boolean>(false);
  private _overlayMenuActive = signal<boolean>(false);
  private _staticMenuInactive = signal<boolean>(false);
  private _sidebarVisible = signal<boolean>(false);
  private _themeMode = signal<ThemeMode>(ThemeMode.LIGHT);

  // Computed properties
  menuMode = computed(() => this._menuMode());
  mobileMenuActive = computed(() => this._mobileMenuActive());
  menuActive = computed(() => this._menuActive());
  overlayMenuActive = computed(() => this._overlayMenuActive());
  staticMenuInactive = computed(() => this._staticMenuInactive());
  sidebarVisible = computed(() => this._sidebarVisible());
  themeMode = computed(() => this._themeMode());

  // Estados computed derivados
  isDesktop = computed(() => window.innerWidth >= 992);
  isMobile = computed(() => window.innerWidth < 992);
  
  isStaticMenu = computed(() => this._menuMode() === MenuMode.STATIC);
  isOverlayMenu = computed(() => this._menuMode() === MenuMode.OVERLAY);
  isSlimMenu = computed(() => this._menuMode() === MenuMode.SLIM);
  isSlimPlusMenu = computed(() => this._menuMode() === MenuMode.SLIM_PLUS);
  isRevealMenu = computed(() => this._menuMode() === MenuMode.REVEAL);
  isDrawerMenu = computed(() => this._menuMode() === MenuMode.DRAWER);
  isHorizontalMenu = computed(() => this._menuMode() === MenuMode.HORIZONTAL);

  constructor() {
    // Detectar cambios de tamaño de ventana
    window.addEventListener('resize', () => {
      if (this.isDesktop() && this._mobileMenuActive()) {
        this._mobileMenuActive.set(false);
      }
    });

    // Cargar configuración guardada
    this.loadLayoutState();
  }

  // Métodos para cambiar el estado
  setMenuMode(mode: MenuMode) {
    this._menuMode.set(mode);
    this.saveLayoutState();
  }

  toggleMobileMenu() {
    this._mobileMenuActive.update(active => !active);
  }

  hideMobileMenu() {
    this._mobileMenuActive.set(false);
  }

  toggleMenu() {
    if (this.isMobile()) {
      this.toggleMobileMenu();
    } else {
      if (this.isStaticMenu()) {
        this._staticMenuInactive.update(inactive => !inactive);
      } else if (this.isOverlayMenu()) {
        this._overlayMenuActive.update(active => !active);
      }
    }
  }

  hideMenu() {
    if (this.isMobile()) {
      this.hideMobileMenu();
    } else {
      if (this.isOverlayMenu()) {
        this._overlayMenuActive.set(false);
      }
    }
  }

  showSidebar() {
    this._sidebarVisible.set(true);
  }

  hideSidebar() {
    this._sidebarVisible.set(false);
  }

  toggleSidebar() {
    this._sidebarVisible.update(visible => !visible);
  }

  setThemeMode(theme: ThemeMode) {
    this._themeMode.set(theme);
    this.saveLayoutState();
    this.applyTheme(theme);
  }

  // Persistencia
  private saveLayoutState() {
    const state = {
      menuMode: this._menuMode(),
      themeMode: this._themeMode()
    };
    localStorage.setItem('apollo-layout-state', JSON.stringify(state));
  }

  private loadLayoutState() {
    try {
      const saved = localStorage.getItem('apollo-layout-state');
      if (saved) {
        const state = JSON.parse(saved);
        this._menuMode.set(state.menuMode || MenuMode.STATIC);
        this._themeMode.set(state.themeMode || ThemeMode.LIGHT);
        this.applyTheme(this._themeMode());
      }
    } catch (error) {
      console.warn('Error loading layout state:', error);
    }
  }

  private applyTheme(theme: ThemeMode) {
    const body = document.body;
    body.classList.remove('theme-light', 'theme-dim', 'theme-dark');
    body.classList.add(`theme-${theme}`);
  }

  // Utilidades
  isMenuVisible(): boolean {
    if (this.isMobile()) {
      return this._mobileMenuActive();
    } else {
      if (this.isStaticMenu()) {
        return !this._staticMenuInactive();
      } else if (this.isOverlayMenu()) {
        return this._overlayMenuActive();
      } else {
        return true; // Para slim, reveal, etc.
      }
    }
  }

  getContainerClass(): string[] {
    const classes: string[] = ['layout-wrapper'];
    
    classes.push(`layout-${this._menuMode()}`);
    classes.push(`theme-${this._themeMode()}`);
    
    if (this.isMobile()) {
      classes.push('layout-mobile');
      if (this._mobileMenuActive()) {
        classes.push('layout-mobile-active');
      }
    } else {
      classes.push('layout-desktop');
      if (this.isStaticMenu() && this._staticMenuInactive()) {
        classes.push('layout-static-inactive');
      }
      if (this.isOverlayMenu() && this._overlayMenuActive()) {
        classes.push('layout-overlay-active');
      }
    }

    return classes;
  }
}