#version 300 es
precision highp float;
in vec4 v_pos, v_col, v_uv, v_normal;
uniform vec3 light;
uniform vec4 o;
uniform sampler2D sampler;
out vec4 c;

void main() {

    c = mix(texture(sampler, v_uv.xy), v_col, o[3]);

    if(o[1] > 0.){
        // output = vec4(base color's RGB * (directional light + ambient light)), base color's Alpha) 
        if(o[0] > 0.){
        c = vec4(c.rgb * (max(dot(light, -normalize(vec3(v_normal.xyz))), 0.0) + o[2]), c.a);
        }
        else {
        c = vec4(c.rgb * (max(dot(light, -normalize(cross(dFdx(v_pos.xyz), dFdy(v_pos.xyz)))), 0.0) + o[2]), c.a);
        }
    }
}