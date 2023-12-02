#version 300 es
precision highp float;
in vec4 pos, col, uv, normal;
uniform mat4 pv, eye, m, im;
uniform vec4 bb;
out vec4 v_pos, v_col, v_uv, v_normal;

void main() {
    gl_Position = pv * (
        v_pos = bb.z > 0.
        ? m[3] + eye * (pos * bb)
        : m * pos
    );
    v_col = col;
    v_uv = uv;
    v_normal = transpose(inverse(m)) * normal;
}