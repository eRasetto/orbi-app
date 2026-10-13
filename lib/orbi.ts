import { getMongoClientPromise } from "@/lib/mongodb";

export const DB_NAME = "OrbiApp";

export async function getOrbiDb() {
  const client = await getMongoClientPromise();
  return client.db(DB_NAME);
}
