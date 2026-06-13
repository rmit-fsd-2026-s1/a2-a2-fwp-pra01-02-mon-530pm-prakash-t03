/**
 * VENUE MANAGEMENT ROUTER (EXPRESS REST API)
 * 
 * Purpose: Handles retrieving, adding, updating, and deleting venue records in the MySQL database.
 * Supports standard venue search/filtering and vendor-specific venue ownership validation.
 * 
 * Command lines to execute/test/build this project:
 * - Start Backend Server:
 *   cd backend && npm run dev
 * - Build Backend TS files:
 *   cd backend && npm run build
 * - Run Backend Test Suite:
 *   cd backend && npm run test
 */

import { Router, Response } from "express";
import { AppDataSource } from "../data-source";
import { Venue } from "../entity/Venue";
import { User } from "../entity/User";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import { requireRole } from "../middleware/auth";

const router = Router();
const venueRepository = AppDataSource.getRepository(Venue);

// Get All Venues (with optional query filters)
router.get("/", async (req, res) => {
  const { search, location, capacity, suitability } = req.query;

  try {
    const queryBuilder = venueRepository.createQueryBuilder("venue");

    // General search filter
    if (search) {
      const searchPattern = `%${String(search).toLowerCase()}%`;
      queryBuilder.andWhere(
        "(LOWER(venue.name) LIKE :search OR LOWER(venue.location) LIKE :search OR LOWER(venue.description) LIKE :search)",
        { search: searchPattern }
      );
    }

    // Specific location filter
    if (location) {
      queryBuilder.andWhere("LOWER(venue.location) LIKE :location", {
        location: `%${String(location).toLowerCase()}%`,
      });
    }

    // Minimum capacity filter
    if (capacity) {
      const minCap = parseInt(String(capacity), 10);
      if (!isNaN(minCap)) {
        queryBuilder.andWhere("venue.capacity >= :minCap", { minCap });
      }
    }

    const venues = await queryBuilder.getMany();

    // Explanatory comment: Suitability filtering is executed in JavaScript memory post-retrieval
    // instead of a SQL query. This ensures DBMS compatibility since JSON column querying 
    // structures differ significantly between MySQL, SQLite, and other SQL engines.
    let filteredVenues = venues;
    if (suitability) {
      const suitStr = String(suitability).toLowerCase();
      filteredVenues = venues.filter((v) =>
        v.suitability.some((s) => s.toLowerCase() === suitStr)
      );
    }

    return res.status(200).json(filteredVenues);
  } catch (error) {
    console.error("Error fetching venues:", error);
    return res.status(500).json({ message: "Server error occurred while fetching venues." });
  }
});

// Get Single Venue
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const venue = await venueRepository.findOneBy({ id });
    if (!venue) {
      return res.status(404).json({ message: "Venue not found." });
    }

    return res.status(200).json(venue);
  } catch (error) {
    console.error("Error fetching single venue:", error);
    return res.status(500).json({ message: "Server error fetching venue details." });
  }
});

// Add Venue (Vendors only)
router.post("/", authenticateToken as any, requireRole("vendor") as any, async (req: AuthRequest, res: Response) => {
  const { name, location, capacity, suitability, description, imageUrl, pricePerHour } = req.body;

  if (!name || !location || !capacity || !suitability || !description || !pricePerHour) {
    return res.status(400).json({ message: "All required fields (name, location, capacity, suitability, description, pricePerHour) must be provided." });
  }

  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized. Please authenticate first." });
    }

    // Check if the vendor actually exists in the database to prevent foreign key constraint failures
    const userRepository = AppDataSource.getRepository(User);
    const vendorExists = await userRepository.findOneBy({ id: req.user.id });
    if (!vendorExists) {
      return res.status(401).json({ message: "Your login session is invalid because the user record no longer exists in the database. Please sign out and sign in again." });
    }

    // Explanatory comment: Generate a random 5-character alphanumeric suffix for the venue ID.
    // I avoid standard auto-incrementing integer IDs to prevent resource enumeration/scraping
    // and to align with clean, URL-friendly unique slug strings (e.g. venue-a4g8x).
    const shortId = Math.random().toString(36).substring(2, 7);
    const venueId = `venue-${shortId}`;

    const newVenue = venueRepository.create({
      id: venueId,
      vendorId: req.user.id,
      name: name.trim(),
      location: location.trim(),
      capacity: parseInt(String(capacity), 10),
      // Explanatory comment: Parse the suitability options. Since client applications might upload
      // data as raw JSON arrays or as comma-delimited strings in standard multipart/form-data,
      // I check the data type and format it into a clean, sanitized string array.
      suitability: Array.isArray(suitability) ? suitability : (typeof suitability === 'string' ? suitability.split(",").map(s => s.trim()).filter(Boolean) : []),
      description: description.trim(),
      imageUrl: imageUrl || "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800",
      pricePerHour: parseFloat(String(pricePerHour)),
      isBlocked: false,
      isFeatured: false,
    });

    await venueRepository.save(newVenue);

    return res.status(201).json({
      message: "Venue added successfully.",
      venue: newVenue,
    });
  } catch (error: any) {
    console.error("Error creating venue:", error);
    return res.status(500).json({ message: error.message || "Server error occurred while creating venue." });
  }
});

// Update/Block Venue Details (Vendors only)
router.put("/:id", authenticateToken as any, requireRole("vendor") as any, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { isBlocked, blockedFrom, blockedUntil, blockReason } = req.body;

  try {
    const venue = await venueRepository.findOneBy({ id });
    if (!venue) {
      return res.status(404).json({ message: "Venue not found." });
    }

    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized. Please authenticate first." });
    }

    // Check ownership
    if (venue.vendorId !== req.user.id) {
      return res.status(403).json({ message: "Forbidden. You do not own this venue." });
    }

    if (isBlocked !== undefined) venue.isBlocked = isBlocked;
    venue.blockedFrom = blockedFrom !== undefined ? (blockedFrom ? new Date(blockedFrom) : null) : venue.blockedFrom;
    venue.blockedUntil = blockedUntil !== undefined ? (blockedUntil ? new Date(blockedUntil) : null) : venue.blockedUntil;
    venue.blockReason = blockReason !== undefined ? blockReason : venue.blockReason;

    // Support vendor CRUD editing fields:
    if (req.body.name !== undefined) venue.name = req.body.name.trim();
    if (req.body.location !== undefined) venue.location = req.body.location.trim();
    if (req.body.capacity !== undefined) venue.capacity = parseInt(String(req.body.capacity), 10);
    if (req.body.suitability !== undefined) {
      venue.suitability = Array.isArray(req.body.suitability)
        ? req.body.suitability
        : (typeof req.body.suitability === 'string' ? req.body.suitability.split(",").map((s: any) => s.trim()).filter(Boolean) : []);
    }
    if (req.body.description !== undefined) venue.description = req.body.description.trim();
    if (req.body.imageUrl !== undefined) venue.imageUrl = req.body.imageUrl || "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800";
    if (req.body.pricePerHour !== undefined) venue.pricePerHour = parseFloat(String(req.body.pricePerHour));

    await venueRepository.save(venue);

    return res.status(200).json({
      message: "Venue updated successfully.",
      venue,
    });
  } catch (error) {
    console.error("Error updating venue:", error);
    return res.status(500).json({ message: "Server error occurred while updating venue." });
  }
});

// Delete Venue (Vendors only)
router.delete("/:id", authenticateToken as any, requireRole("vendor") as any, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const venue = await venueRepository.findOneBy({ id });
    if (!venue) {
      return res.status(404).json({ message: "Venue not found." });
    }

    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized. Please authenticate first." });
    }

    // Check ownership
    if (venue.vendorId !== req.user.id) {
      return res.status(403).json({ message: "Forbidden. You do not own this venue." });
    }

    await venueRepository.delete({ id });

    return res.status(200).json({
      message: "Venue deleted successfully."
    });
  } catch (error) {
    console.error("Error deleting venue:", error);
    return res.status(500).json({ message: "Server error occurred while deleting venue." });
  }
});

export default router;
