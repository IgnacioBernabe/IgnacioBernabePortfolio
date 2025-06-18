 gsap.registerPlugin(ScrollTrigger);

    // ScrollTrigger para animar los elementos del grid cuando entran en vista
    gsap.utils.toArray('.grid-item-project').forEach((item, index) => {
      gsap.fromTo(item, 
        {
          opacity: 0,
          y: 30
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: item,
            start: 'top 90%',
            end: 'bottom 10%',
            toggleActions: 'play none none reverse'
          }
        }
      );
    });


    // Funcionalidad para ocultar/mostrar navbar al hacer scroll
    let lastScrollTop = 0;
    const navbar = document.querySelector('.navbar');
    const scrollThreshold = 100; // Píxeles que hay que scrollear antes de que el navbar reaccione

    window.addEventListener('scroll', function() {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      
      if (Math.abs(scrollTop - lastScrollTop) < scrollThreshold) {
        return;
      }
      
      if (scrollTop > lastScrollTop && scrollTop > 100) {
        // Scrolleando hacia abajo - ocultar navbar
        navbar.classList.add('navbar-hidden');
        navbar.classList.remove('navbar-visible');
      } else {
        // Scrolleando hacia arriba - mostrar navbar
        navbar.classList.add('navbar-visible');
        navbar.classList.remove('navbar-hidden');
      }
      
      lastScrollTop = scrollTop;
    });

    // Funcionalidad del botón de email
    document.querySelector('.email-button').addEventListener('click', function() {
      window.location.href = 'mailto:EMAIL@DOMINIO.COM';
    });

    // Smooth scroll para los enlaces de navegación
    document.querySelectorAll('.nav-links a').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth'
          });
        }
      });
    });



    // Scene setup
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xffffff); // Fondo blanco para la escena
        
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(0xffffff, 1); // Color de fondo blanco para el renderer
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.getElementById('threejs-container').appendChild(renderer.domElement);

        // Variables para controles
        let catModel = null;
        let isMouseDown = false;
        let mouseX = 0, mouseY = 0;
        let rotationX = 0, rotationY = 0;
        let targetRotationX = 0, targetRotationY = 0;

        // Lighting setup - luz ambiental reducida con direccional de frente
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.4);
        directionalLight.position.set(0, 0, 5);
        scene.add(directionalLight);

        // Load model with textures (MTL + OBJ)
        function loadModelWithTextures() {
            const mtlLoader = new THREE.MTLLoader();
            mtlLoader.load(
                'cat.mtl', // Material file
                (materials) => {
                    materials.preload();
                    
                    // Load OBJ with materials
                    const objLoader = new THREE.OBJLoader();
                    objLoader.setMaterials(materials);
                    objLoader.load(
                        'cat.obj',
                        (object) => {
                            setupModel(object, true);
                        },
                        (xhr) => {},
                        (error) => {
                            console.error('Error loading OBJ with materials:', error);
                            loadModelWithoutMaterials();
                        }
                    );
                },
                (xhr) => {},
                (error) => {
                    console.warn('Could not load MTL file:', error);
                    loadModelWithoutMaterials();
                }
            );
        }

        // Load model without textures (OBJ only)
        function loadModelWithoutMaterials() {
            const objLoader = new THREE.OBJLoader();
            objLoader.load(
                'cat.obj',
                (object) => {
                    setupModel(object, false);
                },
                (xhr) => {},
                (error) => {
                    console.error('Error loading model:', error);
                }
            );
        }

        // Setup the loaded model
        function setupModel(object, hasTextures) {
            catModel = object;
            
            // Center the model
            const box = new THREE.Box3().setFromObject(catModel);
            const center = box.getCenter(new THREE.Vector3());
            catModel.position.sub(center);
            
            // Scale the model appropriately
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 5 / maxDim;
            catModel.scale.setScalar(scale);
            
            let materialsFound = 0;
            let texturesFound = 0;
            
            // Enable shadows and process materials
            catModel.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    
                    if (child.material) {
                        materialsFound++;
                        child.material.side = THREE.DoubleSide;
                        
                        // Check for textures
                        if (child.material.map) {
                            texturesFound++;
                            console.log('Texture found on mesh:', child.name || 'unnamed');
                        }
                        
                        // Ensure material works with lighting
                        if (child.material.type === 'MeshBasicMaterial') {
                            // Convert to Lambert for better lighting
                            const newMaterial = new THREE.MeshLambertMaterial({
                                map: child.material.map,
                                color: child.material.color,
                                side: THREE.DoubleSide
                            });
                            child.material = newMaterial;
                        }
                    } else {
                        // Create default material if none exists
                        child.material = new THREE.MeshLambertMaterial({
                            color: 0xffffff,
                            side: THREE.DoubleSide
                        });
                    }
                }
            });
            
            scene.add(catModel);
            
            console.log(`Model loaded successfully:
- Has textures: ${hasTextures}
- Materials found: ${materialsFound}
- Textures found: ${texturesFound}
- Model bounds:`, size);
        }

        // Camera position
        camera.position.set(0, 4, 12);

        // Mouse controls
        const container = document.getElementById('threejs-container');

        container.addEventListener('mousedown', (event) => {
            isMouseDown = true;
            mouseX = event.clientX;
            mouseY = event.clientY;
        });

        container.addEventListener('mousemove', (event) => {
            if (!isMouseDown || !catModel) return;
            
            const deltaX = event.clientX - mouseX;
            const deltaY = event.clientY - mouseY;
            
            targetRotationY += deltaX * 0.01;
            targetRotationX += deltaY * 0.01;
            
            // Limit vertical rotation
            targetRotationX = Math.max(-Math.PI/2, Math.min(Math.PI/2, targetRotationX));
            
            mouseX = event.clientX;
            mouseY = event.clientY;
        });

        container.addEventListener('mouseup', () => {
            isMouseDown = false;
        });

        container.addEventListener('mouseleave', () => {
            isMouseDown = false;
        });

        // Touch controls for mobile
        let touchStartX = 0, touchStartY = 0;

        container.addEventListener('touchstart', (event) => {
            if (event.touches.length === 1) {
                touchStartX = event.touches[0].clientX;
                touchStartY = event.touches[0].clientY;
                isMouseDown = true;
            }
        });

        container.addEventListener('touchmove', (event) => {
            event.preventDefault();
            if (event.touches.length === 1 && isMouseDown && catModel) {
                const deltaX = event.touches[0].clientX - touchStartX;
                const deltaY = event.touches[0].clientY - touchStartY;
                
                targetRotationY += deltaX * 0.01;
                targetRotationX += deltaY * 0.01;
                
                targetRotationX = Math.max(-Math.PI/2, Math.min(Math.PI/2, targetRotationX));
                
                touchStartX = event.touches[0].clientX;
                touchStartY = event.touches[0].clientY;
            }
        });

        container.addEventListener('touchend', () => {
            isMouseDown = false;
        });

        // Animation loop with smooth interpolation and automatic rotation
        function animate() {
            requestAnimationFrame(animate);
            
            if (catModel) {
                // Automatic rotation (constant, no toggle needed)
                targetRotationY += 0.005; // Rotate automatically around Y-axis
                
                // Smooth rotation interpolation
                rotationX += (targetRotationX - rotationX) * 0.1;
                rotationY += (targetRotationY - rotationY) * 0.1;
                
                catModel.rotation.x = rotationX;
                catModel.rotation.y = rotationY;
                
                // Apply fixed scale
                const currentScale = 4;
                catModel.scale.setScalar(currentScale);
                
                // Optional: Add a subtle floating animation
                catModel.position.y += Math.sin(Date.now() * 0.001) * 0.002;
            }
            
            renderer.render(scene, camera);
        }
        animate();

        // Handle window resize
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });

        // Start loading process
        loadModelWithTextures();




        // GSAP Animations
        gsap.from(".top-description", {
            duration: 1.2,
            y: 60,
            opacity: 0,
            ease: "power3.out",
            delay: 0.1
        });

        gsap.from(".info-bar > div", {
            duration: 1,
            y: 40,
            opacity: 0,
            stagger: 0.15,
            ease: "power3.out",
            delay: 0.6
        });

        gsap.from("#mainName", {
            duration: 1.2,
            x: -60,
            opacity: 0,
            ease: "power3.out",
            delay: 1
        });


        gsap.registerPlugin(ScrollTrigger);

  // Selecciona todos los enlaces de navegación
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      const targetElement = document.querySelector(targetId);

      if (targetElement) {
        gsap.to(window, {
          duration: 1,
          scrollTo: {
            y: targetElement,
            offsetY: 50 // Ajusta este valor si necesitas un margen superior
          },
          ease: "power2.out"
        });
      }
    });
  });

document.querySelectorAll('.grid-item-project').forEach(item => {
            item.style.cursor = 'pointer';
            const img = item.querySelector('img');
            
            item.addEventListener('mouseenter', () => {
                gsap.to(img, {
                    scale: 1.03,
                    boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
                    duration: 0.8,
                    ease: "power4.out"
                });
            });

            item.addEventListener('mouseleave', () => {
                gsap.to(img, {
                    scale: 1,
                    boxShadow: "none",
                    duration: 0.8,
                    ease: "power4.out"
                });
            });
        });


    const grid = document.querySelector(".container");
    const items = document.querySelectorAll(".grid-item");
    const overlay = document.getElementById("hoverOverlay");

    const gradients = [
      "linear-gradient(45deg, #e53e3e, #ff6b6b)",
      "linear-gradient(45deg, #3182ce, #63b3ed)",
      "linear-gradient(45deg, #f6ad55, #ecc94b)",
      "linear-gradient(45deg, #38b2ac, #319795)",
      "linear-gradient(45deg, #805ad5, #9f7aea)",
      "linear-gradient(45deg, #2c7a7b, #285e61)",
      "linear-gradient(45deg, #9c4221, #c05621)",
    ];

    let currentIndex = -1;

    function getPosition(item) {
      const gridRect = grid.getBoundingClientRect();
      const itemRect = item.getBoundingClientRect();
      return {
        x: itemRect.left - gridRect.left,
        y: itemRect.top - gridRect.top,
        width: itemRect.width,
        height: itemRect.height
      };
    }

    function moveOverlayTo(item, index) {
      const pos = getPosition(item);
      gsap.to(overlay, {
        x: pos.x,
        y: pos.y,
        width: pos.width,
        height: pos.height,
        background: gradients[index % gradients.length],
        opacity: 1,
        duration: 0.4,
        ease: "power3.out"
      });

      items.forEach((el, i) => {
        el.classList.toggle("active", i === index);
      });

      currentIndex = index;
    }

    function hideOverlay() {
      gsap.to(overlay, {
        opacity: 0,
        duration: 0.3
      });
      items.forEach(el => el.classList.remove("active"));
      currentIndex = -1;
    }

    items.forEach((item, index) => {
      const svg = item.querySelector("svg");

      item.addEventListener("mouseenter", () => {
        moveOverlayTo(item, index);
      });

      item.addEventListener("mouseleave", () => {
        hideOverlay();
        gsap.to(svg, { x: 0, y: 0, duration: 0.4, ease: "power3.out" });
      });

      item.addEventListener("mousemove", (e) => {
        const rect = item.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const offsetX = (x - rect.width / 2) / 6;
        const offsetY = (y - rect.height / 2) / 6;

        gsap.to(svg, {
          x: offsetX,
          y: offsetY,
          duration: 0.3,
          ease: "power2.out"
        });
      });
    });

    window.addEventListener("resize", () => {
      if (currentIndex !== -1) {
        moveOverlayTo(items[currentIndex], currentIndex);
      }
    });