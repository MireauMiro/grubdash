const path = require("path");
const orders = require(path.resolve("src/data/orders-data"));
// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

function list(req, res) {
    res.json({ data: orders });
};

function bodyDataHas(propertyName) {
    return function (req, res, next) {
      const { data = {} } = req.body;
      if (data[propertyName]) {
        return next();
      }
      next({ status: 400, message: `Must include a ${propertyName}` });
    };
  }
  
  function create(req, res) {
    const newId = nextId();
    const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
    const newOrder = {
      id: newId, 
      deliverTo,
      mobileNumber,
      status: "pending",
      dishes,
    };
    orders.push(newOrder);
    res.status(201).json({ data: newOrder });
  }



  function dishIsValid(req, res, next) {
    const { data: { dishes } = {} } = req.body;

    if (!dishes) {
        return next({
            status: 400,
            message: "dish"
        });
    }

    // Check if dishes is an array
    if (!Array.isArray(dishes)) {
        return next({
            status: 400,
            message: "dish"
        });
    }

    // Check if dishes is empty
    if (dishes.length === 0) {
        return next({
            status: 400,
            message: "dish"
        });
    }

    // Check if dishes is empty
    if (dishes.length === 0) {
        return next({
            status: 400,
            message: "dish"
        });
    }

    // Check if dish quantity is greater than 0
    for (let i = 0; i < dishes.length; i++) {
        const dish = dishes[i];
        
        // Check if dish has a quantity property
        if (!dish.hasOwnProperty('quantity')) {
            return next({
                status: 400,
                message: `Dish at index ${i} must have a quantity`
            });
        }        

        if (dish.quantity === 0) {
            return next({
                status: 400,
                message: `Dish at index ${i} must have a quantity`
            });
        }
        
        if (typeof dish.quantity !== 'number') {
            return next({
                status: 400,
                message: `Dish at index ${i} must have a quantity that is a number`
            });        
        }
              
        // Check if dish quantity is an integer and greater than 0
        if (!Number.isInteger(dish.quantity) || dish.quantity <= 0) {
            return next({
                status: 400,
                message: `Dish at index ${i} must have a quantity that is an integer greater than 0`
            });
        }

    }

    next();
}

function statusIsPending(req, res, next) {
    const { status } = req.body.data;
    if (status !== "pending") {
        return next({
            status: 400,
            message: "Order can only be updated when its status is 'pending'.",
        });
    }
    next();
}

function notCompletedOrder(req, res, next) {
    const order = res.locals.order;
    if (order.status !== "pending") {
        return next({
            status: 400,
            message: "Only pending orders can be deleted.",
        });
    }
    next();
}

function orderExists(req, res, next) {
    const { orderId } = req.params;
    const foundOrder = orders.find(order => order.id === orderId);
    if (foundOrder) {
        res.locals.order = foundOrder;
        return next();
    }
    next({
        status: 404,
        message: `Order id not found: ${orderId}`,
    });
};

function read(req, res, next) {
    res.json({ data: res.locals.order });
};

function update(req, res, next) {
    const { orderId } = req.params;
    const order = res.locals.order;
    const { data: { id, deliverTo, mobileNumber, status, dishes } = {} } = req.body;

    // Check if data.id matches with the orderId in the route
    if (id && id !== orderId) {
        return next({
            status: 400,
            message: `data.id: ${id} does not match :orderId in the route: ${orderId}`,
        });
    }
    
    // Check if the orderId matches with the order's id
    if (orderId == order.id) {
    
        // Update the order
        order.deliverTo = deliverTo;
        order.mobileNumber = mobileNumber;
        order.status = status;
        order.dishes = dishes;
  
        return res.json({ data: order });
    }
    
    return next({
        status: 404,
        message: `Order id does not match: ${orderId}`,
    });
};

function destroy(req, res) {
    const { orderId } = req.params;
    const index = orders.findIndex((order) => order.id === Number(orderId));
    // `splice()` returns an array of the deleted elements, even if it is one element
    const deletedOrders = orders.splice(index, 1);
    res.sendStatus(204);
};

module.exports = {
create: [
    bodyDataHas("deliverTo"),
    bodyDataHas("mobileNumber"),
    bodyDataHas("dishes"),
    dishIsValid,
    create
],
list,
read: [orderExists, read],
update: [
    orderExists,
    bodyDataHas("deliverTo"),
    bodyDataHas("mobileNumber"),
    bodyDataHas("status"),
    bodyDataHas("dishes"),
    dishIsValid,
    statusIsPending,
    update
],
delete: [orderExists, notCompletedOrder, destroy],
};