import {AfterViewInit,Component,ElementRef,OnDestroy,ViewChild} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import * as THREE from 'three';
import { EquipmentScene } from './equipment-scene';
import { EquipmentService, Equipment } from './services/equipment';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements AfterViewInit, OnDestroy {

  @ViewChild('factoryCanvas')
  factoryCanvas!: ElementRef<HTMLCanvasElement>;

  private factoryScene!: EquipmentScene;
  private resizeObserver!: ResizeObserver;

  selectedEquipment: THREE.Group | null = null;
  selectedEquipmentName = '';
  customEquipmentName = '';
  showEquipmentPopup = false;

  isSaving = false;
  saveMessage = '';
  saveError = '';

  constructor(private equipmentService: EquipmentService) {}

  ngAfterViewInit(): void {
    this.factoryScene = new EquipmentScene(
      this.factoryCanvas.nativeElement
    );

    this.resizeObserver = new ResizeObserver(() => {
      this.factoryScene.resize();
    });

    this.resizeObserver.observe(
      this.factoryCanvas.nativeElement.parentElement!
    );

    this.loadEquipmentNames();
  }

  // Load equipment and saved names from SQL Server
  loadEquipmentNames(): void {
    this.equipmentService.getEquipment().subscribe({
      next: (equipmentList: Equipment[]) => {
        equipmentList.forEach(item => {
          const machine = this.factoryScene
            ? this.getMachineById(item.id)
            : null;

          if (machine) {
            machine.userData['customName'] = item.customName ?? '';
          }
        });
      },
      error: (error: HttpErrorResponse) => {
        console.error('Failed to load equipment:', error);
      }
    });
  }

  private getMachineById(id: number): THREE.Group | null 
  {
    return this.factoryScene.getEquipmentById(id);
  }

  onEquipmentClick(event: MouseEvent): void {
    if (this.factoryScene.consumeDragFlag()) 
    {
      return;
    }
    
    const equipment = this.factoryScene.getEquipmentAt(event);
    
    if(!equipment)
    {
      return;
    }
    this.selectedEquipment = equipment;
    this.selectedEquipmentName = equipment.userData['name'];

    this.customEquipmentName = equipment.userData['customName'] || this.selectedEquipmentName;
    this.saveMessage = '';
    this.saveError = '';
    this.showEquipmentPopup = true;
  }

  saveEquipmentName(): void {
    if (!this.selectedEquipment || this.isSaving) {
      return;
    }

    const name = this.customEquipmentName.trim();

    if (!name) {
      this.saveError = 'Please enter an equipment name.';
      return;
    }

    const equipmentId = Number(
      this.selectedEquipment.userData['id']
    );

    this.isSaving = true;
    this.saveMessage = '';
    this.saveError = '';

    this.equipmentService
      .saveCustomName(equipmentId, name)
      .subscribe({
        next: () => {
          if (this.selectedEquipment) {
            this.selectedEquipment.userData['customName'] = name;
          }

          this.isSaving = false;
          this.showEquipmentPopup = false;
          this.saveMessage = 'Equipment name saved successfully.';
        },
        error: (error: HttpErrorResponse) => {
          console.error('Failed to save equipment name:', error);
          this.isSaving = false;
          this.saveError =
            'Could not save the name. Please try again.';
        }
      });
  }

  closeEquipmentPopup(): void {
    if (this.isSaving) {
      return;
    }

    this.showEquipmentPopup = false;
    this.saveError = '';
  }

  resetView(): void {
    this.factoryScene.resetView();
  }

  showTopView(): void {
    this.factoryScene.showTopView();
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.factoryScene?.destroy();
  }
}


// import {AfterViewInit,Component,ElementRef,OnDestroy,ViewChild} from '@angular/core';
// import { FormsModule } from '@angular/forms';
// import * as THREE from 'three';
// import { EquipmentScene } from './equipment-scene';

// @Component({
//   selector: 'app-root',
//   standalone: true,
//   imports: [FormsModule],
//   templateUrl: './app.html',
//   styleUrl: './app.css'
// })
// export class App implements AfterViewInit, OnDestroy {
//   @ViewChild('factoryCanvas')
//   factoryCanvas!: ElementRef<HTMLCanvasElement>;

//   private factoryScene!: EquipmentScene;
//   private resizeObserver!: ResizeObserver;

//   selectedEquipment: THREE.Group | null = null;
//   selectedEquipmentName = '';
//   customEquipmentName = '';
//   showEquipmentPopup = false;

//   ngAfterViewInit(): void {
//     this.factoryScene = new EquipmentScene(
//       this.factoryCanvas.nativeElement
//     );

//     this.resizeObserver = new ResizeObserver(() => {
//       this.factoryScene.resize();
//     });

//     this.resizeObserver.observe(
//       this.factoryCanvas.nativeElement.parentElement!
//     );
//   }

//   onEquipmentClick(event: MouseEvent): void {
//     const equipment = this.factoryScene.getEquipmentAt(event);

//     if (!equipment) {
//       return;
//     }

//     this.selectedEquipment = equipment;
//     this.selectedEquipmentName = equipment.userData['name'];

//     this.customEquipmentName =
//       equipment.userData['customName'] || this.selectedEquipmentName;

//     this.showEquipmentPopup = true;
//   }

//   saveEquipmentName(): void {
//     if (!this.selectedEquipment || !this.customEquipmentName.trim()) {
//       return;
//     }

//     this.selectedEquipment.userData['customName'] =
//       this.customEquipmentName.trim();

//     this.showEquipmentPopup = false;
//   }

//   closeEquipmentPopup(): void {
//     this.showEquipmentPopup = false;
//   }

//   resetView(): void {
//     this.factoryScene.resetView();
//   }

//   showTopView(): void {
//     this.factoryScene.showTopView();
//   }

//   ngOnDestroy(): void {
//     this.resizeObserver?.disconnect();
//     this.factoryScene?.destroy();
//   }
// }


// import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, signal } from '@angular/core';
// import { RouterOutlet } from '@angular/router';
// import * as THREE from 'three';

// @Component({
//   selector: 'app-root',
//   imports: [RouterOutlet],
//   templateUrl: './app.html',
//   styleUrl: './app.css'
// })
// export class App implements AfterViewInit, OnDestroy 
// {
//   @ViewChild('factoryCanvas')
//   factoryCanvas!: ElementRef<HTMLCanvasElement>;

//   private scene!: THREE.Scene;
//   private camera!: THREE.PerspectiveCamera;
//   private renderer!: THREE.WebGLRenderer;

//   private equipmentList: THREE.Group[] = [];
//   private animationFrame = 0;

//   selectedEquipment : THREE.Group | null = null;
//   selectedEquipmentName = '';
//   customeEquipmentName = '';
//   showEquipmentPopup = false;

//   ngAfterViewInit(): void 
//   {
//     this.createScene();
//     this.createFloor();
//     this.addEquipment();
//     this.startRendering();
//   }

//   private createScene(): void
//   {
//     const canvas = this.factoryCanvas.nativeElement;
//     this.scene = new THREE.Scene();
//     this.scene.background = new THREE.Color(0x08172a);
//     this.camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);

//     this.camera.position.set(15, 18, 22);
//     this.camera.lookAt(0, 0, 0);
    
//     this.renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });

//     this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);

//     console.log('Canvas size:', canvas.clientWidth, canvas.clientHeight);
//     console.log('Equipment count:', this.equipmentList.length);
//     console.log('Scene objects:', this.scene.children.length);
//     this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));

//     const light = new THREE.DirectionalLight(0xffffff, 2);
//     this.scene.add(light);

//     const factoryLight = new THREE.AmbientLight(0xffffff, 0.5);
//     factoryLight.position.set(10, 20, 10);
//     this.scene.add(factoryLight);
//   }
  
//   private createFloor(): void
//   {
//     const floor = new THREE.Mesh(
//       new THREE.BoxGeometry(24,0.3,16),
//       new THREE.MeshStandardMaterial({ color: 0x1e1e1e })
//     );
//     floor.position.y = -0.2;
//     this.scene.add(floor);

//     const floorgrid = new THREE.GridHelper(24, 24, 0x2563eb, 0x94a3b8);
//     floorgrid.position.y = 0;
//     this.scene.add(floorgrid);
//   }

//   private addEquipment(): void
//   {
//     const positions = [ [-8, -4], [-4, -4], [0, -4], [4, -4], [8, -4],
//       [-8, 0], [-4, 0], [0, 0], [4, 0], [8, 0],
//       [-8, 4], [-4, 4], [0, 4], [4, 4], [8, 4]
//     ];
    
//     positions.forEach((pos, index) => {
//       const equipment = new THREE.Group();

//       equipment.position.set(pos[0], 0, pos[1]);
//       const machineBody = new THREE.Mesh(
//         new THREE.BoxGeometry(2, 1.2, 1.6),
//         new THREE.MeshStandardMaterial({ color: index % 5 === 0 ? '#f59e0b' : '#2563eb' })
//       );
//       machineBody.position.y = 0.6;
//       equipment.add(machineBody);

//       const machineTop = new THREE.Mesh(
//         new THREE.BoxGeometry(1.5, 0.2, 1.2),
//         new THREE.MeshStandardMaterial({ color: '#e2e8f0' })
//       );
//       machineTop.position.y = 1.3;
//       equipment.add(machineTop);

//       equipment.userData['id'] = index + 1;
//       equipment.userData['name'] = `Equipment ${String(index + 1).padStart(2, '0')}`;
//       equipment.userData['customName'] = '';

//       this.scene.add(equipment);
//       this.equipmentList.push(equipment);
//     });
//   }

//   private startRendering(): void
//   {
//     const render = (): void =>
//     {
//       this.animationFrame = requestAnimationFrame(render);
//       this.renderer.render(this.scene, this.camera);
//     };
//     render();
//   }

//   onEquipmentClick(eventOrEquipment: MouseEvent | THREE.Group | undefined, equipment?: THREE.Group): void
//   {
//     if (!(eventOrEquipment instanceof MouseEvent))
//     {
//       const selectedEquipment = eventOrEquipment ?? equipment;

//       if (!selectedEquipment)
//       {
//         return;
//       }

//       this.selectedEquipment = selectedEquipment;
//       this.selectedEquipmentName = selectedEquipment.userData['name'];
//       this.customeEquipmentName = selectedEquipment.userData['customName'] || this.selectedEquipmentName;
//       this.showEquipmentPopup = true;
//       return;
//     }

//     const canvas = this.factoryCanvas.nativeElement;
//     const bounds = canvas.getBoundingClientRect();

//     const mouse = new THREE.Vector2(
//       ((eventOrEquipment.clientX - bounds.left) / bounds.width) * 2 - 1,
//       -((eventOrEquipment.clientY - bounds.top) / bounds.height) * 2 + 1
//     );

//     const raycaster = new THREE.Raycaster();
//     raycaster.setFromCamera(mouse, this.camera);

//     const machineParts = this.equipmentList.flatMap(
//       equipment => equipment.children
//     );

//     const clickedParts = raycaster.intersectObjects(machineParts);

//     if (clickedParts.length === 0)
//     {
//       return;
//     }

//     const clickedPart = clickedParts[0].object;
//     const clickedEquipment = this.equipmentList.find(
//       item => item.children.includes(clickedPart)
//     );

//     if (!clickedEquipment)
//     {
//       return;
//     }

//     this.selectedEquipment = clickedEquipment;
//     this.selectedEquipmentName = clickedEquipment.userData['name'];
//     this.customeEquipmentName = clickedEquipment.userData['customName'] || this.selectedEquipmentName;
//     this.showEquipmentPopup = true;
//   }

//   saveEquipmentName(): void
//   {
//     if (!this.selectedEquipment || !this.selectedEquipmentName.trim())
//     {
//       return;
//     }
//     this.selectedEquipment.userData['customName'] = this.customeEquipmentName.trim();
//     this.showEquipmentPopup = false;
//   }

//   closeEquipmentPopup(): void
//   {
//     this.showEquipmentPopup = false;
//   }

//   resetView(): void 
//   {
//   this.camera.position.set(15, 18, 22);
//   this.camera.lookAt(0, 0, 0);
//   }

//   shopfloorview(): void
//   {
//     this.camera.position.set(0, 20, 0.01);
//     this.camera.lookAt(0, 0, 0);
//   }
  
//   showTopView(): void 
//   {
//     this.camera.position.set(0, 28, 0.01);
//     this.camera.lookAt(0, 0, 0);
//   }

//   ngOnDestroy(): void
//   {
//     cancelAnimationFrame(this.animationFrame);
//     this.renderer?.dispose();
//   }
// }
