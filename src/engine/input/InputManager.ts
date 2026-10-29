/**
 * InputManager aggregates continuous keyboard inputs, mouse drag events,
 * and mobile virtual touch inputs into a single normalized control feed.
 */
export class InputManager {
  // Movement input (-1 to 1 for X and Y)
  public moveVector = { x: 0, y: 0 };

  // Keyboard state
  private keys: { [key: string]: boolean } = {};

  // Virtual Joystick input
  private joystickVector = { x: 0, y: 0 };

  // Mouse camera rotation state
  private isMouseDown = false;
  private lastMouseX = 0;
  private lastMouseY = 0;

  // Pending camera deltas
  public deltaYaw = 0;
  public deltaPitch = 0;

  // Action triggers
  public onAttack?: () => void;
  public onDodge?: () => void;
  public onAction?: () => void;

  private domElement: HTMLElement | null = null;

  constructor() {
    this.bindKeyboard();
  }

  public attachToElement(element: HTMLElement) {
    this.domElement = element;
    this.bindMouseAndTouch(element);
  }

  private bindKeyboard() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      if (e.code === 'Space') {
        e.preventDefault();
        if (this.onAttack) this.onAttack();
      }
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        e.preventDefault();
        if (this.onDodge) this.onDodge();
      }
      if (e.code === 'KeyE') {
        if (this.onAction) this.onAction();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    window.addEventListener('blur', () => {
      this.keys = {};
      this.moveVector.x = 0;
      this.moveVector.y = 0;
    });
  }

  private bindMouseAndTouch(element: HTMLElement) {
    element.addEventListener('pointerdown', (e) => {
      // Ignore if clicking on UI overlay controls
      if ((e.target as HTMLElement).closest('.touch-control')) return;

      this.isMouseDown = true;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    });

    window.addEventListener('pointermove', (e) => {
      if (!this.isMouseDown) return;
      const dx = e.clientX - this.lastMouseX;
      const dy = e.clientY - this.lastMouseY;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;

      this.deltaYaw += dx * 0.005;
      this.deltaPitch += dy * 0.005;
    });

    window.addEventListener('pointerup', () => {
      this.isMouseDown = false;
    });
  }

  /**
   * Set by VirtualJoystick component on mobile.
   */
  public setJoystickInput(x: number, y: number) {
    this.joystickVector.x = x;
    this.joystickVector.y = y;
  }

  /**
   * Add touch camera delta from mobile swipe zone.
   */
  public addCameraDelta(dx: number, dy: number) {
    this.deltaYaw += dx * 0.005;
    this.deltaPitch += dy * 0.005;
  }

  /**
   * Evaluates current combined movement vector from keyboard and virtual joystick.
   */
  public update() {
    let kx = 0;
    let ky = 0;

    if (this.keys['KeyW'] || this.keys['ArrowUp']) ky += 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) ky -= 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) kx -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) kx += 1;

    // Merge keyboard and joystick
    let finalX = kx !== 0 ? kx : this.joystickVector.x;
    let finalY = ky !== 0 ? ky : this.joystickVector.y;

    // Normalize diagonal magnitude
    const len = Math.sqrt(finalX * finalX + finalY * finalY);
    if (len > 1.0) {
      finalX /= len;
      finalY /= len;
    }

    this.moveVector.x = finalX;
    this.moveVector.y = finalY;
  }

  /**
   * Consumes and resets the accumulated camera rotation deltas.
   */
  public consumeCameraDeltas(): { yaw: number; pitch: number } {
    const yaw = this.deltaYaw;
    const pitch = this.deltaPitch;
    this.deltaYaw = 0;
    this.deltaPitch = 0;
    return { yaw, pitch };
  }

  public dispose() {
    // Cleanup references
    this.domElement = null;
    this.keys = {};
  }
}
