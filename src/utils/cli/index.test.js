const CLI = require(".");

const { command, run, __testRefs } = CLI({
  name: "test",
  version: "0.0.0"
});

const {
  commands,
  mapArgs,
  applyArgExtras,
  requiredArgsProvided
  // makeHelp,
  // makeGeneralHelp
} = __testRefs;

describe("CLI", () => {
  describe("internal", () => {
    /* ======================= *\
    ||       Args Mapping      ||
    \* ======================= */

    describe("mapArgs", () => {
      it('stores the list of raw arguments in the "raw" array', () => {
        const mapped = mapArgs(["one", "two", "three"], []);
        expect(mapped.raw).toEqual(["one", "two", "three"]);
      });

      it("maps args to proper names", () => {
        const args = ["command", "fish", "potato", "5"];
        const argMap = [
          {
            name: "one",
            required: true
          },
          {
            name: "two",
            required: true
          },
          {
            name: "number",
            required: true
          },
          {
            name: "shark",
            required: false
          }
        ];

        const mapped = mapArgs(args.slice(1), argMap);
        expect(mapped.one).toBe("fish");
        expect(mapped.two).toBe("potato");
        expect(mapped.number).toBe("5");
        expect(mapped.shark).toBe(undefined);
      });

      it("maps remaining items to variadic arguments as an array", () => {
        const args = ["one", "two", "three", "four"];
        const argMap = [
          {
            name: "one",
            required: true,
            variadic: false
          },
          {
            name: "two",
            required: false,
            variadic: true
          }
        ];

        const mapped = mapArgs(args, argMap);
        expect(mapped.one).toBe("one");
        expect(mapped.two).toEqual(["two", "three", "four"]);
      });

      it("uses a default value if provided and argument is not given", () => {
        const args = ["one", "two"];
        const argMap = [
          {
            name: "one",
            required: true,
            variadic: false
          },
          {
            name: "two",
            required: true,
            variadic: false
          },
          {
            name: "three",
            required: false,
            variadic: false,
            default: "three"
          }
        ];

        const mapped = mapArgs(args, argMap);
        expect(mapped.one).toBe("one");
        expect(mapped.two).toBe("two");
        expect(mapped.three).toBe("three");
      });

      it("calls the parse function on an argument if given", () => {
        const args = ["one", "two"];
        const argMap = [
          {
            name: "one",
            required: true,
            variadic: false
          },
          {
            name: "two",
            required: true,
            variadic: false,
            parse: function(value) {
              return value.toUpperCase();
            }
          }
        ];

        const mapped = mapArgs(args, argMap);
        expect(mapped.one).toBe("one");
        expect(mapped.two).toBe("TWO");
      });

      it("stores error object as arg._error if parse function throws", () => {
        const args = ["one"];
        const argMap = [
          {
            name: "test",
            required: true,
            variadic: false,
            parse: function() {
              throw new Error("test");
            }
          }
        ];

        mapArgs(args, argMap);
        expect(argMap[0]._error).toBeTruthy();
        expect(argMap[0]._error.message).toBe("test");
      });
    });

    describe("applyArgExtras", () => {
      let argMap;

      beforeEach(() => {
        argMap = [
          {
            name: "one",
            required: true,
            variadic: false
          },
          {
            name: "two",
            required: false,
            variadic: false
          }
        ];
      });

      it("applies extra properties to an argMap", () => {
        let parseFunc = () => null;

        expect(
          applyArgExtras(argMap, [
            {
              name: "one",
              description: "test description",
              default: 1
            },
            {
              name: "two",
              parse: parseFunc
            }
          ])
        ).toEqual([
          {
            name: "one",
            required: true,
            variadic: false,
            description: "test description",
            default: 1
          },
          {
            name: "two",
            required: false,
            variadic: false,
            parse: parseFunc
          }
        ]);
      });

      it("returns the argMap if no extras are passed", () => {
        expect(applyArgExtras(argMap)).toBe(argMap);
      });
    });

    describe("requiredArgsProvided", () => {
      it("returns true if all required args are provided and false if any are not", () => {
        const argMap = [
          {
            name: "one",
            required: true,
            variadic: false
          },
          {
            name: "two",
            required: true,
            variadic: false
          }
        ];

        expect(requiredArgsProvided({ one: "one", two: "two" }, argMap)).toBe(
          true
        );
        expect(requiredArgsProvided({ one: "one" }, argMap)).toBe(false);
      });
    });
  });

  describe("API", () => {
    let testBool = false;
    let testArgs = null;
    let cmd;

    beforeEach(() => {
      testBool = false;
      testArgs = null;

      cmd = {
        signature: "test [optional]",
        args: [
          {
            name: "optional",
            description: "an optional arg"
          }
        ],
        run(args) {
          testArgs = args;
          testBool = true;
        }
      };
    });

    describe("command", () => {
      it("registers a command object", () => {
        command(cmd);

        expect(commands["test"]).toBeTruthy();
        expect(commands["test"].signature).toBe("test [optional]");
      });
    });

    describe("run", () => {
      it("runs a command by name", () => {
        command(cmd);
        run(["test", "testing"]);

        expect(testBool).toBe(true);
      });
    });

    testArgs; // TODO: Implement test

    describe("invoke", () => {
      it("runs another command", () => {
        let testBool2 = false;
        const cmd2 = {
          signature: "test2",
          run(args, { invoke }) {
            testBool2 = true;
            invoke("test 5");
          }
        };
        command(cmd);
        command(cmd2);

        run(["test2"]);
        expect(testBool2).toBe(true);
        expect(testBool).toBe(true);
      });
    });
  });
});
