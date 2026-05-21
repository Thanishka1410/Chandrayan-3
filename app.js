/* ==========================================================================
   Chandrayaan-3 - Premium JavaScript Core
   Three.js 3D Lunar Scene, Dynamic Asteroids, Parallax, and Components
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. INITIALIZE THREE.JS SPACE ENVIRONMENT ---
    const canvas = document.getElementById('space-canvas');
    let renderer, scene, camera;
    let moon, asteroidBelt = [], starParticles;
    
    // Mouse interaction tracking
    let mouseX = 0, mouseY = 0;
    let targetX = 0, targetY = 0;
    const windowHalfX = window.innerWidth / 2;
    const windowHalfY = window.innerHeight / 2;
    
    function initThree() {
        // Create Scene
        scene = new THREE.Scene();
        
        // Create Camera
        camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
        camera.position.z = 5;
        
        // Create Renderer
        renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true,
            alpha: true,
            powerPreference: "high-performance"
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.0;
        
        // Lighting System
        const ambientLight = new THREE.AmbientLight(0x0c1e36, 0.95);
        scene.add(ambientLight);
        
        // Main Sun Directional Light (highly defined side-light for crater shadows)
        const sunLight = new THREE.DirectionalLight(0xffffff, 2.5);
        sunLight.position.set(6, 2, 4);
        scene.add(sunLight);
        
        // Cool Blue Rim Point Light
        const rimLight = new THREE.PointLight(0x3b82f6, 1.8, 15);
        rimLight.position.set(-5, -3, 2);
        scene.add(rimLight);

        // Generate Assets
        createProceduralMoon();
        createAsteroidBelt();
        createStarField();
        
        animate();
    }
    
    // --- 2. PROCEDURAL HIGH-FIDELITY LUNAR GENERATOR ---
    // Creates a detailed lunar texture offline on HTML5 Canvas to eliminate loading lag
    function createProceduralMoon() {
        const textureResolution = 2048;
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = textureResolution;
        tempCanvas.height = textureResolution / 2;
        const ctx = tempCanvas.getContext('2d');
        
        // Base fill (dark grey lunar surface)
        ctx.fillStyle = '#65676e';
        ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        
        // Render Highland / Lowland Mare structures using fractional noise particles
        for (let i = 0; i < 60; i++) {
            const x = Math.random() * tempCanvas.width;
            const y = Math.random() * tempCanvas.height;
            const radius = 80 + Math.random() * 250;
            const isDark = Math.random() > 0.45;
            
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
            if (isDark) {
                gradient.addColorStop(0, 'rgba(40, 42, 48, 0.7)');
                gradient.addColorStop(0.5, 'rgba(60, 62, 68, 0.4)');
            } else {
                gradient.addColorStop(0, 'rgba(125, 127, 134, 0.45)');
                gradient.addColorStop(0.5, 'rgba(100, 102, 108, 0.15)');
            }
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Add random fine noise overlay
        const imgData = ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        const data = imgData.data;
        for (let i = 0; i < data.length; i += 4) {
            const noise = (Math.random() - 0.5) * 18;
            data[i] = Math.max(0, Math.min(255, data[i] + noise));     // Red
            data[i+1] = Math.max(0, Math.min(255, data[i+1] + noise)); // Green
            data[i+2] = Math.max(0, Math.min(255, data[i+2] + noise)); // Blue
        }
        ctx.putImageData(imgData, 0, 0);
        
        // Render 200+ detailed circular Craters with shadows based on lighting
        // Simple shadows: white rim on one side, black on the other
        for (let c = 0; c < 280; c++) {
            const cx = Math.random() * tempCanvas.width;
            const cy = Math.random() * tempCanvas.height;
            const cr = 4 + Math.pow(Math.random(), 3) * 60; // Bias towards smaller craters
            
            // Draw dark shadow inner crater
            ctx.fillStyle = 'rgba(25, 27, 32, 0.65)';
            ctx.beginPath();
            ctx.arc(cx, cy, cr, 0, Math.PI * 2);
            ctx.fill();
            
            // Highlight rim (white lunar rim reflecting light)
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
            ctx.lineWidth = Math.max(1, cr * 0.08);
            ctx.beginPath();
            ctx.arc(cx - cr*0.05, cy - cr*0.05, cr, 0, Math.PI * 2);
            ctx.stroke();
            
            // Deep shadows (black rim offset opposite to sun)
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
            ctx.lineWidth = Math.max(1, cr * 0.06);
            ctx.beginPath();
            ctx.arc(cx + cr*0.06, cy + cr*0.06, cr, 0, Math.PI * 2);
            ctx.stroke();
            
            // Tycho-like ray systems for giant craters
            if (cr > 40 && Math.random() > 0.6) {
                const rays = 12 + Math.floor(Math.random() * 8);
                for (let r = 0; r < rays; r++) {
                    const angle = (r / rays) * Math.PI * 2 + Math.random() * 0.2;
                    const rayLen = cr * (3 + Math.random() * 6);
                    
                    const rayGrad = ctx.createLinearGradient(
                        cx, cy, 
                        cx + Math.cos(angle) * rayLen, 
                        cy + Math.sin(angle) * rayLen
                    );
                    rayGrad.addColorStop(0, 'rgba(255, 255, 255, 0.22)');
                    rayGrad.addColorStop(0.2, 'rgba(255, 255, 255, 0.08)');
                    rayGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
                    
                    ctx.strokeStyle = rayGrad;
                    ctx.lineWidth = Math.max(0.5, cr * 0.02);
                    ctx.beginPath();
                    ctx.moveTo(cx, cy);
                    ctx.lineTo(cx + Math.cos(angle) * rayLen, cy + Math.sin(angle) * rayLen);
                    ctx.stroke();
                }
            }
        }
        
        // Convert canvas to Three.js Texture
        const moonTexture = new THREE.CanvasTexture(tempCanvas);
        
        // Generate Bump Map (Higher contrast black & white version of texture)
        const bumpCanvas = document.createElement('canvas');
        bumpCanvas.width = textureResolution;
        bumpCanvas.height = textureResolution / 2;
        const bCtx = bumpCanvas.getContext('2d');
        bCtx.drawImage(tempCanvas, 0, 0);
        
        const bImgData = bCtx.getImageData(0, 0, bumpCanvas.width, bumpCanvas.height);
        const bData = bImgData.data;
        for (let i = 0; i < bData.length; i += 4) {
            const v = (bData[i] + bData[i+1] + bData[i+2]) / 3;
            // High contrast scaling to isolate craters and ridges
            const value = Math.max(0, Math.min(255, (v - 100) * 1.5));
            bData[i] = value;
            bData[i+1] = value;
            bData[i+2] = value;
        }
        bCtx.putImageData(bImgData, 0, 0);
        const moonBumpMap = new THREE.CanvasTexture(bumpCanvas);
        
        // Create Mesh
        const geometry = new THREE.SphereGeometry(1.65, 64, 64);
        const material = new THREE.MeshStandardMaterial({
            map: moonTexture,
            bumpMap: moonBumpMap,
            bumpScale: 0.045,
            roughness: 0.88,
            metalness: 0.02
        });
        
        moon = new THREE.Mesh(geometry, material);
        // Position Moon to the right side, aligning with the visual layout in the user's image
        moon.position.set(1.9, 0.2, 0);
        scene.add(moon);
    }
    
    // --- 3. DYNAMIC PROCEDURAL ASTEROID BELT ---
    // Creates 30 distinct orbiting asteroid rocks
    function createAsteroidBelt() {
        const count = 35;
        const asteroidMaterial = new THREE.MeshStandardMaterial({
            color: 0x4f525c,
            roughness: 0.9,
            metalness: 0.1
        });
        
        for (let i = 0; i < count; i++) {
            // Random rocky geometry (Dodecahedron with vertex noise)
            const rockSize = 0.025 + Math.random() * 0.075;
            const rockGeom = new THREE.DodecahedronGeometry(rockSize, 1);
            
            // Perturb vertices slightly to create a unique jagged shape
            const posAttr = rockGeom.attributes.position;
            for (let v = 0; v < posAttr.count; v++) {
                const vx = posAttr.getX(v);
                const vy = posAttr.getY(v);
                const vz = posAttr.getZ(v);
                
                posAttr.setX(v, vx + (Math.random() - 0.5) * (rockSize * 0.3));
                posAttr.setY(v, vy + (Math.random() - 0.5) * (rockSize * 0.3));
                posAttr.setZ(v, vz + (Math.random() - 0.5) * (rockSize * 0.3));
            }
            rockGeom.computeVertexNormals();
            
            const asteroid = new THREE.Mesh(rockGeom, asteroidMaterial);
            
            // Setup custom orbit variables centered around the Moon's position
            const orbitRadius = 1.95 + Math.random() * 1.5;
            // Tilt the orbital plane of the asteroid belt slightly
            const orbitalTilt = (Math.random() - 0.5) * 0.35;
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.0006 + Math.random() * 0.0012;
            
            asteroid.userData = {
                radius: orbitRadius,
                tilt: orbitalTilt,
                angle: angle,
                speed: speed,
                rotSpeedX: (Math.random() - 0.5) * 0.015,
                rotSpeedY: (Math.random() - 0.5) * 0.015,
                rotSpeedZ: (Math.random() - 0.5) * 0.015
            };
            
            // Set initial position
            updateAsteroidPosition(asteroid);
            
            scene.add(asteroid);
            asteroidBelt.push(asteroid);
        }
    }
    
    function updateAsteroidPosition(asteroid) {
        const u = asteroid.userData;
        // Circular orbit relative to the Moon's current position
        const moonX = moon.position.x;
        const moonY = moon.position.y;
        const moonZ = moon.position.z;
        
        asteroid.position.x = moonX + Math.cos(u.angle) * u.radius;
        asteroid.position.z = moonZ + Math.sin(u.angle) * u.radius;
        asteroid.position.y = moonY + Math.sin(u.angle) * u.radius * u.tilt;
    }
    
    // --- 4. TWINKLING COSMIC STARFIELD ---
    function createStarField() {
        const count = 1200;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const sizes = new Float32Array(count);
        const colors = new Float32Array(count * 3);
        
        for (let i = 0; i < count; i++) {
            // Distribute stars in a large sphere around camera
            const radius = 25 + Math.random() * 35;
            const u = Math.random();
            const v = Math.random();
            const theta = u * 2.0 * Math.PI;
            const phi = Math.acos(2.0 * v - 1.0);
            
            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = radius * Math.cos(phi);
            
            // Randomized star size
            sizes[i] = 1.0 + Math.random() * 3.5;
            
            // Warm/Cool star color spectrums
            const r = Math.random();
            if (r > 0.8) {
                // Bluish stars
                colors[i * 3] = 0.7; colors[i * 3 + 1] = 0.85; colors[i * 3 + 2] = 1.0;
            } else if (r > 0.65) {
                // Amber/Orange stars
                colors[i * 3] = 1.0; colors[i * 3 + 1] = 0.8; colors[i * 3 + 2] = 0.6;
            } else {
                // Crystal white
                colors[i * 3] = 0.95; colors[i * 3 + 1] = 0.95; colors[i * 3 + 2] = 1.0;
            }
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        // Procedural Star glow texture
        const starCanvas = document.createElement('canvas');
        starCanvas.width = 16;
        starCanvas.height = 16;
        const sCtx = starCanvas.getContext('2d');
        const grad = sCtx.createRadialGradient(8, 8, 0, 8, 8, 8);
        grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
        grad.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)');
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        sCtx.fillStyle = grad;
        sCtx.fillRect(0, 0, 16, 16);
        const starTex = new THREE.CanvasTexture(starCanvas);
        
        const material = new THREE.PointsMaterial({
            size: 0.12,
            map: starTex,
            vertexColors: true,
            transparent: true,
            opacity: 0.85,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        starParticles = new THREE.Points(geometry, material);
        scene.add(starParticles);
    }
    
    // --- 5. RENDER LOOP & PARALLAX ---
    function animate() {
        requestAnimationFrame(animate);
        
        // Spin the Moon slowly on its polar axis
        if (moon) {
            moon.rotation.y += 0.0016;
        }
        
        // Propagate asteroids along their lunar orbits
        asteroidBelt.forEach(asteroid => {
            const u = asteroid.userData;
            u.angle += u.speed;
            
            updateAsteroidPosition(asteroid);
            
            // Random self-rotation to simulate tumbling asteroid chunks
            asteroid.rotation.x += u.rotSpeedX;
            asteroid.rotation.y += u.rotSpeedY;
            asteroid.rotation.z += u.rotSpeedZ;
        });
        
        // Twist starfield slightly
        if (starParticles) {
            starParticles.rotation.y += 0.00015;
            starParticles.rotation.x += 0.00008;
        }
        
        // Apply smooth lag interpolation (lerp) on mouse coords to create fluid motion
        targetX += (mouseX - targetX) * 0.05;
        targetY += (mouseY - targetY) * 0.05;
        
        // Shift camera slightly based on mouse drag/hover for organic 3D depth
        camera.position.x = targetX * 0.6;
        camera.position.y = -targetY * 0.6;
        camera.lookAt(new THREE.Vector3(0.5, 0, 0));
        
        renderer.render(scene, camera);
    }
    
    // Mouse interaction event listener
    document.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX - windowHalfX) / windowHalfX;
        mouseY = (e.clientY - windowHalfY) / windowHalfY;
        
        // Parallel interactive shift on HTML astronaut overlay
        const astroContainer = document.getElementById('astronaut-parallax');
        if (astroContainer) {
            const limitX = mouseX * -25; // Shifts astronaut slightly opposite to mouse
            const limitY = mouseY * -25;
            const rot = mouseX * 2.5; // Slight angle rotation
            
            astroContainer.style.transform = `translate3d(${limitX}px, ${limitY}px, 0) rotate(${rot}deg)`;
        }
    });
    
    // Resize dynamic handler
    window.addEventListener('resize', () => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        // Readjust moon position for responsiveness
        if (moon) {
            if (width < 768) {
                moon.position.set(0, 0, -2); // center & distance moon on small screens
            } else if (width < 1024) {
                moon.position.set(1.4, 0.2, -0.5);
            } else {
                moon.position.set(1.9, 0.2, 0);
            }
        }
    });
    
    // Trigger window resize immediately once to correct viewport scaling
    window.dispatchEvent(new Event('resize'));
    
    // Launch Three.js Setup
    initThree();
    
    
    // --- 6. FLOATING NAVBAR SCROLL EFFECTS ---
    const header = document.querySelector('.header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 40) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
        
        // Highlight corresponding nav-link when scrolling past target segments
        highlightNavOnScroll();
    });
    
    function highlightNavOnScroll() {
        const sections = document.querySelectorAll('section');
        const navLinks = document.querySelectorAll('.nav-link');
        
        let currentSection = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            // Highlight a link when 1/3 of the section is visible
            if (window.scrollY >= sectionTop - sectionHeight / 3) {
                currentSection = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').substring(1) === currentSection) {
                link.classList.add('active');
            }
        });
    }


    // --- 7. MOBILE SIDEBAR MENU HANDLER ---
    const menuToggle = document.getElementById('menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');
    
    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => {
            menuToggle.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
        
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                menuToggle.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }
    
    
    // --- 8. INTERACTIVE TIMELINE SYSTEM ---
    const timelineNodes = document.querySelectorAll('.timeline-node');
    const timelineProgress = document.getElementById('timeline-progress');
    const detailCard = document.getElementById('timeline-detail-card');
    const detailDate = document.getElementById('timeline-date');
    const detailTitle = document.getElementById('timeline-title');
    const detailDesc = document.getElementById('timeline-desc');
    
    // Map timeline node highlights and dynamic text switching
    timelineNodes.forEach(node => {
        node.addEventListener('click', () => {
            // Update active highlights
            timelineNodes.forEach(n => n.classList.remove('active'));
            node.classList.add('active');
            
            // Adjust progress bar percent line
            const index = parseInt(node.getAttribute('data-index'));
            const total = timelineNodes.length;
            const percent = (index / (total - 1)) * 100;
            timelineProgress.style.width = `${percent}%`;
            
            // Fade out detail card, update text values from nodes data values, fade back in
            detailCard.classList.remove('active');
            
            setTimeout(() => {
                detailDate.textContent = node.getAttribute('data-date');
                detailTitle.textContent = node.getAttribute('data-title');
                detailDesc.textContent = node.getAttribute('data-desc');
                detailCard.classList.add('active');
            }, 300);
        });
    });
    
    // Activate first detail card immediately
    if (detailCard) {
        detailCard.classList.add('active');
    }
    
    
    // --- 9. CUSTOM HIGH-FIDELITY VIDEO MODAL SYSTEM ---
    const openVideoBtns = [
        document.getElementById('open-video-modal'),
        document.getElementById('video-preview-trigger')
    ];
    const videoModal = document.getElementById('video-modal');
    const closeVideoBtn = document.getElementById('modal-close-btn');
    const closeVideoBackdrop = document.getElementById('modal-close-backdrop');
    const videoIframe = document.getElementById('video-iframe');
    
    // Sleek space cinematic trailer (ISRO official animation simulation link)
    const youtubeVideoUrl = "https://www.youtube.com/embed/S2C1eB7oZ-4?autoplay=1&mute=1&rel=0";
    
    openVideoBtns.forEach(btn => {
        if (btn) {
            btn.addEventListener('click', () => {
                videoModal.classList.add('active');
                videoIframe.src = youtubeVideoUrl;
            });
        }
    });
    
    function closeVideo() {
        videoModal.classList.remove('active');
        // Clear iframe source to immediately stop audio playback
        videoIframe.src = "";
    }
    
    if (closeVideoBtn) closeVideoBtn.addEventListener('click', closeVideo);
    if (closeVideoBackdrop) closeVideoBackdrop.addEventListener('click', closeVideo);
    
    
    // --- 10. COMPONENT DETAIL SLIDING DRAWER SYSTEM ---
    const compButtons = document.querySelectorAll('.comp-link-btn');
    const compDrawer = document.getElementById('component-drawer');
    const drawerCloseBtn = document.getElementById('drawer-close-btn');
    const drawerCloseBackdrop = document.getElementById('drawer-close-backdrop');
    const drawerBodyContent = document.getElementById('drawer-body-content');
    
    // Rich component databases injected to drawer
    const componentsDB = {
        vikram: {
            title: "Vikram Lander Module",
            img: "assets/vikram.png",
            desc: "Named after Dr. Vikram A. Sarabhai, the father of the Indian Space Programme, the Vikram Lander module is designed to execute a high-precision soft landing on the moon surface. Equipped with 4 throttleable engines, it successfully touched down near the Lunar South Pole on August 23, 2023, carrying the Pragyan Rover securely inside.",
            specs: {
                "Mass": "1749.86 kg (including Rover)",
                "Power Generated": "738 Watts",
                "Mission Life": "1 Lunar Day (14 Earth Days)",
                "Propulsion": "4 Throttleable Liquid Engines",
                "Key Payload 1": "RAMBHA-LP (Plasma Density Probe)",
                "Key Payload 2": "ChaSTE (Surface Thermal Property Instrument)",
                "Key Payload 3": "ILSA (Lunar Seismic Activity Analyzer)"
            }
        },
        pragyan: {
            title: "Pragyan Rover Module",
            img: "assets/pragyan.png",
            desc: "The Pragyan Rover ('Wisdom' in Sanskrit) is a highly autonomous 6-wheeled robotic rover. Deployed successfully via a ramp from Vikram Lander, Pragyan traveled across the harsh, dark terrains of the lunar south pole. Utilizing its robust solar panels and advanced onboard chemical analysers, it confirmed crucial element compositions in lunar soil.",
            specs: {
                "Mass": "26 kg",
                "Power Generated": "50 Watts",
                "Mission Life": "1 Lunar Day (14 Earth Days)",
                "Mobility": "6-Wheeled Rocker-Bogie Suspension",
                "Range": "Up to 500 Meters",
                "Key Payload 1": "APXS (Alpha Particle X-Ray Spectrometer)",
                "Key Payload 2": "LIBS (Laser Induced Breakdown Spectroscope)"
            }
        },
        propulsion: {
            title: "Propulsion Module",
            img: "assets/propulsion.png",
            desc: "The core orbital module that successfully carried the Vikram Lander and Pragyan Rover combo from launch injection all the way down to a 100km circular polar lunar orbit. After separating from the lander, the Propulsion Module continues to orbit the Moon, conducting crucial atmospheric and spectro-polarimetric studies of Earth.",
            specs: {
                "Mass": "2148 kg",
                "Power Generated": "758 Watts",
                "Mission Life": "Up to 6 Months (Post-Separation)",
                "Propulsion": "Liquid Engine (440 N Thrust)",
                "Orbital Altitude": "100 km Circular Lunar Orbit",
                "Key Payload": "SHAPE (Spectro-polarimetry of Habitable Planet Earth)"
            }
        }
    };
    
    compButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const compKey = btn.getAttribute('data-comp');
            const data = componentsDB[compKey];
            
            if (data) {
                // Generate spec table HTML
                let specRows = '';
                for (const [key, value] of Object.entries(data.specs)) {
                    specRows += `
                        <div class="drawer-meta-item">
                            <div class="drawer-meta-label">${key}</div>
                            <div class="drawer-meta-value">${value}</div>
                        </div>
                    `;
                }
                
                // Assemble Drawer Body
                drawerBodyContent.innerHTML = `
                    <h3 class="drawer-title">${data.title}</h3>
                    <img src="${data.img}" alt="${data.title}" class="drawer-img">
                    <p class="drawer-text">${data.desc}</p>
                    <div class="drawer-meta-grid">
                        ${specRows}
                    </div>
                `;
                
                // Slide Drawer In
                compDrawer.classList.add('active');
            }
        });
    });
    
    function closeDrawer() {
        compDrawer.classList.remove('active');
    }
    
    if (drawerCloseBtn) drawerCloseBtn.addEventListener('click', closeDrawer);
    if (drawerCloseBackdrop) drawerCloseBackdrop.addEventListener('click', closeDrawer);
    
    
    // --- 11. SCROLL REVEAL ACTIVATOR ---
    const reveals = document.querySelectorAll('.scroll-reveal');
    
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                // Optional: Unobserve after revealing to prevent repeated triggering
                revealObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.15 // Triggers when 15% of section enters viewport
    });
    
    reveals.forEach(el => revealObserver.observe(el));
    
    
    // --- 12. GENERAL INTERFACE SHORTCUT KEYS ---
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeVideo();
            closeDrawer();
        }
    });

});
