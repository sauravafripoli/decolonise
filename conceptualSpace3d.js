import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js';
import { getDescriptiveTerm } from './utils.js';

let scene;
let camera;
let renderer;
let controls;
let pointsGroup;
let raycaster;
let mouse;
let animationFrameId;
let onPublicationSelect = null;
let planeMeshes = [];
let selectedOctantIndex = null;
let targetCameraPosition = null;
let targetLookAt = new THREE.Vector3(0, 0, 0);
let currentLookAt = new THREE.Vector3(0, 0, 0);
let targetPlaneOpacity = 0.15;
let currentPlaneOpacity = 0.15;
let lastWidth = 0;
let lastHeight = 0;

const quadrants = [
    { x: -1, y: -1, z: -1, name: 'Reformist Western Establishment', description: '(-Reform, -Collective, -Western)' },
    { x: -1, y: -1, z: 1, name: 'State-Led Southern Development', description: '(-Reform, -Collective, +Global South)' },
    { x: -1, y: 1, z: -1, name: 'Technocratic Western-led Development', description: '(-Reform, +Individual, -Western)' },
    { x: -1, y: 1, z: 1, name: 'Local Southern Champions', description: '(-Reform, +Individual, +Global South)' },
    { x: 1, y: -1, z: -1, name: 'Global Solidarity', description: '(+Transformative, -Collective, -Western)' },
    { x: 1, y: -1, z: 1, name: 'The Pluriverse', description: '(+Transformative, -Collective, +Global South)' },
    { x: 1, y: 1, z: -1, name: 'Critical Western Voices', description: '(+Transformative, +Individual, -Western)' },
    { x: 1, y: 1, z: 1, name: 'Radical Vanguards', description: '(+Transformative, +Individual, +Global South)' }
];

function getCategoryColor(category) {
    if (category.includes('NGOs/Civil Society')) return 0xed8936;
    if (category.includes('Governments/Policy Statements')) return 0x9f7aea;
    return 0x4299e1;
}

function createAxesAndPlanes() {
    const axisLength = 20;

    const xAxis = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, axisLength, 8), new THREE.MeshBasicMaterial({ color: 0xfeb2b2 }));
    xAxis.rotation.z = -Math.PI / 2;
    scene.add(xAxis);

    const yAxis = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, axisLength, 8), new THREE.MeshBasicMaterial({ color: 0x9ae6b4 }));
    scene.add(yAxis);

    const zAxis = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, axisLength, 8), new THREE.MeshBasicMaterial({ color: 0x90cdf4 }));
    zAxis.rotation.x = Math.PI / 2;
    scene.add(zAxis);

    const planeSize = 20;
    const geometry = new THREE.PlaneGeometry(planeSize, planeSize);

    const planeX = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: 0xfeb2b2, transparent: true, opacity: 0.15, side: THREE.DoubleSide }));
    planeX.rotation.y = Math.PI / 2;
    scene.add(planeX);

    const planeY = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: 0x9ae6b4, transparent: true, opacity: 0.15, side: THREE.DoubleSide }));
    planeY.rotation.x = Math.PI / 2;
    scene.add(planeY);

    const planeZ = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: 0x90cdf4, transparent: true, opacity: 0.15, side: THREE.DoubleSide }));
    scene.add(planeZ);

    planeMeshes = [planeX, planeY, planeZ];
}

function setupOctantNav(UI) {
    if (!UI.octantNav) return;
    UI.octantNav.innerHTML = '';

    quadrants.forEach((q, index) => {
        const item = document.createElement('div');
        item.className = 'octant-item';
        item.dataset.index = String(index);

        const isRight = q.x > 0;
        const isTop = q.y > 0;
        const isFront = q.z > 0;

        item.innerHTML = `
            <div class="octant-pictogram">
                <div class="picto-grid">
                    <div class="picto-cell ${!isRight && !isTop ? 'active' : ''}" style="opacity: ${isFront ? 1 : 0.5}"></div>
                    <div class="picto-cell ${isRight && !isTop ? 'active' : ''}" style="opacity: ${isFront ? 1 : 0.5}"></div>
                    <div class="picto-cell ${!isRight && isTop ? 'active' : ''}" style="opacity: ${isFront ? 1 : 0.5}"></div>
                    <div class="picto-cell ${isRight && isTop ? 'active' : ''}" style="opacity: ${isFront ? 1 : 0.5}"></div>
                </div>
            </div>
            <div class="octant-text">
                <h4>${q.name}</h4>
                <p>${q.description}</p>
            </div>
        `;
        item.addEventListener('click', () => selectOctant(index, UI));
        UI.octantNav.appendChild(item);
    });
}

function selectOctant(index, UI) {
    if (!UI.octantNav) return;

    const items = UI.octantNav.querySelectorAll('.octant-item');

    if (selectedOctantIndex === index) {
        selectedOctantIndex = null;
        items.forEach((el) => el.classList.remove('selected'));
        targetCameraPosition = new THREE.Vector3(20, 20, 20);
        targetLookAt.set(0, 0, 0);
        targetPlaneOpacity = 0.15;
        return;
    }

    selectedOctantIndex = index;
    items.forEach((el) => el.classList.remove('selected'));
    items[index]?.classList.add('selected');

    const q = quadrants[index];
    targetCameraPosition = new THREE.Vector3(q.x * 15, q.y * 15, q.z * 15);
    targetLookAt.set(0, 0, 0);
    targetPlaneOpacity = 0.98;
}

function showPublicationCard(diamond, UI) {
    if (!UI.publicationCard) return;

    UI.cardTitle.textContent = diamond.shortTitle || 'Untitled';
    UI.cardMeta.textContent = `${diamond.author || 'Unknown Author'}, ${diamond.year || 'N/A'}`;
    UI.cardX.textContent = getDescriptiveTerm(diamond.x, 'x');
    UI.cardY.textContent = getDescriptiveTerm(diamond.y, 'y');
    UI.cardZ.textContent = getDescriptiveTerm(diamond.z, 'z');

    const xText = diamond.axisInfo?.x?.positioning ? `<b>Reform/Transform:</b> ${diamond.axisInfo.x.positioning}` : '';
    const yText = diamond.axisInfo?.y?.positioning ? `<b>Individual/Collective:</b> ${diamond.axisInfo.y.positioning}` : '';
    const zText = diamond.axisInfo?.z?.positioning ? `<b>West/South:</b> ${diamond.axisInfo.z.positioning}` : '';
    UI.cardSummary.innerHTML = [xText, yText, zText].filter(Boolean).join('<br><br>') || 'No detailed positioning info available.';
    UI.publicationCard.style.display = 'block';
}

function onMouseClick(event, UI) {
    if (!renderer || !camera || !pointsGroup) return;

    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(pointsGroup.children);
    if (intersects.length === 0) return;

    const target = intersects[0].object;
    const index = target.userData.index;
    const diamond = target.userData.diamond;

    showPublicationCard(diamond, UI);
    if (typeof onPublicationSelect === 'function') onPublicationSelect(index);
}

function animate() {
    animationFrameId = requestAnimationFrame(animate);

    if (targetCameraPosition) {
        camera.position.lerp(targetCameraPosition, 0.05);
        currentLookAt.lerp(targetLookAt, 0.05);
        controls.target.copy(currentLookAt);
    }

    if (Math.abs(currentPlaneOpacity - targetPlaneOpacity) > 0.001) {
        currentPlaneOpacity += (targetPlaneOpacity - currentPlaneOpacity) * 0.05;
        planeMeshes.forEach((mesh) => {
            if (mesh?.material) mesh.material.opacity = currentPlaneOpacity;
        });
    }

    controls?.update();
    renderer?.render(scene, camera);
}

export function initConceptualSpace3D(UI, onSelect) {
    if (!UI.canvasContainer || renderer) return;

    onPublicationSelect = onSelect;

    const rect = UI.canvasContainer.getBoundingClientRect();
    const width = Math.max(320, Math.floor(rect.width || UI.canvasContainer.clientWidth || 900));
    const height = Math.max(320, Math.floor(rect.height || UI.canvasContainer.clientHeight || 500));
    lastWidth = width;
    lastHeight = height;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf7fafc);

    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(20, 20, 20);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.inset = '0';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.zIndex = '1';
    UI.canvasContainer.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 20, 10);
    scene.add(dirLight);

    createAxesAndPlanes();
    setupOctantNav(UI);

    pointsGroup = new THREE.Group();
    scene.add(pointsGroup);

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    renderer.domElement.addEventListener('click', (event) => onMouseClick(event, UI));

    UI.closePublicationCard?.addEventListener('click', () => {
        UI.publicationCard.style.display = 'none';
    });

    UI.btnZoomIn?.addEventListener('click', () => {
        const direction = new THREE.Vector3().subVectors(camera.position, controls.target);
        direction.normalize().multiplyScalar(Math.max(2, direction.length() * 0.85));
        camera.position.copy(controls.target).add(direction);
    });

    UI.btnZoomOut?.addEventListener('click', () => {
        const direction = new THREE.Vector3().subVectors(camera.position, controls.target);
        direction.normalize().multiplyScalar(Math.min(100, direction.length() * 1.2));
        camera.position.copy(controls.target).add(direction);
    });

    const rotateBy = (angle) => {
        const x = camera.position.x - controls.target.x;
        const z = camera.position.z - controls.target.z;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        camera.position.x = x * cos - z * sin + controls.target.x;
        camera.position.z = x * sin + z * cos + controls.target.z;
        camera.lookAt(controls.target);
    };

    UI.btnRotateLeft?.addEventListener('click', () => rotateBy(Math.PI / 8));
    UI.btnRotateRight?.addEventListener('click', () => rotateBy(-Math.PI / 8));

    window.addEventListener('resize', () => {
        if (!UI.canvasContainer || !renderer || !camera) return;
        const r = UI.canvasContainer.getBoundingClientRect();
        const w = Math.max(320, Math.floor(r.width || UI.canvasContainer.clientWidth || lastWidth || 900));
        const h = Math.max(320, Math.floor(r.height || UI.canvasContainer.clientHeight || lastHeight || 500));
        lastWidth = w;
        lastHeight = h;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
    });

    animate();
}

export function updateConceptualSpace3D({ diamondsData, filterYearMax, isPublicationTypeVisible, UI }) {
    if (!pointsGroup) return;

    while (pointsGroup.children.length > 0) {
        const child = pointsGroup.children[0];
        child.geometry?.dispose();
        child.material?.dispose();
        pointsGroup.remove(child);
    }

    diamondsData.forEach((diamond, index) => {
        const isVisible = (!diamond.year || diamond.year <= filterYearMax) && isPublicationTypeVisible(diamond, UI);
        if (!isVisible) return;

        const category = Array.isArray(diamond.category) ? diamond.category : [];

        let geometry;
        if (category.includes('NGOs/Civil Society')) geometry = new THREE.TetrahedronGeometry(0.4);
        else if (category.includes('Governments/Policy Statements')) geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        else geometry = new THREE.SphereGeometry(0.3, 24, 24);

        const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: getCategoryColor(category) }));

        if (category.includes('Governments/Policy Statements')) {
            mesh.rotation.z = Math.PI / 4;
            mesh.rotation.x = Math.PI / 4;
        }

        mesh.position.set(diamond.x ?? 0, diamond.y ?? 0, diamond.z ?? 0);
        mesh.userData = { index, diamond };
        pointsGroup.add(mesh);
    });
}

export function destroyConceptualSpace3D() {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
}
