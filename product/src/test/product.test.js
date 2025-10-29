const chai = require("chai");
const chaiHttp = require("chai-http");
const App = require("../app");
const mongoose = require("mongoose");
require("dotenv").config();

chai.use(chaiHttp);
const expect = chai.expect;

describe("Product Service - Full API Test", function () {
  this.timeout(60000); // tăng timeout cho CI/CD
  let app;
  let authToken;
  let createdProductId;
  let orderId;

  // ------------------ HELPERS ------------------
  async function waitMongo(uri) {
    let connected = false;
    while (!connected) {
      try {
        await mongoose.connect(uri);
        connected = true;
      } catch (err) {
        console.log("Waiting for MongoDB...");
        await new Promise(res => setTimeout(res, 2000));
      }
    }
  }

  async function waitAuth() {
    let token;
    let connected = false;
    while (!connected) {
      try {
        const res = await chai
          .request("http://auth:3000") // hostname container Auth
          .post("/login")
          .send({
            username: process.env.LOGIN_TEST_USER,
            password: process.env.LOGIN_TEST_PASSWORD,
          });
        token = res.body.token;
        connected = true;
      } catch (err) {
        console.log("Waiting for Auth service...");
        await new Promise(res => setTimeout(res, 2000));
      }
    }
    return token;
  }

  // ------------------ HOOKS ------------------
  before(async () => {
    app = new App();

    // 1️⃣ Wait MongoDB sẵn sàng
    await waitMongo(process.env.MONGODB_PRODUCT_URI);

    // 2️⃣ Connect DB và setup RabbitMQ
    await app.connectDB();
    await app.setupMessageBroker();

    // 3️⃣ Lấy token từ Auth service
    authToken = await waitAuth();
  });

  after(async () => {
    await app.disconnectDB();
  });

  // ------------------ PRODUCT TEST ------------------
  describe("POST /api/products", () => {
    it("should create a new product", async () => {
      const product = {
        name: "Test Product",
        description: "A product for testing order creation",
        price: 15,
      };

      const res = await chai
        .request(app.app)
        .post("/api/products")
        .set("Authorization", `Bearer ${authToken}`)
        .send(product);

      expect(res).to.have.status(201);
      expect(res.body).to.have.property("_id");
      createdProductId = res.body._id;
    });

    it("should return 400 if validation fails", async () => {
      const res = await chai
        .request(app.app)
        .post("/api/products")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ description: "Missing required name" });

      expect(res).to.have.status(400);
    });

    it("should return 401 if no token provided", async () => {
      const res = await chai
        .request(app.app)
        .post("/api/products")
        .send({ name: "Product no token", price: 10 });

      expect(res).to.have.status(401);
    });
  });

  describe("GET /api/products", () => {
    it("should get all products", async () => {
      const res = await chai
        .request(app.app)
        .get("/api/products")
        .set("Authorization", `Bearer ${authToken}`);
      expect(res).to.have.status(200);
      expect(res.body).to.be.an("array");
    });

    it("should return 401 without token", async () => {
      const res = await chai.request(app.app).get("/api/products");
      expect(res).to.have.status(401);
    });
  });

  // ------------------ ORDER TEST ------------------
  describe("POST /api/orders", () => {
    it("should create a new order with product IDs", async () => {
      const res = await chai
        .request(app.app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ ids: [createdProductId] });

      expect(res).to.have.status(201);
      orderId = res.body.orderId || res.body.id;
    });

    it("should return 401 if no token provided", async () => {
      const res = await chai
        .request(app.app)
        .post("/api/orders")
        .send({ ids: [createdProductId] });
      expect(res).to.have.status(401);
    });
  });

  describe("GET /api/orders/:orderId", () => {
    it("should return order status by ID", async () => {
      const res = await chai
        .request(app.app)
        .get(`/api/orders/${orderId}`)
        .set("Authorization", `Bearer ${authToken}`);
      expect(res).to.have.status(200);
      expect(res.body).to.have.property("status");
    });

    it("should return 404 if order not found", async () => {
      const res = await chai
        .request(app.app)
        .get("/api/orders/nonexistentid")
        .set("Authorization", `Bearer ${authToken}`);
      expect(res).to.have.status(404);
    });
  });
});
