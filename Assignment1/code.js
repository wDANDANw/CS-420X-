// Draw Net Reference: https://www.youtube.com/watch?v=3CycKKJiwis
// The original repo is very universe feeling, and therefore I tried to try and learn with it 

// I have tried to update this to rand / fbm, but the shape of dots will vary. Therefore, this is seemingly the best way to go

// A Simple Noise Map (Fixed)
vec2 Noise(vec2 p) {
    float n = snoise (p);
    return vec2 (n, noise (p+n));
}

// Get position of points in one grid
vec2 GetPos(vec2 id, vec2 offset) {
    vec2 n = Noise(id+offset) * time * 4.;
    n.x += sin(bands.x) * rand(12.);
    n.y += cos(bands.y) * fbm (n.x, 13);
    
    rotate(vec2(bands.x, bands.y), n, rand(10.));
    
    return offset + sin(n) * 0.2;
}

// Distance of line tp point
float DistLine(vec2 p, vec2 a, vec2 b) {
    vec2 pa = p-a;
    vec2 ba = b-a;
    float t = clamp (dot (pa, ba) / dot (ba, ba), 0., 1.);
    return length (pa - ba * t);
}

float DrawLine(vec2 p, vec2 a, vec2 b) {
    float d = DistLine(p, a, b);
    float m = smoothstep(.01, .005 , d);
    m *= smoothstep(.9, .6, length(a-b));
    return m;
}

float DrawNet(vec2 p) {
    float m = 0.;
    
    // Separate the canvas to grids
    vec2 gv = fract(p) - .5; // Relative to Grid
    vec2 id = floor(p); // ID of the grid
    
    // *** First trial of drawing points ***
    
    // vec2 randP = vec2(rand(1.) - 0.5, rand(1.) - 0.5);
    // vec2 randP = GetPos(id);
    
    // float d = length(gv- randP);
    // m = smoothstep(.1, .05, d);
    
    // *** End of first trial of drawing points ***
    
    
    vec2 pa[9]; // This is the grid of points
    // This version of webgl does not support non-constant expression at index of arrays
    pa[0] = GetPos(id, vec2(-1, -1));
    pa[1] = GetPos(id, vec2(-1, 0));
    pa[2] = GetPos(id, vec2(-1, 1));
    pa[3] = GetPos(id, vec2(0, -1));
    pa[4] = GetPos(id, vec2(0, 0));
    pa[5] = GetPos(id, vec2(0, 1));
    pa[6] = GetPos(id, vec2(1, -1));
    pa[7] = GetPos(id, vec2(1, 0));
    pa[8] = GetPos(id, vec2(1, 1));
    
    
    // Use the grid of points to draw the net
    for (int i=0; i<9; i++) {
        m += DrawLine(gv, pa[4], pa[i]);
        
        vec2 j = (pa[i] - gv) * 18.;
        float sparkle = 1. / dot(j, j);
        
        m += sparkle * (sin(time * 10. + pa[i].x * 10.) *.5 + .5);
    }
    
    m += DrawLine(gv, pa[1], pa[3]);
    m += DrawLine(gv, pa[1], pa[5]);
    m += DrawLine(gv, pa[7], pa[3]);
    m += DrawLine(gv, pa[7], pa[5]);
    
    return m;
    
}

float RandModifier;
float MyRandModifier(float x) {
    
    float randomFactor = rand(x);
    float determinator = mod(time / 5., 5.);
    int randomInt = int(floor(determinator));
    
    float randModifiers[5];
    
    randModifiers[0] = sin(noise(randomFactor) + bands.y);
    randModifiers[1] = cos(voronoi(vec2(randomFactor, randModifiers[0])) * 0.3 + bands.x);
    randModifiers[2] = snoise(vec2(bands.z, randModifiers[1])) * 0.3 + noise(bands.x);
    randModifiers[3] = fbm(randomFactor, randomInt) * 0.3 + noise(bands.y);
    randModifiers[4] = circle(randModifiers[0], randModifiers[1], 1.0, DistLine(uv() * 3., vec2(bands.z,bands.y), vec2(bands.y, bands.x)));

    if (determinator < 1.) {
        return randModifiers[0];
    } else if (determinator < 2.) {
        return randModifiers[1];
    } else if (determinator < 3.) {
        return randModifiers[2];
    } else if (determinator < 4.) {
        return randModifiers[3];
    } else {
        return randModifiers[4];
    }

}



// The Wave
float DrawWave() {
    float wave = 0.;
    
    vec2 p = uv() * 3.5;
    float frequency = 3.;
    float gain = 1.;
    float thickness = .2;
    
    p.y += (sin (1. * 20. + bands.x * 5.0 + time * 6. + p.x * 1.5) * bands.y * 3.5);
    
    p.y += sin( p.x * frequency + time * 1.) * gain;
    
    p.y += MyRandModifier(p.y * bands.y * 3.0 + bands.x * 1.5 + 2.);
    
    wave = abs( thickness / p.y );
    

    
    
    
    return wave;
}

void main () {
    
    // Draw the net
    vec2 netP = uv() * 2.5; // Zoom
    float net = DrawNet(netP);
    
    // A wave for the song
    float wave = DrawWave();
    
    float color = net +wave;
    
    gl_FragColor = vec4(color);
}
