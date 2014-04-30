var app = require('express')();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server, { log: false });
var cannon = require('cannon');
var three = require('./three.js');
var types = cannon.Shape.types;

var Universe = function( args ) {
  this.world = args.world || new cannon.World() ;
  this.io = args.io;
};

Universe.prototype = {
  world: null,
  io: null,

  entities: {},
  players: {},

  serialize: function() {
    var update = {
      entities: {},
      world: {
        collisionMatrix: universe.world.collisionMatrix.matrix,
        collisionMatrixPrevious: universe.world.collisionMatrixPrevious.matrix,
      }
    };

    for (var i in universe.entities)
      update.entities[i] = universe.entities[i].serialize();

    return update;
  },

  addPlayer: function( socket ) {
    this.players[socket.id] = { name: 'Mingebag' };
  },

  addEntity: function( entity, socket ) {
    this.world.add(entity.body);
    this.entities[entity.id] = entity;

    if (socket)
      this.players[socket.id].entity = entity.id;

    this.io.sockets.emit('create', entity.serialize());
  },

  removeEntity: function( entity, socket ) {
    this.world.remove(entity.body);
    this.entities[entity.id] = void 0;
    delete this.entities[entity.id];

    if (socket)
      this.players[socket.id].entity = void 0;
    this.io.sockets.emit('destroy', { id: entity.id })
  }
};

var Entity = function( args ) {
  var s = args.body.shape || {
    radius: 1,
    type: types.SPHERE
  }

  this.id = Math.floor(Math.random() * 1000000);
  this.body = new cannon.RigidBody((args.body.mass === void 0)? 3 : args.body.mass , Entity.constructShape(s), args.body.material || void 0);
  this.body.position = Entity.prop('position', args.body.position) || new cannon.Vec3(0,0,0);
  this.body.quaternion = Entity.prop('quaternion', args.body.quaternion) || new cannon.Quaternion(0,0,0,1);
  this.body.velocity = Entity.prop('velocity', args.body.velocity) || new cannon.Vec3(0,0,0);
  this.body.angularVelocity = Entity.prop('angularVelocity', args.body.angularVelocity) || new cannon.Vec3(0,0,0);
};

Entity.prototype = {
  id: null,
  body: null,
  mesh: null,
  universe: null,

  serialize: function() {
    var decompiled = {};

    decompiled.id = this.id;
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
  set: function( property, value, emit) {
    this.body[property] = Entity.prop(property, value)

    var s = { id: this.id };
    s[property] = value;

    if (emit)
      universe.io.sockets.emit('property', s);
  },

  setProperties: function( object, emit ) {
    for (var i in object)
      this.set(i, object[i], false);

    if (emit)
      universe.io.sockets.emit('property', object);
  },
};

Entity.constructShape = function( shape ) {
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

Entity.defaultMesh

Entity.prop = function( property, value ) {
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
    case 'material': 
      return value;
    case 'shape':
      return Entity.constructShape(value);
  }

  // TODO: Shape transforms
  /* if ('shape') return;
  if ('shape'.halfExtents) this.shape.halfExtents = new cannon.Vec3(obj.shape.halfExtents.x, obj.shape.halfExtents.y, obj.shape.halfExtents.z);
  if ('shape'.radius) this.shape.radius = obj.shape.radius;
  if ('shape'.type) this.shape.type = obj.shape.type; */
}

var universe = new Universe({ io: io });

var Grdn = require('./grdn.js');
var grdn = new Grdn(cannon);


server.listen(8080);

setInterval(function() {
  io.sockets.emit('sync', universe.serialize());
}, 1000)

setInterval(function() {
  var key = Object.keys(universe.entities)[Math.floor(Math.random() * (Object.keys(universe.entities).length - 1)) + 1];
  var entity = universe.entities[key];
  
  if (entity.body.shape.type !== types.PLANE) {
    entity.set('velocity', { x: (Math.random() * 10) - 5, y: 20, z: 0 }, true);
    //entity.set('quaternion', { x: Math.random() * 5, y: Math.random() * 5, z: Math.random() * 5, w: 0 });
  }
}, 5000000);

io.sockets.on('error', function(error) {
  log(error);
});

io.sockets.on('connection', function ( socket ) {
  var player = new Entity({
    body: {
      mass: 5,
      material: null,
      shape: { 
        radius: 1.3,
        type: types.SPHERE
      },
      position: {
        x: (Math.random()-0.5)*20,
        y: 1 + (Math.random()-0.5)*1,
        z: 1 + (Math.random()-0.5)*1
      }
    }
  });
  socket.emit('bootstrap', universe.serialize());

  universe.addPlayer(socket);
  universe.addEntity(player, socket);

  socket.on('controls', function(data) {
    //universe.world.players.entity.set('velocity', { x: data.x, y: data.y, z: data.z });
  });

  socket.on('disconnect', function() {
    log(socket.handshake.address.address + ' disconnected');
    universe.removeEntity(player);
  });
  
  log( socket.handshake.address.address + ' connected');
});

function randomEnt() {
  return new Entity({
    body: {
      position: {
        x: (Math.random() - 0.5 ) * 20,
        y: 1 + (Math.random() - 0.5) * 20,
        z: 1 + (Math.random() - 0.5) * 1
      }
    }
  }
  );
}

grdn.configure(universe.world);
physicsMaterial = new cannon.Material("slipperyMaterial");
//world.addContactMaterial(new cannon.ContactMaterial(physicsMaterial, physicsMaterial, 0, 0.3));

// Intentionally non-observational
var ground = new Entity({
  body: {
    mass: 0,
    shape: {
      type: types.PLANE
    },
    position: {
      x: 0,
      y: 0,
      z: -5
    }
  }
});

//ground.material = physicsMaterial;
ground.body.quaternion.setFromAxisAngle(new cannon.Vec3(1, 0, 0), -Math.PI / 2);
universe.addEntity(ground);

var e;
for ( var i = 0; i < 10; i++) {
  e = new Entity({
    body: { 
      position: { x: 0, y: 2 + (2.1 * i), z: 0 },
      shape: {
        halfExtents: { x: 1, y: 1, z: 1 },
        type: types.BOX
      }
    }
  });
  universe.addEntity(e);
}

var ms = 1000 / 60;
var previous = Date.now();
function loop() {
  var now = Date.now();

  if (previous + ms <= now) {
    universe.world.step(ms / 1000);
    previous = now;
  }

  if (now - previous < ms - 16)
    setTimeout(loop);
  else
    setImmediate(loop);
}

loop();

function cors(req, res, next) {
  res.header('Access-Control-Allow-Origin', req.headers.origin);

  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'X-Requested-With, Accept, Origin, Referer, User-Agent, Content-Type, Authorization, X-Session-ID');

  if (req.method === 'OPTIONS')
    res.send(200);
  else
    next();
}

function log(message) {
  io.sockets.emit('log', { message: message });
  console.log(message);
}


app.use(cors);

// Example of adding objects over REST
app.all('/test', function(req, res) {
  e = new Entity({ body: { position: { x: 3, y: 5, z: 3 } } });
  universe.addEntity(e);
  res.json(e);
});