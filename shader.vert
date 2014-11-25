attribute vec2 in_pos;

varying vec2 v_pos;

void main(void) {
    v_pos = in_pos;
    gl_Position = vec4(in_pos, 0.0, 1.0);
}