// Create a perspective matrix
// options: fov in degrees, aspect, near, far
// return: DOMMatrix
perspective = options => {
  var fov = options.fov || 85;
  fov = fov * Math.PI / 180;       // fov in radians
  var aspect = options.ratio || 1; // canvas.width / canvas.height
  var near = options.near || 0.01; // can't be 0
  var far = options.far || 100;
  var f = 1 / Math.tan(fov);
  var nf = 1 / (near - far);
  return new DOMMatrix([
    f / aspect, 0, 0, 0, 
    0, f, 0, 0, 
    0, 0, (far + near) * nf, -1,
    0, 0, (2 * near * far) * nf, 0
  ]);
}

// Create an orthogonal matrix
// options: top, bottom, left, right, near, far
// return: DOMMatrix
/*orthogonal = options => {
  var top = options.top;
  var bottom = options.bottom;
  var left = options.left;
  var right = options.right;
  var near = options.near || 0;
  var far = options.far || 100;
  var rw = 1 / (right - left);
  var rh = 1 / (top - bottom);
  var rd = 1 / (far - near);
  return new DOMMatrix([
    2 * rw, 0, 0, 0,
    0, 2 * rh, 0, 0,
    0, 0, -2 * rd, 0,
    -(right + left) * rw, -(top + bottom) * rh, -(far + near) * rd, 1
  ]);
}*/

// Transpose a DOMMatrix
transpose = m => {
  return new DOMMatrix([
    m.m11, m.m21, m.m31, m.m41,
    m.m12, m.m22, m.m32, m.m42,
    m.m13, m.m23, m.m33, m.m43,
    m.m14, m.m24, m.m34, m.m44,
  ]);
};

/*// Create a matrix representing a rotation around an arbitrary axis [x, y, z]
fromRotation = (axis, angle) => {

  var x = axis[0], y = axis[1], z = axis[2];
  var len = Math.hypot(x, y, z);
  var s, c, t;
  
  if (len == 0) return null;

  len = 1 / len;
  x *= len;
  y *= len;
  z *= len;

  s = Math.sin(angle);
  c = Math.cos(angle);
  t = 1 - c;

  return new DOMMatrix([
    x * x * t + c,      y * x * t + z * s,  z * x * t - y * s,   0,
    x * y * t - z * s,  y * y * t + c,      z * y * t + x * s,   0,
    x * z * t + y * s,  y * z * t - x * s,  z * z * t + c,       0,
    0, 0, 0, 1
  ]);
};

// Apply a matrix transformation to a custom axis
axisTransformMatrix = (a, m) => {
  let x = a[0], y = a[1], z = a[2];
  let w = (m.m14 * x + m.m24 * y + m.m34 * z + m.m44) || 1.0;
  
  return new Float32Array([
    (m.m11 * x + m.m21 * y + m.m31 * z + m.m41) / w,
    (m.m12 * x + m.m22 * y + m.m32 * z + m.m42) / w,
    (m.m13 * x + m.m23 * y + m.m33 * z + m.m43) / w
  ]);
}*/

// LookAt generates a matrix corresponding to a camera placed at a given point and looking at a target point.
// options: camera position (cameraX, cameraY, cameraZ), target (targetX, targetY, targetZ), up vector (upX, upY, upZ, optional, verticl by default)
// return: DOMMatrix
/*lookAt = (cameraX, cameraY, cameraZ, targetX, targetY, targetZ, upX = 0, upY = 1, upZ = 0) => {
  var e, fx, fy, fz, rlf, sx, sy, sz, rls, ux, uy, uz;
  fx = targetX - cameraX;
  fy = targetY - cameraY;
  fz = targetZ - cameraZ;
  rlf = 1 / Math.hypot(fx, fy, fz);
  fx *= rlf;
  fy *= rlf;
  fz *= rlf;
  sx = fy * upZ - fz * upY;
  sy = fz * upX - fx * upZ;
  sz = fx * upY - fy * upX;
  rls = 1 / Math.hypot(sx, sy, sz);
  sx *= rls;
  sy *= rls;
  sz *= rls;
  ux = sy * fz - sz * fy;
  uy = sz * fx - sx * fz;
  uz = sx * fy - sy * fx;
  var ret = new DOMMatrix([
    sx, ux, -fx, 0,
    sy, uy, -fy, 0,
    sz, uz, -fz, 0,
    0,  0,  0,   1
  ]);
  return ret.translateSelf(-cameraX, -cameraY, -cameraZ);
}
*/