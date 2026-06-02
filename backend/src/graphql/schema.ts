import { buildSchema } from "graphql";
import { AppDataSource } from "../data-source";
import { Venue } from "../entity/Venue";
import { User } from "../entity/User";
import { Application } from "../entity/Application";
import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";

// Build schema string
export const schema = buildSchema(`
  type Venue {
    id: String!
    vendorId: String!
    name: String!
    location: String!
    capacity: Int!
    suitability: [String!]!
    description: String!
    imageUrl: String!
    pricePerHour: Float!
    isBlocked: Boolean!
    isFeatured: Boolean!
  }

  type PopularVenueReport {
    venueId: String!
    venueName: String!
    popularDay: String!
    popularTimeSlot: String!
    successfulBookingsCount: Int!
  }

  type ActiveApplicantReport {
    hirerId: String!
    hirerName: String!
    successfulBookingsCount: Int!
    submittedApplicationsCount: Int!
    activityRatio: Float!
  }

  type AdminUser {
    id: String!
    email: String!
    name: String!
    role: String!
  }

  type AdminLoginResult {
    token: String!
    user: AdminUser!
  }

  type Query {
    adminLogin(email: String!, password: String!): AdminLoginResult!
    getAllVenues: [Venue!]!
    generateReportPopularity: [PopularVenueReport!]!
    generateReportActiveApplicants: [ActiveApplicantReport!]!
  }

  type Mutation {
    addVenue(
      name: String!
      location: String!
      capacity: Int!
      suitability: [String!]!
      description: String!
      imageUrl: String!
      pricePerHour: Float!
    ): Venue!
    
    editVenue(
      id: String!
      name: String
      location: String
      capacity: Int
      suitability: [String!]
      description: String
      imageUrl: String
      pricePerHour: Float
    ): Venue!
    
    deleteVenue(id: String!): Boolean!
    
    assignVendorToVenue(venueId: String!, vendorId: String!): Venue!
    
    setVenueFeatured(venueId: String!, isFeatured: Boolean!): Venue!
  }
`);

// Authentication token helper
const generateToken = (user: User): string => {
  const secret = process.env.JWT_SECRET || "super_secret_venueflow_token_key_123!";
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    secret,
    { expiresIn: "7d" }
  );
};

// Resolver implementations
export const rootValue = {
  // Admin Login Resolver
  adminLogin: async ({ email, password }: any) => {
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOneBy({ email: email.toLowerCase() });

    if (!user) {
      throw new Error("No account found with this email address.");
    }

    if (user.role !== "admin") {
      throw new Error("Access denied. Authorized admins only.");
    }

    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) {
      throw new Error("Incorrect password. Please try again.");
    }

    const token = generateToken(user);
    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  },

  // Venue CRUD Resolvers
  getAllVenues: async () => {
    const venueRepository = AppDataSource.getRepository(Venue);
    return venueRepository.find();
  },

  addVenue: async (args: any) => {
    const venueRepository = AppDataSource.getRepository(Venue);
    const shortId = Math.random().toString(36).substring(2, 7);
    const venueId = `venue-${shortId}`;

    // Admin adds venue, assign default vendor (vendor-001) for safety initially
    const newVenue = venueRepository.create({
      id: venueId,
      vendorId: "vendor-001",
      name: args.name,
      location: args.location,
      capacity: args.capacity,
      suitability: args.suitability,
      description: args.description,
      imageUrl: args.imageUrl || "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800",
      pricePerHour: args.pricePerHour,
      isBlocked: false,
      isFeatured: false,
    });

    return venueRepository.save(newVenue);
  },

  editVenue: async (args: any) => {
    const venueRepository = AppDataSource.getRepository(Venue);
    const venue = await venueRepository.findOneBy({ id: args.id });

    if (!venue) {
      throw new Error("Venue not found.");
    }

    if (args.name !== undefined) venue.name = args.name;
    if (args.location !== undefined) venue.location = args.location;
    if (args.capacity !== undefined) venue.capacity = args.capacity;
    if (args.suitability !== undefined) venue.suitability = args.suitability;
    if (args.description !== undefined) venue.description = args.description;
    if (args.imageUrl !== undefined) venue.imageUrl = args.imageUrl;
    if (args.pricePerHour !== undefined) venue.pricePerHour = args.pricePerHour;

    return venueRepository.save(venue);
  },

  deleteVenue: async ({ id }: any) => {
    const venueRepository = AppDataSource.getRepository(Venue);
    const venue = await venueRepository.findOneBy({ id });

    if (!venue) {
      throw new Error("Venue not found.");
    }

    await venueRepository.delete({ id });
    return true;
  },

  // Assign Vendor Resolver
  assignVendorToVenue: async ({ venueId, vendorId }: any) => {
    const venueRepository = AppDataSource.getRepository(Venue);
    const userRepository = AppDataSource.getRepository(User);

    const venue = await venueRepository.findOneBy({ id: venueId });
    if (!venue) throw new Error("Venue not found.");

    const vendor = await userRepository.findOneBy({ id: vendorId });
    if (!vendor || vendor.role !== "vendor") {
      throw new Error("Invalid vendor selected. Selected user must hold vendor role.");
    }

    venue.vendorId = vendorId;
    return venueRepository.save(venue);
  },

  // Featured Venue toggle Resolver
  setVenueFeatured: async ({ venueId, isFeatured }: any) => {
    const venueRepository = AppDataSource.getRepository(Venue);
    const venue = await venueRepository.findOneBy({ id: venueId });

    if (!venue) throw new Error("Venue not found.");

    venue.isFeatured = isFeatured;
    return venueRepository.save(venue);
  },

  // Report 1: Top 3 most popular venues (and popular day + time slot)
  generateReportPopularity: async () => {
    const appRepository = AppDataSource.getRepository(Application);
    const venueRepository = AppDataSource.getRepository(Venue);

    // Get all approved bookings
    const approvedBookings = await appRepository.find({
      where: { status: "approved" },
      relations: ["venue"],
    });

    // Aggregate statistics
    const venueStats: Record<
      string,
      {
        venueName: string;
        successfulCount: number;
        days: Record<string, number>;
        slots: Record<string, number>;
      }
    > = {};

    approvedBookings.forEach((app) => {
      const venueId = app.venueId;
      if (!venueStats[venueId]) {
        venueStats[venueId] = {
          venueName: app.venue?.name || "Unknown Venue",
          successfulCount: 0,
          days: {},
          slots: {},
        };
      }

      venueStats[venueId].successfulCount += 1;

      // Extract day of week
      const dateObj = new Date(app.eventDate);
      const dayName = isNaN(dateObj.getTime())
        ? app.eventDate
        : dateObj.toLocaleDateString("en-US", { weekday: "long" });

      venueStats[venueId].days[dayName] = (venueStats[venueId].days[dayName] || 0) + 1;
      
      const timeSlot = app.eventTime;
      venueStats[venueId].slots[timeSlot] = (venueStats[venueId].slots[timeSlot] || 0) + 1;
    });

    // Ensure all venues are represented if they have 0 bookings, to allow CRUD reports
    const allVenues = await venueRepository.find();
    allVenues.forEach((v) => {
      if (!venueStats[v.id]) {
        venueStats[v.id] = {
          venueName: v.name,
          successfulCount: 0,
          days: { "None": 1 },
          slots: { "None": 1 },
        };
      }
    });

    const reportList = Object.entries(venueStats).map(([venueId, stats]) => {
      // Find most popular day
      const popularDay = Object.entries(stats.days).sort((a, b) => b[1] - a[1])[0]?.[0] || "None";
      // Find most popular time slot
      const popularTimeSlot = Object.entries(stats.slots).sort((a, b) => b[1] - a[1])[0]?.[0] || "None";

      return {
        venueId,
        venueName: stats.venueName,
        popularDay,
        popularTimeSlot,
        successfulBookingsCount: stats.successfulCount,
      };
    });

    // Sort by successful bookings count descending and slice top 3
    return reportList.sort((a, b) => b.successfulBookingsCount - a.successfulBookingsCount).slice(0, 3);
  },

  // Report 2: Top 3 most active applicants (ratio = approved bookings / submitted applications)
  generateReportActiveApplicants: async () => {
    const appRepository = AppDataSource.getRepository(Application);
    const userRepository = AppDataSource.getRepository(User);

    const allApps = await appRepository.find({ relations: ["hir"] });
    const allHirers = await userRepository.find({ where: { role: "hirer" } });

    const applicantStats: Record<
      string,
      {
        hirerName: string;
        submittedCount: number;
        successfulCount: number;
      }
    > = {};

    allHirers.forEach((user) => {
      applicantStats[user.id] = {
        hirerName: user.name,
        submittedCount: 0,
        successfulCount: 0,
      };
    });

    allApps.forEach((app) => {
      const hirerId = app.hirerId;
      if (applicantStats[hirerId]) {
        applicantStats[hirerId].submittedCount += 1;
        if (app.status === "approved") {
          applicantStats[hirerId].successfulCount += 1;
        }
      }
    });

    const reportList = Object.entries(applicantStats).map(([hirerId, stats]) => {
      const activityRatio =
        stats.submittedCount === 0 ? 0.00 : stats.successfulCount / stats.submittedCount;

      return {
        hirerId,
        hirerName: stats.hirerName,
        successfulBookingsCount: stats.successfulCount,
        submittedApplicationsCount: stats.submittedCount,
        activityRatio: Math.round(activityRatio * 100) / 100, // round to 2 decimals
      };
    });

    // Sort by ratio descending and slice top 3
    return reportList.sort((a, b) => b.activityRatio - a.activityRatio).slice(0, 3);
  },
};
