import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Device } from '../models/device.model'; 

@Injectable({
  providedIn: 'root'
})
export class DeviceService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:5121/api/devices'; 

  getDevices(): Observable<Device[]> {
    return this.http.get<Device[]>(this.apiUrl);
  }
}