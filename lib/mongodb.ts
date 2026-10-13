import { MongoClient } from "mongodb";

declare global {
  // eslint-disable-next-line no-var
  var _orbiMongoClientPromise: Promise<MongoClient> | undefined;
}

let productionClientPromise: Promise<MongoClient> | undefined;

export function getMongoClientPromise() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("Falta la variable de entorno MONGODB_URI");
  }

  if (process.env.NODE_ENV === "development") {
    if (!global._orbiMongoClientPromise) {
      global._orbiMongoClientPromise = new MongoClient(uri).connect();
    }
    return global._orbiMongoClientPromise;
  }

  if (!productionClientPromise) {
    productionClientPromise = new MongoClient(uri).connect();
  }

  return productionClientPromise;
}
