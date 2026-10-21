/**
 * Ice-sculpture silhouettes. Each shape is one or more polygons in the
 * 720×1280 playfield. The cell grid fills whatever is inside any polygon.
 */

export function ellipse(cx, cy, rx, ry, n = 28) {
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    return { x: cx + Math.cos(a) * rx, y: cy + Math.sin(a) * ry };
  });
}

export function starPoints(cx, cy, outer, inner, points = 5) {
  const out = [];
  for (let i = 0; i < points * 2; i++) {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = -Math.PI / 2 + (i * Math.PI) / points;
    out.push({ x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius });
  }
  return out;
}

const star = {
  label: 'Star',
  polygons: [starPoints(360, 500, 236, 96, 5)],
  cores: [
    { x: 318, y: 438 },
    { x: 402, y: 572 },
  ],
};

const fish = {
  label: 'Fish',
  polygons: [
    [
      { x: 170, y: 500 },
      { x: 195, y: 440 },
      { x: 245, y: 402 },
      { x: 315, y: 382 },
      { x: 390, y: 382 },
      { x: 455, y: 410 },
      { x: 505, y: 455 },
      { x: 555, y: 420 },
      { x: 570, y: 455 },
      { x: 545, y: 500 },
      { x: 570, y: 545 },
      { x: 555, y: 580 },
      { x: 505, y: 545 },
      { x: 455, y: 590 },
      { x: 390, y: 618 },
      { x: 315, y: 618 },
      { x: 245, y: 598 },
      { x: 195, y: 560 },
    ],
  ],
  cores: [
    { x: 300, y: 480 },
    { x: 420, y: 500 },
  ],
};

const cat = {
  label: 'Cat',
  polygons: [
    [
      { x: 255, y: 360 },
      { x: 285, y: 300 },
      { x: 325, y: 345 },
      { x: 390, y: 345 },
      { x: 430, y: 300 },
      { x: 460, y: 360 },
      { x: 470, y: 420 },
      { x: 445, y: 465 },
      { x: 465, y: 520 },
      { x: 475, y: 620 },
      { x: 455, y: 690 },
      { x: 400, y: 715 },
      { x: 310, y: 715 },
      { x: 255, y: 690 },
      { x: 235, y: 620 },
      { x: 245, y: 520 },
      { x: 265, y: 465 },
      { x: 240, y: 420 },
    ],
    [
      { x: 455, y: 640 },
      { x: 540, y: 670 },
      { x: 560, y: 620 },
      { x: 525, y: 590 },
      { x: 490, y: 620 },
    ],
  ],
  cores: [
    { x: 330, y: 390 },
    { x: 360, y: 610 },
  ],
};

const rocket = {
  label: 'Rocket',
  polygons: [
    [
      { x: 360, y: 235 },
      { x: 420, y: 320 },
      { x: 420, y: 560 },
      { x: 480, y: 660 },
      { x: 420, y: 620 },
      { x: 420, y: 710 },
      { x: 300, y: 710 },
      { x: 300, y: 620 },
      { x: 240, y: 660 },
      { x: 300, y: 560 },
      { x: 300, y: 320 },
    ],
  ],
  cores: [
    { x: 360, y: 350 },
    { x: 360, y: 610 },
  ],
};

const castle = {
  label: 'Castle',
  polygons: [
    [
      { x: 150, y: 700 },
      { x: 150, y: 430 },
      { x: 190, y: 430 },
      { x: 190, y: 390 },
      { x: 230, y: 390 },
      { x: 230, y: 430 },
      { x: 270, y: 430 },
      { x: 270, y: 700 },
    ],
    [
      { x: 295, y: 700 },
      { x: 295, y: 380 },
      { x: 325, y: 340 },
      { x: 360, y: 315 },
      { x: 395, y: 340 },
      { x: 425, y: 380 },
      { x: 425, y: 700 },
    ],
    [
      { x: 450, y: 700 },
      { x: 450, y: 430 },
      { x: 490, y: 430 },
      { x: 490, y: 390 },
      { x: 530, y: 390 },
      { x: 530, y: 430 },
      { x: 570, y: 430 },
      { x: 570, y: 700 },
    ],
    [
      { x: 270, y: 700 },
      { x: 270, y: 560 },
      { x: 450, y: 560 },
      { x: 450, y: 700 },
    ],
  ],
  cores: [
    { x: 210, y: 520 },
    { x: 360, y: 450 },
    { x: 510, y: 520 },
  ],
};

const snowman = {
  label: 'Snowman',
  polygons: [ellipse(360, 650, 110, 105), ellipse(360, 490, 80, 80), ellipse(360, 360, 56, 56)],
  cores: [
    { x: 360, y: 650 },
    { x: 360, y: 360 },
  ],
};

const dinosaur = {
  label: 'Dinosaur',
  polygons: [
    ellipse(360, 560, 135, 82),
    [
      { x: 245, y: 540 },
      { x: 225, y: 430 },
      { x: 235, y: 350 },
      { x: 270, y: 315 },
      { x: 320, y: 315 },
      { x: 340, y: 355 },
      { x: 315, y: 390 },
      { x: 300, y: 430 },
      { x: 310, y: 500 },
    ],
    [
      { x: 470, y: 560 },
      { x: 545, y: 520 },
      { x: 600, y: 535 },
      { x: 555, y: 575 },
      { x: 480, y: 600 },
    ],
    [
      { x: 300, y: 610 },
      { x: 345, y: 610 },
      { x: 345, y: 720 },
      { x: 300, y: 720 },
    ],
    [
      { x: 395, y: 610 },
      { x: 440, y: 610 },
      { x: 440, y: 720 },
      { x: 395, y: 720 },
    ],
  ],
  cores: [
    { x: 360, y: 560 },
    { x: 270, y: 370 },
    { x: 540, y: 550 },
  ],
};

const butterfly = {
  label: 'Butterfly',
  polygons: [
    ellipse(360, 500, 22, 115),
    ellipse(270, 430, 90, 70),
    ellipse(450, 430, 90, 70),
    ellipse(285, 570, 72, 62),
    ellipse(435, 570, 72, 62),
  ],
  cores: [
    { x: 270, y: 430 },
    { x: 450, y: 430 },
    { x: 360, y: 500 },
  ],
};

const lighthouse = {
  label: 'Lighthouse',
  polygons: [
    [
      { x: 320, y: 700 },
      { x: 338, y: 390 },
      { x: 382, y: 390 },
      { x: 400, y: 700 },
    ],
    [
      { x: 330, y: 390 },
      { x: 330, y: 325 },
      { x: 390, y: 325 },
      { x: 390, y: 390 },
    ],
    [
      { x: 318, y: 325 },
      { x: 360, y: 270 },
      { x: 402, y: 325 },
    ],
    [
      { x: 280, y: 700 },
      { x: 440, y: 700 },
      { x: 470, y: 745 },
      { x: 250, y: 745 },
    ],
  ],
  cores: [
    { x: 360, y: 350 },
    { x: 360, y: 590 },
  ],
};

const crown = {
  label: 'Crown',
  polygons: [
    [
      { x: 160, y: 620 },
      { x: 580, y: 620 },
      { x: 580, y: 700 },
      { x: 160, y: 700 },
    ],
    [
      { x: 170, y: 620 },
      { x: 210, y: 500 },
      { x: 250, y: 620 },
    ],
    [
      { x: 250, y: 620 },
      { x: 290, y: 470 },
      { x: 330, y: 620 },
    ],
    [
      { x: 330, y: 620 },
      { x: 370, y: 450 },
      { x: 410, y: 620 },
    ],
    [
      { x: 410, y: 620 },
      { x: 450, y: 470 },
      { x: 490, y: 620 },
    ],
    [
      { x: 490, y: 620 },
      { x: 530, y: 500 },
      { x: 570, y: 620 },
    ],
  ],
  cores: [
    { x: 250, y: 660 },
    { x: 370, y: 540 },
    { x: 500, y: 660 },
  ],
};

export const SHAPES = {
  star,
  fish,
  cat,
  rocket,
  castle,
  snowman,
  dinosaur,
  butterfly,
  lighthouse,
  crown,
};

export function getShape(id) {
  return SHAPES[id] ?? SHAPES.star;
}
