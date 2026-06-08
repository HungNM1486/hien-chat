import "dotenv/config";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "./index.js";
import { conversationMembers, conversations, invites, messages, users } from "./schema.js";

async function seed() {
  const adminEmail = "admin@test.com";
  const memberEmail = "member@test.com";
  const password = "password123";

  const existingAdmin = await db
    .select()
    .from(users)
    .where(eq(users.email, adminEmail))
    .limit(1);

  let adminId: string;

  if (existingAdmin.length === 0) {
    const passwordHash = await bcrypt.hash(password, 12);
    const [admin] = await db
      .insert(users)
      .values({
        email: adminEmail,
        passwordHash,
        displayName: "Admin",
        settings: { theme: "midnight", locale: "vi" },
      })
      .returning();
    adminId = admin.id;
    console.log(`Created admin: ${adminEmail}`);
  } else {
    adminId = existingAdmin[0].id;
    console.log(`Admin already exists: ${adminEmail}`);
  }

  const existingMember = await db
    .select()
    .from(users)
    .where(eq(users.email, memberEmail))
    .limit(1);

  let memberId: string;

  if (existingMember.length === 0) {
    const passwordHash = await bcrypt.hash(password, 12);
    const [member] = await db.insert(users).values({
      email: memberEmail,
      passwordHash,
      displayName: "Thành viên",
      settings: { theme: "warm-home", locale: "vi" },
    }).returning();
    memberId = member.id;
    console.log(`Created member: ${memberEmail}`);
  } else {
    memberId = existingMember[0].id;
    console.log(`Member already exists: ${memberEmail}`);
  }

  const existingInvite = await db
    .select()
    .from(invites)
    .where(eq(invites.code, "WELCOME2024"))
    .limit(1);

  if (existingInvite.length === 0) {
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    await db.insert(invites).values({
      code: "WELCOME2024",
      createdBy: adminId,
      expiresAt,
      maxUses: 100,
    });
    console.log("Created invite code: WELCOME2024");
  }

  const existingConv = await db
    .select()
    .from(conversations)
    .where(eq(conversations.createdBy, adminId))
    .limit(1);

  if (existingConv.length === 0) {
    const [conv] = await db
      .insert(conversations)
      .values({
        type: "direct",
        createdBy: adminId,
        settings: { encryptionMode: "standard" },
      })
      .returning();

    await db.insert(conversationMembers).values([
      { conversationId: conv.id, userId: adminId, role: "admin" },
      { conversationId: conv.id, userId: memberId, role: "member" },
    ]);

    await db.insert(messages).values([
      {
        conversationId: conv.id,
        senderId: adminId,
        content: "Chào em! Hiên nhà đã sẵn sàng 🎉",
      },
      {
        conversationId: conv.id,
        senderId: memberId,
        content: "Chào anh! Em test chat realtime nhé",
      },
    ]);

    console.log("Created sample conversation with messages");
  }

  console.log("\nSeed complete.");
  console.log("Test accounts (password: password123):");
  console.log("  admin@test.com");
  console.log("  member@test.com");
  console.log("Invite code: WELCOME2024");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
