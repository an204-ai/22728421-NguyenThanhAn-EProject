require("dotenv").config();

module.exports = {
  port: process.env.PORT || 3001,
  mongoURI: process.env.MONGODB_PRODUCT_URI || "mongodb://mongo:27017/product",
  rabbitMQURI: process.env.RABBITMQ_URI || "amqp://guest:guest@rabbitmq:5672",
  exchangeName: "products",
  queueName: "products_queue",
};
