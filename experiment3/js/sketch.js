// sketch.js - purpose and description here
// Author: Anthony Nguyen
// Date: 19434

// Here is how you might set up an OOP p5.js project
// Note that p5.js looks for a file called sketch.js

// Constants - User-servicable parts
// In a longer project I like to put these in a separate file
const VALUE1 = 1;
const VALUE2 = 2;

/* exported preload, setup, draw, placeTile */

/* global generateGrid drawGrid */

let seed = 0;
let tilesetImage;
let currentGrid = [];
let numRows, numCols;

let cloudChunks = [
  [[10, 14], [10, 14]],         // horizontal 2-tile cloud
  [[10, 14], [10, 14]],         // vertical 2-tile cloud
];
let clouds = [];
let numClouds = 6;

function preload() {
  tilesetImage = loadImage(
    "https://cdn.glitch.com/25101045-29e2-407a-894c-e0243cd8c7c6%2FtilesetP8.png?v=1611654020438"
  );
}

function setup() {
  numCols = select("#asciiBox")?.attribute("rows") | 40;
  numRows = select("#asciiBox")?.attribute("cols") | 30;

  let canvas = createCanvas(16 * numCols, 16 * numRows);
  canvas.parent("canvas-container");
  select("canvas").elt.getContext("2d").imageSmoothingEnabled = false;

  if (select("#reseedButton")) {
    select("#reseedButton").mousePressed(reseed);
  }
  if (select("#asciiBox")) {
    select("#asciiBox").input(reparseGrid);
  }

  // Fullscreen button
  select("#fullscreen").mousePressed(() => {
    let fs = fullscreen();
    fullscreen(!fs);
    // Give the browser a moment to update layout
    setTimeout(() => {
      resizeCanvas(windowWidth, windowHeight);
    }, 100);
  });
  

  reseed();
}

function windowResized() {
  if (fullscreen()) {
    resizeCanvas(windowWidth, windowHeight);
  } else {
    resizeCanvas(16 * numCols, 16 * numRows);
  }
}


function draw() {
  randomSeed(seed);
  drawGrid(currentGrid);
}

function reseed() {
  seed = (seed | 0) + 1109;
  randomSeed(seed);
  noiseSeed(seed);
  if (select("#seedReport")) {
    select("#seedReport").html("seed " + seed);
  }
  regenerateGrid();
  initClouds();
}

function regenerateGrid() {
  let grid = generateGrid(numCols, numRows);
  if (select("#asciiBox")) {
    select("#asciiBox").value(gridToString(grid));
  }
  reparseGrid();
}

function reparseGrid() {
  let ascii = select("#asciiBox")?.value();
  if (ascii) {
    currentGrid = stringToGrid(ascii);
  } else {
    currentGrid = generateGrid(numCols, numRows);
  }
}

function gridToString(grid) {
  return grid.map(row => row.join("")).join("\n");
}

function stringToGrid(str) {
  return str.split("\n").map(line => line.split(""));
}

function placeTile(i, j, ti, tj) {
  image(tilesetImage, 16 * j, 16 * i, 16, 16, 8 * ti, 8 * tj, 8, 8);
}

// ==== GRID GENERATION ====
function generateGrid(numCols, numRows) {
  let grid = [];
  let scale = 15;
  let housePlaced = false;

  for (let i = 0; i < numRows; i++) {
    let row = [];
    for (let j = 0; j < numCols; j++) {
      let n = noise(i / scale, j / scale);
      let code = "_";

      if (n < 0.4) {
        code = "W";
      } else if (n < 0.5) {
        code = ":";
      }

      if (code === "_" && random() < 0.05) {
        code = "T";
      }

      if (!housePlaced && i < 5 && j > numCols - 10 && code === ":") {
        code = "H";
        housePlaced = true;
      }

      row.push(code);
    }
    grid.push(row);
  }

  return grid;
}

// ==== GRID DRAW ====
function drawGrid(grid) {
  background(128);

  for (let i = 0; i < grid.length; i++) {
    for (let j = 0; j < grid[i].length; j++) {
      let code = grid[i][j];

      if (code === "_") {
        placeTile(i, j, floor(random(2)), 0);
      } else if (code === ":") {
        placeTile(i, j, floor(random(2)), 3);
      } else if (code === "W") {
        drawContext(grid, i, j, "W", 0, 10);
      } else if (code === "T") {
        placeTile(i, j, 19, 2);
      } else if (code === "H") {
        placeTile(i, j, 26, 0);
      }
    }
  }

  drawClouds();
}

// ==== WATER TILING ====
function gridCheck(grid, i, j, target) {
  return i >= 0 && j >= 0 && i < grid.length && j < grid[0].length && grid[i][j] === target;
}

function gridCode(grid, i, j, target) {
  let north = gridCheck(grid, i - 1, j, target) ? 1 : 0;
  let south = gridCheck(grid, i + 1, j, target) ? 1 : 0;
  let east = gridCheck(grid, i, j + 1, target) ? 1 : 0;
  let west = gridCheck(grid, i, j - 1, target) ? 1 : 0;
  return (north << 0) + (south << 1) + (east << 2) + (west << 3);
}

function drawContext(grid, i, j, target, tiOffset, tjOffset) {
  const code = gridCode(grid, i, j, target);
  const [ti, tj] = waterLookup[code] || [1, 0];
  placeTile(i, j, ti + tiOffset, tj + tjOffset);
}

const waterLookup = [
  [10, -7], [1, -7], [2, -7], [3, -7],
  [9, -7], [9, -5], [10, -7], [9, -6],
  [11, -7], [11, -5], [10, -7], [3, 3],
  [10, -7], [3, 3], [10, -7], [0, 3],
];

// ==== CLOUDS ====
function initClouds() {
  clouds = [];
  for (let i = 0; i < numClouds; i++) {
    clouds.push({
      y: floor(random(0, 10)),
      xOffset: random(1000),
      speed: random(0.1, 0.4),
      tiles: random(cloudChunks)
    });
  }
}

function drawClouds() {
  let t = millis() / 1000;
  let cols = currentGrid[0].length;

  for (let cloud of clouds) {
    let baseX = (cloud.xOffset + t * cloud.speed) % cols;

    for (let i = 0; i < cloud.tiles.length; i++) {
      let [ti, tj] = cloud.tiles[i];
      let dx = i % 2;
      let dy = floor(i / 2);
      let x = floor(baseX + dx);
      let y = cloud.y + dy;

      if (x < cols && y < currentGrid.length) {
        placeTile(y, x, ti, tj);
      }
    }
  }
}

