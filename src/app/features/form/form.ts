// src/app/features/form/form.component.ts
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedMapComponent, MapPosition } from '../../share/components/shared-map/shared-map';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-form',
  standalone: true,
  imports: [CommonModule, SharedMapComponent, ButtonModule, InputTextModule, FormsModule, CardModule, TagModule],
  templateUrl: './form.html',
  styleUrls: ['./form.scss']
})
export class FormComponent {
  // Form state
  formData = {
    latitude: '',
    longitude: '',
    description: ''
  };

  // Map configuration (without overlays)
  mapConfig = {
    showControls: false,    // No UI controls
    showPositionInfo: false, // Hide coordinate readout
    height: 'h-96'
  };

  // Optional initial position
  initialMapPosition = signal<[number, number] | null>(null);

  // Card copy helpers
  currentLatitude = '';
  currentLongitude = '';
  currentZoom = '';
  hasSelection = false;

  // Optional map component reference for extra controls
  private mapComponent?: any;

  // Handle position selection on the map
  onPositionSelected(position: MapPosition) {
    this.formData.latitude = position.latitude.toFixed(6);
    this.formData.longitude = position.longitude.toFixed(6);
    
    // Update detail card data
    this.currentLatitude = position.latitude.toFixed(4);
    this.currentLongitude = position.longitude.toFixed(4);
    this.currentZoom = position.zoom.toFixed(1);
    this.hasSelection = true;
    
    console.log('Selected position:', position);
  }

  // Handle position clearing
  onPositionCleared() {
    this.formData.latitude = '';
    this.formData.longitude = '';
    this.currentLatitude = '';
    this.currentLongitude = '';
    this.currentZoom = '';
    this.hasSelection = false;
    console.log('Position cleared');
  }

  // Center on the current position (requires map reference)
  centerOnCurrentPosition() {
    if (this.hasSelection) {
      // This method would require a reference to the map component
      // or could be implemented differently
      console.log('Centering on current position');
    }
  }

  // Clear map selection
  clearMapSelection() {
    this.onPositionCleared();
    // Trigger the map cleanup hook here as well
  }

  // Persist selected location
  saveLocation() {
    const locationData = {
      latitude: parseFloat(this.formData.latitude),
      longitude: parseFloat(this.formData.longitude),
      description: this.formData.description
    };
    
    console.log('Saving location:', locationData);
    // API call goes here
  }
}
