/**
 * WebGL Animated Background using Three.js
 * Creates a futuristic, particle-based background with interactive elements
 */

class WebGLBackground {
  constructor(container) {
    this.container = container;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.particles = [];
    this.mouse = { x: 0, y: 0 };
    this.time = 0;
    this.init();
  }

  init() {
    // Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0f0f1f);
    this.scene.fog = new THREE.Fog(0x0f0f1f, 2000, 6000);

    // Camera setup
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      10000
    );
    this.camera.position.z = 500;

    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x0f0f1f, 0.1);
    this.container.appendChild(this.renderer.domElement);

    // Create particles
    this.createParticles();

    // Create lines connecting particles
    this.createParticleLines();

    // Create floating cubes
    this.createFloatingObjects();

    // Event listeners
    window.addEventListener('mousemove', (e) => this.onMouseMove(e));
    window.addEventListener('resize', () => this.onWindowResize());

    // Start animation
    this.animate();
  }

  createParticles() {
    const particleCount = 200;
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const velocities = [];

    for (let i = 0; i < particleCount; i++) {
      positions.push(
        (Math.random() - 0.5) * 2000,
        (Math.random() - 0.5) * 2000,
        (Math.random() - 0.5) * 2000
      );

      velocities.push(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2
      );
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));

    const material = new THREE.PointsMaterial({
      color: 0x00d4ff,
      size: 3,
      sizeAttenuation: true,
      emissive: 0x00d4ff,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.4
    });

    this.particles = new THREE.Points(geometry, material);
    this.particles.velocities = velocities;
    this.scene.add(this.particles);
  }

  createParticleLines() {
    const edgeGeometry = new THREE.EdgesGeometry(new THREE.SphereGeometry(800, 32, 32));
    const edgeLines = new THREE.LineSegments(edgeGeometry, new THREE.LineBasicMaterial({
      color: 0xa78bfa,
      transparent: true,
      opacity: 0.1
    }));
    this.scene.add(edgeLines);

    // Additional floating lines
    const lineGeometry = new THREE.BufferGeometry();
    const linePositions = [];

    for (let i = 0; i < 10; i++) {
      linePositions.push(
        (Math.random() - 0.5) * 2000,
        (Math.random() - 0.5) * 2000,
        (Math.random() - 0.5) * 2000,
        (Math.random() - 0.5) * 2000,
        (Math.random() - 0.5) * 2000,
        (Math.random() - 0.5) * 2000
      );
    }

    lineGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(linePositions), 3));

    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0xff006e,
      transparent: true,
      opacity: 0.15,
      linewidth: 1
    });

    const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
    this.scene.add(lines);
  }

  createFloatingObjects() {
    // Floating cube 1
    const geometry1 = new THREE.BoxGeometry(100, 100, 100);
    const material1 = new THREE.MeshPhongMaterial({
      color: 0x00d4ff,
      emissive: 0x00d4ff,
      emissiveIntensity: 0.3,
      wireframe: false,
      transparent: true,
      opacity: 0.1
    });
    const cube1 = new THREE.Mesh(geometry1, material1);
    cube1.position.set(300, 200, -200);
    cube1.rotation.speed = { x: 0.001, y: 0.002, z: 0.0015 };
    this.scene.add(cube1);

    // Floating cube 2
    const geometry2 = new THREE.BoxGeometry(80, 80, 80);
    const material2 = new THREE.MeshPhongMaterial({
      color: 0xff006e,
      emissive: 0xff006e,
      emissiveIntensity: 0.2,
      wireframe: false,
      transparent: true,
      opacity: 0.08
    });
    const cube2 = new THREE.Mesh(geometry2, material2);
    cube2.position.set(-350, -150, -300);
    cube2.rotation.speed = { x: 0.002, y: 0.001, z: 0.0018 };
    this.scene.add(cube2);

    // Floating sphere
    const sphereGeometry = new THREE.IcosahedronGeometry(60, 4);
    const sphereMaterial = new THREE.MeshPhongMaterial({
      color: 0xa78bfa,
      emissive: 0xa78bfa,
      emissiveIntensity: 0.2,
      wireframe: true,
      transparent: true,
      opacity: 0.15
    });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphere.position.set(0, 300, 100);
    sphere.rotation.speed = { x: 0.0015, y: 0.002, z: 0.001 };
    this.scene.add(sphere);

    // Store for animation
    this.floatingObjects = [cube1, cube2, sphere];
  }

  onMouseMove(event) {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  updateParticles() {
    const positions = this.particles.geometry.attributes.position.array;
    const velocities = this.particles.velocities;

    for (let i = 0; i < positions.length; i += 3) {
      positions[i] += velocities[i / 3 * 3];
      positions[i + 1] += velocities[i / 3 * 3 + 1];
      positions[i + 2] += velocities[i / 3 * 3 + 2];

      // Boundary wrapping
      if (positions[i] > 1000) positions[i] = -1000;
      if (positions[i] < -1000) positions[i] = 1000;
      if (positions[i + 1] > 1000) positions[i + 1] = -1000;
      if (positions[i + 1] < -1000) positions[i + 1] = 1000;
      if (positions[i + 2] > 1000) positions[i + 2] = -1000;
      if (positions[i + 2] < -1000) positions[i + 2] = 1000;
    }

    this.particles.geometry.attributes.position.needsUpdate = true;
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    this.time += 0.001;

    // Update particles
    this.updateParticles();

    // Rotate floating objects
    this.floatingObjects.forEach(obj => {
      obj.rotation.x += obj.rotation.speed.x;
      obj.rotation.y += obj.rotation.speed.y;
      obj.rotation.z += obj.rotation.speed.z;
    });

    // Camera movement based on mouse
    this.camera.position.x += (this.mouse.x * 100 - this.camera.position.x) * 0.05;
    this.camera.position.y += (this.mouse.y * 100 - this.camera.position.y) * 0.05;
    this.camera.lookAt(this.scene.position);

    this.renderer.render(this.scene, this.camera);
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('webgl-container');
  if (container) {
    new WebGLBackground(container);
  }
});

window.WebGLBackground = WebGLBackground;
