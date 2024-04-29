import express from "express";
import bcrypt, { hash } from "bcrypt";
import mongoose from "mongoose";
import session from "express-session";
import MongoDBStoreLib from "connect-mongodb-session";
import bodyParser from "body-parser";
import { BookTable, users, cartItem, admins } from "./models.mjs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = process.env.PORT || 3000;
const app = express();

app.use(express.static(path.join(__dirname, "public")));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

const MongoDBStore = MongoDBStoreLib(session);
const store = new MongoDBStore({
  uri: "mongodb://localhost:27017/newdb",
  collection: "sessions",
});

store.on("error", (error) => {
  console.log("session store error: ", error);
});
//Using the session by using express
app.use(
  session({
    secret: "thisisasecrectkeywhichshouldnotbeusedbyanyone",
    resave: false,
    saveUninitialized: false,
    store,
  })
);

const adminSession = session({
  secret: "thisisanothersecretkeywhichshouldnotbeusedbyanyone",
  resave: false,
  saveUninitialized: false,
  store,
});

app.use("/adminDine", adminSession);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
mongoose
  .connect("mongodb://localhost:27017/newdb", {})
  .then(() => {
    console.log("Successfully connected to the database!!");
    app.listen(PORT, () => {
      console.log("Welcome to our website!! at : ", PORT);
    });
  })
  .catch((err) => {
    console.log(err);
  });

app.post("/", (req, res) => {
  try {
    const name = req.body.Name;
    const email = req.body.Email;
    const password_old = req.body.Password;
    console.log(req.body);

    bcrypt.genSalt(10, (err, salt) => {
      if (err) {
        console.log("Sorry for the inconvenience!!");
        return;
      }
      bcrypt.hash(password_old, salt, (err, hash) => {
        if (err) {
          console.log("Sorry for the inconveninece 2");
          // hashedPassword=hash
          return;
        } else {
          console.log(hash);
          const password = hash;
          const newUser = new users({
            name,
            email,
            password,
          });
          newUser.save();
          console.log("successful");
          // res.setHeader
          res.send(
            '<script>alert("Successfully registered!Now you can log in :)"); window.location.href = "./index.html";</script>'
          );
          // res.redirect('./home_page.html')
        }
      });
    });
  } catch (error) {}
});

app.post("/booking", (req, res) => {
  try {
    // console.log(req.body)
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const email = req.body.email;
    const tableNum = req.body.tableNum;
    const time = req.body.time;
    const tableType = req.body.tableType;
    const note = req.body.note;
    const guestNum = req.body.guestNumber;
    const date = req.body.date;

    console.log(req.body);
    const newTable = new BookTable({
      firstName,
      lastName,
      email,
      tableType,
      guestNum,
      time,
      date,
      tableNum,
      note,
    });
    newTable.save();
    res.send(
      '<script>alert("Table successfully booked!"); window.location.href = "/home_page";</script>'
    );
  } catch (error) {
    console.log(error);
    res.status(500).send("Unexpected error sorry for the inconvenience");
  }
});

app.post("/login", async (req, res) => {
  const email = req.body.Email;
  const password = req.body.Password;

  const user = await users.findOne({ email });
  // console.log(user)
  if (!user) {
    res.send(
      '<script>alert("Sorry the user is not found!!");window.location.href="/index.html"</script>'
    );
  } else {
    bcrypt.compare(password, user.password, (err, result) => {
      if (err) {
        res.send(
          '<script>alert("Sorry the password is wrong!!");window.location.href="/index.html"</script>'
        );
      }
      if (!result) {
        res.send(
          '<script>alert("The passowrd is wrong try again!!");window.location.href="/index.html"</script>'
        );
      } else {
        req.session.isLoggedIn = true;
        req.session.user = user;
        console.log(req.session.user);

        res.redirect("home_page");
      }
    });
  }
});

app.get("/home_page", (req, res) => {
  if (req.session.isLoggedIn && req.session.user) {
    const { user } = req.session;
    // console.log(user)
    return res.render("home_page", { user });
    // return res.render('login.ejs')
  } else {
    res.send(
      '<script>alert("Please first log in !!");window.location.href="/";</script>'
    );
  }
  // else{
  //     res.redirect('/index.html')
  // }
});

app.get("/booking.ejs", (req, res) => {
  if (req.session.isLoggedIn && req.session.user) {
    return res.render("booking");
  } else {
    res.send(
      '<script>alert("Please first log in !!");window.location.href="/";</script>'
    );
  }
});

app.get("/about.ejs", (req, res) => {
  return res.render("about");
});

app.post("/home_page", (req, res) => {
  const userName = req.session.user.name;
  console.log(userName);
  const items = req.body.items;
  for (let i = 0; i < items.length; i++) {
    const name = items[i]["name"];
    const quantity = Math.abs(items[i]["quantity"]);
    const price = items[i]["price"];

    const cartList = new cartItem({
      userName,
      name,
      quantity,
      price,
    });

    cartList.save();
  }
  res.send("hellot");
  // res.render('home_page',{message:"Your cart is saved"})
});

app.get("/adminDine", (req, res) => {
  res.render("adminDine");
});

app.get("/adminDashboard", async (req, res) => {
  if (req.session.adminLoggedIn && req.session.adminUser) {
    const allData = await users.find();
    const distinctUser = await cartItem.distinct("userName");
    const distinctItems = await cartItem.distinct("name");
    const lenDistinctItems = distinctItems.length;
    console.log(lenDistinctItems);
    const lenDistinct = distinctUser.length;
    const totalUsers = allData.length;
    console.log(allData.length);

    const allTables = await BookTable.find();
    let totalGuests = 0;
    for (let i = 0; i < allTables.length; i++) {
      totalGuests += allTables[i]["guestNum"];
    }
    console.log(totalGuests);
    res.render("admin_dashboard", {
      totalUsers,
      lenDistinct,
      lenDistinctItems,
      totalGuests,
    });
  } else {
    res.send(
      '<script>alert("Please login as an admine user to continue");window.location.href="/adminDine"</script>'
    );
  }
});

app.post("/adminDine", async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  try {
    const admin = await admins.findOne({ username: username });
    console.log(admin);
    if (admin) {
      req.session.adminLoggedIn = true;
      req.session.adminUser = username;

      res.redirect("adminDashboard");
    } else {
      res.send(
        '<script>alert("Sorry the user doesn\'t exist");window.location.href="/adminDine"</script>'
      );
    }
  } catch (err) {
    console.log("Sorry something unexpected occured!!", err);
  }
});

app.get("/order", async (req, res) => {
  if (req.session.adminLoggedIn && req.session.adminUser) {
    const totalData = await cartItem.find();
    res.render("order", { totalData });
  } else {
    res.send(
      '<script>alert("Please loging to continue");window.location.href="/adminDine"</script>'
    );
  }
});

app.get("/bookTable", async (req, res) => {
  if (req.session.adminLoggedIn && req.session.adminUser) {
    const orderData = await BookTable.find();
    res.render("bookTable", { orderData });
  } else {
    res.send(
      '<script>alert("Please loging to continue");window.location.href="/adminDine"</script>'
    );
  }
});

app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).send("Failed to logout!!");
    }
    res.send(
      '<script>alert("You have successfully logged out!!");window.location.href="/";</script>'
    );
  });
});

app.get("/admin_logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).send("Failed to logout!!");
    }
    console.log("you have successfuly logged out");
    res.send(
      '<script>alert("You have successfully logged ouit!!");window.location.href="/adminDine";</script>'
    );
  });
});
