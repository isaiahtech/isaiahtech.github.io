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
const starsGlowArray = new Float32Array(starsCount);
const originalStarColors = [];

for (let i = 0; i < starsCount; i++) {
    const i3 = i * 3;
    starsPosArray[i3] = (Math.random() - 0.5) * 1500;
    starsPosArray[i3 + 1] = (Math.random() - 0.5) * 1500;
    starsPosArray[i3 + 2] = (Math.random() - 0.5) * 1500;

    starsSizeArray[i] = Math.random() * 1.5 + 0.5;
    starsOpacityArray[i] = Math.random() * 0.6 + 0.4;

    const color = new THREE.Color();
    const randomColor = Math.random();
    if (randomColor < 0.33) {
        const greenShade = Math.random() * 0.6 + 0.4;
        color.setRGB(0, greenShade, 0);
    } else if (randomColor < 0.66) {
        color.setRGB(0.6, 0.8, 1.0);
    } else {
        color.set(0xffffff);
    }
    starsColorArray[i3] = color.r;
    starsColorArray[i3 + 1] = color.g;
    starsColorArray[i3 + 2] = color.b;

    originalStarColors.push(color.clone());

    starsGlowArray[i] = Math.random() < 0.1 ? Math.random() * 0.5 + 0.5 : 0;
}

starsGeometry.setAttribute('position', new THREE.BufferAttribute(starsPosArray, 3));
starsGeometry.setAttribute('size', new THREE.BufferAttribute(starsSizeArray, 1));
starsGeometry.setAttribute('opacity', new THREE.BufferAttribute(starsOpacityArray, 1));
starsGeometry.setAttribute('color', new THREE.BufferAttribute(starsColorArray, 3));
starsGeometry.setAttribute('glow', new THREE.BufferAttribute(starsGlowArray, 1));
starsGeometry.colorsNeedUpdate = true;

const starsMaterial = new THREE.ShaderMaterial({
    vertexShader: `
        attribute float size;
        attribute float opacity;
        attribute vec3 color;
        attribute float glow;
        varying float vOpacity;
        varying vec3 vColor;
        varying float vGlow;

        void main() {
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = size * (300.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
            vOpacity = opacity;
            vColor = color;
            vGlow = glow;
        }
    `,
    fragmentShader: `
        varying float vOpacity;
        varying vec3 vColor;
        varying float vGlow;

        uniform float pulse;

        void main() {
            float distance = length(gl_PointCoord - vec2(0.5));
            float alpha = 1.0 - smoothstep(0.4, 0.5, distance);

            vec3 glowColor = vColor * 10.0;
            float glowIntensity = vGlow * pulse * (1.0 - smoothstep(0.4, 0.5, distance));
            vec4 finalColor = vec4(vColor + glowColor * glowIntensity, alpha * vOpacity);

            gl_FragColor = finalColor;
        }
    `,
    blending: THREE.AdditiveBlending,
    depthTest: false,
    transparent: true,
    uniforms: {
        pulse: { value: 0 }
    }
});

const stars = new THREE.Points(starsGeometry, starsMaterial);
scene.add(stars);

// --- Foreground Transparent Sphere ---
const foregroundSphereGeometry = new THREE.SphereGeometry(11.25, 32, 32);
const foregroundSphereMaterial = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.6,
});

const foregroundSphere = new THREE.Mesh(foregroundSphereGeometry, foregroundSphereMaterial);
scene.add(foregroundSphere);

// --- Glow Sphere ---
const glowSphereGeometry = new THREE.SphereGeometry(12.5, 32, 32); // Slightly larger
const glowSphereMaterial = new THREE.ShaderMaterial({
    uniforms: {
        isPillActiveUniform: { value: 0.0 }, // Uniform for pill state
    },
    vertexShader: `
        varying vec3 vNormal;
        void main() {
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        varying vec3 vNormal;
        uniform float isPillActiveUniform;
        void main() {
          float intensity = pow(1.0 - dot(vNormal, vec3(0, 0, 1.0)), 2.0); // Simple glow falloff
          vec3 color = mix(vec3(0.0), vec3(1.0, 0.0, 0.0), isPillActiveUniform); // Red when active
          gl_FragColor = vec4(color, intensity * isPillActiveUniform); // Transparent when inactive

        }
    `,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false, // Important for transparency
});

const glowSphere = new THREE.Mesh(glowSphereGeometry, glowSphereMaterial);
scene.add(glowSphere);

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


// --- Device Orientation (Mobile) ---
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

// --- Pill Icon and State ---
const sliderIcon = document.getElementById('sliderIcon');
let isPillActive = false; // Flag to track pill state

sliderIcon.addEventListener('click', () => {
    isPillActive = !isPillActive; // Toggle the flag
    sliderIcon.classList.toggle('active');
    updateStarColors(); // Update star colors on click
});

// --- Function to Update Star Colors ---
function updateStarColors() {
    const newColors = [];
    const newGlowValues = [];

    for (let i = 0; i < starsCount; i++) {
        const i3 = i * 3;
        const color = new THREE.Color();

        if (isPillActive) {
            const randomValue = Math.random();
            if (randomValue < 0.6) {
                color.setRGB(1.0, Math.random() * 0.3, Math.random() * 0.2);
            } else if (randomValue < 0.8) {
                color.setRGB(1.0, 0.5 + Math.random() * 0.2, 0);
            } else {
                color.setRGB(1.0, 1.0, Math.random() * 0.4);
            }
        } else {
           color.copy(originalStarColors[i]);
        }
        newColors.push(color.r, color.g, color.b);
        newGlowValues.push(starsGlowArray[i]);
    }

    starsGeometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(newColors), 3));
    starsGeometry.setAttribute('glow', new THREE.BufferAttribute(new Float32Array(newGlowValues), 1));
    starsGeometry.colorsNeedUpdate = true;
    starsGeometry.attributes.glow.needsUpdate = true;

}

let startTime = Date.now();

// --- Animation Loop ---
function animate() {
    requestAnimationFrame(animate);

    let time = (Date.now() - startTime) * 0.0005;
    let pulse = (Math.sin(time * Math.PI) + 1) / 2;

    starsMaterial.uniforms.pulse.value = pulse;

    // Update glow sphere uniform
    glowSphereMaterial.uniforms.isPillActiveUniform.value = isPillActive ? 1.0 : 0.0;

    stars.rotation.x += mouseY * rotationSpeed;
    stars.rotation.y += mouseX * rotationSpeed;

    foregroundSphere.rotation.x += mouseY * rotationSpeed;
    foregroundSphere.rotation.y += mouseX * rotationSpeed;

	//also rotate glow sphere
	glowSphere.rotation.x += mouseY * rotationSpeed;
    glowSphere.rotation.y += mouseX * rotationSpeed;

    stars.rotation.x += dragRotationX;
    stars.rotation.y += dragRotationY;
    foregroundSphere.rotation.x += dragRotationX;
    foregroundSphere.rotation.y += dragRotationY;
	//also rotate glow sphere
    glowSphere.rotation.x += dragRotationX;
    glowSphere.rotation.y += dragRotationY;


    dragRotationX = 0;
    dragRotationY = 0;

    if ('ondeviceorientation' in window) {
        stars.rotation.x += deviceRotationX;
        stars.rotation.y += deviceRotationY;
        foregroundSphere.rotation.x += deviceRotationX;
        foregroundSphere.rotation.y += deviceRotationY;
		//also rotate glow sphere
        glowSphere.rotation.x += deviceRotationX;
        glowSphere.rotation.y += deviceRotationY;

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
