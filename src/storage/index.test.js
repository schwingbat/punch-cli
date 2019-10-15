const Storage = require("./index");
const mockStorage = require("./services/mock.service");

describe("Storage", () => {
  it("loads a storage service based on config.storageType", () => {
    const config = { storageType: "mock" };
    const storage = Storage(config);

    expect(storage).toBe(mockStorage);
  });

  it("throws an error if a nonexistent storage service is requested", () => {
    const config = { storageType: "nothing" };
    expect(() => {
      Storage(config);
    }).toThrow();
  });
});
