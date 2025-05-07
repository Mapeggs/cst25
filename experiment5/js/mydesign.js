/* exported p4_inspirations, p4_initialize, p4_render, p4_mutate */


function getInspirations() {
  return [
    {
      name: "Jackie Chan", 
      assetUrl: "https://cdn.glitch.global/6df5fc8c-88ea-4459-b310-27714fdb0ff4/jackiechan.jpg?v=1746497086079",
      credit: "Black and white Jackie Chan taken from pintrest "
    },
    {
      name: "Tom Hiddleston", 
      assetUrl: "https://cdn.glitch.global/6df5fc8c-88ea-4459-b310-27714fdb0ff4/loki.jpg?v=1746497099372",
      credit: "Black and white Tom Hiddleston taken from pintrest"
    },
    {
      name: "Robert Downey Jr.", 
      assetUrl: "https://cdn.glitch.global/6df5fc8c-88ea-4459-b310-27714fdb0ff4/ironman.jpg?v=1746497094911",
      credit: "Black and white Robert Downey Jr. taken from pintrest"
    },
  ];
}

function initDesign(inspiration) {
  resizeCanvas(inspiration.image.width / 8, inspiration.image.height / 8);
  image(inspiration.image, 0, 0, width, height);
  loadPixels(); // Capture pixel data

  let design = {
    bg: 128,
    fg: []
  };

  for (let i = 0; i < 600; i++) {
    let x = random(width);
    let y = random(height);
    let d = random(4, 20); // Small circle for detail

    // Sample brightness from inspiration image
    let index = 4 * (int(x) + int(y) * width);
    let r = pixels[index];
    let g = pixels[index + 1];
    let b = pixels[index + 2];
    let brightness = (r + g + b) / 3;

    design.fg.push({
      x: x,
      y: y,
      d: d,
      fill: brightness
    });
  }

  return design;
}


function renderDesign(design, inspiration) {
  background(design.bg);
  noStroke();
  for (let shape of design.fg) {
    fill(shape.fill, 160); // Slight transparency for layering
    ellipse(shape.x, shape.y, shape.d, shape.d);
  }
}


function mutateDesign(design, inspiration, rate) {
  design.bg = mut(design.bg, 0, 255, rate);
  for (let shape of design.fg) {
    shape.fill = mut(shape.fill, 0, 255, rate);
    shape.x = mut(shape.x, 0, width, rate);
    shape.y = mut(shape.y, 0, height, rate);
    shape.d = mut(shape.d, 4, 20, rate);
  }
}



function mut(num, min, max, rate) {
    return constrain(randomGaussian(num, (rate * (max - min)) / 10), min, max);
}
