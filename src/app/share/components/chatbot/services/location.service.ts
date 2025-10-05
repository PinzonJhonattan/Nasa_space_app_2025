import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { environment } from '../../../../../environments/environment';

export interface LocationInfo {
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
  region?: string;
  formattedAddress?: string;
}

export interface GeocodingResponse {
  features: Array<{
    place_name: string;
    context: Array<{
      id: string;
      text: string;
    }>;
    geometry: {
      coordinates: [number, number];
    };
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  private readonly apiUrl = 'https://api.mapbox.com/geocoding/v5/mapbox.places';

  constructor(private http: HttpClient) {}

  getLocationInfo(longitude: number, latitude: number): Observable<LocationInfo> {
    const params = new HttpParams()
      .set('access_token', environment.mapboxToken)
      .set('types', 'place,locality,neighborhood,address')
      .set('limit', '1');

    const url = `${this.apiUrl}/${longitude},${latitude}.json`;

    return this.http.get<GeocodingResponse>(url, { params }).pipe(
      map(response => {
        if (response.features && response.features.length > 0) {
          const feature = response.features[0];
          const context = feature.context || [];

          // Extract location details from the context
          const city = this.extractFromContext(context, ['place', 'locality', 'neighborhood']);
          const region = this.extractFromContext(context, ['region']);
          const country = this.extractFromContext(context, ['country']);

          return {
            latitude,
            longitude,
            city: city || 'Unknown location',
            country: country || 'Unknown country',
            region: region || '',
            formattedAddress: feature.place_name
          };
        }

        // Fallback if no location information is found
        return {
          latitude,
          longitude,
          city: 'Unknown location',
          country: 'Unknown country',
          formattedAddress: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
        };
      }),
      catchError(error => {
        console.error('Failed to fetch location information:', error);
        // Return basic information with coordinates
        return of({
          latitude,
          longitude,
          city: 'Unknown location',
          country: 'Unknown country',
          formattedAddress: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
        });
      })
    );
  }

  private extractFromContext(context: Array<{id: string, text: string}>, types: string[]): string | null {
    for (const item of context) {
      for (const type of types) {
        if (item.id.startsWith(`${type}.`)) {
          return item.text;
        }
      }
    }
    return null;
  }

  formatLocationDisplay(location: LocationInfo): string {
    if (location.city && location.country) {
      return `${location.city}, ${location.country}`;
    }
    return location.formattedAddress || `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;
  }

  formatCoordinates(location: LocationInfo): string {
    return `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;
  }
}
