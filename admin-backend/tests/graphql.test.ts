import request from "supertest";

const mockRepository = {
  findOneBy: jest.fn(),
  find: jest.fn(),
  create: jest.fn((data) => data),
  save: jest.fn((data) => Promise.resolve(data)),
  delete: jest.fn(() => Promise.resolve({ affected: 1 })),
};

jest.mock("../src/data-source", () => {
  return {
    AppDataSource: {
      getRepository: jest.fn(() => mockRepository),
      initialize: jest.fn(() => Promise.resolve()),
      destroy: jest.fn(() => Promise.resolve()),
    },
  };
});

import { app } from "../src/index";

describe("Venue Vendors Admin Backend - GraphQL Unit Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test 1: Admin sign in with valid credentials 'admin'/'admin'
  it("Test 1: should successfully login an admin with credentials 'admin'/'admin'", async () => {
    const res = await request(app)
      .post("/graphql")
      .send({
        query: `
          query {
            adminLogin(email: "admin", password: "admin") {
              token
              user {
                id
                email
                role
              }
            }
          }
        `,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.adminLogin).toHaveProperty("token");
    expect(res.body.data.adminLogin.user.email).toBe("admin");
    expect(res.body.data.adminLogin.user.role).toBe("admin");
  });

  // Test 2: Admin sign in rejects invalid credentials
  it("Test 2: should deny administrator login with incorrect credentials", async () => {
    mockRepository.findOneBy.mockResolvedValueOnce(null);

    const res = await request(app)
      .post("/graphql")
      .send({
        query: `
          query {
            adminLogin(email: "wrongadmin@vv.com", password: "WrongPassword") {
              token
              user {
                id
              }
            }
          }
        `,
      });

    expect(res.status).toBe(500);
    expect(res.body.errors).toBeDefined();
    expect(res.body.errors[0].message).toContain("No account found");
  });

  // Test 3: Query all venues returns venue list
  it("Test 3: should return a list of all venues via GraphQL query", async () => {
    mockRepository.find.mockResolvedValueOnce([
      { id: "venue-001", name: "Aurora Ballroom", location: "Melbourne", capacity: 400, pricePerHour: 500 },
    ]);

    const res = await request(app)
      .post("/graphql")
      .send({
        query: `
          query {
            getAllVenues {
              id
              name
              location
              capacity
            }
          }
        `,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.getAllVenues).toHaveLength(1);
    expect(res.body.data.getAllVenues[0].name).toBe("Aurora Ballroom");
  });

  // Test 4: Query all vendors returns vendor list
  it("Test 4: should return a list of all vendors via GraphQL query", async () => {
    mockRepository.find.mockResolvedValueOnce([
      { id: "vendor-001", email: "vendor@vv.com", name: "Anand Prabu", role: "vendor" },
    ]);

    const res = await request(app)
      .post("/graphql")
      .send({
        query: `
          query {
            getAllVendors {
              id
              email
              name
              role
            }
          }
        `,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.getAllVendors).toHaveLength(1);
    expect(res.body.data.getAllVendors[0].name).toBe("Anand Prabu");
  });

  // Test 5: Mutation setVenueFeatured toggles featured status
  it("Test 5: should allow toggling the featured status of a venue via setVenueFeatured mutation", async () => {
    mockRepository.findOneBy.mockResolvedValueOnce({
      id: "venue-001",
      name: "Aurora Ballroom",
      isFeatured: false,
    });
    mockRepository.save.mockImplementationOnce((v) => Promise.resolve(v));

    const res = await request(app)
      .post("/graphql")
      .send({
        query: `
          mutation {
            setVenueFeatured(venueId: "venue-001", isFeatured: true) {
              id
              isFeatured
            }
          }
        `,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.setVenueFeatured.isFeatured).toBe(true);
  });

  // Test 6: Mutation assignVendorToVenue updates venue's vendorId
  it("Test 6: should allow assigning a vendor to a venue via assignVendorToVenue mutation", async () => {
    mockRepository.findOneBy
      .mockResolvedValueOnce({ id: "venue-001", name: "Aurora Ballroom", vendorId: "vendor-001" }) // for venue check
      .mockResolvedValueOnce({ id: "vendor-002", role: "vendor", name: "Soosai Rajan" }); // for vendor check
    mockRepository.save.mockImplementationOnce((v) => Promise.resolve(v));

    const res = await request(app)
      .post("/graphql")
      .send({
        query: `
          mutation {
            assignVendorToVenue(venueId: "venue-001", vendorId: "vendor-002") {
              id
              vendorId
            }
          }
        `,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.assignVendorToVenue.vendorId).toBe("vendor-002");
  });
});
