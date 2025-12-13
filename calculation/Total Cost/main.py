# Sets
Nd = ["d0", "d1"]  # depots
Ns = ["s0", "s1"]  # satellites
Nc = ["c0", "c1", "c2"]  # customers
Kd = ["k0", "k1"]  # vehicles based at depots (first echelon)
Ks = ["k2", "k3"]  # vehicles based at satellites (second echelon)
N1 = Nd + Ns  # all nodes in first echelon (union depots and satellites)
N2 = Ns + Nc  # set of nodes in second echelon (union satellites and customers)
Tnc = {j: ["l0", "l1"] for j in Nc}  # products each customer wants Fsi = 5  # Fixed cost of satellite

# Parameters
dist = 67 # distance between arc i,j
fC = {"k0": 5, "k1": 5, "k2": 3, "k3": 3}  # fixed cost per vehicle k
fV = {"k0": 2, "k1": 3, "k2": 4, "k3": 1}  # variable cost factor per km
dist = {(i, j): 67 for i in N1 for j in N1 if i != j}
dist.update({(i, j): 67 for i in N2 for j in N2 if i != j})
Cl = {"l0": 2, "l1": 3}  # price per product l
Ql = {"l0": 4, "l1": 5}  # quantity per product l

# Parameters for C3 (toy values)
fs = {i: 5 for i in Ns}  # opening cost per satellite i (f_s^i)
o = {i: 1 for i in Ns}  # open/close indicator (o_i)

# Decision variables (binary in a real model). Here: simple example values.
X1 = {(i, j, k): 1 for i in Nd for j in Ns for k in Kd}  # depot -> satellite
Y1 = {(j, i, k): 1 for j in Ns for i in Nc for k in Ks}  # satellite -> customer

X2 = {(i, j, k): 1 for i in N1 for j in N1 for k in Kd if i != j}
Y2 = {(i, j, k): 1 for i in N2 for j in N2 for k in Ks if i != j}

X3 = {i: 1 for i in Ns}
Y3 = {j: 1 for j in Nc}  # customer-selection placeholder

def fixed_cost_of_vehicle(X_vars, Y_vars, fixed_costs): #C1
    c1o1 = sum(
        fixed_costs[k] * X_vars[(i, j, k)]
        for i in Nd
        for j in Ns
        for k in Kd
    )

    c1o2 = sum(
        fixed_costs[k] * Y_vars[(j, i, k)]
        for j in Ns
        for i in Nc
        for k in Ks
    )

    return c1o1 + c1o2

def variable_cost_of_vehicle(XX,YY,fix,dist):
    c2o1 = sum(
        dist[(i, j)] * fix[k] * XX[(i, j, k)]
        for i in N1
        for j in N1
        for k in Kd
        if i != j
    )
    c2o2 = sum(
        dist[(i, j)] * fix[k] * YY[(i, j, k)]
        for i in N2
        for j in N2
        for k in Ks
        if i != j
    )
    return c2o1 + c2o2

def customer_cost(fs_map, open_map, products, price, qty):
    open_cost = sum(fs_map[i] * open_map[i] for i in Ns)
    product_cost = sum(
        price[l] * qty[l]
        for j in Nc
        for l in products.get(j, [])
    )

    return open_cost + product_cost

def summing(a,b,c):
    return a+b+c

# print(fixed_cost_of_vehicle(X1, Y1, fC))
# print(variable_cost_of_vehicle(X2, Y2, fV, dist))
# print(customer_cost(fs, o, Tnc, Cl, Ql))

print(summing(fixed_cost_of_vehicle(X1, Y1, fC),variable_cost_of_vehicle(X2, Y2, fV, dist),customer_cost(fs, o, Tnc, Cl, Ql)))