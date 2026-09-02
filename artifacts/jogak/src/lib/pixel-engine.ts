/**
 * 스텝바이스탭 (StepByStep) — 2:1 아이소메트릭 픽셀 렌더링 엔진 (TypeScript Port)
 * 논리 해상도: 160 x 152
 */

export interface ScreenPoint {
  x: number;
  y: number;
}

export class PixelEngine {
  static TW = 10;
  static TH = 5;
  static CX = 80;
  static CY = 50;

  static isoToScreen(gx: number, gy: number, z: number = 0): ScreenPoint {
    return {
      x: Math.round(this.CX + (gx - gy) * this.TW),
      y: Math.round(this.CY + (gx + gy) * this.TH - z)
    };
  }

  static drawPolygon(ctx: CanvasRenderingContext2D, points: ScreenPoint[], color: string) {
    if (!points || points.length < 3) return;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.closePath();
    ctx.fill();
  }

  static prism(
    ctx: CanvasRenderingContext2D,
    gx: number,
    gy: number,
    w: number,
    d: number,
    h: number,
    topColor: string | null,
    leftColor: string | null = null,
    rightColor: string | null = null,
    z0: number = 0
  ) {
    const p0 = this.isoToScreen(gx, gy, z0 + h);
    const p1 = this.isoToScreen(gx + w, gy, z0 + h);
    const p2 = this.isoToScreen(gx + w, gy + d, z0 + h);
    const p3 = this.isoToScreen(gx, gy + d, z0 + h);

    const b1 = this.isoToScreen(gx + w, gy, z0);
    const b2 = this.isoToScreen(gx + w, gy + d, z0);
    const b3 = this.isoToScreen(gx, gy + d, z0);

    if (leftColor) {
      this.drawPolygon(ctx, [p3, p2, b2, b3], leftColor);
    }
    if (rightColor) {
      this.drawPolygon(ctx, [p1, p2, b2, b1], rightColor);
    }
    if (topColor) {
      this.drawPolygon(ctx, [p0, p1, p2, p3], topColor);
    }
  }

  static gableRoof(
    ctx: CanvasRenderingContext2D,
    gx: number,
    gy: number,
    w: number,
    d: number,
    roofHeight: number,
    roofColor: string,
    gableSideColor: string,
    z0: number = 0
  ) {
    const ridgeLeft = this.isoToScreen(gx, gy + d / 2, z0 + roofHeight);
    const ridgeRight = this.isoToScreen(gx + w, gy + d / 2, z0 + roofHeight);
    const eaveNearLeft = this.isoToScreen(gx, gy + d, z0);
    const eaveNearRight = this.isoToScreen(gx + w, gy + d, z0);
    const eaveFarLeft = this.isoToScreen(gx, gy, z0);

    this.drawPolygon(ctx, [ridgeLeft, ridgeRight, eaveNearRight, eaveNearLeft], roofColor);
    this.drawPolygon(ctx, [ridgeLeft, eaveNearLeft, eaveFarLeft], gableSideColor);
  }

  static renderScene(ctx: CanvasRenderingContext2D, spaceKey: string) {
    ctx.clearRect(0, 0, 160, 152);

    switch (spaceKey) {
      case 'room':
        this.drawRoom(ctx);
        break;
      case 'door':
        this.drawDoor(ctx);
        break;
      case 'front':
        this.drawFront(ctx);
        break;
      case 'town':
        this.drawTown(ctx);
        break;
      case 'city':
        this.drawCity(ctx);
        break;
      default:
        this.drawRoom(ctx);
    }
  }

  static drawRoom(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = '#EFE7DA';
    ctx.fillRect(0, 0, 160, 152);

    for (let gx = 0; gx < 7; gx++) {
      for (let gy = 0; gy < 7; gy++) {
        const color = (gx + gy) % 2 === 0 ? '#C9A57C' : '#B98F66';
        this.prism(ctx, gx, gy, 1, 1, 0, color, null, null, 0);
      }
    }

    for (let gy = 0; gy < 7; gy++) {
      this.prism(ctx, 0, gy, 0, 1, 35, '#D5C7B5', '#C5B7A5', null, 0);
    }
    for (let gx = 0; gx < 7; gx++) {
      this.prism(ctx, gx, 0, 1, 0, 35, '#DECFC0', null, '#C5B7A5', 0);
    }

    const w1 = this.isoToScreen(0, 2, 30);
    const w2 = this.isoToScreen(0, 4.5, 30);
    const w3 = this.isoToScreen(0, 4.5, 14);
    const w4 = this.isoToScreen(0, 2, 14);
    this.drawPolygon(ctx, [w1, w2, w3, w4], '#B5D8E8');

    this.prism(ctx, 1, 1, 1.2, 1.2, 8, '#795548', '#6D4C41', '#5D4037');
    this.prism(ctx, 1.3, 1.3, 0.6, 0.6, 6, '#FFFDF9', '#F7D08A', '#E9A63C', 8);

    this.prism(ctx, 1, 3, 2.5, 3.5, 4, '#5C4033', '#4A3328', '#3D2A20');
    this.prism(ctx, 1.1, 3.1, 2.3, 3.3, 4, '#FFFDF9', '#F4ECE1', '#E7DDCE', 4);
    this.prism(ctx, 1.2, 3.2, 2.1, 1.0, 2, '#FFFDF9', '#E0E0E0', '#D5D5D5', 8);
    this.prism(ctx, 1.1, 4.2, 2.3, 2.2, 3, '#8FA9A0', '#7E988F', '#6D877E', 8);
  }

  static drawDoor(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = '#EFE7DA';
    ctx.fillRect(0, 0, 160, 152);

    for (let gx = 0; gx < 7; gx++) {
      for (let gy = 0; gy < 7; gy++) {
        const isElevated = gx >= 3;
        const color = isElevated ? ((gx + gy) % 2 === 0 ? '#D8C3A5' : '#C7B294') : ((gx + gy) % 2 === 0 ? '#A89886' : '#978775');
        const z = isElevated ? 2 : 0;
        this.prism(ctx, gx, gy, 1, 1, 0, color, null, null, z);
      }
    }

    this.prism(ctx, 3, 0, 0.2, 7, 2, '#8D7B68', '#7C6A57', '#6B5946', 0);

    for (let gy = 0; gy < 7; gy++) {
      this.prism(ctx, 0, gy, 0, 1, 40, '#D5C7B5', '#C5B7A5', null, 2);
    }
    for (let gx = 0; gx < 7; gx++) {
      this.prism(ctx, gx, 0, 1, 0, 40, '#DECFC0', null, '#C5B7A5', 2);
    }

    const di1 = this.isoToScreen(1.2, 0, 33);
    const di2 = this.isoToScreen(3.3, 0, 33);
    const di3 = this.isoToScreen(3.3, 0, 2);
    const di4 = this.isoToScreen(1.2, 0, 2);
    this.drawPolygon(ctx, [di1, di2, di3, di4], '#6D877E');

    this.prism(ctx, 0.2, 4, 1.5, 2.5, 16, '#FFFDF9', '#E7DDCE', '#D5C7B5', 2);
    this.prism(ctx, 1, 2, 1.8, 1.2, 0.2, '#E9A63C', null, null, 0.1);
  }

  static drawFront(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = '#BFD8E4';
    ctx.fillRect(0, 0, 160, 152);

    for (let gx = 0; gx < 7; gx++) {
      for (let gy = 0; gy < 7; gy++) {
        const color = (gx + gy) % 2 === 0 ? '#8DB56E' : '#7DA45E';
        this.prism(ctx, gx, gy, 1, 1, 0, color, null, null, 0);
      }
    }

    for (let gx = 0; gx < 7; gx++) {
      this.prism(ctx, gx, 3, 1, 1, 0.1, '#C2B29A', null, null, 0.05);
    }

    this.prism(ctx, 1, 0, 3.5, 2.5, 16, '#FFFDF9', '#E7DDCE', '#D5C7B5', 0);
    this.gableRoof(ctx, 1, 0, 3.5, 2.5, 10, '#C9A57C', '#B98F66', 16);
    this.prism(ctx, 2.2, 2.5, 0.8, 0.1, 7, '#3A3340', '#3A3340', '#6D4C41', 0);
    this.prism(ctx, 5, 4, 0.2, 0.2, 6, '#5A524C', '#4A423C', '#3A322C', 0);
    this.prism(ctx, 4.8, 3.9, 0.6, 0.4, 0.6, '#E9A63C', '#D8952B', '#C7841A', 6);
  }

  static drawTown(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = '#BFD8E4';
    ctx.fillRect(0, 0, 160, 152);

    for (let gx = 0; gx < 7; gx++) {
      for (let gy = 0; gy < 7; gy++) {
        let color = '#8DB56E';
        if (gy >= 2 && gy <= 4) {
          color = '#77777E';
        } else if (gy === 1 || gy === 5) {
          color = '#A89886';
        }
        this.prism(ctx, gx, gy, 1, 1, 0, color, null, null, 0);
      }
    }

    for (let gx = 0; gx < 7; gx++) {
      this.prism(ctx, gx, 3.0, 1, 0.08, 0.1, '#E9A63C', null, null, 0.05);
    }

    this.prism(ctx, 0, 0, 2.5, 1.2, 35, '#9AA3A8', '#889196', '#767F84', 0);
    this.prism(ctx, 3.5, 0, 3, 1.2, 16, '#FFFDF9', '#E7DDCE', '#D5C7B5', 0);
    this.prism(ctx, 3.5, 1.2, 1.5, 0.05, 3, '#8DB56E', '#8DB56E', '#7DA45E', 7);
  }

  static drawCity(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = '#BFD8E4';
    ctx.fillRect(0, 0, 160, 152);

    for (let gx = 0; gx < 7; gx++) {
      for (let gy = 0; gy < 7; gy++) {
        const color = (gx + gy) % 2 === 0 ? '#8DB56E' : '#7DA45E';
        this.prism(ctx, gx, gy, 1, 1, 0, color, null, null, 0);
      }
    }

    this.prism(ctx, 0, 0, 1.5, 0.5, 30, '#A0B0B8', '#8E9EA6', '#7C8C94', 0);
    this.prism(ctx, 2, 0, 2.0, 0.5, 42, '#94A4AC', '#82929A', '#708088', 0);

    for (let gx = 2; gx <= 4; gx++) {
      for (let gy = 2; gy <= 4; gy++) {
        this.prism(ctx, gx, gy, 1, 1, 0.1, '#72A2C0', null, null, -0.1);
      }
    }
  }
}
