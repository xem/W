// Plane / billboard
//
//  v1------v0
//  |       |
//  |   x   |
//  |       |
//  v2------v3

W.models.plane = W.models.billboard = {
    vertices: [
      .5, .5, 0,    -.5, .5, 0,   -.5,-.5, 0,
      .5, .5, 0,    -.5,-.5, 0,    .5,-.5, 0
    ],
    
    uv: [
      1, 1,     0, 1,    0, 0,
      1, 1,     0, 0,    1, 0
    ],
  };
  W.plane = settings => W.setState(settings, 'plane');
  W.billboard = settings => W.setState(settings, 'billboard');