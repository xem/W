// Sphere
//
//          =   =
//       =         =
//      =           =
//     =      x      =
//      =           =
//       =         =
//          =   =

export const Sphere = ((i, ai, j, aj, p1, p2, vertices = [], indices = [], uv = [], precision = 15) => {
    for (j = 0; j <= precision; j++) {
      aj = j * Math.PI / precision;
      for (i = 0; i <= precision; i++) {
        ai = i * 2 * Math.PI / precision;
        vertices.push(+(Math.sin(ai) * Math.sin(aj)/2).toFixed(6), +(Math.cos(aj)/2).toFixed(6), +(Math.cos(ai) * Math.sin(aj)/2).toFixed(6));
        uv.push((Math.sin((i/precision)))*3.5, -Math.sin(j/precision))
        if(i < precision && j < precision){
          p1 = j * (precision+1) + i;
          p2 = p1 + (precision+1);
          indices.push(p1, p2, (p1 + 1), (p1 + 1), p2, (p2 + 1));
        }
      }
    }
    return { vertices, uv, indices }
})();