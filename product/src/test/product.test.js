// 

const chai = require("chai");
const chaiHttp = require("chai-http");
const mongoose = require("mongoose");
const App = require("../app");
const Product = require("../models/product");

// Mock messageBroker để không cần RabbitMQ thật
const messageBroker = require("../utils/messageBroker");
const sinon = require("sinon");

const { expect } = chai;
chai.use(chaiHttp);

describe("Product Service", function () {
  this.timeout(30000);
  let app, server, token = "Bearer faketoken";
  let createdProduct, orderId;

  before(async () => {
    // mock publishMessage và consumeMessage
    sinon.stub(messageBroker, "publishMessage").resolves();
    sinon.stub(messageBroker, "consumeMessage").callsFake((queue, callback) => {
      setTimeout(() => {
        callback({ orderId, status: "completed" });
      }, 1000);
    });

    app = new App();
    await app.connectDB();
    server = app.app.listen(4001, () => console.log("Product test server started"));
    await Product.deleteMany({});
  });

  after(async () => {
    await Product.deleteMany({});
    await mongoose.disconnect();
    server.close();
    sinon.restore();
  });

  describe("POST /products", () => {
    it("should create a new product", async () => {
      const res = await chai
        .request(server)
        .post("/products")
        .set("Authorization", token)
        .send({
          name: "Test Product",
          description: "A product for testing",
          price: 100,
          quantity: 5,
        });

      expect(res).to.have.status(201);
      expect(res.body).to.have.property("_id");
      createdProduct = res.body;
    });

    it("should return 400 if validation fails", async () => {
      const res = await chai
        .request(server)
        .post("/products")
        .set("Authorization", token)
        .send({ name: "", price: "abc" }); // sai dữ liệu

      expect(res).to.have.status(400);
    });

    it("should return 401 if missing token", async () => {
      const res = await chai
        .request(server)
        .post("/products")
        .send({ name: "Unauthorized Product", price: 100 });
      expect(res).to.have.status(401);
    });
  });

  describe("GET /products", () => {
    it("should return all products", async () => {
      const res = await chai
        .request(server)
        .get("/products")
        .set("Authorization", token);

      expect(res).to.have.status(200);
      expect(res.body).to.be.an("array");
    });
  });

  describe("GET /products/:id", () => {
    it("should return a product by ID", async () => {
      const res = await chai
        .request(server)
        .get(`/products/${createdProduct._id}`)
        .set("Authorization", token);

      expect(res).to.have.status(200);
      expect(res.body).to.have.property("_id", createdProduct._id);
    });
  });

  describe("POST /orders", () => {
    it("should create a new order and wait until completed", async () => {
      const res = await chai
        .request(server)
        .post("/orders")
        .set("Authorization", token)
        .send({ ids: [createdProduct._id] });

      expect(res).to.have.status(201);
      expect(res.body).to.have.property("status", "completed");
      orderId = res.body.orderId;
    });

    it("should return 401 if missing token", async () => {
      const res = await chai
        .request(server)
        .post("/orders")
        .send({ ids: [createdProduct._id] });
      expect(res).to.have.status(401);
    });
  });

  describe("GET /orders/:orderId", () => {
    it("should return order status", async () => {
      const res = await chai
        .request(server)
        .get(`/orders/${orderId}`)
        .set("Authorization", token);

      expect(res).to.have.status(200);
      expect(res.body).to.have.property("status");
    });

    it("should return 404 if order not found", async () => {
      const res = await chai
        .request(server)
        .get("/orders/nonexistentid")
        .set("Authorization", token);

      expect(res).to.have.status(404);
    });
  });
});
