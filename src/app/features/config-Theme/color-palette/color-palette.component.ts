import {Component} from '@angular/core';
import {FormsModule} from "@angular/forms";
import {Tooltip} from "primeng/tooltip";
import {$dt} from "@primeng/themes";
import {setPrimaryColor} from "../../../core/utility/functions/set-primary-color";
import {NgClass} from "@angular/common";
import {setSurfaceColor} from "../../../core/utility/functions/set-surface-color";  
import {isDarkMode} from "../../../core/utility/functions/is-dark-mode";    

@Component({
  selector: 'nasa-color-palette',
  imports: [
    FormsModule,
    Tooltip,
    NgClass
  ],
  templateUrl: './color-palette.component.html',
  styleUrl: './color-palette.component.scss'
})
export class ColorPaletteComponent {
  protected readonly setPrimaryColor = setPrimaryColor;
  protected readonly setSurfaceColor = setSurfaceColor;

  preset: string | undefined;

  isPrimaryColor(color: string) {
    return $dt(color + '.500').value === $dt('primary.500').value;
  }

  isSurfaceColor(color: string) {
    const colorValue = $dt(color + '.500').value;
    const surfaceValue = $dt('surface.500').value;
    return colorValue === surfaceValue;
  }

  setPrimaryColorWithStorage(color: string) {
    this.setPrimaryColor(color);
    localStorage.setItem('primaryColor', color);
  }

  setSurfaceColorWithStorage(color: string) {
    this.setSurfaceColor(color);
    localStorage.setItem('surfaceColor', color);
  }
}
