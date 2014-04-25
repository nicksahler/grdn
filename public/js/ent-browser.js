var Ent = function( args ) {
  // TODO: Class-ify
  args = {
    id: args.id,
    body: {
      position: args.body.position || {x: 0, y: 0, z: 0},
      quaternion: args.body.quaternion || {x: 0, y: 0, z: 0, w: 0},
      angularVelocity: args.body.angularVelocity || {x: 0, y: 0, z: 0},
      velocity: args.body.velocity || {x: 0, y: 0, z: 0},
      shape: args.body.shape || ({
        halfExtents: {x: 1, y: 1, z: 1},
        radius: 1,
        type: types.SPHERE
      }),
      mass: (args.body.mass === undefined)?3:args.body.mass
    },
  };

  this.body = Grdn.compile(args.body);
  this.id = args.id;

  //this.setProperties(args.body, false);
};

Ent.prototype = {
  id: null,
  body: null,
  mesh: null,
  universe: null,

  serialize: function() {
    var decompiled = {};

    decompiled.body = {};
    decompiled.body.position = this.body.position;
    decompiled.body.quaternion = this.body.quaternion;
    decompiled.body.velocity = this.body.velocity;
    decompiled.body.angularVelocity = this.body.angularVelocity;
    decompiled.body.mass = this.body.mass;
    decompiled.body.shape = this.body.shape;
    decompiled.body.id = this.body.id;

    return decompiled;
  },

  // TODO: Move out of body 
  set: function( property, value) {
    this.body[property] = Ent.prop(property, value)

    var s = {};
    s[property] = value;

    if (this.universe && emit)
      this.universe.io.sockets.emit('property', s)
  },

  setProperties: function( object ) {
    for (var i in object)
      this.set(i, object[i]);
  },
};

// TODO: Materials
Ent.constructShape = function( shape ) {
  switch ( shape.type ) {
    case types.SPHERE:
      return new cannon.Sphere(shape.radius);
    case types.PLANE:
      return new cannon.Plane();
    case types.BOX:
      return new cannon.Box(new cannon.Vec3(shape.halfExtents.x, shape.halfExtents.y, shape.halfExtents.z));
    case types.COMPOUND:
      return null;
    case types.CONVEXPOLYHEDRON:
      return null;
  }
}

Ent.prop = function( property, value ) {
  // TODO - individual subproperties (x y z etc)
  if (!value) return value;

  switch(property) {
    case 'velocity':  
      return new cannon.Vec3(value.x, value.y, value.z);
    case 'angularVelocity': 
      return new cannon.Vec3(value.x, value.y, value.z);
    case 'position': 
      return new cannon.Vec3(value.x, value.y, value.z);
    case 'quaternion': 
      return new cannon.Quaternion(value.x, value.y, value.z, value.w);
    case 'mass':
      return value;
    // TODO:
    case 'material': 
      return value;
    case 'shape':
      return Ent.constructShape(value);
  }
}