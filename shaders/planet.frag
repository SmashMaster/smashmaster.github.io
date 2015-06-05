/* Author: Samuel Johnson (SmashMaster) */
/* Copyright: 2014 Samuel Johnson */
/* License: https://github.com/SmashMaster/smashmaster.github.io/blob/master/LICENSE */

precision lowp float;

uniform vec3 u_sun_light_color;
uniform float u_sun_radius;
uniform float u_moon_radius;
uniform vec2 u_sun_pos;
uniform vec2 u_moon_pos;

varying vec2 v_pos;

#define AA_SIZE (1.0/12.0)
#define AA_THRESHOLD (1.0 - AA_SIZE)

/**
 * Projects two spheres onto a unit sphere around p, whose positions are defined
 * by s0 and s1, and whose radii are defined by r0 and r1. Returns their projected
 * areas (as a fraction of the total solid angle) in fc0 and fc1. Returns the
 * fractional coverage of their intersection.
 */
float fractionalCoverage(vec3 p, vec3 s0, float r0, vec3 s1, float r1,
        out float fc0, out float fc1) {
    s0 -= p; s1 -= p;
    float rd0 = r0/sqrt(s0.x*s0.x + s0.y*s0.y);
    float rd1 = r1/sqrt(s1.x*s1.x + s1.y*s1.y);
    fc0 = 0.5 - sqrt(1.0 - rd0)*0.5;
    fc1 = 0.5 - sqrt(1.0 - rd1)*0.5;
    
    //Compute great-circle distance and angular radii
    float theta = atan(length(cross(s0,s1)), dot(s0, s1));
    float ar0 = asin(rd0);
    float ar1 = asin(rd1);
    float arSum = ar0+ar1;
    
    if (theta > arSum) {
        return 0.0;
    }
    
    float fcMin = min(fc0, fc1);
    float arDif = abs(ar0 - ar1);
    
    if (theta < arDif) {
        return fcMin;
    }
    
    //Return approximate fractional overlap
    return fcMin*smoothstep(0.0, 1.0, 1.0 - (theta - arDif)/(arSum - arDif));
}

void main() {
    float r = v_pos.x*v_pos.x + v_pos.y*v_pos.y;
    if (r >= 1.0) {
        gl_FragColor = vec4(0.0);
    }
    else {
        r = sqrt(r);
        
        vec3 normal = vec3(v_pos, sqrt(1.0 - r));
        vec3 lightDir = normalize(vec3(u_sun_pos - v_pos, 0.0));
        
        float moonCoverage, sunCoverage;
        float moonSunOverlap = fractionalCoverage(normal,
                vec3(u_moon_pos, 0.0), u_moon_radius, vec3(u_sun_pos, 0.0), u_sun_radius,
                moonCoverage, sunCoverage);
        
        float b = dot(normal, lightDir)*(sunCoverage - moonSunOverlap);
        gl_FragColor = vec4(u_sun_light_color*b, 1.0);
        
        if (r > AA_THRESHOLD) {
            gl_FragColor *= (1.0-r)/AA_SIZE;
        }
    }
}
