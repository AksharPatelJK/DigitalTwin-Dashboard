
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Equipment {
  id: number;
  equipmentCode: string;
  equipmentName: string;
  customName: string | null;
  description: string | null;
  status: string;
}

export interface EquipmentPosition {
equipmentId: number;
  positionX: number;
  positionY: number;
  positionZ: number;
}
export interface EquipmentPositionRequest {
  positionX: number;
  positionY: number;
  positionZ: number;
}

@Injectable({
  providedIn: 'root'
})
export class EquipmentService {
  private apiUrl = 'https://localhost:7226/api/Equipment';

  constructor(private http: HttpClient) {}

  getEquipment(): Observable<Equipment[]> {
    return this.http.get<Equipment[]>(this.apiUrl);
  }

  saveCustomName(id: number, customName: string): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/${id}/custom-name`,
      { customName }
    );
  }

  // GET: Load saved 3D equipment positions
  getPositions(): Observable<EquipmentPosition[]> {
    return this.http.get<EquipmentPosition[]>(
      `${this.apiUrl}/positions`
    );
  }

  savePosition(
    id: number,
    position: EquipmentPositionRequest
  ): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/position`,
      position
    );
  }

}
