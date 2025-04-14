// sketch.js - purpose and description here
// Author: Your Name
// Date:

// Here is how you might set up an OOP p5.js project
// Note that p5.js looks for a file called sketch.js

// Constants - User-servicable parts
// In a longer project I like to put these in a separate file
const VALUE1 = 1;
const VALUE2 = 2;

// Globals
let myInstance;
let seed = 5;
let waveOffset = 0;
let rocks = [];

let canvasContainer;
var centerHorz, centerVert;

function setup() {
  canvasContainer = $("#canvas-container");
  let canvas = createCanvas(canvasContainer.width(), canvasContainer.height());
  canvas.parent("canvas-container");

  generateRocks();

  document.getElementById("reimagine").addEventListener("click", () => {
    seed++;
    generateRocks();
  });
  
  document.getElementById("fullscreen").addEventListener("click", () => {
    let fs = fullscreen();
    fullscreen(!fs);
  });
  

  $(window).resize(function () {
    resizeScreen();
  });
  resizeScreen();
}

function draw() {
  randomSeed(seed);
  let t = millis() / 1000;
  waveOffset = sin(t * 0.4) * 15;

  background(255);
  drawSandLayer();
  drawOceanLayer();
  drawWaveFoam();
  drawRocks();
  drawMiniWaves();
}

function windowResized() {
  resizeScreen();
}

function resizeScreen() {
  let w = fullscreen() ? windowWidth : canvasContainer.width();
  let h = fullscreen() ? windowHeight : canvasContainer.height();
  resizeCanvas(w, h);
}

// Layers & Effects
function drawSandLayer() {
  for (let y = 0; y < height; y++) {
    let inter = map(y, 0, height, 0, 1);
    let c = lerpColor(color(240, 200, 150), color(255, 230, 180), inter);
    fill(c);
    rect(0, y, width, 1);
  }
}

function drawOceanLayer() {
  let oceanBottom = height * 0.55 + waveOffset;

  for (let y = 0; y < oceanBottom; y++) {
    let inter = map(y, 0, oceanBottom, 0, 1);
    let c = lerpColor(color(0, 90, 160), color(0, 180, 210, 180), inter);
    fill(c);
    rect(0, y, width, 1);
  }

  fill(0, 60, 100, 30);
  for (let i = 0; i < 5; i++) {
    let x = map(i, 0, 5, 100, width - 100) + sin(millis() * 0.0005 + i) * 10;
    let y = noise(i + 999, millis() * 0.00003) * (oceanBottom * 0.8);
    ellipse(x, y, random(200, 800), random(35, 50));
  }
}

function drawWaveFoam() {
  fill(255, 255, 255, 255);
  stroke(350);
  strokeWeight(30);

  beginShape();
  for (let x = 0; x <= width; x += 5) {
    let y = height * 0.55 + waveOffset +
      sin(x * 0.02 + frameCount * 0.03) * 6 +
      noise(x * 0.01, frameCount * 0.005) * 12;
    curveVertex(x, y);
    if (x === 0 || x === width) curveVertex(x, y);
  }
  endShape(CLOSE);

  noStroke();
}

function drawMiniWaves() {
  let oceanBottom = height * 0.55 + waveOffset;

  for (let i = 0; i < 10; i++) {
    let y = random(30, oceanBottom - 30);
    stroke(255, 255, 255, random(20, 40));
    strokeWeight(random(0.5, 1.2));
    noFill();

    beginShape();
    for (let x = 0; x <= width; x += 8) {
      let wave = sin(x * 0.03 + frameCount * 0.03 + i * 10) * 2;
      vertex(x, y + wave);
    }
    endShape();
  }
}

function generateRocks() {
  rocks = [];
  for (let i = 0; i < 40; i++) {
    rocks.push({
      x: random(width),
      y: random(height * 0.65, height),
      size: random(5, 15),
    });
  }
}

function drawRocks() {
  fill(80);
  for (let r of rocks) {
    ellipse(r.x, r.y, r.size, r.size * 0.6);
  }
}

// mousePressed() function is called once after every time a mouse button is pressed
function mousePressed() {
    // code to run when mouse is pressed
}