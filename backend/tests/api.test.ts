import request from "supertest";
import * as jwt from "jsonwebtoken";
import * as bcrypt from "bcryptjs";

// Define a shared mock repository object that can be customized dynamically per test
const mockRepository = {
  findOneBy: jest.fn(),
  find: jest.fn(),
  create: jest.fn((data) => data),
  save: jest.fn((data) => Promise.resolve(data)),
  delete: jest.fn(() => Promise.resolve({ affected: 1 })),
};

// Mock AppDataSource before importing the app
jest.mock("../src/data-source", () => {
  return {
    AppDataSource: {
      getRepository: jest.fn(() => mockRepository),
      initialize: jest.fn(() => Promise.resolve()),
      destroy: jest.fn(() => Promise.resolve()),
    },
  };
});

// Import the Express app (it won't automatically listen because process.env.NODE_ENV is set to 'test' by Jest)
import { app } from "../src/index";

// JWT Helper
const generateTestToken = (id: string, email: string, role: string) => {
  const secret = process.env.JWT_SECRET || "super_secret_venueflow_token_key_123!";
  return jwt.sign({ id, email, role }, secret, { expiresIn: "1h" });
};

describe("Venue Vendors Backend - E2E Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test 1: Sign up input validation
  it("Test 1: should enforce signup validation rules (invalid email, weak password, invalid phone)", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({
        email: "bad-email",
        password: "weak",
        name: "A",
        phone: "123",
        role: "hirer",
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Validation failed.");
    expect(res.body.errors).toHaveProperty("email");
    expect(res.body.errors).toHaveProperty("password");
    expect(res.body.errors).toHaveProperty("name");
    expect(res.body.errors).toHaveProperty("phone");
  });

  // Test 2: Login validation
  it("Test 2: should deny sign-in with non-existent email or wrong password", async () => {
    // 2a. Mock user not found
    mockRepository.findOneBy.mockResolvedValueOnce(null);

    const resNotFound = await request(app)
      .post("/api/auth/signin")
      .send({
        email: "nobody@vv.com",
        password: "Password1!",
      });

    expect(resNotFound.status).toBe(401);
    expect(resNotFound.body.message).toContain("No account found");

    // 2b. Mock user found but wrong password
    const hashedPassword = bcrypt.hashSync("Password1!", 10);
    mockRepository.findOneBy.mockResolvedValueOnce({
      id: "hirer-001",
      email: "user@vv.com",
      password: hashedPassword,
      role: "hirer",
      name: "Test User",
    });

    const resWrongPass = await request(app)
      .post("/api/auth/signin")
      .send({
        email: "user@vv.com",
        password: "WrongPassword!",
      });

    expect(resWrongPass.status).toBe(401);
    expect(resWrongPass.body.message).toContain("Incorrect password");
  });

  // Test 3: REST JWT verification & authorization middleware
  it("Test 3: should restrict access to protected endpoints based on JWT role presence", async () => {
    // 3a. Expect 401 for requests without token
    const resNoToken = await request(app).get("/api/analytics/vendor");
    expect(resNoToken.status).toBe(401);

    // 3b. Expect 403 for requests with invalid token
    const resBadToken = await request(app)
      .get("/api/analytics/vendor")
      .set("Authorization", "Bearer invalid_token_123");
    expect(resBadToken.status).toBe(403);

    // 3c. Expect 403 for user with wrong role (hirer requesting vendor analytics)
    const hirerToken = generateTestToken("hirer-001", "hirer@vv.com", "hirer");
    const resWrongRole = await request(app)
      .get("/api/analytics/vendor")
      .set("Authorization", `Bearer ${hirerToken}`);
    expect(resWrongRole.status).toBe(403);

    // 3d. Expect 200 for user with correct role (vendor requesting vendor analytics)
    mockRepository.find.mockResolvedValue([]); // Mock queries returning empty lists
    const vendorToken = generateTestToken("vendor-001", "vendor@vv.com", "vendor");
    const resCorrectRole = await request(app)
      .get("/api/analytics/vendor")
      .set("Authorization", `Bearer ${vendorToken}`);
    expect(resCorrectRole.status).toBe(200);
    expect(resCorrectRole.body).toHaveProperty("analyticsData");
  });

  // Test 4: Document Credibility Score Calculation
  it("Test 4: should automatically calculate credibility scores upon document submission", async () => {
    const hirerToken = generateTestToken("hirer-001", "hirer@vv.com", "hirer");
    const validFile = "data:image/jpeg;base64," + "A".repeat(150);

    // 4a. Individual applicant: upload DL and PL should get 5.0 (2 out of 2 valid docs)
    mockRepository.findOneBy.mockResolvedValueOnce(null); // Document row not created yet
    const resIndiv = await request(app)
      .post("/api/documents")
      .set("Authorization", `Bearer ${hirerToken}`)
      .send({
        isBusinessApplicant: false,
        driverLicenseName: "license.jpg",
        driverLicenseData: validFile,
        publicLiabilityName: "cover.pdf",
        publicLiabilityData: validFile,
      });

    expect(resIndiv.status).toBe(200);
    expect(resIndiv.body.document.credibilityScore).toBe(5.0);

    // 4b. Business applicant: upload DL, PL, and ABN (but missing business cert) should get 3.3 (2 out of 3 docs valid)
    mockRepository.findOneBy.mockResolvedValueOnce(null);
    const resBizTwoDocs = await request(app)
      .post("/api/documents")
      .set("Authorization", `Bearer ${hirerToken}`)
      .send({
        isBusinessApplicant: true,
        abn: "12345678901", // Valid 11-digit ABN
        driverLicenseName: "license.jpg",
        driverLicenseData: validFile,
        publicLiabilityName: "cover.pdf",
        publicLiabilityData: validFile,
      });

    expect(resBizTwoDocs.status).toBe(200);
    expect(resBizTwoDocs.body.document.credibilityScore).toBe(3.3);

    // 4c. Business applicant: upload all 3 valid documents should get 5.0
    mockRepository.findOneBy.mockResolvedValueOnce(null);
    const resBizThreeDocs = await request(app)
      .post("/api/documents")
      .set("Authorization", `Bearer ${hirerToken}`)
      .send({
        isBusinessApplicant: true,
        abn: "12345678901",
        driverLicenseName: "license.jpg",
        driverLicenseData: validFile,
        publicLiabilityName: "cover.pdf",
        publicLiabilityData: validFile,
        businessCertName: "cert.pdf",
        businessCertData: validFile,
      });

    expect(resBizThreeDocs.status).toBe(200);
    expect(resBizThreeDocs.body.document.credibilityScore).toBe(5.0);
  });

  // Test 5: GraphQL Query resolvers validation
  it("Test 5: should fetch venues and authenticate admin via GraphQL queries", async () => {
    // 5a. Verify getAllVenues query
    mockRepository.find.mockResolvedValueOnce([
      { id: "venue-1", name: "Riverlight Terraces", location: "Melbourne", capacity: 100, pricePerHour: 200, suitability: [] },
    ]);

    const resVenues = await request(app)
      .post("/graphql")
      .send({
        query: `
          query {
            getAllVenues {
              id
              name
              location
            }
          }
        `,
      });

    expect(resVenues.status).toBe(200);
    expect(resVenues.body.data.getAllVenues).toHaveLength(1);
    expect(resVenues.body.data.getAllVenues[0].name).toBe("Riverlight Terraces");

    // 5b. Verify adminLogin query
    const adminPasswordHash = bcrypt.hashSync("AdminPass1!", 10);
    mockRepository.findOneBy.mockResolvedValueOnce({
      id: "admin-001",
      email: "admin@vv.com",
      password: adminPasswordHash,
      role: "admin",
      name: "Administrator",
    });

    const resLogin = await request(app)
      .post("/graphql")
      .send({
        query: `
          query {
            adminLogin(email: "admin@vv.com", password: "AdminPass1!") {
              token
              user {
                id
                role
                email
              }
            }
          }
        `,
      });

    expect(resLogin.status).toBe(200);
    expect(resLogin.body.data.adminLogin).toHaveProperty("token");
    expect(resLogin.body.data.adminLogin.user.role).toBe("admin");
  });

  // Test 6: GraphQL Mutation resolvers validation
  it("Test 6: should execute Admin mutations (set venue featured status) via GraphQL", async () => {
    // Mock getRepository(Venue).findOneBy to find the target venue
    mockRepository.findOneBy.mockResolvedValueOnce({
      id: "venue-1",
      name: "Riverlight Terraces",
      isFeatured: false,
    });

    // Mock save to return the venue with updated isFeatured
    mockRepository.save.mockImplementationOnce((venue) => Promise.resolve(venue));

    const resMutation = await request(app)
      .post("/graphql")
      .send({
        query: `
          mutation {
            setVenueFeatured(venueId: "venue-1", isFeatured: true) {
              id
              isFeatured
            }
          }
        `,
      });

    expect(resMutation.status).toBe(200);
    expect(resMutation.body.data.setVenueFeatured.id).toBe("venue-1");
    expect(resMutation.body.data.setVenueFeatured.isFeatured).toBe(true);
  });
});
