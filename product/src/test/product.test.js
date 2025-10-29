const chai = require("chai");
const chaiHttp = require("chai-http");
const expect = chai.expect;
require("dotenv").config();

chai.use(chaiHttp);

// Sử dụng biến môi trường để có thể test trong Docker hoặc local
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://localhost:3000";
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || "http://localhost:3001";

describe("Products", () => {
  let authToken;
  let listProduct;

  // before chạy trc
  before(async () => {
    // Login để lấy token từ Auth service đang chạy
    const authRes = await chai
      .request(AUTH_SERVICE_URL)
      .post("/login")
      .send({ username: "testuser", password: "123456" });
    
    if (authRes.status !== 200 || !authRes.body.token) {
      throw new Error(`Login failed: ${JSON.stringify(authRes.body)}`);
    }
    
    authToken = authRes.body.token;

    // thêm trước 1 product
    await chai
      .request(PRODUCT_SERVICE_URL)
      .post("/api/products")
      .set("authorization", `Bearer ${authToken}`)
      .send({
        name: "Product 8989",
        price: 100000,
        description: "Description of Product 8989",
      });

    await chai
      .request(PRODUCT_SERVICE_URL)
      .post("/api/products")
      .set("authorization", `Bearer ${authToken}`)
      .send({
        name: "Product 9898",
        price: 100000,
        description: "Description of Product 9898",
      });

    // lay cac product co san de test !!!
    listProduct = await chai
      .request(PRODUCT_SERVICE_URL)
      .get("/api/products")
      .set("authorization", `Bearer ${authToken}`)
  });

  after(async () => {
    console.log('complete !!!!');
  });

  // sẽ chạy sau khi before chạy xong
  describe("POST /products", () => {
    it("should create a new product", async () => {
      const product = {
        name: "Product 1",
        description: "Description of Product 1",
        price: 10,
      };

      // khúc này là gửi request như postman
      const res = await chai
        .request(PRODUCT_SERVICE_URL)
        .post("/api/products")
        .set("authorization", `Bearer ${authToken}`)
        .send({
          name: "Product 1",
          price: 10,
          description: "Description of Product 1",
        });

      // khúc này là thực hiện việc kiểm tra
      expect(res).to.have.status(201);
      expect(res.body).to.have.property("_id");
      expect(res.body).to.have.property("name", product.name);
      expect(res.body).to.have.property("description", product.description);
      expect(res.body).to.have.property("price", product.price);
      expect(res.body).to.have.property("__v");
    });

    it("should return an error if name is missing", async () => {
      // data giả
      const product = {
        description: "Description of Product 1",
        price: 10.99,
      };
      // gửi dữ liệu 
      const res = await chai
        .request(PRODUCT_SERVICE_URL)
        .post("/api/products")
        .set("authorization", `Bearer ${authToken}`)
        .send(product);
      // test
      expect(res).to.have.status(400);
    });
    });

  // done
  describe("GET /products", () => {
    it("get all product", async () => {

      const res = await chai
        .request(PRODUCT_SERVICE_URL)
        .get("/api/products")
        .set("authorization", `Bearer ${authToken}`)


      expect(res).to.have.status(200);

      expect(res.body).to.be.an("array");
      expect(res.body.length).to.be.greaterThan(0);

      const firstProduct = res.body[0];
      expect(firstProduct).to.have.property("_id");
      expect(firstProduct).to.have.property("name").that.is.a("string");
      expect(firstProduct).to.have.property("description").that.is.a("string");
      expect(firstProduct).to.have.property("price").that.is.a("number");
    });
  })

  // done
  describe("POST /order", () => {
    it("save orders success", async () => {

      console.log(listProduct.body)

      const res = await chai
        .request(PRODUCT_SERVICE_URL)
        .post("/api/products/buy")
        .set("authorization", `Bearer ${authToken}`)
        .send(
          {
            "ids": [
              listProduct.body[0]._id,
              listProduct.body[1]._id
            ]
          }
        )


      expect(res).to.have.status(201);
      expect(res.body).to.have.property("status", 'completed');
      expect(res.body).to.have.property("products");
      expect(res.body).to.have.property("orderId");
      expect(res.body).to.have.property("totalPrice");
    });
  })
});