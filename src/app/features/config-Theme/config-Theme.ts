import { Component } from '@angular/core';
import { LayoutService } from '../../layout/services/layout.service';
import { ButtonModule } from 'primeng/button';
import { ColorPaletteComponent } from './color-palette/color-palette.component';
import { isDarkMode } from '../../core/utility/functions/is-dark-mode';
import { setSurfaceColor } from '../../core/utility/functions/set-surface-color';
import { FormsModule } from '@angular/forms';
import { SelectButton } from 'primeng/selectbutton';

@Component({
  selector: 'app-config-theme',
  templateUrl: './config-Theme.html',
  styleUrls: ['./config-Theme.scss'],
  standalone: true,
  imports: [ButtonModule, ColorPaletteComponent, FormsModule, SelectButton]
})
export class ConfigThemeComponent {
  protected readonly isDarkMode = isDarkMode;
  stateOptions: any[] = [{ label: 'Dark Mode', value: 'dark' },{ label: 'Light Mode', value: 'light' }];

  value: string = 'dark';

  constructor(private layoutService: LayoutService) {}

  ngOnInit() {
  // Check if there's a saved preference, if not, use dark by default
  const savedTheme = localStorage.getItem('theme') || 'dark';
  if (savedTheme === 'dark') {
    this.toggleDarkMode();
  } else {
    this.toggleDarkMode();
    this.toggleDarkMode();
  }
  
  // Set default surface color to slate
  const savedSurfaceColor = localStorage.getItem('surfaceColor') || 'slate';
  setSurfaceColor(savedSurfaceColor);
  
  // Save the preferences
  localStorage.setItem('theme', savedTheme);
  localStorage.setItem('surfaceColor', savedSurfaceColor);
}

onThemeChange(event: any) {
  if (event.value === 'dark' && !this.isDarkMode()) {
    this.toggleDarkMode();
  } else if (event.value === 'light' && this.isDarkMode()) {
    this.toggleDarkMode();
  }

  // Save user preference
  localStorage.setItem('theme', event.value);
}

  toggleDarkMode() {
    const htmlElement = document.querySelector('html');
    const bodyElement = document.querySelector('body');

    htmlElement?.classList.toggle('my-app-dark');
    bodyElement?.classList.toggle('my-app-dark');
  }

  toggleColorPicker() {
    const element = document.querySelector('.nasa-color-palette-panel');
    element?.classList.toggle('nasa-show');
  }
}
