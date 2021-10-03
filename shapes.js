// Declare a plane (2x2)
// Returns [vertices (Float32Array), normals (Float32Array), indices (Uint16Array)] 
//
//  v1------v0
//  |       |
//  |   x   |
//  |       |
//  v2------v3

/*plane = t => {

  
  
  return [vertices, normals, indices];
};


// Declare a cube (2x2x2)
// Returns [vertices (Float32Array), normals (Float32Array), indices (Uint16Array)] 
//
//    v6----- v5
//   /|      /|
//  v1------v0|
//  | |   x | |
//  | |v7---|-|v4
//  |/      |/
//  v2------v3

cube = t => {

  
  
  return [vertices, normals, indices];
};

// Declare a pyramid (base: 2x2 square, sides: equilateral triangles)
// Returns [vertices (Float32Array), normals (Float32Array), indices (Uint16Array)] 
pyramid = () => {
  
  
  return [vertices, normals, indices];
}*/


/*// Draw a model
drawModel = (gl, program, cameraMatrix, modelMatrix, n) => {
  
  // Set the model matrix (add the custom scale if any)
  var model = gl.getUniformLocation(program, 'model');
  gl.uniformMatrix4fv(model, false, modelMatrix.toFloat32Array());

  // Set the cube's mvp matrix (camera x model)
  var mvpMatrix = (new DOMMatrix(modelMatrix)).preMultiplySelf(cameraMatrix);
  var mvp = gl.getUniformLocation(program, 'mvp');
  gl.uniformMatrix4fv(mvp, false, mvpMatrix.toFloat32Array());

  // Set the inverse transpose of the model matrix
  var inverseTransposeMatrix = transpose((new DOMMatrix(modelMatrix)).invertSelf());
  var inverseTranspose = gl.getUniformLocation(program, 'inverseTranspose');
  gl.uniformMatrix4fv(inverseTranspose, false, inverseTransposeMatrix.toFloat32Array());

  // Render
  gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_SHORT, 0);
};*/


