"use strict";
/* global XXH */
/* exported --
    p3_preload
    p3_setup
    p3_worldKeyChanged
    p3_tileWidth
    p3_tileHeight
    p3_tileClicked
    p3_drawBefore
    p3_drawTile
    p3_drawSelectedTile
    p3_drawAfter
*/

let time = 0;
let waterColors = [];
let skyColors = [];
const waterThreshold = 3;
let beachObjects = [];
let objectTypes = ["seashell", "starfish", "rock"];

function p3_preload() {
  
}

function p3_setup() {
  createColorPalettes();
  
  time = 0;
  
  frameRate(30);
}

let worldSeed;
function p3_worldKeyChanged(key) {
  worldSeed = XXH.h32(key, 0);
  noiseSeed(worldSeed);
  randomSeed(worldSeed);
  
  createColorPalettes();
  generateBeachObjects();

}

function createColorPalettes() {
  waterColors = [
    color(10 + (worldSeed % 10), 20 + (worldSeed % 20), 60 + (worldSeed % 30)),  // dark deep water
    color(20 + (worldSeed % 10), 30 + (worldSeed % 20), 80 + (worldSeed % 30)),  // mid water
    color(30 + (worldSeed % 10), 50 + (worldSeed % 20), 100 + (worldSeed % 20))  // light night water
  ];

  skyColors = [
    color(5 + (worldSeed % 5), 5 + (worldSeed % 10), 20 + (worldSeed % 10)),    // near black top sky
    color(10 + (worldSeed % 10), 10 + (worldSeed % 10), 30 + (worldSeed % 20)), // dark navy middle sky
    color(15 + (worldSeed % 10), 15 + (worldSeed % 10), 50 + (worldSeed % 20))  // softer dark blue bottom sky
  ];
}



function generateBeachObjects() {
  beachObjects = [];
  
  // Define beach boundaries (use same values from terrain code)
  const beachWidth = 30 + (worldSeed % 20);
  
  // Generate random objects based on world seed
  let objectCount = 20 + (worldSeed % 30);
  for (let i = 0; i < objectCount; i++) {
    let objectSeed = XXH.h32(`object:${i}`, worldSeed);
    
    // Random position within beach area
    let x = (objectSeed % (beachWidth * 2)) - beachWidth;
    let y = waterThreshold + 1 + (objectSeed % 2);
    
    // Random object type
    let typeIndex = objectSeed % objectTypes.length;
    let type = objectTypes[typeIndex];
    
    // Random rotation and scale
    let rotation = (objectSeed % 360) / 57.3; // convert to radians
    let scale = 0.8 + (objectSeed % 5) / 10;
    
    beachObjects.push({
      x: x,
      y: y,
      type: type,
      rotation: rotation,
      scale: scale,
      placed: false // flag for user-placed vs. generated
    });
  }
}

// Using the same value for width and height to ensure square tiles
function p3_tileWidth() {
  return 16;
}

function p3_tileHeight() {
  return 16; // Set to same as width for square tiles
}

let tileSize = p3_tileWidth(); // Using a single value for tile size
let clicks = {};
let splashes = [];

function p3_tileClicked(i, j) {
  let key = [i, j];
  //let key = `${i},${j}`;
  clicks[key] = 1 + (clicks[key] | 0);
  
  if (j >= 1 && j <= 3) {
    createSplash(i, j);
  }
  else if (j > waterThreshold) {
    const beachWidth = 30 + (worldSeed % 20);
    // Only allow placing objects on the beach
    if (abs(i) < beachWidth) {
      // Create a new beach object where clicked
      let clickSeed = XXH.h32(`click:${Date.now()}`, worldSeed);
      let typeIndex = clickSeed % objectTypes.length;
      let type = objectTypes[typeIndex];
      let rotation = (clickSeed % 360) / 57.3;
      let scale = 0.8 + (clickSeed % 5) / 10;
      
      beachObjects.push({
        x: i,
        y: j,
        type: type,
        rotation: rotation,
        scale: scale,
        placed: true // flag as user-placed
      });
    }
  }
}

function createSplash(i,j) {
  splashes.push({
    x:i,
    y:j,
    age: 0,
    maxAge: 30 + Math.floor(random(20))
  });
}

function p3_drawBefore() {
  // Increment time for animations
  time += 0.05
  
  // Update
  for (let i = splashes.length - 1; i >= 0; i--) {
    splashes[i].age++;
    if (splashes[i].age > splashes[i].maxAge) {
      splashes.splice(i,1);
    } 
  }
}

// World info from engine.js
let worldInfo = {
  minVisibleY: 0,
  maxVisibleY: 0,
  worldPosY: 0,
  minVisibleX: 0,
  minVisibleY: 0,
  worldPosX: 0
};

// Function to receive world info from engine.js
function p3_worldInfo(info) {
  worldInfo = info;
}

function p3_drawTile(i, j) {
  noStroke();
  
  // Determine terrain type based on position
  const skyTopThreshold = -6;
  const skyMiddleThreshold = -4;
  const skyBottomThreshold = 0;
  const waterThreshold = 3;
  const sandThreshold = 3;//unused for now
  
  // Draw sky layers with sunset gradient
  if (j <= skyTopThreshold) {
    // Top sky - dark purple
    // Get base color
    let skyColor = skyColors[0];
  
    // Add sun influence even at the top of the sky
    let sunX = sin(worldSeed * 0.01) * 20;
    let sunY = skyBottomThreshold;
    let distanceToSun = dist(i, skyBottomThreshold, sunX, sunY);
    let sunInfluence = map(distanceToSun, 0, 30, 0.3, 0);
    sunInfluence = constrain(sunInfluence, 0, 0.3);
  
    // Blend with moon color when in range
    if (distanceToSun < 30) {
      let sunColor = color(230, 230 + (worldSeed % 50), 255, 200); // Moon color (pale blue-white)
      skyColor = lerpColor(skyColor, sunColor, sunInfluence);
    }
  
    fill(skyColor);
  }
  
  else if (j <= skyMiddleThreshold) {
    // Middle sky - blend between dark purple and dark blue
    let skyProgress = map(j, skyTopThreshold, skyMiddleThreshold, 0, 1);
    skyProgress = constrain(skyProgress, 0, 1);
  
    let skyColor = lerpColor(skyColors[0], skyColors[1], skyProgress);
  
    // Add sun influence in the middle sky
    let sunX = sin(worldSeed * 0.01) * 20;
    let sunY = skyBottomThreshold;
    let distanceToSun = dist(i, skyBottomThreshold, sunX, sunY);
    let sunInfluence = map(distanceToSun, 0, 25, 0.5, 0);
    sunInfluence = constrain(sunInfluence, 0, 0.5);
  
    // Blend with moon color when in range
    if (distanceToSun < 25) {
      let sunColor = color(230, 230 + (worldSeed % 50), 255, 200); // Moon color (pale blue-white)
      skyColor = lerpColor(skyColor, sunColor, sunInfluence);
    }
  
    fill(skyColor);
  }
  
  else if (j <= skyBottomThreshold) {
    // Bottom sky - blend between dark blue and dark orange
    let skyProgress = map(j, skyMiddleThreshold, skyBottomThreshold, 0, 1);
    skyProgress = constrain(skyProgress, 0, 1);
  
    let skyColor = lerpColor(skyColors[1], skyColors[2], skyProgress);
  
    // Make sky brighter near the sun
    let sunX = sin(worldSeed * 0.01) * 20;
    let sunY = skyBottomThreshold;
    let distanceToSun = dist(i, j, sunX, sunY);
  
    if (distanceToSun < 8) {
      // Draw sun glow
      let sunBrightness = map(distanceToSun, 0, 8, 1, 0);
      sunBrightness = constrain(sunBrightness, 0, 1);
    
      // Blend with bright moon color
      let sunColor = color(230, 230 + (worldSeed % 50), 255, 200); // soft, pale moon color
      skyColor = lerpColor(skyColor, sunColor, sunBrightness * 0.9);
    }
  
    fill(skyColor);
  }
  
  // Draw water tiles (between skyBottomThreshold and waterThreshold)
  else if (j > skyBottomThreshold && j <= waterThreshold) {
    // Calculate water depth - deeper water is darker
    let waterDepth = map(j, skyBottomThreshold, waterThreshold, 0, 1);
    waterDepth = constrain(waterDepth, 0, 1);
    
    // Choose between deep and shallow water color based on depth
    let waterBaseColor;
    if (waterDepth < 0.33) {
      waterBaseColor = lerpColor(waterColors[0], waterColors[1], waterDepth * 3);
    } else if (waterDepth < 0.66) {
      waterBaseColor = lerpColor(waterColors[1], waterColors[2], (waterDepth - 0.33) * 3);
    } else {
      waterBaseColor = waterColors[2];
    }
    
    // Add wave effect based on position and time using sin waves
    let waveOffset = sin(i * 0.2 + time + worldSeed * 0.01) * 0.2;
    let waveOffset2 = cos(i * 0.3 + time * 0.7 + worldSeed * 0.02) * 0.15;
    let combinedWave = waveOffset + waveOffset2;
    
    // Apply wave effect to color
    let waveIntensity = map(abs(combinedWave), 0, 0.35, 0, 1);
    let adjustedColor = color(
      waterBaseColor.levels[0] + waveIntensity * 30,
      waterBaseColor.levels[1] + waveIntensity * 30,
      waterBaseColor.levels[2] + waveIntensity * 20,
      230
    );
    
    // Add sun reflection on water
    let sunX = sin(worldSeed * 0.01) * 20;
    let distanceToSun = dist(i, 0, sunX, 0);
    
    // Add stronger reflection directly below sun position
    if (distanceToSun < 15) {
      // Sun reflection on water
      let reflectionStrength = map(distanceToSun, 0, 15, 0.7, 0);
      reflectionStrength = constrain(reflectionStrength, 0, 0.7);
      
      // Adjust reflection based on wave
      reflectionStrength *= 1 - abs(combinedWave);
      
      // Add sunset-colored reflection
      let reflectionColor = color(200 + (worldSeed % 30), 200 + (worldSeed % 30), 255); // soft pale moonlight
      adjustedColor = lerpColor(adjustedColor, reflectionColor, reflectionStrength);
    }
    
    fill(adjustedColor);
    
    // Check for splashes
    for (let splash of splashes) {
      if (splash.x === i && splash.y === j) {
        // Draw splash - blend with water color instead of replacing it
        let splashProgress = splash.age / splash.maxAge;
        if (splashProgress < 0.5) {
          // Create a transparent white for the splash that fades over time
          let splashColor = color(255, 255, 255, 200 * (1 - splashProgress * 2));
          // Blend the splash with the adjusted water color instead of replacing it
          adjustedColor = lerpColor(adjustedColor, splashColor, 0.7);
        }
      }
    }
  } 
  
  // Sand colors
  else if (j > waterThreshold) {
    // Calculate horizontal distance from origin
    let horizontalDistance = abs(i);
  
    // Define terrain zones
    const beachWidth = 30 + (worldSeed % 20); // Width of the beach area
    const stoneWidth = 15 + (worldSeed % 10); // Width of the stone area
  
    // Determine terrain type based on horizontal distance
    if (horizontalDistance < beachWidth) {
      // Beach sand (center area)
      let sandSeed = XXH.h32(`sand:${i},${j}`, worldSeed);
      let r = 120 + (sandSeed % 20); // Muted tan
      let g = 120 + (sandSeed % 20); // Muted tan
      let b = 140 + (sandSeed % 30); // Slightly bluish tint
      fill(r, g, b, 230);
    } 
    else if (horizontalDistance < beachWidth + stoneWidth) {
      // Transition to stone
      let transitionProgress = map(horizontalDistance, beachWidth, beachWidth + stoneWidth, 0, 1);
      transitionProgress = constrain(transitionProgress, 0, 1);
    
      // Start with sand color
      let sandSeed = XXH.h32(`sand:${i},${j}`, worldSeed);
      let sandColor = color(
        230 + (sandSeed % 25),
        190 + (sandSeed % 20),
        140 + (sandSeed % 15),
        230
      );
    
      // Stone color with variation
      let stoneSeed = XXH.h32(`stone:${i},${j}`, worldSeed);
      let stoneColor = color(
        120 + (stoneSeed % 30),
        120 + (stoneSeed % 25),
        120 + (stoneSeed % 20),
        230
      );
    
      // Blend between sand and stone
      let blendedColor = lerpColor(sandColor, stoneColor, transitionProgress);
      fill(blendedColor);
    } 
    else {
      // Transition to grass or pure stone based on position
      let grassTransition = map(horizontalDistance, beachWidth + stoneWidth, beachWidth + stoneWidth + 20, 0, 1);
      grassTransition = constrain(grassTransition, 0, 1);
    
      // Stone color with variation
      let stoneSeed = XXH.h32(`stone:${i},${j}`, worldSeed);
      let stoneColor = color(
        120 + (stoneSeed % 30),
        120 + (stoneSeed % 25),
        120 + (stoneSeed % 20),
        230
      );
    
      // Grass color with variation
      let grassSeed = XXH.h32(`grass:${i},${j}`, worldSeed);
      let grassColor = color(
        30 + (grassSeed % 30),
        100 + (grassSeed % 50),
        30 + (grassSeed % 40),
        230
      );
    
      // Add noise for more natural transition
      let noiseVal = noise(i * 0.1, j * 0.1, worldSeed * 0.01);
      let blendFactor = grassTransition + (noiseVal * 0.3 - 0.15);
      blendFactor = constrain(blendFactor, 0, 1);

      // Blend between stone and grass
      let blendedColor = lerpColor(stoneColor, grassColor, blendFactor);
      fill(blendedColor);

      // Add occasional grass tufts
      if (j === waterThreshold + 1 && grassTransition > 0.5 && (grassSeed % 10 < 3)) {
        // Current tile is grass
        fill(blendedColor);
      }
    }
  }
  
  push();
  rectMode(CENTER);
  rect(0, 0, tileSize * 2, tileSize * 2);
  pop();
}

function p3_drawSelectedTile(i, j) {
  noFill();
  stroke(0, 200, 0, 128);
  strokeWeight(2);
  
  // Draw square outline for selected tile
  rectMode(CENTER);
  rect(0, 0, tileSize * 2, tileSize * 2);
  
  noStroke();
  fill(0);
  textAlign(CENTER, CENTER);
  //text("tile " + [i, j], 0, 0); // Cords for selected tile
}

function p3_drawAfter() {
  // Draw ripple effects for splashes
  push();
  for (let splash of splashes) {
    let [screenX, screenY] = worldToScreen([splash.x, splash.y], [camera_offset.x, camera_offset.y]);
    
    push();
    translate(screenX, screenY);
    
    let splashProgress = splash.age / splash.maxAge;
    let rippleSize = splashProgress * tileSize * 4;
    
    noFill();
    stroke(255, 255, 255, 255 * (1 - splashProgress));
    strokeWeight(2 * (1 - splashProgress));
    ellipse(0, 0, rippleSize, rippleSize * 0.5);
    pop();
  }
  pop();
  
  push();
  for (let obj of beachObjects) {
    // Check if object is visible
    if (obj.x >= worldInfo.minVisibleX - 1 && 
        obj.x <= worldInfo.maxVisibleX + 1 && 
        obj.y >= worldInfo.minVisibleY - 1 && 
        obj.y <= worldInfo.maxVisibleY + 1) {
      
      let [screenX, screenY] = worldToScreen([obj.x, obj.y], [camera_offset.x, camera_offset.y]);
      
      push();
      translate(screenX, screenY);
      rotate(obj.rotation);
      scale(obj.scale);
      
      // Draw different objects based on type
      if (obj.type === "seashell") {
        drawSeashell(obj);
      } 
      else if (obj.type === "starfish") {
        drawStarfish(obj);
      } 
      else if (obj.type === "rock") {
        drawRock(obj);
      }   
      pop();
    }
  }
  pop();
  
  // Draw grass tufts and stones on the non-beach areas
  push();
  let visibleMinX = worldInfo.minVisibleX;
  let visibleMaxX = worldInfo.maxVisibleX;
  let visibleMinY = worldInfo.minVisibleY;
  let visibleMaxY = worldInfo.maxVisibleY;
  
  const beachWidth = 30 + (worldSeed % 20);
  const stoneWidth = 15 + (worldSeed % 10);
  
  // Loop through visible area to add details
  for (let i = visibleMinX; i <= visibleMaxX; i++) {
    for (let j = waterThreshold + 1; j <= waterThreshold + 3; j++) {
      let horizontalDistance = abs(i);
      
      // Skip beach area
      if (horizontalDistance < beachWidth) continue;
      
      // Add details to stone area
      if (horizontalDistance < beachWidth + stoneWidth) {
        let stoneSeed = XXH.h32(`stoneDetail:${i},${j}`, worldSeed);
        if (stoneSeed % 20 < 2) { // 10% chance for stone detail
          let [screenX, screenY] = worldToScreen([i, j], [camera_offset.x, camera_offset.y]);
          
          push();
          translate(screenX, screenY);
          
          // Draw a small rock
          fill(100 + (stoneSeed % 40), 100 + (stoneSeed % 35), 100 + (stoneSeed % 30));
          noStroke();
          ellipse(0, -5, 7 + (stoneSeed % 5), 4 + (stoneSeed % 3));
          
          pop();
        }
      }
      // Add details to grass area
      else if (j === waterThreshold + 1) {
        let grassSeed = XXH.h32(`grassDetail:${i},${j}`, worldSeed);
        if (grassSeed % 10 < 3) { // 30% chance for grass tuft
          let [screenX, screenY] = worldToScreen([i, j], [camera_offset.x, camera_offset.y]);
          
          push();
          translate(screenX, screenY);
          
          // Draw grass tuft
          stroke(20 + (grassSeed % 30), 80 + (grassSeed % 60), 20 + (grassSeed % 30));
          strokeWeight(1);
          let grassHeight = 5 + (grassSeed % 8);
          
          // Blades of grass
          for (let blade = 0; blade < 3 + (grassSeed % 3); blade++) {
            let offset = (blade - 1) * 2;
            let height = grassHeight - abs(offset) * 0.5;
            let sway = sin(time * 0.5 + i * 0.1 + blade) * 1.5;
            
            line(offset, 0, offset + sway, -height);
          }
          
          pop();
        }
      }
    }
  }
  pop();
}

function drawSeashell(obj) {
  // Get seed for consistent coloration
  let seed = XXH.h32(`seashell:${obj.x},${obj.y}`, worldSeed);
  
  // Shell base color - pinkish/white
  fill(240 + (seed % 15), 220 + (seed % 20), 220 + (seed % 35));
  noStroke();
  
  // Draw shell spiral
  beginShape();
  for (let i = 0; i < 360; i += 15) {
    let rad = i / 30;
    let x = sin(radians(i)) * rad;
    let y = cos(radians(i)) * rad;
    vertex(x, y - 5);
  }
  endShape(CLOSE);
  
  // Shell ridges
  stroke(200 + (seed % 55), 180 + (seed % 40), 180 + (seed % 30));
  strokeWeight(0.5);
  noFill();
  for (let i = 0; i < 4; i++) {
    let offset = i * 1.5;
    arc(0, -5, 10 - offset, 8 - offset, PI * 0.8, PI * 2.2);
  }
}

function drawStarfish(obj) {
  // Get seed for consistent coloration
  let seed = XXH.h32(`starfish:${obj.x},${obj.y}`, worldSeed);
  
  // Starfish color - orangeish
  fill(240 + (seed % 15), 140 + (seed % 80), 80 + (seed % 60));
  noStroke();
  
  // Draw star shape
  push();
  let armCount = 5;
  let innerRadius = 3;
  let outerRadius = 8;
  
  beginShape();
  for (let i = 0; i < armCount * 2; i++) {
    let angle = TWO_PI / (armCount * 2) * i;
    let radius = i % 2 === 0 ? outerRadius : innerRadius;
    let x = cos(angle) * radius;
    let y = sin(angle) * radius;
    vertex(x, y - 3);
  }
  endShape(CLOSE);
  
  fill(220 + (seed % 35), 120 + (seed % 70), 60 + (seed % 40));
  ellipse(0, -3, innerRadius * 1.2);
  pop();
}

function drawRock(obj) {
  let seed = XXH.h32(`rock:${obj.x},${obj.y}`, worldSeed);
  
  // Rock color
  fill(120 + (seed % 60), 120 + (seed % 55), 110 + (seed % 50));
  noStroke();
  
  // Rock shape
  beginShape();
  let pointCount = 6 + (seed % 4);
  for (let i = 0; i < pointCount; i++) {
    let angle = TWO_PI / pointCount * i;
    let radius = 5 + (noise(seed * 0.01, i * 0.5) * 3);
    let x = cos(angle) * radius;
    let y = sin(angle) * radius;
    vertex(x, y - 2);
  }
  endShape(CLOSE);
}