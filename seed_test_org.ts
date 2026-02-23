
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seed() {
  try {
    const org = await prisma.organization.create({
      data: {
        name: "Test Agency",
        phoneNumber: "+15550000000",
        openingLine: "Hello, this is Test Agency.",
        qualificationQs: ["Are you buying or selling?", "What is your budget?"],
        email: "test@example.com",
        voiceConfig: {
            model: "gpt-4o-mini",
            useTools: true
        }
      }
    });
    console.log("Created test org:", org.id);
  } catch (e) {
    console.error("Error creating org (might already exist):", e);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
