// Scene, Camera, Renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// --- Stars ---
const starsGeometry = new THREE.BufferGeometry();
const starsCount = 10000;
const starsPosArray = new Float32Array(starsCount * 3);
const starsSizeArray = new Float32Array(starsCount);
const starsOpacityArray = new Float32Array(starsCount);

for (let i = 0; i < starsCount; i++) {
    const i3 = i * 3;
    starsPosArray[i3] = (Math.random() - 0.5) * 1500;
    starsPosArray[i3 + 1] = (Math.random() - 0.5) * 1500;
    starsPosArray[i3 + 2] = (Math.random() - 0.5) * 1500;

    starsSizeArray[i] = Math.random() * 1.5 + 0.5;
    starsOpacityArray[i] = Math.random() * 0.6 + 0.4;
}

starsGeometry.setAttribute('position', new THREE.BufferAttribute(starsPosArray, 3));
starsGeometry.setAttribute('size', new THREE.BufferAttribute(starsSizeArray, 1));
starsGeometry.setAttribute('opacity', new THREE.BufferAttribute(starsOpacityArray, 1));

const starsMaterial = new THREE.ShaderMaterial({
    uniforms: {
        color: { value: new THREE.Color(0xffffff) }
    },
    vertexShader: `
        attribute float size;
        attribute float opacity;
        varying float vOpacity;
        void main() {
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = size * (300.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
            vOpacity = opacity;
        }
    `,
    fragmentShader: `
        uniform vec3 color;
        varying float vOpacity;
        void main() {
            float distance = length(gl_PointCoord - vec2(0.5));
            float alpha = 1.0 - smoothstep(0.4, 0.5, distance);
            gl_FragColor = vec4(color, alpha * vOpacity);
        }
    `,
    blending: THREE.AdditiveBlending,
    depthTest: false,
    transparent: true
});

const stars = new THREE.Points(starsGeometry, starsMaterial);
scene.add(stars);

// --- Foreground Transparent Sphere ---
const foregroundSphereGeometry = new THREE.SphereGeometry(11.25, 32, 32);
const foregroundSphereMaterial = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.8,
});

const foregroundSphere = new THREE.Mesh(foregroundSphereGeometry, foregroundSphereMaterial);
scene.add(foregroundSphere);

// --- Lighting ---
const ambientLight = new THREE.AmbientLight(0x606060);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9);
directionalLight.position.set(1, 1, 1);
scene.add(directionalLight);

// --- Camera Positioning ---
camera.position.z = 30;

// --- Mouse Interaction ---
let mouseX = 0;
let mouseY = 0;
const rotationSpeed = 0.0025; // Changed rotation speed
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };
let dragRotationX = 0; // Store accumulated drag rotation
let dragRotationY = 0;

// Mousemove for continuous rotation
renderer.domElement.addEventListener('mousemove', (event) => {
    mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(event.clientY / window.innerHeight) * 2 + 1;

    if (isDragging) {
        const deltaMove = {
            x: event.clientX - previousMousePosition.x,
            y: event.clientY - previousMousePosition.y,
        };

        // Accumulate drag rotation
        dragRotationX += deltaMove.y * rotationSpeed;
        dragRotationY += deltaMove.x * rotationSpeed;

        previousMousePosition = { x: event.clientX, y: event.clientY };
      }
});

// Mousedown for drag start
renderer.domElement.addEventListener('mousedown', (event) => {
    isDragging = true;
    previousMousePosition = { x: event.clientX, y: event.clientY };
});

// Mouseup for drag end
renderer.domElement.addEventListener('mouseup', () => {
    isDragging = false;
});


// --- Device Orientation (Mobile) ---
let deviceRotationX = 0;
let deviceRotationY = 0;
const deviceRotationSpeed = 0.01; // Adjust sensitivity as needed

// Feature detection for device orientation support
if ('ondeviceorientation' in window) {
    window.addEventListener('deviceorientation', (event) => {
        // Normalize and adjust angles.  Different devices may handle orientation differently.
        // We use gamma for side-to-side tilt (around the y-axis) and beta for front-to-back tilt (around the x-axis).
        // We might need to negate values or swap beta/gamma depending on the device.  Testing is crucial.

        // Assuming a landscape orientation as primary. Adjust if portrait is the primary orientation.
        let tiltX = event.beta;  // Front-to-back
        let tiltY = event.gamma; // Side-to-side

        // Negate and scale to control direction and sensitivity.
        deviceRotationX = tiltX * deviceRotationSpeed * -1; // Adjust multiplier as needed
        deviceRotationY = tiltY * deviceRotationSpeed * -1; // Adjust multiplier as needed
    });
}


// --- Animation Loop ---
function animate() {
    requestAnimationFrame(animate);

    // Apply continuous rotation based on mouse position
    stars.rotation.x += mouseY * rotationSpeed;
    stars.rotation.y += mouseX * rotationSpeed;

    foregroundSphere.rotation.x += mouseY * rotationSpeed;
    foregroundSphere.rotation.y += mouseX * rotationSpeed;

    // Apply additional rotation from dragging
    stars.rotation.x += dragRotationX;
    stars.rotation.y += dragRotationY;
    foregroundSphere.rotation.x += dragRotationX;
    foregroundSphere.rotation.y += dragRotationY;

    // Reset drag rotation each frame.
    dragRotationX = 0;
    dragRotationY = 0;


    // Apply device orientation rotation (only if supported)
    if ('ondeviceorientation' in window) {
        stars.rotation.x += deviceRotationX;
        stars.rotation.y += deviceRotationY;
        foregroundSphere.rotation.x += deviceRotationX;
        foregroundSphere.rotation.y += deviceRotationY;

        // Reset device rotation.
        deviceRotationX = 0;
        deviceRotationY = 0;
    }

    renderer.render(scene, camera);
}

animate();

// --- Handle Window Resize ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
