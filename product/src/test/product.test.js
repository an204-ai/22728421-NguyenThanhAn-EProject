const chai = require("chai");
const chaiHttp = require("chai-http");
const App = require("../app");
const expect = chai.expect;
require("dotenv").config();

chai.use(chaiHttp);

describe("Product Service - Full API Test", () => {
  let app;
  let authToken;
  let createdProductId;
  let orderId;

  // before(async () => {
  //   app = new App();
  //   await Promise.all([app.connectDB(), app.setupMessageBroker()]);

  //   // 🔐 Đăng nhập để lấy token từ Auth service
  //   const authRes = await chai
  //     .request("http://localhost:3000")
  //     .post("/login")
  //     .send({
  //       username: process.env.LOGIN_TEST_USER,
  //       password: process.env.LOGIN_TEST_PASSWORD,
  //     });

  //   authToken = authRes.body.token;
  //   app.start();
  // });

  before(async () => {
  const loginRes = await chai
    .request("http://localhost:3000")
    .post("/login")
    .send({
      username: process.env.LOGIN_TEST_USER,
      password: process.env.LOGIN_TEST_PASSWORD,
    });

  expect(loginRes).to.have.status(200);

  // Thêm "Bearer " trước token
  authToken = `Bearer ${loginRes.body.token}`;
});
  after(async () => {
    await app.disconnectDB();
    app.stop();
  });

  // 🟢 CREATE PRODUCT
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
      expect(res.body).to.have.property("name", product.name);
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

  // 🟡 GET ALL PRODUCTS
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

  // 🔵 CREATE ORDER
  describe("POST /api/orders", () => {
    it("should create a new order with product IDs", async () => {
      const res = await chai
        .request(app.app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ ids: [createdProductId] });

      expect(res).to.have.status(201);
      expect(res.body).to.have.property("status");
      expect(res.body.status).to.be.oneOf(["pending", "completed"]);
      expect(res.body).to.have.property("products");
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

  // 🟣 GET ORDER STATUS
  describe("GET /api/orders/:orderId", () => {
    it("should return order status by ID", async () => {
      const res = await chai
        .request(app.app)
        .get(`/api/orders/${orderId}`)
        .set("Authorization", `Bearer ${authToken}`);

      // Order có thể chưa được xử lý xong trong RabbitMQ, nên chỉ cần 200 là pass
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
