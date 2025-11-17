/**
 * Mathematical classes for 3D operations
 * Converted from interfaces to classes for better encapsulation and methods
 */

export class Vector3 {
  constructor(
    public x: number = 0,
    public y: number = 0,
    public z: number = 0,
  ) {}

  static zero(): Vector3 {
    return new Vector3(0, 0, 0);
  }

  static one(): Vector3 {
    return new Vector3(1, 1, 1);
  }

  clone(): Vector3 {
    return new Vector3(this.x, this.y, this.z);
  }

  add(v: Vector3): Vector3 {
    return new Vector3(this.x + v.x, this.y + v.y, this.z + v.z);
  }

  subtract(v: Vector3): Vector3 {
    return new Vector3(this.x - v.x, this.y - v.y, this.z - v.z);
  }

  multiply(scalar: number): Vector3 {
    return new Vector3(this.x * scalar, this.y * scalar, this.z * scalar);
  }

  divide(scalar: number): Vector3 {
    return new Vector3(this.x / scalar, this.y / scalar, this.z / scalar);
  }

  dot(v: Vector3): number {
    return this.x * v.x + this.y * v.y + this.z * v.z;
  }

  cross(v: Vector3): Vector3 {
    return new Vector3(
      this.y * v.z - this.z * v.y,
      this.z * v.x - this.x * v.z,
      this.x * v.y - this.y * v.x,
    );
  }

  length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }

  lengthSquared(): number {
    return this.x * this.x + this.y * this.y + this.z * this.z;
  }

  normalize(): Vector3 {
    const len = this.length();
    return len === 0 ? Vector3.zero() : this.divide(len);
  }

  distance(v: Vector3): number {
    return this.subtract(v).length();
  }

  lerp(v: Vector3, t: number): Vector3 {
    return new Vector3(
      this.x + (v.x - this.x) * t,
      this.y + (v.y - this.y) * t,
      this.z + (v.z - this.z) * t,
    );
  }

  toArray(): [number, number, number] {
    return [this.x, this.y, this.z];
  }

  toJSON(): { x: number; y: number; z: number } {
    return { x: this.x, y: this.y, z: this.z };
  }

  static fromJSON(json: { x: number; y: number; z: number }): Vector3 {
    return new Vector3(json.x, json.y, json.z);
  }
}

export class Quaternion {
  constructor(
    public x: number = 0,
    public y: number = 0,
    public z: number = 0,
    public w: number = 1,
  ) {}

  static identity(): Quaternion {
    return new Quaternion(0, 0, 0, 1);
  }

  clone(): Quaternion {
    return new Quaternion(this.x, this.y, this.z, this.w);
  }

  multiply(q: Quaternion): Quaternion {
    const x = this.x * q.w + this.w * q.x + this.y * q.z - this.z * q.y;
    const y = this.y * q.w + this.w * q.y + this.z * q.x - this.x * q.z;
    const z = this.z * q.w + this.w * q.z + this.x * q.y - this.y * q.x;
    const w = this.w * q.w - this.x * q.x - this.y * q.y - this.z * q.z;
    return new Quaternion(x, y, z, w);
  }

  conjugate(): Quaternion {
    return new Quaternion(-this.x, -this.y, -this.z, this.w);
  }

  length(): number {
    return Math.sqrt(
      this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w,
    );
  }

  normalize(): Quaternion {
    const len = this.length();
    return len === 0
      ? Quaternion.identity()
      : new Quaternion(this.x / len, this.y / len, this.z / len, this.w / len);
  }

  toArray(): [number, number, number, number] {
    return [this.x, this.y, this.z, this.w];
  }

  toJSON(): { x: number; y: number; z: number; w: number } {
    return { x: this.x, y: this.y, z: this.z, w: this.w };
  }

  static fromJSON(json: {
    x: number;
    y: number;
    z: number;
    w: number;
  }): Quaternion {
    return new Quaternion(json.x, json.y, json.z, json.w);
  }

  static fromEuler(x: number, y: number, z: number): Quaternion {
    const c1 = Math.cos(x / 2);
    const c2 = Math.cos(y / 2);
    const c3 = Math.cos(z / 2);
    const s1 = Math.sin(x / 2);
    const s2 = Math.sin(y / 2);
    const s3 = Math.sin(z / 2);

    return new Quaternion(
      s1 * c2 * c3 + c1 * s2 * s3,
      c1 * s2 * c3 - s1 * c2 * s3,
      c1 * c2 * s3 + s1 * s2 * c3,
      c1 * c2 * c3 - s1 * s2 * s3,
    );
  }
}

export class BoundingBox {
  constructor(
    public min: Vector3 = Vector3.zero(),
    public max: Vector3 = Vector3.zero(),
  ) {}

  static fromPoints(points: Vector3[]): BoundingBox {
    if (points.length === 0) {
      return new BoundingBox();
    }

    const min = new Vector3(
      Math.min(...points.map((p) => p.x)),
      Math.min(...points.map((p) => p.y)),
      Math.min(...points.map((p) => p.z)),
    );

    const max = new Vector3(
      Math.max(...points.map((p) => p.x)),
      Math.max(...points.map((p) => p.y)),
      Math.max(...points.map((p) => p.z)),
    );

    return new BoundingBox(min, max);
  }

  get center(): Vector3 {
    return new Vector3(
      (this.min.x + this.max.x) / 2,
      (this.min.y + this.max.y) / 2,
      (this.min.z + this.max.z) / 2,
    );
  }

  get size(): Vector3 {
    return new Vector3(
      this.max.x - this.min.x,
      this.max.y - this.min.y,
      this.max.z - this.min.z,
    );
  }

  clone(): BoundingBox {
    return new BoundingBox(this.min.clone(), this.max.clone());
  }

  contains(point: Vector3): boolean {
    return (
      point.x >= this.min.x &&
      point.x <= this.max.x &&
      point.y >= this.min.y &&
      point.y <= this.max.y &&
      point.z >= this.min.z &&
      point.z <= this.max.z
    );
  }

  intersects(box: BoundingBox): boolean {
    return (
      this.min.x <= box.max.x &&
      this.max.x >= box.min.x &&
      this.min.y <= box.max.y &&
      this.max.y >= box.min.y &&
      this.min.z <= box.max.z &&
      this.max.z >= box.min.z
    );
  }

  expand(point: Vector3): void {
    this.min.x = Math.min(this.min.x, point.x);
    this.min.y = Math.min(this.min.y, point.y);
    this.min.z = Math.min(this.min.z, point.z);
    this.max.x = Math.max(this.max.x, point.x);
    this.max.y = Math.max(this.max.y, point.y);
    this.max.z = Math.max(this.max.z, point.z);
  }

  toJSON(): {
    min: { x: number; y: number; z: number };
    max: { x: number; y: number; z: number };
    center: { x: number; y: number; z: number };
    size: { x: number; y: number; z: number };
  } {
    return {
      min: this.min.toJSON(),
      max: this.max.toJSON(),
      center: this.center.toJSON(),
      size: this.size.toJSON(),
    };
  }

  static fromJSON(json: {
    min: { x: number; y: number; z: number };
    max: { x: number; y: number; z: number };
  }): BoundingBox {
    return new BoundingBox(
      Vector3.fromJSON(json.min),
      Vector3.fromJSON(json.max),
    );
  }
}
