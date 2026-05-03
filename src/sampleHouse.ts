import type { Floor, HouseModel, Wall } from "./model";

const garageStepDepth = 30;
const garageStepWidth = 80;
const garageStepRise = 15;
const garageStepCount = 5;
const garagePlatformOuterEdgeX = 1120;
const garageStairCenterY = 985;
const greenPlatformStairRise = 15;
const greenPlatformStairDepth = 30;
const greenPlatformStairTreadCount = 6;
const greenPlatformStairEndX = 980;
const greenPlatformStairStartY = 1230;
const greenPlatformStairEdgeY = 1595;
const greenPlatformStairEdgeX = 740;
const greenPlatformStairColor = "#dcebd8";
const structuralPillarColor = "#bcc2c8";
const upperFloorPillarHeight = 268;
const structuralPillars = [
  { id: "p1", name: "p1", x: 15, y: 335, height: 360 },
  { id: "p2", name: "p2", x: 495, y: 335, height: 360 },
  { id: "p3", name: "p3", x: 1445, y: 335, height: 360 },
  { id: "p4", name: "p4", x: 995, y: 335, height: 360 },
  { id: "p5", name: "p5", x: 755, y: 335, height: 360 },
  { id: "p6", name: "p6", x: 15, y: 700, height: 360 },
  { id: "p7", name: "p7", x: 495, y: 700, height: 360 },
  { id: "p8", name: "p8", x: 1445, y: 700, height: 360 },
  { id: "p9", name: "p9", x: 995, y: 700, height: 360 },
  { id: "p10", name: "p10", x: 755, y: 700, height: 360 },
  { id: "p11", name: "p11", x: 15, y: 1215, height: 360 },
  { id: "p12", name: "p12", x: 495, y: 1215, height: 360 },
  { id: "p13", name: "p13", x: 1445, y: 930, height: 360 },
  { id: "p14", name: "p14", x: 995, y: 930, height: 360 },
  { id: "p15", name: "p15", x: 1445, y: 1215, height: 360 },
  { id: "p16", name: "p16", x: 995, y: 1215, height: 360 },
  { id: "p17", name: "p17", x: 755, y: 1215, height: 360 },
  { id: "p18", name: "p18", x: 1445, y: 1580, height: 360 },
  { id: "p19", name: "p19", x: 995, y: 1580, height: 360 },
  { id: "p20", name: "p20", x: 755, y: 1580, height: 360 },
] as const;
const upperFloorPillars = structuralPillars.filter(
  (pillar) => !["p18", "p19", "p20"].includes(pillar.id),
);

export const sampleHouse: HouseModel = {
  version: 1,
  units: "cm",
  name: "Ciurbesti House Draft",
  floors: [
    {
      id: "ground-floor",
      name: "Ground Floor",
      elevation: 0,
      defaultWallHeight: 270,
      axes: {
        vertical: [
          { coordinate: 15, label: "1" },
          { coordinate: 495, label: "2" },
          { coordinate: 755, label: "3" },
          { coordinate: 995, label: "4" },
          { coordinate: 1445, label: "5" },
        ],
        horizontal: [
          { coordinate: 335, label: "D" },
          { coordinate: 700, label: "C" },
          { coordinate: 930, label: "B'" },
          { coordinate: 1215, label: "B" },
          { coordinate: 1580, label: "A" },
        ],
      },
      walls: [
        {
          id: "w1",
          name: "Axis D segment 1-2",
          from: { x: 0, y: 335 },
          to: { x: 495, y: 335 },
          height: 270,
          baseElevation: 90,
          thickness: 30,
          thicknessSide: "center",
          color: "#6d7785",
          openings: [
            {
              id: "win-w1-1",
              type: "window",
              offset: 172.5,
              length: 150,
              baseHeight: 110,
              height: 120,
            },
          ],
        },
        {
          id: "w2",
          name: "Axis D segment 2-3",
          from: { x: 495, y: 335 },
          to: { x: 755, y: 335 },
          height: 270,
          baseElevation: 90,
          thickness: 30,
          thicknessSide: "center",
          color: "#6d7785",
          openings: [
            {
              id: "door-w2-1",
              type: "door",
              offset: 85,
              length: 90,
              baseHeight: 0,
              height: 230,
            },
          ],
        },
        {
          id: "w3",
          name: "Axis D segment 3-4",
          from: { x: 755, y: 335 },
          to: { x: 995, y: 335 },
          height: 270,
          baseElevation: 90,
          thickness: 30,
          thicknessSide: "center",
          color: "#6d7785",
        },
        {
          id: "w4",
          name: "Axis D segment 4-5",
          from: { x: 995, y: 335 },
          to: { x: 1460, y: 335 },
          height: 270,
          baseElevation: 90,
          thickness: 30,
          thicknessSide: "center",
          color: "#6d7785",
        },
        {
          id: "w11",
          name: "Axis 5 segment D-C",
          from: { x: 1445, y: 320 },
          to: { x: 1445, y: 700 },
          height: 270,
          baseElevation: 90,
          thickness: 30,
          thicknessSide: "center",
          color: "#6d7785",
          openings: [
            {
              id: "win-w11-1",
              type: "window",
              offset: 115,
              length: 150,
              baseHeight: 110,
              height: 120,
            },
          ],
        },
        {
          id: "w12",
          name: "Axis 5 segment C-B'",
          from: { x: 1445, y: 700 },
          to: { x: 1445, y: 930 },
          height: 270,
          baseElevation: 90,
          thickness: 30,
          thicknessSide: "center",
          color: "#6d7785",
          openings: [
            {
              id: "win-w12-1",
              type: "window",
              offset: 35,
              length: 60,
              baseHeight: 110,
              height: 120,
            },
          ],
        },
        {
          id: "w13",
          name: "Axis 5 segment B'-B",
          from: { x: 1445, y: 930 },
          to: { x: 1445, y: 1215 },
          height: 360,
          thickness: 30,
          thicknessSide: "center",
          color: "#6d7785",
          openings: [
            {
              id: "win-w13-1",
              type: "window",
              offset: 175,
              length: 60,
              baseHeight: 170,
              height: 150,
            },
          ],
        },
        {
          id: "w14",
          name: "Axis 5 segment B-A",
          from: { x: 1445, y: 1215 },
          to: { x: 1445, y: 1595 },
          height: 360,
          thickness: 30,
          thicknessSide: "center",
          color: "#6d7785",
          openings: [
            {
              id: "win-w14-1",
              type: "window",
              offset: 210,
              length: 60,
              baseHeight: 170,
              height: 150,
            },
          ],
        },
        {
          id: "w19",
          name: "Axis A segment 5-4",
          from: { x: 1460, y: 1580 },
          to: { x: 980, y: 1580 },
          height: 360,
          thickness: 30,
          thicknessSide: "center",
          color: "#6d7785",
          openings: [
            {
              id: "door-w19-1",
              type: "door",
              offset: 90,
              length: 300,
              baseHeight: 0,
              height: 260,
            },
          ],
        },
        {
          id: "w20",
          name: "Axis 4 segment A-B",
          from: { x: 995, y: 1595 },
          to: { x: 995, y: 1215 },
          height: 360,
          thickness: 30,
          thicknessSide: "center",
          color: "#6d7785",
        },
        {
          id: "w21",
          name: "Axis 4 segment B-B'",
          from: { x: 995, y: 1215 },
          to: { x: 995, y: 915 },
          height: 270,
          baseElevation: 90,
          thickness: 30,
          thicknessSide: "center",
          color: "#6d7785",
        },
        {
          id: "w22",
          name: "Axis B' segment 5-4",
          from: { x: 1460, y: 930 },
          to: { x: 980, y: 930 },
          height: 270,
          baseElevation: 90,
          thickness: 30,
          thicknessSide: "center",
          color: "#6d7785",
          openings: [
            {
              id: "door-w22-1",
              type: "door",
              offset: 390,
              length: 90,
              baseHeight: 0,
              height: 230,
            },
          ],
        },
        {
          id: "w23",
          name: "Axis C segment 5-4",
          from: { x: 1460, y: 700 },
          to: { x: 980, y: 700 },
          height: 270,
          baseElevation: 90,
          renderFoundation: false,
          thickness: 30,
          thicknessSide: "center",
          color: "#6d7785",
          openings: [
            {
              id: "door-w23-1",
              type: "door",
              offset: 300,
              length: 90,
              baseHeight: 0,
              height: 230,
            },
          ],
        },
        {
          id: "w24",
          name: "Axis 3 segment B-B'",
          from: { x: 755, y: 1230 },
          to: { x: 755, y: 915 },
          height: 270,
          baseElevation: 90,
          renderFoundation: false,
          thickness: 30,
          thicknessSide: "center",
          color: "#6d7785",
        },
        {
          id: "w25",
          name: "Axis 4 segment D-C",
          from: { x: 995, y: 320 },
          to: { x: 995, y: 715 },
          height: 270,
          baseElevation: 90,
          renderFoundation: false,
          thickness: 30,
          thicknessSide: "center",
          color: "#6d7785",
        },
        {
          id: "w26",
          name: "Axis B segment 4-3",
          from: { x: 1010, y: 1215 },
          to: { x: 755, y: 1215 },
          height: 270,
          baseElevation: 90,
          thickness: 30,
          thicknessSide: "center",
          color: "#6d7785",
          openings: [
            {
              id: "win-w26-1",
              type: "window",
              offset: 60,
              length: 35,
              baseHeight: 0,
              height: 230,
            },
            {
              id: "door-w26-1",
              type: "door",
              offset: 95,
              length: 100,
              baseHeight: 0,
              height: 230,
            },
            {
              id: "win-w26-2",
              type: "window",
              offset: 195,
              length: 35,
              baseHeight: 0,
              height: 230,
            },
          ],
        },
        {
          id: "w27",
          name: "Axis B segment 3-2",
          from: { x: 755, y: 1215 },
          to: { x: 495, y: 1215 },
          height: 270,
          baseElevation: 90,
          thickness: 30,
          thicknessSide: "center",
          color: "#6d7785",
          openings: [
            {
              id: "win-w27-1",
              type: "window",
              offset: 80,
              length: 150,
              baseHeight: 45,
              height: 185,
            },
          ],
        },
        {
          id: "w28",
          name: "Axis B segment 2-1",
          from: { x: 495, y: 1215 },
          to: { x: 0, y: 1215 },
          height: 270,
          baseElevation: 90,
          thickness: 30,
          thicknessSide: "center",
          color: "#6d7785",
          openings: [
            {
              id: "win-w28-1",
              type: "window",
              offset: 240,
              length: 150,
              baseHeight: 45,
              height: 185,
            },
          ],
        },
        {
          id: "w29",
          name: "Axis 1 segment B-C",
          from: { x: 15, y: 1230 },
          to: { x: 15, y: 700 },
          height: 270,
          baseElevation: 90,
          thickness: 30,
          thicknessSide: "center",
          color: "#6d7785",
          openings: [
            {
              id: "win-w29-1",
              type: "window",
              offset: 80,
              length: 150,
              baseHeight: 45,
              height: 185,
            },
            {
              id: "door-w29-1",
              type: "door",
              offset: 410,
              length: 90,
              baseHeight: 0,
              height: 230,
            },
          ],
        },
        {
          id: "w30",
          name: "Axis 1 segment C-D",
          from: { x: 15, y: 700 },
          to: { x: 15, y: 320 },
          height: 270,
          baseElevation: 90,
          thickness: 30,
          thicknessSide: "center",
          color: "#6d7785",
          openings: [
            {
              id: "win-w30-1",
              type: "window",
              offset: 120,
              length: 150,
              baseHeight: 110,
              height: 120,
            },
          ],
        },
        {
          id: "w31",
          name: "Axis C segment 2-3",
          from: { x: 480, y: 700 },
          to: { x: 770, y: 700 },
          height: 270,
          baseElevation: 90,
          renderFoundation: false,
          thickness: 30,
          thicknessSide: "center",
          color: "#6d7785",
        },
        {
          id: "w32",
          name: "Axis 3 segment D-C",
          from: { x: 755, y: 320 },
          to: { x: 755, y: 715 },
          height: 270,
          baseElevation: 90,
          renderFoundation: false,
          thickness: 30,
          thicknessSide: "center",
          color: "#6d7785",
          openings: [
            {
              id: "door-w32-1",
              type: "door",
              offset: 267,
              length: 90,
              baseHeight: 0,
              height: 230,
            },
          ],
        },
        {
          id: "w34",
          name: "Interior wall 2D toward 2C",
          from: { x: 495, y: 350 },
          to: { x: 495, y: 590 },
          height: 270,
          baseElevation: 90,
          renderFoundation: false,
          thickness: 20,
          thicknessSide: "center",
          color: "#6d7785",
        },
        {
          id: "w35",
          name: "Interior wall perpendicular from 2C run",
          from: { x: 485, y: 580 },
          to: { x: 565, y: 580 },
          height: 270,
          baseElevation: 90,
          renderFoundation: false,
          thickness: 20,
          thicknessSide: "center",
          color: "#6d7785",
        },
        {
          id: "w36",
          name: "Interior wall toward w31",
          from: { x: 555, y: 570 },
          to: { x: 555, y: 715 },
          height: 270,
          baseElevation: 90,
          renderFoundation: false,
          thickness: 20,
          thicknessSide: "center",
          color: "#6d7785",
        },
        {
          id: "w37",
          name: "Interior wall C-B' near axis 4 door",
          from: { x: 1122, y: 715 },
          to: { x: 1122, y: 915 },
          height: 270,
          baseElevation: 90,
          renderFoundation: false,
          thickness: 24,
          thicknessSide: "center",
          color: "#6d7785",
          openings: [
            {
              id: "door-w37-1",
              type: "door",
              offset: 15,
              length: 90,
              baseHeight: 0,
              height: 230,
            },
          ],
        },
      ],
      spaces: [
        {
          id: "gf-floor-house-raised",
          name: "Raised house floor",
          boundary: [
            { x: 0, y: 320 },
            { x: 1460, y: 320 },
            { x: 1460, y: 930 },
            { x: 995, y: 930 },
            { x: 995, y: 1215 },
            { x: 0, y: 1215 },
          ],
          baseElevation: 90,
          color: "#dceef7",
        },
        {
          id: "gf-floor-garage",
          name: "Garage floor",
          boundary: [
            { x: 995, y: 930 },
            { x: 1445, y: 930 },
            { x: 1445, y: 1580 },
            { x: 995, y: 1580 },
          ],
          baseElevation: 0,
          color: "#ece4d4",
        },
        {
          id: "gf-floor-3a-4b",
          name: "3A-4B floor",
          boundary: [
            { x: 740, y: 1230 },
            { x: 980, y: 1230 },
            { x: 980, y: 1595 },
            { x: 740, y: 1595 },
          ],
          baseElevation: 90,
          color: "#dcebd8",
        },
      ],
      objects: [
        {
          id: "garage-platform",
          name: "Garage platform",
          type: "box",
          position: { x: 1065, y: 985, z: 0 },
          size: { x: 110, y: 80, z: 90 },
          baseElevation: 0,
          category: "structural",
          color: "#b9a985",
        },
        ...structuralPillars.map((pillar) => ({
          id: pillar.id,
          name: pillar.name,
          type: "box" as const,
          position: { x: pillar.x, y: pillar.y, z: 0 },
          size: { x: 30, y: 30, z: pillar.height },
          baseElevation: 0,
          renderFoundation: !["p7", "p9", "p10"].includes(pillar.id),
          category: "structural" as const,
          color: structuralPillarColor,
        })),
        ...Array.from({ length: garageStepCount }, (_, index) => {
          const treadElevation = 90 - garageStepRise * (index + 1);

          return {
            id: `garage-step-${index + 1}`,
            name: `Garage step ${index + 1}`,
            type: "box" as const,
            position: {
              x: garagePlatformOuterEdgeX + garageStepDepth * index + garageStepDepth / 2,
              y: garageStairCenterY,
              z: 0,
            },
            size: { x: garageStepDepth, y: garageStepWidth, z: treadElevation },
            baseElevation: 0,
            category: "structural" as const,
            color: "#c8b995",
          };
        }),
        ...Array.from({ length: greenPlatformStairTreadCount }, (_, index) => {
          const treadElevation = 90 - greenPlatformStairRise * index;
          const southLegMinX = greenPlatformStairEdgeX - greenPlatformStairDepth * (index + 1);
          const southLegMaxX = greenPlatformStairEndX;
          const southLegMinY = greenPlatformStairEdgeY + greenPlatformStairDepth * index;
          const southLegMaxY = greenPlatformStairEdgeY + greenPlatformStairDepth * (index + 1);
          const westLegMinX = greenPlatformStairEdgeX - greenPlatformStairDepth * (index + 1);
          const westLegMaxX = greenPlatformStairEdgeX - greenPlatformStairDepth * index;
          const westLegMinY = greenPlatformStairStartY;
          const westLegMaxY = greenPlatformStairEdgeY + greenPlatformStairDepth * index;

          return [
            {
              id: `green-platform-south-step-${index + 1}`,
              name: `Green platform south step ${index + 1}`,
              type: "box" as const,
              position: {
                x: (southLegMinX + southLegMaxX) / 2,
                y: (southLegMinY + southLegMaxY) / 2,
                z: 0,
              },
              size: {
                x: southLegMaxX - southLegMinX,
                y: southLegMaxY - southLegMinY,
                z: treadElevation,
              },
              baseElevation: 0,
              category: "structural" as const,
              color: greenPlatformStairColor,
            },
            {
              id: `green-platform-west-step-${index + 1}`,
              name: `Green platform west step ${index + 1}`,
              type: "box" as const,
              position: {
                x: (westLegMinX + westLegMaxX) / 2,
                y: (westLegMinY + westLegMaxY) / 2,
                z: 0,
              },
              size: {
                x: westLegMaxX - westLegMinX,
                y: westLegMaxY - westLegMinY,
                z: treadElevation,
              },
              baseElevation: 0,
              category: "structural" as const,
              color: greenPlatformStairColor,
            },
          ];
        }).flat(),
        {
          id: "garage-car-rav4-prime",
          name: "RAV4 Prime massing",
          type: "box",
          position: { x: 1220, y: 1290, z: 0 },
          size: { x: 185, y: 460, z: 170 },
          baseElevation: 0,
          category: "custom",
          color: "#3f4348",
        },
      ],
    },
    {
      id: "first-floor",
      name: "First Floor",
      elevation: 428,
      defaultWallHeight: 260,
      walls: [
        {
          id: "fw1",
          name: "First floor wall p1-p2",
          from: { x: 30, y: 335 },
          to: { x: 480, y: 335 },
          height: upperFloorPillarHeight,
          thickness: 30,
          thicknessSide: "center",
          color: "#6d7785",
        },
        {
          id: "fw2",
          name: "First floor wall p2-p5",
          from: { x: 510, y: 335 },
          to: { x: 740, y: 335 },
          height: upperFloorPillarHeight,
          thickness: 30,
          thicknessSide: "center",
          color: "#6d7785",
        },
        {
          id: "fw3",
          name: "First floor wall p5-p4",
          from: { x: 770, y: 335 },
          to: { x: 980, y: 335 },
          height: upperFloorPillarHeight,
          thickness: 30,
          thicknessSide: "center",
          color: "#6d7785",
        },
        {
          id: "fw4",
          name: "First floor wall p4-p3",
          from: { x: 1010, y: 335 },
          to: { x: 1430, y: 335 },
          height: upperFloorPillarHeight,
          thickness: 30,
          thicknessSide: "center",
          color: "#6d7785",
        },
        {
          id: "fw5",
          name: "First floor wall p3-p8",
          from: { x: 1445, y: 350 },
          to: { x: 1445, y: 685 },
          height: upperFloorPillarHeight,
          thickness: 30,
          thicknessSide: "center",
          color: "#6d7785",
        },
        {
          id: "fw6",
          name: "First floor wall p8-p13",
          from: { x: 1445, y: 715 },
          to: { x: 1445, y: 915 },
          height: upperFloorPillarHeight,
          thickness: 30,
          thicknessSide: "center",
          color: "#6d7785",
        },
        {
          id: "fw7",
          name: "First floor wall p13-p15",
          from: { x: 1445, y: 945 },
          to: { x: 1445, y: 1200 },
          height: upperFloorPillarHeight,
          thickness: 30,
          thicknessSide: "center",
          color: "#6d7785",
        },
        {
          id: "fw8",
          name: "First floor wall p15-p16",
          from: { x: 1430, y: 1215 },
          to: { x: 1010, y: 1215 },
          height: upperFloorPillarHeight,
          thickness: 30,
          thicknessSide: "center",
          color: "#6d7785",
        },
        {
          id: "fw9",
          name: "First floor wall p16-p17",
          from: { x: 980, y: 1215 },
          to: { x: 770, y: 1215 },
          height: upperFloorPillarHeight,
          thickness: 30,
          thicknessSide: "center",
          color: "#6d7785",
        },
        {
          id: "fw10",
          name: "First floor wall p17-p12",
          from: { x: 740, y: 1215 },
          to: { x: 510, y: 1215 },
          height: upperFloorPillarHeight,
          thickness: 30,
          thicknessSide: "center",
          color: "#6d7785",
        },
        {
          id: "fw11",
          name: "First floor wall p12-p11",
          from: { x: 480, y: 1215 },
          to: { x: 30, y: 1215 },
          height: upperFloorPillarHeight,
          thickness: 30,
          thicknessSide: "center",
          color: "#6d7785",
        },
        {
          id: "fw12",
          name: "First floor wall p11-p6",
          from: { x: 15, y: 1200 },
          to: { x: 15, y: 715 },
          height: upperFloorPillarHeight,
          thickness: 30,
          thicknessSide: "center",
          color: "#6d7785",
        },
        {
          id: "fw13",
          name: "First floor wall p6-p1",
          from: { x: 15, y: 685 },
          to: { x: 15, y: 350 },
          height: upperFloorPillarHeight,
          thickness: 30,
          thicknessSide: "center",
          color: "#6d7785",
        },
        {
          id: "fw14",
          name: "First floor wall p5-p10",
          from: { x: 755, y: 350 },
          to: { x: 755, y: 685 },
          height: upperFloorPillarHeight,
          thickness: 30,
          thicknessSide: "center",
          color: "#6d7785",
        },
        {
          id: "fw15",
          name: "First floor wall p4-p9",
          from: { x: 995, y: 350 },
          to: { x: 995, y: 685 },
          height: upperFloorPillarHeight,
          thickness: 30,
          thicknessSide: "center",
          color: "#6d7785",
        },
        {
          id: "fw16",
          name: "First floor wall p9-p8",
          from: { x: 1010, y: 700 },
          to: { x: 1430, y: 700 },
          height: upperFloorPillarHeight,
          thickness: 30,
          thicknessSide: "center",
          color: "#6d7785",
        },
        {
          id: "fw17",
          name: "First floor wall p14-p16",
          from: { x: 990, y: 945 },
          to: { x: 990, y: 1200 },
          height: upperFloorPillarHeight,
          thickness: 20,
          thicknessSide: "center",
          color: "#6d7785",
        },
        {
          id: "fw18",
          name: "First floor wall p7-p10",
          from: { x: 510, y: 700 },
          to: { x: 740, y: 700 },
          height: upperFloorPillarHeight,
          thickness: 30,
          thicknessSide: "center",
          color: "#6d7785",
        },
        {
          id: "fw19",
          name: "First floor wall p14 toward p9",
          from: { x: 990, y: 915 },
          to: { x: 990, y: 845 },
          height: upperFloorPillarHeight,
          thickness: 20,
          thicknessSide: "center",
          color: "#6d7785",
        },
        {
          id: "fw20",
          name: "First floor wall next to p12 parallel to fw17",
          from: { x: 465, y: 1200 },
          to: { x: 465, y: 845 },
          height: upperFloorPillarHeight,
          thickness: 24,
          thicknessSide: "center",
          color: "#6d7785",
        },
        {
          id: "fw21",
          name: "First floor wall connecting fw20 and fw19",
          from: { x: 477, y: 855 },
          to: { x: 980, y: 855 },
          height: upperFloorPillarHeight,
          thickness: 20,
          thicknessSide: "center",
          color: "#6d7785",
        },
        {
          id: "fw22",
          name: "First floor wall p13 toward p14",
          from: { x: 1430, y: 930 },
          to: { x: 1130, y: 930 },
          height: upperFloorPillarHeight,
          thickness: 24,
          thicknessSide: "center",
          color: "#6d7785",
        },
      ],
      spaces: [],
      objects: [
        {
          id: "slab1",
          name: "Slab 1",
          type: "slab",
          boundary: [
            { x: 0, y: 320 },
            { x: 1460, y: 320 },
            { x: 1460, y: 1595 },
            { x: 740, y: 1595 },
            { x: 740, y: 1230 },
            { x: 0, y: 1230 },
          ],
          baseElevation: -68,
          thickness: 68,
          category: "structural",
          color: "#6d7785",
        },
        ...upperFloorPillars.map((pillar) => ({
          id: pillar.id,
          name: pillar.name,
          type: "box" as const,
          position: { x: pillar.x, y: pillar.y, z: 0 },
          size: { x: 30, y: 30, z: upperFloorPillarHeight },
          baseElevation: 0,
          category: "structural" as const,
          color: structuralPillarColor,
        })),
      ],
    },
  ],
};

normalizeGroundFloor(sampleHouse.floors[0]);

function normalizeGroundFloor(floor: Floor) {
  floor.walls.forEach((wall) => {
    if (wall.thickness !== 30) return;

    const originalFrom = { ...wall.from };
    const originalTo = { ...wall.to };
    const startTrim = trimWallEndpoint(wall, "from");
    trimWallEndpoint(wall, "to");

    if (startTrim > 0 && wall.openings) {
      wall.openings = wall.openings.map((opening) => ({
        ...opening,
        offset: Math.max(0, opening.offset - startTrim),
      }));
    }

    if (originalFrom.x !== wall.from.x || originalFrom.y !== wall.from.y || originalTo.x !== wall.to.x || originalTo.y !== wall.to.y) {
      wall.openings?.forEach((opening) => {
        const maxOffset = Math.max(0, wallLength(wall) - opening.length);
        opening.offset = Math.min(opening.offset, maxOffset);
      });
    }
  });

  const pillarObjects = new Map(
    floor.objects
      .filter((object) => object.type === "box")
      .map((object) => [object.id, object]),
  );
  structuralPillars.forEach((pillar) => {
    const adjacentWalls = floor.walls.filter((wall) => isWallAdjacentToPillar(wall, pillar.x, pillar.y));
    const baseElevation = adjacentWalls.length > 0 ? Math.min(...adjacentWalls.map((wall) => wall.baseElevation ?? 0)) : 0;
    const topElevation =
      adjacentWalls.length > 0
        ? Math.max(...adjacentWalls.map((wall) => (wall.baseElevation ?? 0) + wall.height))
        : pillar.height;
    const pillarObject = pillarObjects.get(pillar.id);
    if (!pillarObject) return;
    pillarObject.baseElevation = baseElevation;
    pillarObject.size.z = topElevation - baseElevation;
  });

  ["p7", "p9", "p10", "p13", "p16"].forEach((pillarId) => {
    const pillar = pillarObjects.get(pillarId);
    if (!pillar) return;
    pillar.baseElevation = 90;
    pillar.size.z = 270;
  });
}

function trimWallEndpoint(
  wall: Wall,
  endpoint: "from" | "to",
) {
  const point = wall[endpoint];
  const otherPoint = endpoint === "from" ? wall.to : wall.from;
  const dx = otherPoint.x - point.x;
  const dy = otherPoint.y - point.y;
  const length = Math.hypot(dx, dy);
  if (length === 0) return 0;

  const candidate = findEndpointPillar(point.x, point.y, wall, endpoint);
  if (!candidate) return 0;

  const half = wall.thickness / 2;
  let nextPoint = point;

  if (Math.abs(wall.from.y - wall.to.y) < 0.00001) {
    nextPoint = {
      x: otherPoint.x > point.x ? candidate.x + half : candidate.x - half,
      y: candidate.y,
    };
  } else if (Math.abs(wall.from.x - wall.to.x) < 0.00001) {
    nextPoint = {
      x: candidate.x,
      y: otherPoint.y > point.y ? candidate.y + half : candidate.y - half,
    };
  }

  const trimDistance = Math.hypot(nextPoint.x - point.x, nextPoint.y - point.y);
  wall[endpoint] = nextPoint;
  return trimDistance;
}

function isWallAdjacentToPillar(wall: Wall, x: number, y: number) {
  if (wall.thickness !== 30) return false;

  if (Math.abs(wall.from.y - wall.to.y) < 0.00001) {
    if (Math.abs(wall.from.y - y) > 0.00001) return false;
    const minX = Math.min(wall.from.x, wall.to.x) - wall.thickness / 2;
    const maxX = Math.max(wall.from.x, wall.to.x) + wall.thickness / 2;
    return x >= minX - 0.00001 && x <= maxX + 0.00001;
  }

  if (Math.abs(wall.from.x - wall.to.x) < 0.00001) {
    if (Math.abs(wall.from.x - x) > 0.00001) return false;
    const minY = Math.min(wall.from.y, wall.to.y) - wall.thickness / 2;
    const maxY = Math.max(wall.from.y, wall.to.y) + wall.thickness / 2;
    return y >= minY - 0.00001 && y <= maxY + 0.00001;
  }

  return false;
}

function wallLength(wall: Wall) {
  return Math.hypot(wall.to.x - wall.from.x, wall.to.y - wall.from.y);
}

function findEndpointPillar(x: number, y: number, wall: Wall, endpoint: "from" | "to") {
  const alongX = Math.abs(wall.from.y - wall.to.y) < 0.00001;
  const half = wall.thickness / 2;
  const tolerance = 0.00001;

  return structuralPillars.find((pillar) => {
    if (alongX) {
      if (Math.abs(pillar.y - y) > tolerance) return false;
      return x >= pillar.x - half - tolerance && x <= pillar.x + half + tolerance;
    }

    if (Math.abs(pillar.x - x) > tolerance) return false;
    return y >= pillar.y - half - tolerance && y <= pillar.y + half + tolerance;
  });
}
