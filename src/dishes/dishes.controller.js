const path = require("path");
const dishes = require(path.resolve("src/data/dishes-data"));
// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

function list(req, res) {
    res.json({ data: dishes });
};

function bodyDataHas(propertyName) {
    return function (req, res, next) {
        const { data = {} } = req.body;
        if (data[propertyName]) {
        return next();
        }
        next({ status: 400, message: `Must include a ${propertyName}` });
    };
};

function create(req, res) {
    const newId = nextId();
    const { data: { name, description, price, image_url } = {} } = req.body;
    const newDish = {
      id: newId, // Increment last id then assign as the current ID
      name,
      description,
      price,
      image_url,
    };
    dishes.push(newDish);
    res.status(201).json({ data: newDish });
};


function priceIsValid(req, res, next) {
    const { data: { price } = {} } = req.body;

    if (!price) {
        return next({
            status: 400,
            message: "Price is required and cannot be empty."
        });
    }

    // Check if price is a number
    if (typeof price !== 'number') {
        return next({
            status: 400,
            message: "price"
        });
    }

    // Check if price is greater than 0
    if (price <= 0) {
        return next({
            status: 400,
            message: "price"
        });
    }

    next();
}
  
function dishIdMatches(req, res, next) {
    const { dishId } = req.params;
    const { data: { id } = {} } = req.body;

    if (id && dishId !== id) {
        return next({
            status: 400,
            message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`
        });
    }

    next();
}   
  
  function expirationIsValidNumber(req, res, next){
    const { data: { expiration }  = {} } = req.body;
    if (expiration <= 0 || !Number.isInteger(expiration)){
        return next({
            status: 400,
            message: `Expiration requires a valid number`
        });
    }
    next();
  }

function dishExists(req, res, next) {
    const { dishId } = req.params;
    const foundDish = dishes.find(dish => dish.id === dishId);
    if (foundDish) {
      res.locals.dish = foundDish;
      return next();
    }
    next({
      status: 404,
      message: `Dish does not exist: ${dishId}`,
    });
};

function read(req, res, next) {
    res.json({ data: res.locals.dish });
};

function update(req, res) {
    const dish = res.locals.dish;
    const { data: { name, description, price, image_url } = {} } = req.body;
  
    // Update the dish
    dish.name = name;
    dish.description = description;
    dish.price = price;
    dish.image_url = image_url;
  
    res.json({ data: dish });
  
};

module.exports = {
    create: [
        bodyDataHas("name"),
        bodyDataHas("description"),
        bodyDataHas("price"),
        bodyDataHas("image_url"),
        priceIsValid,
        create
    ],
    list,
    read: [dishExists, read],
    update: [
        dishExists,
        dishIdMatches,
        bodyDataHas("name"),
        bodyDataHas("description"),
        bodyDataHas("price"),
        bodyDataHas("image_url"),
        priceIsValid,
        update
    ],
};