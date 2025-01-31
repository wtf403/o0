import Matter from "https://cdn.skypack.dev/matter-js";

const Engine = Matter.Engine,
  Render = Matter.Render,
  Runner = Matter.Runner,
  Bodies = Matter.Bodies,
  Body = Matter.Body,
  Composite = Matter.Composite,
  Events = Matter.Events,
  Vector = Matter.Vector;

document.addEventListener("DOMContentLoaded", () => {
  const engine = Engine.create({ enableSleeping: false });
  engine.world.gravity.y = 0;
  const bg = document.querySelector(".preview-bg");
  if (!bg) return;

  let images = [];
  let isDragging = false;
  let currentBody = null;
  let dragOffset = { x: 0, y: 0 };
  let clickStartTime = 0;
  let imageSize = 0;

  const render = Render.create({
    element: bg,
    engine: engine,
    options: {
      width: bg.getBoundingClientRect().width,
      height: bg.getBoundingClientRect().height,
      wireframes: false,
      background: "transparent",
      pixelRatio: window.devicePixelRatio,
    },
  });

  setupWalls(bg, engine.world);
  setupImages(bg, engine.world, render);
  setupDragHandling();
  setupEngineEvents(engine, render);

  window.addEventListener("resize", debounce(handleResize, 100));

  const runner = Runner.create();
  Runner.run(runner, engine);
  Render.run(render);

  function setupWalls(bg, world) {
    const rect = bg.getBoundingClientRect();
    const wallThickness = 60;
    const walls = [
      Bodies.rectangle(rect.width / 2, 0, rect.width, wallThickness, {
        isStatic: true,
        restitution: 1,
        friction: 0,
        render: { visible: false },
      }),
      Bodies.rectangle(rect.width / 2, rect.height, rect.width, wallThickness, {
        isStatic: true,
        restitution: 1,
        friction: 0,
        render: { visible: false },
      }),
      Bodies.rectangle(0, rect.height / 2, wallThickness, rect.height, {
        isStatic: true,
        restitution: 1,
        friction: 0,
        render: { visible: false },
      }),
      Bodies.rectangle(
        rect.width,
        rect.height / 2,
        wallThickness,
        rect.height,
        {
          isStatic: true,
          restitution: 1,
          friction: 0,
          render: { visible: false },
        }
      ),
    ];
    Composite.add(world, walls);
  }

  function setupImages(bg, world, render) {
    const rect = bg.getBoundingClientRect();
    imageSize = window.innerWidth * 0.2;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    Array.from({ length: 9 }).forEach((_, i) => {
      const body = createPhysicsBody(rect, centerX, centerY);
      const wrapper = createImageElement(i + 1, body.id);
      wrapper.style.transform = `translate3d(${centerX - imageSize / 2}px, ${
        centerY - imageSize / 2
      }px, 0)`;
      images.push({ body, element: wrapper });
      Composite.add(world, body);
      bg.appendChild(wrapper);
    });

    function createPhysicsBody(rect, centerX, centerY) {
      const x = centerX;
      const y = centerY;
      const angle = Math.random() * Math.PI * 2;
      const vx = Math.cos(angle) * 0.012;
      const vy = Math.sin(angle) * 0.015;
      const body = Bodies.rectangle(x, y, imageSize, imageSize, {
        restitution: 1,
        friction: 0,
        frictionAir: 0,
        density: 0.5,
        inertia: Infinity,
        render: { visible: false },
      });
      Body.setVelocity(body, { x: vx, y: vy });
      return body;
    }

    function createImageElement(i, id) {
      const wrapper = document.createElement("div");
      wrapper.className = "floating-image physics-image";
      wrapper.style.width = `${imageSize}px`;
      wrapper.style.height = `${imageSize}px`;
      wrapper.dataset.bodyId = id;
      wrapper.innerHTML = `
            <img src="assets/screenshots/${i}.png"
                 alt="Screenshot ${i}"
                 draggable="false" />
          `;
      return wrapper;
    }
  }

  function setupDragHandling() {
    document.addEventListener("mousedown", startDrag);
    document.addEventListener("mousemove", handleDrag);
    document.addEventListener("mouseup", endDrag);
    document.addEventListener("touchstart", startDrag, { passive: false });
    document.addEventListener("touchmove", handleDrag, { passive: false });
    document.addEventListener("touchend", endDrag, { passive: false });
  }

  function startDrag(e) {
    const evt = e.touches?.[0] || e;
    const target = evt.target.closest(".floating-image");
    if (!target) return;
    clickStartTime = Date.now();
    isDragging = true;
    currentBody = images.find(
      (img) => img.body.id === parseInt(target.dataset.bodyId)
    )?.body;
    if (currentBody) {
      target.classList.add("dragging");
      Body.setVelocity(currentBody, { x: 0, y: 0 });
      const rect = render.canvas.getBoundingClientRect();
      const scale = render.options.pixelRatio;
      const mouseX = (evt.clientX - rect.left) * scale;
      const mouseY = (evt.clientY - rect.top) * scale;
      dragOffset.x = mouseX - currentBody.position.x;
      dragOffset.y = mouseY - currentBody.position.y;
    }
  }

  function handleDrag(e) {
    if (!isDragging || !currentBody) return;
    e.preventDefault();
    const evt = e.touches?.[0] || e;
    const rect = render.canvas.getBoundingClientRect();
    const scale = render.options.pixelRatio;
    const mouseX = (evt.clientX - rect.left) * scale;
    const mouseY = (evt.clientY - rect.top) * scale;

    // Get current position
    const currentX = currentBody.position.x;
    const currentY = currentBody.position.y;

    // Calculate target position
    const targetX = Math.max(
      imageSize / 2,
      Math.min(rect.width - imageSize / 2, mouseX - dragOffset.x)
    );
    const targetY = Math.max(
      imageSize / 2,
      Math.min(rect.height - imageSize / 2, mouseY - dragOffset.y)
    );

    // Interpolate position for smooth movement (0.1 = 10% movement per frame)
    const newX = currentX + (targetX - currentX) * 0.05;
    const newY = currentY + (targetY - currentY) * 0.05;

    Body.setPosition(currentBody, { x: newX, y: newY });
  }

  function endDrag(e) {
    if (!currentBody) return;
    isDragging = false;
    document.querySelector(".dragging")?.classList.remove("dragging");
    const isClick = Date.now() - clickStartTime < 200;
    const target = e.target.closest(".floating-image");
    if (isClick && target) {
      window.location.hash = target
        .querySelector("img")
        .src.split("/")
        .pop()
        .split(".")[0];
    }
    const angle = Math.random() * Math.PI * 2;
    const CONSTANT_SPEED = 0.5;
    Body.setVelocity(currentBody, {
      x: Math.cos(angle) * CONSTANT_SPEED,
      y: Math.sin(angle) * CONSTANT_SPEED,
    });
    currentBody = null;
  }

  function setupEngineEvents(engine, render) {
    const BASE_SPEED = 0.3; // Base speed for movement
    const SPEED_VARIATION = 0.2; // Amount of random speed variation
    const DIRECTION_CHANGE_PROB = 0.02; // Probability of changing direction each frame
    const REPULSION_STRENGTH = 0.015; // Reduced from 0.02
    const REPULSION_DISTANCE = 250;

    Events.on(engine, "afterUpdate", () => {
      const rect = render.canvas.getBoundingClientRect();
      images.forEach(({ body, element }) => {
        Body.setAngle(body, 0);

        if (!isDragging || body !== currentBody) {
          // Add random variations to velocity
          if (Math.random() < DIRECTION_CHANGE_PROB) {
            const angle = Math.random() * Math.PI * 2;
            const speed = BASE_SPEED + (Math.random() - 0.5) * SPEED_VARIATION;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            Body.setVelocity(body, { x: vx, y: vy });
          }

          // Ensure minimum speed
          const velocity = body.velocity;
          const speed = Vector.magnitude(velocity);
          if (speed < BASE_SPEED * 0.8) {
            const angle = Math.atan2(velocity.y, velocity.x);
            Body.setVelocity(body, {
              x: Math.cos(angle) * BASE_SPEED,
              y: Math.sin(angle) * BASE_SPEED,
            });
          }
        }

        element.style.transform = `translate3d(${
          body.position.x - imageSize / 2
        }px, ${body.position.y - imageSize / 2}px, 0)`;
      });

      // Apply repulsion forces
      for (let i = 0; i < images.length; i++) {
        for (let j = i + 1; j < images.length; j++) {
          const bodyA = images[i].body;
          const bodyB = images[j].body;
          if ((bodyA === currentBody || bodyB === currentBody) && isDragging)
            continue;
          const vec = Vector.sub(bodyB.position, bodyA.position);
          const distance = Vector.magnitude(vec);
          if (distance < REPULSION_DISTANCE && distance > 0) {
            const force = Vector.mult(
              Vector.normalise(vec),
              REPULSION_STRENGTH / (distance * distance)
            );
            Body.applyForce(bodyA, bodyA.position, Vector.neg(force));
            Body.applyForce(bodyB, bodyB.position, force);
          }
        }
      }
    });
  }

  function handleResize() {
    const rect = bg.getBoundingClientRect();
    render.canvas.width = rect.width;
    render.canvas.height = rect.height;
    imageSize = window.innerWidth * 0.18;
    const bodies = Composite.allBodies(engine.world);
    bodies.forEach((body) => {
      if (body.isStatic) {
        Composite.remove(engine.world, body);
      }
    });
    setupWalls(bg, engine.world);
    images.forEach(({ body, element }) => {
      const x = Math.max(
        imageSize / 2,
        Math.min(rect.width - imageSize / 2, body.position.x)
      );
      const y = Math.max(
        imageSize / 2,
        Math.min(rect.height - imageSize / 2, body.position.y)
      );
      Body.setPosition(body, { x, y });
      element.style.width = `${imageSize}px`;
      element.style.height = `${imageSize}px`;
    });
  }

  function debounce(func, wait) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }
});
