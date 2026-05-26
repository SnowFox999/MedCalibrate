import { Component, OnInit, inject, signal, ViewChild, AfterViewInit, ChangeDetectionStrategy, Injectable } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';

// Импорты Angular Material
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';

export interface Device {
  id: string;
  name: string;
  manufacturer: string;
  serialNumber: string;
  department: string;
  nextCalibrationDate: string;
}

export interface CalibrationLog {
  id?: string;
  deviceId: string;
  calibrationDate: string;
  technicalName: string;
  measuredError: number;
  isPassed: boolean;
  notes: string;
}

@Injectable({
  providedIn: 'root'
})
export class DeviceService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:5121/api'; 

  getDevices(): Observable<Device[]> {
    return this.http.get<Device[]>(`${this.baseUrl}/devices`);
  }

  addCalibration(log: CalibrationLog): Observable<CalibrationLog> {
    return this.http.post<CalibrationLog>(`${this.baseUrl}/calibrations`, log);
  }
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatSelectModule
  ],
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App implements OnInit, AfterViewInit {
  title = 'MedCalibrate';
  private deviceService = inject(DeviceService);

  dataSource = new MatTableDataSource<Device>([]);
  devicesList = signal<Device[]>([]);
  displayedColumns: string[] = ['name', 'manufacturer', 'serialNumber', 'department', 'nextCalibrationDate', 'status'];

  isLoading = signal<boolean>(true);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  newLog: CalibrationLog = {
    deviceId: '',
    calibrationDate: '',
    technicalName: '',
    measuredError: 0,
    isPassed: true,
    notes: ''
  };

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit(): void {
    this.loadDevices();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadDevices(): void {
    this.isLoading.set(true);
    this.deviceService.getDevices().subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.devicesList.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(`Ошибка загрузки: ${err.message}`);
        this.isLoading.set(false);
      }
    });
  }

  submitCalibration(form: any): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.deviceService.addCalibration(this.newLog).subscribe({
      next: (res) => {
        this.successMessage.set('Протокол поверки успешно сохранен в PostgreSQL!');
        this.loadDevices(); 
        form.resetForm();
        this.newLog = { deviceId: '', calibrationDate: '', technicalName: '', measuredError: 0, isPassed: true, notes: '' };
      },
      error: (err) => {
        this.errorMessage.set(`Не удалось сохранить протокол: ${err.message}`);
      }
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }
}