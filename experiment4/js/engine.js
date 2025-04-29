"use strict";

/* global p5 */
/* exported preload, setup, draw, mouseClicked */

// Project base code provided by {amsmith,ikarth}@ucsc.edu

let tile_width_step_main; // A width step is half a tile's width
let tile_height_step_main; // A height step is half a tile's height

// Global variables. These will mostly be overwritten in setup().
let tile_rows, tile_columns;
let camera_offset;
let camera_velocity;

/////////////////////////////
// Transforms between coordinate systems
// Modified for horizontal tiles
/////////////////////////////
function worldToScreen([world_x, world_y], [camera_x, camera_y]) {
  let i = world_x * (tile_width_step_main * 2);
  let j = world_y * (tile_width_step_main * 2); // Using width for both dimensions to ensure square
  return [i + camera_x, j + camera_y];
}

function worldToCamera([world_x, world_y], [camera_x, camera_y]) {
  let i = world_x * (tile_width_step_main * 2);
  let j = world_y * (tile_width_step_main * 2); // Using width for both dimensions to ensure square
  return [i, j];
}

function tileRenderingOrder(offset) {
  return [offset[0], offset[1]]; // Simple ordering for horizontal grid
}

function screenToWorld([screen_x, screen_y], [camera_x, camera_y]) {
  screen_x -= camera_x;
  screen_y -= camera_y;
  let tileSize = tile_width_step_main * 2; // Using width for both dimensions
  return [Math.floor(screen_x / tileSize), Math.floor(screen_y / tileSize)];
}

function cameraToWorldOffset([camera_x, camera_y]) {
  let tileSize = tile_width_step_main * 2;
  return { x: Math.floor(camera_x / tileSize), y: Math.floor(camera_y / tileSize) };
}

function worldOffsetToCamera([world_x, world_y]) {
  let tileSize = tile_width_step_main * 2;
  return new p5.Vector(world_x * tileSize, world_y * tileSize);
}

function preload() {
  if (window.p3_preload) {
    window.p3_preload();
  }
}
function setup() {
  let canvas = createCanvas(800, 400);
  canvas.parent("canvas-container");


  camera_offset = new p5.Vector(-width / 2, height / 2);
  camera_velocity = new p5.Vector(0, 0);

  if (window.p3_setup) {
    window.p3_setup();
  }

  let label = createP();
  label.html("World key: ");
  label.parent("canvas-container");

  let input = createInput("beach sunset");
  input.parent(label);
  input.input(() => {
    rebuildWorld(input.value());
  });

  createP("Arrow keys to scroll left and right. Clicking on the water and sand changes the tiles.").parent("canvas-container");

  rebuildWorld(input.value());
}

function rebuildWorld(key) {
  if (window.p3_worldKeyChanged) {
    window.p3_worldKeyChanged(key);
  }
  tile_width_step_main = window.p3_tileWidth ? window.p3_tileWidth() : 32;
  tile_height_step_main = window.p3_tileHeight ? window.p3_tileHeight() : 14.5;
  tile_columns = Math.ceil(width / (tile_width_step_main * 2)) + 2; // +2 for better coverage
  tile_rows = Math.ceil(height / (tile_width_step_main * 2)) + 2; // Using width for height too
}

function mouseClicked() {
  let world_pos = screenToWorld(
    [mouseX, mouseY],
    [camera_offset.x, camera_offset.y]
  );

  if (window.p3_tileClicked) {
    window.p3_tileClicked(world_pos[0], world_pos[1]);
  }
  return false;
}

function draw() {
  // Keyboard controls!
  if (keyIsDown(LEFT_ARROW)) {
    camera_velocity.x += 1;
  }
  if (keyIsDown(RIGHT_ARROW)) {
    camera_velocity.x -= 1;
  }
  //if (keyIsDown(DOWN_ARROW)) {
    //camera_velocity.y -= 1;
  //}
  //if (keyIsDown(UP_ARROW)) {
    //camera_velocity.y += 1;
  //}

  let camera_delta = new p5.Vector(0, 0);
  camera_velocity.add(camera_delta);
  camera_offset.add(camera_velocity);
  camera_velocity.mult(0.95); // cheap easing
  if (camera_velocity.mag() < 0.01) {
    camera_velocity.setMag(0);
  }

  let world_pos = screenToWorld(
    [mouseX, mouseY],
    [camera_offset.x, camera_offset.y]
  );
  
  background(100);

  if (window.p3_drawBefore) {
    window.p3_drawBefore();
  }

  // Calculate the visible range in world coordinates
  let topLeftWorld = screenToWorld(
    [0, 0],
    [camera_offset.x, camera_offset.y]
  );
  
  let bottomRightWorld = screenToWorld(
    [width, height],
    [camera_offset.x, camera_offset.y]
  );
  
  // Add a buffer to ensure we draw tiles beyond the visible area
  const buffer = 5;
  let minX = topLeftWorld[0] - buffer;
  let minY = topLeftWorld[1] - buffer;
  let maxX = bottomRightWorld[0] + buffer;
  let maxY = bottomRightWorld[1] + buffer;
  
  // Make these values available to p3_drawTile
  if (window.p3_worldInfo) {
    window.p3_worldInfo({
      minVisibleX: topLeftWorld[0],
      minVisibleY: topLeftWorld[1],
      maxVisibleX: bottomRightWorld[0],
      maxVisibleY: bottomRightWorld[1],
      worldPosX: world_pos[0],
      worldPosY: world_pos[1]
    });
  }
  
  // Draw all tiles in row-column order
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      drawTile([x, y], [camera_offset.x, camera_offset.y]);
    }
  }

  describeMouseTile(world_pos, [camera_offset.x, camera_offset.y]);

  if (window.p3_drawAfter) {
    window.p3_drawAfter();
  }
}

// Display a description of the tile at world_x, world_y.
function describeMouseTile([world_x, world_y], [camera_x, camera_y]) {
  let [screen_x, screen_y] = worldToScreen(
    [world_x, world_y],
    [camera_x, camera_y]
  );
  drawTileDescription([world_x, world_y], [screen_x, screen_y]);
}

function drawTileDescription([world_x, world_y], [screen_x, screen_y]) {
  push();
  translate(screen_x, screen_y);
  if (window.p3_drawSelectedTile) {
    window.p3_drawSelectedTile(world_x, world_y, screen_x, screen_y);
  }
  pop();
}

// Draw a tile, mostly by calling the user's drawing code.
function drawTile([world_x, world_y], [camera_x, camera_y]) {
  let [screen_x, screen_y] = worldToScreen(
    [world_x, world_y],
    [camera_x, camera_y]
  );
  push();
  translate(screen_x, screen_y);
  if (window.p3_drawTile) {
    window.p3_drawTile(world_x, world_y, screen_x, screen_y);
  }
  pop();
}

window.addEventListener("DOMContentLoaded", () => {
  const fullscreenBtn = document.getElementById("fullscreen");
  if (fullscreenBtn) {
    fullscreenBtn.addEventListener("click", () => {
      let fs = fullscreen();
      fullscreen(!fs);
      setTimeout(() => resizeCanvas(windowWidth, windowHeight), 100);
    });
  }
});
