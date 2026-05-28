import { Component, OnInit, inject, signal, computed, ViewChild, AfterViewInit, ChangeDetectionStrategy, Injectable } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule, NgForm } from '@angular/forms';
import { Observable } from 'rxjs';

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

export interface CopilotMessage {
  sender: 'user' | 'system';
  timestamp: string;
  text: string;
  isCode?: boolean;
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

  getTechnicians(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/calibrations/technicians`);
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
  techniciansList = signal<string[]>([]);
  displayedColumns: string[] = ['name', 'manufacturer', 'serialNumber', 'department', 'nextCalibrationDate', 'status'];

  isLoading = signal<boolean>(true);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // Berechnete KPI
  totalDevices = computed(() => this.devicesList().length);
  urgentDevices = computed(() => {
    const today = new Date();
    return this.devicesList().filter(d => {
      const calDate = new Date(d.nextCalibrationDate);
      const diffTime = calDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 30;
    });
  });

  newLog: CalibrationLog = {
    deviceId: '',
    calibrationDate: '',
    technicalName: '',
    measuredError: 0,
    isPassed: true,
    notes: ''
  };

  // AI Copilot
  aiQuery = signal<string>('');
  aiMessages = signal<CopilotMessage[]>([
    {
      sender: 'system',
      timestamp: '14:02:11',
      text: 'Das KI-Dokumentationsanalysesystem ist betriebsbereit. Wählen Sie ein Gerät aus oder geben Sie Fehlerparameter ein (z. B. „Fehlertoleranz für Mikrotom HM 525 gemäß DIN EN ISO 13485“).'
    }
  ]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit(): void {
    this.loadDevices();
    this.loadTechnicians();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    this.dataSource.sortingDataAccessor = (item: Device, property: string) => 
      property === 'status' 
        ? (this.isUrgent(item.nextCalibrationDate) ? 'A' : 'B') 
        : (item as any)[property];
  }

  loadTechnicians(): void {
    this.deviceService.getTechnicians().subscribe({
      next: (data) => {
        this.techniciansList.set(data);
      },
      error: (err) => {
        this.errorMessage.set(`Fehler beim Laden der Techniker: ${err.message}`);
      }
    });
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
        this.errorMessage.set(`Fehler beim Laden: ${err.message}`);
        this.isLoading.set(false);
      }
    });
  }

  submitCalibration(form: NgForm): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.deviceService.addCalibration(this.newLog).subscribe({
      next: (res) => {
        this.successMessage.set('Protokoll erfolgreich gespeichert.');
        this.loadDevices(); 
        form.resetForm();
        this.newLog = { deviceId: '', calibrationDate: '', technicalName: '', measuredError: 0, isPassed: true, notes: '' };
        setTimeout(() => this.successMessage.set(null), 4000);
      },
      error: (err) => {
        this.errorMessage.set(`Fehler beim Speichern: ${err.message}`);
      }
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  isUrgent(dateString: string): boolean {
    const calDate = new Date(dateString);
    const today = new Date();
    const diffTime = calDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30;
  }

  // For displaying top 5 urgent devices 
  topUrgentDevices = computed(() => {
    return [...this.urgentDevices()]
      .sort((a, b) => {
        const dateA = new Date(a.nextCalibrationDate).getTime();
        const dateB = new Date(b.nextCalibrationDate).getTime();
        return dateA - dateB; // Sorting: from most urgent to least urgent
      })
      .slice(0, 5); // Take first 5 items
  });

  // Send AI prompt and simulate response
  sendAiPrompt(promptText?: string) {
    const textToSend = promptText || this.aiQuery();
    if (!textToSend.trim()) return;

    const time = new Date().toTimeString().split(' ')[0];
    
    // User message
    this.aiMessages.update(msgs => [...msgs, { sender: 'user', timestamp: time, text: textToSend }]);
    if (!promptText) this.aiQuery.set('');

    // Imitate AI response after a delay
    setTimeout(() => {
      const responseTime = new Date().toTimeString().split(' ')[0];
      this.aiMessages.update(msgs => [...msgs, { 
        sender: 'system', 
        timestamp: responseTime, 
        text: `[ANALYSIS] Für die angefragten Parameter beträgt der Systemtoleranz gemäß der Richtlinie MPBetreibV ±0.50%. Die Fehler in ${textToSend.includes('0.8') ? '0.8%' : 'den angegebenen Grenzen'} überschreiten den Nennwert. Es wird eine Kalibrierung des Hardware-Blocks empfohlen.`,
        isCode: true
      }]);
    }, 800);
  }
}