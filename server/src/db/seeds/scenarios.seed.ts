import { db } from "../config/db";

// TODO: Insert default scenario library
const seed = async () => {
  console.log("Seeding scenarios...");
  // Add seed data here
  await db.end();
};

seed();
