"use server";

import Airtable from "airtable";

export async function subscribeToUpdates(email: string) {
  try {
    // Configure Airtable
    const base = new Airtable({
      apiKey: process.env.AIRTABLE_API_KEY,
    }).base(process.env.AIRTABLE_BASE_ID!);

    // Save email to Airtable
    await base(process.env.AIRTABLE_TABLE_NAME!).create([
      {
        fields: {
          Email: email,
        },
      },
    ]);

    console.log(`Subscribed email: ${email}`);

    return {
      success: true,
      message: "Successfully subscribed to updates!",
    };
  } catch (error) {
    console.error("Error subscribing:", error);

    return {
      success: false,
      message: "Failed to subscribe. Please try again later.",
    };
  }
}
