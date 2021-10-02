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

// Transpose a DOMMatrix
transpose = m => {
  return new DOMMatrix([
    m.m11, m.m21, m.m31, m.m41,
    m.m12, m.m22, m.m32, m.m42,
    m.m13, m.m23, m.m33, m.m43,
    m.m14, m.m24, m.m34, m.m44,
  ]);
};

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

