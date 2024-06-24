const { TelegramClient, Api, client } = require("telegram");
const { StringSession } = require("telegram/sessions");
const axios = require("axios");
const User = require("../models/user");
const input = require("input"); // npm i input
const { NewMessage } = require("telegram/events");
require("dotenv").config();

let otpCode = null; // Store OTP code in a module-level variable

let hostname = "http://localhost:3000/";

let OrderList = [];

let count = 0;

/**
 * The setOtpCode function in JavaScript sets the OTP code to the provided value.
 * @param code - The `code` parameter in the `setOtpCode` function is the value that will be assigned
 * to the `otpCode` variable.
 */
const setOtpCode = (code) => {
  otpCode = code;
};

/**
 * The function `getOtpCode` returns the OTP code.
 * @returns The function `getOtpCode` is returning the value of the variable `otpCode`.
 */
const getOtpCode = () => {
  return otpCode;
};

const clients = {}; // Store clients by email

/**
 * The function is a handler that processes messages related to trading orders, including parsing order
 * details, closing trades, and modifying trade parameters based on the message content.
 * @param event - The code you provided seems to be a handler function that processes different types
 * of trading orders based on the message received in the event object. It handles scenarios for
 * creating, modifying, and closing trades based on the content of the messages.
 * @returns The code snippet provided is an asynchronous function handler that processes different
 * types of trading orders and actions based on the input event. The function handles scenarios for
 * creating new trades, modifying existing trades, and closing trades.
 */
let handler = async (event, userDetails) => {
  let replyStatus = await event.message;
  let senderId = userDetails._id.toString();
  let user = userDetails;
  console.log(userDetails._id);
  if (replyStatus.replyTo === null) {
    let str = event.message.message;

    if (str.includes("MARKET ORDER") || str.includes("LIMIT ORDER")) {
      const tpMatches = str.match(/TP.*?(\d+\.\d+)/gi);

      const lines = str.split("\n").filter((line) => line.trim() !== "");

      function convertStringToObject(str, tp, sl, entryVal) {
        if (/tp|sl/i.test(str)) {
          if (/sl/i.test(str) && !/tp/i.test(str)) {
            let slPosition;
            lines.forEach((item) => {
              if (/SL.*?(\d+\.\d+)/gi.test(item)) {
                slPosition = lines.indexOf(item);
              }
            });
            let bracketPosition = lines[slPosition]
              .split(":")[1]
              .split("")
              .indexOf("(");
            const object = {
              orderType:
                lines[0].split(" ")[0][0].toLowerCase() +
                lines[0].split(" ")[0].substr(1).toLowerCase(),
              side: lines[1].includes("SELL") ? "sell" : "buy",
              symbol: lines[2].replace("$", ""),
              price: entryVal,
              takeProfitPrice: undefined,
              stopLossPrice: lines[sl]
                .split(":")[1]
                .split("")
                .splice(0, bracketPosition)
                .join("")
                .trim(),
              leverage: 0,
              amount: 1,
            };
            console.log(object);
            return main(object, senderId);
          } else if (/tp/i.test(str) && !/sl/i.test(str)) {
            if (tpMatches.length > 1) {
              // let slPosition;
              lines.forEach((item) => {
                if (/SL.*?(\d+\.\d+)/gi.test(item)) {
                  slPosition = lines.indexOf(item);
                }
              });
              // let bracketPosition = lines[slPosition]
              //   .split(":")[1]
              //   .split("")
              //   .indexOf("(");
              const object = {
                orderType:
                  lines[0].split(" ")[0][0].toLowerCase() +
                  lines[0].split(" ")[0].substr(1).toLowerCase(),
                side: lines[1].includes("SELL") ? "sell" : "buy",
                symbol: lines[2].replace("$", ""),

                price:
                  lines[0].split(" ")[0].toLowerCase() === "market"
                    ? undefined
                    : entryVal,

                takeProfitPrice: tp,

                stopLossPrice: null,
                leverage: 0,
                amount: 1,
              };

              OrderList.push(object);

              // console.log(OrderList);
              return main(OrderList, senderId);
            }

            let slPosition;
            lines.forEach((item) => {
              if (/SL.*?(\d+\.\d+)/gi.test(item)) {
                slPosition = lines.indexOf(item);
              }
            });
            // let bracketPosition = lines[slPosition]
            //   .split(":")[1]
            //   .split("")
            //   .indexOf("(");
            const object = {
              orderType:
                lines[0].split(" ")[0][0].toLowerCase() +
                lines[0].split(" ")[0].substr(1).toLowerCase(),
              side: lines[1].includes("SELL") ? "sell" : "buy",
              symbol: lines[2].replace("$", ""),

              price: entryVal,

              takeProfitPrice: tp,
              stopLossPrice: undefined,
              leverage: 0,
              amount: 1,
            };
            // console.log(object);
            return main(object, senderId);
          } else {
            // this is when sl and tp is given
            function processOrders(lines, tpMatches, entryVal, tp) {
              // Initialize the order list

              // Process only if there are multiple take profit matches
              if (tpMatches.length > 1) {
                let slPosition;

                // Find the stop-loss position
                lines.forEach((item, index) => {
                  if (/SL.*?(\d+\.\d+)/gi.test(item)) {
                    slPosition = index;
                  }
                });

                if (slPosition !== undefined) {
                  let bracketPosition = lines[slPosition]
                    .split(":")[1]
                    .split("")
                    .indexOf("(");

                  // Create the order object
                  const orderObject = {
                    orderType:
                      lines[0].split(" ")[0][0].toLowerCase() +
                      lines[0].split(" ")[0].substring(1).toLowerCase(),
                    side: lines[1].includes("SELL") ? "sell" : "buy",
                    symbol: lines[2].replace("$", ""),
                    price:
                      lines[0].split(" ")[0].toLowerCase() === "market"
                        ? undefined
                        : entryVal,
                    takeProfitPrice: tp,
                    stopLossPrice: lines[slPosition]
                      .split(":")[1]
                      .split("")
                      .splice(0, bracketPosition)
                      .join("")
                      .trim(),
                    leverage: 0,
                    amount: 1,
                  };

                  // Add the order object to the final list
                  OrderList.push(orderObject);
                }
                tpNum = tpMatches.length;
                console.log("here " + OrderList.length+" "+tpNum);
                if(tpNum==OrderList.length){
                  
                  main(OrderList,senderId);
                  OrderList=[]
                  tpMatches=[]
                }
                // Pass the list to the main function
                
              } else {
                let slPosition;
                lines.forEach((item) => {
                  if (/SL.*?(\d+\.\d+)/gi.test(item)) {
                    slPosition = lines.indexOf(item);
                  }
                });

                console.log(slPosition);

                let bracketPosition = lines[slPosition]
                  .split(":")[1]
                  .split("")
                  .indexOf("(");
                const object = {
                  orderType:
                    lines[0].split(" ")[0][0].toLowerCase() +
                    lines[0].split(" ")[0].substr(1).toLowerCase(),
                  side: lines[1].includes("SELL") ? "sell" : "buy",
                  symbol: lines[2].replace("$", ""),
                  //   entry: lines[3].split(":")[1].trim().slice(0, 6),
                  price: entryVal,
                  //   tp1: lines[4].split(":")[1].trim().slice(0, 6),
                  takeProfitPrice: tp,
                  stopLossPrice: lines[sl]
                    .split(":")[1]
                    .split("")
                    .splice(0, bracketPosition)
                    .join("")
                    .trim(),
                  leverage:0,
                  amount: 1,
                };
                console.log(object);
                return main(object,senderId);
              }
            }
            processOrders(lines, tpMatches, entryVal, tp);
          }
        } else {
          const object = {
            orderType:
              lines[0].split(" ")[0][0].toLowerCase() +
              lines[0].split(" ")[0].substr(1).toLowerCase(),
            side: lines[1].includes("SELL") ? "sell" : "buy",
            symbol: lines[2].replace("$", ""),

            price: entryVal,

            leverage: 0,
            amount: 1,
          };
          console.log(object);
          return main(object, senderId);
        }
      }

      if (str.includes("MARKET ORDER")) {
        let entryPosition = lines.indexOf(
          ...lines.filter((item) => item.includes("ENTRY"))
        );

        if (/tp|sl/i.test(str)) {
          if (/tp/i.test(str) && !/sl/i.test(str)) {
            if (tpMatches.length > 1) {
              let num = 4;

              let tp;
              for (let i = 1; i <= tpMatches.length; i++) {
                tp = lines[num++].split(":")[1].trim().slice(0, 6);
                sl = undefined;
                convertStringToObject(str, tp, sl);
              }
            } else {
              let tp = lines[
                lines.indexOf(...lines.filter((item) => /tp/i.test(item)))
              ]
                .split(":")[1]
                .trim()
                .slice(0, 6);
              sl = undefined;
              convertStringToObject(str, tp, sl);
            }
          } else if (!/tp/i.test(str) && /sl/i.test(str)) {
            let tp = undefined;
            let sl = lines.indexOf(...lines.filter((item) => /sl/i.test(item)));
            convertStringToObject(str, tp, sl);
          } else {
            if (tpMatches.length > 1) {
              let num = 4;

              let tp;
              for (let i = 1; i <= tpMatches.length; i++) {
                tp = lines[num++].split(":")[1].trim().slice(0, 6);
                sl = lines.indexOf(...lines.filter((item) => /sl/i.test(item)));
                convertStringToObject(str, tp, sl);
              }
            } else {
              let tp = lines[
                lines.indexOf(...lines.filter((item) => /tp/i.test(item)))
              ]
                .split(":")[1]
                .trim()
                .slice(0, 6);
              sl = lines.indexOf(...lines.filter((item) => /sl/i.test(item)));
              convertStringToObject(str, tp, sl);
            }
          }
        } else {
          convertStringToObject(str, undefined, undefined);
        }
      } else {
        let entryPosition = lines.indexOf(
          ...lines.filter((item) => item.includes("ENTRY"))
        );

        let amountOfEntry = lines[entryPosition]
          .split(":")[1]
          .split("-").length;

        if (/tp|sl/i.test(str)) {
          if (/tp/i.test(str) && !/sl/i.test(str)) {
            if (amountOfEntry > 1) {
              for (let i = 0; i < amountOfEntry; i++) {
                let entryVal = lines[entryPosition].split(":")[1].split("-")[i];

                if (tpMatches.length > 1) {
                  let num = lines[
                    lines.indexOf(...lines.filter((item) => /tp/i.test(item)))
                  ]
                    .split(":")[1]
                    .trim()
                    .slice(0, 6);

                  let tp;

                  for (let i = 1; i <= tpMatches.length; i++) {
                    tp = lines[num++].split(":")[1].trim().slice(0, 6);
                    sl = undefined;
                    convertStringToObject(str, tp, sl, entryVal);
                  }
                } else {
                  tp = lines[
                    lines.indexOf(...lines.filter((item) => /tp/i.test(item)))
                  ]
                    .split(":")[1]
                    .trim()
                    .slice(0, 6);
                  sl = undefined;
                  convertStringToObject(str, tp, sl, entryVal);
                }
              }
            } else {
              if (tpMatches.length > 1) {
                let num = 4;
                let entryVal = lines[3].split(":")[1].trim().slice(0, 6);
                let tp;
                for (let i = 1; i <= tpMatches.length; i++) {
                  tp = lines[num++].split(":")[1].trim().slice(0, 6);
                  sl = undefined;
                  convertStringToObject(str, tp, sl, entryVal);
                }
              } else {
                let entryVal = lines[3].split(":")[1].trim().slice(0, 6);

                let tp = lines[
                  lines.indexOf(...lines.filter((item) => /tp/i.test(item)))
                ]
                  .split(":")[1]
                  .trim()
                  .slice(0, 6);
                sl = undefined;
                convertStringToObject(str, tp, sl, entryVal);
              }
            }
          } else if (!/tp/i.test(str) && /sl/i.test(str)) {
            if (amountOfEntry > 1) {
              for (let i = 0; i < amountOfEntry; i++) {
                let entryVal = lines[entryPosition].split(":")[1].split("-")[i];

                if (tpMatches.length > 1) {
                  let num = lines[
                    lines.indexOf(...lines.filter((item) => /tp/i.test(item)))
                  ]
                    .split(":")[1]
                    .trim()
                    .slice(0, 6);

                  let tp;

                  for (let i = 1; i <= tpMatches.length; i++) {
                    tp = undefined;
                    sl = lines.indexOf(
                      ...lines.filter((item) => /sl/i.test(item))
                    );
                    convertStringToObject(str, tp, sl, entryVal);
                  }
                } else {
                  tp = undefined.split(":")[1].trim().slice(0, 6);
                  sl = lines.indexOf(
                    ...lines.filter((item) => /sl/i.test(item))
                  );
                  convertStringToObject(str, tp, sl, entryVal);
                }
              }
            } else {
              let entryVal = lines[3].split(":")[1].trim().slice(0, 6);

              let tp = undefined;

              sl = lines.indexOf(...lines.filter((item) => /sl/i.test(item)));
              convertStringToObject(str, tp, sl, entryVal);
            }
          } else {
            if (amountOfEntry > 1) {
              for (let i = 0; i < amountOfEntry; i++) {
                let entryVal = lines[entryPosition].split(":")[1].split("-")[i];

                if (tpMatches.length > 1) {
                  let num = lines[
                    lines.indexOf(...lines.filter((item) => /tp/i.test(item)))
                  ]
                    .split(":")[1]
                    .trim()
                    .slice(0, 6);

                  let tp;

                  for (let i = 1; i <= tpMatches.length; i++) {
                    tp = lines[num++].split(":")[1].trim().slice(0, 6);
                    sl = lines.indexOf(
                      ...lines.filter((item) => /sl/i.test(item))
                    );
                    convertStringToObject(str, tp, sl, entryVal);
                  }
                } else {
                  tp = lines[
                    lines.indexOf(...lines.filter((item) => /tp/i.test(item)))
                  ]
                    .split(":")[1]
                    .trim()
                    .slice(0, 6);
                  sl = lines.indexOf(
                    ...lines.filter((item) => /sl/i.test(item))
                  );
                  convertStringToObject(str, tp, sl, entryVal);
                }
              }
            } else {
              if (tpMatches.length > 1) {
                let num = 4;
                let entryVal = lines[3].split(":")[1].trim().slice(0, 6);
                let tp;
                for (let i = 1; i <= tpMatches.length; i++) {
                  tp = lines[num++].split(":")[1].trim().slice(0, 6);
                  sl = lines.indexOf(
                    ...lines.filter((item) => /sl/i.test(item))
                  );
                  convertStringToObject(str, tp, sl, entryVal);
                }
              } else {
                let entryVal = lines[3].split(":")[1].trim().slice(0, 6);

                let tp = lines[
                  lines.indexOf(...lines.filter((item) => /tp/i.test(item)))
                ]
                  .split(":")[1]
                  .trim()
                  .slice(0, 6);
                sl = lines.indexOf(...lines.filter((item) => /sl/i.test(item)));
                convertStringToObject(str, tp, sl, entryVal);
              }
            }
          }
        }
      }
    } else {
      return;
    }
  } else {
    let mess = await event.message.getReplyMessage();
    let str = mess.message;

    console.log(str);
    const tpMatches = str.match(/TP.*?(\d+\.\d+)/gi)
      ? str.match(/TP.*?(\d+\.\d+)/gi).length
      : 0;

    console.log(tpMatches);

    if (
      /close/i.test(replyStatus.message) ||
      /cancel/i.test(replyStatus.message)
    ) {
      if (tpMatches > 1) {
        let results = [];
        for (let index = 0; index < tpMatches; index++) {
          console.log("am here in loop");

          const lines = mess.message
            .split("\n")
            .filter((line) => line.trim() !== "");
          const object = {
            orderType:
              lines[0].split(" ")[0][0].toLowerCase() +
              lines[0].split(" ")[0].substr(1).toLowerCase(),
            side: lines[1].includes("SELL") ? "sell" : "buy",
            symbol: lines[2].replace("$", ""),

            price: undefined,

            takeProfitPrice: undefined,
            stopLossPrice: undefined,
            leverage: 0,
            amount: 1,
          };
          console.log(object);
          // change this to  closeMutipleTrade endpoint
          if (user.subscriptionDetails.isSubscribe) {
            //real
            axios
              .post(`${hostname}api/real/closetrade`, { senderId, object })
              .then((response) => {
                console.log("Message forwarded successfully");
              })
              .catch((error) => {
                console.error("Error forwarding message:", error);
              });
          } else {
            //demo
            axios
              .post(`${hostname}api/demo/closetrade`, { senderId, object })
              .then((response) => {
                console.log("Message forwarded successfully");
              })
              .catch((error) => {
                console.error("Error forwarding message:", error);
              });
          }
          // results.push(closeTrade(object));
        }
        return console.log("closed: " + results);
      } else {
        const lines = mess.message
          .split("\n")
          .filter((line) => line.trim() !== "");

        const object = {
          orderType:
            lines[0].split(" ")[0][0].toLowerCase() +
            lines[0].split(" ")[0].substr(1).toLowerCase(),
          side: lines[1].includes("SELL") ? "sell" : "buy",
          symbol: lines[2].replace("$", ""),

          price: undefined,

          takeProfitPrice: undefined,
          stopLossPrice: undefined,
          leverage: 0,
          amount: 1,
        };
        console.log(object);
        // change this to closeTrade endpoint
        // return closeTrade(object);
        if (user.subscriptionDetails.isSubscribe) {
          //real
          axios
            .post(`${hostname}api/real/closetrade`, { senderId, object })
            .then((response) => {
              console.log("Message forwarded successfully");
            })
            .catch((error) => {
              console.error("Error forwarding message:", error);
            });
        } else {
          //demo
          axios
            .post(`${hostname}api/demo/closetrade`, { senderId, object })
            .then((response) => {
              console.log("Message forwarded successfully");
            })
            .catch((error) => {
              console.error("Error forwarding message:", error);
            });
        }
      }
    } else if (/tp|sl/i.test(replyStatus.message)) {
      const lines = mess.message
        .split("\n")
        .filter((line) => line.trim() !== "");

      if (tpMatches > 1) {
        let results = [];
        for (let index = 0; index < tpMatches; index++) {
          console.log("am here in loop");

          const lines = mess.message
            .split("\n")
            .filter((line) => line.trim() !== "");
          const object = {
            orderType:
              lines[0].split(" ")[0][0].toLowerCase() +
              lines[0].split(" ")[0].substr(1).toLowerCase(),
            side: lines[1].includes("SELL") ? "sell" : "buy",
            symbol: lines[2].replace("$", ""),

            price: undefined,

            takeProfitPrice: undefined,
            stopLossPrice: undefined,
            leverage: 0,
            amount: 1,
          };
          console.log(object);
          // change this to  closeMutipleTrade endpoint
          // results.push(closeTrade(object));
          if (user.subscriptionDetails.isSubscribe) {
            //real
            axios
              .post(`${hostname}api/real/closetrade`, { senderId, object })
              .then((response) => {
                console.log("Message forwarded successfully");
              })
              .catch((error) => {
                console.error("Error forwarding message:", error);
              });
          } else {
            //demo
            axios
              .post(`${hostname}api/demo/closetrade`, { senderId, object })
              .then((response) => {
                console.log("Message forwarded successfully");
              })
              .catch((error) => {
                console.error("Error forwarding message:", error);
              });
          }
        }
        return console.log("closed: " + results);
      }

      if (
        /tp|sl/i.test(replyStatus.message) &&
        /tp/i.test(replyStatus.message) &&
        /sl/i.test(replyStatus.message)
      ) {
        let Replymess = replyStatus.message.trim().split("\n");
        let tp = Replymess.filter((item) => /tp/i.test(item))[0]
          .trim()
          .split(":")[1];
        let sl = Replymess.filter((item) => /sl/i.test(item))[0]
          .trim()
          .split(":")[1]
          .split("()")[0]
          .trim();
        const object = {
          orderType:
            lines[0].split(" ")[0][0].toLowerCase() +
            lines[0].split(" ")[0].substr(1).toLowerCase(),
          side: lines[1].includes("SELL") ? "sell" : "buy",
          symbol: lines[2].replace("$", ""),

          price: undefined,

          takeProfitPrice: tp,
          stopLossPrice: sl,
          leverage: 0,
          amount: 1,
        };
        // change this to modifyTrade endpoint
        // modifyTrade(object);
        if (user.subscriptionDetails.isSubscribe) {
          //real
          axios
            .post(`${hostname}api/real/modifytrade`, { senderId, object })
            .then((response) => {
              console.log("Message forwarded successfully");
            })
            .catch((error) => {
              console.error("Error forwarding message:", error);
            });
        } else {
          //demo
          axios
            .post(`${hostname}api/demo/modifytrade`, { senderId, object })
            .then((response) => {
              console.log("Message forwarded successfully");
            })
            .catch((error) => {
              console.error("Error forwarding message:", error);
            });
        }
      } else if (
        /sl/i.test(replyStatus.message) &&
        !/tp/i.test(replyStatus.message)
      ) {
        let Replymess = replyStatus.message.trim().split("\n");
        let tp = undefined;
        let sl = Replymess.filter((item) => /sl/i.test(item))[0]
          .trim()
          .split(":")[1]
          .split("()")[0]
          .trim();
        const object = {
          orderType:
            lines[0].split(" ")[0][0].toLowerCase() +
            lines[0].split(" ")[0].substr(1).toLowerCase(),
          side: lines[1].includes("SELL") ? "sell" : "buy",
          symbol: lines[2].replace("$", ""),

          price: undefined,

          takeProfitPrice: tp,
          stopLossPrice: sl,
          leverage: 0,
          amount: 1,
        };
        // change this to modifyTrade endpoint
        // modifyTrade(object);
        if (user.subscriptionDetails.isSubscribe) {
          //real
          axios
            .post(`${hostname}api/real/modifytrade`, { senderId, object })
            .then((response) => {
              console.log("Message forwarded successfully");
            })
            .catch((error) => {
              console.error("Error forwarding message:", error);
            });
        } else {
          //demo
          axios
            .post(`${hostname}api/demo/modifytrade`, { senderId, object })
            .then((response) => {
              console.log("Message forwarded successfully");
            })
            .catch((error) => {
              console.error("Error forwarding message:", error);
            });
        }
      } else {
        let Replymess = replyStatus.message.trim().split("\n");
        let tp = Replymess.filter((item) => /tp/i.test(item))[0]
          .trim()
          .split(":")[1];
        let sl = undefined;

        const object = {
          orderType:
            lines[0].split(" ")[0][0].toLowerCase() +
            lines[0].split(" ")[0].substr(1).toLowerCase(),
          side: lines[1].includes("SELL") ? "sell" : "buy",
          symbol: lines[2].replace("$", ""),

          price: undefined,

          takeProfitPrice: tp,
          stopLossPrice: sl,
          leverage: 0,
          amount: 1,
        };
        // change this to modifyTrade endpoint
        // modifyTrade(object);
        if (user.subscriptionDetails.isSubscribe) {
          //real
          axios
            .post(`${hostname}api/real/modifytrade`, { senderId, object })
            .then((response) => {
              console.log("Message forwarded successfully");
            })
            .catch((error) => {
              console.error("Error forwarding message:", error);
            });
        } else {
          //demo
          axios
            .post(`${hostname}api/demo/modifytrade`, { senderId, object })
            .then((response) => {
              console.log("Message forwarded successfully");
            })
            .catch((error) => {
              console.error("Error forwarding message:", error);
            });
        }
      }
    } else {
      return null;
    }
  }
};

/**
 * The function `startClient` initializes a Telegram client for a user, handles authentication, saves
 * the user session, and sets up event handlers for incoming messages.
 * @param user - The `startClient` function you provided seems to be setting up a Telegram client for a
 * user. The `user` parameter seems to contain information about the user, such as their Telegram
 * session, API ID, API hash, phone number, email, signal givers usernames, and signal groups.
 */
const startClient = async (user) => {
  const stringSession = new StringSession(user.telegramSession || "");
  const client = new TelegramClient(
    stringSession,
    user.telegramApiId * 1,
    user.telegramApiHash,
    {
      connectionRetries: 5,
    }
  );

  try {
    await client.start({
      phoneNumber: async () => user.phoneNumber,
      password: async () => "",
      phoneCode: async () =>
        await input.text("Please enter the code you received: "),
      onError: (err) => console.error("Client start error:", err),
    });

    user.session = client.session.save();
    await user.save();

    console.log(`Adding event handler for user ${user.email}`);

    let myChoice =
      user.signalGiversUsernames.lenght === 0
        ? null
        : user.signalGiversUsernames;
    let fromGroups = user.signalGroup.lenght === 0 ? null : user.signalGroups;
    console.log("Trimmed Signal Givers:", myChoice);

    client.addEventHandler(
      (event) => {
        handler(event, user);
      },
      new NewMessage({
        incoming: true,
        fromUsers: myChoice,
        chats: fromGroups,
      })
    );

    clients[user.email] = client;
  } catch (error) {
    console.error(`Failed to start client for ${user.email}:`, error);
  }
};

/**
 * The function `forwardMessage` checks for exemption symbols and then forwards messages based on
 * different conditions using various endpoints.
 * @returns The `forwardMessage` function does not explicitly return a value. It contains conditional
 * statements and function calls based on the `orderInfo` object properties and conditions. The
 * function performs different actions based on the conditions and logs messages to the console.
 */
// const forwardMessage = () => {
//   if (exemptionSymbols.includes(orderInfo.symbol)) {
//     return console.log("You can't trade this symbol");
//   } else {
//     if (!Array.isArray(orderInfo)) {
//       if (
//         orderInfo.takeProfitPrice == undefined &&
//         orderInfo.stopLossPrice == undefined
//       ) {
//         if (traling.on) {
//           console.log("traling sl");
//           // change this to trailSl endpoint
//           // trailSl(orderInfo);
//           axios
//             .post(`${hostname}`, { senderId, message })
//             .then((response) => {
//               console.log("Message forwarded successfully");
//             })
//             .catch((error) => {
//               console.error("Error forwarding message:", error);
//             });
//         } else {
//           console.log("no traling");
//           // change this to openTrade endpoint
//           // openTrade(orderInfo);
//           axios
//             .post(`${hostname}`, { senderId, message })
//             .then((response) => {
//               console.log("Message forwarded successfully");
//             })
//             .catch((error) => {
//               console.error("Error forwarding message:", error);
//             });
//         }
//       } else {
//         console.log("openTradeWithTpSl");
//         // change this to openTradeWithTpSl endpoint
//         // openTradeWithTpSl(orderInfo);
//         axios
//           .post(`${hostname}`, { senderId, message })
//           .then((response) => {
//             console.log("Message forwarded successfully");
//           })
//           .catch((error) => {
//             console.error("Error forwarding message:", error);
//           });
//       }
//     } else {
//       console.log("openMultipleOrdersWithTpSl");
//       // change this to openMultipleOrdersWithTpSl endpoint
//       // openMultipleOrdersWithTpSl(orderInfo);
//       axios
//         .post(`${hostname}`, { senderId, message })
//         .then((response) => {
//           console.log("Message forwarded successfully");
//         })
//         .catch((error) => {
//           console.error("Error forwarding message:", error);
//         });
//     }
//   }
// };

/**
 * The main function asynchronously retrieves a user by their ID using the User model.
 * @param orderInfo - orderInfo is a variable that likely contains information about an order, such as
 * the items purchased, quantity, price, shipping details, etc. It is passed as a parameter to the
 * `main` function in your code snippet.
 * @param id - The `id` parameter is typically a unique identifier that is used to look up a specific
 * user in a database. In this case, it is being used to find a user by their ID in the `User`
 * collection.
 */
async function main(orderInfo, senderId) {
  let user = await User.findById(senderId);
  if (user.exemptionSymbols.includes(orderInfo.symbol)) {
    return console.log("You can't trade this symbol");
  }
  if (!Array.isArray(orderInfo)) {
    if (
      orderInfo.takeProfitPrice == undefined &&
      orderInfo.stopLossPrice == undefined
    ) {
      //   let traling = { on: false, tralingPercentage: 5 };
      // orderInfo.traling = traling.tralingPercentage;
      if (user.stoplossTraling) {
        console.log("traling sl");
        // trailSl(orderInfo);
        if (user.subscriptionDetails.isSubscribe) {
          //real
          axios
            .post(`${hostname}api/real/trailsl`, { senderId, orderInfo })
            .then((response) => {
              console.log("Message forwarded successfully");
            })
            .catch((error) => {
              console.error("Error forwarding message:", error);
            });
        } else {
          //demo
          axios
            .post(`${hostname}api/demo/trailsl`, { senderId, orderInfo })
            .then((response) => {
              console.log("Message forwarded successfully");
            })
            .catch((error) => {
              console.error("Error forwarding message:", error);
            });
        }
      } else {
        console.log("no traling");
        // openTrade(orderInfo);
        if (user.subscriptionDetails.isSubscribe) {
          //real
          axios
            .post(`${hostname}api/real/opentrade`, { senderId, orderInfo })
            .then((response) => {
              console.log("Message forwarded successfully");
            })
            .catch((error) => {
              console.error("Error forwarding message:", error);
            });
        } else {
          //demo
          axios
            .post(`${hostname}api/demo/opentrade`, { senderId, orderInfo })
            .then((response) => {
              console.log("Message forwarded successfully");
            })
            .catch((error) => {
              console.error("Error forwarding message:", error);
            });
        }
      }
    } else {
      console.log("openTradeWithTpSl");
      // openTradeWithTpSl(orderInfo);
      if (user.subscriptionDetails.isSubscribe) {
        //real
        axios
          .post(`${hostname}api/real/opentradewithtpsl`, {
            senderId,
            orderInfo,
          })
          .then((response) => {
            console.log("Message forwarded successfully");
          })
          .catch((error) => {
            console.error("Error forwarding message:", error);
          });
      } else {
        //demo
        axios
          .post(`${hostname}api/demo/opentradewithtpsl`, {
            senderId,
            orderInfo,
          })
          .then((response) => {
            console.log("Message forwarded successfully");
          })
          .catch((error) => {
            console.error("Error forwarding message:", error);
          });
      }
    }
  } else {
    console.log("openMultipleOrdersWithTpSl");
    // openMultipleOrdersWithTpSl(orderInfo);
    // console.log(orderInfo)
    if (user.subscriptionDetails.isSubscribe) {
      //real
      axios
        .post(`${hostname}api/real/openmultipleorderswithtpsl`, {
          senderId,
          orderInfo,
        })
        .then((response) => {
          console.log("Message forwarded successfully");
        })
        .catch((error) => {
          console.error("Error forwarding message:", error);
        });
    } else {
      console.log(orderInfo);
      //demo
      axios
        .post(`${hostname}api/demo/openmultipleorderswithtpsl`, {
          senderId,
          orderInfo,
        })
        .then((response) => {
          console.log("Message forwarded successfully");
        })
        .catch((error) => {
          console.error("Error forwarding message:", error);
        });
    }
  }
}

/**
 * The function `startAllClients` finds all users with a non-null `telegramSession` and starts a client
 * for each user.
 */
const startAllClients = async () => {
  const users = await User.find({ telegramSession: { $ne: null } });
  for (const user of users) {
    await startClient(user);
  }
};

module.exports = {
  startClient,
  startAllClients,
  setOtpCode,
  getOtpCode,
};

/* 
commit message
here are the changes i just made
1) i removed the startClientRegister function because i want this server to only listen for incoming message from the users 
2) i change the database to the tradecopyier database which means the url was changed
3)some of the variables where changed to fit the tradecopyier database
4)i change the schema so that it would fit the tradecopier database 

the tradecpier database was the first database i created for this project the when, 
i wanted to test som functionalitys i created a new database that was calledn telegramtest

**/
