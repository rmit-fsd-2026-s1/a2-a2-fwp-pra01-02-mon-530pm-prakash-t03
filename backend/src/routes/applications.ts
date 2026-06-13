/**
 * REST API BACKEND SERVER - APPLICATIONS.TS
 * 
 * Purpose: Source code for REST API Backend Server.
 * 
 * Command lines to execute/build/test this project:
 * - Start development server (ts-node-dev): npm run dev
 * - Compile TypeScript: npm run build
 * - Start production node server: npm start
 * - Run integration tests: npm test
 */

import { Router, Response } from "express";
import { AppDataSource } from "../data-source";
import { Application } from "../entity/Application";
import { Venue } from "../entity/Venue";
import { HireHistory } from "../entity/HireHistory";
import { authenticateToken, AuthRequest } from "../middleware/auth";

const router = Router();
const appRepository = AppDataSource.getRepository(Application);
const venueRepository = AppDataSource.getRepository(Venue);

// Helper mapping function to match the exact frontend Application interface
const mapToFrontendApp = (app: Application) => {
  return {
    id: app.id,
    hirerId: app.hirerId,
    hirerName: app.hir?.name || "Unknown Hirer",
    hirerEmail: app.hir?.email || "",
    venueId: app.venueId,
    venueName: app.venue?.name || "Unknown Venue",
    venueLocation: app.venue?.location || "",
    eventName: app.eventName,
    guestCount: app.guestCount,
    eventDate: app.eventDate,
    eventTime: app.eventTime,
    durationHours: app.durationHours,
    status: app.status,
    vendorComment: app.vendorComment || "",
    submittedAt: app.submittedAt.toISOString(),
    approvedAt: app.approvedAt ? app.approvedAt.toISOString() : undefined,
  };
};

// Submit a Booking Application (Hirer only)
router.post("/", authenticateToken as any, async (req: AuthRequest, res: Response) => {
  if (!req.user || req.user.role !== "hirer") {
    return res.status(403).json({ message: "Only hirers can submit booking applications." });
  }

  const { venueId, eventName, guestCount, eventDate, eventTime, durationHours } = req.body;

  // Validation
  if (!eventName || !eventName.trim()) {
    return res.status(400).json({ message: "Event name is required." });
  }
  const guests = parseInt(guestCount, 10);
  if (isNaN(guests) || guests <= 0) {
    return res.status(400).json({ message: "Guest count must be a positive number." });
  }
  if (!eventDate || new Date(eventDate) < new Date()) {
    return res.status(400).json({ message: "Event date must be in the future." });
  }
  if (!eventTime) {
    return res.status(400).json({ message: "Event time is required." });
  }
  const hours = parseInt(durationHours, 10);
  if (isNaN(hours) || hours <= 0) {
    return res.status(400).json({ message: "Duration must be a positive number." });
  }

  try {
    // Check if venue exists and is not blocked
    const venue = await venueRepository.findOneBy({ id: venueId });
    if (!venue) {
      return res.status(404).json({ message: "Venue not found." });
    }
    if (venue.isBlocked) {
      return res.status(400).json({ message: "This venue is currently unavailable." });
    }
    if (guests > venue.capacity) {
      return res.status(400).json({ message: `Guest count exceeds venue's capacity of ${venue.capacity} guests.` });
    }

    // Create application
    const shortId = Math.random().toString(36).substring(2, 7);
    const appId = `app-${shortId}`;

    const newApp = appRepository.create({
      id: appId,
      hirerId: req.user.id,
      venueId,
      eventName: eventName.trim(),
      guestCount: guests,
      eventDate,
      eventTime,
      durationHours: hours,
      status: "pending",
      vendorComment: "",
    });

    await appRepository.save(newApp);

    // Fetch again to populate relations for mapping
    const savedApp = await appRepository.findOne({
      where: { id: appId },
      relations: ["hir", "venue"],
    });

    if (!savedApp) {
      return res.status(500).json({ message: "Failed to retrieve saved application." });
    }

    return res.status(201).json({
      message: "Application submitted successfully!",
      application: mapToFrontendApp(savedApp),
    });
  } catch (error) {
    console.error("Submit application error:", error);
    return res.status(500).json({ message: "Server error occurred during application submission." });
  }
});

// Get Applications List (Hirer sees own, Vendor sees assigned)
router.get("/", authenticateToken as any, async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized." });
  }

  try {
    let apps: Application[] = [];

    // Explanatory comment: I isolate database query scopes by user role.
    // Hirers should only retrieve applications they submitted (matching hirerId).
    // Vendors should only retrieve applications for venues they own (filtered via nested venue.vendorId relationship).
    if (req.user.role === "hirer") {
      apps = await appRepository.find({
        where: { hirerId: req.user.id },
        relations: ["hir", "venue"],
        order: { submittedAt: "DESC" },
      });
    } else if (req.user.role === "vendor") {
      apps = await appRepository.find({
        where: { venue: { vendorId: req.user.id } },
        relations: ["hir", "venue"],
        order: { submittedAt: "DESC" },
      });
    }

    const mappedApps = apps.map(mapToFrontendApp);
    return res.status(200).json(mappedApps);
  } catch (error) {
    console.error("Get applications error:", error);
    return res.status(500).json({ message: "Server error occurred while fetching applications." });
  }
});

// Update Application Status (Approve/Reject - Vendor only)
router.put("/:id/status", authenticateToken as any, async (req: AuthRequest, res: Response) => {
  if (!req.user || req.user.role !== "vendor") {
    return res.status(403).json({ message: "Only vendors can manage bookings." });
  }

  const { id } = req.params;
  const { status, vendorComment, rating } = req.body;

  if (status !== "approved" && status !== "rejected") {
    return res.status(400).json({ message: "Invalid status value. Must be 'approved' or 'rejected'." });
  }

  try {
    const app = await appRepository.findOne({
      where: { id },
      relations: ["venue", "hir"],
    });

    if (!app) {
      return res.status(404).json({ message: "Application not found." });
    }

    // Verify vendor ownership
    if (app.venue?.vendorId !== req.user.id) {
      return res.status(403).json({ message: "You are not authorized to manage bookings for this venue." });
    }

    app.status = status;
    app.vendorComment = vendorComment || "";
    if (status === "approved") {
      app.approvedAt = new Date();

      // Explanatory comment: When a vendor approves an application, I automatically create
      // a HireHistory record. This registers the transaction and feeds the rating/review values
      // back into the reputation calculation engine for that specific Hirer.
      const historyRepository = AppDataSource.getRepository(HireHistory);
      const shortId = Math.random().toString(36).substring(2, 7);
      const historyId = `hist-${shortId}`;
      const newHistory = historyRepository.create({
        id: historyId,
        hirerId: app.hirerId,
        vendorId: app.venue.vendorId,
        venueId: app.venueId,
        eventName: app.eventName,
        dateOfHire: app.eventDate,
        rating: rating !== undefined ? parseInt(String(rating), 10) : 5,
      });
      await historyRepository.save(newHistory);
    } else {
      app.approvedAt = undefined;
    }

    await appRepository.save(app);

    return res.status(200).json({
      message: `Booking application ${status} successfully.`,
      application: mapToFrontendApp(app),
    });
  } catch (error) {
    console.error("Update application status error:", error);
    return res.status(500).json({ message: "Server error occurred while updating booking status." });
  }
});

export default router;
