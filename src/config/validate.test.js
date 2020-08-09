const validate = require("./validate");

describe("config validate", () => {
  it("validates a basic config", () => {
    const { valid, errors } = validate(baseConfig);

    expect(valid).toBe(true);
    expect(errors).toStrictEqual([]);
  });

  it("validates a full example config", () => {
    const { valid, errors } = validate(fullConfig);

    expect(valid).toBe(false);
    expect(errors).toStrictEqual([
      {
        type: "warning",
        key: "clients.EvilCorp",
        message: "[clients.EvilCorp] 'f' is not a valid key.",
      },
      {
        type: "error",
        key: "sync.services[0]",
        message:
          "[sync.services[0]] 'bucket' must be a string but is a number.",
      },
      {
        type: "warning",
        key: "sync.services[1]",
        message:
          "[sync.services[1]] 'bucket' is not a valid key when 'type' is 'punch-remote'.",
      },
      {
        type: "error",
        key: "projects.birb",
        message:
          "[projects.birb] 'client' refers to a client that is not in the 'clients' section: 'EvilCorporation'.",
      },
      {
        type: "error",
        key: "projects.birb",
        message: "[projects.birb] 'color' must be a string but is a number.",
      },
      {
        type: "error",
        key: "projects.junk",
        message: "[projects.junk] 'name' must be a string but is an object.",
      },
      {
        type: "error",
        key: "projects.junk",
        message:
          "[projects.junk] 'color' must be a valid color (black, red, green, yellow, blue, magenta, cyan, white or #hex value) but is 'horripilatingTurquoise'.",
      },
      {
        type: "error",
        key: "projects.junk",
        message:
          "[projects.junk] 'description' must be a string but is a number.",
      },
      {
        type: "warning",
        key: "projects.junk",
        message:
          "[projects.junk] 'hourlyRate' is set but the project has no client.",
      },
      {
        type: "warning",
        key: "projects.wordattack.client",
        message: "[projects.wordattack.client] 'shark' is not a valid key.",
      },
      {
        type: "error",
        key: "projects.wordattack",
        message:
          "[projects.wordattack] 'invoicePeriod' must be an object but is a string.",
      },
      {
        type: "error",
        key: "projects.punch",
        message:
          "[projects.punch] 'businessHours' must have a length of 2 but has a length of 3.",
      },
      {
        type: "error",
        key: "projects.punch",
        message:
          "[projects.punch] 'businessDays[4]' must be one of (0, 1, 2, 3, 4, 5, 6) or (mon, tue, wed, thu, fri, sat, sun, monday, tuesday, wednesday, thursday, friday, saturday, sunday) but is 'zoob'.",
      },
      {
        type: "warning",
        key: "projects.punch.invoicePeriod",
        message:
          "[projects.punch.invoicePeriod] 'zDoot' is not a valid key when schedule is 'monthly'.",
      },
    ]);
  });
});

/**
 * Test Data
 */

const baseConfig = {
  user: {
    name: "Your Name",
    company: "Alpaca Factory, LLC",
    address: "999 Boulevard Ct.\nCitytown, NJ 54637",
  },
  projects: {},
  clients: {},
  sync: {
    autoSync: false,
    services: [],
  },
  invoice: {},
  display: {},
  storageType: "ledger",
};

const fullConfig = {
  user: {
    name: "Your Name",
    company: "Alpaca Factory, LLC",
    address: "999 Boulevard Ct.\nCitytown, NJ 54637",
  },
  projects: {
    birb: {
      name: "Birb",
      hourlyRate: 30.0,
      client: "EvilCorporation",
      color: 1,
      invoicePeriod: {
        schedule: "monthly",
        endDate: "last",
      },
    },
    junk: {
      name: {},
      color: "horripilatingTurquoise",
      description: 5,
      hourlyRate: 30.0,
    },
    wordattack: {
      name: "Word Attack",
      description: "Words, yo",
      client: {
        shark: "nado",
      },
      invoicePeriod: "fek",
    },
    punch: {
      name: "Punch",
      description: "Top secret project for world domination",
      hourlyRate: 999.0,
      client: "EvilCorp",
      color: "blue",
      businessHours: [10, 18, 2],
      businessDays: ["mon", "tue", "wed", "thu", "zoob"],
      invoicePeriod: {
        schedule: "monthly",
        endDate: 24,
        zDoot: 9,
      },
      targetHours: 160,
    },
  },
  clients: {
    EvilCorp: {
      contact: "",
      company: "EvilCorp Unlimited Inc.",
      address: "1234 S Bork St.\nSeattle, WA 22222",
      f: 1,
    },
  },
  sync: {
    autoSync: false,
    services: [
      {
        enabled: false,
        type: "S3",
        name: "S3",
        bucket: Infinity,
        region: "us-east",
        credentials: "./credentials/s3.json",
      },
      {
        enabled: false,
        type: "punch-remote",
        name: "punch remote (localhost)",
        url: "http://localhost:5150",
        bucket: "cloudpunch",
        credentials: "./credentials/punch-remote.json",
      },
    ],
  },
  invoice: {
    dateFormat: "MM/dd/yyyy",
    timeFormat: "h:mm A",
  },
  display: {
    commentRelativeTimestamps: {
      enabled: true,
      fromPreviousComment: true,
    },
    dateFormat: "dddd, MMMM Do YYYY",
    showCommentIndices: false,
    showDayGraphics: true,
    showPunchIDs: false,
    textColors: true,
    timeFormat: "h:mm A",
    timeZone: "America/Los_Angeles",
    wordWrapWidth: 65,
  },
  storageType: "ledger",
};
