export function createWorld() {
  return {
    locations: {
      apartment: {
        name: 'Apartment',
        bounds: { x: 0, y: 0, w: 1500, h: 900 },
        bg: '#121b24',
        spawn: { x: 190, y: 240 },

        interactables: [
          // Memory objects
          {
            id: 'memory1',
            x: 450,
            y: 300,
            radius: 22,
            color: '#a8ffd0'
          },
          {
            id: 'memory2',
            x: 900,
            y: 400,
            radius: 22,
            color: '#a8ffd0'
          },
          {
            id: 'memory3',
            x: 1250,
            y: 650,
            radius: 22,
            color: '#a8ffd0'
          },

          // Existing objects
          {
            id: 'memoryRecorder',
            x: 660,
            y: 245,
            radius: 24,
            color: '#8ed9d4'
          },
          {
            id: 'bed',
            x: 260,
            y: 180,
            radius: 32,
            color: '#d6b7ff'
          },
          {
            id: 'window',
            x: 1180,
            y: 160,
            radius: 26,
            color: '#a3d0ff'
          }
        ]
      }
    },

    getColliders: (locationName) => {
      return [
        { x: 0, y: 0, w: 1500, h: 30 },
        { x: 0, y: 0, w: 30, h: 900 },
        { x: 1470, y: 0, w: 30, h: 900 },
        { x: 0, y: 870, w: 1500, h: 30 },
        { x: 340, y: 110, w: 220, h: 90 },
        { x: 520, y: 450, w: 260, h: 100 },
        { x: 860, y: 200, w: 220, h: 120 }
      ];
    }
  };
}

export function getLocationData(locationName) {
  const world = createWorld();
  return world.locations[locationName] || world.locations.apartment;
}
