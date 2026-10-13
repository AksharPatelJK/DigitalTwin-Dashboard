import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class EquipmentScene {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls!: OrbitControls;

  private equipmentList: THREE.Group[] = [];
  private animationFrame = 0;

  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();

  private isDragging = false;
  private wasDragging = false;
  private pointerDownPosition = new THREE.Vector2();
  private selectedEquipment: THREE.Group | null = null;

  private dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0),0);

  private dragOffset = new THREE.Vector3();
  private intersection = new THREE.Vector3();

  private readonly floorHalfWidth = 12;
  private readonly floorHalfDepth = 8;
  private readonly equipmentHalfWidth = 1;
  private readonly equipmentHalfDepth = 0.8;
  private readonly dragThreshold = 5;

  constructor(private canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x08172a);

    this.camera = new THREE.PerspectiveCamera(45,canvas.clientWidth / canvas.clientHeight,0.1,1000);

    this.camera.position.set(15, 18, 22);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({canvas,antialias: true});

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.renderer.setSize(canvas.clientWidth,canvas.clientHeight);

    this.controls = new OrbitControls(this.camera,this.renderer.domElement);

    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.enableRotate = true;
    this.controls.enableZoom = true;
    this.controls.enablePan = true;
    this.controls.minDistance = 8;
    this.controls.maxDistance = 60;
    this.controls.minPolarAngle = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.02;
    this.controls.target.set(0, 0, 0);
    this.controls.update();

    this.addLights();
    this.createFloor();
    this.addEquipment();
    this.addDragEvents();

    this.renderScene();
  }

  private addLights(): void {
    this.scene.add(new THREE.AmbientLight(0xffffff, 1.5));

    const mainLight = new THREE.DirectionalLight(0xffffff,2);

    mainLight.position.set(10, 20, 10);
    this.scene.add(mainLight);
  }

  private createFloor(): void {
    const floor = new THREE.Mesh(
      new THREE.BoxGeometry(24, 0.3, 16),
      new THREE.MeshStandardMaterial({
        color: 0x1e293b
      })
    );

    floor.position.y = -0.2;
    floor.userData['isFloor'] = true;
    this.scene.add(floor);

    const grid = new THREE.GridHelper(
      24,
      24,
      0x2563eb,
      0x94a3b8
    );

    grid.position.y = 0;
    grid.userData['isFloor'] = true;
    this.scene.add(grid);
  }

  private addEquipment(): void {
    const positions: [number, number][] = [
      [-8, -4], [-4, -4], [0, -4], [4, -4], [8, -4],
      [-8, 0], [-4, 0], [0, 0], [4, 0], [8, 0],
      [-8, 4], [-4, 4], [0, 4], [4, 4], [8, 4]
    ];

    positions.forEach(([x, z], index) => {
      const equipment = new THREE.Group();

      equipment.position.set(x, 0, z);

      const body = new THREE.Mesh(
        new THREE.BoxGeometry(2, 1.2, 1.6),
        new THREE.MeshStandardMaterial({
          color: index % 5 === 0 ? 0xf59e0b : 0x2563eb
        })
      );

      body.position.y = 0.6;
      body.userData['isEquipmentPart'] = true;
      equipment.add(body);

      const top = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 0.2, 1.2),
        new THREE.MeshStandardMaterial({
          color: 0xe2e8f0
        })
      );

      top.position.y = 1.3;
      top.userData['isEquipmentPart'] = true;
      equipment.add(top);

      equipment.userData['id'] = index + 1;
      equipment.userData['name'] =
        `Equipment ${String(index + 1).padStart(2, '0')}`;
      equipment.userData['customName'] = '';

      this.scene.add(equipment);
      this.equipmentList.push(equipment);
    });
  }

  private addDragEvents(): void {
    this.canvas.addEventListener(
      'pointerdown',
      this.onPointerDown
    );

    window.addEventListener(
      'pointermove',
      this.onPointerMove
    );

    window.addEventListener(
      'pointerup',
      this.onPointerUp
    );

    window.addEventListener(
      'pointercancel',
      this.onPointerUp
    );
  }

  private onPointerDown = (event: PointerEvent): void => {
    if (event.button !== 0) {
      return;
    }

    this.wasDragging = false;
    this.pointerDownPosition.set(event.clientX, event.clientY);

    const equipment = this.getEquipmentAt(event);

    if (!equipment) {
      return;
    }

    this.selectedEquipment = equipment;

    this.mouseFromEvent(event);
    this.raycaster.setFromCamera(this.mouse, this.camera);

    if (
      !this.raycaster.ray.intersectPlane(
        this.dragPlane,
        this.intersection
      )
    ) {
      this.selectedEquipment = null;
      return;
    }

    this.dragOffset.copy(
      equipment.position
    ).sub(this.intersection);

    this.isDragging = true;
    this.controls.enabled = false;

    event.preventDefault();
  };

  private onPointerMove = (event: PointerEvent): void => {
    if (!this.isDragging || !this.selectedEquipment) {
      return;
    }

    const dx = event.clientX - this.pointerDownPosition.x;
    const dy = event.clientY - this.pointerDownPosition.y;

    if (Math.hypot(dx, dy) >= this.dragThreshold) {
      this.wasDragging = true;
    }

    if (!this.wasDragging) {
      return;
    }

    this.mouseFromEvent(event);
    this.raycaster.setFromCamera(this.mouse, this.camera);

    if (
      !this.raycaster.ray.intersectPlane(this.dragPlane,this.intersection)
    ) {
      return;
    }

    const newPosition = this.intersection
      .clone()
      .add(this.dragOffset);

    const x = THREE.MathUtils.clamp(
      newPosition.x,
      -this.floorHalfWidth + this.equipmentHalfWidth,
      this.floorHalfWidth - this.equipmentHalfWidth
    );

    const z = THREE.MathUtils.clamp(
      newPosition.z,
      -this.floorHalfDepth + this.equipmentHalfDepth,
      this.floorHalfDepth - this.equipmentHalfDepth
    );

    this.selectedEquipment.position.set(x, 0, z);
  };

  private onPointerUp = (): void => {
    this.isDragging = false;
    this.selectedEquipment = null;
    this.controls.enabled = true;
  };

  consumeDragFlag(): boolean {
    const result = this.wasDragging;
    this.wasDragging = false;
    return result;
  }

  private mouseFromEvent(event: MouseEvent): void {
    const bounds = this.canvas.getBoundingClientRect();

    if (bounds.width === 0 || bounds.height === 0) {
      return;
    }

    this.mouse.set(
      ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
      -((event.clientY - bounds.top) / bounds.height) * 2 + 1
    );
  }

  private renderScene(): void {
    const render = (): void => {
      this.animationFrame = requestAnimationFrame(render);
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
    };

    render();
  }

  getEquipmentById(id: number): THREE.Group | null {
    return this.equipmentList.find(
      equipment => equipment.userData['id'] === id
    ) ?? null;
  }

  getEquipmentAt(event: MouseEvent): THREE.Group | null {
    this.mouseFromEvent(event);
    this.raycaster.setFromCamera(this.mouse, this.camera);

    const parts = this.equipmentList.flatMap(
      equipment => equipment.children
    );

    const hits = this.raycaster.intersectObjects(parts);

    if (hits.length === 0) {
      return null;
    }

    const clickedPart = hits[0].object;

    return this.equipmentList.find(
      equipment => equipment.children.includes(clickedPart)
    ) ?? null;
  }

  resetView(): void {
    this.camera.position.set(15, 18, 22);
    this.controls.target.set(0, 0, 0);
    this.controls.update();
  }

  showTopView(): void {
    this.camera.position.set(0, 28, 0.01);
    this.controls.target.set(0, 0, 0);
    this.controls.update();
  }

  resize(): void {
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;

    if (width === 0 || height === 0) {
      return;
    }

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  destroy(): void {
    cancelAnimationFrame(this.animationFrame);

    this.canvas.removeEventListener(
      'pointerdown',
      this.onPointerDown
    );

    window.removeEventListener(
      'pointermove',
      this.onPointerMove
    );

    window.removeEventListener(
      'pointerup',
      this.onPointerUp
    );

    window.removeEventListener(
      'pointercancel',
      this.onPointerUp
    );

    this.controls.dispose();

    this.equipmentList.forEach(equipment => {
      equipment.traverse(object => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();

          const materials = Array.isArray(object.material)
            ? object.material
            : [object.material];

          materials.forEach(material => material.dispose());
        }
      });
    });

    this.scene.traverse(object => {
      if (object instanceof THREE.GridHelper) {
        object.geometry.dispose();

        const materials = Array.isArray(object.material)
          ? object.material
          : [object.material];

        materials.forEach(material => material.dispose());
      }
    });

    this.renderer.dispose();
  }
}
