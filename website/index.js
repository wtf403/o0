import JSConfetti from "https://cdn.skypack.dev/js-confetti";
import Matter from "https://cdn.skypack.dev/matter-js";

// Initialize confetti
const jsConfetti = new JSConfetti();

// Audio setup
const oouSound = document.getElementById("oouSound");
const saveSound = document.getElementById("saveSound");
let hasClickedLogo = false;

// Tabs functionality
const tabsContainer = document.querySelector(".tabs-bg");

const tabTemplate = (website) => `
  <div class="tab">
    <div class="tab-content">
      <img class="tab-favicon" src="${website.favicon}" alt="${website.title}" width="16" height="16" />
      <span class="tab-title">${website.title}</span>
    </div>
    <span class="close" title="Close Tab">⨯</span>
  </div>
`;

// Function to create a marquee element
const createMarquee = () => {
  const marquee = document.createElement("marquee");
  marquee.className = "marquee";
  marquee.behavior = "alternate";

  // Randomly choose direction
  marquee.direction = Math.random() < 0.5 ? "left" : "right";

  const speed = Math.floor(1 + Math.random() * 2);
  marquee.setAttribute("scrollamount", speed);

  const tabs = document.createElement("div");
  tabs.className = "tabs";
  marquee.appendChild(tabs);

  return marquee;
};

// Function to calculate number of marquees needed
const calculateMarquees = () => {
  const containerHeight = window.innerHeight;
  const marqueeHeight = 32; // Reduced height since we removed padding
  return Math.floor(containerHeight / marqueeHeight);
};

// Function to initialize marquees
const initializeMarquees = async () => {
  // Fetch tabs data
  const response = await fetch("assets/tabs.json");
  const data = await response.json();
  const { websites } = data;

  const numMarquees = calculateMarquees();

  // Clear existing content
  tabsContainer.innerHTML = "";

  // Create marquees
  for (let i = 0; i < numMarquees; i++) {
    const marquee = createMarquee();

    // Add tabs to marquee
    const tabsDiv = marquee.querySelector(".tabs");
    const shuffledWebsites = [...websites].sort(() => Math.random() - 0.5);
    tabsDiv.innerHTML = shuffledWebsites.map(tabTemplate).join("");

    tabsContainer.appendChild(marquee);
  }

  // Add close button functionality
  document.querySelectorAll(".close").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const tab = e.target.closest(".tab");
      if (tab) {
        tab.style.opacity = "0";
        setTimeout(() => tab.remove(), 200);
      }
    });
  });
};

// Initialize marquees on load and resize
window.addEventListener("load", initializeMarquees);
window.addEventListener("resize", initializeMarquees);

// Logo click handler
document.querySelector(".logo").addEventListener("click", () => {
  oouSound.currentTime = 0;
  oouSound.play();
  document.querySelector(".logo").classList.add("clicked");
  hasClickedLogo = true;
});

// Add confetti and sound to download button
document.querySelector(".download").addEventListener("click", () => {
  jsConfetti.addConfetti({
    emojis: ["🎉", "✨", "⭐️", "🌟", "💫"],
    emojiSize: 100,
    confettiNumber: 50,
  });

  if (hasClickedLogo) {
    saveSound.currentTime = 0;

    setTimeout(() => {
      saveSound.play();
    }, 1000);
  }
});

// Generate lightboxes
const lightboxesContainer = document.getElementById("lightboxes");
const totalImages = 9;

for (let i = 1; i <= totalImages; i++) {
  const prev = i === 1 ? totalImages : i - 1;
  const next = i === totalImages ? 1 : i + 1;

  const lightbox = document.createElement("div");
  lightbox.className = "lightbox-container";
  lightbox.innerHTML = `
    <a href="#" class="lightbox" id="${i}">
      <section class="carousel">
        <ol class="viewport">
          <li tabindex="0" class="slide">
            <div class="snapper">
              <img 
                src="assets/screenshots/${i}.png" 
                alt="Screenshot ${i}" 
              />
            </div>
          </li>
        </ol>
      </section>
    </a>
    <a href="#${prev}" class="prev" aria-label="Previous slide">&#10094;</a>
    <a href="#${next}" class="next" aria-label="Next slide">&#10095;</a>
  `;

  lightboxesContainer.appendChild(lightbox);
}

// Initialize physics
const Engine = Matter.Engine,
  Render = Matter.Render,
  Runner = Matter.Runner,
  Bodies = Matter.Bodies,
  Composite = Matter.Composite,
  Body = Matter.Body,
  Mouse = Matter.Mouse,
  MouseConstraint = Matter.MouseConstraint;

const engine = Engine.create();
const world = engine.world;

// Disable gravity
engine.world.gravity.y = 0;

const bg = document.querySelector(".bg");
const rect = bg.getBoundingClientRect();

// Create renderer
const render = Render.create({
  element: bg,
  engine: engine,
  options: {
    width: rect.width,
    height: rect.height,
    wireframes: false,
    background: "transparent",
    pixelRatio: window.devicePixelRatio, // Add this for better rendering
  },
});

// Create walls with higher restitution
const wallThickness = 60;
const walls = [
  Bodies.rectangle(
    rect.width / 2,
    -wallThickness / 2,
    rect.width,
    wallThickness,
    {
      isStatic: true,
      restitution: 0.9,
    }
  ),
  Bodies.rectangle(
    rect.width / 2,
    rect.height + wallThickness / 2,
    rect.width,
    wallThickness,
    {
      isStatic: true,
      restitution: 0.9,
    }
  ),
  Bodies.rectangle(
    -wallThickness / 2,
    rect.height / 2,
    wallThickness,
    rect.height,
    {
      isStatic: true,
      restitution: 0.9,
    }
  ),
  Bodies.rectangle(
    rect.width + wallThickness / 2,
    rect.height / 2,
    wallThickness,
    rect.height,
    {
      isStatic: true,
      restitution: 0.9,
    }
  ),
];

Composite.add(world, walls);

// Create images with improved physics properties
const imageSize = 256;
const images = [];

function createImage(i) {
  // Create physics body with improved properties
  const x = rect.width / 2 + (Math.random() - 0.5) * rect.width * 2;
  const y = rect.height / 2 + (Math.random() - 0.5) * rect.height * 2;

  const body = Bodies.rectangle(x, y, imageSize, imageSize, {
    restitution: 0.9, // Increased bounciness
    friction: 0.001, // Reduced friction
    frictionAir: 0.0001, // Reduced air friction
    density: 0.001, // Reduced density for lighter objects
    render: {
      visible: false,
    },
  });

  // Stronger initial velocity
  const angle = Math.atan2(rect.height / 2 - y, rect.width / 2 - x);
  Body.setVelocity(body, {
    x: Math.cos(angle) * 20,
    y: Math.sin(angle) * 20,
  });

  const wrapper = document.createElement("div");
  wrapper.className = "floating-image";
  wrapper.innerHTML = `
    <a href="#${i}" class="image-link">
      <img
        class="zoom-in"
        width="${imageSize}px"
        height="${imageSize}px"
        src="assets/screenshots/${i}.png"
        alt="Screenshot ${i}"
      />
    </a>
  `;
  bg.appendChild(wrapper);

  images.push({ body, element: wrapper });
  Composite.add(world, body);
}

// Create mouse constraint with improved settings
const mouse = Mouse.create(render.canvas);
const mouseConstraint = MouseConstraint.create(engine, {
  mouse: mouse,
  constraint: {
    stiffness: 0.2,
    render: {
      visible: false,
    },
  },
  collisionFilter: {
    mask: 0xffffff, // Allow interaction with all bodies
  },
});

Composite.add(world, mouseConstraint);
render.mouse = mouse;

// Ensure render.canvas is above other elements
render.canvas.style.zIndex = 1;

// Update DOM elements with smoother animation
function updateElements() {
  images.forEach(({ body, element }) => {
    const { x, y } = body.position;
    const angle = body.angle;
    element.style.transform = `translate3d(${x - imageSize / 2}px, ${
      y - imageSize / 2
    }px, 0) rotate(${angle}rad)`;
  });
  requestAnimationFrame(updateElements);
}

// Initialize
for (let i = 1; i <= totalImages; i++) {
  createImage(i);
}

// Start the engine and animation
Runner.run(engine);
Render.run(render);
updateElements();

// Handle window resize
window.addEventListener("resize", () => {
  const rect = bg.getBoundingClientRect();
  render.canvas.width = rect.width;
  render.canvas.height = rect.height;

  // Update wall positions
  walls[0].position.x = rect.width / 2;
  walls[1].position.x = rect.width / 2;
  walls[2].position.y = rect.height / 2;
  walls[3].position.x = rect.width + wallThickness / 2;
  walls[3].position.y = rect.height / 2;
});

// Keyboard navigation
document.addEventListener("keydown", (e) => {
  const currentHash = window.location.hash || "#1";
  const currentNum = parseInt(currentHash.slice(1));

  let nextNum;
  if (e.key === "ArrowRight" || e.key === "l") {
    nextNum = currentNum === totalImages ? 1 : currentNum + 1;
  } else if (e.key === "ArrowLeft" || e.key === "h") {
    nextNum = currentNum === 1 ? totalImages : currentNum - 1;
  } else if (e.key === "Escape") {
    window.location.hash = "";
    return;
  } else {
    return;
  }

  window.location.hash = nextNum;
});
