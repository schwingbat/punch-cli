module.exports = ({ config, Punch }) => ({
  signature: "migrate-from-sqlite",
  description: "copies SQLite DB contents into current storage system",
  hidden: true,
  async run() {
    if (Punch.storage.name === "sqlite") {
      console.log("Migration from SQLite to SQLite doesn't make any sense.");
      return;
    }

    const SQLiteStorage = require("../storage/services/sqlite.service.js");
    const SQLitePunch = require("../punch/punch")(config, SQLiteStorage);

    const punches = await SQLitePunch.all();

    for (const punch of punches) {
      await Punch.storage.save(punch);
    }

    console.log(`Migrated ${punches.length} punches`);
  }
});
