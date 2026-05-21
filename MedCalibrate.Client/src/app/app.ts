import { Component, OnInit, inject, signal, ViewChild, AfterViewInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// import Angular Material
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';

// interface for device data
export interface Device {
  id: string;
  name: string;
  manufacturer: string;
  serialNumber: string;
  department: string;
  nextCalibrationDate: string;
}

// Service for backend API requests
import { Injectable } from '@angular/core';

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

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule
  ],
  template: `
    <!-- main container with Tailwind CSS -->
    <div class="min-h-screen bg-slate-950 p-6 sm:p-12 text-slate-100">
      <div class="max-w-7xl mx-auto">
        
        <!-- header -->
        <header class="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-900 pb-6">
          <div>
            <span class="text-xs font-bold tracking-widest text-emerald-400 uppercase font-mono">Thüringen MedTech Standard</span>
            <h1 class="text-3xl font-extrabold text-white mt-1 tracking-tight">MedCalibrate Hub</h1>
            <p class="text-slate-400 text-sm mt-1">System for managing calibration of medical devices</p>
          </div>
          
          <div class="bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-xl flex items-center gap-3 shadow-lg">
            <span class="relative flex h-2.5 w-2.5">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span class="text-xs text-slate-300 font-mono font-semibold">API Status: Connected</span>
          </div>
        </header>

        <!-- Error message container -->
        <div *ngIf="errorMessage()" class="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 text-sm">
          {{ errorMessage() }}
        </div>

        <!-- Search and update button -->
        <div class="mb-6 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
          <div class="w-full sm:max-w-md">
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Search devices, brands or departments</mat-label>
              <input matInput (keyup)="applyFilter($event)" placeholder="For example: Zeiss, Cardiology..." #input>
              <mat-icon matSuffix class="text-slate-400">search</mat-icon>
            </mat-form-field>
          </div>
          
          <button (click)="loadDevices()" class="h-[52px] bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-semibold rounded-xl px-6 flex items-center gap-2 shadow-lg shadow-emerald-950/20 border-none cursor-pointer transition-all duration-150">
            <mat-icon>refresh</mat-icon> Update Data
          </button>
        </div>

        <!-- Table -->
        <div class="bg-slate-900 border border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl">
          
          <!-- Loading spinner -->
          <div *ngIf="isLoading()" class="flex flex-col items-center justify-center p-24 gap-4">
            <mat-spinner diameter="45" color="accent"></mat-spinner>
            <p class="text-slate-400 text-sm font-mono">Loading data from PostgreSQL...</p>
          </div>

          <!-- Material table container -->
          <div [class.hidden]="isLoading()">
            <table mat-table [dataSource]="dataSource" matSort class="w-full">

              <!-- Name -->
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef mat-sort-header> Device Name </th>
                <td mat-cell *matCellDef="let device" class="text-white! font-semibold"> {{device.name}} </td>
              </ng-container>

              <!-- Manufacturer -->
              <ng-container matColumnDef="manufacturer">
                <th mat-header-cell *matHeaderCellDef mat-sort-header> Manufacturer </th>
                <td mat-cell *matCellDef="let device" class="text-slate-400!"> {{device.manufacturer}} </td>
              </ng-container>

              <!-- Serial Number -->
              <ng-container matColumnDef="serialNumber">
                <th mat-header-cell *matHeaderCellDef> Serial Number </th>
                <td mat-cell *matCellDef="let device">
                  <span class="font-mono text-xs bg-slate-950/80 text-emerald-400 px-2.5 py-1 rounded-md border border-slate-800">
                    {{device.serialNumber}}
                  </span>
                </td>
              </ng-container>

              <!-- Department -->
              <ng-container matColumnDef="department">
                <th mat-header-cell *matHeaderCellDef mat-sort-header> Department </th>
                <td mat-cell *matCellDef="let device">
                  <span class="bg-slate-800/60 text-slate-300 text-xs px-2.5 py-1 rounded-lg border border-slate-700/20 font-medium">
                    {{device.department}}
                  </span>
                </td>
              </ng-container>

              <!-- Next Calibration Date -->
              <ng-container matColumnDef="nextCalibrationDate">
                <th mat-header-cell *matHeaderCellDef mat-sort-header> Next Calibration </th>
                <td mat-cell *matCellDef="let device" class="text-slate-300!"> 
                  {{device.nextCalibrationDate | date:'dd.MM.yyyy'}} 
                </td>
              </ng-container>

              <!-- Status -->
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef class="text-right"> Status </th>
                <td mat-cell *matCellDef="let device" class="text-right">
                  <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Active
                  </span>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns" class="bg-slate-950/30!"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>

              <!-- If no data -->
              <tr class="mat-row" *matNoDataRow>
                <td class="mat-cell p-8 text-center text-slate-400 border-none" colspan="6">
                  Devices for your query "{{input.value}}" not found.
                </td>
              </tr>
            </table>

            <!-- Paginator -->
            <mat-paginator [pageSizeOptions]="[5, 10, 25, 100]" aria-label="Select device page"></mat-paginator>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .hidden {
      display: none !important;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App implements OnInit, AfterViewInit {
  title = 'MedCalibrate';
  private deviceService = inject(DeviceService);

  dataSource = new MatTableDataSource<Device>([]);
  displayedColumns: string[] = ['name', 'manufacturer', 'serialNumber', 'department', 'nextCalibrationDate', 'status'];

  isLoading = signal<boolean>(true);
  errorMessage = signal<string | null>(null);

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
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error when accessing C# API:', err);
        this.errorMessage.set(
          `Could not load devices from backend. Please ensure port 5121 is running. Error message: ${err.message}`
        );
        this.isLoading.set(false);
      }
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
}