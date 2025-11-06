// Game variables
let scene, camera, renderer, car, road, obstacles = [];
let gameSpeed = 0;
let score = 0;
let isGameOver = false;
let animationId;

// Constants
const LANE_WIDTH = 4;
const CAMERA_HEIGHT = 5;
const CAMERA_DISTANCE = 10;
const MAX_SPEED = 100;
const ACCELERATION = 0.5;
const DECELERATION = 0.2;
const TURNING_SPEED = 0.05;

// Initialize the game
function init() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Sky blue background

    // Create camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, CAMERA_HEIGHT, CAMERA_DISTANCE);
    camera.lookAt(0, 0, 0);

    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('game-container').appendChild(renderer.domElement);

    // Create road
    createRoad();
    
    // Create car
    createCar();

    // Add lights
    addLights();

    // Event listeners
    window.addEventListener('resize', onWindowResize);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    
    // Start game loop
    animate();

    // Reset game state
    resetGame();
}

// Create the road
function createRoad() {
    const roadGeometry = new THREE.PlaneGeometry(LANE_WIDTH * 3, 1000);
    const roadMaterial = new THREE.MeshPhongMaterial({
        color: 0x404040,
        side: THREE.DoubleSide
    });
    road = new THREE.Mesh(roadGeometry, roadMaterial);
    road.rotation.x = -Math.PI / 2;
    road.position.z = -500;
    scene.add(road);

    // Add road markings
    addRoadMarkings();
}

// Create the car
function createCar() {
    const carGeometry = new THREE.BoxGeometry(2, 1, 4);
    const carMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
    car = new THREE.Mesh(carGeometry, carMaterial);
    car.position.y = 0.5;
    scene.add(car);

    // Add wheels
    addWheels();
}

// Add wheels to the car
function addWheels() {
    const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.4, 32);
    const wheelMaterial = new THREE.MeshPhongMaterial({ color: 0x202020 });
    
    // Create and position wheels
    const wheels = [];
    const wheelPositions = [
        { x: -1, y: 0, z: 1.5 },
        { x: 1, y: 0, z: 1.5 },
        { x: -1, y: 0, z: -1.5 },
        { x: 1, y: 0, z: -1.5 }
    ];

    wheelPositions.forEach(pos => {
        const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        wheel.position.set(pos.x, pos.y, pos.z);
        wheel.rotation.z = Math.PI / 2;
        car.add(wheel);
        wheels.push(wheel);
    });
}

// Add lighting to the scene
function addLights() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(0, 20, 10);
    scene.add(directionalLight);
}

// Handle window resizing
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Key press handlers
function onKeyDown(event) {
    if (isGameOver) return;

    switch (event.key) {
        case 'ArrowUp':
            gameSpeed = Math.min(gameSpeed + ACCELERATION, MAX_SPEED);
            break;
        case 'ArrowLeft':
            if (car.position.x > -LANE_WIDTH) {
                car.position.x -= TURNING_SPEED;
            }
            break;
        case 'ArrowRight':
            if (car.position.x < LANE_WIDTH) {
                car.position.x += TURNING_SPEED;
            }
            break;
    }
}

function onKeyUp(event) {
    if (event.key === 'ArrowUp') {
        gameSpeed = Math.max(gameSpeed - DECELERATION, 0);
    }
}

// Create obstacles
function createObstacle() {
    const obstacleGeometry = new THREE.BoxGeometry(2, 1, 2);
    const obstacleMaterial = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
    const obstacle = new THREE.Mesh(obstacleGeometry, obstacleMaterial);
    
    // Random lane position
    obstacle.position.x = (Math.floor(Math.random() * 3) - 1) * LANE_WIDTH;
    obstacle.position.y = 0.5;
    obstacle.position.z = -500;
    
    scene.add(obstacle);
    obstacles.push(obstacle);
}

// Update game state
function updateGame() {
    if (isGameOver) return;

    // Update score
    score += Math.floor(gameSpeed);
    document.getElementById('score-value').textContent = score;
    document.getElementById('speed-value').textContent = Math.floor(gameSpeed);

    // Move obstacles
    obstacles.forEach((obstacle, index) => {
        obstacle.position.z += gameSpeed * 0.1;
        
        // Check collision
        if (checkCollision(car, obstacle)) {
            gameOver();
        }
        
        // Remove obstacles that are behind the car
        if (obstacle.position.z > 20) {
            scene.remove(obstacle);
            obstacles.splice(index, 1);
        }
    });

    // Create new obstacles
    if (Math.random() < 0.02) {
        createObstacle();
    }
}

// Check collision between two objects
function checkCollision(obj1, obj2) {
    const box1 = new THREE.Box3().setFromObject(obj1);
    const box2 = new THREE.Box3().setFromObject(obj2);
    return box1.intersectsBox(box2);
}

// Game over handler
function gameOver() {
    isGameOver = true;
    document.getElementById('game-over').classList.remove('hidden');
    document.getElementById('final-score').textContent = score;
    cancelAnimationFrame(animationId);
}

// Reset game state
function resetGame() {
    score = 0;
    gameSpeed = 0;
    isGameOver = false;
    car.position.set(0, 0.5, 0);
    
    // Remove all obstacles
    obstacles.forEach(obstacle => scene.remove(obstacle));
    obstacles = [];
    
    document.getElementById('game-over').classList.add('hidden');
    document.getElementById('score-value').textContent = '0';
    document.getElementById('speed-value').textContent = '0';
    
    // Restart animation
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    animate();
}

// Animation loop
function animate() {
    animationId = requestAnimationFrame(animate);
    updateGame();
    renderer.render(scene, camera);
}

// Add road markings
function addRoadMarkings() {
    const markingGeometry = new THREE.PlaneGeometry(0.2, 3);
    const markingMaterial = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide
    });

    for (let i = 0; i < 20; i++) {
        const marking = new THREE.Mesh(markingGeometry, markingMaterial);
        marking.rotation.x = -Math.PI / 2;
        marking.position.z = i * 20 - 200;
        scene.add(marking);
    }
}

// Initialize game when window loads
window.addEventListener('load', init);

// Add restart button functionality
document.getElementById('restart-btn').addEventListener('click', resetGame);
