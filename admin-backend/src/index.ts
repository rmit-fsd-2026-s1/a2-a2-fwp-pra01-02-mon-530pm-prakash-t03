/**
 * GRAPHQL ADMIN BACKEND SERVICE - INDEX.TS
 * 
 * Purpose: Source code for GraphQL Admin Backend Service.
 * 
 * Command lines to execute/build/test this project:
 * - Start development server (ts-node-dev): npm run dev
 * - Compile TypeScript: npm run build
 * - Start production node server: npm start
 * - Run integration tests: npm test
 */

import "reflect-metadata";
import express from "express";
import cors from "cors";
import * as dotenv from "dotenv";
import * as path from "path";
import { AppDataSource } from "./data-source";
import { graphqlHTTP } from "express-graphql";
import { schema, rootValue } from "./graphql/schema";

dotenv.config({ path: path.join(__dirname, "../.env") });

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// GraphQL endpoint configuration
app.use(
  "/graphql",
  graphqlHTTP({
    schema: schema,
    rootValue: rootValue,
    graphiql: true,
  })
);

app.get("/api/health", (_req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date(),
    message: "Venue Vendors Admin Backend is running on port " + PORT,
  });
});

export const startServer = async () => {
  try {
    await AppDataSource.initialize();
    console.log("MySQL DB connection initialized for Admin Panel.");
    
    app.listen(PORT, () => {
      console.log(`Admin GraphQL Backend running on port ${PORT}.`);
    });
  } catch (error) {
    console.error("Initialization error on Admin backend startup:", error);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== "test") {
  startServer();
}

export { app };
