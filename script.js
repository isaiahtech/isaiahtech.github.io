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
const starsColorArray = new Float32Array(starsCount * 3);

for (let i = 0; i < starsCount; i++) {
    const i3 = i * 3;
    starsPosArray[i3] = (Math.random() - 0.5) * 1500;
    starsPosArray[i3 + 1] = (Math.random() - 0.5) * 1500;
    starsPosArray[i3 + 2] = (Math.random() - 0.5) * 1500;

    starsSizeArray[i] = Math.random() * 1.5 + 0.5;
    starsOpacityArray[i] = Math.random() * 0.6 + 0.4;

    // Assign colors randomly
    const color = new THREE.Color();
    const randomColor = Math.random();
    if (randomColor < 0.33) {
        // Various shades of green
        const greenShade = Math.random() * 0.6 + 0.4;
        color.setRGB(0, greenShade, 0);
    } else if (randomColor < 0.66) {
        // Light blue (pale cyan)
        color.setRGB(0.6, 0.8, 1.0);
    } else {
        color.set(0xffffff); // White
    }
    starsColorArray[i3] = color.r;
    starsColorArray[i3 + 1] = color.g;
    starsColorArray[i3 + 2] = color.b;
}

starsGeometry.setAttribute('position', new THREE.BufferAttribute(starsPosArray, 3));
starsGeometry.setAttribute('size', new THREE.BufferAttribute(starsSizeArray, 1));
starsGeometry.setAttribute('opacity', new THREE.BufferAttribute(starsOpacityArray, 1));
starsGeometry.setAttribute('color', new THREE.BufferAttribute(starsColorArray, 3));

const starsMaterial = new THREE.ShaderMaterial({
    vertexShader: `
        attribute float size;
        attribute float opacity;
        attribute vec3 color;
        varying float vOpacity;
        varying vec3 vColor;
        void main() {
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = size * (300.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
            vOpacity = opacity;
            vColor = color;
        }
    `,
    fragmentShader: `
        varying float vOpacity;
        varying vec3 vColor;
        void main() {
            float distance = length(gl_PointCoord - vec2(0.5));
            float alpha = 1.0 - smoothstep(0.4, 0.5, distance);
            gl_FragColor = vec4(vColor, alpha * vOpacity);
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

// --- Mouse Interaction --- (No changes)
let mouseX = 0;
let mouseY = 0;
const rotationSpeed = 0.0025;
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };
let dragRotationX = 0;
let dragRotationY = 0;

renderer.domElement.addEventListener('mousemove', (event) => {
    mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(event.clientY / window.innerHeight) * 2 + 1;

    if (isDragging) {
        const deltaMove = {
            x: event.clientX - previousMousePosition.x,
            y: event.clientY - previousMousePosition.y,
        };

        dragRotationX += deltaMove.y * rotationSpeed;
        dragRotationY += deltaMove.x * rotationSpeed;

        previousMousePosition = { x: event.clientX, y: event.clientY };
      }
});

renderer.domElement.addEventListener('mousedown', (event) => {
    isDragging = true;
    previousMousePosition = { x: event.clientX, y: event.clientY };
});

renderer.domElement.addEventListener('mouseup', () => {
    isDragging = false;
});


// --- Device Orientation (Mobile) --- (No changes)
let deviceRotationX = 0;
let deviceRotationY = 0;
const deviceRotationSpeed = 0.01;

if ('ondeviceorientation' in window) {
    window.addEventListener('deviceorientation', (event) => {
        let tiltX = event.beta;
        let tiltY = event.gamma;

        deviceRotationX = tiltX * deviceRotationSpeed * -1;
        deviceRotationY = tiltY * deviceRotationSpeed * -1;
    });
}


// --- Animation Loop --- (No changes)
function animate() {
    requestAnimationFrame(animate);

    stars.rotation.x += mouseY * rotationSpeed;
    stars.rotation.y += mouseX * rotationSpeed;

    foregroundSphere.rotation.x += mouseY * rotationSpeed;
    foregroundSphere.rotation.y += mouseX * rotationSpeed;

    stars.rotation.x += dragRotationX;
    stars.rotation.y += dragRotationY;
    foregroundSphere.rotation.x += dragRotationX;
    foregroundSphere.rotation.y += dragRotationY;

    dragRotationX = 0;
    dragRotationY = 0;

    if ('ondeviceorientation' in window) {
        stars.rotation.x += deviceRotationX;
        stars.rotation.y += deviceRotationY;
        foregroundSphere.rotation.x += deviceRotationX;
        foregroundSphere.rotation.y += deviceRotationY;

        deviceRotationX = 0;
        deviceRotationY = 0;
    }

    renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
