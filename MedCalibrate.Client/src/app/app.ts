import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { DeviceService } from './services/device';
import { Device } from './models/device.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  title = 'MedCalibrate';
  private deviceService = inject(DeviceService);

  // Use signal for reactive state management
  devices = signal<Device[]>([]);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.loadDevices();
  }

  loadDevices(): void {
    this.isLoading.set(true);
    this.deviceService.getDevices().subscribe({
      next: (data) => {
        this.devices.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.errorMessage.set('Failed to load devices. Please try again later.');
        this.isLoading.set(false);
      }
    });
  }
}