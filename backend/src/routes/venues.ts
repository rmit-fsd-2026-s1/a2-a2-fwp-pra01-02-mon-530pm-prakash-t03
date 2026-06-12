import { Router, Response } from "express";
import { AppDataSource } from "../data-source";
import { Venue } from "../entity/Venue";
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

    // Suitability filter (filtering JSON array in JS to be safe across different SQL databases)
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

export default router;
