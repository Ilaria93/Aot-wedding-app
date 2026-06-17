import { GRAYBOX_ROOFTOP_BUILDINGS } from '@/scenes/graybox/grayboxLayout';
import {
  buildFlightCorridorStrips,
  buildRooftopDistrictLayout,
  distanceToRooftopsFlightPath,
  rooftopLotHeight,
} from '@/utils/grayboxRooftopDistrict';

describe('grayboxRooftopDistrict', () => {
  it('generates a substantial city block grid', () => {
    const layout = buildRooftopDistrictLayout();

    expect(layout.buildings.length).toBeGreaterThan(20);
    expect(layout.streets.length).toBeGreaterThan(10);
    expect(layout.corridorStrips.length).toBeGreaterThan(8);
  });

  it('varies building heights significantly across the district', () => {
    const heights = GRAYBOX_ROOFTOP_BUILDINGS.map((building) => building.size[1]);
    const minHeight = Math.min(...heights);
    const maxHeight = Math.max(...heights);

    expect(minHeight).toBeLessThan(8);
    expect(maxHeight).toBeGreaterThan(18);
    expect(new Set(heights).size).toBeGreaterThan(8);
  });

  it('uses multiple readable rooftop shapes', () => {
    const shapes = new Set(GRAYBOX_ROOFTOP_BUILDINGS.map((building) => building.shape));

    expect(shapes.has('box')).toBe(true);
    expect(shapes.size).toBeGreaterThanOrEqual(3);
  });

  it('aligns buildings into rows with street gaps', () => {
    const zValues = GRAYBOX_ROOFTOP_BUILDINGS.map((building) => building.position[2]);
    const roundedRows = new Set(zValues.map((z) => Math.round(z / 3) * 3));

    expect(roundedRows.size).toBeGreaterThan(4);
  });

  it('leaves a clear flight corridor along the rooftops camera path', () => {
    for (const building of GRAYBOX_ROOFTOP_BUILDINGS) {
      const distance = distanceToRooftopsFlightPath(
        building.position[0],
        building.position[2],
      );

      expect(distance).toBeGreaterThanOrEqual(10);
    }
  });

  it('marks the flight corridor with strip segments along the camera path', () => {
    const strips = buildFlightCorridorStrips();

    expect(strips[0]?.size[0]).toBeGreaterThan(20);
    expect(strips.length).toBeGreaterThanOrEqual(rooftopsPathLength() - 1);
  });

  it('produces deterministic heights for the same grid cell', () => {
    expect(rooftopLotHeight(2, 4)).toBe(rooftopLotHeight(2, 4));
    expect(rooftopLotHeight(2, 4)).not.toBe(rooftopLotHeight(3, 4));
  });
});

function rooftopsPathLength(): number {
  return buildFlightCorridorStrips().length;
}
