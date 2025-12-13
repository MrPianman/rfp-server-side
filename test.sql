-- Core entities
CREATE TABLE depot (
  depot_id TEXT PRIMARY KEY
);

CREATE TABLE satellite (
  satellite_id TEXT PRIMARY KEY,
  open_cost NUMERIC NOT NULL,   -- fs
  is_open BOOLEAN NOT NULL      -- o
);

CREATE TABLE customer (
  customer_id TEXT PRIMARY KEY
);

CREATE TABLE vehicle (
  vehicle_id TEXT PRIMARY KEY,
  tier TEXT NOT NULL CHECK (tier IN ('depot','satellite')),
  fixed_cost NUMERIC NOT NULL,      -- fC
  variable_cost_per_km NUMERIC NOT NULL -- fV
);

CREATE TABLE product (
  product_id TEXT PRIMARY KEY,
  price NUMERIC NOT NULL,       -- Cl
  quantity NUMERIC NOT NULL     -- Ql
);

-- Customer-product demand (Tnc)
CREATE TABLE customer_product (
  customer_id TEXT REFERENCES customer(customer_id),
  product_id TEXT REFERENCES product(product_id),
  PRIMARY KEY (customer_id, product_id)
);

-- Distances (covers both echelons; store all directed arcs)
CREATE TABLE distance (
  from_node TEXT NOT NULL,
  to_node   TEXT NOT NULL,
  km        NUMERIC NOT NULL,
  PRIMARY KEY (from_node, to_node)
);

-- Decision variables (routes). Use NUMERIC/BOOLEAN depending on solver integration.
-- X1: depot -> satellite (Kd vehicles)
CREATE TABLE route_depot_satellite (
  depot_id TEXT REFERENCES depot(depot_id),
  satellite_id TEXT REFERENCES satellite(satellite_id),
  vehicle_id TEXT REFERENCES vehicle(vehicle_id),
  active NUMERIC NOT NULL, -- 0/1
  PRIMARY KEY (depot_id, satellite_id, vehicle_id)
);

-- Y1: satellite -> customer (Ks vehicles)
CREATE TABLE route_satellite_customer (
  satellite_id TEXT REFERENCES satellite(satellite_id),
  customer_id TEXT REFERENCES customer(customer_id),
  vehicle_id TEXT REFERENCES vehicle(vehicle_id),
  active NUMERIC NOT NULL, -- 0/1
  PRIMARY KEY (satellite_id, customer_id, vehicle_id)
);

-- X2: all N1 arcs with depot-tier vehicles (general first-echelon arcs)
CREATE TABLE route_first_echelon (
  from_node TEXT NOT NULL,
  to_node   TEXT NOT NULL,
  vehicle_id TEXT REFERENCES vehicle(vehicle_id),
  active NUMERIC NOT NULL, -- 0/1
  PRIMARY KEY (from_node, to_node, vehicle_id)
);

-- Y2: all N2 arcs with satellite-tier vehicles (second-echelon arcs)
CREATE TABLE route_second_echelon (
  from_node TEXT NOT NULL,
  to_node   TEXT NOT NULL,
  vehicle_id TEXT REFERENCES vehicle(vehicle_id),
  active NUMERIC NOT NULL, -- 0/1
  PRIMARY KEY (from_node, to_node, vehicle_id)
);

-- X3: satellites used
CREATE TABLE satellite_use (
  satellite_id TEXT PRIMARY KEY REFERENCES satellite(satellite_id),
  active NUMERIC NOT NULL -- 0/1
);

-- Y3: customers served
CREATE TABLE customer_use (
  customer_id TEXT PRIMARY KEY REFERENCES customer(customer_id),
  active NUMERIC NOT NULL -- 0/1
);